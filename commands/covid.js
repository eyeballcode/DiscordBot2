const r = require('request-promise')
const async = require('async')
const cheerio = require('cheerio')

let casesSelector = '.field--name-field-cln-box > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)'
let activeSelector = '.field--name-field-cln-box > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)'
let deathsSelector = '.field--name-field-cln-box > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)'
let updatedSelector = '.updated'

module.exports = {
  name: 'covid',
  description: 'COVID-19 Cases Today',
  exec: async (msg, args, bot) => {
    let $ = cheerio.load(await r.get('https://www.dhhs.vic.gov.au/coronavirus'))

    let cases = $(casesSelector).text()
    let active = $(activeSelector).text()
    let deaths = $(deathsSelector).text()

    let updated = $(updatedSelector).text().slice(9).replace(/  +/g, ' ')

    msg.reply(`COVID-19 Stats (Updated ${updated}):
New Cases: ${cases}
Total Active: ${active}
Total Deaths: ${deaths}
`)
  }

}
