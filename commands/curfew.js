const r = require('request-promise')
const async = require('async')

module.exports = {
  name: 'curfew',
  description: 'COVID-19 Cancelled Services',
  exec: async (msg, args, bot) => {
    let data = JSON.parse(await r.get('https://vic.transportsg.me/covid-19/curfew'))

    let postMidnightServices = data.filter(service => service.departureTime.startsWith('0'))
    data = data.slice(postMidnightServices.length).concat(postMidnightServices)

    let chunks = []
    for (let i = 0; i < data.length; i += 28) {
      chunks.push(data.slice(i, i + 28))
    }

    await msg.reply('Services cancelled due to COVID-19 are:')
    await async.forEachSeries(chunks, async chunk => {
      let message = chunk.map(service => `The ${service.departureTime} ${service.origin.slice(0, -16)} - ${service.destination.slice(0, -16)}`)
      await msg.reply(message.join('\n'))
    })
  }
}
