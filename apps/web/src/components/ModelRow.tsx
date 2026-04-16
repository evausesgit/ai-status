import { getUptime } from '@/lib/api'
import type { ModelStatus } from '@/lib/types'
import { StatusDot, statusLabel } from './StatusDot'
import { UptimeBar } from './UptimeBar'

type Props = { model: ModelStatus }

export async function ModelRow({ model }: Props) {
  let uptime = null
  try {
    uptime = await getUptime(model.id, 90)
  } catch {
    // API not available yet — show empty state
  }

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <StatusDot status={model.status} />
            <span className="font-medium text-slate-900 truncate">{model.name}</span>
          </div>
          {model.description && (
            <p className="text-xs text-slate-400 mt-0.5 ml-[18px]">{model.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0 text-sm text-slate-500">
          {model.latencyMs !== null && (
            <span className="tabular-nums">{model.latencyMs}ms</span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {statusLabel(model.status)}
          </span>
        </div>
      </div>

      {uptime ? (
        <UptimeBar
          hourly={uptime.hourly}
          uptimePercent={uptime.uptimePercent}
          days={90}
        />
      ) : (
        <div className="h-8 bg-slate-50 rounded-sm flex items-center justify-center">
          <span className="text-xs text-slate-400">No uptime data yet</span>
        </div>
      )}
    </div>
  )
}
