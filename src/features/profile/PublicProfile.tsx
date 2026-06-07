import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { ProfileLayout } from '@/features/profile/components/ProfileLayout'
import {
  useBlock,
  useFollow,
  useMe,
  usePublicUser,
  useUnblock,
  useUnfollow,
} from '@/lib/api/user'
import { ApiError } from '@/lib/api/client'
import { useSession } from '@/lib/auth-client'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { MoreHorizontal, Ban } from 'lucide-react'

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const { data: session } = useSession()
  const isSignedIn = !!session
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
        <div className="-mt-14 space-y-3 px-4 sm:px-5">
          <Skeleton className="h-28 w-28 rounded-full ring-4 ring-background" />
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

  const avatar = (
    <Avatar className="h-28 w-28 ring-4 ring-background">
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
    </Avatar>
  )

  // Relation viewer → cible (absente tant que le back n'est pas déployé → false)
  const isFollowing = user.isFollowing ?? false
  const isBlocked = user.isBlocked ?? false

  // Actions inline (cachées si c'est mon propre profil)
  const actions = !isSelf ? (
    <div className="flex items-center gap-2">
      {isFollowing ? (
        <Button
          onClick={handleUnfollow}
          disabled={unfollow.isPending}
          variant="secondary"
          size="sm"
          className="px-5 font-semibold"
        >
          {t('public.unfollow')}
        </Button>
      ) : (
        <Button
          onClick={handleFollow}
          disabled={follow.isPending}
          size="sm"
          className="px-5 font-semibold glow-primary"
        >
          {t('public.follow')}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More">
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* "Ne plus suivre" seulement si on suit déjà */}
          {isFollowing && (
            <DropdownMenuItem
              onClick={handleUnfollow}
              disabled={unfollow.isPending}
            >
              {t('public.unfollow')}
            </DropdownMenuItem>
          )}
          {/* Bloquer / Débloquer — jamais les deux en même temps */}
          {isBlocked ? (
            <DropdownMenuItem onClick={handleUnblock}>
              {t('public.unblock')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleBlock} className="text-destructive">
              <Ban className="mr-2 h-4 w-4" strokeWidth={1.8} />
              {t('public.block')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : undefined

  return (
    <ProfileLayout
      coverUrl={user.coverUrl}
      avatar={avatar}
      actions={actions}
      displayName={user.displayName ?? user.username}
      username={user.username}
      verified={user.verified}
      role={user.role}
      level={user.gamification?.level}
      location={user.location}
      joinDate={user.joinDate}
      bio={user.bio}
      stats={user.stats}
    >
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
    </ProfileLayout>
  )
}
