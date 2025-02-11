import EventHandler from '../../../common/EventHandler'
import MinecraftInstance from '../MinecraftInstance'
import { MinecraftSendChat } from '../../../common/ApplicationEvent'

export default class SendChatHandler extends EventHandler<MinecraftInstance> {
  constructor(minecraftInstance: MinecraftInstance) {
    super(minecraftInstance)

    minecraftInstance.app.on('minecraftSend', (event) => {
      void this.onCommand(event)
    })
  }

  registerEvents(): void {}

  private async onCommand(event: MinecraftSendChat): Promise<void> {
    // null is strictly checked due to api specification
    if (event.targetInstanceName === null || event.targetInstanceName === this.clientInstance.instanceName) {
      await this.clientInstance.send(event.command)
    }
  }
}
