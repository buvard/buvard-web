import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TastingCard } from '@/components/TastingCard'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { flattenPages, useFeed } from '@/lib/api/tasting'
import type { TastingType } from '@/types'
import { cn } from '@/lib/utils'

// V1 : on n'expose qu'un sous-ensemble des types comme chips visibles (les
// plus repandus). Les autres restent disponibles via le filtre type cote API
// mais la nav reste lisible sur mobile.
const VISIBLE_FILTER_TYPES: TastingType[] = [
  'wine',
  'beer',
  'whisky',
  'rum',
  'gin',
  'champagne',
]

export function FeedPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const [filterType, setFilterType] = useState<TastingType | null>(null)
  const params = filterType ? { type: filterType } : {}
  const feed = useFeed(params)
  const tastings = flattenPages(feed.data)

  return (
    <section className="space-y-5">
      <FeedHeader />
      <FilterChips selected={filterType} onSelect={setFilterType} />

      {feed.isPending ? (
        <FeedSkeleton />
      ) : feed.isError ? (
        <ErrorState message={t('feed.error')} />
      ) : tastings.length === 0 ? (
        <EmptyState
          filtered={filterType !== null}
          actionHref={localizedPath('/add')}
        />
      ) : (
        <div className="space-y-4">
          {tastings.map((tasting) => (
            <TastingCard key={tasting.id} tasting={tasting} />
          ))}
          {feed.hasNextPage && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void feed.fetchNextPage()}
                disabled={feed.isFetchingNextPage}
              >
                {feed.isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('common.loadMore')
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function FeedHeader() {
  const { t } = useTranslation()
  return (
    <header className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Wine className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('feed.title')}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t('feed.subtitle')}
        </p>
      </div>
    </header>
  )
}

// Chips de filtre par type — "Tout" en premier, puis les types visibles.
// Scroll horizontal sur mobile pour ne pas casser la mise en page.
function FilterChips({
  selected,
  onSelect,
}: {
  selected: TastingType | null
  onSelect: (type: TastingType | null) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <div className="flex w-max items-center gap-2 pb-1">
        <FilterChip
          active={selected === null}
          onClick={() => onSelect(null)}
          label={t('feed.filterAll')}
        />
        {VISIBLE_FILTER_TYPES.map((type) => (
          <FilterChip
            key={type}
            active={selected === type}
            onClick={() => onSelect(type)}
            label={t(`types.${type}`)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

// Skeleton qui mime la forme reelle d'une TastingCard (avatar + 2 lignes texte +
// image) pour eviter le flash entre le placeholder generique et la vraie carte.
function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-border bg-card/30 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-card" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-card" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-card" />
            </div>
          </div>
          <div className="h-40 animate-pulse rounded-lg bg-card" />
          <div className="space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-card" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-card" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  filtered,
  actionHref,
}: {
  filtered: boolean
  actionHref: string
}) {
  const { t } = useTranslation()
  // Si l'utilisateur a applique un filtre, message different (pas de CTA add).
  if (filtered) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/20 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          {t('feed.noResultsForFilter')}
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/20 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Wine className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <p className="text-sm font-medium text-foreground">{t('feed.empty')}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t('feed.emptyHint')}</p>
      <Button asChild className="mt-4 glow-primary" size="sm">
        <Link to={actionHref}>
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
          {t('feed.emptyAction')}
        </Link>
      </Button>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-10 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
    </div>
  )
}
