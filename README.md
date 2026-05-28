# Buvard

App entre potes pour partager les alcools qu'on a testés, notés et découverts.

> Le nom **Buvard** vient du jeu de mots entre *buvard* (l'objet qui absorbe) et *bavard* — l'idée c'est de papoter autour de ce qu'on boit.

## Stack

| Couche | Choix |
| --- | --- |
| Build | Vite 8 |
| UI | React 19 + TypeScript 6 |
| Styles | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Composants | shadcn/ui (style `new-york`, base color `neutral`, primary bordeaux `#8B2635`) |
| Routing | React Router v7 (mode SPA) |
| Auth | Better Auth (self-hosted) + `better-auth-capacitor` pour le natif |
| Data | TanStack Query 5 |
| i18n | i18next + react-i18next (locales par préfixe d'URL) |
| Mobile | Capacitor 8 (iOS + Android) |
| OTA | Capgo (`@capgo/capacitor-updater`) self-hosted via l'API |
| Icônes | lucide-react |

> L'auth s'appuie sur le repo back **`buvard-api`** (Better Auth est installé côté serveur, users dans MongoDB). Le front interagit uniquement via le client `better-auth/react`.

## Démarrer

```bash
cp .env.example .env.local
# Renseigne :
#   VITE_API_URL=https://api-staging.buvard.app
#   VITE_APP_SCHEME=app.buvard.staging   # ou app.buvard en prod
npm install
npm run dev
```

L'app web tourne sur `http://localhost:5173`.

> En dev local, le front sur `localhost:5173` est **cross-site** avec l'API sur `api-staging.buvard.app` → les cookies session Better Auth (`SameSite=Lax`) ne voyagent pas. L'auth web ne marche pas en dev local sans proxy Vite. Pour tester l'auth, **utilise le natif Capacitor** (qui passe en Bearer Authorization via `better-auth-capacitor`, indépendant des cookies).

## Environnements

| Env | Mode Vite | `.env` lu | API | Scheme natif | Bundle Android |
| --- | --- | --- | --- | --- | --- |
| Dev local | `staging` *(par défaut de `npm run dev`)* | `.env.staging` puis `.env.local` | `api-staging.buvard.app` | `app.buvard.staging://` | `app.buvard.staging` |
| Staging build | `staging` | `.env.staging` | `api-staging.buvard.app` | `app.buvard.staging://` | `app.buvard.staging` |
| Production | `production` | `.env.production` | `api.buvard.app` | `app.buvard://` | `app.buvard` |

Les **flavors Android** (`prod` / `staging`) coexistent sur le même appareil avec des `applicationId` distincts (`app.buvard` vs `app.buvard.staging`) — pratique pour tester les deux sans désinstaller.

## Internationalisation (i18n)

Les locales sont **dans l'URL** : la racine `/` redirige vers `/fr`.

| Code | Langue |
| --- | --- |
| `fr` | Français (défaut) |
| `en` | Anglais |
| `co` | Corsu (Corse) |

- Toutes les routes sont préfixées : `/:lang/feed`, `/:lang/profile`, etc.
- Le composant `LocaleProvider` (`src/i18n/LocaleProvider.tsx`) synchronise `i18next` avec le segment `:lang` et redirige les locales inconnues vers `fr`.
- Le hook `useLocalizedPath()` (`src/i18n/useLocalizedPath.ts`) construit des liens cohérents : `to('/feed')` → `/fr/feed`.
- Switcher de langue dans le header : `src/components/LanguageSwitcher.tsx`.
- Fichiers de traduction : `src/i18n/locales/{fr,en,co}.json`.

Pour ajouter une langue : créer le JSON, l'enregistrer dans `SUPPORTED_LOCALES` (`src/i18n/config.ts`) et dans les `resources` de `i18n.init`.

## Authentification (Better Auth)

**Better Auth est headless** : les composants UI Sign In / Sign Up sont **nos propres écrans** dans `src/features/auth/`, qui appellent l'API du client (`authClient.signIn.email`, `authClient.signIn.social`, etc.). Pas de composant `<SignIn>` "tout fait" comme avec Clerk.

### Setup côté front

- **Client** : `src/lib/auth-client.ts` instancie `createAuthClient` depuis `better-auth/react`. En natif, le plugin `capacitorClient` de `better-auth-capacitor` est activé pour persister la session via `@capacitor/preferences` et envoyer le `session_token` en `Authorization: Bearer` au lieu de cookies.
- **Hooks** : `useSession()` (loader réactif), `authClient.signIn/signUp/signOut`. Re-exportés depuis `auth-client.ts` pour des imports courts.
- **Garde-fou** : `RequireAuth` (`src/components/RequireAuth.tsx`) bloque les routes privées (`feed`, `discover`, `add`, `profile`, `settings/*`) tant que `useSession()` n'a pas renvoyé un user.
- **Listener deep link OAuth natif** : `src/components/AppUrlListener.tsx` capte le retour OAuth (`app.buvard[.staging]://...?cookie=...`), parse le `session_token`, le stocke via `setCapacitorAuthToken`, puis recharge l'app. **Obligatoire pour que le natif fonctionne** — `better-auth-capacitor` ne consomme pas le deep link automatiquement.

### Flow OAuth (clic « Continuer avec Google »)

1. `authClient.signIn.social({ provider: 'google', callbackURL: '/<lang>/feed' })` — le plugin transforme le `callbackURL` relatif en deep link `app.buvard.staging://fr/feed`.
2. **Natif** : le plugin ouvre `AuthSession.openAuthSession(<URL Google>)` (Custom Tab Chrome / `ASWebAuthenticationSession` iOS). **Web** : redirect top-level standard.
3. Google → consent → callback `<API>/api/auth/callback/google` → Better Auth crée la session → redirige vers le `callbackURL` (deep link natif, ou URL web).
4. **Natif** : `AppUrlListener` parse le token de la query et le persiste. **Web** : cookie session posé sur `.buvard.app` (parent, via `crossSubDomainCookies` côté back) → `useSession` détecte.

### Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `VITE_API_URL` | URL publique de l'API (sans slash final accepté) |
| `VITE_APP_SCHEME` | Bundle id de l'app native — utilisé comme scheme deep link (`app.buvard` / `app.buvard.staging`) |

## Capacitor (iOS + Android)

Les plateformes natives sont dans `android/` et `ios/`.

```bash
# Sync seulement (pour Android Studio / Xcode ouvert)
npm run cap:sync

# Ouvrir Android Studio
npm run cap:android            # variant prod
npm run cap:android:staging    # variant staging

# Ouvrir Xcode (macOS uniquement)
npm run cap:ios

# Build + install + run sur device/émulateur
npm run cap:run:android            # flavor prod
npm run cap:run:android:staging    # flavor staging
npm run cap:run:ios                # iOS prod
npm run cap:run:ios:staging        # iOS staging (scheme "App Staging")
```

> iOS doit être buildé sur un Mac avec Xcode + CocoaPods. Le projet `ios/` peut être généré sur Windows mais `pod install` exige macOS.

### Identité de l'app

- `appId` : `app.buvard` (suffix `.staging` pour le flavor staging)
- `appName` : `Buvard` (« Buvard Staging » pour staging)
- Schemes deep link : `app.buvard://`, `app.buvard.staging://`
- Config : `capacitor.config.ts`

### Patch package

Le plugin `better-auth-capacitor` utilise un `proguard-android.txt` deprecated depuis AGP 8.7. Un patch est appliqué automatiquement via `patch-package` (`patches/better-auth-capacitor+0.3.6.patch`). Hook `postinstall` dans `package.json` — pas d'action manuelle requise.

## OTA via Capgo self-hosted

Bundle JS livré aux apps natives via `@capgo/capacitor-updater`, servi par l'API (`<API>/api/v1/app/latest-update`). Le bundle est uploadé via le script `scripts/release.mjs` qui POSTe un zip de `dist/` sur `/api/v1/admin/releases` avec un `ADMIN_JWT` Better Auth.

```bash
# Publier une release OTA (lit .env.release pour prod, .env.release.staging pour staging)
npm run release:prod    -- --version 1.3.0 --notes "..."
npm run release:staging -- --version 1.3.0
```

`scripts/release.mjs` lit `API_URL` et `ADMIN_JWT` depuis le `.env.release` correspondant.

## Structure

```
src/
  components/
    ui/                        # composants shadcn (button, card, input, etc.)
    AppLayout.tsx              # header + bottom-nav mobile (check session via useSession)
    AppUrlListener.tsx         # capte les deep links OAuth Better Auth en natif
    LanguageSwitcher.tsx       # menu de langue (fr/en/co)
    RequireAuth.tsx            # garde routes privées (useSession)
    UpdatePrompt.tsx           # toast pour les MAJ OTA
  features/
    auth/
      SignIn.tsx               # écran custom email + Google (Better Auth headless)
      SignUp.tsx
      GoogleIcon.tsx
      Onboarding.tsx
      AccountRestricted.tsx
    feed/                      # /:lang/feed
    discover/                  # /:lang/discover
    add/                       # /:lang/add
    profile/                   # /:lang/profile + sous-pages publiques
    settings/                  # /:lang/settings + sous-pages (profile, appearance, ...)
    home/                      # landing publique
    misc/                      # NotFound, etc.
  i18n/
    config.ts                  # init i18next + SUPPORTED_LOCALES
    LocaleProvider.tsx         # sync URL <-> i18next
    useLocalizedPath.ts        # hook helper pour liens préfixés
    locales/{fr,en,co}.json
  lib/
    auth-client.ts             # createAuthClient + plugin Capacitor + getNativeAuthToken
    version.ts                 # APP_VERSION (sync avec package.json)
    theme.ts                   # gestion light/dark
    utils.ts                   # cn() — merge classes Tailwind
    api/
      client.ts                # apiRequest (fetch wrapper + credentials include)
      useApi.ts                # hook : injecte le bearer Better Auth en natif
      user.ts                  # useMe, useMyPrefs, useMyStats
      mappers.ts
  router.tsx                   # createBrowserRouter + routes /:lang/*
  App.tsx                      # QueryClient + RouterProvider + AppUrlListener
  main.tsx
  index.css                    # Tailwind v4 + tokens shadcn (light/dark)

android/                       # projet Android (2 flavors : prod, staging)
ios/                           # projet iOS (à builder sur Mac)
patches/                       # patches npm appliqués via patch-package
scripts/release.mjs            # release OTA Capgo via l'API
```

## Scripts utiles

| Commande | Effet |
| --- | --- |
| `npm run dev` | Dev server Vite en mode `staging` |
| `npm run build` | `tsc -b` + `vite build` (mode `production`) → `dist/` |
| `npm run build:staging` | idem en mode `staging` |
| `npm run preview` | Sert le build de prod |
| `npm run cap:sync` | Build + sync vers Capacitor |
| `npm run cap:android` / `cap:android:staging` | Sync + ouvre Android Studio |
| `npm run cap:ios` / `cap:run:ios:staging` | Sync + ouvre Xcode (macOS) |
| `npm run cap:run:android` / `cap:run:android:staging` | Build + install + run sur device |
| `npm run release:prod` / `release:staging` | Build + upload OTA Capgo |
| `npm run lint` | ESLint |

## Pièges connus (à savoir avant de toucher l'auth)

1. **L'`AppUrlListener` est obligatoire** côté natif — sans lui, le retour OAuth deep link n'est jamais consommé et `useSession` reste vide.
2. **Le scheme intent-filter Android doit matcher tout host** (`<data android:scheme="${applicationId}" />` sans `android:host`), parce que Better Auth renvoie sur `app.buvard.staging://fr/feed` (host = `fr`).
3. **Le `bearer()` plugin Better Auth côté back est obligatoire** pour que le natif fonctionne (sinon le back ignore l'`Authorization: Bearer`).
4. **Cookies cross-subdomain** : `crossSubDomainCookies` doit être activé côté back avec `domain: '.buvard.app'` pour que le front sur `buvard.app` / `staging.buvard.app` puisse lire la session posée par l'API. Détails dans le repo `buvard-api`.
5. **Safe Browsing** : le warning rouge plein écran qui peut apparaître à la première utilisation est un faux positif sur le pattern open-redirect du `capacitor-authorization-proxy`. Demander un delisting à [safebrowsing.google.com/safebrowsing/report_error/](https://safebrowsing.google.com/safebrowsing/report_error/).

## À faire

- Brancher complètement l'écran `Add` (création de dégustation).
- Tester le flow iOS (le code est prêt, juste à valider sur un device Apple).
- Front web déployé sur Vercel : `buvard.app` (prod) + `staging.buvard.app`.
- Régénérer la `BETTER_AUTH_SECRET` régulièrement et la stocker dans un secret manager.
