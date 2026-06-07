import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import { useLikeTasting, useUnlikeTasting } from '@/lib/api/tasting'
import { useSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface Props {
  tastingId: string
  isLiked: boolean
  count: number
  // 'sm' : compact dans une card. 'md' : plus prominent pour la page detail.
  size?: 'sm' | 'md'
  // Si fourni, le compteur "X j'aime" devient cliquable et appelle ce callback
  // (typique : ouvrir un bottomsheet listant les likers).
  onCountClick?: () => void
  className?: string
}

// Heart icon (toggle like) + compteur "X j'aime" (cliquable si onCountClick).
// Optimistic update via useLikeTasting / useUnlikeTasting.
export function LikeButton({
  tastingId,
  isLiked,
  count,
  size = 'sm',
  onCountClick,
  className,
}: Props) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const like = useLikeTasting()
  const unlike = useUnlikeTasting()
  const busy = like.isPending || unlike.isPending

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) return
    if (isLiked) unlike.mutate(tastingId)
    else like.mutate(tastingId)
  }

  function handleCount(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onCountClick?.()
  }

  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
  const textSize = size === 'md' ? 'text-sm' : 'text-xs'

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={!session || busy}
        aria-label={isLiked ? t('tasting.like.unlikeAria') : t('tasting.like.likeAria')}
        aria-pressed={isLiked}
        className={cn(
          'inline-flex items-center rounded-full text-foreground/80 transition-colors',
          !session && 'cursor-not-allowed opacity-60',
          session && 'hover:text-primary',
        )}
      >
        <Heart
          className={cn(
            iconSize,
            'transition-all',
            isLiked && 'fill-primary text-primary',
          )}
          strokeWidth={isLiked ? 0 : 1.8}
        />
      </button>
      {count > 0 &&
        (onCountClick ? (
          <button
            type="button"
            onClick={handleCount}
            className={cn(
              'rounded-sm font-medium tabular-nums text-foreground/80 transition-colors hover:text-foreground hover:underline',
              textSize,
            )}
          >
            {t('tasting.like.count', { count })}
          </button>
        ) : (
          <span className={cn('font-medium tabular-nums text-foreground/80', textSize)}>
            {t('tasting.like.count', { count })}
          </span>
        ))}
    </div>
  )
}
