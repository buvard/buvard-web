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

export function SettingsPrivacyPage() {
  const { t } = useTranslation()
  const prefs = usePrefs()
  const updatePrefs = useUpdatePrefs()
  const p = prefs.data?.privacy
  const pending = updatePrefs.isPending

  if (!p) {
    return <SettingsPageShell title={t('settings.privacy.title')} />
  }

  const set = (patch: Partial<typeof p>) => updatePrefs.mutate({ privacy: patch })

  return (
    <SettingsPageShell title={t('settings.privacy.title')}>
      <div className="space-y-2">
        <ToggleRow
          label={t('settings.privacy.profilePublic')}
          hint={t('settings.privacy.profilePublicHint')}
          checked={p.profilePublic}
          onChange={(v) => set({ profilePublic: v })}
          disabled={pending}
        />
        <ToggleRow
          label={t('settings.privacy.searchable')}
          hint={t('settings.privacy.searchableHint')}
          checked={p.searchable}
          onChange={(v) => set({ searchable: v })}
          disabled={pending}
        />
        <ToggleRow
          label={t('settings.privacy.showRatings')}
          hint={t('settings.privacy.showRatingsHint')}
          checked={p.showRatings}
          onChange={(v) => set({ showRatings: v })}
          disabled={pending}
        />
        <ToggleRow
          label={t('settings.privacy.showLocation')}
          hint={t('settings.privacy.showLocationHint')}
          checked={p.showLocation}
          onChange={(v) => set({ showLocation: v })}
          disabled={pending}
        />
      </div>
    </SettingsPageShell>
  )
}
