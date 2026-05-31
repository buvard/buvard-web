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
import { ImagePicker, IMAGE_MAX_SIZE_MB } from '@/components/ImagePicker'
import { ProfileLayout } from '@/features/profile/components/ProfileLayout'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import {
  useDeleteAvatar,
  useDeleteCover,
  useMe,
  useStats,
  useUploadAvatar,
  useUploadCover,
} from '@/lib/api/user'
import { useMyTastings } from '@/lib/api/tasting'
import { Map, Settings, Camera, Trash2, ImageIcon, Loader2 } from 'lucide-react'

export function ProfilePage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const me = useMe()
  const stats = useStats()

  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const uploadCover = useUploadCover()
  const deleteCover = useDeleteCover()

  // Liste paginee — V1 affiche la 1ere page (20 elements). La pagination viendra
  // avec l'ecran detail / scroll infini sur profil (post-V1).
  const myTastings = useMyTastings({ limit: 20 })
  const tastings = myTastings.data?.data ?? []

  // Loading state
  if (me.isPending) {
    return (
      <section className="-mx-4 -mt-4 sm:-mx-5">
        <Skeleton className="h-32 w-full rounded-b-xl sm:h-40" />
        <div className="-mt-14 px-1">
          <Skeleton className="h-28 w-28 rounded-full ring-4 ring-background" />
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
  const role = me.data?.role
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

  // Boutons posés sur la cover : réglages + menu d'upload cover
  const coverOverlay = (
    <>
      <Button
        asChild
        variant="secondary"
        size="icon"
        aria-label={t('map.title')}
        className="absolute right-16 top-4 h-9 w-9 rounded-full bg-background/70 backdrop-blur-md hover:bg-background/90"
      >
        <Link to={localizedPath('/map')}>
          <Map className="h-4 w-4 text-foreground" strokeWidth={1.8} />
        </Link>
      </Button>
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
    </>
  )

  // Avatar éditable : menu changer / supprimer
  const avatar = (
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
              <Avatar className="h-28 w-28 ring-4 ring-background">
                {me.data?.avatarUrl && (
                  <AvatarImage src={me.data.avatarUrl} alt="" />
                )}
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-[0_0_12px_-2px_rgba(139,38,53,0.6)]">
                {avatarBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
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
  )

  return (
    <ProfileLayout
      coverUrl={me.data?.coverUrl}
      coverOverlay={coverOverlay}
      avatar={avatar}
      displayName={displayName}
      username={username}
      verified={me.data?.verified}
      role={role}
      level={gamification?.level}
      streak={streak}
      location={me.data?.location}
      joinDate={joinDate}
      bio={me.data?.bio}
      stats={{ tastingsCount, followersCount, followingCount }}
    >
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
          {myTastings.isPending ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl border border-border bg-card/30"
                />
              ))}
            </div>
          ) : tastings.length === 0 ? (
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
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('profile.favoritesComingSoon')}
          </p>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryBreakdown data={tastingsByCategory} total={tastingsCount} />
        </TabsContent>
      </Tabs>
    </ProfileLayout>
  )
}
