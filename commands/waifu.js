const { MessageAttachment } = require('discord.js')

module.exports = {
  name: 'waifu',
  description: 'Waifu pics',
  exec: (msg, args, bot) => {
    let MAX = 5
    let count = Math.max(Math.min(args[0] || 1, MAX), 1)

    for (let i = 0; i < count; i++) {
      let random = Math.round(Math.random() * 100000)
      let url = `https://www.thiswaifudoesnotexist.net/example-${random}.jpg`
      let attachment = new MessageAttachment(url)
      msg.channel.send(`${msg.author}, `, attachment)
    }
  }
}
