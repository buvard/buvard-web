import { useTranslation } from 'react-i18next'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import { Button } from '@/components/ui/button'
import { useAcceptPrivacy, useAcceptTerms, useMe } from '@/lib/api/user'

function Row({
  label,
  hint,
  ctaLabel,
  onCta,
  loading,
}: {
  label: string
  hint?: string
  ctaLabel?: string
  onCta?: () => void
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {ctaLabel && (
        <Button size="sm" variant="outline" onClick={onCta} disabled={loading}>
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}

export function SettingsLegalPage() {
  const { t, i18n } = useTranslation()
  const me = useMe()
  const acceptTerms = useAcceptTerms()
  const acceptPrivacy = useAcceptPrivacy()

  function fmt(iso: string | null | undefined): string {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString(i18n.language, {
      dateStyle: 'medium',
    })
  }

  const termsHint = me.data?.acceptedTermsAt
    ? t('settings.legal.acceptedOn', { date: fmt(me.data.acceptedTermsAt) })
    : t('settings.legal.notAccepted')

  const privacyHint = me.data?.acceptedPrivacyAt
    ? t('settings.legal.acceptedOn', { date: fmt(me.data.acceptedPrivacyAt) })
    : t('settings.legal.notAccepted')

  return (
    <SettingsPageShell title={t('settings.legal.title')}>
      <div className="space-y-2">
        <Row
          label={t('settings.legal.terms')}
          hint={termsHint}
          ctaLabel={!me.data?.acceptedTermsAt ? t('settings.legal.accept') : undefined}
          onCta={() => acceptTerms.mutate()}
          loading={acceptTerms.isPending}
        />
        <Row
          label={t('settings.legal.privacy')}
          hint={privacyHint}
          ctaLabel={
            !me.data?.acceptedPrivacyAt ? t('settings.legal.accept') : undefined
          }
          onCta={() => acceptPrivacy.mutate()}
          loading={acceptPrivacy.isPending}
        />
      </div>
    </SettingsPageShell>
  )
}
