import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import { ImageOff, Star } from 'lucide-react'
import { buvardMarkerIcon } from '@/lib/leafletIcons'
import { cn } from '@/lib/utils'
import type { DiscoveredPlace } from '@/types'

// Centre par defaut si aucun lieu (France metropolitaine).
const DEFAULT_CENTER: LatLngExpression = [46.6, 2.3]
const DEFAULT_ZOOM = 5
const SINGLE_POINT_ZOOM = 14
const FOCUS_ZOOM = 16

function computeView(
  places: DiscoveredPlace[],
  focus: { lat: number; lng: number } | undefined,
): {
  center: LatLngExpression
  zoom: number
  bounds?: LatLngBoundsExpression
} {
  if (focus) return { center: [focus.lat, focus.lng], zoom: FOCUS_ZOOM }
  if (places.length === 0) return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
  if (places.length === 1) {
    return { center: [places[0].lat, places[0].lng], zoom: SINGLE_POINT_ZOOM }
  }
  const lats = places.map((p) => p.lat)
  const lngs = places.map((p) => p.lng)
  return {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    bounds: [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as LatLngBoundsExpression,
  }
}

// Recalcule la view a chaque changement de places/focus apres le 1er render.
function ViewSync({
  places,
  focus,
}: {
  places: DiscoveredPlace[]
  focus: { lat: number; lng: number } | undefined
}) {
  const map = useMap()
  const view = useMemo(() => computeView(places, focus), [places, focus])
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
  places: DiscoveredPlace[]
  focus?: { lat: number; lng: number }
  className?: string
}

// Carte de l'onglet "Decouvrir" : popups synthetiques (stats du lieu seulement,
// pas d'historique tasting puisqu'on a pas les degustations individuelles).
export function DiscoverPlacesMap({ places, focus, className }: Props) {
  const { t, i18n } = useTranslation()
  const initial = useMemo(() => computeView(places, focus), [places, focus])
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-border', className)}>
      <MapContainer
        center={initial.center}
        zoom={initial.zoom}
        bounds={initial.bounds}
        scrollWheelZoom
        dragging
        doubleClickZoom
        zoomControl
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewSync places={places} focus={focus} />
        {places.map((p) => (
          <Marker
            key={`${p.lat},${p.lng}`}
            position={[p.lat, p.lng]}
            icon={buvardMarkerIcon}
          >
            <Popup maxWidth={260} minWidth={220}>
              <div className="space-y-2.5">
                {/* Cover photo en banner */}
                {p.coverPhotoUrl ? (
                  <div className="-mx-3 -mt-2 mb-1 aspect-video overflow-hidden">
                    <img
                      src={p.coverPhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="-mx-3 -mt-2 mb-1 flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                    <ImageOff className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                )}

                <header className="space-y-1">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5 text-primary">
                      <Star className="h-3 w-3 fill-primary" strokeWidth={0} />
                      <span className="text-xs font-semibold tabular-nums">
                        {p.averageRating.toFixed(1)}
                      </span>
                    </span>
                    <span>·</span>
                    <span>{t('map.discover.tastingsCount', { count: p.tastingsCount })}</span>
                  </div>
                </header>

                {p.sampleTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.sampleTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary"
                      >
                        {t(`types.${type}`)}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  {t('map.discover.lastTasting', {
                    date: dateFmt.format(new Date(p.lastTastingAt)),
                  })}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
