import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'

export function HomePage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()

  return (
    <section className="flex flex-col gap-10 pt-12 pb-8">
      {/* Petit "eyebrow" avec un point pulse bordeaux */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t('app.name')}
        </p>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          {t('home.title')}
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          {t('home.subtitle')}
        </p>
      </div>

      <SignedOut>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="glow-primary sm:w-auto"
          >
            <Link to={localizedPath('/sign-up')}>{t('auth.signUp')}</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="sm:w-auto">
            <Link to={localizedPath('/sign-in')}>{t('auth.signIn')}</Link>
          </Button>
        </div>
      </SignedOut>

      <SignedIn>
        <div>
          <Button asChild size="lg" className="glow-primary">
            <Link to={localizedPath('/feed')}>{t('home.cta')}</Link>
          </Button>
        </div>
      </SignedIn>
    </section>
  )
}
