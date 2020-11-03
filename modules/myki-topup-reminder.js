const request = require('request-promise')
let mykiCards = require('../data/myki.json')
let mykiSettings = require('../data/myki-settings.json')
const moment = require('moment')
require('moment-timezone')
const cheerio = require('cheerio')

let channel

let now = moment.tz('Australia/Melbourne')

let sixPm = now.clone().startOf('day').add(18, 'hours').add(15, 'seconds')
let difference = sixPm - now
if (difference < 0) difference += 1440 * 60 * 1000

let users = Object.keys(mykiCards)

let ptvKey
let cacheTime

async function getPTVKey() {
  if (cacheTime && (new Date - cacheTime) < 1000 * 60 * 60) { // Cache key for 1hr max
    return ptvKey
  }

  let ptvData = await request('https://ptv.vic.gov.au')
  let $ = cheerio.load(ptvData)
  let script = Array.from($('body script')).find(s => {
    if (s.children[0]) {
      let t = s.children[0].data
      return t.includes('server_state') && t.includes('mykiToken') && t.includes('mapToken')
    }
  }).children[0].data

  let data = JSON.parse(script.slice(script.indexOf('=') + 1))
  let key = `${data.mykiTime}-${data.mykiToken}`

  ptvKey = key
  cacheTime = new Date()

  return key
}

async function getBalance(mykiCard) {
  let error
  for (let i = 0; i < 3; i++) {
    try {
      let data = JSON.parse(await request.post(`https://mykiapi.ptv.vic.gov.au/v2/myki/card`, {
        body: JSON.stringify({
          0: {
            mykiCardNumber: mykiCard
          }
        }),
        headers: {
          'authority': 'mykiapi.ptv.vic.gov.au',
          'accept': 'application/json',
          'content-type': 'application/json',
          'referer': 'https://www.ptv.vic.gov.au/tickets/myki/' ,
          'x-ptvwebauth': await getPTVKey()
        },
        gzip: true
      })).data[0]

      return data
    } catch (e) {
      error = e
      await new Promise(resolve => {
        setTimeout(resolve, 1000)
      })
    }
  }

  return { errored: true, error }
}

function checkCards(channel) {
  users.forEach(async user => {
    let parts = user.split('#')
    let mykiCard = mykiCards[user]
    let targetUser = channel.guild.members.cache.find(user => console.log(user) || user.user.username === parts[0] && user.user.discriminator === parts[1])
    let userPing = targetUser || user

    let data = await getBalance(mykiCard)
    if (data.errored) {
      console.log(user, data.error)
      return channel.send(`Sorry ${userPing}, failed to check your myki balance`)
    }
    let balance = parseFloat(data.mykiBalance)

    let lowBalance = balance <= 6
    let expiringMykiPass = false
    let hasPassCovering = data.Product && data.Product.length > 0

    if (hasPassCovering) {
      let pass = data.Product[0]
      let nextPass = data.Product[1]
      let expiry = moment.tz(pass.lastUtilizationDate, 'Australia/Melbourne')
      let now = moment.tz('Australia/Melbourne')

      let difference = (expiry - now) / 1000 / 60 / 60 / 24
      expiringMykiPass = difference <= 3 && !nextPass
    }

    if (expiringMykiPass && lowBalance) {
      channel.send(`${userPing}, Your myki pass will be expiring soon and your balance ${balance < 0 ? '-$' : '$'}${Math.abs(balance.toFixed(2))} of is running low. Remember to topup your myki!
You can topup here https://www.ptv.vic.gov.au/mykitopup/`)
    } else if (expiringMykiPass) {
      channel.send(`${userPing}, Your myki pass will be expiring soon. Remember to topup your myki!
You can topup here https://www.ptv.vic.gov.au/mykitopup/`)
    } else if (lowBalance && !hasPassCovering) {
      channel.send(`${userPing}, Your myki has a balance of ${balance < 0 ? '-$' : '$'}${Math.abs(balance.toFixed(2))}. Remember to topup your myki!
You can topup here https://www.ptv.vic.gov.au/mykitopup/`)
    }
  })
}

module.exports = bot => {
  let server = bot.guilds.cache.find(server => server.name === mykiSettings.server_name)
  let channel = server.channels.cache.find(channel => channel.name === mykiSettings.channel_name)

  setTimeout(() => {
    checkCards(channel)
    setInterval(() => {
      checkCards(channel)
    }, 1440 * 60 * 1000)
  }, difference)

  // preload api key 5min before sending topup reminders
  setTimeout(() => {
    getPTVKey()
    setInterval(() => {
      getPTVKey()
    }, 1440 * 60 * 1000)
  }, difference - 1000 * 60 * 5)
}
