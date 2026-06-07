import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import { ImageOff, Star } from 'lucide-react'
import { buvardMarkerIcon } from '@/lib/leafletIcons'
import { cn } from '@/lib/utils'
import type { Tasting } from '@/types'

// Centre par defaut si aucun tasting (France metropolitaine).
const DEFAULT_CENTER: LatLngExpression = [46.6, 2.3]
const DEFAULT_ZOOM = 5
const SINGLE_POINT_ZOOM = 14
const FOCUS_ZOOM = 16

export interface MarkerGroup {
  lat: number
  lng: number
  // Nom du lieu (du premier tasting du groupe, ils partagent en pratique le meme).
  placeName: string | undefined
  // Tries du plus recent au plus ancien (historique au lieu).
  tastings: Tasting[]
}

export function groupByPlace(tastings: Tasting[]): MarkerGroup[] {
  const map = new Map<string, MarkerGroup>()
  for (const t of tastings) {
    const lat = t.place?.lat
    const lng = t.place?.lng
    if (lat === undefined || lng === undefined) continue
    // Cle prioritaire : placeId OSM (stable a travers les drags). Fallback :
    // coords arrondies a la 4eme decimale (~11m) pour fusionner les saisies
    // libres ou les markers drag sans placeId.
    const key = t.place?.placeId ?? `${lat.toFixed(4)}:${lng.toFixed(4)}`
    const existing = map.get(key)
    if (existing) {
      existing.tastings.push(t)
    } else {
      map.set(key, { lat, lng, placeName: t.place?.name, tastings: [t] })
    }
  }
  // Tri par date desc dans chaque groupe — la popup ressemble a un historique.
  for (const g of map.values()) {
    g.tastings.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  }
  return Array.from(map.values())
}

function computeView(
  groups: MarkerGroup[],
  focus: { lat: number; lng: number } | undefined,
): {
  center: LatLngExpression
  zoom: number
  bounds?: LatLngBoundsExpression
} {
  if (focus) return { center: [focus.lat, focus.lng], zoom: FOCUS_ZOOM }
  if (groups.length === 0) return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
  if (groups.length === 1) {
    return { center: [groups[0].lat, groups[0].lng], zoom: SINGLE_POINT_ZOOM }
  }
  const lats = groups.map((g) => g.lat)
  const lngs = groups.map((g) => g.lng)
  return {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    bounds: [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as LatLngBoundsExpression,
  }
}

// Sous-composant qui re-cadre la map quand la liste/focus change apres le 1er render.
// MapContainer ne re-monte pas la map quand ses props center/zoom changent ; il
// faut passer par useMap() pour appeler setView/fitBounds.
function ViewSync({
  groups,
  focus,
}: {
  groups: MarkerGroup[]
  focus: { lat: number; lng: number } | undefined
}) {
  const map = useMap()
  const view = useMemo(() => computeView(groups, focus), [groups, focus])
  useEffect(() => {
    if (view.bounds) {
      map.fitBounds(view.bounds, { padding: [40, 40], maxZoom: SINGLE_POINT_ZOOM })
    } else {
      map.setView(view.center, view.zoom)
    }
  }, [map, view])
  return null
}

interface Props {
  tastings: Tasting[]
  // Coords sur lesquelles centrer/zoomer en priorite (override le fit-bounds).
  focus?: { lat: number; lng: number }
  // Marker isole sans popup (ex: preview lieu dans le form Add).
  extraMarker?: { lat: number; lng: number }
  className?: string
  // Si true, retire les popups + zoom/drag/scroll (lecture seule preview).
  readOnly?: boolean
}

export function TastingsMap({ tastings, focus, extraMarker, className, readOnly }: Props) {
  const { t, i18n } = useTranslation()
  const groups = useMemo(() => groupByPlace(tastings), [tastings])
  // Si on a un extraMarker et pas de focus explicite, on centre dessus.
  const effectiveFocus = focus ?? extraMarker
  const initial = useMemo(
    () => computeView(groups, effectiveFocus),
    [groups, effectiveFocus],
  )

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-border', className)}>
      <MapContainer
        center={initial.center}
        zoom={initial.zoom}
        bounds={initial.bounds}
        scrollWheelZoom={!readOnly}
        dragging={!readOnly}
        doubleClickZoom={!readOnly}
        zoomControl={!readOnly}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewSync groups={groups} focus={effectiveFocus} />
        {extraMarker && (
          <Marker
            position={[extraMarker.lat, extraMarker.lng]}
            icon={buvardMarkerIcon}
            interactive={false}
          />
        )}
        {groups.map((g) => (
          <Marker key={`${g.lat},${g.lng}`} position={[g.lat, g.lng]} icon={buvardMarkerIcon}>
            {!readOnly && (
              <Popup maxWidth={280} minWidth={220}>
                <div className="space-y-2.5">
                  {/* Header : nom du lieu + compteur */}
                  <header className="space-y-0.5">
                    <p className="text-sm font-semibold leading-tight text-foreground">
                      {g.placeName ?? '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t('map.historyCount', { count: g.tastings.length })}
                    </p>
                  </header>

                  {/* Historique — du plus recent au plus ancien (read-only,
                      pas de Link vers detail qui n'existe plus). */}
                  <ul className="-mx-1 max-h-60 space-y-0 overflow-y-auto">
                    {g.tastings.map((tasting) => {
                      const thumb = tasting.photoUrls[0]
                      return (
                        <li
                          key={tasting.id}
                          className="flex items-start gap-2 rounded-md px-1.5 py-1.5 text-sm"
                        >
                          {/* Vignette photo : 1ere photo de la degustation,
                              fallback icone si pas de photo. */}
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <ImageOff className="h-4 w-4" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium leading-tight text-foreground">
                              {tasting.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {t(`types.${tasting.type}`)} ·{' '}
                              {new Intl.DateTimeFormat(i18n.language, {
                                dateStyle: 'medium',
                              }).format(new Date(tasting.createdAt))}
                            </p>
                          </div>
                          <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-primary">
                            <Star className="h-3 w-3 fill-primary" strokeWidth={0} />
                            <span className="text-xs font-semibold tabular-nums">
                              {tasting.rating.toFixed(1)}
                            </span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
