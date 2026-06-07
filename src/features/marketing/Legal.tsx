import { useTranslation } from 'react-i18next'
import { MarketingShell } from './MarketingShell'

export function LegalPage() {
  const { t } = useTranslation()

  const sections: { titleKey: string; bodyKey: string }[] = [
    { titleKey: 'legal.terms.title', bodyKey: 'legal.terms.body' },
    { titleKey: 'legal.privacy.title', bodyKey: 'legal.privacy.body' },
    { titleKey: 'legal.cookies.title', bodyKey: 'legal.cookies.body' },
    { titleKey: 'legal.contact.title', bodyKey: 'legal.contact.body' },
  ]

  return (
    <MarketingShell>
      <header className="mb-12 max-w-2xl space-y-4 sm:mb-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {t('legal.eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('legal.title')}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('legal.subtitle')}
        </p>
      </header>

      <div className="grid max-w-3xl gap-10 sm:gap-12">
        {sections.map(({ titleKey, bodyKey }) => (
          <section key={titleKey} className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {t(titleKey)}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t(bodyKey)}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-16 text-xs text-muted-foreground/70">
        {t('legal.updated', { date: new Date().toLocaleDateString() })}
      </p>
    </MarketingShell>
  )
}
