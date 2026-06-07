import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { AppLayout } from '@/components/AppLayout'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { RequireAuth } from '@/components/RequireAuth'
import { RequireUsername } from '@/components/RequireUsername'
import { RequireActive } from '@/components/RequireActive'

// Toutes les pages sont lazy-loaded pour reduire le bundle initial. React
// Router resoud chaque module a la 1ere navigation. Le fallback Suspense est
// gere au niveau de AppLayout (cf composant) — pour les routes fullscreen sans
// AppLayout, on wrap explicitement avec <PageSuspense> ci-dessous.
//
// On garde une seule fonction utilitaire pour normaliser le `default: ...`
// attendu par React.lazy (toutes nos pages sont des exports nommes).
// Le contrainte sur T (ComponentType<unknown>) etait trop stricte : elle
// rejetait les composants typed avec props (AddPage, RelationsPage). On
// accepte n'importe quel record dont la valeur est un FunctionComponent —
// `unknown` couvre cas avec ou sans props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyPage<T extends Record<string, React.ComponentType<any>>>(
  loader: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(async () => {
    const mod = await loader()
    return { default: mod[exportName] }
  })
}

const HomePage = lazyPage(() => import('@/features/home/Home'), 'HomePage')
const SignInPage = lazyPage(() => import('@/features/auth/SignIn'), 'SignInPage')
const SignUpPage = lazyPage(() => import('@/features/auth/SignUp'), 'SignUpPage')
const OnboardingPage = lazyPage(() => import('@/features/auth/Onboarding'), 'OnboardingPage')
const AccountRestrictedPage = lazyPage(
  () => import('@/features/auth/AccountRestricted'),
  'AccountRestrictedPage',
)
const FeedPage = lazyPage(() => import('@/features/feed/Feed'), 'FeedPage')
const DiscoverPage = lazyPage(() => import('@/features/discover/Discover'), 'DiscoverPage')
const AddPage = lazyPage(() => import('@/features/add/Add'), 'AddPage')
const CameraCapturePage = lazyPage(
  () => import('@/features/add/CameraCapturePage'),
  'CameraCapturePage',
)
const TastingEditPage = lazyPage(
  () => import('@/features/tasting/TastingEdit'),
  'TastingEditPage',
)
const TastingDetailPage = lazyPage(
  () => import('@/features/tasting/TastingDetail'),
  'TastingDetailPage',
)
const MapPage = lazyPage(() => import('@/features/map/Map'), 'MapPage')
const ProfilePage = lazyPage(() => import('@/features/profile/Profile'), 'ProfilePage')
const SettingsPage = lazyPage(() => import('@/features/settings/Settings'), 'SettingsPage')
const SettingsProfilePage = lazyPage(
  () => import('@/features/settings/Profile'),
  'SettingsProfilePage',
)
const SettingsAppearancePage = lazyPage(
  () => import('@/features/settings/Appearance'),
  'SettingsAppearancePage',
)
const SettingsLanguagePage = lazyPage(
  () => import('@/features/settings/Language'),
  'SettingsLanguagePage',
)
const SettingsRegionalPage = lazyPage(
  () => import('@/features/settings/Regional'),
  'SettingsRegionalPage',
)
const SettingsNotificationsPage = lazyPage(
  () => import('@/features/settings/Notifications'),
  'SettingsNotificationsPage',
)
const SettingsPrivacyPage = lazyPage(
  () => import('@/features/settings/Privacy'),
  'SettingsPrivacyPage',
)
const SettingsAccountPage = lazyPage(
  () => import('@/features/settings/Account'),
  'SettingsAccountPage',
)
const SettingsLegalPage = lazyPage(
  () => import('@/features/settings/Legal'),
  'SettingsLegalPage',
)
const SettingsLevelsPage = lazyPage(
  () => import('@/features/settings/Levels'),
  'SettingsLevelsPage',
)
const BlockedUsersPage = lazyPage(
  () => import('@/features/profile/BlockedUsers'),
  'BlockedUsersPage',
)
const PublicProfilePage = lazyPage(
  () => import('@/features/profile/PublicProfile'),
  'PublicProfilePage',
)
const RelationsPage = lazyPage(() => import('@/features/profile/Relations'), 'RelationsPage')
const NotFoundPage = lazyPage(() => import('@/features/misc/NotFound'), 'NotFoundPage')
const FeaturesPage = lazyPage(() => import('@/features/marketing/Features'), 'FeaturesPage')
const DownloadPage = lazyPage(() => import('@/features/marketing/Download'), 'DownloadPage')
const AboutPage = lazyPage(() => import('@/features/marketing/About'), 'AboutPage')
const LegalPage = lazyPage(() => import('@/features/marketing/Legal'), 'LegalPage')

