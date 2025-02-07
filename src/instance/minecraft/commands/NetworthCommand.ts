/*
 CREDIT: Idea by Aura
 Discord: Aura#5051
 Minecraft username: _aura
*/
import MinecraftInstance from '../MinecraftInstance'
import { MinecraftCommandMessage } from '../common/ChatInterface'

import { getNetworth, localizedNetworth } from '../../../util/SkyblockApi'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mojang = require('mojang')

export default {
  triggers: ['networth', 'net', 'nw'],
  enabled: true,
  handler: async function (clientInstance: MinecraftInstance, username: string, args: string[]): Promise<string> {
    const givenUsername = args[0] != null ? args[0] : username
    const uuid = await Mojang.lookupProfileAt(givenUsername).then((mojangProfile: { id: any }) => mojangProfile.id)

    if (uuid == null) {
      return `No such username! (given: ${givenUsername})`
    }

    const networthLocalized = await clientInstance.app.hypixelApi
      .getSkyblockProfiles(uuid, { raw: true })
      .then((response: any) => response.profiles)
      .then((profiles: any[]) => profiles.filter((p) => p.selected)[0])
      .then(async (res: any) => await getNetworth(res.members[uuid], res.banking?.balance ?? 0))
      .then(localizedNetworth)

    return `${givenUsername}'s networth: ${networthLocalized}`
  }
} satisfies MinecraftCommandMessage
