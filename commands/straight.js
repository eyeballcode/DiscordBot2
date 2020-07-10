module.exports = {
  name: 'straight?',
  description: 'Is <username> straight?',
  exec: (msg, args, bot) => {
    let user = msg.mentions.users.first()
    if (!user) {
      return msg.reply(`You're as straight as string`)
    }

    msg.reply(`No, ${user} is not straight`)
  }
}
