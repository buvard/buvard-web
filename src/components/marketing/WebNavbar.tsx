import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useScrolled } from '@/lib/useScrolled'
import { cn } from '@/lib/utils'

// Navbar marketing affichee en haut des pages publiques cote shell web.
// - Sticky top, transparente en haut de page, solide + backdrop-blur des qu'on
//   commence a scroller (cf useScrolled).
// - Liens centraux : Features / Download / About.
// - CTA "Sign in" a droite, toujours visible.
// - Mobile (<md) : burger qui ouvre un panneau plein ecran overlay.

interface NavEntry {
  to: string
  labelKey: string
}

function useNavEntries(): NavEntry[] {
  const localizedPath = useLocalizedPath()
  return [
    { to: localizedPath('/features'), labelKey: 'nav.marketing.features' },
    { to: localizedPath('/download'), labelKey: 'nav.marketing.download' },
    { to: localizedPath('/about'), labelKey: 'nav.marketing.about' },
  ]
}

export function WebNavbar() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const scrolled = useScrolled(8)
  const entries = useNavEntries()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Ferme le panneau mobile a chaque navigation (sinon il reste ouvert apres
  // qu'on a cliqué sur un lien). Pattern "reset au changement externe" — la
  // regle react-hooks/set-state-in-effect veut un derived state ici, mais on
  // n'a pas de moyen propre de derive un toggle UI a partir d'une URL.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false)
  }, [location.pathname])

  // Lock le scroll du body quand le panneau mobile est ouvert.
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 transition-colors duration-200',
          scrolled
            ? 'border-b border-border bg-background/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          {/* Logo */}
          <Link
            to={localizedPath('/')}
            className="flex items-center gap-2"
            aria-label={t('app.name')}
          >
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {t('app.name')}
            </span>
          </Link>

          {/* Liens desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {entries.map(({ to, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Actions a droite */}
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="glow-primary">
              <Link to={localizedPath('/sign-in')}>{t('auth.signIn')}</Link>
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-card md:hidden"
              aria-label={t('nav.marketing.openMenu')}
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {/* Panneau mobile plein ecran */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col bg-background md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <Link
              to={localizedPath('/')}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <span className="text-lg font-semibold tracking-tight text-foreground">
                {t('app.name')}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-card"
              aria-label={t('nav.marketing.closeMenu')}
            >
              <X className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3 py-6">
            {entries.map(({ to, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-card',
                    isActive ? 'text-foreground' : 'text-foreground/80',
                  )
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-border px-5 py-4">
            <Button asChild size="lg" className="w-full glow-primary">
              <Link to={localizedPath('/sign-in')}>{t('auth.signIn')}</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
