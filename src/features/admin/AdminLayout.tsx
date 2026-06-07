import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound, Shield, Sparkles } from 'lucide-react'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { cn } from '@/lib/utils'

// Header + sous-nav du panel admin. Le guard RequireAdmin est applique en
// amont au niveau du router. /admin etant un onglet principal de la nav,
// le header s'aligne sur le style des autres pages racine (Profile, Settings).
export function AdminLayout() {
  const { t } = useTranslation()
  const p = useLocalizedPath()

  return (
    <section className="space-y-5">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Shield className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('admin.title')}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('admin.subtitle')}
            </p>
          </div>
        </div>

        {/* Sous-nav onglets */}
        <nav className="flex gap-1 rounded-xl border border-border bg-card/30 p-1">
          <AdminTab to={p('/admin/codes')} icon={KeyRound} label={t('admin.tabs.codes')} />
          <AdminTab to={p('/admin/users')} icon={Sparkles} label={t('admin.tabs.users')} />
        </nav>
      </header>

      <Outlet />
    </section>
  )
}

function AdminTab({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof Shield
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-card hover:text-foreground',
        )
      }
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      {label}
    </NavLink>
  )
}
