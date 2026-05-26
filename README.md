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
| Auth | Clerk (`@clerk/clerk-react`) |
| i18n | i18next + react-i18next (locales par préfixe d'URL) |
| Mobile | Capacitor 8 (iOS + Android) |
| Icônes | lucide-react |

## Démarrer

```bash
cp .env.example .env.local
# Renseigne VITE_CLERK_PUBLISHABLE_KEY depuis https://dashboard.clerk.com
npm install
npm run dev
```

L'app tourne sur `http://localhost:5173`.

## Internationalisation (i18n)

Les locales sont **dans l'URL** : la racine `/` redirige vers `/fr`.

| Code | Langue |
| --- | --- |
| `fr` | Français (défaut) |
| `en` | Anglais |
| `co` | Corsu (Corse) |

- Toutes les routes sont préfixées : `/:lang/feed`, `/:lang/profile`, etc.
- Le composant `LocaleProvider` (`src/i18n/LocaleProvider.tsx`) synchronise `i18next` avec le segment `:lang` et redirige les locales inconnues vers `fr`.
- Le hook `useLocalizedPath()` (`src/i18n/useLocalizedPath.ts`) construit des liens cohérents : `to('/feed')` -> `/fr/feed`.
- Switcher de langue dans le header : `src/components/LanguageSwitcher.tsx`.
- Fichiers de traduction : `src/i18n/locales/{fr,en,co}.json`.

Pour ajouter une langue : créer le JSON, l'enregistrer dans `SUPPORTED_LOCALES` (`src/i18n/config.ts`) et dans les `resources` de `i18n.init`.

## Authentification (Clerk)

- `ClerkProvider` est monté dans `src/App.tsx`.
- Pages : `/:lang/sign-in/*` et `/:lang/sign-up/*` (composants Clerk en *path-routing*).
- Garde-fou : `RequireAuth` (`src/components/RequireAuth.tsx`) protège `feed`, `discover`, `add`, `profile`.
- Après connexion, redirection vers `/:lang/feed`.

## Capacitor (iOS + Android)

Les plateformes natives sont dans `android/` et `ios/`.

```bash
# Build web puis sync vers les plateformes
npm run cap:sync

# Ouvrir Android Studio
npm run cap:android

# Ouvrir Xcode (macOS uniquement)
npm run cap:ios

# Lancer sur device/simulateur
npm run cap:run:android
npm run cap:run:ios
```

> iOS doit être buildé sur un Mac avec Xcode + CocoaPods. Le projet `ios/` peut être généré sur Windows mais `pod install` exige macOS.

Identité de l'app :

- `appId` : `app.buvard`
- `appName` : `Buvard`
- `webDir` : `dist`

Config : `capacitor.config.ts`.

## Structure

```
src/
  components/
    ui/                    # composants shadcn (button, card, input, etc.)
    AppLayout.tsx          # header + bottom-nav mobile
    LanguageSwitcher.tsx   # menu de langue (fr/en/co)
    RequireAuth.tsx        # garde Clerk pour routes privées
  i18n/
    config.ts              # init i18next + SUPPORTED_LOCALES
    LocaleProvider.tsx     # sync URL <-> i18next
    useLocalizedPath.ts    # hook helper pour liens préfixés
    locales/{fr,en,co}.json
  lib/
    utils.ts               # cn() — merge classes Tailwind
  pages/
    Home.tsx
    SignIn.tsx
    SignUp.tsx
    Feed.tsx
    Discover.tsx
    Add.tsx
    Profile.tsx
    NotFound.tsx
  router.tsx               # createBrowserRouter
  App.tsx                  # ClerkProvider + RouterProvider
  main.tsx
  index.css                # Tailwind v4 + tokens shadcn (light/dark)
```

## Scripts utiles

| Commande | Effet |
| --- | --- |
| `npm run dev` | Dev server Vite |
| `npm run build` | `tsc -b` + `vite build` -> `dist/` |
| `npm run preview` | Sert le build de prod |
| `npm run cap:sync` | Build + sync vers Capacitor |
| `npm run cap:android` | Sync + ouvre Android Studio |
| `npm run cap:ios` | Sync + ouvre Xcode (macOS) |

## À faire

- Brancher le backend (en cours côté toi).
- Définir le modèle "Alcool" (vin, bière, spiritueux, dégustation, photo, note, commentaires).
- Page `Add` -> formulaire de création.
- Page `Feed` -> stream temps réel des publications des amis.
- Page `Profile` -> liste des dégustations + favoris.
