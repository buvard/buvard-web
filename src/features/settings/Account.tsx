import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useClerk, useUser } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import { SettingsGroup, SettingsRow } from '@/features/settings/components/SettingsRow'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDeleteMe } from '@/lib/api/user'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import {
  AtSign,
  KeyRound,
  ShieldCheck,
  LogOut,
  Trash2,
} from 'lucide-react'

// Page Compte — gestion Clerk (identité, sécurité) + actions destructives.
// Pas de duplication avec /settings/profile (qui édite le profil app Buvard).
export function SettingsAccountPage() {
  const { t } = useTranslation()
  const { openUserProfile, signOut } = useClerk()
  const { user } = useUser()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const deleteMe = useDeleteMe()

  async function handleDelete() {
    try {
      await deleteMe.mutateAsync()
      await signOut(() => navigate(localizedPath('/'), { replace: true }))
    } catch {
      toast.error(t('settings.saveError'))
    }
  }

  return (
    <SettingsPageShell
      title={t('settings.account.title')}
      subtitle={t('settings.account.subtitle')}
    >
      <SettingsGroup title={t('settings.account.identity')}>
        <SettingsRow
          icon={AtSign}
          label={t('settings.account.email')}
          value={user?.primaryEmailAddress?.emailAddress ?? '—'}
          onClick={() => openUserProfile()}
        />
        <SettingsRow
          icon={KeyRound}
          label={t('settings.account.password')}
          hint={t('settings.account.passwordHint')}
          onClick={() => openUserProfile()}
        />
        <SettingsRow
          icon={ShieldCheck}
          label={t('settings.account.security')}
          hint={t('settings.account.securityHint')}
          onClick={() => openUserProfile()}
        />
      </SettingsGroup>

      <SettingsGroup title={t('settings.account.session')}>
        <SettingsRow
          icon={LogOut}
          label={t('settings.account.signOut')}
          onClick={() =>
            void signOut(() => navigate(localizedPath('/'), { replace: true }))
          }
        />
      </SettingsGroup>

      <SettingsGroup title={t('settings.account.dangerZone')}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="block w-full rounded-lg border border-destructive/30 bg-destructive/5 text-left transition-colors hover:bg-destructive/10"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <Trash2
                  className="h-5 w-5 shrink-0 text-destructive"
                  strokeWidth={1.8}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-destructive">
                    {t('settings.account.delete')}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t('settings.account.deleteHint')}
                  </p>
                </div>
              </div>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('settings.account.deleteConfirm')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('settings.account.deleteConfirmText')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('settings.account.deleteCancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('settings.account.deleteOk')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsGroup>
    </SettingsPageShell>
  )
}
