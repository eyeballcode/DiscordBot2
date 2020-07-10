const { MessageAttachment } = require('discord.js')

module.exports = {
  name: 'avatar',
  description: 'Gets a user\'s avatar',
  exec: (msg, args, bot) => {
    let user = msg.mentions.users.first() || msg.author
    let avatarURL = user.displayAvatarURL() + '?size=2048'
    let attachment = new MessageAttachment(avatarURL)
    msg.channel.send(`${msg.author}, `, attachment)
  }
}
