const r = require('request-promise')
const async = require('async')
const cheerio = require('cheerio')

const TimedCache = require('../TimedCache')

let dataCache = new TimedCache(1000 * 60 * 10)

module.exports = {
  name: 'covid',
  description: 'COVID-19 Cases Today',
  exec: async (msg, args, bot) => {
    let message

    if (!(message = dataCache.get('W'))) {
      let vicData = JSON.parse(await r.get('https://www.theage.com.au/interactive/2020/coronavirus/data-feeder/covid-19-new-cases-dc-json-vic-latest.json'))
      let ausStats = JSON.parse(await r.get('https://www.smh.com.au/interactive/2020/coronavirus/data-feeder/covid-19-number-slugs-json-latest.json')).data
      let ausTotals = JSON.parse(await r.get('https://theage.com.au/interactive/2020/coronavirus/data-feeder/covid-19-regional-totals-json.json'))

      let vicTotal = ausTotals.cases.vic
      let vicStats = ausStats.filter(label => label.area === 'vic')

      let newCases = vicData.changeCounters[0]
      let cases = newCases.value

      let vicRecovered = vicStats.find(label => label.label === 'Recovered').value
      let active = vicTotal - vicRecovered
      let deaths = ausTotals.deaths.vic

      let updated = new Date(ausTotals.updated).toLocaleString()
      message = `COVID-19 Stats (Updated ${updated}):
New Cases: ${cases}
Total Active: ${active}
Total Deaths: ${deaths}
`
    }

    msg.reply(message)
  }

}
