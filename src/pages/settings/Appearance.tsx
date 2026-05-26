import { useTranslation } from 'react-i18next'
import { SettingsPageShell } from '@/components/SettingsPageShell'
import { useTheme, type Theme } from '@/lib/theme'
import { useUpdatePrefs } from '@/lib/api/user'
import { cn } from '@/lib/utils'
import { Sun, Moon, Monitor } from 'lucide-react'

export function SettingsAppearancePage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const updatePrefs = useUpdatePrefs()

  function select(next: Theme) {
    setTheme(next)
    updatePrefs.mutate({ theme: next })
  }

  const options: { value: Theme; icon: typeof Sun }[] = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ]

  return (
    <SettingsPageShell title={t('settings.appearance.title')}>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ value, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => select(value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border px-3 py-5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              {t(`settings.appearance.themes.${value}`)}
            </button>
          )
        })}
      </div>
    </SettingsPageShell>
  )
}
