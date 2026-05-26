import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/lib/api/user'
import { ApiError } from '@/lib/api/client'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'

// Onboarding bloquant.
// Conditions pour devoir passer par /onboarding :
//   - user inexistant en DB (404)
//   - pas de username
//   - onboardingCompletedAt === null (CGU/privacy pas accepté)
export function RequireUsername() {
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const { t } = useTranslation()
  const me = useMe()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE

  if (me.isPending) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t('auth.loading')}
      </div>
    )
  }

  // 404 : user pas encore en DB (webhook pas encore passé / lazy-create côté backend)
  const isMissing =
    me.isError && me.error instanceof ApiError && me.error.status === 404

  const needsOnboarding =
    isMissing ||
    !me.data?.username ||
    !me.data?.onboardingCompletedAt

  const onOnboardingPage = location.pathname.endsWith('/onboarding')

  if (needsOnboarding) {
    if (onOnboardingPage) return <Outlet />
    return <Navigate to={`/${locale}/onboarding`} replace />
  }

  // Onboarding terminé : on n'autorise plus le retour sur /onboarding
  if (onOnboardingPage) {
    return <Navigate to={`/${locale}/feed`} replace />
  }

  return <Outlet />
}
