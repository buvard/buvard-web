import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { AppLayout } from '@/components/AppLayout'
import { RequireAuth } from '@/components/RequireAuth'
import { RequireUsername } from '@/components/RequireUsername'
import { RequireActive } from '@/components/RequireActive'
import { HomePage } from '@/features/home/Home'
import { SignInPage } from '@/features/auth/SignIn'
import { SignUpPage } from '@/features/auth/SignUp'
import { OnboardingPage } from '@/features/auth/Onboarding'
import { AccountRestrictedPage } from '@/features/auth/AccountRestricted'
import { FeedPage } from '@/features/feed/Feed'
import { DiscoverPage } from '@/features/discover/Discover'
import { AddPage } from '@/features/add/Add'
import { ProfilePage } from '@/features/profile/Profile'
import { SettingsPage } from '@/features/settings/Settings'
import { SettingsProfilePage } from '@/features/settings/Profile'
import { SettingsAppearancePage } from '@/features/settings/Appearance'
import { SettingsLanguagePage } from '@/features/settings/Language'
import { SettingsRegionalPage } from '@/features/settings/Regional'
import { SettingsNotificationsPage } from '@/features/settings/Notifications'
import { SettingsPrivacyPage } from '@/features/settings/Privacy'
import { SettingsAccountPage } from '@/features/settings/Account'
import { SettingsLegalPage } from '@/features/settings/Legal'
import { BlockedUsersPage } from '@/features/profile/BlockedUsers'
import { PublicProfilePage } from '@/features/profile/PublicProfile'
import { RelationsPage } from '@/features/profile/Relations'
import { NotFoundPage } from '@/features/misc/NotFound'

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
