import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { parse } from 'yaml'
import type { CheckConfig } from '@ai-status/db'

type ProviderConfig = {
  name: string
  slug: string
  website?: string
  logoUrl?: string
  description?: string
  models: ModelConfig[]
}

type ModelConfig = {
  id: string
  name: string
  description?: string
  check: CheckConfig
}

type Config = {
  providers: ProviderConfig[]
}

export function loadConfig(): Config {
  const configPath = process.env.CONFIG_PATH ?? resolve(process.cwd(), '../../config/providers.yml')

  if (!existsSync(configPath)) {
    console.warn(`Config file not found at ${configPath}, using empty config`)
    return { providers: [] }
  }

  const raw = readFileSync(configPath, 'utf-8')
  const config = parse(raw) as Config

  if (!config.providers || !Array.isArray(config.providers)) {
    throw new Error('Invalid config: missing providers array')
  }

  return config
}

export type { ProviderConfig, ModelConfig, Config }
