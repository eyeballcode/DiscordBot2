let classes = require('./data/classes.json')
global.window = {}
require('../Random/everyone')
let students = window.students
const moment = require('moment')
require('moment-timezone')

// classes = classes.sort((a, b) => new Date(a.start) - new Date(b.start))

function classFormat(clazz) {
  clazz.start = moment.tz(clazz.start, 'Australia/Melbourne')
  clazz.end = moment.tz(clazz.end, 'Australia/Melbourne')

  clazz.day = clazz.start.format('YYYYMMDD')
  clazz.startTime = clazz.start.format('HH:mm')

  return `${clazz.day} ${clazz.startTime} ${clazz.classCode}`
}

function matchStudent(knownClasses) {
  let possibleStudents = classes.filter(clazz => clazz.classCode.includes(knownClasses[0])).map(e=>e.students).reduce((a,e)=>a.concat(e), []).filter((e, i, a) => a.indexOf(e) === i)

  knownClasses.slice(1).forEach(classCode => {
    let matchStudents = classes.filter(clazz => clazz.classCode.includes(classCode)).map(e=>e.students).reduce((a,e)=>a.concat(e), []).filter((e, i, a) => a.indexOf(e) === i)
    let intersection = matchStudents.filter(student => possibleStudents.includes(student))
    possibleStudents = intersection
  })

  if (possibleStudents.length === 1) {
    let studentCode = possibleStudents[0]
    console.log('Student code', studentCode)
    console.log(students.find(x => x.id === studentCode))

    let studentClasses = classes.filter(clazz => clazz.students.includes(studentCode))

    console.log(studentClasses.map(classFormat))
  } else if (possibleStudents.length > 1) {
    console.log("Couldn't find student: not specific enough. Matched " + possibleStudents.length + " students")
    console.log(possibleStudents)
    console.log(possibleStudents.map(studentCode => students.find(x => x.id === studentCode)))
  } else {
    console.log("Couldn't find student")
  }
}

matchStudent(['11SPHY6', '11MSPE2'])
