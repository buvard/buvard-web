import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TastingCard } from '@/components/TastingCard'
import { CategoryBreakdown } from '@/components/CategoryBreakdown'
import { ProfileCover } from '@/components/ProfileCover'
import {
  ImagePicker,
  IMAGE_MAX_SIZE_MB,
} from '@/components/ImagePicker'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import {
  useDeleteAvatar,
  useDeleteCover,
  useMe,
  useStats,
  useUploadAvatar,
  useUploadCover,
} from '@/lib/api/user'
import type { Tasting } from '@/lib/types'
import {
  Settings,
  MapPin,
  BadgeCheck,
  Flame,
  Camera,
  Trash2,
  ImageIcon,
  Loader2,
} from 'lucide-react'

// Stat compacte cliquable (followers/following) ou simple (tasted)
function Stat({
  label,
  value,
  to,
}: {
  label: string
  value: number | string
  to?: string
}) {
  const inner = (
    <div className="flex flex-col items-start">
      <span className="text-base font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
  return to ? (
    <Link to={to} className="transition-opacity hover:opacity-70">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const localizedPath = useLocalizedPath()
  const me = useMe()
  const stats = useStats()

  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const uploadCover = useUploadCover()
  const deleteCover = useDeleteCover()

  // TODO: récupérer les dégustations depuis le backend
  const tastings: Tasting[] = []
  const favorites: Tasting[] = []

  // Loading state
  if (me.isPending) {
    return (
      <section className="-mx-4 -mt-4 sm:-mx-5">
        <Skeleton className="h-32 w-full rounded-b-xl sm:h-40" />
        <div className="-mt-12 px-1">
          <Skeleton className="h-20 w-20 rounded-full ring-4 ring-background" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </section>
    )
  }

  const displayName = me.data?.displayName ?? me.data?.username ?? '?'
  const username = me.data?.username
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const tastingsCount =
    stats.data?.tastingsCount ?? me.data?.stats.tastingsCount ?? 0
  const followersCount =
    stats.data?.followersCount ?? me.data?.stats.followersCount ?? 0
  const followingCount =
    stats.data?.followingCount ?? me.data?.stats.followingCount ?? 0
  const gamification = stats.data?.gamification ?? me.data?.gamification
  const streak = gamification?.streak.current ?? 0
  const tastingsByCategory = me.data?.stats.tastingsByCategory ?? {}

  const joinDate = stats.data?.joinDate ?? me.data?.createdAt
  const joinLabel = joinDate
    ? new Date(joinDate).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
      })
    : null

  const hasAvatar = !!me.data?.avatarUrl
  const hasCover = !!me.data?.coverUrl
  const avatarBusy = uploadAvatar.isPending || deleteAvatar.isPending
  const coverBusy = uploadCover.isPending || deleteCover.isPending

  // ---- Handlers upload ----
  function onRejected(reason: 'mime' | 'size') {
    toast.error(
      reason === 'mime'
        ? t('upload.errors.mime')
        : t('upload.errors.size', { mb: IMAGE_MAX_SIZE_MB }),
    )
  }

  function handlePickAvatar(file: File) {
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success(t('upload.avatarUpdated')),
      onError: () => toast.error(t('upload.failed')),
    })
  }

  function handleDeleteAvatar() {
    deleteAvatar.mutate(undefined, {
      onSuccess: () => toast.success(t('upload.avatarRemoved')),
      onError: () => toast.error(t('upload.failed')),
    })
  }

  function handlePickCover(file: File) {
    uploadCover.mutate(file, {
      onSuccess: () => toast.success(t('upload.coverUpdated')),
      onError: () => toast.error(t('upload.failed')),
    })
  }

  function handleDeleteCover() {
    deleteCover.mutate(undefined, {
      onSuccess: () => toast.success(t('upload.coverRemoved')),
      onError: () => toast.error(t('upload.failed')),
    })
  }

  return (
    <section className="-mx-4 -mt-4 sm:-mx-5">
      {/* Cover en bord-à-bord */}
      <div className="relative">
        <ProfileCover coverUrl={me.data?.coverUrl} />

        {/* Bouton settings flottant */}
        <Button
          asChild
          variant="secondary"
          size="icon"
          aria-label={t('settings.title')}
          className="absolute right-4 top-4 h-9 w-9 rounded-full bg-background/70 backdrop-blur-md hover:bg-background/90"
        >
          <Link to={localizedPath('/settings')}>
            <Settings className="h-4 w-4 text-foreground" strokeWidth={1.8} />
          </Link>
        </Button>

        {/* Menu cover : changer / supprimer */}
        <ImagePicker onPick={handlePickCover} onRejected={onRejected}>
          {(openPicker) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={t('upload.cover')}
                  disabled={coverBusy}
                  className="absolute bottom-3 right-4 h-9 w-9 rounded-full bg-background/70 backdrop-blur-md hover:bg-background/90"
                >
                  {coverBusy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-foreground"
                      strokeWidth={1.8}
                    />
                  ) : (
                    <ImageIcon
                      className="h-4 w-4 text-foreground"
                      strokeWidth={1.8}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openPicker}>
                  <Camera className="mr-2 h-4 w-4" strokeWidth={1.8} />
                  {hasCover ? t('upload.replace') : t('upload.add')}
                </DropdownMenuItem>
                {hasCover && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteCover}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.8} />
                      {t('upload.remove')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </ImagePicker>
      </div>

      <div className="space-y-6 px-4 pb-4 sm:px-5">
        <header className="space-y-3">
          {/* Avatar avec menu d'upload */}
          <div className="-mt-10">
            <ImagePicker onPick={handlePickAvatar} onRejected={onRejected}>
              {(openPicker) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={t('upload.avatar')}
                      disabled={avatarBusy}
                      className="group relative inline-flex"
                    >
                      <Avatar className="h-20 w-20 ring-4 ring-background transition-opacity group-hover:opacity-80">
                        {me.data?.avatarUrl && (
                          <AvatarImage src={me.data.avatarUrl} alt="" />
                        )}
                        <AvatarFallback className="text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-[0_0_12px_-2px_rgba(139,38,53,0.6)]">
                        {avatarBusy ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            strokeWidth={2}
                          />
                        ) : (
                          <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                        )}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={openPicker}>
                      <Camera className="mr-2 h-4 w-4" strokeWidth={1.8} />
                      {hasAvatar ? t('upload.replace') : t('upload.add')}
                    </DropdownMenuItem>
                    {hasAvatar && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleDeleteAvatar}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.8} />
                          {t('upload.remove')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </ImagePicker>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {displayName}
              </h1>
              {me.data?.verified && (
                <BadgeCheck
                  className="h-5 w-5 shrink-0 text-primary"
                  strokeWidth={2}
                  aria-label={t('profile.verified')}
                />
              )}
              {gamification && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {t('profile.level', { level: gamification.level })}
                </span>
              )}
              {streak > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card/50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground">
                  <Flame className="h-3 w-3 text-primary" strokeWidth={2} />
                  {streak}
                </span>
              )}
            </div>

            {username && (
              <p className="text-sm text-muted-foreground">@{username}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {(me.data?.location?.city || me.data?.location?.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" strokeWidth={1.8} />
                  {[me.data.location?.city, me.data.location?.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
              {joinLabel && (
                <span>{t('profile.joinedOn', { date: joinLabel })}</span>
              )}
            </div>
          </div>

          {me.data?.bio && (
            <p className="text-sm leading-relaxed text-foreground/85">
              {me.data.bio}
            </p>
          )}
        </header>

        <div className="flex gap-6">
          <Stat label={t('profile.tasted')} value={tastingsCount} />
          {username && (
            <Stat
              label={t('profile.followers')}
              value={followersCount}
              to={localizedPath(`/u/${username}/followers`)}
            />
          )}
          {username && (
            <Stat
              label={t('profile.following')}
              value={followingCount}
              to={localizedPath(`/u/${username}/following`)}
            />
          )}
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              {t('profile.tabs.all')}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">
              {t('profile.tabs.favorites')}
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">
              {t('profile.tabs.categories')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {tastings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('profile.empty')}
              </p>
            ) : (
              <div className="space-y-3">
                {tastings.map((tasting) => (
                  <TastingCard key={tasting.id} tasting={tasting} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('profile.empty')}
              </p>
            ) : (
              <div className="space-y-3">
                {favorites.map((tasting) => (
                  <TastingCard key={tasting.id} tasting={tasting} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <CategoryBreakdown
              data={tastingsByCategory}
              total={tastingsCount}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
