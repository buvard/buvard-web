import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Ligne cliquable type "iOS settings" : icône + label + hint + chevron.
interface Props {
  to?: string
  onClick?: () => void
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  hint?: string
  value?: string
  destructive?: boolean
  disabled?: boolean
}

export function SettingsRow({
  to,
  onClick,
  icon: Icon,
  label,
  hint,
  value,
  destructive,
  disabled,
}: Props) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          destructive ? 'text-destructive' : 'text-muted-foreground',
        )}
        strokeWidth={1.8}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            destructive ? 'text-destructive' : 'text-foreground',
          )}
        >
          {label}
        </p>
        {hint && (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      {value && (
        <span className="shrink-0 text-sm text-muted-foreground">{value}</span>
      )}
      {(to || onClick) && (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={1.8}
        />
      )}
    </div>
  )

  const base =
    'block w-full text-left rounded-lg border border-border bg-card/30 transition-colors disabled:opacity-50'
  const interactive = 'hover:bg-card/60'

  if (to) {
    return (
      <Link to={to} className={cn(base, interactive)}>
        {inner}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(base, interactive)}
      >
        {inner}
      </button>
    )
  }
  return <div className={base}>{inner}</div>
}

// Group : un bloc visuel avec un titre + plusieurs SettingsRow
export function SettingsGroup({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      {title && (
        <h2 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  )
}
