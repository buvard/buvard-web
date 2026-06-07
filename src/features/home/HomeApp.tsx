import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useSession } from '@/lib/session'

// Home affichee dans l'app installee (mobile natif Capacitor ou desktop Electron).
// Pas de pitch marketing : si l'utilisateur est connecte on saute direct au feed,
// sinon on propose une connexion / inscription epuree.
export function HomeApp() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t('auth.loading')}
      </div>
    )
  }

  if (session) {
    return <Navigate to={localizedPath('/feed')} replace />
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-10 py-12 text-center">
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t('app.name')}
          </p>
        </div>
        <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          {t('home.title')}
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t('home.subtitle')}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button asChild size="lg" className="glow-primary">
          <Link to={localizedPath('/sign-up')}>{t('home.ctaPrimary')}</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link to={localizedPath('/sign-in')}>{t('auth.signIn')}</Link>
        </Button>
      </div>
    </div>
  )
}
