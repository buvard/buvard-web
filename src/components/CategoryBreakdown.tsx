import { useTranslation } from 'react-i18next'
import { TASTING_TYPES, type TastingType } from '@/lib/api/types'

// Répartition des dégustations par catégorie, en barres horizontales.
// Le max sert d'échelle pour les pourcentages visuels.
interface Props {
  data: Partial<Record<TastingType, number>>
  total: number
}

export function CategoryBreakdown({ data, total }: Props) {
  const { t } = useTranslation()

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('profile.empty')}
      </p>
    )
  }

  const rows = TASTING_TYPES.map((type) => ({
    type,
    count: data[type] ?? 0,
  })).sort((a, b) => b.count - a.count)

  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="space-y-3">
      {rows.map(({ type, count }) => {
        const pct = total === 0 ? 0 : Math.round((count / total) * 100)
        const widthPct = (count / max) * 100
        return (
          <div key={type} className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">
                {t(`types.${type}`)}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {count} <span className="opacity-60">· {pct}%</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full bg-primary/80 transition-all"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
