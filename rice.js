const { JSDOM } = require('jsdom')
const r = require('request-promise')
const config = require('./data/rice')
let gameID
let category = '66f2a9aa-bac2-5919-997d-2d17825c1837'
let userID = config.userid
let level = 2
let userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15'
let headers = { 'Content-Type': 'application/json', 'User-Agent': userAgent }

let sleepTime = 3500

async function handleError(e) {
  if (e.statusCode === 429) {
    console.log('Been rate limited, sleeping 5min')
    await sleep(1000 * 60 * 5)
    process.exit()
  } else {
    console.log(e)
  }
}

async function getGame() {
  try {
    let body = await r.post('https://engine.freerice.com/games', {
      body: JSON.stringify({
        category,
        level,
        user: userID
      }),
      headers
    })

    let data = JSON.parse(body)
    gameID = data.data.id
  } catch (e) { await handleError(e) }
}

async function getQuestion() {
  for (let i = 0; i < 4; i++) {
    try {
      let body = await r.get(`https://engine.freerice.com/games/${gameID}`, {
        headers
      })

      let data = JSON.parse(body)
      if (!data.data.attributes) throw new Error('')
      return data
    } catch (e) {
      await handleError(e)
      await getGame()
    }
  }
}

async function answerQuestion(question, answer) {
  for (let i = 0; i < 4; i++) {
    try {
      let body = await r.patch(`https://engine.freerice.com/games/${gameID}/answer`, {
        body: JSON.stringify({
          answer,
          question,
          user: userID
        }),
        headers,
        simple: false
      })

      let data = JSON.parse(body)
      if (!data) console.log(body)
      if (!data.data.attributes) throw new Error('')
      return data
    } catch (e) { await handleError(e) }
  }
}

async function levelUp() {
  for (let i = 0; i < 4; i++) {
    try {
      let body = await r.patch(`https://engine.freerice.com/games/${gameID}/category`, {
        body: JSON.stringify({
          category, level
        }),
        headers,
        simple: false
      })

      let data = JSON.parse(body)
      if (!data.data.attributes) throw new Error('')
      return data
    } catch (e) { await handleError(e) }
  }
}

function solve(question) {
  let q = question.data.attributes.question

  let t = q.text
  let p = t.split(' x ')
  let answer = p[0] * p[1]
  console.log(t, answer)
  return answer
}

function sleep(time=sleepTime) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

async function main() {
  await getGame()
  let question = await levelUp()

  category = question.data.attributes.category
  level = question.data.attributes.level

  while (true) {
    let questionID = question.question_id
    let answer = solve(question)
    let answerID = 'a' + answer
    question = await answerQuestion(questionID, answerID)

    if (question.errors) {
      let title = question.errors[0].title
      if (title.startsWith('No Question is available for this game.')) {
        question = await levelUp()
        if (!question.data) {
          console.log('No question again?')
          question = await levelUp()
        }
        category = question.data.attributes.category
        level = question.data.attributes.level
        console.log('Level Up', level)
      } else if (title === 'No Question is set for this game') {
        question = await levelUp()

        category = question.data.attributes.category
        level = question.data.attributes.level

        console.log('Out of questions')
      }
    }
    await sleep()
  }
}

main()

async function loadAdvert() {
  let dom = await JSDOM.fromURL('https://freerice.com/assets/ads/rubicon-correct-mobile.html', {
    referrer: 'https://freerice.com/',
    includeNodeLocations: true,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    resources: 'usable'
  })
}

setInterval(loadAdvert, sleepTime * 0.75)
loadAdvert()
