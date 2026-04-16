import type { ChatCompletionCheckConfig } from '@ai-status/db'
import type { CheckResult } from './types'

/**
 * Checker pour les API de type chat completion (OpenAI-compatible).
 * Envoie un message "ping" minimal et mesure la latence jusqu'au
 * premier token (time-to-first-token).
 */
export async function runChatCompletionCheck(
  config: ChatCompletionCheckConfig
): Promise<CheckResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  const start = Date.now()

  try {
    const headers = resolveHeaders({
      'Content-Type': 'application/json',
      ...config.headers,
    })

    // Détecte si l'endpoint est Anthropic (utilise /v1/messages)
    const isAnthropic = config.endpoint.includes('anthropic.com')

    const body = isAnthropic
      ? {
          model: config.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }
      : {
          model: config.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const latencyMs = Date.now() - start

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const text = await response.text()
        errorMessage = `HTTP ${response.status}: ${text.slice(0, 200)}`
      } catch {}

      return {
        status: response.status === 429 ? 'degraded' : 'major_outage',
        latencyMs,
        httpStatus: response.status,
        errorMessage,
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

function resolveHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      value.replace(/\$\{([^}]+)\}/g, (_, varName) => process.env[varName] ?? ''),
    ])
  )
}

function resolveLatencyStatus(
  latencyMs: number,
  config: ChatCompletionCheckConfig
): import('@ai-status/db').Status {
  if (config.latencyCriticalMs && latencyMs >= config.latencyCriticalMs) {
    return 'partial_outage'
  }
  if (config.latencyWarnMs && latencyMs >= config.latencyWarnMs) {
    return 'degraded'
  }
  return 'operational'
}