// Fallback minimal pendant le chunk loading — affiche rien (le swap entre
// pages est generalement instantane avec un network correct). On evite un
// spinner qui flasherait.
function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={`/${DEFAULT_LOCALE}`} replace />,
  },
  {
    path: '/:lang',
    element: <LocaleProvider />,
    children: [
      // Routes fullscreen (sans AppLayout sidebar/bottom-nav) — declarees AVANT
      // l'AppLayout pour matcher en priorite. On wrap individuellement dans
      // Suspense car pas d'AppLayout pour heberger un boundary commun.
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireUsername />,
            children: [
              {
                element: <RequireActive />,
                children: [
                  {
                    path: 'add/capture',
                    element: (
                      <PageSuspense>
                        <CameraCapturePage />
                      </PageSuspense>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
      // Pages publiques marketing — layout dedie (navbar marketing + footer)
      // et redirige sur la home si on est dans le shell app (Capacitor/Electron),
      // ces pages n'ont de sens qu'en navigation web.
      {
        element: <MarketingLayout />,
        children: [
          { path: 'features', element: <FeaturesPage /> },
          { path: 'download', element: <DownloadPage /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'legal', element: <LegalPage /> },
        ],
      },
      {
        // AppLayout heberge le Suspense pour toutes ses pages enfants via
        // <Outlet /> wrappe en interne (cf AppLayout.tsx).
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'sign-in/*', element: <SignInPage /> },
          { path: 'sign-up/*', element: <SignUpPage /> },
          { path: 'u/:username', element: <PublicProfilePage /> },
          {
            path: 'u/:username/followers',
            element: <RelationsPage mode="followers" />,
          },
          {
            path: 'u/:username/following',
            element: <RelationsPage mode="following" />,
          },
          {
            element: <RequireAuth />,
            children: [
              {
                element: <RequireUsername />,
                children: [
                  { path: 'onboarding', element: <OnboardingPage /> },
                  {
                    element: <RequireActive />,
                    children: [
                      {
                        path: 'account-restricted',
                        element: <AccountRestrictedPage />,
                      },
                      { path: 'feed', element: <FeedPage /> },
                      { path: 'discover', element: <DiscoverPage /> },
                      { path: 'add', element: <AddPage /> },
                      { path: 'tasting/:id', element: <TastingDetailPage /> },
                      { path: 'tasting/:id/edit', element: <TastingEditPage /> },
                      { path: 'map', element: <MapPage /> },
                      { path: 'profile', element: <ProfilePage /> },
                      { path: 'settings', element: <SettingsPage /> },
                      {
                        path: 'settings/profile',
                        element: <SettingsProfilePage />,
                      },
                      {
                        path: 'settings/appearance',
                        element: <SettingsAppearancePage />,
                      },
                      {
                        path: 'settings/language',
                        element: <SettingsLanguagePage />,
                      },
                      {
                        path: 'settings/regional',
                        element: <SettingsRegionalPage />,
                      },
                      {
                        path: 'settings/notifications',
                        element: <SettingsNotificationsPage />,
                      },
                      {
                        path: 'settings/privacy',
                        element: <SettingsPrivacyPage />,
                      },
                      {
                        path: 'settings/account',
                        element: <SettingsAccountPage />,
                      },
                      {
                        path: 'settings/legal',
                        element: <SettingsLegalPage />,
                      },
                      {
                        path: 'settings/levels',
                        element: <SettingsLevelsPage />,
                      },
                      {
                        path: 'settings/blocked',
                        element: <BlockedUsersPage />,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={`/${DEFAULT_LOCALE}`} replace /> },
])
