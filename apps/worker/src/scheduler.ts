/**
 * Planifie les checks périodiques pour chaque modèle actif.
 * Utilise BullMQ repeat jobs — si le worker redémarre, les jobs
 * reprennent automatiquement.
 */
import { Queue, Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'
import { ulid } from 'ulid'
import { eq } from 'drizzle-orm'
import { getDb, models, checks, uptimeHourly } from '@ai-status/db'
import { runCheck } from '@ai-status/checkers'

const QUEUE_NAME = 'model-checks'

export type CheckJobData = {
  modelId: string
}

let queue: Queue | null = null

export function getQueue(): Queue {
  if (!queue) {
    const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
    queue = new Queue(QUEUE_NAME, { connection })
  }
  return queue
}

export async function scheduleChecks(): Promise<void> {
  const db = getDb()
  const q = getQueue()

  // Récupérer tous les modèles actifs
  const activeModels = await db.select().from(models).where(eq(models.isActive, true))

  // Supprimer les repeat jobs existants pour repartir proprement
  const existingJobs = await q.getRepeatableJobs()
  for (const job of existingJobs) {
    await q.removeRepeatableByKey(job.key)
  }

  // Planifier un repeat job par modèle
  for (const model of activeModels) {
    const intervalSeconds = model.checkConfig.intervalSeconds ?? 60

    await q.add(
      `check-${model.id}`,
      { modelId: model.id } satisfies CheckJobData,
      {
        repeat: { every: intervalSeconds * 1000 },
        jobId: `check-${model.id}`,
      }
    )

    console.log(`Scheduled check for ${model.id} every ${intervalSeconds}s`)
  }

  console.log(`Scheduled ${activeModels.length} model check(s)`)
}

export function startWorker(): Worker {
  const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  })

  const worker = new Worker<CheckJobData>(
    QUEUE_NAME,
    async (job: Job<CheckJobData>) => {
      await processCheck(job.data.modelId)
    },
    { connection, concurrency: 5 }
  )

  worker.on('completed', (job) => {
    console.log(`Check completed: ${job.data.modelId}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Check failed: ${job?.data.modelId}`, err)
  })

  return worker
}

async function processCheck(modelId: string): Promise<void> {
  const db = getDb()

  const [model] = await db.select().from(models).where(eq(models.id, modelId))
  if (!model) {
    console.warn(`Model not found: ${modelId}`)
    return
  }

  const result = await runCheck(model.checkConfig)

  // Sauvegarder le résultat brut
  await db.insert(checks).values({
    id: ulid(),
    modelId: model.id,
    status: result.status,
    latencyMs: result.latencyMs,
    httpStatus: result.httpStatus,
    errorMessage: result.errorMessage,
    checkedAt: new Date(),
  })

  // Mettre à jour l'agrégat horaire
  const hour = new Date()
  hour.setMinutes(0, 0, 0)

  const isSuccess = result.status === 'operational' || result.status === 'degraded'

  await db
    .insert(uptimeHourly)
    .values({
      modelId: model.id,
      hour,
      totalChecks: 1,
      successChecks: isSuccess ? 1 : 0,
      avgLatencyMs: result.latencyMs,
      minLatencyMs: result.latencyMs,
      maxLatencyMs: result.latencyMs,
    })
    .onConflictDoUpdate({
      target: [uptimeHourly.modelId, uptimeHourly.hour],
      set: {
        totalChecks: db.sql`uptime_hourly.total_checks + 1`,
        successChecks: db.sql`uptime_hourly.success_checks + ${isSuccess ? 1 : 0}`,
      },
    })
}
