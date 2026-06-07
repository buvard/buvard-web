import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { MarketingShell } from './MarketingShell'

export function AboutPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()

  const sections: { titleKey: string; bodyKey: string }[] = [
    { titleKey: 'about.mission.title', bodyKey: 'about.mission.body' },
    { titleKey: 'about.values.title', bodyKey: 'about.values.body' },
    { titleKey: 'about.team.title', bodyKey: 'about.team.body' },
  ]

  return (
    <MarketingShell>
      <header className="mb-12 max-w-2xl space-y-4 sm:mb-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {t('about.eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('about.title')}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('about.subtitle')}
        </p>
      </header>

      <div className="grid gap-10 sm:gap-12">
        {sections.map(({ titleKey, bodyKey }) => (
          <section key={titleKey} className="max-w-2xl space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {t(titleKey)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t(bodyKey)}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-16">
        <Button asChild size="lg" className="glow-primary">
          <Link to={localizedPath('/sign-up')}>{t('home.ctaPrimary')}</Link>
        </Button>
      </div>
    </MarketingShell>
  )
}
