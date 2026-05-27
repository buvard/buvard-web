import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BadgeCheck,
  MapPin,
  Shield,
  Flame,
  ArrowLeft,
  CalendarDays,
  Sparkles,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MentionText } from '@/components/MentionText'
import { ProfileCover } from '@/components/ProfileCover'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import type { UserLocation, UserRole } from '@/types'

// Stat inline façon X : "324 Abonnements" (chiffre gras + label muté)
function Stat({ count, label }: { count: number; label: string }) {
  return (
    <span>
      <span className="font-bold tabular-nums text-foreground">{count}</span>{' '}
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

// Layout partagé entre le profil perso (Profile) et le profil public (PublicProfile).
// Structure façon X : top bar (retour + nom + nb posts | recherche) > cover > avatar
// chevauchant > identité > stats > contenu (children).
// Les parties qui diffèrent entre les 2 pages sont injectées en slots :
// - coverOverlay : boutons sur la cover (réglages/upload côté perso, rien côté public)
// - avatar : avatar éditable côté perso, simple côté public
// - actions : suivre/bloquer côté public, rien côté perso
// - children : contenu sous le header (onglets, catégories...)
interface ProfileLayoutProps {
  coverUrl?: string | null
  coverOverlay?: ReactNode
  avatar: ReactNode
  actions?: ReactNode
  displayName: string
  username?: string
  verified?: boolean
  role?: UserRole
  level?: number
  streak?: number
  location?: UserLocation
  joinDate?: string | Date | null
  bio?: string | null
  stats: {
    tastingsCount: number
    followersCount: number
    followingCount: number
  }
  children?: ReactNode
}

export function ProfileLayout({
  coverUrl,
  coverOverlay,
  avatar,
  actions,
  displayName,
  username,
  verified,
  role,
  level,
  streak,
  location,
  joinDate,
  bio,
  stats,
  children,
}: ProfileLayoutProps) {
  const { t, i18n } = useTranslation()
  const localizedPath = useLocalizedPath()
  const navigate = useNavigate()

  // Bouton retour : visible seulement s'il y a un historique de navigation in-app.
  const canGoBack = (window.history.state?.idx ?? 0) > 0

  const joinLabel = joinDate
    ? new Date(joinDate).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
      })
    : null

  const hasLocation = !!(location?.city || location?.country)

  return (
    <section className="-mx-4 -mt-4 sm:-mx-5">
      {/* Top bar façon X : retour + nom + nb dégustations | recherche — collée en haut */}
      <div className="sticky top-0 z-20 flex items-center gap-6 border-b border-border bg-background/70 px-4 py-1.5 backdrop-blur-xl">
        {canGoBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold leading-tight text-foreground">
            {displayName}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('profile.tastings', { count: stats.tastingsCount })}
          </p>
        </div>
        <Link
          to={localizedPath('/discover')}
          aria-label={t('nav.discover')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
        >
          <Search className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>

      {/* Cover (sans arrondi) + overlay éventuel (réglages/upload côté perso) */}
      <div className="relative overflow-hidden">
        <ProfileCover coverUrl={coverUrl} />
        {coverOverlay}
      </div>

      <div className="space-y-5 px-4 pb-4 sm:px-5">
        <header className="space-y-3">
          {/* Avatar (slot) chevauchant la cover + actions (slot) alignées en bas */}
          <div className="-mt-14 flex items-end justify-between">
            {avatar}
            {actions}
          </div>

          {/* Nom + handle */}
          <div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {displayName}
              </h1>
              {verified && (
                <BadgeCheck
                  className="h-5 w-5 shrink-0 text-primary"
                  strokeWidth={2}
                  aria-label={t('profile.verified')}
                />
              )}
              {(role === 'admin' || role === 'moderator') && (
                <Badge
                  variant={role === 'admin' ? 'default' : 'secondary'}
                  className="gap-1"
                >
                  <Shield className="h-3 w-3" strokeWidth={2} />
                  {t(`profile.role.${role}`)}
                </Badge>
              )}
            </div>
            {username && (
              <p className="text-[15px] text-muted-foreground">@{username}</p>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-[15px] leading-relaxed text-foreground/90">
              <MentionText text={bio} />
            </p>
          )}

          {/* Méta : localisation, inscription, niveau, streak */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {hasLocation && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" strokeWidth={1.8} />
                {[location?.city, location?.country].filter(Boolean).join(', ')}
              </span>
            )}
            {joinLabel && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
                {t('profile.joinedOn', { date: joinLabel })}
              </span>
            )}
            {level != null && (
              <span className="inline-flex items-center gap-1 text-foreground/80">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.8} />
                {t('profile.level', { level })}
              </span>
            )}
            {streak != null && streak > 0 && (
              <span className="inline-flex items-center gap-1 text-foreground/80">
                <Flame className="h-4 w-4 text-primary" strokeWidth={1.8} />
                {streak}
              </span>
            )}
          </div>

          {/* Stats inline façon X : Abonnements + Abonnés (le nb de dégustations est en top bar) */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {username && (
              <Link
                to={localizedPath(`/u/${username}/following`)}
                className="hover:underline"
              >
                <Stat
                  count={stats.followingCount}
                  label={t('profile.following')}
                />
              </Link>
            )}
            {username && (
              <Link
                to={localizedPath(`/u/${username}/followers`)}
                className="hover:underline"
              >
                <Stat
                  count={stats.followersCount}
                  label={t('profile.followers')}
                />
              </Link>
            )}
          </div>
        </header>

        {children}
      </div>
    </section>
  )
}
