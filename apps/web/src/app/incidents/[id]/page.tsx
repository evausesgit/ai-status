import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getIncident } from '@/lib/api'
import type { Incident } from '@/lib/types'

export const revalidate = 30

const SEVERITY_STYLE: Record<Incident['severity'], string> = {
  minor:    'bg-amber-50 text-amber-700 border-amber-200',
  major:    'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_STYLE: Record<Incident['status'], { dot: string; label: string }> = {
  investigating: { dot: 'bg-red-500',    label: 'Investigating' },
  identified:    { dot: 'bg-orange-500', label: 'Identified'    },
  monitoring:    { dot: 'bg-amber-400',  label: 'Monitoring'    },
  resolved:      { dot: 'bg-green-500',  label: 'Resolved'      },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let incident: Incident
  try {
    incident = await getIncident(id)
  } catch {
    notFound()
  }

  const { dot, label } = STATUS_STYLE[incident.status]
  const updates = incident.updates ?? []

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        ← Back to incidents
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">{incident.title}</h1>
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold border capitalize ${SEVERITY_STYLE[incident.severity]}`}
          >
            {incident.severity} severity
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          <span className="font-medium">{label}</span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400 pt-1">
          <span>Started: {formatDate(incident.startedAt)}</span>
          {incident.resolvedAt && (
            <span>Resolved: {formatDate(incident.resolvedAt)}</span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Timeline
        </h2>

        {updates.length === 0 ? (
          <p className="text-sm text-slate-400">No updates yet.</p>
        ) : (
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-3 bottom-3 w-px bg-slate-200" />

            {updates.map((update, i) => {
              const s = STATUS_STYLE[update.status]
              return (
                <div key={update.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Dot on timeline */}
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0 z-10 ${s.dot}`}
                  />
                  <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">{s.label}</span>
                      <span className="text-xs text-slate-400">
                        {formatDate(update.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{update.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
