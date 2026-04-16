import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { models } from './providers'

export const incidentSeverityEnum = pgEnum('incident_severity', [
  'minor',    // dégradation légère
  'major',    // impact significatif
  'critical', // service inaccessible
])

export const incidentStatusEnum = pgEnum('incident_status', [
  'investigating', // on regarde ce qui se passe
  'identified',    // cause identifiée
  'monitoring',    // fix déployé, on surveille
  'resolved',      // tout est revenu à la normale
])

/**
 * Un incident représente un événement notable (panne, dégradation).
 * Il peut être créé manuellement par un admin ou automatiquement
 * par le worker de monitoring.
 */
export const incidents = pgTable('incidents', {
  id: text('id').primaryKey(), // ulid
  modelId: text('model_id')
    .references(() => models.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  status: incidentStatusEnum('status').notNull().default('investigating'),
  severity: incidentSeverityEnum('severity').notNull().default('minor'),
  autoDetected: text('auto_detected'), // 'true' | 'false' stocké en text pour compat JSON
  startedAt: timestamp('started_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Timeline des mises à jour d'un incident.
 */
export const incidentUpdates = pgTable('incident_updates', {
  id: text('id').primaryKey(), // ulid
  incidentId: text('incident_id')
    .notNull()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  status: incidentStatusEnum('status').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
