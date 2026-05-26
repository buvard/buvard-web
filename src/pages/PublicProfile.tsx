import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProfileCover } from '@/components/ProfileCover'
import {
  useBlock,
  useFollow,
  useMe,
  usePublicUser,
  useUnblock,
  useUnfollow,
} from '@/lib/api/user'
import { ApiError } from '@/lib/api/client'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { BadgeCheck, MapPin, MoreHorizontal, Ban } from 'lucide-react'

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const { isSignedIn } = useAuth()
  const me = useMe()
  const { data: user, isPending, isError, error } = usePublicUser(username)
  const follow = useFollow()
  const unfollow = useUnfollow()
  const block = useBlock()
  const unblock = useUnblock()

  if (isPending) {
    return (
      <section className="-mx-4 -mt-4 sm:-mx-5">
        <Skeleton className="h-32 w-full rounded-b-xl sm:h-40" />
        <div className="-mt-12 space-y-3 px-4 sm:px-5">
          <Skeleton className="h-20 w-20 rounded-full ring-4 ring-background" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </section>
    )
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <section className="flex flex-col items-start gap-3 pt-12">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {notFound ? '404' : 'Erreur'}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          @{username}
        </h1>
        <p className="text-sm text-muted-foreground">
          {notFound ? t('public.notFound') : error.message}
        </p>
      </section>
    )
  }

  const isSelf = me.data?.username === user.username
  const initials = (user.displayName ?? user.username)
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const joinLabel = user.joinDate
    ? new Date(user.joinDate).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
      })
    : null

  function requireAuth(): boolean {
    if (!isSignedIn) {
      navigate(localizedPath('/sign-in'))
      return false
    }
    return true
  }

  function handleFollow() {
    if (!requireAuth() || !username) return
    follow.mutate(username, {
      onError: (err) => {
        if (err instanceof ApiError && err.status === 403) {
          toast.error(t('public.followForbidden'))
        } else if (err instanceof ApiError && err.status === 400) {
          toast.error(t('public.selfAction'))
        } else {
          toast.error(t('settings.saveError'))
        }
      },
    })
  }

  function handleUnfollow() {
    if (!requireAuth() || !username) return
    unfollow.mutate(username)
  }

  function handleBlock() {
    if (!requireAuth() || !username) return
    block.mutate(username, {
      onError: () => toast.error(t('settings.saveError')),
      onSuccess: () => toast.success(t('public.blocked')),
    })
  }

  function handleUnblock() {
    if (!requireAuth() || !username) return
    unblock.mutate(username, {
      onSuccess: () => toast.success(t('public.unblocked')),
    })
  }

  return (
    <section className="-mx-4 -mt-4 sm:-mx-5">
      {/* Cover en bord-à-bord */}
      <ProfileCover coverUrl={user.coverUrl} />

      <div className="space-y-6 px-4 pb-4 sm:px-5">
        {/* Avatar + identité */}
        <header className="space-y-3">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar className="h-20 w-20 ring-4 ring-background">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>

            {/* Actions inline (cachées si c'est mon propre profil) */}
            {!isSelf && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleFollow}
                  disabled={follow.isPending}
                  size="sm"
                  className="glow-primary"
                >
                  {t('public.follow')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="More">
                      <MoreHorizontal
                        className="h-4 w-4"
                        strokeWidth={1.8}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleUnfollow}
                      disabled={unfollow.isPending}
                    >
                      {t('public.unfollow')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleBlock}
                      className="text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" strokeWidth={1.8} />
                      {t('public.block')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleUnblock}>
                      {t('public.unblock')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {user.displayName ?? user.username}
              </h1>
              {user.verified && (
                <BadgeCheck
                  className="h-5 w-5 shrink-0 text-primary"
                  strokeWidth={2}
                  aria-label={t('profile.verified')}
                />
              )}
              {user.gamification && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {t('profile.level', { level: user.gamification.level })}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">@{user.username}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {(user.location?.city || user.location?.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" strokeWidth={1.8} />
                  {[user.location.city, user.location.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
              {joinLabel && (
                <span>{t('profile.joinedOn', { date: joinLabel })}</span>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="text-sm leading-relaxed text-foreground/85">
              {user.bio}
            </p>
          )}
        </header>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="flex flex-col items-start">
            <span className="text-base font-semibold tabular-nums text-foreground">
              {user.stats.tastingsCount}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t('profile.tasted')}
            </span>
          </div>
          <Link
            to={localizedPath(`/u/${user.username}/followers`)}
            className="flex flex-col items-start transition-opacity hover:opacity-70"
          >
            <span className="text-base font-semibold tabular-nums text-foreground">
              {user.stats.followersCount}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t('profile.followers')}
            </span>
          </Link>
          <Link
            to={localizedPath(`/u/${user.username}/following`)}
            className="flex flex-col items-start transition-opacity hover:opacity-70"
          >
            <span className="text-base font-semibold tabular-nums text-foreground">
              {user.stats.followingCount}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t('profile.following')}
            </span>
          </Link>
        </div>

        {/* Catégories préférées */}
        {user.favoriteCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('settings.profile.favoriteCategories')}
            </p>
            <div className="flex flex-wrap gap-2">
              {user.favoriteCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="font-normal">
                  {t(`types.${cat}`)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
