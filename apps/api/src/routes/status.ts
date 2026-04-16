import type { FastifyInstance } from 'fastify'
import { desc, eq, gte, and } from 'drizzle-orm'
import { getDb, providers, models, checks, incidents, uptimeHourly } from '@ai-status/db'

export async function statusRoutes(app: FastifyInstance) {
  const db = getDb()

  /**
   * GET /status
   * Retourne le statut courant de tous les providers et modèles.
   */
  app.get('/status', async () => {
    const allProviders = await db
      .select()
      .from(providers)
      .where(eq(providers.isActive, true))

    const allModels = await db
      .select()
      .from(models)
      .where(eq(models.isActive, true))

    // Dernier check par modèle
    const latestChecks = await Promise.all(
      allModels.map(async (model) => {
        const [latest] = await db
          .select()
          .from(checks)
          .where(eq(checks.modelId, model.id))
          .orderBy(desc(checks.checkedAt))
          .limit(1)
        return { modelId: model.id, check: latest ?? null }
      })
    )

    const checkByModel = Object.fromEntries(
      latestChecks.map(({ modelId, check }) => [modelId, check])
    )

    return {
      providers: allProviders.map((p) => {
        const providerModels = allModels.filter((m) => m.providerId === p.id)
        return {
          ...p,
          models: providerModels.map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            description: m.description,
            status: checkByModel[m.id]?.status ?? 'unknown',
            latencyMs: checkByModel[m.id]?.latencyMs ?? null,
            lastCheckedAt: checkByModel[m.id]?.checkedAt ?? null,
          })),
        }
      }),
    }
  })

  /**
   * GET /uptime/:modelId?days=90
   * Retourne l'historique d'uptime horaire pour un modèle.
   */
  app.get<{ Params: { modelId: string }; Querystring: { days?: string } }>(
    '/uptime/:modelId',
    async (request, reply) => {
      const { modelId } = request.params
      const days = Math.min(parseInt(request.query.days ?? '90', 10), 90)

      const since = new Date()
      since.setDate(since.getDate() - days)

      const [model] = await db.select().from(models).where(eq(models.id, modelId))
      if (!model) {
        return reply.code(404).send({ error: 'Model not found' })
      }

      const rows = await db
        .select()
        .from(uptimeHourly)
        .where(and(eq(uptimeHourly.modelId, modelId), gte(uptimeHourly.hour, since)))
        .orderBy(uptimeHourly.hour)

      const totalChecks = rows.reduce((sum, r) => sum + r.totalChecks, 0)
      const successChecks = rows.reduce((sum, r) => sum + r.successChecks, 0)
      const uptimePercent = totalChecks > 0 ? (successChecks / totalChecks) * 100 : null

      return {
        modelId,
        days,
        uptimePercent: uptimePercent !== null ? Math.round(uptimePercent * 100) / 100 : null,
        hourly: rows.map((r) => ({
          hour: r.hour,
          uptimePercent:
            r.totalChecks > 0
              ? Math.round((r.successChecks / r.totalChecks) * 10000) / 100
              : null,
          avgLatencyMs: r.avgLatencyMs,
          totalChecks: r.totalChecks,
        })),
      }
    }
  )

  /**
   * GET /checks/:modelId?limit=50
   * Retourne les derniers checks bruts pour un modèle.
   */
  app.get<{ Params: { modelId: string }; Querystring: { limit?: string } }>(
    '/checks/:modelId',
    async (request, reply) => {
      const { modelId } = request.params
      const limit = Math.min(parseInt(request.query.limit ?? '50', 10), 200)

      const [model] = await db.select().from(models).where(eq(models.id, modelId))
      if (!model) {
        return reply.code(404).send({ error: 'Model not found' })
      }

      const rows = await db
        .select()
        .from(checks)
        .where(eq(checks.modelId, modelId))
        .orderBy(desc(checks.checkedAt))
        .limit(limit)

      return { modelId, checks: rows }
    }
  )
}
