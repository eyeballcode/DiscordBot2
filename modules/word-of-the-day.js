const request = require('request-promise')
const config = require('../config')
const moment = require('moment')
require('moment-timezone')

const getWOTD = require('./wotd/get')

let now = moment.tz('Australia/Melbourne')

let endOfDay = now.clone().endOf('day')
let difference = endOfDay - now

let {WEBHOOK} = config

async function sendWOTD() {
  let message = await getWOTD()

  await request(WEBHOOK, {
    method: 'POST',
    json: true,
    body: {
      content: message,
      username: "Mintis",
      avatar_url: "https://cdn.discordapp.com/attachments/682118780570173457/737981762915008562/59f0e75a100ca581c3d7e137f9d0888a.webp"
    }
  })
}

module.exports = bot => {
  setTimeout(() => {
    sendWOTD()
    setInterval(() => {
      sendWOTD()
    }, 1440 * 60 * 1000)
  }, difference)
}
