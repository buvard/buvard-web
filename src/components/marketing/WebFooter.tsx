import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'

// Footer commun aux pages publiques cote shell web.
// - Bloc "drink responsibly" obligatoire alcool.
// - Liens recap : Features / Download / About / Legal.
// - Copyright + nom de l'app.
export function WebFooter() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()

  const links: { to: string; labelKey: string }[] = [
    { to: localizedPath('/features'), labelKey: 'nav.marketing.features' },
    { to: localizedPath('/download'), labelKey: 'nav.marketing.download' },
    { to: localizedPath('/about'), labelKey: 'nav.marketing.about' },
    { to: localizedPath('/legal'), labelKey: 'nav.marketing.legal' },
  ]

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand + moderation */}
          <div className="max-w-md space-y-3">
            <Link
              to={localizedPath('/')}
              className="inline-flex items-center gap-2"
            >
              <span className="text-base font-semibold tracking-tight text-foreground">
                {t('app.name')}
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('common.moderation')}
            </p>
          </div>

          {/* Liens */}
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-1 sm:text-right">
            {links.map(({ to, labelKey }) => (
              <Link
                key={to}
                to={to}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} {t('app.name')}.
        </p>
      </div>
    </footer>
  )
}
