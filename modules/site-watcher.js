const config = require('../config.json')
const request = require('request')

let {SITE_WEBHOOK} = config

function httpRequest(url) {
  return new Promise(resolve => {
    request(url, {
      timeout: 5000,
      gzip: true,
      forever: true
    }, (err, data, body) => {
      resolve(body)
    })
  })
}

async function check() {
  let response = await httpRequest('https://vic.transportsg.me/health-check')
  if (response !== 'Ok') {
    await request(SITE_WEBHOOK, {
      method: 'POST',
      json: true,
      body: {
        content: `Site Not Responding: ${new Date().toLocaleString()}`
      }
    })
  }
}

module.exports = bot => {
  setInterval(check, 5 * 60 * 1000)
  check()
}
