import { useTranslation } from 'react-i18next'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import { Label } from '@/components/ui/label'
import { usePrefs, useUpdatePrefs } from '@/lib/api/user'
import type { Currency, Units } from '@/types'
import { cn } from '@/lib/utils'

export function SettingsRegionalPage() {
  const { t } = useTranslation()
  const prefs = usePrefs()
  const updatePrefs = useUpdatePrefs()

  const units: { value: Units; label: string }[] = [
    { value: 'metric', label: t('settings.regional.metric') },
    { value: 'imperial', label: t('settings.regional.imperial') },
  ]
  const currencies: Currency[] = ['EUR', 'USD', 'GBP']

  return (
    <SettingsPageShell title={t('settings.regional.title')}>
      <div className="space-y-2">
        <Label>{t('settings.regional.units')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {units.map(({ value, label }) => {
            const active = prefs.data?.units === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => updatePrefs.mutate({ units: value })}
                className={cn(
                  'rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('settings.regional.currency')}</Label>
        <div className="grid grid-cols-3 gap-2">
          {currencies.map((c) => {
            const active = prefs.data?.currency === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => updatePrefs.mutate({ currency: c })}
                className={cn(
                  'rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>
    </SettingsPageShell>
  )
}
