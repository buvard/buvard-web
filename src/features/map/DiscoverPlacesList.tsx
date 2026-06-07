import { useTranslation } from 'react-i18next'
import { ImageOff, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiscoveredPlace } from '@/types'

interface Props {
  places: DiscoveredPlace[]
  // Cle du lieu actuellement focus (highlight visuel).
  activeKey?: string
  onSelect: (place: DiscoveredPlace) => void
  className?: string
}

// Cle d'un lieu agrege : meme convention que cote back (placeId fallback coords).
// eslint-disable-next-line react-refresh/only-export-components
export function discoverPlaceKey(p: DiscoveredPlace): string {
  return p.placeId ?? `${p.lat.toFixed(4)}:${p.lng.toFixed(4)}`
}

// Liste verticale des lieux decouverts — privilegie l'info adresse (nom +
// stats textuelles) sur le visuel. Les photos sont gardees en vignette
// compacte a gauche pour identifier le lieu, mais ne dominent plus la card.
export function DiscoverPlacesList({ places, activeKey, onSelect, className }: Props) {
  const { t, i18n } = useTranslation()

  if (places.length === 0) return null

  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  return (
    <ul
      className={cn(
        'flex flex-col gap-1.5 overflow-y-auto pr-1',
        className,
      )}
    >
      {places.map((p) => {
        const key = discoverPlaceKey(p)
        const isActive = key === activeKey
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border bg-card/40 px-3 py-2.5 text-left transition-colors hover:bg-card/70',
                isActive
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-border',
              )}
            >
              {/* Vignette compacte : info secondaire pour identifier le lieu */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {p.coverPhotoUrl ? (
                  <img
                    src={p.coverPhotoUrl}
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

              {/* Bloc principal : nom + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                  <p className="line-clamp-1 text-sm font-semibold leading-tight text-foreground">
                    {p.name}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('map.discover.tastingsCount', { count: p.tastingsCount })}
                  {' · '}
                  {dateFmt.format(new Date(p.lastTastingAt))}
                </p>
              </div>

              {/* Rating a droite */}
              <span className="flex shrink-0 items-center gap-0.5 text-primary">
                <Star className="h-3.5 w-3.5 fill-primary" strokeWidth={0} />
                <span className="text-sm font-semibold tabular-nums">
                  {p.averageRating.toFixed(1)}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
