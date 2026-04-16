'use client'

import { useState } from 'react'
import clsx from 'clsx'
import type { UptimeHour } from '@/lib/types'

type Props = {
  hourly: UptimeHour[]
  uptimePercent: number | null
  days: number
}

function uptimeColor(pct: number | null): string {
  if (pct === null) return 'bg-slate-200'
  if (pct >= 99) return 'bg-green-500'
  if (pct >= 95) return 'bg-amber-400'
  if (pct >= 80) return 'bg-orange-500'
  return 'bg-red-500'
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UptimeBar({ hourly, uptimePercent, days }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; hour: UptimeHour } | null>(null)

  // On veut afficher exactement `days * 24` colonnes — on remplit les manquants avec null
  const now = new Date()
  const slots: (UptimeHour | null)[] = []
  const hourMap = new Map(hourly.map((h) => [new Date(h.hour).toISOString().slice(0, 13), h]))

  for (let i = days * 24 - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(d.getHours() - i, 0, 0, 0)
    const key = d.toISOString().slice(0, 13)
    slots.push(hourMap.get(key) ?? null)
  }

  // Regrouper par jour pour les labels
  const dayCount = days
  const barsPerDay = 24

  return (
    <div className="space-y-1">
      {/* Barres */}
      <div
        className="flex items-end gap-px h-8 relative"
        onMouseLeave={() => setTooltip(null)}
      >
        {slots.map((slot, i) => (
          <div
            key={i}
            className={clsx(
              'flex-1 rounded-sm cursor-default transition-opacity hover:opacity-80',
              slot ? uptimeColor(slot.uptimePercent) : 'bg-slate-100'
            )}
            style={{ height: slot ? '100%' : '40%' }}
            onMouseEnter={(e) => {
              if (!slot) return
              const rect = (e.target as HTMLElement).getBoundingClientRect()
              setTooltip({ x: rect.left, y: rect.top, hour: slot })
            }}
          />
        ))}
      </div>

      {/* Labels jours */}
      <div className="flex justify-between text-xs text-slate-400 px-0.5">
        <span>{days} days ago</span>
        <span>
          {uptimePercent !== null
            ? `${uptimePercent.toFixed(2)}% uptime`
            : 'No data yet'}
        </span>
        <span>Today</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y - 72 }}
        >
          <p className="font-medium">{formatHour(tooltip.hour.hour)}</p>
          <p>
            Uptime:{' '}
            {tooltip.hour.uptimePercent !== null
              ? `${tooltip.hour.uptimePercent.toFixed(1)}%`
              : 'N/A'}
          </p>
          {tooltip.hour.avgLatencyMs !== null && (
            <p>Avg latency: {tooltip.hour.avgLatencyMs}ms</p>
          )}
          <p className="text-slate-400">{tooltip.hour.totalChecks} check(s)</p>
        </div>
      )}
    </div>
  )
}
