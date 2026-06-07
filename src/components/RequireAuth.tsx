import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'
import { useSession } from '@/lib/session'

// Garde les routes privees : redirige vers /:lang/sign-in si non connecte.
export function RequireAuth() {
  const { data: session, isPending } = useSession()
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const { t } = useTranslation()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t('auth.loading')}
      </div>
    )
  }

  if (!session) {
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
