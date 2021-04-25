const { MessageEmbed } = require('discord.js')
const activities = require('../data/activities')
const codeToNames = require('../data/code-to-names')
const classes = require('../data/classes')
const userIDs = require('../data/user-ids')
const studentIDs = require('../data/codes')

const moment = require('moment')
require('moment-timezone')

module.exports = {
  name: 'classes',
  description: 'Gets a user\'s classes',
  exec: (msg, args, bot) => {
    let target = msg.mentions.users.first() || msg.author
    let user = `${target.username}#${target.discriminator}`

    let matchingClasses = []
    if (args[0] && args[0].length === 4) {
      matchingClasses = classes.filter(clazz => clazz.teacher === args[0])
    } else if (studentIDs[args[0]]) {
      matchingClasses = classes.filter(clazz => clazz.students.includes(studentIDs[args[0]]))
    } else if (userIDs[user]) {
      matchingClasses = classes.filter(clazz => clazz.students.includes(userIDs[user]))
    }

    if (matchingClasses.length) {
      matchingClasses = matchingClasses.map(clazz => {
        let classCode = clazz.classCode
        let subjectName = codeToNames[clazz.subjectID]

        let start = moment.tz(clazz.start, 'Australia/Melbourne')
        let end = moment.tz(clazz.end, 'Australia/Melbourne')

        let activityID = activities[clazz.classCode]
        let startTimestamp = moment.utc(clazz.start).format('DDMMYYYYHHmm')

        let compassURL = `https://jmss-vic.compass.education/Organise/Activities/Activity.aspx#session/${activityID}${startTimestamp}`

        return {
          classCode,
          subjectName,
          location: clazz.location,
          teacher: clazz.teacher,
          start: start.format('HH:mm'),
          end: end.format('HH:mm'),
          startTime: start,
          endTime: end,
          compassURL
        }
      })

      let now = moment.tz('Australia/Melbourne')

      let upcoming = matchingClasses.filter(event => event.endTime > now).sort((a, b) => a.startTime - b.startTime)
      if (!upcoming[0]) return msg.reply('Sorry, you don\'t have any upcoming classes')

      let current, next, following

      if (upcoming[0].startTime < now) {
        current = upcoming[0]
        next = upcoming[1]
        following = upcoming[2]
      } else {
        next = upcoming[0]
        following = upcoming[1]
      }

      let embeds = []

      function createEmbed(type, clazz) {
        embeds.push(new MessageEmbed()
        .setTitle(`${type}: ${clazz.subjectName}`)
        .setURL(clazz.compassURL)
        .addFields(
          { name: 'Location', value: clazz.location, inline: true },
          { name: 'Teacher', value: clazz.teacher, inline: true },
          { name: 'Start', value: clazz.start, inline: true }
        ))
      }

      if (current) {
        createEmbed('Current Class', current)
      }

      createEmbed('Next Class', next)
      createEmbed('Following Class', following)

      for (let embed of embeds) {
        msg.reply(embed)
      }
    } else {
      msg.reply('Sorry, I don\'t have your classes')
    }
  }
}
