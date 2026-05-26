import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { AppLayout } from '@/components/AppLayout'
import { RequireAuth } from '@/components/RequireAuth'
import { RequireUsername } from '@/components/RequireUsername'
import { RequireActive } from '@/components/RequireActive'
import { HomePage } from '@/pages/Home'
import { SignInPage } from '@/pages/SignIn'
import { SignUpPage } from '@/pages/SignUp'
import { OnboardingPage } from '@/pages/Onboarding'
import { AccountRestrictedPage } from '@/pages/AccountRestricted'
import { FeedPage } from '@/pages/Feed'
import { DiscoverPage } from '@/pages/Discover'
import { AddPage } from '@/pages/Add'
import { ProfilePage } from '@/pages/Profile'
import { SettingsPage } from '@/pages/Settings'
import { SettingsProfilePage } from '@/pages/settings/Profile'
import { SettingsAppearancePage } from '@/pages/settings/Appearance'
import { SettingsLanguagePage } from '@/pages/settings/Language'
import { SettingsRegionalPage } from '@/pages/settings/Regional'
import { SettingsNotificationsPage } from '@/pages/settings/Notifications'
import { SettingsPrivacyPage } from '@/pages/settings/Privacy'
import { SettingsAccountPage } from '@/pages/settings/Account'
import { SettingsLegalPage } from '@/pages/settings/Legal'
import { BlockedUsersPage } from '@/pages/BlockedUsers'
import { PublicProfilePage } from '@/pages/PublicProfile'
import { RelationsPage } from '@/pages/Relations'
import { NotFoundPage } from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={`/${DEFAULT_LOCALE}`} replace />,
  },
  {
    path: '/:lang',
    element: <LocaleProvider />,
    children: [
      {
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
