const getWOTD = require('../modules/wotd/get')

module.exports = {
  name: 'wotd',
  description: 'Gets the Word Of The Day',
  exec: async (msg, args, bot) => {
    msg.reply(await getWOTD())
  }
}
