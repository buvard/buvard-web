# Live updates (OTA) — Buvard

App auto-update sans repasser par App Store / Play Store.

**Couvre uniquement** le code web (HTML/JS/CSS, le contenu de `dist/`).
Si tu changes un plugin Capacitor natif, une permission ou `capacitor.config.ts`, il faut **toujours** redistribuer via les stores.

## Stack

- Plugin natif : [`@capgo/capacitor-updater`](https://github.com/Cap-go/capacitor-updater) (open-source, gratuit)
- Hébergement bundles : R2 Cloudflare (bucket `buvard-media`, sous `bundles/{platform}/{version}.zip`)
- Backend : endpoints `/api/v1/app/latest-update` (public) et `/api/v1/admin/releases/*` (admin)

## Côté front (déjà en place)

| Fichier | Rôle |
|---|---|
| [src/lib/live-update.ts](src/lib/live-update.ts) | Logique check + download au boot |
| [src/main.tsx](src/main.tsx) | Appelle `notifyAppReady()` + `checkForUpdate()` |
| [scripts/release.mjs](scripts/release.mjs) | Script Node qui build, zip et upload au backend |
| `.env.release.example` | Template des credentials (à copier en `.env.release`) |

## Endpoints API

### Public — consommé par l'app au démarrage

```
GET /api/v1/app/latest-update?platform=ios&currentVersion=1.2.3
  -> 200 { version, url, checksum, notes? }   si mise à jour dispo
  -> 204                                       si déjà à jour ou aucune release active
  -> 400                                       si query invalide
```

### Admin — consommé par le script de release

```
POST   /api/v1/admin/releases    (multipart/form-data)
GET    /api/v1/admin/releases?platform=ios|android
PATCH  /api/v1/admin/releases/:id    { active?, notes? }
DELETE /api/v1/admin/releases/:id
```

Auth : `Authorization: Bearer <JWT>` avec un user `role=admin`.

## Procédure de release

### 0. Setup initial (1 fois)

1. Sur ton compte Buvard, passer en admin :

   ```js
   // Dans mongosh ou MongoDB Compass
   db.users.updateOne(
     { username: "lucas" },
     { $set: { role: "admin" } }
   )
   ```

2. Copier `.env.release.example` vers `.env.release` et remplir :

   ```
   API_URL=https://api.buvard.app
   ADMIN_JWT=<JWT Clerk d'un user admin>
   ```

   Pour récupérer le JWT en dev local : ouvre la console navigateur sur l'app loggée, tape `await window.Clerk.session.getToken()`.

### 1. Push une release iOS

```bash
npm run release:ios -- --version 1.2.4 --notes "Fix login"
```

### 2. Push une release Android

```bash
npm run release:android -- --version 1.2.4
```

### 3. Push les deux d'un coup

```bash
npm run release:all -- --version 1.2.4
```

### 4. Push une release "inactive" (préparation, pas encore live)

```bash
npm run release:ios -- --version 1.2.4 --inactive
```

Puis tu actives quand tu veux via un `PATCH /admin/releases/:id { active: true }`.

## Comportement backend à connaître

- **Une seule release active par plateforme** : créer/activer une nouvelle release désactive automatiquement les autres
- **`(platform, version)` doit être unique** : push deux fois la même version → 409, et le zip uploadé est nettoyé automatiquement
- **Bundle > 50 MB** → 400 rejeté (limite multer côté backend)
- **Bundle non-zip** → 400 rejeté (vérification MIME `application/zip`)
- **DELETE** d'une release supprime aussi le zip sur R2

## Convention de versioning

Format SemVer `X.Y.Z` strict.

- **`patch` (1.2.3 → 1.2.4)** : push OTA OK, juste du code TS/UI
- **`minor` (1.2 → 1.3)** : push OTA OK si pas de nouveau plugin natif
- **`major` (1 → 2)** : redistribution stores obligatoire

Le `version` envoyé doit matcher la version embarquée dans le bundle pour que Capgo le considère comme une vraie maj. La version embarquée vient de `capacitor.config.ts` lors du build natif initial — pour les bundles OTA ultérieurs, c'est ce que tu passes au script.

## Cycle de vie côté app

1. App s'ouvre, `main.tsx` exécute `notifyAppReady()` immédiatement
2. `checkForUpdate()` part en arrière-plan, appelle `/api/v1/app/latest-update`
3. Si réponse 200 : `CapacitorUpdater.download()` télécharge le zip et vérifie le SHA-256
4. `CapacitorUpdater.next()` marque le bundle pour application au **prochain** démarrage
5. L'utilisateur ferme et rouvre l'app → la nouvelle version est chargée

Le `notifyAppReady()` est crucial : Capgo a un système de **rollback automatique**. Si l'app crashe avant d'appeler `notifyAppReady()`, à la prochaine ouverture Capgo rebascule sur la version embarquée par défaut. Donc un bundle qui plante n'enferme pas l'utilisateur.

## Rollback manuel

Si tu push un bundle 1.2.4 qui se comporte mal :

**Option A** — désactiver la release problématique :

```bash
curl -X PATCH $API_URL/api/v1/admin/releases/<id> \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

→ Les nouveaux check verront `204`, **mais** les utilisateurs déjà à jour restent sur 1.2.4. Il faut combiner avec l'option B.

**Option B** — push immédiatement une 1.2.5 qui revert le bug, elle remplace 1.2.4 chez tout le monde.

## Sécurité

- Bundles **chiffrés en transit** (HTTPS)
- Bundles **vérifiés au checksum** côté plugin avant application (SHA-256 calculé côté backend depuis le buffer, pas confiance au client)
- Endpoint `/admin/releases/*` derrière `requireUser + requireActive + requireRole('admin')`
- Le JWT admin ne doit jamais commit (`.env.release` est dans `.gitignore`)
- Si un attaquant compromet ton ADMIN_JWT, il peut pousser un bundle arbitraire à tous tes users → traite-le comme un secret de prod, rotate régulièrement

## Limites Apple

Apple autorise les OTA tant que :

- Le bundle reste **du code web interprété** (JS/HTML/CSS)
- Tu ne contournes pas leur review pour des **changements majeurs de fonctionnalité**

En pratique, pour des fixes et améliorations incrémentales, aucun souci. Section 3.3.2 des [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/#3.3.2).
