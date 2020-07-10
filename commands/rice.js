const r = require('request-promise')
const async = require('async')
const TimedCache = require('../TimedCache')

let cache = new TimedCache(1000 * 60)

let userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15'
let headers = { 'Content-Type': 'application/json', 'User-Agent': userAgent }

let groupIDs = {
  'Flannery': 'e2607ee8-1417-4d65-a117-71d67ffef6d4',
  'Wood': '48661266-a8dd-4628-bd2d-bed5bc56ef62',
  'Blackburn': 'fe6dd032-c792-4b70-ae3c-af89ebe184a4',
  'Doherty': '9f93e4a5-eecc-4dbe-a512-dc4754dee2bc'
}

module.exports = {
  name: 'rice',
  description: 'Rice Counts',
  exec: async (msg, args, bot) => {
    if (cache.get('r')) return msg.reply(cache.get('r'))

    try {
      let scores = []

      await async.forEach(Object.keys(groupIDs), async groupName => {
        let groupID = groupIDs[groupName]
        let data = JSON.parse(await r.get(`https://engine.freerice.com/groups/${groupID}`, { headers }))
        let freericeScore = data.data.attributes.rice
        let trueScore = data.data.attributes.members.reduce((total, user) => total + user.rice, 0)

        let text = `${groupName}: Freerice Score: ${freericeScore}, True Score: ${trueScore}, Difference: ${freericeScore - trueScore}`
        scores.push({ text, trueScore })
      })

      let response = '\n' + scores.sort((a, b) => b.trueScore - a.trueScore).map(e => e.text).join('\n')

      msg.reply(response)
      cache.set('r', response)
    } catch (e) {
      console.log(e)
      msg.reply('Failed to get rice counts, sorry')
    }
  }
}
