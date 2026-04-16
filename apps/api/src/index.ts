import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { statusRoutes } from './routes/status'
import { incidentRoutes } from './routes/incidents'

async function main() {
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  })

  // Routes
  await app.register(statusRoutes)
  await app.register(incidentRoutes)

  // Health check
  app.get('/health', async () => ({ ok: true }))

  const port = parseInt(process.env.API_PORT ?? '3001', 10)

  try {
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`API listening on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
