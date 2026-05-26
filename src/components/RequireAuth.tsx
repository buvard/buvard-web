import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'

// Garde les routes privées : redirige vers /:lang/sign-in si non connecté.
export function RequireAuth() {
  const { isLoaded, isSignedIn } = useAuth()
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const { t } = useTranslation()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t('auth.loading')}
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to={`/${locale}/sign-in`}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}
