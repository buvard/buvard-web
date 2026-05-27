import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import {
  DEFAULT_LOCALE,
  isLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/config'
import { useUpdatePrefs } from '@/lib/api/user'
import { cn } from '@/lib/utils'

export function SettingsLanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useParams<{ lang: string }>()
  const updatePrefs = useUpdatePrefs()
  const current: Locale = isLocale(lang) ? lang : DEFAULT_LOCALE

  function switchTo(next: Locale) {
    const rest = location.pathname.split('/').slice(2).join('/')
    const target = `/${next}${rest ? `/${rest}` : ''}${location.search}`
    navigate(target, { replace: true })
    // Backend ne supporte que fr/en : on map co -> fr
    const backendLang: 'fr' | 'en' = next === 'en' ? 'en' : 'fr'
    updatePrefs.mutate({ language: backendLang })
  }

  return (
    <SettingsPageShell title={t('settings.language.title')}>
      <div className="space-y-2">
        {SUPPORTED_LOCALES.map((code) => {
          const active = current === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => switchTo(code)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{t(`lang.${code}`)}</span>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_2px_rgba(139,38,53,0.6)]" />
              )}
            </button>
          )
        })}
      </div>
      {current === 'co' && (
        <p className="text-xs text-muted-foreground">
          {t('settings.language.noteCo')}
        </p>
      )}
    </SettingsPageShell>
  )
}
