const config = require('../config.json')
const request = require('request')

let {SITE_WEBHOOK, SLOW_WEBHOOK} = config
let lastMean = 0

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
  let response = { status: 0 }
  try {
    response = JSON.parse(await httpRequest('https://vic.transportsg.me/response-stats'))
  } catch (e) {}

  if (response.status !== 'ok') {
    await request(SITE_WEBHOOK, {
      method: 'POST',
      json: true,
      body: {
        content: `Site Not Responding: ${new Date().toLocaleString()}`
      }
    })
  } else if (response.meanResponseTime >= 3000) {
    if (response.meanResponseTime !== lastMean) {
      lastMean = response.meanResponseTime

      await request(SLOW_WEBHOOK, {
        method: 'POST',
        json: true,
        body: {
          content: `Site very slow, mean response time ${lastMean}ms: ${new Date().toLocaleString()}`
        }
      })
    }
  }
}

module.exports = bot => {
  setInterval(check, 5 * 60 * 1000)
  check()
}
