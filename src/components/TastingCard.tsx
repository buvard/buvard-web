import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import type { Tasting } from '@/lib/types'

const dateFormatters = new Map<string, Intl.RelativeTimeFormat>()
function getFormatter(locale: string) {
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

interface Props {
  tasting: Tasting
}

// Card sombre, bordure fine, avec un cercle de note qui glow en bordeaux.
// Hover : très léger éclaircissement du fond, comme un highlight de bar.
export function TastingCard({ tasting }: Props) {
  const { t, i18n } = useTranslation()
  const initials = tasting.author.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="group relative rounded-xl border border-border bg-card/40 p-5 transition-colors hover:bg-card/70">
      <header className="mb-4 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-muted text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {tasting.author.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {relativeTime(tasting.postedAt, i18n.language)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="border-0 bg-muted/60 font-normal text-muted-foreground"
        >
          {t(`types.${tasting.type}`)}
        </Badge>
      </header>

      <div className="flex items-center justify-between gap-4">
        <h3 className="flex-1 text-lg font-semibold leading-snug tracking-tight text-foreground">
          {tasting.drinkName}
        </h3>
        {/* Cercle de note avec glow bordeaux */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
          <span className="relative text-base font-semibold tabular-nums text-foreground">
            {tasting.rating}
          </span>
        </div>
      </div>

      {tasting.place && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span>{tasting.place}</span>
        </div>
      )}

      {tasting.notes && (
        <p className="mt-4 text-sm leading-relaxed text-foreground/75">
          {tasting.notes}
        </p>
      )}
    </article>
  )
}
