import clsx from 'clsx'
import type { Status } from '@/lib/types'

const STATUS_CONFIG: Record<Status, { color: string; label: string; pulse: boolean }> = {
  operational:    { color: 'bg-green-500',   label: 'Operational',    pulse: false },
  degraded:       { color: 'bg-amber-400',   label: 'Degraded',       pulse: true  },
  partial_outage: { color: 'bg-orange-500',  label: 'Partial Outage', pulse: true  },
  major_outage:   { color: 'bg-red-500',     label: 'Major Outage',   pulse: true  },
  unknown:        { color: 'bg-slate-400',   label: 'Unknown',        pulse: false },
}

type Props = {
  status: Status
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function StatusDot({ status, size = 'md', showLabel = false }: Props) {
  const cfg = STATUS_CONFIG[status]

  const sizeClass = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  }[size]

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex">
        {cfg.pulse && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
              cfg.color
            )}
          />
        )}
        <span className={clsx('relative inline-flex rounded-full', sizeClass, cfg.color)} />
      </span>
      {showLabel && (
        <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
      )}
    </span>
  )
}

export function statusLabel(status: Status): string {
  return STATUS_CONFIG[status].label
}
