const {Gauge} = require("prom-client")
const METRICS_CONFIG = require("../../config/metrics-config.json")
const register = require("./PrometheusServer")

const GUILD_MEMBERS_ONLINE = new Gauge({
    name: METRICS_CONFIG.prefix + "guild_members_online",
    help: 'Guild online members',
    labelNames: ['name'],
})
register.registerMetric(GUILD_MEMBERS_ONLINE)

async function getOnlineMembers(minecraftInstance) {
    let name
    let online
    const onlineRegex = /^Online Members: (\d+)$/g
    const nameRegex = /^Guild Name: (.+)$/g

    const chatListener = function (event) {
        let eventMessage = event.toString().trim()
        if (!eventMessage) return

        let onlineMatch = onlineRegex.exec(eventMessage)
        if (onlineMatch) online = onlineMatch[1]

        let nameMatch = nameRegex.exec(eventMessage)
        if (nameMatch) name = nameMatch[1]
    }

    minecraftInstance.client.on('message', chatListener)
    minecraftInstance.send("/guild list")
    await new Promise(r => setTimeout(r, 3000))
    minecraftInstance.client.removeListener('message', chatListener)

    return {name: name, online: online}
}

async function collectMetrics(minecraftInstance) {
    // TODO: add better logger structure
    let guild = await getOnlineMembers(minecraftInstance)

    let onlineMembers = Number(guild.online)
    if (!guild?.name || !onlineMembers) return

    GUILD_MEMBERS_ONLINE.set({name: guild.name}, onlineMembers)
}

module.exports = function (app) {
    setInterval(
        () => app.minecraftInstances.forEach(collectMetrics),
        METRICS_CONFIG.metrics_frequency * 1000
    )
}