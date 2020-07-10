const audioConfig = require('../data/audio')
const PrideAudioAnnouncer = require('../modules/pride/PrideAudioAnnouncer')
const stationCodeLookup = require('../data/station-codes-lookup')

module.exports = {
  name: 'pride',
  description: 'Adjusts PRIDE Announcements',
  exec: async (msg, args, bot) => {
    if (audioConfig.enabled) {
      let stationCode = args[0]
      let platform = args[1]

      if (stationCode) {
        if (global.prideAnnouncer) {
          await global.prideAnnouncer.stop()
          if (stationCode === 'disable') await global.prideAnnouncer.quit()
          delete global.prideAnnouncer

          if (stationCode === 'disable') return msg.reply('Disabled PRIDE Announcer')
        } else if (stationCode === 'disable') return msg.reply('Disabled PRIDE Announcer')

        let fullStationName = stationCodeLookup[stationCode]
        if (!fullStationName) return msg.reply('Sorry, that is an invalid station code')

        global.prideAnnouncer = new PrideAudioAnnouncer(bot, fullStationName, platform)
        await global.prideAnnouncer.start()

        msg.reply(`PRIDE Announcer setup at ${fullStationName} for ${platform ? `platform ${platform}` : 'all platforms'}`)
      } else {
        msg.reply('Sorry, you need to specify a station. !pride station [platform]')
      }
    } else {
      msg.reply('Sorry, PRIDE Announcing has been disabled')
    }
  }
}
