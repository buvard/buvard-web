import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  photoUrls: string[]
  alt: string
  // Si fourni, affiche la pastille note bordeaux en overlay bas-droit.
  rating?: number
  // Aspect ratio par defaut '4/5' (mobile-friendly), peut etre override.
  aspect?: string
  // Si fourni, chaque slide est wrappee dans un Link vers cette destination
  // (typique : page detail tasting). Le swipe scroll-snap continue de marcher
  // (browser n'envoie pas de click si drag significatif).
  to?: string
  className?: string
}

// Carousel swipeable base scroll-snap CSS (zero JS pour le swipe), avec dots,
// compteur "i/N" suivi via scroll listener, et chevrons desktop au hover.
// Si 1 seule photo, rendu simple sans nav.
//
// Extrait de TastingCard pour partage avec la page detail tasting et toute
// autre vue qui afficherait une galerie photo de tasting.
export function PhotoCarousel({ photoUrls, alt, rating, aspect = '4/5', to, className }: Props) {
  const { t } = useTranslation()
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(0)
  const single = photoUrls.length === 1

  useEffect(() => {
    if (single) return
    const el = scrollerRef.current
    if (!el) return
    let frame = 0
    function onScroll() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (!el) return
        const w = el.clientWidth
        if (w === 0) return
        const i = Math.round(el.scrollLeft / w)
        setIndex(Math.max(0, Math.min(photoUrls.length - 1, i)))
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', onScroll)
    }
  }, [photoUrls.length, single])

  function goTo(i: number) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  const canPrev = !single && index > 0
  const canNext = !single && index < photoUrls.length - 1

  return (
    <div
      className={cn('group relative w-full overflow-hidden bg-muted', className)}
      style={{ aspectRatio: aspect }}
    >
      <div
        ref={scrollerRef}
        className={cn(
          'flex h-full w-full overflow-x-auto scroll-smooth',
          !single && 'snap-x snap-mandatory',
        )}
        style={{ scrollbarWidth: 'none' }}
      >
        {photoUrls.map((url, i) => {
          const img = (
            <img
              src={url}
              alt={i === 0 ? alt : ''}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )
          return (
            <div key={url} className="h-full w-full shrink-0 snap-start">
              {to ? (
                <Link to={to} className="block h-full w-full">
                  {img}
                </Link>
              ) : (
                img
              )}
            </div>
          )
        })}
      </div>

      {!single && (
        <div className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium tabular-nums text-foreground backdrop-blur-md">
          {index + 1}/{photoUrls.length}
        </div>
      )}

      {canPrev && (
        <button
          type="button"
          aria-label={t('tasting.carousel.prev')}
          onClick={() => goTo(index - 1)}
          className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-opacity hover:bg-background/90 group-hover:opacity-100 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label={t('tasting.carousel.next')}
          onClick={() => goTo(index + 1)}
          className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-opacity hover:bg-background/90 group-hover:opacity-100 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {rating !== undefined && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-primary/40 bg-primary/95 px-3 py-1.5 text-primary-foreground shadow-[0_4px_16px_-4px_rgba(139,38,53,0.5)] backdrop-blur-md">
          <Star className="h-3.5 w-3.5 fill-primary-foreground" strokeWidth={0} />
          <span className="text-sm font-semibold tabular-nums">{rating.toFixed(1)}</span>
        </div>
      )}

      {!single && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 pointer-events-none">
          {photoUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'h-1.5 rounded-full transition-all pointer-events-auto',
                i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
