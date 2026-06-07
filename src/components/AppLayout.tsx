import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserSearch } from '@/components/UserSearch'
import { AddDialog } from '@/features/add/AddDialog'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useSession } from '@/lib/session'
import { useSyncPrefs } from '@/lib/api/useSyncPrefs'
import { useMe } from '@/lib/api/user'
import { useDesktop } from '@/lib/useDesktop'
import { isAppShell } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { WebNavbar } from '@/components/marketing/WebNavbar'
import { WebFooter } from '@/components/marketing/WebFooter'
import { House, Compass, Map, Plus, User, Settings } from 'lucide-react'

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
    // Le bouton + lance la camera plein ecran (UX camera-first).
    { to: localizedPath('/add/capture'), label: t('nav.add'), icon: Plus },
    { to: localizedPath('/map'), label: t('nav.map'), icon: Map },
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
function DesktopSidebar({ onAdd }: { onAdd: () => void }) {
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
        to: localizedPath('/map'),
        label: t('nav.map'),
        icon: Map,
        end: false,
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

      {/* Bouton Post (Ajouter) proéminent — ouvre la popup AddDialog sur
          desktop (l'utilisateur reste sur sa page, modal centré). */}
      <Button
        onClick={onAdd}
        className="mt-4 h-12 rounded-lg text-base font-bold glow-primary"
      >
        {t('nav.add')}
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
  const location = useLocation()
  // Sur /add (creation focused), on cache la nav pour liberer la zone du
  // bouton Publier sticky. L'utilisateur revient via le bouton back du device
  // ou le bouton Annuler.
  if (/^\/[a-z]{2}\/add(\/|$)/.test(location.pathname)) return null
  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5">
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
// Layout shell app non connecte : minimaliste (header simple + zone centree).
// Pas de navbar marketing ni footer — l'utilisateur est deja dans l'app installee.
function AppGuestLayout({ children }: { children: React.ReactNode }) {
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
          </Link>
          <Button asChild size="sm" className="glow-primary">
            <Link to={localizedPath('/sign-in')}>{t('auth.signIn')}</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </main>
    </div>
  )
}

// Layout shell web non connecte : vraie navbar marketing sticky + outlet pleine
// largeur (chaque page gere son propre max-width) + footer global.
function WebGuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <WebNavbar />
      {/* Padding horizontal global pour pas coller aux bords sur mobile.
          Chaque page se centre via son propre max-w-{6xl|sm} mx-auto. */}
      <main className="flex-1 px-5">{children}</main>
      <WebFooter />
    </div>
  )
}

// Aiguilleur : shell app → layout minimal, shell web → layout marketing complet.
function GuestLayout({ children }: { children: React.ReactNode }) {
  if (isAppShell()) return <AppGuestLayout>{children}</AppGuestLayout>
  return <WebGuestLayout>{children}</WebGuestLayout>
}

// ============================================================
// Layout principal
// ============================================================
export function AppLayout() {
  // Sync prefs backend → local (best-effort, no-op si pas auth)
  useSyncPrefs()
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const isDesktop = useDesktop()
  const [addOpen, setAddOpen] = useState(false)

  // Click sur le bouton "Ajouter" depuis le rail desktop :
  // - desktop : popup modal sur la page courante
  // - mobile  : route fullscreen vers la camera (geste natif)
  // En pratique le DesktopSidebar n'est rendu qu'en >= lg, donc on est presque
  // toujours en desktop ici — mais on garde le fallback pour les cas tordus.
  function handleOpenAdd() {
    if (isDesktop) setAddOpen(true)
    else navigate(localizedPath('/add/capture'))
  }

  // Pendant le chargement initial de la session, on rend rien pour eviter
  // le flash GuestLayout -> AppLayout au refresh d'une page authentifiee.
  if (isPending) {
    return (
      <div className="flex min-h-full items-center justify-center text-muted-foreground" />
    )
  }

  if (!session) {
    return (
      <GuestLayout>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </GuestLayout>
    )
  }

  return (
    // h-full + overflow-hidden : le scroll global est desactive, chaque page
    // gere son propre scroll interne via la zone main ci-dessous. Les sidebars
    // desktop restent statiques sur toute la hauteur viewport.
    <div className="mx-auto flex h-full w-full max-w-6xl overflow-hidden">
      <DesktopSidebar onAdd={handleOpenAdd} />
      <main className="flex min-w-0 flex-1 flex-col lg:border-x lg:border-border">
        {/* Container des pages : flex column + scroll vertical interne.
            - Pages "longues" (Feed, Discover, etc.) : scrollent ici.
            - Pages "fullscreen" (Map) : utilisent flex-1 min-h-0 + overflow-hidden
              pour rester contraintes a la hauteur dispo sans scroll global. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-4 sm:px-5">
          {/* Suspense au niveau du layout : couvre tous les chunks lazy-loaded
              des routes enfants (cf router.tsx). Fallback null = pas de flash. */}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
        <MobileBottomNav />
      </main>
      <RightSidebar />
      <AddDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
