const request = require('request-promise')
let mykiCards = require('../data/myki.json')
let mykiSettings = require('../data/myki-settings.json')
const moment = require('moment')
require('moment-timezone')

let channel

let now = moment.tz('Australia/Melbourne')

let sixPm = now.clone().startOf('day').add(18, 'hours')
let difference = sixPm - now
if (difference < 0) difference += 1440 * 60 * 1000

let users = Object.keys(mykiCards)

function checkCards(channel) {
  users.forEach(async user => {
    let parts = user.split('#')
    let mykiCard = mykiCards[user]

    let data = JSON.parse(await request(`https://mykiapi.ptv.vic.gov.au/myki/card/${mykiCard}`))
    let balance = parseFloat(data.mykiBalance)

    let lowBalance = balance <= 6
    let expiringMykiPass = false
    let hasPassCovering = data.Product.length > 0

    if (hasPassCovering) {
      let pass = data.Product[0]
      let nextPass = data.Product[1]
      let expiry = moment.tz(pass.lastUtilizationDate, 'Australia/Melbourne')
      let now = moment.tz('Australia/Melbourne')

      let difference = (expiry - now) / 1000 / 60 / 60 / 24
      expiringMykiPass = difference <= 3 && !nextPass
    }

    let targetUser = channel.guild.members.cache.find(user => user.user.username === parts[0] && user.user.discriminator === parts[1])
    if (expiringMykiPass && lowBalance) {
      channel.send(`${targetUser}, Your myki pass will be expiring soon and your balance $${balance.toFixed(2)} of is running low. Remember to topup your myki!
You can topup here https://www.ptv.vic.gov.au/mykitopup/`)
    } else if (expiringMykiPass) {
      channel.send(`${targetUser}, Your myki pass will be expiring soon. Remember to topup your myki!
You can topup here https://www.ptv.vic.gov.au/mykitopup/`)
    } else if (lowBalance && !hasPassCovering) {
      channel.send(`${targetUser}, Your myki has a balance of $${balance.toFixed(2)}. Remember to topup your myki!
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
}
