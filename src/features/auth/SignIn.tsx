import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'
import { authClient } from '@/lib/auth-client'
import { GoogleIcon } from './GoogleIcon'

// Page de connexion email + password + Google.
// Better Auth est headless, on construit toute l'UI ici.
export function SignInPage() {
  const { t } = useTranslation()
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE
  // Path relatif pour react-router navigate() (cf. SignUp.tsx pour le pourquoi).
  const feedPath = `/${locale}/feed`
  // URL absolue pour callback OAuth Google : en natif, le plugin capacitorClient
  // transforme un callbackURL relatif en deep link (`app.buvard[.local|.staging]://...`).
  // En web, Better Auth resout les relatifs contre son baseURL API → on l'enverrait
  // sur `api-staging.buvard.app/fr/feed` qui est 404. Du coup en web on passe l'URL
  // absolue front (origin courant).
  const oauthCallbackURL = Capacitor.isNativePlatform()
    ? feedPath
    : `${window.location.origin}${feedPath}`

  // Destination apres login : prend l'origine si on a ete redirige par RequireAuth
  // (path relatif), sinon /feed par defaut.
  const from = (location.state as { from?: string } | null)?.from ?? feedPath

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: err } = await authClient.signIn.email({ email, password })
      if (err) {
        console.error('[SignIn] better-auth error', err)
        setError(err.message ?? t('auth.errorGeneric'))
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      console.error('[SignIn] thrown exception', err)
      setError(t('auth.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    try {
      // Better Auth gere la redirection : web -> redirect classique, natif ->
      // ouverture du navigateur in-app + retour deep link via le plugin Capacitor.
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: oauthCallbackURL,
      })
    } catch {
      setError(t('auth.errorGeneric'))
      setGoogleLoading(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 pt-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('auth.signIn')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
      </header>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={googleLoading || submitting}
        className="h-10 w-full gap-2"
      >
        <GoogleIcon className="h-4 w-4" />
        {t('auth.google')}
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>{t('auth.orDivider')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting || googleLoading} className="glow-primary">
          {submitting ? t('auth.submittingSignIn') : t('auth.submitSignIn')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Link
          to={`/${locale}/sign-up`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('auth.signUp')}
        </Link>
      </p>
    </section>
  )
}
