const audioConfig = require('../data/audio')
const PrideBrick = require('../modules/pride/PrideBrick')
const stationCodeLookup = require('../modules/pride/station-codes-lookup')

module.exports = {
  name: 'pride_brick',
  description: 'Acts as a pride talking brick',
  exec: async (msg, args, bot) => {
    if (audioConfig.enabled) {
      let stationCode = args[0]
      let platform = args[1]

      if (stationCode && platform) {
        if (global.prideAnnouncer) {
          await global.prideAnnouncer.stop()
          delete global.prideAnnouncer
        }

        let fullStationName = stationCodeLookup[stationCode]
        if (!fullStationName) return msg.reply('Sorry, that is an invalid station code')

        msg.reply(`Ringing PRIDE Brick at ${fullStationName} on platform ${platform}`)

        await PrideBrick(fullStationName, platform, bot)
      } else {
        msg.reply('Sorry, you need to specify a station. !pride_brick station platform')
      }
    } else {
      msg.reply('Sorry, PRIDE Announcing has been disabled')
    }
  }
}
