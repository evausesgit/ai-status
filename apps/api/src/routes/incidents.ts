import type { FastifyInstance } from 'fastify'
import { desc, eq, isNull } from 'drizzle-orm'
import { ulid } from 'ulid'
import { getDb, incidents, incidentUpdates } from '@ai-status/db'

export async function incidentRoutes(app: FastifyInstance) {
  const db = getDb()

  /**
   * GET /incidents
   * Liste tous les incidents (ouverts + résolus récents).
   */
  app.get<{ Querystring: { resolved?: string } }>('/incidents', async (request) => {
    const showResolved = request.query.resolved === 'true'

    const rows = await db
      .select()
      .from(incidents)
      .where(showResolved ? undefined : isNull(incidents.resolvedAt))
      .orderBy(desc(incidents.startedAt))
      .limit(50)

    return { incidents: rows }
  })

  /**
   * GET /incidents/:id
   * Détail d'un incident avec sa timeline.
   */
  app.get<{ Params: { id: string } }>('/incidents/:id', async (request, reply) => {
    const { id } = request.params

    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id))
    if (!incident) {
      return reply.code(404).send({ error: 'Incident not found' })
    }

    const updates = await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, id))
      .orderBy(desc(incidentUpdates.createdAt))

    return { ...incident, updates }
  })

  /**
   * POST /incidents
   * Crée un nouvel incident (admin uniquement).
   */
  app.post<{
    Body: {
      modelId?: string
      title: string
      severity: 'minor' | 'major' | 'critical'
      message: string
    }
  }>('/incidents', { preHandler: [requireApiSecret] }, async (request, reply) => {
    const { modelId, title, severity, message } = request.body

    const id = ulid()

    await db.insert(incidents).values({
      id,
      modelId: modelId ?? null,
      title,
      severity,
      status: 'investigating',
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(incidentUpdates).values({
      id: ulid(),
      incidentId: id,
      status: 'investigating',
      message,
      createdAt: new Date(),
    })

    return reply.code(201).send({ id })
  })

  /**
   * POST /incidents/:id/updates
   * Ajoute une mise à jour à un incident existant.
   */
  app.post<{
    Params: { id: string }
    Body: {
      status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
      message: string
    }
  }>('/incidents/:id/updates', { preHandler: [requireApiSecret] }, async (request, reply) => {
    const { id } = request.params
    const { status, message } = request.body

    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id))
    if (!incident) {
      return reply.code(404).send({ error: 'Incident not found' })
    }

    await db.insert(incidentUpdates).values({
      id: ulid(),
      incidentId: id,
      status,
      message,
      createdAt: new Date(),
    })

    const resolvedAt = status === 'resolved' ? new Date() : undefined

    await db
      .update(incidents)
      .set({ status, resolvedAt, updatedAt: new Date() })
      .where(eq(incidents.id, id))

    return { ok: true }
  })
}

async function requireApiSecret(request: any, reply: any) {
  const secret = process.env.API_SECRET
  const provided = request.headers['x-api-secret']

  if (!secret || provided !== secret) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}
