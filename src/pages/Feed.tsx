import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TastingCard } from '@/components/TastingCard'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import type { Tasting } from '@/lib/types'

export function FeedPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  // TODO: récupérer les dégustations depuis le backend
  const tastings: Tasting[] = []

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

      {tastings.length === 0 ? (
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
        <div className="space-y-3">
          {tastings.map((tasting) => (
            <TastingCard key={tasting.id} tasting={tasting} />
          ))}
        </div>
      )}
    </section>
  )
}
