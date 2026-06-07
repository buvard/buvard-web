import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { SettingsGroup, SettingsRow } from '@/features/settings/components/SettingsRow'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { authClient } from '@/lib/auth-client'
import { APP_VERSION } from '@/lib/version'
import {
  User,
  Palette,
  Languages,
  Globe,
  Bell,
  Lock,
  Ban,
  ScrollText,
  UserCog,
  LogOut,
} from 'lucide-react'

// Page index — liste de raccourcis vers les sous-pages thématiques.
// La page reste digérable, chaque détail est dans sa propre sous-page.
export function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const p = useLocalizedPath()

  async function handleSignOut() {
    await authClient.signOut()
    navigate(p('/'), { replace: true })
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </header>

      <SettingsGroup title={t('settings.groups.app')}>
        <SettingsRow
          icon={User}
          label={t('settings.profile.title')}
          hint={t('settings.profile.shortHint')}
          to={p('/settings/profile')}
        />
        <SettingsRow
          icon={Palette}
          label={t('settings.appearance.title')}
          to={p('/settings/appearance')}
        />
        <SettingsRow
          icon={Languages}
          label={t('settings.language.title')}
          to={p('/settings/language')}
        />
        <SettingsRow
          icon={Globe}
          label={t('settings.regional.title')}
          to={p('/settings/regional')}
        />
      </SettingsGroup>

      <SettingsGroup title={t('settings.groups.social')}>
        <SettingsRow
          icon={Bell}
          label={t('settings.notifications.title')}
          to={p('/settings/notifications')}
        />
        <SettingsRow
          icon={Lock}
          label={t('settings.privacy.title')}
          to={p('/settings/privacy')}
        />
        <SettingsRow
          icon={Ban}
          label={t('settings.moderation.blocked')}
          to={p('/settings/blocked')}
        />
      </SettingsGroup>

      <SettingsGroup title={t('settings.groups.account')}>
        <SettingsRow
          icon={UserCog}
          label={t('settings.account.title')}
          hint={t('settings.account.shortHint')}
          to={p('/settings/account')}
        />
        <SettingsRow
          icon={ScrollText}
          label={t('settings.legal.title')}
          to={p('/settings/legal')}
        />
      </SettingsGroup>

      {/* Déconnexion accessible directement, hors d'un sous-menu */}
      <SettingsGroup>
        <SettingsRow
          icon={LogOut}
          label={t('settings.account.signOut')}
          onClick={() => void handleSignOut()}
        />
      </SettingsGroup>

      <p className="px-1 text-center text-xs text-muted-foreground">
        {/* Le mode `development` (npm run dev) est aliasé en `staging` — même flow simplifié. */}
        {t('app.name')} ·{' '}
        {import.meta.env.MODE === 'production' ? 'production' : 'staging'} {APP_VERSION}
      </p>
    </section>
  )
}
