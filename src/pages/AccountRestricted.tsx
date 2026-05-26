import { useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useMe } from '@/lib/api/user'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { ShieldAlert } from 'lucide-react'

export function AccountRestrictedPage() {
  const { t, i18n } = useTranslation()
  const me = useMe()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()

  const status = me.data?.status
  const suspendedUntil = me.data?.suspendedUntil

  const formattedUntil = suspendedUntil
    ? new Date(suspendedUntil).toLocaleString(i18n.language, {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null

  const title =
    status === 'banned'
      ? t('restricted.bannedTitle')
      : t('restricted.suspendedTitle')

  const description =
    status === 'banned'
      ? t('restricted.bannedText')
      : formattedUntil
        ? t('restricted.suspendedTextUntil', { until: formattedUntil })
        : t('restricted.suspendedText')

  return (
    <section className="flex flex-col items-start gap-6 pt-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10">
        <ShieldAlert className="h-6 w-6 text-destructive" strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t('app.name')}
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          {description}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() =>
          void signOut(() => navigate(localizedPath('/'), { replace: true }))
        }
      >
        {t('auth.signOut')}
      </Button>
    </section>
  )
}
