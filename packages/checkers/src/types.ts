import type { Status } from '@ai-status/db'

export type CheckResult = {
  status: Status
  latencyMs: number | null
  httpStatus: number | null
  errorMessage: string | null
}
