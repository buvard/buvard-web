import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserLink } from '@/components/UserLink'
import { useBlocks, useUnblock } from '@/lib/api/user'

const PAGE_SIZE = 20

export function BlockedUsersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const blocks = useBlocks({ page, limit: PAGE_SIZE })
  const unblock = useUnblock()

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('blocked.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('blocked.subtitle')}
        </p>
      </header>

      {blocks.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : blocks.data && blocks.data.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {t('blocked.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {blocks.data?.data.map((u) => {
            const initials = (u.displayName ?? u.username)
              .split(/\s+/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card/30 px-4 py-3"
              >
                <Avatar className="h-10 w-10">
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <UserLink username={u.username} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.displayName ?? u.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{u.username}
                  </p>
                </UserLink>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unblock.mutate(u.username)}
                  disabled={unblock.isPending}
                >
                  {t('blocked.unblock')}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {blocks.data && blocks.data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('pagination.prev')}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t('pagination.pageOf', {
              page,
              total: Math.ceil(blocks.data.total / PAGE_SIZE),
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!blocks.data.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('pagination.next')}
          </Button>
        </div>
      )}
    </section>
  )
}
