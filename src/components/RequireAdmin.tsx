import { Navigate, Outlet, useParams } from 'react-router-dom'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'
import { useMe } from '@/lib/api/user'

// Garde les routes admin : redirige vers /:lang/feed si role !== admin.
// A monter au-dessus de Outlet, apres RequireAuth + RequireActive
// (cf router.tsx).
export function RequireAdmin() {
  const me = useMe()
  const { lang } = useParams<{ lang: string }>()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE

  if (me.isPending) return null
  if (!me.data || me.data.role !== 'admin') {
    return <Navigate to={`/${locale}/feed`} replace />
  }
  return <Outlet />
}

// Hook utilitaire : true si l'utilisateur connecte a role admin.
// Utile pour afficher conditionnellement le lien "Admin" dans Settings.
export function useIsAdmin(): boolean {
  const me = useMe()
  return me.data?.role === 'admin'
}
