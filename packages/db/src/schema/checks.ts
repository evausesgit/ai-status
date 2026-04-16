import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { models } from './providers'

export const statusEnum = pgEnum('status', [
  'operational',    // tout va bien
  'degraded',       // latence élevée mais répond
  'partial_outage', // intermittent
  'major_outage',   // ne répond plus
  'unknown',        // pas encore de check
])

/**
 * Résultat de chaque check individuel.
 * On garde un historique dense (utilisé pour les graphes d'uptime).
 */
export const checks = pgTable('checks', {
  id: text('id').primaryKey(), // ulid
  modelId: text('model_id')
    .notNull()
    .references(() => models.id, { onDelete: 'cascade' }),
  status: statusEnum('status').notNull(),
  latencyMs: integer('latency_ms'),         // null si timeout/erreur
  httpStatus: integer('http_status'),        // code HTTP retourné
  errorMessage: text('error_message'),       // message d'erreur si échec
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
})

/**
 * Agrégation horaire pour éviter de scanner des millions de lignes
 * lors des requêtes d'uptime sur 90 jours.
 */
export const uptimeHourly = pgTable('uptime_hourly', {
  modelId: text('model_id')
    .notNull()
    .references(() => models.id, { onDelete: 'cascade' }),
  hour: timestamp('hour').notNull(), // tronqué à l'heure
  totalChecks: integer('total_checks').notNull().default(0),
  successChecks: integer('success_checks').notNull().default(0),
  avgLatencyMs: integer('avg_latency_ms'),
  minLatencyMs: integer('min_latency_ms'),
  maxLatencyMs: integer('max_latency_ms'),
})

export type Status = typeof statusEnum.enumValues[number]
