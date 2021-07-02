const r = require('request-promise')

module.exports = {
  name: 'site',
  description: 'Site Statistics',
  exec: async (msg, args, bot) => {
    let data = JSON.parse(await r.get(`https://vic.transportsg.me/response-stats`))
    msg.reply(`Mean Response Time ${data.meanResponseTime}ms
PTV Response time ${data.ptvMeanResponseTime}ms
At: ${new Date().toLocaleString()}`)
  }
}
