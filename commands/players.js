const r = require('request-promise')

module.exports = {
  name: 'players',
  description: 'Get players on site',
  exec: async (msg, args, bot) => {
    let data = JSON.parse(await r.get(`http://jmss-mc.transportsg.me/players`))
    if (data.length) msg.reply(`Players: ${data.join(', ')}`)
    else msg.reply('No one is on right now')
  }
}
