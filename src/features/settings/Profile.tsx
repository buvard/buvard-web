import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import { ProfileCover } from '@/components/ProfileCover'
import {
  ImagePicker,
  IMAGE_MAX_SIZE_MB,
} from '@/components/ImagePicker'
import {
  useDeleteAvatar,
  useDeleteCover,
  useMe,
  useUpdateMe,
  useUploadAvatar,
  useUploadCover,
} from '@/lib/api/user'
import { ApiError } from '@/lib/api/client'
import { TASTING_TYPES, type TastingType } from '@/types'
import { cn } from '@/lib/utils'
import { Camera, Loader2, Trash2 } from 'lucide-react'

// Section Photos : avatar + cover avec upload/delete inline.
function PhotosSection() {
  const { t } = useTranslation()
  const me = useMe()
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const uploadCover = useUploadCover()
  const deleteCover = useDeleteCover()

  function onRejected(reason: 'mime' | 'size') {
    toast.error(
      reason === 'mime'
        ? t('upload.errors.mime')
        : t('upload.errors.size', { mb: IMAGE_MAX_SIZE_MB }),
    )
  }

  function pickAvatar(file: File) {
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success(t('upload.avatarUpdated')),
      onError: () => toast.error(t('upload.failed')),
    })
  }
  function pickCover(file: File) {
    uploadCover.mutate(file, {
      onSuccess: () => toast.success(t('upload.coverUpdated')),
      onError: () => toast.error(t('upload.failed')),
    })
  }

  const initials = (
    me.data?.displayName?.[0] ?? me.data?.username?.[0] ?? '?'
  ).toUpperCase()
  const hasAvatar = !!me.data?.avatarUrl
  const hasCover = !!me.data?.coverUrl
  const avatarBusy = uploadAvatar.isPending || deleteAvatar.isPending
  const coverBusy = uploadCover.isPending || deleteCover.isPending

  return (
    <div className="space-y-4">
      {/* Cover preview + actions */}
      <div className="space-y-2">
        <Label>{t('upload.cover')}</Label>
        <div className="relative overflow-hidden rounded-xl border border-border">
          <ProfileCover coverUrl={me.data?.coverUrl} />
          <div className="flex items-center gap-2 border-t border-border bg-card/40 px-3 py-2">
            <ImagePicker onPick={pickCover} onRejected={onRejected}>
              {(open) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={open}
                  disabled={coverBusy}
                  className="gap-1.5"
                >
                  {coverBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
                  ) : (
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                  {hasCover ? t('upload.replace') : t('upload.add')}
                </Button>
              )}
            </ImagePicker>
            {hasCover && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  deleteCover.mutate(undefined, {
                    onSuccess: () => toast.success(t('upload.coverRemoved')),
                  })
                }
                disabled={coverBusy}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                {t('upload.remove')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Avatar preview + actions */}
      <div className="space-y-2">
        <Label>{t('upload.avatar')}</Label>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card/30 p-3">
          <Avatar className="h-16 w-16">
            {me.data?.avatarUrl && (
              <AvatarImage src={me.data.avatarUrl} alt="" />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <ImagePicker onPick={pickAvatar} onRejected={onRejected}>
              {(open) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={open}
                  disabled={avatarBusy}
                  className="gap-1.5"
                >
                  {avatarBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
                  ) : (
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                  {hasAvatar ? t('upload.replace') : t('upload.add')}
                </Button>
              )}
            </ImagePicker>
            {hasAvatar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  deleteAvatar.mutate(undefined, {
                    onSuccess: () => toast.success(t('upload.avatarRemoved')),
                  })
                }
                disabled={avatarBusy}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                {t('upload.remove')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Édition du profil app Buvard (username, displayName, bio, location, etc.).
// À ne pas confondre avec le compte Clerk (email/mot de passe) qui a sa propre page.
export function SettingsProfilePage() {
  const { t } = useTranslation()
  const me = useMe()
  const updateMe = useUpdateMe()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [favs, setFavs] = useState<TastingType[]>([])

  useEffect(() => {
    if (!me.data) return
    setUsername(me.data.username ?? '')
    setDisplayName(me.data.displayName ?? '')
    setBio(me.data.bio ?? '')
    setCountry(me.data.location?.country ?? '')
    setCity(me.data.location?.city ?? '')
    setBirthYear(me.data.birthYear ? String(me.data.birthYear) : '')
    setFavs(me.data.favoriteCategories ?? [])
  }, [me.data])

  function toggleFav(type: TastingType) {
    setFavs((prev) =>
      prev.includes(type) ? prev.filter((p) => p !== type) : [...prev, type],
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!me.data) return
    const payload: Parameters<typeof updateMe.mutateAsync>[0] = {}
    const u = username.trim().toLowerCase()
    if (u !== me.data.username) payload.username = u
    if (displayName.trim() !== (me.data.displayName ?? ''))
      payload.displayName = displayName.trim()
    if (bio.trim() !== (me.data.bio ?? '')) payload.bio = bio.trim()
    const loc: { country?: string; city?: string } = {}
    if (country.trim()) loc.country = country.trim().toUpperCase().slice(0, 2)
    if (city.trim()) loc.city = city.trim()
    if (
      loc.country !== me.data.location?.country ||
      loc.city !== me.data.location?.city
    ) {
      payload.location = loc
    }
    const by = birthYear ? Number(birthYear) : undefined
    if (by !== me.data.birthYear) payload.birthYear = by
    if (
      favs.length !== (me.data.favoriteCategories?.length ?? 0) ||
      favs.some((f) => !me.data!.favoriteCategories.includes(f))
    ) {
      payload.favoriteCategories = favs
    }
    if (Object.keys(payload).length === 0) return
    try {
      await updateMe.mutateAsync(payload)
      toast.success(t('settings.saved'))
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(t('settings.profile.usernameTaken'))
      } else {
        toast.error(t('settings.saveError'))
      }
    }
  }

  return (
    <SettingsPageShell
      title={t('settings.profile.title')}
      subtitle={t('settings.profile.subtitle')}
    >
      <PhotosSection />

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">{t('settings.profile.username')}</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))
            }
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">
            {t('settings.profile.displayName')}
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">{t('settings.profile.bio')}</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('settings.profile.bioPlaceholder')}
            maxLength={280}
            rows={3}
          />
          <p className="text-right text-xs text-muted-foreground tabular-nums">
            {bio.length}/280
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">{t('settings.profile.country')}</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              placeholder={t('settings.profile.countryPlaceholder')}
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">{t('settings.profile.city')}</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('settings.profile.cityPlaceholder')}
              maxLength={80}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthYear">{t('settings.profile.birthYear')}</Label>
          <Input
            id="birthYear"
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            min={1900}
            max={new Date().getFullYear() - 18}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('settings.profile.favoriteCategories')}</Label>
          <div className="flex flex-wrap gap-2">
            {TASTING_TYPES.map((type) => {
              const active = favs.includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleFav(type)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`types.${type}`)}
                </button>
              )
            })}
          </div>
        </div>
        <Button type="submit" disabled={updateMe.isPending}>
          {t('settings.profile.save')}
        </Button>
      </form>
    </SettingsPageShell>
  )
}
