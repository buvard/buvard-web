import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LikeButton } from '@/components/LikeButton'
import { LikersDialog } from '@/components/LikersDialog'
import { LocationMapDialog } from '@/components/LocationMapDialog'
import { MentionText } from '@/components/MentionText'
import { PhotoCarousel } from '@/components/PhotoCarousel'
import { UserLink } from '@/components/UserLink'
import { TastingActions } from '@/components/TastingActions'
import { Lock, MapPin, Star } from 'lucide-react'
import type { Tasting } from '@/types'

const dateFormatters = new Map<string, Intl.RelativeTimeFormat>()
function getFormatter(locale: string): Intl.RelativeTimeFormat {
  let f = dateFormatters.get(locale)
  if (!f) {
    f = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    dateFormatters.set(locale, f)
  }
  return f
}

function relativeTime(iso: string, locale: string): string {
  const diff = Date.parse(iso) - Date.now()
  const minutes = Math.round(diff / 60000)
  const f = getFormatter(locale)
  if (Math.abs(minutes) < 60) return f.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return f.format(hours, 'hour')
  const days = Math.round(hours / 24)
  return f.format(days, 'day')
}

function formatPrice(price: number, currency: string | undefined, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${price} ${currency ?? ''}`.trim()
  }
}

function initialsFrom(author: Tasting['author']): string {
  const base = author.displayName?.trim() || author.username
  return base
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const MAX_AROMAS_SHOWN = 6

interface Props {
  tasting: Tasting
}

// 3 zones visuelles distinctes :
//   1. HEADER  : qui · quand · type
//   2. PHOTO   : carousel swipeable (scroll-snap) + note en overlay + dots si N>1
//   3. CONTENU : titre + meta · lieu · aromes · caption
export function TastingCard({ tasting }: Props) {
  const { t, i18n } = useTranslation()
  const displayName = tasting.author.displayName?.trim() || tasting.author.username
  const isPrivate = tasting.visibility === 'private'
  const aromasVisible = tasting.aromas.slice(0, MAX_AROMAS_SHOWN)
  const aromasHidden = tasting.aromas.length - aromasVisible.length
  const [mapDialogOpen, setMapDialogOpen] = useState(false)
  const [likersDialogOpen, setLikersDialogOpen] = useState(false)

  // Liste compacte des meta produit : "Talisker · 2018 · 42,50 €"
  const productMeta = [
    tasting.producer,
    tasting.year,
    tasting.price !== undefined ? formatPrice(tasting.price, tasting.currency, i18n.language) : null,
  ].filter(Boolean)

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card/50 transition-colors hover:bg-card/80">
      {/* === 1. HEADER === */}
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <UserLink
          username={tasting.author.username}
          className="flex min-w-0 items-center gap-2.5"
        >
          <Avatar className="h-8 w-8">
            {tasting.author.avatarUrl && (
              <AvatarImage src={tasting.author.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-muted text-[11px] font-medium">
              {initialsFrom(tasting.author)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate">
            <span className="text-sm font-medium text-foreground">{displayName}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">
              · {relativeTime(tasting.createdAt, i18n.language)}
            </span>
          </span>
        </UserLink>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t(`types.${tasting.type}`)}
          </span>
          <TastingActions tasting={tasting} />
        </div>
      </header>

      {/* === 2. PHOTO(S) carousel === */}
      {tasting.photoUrls.length > 0 ? (
        <PhotoCarousel
          photoUrls={tasting.photoUrls}
          alt={tasting.name}
          rating={tasting.rating}
        />
      ) : (
        // Pas de photo : on garde la note en bandeau discret en haut du contenu
        <div className="border-t border-border/40 px-5 pt-4">
          <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-primary">
            <Star className="h-3.5 w-3.5 fill-primary" strokeWidth={0} />
            <span className="text-xs font-semibold tabular-nums">
              {tasting.rating.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* === 3. CONTENU structuré === */}
      <div className="space-y-3.5 px-5 pb-5 pt-3">
        {/* Actions row : like + compteur cliquable (likers bottomsheet) */}
        <div className="flex items-center gap-3">
          <LikeButton
            tastingId={tasting.id}
            isLiked={tasting.isLikedByMe}
            count={tasting.likesCount}
            onCountClick={() => setLikersDialogOpen(true)}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
            {tasting.name}
          </h3>
          {productMeta.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {productMeta.map((m, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1.5 opacity-50">·</span>}
                  <span className={typeof m === 'string' && m === productMeta[productMeta.length - 1] && tasting.price !== undefined ? 'font-medium text-foreground/80 tabular-nums' : ''}>
                    {m}
                  </span>
                </span>
              ))}
            </p>
          )}
        </div>

        {tasting.place?.name && (
          <button
            type="button"
            onClick={() => setMapDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-foreground/85 transition-colors hover:text-primary"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className="underline-offset-2 hover:underline">{tasting.place.name}</span>
          </button>
        )}

        {aromasVisible.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
              {t('tasting.aromas')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aromasVisible.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-foreground/75"
                >
                  {a}
                </span>
              ))}
              {aromasHidden > 0 && (
                <span className="rounded-full bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                  +{aromasHidden}
                </span>
              )}
            </div>
          </div>
        )}

        {tasting.notes && (
          <p className="border-t border-border/50 pt-3 text-sm italic leading-relaxed text-foreground/75">
            <span className="opacity-60">« </span>
            <MentionText text={tasting.notes} />
            <span className="opacity-60"> »</span>
          </p>
        )}

        {isPrivate && (
          <p className="flex items-center gap-1 pt-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
            <Lock className="h-3 w-3" strokeWidth={2} />
            {t('tasting.private')}
          </p>
        )}
      </div>

      {tasting.place?.name && (
        <LocationMapDialog
          place={tasting.place}
          open={mapDialogOpen}
          onOpenChange={setMapDialogOpen}
        />
      )}
      <LikersDialog
        tastingId={tasting.id}
        open={likersDialogOpen}
        onOpenChange={setLikersDialogOpen}
      />
    </article>
  )
}

