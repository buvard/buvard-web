// Client Photon (Komoot) — geocoding base sur OpenStreetMap, Apache 2.0.
// API publique gratuite chez Komoot (photon.komoot.io), fair-use policy.
// Doc : https://photon.komoot.io/
//
// Si on a besoin de plus de volume ou d'isolation, on peut self-host :
// https://github.com/komoot/photon (Docker, ~30Go d'index OSM monde).

import type { TastingPlace } from '@/types'

const PHOTON_BASE = 'https://photon.komoot.io/api/'

interface PhotonFeature {
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    osm_id?: number
    osm_type?: string
    name?: string
    street?: string
    housenumber?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    type?: string
  }
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

// Une suggestion d'autocomplete : ce qu'on affiche dans le dropdown + le
// TastingPlace pret a etre stocke en DB si l'utilisateur la selectionne.
export interface PlaceSuggestion {
  key: string
  label: string
  secondary?: string
  place: TastingPlace
}

function buildLabel(f: PhotonFeature): { primary: string; secondary?: string } {
  const p = f.properties
  // Nom POI prioritaire, sinon rue + numero pour les adresses
  const primary =
    p.name ||
    [p.housenumber, p.street].filter(Boolean).join(' ') ||
    p.city ||
    p.country ||
    '—'
  const secondaryParts = [p.city, p.state, p.country].filter(
    (v): v is string => Boolean(v),
  )
  const secondary = secondaryParts.length > 0 ? secondaryParts.join(', ') : undefined
  return { primary, secondary }
}

function toSuggestion(f: PhotonFeature, idx: number): PlaceSuggestion {
  const { primary, secondary } = buildLabel(f)
  const [lng, lat] = f.geometry.coordinates
  const placeId =
    f.properties.osm_type && f.properties.osm_id !== undefined
      ? `${f.properties.osm_type}${f.properties.osm_id}`
      : undefined
  return {
    key: placeId ?? `${lat},${lng},${idx}`,
    label: primary,
    secondary,
    place: {
      name: secondary ? `${primary}, ${secondary}` : primary,
      lat,
      lng,
      ...(placeId ? { placeId } : {}),
    },
  }
}

// Cherche jusqu'a `limit` suggestions correspondant a la query.
// Lang biaise les noms locaux ("Paris" en fr/en) — defaults `fr` cote app.
export async function searchPlaces(
  query: string,
  options: { limit?: number; lang?: string; signal?: AbortSignal } = {},
): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams({
    q,
    limit: String(options.limit ?? 5),
    lang: options.lang ?? 'fr',
  })

  const res = await fetch(`${PHOTON_BASE}?${params.toString()}`, {
    signal: options.signal,
  })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const json = (await res.json()) as PhotonResponse
  return (json.features ?? []).map(toSuggestion)
}

// Reverse geocoding : a partir de coords (lat/lng), retourne le lieu le plus
// proche connu d'OSM. Utilise apres un drag manuel du marker pour mettre a
// jour le nom du lieu. On preserve les coords du drag (Photon peut snapper
// sur un POI a quelques metres, on garde la position exacte de l'utilisateur).
export async function reversePlace(
  lat: number,
  lng: number,
  options: { lang?: string; signal?: AbortSignal } = {},
): Promise<TastingPlace | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    limit: '1',
    lang: options.lang ?? 'fr',
  })

  const res = await fetch(`https://photon.komoot.io/reverse/?${params.toString()}`, {
    signal: options.signal,
  })
  if (!res.ok) throw new Error(`Photon reverse ${res.status}`)
  const json = (await res.json()) as PhotonResponse
  const feature = json.features?.[0]
  if (!feature) return null

  const s = toSuggestion(feature, 0)
  // On force les coords du drag (la valeur de l'utilisateur prime sur le snap).
  return { ...s.place, lat, lng }
}
