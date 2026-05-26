import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublicFollowers, usePublicFollowing } from '@/lib/api/user'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'

const PAGE_SIZE = 20

interface Props {
  mode: 'followers' | 'following'
}

// Page partagée pour /:lang/u/:username/followers et /:lang/u/:username/following
export function RelationsPage({ mode }: Props) {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const [page, setPage] = useState(1)

  const followers = usePublicFollowers(
    mode === 'followers' ? username : undefined,
    { page, limit: PAGE_SIZE },
  )
  const following = usePublicFollowing(
    mode === 'following' ? username : undefined,
    { page, limit: PAGE_SIZE },
  )
  const query = mode === 'followers' ? followers : following

  return (
    <section className="space-y-6">
      <header>
        <Link
          to={localizedPath(`/u/${username}`)}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          @{username}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t(`profile.${mode}`)}
        </h1>
      </header>

      {query.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : query.data && query.data.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {t('relations.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {query.data?.data.map((u) => {
            const initials = (u.displayName ?? u.username)
              .split(/\s+/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
            return (
              <Link
                key={u.id}
                to={localizedPath(`/u/${u.username}`)}
                className="flex items-center gap-3 rounded-md border border-border bg-card/30 px-4 py-3 transition-colors hover:bg-card/60"
              >
                <Avatar className="h-10 w-10">
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.displayName ?? u.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{u.username}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {query.data && query.data.total > PAGE_SIZE && (
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
              total: Math.ceil(query.data.total / PAGE_SIZE),
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!query.data.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('pagination.next')}
          </Button>
        </div>
      )}
    </section>
  )
}
