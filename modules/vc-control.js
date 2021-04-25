const vcControl = require('../data/vc-control.json')

async function authoriseUser(user, textChannel, authorised) {
  await textChannel.createOverwrite(user, {
    VIEW_CHANNEL: authorised
  })
}

module.exports = bot => {
  if (vcControl.active) {
    let server = bot.guilds.cache.find(server => server.name === vcControl.server_name)
    let voiceChannel = server.channels.cache.find(channel => channel.name === vcControl.vc_channel || channel.id === vcControl.vc_channel)
    let textChannel = server.channels.cache.find(channel => channel.name === vcControl.text_channel)

    let voiceChannelID = voiceChannel.id

    bot.on('voiceStateUpdate', async (oldMember, newMember) => {
      let oldUserChannel = oldMember.channelID
      let newUserChannel = newMember.channelID

      let user = server.members.cache.get(newMember.id)

      if (oldUserChannel !== voiceChannelID && newUserChannel === voiceChannelID) {
        await authoriseUser(user, textChannel, true)
      } else if (oldUserChannel === voiceChannelID && newUserChannel !== voiceChannelID) {
        await authoriseUser(user, textChannel, false)
      }
    })
  }
}
