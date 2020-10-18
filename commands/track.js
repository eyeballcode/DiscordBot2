const request = require('request-promise')
const moment = require('moment')
require('moment-timezone')

module.exports = {
  name: 'track',
  description: 'Tracks a bus, train or service',
  exec: async (msg, args, bot) => {
    let mode = args[0], arg = args[1]
    if (mode) {
      let url
      let type
      let date = moment.tz('Australia/Melbourne').format('YYYYMMDD')

      if (mode === 'service') {
        if (!arg) return msg.reply('You need to specify a service number')
        url = `https://vic.transportsg.me/bus/tracker/bot?service=${args[1]}`
        type = 'bus'
      } else if (mode === 'bus') {
        if (!arg) return msg.reply('You need to specify a fleet number')
        url = `https://vic.transportsg.me/bus/tracker/bot?fleet=${args[1]}`
        type = 'bus'
      } else if (mode === 'train') {
        if (!arg) return msg.reply('You need to specify a train number')
        url = `https://vic.transportsg.me/metro/tracker/bot?consist=${args[1]}&date=${date}`
        type = 'train'
      } else if (mode === 'tdn') {
        if (!arg) return msg.reply('You need to specify a TDN number')
        url = `https://vic.transportsg.me/metro/tracker/bot?runID=${args[1]}&date=${date}`
        type = 'train'
      } else return msg.reply('That doesn\'t look like a valid mode')

      let data = JSON.parse(await request(url))

      let lines
      if (type === 'bus') {
        lines = data.map(trip => {
          let line = `${trip.fleetNumber ? trip.fleetNumber + ': ' : ''}${trip.departureTime} ${trip.origin} - ${trip.destination}`
          if (mode === 'bus') line += ` ${trip.routeNumber}`
          return line
        })
      } else if (type === 'train') {
        lines = data.map(trip => {
          let line = `${trip.runID}: ${trip.departureTime} ${trip.origin} - ${trip.destination}: ${trip.consist.join('-')}`
          return line
        })
      }

      let chunks = []
      for (let i = 0; i < lines.length; i += 15) {
        chunks.push(lines.slice(i, i + 15))
      }

      chunks.forEach((chunk) => {
        msg.reply(chunk.join('\n'))
      })
    } else {
      msg.reply('You need to specify a mode: !track service|bus arg')
    }
  }
}
