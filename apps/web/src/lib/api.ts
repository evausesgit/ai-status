import type {
  StatusResponse,
  UptimeResponse,
  IncidentsResponse,
  Incident,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 30 },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${path}`)
  }
  return res.json() as Promise<T>
}

export async function getStatus(): Promise<StatusResponse> {
  return apiFetch<StatusResponse>('/status')
}

export async function getUptime(modelId: string, days = 90): Promise<UptimeResponse> {
  return apiFetch<UptimeResponse>(`/uptime/${encodeURIComponent(modelId)}?days=${days}`)
}

export async function getIncidents(resolved = false): Promise<IncidentsResponse> {
  return apiFetch<IncidentsResponse>(`/incidents${resolved ? '?resolved=true' : ''}`)
}

export async function getIncident(id: string): Promise<Incident> {
  return apiFetch<Incident>(`/incidents/${id}`)
}
