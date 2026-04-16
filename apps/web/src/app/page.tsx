import { Suspense } from 'react'
import { getStatus, getIncidents } from '@/lib/api'
import { GlobalStatus } from '@/components/GlobalStatus'
import { ProviderSection } from '@/components/ProviderSection'
import { IncidentBanner } from '@/components/IncidentBanner'

export const revalidate = 30

async function StatusContent() {
  const [statusData, incidentsData] = await Promise.all([
    getStatus().catch(() => ({ providers: [] })),
    getIncidents().catch(() => ({ incidents: [] })),
  ])

  const { providers } = statusData
  const { incidents } = incidentsData

  const lastUpdated = new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Status</h1>
          <p className="text-sm text-slate-500 mt-1">Last updated at {lastUpdated}</p>
        </div>
      </div>

      {/* Global status banner */}
      <GlobalStatus providers={providers} />

      {/* Active incidents */}
      <IncidentBanner incidents={incidents} />

      {/* Providers */}
      {providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center">
          <p className="text-slate-500 font-medium">No providers configured yet.</p>
          <p className="text-slate-400 text-sm mt-1">
            Edit <code className="bg-slate-100 px-1.5 py-0.5 rounded">config/providers.yml</code>{' '}
            to add your first provider.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <ProviderSection key={provider.id} provider={provider} />
          ))}
        </div>
      )}

      {/* Link to past incidents */}
      <div className="text-center pt-4">
        <a
          href="/incidents?resolved=true"
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          View incident history →
        </a>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StatusContent />
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="h-16 bg-slate-200 rounded-xl" />
      <div className="h-40 bg-slate-200 rounded-xl" />
      <div className="h-40 bg-slate-200 rounded-xl" />
    </div>
  )
}
