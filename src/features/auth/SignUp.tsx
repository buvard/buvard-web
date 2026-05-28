import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'
import { authClient } from '@/lib/auth-client'
import { GoogleIcon } from './GoogleIcon'

// Page d'inscription email + password + Google.
export function SignUpPage() {
  const { t } = useTranslation()
  const { lang } = useParams<{ lang: string }>()
  const navigate = useNavigate()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE
  const callbackPath = `/${locale}/feed`

  const [name, setName] = useState('')
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
      const { error: err } = await authClient.signUp.email({ email, password, name })
      if (err) {
        setError(err.message ?? t('auth.errorGeneric'))
        return
      }
      navigate(callbackPath, { replace: true })
    } catch {
      setError(t('auth.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: callbackPath,
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
          {t('auth.signUp')}
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
          <Label htmlFor="name">{t('auth.name')}</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('auth.namePlaceholder')}
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
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
          {submitting ? t('auth.submittingSignUp') : t('auth.submitSignUp')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.haveAccount')}{' '}
        <Link
          to={`/${locale}/sign-in`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </section>
  )
}
