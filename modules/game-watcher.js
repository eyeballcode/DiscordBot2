let watcherSettings = require('../data/watch-games.json')

module.exports = bot => {
  let server = bot.guilds.cache.find(server => server.name === watcherSettings.server_name)
  let channel = server.channels.cache.find(channel => channel.name === watcherSettings.channel_name)

  bot.on('presenceUpdate', (oldPresence, newPresence) => {
    let guild = newPresence.guild
    let activities = newPresence.activities

    let member = newPresence.member
    let user = member.user

    let fullUser = `${user.username}#${user.discriminator}`
    if (!watcherSettings.users.includes(fullUser)) return

    if (oldPresence.activities.length === activities.length) return

    if (guild.id === server.id && activities.length) {
      let activity = activities[0]
      let {name} = activity

      let activityType = activity.type.toString()

      if (activityType === 'CUSTOM_STATUS') return
      if (activityType === 'LISTENING') {
        channel.send(`Attention! ${member} has just started listening to ${name}`)
      } else {
        channel.send(`Attention! ${member} has just started ${activityType.toLowerCase()} ${name}`)
      }
    }
  })
}
