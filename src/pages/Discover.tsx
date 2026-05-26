import { useTranslation } from 'react-i18next'
import { TastingCard } from '@/components/TastingCard'
import type { Tasting } from '@/lib/types'

export function DiscoverPage() {
  const { t } = useTranslation()
  // TODO: récupérer le trending depuis le backend
  const trending: Tasting[] = []

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

      {trending.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t('discover.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trending.map((tasting) => (
            <TastingCard key={tasting.id} tasting={tasting} />
          ))}
        </div>
      )}
    </section>
  )
}
