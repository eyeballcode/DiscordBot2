const fs = require('fs')
const path = require('path')

let commandFiles = fs.readdirSync(path.join(__dirname, 'commands'))

let commands = commandFiles.reduce((acc, fileName) => {
  let filePath = path.join(__dirname, 'commands', fileName)
  let data = require(filePath)
  acc[data.name] = data
  return acc
}, {})

module.exports = commands
