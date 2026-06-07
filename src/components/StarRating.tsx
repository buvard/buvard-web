import { useState, type MouseEvent, type TouchEvent } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: number // 0 a 5, increments de 0.5
  onChange?: (value: number) => void // omettre = mode lecture seule
  size?: number // taille d'une etoile en px
  showValue?: boolean // afficher la valeur numerique a cote
  className?: string
}

// Note visuelle 0.5 - 5 en demi-etoiles bordeaux. Tap moitie gauche d'une
// etoile = .5, tap moitie droite = 1.0. Hover preview sur web.
// Mode lecture seule si onChange est absent.
export function StarRating({ value, onChange, size = 36, showValue = true, className }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const readOnly = !onChange
  const display = readOnly ? value : (hover ?? value)

  function valueFromEvent(e: MouseEvent | TouchEvent, index: number): number {
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const clientX = 'touches' in e
      ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0
      : (e as MouseEvent).clientX
    const isLeftHalf = clientX - rect.left < rect.width / 2
    return index + (isLeftHalf ? 0.5 : 1)
  }

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="radiogroup"
      aria-label="Note"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const filledFull = display >= i + 1
        const filledHalf = !filledFull && display >= i + 0.5
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value >= i + 0.5 && value <= i + 1}
            aria-label={`${i + 1} étoile${i > 0 ? 's' : ''}`}
            disabled={readOnly}
            onClick={readOnly ? undefined : (e) => onChange(valueFromEvent(e, i))}
            onMouseMove={readOnly ? undefined : (e) => setHover(valueFromEvent(e, i))}
            onMouseLeave={readOnly ? undefined : () => setHover(null)}
            className={cn(
              'relative shrink-0',
              !readOnly && 'transition-transform active:scale-90',
              readOnly && 'cursor-default disabled:opacity-100',
            )}
            style={{ width: size, height: size }}
          >
            {/* Etoile vide (background) */}
            <Star
              className="absolute inset-0 text-muted-foreground/30"
              strokeWidth={1.5}
              style={{ width: size, height: size }}
            />
            {/* Demi-etoile pleine via clip-path */}
            {filledHalf && (
              <Star
                className="absolute inset-0 fill-primary text-primary"
                strokeWidth={1.5}
                style={{
                  width: size,
                  height: size,
                  clipPath: 'inset(0 50% 0 0)',
                }}
              />
            )}
            {/* Etoile pleine */}
            {filledFull && (
              <Star
                className="absolute inset-0 fill-primary text-primary"
                strokeWidth={1.5}
                style={{ width: size, height: size }}
              />
            )}
          </button>
        )
      })}
      {/* Affichage numerique a cote */}
      {showValue && (
        <span className="ml-2 text-sm font-semibold tabular-nums text-foreground">
          {display > 0 ? display.toFixed(1) : '—'}
        </span>
      )}
    </div>
  )
}
