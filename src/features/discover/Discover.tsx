import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TastingCard } from '@/components/TastingCard'
import { flattenPages, useDiscover } from '@/lib/api/tasting'

export function DiscoverPage() {
  const { t } = useTranslation()
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useDiscover()
  const trending = flattenPages(data)

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('discover.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('discover.subtitle')}
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
            {t('discover.error')}
          </p>
        </div>
      ) : trending.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t('discover.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trending.map((tasting) => (
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
