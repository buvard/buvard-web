# Progression — Buvard

> Dernière mise à jour : 2026-06-07

---

## Infrastructure & transverse

- [x] Projet React + Vite + TypeScript initialisé
- [x] Tailwind CSS v4 + shadcn/ui configurés
- [x] React Router 7 avec préfixe de locale (`/:lang/...`)
- [x] i18n (i18next) — FR / EN / CO
- [x] Thème dark/light/system avec persistance localStorage
- [x] Layout responsive — sidebar desktop + bottom nav mobile
- [x] Client HTTP (fetch wrapper) avec gestion d'erreurs
- [x] Hooks TanStack Query — structure query keys
- [x] Capacitor 8 configuré (iOS + Android)
- [x] Plugins natifs pré-installés (Camera, Geolocation, Push, Share, Network…)
- [x] OTA (Capgo) — `notifyAppReady` + `checkForUpdate` au boot
- [x] Pipeline de release OTA (`scripts/release.mjs`, `RELEASES.md`)
- [x] Variables d'environnement validées au démarrage (Zod)
- [x] Détection du shell d'exécution (`isAppShell`) — Capacitor (mobile natif) + Electron prêt

---

## Web vs App (shell-aware)

- [x] Aiguilleur `Home.tsx` selon `isAppShell()` — lazy-load `HomeWeb` ou `HomeApp`
- [x] `HomeApp` — version épurée pour l'app installée ; redirige `/feed` si session
- [x] `HomeWeb` — landing marketing courte (hero + 3 teasers features + CTA création de compte)
- [x] `WebGuestLayout` (web non connecté) vs `AppGuestLayout` (app non connecté)
- [x] Pages publiques marketing — `/features`, `/download`, `/about`, `/legal` (route sous `MarketingLayout`, bloquées si shell app)
- [x] `WebNavbar` sticky scroll-aware (transparente → solide au scroll, burger menu mobile) + `WebFooter` commun
- [x] Hook `useScrolled` (passive listener) pour piloter l'état navbar

---

## Auth & onboarding

- [x] Better Auth (email + OAuth Google) — self-hosted, sessions en base Mongo *(remplace Clerk)*
- [x] Auth native (Capacitor) — plugin Better Auth, session via Bearer token (cookies indispo en WebView `https://localhost`)
- [x] Pages Sign In / Sign Up
- [x] Guard `RequireAuth` — redirige vers /sign-in
- [x] Guard `RequireUsername` — redirige vers /onboarding
- [x] Guard `RequireActive` — redirige vers /account-restricted
- [x] Page onboarding — pseudo + acceptation CGU / confidentialité
- [x] Page compte restreint (suspendu / banni)
- [x] Création du user gérée par Better Auth (base Mongo, lazy-create — plus de webhook externe)
- [x] Vérification d'âge 18+ à l'onboarding *(bloquant stores)* — date de naissance (âge calculé, blocage <18) + case de certification ; `birthYear` persisté
- [x] Message "consommer avec modération" *(bloquant stores)* — bandeau sur l'onboarding + sur l'écran Add (clé mutualisée `common.moderation`)

---

## Profil utilisateur

### Backend
- [x] Modèle `User` complet (bio, location, birthYear, favoriteCategories, gamification, stats dénormalisées…)
- [x] `GET /me` — profil connecté
- [x] `PATCH /me` — mise à jour profil
- [x] `DELETE /me` — soft-delete
- [x] `GET /me/prefs` / `PATCH /me/prefs` — préférences
- [x] `GET /me/stats` — stats dénormalisées
- [x] `POST /me/avatar` / `DELETE /me/avatar` — upload WebP → R2
- [x] `POST /me/cover` / `DELETE /me/cover` — upload WebP → R2
- [x] `GET /:username` — profil public
- [x] Respect du flag `privacy.profilePublic` (404 si privé)
- [x] Respect du flag `privacy.showLocation`

### Frontend
- [x] Page profil perso avec stats, bio, avatar, cover
- [x] Upload / suppression avatar inline
- [x] Upload / suppression cover inline
- [x] Page réglages profil (username, displayName, bio, location, birthYear, favoriteCategories)
- [x] Page profil public (`/:lang/u/:username`)
- [x] Onglet followers / following sur profil public
- [x] Onglets dégustations / catégories sur profil perso (Toutes / Favoris / Catégories — favoris en placeholder)
- [x] Onglets dégustations / catégories sur profil public (Toutes / Par catégorie) — back enrichi avec `stats.tastingsByCategory`

