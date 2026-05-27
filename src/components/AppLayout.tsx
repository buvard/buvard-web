import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserSearch } from '@/components/UserSearch'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useSyncPrefs } from '@/lib/api/useSyncPrefs'
import { useMe } from '@/lib/api/user'
import { cn } from '@/lib/utils'
import { House, Compass, Plus, User, Settings } from 'lucide-react'

// Layout web façon X (3 colonnes) :
//   - Desktop (>=lg) : rail de nav gauche + contenu central bordé + (>=xl) sidebar droite (search)
//   - Mobile (<lg)   : bottom-nav (à adapter séparément)

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
    { to: localizedPath('/discover'), label: t('nav.discover'), icon: Compass },
    { to: localizedPath('/add'), label: t('nav.add'), icon: Plus },
    {
      to: localizedPath('/profile'),
      label: t('nav.profile'),
      icon: User,
      avatar: true,
    },
  ]
}

// Avatar utilisateur — utilisé dans la bottom-nav mobile à la place de l'icône Profile.
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
// Rail de nav gauche desktop (>=lg) — style X
// ============================================================
function DesktopSidebar() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const me = useMe()

  const items: { to: string; label: string; icon: typeof House; end: boolean }[] =
    [
      { to: localizedPath('/feed'), label: t('nav.feed'), icon: House, end: true },
      {
        to: localizedPath('/discover'),
        label: t('nav.discover'),
        icon: Compass,
        end: true,
      },
      {
        to: localizedPath('/profile'),
        label: t('nav.profile'),
        icon: User,
        end: true,
      },
      {
        to: localizedPath('/settings'),
        label: t('settings.title'),
        icon: Settings,
        end: false,
      },
    ]

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col px-2 py-4 lg:flex">
      {/* Logo */}
      <Link
        to={localizedPath('/')}
        className="mb-2 flex items-center gap-2 px-4 py-2"
      >
        <span className="text-xl font-bold tracking-tight text-foreground">
          {t('app.name')}
        </span>
        <span className="h-1.5 w-1.5 rounded-lg bg-primary shadow-[0_0_8px_2px_rgba(139,38,53,0.6)]" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 rounded-lg px-4 py-3 text-lg transition-colors hover:bg-card',
                isActive ? 'font-bold text-foreground' : 'text-foreground/90',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bouton Post (Ajouter) proéminent */}
      <Button
        asChild
        className="mt-4 h-12 rounded-lg text-base font-bold glow-primary"
      >
        <Link to={localizedPath('/add')}>{t('nav.add')}</Link>
      </Button>

      {/* Chip compte en bas */}
      <Link
        to={localizedPath('/profile')}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-card"
      >
        <Avatar className="h-10 w-10">
          {me.data?.avatarUrl && <AvatarImage src={me.data.avatarUrl} alt="" />}
          <AvatarFallback>
            {(me.data?.displayName ?? me.data?.username ?? '?')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {me.data?.displayName ?? me.data?.username ?? '—'}
          </p>
          {me.data?.username && (
            <p className="truncate text-xs text-muted-foreground">
              @{me.data.username}
            </p>
          )}
        </div>
      </Link>
    </aside>
  )
}

// ============================================================
// Sidebar droite desktop (>=xl) — recherche
// ============================================================
function RightSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 px-4 py-4 xl:block">
      <UserSearch />
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
            <span className="h-1.5 w-1.5 rounded-lg bg-primary shadow-[0_0_8px_2px_rgba(139,38,53,0.6)]" />
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
        <div className="mx-auto flex min-h-full w-full max-w-6xl">
          <DesktopSidebar />
          <main className="flex min-w-0 flex-1 flex-col lg:border-x lg:border-border">
            <div className="flex-1 px-4 pb-6 pt-4 sm:px-5">
              <Outlet />
            </div>
            <MobileBottomNav />
          </main>
          <RightSidebar />
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
