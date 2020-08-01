const puppeteer = require('puppeteer')
const stationCodeLookup = require('../data/station-codes-lookup')
const { MessageAttachment } = require('discord.js')
const fs = require('fs')

let pidTypes = ['fss-escalator', 'fss-platform', 'half-platform', 'half-platform-bold', 'platform']

async function render(fullStationName, platform, type) {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
  const page = await browser.newPage()

  let fileName = `${fullStationName}-${platform}-${type}`.toLowerCase().replace(/[^\w\d ]/g, '-').replace(/  */g, '-').replace(/--+/g, '-').replace(/-$/, '').replace(/^-/, '') + '.png'

  let height = 1800
  if (type.includes('half')) height = 900

  await page.setViewport({
    width: 3200,
    height,
    deviceScaleFactor: 2
  })

  await page.goto(`https://vic.transportsg.me/mockups/get?station=${fullStationName}&value=${platform}&type=${type}`, { waitUntil: 'networkidle2' })
  await new Promise(resolve => setTimeout(resolve, 7500))

  await page.screenshot({path: fileName})

  await browser.close()

  return fileName
}

module.exports = {
  name: 'pid',
  description: 'Generates an image of a station PID',
  exec: async (msg, args, bot) => {
    let [stationCode, platform, type] = args
    if (!(stationCode && platform && type)) return msg.reply('Format: !pid stationCode platform type')

    let fullStationName = stationCodeLookup[stationCode]
    if (!fullStationName) return msg.reply('Sorry, that is an invalid station code')
    if (!pidTypes.includes(type)) return msg.reply('Sorry, that is an invalid PID Type')

    msg.reply(`Rendering ${type} PID for ${fullStationName} Platform ${platform}`)

    let fileName = await render(fullStationName, platform, type)

    let attachment = new MessageAttachment(fileName)
    await msg.channel.send(`${msg.author}, `, attachment)

    fs.unlink(fileName, () => {})
  }
}
