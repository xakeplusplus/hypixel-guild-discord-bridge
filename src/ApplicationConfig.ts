import * as fs from 'fs'
import * as YAML from 'yaml'

import WebhookConfig from './instance/webhook/common/WebhookConfig'
import { DiscordConfig } from './instance/discord/common/DiscordConfig'
import GlobalConfig from './instance/globalChat/common/GlobalConfig'
import MetricsConfig from './instance/metrics/common/MetricsConfig'
import MinecraftConfig from './instance/minecraft/common/MinecraftConfig'
import { SocketConfig } from './instance/socket/common/SocketConfig'

export function loadApplicationConfig(filepath: fs.PathOrFileDescriptor): ApplicationConfig {
  const fileString = fs.readFileSync(filepath, 'utf8')
  const config = YAML.parse(fileString)

  return {
    general: config.general,
    metrics: config.metrics,
    plugins: config.plugins,
    socket: config.socket,
    profanityFilter: config.profanity,

    discord: config.discord,
    minecrafts: parseMinecraftInstances(config.minecraft),
    webhooks: config.webhooks,
    global: config.global
  }
}

function parseMinecraftInstances(minecraftYaml: any & { instances: any[] }): MinecraftConfig[] {
  const arr: MinecraftConfig[] = []

  for (const instanceYaml of minecraftYaml.instances) {
    // config are parsed dynamically. Can't set type to "MinecraftConfig"
    const config: any[string] = {}
    for (const key of Object.keys(minecraftYaml)) {
      if (key === 'instances') continue
      config[key] = minecraftYaml[key]
    }

    config.instanceName = instanceYaml.instanceName
    config.botOptions.auth = 'microsoft'
    config.botOptions.username = instanceYaml.email
    config.botOptions.password = instanceYaml.password

    if (instanceYaml.proxy != null) {
      const proxyArgs = instanceYaml.proxy.split(':')
      config.proxy = {
        protocol: proxyArgs[0],
        proxyHost: proxyArgs[1],
        proxyPort: proxyArgs[2]
      }
    } else {
      config.proxy = null
    }

    arr.push(config)
  }

  return arr
}

export interface ApplicationConfig {
  general: GeneralConfig
  plugins: PluginsConfig
  metrics: MetricsConfig
  socket: SocketConfig

  discord: DiscordConfig
  global: GlobalConfig

  minecrafts: MinecraftConfig[]
  webhooks: WebhookConfig[]
  profanityFilter: ProfanityFilterConfig
}

export interface PluginsConfig {
  enabled: boolean
  allowSocketInstance: boolean
  paths?: string[]
}

export interface ProfanityFilterConfig {
  enabled: boolean
  whitelisted: string[]
}

export interface GeneralConfig {
  hypixelApiKey: string
  displayInstanceName: boolean
}
