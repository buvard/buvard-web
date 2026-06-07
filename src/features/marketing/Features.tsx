import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, Compass, Map, Sparkles, Users, WineOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { MarketingShell } from './MarketingShell'

interface Feature {
  icon: typeof Camera
  titleKey: string
  descKey: string
}

const FEATURES: Feature[] = [
  { icon: Camera, titleKey: 'home.features.capture.title', descKey: 'home.features.capture.desc' },
  { icon: Users, titleKey: 'home.features.share.title', descKey: 'home.features.share.desc' },
  { icon: Compass, titleKey: 'home.features.discover.title', descKey: 'home.features.discover.desc' },
  { icon: Map, titleKey: 'features.map.title', descKey: 'features.map.desc' },
  { icon: Sparkles, titleKey: 'features.taste.title', descKey: 'features.taste.desc' },
  { icon: WineOff, titleKey: 'features.responsible.title', descKey: 'features.responsible.desc' },
]

export function FeaturesPage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()

  return (
    <MarketingShell>
      <header className="mb-12 max-w-2xl space-y-4 sm:mb-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {t('features.eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('features.title')}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('features.subtitle')}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
          <article
            key={titleKey}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 transition-colors hover:bg-card/70"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              {t(titleKey)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(descKey)}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button asChild size="lg" className="glow-primary">
          <Link to={localizedPath('/sign-up')}>{t('home.ctaPrimary')}</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link to={localizedPath('/download')}>{t('common.getApp')}</Link>
        </Button>
      </div>
    </MarketingShell>
  )
}
