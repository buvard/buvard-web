import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Camera, Compass, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useSession } from '@/lib/session'

interface FeatureTeaser {
  icon: typeof Camera
  titleKey: string
  descKey: string
}

// Trois teasers seulement : la liste complete est sur /features.
const FEATURE_TEASERS: FeatureTeaser[] = [
  { icon: Camera, titleKey: 'home.features.capture.title', descKey: 'home.features.capture.desc' },
  { icon: Users, titleKey: 'home.features.share.title', descKey: 'home.features.share.desc' },
  { icon: Compass, titleKey: 'home.features.discover.title', descKey: 'home.features.discover.desc' },
]

// Home publique cote web. Volontairement courte : hero + teaser features +
// CTA. Le detail des features, la page download, l'about et le legal vivent sur
// leurs propres pages (navbar + footer marketing partages).
export function HomeWeb() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: session } = useSession()
  const isSignedIn = !!session

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 py-12 sm:gap-32 sm:py-20">
      {/* === HERO === */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t('app.name')}
          </p>
        </div>

        <div className="space-y-5">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t('home.title')}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('home.subtitle')}
          </p>
        </div>

        {isSignedIn ? (
          <div>
            <Button asChild size="lg" className="glow-primary">
              <Link to={localizedPath('/feed')}>{t('home.cta')}</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className="glow-primary sm:w-auto">
              <Link to={localizedPath('/sign-up')}>{t('home.ctaPrimary')}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="sm:w-auto">
              <Link to={localizedPath('/sign-in')}>{t('auth.signIn')}</Link>
            </Button>
          </div>
        )}
      </section>

      {/* === TEASER FEATURES === */}
      <section className="space-y-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {t('home.features.eyebrow')}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t('home.features.title')}
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="self-start gap-1.5 sm:self-auto">
            <Link to={localizedPath('/features')}>
              {t('home.features.seeAll')}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {FEATURE_TEASERS.map(({ icon: Icon, titleKey, descKey }) => (
            <article
              key={titleKey}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 transition-colors hover:bg-card/70"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                {t(titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(descKey)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* === CTA BOTTOM === */}
      {!isSignedIn && (
        <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/30 to-transparent p-8 sm:p-12">
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                {t('home.ctaBottom.eyebrow')}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {t('home.ctaBottom.title')}
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {t('home.ctaBottom.subtitle')}
              </p>
            </div>
            <Button asChild size="lg" className="glow-primary shrink-0">
              <Link to={localizedPath('/sign-up')}>{t('home.ctaPrimary')}</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
