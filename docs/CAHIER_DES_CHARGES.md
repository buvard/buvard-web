# Cahier des charges — Buvard

Document de référence produit et technique. Source unique, versionnée dans le repo.

## Sommaire

1. [Présentation](#1-présentation)
2. [Utilisateurs et rôles](#2-utilisateurs-et-rôles)
3. [Décisions produit](#3-décisions-produit)
4. [Périmètre fonctionnel](#4-périmètre-fonctionnel)
5. [Stack technique](#5-stack-technique)
6. [Architecture](#6-architecture)
7. [API existante](#7-api-existante)
8. [Conventions de développement](#8-conventions-de-développement)
9. [Environnements et déploiement](#9-environnements-et-déploiement)
10. [Roadmap](#10-roadmap)
11. [Backlog des features à créer](#11-backlog-des-features-à-créer)
12. [Points ouverts](#12-points-ouverts)

---

## 1. Présentation

**Buvard** est un réseau social mobile pour partager ses dégustations de boissons (vins, bières, spiritueux, cocktails) avec ses amis. On note ce qu'on boit, on en garde une trace, on suit les dégustations des autres.

**Exemple.** Lucas goûte un vin, il publie une dégustation (nom, type, note sur 5, photo, lieu, commentaire). Ses abonnés la voient dans leur fil. On peut se suivre, se mentionner (`@pseudo`), aimer et commenter.

- **Plateformes :** iOS + Android (Capacitor), plus une version web (même code).
- **Direction UI :** inspirée de Twitter/X moderne, adaptée à Buvard (bordeaux signature, glow d'ambiance, layout épuré).

---

## 2. Utilisateurs et rôles

- **Cible :** amateurs de boissons et cercles d'amis qui partagent leurs découvertes. Grand public, ton fun (pas « experts/sommeliers »).
- **Rôles :** `utilisateur`, `modérateur`, `admin` (badge affiché sur le profil).

---

## 3. Décisions produit

Choix actés, à implémenter.

| Sujet | Décision |
|---|---|
| Visibilité des dégustations | **Publique par défaut** |
| Photo de dégustation | **Obligatoire** (contenu du post) |
| Lieu | **Obligatoire** = où on a goûté/trouvé. **Avertir de ne jamais indiquer son domicile** |
| Feed | **Mixte** : comptes suivis + découverte (non suivis) |
| Identification bouteille | **Hybride** : 1) scan code-barres, 2) fallback photo + IA, 3) saisie manuelle |
| Clé OpenAI | **Côté back uniquement**, jamais dans l'app |
| Engagement | **Likes** en v1. Commentaires et favoris/collections : versions suivantes |
| Gamification | **Version lite** en v1 (niveau, streak, XP simple). Challenges, badges, classement : plus tard |
| Conformité | Vérification d'âge 18+ + message de modération |

---

## 4. Périmètre fonctionnel

Statuts : **Fait** · **Partiel** · **À faire**. Colonne Version : **Livré** = déjà en prod (rien à construire) ; **V1 → V4** = à construire, par jalon.

| Domaine | Statut | Version | Notes |
|---|---|---|---|
| Auth & onboarding | Fait | Livré | Clerk (email, OAuth Google), `username`, comptes suspendus/bannis |
| Profil perso & public | Fait | Livré | Layout façon X, avatar/cover éditables, bio, localisation, stats |
| Social (suivre, bloquer, mentions, recherche users) | Fait | Livré | |
| Réglages | Fait | Livré | Thème, langue, régional, confidentialité, compte, légal, bloqués |
| Rôles & vérification | Fait | Livré | Badges admin/modérateur, compte vérifié |
| Mises à jour OTA | Fait | Livré | Capgo + popup « nouvelle version → redémarrer » |
| Internationalisation | Fait | Livré | FR/EN, aucune chaîne en dur |
| **Dégustations** (publier, feed, discover, profil) | À faire | **V1** | Cœur. CRUD perso existe back ; manquent endpoints feed/discover/public + tout le front |
| Conformité (18+, modération, vie privée du lieu) | À faire | **V1** | Bloquant stores |
| Likes | À faire | **V1** | |
| Gamification lite (niveau, streak, XP) | Partiel | **V1** | Affichage fait ; règles de gain à câbler |
| Commentaires & favoris/collections | À faire | **V2** | |
| Notifications (centre in-app) | Partiel | **V2** | Mentions stockées back ; affichage à faire |
| Social avancé (groupe, wishlist, recherche de boissons) | À faire | **V2** | |
| IA (scan code-barres + reco perso) | À faire | **V3** | Clé OpenAI côté back |
| Gamification complète (challenges, badges, classement) | À faire | **V3** | |
| Stats perso | À faire | **V3** | Types préférés, note moyenne, budget, régions |
| Carte des dégustations | À faire | **V4** | |
| Partage · push · adaptation mobile | À faire | **V4** | |

### Modèle d'une dégustation (back, existant)

`type` (wine/beer/spirit/cocktail/other), `name`, `producer`, `year`, `price` + `currency`, `rating` (0,5–5), `aromas[]`, `notes`, `photoUrl`, `visibility`, auteur, date.
À ajouter : champ **`lieu`**.

---

## 5. Stack technique

### Front (`buvard-web`)

| Élément | Choix |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| Mobile | Capacitor 8 (iOS/Android) + plugins (camera, geolocation, share, push, haptics, network…) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react |
| Auth | Clerk (`@clerk/clerk-react`) |
| Data | TanStack Query |
| Routing | react-router-dom 7 |
| i18n | i18next (FR/EN) |
| OTA | `@capgo/capacitor-updater` |

### Back (`buvard-api`)

| Élément | Choix |
|---|---|
| Runtime | Node + Express 5 + TypeScript |
| Base de données | MongoDB + Mongoose 8 |
| Auth | Clerk (`@clerk/express`) |
| Stockage | Cloudflare R2 (avatars, covers, photos, bundles OTA) |
| Validation / logs | Zod / Pino |

### Infra

- API déployée sur un VPS Hostman, déploiement auto via GitHub Actions sur push `main`.
- Domaine API : `https://api.buvard.app`.

---

## 6. Architecture

### Front — organisation par feature

```
src/
  features/<feature>/      écrans + composants spécifiques
    components/            composants propres à la feature
  components/              transverse (ui/, AppLayout, guards, TastingCard, MentionText…)
  types/                   types centralisés (import via @/types)
  lib/api/                 hooks TanStack Query + client HTTP
  i18n/                    config + locales
```

Règle : composant utilisé par une seule feature → dans la feature ; par plusieurs → `components/`.

### Back — MVC

```
src/
  routes/v1/    endpoints
  controllers/  parsing requête/réponse
  services/     logique métier
  models/       schémas Mongoose (User, Tasting, Follow, Block, Mention, AppRelease)
  zod/          validation
  middlewares/  auth, validation
```

---

## 7. API existante

| Domaine | Endpoints |
|---|---|
| Users | `/me`, `/me/prefs`, `/me/stats`, avatar/cover, `/:username`, `/:username/follow`, `/:username/block`, `/:username/followers`, `/:username/following`, `/search`, `/me/blocks`, `/me/mentions` |
| Tastings | `POST /tastings`, `GET /tastings` (les miennes), `GET /tastings/:id`, `PATCH /tastings/:id`, `DELETE /tastings/:id`, photo |
| App (OTA) | `GET /app/latest-update`, `/admin/releases/*` |

---

## 8. Conventions de développement

- **Langue :** code en anglais (noms courts et clairs), commentaires et doc en français.
- **i18n :** jamais de texte en dur, clés en `namespace.cle`.
- **Commits :** conventionnels en anglais (`feat`, `fix`, `refactor`), atomiques.
- **CSS :** Tailwind d'abord, custom si nécessaire. Mobile-first.
- **Data :** hooks TanStack Query (pas de fetch manuel non cleanup).
- **Avant commit :** `tsc --noEmit` + `eslint`.

---

## 9. Environnements et déploiement

### Dev local

- Front : `npm run dev` (Vite, port 5173). Variables dans `.env.local`.
- Back : sur le VPS (dev API local = Mongo + env, voir repo `buvard-api`).

### Build natif

- `npm run cap:run:android` / `cap:ios` (Android Studio / Xcode requis).
- Tout changement de plugin / `capacitor.config.ts` / permission → **redistribution stores** (pas d'OTA).

### Déploiement

- **Back :** push sur `main` → GitHub Actions → VPS.
- **Front (OTA) :** `npm run release:ios -- --version X.Y.Z --notes "..."` puis `release:android`. Détails dans [`RELEASES.md`](../RELEASES.md).
- **CORS :** l'API autorise `https://localhost`, `capacitor://localhost` et le web.

---

## 10. Roadmap

| Version | Contenu |
|---|---|
| **V1 (MVP)** | Dégustations (publier, feed, discover, profil, détail) · conformité 18+ · **likes** · **gamification lite** (niveau/streak/XP) |
| **V2** | Commentaires · favoris/collections · centre de notifications · recherche de boissons · dégustation de groupe · wishlist |
| **V3** | IA (scan code-barres + reco perso) · gamification complète (page challenges, badges, classement) · stats perso |
| **V4** | Carte des dégustations · partage · push notifications · adaptation mobile fine |

Le détail tâche par tâche est en [section 11](#11-backlog-des-features-à-créer).

---

## 11. Backlog des features à créer

Tags : **[B]** back · **[F]** front · **[N]** natif (nouveau plugin/permission → redistribution stores).

### A. Dégustations — V1

- [ ] [B] Ajouter le champ `lieu` au modèle `Tasting`
- [ ] [B] Visibilité par défaut → `public`
- [ ] [B] Endpoint feed (suivis + découverte)
- [ ] [B] Endpoint discover / trending
- [ ] [B] Endpoint dégustations publiques par `username`
- [ ] [B] Renvoyer le `username` de l'auteur
- [ ] [F] Aligner le type `Tasting` (mapper) sur le modèle back
- [ ] [F] Écran **Add** : photo obligatoire, lieu obligatoire + avertissement domicile, type, note, producteur, année, prix, arômes, notes, visibilité
- [ ] [F] Brancher le Feed
- [ ] [F] Brancher Discover
- [ ] [F] Brancher les onglets du profil (Toutes / Favoris / Catégories)
- [ ] [F] Auteur cliquable dans `TastingCard`
- [ ] [F] Écran détail d'une dégustation

### B. Conformité — V1

- [ ] [F] Vérification d'âge 18+ à l'inscription / onboarding
- [ ] [F] Message « consommer avec modération »
- [ ] [F] Avertissement vie privée du lieu (≠ domicile)

### C. Engagement

- [ ] **V1** — [B] Modèle + endpoints Like · [F] like sur une dégustation
- [ ] **V2** — [B] Modèle + endpoints Commentaire · [F] liste + ajout
- [ ] **V2** — [B] Modèle Favoris/collections · [F] favoris + collections

### D. Social et découverte — V2

- [ ] [B][F] Recherche de boissons (qui l'a goûtée, notes)
- [ ] [B][F] Dégustation de groupe
- [ ] [B][F] Wishlist « envie de goûter »
- [ ] [F] Carte des dégustations (choisir le fournisseur)

### E. Notifications — V2

- [ ] [F] Centre de notifications (mentions, abonnés, likes, commentaires)
- [ ] [B] Agréger les notifications (mentions existe → étendre)
- [ ] [B][F][N] Push notifications

### F. IA — V3

- [ ] [N] Plugin scan code-barres
- [ ] [B] Endpoint `/tastings/scan` : lookup code-barres → fallback photo + OpenAI
- [ ] [F] Flux dans Add : scan → photo IA → saisie manuelle
- [ ] [B][F] Reco perso (basée sur les notes hautes)

### G. Gamification

- [ ] **V1 (lite)** — [B] Règles XP / niveau / streak simples (gain à la publication)
- [ ] **V3** — [F] Page Challenges
- [ ] **V3** — [B][F] Badges / succès
- [ ] **V3** — [B][F] Classement entre amis
- [ ] **V3** — [B][F] Challenges mensuels

### H. Stats et finitions

- [ ] **V3** — [B][F] Écran Stats (types préférés, note moyenne, budget, régions)
- [ ] **V3** — [F] Historique filtrable
- [ ] **V4** — [F][N] Partage d'une dégustation/profil
- [ ] **V4** — [F] Adaptation mobile fine du layout
- [ ] **V4** — [N] `versionName "1.0.0"` (SemVer) au prochain build natif

---

## 12. Points ouverts

À trancher (avec la collaboratrice) :

- **Scan code-barres :** source de données (Open Food Facts gratuit mais lacunaire sur le vin, vs API payante). Le fallback IA couvre le vin.
- **Coût IA :** budget par appel OpenAI (n'appeler qu'en fallback).
- **Âge 18+ :** simple case déclarative ou vérification réelle ?
- **Feed découverte :** récent, populaire, proximité géo, ou reco ?
- **Carte :** fournisseur (Mapbox, Leaflet/OSM) ?
- **Dégustation de groupe :** une dégustation partagée à N, ou N dégustations liées ?
- **Lieu :** saisie libre ou autocomplete (Google Places…) ?

---

*Document vivant — à compléter à deux, cocher le backlog au fur et à mesure.*
