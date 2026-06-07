import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, KeyRound, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import { useMyFeatures, useRedeemCode } from '@/lib/api/user'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

interface FeatureLine {
  key: 'pochtron'
  labelKey: string
  descKey: string
}

const FEATURES: FeatureLine[] = [
  { key: 'pochtron', labelKey: 'settings.codes.features.pochtron.label', descKey: 'settings.codes.features.pochtron.desc' },
]

export function SettingsCodesPage() {
  const { t } = useTranslation()
  const features = useMyFeatures()
  const redeem = useRedeemCode()
  const [code, setCode] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    redeem.mutate(trimmed, {
      onSuccess: () => {
        toast.success(t('settings.codes.redeemSuccess'))
        setCode('')
      },
      onError: (err) => {
        const msg =
          err instanceof ApiError && err.status === 404
            ? t('settings.codes.errors.notFound')
            : err instanceof ApiError && err.status === 403
              ? t('settings.codes.errors.expired')
              : err instanceof ApiError && err.status === 409
                ? t('settings.codes.errors.alreadyUsed')
                : t('settings.codes.errors.generic')
        toast.error(msg)
      },
    })
  }

  return (
    <SettingsPageShell
      title={t('settings.codes.title')}
      subtitle={t('settings.codes.subtitle')}
    >
      {/* Input code */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Label htmlFor="code-input" className="text-sm font-medium text-foreground">
          {t('settings.codes.inputLabel')}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
            <Input
              id="code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('settings.codes.inputPlaceholder')}
              className="pl-9 font-mono uppercase tracking-wider"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button type="submit" disabled={redeem.isPending || !code.trim()}>
            {redeem.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t('settings.codes.submit')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('settings.codes.inputHint')}
        </p>
      </form>

      {/* Liste des features */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('settings.codes.activeTitle')}
        </h2>
        <ul className="space-y-2">
          {FEATURES.map((f) => {
            const active = features[f.key]
            return (
              <li
                key={f.key}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3.5',
                  active
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card/30',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {active ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Lock className="h-4 w-4" strokeWidth={1.8} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {t(f.labelKey)}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t(f.descKey)}
                  </p>
                </div>
                {active && (
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {t('settings.codes.activeBadge')}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </SettingsPageShell>
  )
}
