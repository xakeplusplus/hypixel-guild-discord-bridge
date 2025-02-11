import fs = require('fs')
import { ChatMessage } from 'prismarine-chat'

import MinecraftInstance from './MinecraftInstance'
import EventHandler from '../../common/EventHandler'
import { MinecraftChatMessage } from './common/ChatInterface'
import { CommandsManager } from './CommandsManager'

const PATH = './src/instance/minecraft/chat'
const chatEvents: MinecraftChatMessage[] = fs
  .readdirSync(PATH)
  .filter((file: string) => file.endsWith('Chat.ts'))
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .map((f: string) => require(`./chat/${f}`).default)

export default class ChatManager extends EventHandler<MinecraftInstance> {
  private readonly commandsManager: CommandsManager

  constructor(clientInstance: MinecraftInstance) {
    super(clientInstance)
    this.commandsManager = new CommandsManager(clientInstance)
  }

  registerEvents(): void {
    this.clientInstance.client?.on('message', (message: ChatMessage) => {
      this.onMessage(message.toString().trim())
    })
    this.commandsManager.registerEvents()
  }

  private onMessage(message: string): void {
    chatEvents.forEach((e) => {
      e.onChat(this.clientInstance, this.commandsManager, message)
    })
  }
}
