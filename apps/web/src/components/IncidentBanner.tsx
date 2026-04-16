import Link from 'next/link'
import type { Incident } from '@/lib/types'

const SEVERITY_STYLE: Record<Incident['severity'], string> = {
  minor:    'bg-amber-50 border-amber-200 text-amber-800',
  major:    'bg-orange-50 border-orange-200 text-orange-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
}

const STATUS_LABEL: Record<Incident['status'], string> = {
  investigating: 'Investigating',
  identified:    'Identified',
  monitoring:    'Monitoring',
  resolved:      'Resolved',
}

type Props = { incidents: Incident[] }

export function IncidentBanner({ incidents }: Props) {
  const open = incidents.filter((i) => !i.resolvedAt)
  if (open.length === 0) return null

  return (
    <div className="space-y-2">
      {open.map((incident) => (
        <Link
          key={incident.id}
          href={`/incidents/${incident.id}`}
          className={`block rounded-xl border px-5 py-4 hover:opacity-90 transition-opacity ${SEVERITY_STYLE[incident.severity]}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70 mr-2">
                {incident.severity}
              </span>
              <span className="font-semibold">{incident.title}</span>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 shrink-0">
              {STATUS_LABEL[incident.status]}
            </span>
          </div>
          <p className="text-xs mt-1 opacity-70">
            Started {new Date(incident.startedAt).toLocaleString()} · View details →
          </p>
        </Link>
      ))}
    </div>
  )
}
