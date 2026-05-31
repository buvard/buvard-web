import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TastingsMap } from '@/components/TastingsMap'
import {
  flattenPages,
  useDiscover,
  useFeed,
  useMyTastings,
} from '@/lib/api/tasting'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import type { Tasting } from '@/types'

type Scope = 'mine' | 'friends' | 'discover'
const SCOPES: Scope[] = ['mine', 'friends', 'discover']

function isScope(v: string | null): v is Scope {
  return v === 'mine' || v === 'friends' || v === 'discover'
}

// Filtre les tastings qui ont des coordonnees.
function geo(tastings: Tasting[]): Tasting[] {
  return tastings.filter((tt) => tt.place?.lat !== undefined && tt.place?.lng !== undefined)
}

// Page /map — tableau de bord géo avec 3 sources :
//   - mine    : mes degustations (lien depuis profil)
//   - friends : feed des comptes que je suis (lien depuis bottom-nav par defaut)
//   - discover: trending public (exploration)
// Supporte ?lat=&lng= pour centrer la carte sur des coords precises (ex: lien
// depuis une TastingCard).
export function MapPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const [searchParams, setSearchParams] = useSearchParams()

  const scope = isScope(searchParams.get('tab')) ? (searchParams.get('tab') as Scope) : 'friends'

  const focusLat = searchParams.get('lat')
  const focusLng = searchParams.get('lng')
  const focus = useMemo(() => {
    if (!focusLat || !focusLng) return undefined
    const lat = parseFloat(focusLat)
    const lng = parseFloat(focusLng)
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined
  }, [focusLat, focusLng])

  // Les 3 hooks tournent en parallele — react-query cache, cost negligeable apres le 1er.
  const mine = useMyTastings({ limit: 100 })
  const friends = useFeed({ limit: 50 })
  const discover = useDiscover({ limit: 50 })

  const source =
    scope === 'mine'
      ? { data: mine.data?.data ?? [], isPending: mine.isPending, isError: mine.isError }
      : scope === 'friends'
        ? {
            data: flattenPages(friends.data),
            isPending: friends.isPending,
            isError: friends.isError,
          }
        : {
            data: flattenPages(discover.data),
            isPending: discover.isPending,
            isError: discover.isError,
          }

  const geoTastings = useMemo(() => geo(source.data), [source.data])

  function changeTab(next: Scope) {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    // Si on switch de tab, le focus geo precedent n'a plus de sens.
    params.delete('lat')
    params.delete('lng')
    setSearchParams(params, { replace: true })
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label={t('common.back')}>
            <Link to={localizedPath('/feed')}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t('map.title')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('map.subtitle', { count: geoTastings.length })}
            </p>
          </div>
        </div>
      </header>

      <Tabs value={scope} onValueChange={(v) => changeTab(v as Scope)} className="space-y-4">
        <TabsList className="w-full">
          {SCOPES.map((s) => (
            <TabsTrigger key={s} value={s} className="flex-1">
              {t(`map.tabs.${s}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {source.isPending ? (
          <Skeleton className="aspect-square w-full rounded-2xl sm:aspect-[16/10]" />
        ) : source.isError ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-12 text-center">
            <p className="text-sm font-medium text-destructive">{t('map.error')}</p>
          </div>
        ) : geoTastings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t(`map.empty.${scope}`)}</p>
              <p className="text-xs text-muted-foreground">{t('map.emptyHint')}</p>
            </div>
            {scope === 'mine' && (
              <Button asChild size="sm" className="mt-2">
                <Link to={localizedPath('/add')}>{t('nav.add')}</Link>
              </Button>
            )}
          </div>
        ) : (
          <TastingsMap
            tastings={geoTastings}
            focus={focus}
            className="aspect-square sm:aspect-[16/10]"
          />
        )}
      </Tabs>
    </section>
  )
}
