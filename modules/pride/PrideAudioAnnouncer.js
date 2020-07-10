const audioConfig = require('../../data/audio')
const AudioQueue = require('./AudioQueue')
const StationMonitor = require('./StationMonitor')

module.exports = class PrideAudioAnnouncer {

  constructor(bot, station, platform) {
    let server = bot.guilds.cache.find(guild => guild.name === audioConfig.server_name)
    this.voiceChannel = server.channels.cache.find(channel => channel.name === audioConfig.channel_name)

    this.station = station
    this.platform = platform
  }

  async start() {
    this.voiceConnection = await this.voiceChannel.join()
    this.audioQueue = new AudioQueue(this.voiceConnection)

    this.stationMonitor = new StationMonitor(this.station, this.platform, this.audioQueue)
  }

  async stop() {
    await this.stationMonitor.stop()
  }

  async quit() {
    await this.voiceConnection.disconnect()
  }
}
