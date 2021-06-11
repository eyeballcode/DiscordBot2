const fs = require('fs')
global.window = {}
require('../Random/everyone')
let students = window.students

let updatedClasses = require('./data/classes')
let prevClasses = require('./data/classes-old')

//let newClasses = updatedClasses
let newClasses = updatedClasses.filter(c => new Date(c.start) > new Date())
let oldClasses = prevClasses.filter(c => new Date(c.start) > new Date())

let codes = []
let previousMissingStudents = []

newClasses.forEach(c => {
  if (!codes.includes(c.classCode)) {
    codes.push(c.classCode)
    let classSudents = c.students.map(s => {
      let student = students.find(x => x.id === s)
      if (!student) {
        if (!previousMissingStudents.includes(s)) {
          console.log('Failed to map', s)
          previousMissingStudents.push(s)
        }
        return 'Unknown Student'
      }
      return student.nameFirstPrefLastIdForm
    })

    fs.writeFileSync(`./roll/${c.classCode.replace(new RegExp('/', 'g'), '_')} - ${c.teacher}.txt`, classSudents.join('\n'))
  }
})

function generateClassesByStudent(classList) {
  let output = {}
  let activeStudents = []

  classList.forEach(c => {
    activeStudents = activeStudents.concat(c.students).filter((e, i, a) => a.indexOf(e) === i)
  })

  activeStudents.forEach(student => {
    let data = students.find(x => x.id === student)
    if (!data) data = { nameFirstPrefLastIdForm: 'Unknown Student'  }
    let subjects = []

    classList.forEach(c => {
      if (!subjects.includes(c.classCode) && c.students.includes(student)) {
        subjects.push(c.classCode)
      }
    })
    output[data.nameFirstPrefLastIdForm] = subjects
  })

  return output
}

let oldRolls = generateClassesByStudent(oldClasses)
let newRolls = generateClassesByStudent(newClasses)

let transfers = {}

Object.keys(oldRolls).forEach(student => {
  let oldRoll = oldRolls[student] || []
  let newRoll = newRolls[student] || []

  let oldMini = oldRoll.map(c => c.replace(/\d[A-Z]$/, ''))
  let newMini = newRoll.map(c => c.replace(/\d[A-Z]$/, ''))

  let transfer = []
  oldMini.forEach(c => {
    if (!newMini.includes(c)) transfer.push(`${c} - Transfer Out`)
  })

  newMini.forEach(c => {
    if (c.startsWith('MENT')) return
    if (!oldMini.includes(c)) transfer.push(`${c} - Transfer In`)
  })
  transfers[student] = transfer
  fs.writeFileSync(`./student/${student}.txt`, newRoll.join('\n'))
  if (transfer.length) fs.writeFileSync(`./transfers/${student}.txt`, transfer.length ? transfer.sort((a, b) => a.localeCompare(b)).join('\n') : 'No Transfers')
})

let staffClasses = newClasses.reduce((acc, clazz) => {
  if (!acc[clazz.teacher]) {
    acc[clazz.teacher] = []
  }

  if (!acc[clazz.teacher].includes(clazz.classCode)) {
    acc[clazz.teacher].push(clazz.classCode)
  }

  return acc
}, {})

Object.keys(staffClasses).forEach(staff => {
  fs.writeFileSync(`./staff/${staff}.txt`, staffClasses[staff].join('\n'))
})
