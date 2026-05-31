import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TastingCard } from '@/components/TastingCard'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { flattenPages, useFeed } from '@/lib/api/tasting'

export function FeedPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed()
  const tastings = flattenPages(data)

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('feed.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('feed.subtitle')}
        </p>
      </header>

      {isPending ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-card/30"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">
            {t('feed.error')}
          </p>
        </div>
      ) : tastings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {t('feed.empty')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('feed.emptyHint')}
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to={localizedPath('/add')}>{t('nav.add')}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tastings.map((tasting) => (
            <TastingCard key={tasting.id} tasting={tasting} />
          ))}
          {hasNextPage && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
