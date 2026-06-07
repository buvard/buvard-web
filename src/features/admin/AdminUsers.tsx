import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Minus, Plus, RotateCcw, Search } from 'lucide-react'
import {
  useAdminAdjustXp,
  useAdminResetXp,
  useAdminSetXp,
} from '@/lib/api/admin'
import { usePublicUser, useSearchUsers } from '@/lib/api/user'
import { cn } from '@/lib/utils'

export function AdminUsersPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const search = useSearchUsers(debounced)

  // Debounce simple inline pour le search
  useDebouncedEffect(
    () => setDebounced(query),
    [query],
    300,
  )

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('admin.users.subtitle')}</p>

      {/* Recherche */}
      <div className="space-y-1.5">
        <Label htmlFor="user-search">{t('admin.users.searchLabel')}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
          <Input
            id="user-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Resultats */}
      {debounced.trim().length >= 2 && (
        <div className="space-y-2">
          {search.isFetching ? (
            <Skeleton className="h-14 w-full rounded-xl" />
          ) : search.data && search.data.length > 0 ? (
            <ul className="space-y-1.5">
              {search.data.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedUsername(u.username)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border bg-card/40 px-3 py-2.5 text-left transition-colors hover:bg-card/70',
                      selectedUsername === u.username
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-border',
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                      <AvatarFallback>
                        {(u.displayName ?? u.username)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {u.displayName ?? u.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{u.username}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('admin.users.noResults')}
            </p>
          )}
        </div>
      )}

      {/* Panneau XP du user selectionne */}
      {selectedUsername && (
        <UserXpPanel
          username={selectedUsername}
          onClear={() => setSelectedUsername(null)}
        />
      )}
    </section>
  )
}

function UserXpPanel({
  username,
  onClear,
}: {
  username: string
  onClear: () => void
}) {
  const { t } = useTranslation()
  const user = usePublicUser(username)
  const adjust = useAdminAdjustXp()
  const setXp = useAdminSetXp()
  const reset = useAdminResetXp()
  const [delta, setDelta] = useState('10')
  const [absolute, setAbsolute] = useState('')

  if (user.isPending) {
    return <Skeleton className="h-32 w-full rounded-xl" />
  }
  if (user.isError || !user.data) {
    return (
      <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {t('admin.users.loadError')}
      </p>
    )
  }

  const u = user.data
  const userId = u.id
  const currentXp = u.gamification?.xp ?? 0
  const currentLevel = u.gamification?.level ?? 1
  const isBusy = adjust.isPending || setXp.isPending || reset.isPending

  function handleAdjust(sign: 1 | -1) {
    const parsed = parseInt(delta, 10)
    if (!Number.isFinite(parsed) || parsed === 0) return
    const finalDelta = sign * Math.abs(parsed)
    adjust.mutate(
      { userId, delta: finalDelta },
      {
        onSuccess: (snap) => {
          toast.success(
            t('admin.users.adjusted', {
              sign: sign > 0 ? '+' : '−',
              amount: Math.abs(parsed),
              xp: snap.xp,
            }),
          )
          void user.refetch()
        },
        onError: () => toast.error(t('admin.users.actionError')),
      },
    )
  }

  function handleSetAbsolute() {
    const parsed = parseInt(absolute, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return
    setXp.mutate(
      { userId, xp: parsed },
      {
        onSuccess: (snap) => {
          toast.success(t('admin.users.setSuccess', { xp: snap.xp }))
          setAbsolute('')
          void user.refetch()
        },
        onError: () => toast.error(t('admin.users.actionError')),
      },
    )
  }

  function handleReset() {
    reset.mutate(userId, {
      onSuccess: () => {
        toast.success(t('admin.users.resetSuccess'))
        void user.refetch()
      },
      onError: () => toast.error(t('admin.users.actionError')),
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/30 p-4">
      {/* Header user */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
            <AvatarFallback>
              {(u.displayName ?? u.username)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {u.displayName ?? u.username}
            </p>
            <p className="text-xs text-muted-foreground">@{u.username}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onClear}>
          {t('common.clear')}
        </Button>
      </header>

      {/* Etat actuel */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label={t('profile.level', { level: '' })} value={String(currentLevel)} />
        <Stat label="XP" value={String(currentXp)} />
        <Stat
          label={t('admin.users.grade')}
          value={u.gamification?.grade ?? '—'}
        />
      </div>

      {/* Adjust delta */}
      <div className="space-y-2">
        <Label htmlFor="delta">{t('admin.users.adjustLabel')}</Label>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => handleAdjust(-1)}
            className="gap-1"
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Button>
          <Input
            id="delta"
            type="number"
            min={1}
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            className="text-center"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => handleAdjust(1)}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      {/* Set absolu */}
      <div className="space-y-2">
        <Label htmlFor="absolute">{t('admin.users.setLabel')}</Label>
        <div className="flex gap-2">
          <Input
            id="absolute"
            type="number"
            min={0}
            value={absolute}
            onChange={(e) => setAbsolute(e.target.value)}
            placeholder={t('admin.users.setPlaceholder')}
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={isBusy || !absolute.trim()}
            onClick={handleSetAbsolute}
          >
            {setXp.isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            {t('admin.users.setAction')}
          </Button>
        </div>
      </div>

      {/* Reset */}
      <Button
        size="sm"
        variant="destructive"
        disabled={isBusy}
        onClick={handleReset}
        className="w-full gap-1.5"
      >
        {reset.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        {t('admin.users.reset')}
      </Button>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-2 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

// Petit helper debounce inline pour ne pas importer une lib.
function useDebouncedEffect(effect: () => void, deps: unknown[], delay: number) {
  useEffect(() => {
    const id = setTimeout(effect, delay)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
