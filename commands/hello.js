module.exports = {
  name: 'hello',
  description: 'Says hello!',
  exec: (msg, args, bot) => {
    msg.reply('Hello!')
  }
}
