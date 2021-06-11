global.window = {}
require('../Random/everyone')
let students = window.students

let updatedClasses = require('./data/classes')
let studentIDs = require('./data/codes')

let search = process.argv[2]
let studentCode = studentIDs[search]
let classes = updatedClasses.filter(c => c.students.includes(studentCode) || c.teacher === search).sort((a, b) => new Date(a.start) - new Date(b.start))
console.log(classes.map(c => `Class: ${c.classCode}
Start: ${new Date(c.start)}
End: ${new Date(c.end)}
Location: ${c.location}
Teacher: ${c.teacher}`).join('\n-----\n'))
