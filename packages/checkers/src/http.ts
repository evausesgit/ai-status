import type { HttpCheckConfig } from '@ai-status/db'
import type { CheckResult } from './types'

/**
 * Checker HTTP générique.
 * Envoie une requête à l'endpoint configuré et mesure la latence.
 */
export async function runHttpCheck(config: HttpCheckConfig): Promise<CheckResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  const start = Date.now()

  try {
    const response = await fetch(config.endpoint, {
      method: config.method ?? 'GET',
      headers: resolveHeaders(config.headers),
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const latencyMs = Date.now() - start

    const expectedStatus = config.expectedStatus ?? 200
    if (response.status !== expectedStatus) {
      return {
        status: 'major_outage',
        latencyMs,
        httpStatus: response.status,
        errorMessage: `Unexpected HTTP status: ${response.status}`,
      }
    }

    return {
      status: resolveLatencyStatus(latencyMs, config),
      latencyMs,
      httpStatus: response.status,
      errorMessage: null,
    }
  } catch (err) {
    clearTimeout(timeout)
    const latencyMs = Date.now() - start

    if ((err as Error).name === 'AbortError') {
      return {
        status: 'major_outage',
        latencyMs,
        httpStatus: null,
        errorMessage: `Timeout after ${config.timeoutMs}ms`,
      }
    }

    return {
      status: 'major_outage',
      latencyMs: null,
      httpStatus: null,
      errorMessage: (err as Error).message,
    }
  }
}

function resolveHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {}
  // Résoudre les variables d'environnement dans les headers
  // ex: "Bearer ${MY_API_KEY}" → "Bearer sk-..."
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      value.replace(/\$\{([^}]+)\}/g, (_, varName) => process.env[varName] ?? ''),
    ])
  )
}

function resolveLatencyStatus(
  latencyMs: number,
  config: HttpCheckConfig
): import('@ai-status/db').Status {
  if (config.latencyCriticalMs && latencyMs >= config.latencyCriticalMs) {
    return 'partial_outage'
  }
  if (config.latencyWarnMs && latencyMs >= config.latencyWarnMs) {
    return 'degraded'
  }
  return 'operational'
}
