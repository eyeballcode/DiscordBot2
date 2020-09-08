const r = require('request-promise')

module.exports = {
  name: 'site',
  description: 'Site Statistics',
  exec: async (msg, args, bot) => {
    let data = JSON.parse(await r.get(`https://vic.transportsg.me/response-stats`))
    msg.reply(`Mean response time: ${data.meanResponseTime}`)
  }
}
