# Release Android — guide pas a pas

Pipeline complete :

```
1. Bump version    → npm run version:patch (ou minor/major)
2. Push tag        → git push origin <branch> --follow-tags
3. Github Action   → build APK signe + cree Release
4. Web /download   → fetch Github API, propose la latest
```

---

## Setup initial (a faire UNE FOIS)

### 1. Generer le keystore release

Sur ton poste de dev, avec le JDK installe :

```bash
keytool -genkey -v \
  -keystore buvard-release.keystore \
  -alias buvard \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Tu seras invite a entrer :
- **Mot de passe du keystore** (`storePassword`) — note-le
- Informations identite (nom, organisation, ville, pays)
- **Mot de passe de la cle** (`keyPassword`) — note-le aussi

**⚠️ Garde ce fichier en lieu sur.** Si tu le perds, tu ne pourras plus jamais signer une mise a jour pour la meme app (les utilisateurs ne pourront pas updater).

### 2. Configurer Github Secrets

Va dans `https://github.com/buvard/buvard-web/settings/secrets/actions` et ajoute 4 secrets :

| Secret | Valeur |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Contenu du keystore encode en base64 : `base64 -w 0 buvard-release.keystore` (ou `base64 buvard-release.keystore` sur Mac) |
| `ANDROID_KEYSTORE_PASSWORD` | Le mot de passe du keystore choisi a l'etape 1 |
| `ANDROID_KEY_ALIAS` | `buvard` (l'alias utilise dans le `keytool`) |
| `ANDROID_KEY_PASSWORD` | Le mot de passe de la cle choisi a l'etape 1 |

### 3. (Optionnel) Configurer localement pour build dev signe

Si tu veux signer en local sans Github Action, cree `android/keystore.properties` :

```properties
storeFile=../buvard-release.keystore
storePassword=ton_password
keyAlias=buvard
keyPassword=ton_key_password
```

Ce fichier est **gitignore**, ne le commit jamais. Puis :

```bash
cd android
./gradlew assembleProdRelease
```

L'APK signe sera dans `android/app/build/outputs/apk/prod/release/`.

---

## Workflow normal (a chaque release)

### Bump version + push

```bash
# Bump le patch (1.3.0 → 1.3.1)
npm run version:patch -- --push

# Ou minor (1.3.0 → 1.4.0)
npm run version:minor -- --push

# Ou explicite
node scripts/version.mjs 1.5.0 --push
```

Le script :
1. Bump `package.json` + `android/app/build.gradle` (versionName + versionCode++)
2. Cree un commit `chore(release): vX.Y.Z`
3. Cree un tag git `vX.Y.Z`
4. Push (avec `--push`)

Le push du tag declenche `.github/workflows/release-android.yml` qui :
1. Setup Node + Java + Android SDK
2. `npm ci` + `npm run build` + `npx cap sync android`
3. Decode le keystore depuis Github Secrets
4. `./gradlew assembleProdRelease` (signe via les env vars `BUVARD_*`)
5. Cree une Github Release `Buvard vX.Y.Z` avec l'APK attache (`buvard-vX.Y.Z.apk`)
6. Notes de release auto-generees depuis les commits

### Verifier le build

Va sur `https://github.com/buvard/buvard-web/actions` pour voir le run. Quand termine, va sur `https://github.com/buvard/buvard-web/releases` pour voir l'APK.

---

## Cote web (page `/download`)

La page `features/marketing/Download.tsx` doit fetcher la latest release Github
(prochaine etape — pas encore implemente). Le format de l'asset attendu est
`buvard-v{version}.apk`.

URL Github API publique (pas de token requis pour les repos publics) :

```
GET https://api.github.com/repos/buvard/buvard-web/releases/latest
```

Reponse interessante :

```json
{
  "tag_name": "v1.3.1",
  "name": "Buvard v1.3.1",
  "body": "## What's Changed\n* ...",
  "published_at": "2026-06-07T...",
  "assets": [
    {
      "name": "buvard-v1.3.1.apk",
      "browser_download_url": "https://github.com/.../buvard-v1.3.1.apk",
      "size": 12345678
    }
  ]
}
```

Rate limit non-authentifie : 60 requetes/h par IP. Tu peux passer un token
`Authorization: Bearer <PAT>` pour passer a 5000/h, mais public devrait suffire.

---

## Troubleshooting

### Le build CI echoue avec "Keystore was tampered with, or password was incorrect"

Le mot de passe `ANDROID_KEYSTORE_PASSWORD` ou `ANDROID_KEY_PASSWORD` est faux,
ou le keystore base64 est mal encode (verifier `base64 -w 0`).

### "Aucun APK trouve apres build"

Le `assembleProdRelease` n'a pas produit d'APK. Verifier les logs Gradle, sans
doute une erreur de signing en amont.

### L'APK refuse de s'installer sur le telephone

- Verifier que "sources inconnues" est autorise dans les reglages Android
- Si on a deja installe une version avec un autre keystore (debug par ex.),
  desinstaller d'abord — Android refuse une update avec signature differente
