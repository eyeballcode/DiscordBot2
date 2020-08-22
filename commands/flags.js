const { MessageAttachment } = require('discord.js')
const config = require('../data/rice')
const r = require('request-promise')

let category = 'fac6955a-ffca-5a78-bd84-d3d494c6d60c'
let userID = config.userID
let currentGame = null
let level = 1
let userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15'
let headers = { 'Content-Type': 'application/json', 'User-Agent': userAgent }

let currentFlag = null
let currentAnswers = []
let currentQuestion = null
let currentQuestionID = null
let currentRice = 0

async function startGame() {
  let body = await r.post('https://engine.freerice.com/games', {
    body: JSON.stringify({
      category,
      level,
      user: userID
    }),
    headers
  })

  let data = JSON.parse(body)
  currentGame = data.data.id
}

async function levelUp() {
  let body = await r.get(`https://engine.freerice.com/games/${currentGame}`, {
    headers
  })

  let data = JSON.parse(body)
  currentQuestionID = data.data.attributes.question_id

  return data.data.attributes.question
}

async function answerQuestion(question, answer) {
  let body = await r.patch(`https://engine.freerice.com/games/${currentGame}/answer`, {
    body: JSON.stringify({
      answer,
      question,
      user: userID
    }),
    headers,
    simple: false
  })

  let data = JSON.parse(body)
  currentQuestionID = data.data.attributes.question_id
  let correctAnswer = data.data.attributes.answer
  currentRice = data.data.attributes.rice

  return {
    question: data.data.attributes.question,
    answer: {
      correct: correctAnswer.correct,
      answer: correctAnswer.options[0]
    }
  }
}

async function sendQuestion(question, msg) {
  currentFlag = question.resources[0].url
  currentAnswers = question.options

  let attachment = new MessageAttachment(currentFlag)
  await msg.channel.send(`${msg.author}, This flag is from: `, attachment)
  await msg.channel.send(`${msg.author}, Choices: \n${currentAnswers.map(a => a.text).join('\n')}`)
}

module.exports = {
  name: 'flag',
  description: 'Guess the flag',
  exec: async (msg, args, bot) => {
    if (currentGame) {
      let answer = args.join(' ')
      if (answer) {
        if (answer === 'stop') {
          currentGame = null
          return await msg.reply(`Stopped game. Rice donated: ${currentRice}`)
        }
        let foundAnswer = currentAnswers.find(a => a.text === answer)
        if (foundAnswer) {
          let reply = await answerQuestion(currentQuestionID, foundAnswer.id)
          if (reply.answer.correct) {
            await msg.reply('Correct! Here\'s a new question!')
          } else {
            let correctAnswer = currentAnswers.find(a => a.id === reply.answer.answer) || reply.answer.answer
            await msg.reply(`Sorry, the answer was ${correctAnswer.text}. Here's a new question!`)
          }

          currentQuestion = reply.question
          await sendQuestion(reply.question, msg)
        } else {
          await msg.reply('Sorry, please try again')
        }
      } else {
        await sendQuestion(currentQuestion, msg)
      }
    } else {
      await msg.reply('Starting game...')
      await startGame()
      currentQuestion = await levelUp()
      currentRice = 0
      await sendQuestion(currentQuestion, msg)
    }
  }
}
