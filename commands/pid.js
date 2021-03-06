const puppeteer = require('puppeteer')
const stationCodeLookup = require('../data/station-codes-lookup')
const { MessageAttachment } = require('discord.js')
const fs = require('fs')

let pidTypes = [
  'fss-escalator', 'fss-platform',
  'trains-from-fss',
  'half-platform', 'half-platform-bold', 'platform',
  'pre-platform-vertical',
  'sss-platform', 'sss-platform-new', 'sss-coach-new',
  'conc-up-down', 'conc-interchange',
  '2-line-led',
  'crt',
  'vline-half-platform',
]

let verticalPIDs = ['fss-escalator', 'pre-platform-vertical', 'conc-interchange', 'sss-coach-new']

async function render(url, width, height, fileName) {
  let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
  let page = await browser.newPage()

  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 2
  })

  await page.goto(url, { waitUntil: 'networkidle2' })
  await new Promise(resolve => setTimeout(resolve, 3000))

  await page.screenshot({path: fileName})
  await browser.close()
}

async function renderStationPID(fullStationName, platform, type) {
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

  let url = `https://vic.transportsg.me/mockups/get?station=${fullStationName}&value=${platform}&type=${type}`
  if (type === 'sss-platform') {
    url = `https://vic.transportsg.me/mockups/sss/platform/${platform}`
  }
  if (type === 'sss-platform-new') {
    url = `https://vic.transportsg.me/mockups/sss-new/platform/${platform}`
  }

  if (type === 'sss-coach-new') {
    let ranges = [[56, 57, 58], [59, 60, 61, 62], [63, 64, 65, 66], [67, 68, 69, 70]]
    let range = ranges.find(r => r.includes(platform))
    if (!range) range = [platform, 0, 0, 0]
    url = `https://vic.transportsg.me/mockups/sss-new/coach?start=${range[0]}&size=${range.length}`
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

  await render(url, width, height, fileName)

  return fileName
}

module.exports = {
  name: 'pid',
  description: 'Generates an image of a station PID',
  exec: async (msg, args, bot) => {
    let [stationCode, platform, type] = args
    let fileName

    if (stationCode === 'JMSS') {
      msg.reply(`Rendering JMSS next bus display`)
      fileName = 'jmss-big-screen.png'
      await render('https://vic.transportsg.me/jmss-screens/big-screen', 2560, 1280, fileName)
    } else if (stationCode === 'bus') {
      msg.reply('Rendering Bus PID display for ' + platform)
      fileName = 'bus-int.png'
      await render(`https://vic.transportsg.me/mockups/bus-int-pids/${platform}/${type || '*'}`, 3200, 900, fileName)
    } else {
      if (!(stationCode && platform && type)) return msg.reply('Format: !pid stationCode platform type')

      if (platform !== '*') platform = parseInt(platform)

      let fullStationName = stationCodeLookup[stationCode.toUpperCase()]
      if (!fullStationName) return msg.reply('Sorry, that is an invalid station code')
      if (!platform) return msg.reply('Sorry, that is an invalid platform.')
      if (!pidTypes.includes(type)) return msg.reply('Sorry, that is an invalid PID Type')

      if (type === 'sss-coach-new') {
        if (stationCode !== 'SSS' || !platform) {
          return msg.reply('Sorry, sss-coach-new must be used at SSS with a valid coach bay number')
        }
      } else if (type.includes('sss-')) {
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
      fileName = await renderStationPID(fullStationName, platform, type)
    }

    let attachment = new MessageAttachment(fileName)
    await msg.channel.send(`${msg.author}, `, attachment)

    fs.unlink(fileName, () => {})
  }
}
