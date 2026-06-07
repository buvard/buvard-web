import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TastingsMap, groupByPlace } from '@/components/TastingsMap'
import { DiscoverPlacesMap } from '@/components/DiscoverPlacesMap'
import { PlacesGrid, groupKey } from './PlacesGrid'
import { DiscoverPlacesList, discoverPlaceKey } from './DiscoverPlacesList'
import {
  flattenPages,
  useDiscoverPlaces,
  useFeed,
  useMyTastings,
} from '@/lib/api/tasting'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import type { DiscoveredPlace, Tasting } from '@/types'

type Scope = 'mine' | 'friends' | 'discover'
const SCOPES: Scope[] = ['mine', 'friends', 'discover']
const DEFAULT_SCOPE: Scope = 'mine'

function isScope(v: string | null): v is Scope {
  return v === 'mine' || v === 'friends' || v === 'discover'
}

// Filtre les tastings qui ont des coordonnees.
function geoFilter(tastings: Tasting[]): Tasting[] {
  return tastings.filter((tt) => tt.place?.lat !== undefined && tt.place?.lng !== undefined)
}

// Page /map — tableau de bord géo avec 3 sources :
//   - mine    : mes degustations (par defaut)
//   - friends : feed des comptes que je suis (tastings -> groupByPlace JS)
//   - discover: lieux pre-agreges via /tastings/discover/places (back-side)
// Layout : tabs > map en hero > grid de cards lieux scrollable.
export function MapPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const [searchParams, setSearchParams] = useSearchParams()

  const scope = isScope(searchParams.get('tab')) ? (searchParams.get('tab') as Scope) : DEFAULT_SCOPE

  const focusLat = searchParams.get('lat')
  const focusLng = searchParams.get('lng')
  const focus = useMemo(() => {
    if (!focusLat || !focusLng) return undefined
    const lat = parseFloat(focusLat)
    const lng = parseFloat(focusLng)
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined
  }, [focusLat, focusLng])

  // Tous les hooks tournent en parallele — react-query cache, cost negligeable apres le 1er.
  const mine = useMyTastings({ limit: 100 })
  const friends = useFeed({ limit: 50 })
  const discover = useDiscoverPlaces({ limit: 30 })

  function changeTab(next: Scope) {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    params.delete('lat')
    params.delete('lng')
    setSearchParams(params, { replace: true })
  }

  function focusCoords(lat: number, lng: number) {
    const params = new URLSearchParams(searchParams)
    params.set('lat', String(lat))
    params.set('lng', String(lng))
    setSearchParams(params, { replace: true })
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex shrink-0 items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label={t('common.back')}>
          <Link to={localizedPath('/feed')}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('map.title')}
          </h1>
          <ScopeStatsLine
            scope={scope}
            mine={mine.data?.data ?? []}
            friends={flattenPages(friends.data)}
            discoverPlaces={flattenPages<DiscoveredPlace>(discover.data)}
          />
        </div>
      </header>

      <Tabs
        value={scope}
        onValueChange={(v) => changeTab(v as Scope)}
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <TabsList className="w-full shrink-0">
          {SCOPES.map((s) => (
            <TabsTrigger key={s} value={s} className="flex-1">
              {t(`map.tabs.${s}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {scope === 'discover' ? (
          <DiscoverScopeView
            places={flattenPages<DiscoveredPlace>(discover.data)}
            isPending={discover.isPending}
            isError={discover.isError}
            focus={focus}
            onSelectPlace={(p) => focusCoords(p.lat, p.lng)}
          />
        ) : (
          <TastingsScopeView
            scope={scope}
            tastings={
              scope === 'mine' ? (mine.data?.data ?? []) : flattenPages(friends.data)
            }
            isPending={scope === 'mine' ? mine.isPending : friends.isPending}
            isError={scope === 'mine' ? mine.isError : friends.isError}
            focus={focus}
            onSelectGroup={(g) => focusCoords(g.lat, g.lng)}
          />
        )}
      </Tabs>
    </section>
  )
}

// ============================================================
// Sous-composant : ligne stats du header
// ============================================================
function ScopeStatsLine({
  scope,
  mine,
  friends,
  discoverPlaces,
}: {
  scope: Scope
  mine: Tasting[]
  friends: Tasting[]
  discoverPlaces: DiscoveredPlace[]
}) {
  const { t } = useTranslation()

  if (scope === 'discover') {
    const placesCount = discoverPlaces.length
    const tastingsCount = discoverPlaces.reduce((s, p) => s + p.tastingsCount, 0)
    return (
      <p className="text-xs text-muted-foreground">
        {t('map.places.count', { count: placesCount })}
        {' · '}
        {t('map.places.tastingsCount', { count: tastingsCount })}
      </p>
    )
  }

  const tastings = scope === 'mine' ? mine : friends
  const geo = geoFilter(tastings)
  const groups = groupByPlace(geo)
  return (
    <p className="text-xs text-muted-foreground">
      {t('map.places.count', { count: groups.length })}
      {' · '}
      {t('map.places.tastingsCount', { count: geo.length })}
    </p>
  )
}

// ============================================================
// Sous-composant : vue mine / friends (tastings groupes JS-side)
// ============================================================
function TastingsScopeView({
  scope,
  tastings,
  isPending,
  isError,
  focus,
  onSelectGroup,
}: {
  scope: Exclude<Scope, 'discover'>
  tastings: Tasting[]
  isPending: boolean
  isError: boolean
  focus: { lat: number; lng: number } | undefined
  onSelectGroup: (group: { lat: number; lng: number }) => void
}) {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()

  const geoTastings = useMemo(() => geoFilter(tastings), [tastings])
  const groups = useMemo(() => groupByPlace(geoTastings), [geoTastings])

  const activeKey = useMemo(() => {
    if (!focus) return undefined
    const match = groups.find((g) => g.lat === focus.lat && g.lng === focus.lng)
    return match ? groupKey(match) : undefined
  }, [focus, groups])

  const isEmpty = !isPending && !isError && geoTastings.length === 0

  return (
    <>
      <div className="h-[36vh] shrink-0 sm:h-[44vh]">
        {isPending ? (
          <Skeleton className="h-full w-full rounded-2xl" />
        ) : isError ? (
          <MapError />
        ) : isEmpty ? (
          <MapEmpty scope={scope} />
        ) : (
          <TastingsMap tastings={geoTastings} focus={focus} className="h-full w-full" />
        )}
      </div>

      {!isEmpty && !isPending && !isError && groups.length > 0 && (
        <section className="flex min-h-0 flex-1 flex-col gap-2">
          <header className="flex shrink-0 items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('map.places.title')}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t('map.places.count', { count: groups.length })}
            </span>
          </header>
          <PlacesGrid
            groups={groups}
            activeKey={activeKey}
            onSelect={onSelectGroup}
            className="min-h-0 flex-1"
          />
        </section>
      )}
    </>
  )

  // Helpers de rendu : declares apres le return pour rester lisibles malgre la
  // double imbrication d'etats (pending/error/empty/ok).
  function MapEmpty({ scope }: { scope: Exclude<Scope, 'discover'> }) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 text-center">
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
    )
  }
}

// ============================================================
// Sous-composant : vue discover (lieux pre-agreges back-side)
// ============================================================
function DiscoverScopeView({
  places,
  isPending,
  isError,
  focus,
  onSelectPlace,
}: {
  places: DiscoveredPlace[]
  isPending: boolean
  isError: boolean
  focus: { lat: number; lng: number } | undefined
  onSelectPlace: (place: DiscoveredPlace) => void
}) {
  const { t } = useTranslation()

  const activeKey = useMemo(() => {
    if (!focus) return undefined
    const match = places.find((p) => p.lat === focus.lat && p.lng === focus.lng)
    return match ? discoverPlaceKey(match) : undefined
  }, [focus, places])

  const isEmpty = !isPending && !isError && places.length === 0

  return (
    <>
      <div className="h-[36vh] shrink-0 sm:h-[44vh]">
        {isPending ? (
          <Skeleton className="h-full w-full rounded-2xl" />
        ) : isError ? (
          <MapError />
        ) : isEmpty ? (
          <DiscoverEmpty />
        ) : (
          <DiscoverPlacesMap places={places} focus={focus} className="h-full w-full" />
        )}
      </div>

      {!isEmpty && !isPending && !isError && places.length > 0 && (
        <section className="flex min-h-0 flex-1 flex-col gap-2">
          <header className="flex shrink-0 items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('map.discover.title')}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t('map.places.count', { count: places.length })}
            </span>
          </header>
          <DiscoverPlacesList
            places={places}
            activeKey={activeKey}
            onSelect={onSelectPlace}
            className="min-h-0 flex-1"
          />
        </section>
      )}
    </>
  )

  function DiscoverEmpty() {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{t('map.empty.discover')}</p>
          <p className="text-xs text-muted-foreground">{t('map.emptyHint')}</p>
        </div>
      </div>
    )
  }
}

// Erreur generique pour les 2 vues.
function MapError() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-6 text-center">
      <p className="text-sm font-medium text-destructive">{t('map.error')}</p>
    </div>
  )
}
