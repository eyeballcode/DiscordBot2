const rawClasses = require('../data/classes')
const trackerData = require('../data/class-status-tracker')

const classes = rawClasses.filter(clazz => clazz.students.includes(trackerData.tracking)).sort((a, b) => new Date(a.start) - new Date(b.start))

let url = "https://www.twitch.tv/AHHHHHHHHHHHHHHHHHHHHH"

module.exports = bot => {
  async function setClassStatus() {
    let now = new Date()
    let next = classes.find(clazz => new Date(clazz.end) > now)
    let start = new Date(next.start)

    if (start < now) {
      let subjectCode = next.classCode.replace(/\d[A-Z]?$/, '')
      let subjectName = trackerData.classNames[subjectCode]
      let subjectFormat = trackerData.classFormat[subjectCode] || trackerData.classFormat.DEFAULT
      subjectFormat = subjectFormat.replace('{}', subjectName)

      bot.user.setPresence({
        status: 'online',
        activity: {
          name: subjectFormat,
          type: 'STREAMING'
        }
      })

      let timeToEndClass = new Date(next.end) - now
      setTimeout(setClassStatus, timeToEndClass + 1000)
    } else {
      let activities = trackerData.classFormat.NO_CLASS
      let activity = activities[Math.round(Math.random() * activities.length)]

      await bot.user.setPresence({
        status: 'online',
        activity
      })

      let timeToNextClass = new Date(next.start) - now
      setTimeout(setClassStatus, timeToNextClass + 1000)
    }
  }

  setClassStatus()
}
