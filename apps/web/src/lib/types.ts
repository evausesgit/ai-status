export type Status =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'unknown'

export type ModelStatus = {
  id: string
  name: string
  slug: string
  description: string | null
  status: Status
  latencyMs: number | null
  lastCheckedAt: string | null
}

export type Provider = {
  id: string
  name: string
  website: string | null
  logoUrl: string | null
  description: string | null
  isActive: boolean
  models: ModelStatus[]
}

export type StatusResponse = {
  providers: Provider[]
}

export type UptimeHour = {
  hour: string
  uptimePercent: number | null
  avgLatencyMs: number | null
  totalChecks: number
}

export type UptimeResponse = {
  modelId: string
  days: number
  uptimePercent: number | null
  hourly: UptimeHour[]
}

export type IncidentSeverity = 'minor' | 'major' | 'critical'
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

export type IncidentUpdate = {
  id: string
  incidentId: string
  status: IncidentStatus
  message: string
  createdAt: string
}

export type Incident = {
  id: string
  modelId: string | null
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  startedAt: string
  resolvedAt: string | null
  createdAt: string
  updates?: IncidentUpdate[]
}

export type IncidentsResponse = {
  incidents: Incident[]
}
