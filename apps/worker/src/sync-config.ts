/**
 * Synchronise la configuration YAML avec la base de données.
 * Crée/met à jour les providers et models selon le fichier de config.
 */
import { eq } from 'drizzle-orm'
import { getDb, providers, models } from '@ai-status/db'
import type { Config } from './config-loader'

export async function syncConfig(config: Config): Promise<void> {
  const db = getDb()

  for (const providerCfg of config.providers) {
    // Upsert provider
    await db
      .insert(providers)
      .values({
        id: providerCfg.slug,
        name: providerCfg.name,
        website: providerCfg.website ?? null,
        logoUrl: providerCfg.logoUrl ?? null,
        description: providerCfg.description ?? null,
        isActive: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: providers.id,
        set: {
          name: providerCfg.name,
          website: providerCfg.website ?? null,
          logoUrl: providerCfg.logoUrl ?? null,
          description: providerCfg.description ?? null,
          updatedAt: new Date(),
        },
      })

    for (const modelCfg of providerCfg.models) {
      const modelId = `${providerCfg.slug}/${modelCfg.id}`

      await db
        .insert(models)
        .values({
          id: modelId,
          providerId: providerCfg.slug,
          name: modelCfg.name,
          slug: modelCfg.id,
          description: modelCfg.description ?? null,
          isActive: true,
          checkConfig: modelCfg.check,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: models.id,
          set: {
            name: modelCfg.name,
            description: modelCfg.description ?? null,
            checkConfig: modelCfg.check,
            updatedAt: new Date(),
          },
        })
    }
  }

  console.log(`Config synced: ${config.providers.length} provider(s)`)
}
