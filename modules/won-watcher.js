const config = require('../config.json')
const request = require('request')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const stream = require('stream')

let wonCount = 0
let wonCountPath = path.join(__dirname, '../data/won.dat')
fs.readFile(wonCountPath, (err, data) => {
  if (data) wonCount = parseInt(data.toString())
})

let {WON_WEBHOOK} = config

function httpRequest(url) {
  return new Promise(resolve => {
    request(url, {
      timeout: 7000,
      gzip: true,
      forever: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15'
      }
    }, (err, data, body) => {
      resolve(body)
    })
  })
}

async function check() {
  let body = ''
  try {
    body = await httpRequest('https://www.railsws.com.au/news/2021/1/11/weekly-operational-notices-wons-2021')
  } catch (e) {}

  let $ = cheerio.load(body)

  let wonButtons = Array.from($('[data-block-type="53"]'))
  if (wonButtons.length === 0) return // Request must have failed

  if (wonButtons.length !== wonCount) {
    wonCount = wonButtons.length
    let year = new Date().getFullYear()
    let wonID = wonCount < 10 ? '0' + wonCount : wonCount
    let wonName = `WON-${wonID}-${year}.pdf`

    let url = `https://www.railsws.com.au/s/${wonName}`
    request(url, {
      timeout: 10000,
      gzip: true,
      forever: true,
      encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15'
      }
    }, (err, data, wonBuffer) => {
      let wonPath = '/tmp/' + wonName
      fs.writeFile(wonPath, wonBuffer, err => {
        request.post({
          url: WON_WEBHOOK,
          formData: {
            content: `New WON Uploaded: WON.${wonID}/${year}`,
            file: fs.createReadStream(wonPath)
          }
        }, (err, resp, body) => {
          fs.writeFile(wonCountPath, wonCount.toString(), () => {})
        })
      })
    })
  }
}

module.exports = bot => {
  setInterval(check, 5 * 60 * 1000)
  check()
}
