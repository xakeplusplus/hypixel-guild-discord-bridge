import MineFlayer = require('mineflayer');
import ChatManager from "./ChatManager"
import Application from "../../Application"
import {ClientInstance, LOCATION, Status} from "../../common/ClientInstance"
import {ChatEvent, ClientEvent, InstanceEvent, InstanceEventType} from "../../common/ApplicationEvent"
import RawChatHandler from "./handlers/RawChatHandler";
import SelfBroadcastHandler from "./handlers/SelfBroadcastHandler";
import SendChatHandler from "./handlers/SendChatHandler";
import ErrorHandler from "./handlers/ErrorHandler";
import StateHandler from "./handlers/StateHandler";
import MinecraftConfig from "./common/MinecraftConfig";


const {displayInstanceName: DISPLAY_INSTANCE_NAME} = require("../../../config/general-config.json")
const {SCOPE} = require("../../common/ClientInstance")
const commandsLimiter = new (require('../../util/RateLimiter').default)(2, 1000)


function formatChatMessage(prefix: string, bridgePrefix: string, instanceName: string, username: string, replyUsername: string | undefined, message: string) {
    let full = `/${prefix} ${bridgePrefix}`

    if (DISPLAY_INSTANCE_NAME) full += `[${instanceName}] `

    full += username
    if (replyUsername) full += `⇾${replyUsername}`
    full += `: ${message}`

    return full
}

export default class MinecraftInstance extends ClientInstance {
    readonly config: MinecraftConfig
    private readonly handlers
    client: MineFlayer.Bot | undefined

    constructor(app: Application, instanceName: string, config: MinecraftConfig) {
        super(app, instanceName, LOCATION.MINECRAFT)

        this.config = config

        this.status = Status.FRESH
        this.handlers = [
            new ErrorHandler(this),
            new StateHandler(this),
            new RawChatHandler(this),
            new SelfBroadcastHandler(this),
            new SendChatHandler(this),

            new ChatManager(this),
        ]

        this.app.on("chat", (event: ChatEvent) => {
            if (event.instanceName === this.instanceName) return

            if (event.scope === SCOPE.PUBLIC) {
                return this.send(formatChatMessage("gc", this.config.bridgePrefix, event.instanceName, event.username, event.replyUsername, event.message))

            } else if (event.scope === SCOPE.OFFICER) {
                return this.send(formatChatMessage("oc", this.config.bridgePrefix, event.instanceName, event.username, event.replyUsername, event.message))
            }
        })

        this.app.on("event", (event: ClientEvent) => {
            if (event.instanceName === this.instanceName) return
            if (event.scope !== SCOPE.PUBLIC) return
            if (event.removeLater) return

            return this.send(`/gc @[${event.instanceName || "Main"}]: ${event.message}`)
        })

    }

    async connect() {
        if (this.client) this.client.quit()

        this.client = MineFlayer.createBot(this.config.botOptions)
        this.app.emit("instance", <InstanceEvent>{
            instanceName: this.instanceName,
            location: LOCATION.MINECRAFT,
            type: InstanceEventType.create,
            message: "Minecraft instance has been created"
        })

        this.handlers.forEach(handler => handler.registerEvents())
    }

    username(): string | undefined {
        return this.client?.player?.username
    }

    uuid(): string | undefined {
        let uuid = this.client?.player?.uuid
        if (uuid) return uuid.split("-").join("")
        return uuid
    }

    async send(message: string): Promise<void> {
        return commandsLimiter.wait().then(() => {
            if (this?.client?.player) {
                this.client.chat(message)
            }
        })
    }
}