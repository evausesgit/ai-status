import Link from 'next/link'
import { getIncidents } from '@/lib/api'
import type { Incident } from '@/lib/types'

export const revalidate = 30

const SEVERITY_DOT: Record<Incident['severity'], string> = {
  minor:    'bg-amber-400',
  major:    'bg-orange-500',
  critical: 'bg-red-500',
}

const STATUS_LABEL: Record<Incident['status'], string> = {
  investigating: 'Investigating',
  identified:    'Identified',
  monitoring:    'Monitoring',
  resolved:      'Resolved',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string }>
}) {
  const params = await searchParams
  const showResolved = params.resolved === 'true'

  const { incidents } = await getIncidents(showResolved).catch(() => ({ incidents: [] }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incidents</h1>
          <p className="text-sm text-slate-500 mt-1">
            {showResolved ? 'All incidents including resolved' : 'Active incidents only'}
          </p>
        </div>
        <a
          href={showResolved ? '/incidents' : '/incidents?resolved=true'}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          {showResolved ? 'Hide resolved' : 'Show resolved →'}
        </a>
      </div>

      {incidents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-slate-600 font-medium">No incidents to report</p>
          <p className="text-slate-400 text-sm mt-1">
            {showResolved ? 'No incidents in history.' : 'No active incidents.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block bg-white rounded-xl border border-slate-200 px-6 py-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${SEVERITY_DOT[incident.severity]}`}
                  />
                  <span className="font-medium text-slate-900 truncate">{incident.title}</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                    incident.resolvedAt
                      ? 'bg-green-50 text-green-700'
                      : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {STATUS_LABEL[incident.status]}
                </span>
              </div>
              <div className="mt-2 ml-[22px] flex items-center gap-4 text-xs text-slate-400">
                <span className="capitalize">{incident.severity} severity</span>
                <span>·</span>
                <span>Started {formatDate(incident.startedAt)}</span>
                {incident.resolvedAt && (
                  <>
                    <span>·</span>
                    <span>Resolved {formatDate(incident.resolvedAt)}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
