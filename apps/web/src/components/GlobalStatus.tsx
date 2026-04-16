import clsx from 'clsx'
import type { Status, Provider } from '@/lib/types'

function computeGlobalStatus(providers: Provider[]): Status {
  const allStatuses = providers.flatMap((p) => p.models.map((m) => m.status))
  if (allStatuses.length === 0) return 'unknown'
  if (allStatuses.some((s) => s === 'major_outage')) return 'major_outage'
  if (allStatuses.some((s) => s === 'partial_outage')) return 'partial_outage'
  if (allStatuses.some((s) => s === 'degraded')) return 'degraded'
  if (allStatuses.every((s) => s === 'operational')) return 'operational'
  return 'unknown'
}

const GLOBAL_CONFIG: Record<Status, { bg: string; border: string; text: string; label: string }> = {
  operational:    { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800', label: 'All systems operational' },
  degraded:       { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800', label: 'Performance degraded'     },
  partial_outage: { bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-800',label: 'Partial system outage'    },
  major_outage:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   label: 'Major outage detected'    },
  unknown:        { bg: 'bg-slate-50',  border: 'border-slate-200', text: 'text-slate-700', label: 'Status unknown'           },
}

const ICONS: Record<Status, string> = {
  operational:    '✓',
  degraded:       '⚡',
  partial_outage: '⚠',
  major_outage:   '✕',
  unknown:        '?',
}

type Props = { providers: Provider[] }

export function GlobalStatus({ providers }: Props) {
  const status = computeGlobalStatus(providers)
  const cfg = GLOBAL_CONFIG[status]

  return (
    <div className={clsx('rounded-xl border px-6 py-5 flex items-center gap-4', cfg.bg, cfg.border)}>
      <span className={clsx('text-2xl font-bold w-8 text-center', cfg.text)}>
        {ICONS[status]}
      </span>
      <div>
        <p className={clsx('text-lg font-semibold', cfg.text)}>{cfg.label}</p>
        <p className="text-sm text-slate-500">
          {providers.reduce((n, p) => n + p.models.length, 0)} model(s) monitored across{' '}
          {providers.length} provider(s)
        </p>
      </div>
    </div>
  )
}
