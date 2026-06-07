import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  Info,
  MapPin,
  Shield,
  Flame,
  ArrowLeft,
  CalendarDays,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MentionText } from '@/components/MentionText'
import { ProfileCover } from '@/components/ProfileCover'
import { UserSearch } from '@/components/UserSearch'
import { LevelPopover } from '@/features/profile/components/LevelPopover'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useGrades } from '@/lib/api/grade'
import { xpProgress } from '@/lib/gamification'
import type { UserLocation, UserRole } from '@/types'

// Resoud le nom d'icone Lucide stocke en BDD (sur Grade.icon) vers le
// composant React. Fallback Sparkles si nom inconnu.
function resolveGradeIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>
  return icons[name] ?? LucideIcons.Sparkles
}

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
  // Si xp est fourni en plus de level, on affiche la barre de progression
  // (profile perso uniquement — le public ne sert que le level).
  xp?: number
  streak?: number
  // Plus grand streak jamais atteint — affiche en tooltip sur l'icone flame.
  longestStreak?: number
  // Cle du grade a afficher comme sous-titre sous @username. Resolue dans
  // le composant via useGrades (icon + color depuis la BDD). Si absente,
  // pas de badge grade affiche.
  gradeKey?: string | null
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
  xp,
  streak,
  longestStreak,
  gradeKey,
  location,
  joinDate,
  bio,
  stats,
  children,
}: ProfileLayoutProps) {
  const { t, i18n } = useTranslation()
  const localizedPath = useLocalizedPath()
  const navigate = useNavigate()
  // Mode "recherche d'utilisateurs" dans la top bar : remplace le titre par
  // un UserSearch full-width tant qu'actif.
  const [searchOpen, setSearchOpen] = useState(false)

  // Resolution du grade : on prend la cle effective (displayGrade en prio,
  // sinon grade auto deja resolu par l'appelant) et on cherche la def
  // complete (icon + color) dans le cache useGrades.
  const grades = useGrades()
  const grade = gradeKey
    ? grades.data?.find((g) => g.key === gradeKey)
    : undefined

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
      {/* Top bar façon X. `top: -1rem` compense le `pt-4` du scroll container
          parent (AppLayout). Mode searchOpen : on remplace simplement titre +
          bouton search par UserSearch en pleine largeur. Click outside ou
          select ferme via UserSearch.onClose. */}
      <div className="sticky -top-4 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl">
        {canGoBack && !searchOpen && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        {searchOpen ? (
          <div className="min-w-0 flex-1">
            <UserSearch autoFocus onClose={() => setSearchOpen(false)} />
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold leading-tight text-foreground">
                {displayName}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('profile.tastings', { count: stats.tastingsCount })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t('search.placeholder')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
            >
              <Search className="h-5 w-5" strokeWidth={2} />
            </button>
          </>
        )}
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

          {/* Nom + handle + badge grade en face du nom */}
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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

              {/* Badge grade : a cote du nom (cf verified / admin).
                  Cliquable -> LevelPopover (profil perso : xp present).
                  Sur public, lecture seule. */}
              {grade && level != null && (() => {
                const Icon = resolveGradeIcon(grade.icon)
                const badgeContent = (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
                    style={{
                      borderColor: `${grade.color}66`,
                      backgroundColor: `${grade.color}1F`,
                      color: grade.color,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {t(`settings.levels.grades.${grade.key}.name`)}
                    <span className="ml-1 text-foreground/60">
                      · {t('profile.level', { level })}
                    </span>
                  </span>
                )
                return xp != null ? (
                  <LevelPopover
                    level={level}
                    xp={xp}
                    streak={streak}
                    longestStreak={longestStreak}
                  >
                    <button
                      type="button"
                      className="inline-flex hover:opacity-90"
                      aria-label={t('profile.levelDialog.title')}
                    >
                      {badgeContent}
                    </button>
                  </LevelPopover>
                ) : (
                  badgeContent
                )
              })()}
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

          {/* Méta : localisation, inscription, streak. Le level est desormais
              integre au badge grade au-dessus — plus de doublon ici. */}
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
            {streak != null && streak > 0 && (
              <span
                className="inline-flex items-center gap-1 text-foreground/80"
                title={
                  longestStreak && longestStreak > streak
                    ? t('profile.streakLongest', { count: longestStreak })
                    : undefined
                }
              >
                <Flame className="h-4 w-4 text-primary" strokeWidth={1.8} />
                {t('profile.streak', { count: streak })}
              </span>
            )}
          </div>

          {/* Barre de progression XP — uniquement profil perso (xp prop).
              Plus de label "NIVEAU N" repete (deja dans le badge grade).
              Click sur la barre = meme popover que le badge. */}
          {level != null && xp != null && (() => {
            const prog = xpProgress(xp, level)
            return (
              <LevelPopover
                level={level}
                xp={xp}
                streak={streak}
                longestStreak={longestStreak}
              >
                <button
                  type="button"
                  aria-label={t('profile.levelDialog.title')}
                  className="group -mx-2 w-full space-y-1.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-card/30"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 group-hover:text-foreground">
                      <Info className="h-3 w-3 text-muted-foreground/70 group-hover:text-primary" strokeWidth={2} />
                      {t('profile.xpProgressLabel')}
                    </span>
                    <span className="tabular-nums">
                      {xp} / {prog.nextThreshold} XP
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${prog.progress * 100}%` }}
                      aria-hidden
                    />
                  </div>
                </button>
              </LevelPopover>
            )
          })()}

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
