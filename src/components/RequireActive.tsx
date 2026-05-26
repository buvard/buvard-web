import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useMe } from '@/lib/api/user'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'

// Bloque l'accès aux routes app si l'utilisateur est suspended ou banned.
// La page /account-restricted reste accessible pour expliquer + signout.
export function RequireActive() {
  const me = useMe()
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE

  if (!me.data) return <Outlet />

  const isRestricted = me.data.status !== 'active'
  const onRestrictedPage = location.pathname.endsWith('/account-restricted')

  if (isRestricted && !onRestrictedPage) {
    return <Navigate to={`/${locale}/account-restricted`} replace />
  }

  if (!isRestricted && onRestrictedPage) {
    return <Navigate to={`/${locale}/feed`} replace />
  }

  return <Outlet />
}
