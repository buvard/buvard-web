import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useSyncPrefs } from '@/lib/api/useSyncPrefs'
import { useMe } from '@/lib/api/user'
import { cn } from '@/lib/utils'
import { House, Compass, Plus, User } from 'lucide-react'

// Layout :
//   - Mobile (<lg)  : pas de top-bar. Contenu centré. Bottom-nav fixée.
//   - Desktop (>=lg): sidebar verticale gauche avec logo + nav. Pas de bottom-nav.
// Le bouton "Ajouter" est intégré à la nav comme dans Insta/Twitter,
// pas en FAB flottant (qui sature visuellement).

interface NavItem {
  to: string
  label: string
  icon: typeof House
  avatar?: boolean
}

function useNavItems(): NavItem[] {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  return [
    { to: localizedPath('/feed'), label: t('nav.feed'), icon: House },
    {
      to: localizedPath('/discover'),
      label: t('nav.discover'),
      icon: Compass,
    },
    { to: localizedPath('/add'), label: t('nav.add'), icon: Plus },
    {
      to: localizedPath('/profile'),
      label: t('nav.profile'),
      icon: User,
      avatar: true,
    },
  ]
}

// Avatar utilisateur — utilisé dans la nav à la place de l'icône Profile.
function UserAvatar({ active }: { active: boolean }) {
  const me = useMe()
  const fallback = (
    me.data?.displayName?.[0] ?? me.data?.username?.[0] ?? '?'
  ).toUpperCase()
  return (
    <Avatar
      className={cn(
        'h-6 w-6 ring-2 ring-transparent transition-all',
        active && 'ring-primary',
      )}
    >
      {me.data?.avatarUrl && <AvatarImage src={me.data.avatarUrl} alt="" />}
      <AvatarFallback className="text-[10px]">{fallback}</AvatarFallback>
    </Avatar>
  )
}

// ============================================================
// Sidebar desktop (>=lg)
// ============================================================
function DesktopSidebar() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const items = useNavItems()

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-background/60 backdrop-blur-xl lg:flex lg:flex-col">
      <Link
        to={localizedPath('/')}
        className="flex items-center gap-2 px-5 py-5"
      >
        <span className="text-xl font-semibold tracking-tight text-foreground">
          {t('app.name')}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(139,38,53,0.6)]" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map(({ to, label, icon: Icon, avatar }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:bg-card/50 hover:text-foreground',
              )
            }
          >
            {({ isActive }) =>
              avatar ? (
                <>
                  <UserAvatar active={isActive} />
                  <span>{label}</span>
                </>
              ) : (
                <>
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                    strokeWidth={1.8}
                  />
                  <span>{label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

// ============================================================
// Bottom-nav mobile (<lg)
// ============================================================
function MobileBottomNav() {
  const items = useNavItems()
  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-background/80 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon, avatar }) => (
          <NavLink
            key={to}
            to={to}
            end
            aria-label={label}
            className="flex flex-col items-center justify-center gap-1 py-2.5"
          >
            {({ isActive }) =>
              avatar ? (
                <UserAvatar active={isActive} />
              ) : (
                <Icon
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                  strokeWidth={isActive ? 2 : 1.6}
                />
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ============================================================
// Layout pour utilisateurs déconnectés (signin/signup/home publique)
// ============================================================
function GuestLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3">
          <Link to={localizedPath('/')} className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {t('app.name')}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(139,38,53,0.6)]" />
          </Link>
          <Button asChild size="sm" className="glow-primary">
            <Link to={localizedPath('/sign-in')}>{t('auth.signIn')}</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-5 py-6">{children}</div>
      </main>
    </div>
  )
}

// ============================================================
// Layout principal
// ============================================================
export function AppLayout() {
  // Sync prefs backend → local (best-effort, no-op si pas auth)
  useSyncPrefs()

  return (
    <>
      <SignedIn>
        <div className="flex min-h-full">
          <DesktopSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1">
              <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4 sm:px-5">
                <Outlet />
              </div>
            </main>
            <MobileBottomNav />
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <GuestLayout>
          <Outlet />
        </GuestLayout>
      </SignedOut>
    </>
  )
}
