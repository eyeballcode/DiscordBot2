const request = require('request-promise')
const cheerio = require('cheerio')
const TimedCache = require('../../TimedCache')

let dataCache = new TimedCache(1000 * 60 * 10)

async function getWOTD() {
  let message

  if (!(message = dataCache.get('W'))) {
    let html = await request('https://www.merriam-webster.com/word-of-the-day')
    let $ = cheerio.load(html)
    let word = $('.word-header .word-and-pronunciation h1').text()
    let prettyWord = word[0].toUpperCase() + word.slice(1)

    let definition = $('.wod-definition-container > h2~p').text().split(':')
      .filter(Boolean).map(definition => definition.trim()).join(', ')

    let example = $('.wotd-examples > h2~p').first().text()

    let definitionHTML = await request('https://www.merriam-webster.com/dictionary/' + word)
    let $$ = cheerio.load(definitionHTML)

    let synonyms = Array.from($$('#synonyms-anchor ul:nth-child(3) li a').slice(0, 3)).map(e => $$(e).text()).join(', ')

    message = `${prettyWord}: ${definition}
*e.g: ${example}*
[synonyms: ${synonyms}]`

    dataCache.set('W', message)
  }

  return message
}

module.exports = getWOTD
