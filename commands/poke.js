module.exports = {
  name: 'poke',
  description: 'Poke',
  exec: (msg, args, bot) => {
    if (Math.random() < 0.5) {
      msg.reply('Poke')
    } else {
      msg.reply('Boop')
    }
  }
}
