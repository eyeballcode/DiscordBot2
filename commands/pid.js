const puppeteer = require('puppeteer')
const stationCodeLookup = require('../data/station-codes-lookup')
const { MessageAttachment } = require('discord.js')
const fs = require('fs')

let pidTypes = [
  'fss-escalator', 'fss-platform',
  'train-from-fss',
  'half-platform', 'half-platform-bold', 'platform',
  'pre-platform-vertical',
  'sss-platform', 'sss-platform-new',
  'conc-up-down', 'conc-interchange',
  '2-line-led',
  'crt',
  'vline-half-platform'
]

let verticalPIDs = ['fss-escalator', 'pre-platform-vertical', 'conc-interchange']

async function render(fullStationName, platform, type) {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
  const page = await browser.newPage()

  let fileName = `${fullStationName}-${platform}-${type}`.toLowerCase().replace(/[^\w\d ]/g, '-').replace(/  */g, '-').replace(/--+/g, '-').replace(/-$/, '').replace(/^-/, '') + '.png'

  let width = 3200
  let height = 1800
  if (type.includes('half')) height = 900

  if (verticalPIDs.includes(type)) {
    width = 1800
    height = 3200
  }

  if (type === '2-line-led') {
    width = 3200
    height = 1174
  }

  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 2
  })

  let url = `https://vic.transportsg.me/mockups/get?station=${fullStationName}&value=${platform}&type=${type}`
  if (type === 'sss-platform') {
    url = `https://vic.transportsg.me/mockups/sss/platform/${platform}`
  }
  if (type === 'sss-platform-new') {
    url = `https://vic.transportsg.me/mockups/sss-new/platform/${platform}`
  }
  if (type === 'trains-from-fss') {
    url = `https://vic.transportsg.me/mockups/fss/trains-from-fss`
  }
  if (type.startsWith('conc-')) {
    url = `https://vic.transportsg.me/mockups/get?station=${fullStationName}&concourseType=${type.slice(5)}&type=concourse`
  }
  if (type === '2-line-led') {
    url = `https://vic.transportsg.me/mockups/metro-led-pids/${fullStationName.toLowerCase().replace(/ /g, '-')}/${platform}`
  }

  await page.goto(url, { waitUntil: 'networkidle2' })
  await new Promise(resolve => setTimeout(resolve, 3000))

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

    if (platform !== '*') platform = parseInt(platform)

    let fullStationName = stationCodeLookup[stationCode]
    if (!fullStationName) return msg.reply('Sorry, that is an invalid station code')
    if (!platform) return msg.reply('Sorry, that is an invalid platform.')
    if (!pidTypes.includes(type)) return msg.reply('Sorry, that is an invalid PID Type')

    if (type.includes('sss-')) {
      if (stationCode === 'SSS') {
        platform = platform + (platform % 2 - 1)
        platform = `${platform}-${platform + 1}`
      } else {
        return msg.reply(`Sorry, ${type} must be used at SSS`)
      }
    }

    if (type === 'trains-from-fss') {
      if (stationCode !== 'FSS' || platform !== '*') {
        return msg.reply(`Sorry, trains-from-fss must be used at FSS with platform *`)
      }
    }
    if (type.startsWith('conc-') && platform !== '*') {
      return msg.reply(`Sorry, ${type} must be used with platform *`)
    }

    msg.reply(`Rendering ${type} PID for ${fullStationName} Platform ${platform}`)

    let fileName = await render(fullStationName, platform, type)

    let attachment = new MessageAttachment(fileName)
    await msg.channel.send(`${msg.author}, `, attachment)

    fs.unlink(fileName, () => {})
  }
}
