// Types miroir du backend Buvard pour les degustations.
// Source de verite : src/models/Tasting.ts (buvard-api).

import type { TastingType } from './api'

export type Visibility = 'public' | 'private'

// Doit rester synchro avec MAX_TASTING_PHOTOS cote back (tasting.service.ts).
export const MAX_TASTING_PHOTOS = 10

export interface TastingAuthor {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
}

// Lieu de degustation issu de Google Places Autocomplete.
// `name` est le nom affichable, les autres champs sont optionnels mais
// generalement renseignes quand l'utilisateur selectionne un suggestion.
export interface TastingPlace {
  name: string
  lat?: number
  lng?: number
  placeId?: string
}

export interface Tasting {
  id: string
  type: TastingType
  name: string
  producer?: string
  year?: number
  price?: number
  currency?: string
  rating: number
  aromas: string[]
  notes?: string
  place?: TastingPlace
  photoUrls: string[]
  visibility: Visibility
  // Compteur denormalize cote back, mis a jour atomiquement aux like/unlike.
  likesCount: number
  // true si le viewer connecte a like ce tasting (false si non auth).
  isLikedByMe: boolean
  author: TastingAuthor
  createdAt: string
  updatedAt: string
}

// ---- DTO ----

export interface CreateTastingPayload {
  type: TastingType
  name: string
  producer?: string
  year?: number
  price?: number
  currency?: string
  rating: number
  aromas?: string[]
  notes?: string
  place?: TastingPlace
  visibility?: Visibility
}

export type UpdateTastingPayload = Partial<CreateTastingPayload>

export interface ListTastingsParams {
  page?: number
  limit?: number
  type?: TastingType
}

// Lieu pre-agrege renvoye par GET /v1/tastings/discover/places.
// Cote back : DiscoveredPlace dans tasting.service.ts.
export interface DiscoveredPlace {
  placeId: string | null
  name: string
  lat: number
  lng: number
  tastingsCount: number
  averageRating: number
  lastTastingAt: string
  coverPhotoUrl: string | null
  sampleTypes: TastingType[]
}

export interface ListDiscoverPlacesParams {
  page?: number
  limit?: number
  type?: TastingType
  // Bounding box "swLat,swLng,neLat,neLng" — coords du viewport. Optionnel :
  // si absent, on recupere les lieux globalement (paginated).
  bbox?: string
}
