const findPosition = require('../track-datum/find-position')

module.exports = {
  name: 'field',
  description: 'Locates a field object',
  exec: (msg, args, bot) => {
    try {
      msg.reply(findPosition(args[0]))
    } catch (e) {
      msg.reply('Something doesn\'t look valid')
    }
  }
}
