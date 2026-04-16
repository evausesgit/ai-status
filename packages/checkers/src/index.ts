import type { CheckConfig } from '@ai-status/db'
import { runHttpCheck } from './http'
import { runChatCompletionCheck } from './chat-completion'
import type { CheckResult } from './types'

export type { CheckResult }

export async function runCheck(config: CheckConfig): Promise<CheckResult> {
  switch (config.type) {
    case 'http':
      return runHttpCheck(config)
    case 'chat_completion':
      return runChatCompletionCheck(config)
    default:
      // TypeScript exhaustiveness check
      config satisfies never
      throw new Error(`Unknown check type`)
  }
}
