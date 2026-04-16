import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'

/**
 * A provider is a company offering AI models (e.g. Anthropic, OpenAI, MyCompany).
 */
export const providers = pgTable('providers', {
  id: text('id').primaryKey(), // e.g. "anthropic", "mycompany"
  name: text('name').notNull(),
  website: text('website'),
  logoUrl: text('logo_url'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * A model belongs to a provider. Each model has its own check config.
 */
export const models = pgTable('models', {
  id: text('id').primaryKey(), // e.g. "anthropic/claude-3-5-sonnet"
  providerId: text('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // human-readable, e.g. "Claude 3.5 Sonnet"
  slug: text('slug').notNull(),  // url-safe, e.g. "claude-3-5-sonnet"
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  // Check configuration stored as JSONB
  checkConfig: jsonb('check_config').notNull().$type<CheckConfig>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type CheckConfig =
  | HttpCheckConfig
  | ChatCompletionCheckConfig

export type HttpCheckConfig = {
  type: 'http'
  endpoint: string
  method?: 'GET' | 'POST' | 'HEAD'
  headers?: Record<string, string>
  body?: unknown
  intervalSeconds: number
  timeoutMs: number
  expectedStatus?: number
  latencyWarnMs?: number
  latencyCriticalMs?: number
}

export type ChatCompletionCheckConfig = {
  type: 'chat_completion'
  endpoint: string
  headers?: Record<string, string>
  model?: string
  intervalSeconds: number
  timeoutMs: number
  latencyWarnMs?: number
  latencyCriticalMs?: number
}
