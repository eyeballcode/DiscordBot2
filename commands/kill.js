let messages = [
  "%s will no longer be a problem",
  "*shoots %s*. **HEADSHOT!**",
  "Unfortunately, %s killed me instead",
  "%s has been disposed of.",
  "%s has been crushed by a piano",
  "A pack of wild wolves ate %s",
  "%s? They were trampled to death at a football match",
  "Why did you kill %s? Who is going to clean it up?",
  "Too little MLP watching killed %s",
  "Using Internet Explorer killed %s",
  "%s stepped on a landmine",
  "%s has been given a lethal injection.",
  "%s? Their computer blew up",
  "%s didn't watch their step and fell off a cliff",
  "%s traveled back in time and killed themselves",
  "*Sending poisoned dinner to %s...*",
  "%s spontaneously combusted.",
  "%s? They went into the forest and never came back",
  "%s fell in front of a train",
  "%s was pushed off a bridge",
  "%s was involved in an airplane accident",
  "Ninjas surrounded %s one day... That is all.",
  "Poor %s. They fell into an endless pit",
  "Mutants killed %s",
  "%s died from licking something they shouldn't have licked"
]

module.exports = {
  name: 'kill',
  description: 'Kills a user',
  exec: (msg, args, bot) => {
      let user = msg.mentions.users.first()
      if (!user) {
        return msg.reply('You\'ve got to say who to kill')
      }

      if (user.username === 'JMSS Bot') {
        return msg.reply('I\'m not killing myself, sorry')
      }

      let message = messages[Math.round(Math.random() * (messages.length - 1))]

      msg.reply(message.replace(/%s/g, user))
  }
}
