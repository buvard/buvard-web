import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { UserLink } from '@/components/UserLink'
import { useTastingLikers } from '@/lib/api/tasting'

interface Props {
  tastingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Bottom-sheet (mobile) / modal centre (desktop) listant les users qui ont
// like un tasting. Fetch lance UNIQUEMENT quand le dialog est ouvert (enabled).
export function LikersDialog({ tastingId, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const { data, isPending, isError } = useTastingLikers(tastingId, open)

  const likers = data?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent bottomSheet className="overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>{t('likers.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isPending ? (
            <ul className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </li>
              ))}
            </ul>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">{t('likers.error')}</p>
          ) : likers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('likers.empty')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {likers.map((u) => {
                const display = u.displayName?.trim() || u.username
                const initials = display
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                return (
                  <li key={u.id} className="py-2.5">
                    <UserLink
                      username={u.username}
                      className="flex items-center gap-3"
                      onClick={() => onOpenChange(false)}
                    >
                      <Avatar className="h-10 w-10">
                        {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={display} />}
                        <AvatarFallback className="bg-muted text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{display}</p>
                        <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </UserLink>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