---

## Social

### Backend
- [x] `POST /:username/follow` / `DELETE /:username/follow`
- [x] `POST /:username/block` / `DELETE /:username/block`
- [x] `GET /:username/followers` / `GET /:username/following`
- [x] `GET /me/blocks`
- [x] `GET /me/mentions`
- [x] `GET /users/search` — autocomplete (escape regex, filtre bloqués)
- [x] Compteurs dénormalisés (followersCount, followingCount) mis à jour en atomique
- [x] Modèle `Mention` — sync à la création/modification de notes et bio

### Frontend
- [x] Bouton Suivre / Ne plus suivre sur profil public
- [x] Bouton Bloquer / Débloquer sur profil public
- [x] Page liste followers / following
- [x] Page utilisateurs bloqués
- [x] Composant `UserSearch` — autocomplete @mention
- [x] Composant `MentionText` — rendu des @mentions cliquables

---

## Dégustations

### Backend
- [x] Modèle `Tasting` (type, name, producer, year, price, rating, aromas, notes, place, photoUrls, visibility)
- [x] Champ `place` sur Tasting (name + lat/lng/placeId optionnels)
- [x] Multi-photos — `photoUrls: string[]` (max 10), upload WebP 1080×1080 → R2
- [x] `POST /tastings` — créer une dégustation
- [x] `GET /tastings` — mes dégustations (paginé, filtrable par type)
- [x] `GET /tastings/:id` — détail (public ou owner)
- [x] `PATCH /tastings/:id` — modifier
- [x] `DELETE /tastings/:id` — soft-delete
- [x] `POST /tastings/:id/photos` (ajout) / `DELETE /tastings/:id/photos/:index` / `DELETE /tastings/:id/photos` / `PATCH /tastings/:id/photos` (réorder)
- [x] `GET /:username/tastings` — dégustations publiques d'un user
- [x] Sync mentions dans les notes (create/update/delete)
- [x] Stats par catégorie dénormalisées sur User
- [x] Renvoi de l'auteur (`username`, `displayName`, `avatarUrl`) dans les réponses
- [x] Visibilité par défaut → `public`
- [x] Endpoint `GET /tastings/feed` — dégustations des comptes suivis (auth requise)
- [x] Endpoint `GET /tastings/discover` — exploration trending (auth optionnelle)

### Frontend
- [x] Hooks TanStack Query pour les tastings (`lib/api/tasting.ts`) — `useFeed`, `useDiscover`, `useMyTastings`, `useTastingsByUsername`, mutations CRUD
- [x] Formulaire **Add** branché au backend (multi-photos, picker de lieu, type, note, producteur, année, prix, arômes, notes, visibilité)
- [x] Avertissement vie privée du lieu dans le formulaire Add *(bloquant stores)* — clé `add.fields.placePrivacy`
- [x] Aligner les types `TASTING_TYPES` front sur le backend (whisky, wine, rum, beer, gin, vodka, tequila, cognac, champagne, mezcal, other)
- [x] Picker de lieu (autocomplete OpenStreetMap Nominatim — pas Google Places, OSS)
- [x] `PhotoCarousel` — multi-photos navigables (TastingCard + détail)
- [x] **Feed** branché — liste des dégustations
- [x] **Discover** branché — exploration / trending
- [x] Écran **détail** d'une dégustation — route `/tasting/:id` (`TastingDetailPage`), réutilise `TastingCard` plein écran avec top bar back
- [x] Popup desktop ouverte au clic sur une `TastingCard` (alternative au plein écran mobile)
- [x] Page édition dégustation (`TastingEdit`)
- [x] Auteur cliquable dans `TastingCard`
- [x] Nom de la boisson cliquable dans `TastingCard` → `/tasting/:id`
- [x] Onglets profil perso (Toutes / Favoris / Par catégorie)
- [x] Onglets profil public (Toutes / Par catégorie)

---

## Likes

### Backend
- [x] Modèle `Like` (userId + tastingId, index unique)
- [x] `POST /tastings/:id/like` / `DELETE /tastings/:id/like` (idempotents)
- [x] `GET /tastings/:id/likes` — liste paginée des likers
- [x] Compteur dénormalisé `likesCount` sur Tasting (atomique)
- [x] Flag `isLikedByMe` injecté dans les réponses pour le viewer connecté
- [x] Service `like.service.ts` — `getLikedTastingIds` pour batch-check sur les feeds

