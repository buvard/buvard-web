import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useTranslation } from 'react-i18next'

// Header local pour une sous-page de Settings : retour + titre + sous-titre.
interface Props {
  title: string
  subtitle?: string
  backTo?: string
  children?: React.ReactNode
}

export function SettingsPageShell({
  title,
  subtitle,
  backTo,
  children,
}: Props) {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const fallback = localizedPath('/settings')

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <Link
          to={backTo ?? fallback}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          {t('settings.back')}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  )
}
