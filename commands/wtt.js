const timetables = require('../data/train-timetables')

module.exports = {
  name: 'wtt',
  description: 'Gets a train timetable from the WTT',
  exec: async (msg, args, bot) => {
    let td = args[0]
    if (!td) return msg.reply('You need to provide a TD: !wtt TD')

    let matched = timetables.filter(timetable => timetable.runID === td)
    matched.forEach(timetable => {
      let text = timetable.stopTimings.map(stop => `${stop.locationName}: ${stop.departureTime || stop.arrivalTime}`).join('\n')
      msg.reply(`Operates: ${timetable.operationDays.join(', ')}
Type: ${timetable.movementType}
${text}`)
    })
  }
}