### Frontend
- [x] `LikeButton` avec optimistic update (`useLikeTasting` / `useUnlikeTasting`)
- [x] Affichage sur `TastingCard` et popup détail desktop
- [x] Liste des likers (modal / sheet)

---

## Carte & exploration

### Backend
- [x] Endpoint `GET /tastings/discover/places` — lieux agrégés depuis les dégustations publiques (auth requise)
  - Aggregation MongoDB ($match → $project → $sort → $group → $sort → $facet)
  - Group par coords arrondies à 4 décimales (~11m)
  - Champs renvoyés : `placeId`, `name`, `lat/lng`, `tastingsCount`, `averageRating`, `lastTastingAt`, `coverPhotoUrl`, `sampleTypes`
  - Tri par défaut `lastTastingAt desc` (lieux récemment animés)
  - Pagination page/limit + bounding box optionnelle `?bbox=swLat,swLng,neLat,neLng`
  - Exclusion des comptes bloqués
  - Optimisations : index partiel `(visibility, place.lat, place.lng, createdAt)` avec `partialFilterExpression`, projection avant group, `allowDiskUse: true`

### Frontend
- [x] Page `/map` — layout flex contraint (pas de scroll global, la carte reste toujours visible)
- [x] 3 onglets : **Mes spots** / **Amis** / **Découvrir** — défaut `mine`
- [x] `TastingsMap` (Leaflet + OpenStreetMap) — fit-bounds initial, focus zoom 16, popup historique avec vignettes photo
- [x] `DiscoverPlacesMap` — carte dédiée à l'onglet Découvrir, popup synthétique (cover, rating, count, types, dernière dégustation)
- [x] `PlacesGrid` — grid de cards (mine/friends) avec vignette 4/3 + nom + dernière visite
- [x] `DiscoverPlacesList` — liste verticale compacte (onglet Découvrir), focus adresse > visuel
- [x] Click sur une card / row → focus map (`?lat=&lng=`) + highlight visuel (ring primary)
- [x] Hook `useDiscoverPlaces` (TanStack Query infinite) consommant l'endpoint back agrégé
- [x] Stats header : "X lieux · Y dégustations" pluralisé

---

## Gamification *(V1 lite)*

