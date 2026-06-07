import { useTranslation } from 'react-i18next'
import { ImageOff, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarkerGroup } from '@/components/TastingsMap'

interface Props {
  groups: MarkerGroup[]
  // Coords du groupe actuellement focus (visuellement mis en avant).
  activeKey?: string
  onSelect: (group: MarkerGroup) => void
  className?: string
}

// Cle unique d'un groupe — partage la convention placeId fallback coords.
// eslint-disable-next-line react-refresh/only-export-components
export function groupKey(g: MarkerGroup): string {
  const placeId = g.tastings[0]?.place?.placeId
  return placeId ?? `${g.lat.toFixed(4)}:${g.lng.toFixed(4)}`
}

// Grid de cards "lieux" affichee sous la carte. Chaque card synthetise un
// lieu (= 1 marker sur la map) et permet de centrer la map dessus au clic.
export function PlacesGrid({ groups, activeKey, onSelect, className }: Props) {
  const { t, i18n } = useTranslation()

  if (groups.length === 0) return null

  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  return (
    <ul
      className={cn(
        // Scroll interne : la hauteur est contrainte par le flex parent
        // (cf MapPage : flex-1 min-h-0). pr-1 evite que la scrollbar mange
        // du contenu.
        'grid gap-3 overflow-y-auto pr-1 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3',
        className,
      )}
    >
      {groups.map((g) => {
        const last = g.tastings[0]
        const thumb = last?.photoUrls[0]
        const key = groupKey(g)
        const isActive = key === activeKey
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSelect(g)}
              className={cn(
                'group flex w-full flex-col overflow-hidden rounded-2xl border bg-card/40 text-left transition-all hover:bg-card/70',
                isActive
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-border',
              )}
            >
              {/* Vignette : 1ere photo de la degustation la + recente du lieu */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                )}
                {/* Badge compteur en overlay */}
                <span className="absolute right-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
                  {t('map.places.tastingsCount', { count: g.tastings.length })}
                </span>
              </div>

              <div className="flex flex-col gap-1 px-3 py-3">
                <div className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                  <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                    {g.placeName ?? t('map.places.unnamed')}
                  </p>
                </div>
                {last && (
                  <p className="text-xs text-muted-foreground">
                    {t('map.places.lastVisit', {
                      date: dateFmt.format(new Date(last.createdAt)),
                    })}
                  </p>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
