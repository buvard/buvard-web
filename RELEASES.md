# Releases — Buvard

Comment pousser une nouvelle version de l'app à tes users sans repasser par App Store / Play Store.

> Pour les détails techniques (architecture, sécurité, rollback), voir [LIVE_UPDATES.md](LIVE_UPDATES.md).
> Pour ce qui force une vraie redistribution stores, voir [NATIVE_PLUGINS.md](NATIVE_PLUGINS.md).

---

## Setup (1 fois)

### 1. Être admin

Sur ton compte Buvard, en DB MongoDB :

```js
db.users.updateOne(
  { username: "lucas" },
  { $set: { role: "admin" } }
)
```

### 2. Renseigner `.env.release`

```bash
cp .env.release.example .env.release
```

Édite le fichier :

```ini
API_URL=https://api.buvard.app
ADMIN_JWT=eyJ...
```

Pour récupérer le JWT : ouvre l'app loggée dans Chrome, console :

```js
await window.Clerk.session.getToken()
```

Copie le token (durée de vie ~1h, à régénérer si expiré).

> `.env.release` est dans `.gitignore`. Ne le commit jamais.

---

## Pousser une release

### Cas standard — push sur iOS + Android

```bash
npm run release:all -- --version 1.2.4 --notes "Fix login"
```

### Push une seule plateforme

```bash
npm run release:ios     -- --version 1.2.4 --notes "Fix iOS keyboard"
npm run release:android -- --version 1.2.4
```

### Préparer sans activer

Upload le bundle mais ne le sert pas encore aux users :

```bash
npm run release:ios -- --version 1.2.4 --inactive
```

Tu actives plus tard via `PATCH /admin/releases/:id { active: true }`.

---

## Choisir le numéro de version

Format **SemVer** strict : `X.Y.Z`.

| Cas | Quoi faire |
|---|---|
| Fix de bug, ajustement UI, nouvelle fonctionnalité **pur TS** | Incrémente `patch` (1.2.3 → 1.2.4) — push OTA |
| Nouvelle feature légère sans nouveau plugin natif | Incrémente `minor` (1.2.x → 1.3.0) — push OTA |
| Refonte majeure, breaking changes, **nouveau plugin Capacitor** | Incrémente `major` (1.x.x → 2.0.0) — **redistribution stores obligatoire** |

> ⚠️ La version embarquée dans l'app native vient du build initial. Si tu push un bundle OTA en 1.2.4 alors que l'app native est en 1.0.0, ça marche. Mais si tu push en 2.0.0 et que l'app a besoin d'un nouveau plugin natif, ça crash. **Reste sur des changements TS only en OTA.**

---

## Avant chaque release

Checklist mentale :

- [ ] J'ai testé en dev (`npm run dev`) → ça marche
- [ ] J'ai testé le build prod localement (`npm run build && npm run preview`) → ça marche
- [ ] Je n'ai **pas** ajouté/modifié un plugin Capacitor (sinon stop, redistribution stores)
- [ ] Je n'ai **pas** touché à `capacitor.config.ts` (sinon redistribution stores)
- [ ] Je n'ai **pas** ajouté une permission iOS/Android (sinon redistribution stores)
- [ ] Mon `.env.release` est à jour (JWT pas expiré)

Si tout est OK : lance la commande de release.

---

## Vérifier qu'une release est bien là

### Lister les releases

```bash
curl $API_URL/api/v1/admin/releases \
  -H "Authorization: Bearer $ADMIN_JWT"
```

Ou filtre par plateforme :

```bash
curl "$API_URL/api/v1/admin/releases?platform=ios" \
  -H "Authorization: Bearer $ADMIN_JWT"
```

### Simuler ce que voit un client

```bash
curl "$API_URL/api/v1/app/latest-update?platform=ios&currentVersion=1.0.0"
```

- `200` + JSON → une release plus récente est dispo
- `204` → l'app est à jour (ou aucune release active)

---

## Rollback (push raté)

### Désactiver la release en cours

```bash
curl -X PATCH $API_URL/api/v1/admin/releases/<id> \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

Effet : les nouveaux check renvoient 204. **Mais** les users déjà sur la version cassée y restent.

### Vraie solution : push un fix immédiatement

```bash
npm run release:all -- --version 1.2.5 --notes "Hotfix 1.2.4"
```

Le nouveau bundle remplace l'ancien chez tout le monde au prochain démarrage.

### Supprimer définitivement une release

```bash
curl -X DELETE $API_URL/api/v1/admin/releases/<id> \
  -H "Authorization: Bearer $ADMIN_JWT"
```

→ Supprime de la DB **et** le zip sur R2.

---

## Erreurs courantes

| Message | Cause | Solution |
|---|---|---|
| `ADMIN_JWT manquant` | Pas de `.env.release` ou champ vide | Recopie depuis `.env.release.example` et remplis |
| `HTTP 401` | JWT expiré ou pas admin | Re-récupère le token, ou vérifie `role: "admin"` en DB |
| `HTTP 409` | `(platform, version)` déjà existe | Incrémente la version |
| `HTTP 400 Fichier trop volumineux` | Bundle > 50 MB | Vérifie ton `dist/`, retire les sourcemaps, etc. |
| `Le dossier dist/ n'existe pas` | Pas de build préalable | Le script fait `npm run build` automatiquement — si ça plante, regarde la sortie du build |
| `Erreur: --version doit suivre le format SemVer` | Mauvais format | Doit être `X.Y.Z`, par ex. `1.2.4` (pas `v1.2.4` ni `1.2.4-beta`) |

---

## Cycle de vie côté user

1. L'user ouvre l'app
2. L'app demande `/api/v1/app/latest-update` en arrière-plan
3. Si maj dispo → download silencieux + vérif SHA-256
4. Le bundle est marqué pour le **prochain démarrage**
5. L'user ferme l'app et la rouvre → nouvelle version chargée

L'utilisateur ne voit jamais le téléchargement. Pas de popup, pas de reload pendant qu'il utilise l'app.

---

## Commandes mémo

```bash
# Pousser sur les 2 plateformes
npm run release:all -- --version X.Y.Z --notes "..."

# Pousser sur iOS seulement
npm run release:ios -- --version X.Y.Z

# Pousser sur Android seulement
npm run release:android -- --version X.Y.Z

# Préparer sans activer
npm run release:ios -- --version X.Y.Z --inactive

# Aide
node scripts/release.mjs --help
```
