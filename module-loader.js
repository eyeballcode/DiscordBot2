const fs = require('fs')
const path = require('path')

let commandFiles = fs.readdirSync(path.join(__dirname, 'modules'))

module.exports = bot => {
  commandFiles.forEach(fileName => {
    let filePath = path.join(__dirname, 'modules', fileName)
    let module = require(filePath)

    module(bot)
  })
}
