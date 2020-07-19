const request = require('request-promise')
let mykiCards = require('../data/myki.json')
let mykiSettings = require('../data/myki-settings.json')
const moment = require('moment')

let channel

let sixPm = moment().endOf('day').subtract(6, 'hours')
let difference = sixPm - moment()
if (difference < 0) difference += 1440 * 60 * 1000

let users = Object.keys(mykiCards)

function checkCards(channel) {
  users.forEach(async user => {
    let parts = user.split('#')
    let mykiCard = mykiCards[user]

    let data = JSON.parse(await request(`https://mykiapi.ptv.vic.gov.au/myki/card/${mykiCard}`))
    let balance = parseFloat(data.mykiBalance)

    if (balance <= 6) {
      let user = channel.guild.members.cache.find(user => user.user.username === parts[0] && user.user.discriminator === parts[1])
      channel.send(`${user}, Your myki has a balance of $${balance.toFixed(2)}. Remember to topup your myki!
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
