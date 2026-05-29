# Progression — Buvard

> Dernière mise à jour : 2026-05-29

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
- [ ] Onglets dégustations / catégories sur profil public *(différé — dépend des hooks tasting)*
- [ ] Onglets dégustations / catégories sur profil perso *(UI prête, différé — dépend des hooks tasting)*

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
- [x] Modèle `Tasting` (type, name, producer, year, price, rating, aromas, notes, photoUrl, visibility)
- [x] `POST /tastings` — créer une dégustation
- [x] `GET /tastings` — mes dégustations (paginé, filtrable par type)
- [x] `GET /tastings/:id` — détail (public ou owner)
- [x] `PATCH /tastings/:id` — modifier
- [x] `DELETE /tastings/:id` — soft-delete
- [x] `POST /tastings/:id/photo` / `DELETE /tastings/:id/photo` — photo WebP → R2
- [x] `GET /:username/tastings` — dégustations publiques d'un user
- [x] Sync mentions dans les notes (create/update/delete)
- [x] Stats par catégorie dénormalisées sur User
- [ ] Champ `lieu` sur le modèle `Tasting`
- [ ] Renvoyer le `username` + `displayName` + `avatarUrl` de l'auteur dans les réponses
- [ ] Visibilité par défaut → `public` *(décision produit actée)*
- [ ] Endpoint **feed** (dégustations des comptes suivis + découverte)
- [ ] Endpoint **discover / trending**

### Frontend
- [ ] Hooks TanStack Query pour les tastings (`lib/api/tasting.ts`)
- [ ] Formulaire **Add** branché au backend (photo obligatoire, lieu, type, note, producteur, année, prix, arômes, notes, visibilité)
- [ ] Avertissement vie privée du lieu dans le formulaire Add *(bloquant stores)*
- [x] Aligner les types `TASTING_TYPES` front sur le backend (whisky, wine, rum, beer, gin, vodka, tequila, cognac, champagne, mezcal, other)
- [ ] **Feed** branché — liste des dégustations
- [ ] **Discover** branché — exploration / trending
- [ ] Écran **détail** d'une dégustation
- [ ] Auteur cliquable dans `TastingCard`
- [ ] Onglets profil perso (Toutes / Par catégorie)
- [ ] Onglets profil public (Toutes / Par catégorie)

---

## Likes *(V1)*

- [ ] Modèle `Like` (backend)
- [ ] `POST /tastings/:id/like` / `DELETE /tastings/:id/like` (backend)
- [ ] Compteur likes dénormalisé sur Tasting (backend)
- [ ] Bouton like sur `TastingCard` (frontend)
- [ ] Bouton like sur écran détail (frontend)

---

## Gamification *(V1 lite)*

- [x] Modèle — champs `xp`, `level`, `streak` sur User
- [x] Affichage niveau + XP sur le profil
- [ ] Règles de gain XP (ex. +10 XP à la publication d'une dégustation)
- [ ] Mise à jour du streak à la publication
- [ ] Affichage streak sur le profil

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
- [ ] Corriger `tastingCount` → `tastingsCount` dans `user.service.ts`
- [ ] `listForPublicProfile` : ajouter le check `profilePublic`
- [ ] Supprimer `avatarUrl` / `coverUrl` de `updateMeSchema` *(côté front : type `UpdateMePayload` nettoyé ; reste le schéma Zod backend)*
- [ ] `listBlocks` : ajouter `deletedAt: null` dans la requête
- [ ] Ajouter `'co'` dans `LANGUAGES` backend
- [x] Corriger les bornes du champ rating dans `Add.tsx` (min 0.5, max 5)
- [ ] Corriger la gestion `MongooseError` dans le handler d'erreurs (500 vs 400)
- [ ] Supprimer `types/domain.ts` obsolète

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

## V4 — Carte & partage

- [ ] Carte des dégustations (Mapbox ou Leaflet/OSM)
- [ ] Partage d'une dégustation / profil (plugin Share)
- [ ] Push notifications côté frontend
- [ ] Adaptation mobile fine du layout

---

## Points ouverts (décisions à prendre)

- [ ] Scan code-barres : Open Food Facts (gratuit, lacunaire) vs API payante ?
- [ ] Budget par appel OpenAI (n'appeler qu'en fallback)
- [ ] Âge 18+ : case déclarative ou vérification réelle ?
- [ ] Feed découverte : récent, populaire, proximité géo ou reco ?
- [ ] Carte : Mapbox, Leaflet/OSM ?
- [ ] Dégustation de groupe : une partagée à N, ou N liées ?
- [ ] Lieu : saisie libre ou autocomplete (Google Places…) ?
