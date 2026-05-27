import { useTranslation } from 'react-i18next'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import { Switch } from '@/components/ui/switch'
import { usePrefs, useUpdatePrefs } from '@/lib/api/user'

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}

export function SettingsNotificationsPage() {
  const { t } = useTranslation()
  const prefs = usePrefs()
  const updatePrefs = useUpdatePrefs()
  const n = prefs.data?.notifications
  const pending = updatePrefs.isPending

  if (!n) {
    return <SettingsPageShell title={t('settings.notifications.title')} />
  }

  const set = (patch: Partial<typeof n>) =>
    updatePrefs.mutate({ notifications: patch })

  return (
    <SettingsPageShell title={t('settings.notifications.title')}>
      <div className="space-y-2">
        <ToggleRow
          label={t('settings.notifications.push')}
          checked={n.push}
          onChange={(v) => set({ push: v })}
          disabled={pending}
        />
        <ToggleRow
          label={t('settings.notifications.email')}
          checked={n.email}
          onChange={(v) => set({ email: v })}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <h2 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('settings.notifications.eventsTitle')}
        </h2>
        <ToggleRow
          label={t('settings.notifications.friendActivity')}
          checked={n.friendActivity}
          onChange={(v) => set({ friendActivity: v })}
          disabled={pending}
        />
        <ToggleRow
          label={t('settings.notifications.newFollower')}
          checked={n.newFollower}
          onChange={(v) => set({ newFollower: v })}
          disabled={pending}
        />
        <ToggleRow
          label={t('settings.notifications.tastingLiked')}
          checked={n.tastingLiked}
          onChange={(v) => set({ tastingLiked: v })}
          disabled={pending}
        />
        <ToggleRow
          label={t('settings.notifications.tastingCommented')}
          checked={n.tastingCommented}
          onChange={(v) => set({ tastingCommented: v })}
          disabled={pending}
        />
      </div>
    </SettingsPageShell>
  )
}
