import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  useAcceptPrivacy,
  useAcceptTerms,
  useCompleteOnboarding,
  useMe,
  useUpdateMe,
} from '@/lib/api/user'
import { ApiError } from '@/lib/api/client'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'

const USERNAME_REGEX = /^[a-z0-9_.-]+$/

type Step = 'identity' | 'legal'

export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const me = useMe()
  const updateMe = useUpdateMe()
  const acceptTerms = useAcceptTerms()
  const acceptPrivacy = useAcceptPrivacy()
  const completeOnboarding = useCompleteOnboarding()

  // Si le user a déjà un username, on saute direct à l'étape legal
  const initialStep: Step = me.data?.username ? 'legal' : 'identity'
  const [step, setStep] = useState<Step>(initialStep)
  const [username, setUsername] = useState(me.data?.username ?? '')
  const [displayName, setDisplayName] = useState(me.data?.displayName ?? '')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLoading =
    updateMe.isPending ||
    acceptTerms.isPending ||
    acceptPrivacy.isPending ||
    completeOnboarding.isPending

  function validateIdentity(): string | null {
    const u = username.trim().toLowerCase()
    if (u.length < 3 || u.length > 32) return t('onboarding.errors.invalid')
    if (!USERNAME_REGEX.test(u)) return t('onboarding.errors.invalid')
    return null
  }

  async function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const validation = validateIdentity()
    if (validation) {
      setError(validation)
      return
    }
    try {
      await updateMe.mutateAsync({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || undefined,
      })
      setStep('legal')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t('onboarding.errors.taken'))
      } else {
        setError(t('onboarding.errors.generic'))
      }
    }
  }

  async function handleLegalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!acceptedTerms || !acceptedPrivacy) {
      setError(t('onboarding.errors.acceptBoth'))
      return
    }
    try {
      // On envoie en séquence : terms, privacy, complete
      await acceptTerms.mutateAsync()
      await acceptPrivacy.mutateAsync()
      await completeOnboarding.mutateAsync()
      navigate(localizedPath('/feed'), { replace: true })
    } catch {
      setError(t('onboarding.errors.generic'))
    }
  }

  return (
    <section className="flex flex-col gap-8 pt-8">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t('app.name')}
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {step === 'identity'
            ? t('onboarding.title')
            : t('onboarding.legalTitle')}
        </h1>
        <p className="text-base text-muted-foreground">
          {step === 'identity'
            ? t('onboarding.subtitle')
            : t('onboarding.legalSubtitle')}
        </p>
      </div>

      {/* Indicateur d'étape */}
      <div className="flex gap-1.5">
        <div
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            'bg-primary',
          )}
        />
        <div
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            step === 'legal' ? 'bg-primary' : 'bg-border',
          )}
        />
      </div>

      {step === 'identity' ? (
        <form onSubmit={handleIdentitySubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">{t('onboarding.usernameLabel')}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))
              }
              placeholder={t('onboarding.usernamePlaceholder')}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="username"
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('onboarding.usernameHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">
              {t('onboarding.displayNameLabel')}
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('onboarding.displayNamePlaceholder')}
              maxLength={60}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="glow-primary"
            disabled={isLoading}
          >
            {t('onboarding.next')}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleLegalSubmit} className="space-y-5">
          <CheckboxRow
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            label={t('onboarding.acceptTerms')}
          />
          <CheckboxRow
            checked={acceptedPrivacy}
            onChange={setAcceptedPrivacy}
            label={t('onboarding.acceptPrivacy')}
          />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="glow-primary"
            disabled={isLoading || !acceptedTerms || !acceptedPrivacy}
          >
            {t('onboarding.submit')}
          </Button>
        </form>
      )}
    </section>
  )
}

// Petit checkbox custom — visuel rond, état actif bordeaux.
function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-md border border-border bg-card/30 p-4 text-left transition-colors hover:bg-card/60"
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          checked
            ? 'border-primary bg-primary'
            : 'border-border bg-background',
        )}
      >
        {checked && (
          <span className="h-2 w-2 rounded-full bg-primary-foreground" />
        )}
      </span>
      <span className="text-sm leading-relaxed text-foreground">{label}</span>
    </button>
  )
}