- [x] Modèle — champs `xp`, `level`, `streak` sur User
- [x] Affichage niveau + XP sur le profil
- [x] Règles de gain XP — `XP_PER_TASTING = 10` + formule level `floor(sqrt(xp/100)) + 1` (paliers 0/100/400/900/1600…)
- [x] Mise à jour du streak à la publication — current/longest/lastActiveAt gérés par `awardTastingXp` (même jour : no-op, J+1 : +1, gap : reset à 1)
- [x] Affichage streak sur le profil — `Flame` + valeur pluralisée ("3 jours"), tooltip avec record si dépassé
- [x] Toast `+10 XP gagnés` à la publication (`Add.tsx` → `add.xpGained`)
- [x] Barre de progression XP sur le profil perso — `xpProgress(xp, level)` côté `lib/gamification.ts`, mirror des règles back
- [x] Invalidation des queries `me` + `stats` après création de dégustation — l'XP/level/streak se rafraîchissent immédiatement dans l'UI
- [x] Popup explicative `LevelPopover` ancrée sous la barre XP — actions qui rapportent (+XP), paliers à venir, streak. Composant `ui/popover.tsx` (Radix Popover) ajouté au design system
- [x] Barème XP étendu (back + front mirror) :
  - Création tasting : +10 base, +5 lieu, +5 notes ≥ 50 chars, +3 arômes ≥ 3, +25 si 1ère dégustation
  - Photo additionnelle (2ème et +) : +2 XP via `addTastingPhoto`
  - Like reçu : +1 XP au propriétaire (pas d'auto-like)
  - Nouveau follower : +5 XP au suivi, +20 bonus pour le 1er (one-shot)
  - Onboarding complet : +50 XP
  - Profil complet (avatar + bio + location) : +25 XP one-shot
  - Streak milestones 7/30/100 jours : +50/+200/+1000 XP one-shot
  - Tracking des one-shots via `gamification.bonusesGranted` sur User
  - Helper `grantXp(userId, amount)` réutilisable, `tryGrantProfileCompleteBonus` après `updateMe`/`setAvatar`
  - Front : LevelPopover liste tout par section (création / engagement / milestones), constantes mirror dans `lib/gamification.ts`

---

## Réglages

- [x] Page Apparence (thème)
- [x] Page Langue
- [x] Page Régional (unités, devise)
- [x] Page Notifications (préférences push/email)
- [x] Page Confidentialité
- [x] Page Compte (supprimer le compte)
- [x] Page Légal (CGU, vie privée)
- [x] Sync préférences backend ↔ localStorage au démarrage

---

## Bugfixes connus *(voir ANALYSE.md)*

- [x] Aligner `TASTING_TYPES` frontend sur le backend
- [x] Corriger `tastingCount` → `tastingsCount` dans la persistence (`stats.tastingsCount`)
- [x] `listForPublicProfile` : check `profilePublic` → 404 si privé (cohérent avec `getPublicProfile`)
- [x] Supprimer `avatarUrl` / `coverUrl` de `updateMeSchema` côté backend (gérés via endpoints upload R2 dédiés)
- [x] `listBlocks` : ajouter `deletedAt: null` sur le `UserModel.find` (les comptes soft-deletés ne remontent plus)
- [x] Ajouter `'co'` dans `LANGUAGES` backend (corse, déjà supporté côté front i18n)
- [x] Corriger les bornes du champ rating dans `Add.tsx` (min 0.5, max 5)
- [x] Corriger la gestion `MongooseError` dans le handler d'erreurs — `ValidationError`/`CastError` → 400, autres `MongooseError` → 500 + log
- [x] Supprimer `types/domain.ts` obsolète
- [x] Fix middleware `validate` Express 5 — utilisation de `Object.defineProperty` au lieu de `Reflect.set` pour réécrire `req.query` (le getter Express 5 bloque l'écriture, la coercion Zod n'était jamais appliquée, ce qui plantait l'aggregation `$limit: "30"`)

---

## V2 — Commentaires, favoris, notifications

- [ ] Modèle `Comment` + endpoints
- [ ] Modèle `Collection` / favoris + endpoints
- [ ] Centre de notifications in-app (mentions, abonnés, likes, commentaires)
- [ ] Push notifications (câblage FCM/APNs backend)
- [ ] Recherche de boissons (qui l'a goûtée, notes)
- [ ] Dégustation de groupe
- [ ] Wishlist "envie de goûter"

---

## V3 — IA & gamification complète

- [ ] Plugin scan code-barres
- [ ] Endpoint `/tastings/scan` (lookup code-barres → fallback photo + OpenAI)
- [ ] Flux dans Add : scan → photo IA → saisie manuelle
- [ ] Recommandations personnalisées
- [ ] Page Stats perso (types préférés, note moyenne, budget, régions)
- [ ] Page Challenges
- [ ] Badges / succès
- [ ] Classement entre amis
- [ ] Challenges mensuels

---

## V4 — Partage & polish

- [x] ~~Carte des dégustations~~ → **promu V1 (Leaflet + OSM)**
- [ ] Partage d'une dégustation / profil (plugin Share)
- [ ] Push notifications côté frontend
- [ ] Adaptation mobile fine du layout
- [ ] Filtres carte par type de boisson (vin, bière, spiritueux)
- [ ] Bbox dynamique côté front (recharger les lieux dans le viewport courant — back déjà prêt)
- [ ] Auto-open popup map au clic sur une card de la liste / grid

---

## Points ouverts (décisions à prendre)

- [ ] Scan code-barres : Open Food Facts (gratuit, lacunaire) vs API payante ?
- [ ] Budget par appel OpenAI (n'appeler qu'en fallback)
- [ ] Âge 18+ : case déclarative ou vérification réelle ?
- [x] ~~Feed découverte : récent, populaire, proximité géo ou reco ?~~ — **récence** retenu pour V1 (`lastTastingAt desc`)
- [x] ~~Carte : Mapbox, Leaflet/OSM ?~~ — **Leaflet + OSM** (OSS, aucun token API)
- [ ] Dégustation de groupe : une partagée à N, ou N liées ?
- [x] ~~Lieu : saisie libre ou autocomplete (Google Places…) ?~~ — **autocomplete OpenStreetMap Nominatim** (OSS)
- [ ] Distribution app mobile : APK direct vs TestFlight vs stores ? *(actuellement : page `/download` interne web, distribution maison)*
