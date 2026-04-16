import 'dotenv/config'
import { loadConfig } from './config-loader'
import { syncConfig } from './sync-config'
import { scheduleChecks, startWorker } from './scheduler'

async function main() {
  console.log('AI Status Worker starting...')

  // 1. Charger la configuration YAML
  const config = loadConfig()

  // 2. Synchroniser avec la base de données
  await syncConfig(config)

  // 3. Planifier les checks périodiques
  await scheduleChecks()

  // 4. Démarrer le worker BullMQ
  const worker = startWorker()

  console.log('Worker ready.')

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...')
    await worker.close()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
