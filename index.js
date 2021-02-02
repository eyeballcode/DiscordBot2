const Discord = require('discord.js')
const bot = new Discord.Client()

const commands = require('./command-handler')
const moduleLoader = require('./module-loader')

const config = require('./config.json')
const TOKEN = config.TOKEN

bot.login(TOKEN)

bot.on('ready', async () => {
  console.info(`Logged in as ${bot.user.tag}!`)
  moduleLoader(bot)
})

bot.on('message', msg => {
  let {content} = msg
  let parts
  if (parts = content.match(/^!([^ ]*)( .+)?$/)) {
    let command = parts[1].toLowerCase()
    let args = (parts[2] || '').trim().split(/ +/)

    let valid = ['wtt', 'pid', 'field']
    if (msg.guild.id === 636354429049896991 && !valid.includes((command)) return
    if (commands[command]) {
      msg.react('🏳️‍🌈')
      commands[command].exec(msg, args, bot)
    } else {
      msg.reply(`Could not find command ${command}`)
    }
  }
})
