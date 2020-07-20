const { MessageEmbed } = require('discord.js')
const request = require('request-promise')
let mykiCards = require('../data/myki.json')
const TimedCache = require('../TimedCache')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
require('moment-timezone')

let mykiPath = path.join(__dirname, '../data/myki.json')
let dataCache = new TimedCache(1000 * 60 * 10)

let cardTypes = {
  "0": "Default",
  "1": "Full Fare",
  "2": "General Concession",
  "3": "General Student Concession",
  "4": "Child 5 - 18 years inclusive",
  "5": "Primary Student Concession",
  "6": "Primary or Secondary Student Concession",
  "7": "Tertiary Student Concession",
  "8": "War Veterans / War Widows",
  "9": "Victorian Seniors Concession",
  "10": "Australian Pension and Victorian Senior Card",
  "11": "PCC - Pensioner Age Pension",
  "12": "HCC - Carer Allowance (Child)",
  "13": "PCC - Carer Payment",
  "14": "PCC - Disability support pension",
  "15": "PCC - Mature Age Allowance",
  "16": "PCC - Vic HCC - Parenting Payment Partnered",
  "17": "PCC - Parenting Payment Partnered",
  "18": "PCC - Parenting Payment Single",
  "19": "PCC - Widow B Pension",
  "20": "PCC - Wife Pension",
  "21": "PCC - Wife Pension",
  "22": "PCC - Wife Pension",
  "23": "Vic HCC - Family Tax Benefit A",
  "24": "Vic HCC - Low Income",
  "25": "PCC - Vic HCC - Newstart allowance",
  "26": "PCC - Newstart allowance",
  "27": "Vic HCC - Partner allowance",
  "28": "PCC - Partner allowance",
  "29": "Vic HCC - Sickness allowance",
  "30": "PCC - Sickness allowance",
  "31": "Vic HCC - Special benefit",
  "32": "PCC - Special benefit",
  "33": "Vic HCC - Widow allowance",
  "34": "PCC - Widow allowance",
  "35": "PCC - Vic HCC - Youth allowance",
  "36": "DVA Pensioner",
  "37": "Vision Impaired",
  "38": "Travel trainer Pass",
  "39": "War Veteran's Travel Pass",
  "40": "TPI War Veteran's Travel Pass",
  "41": "Widow of World War 1 Veteran",
  "42": "Redeployee Travel Pass",
  "44": "Retired Employee Travel Pass",
  "45": "Retired Employee Dependent Travel Pass",
  "46": "Federal Police Travel Pass",
  "47": "Victoria Police Travel Authority",
  "48": "Transit Police Travel Pass",
  "49": "Victorian Black Book Travel Pass",
  "50": "Federal Parliamentarian Travel Pass",
  "51": "State Parliamentarian Travel Pass",
  "52": "Governor's Travel Pass",
  "53": "Gold Elite Travel Pass",
  "54": "Gold Pass Travel Pass",
  "55": "Red Book Travel Pass",
  "56": "STT Replacement",
  "57": "Access Travel Pass",
  "58": "Charitable Organisation",
  "59": "Australian (Interstate) Seniors Card Holder",
  "60": "Bus drivers (Regional and Metropolitan)",
  "61": "Health Care Card holder",
  "62": "Pensioner Concession Card holder",
  "63": "Tertiary Half Yearly Student concession",
  "64": "Employee Travel Pass",
  "65": "Commuter Club",
  "66": "Scooter and Wheelchair Travel Pass",
  "67": "Asylum Seekers",
  "68": "Full-fare DHS Carer Free Weekend",
  "69": "Concession DHS Carer Free Weekend",
  "70": "International Student",
  "71": "Technician Validation Card"
}

module.exports = {
  name: 'myki',
  description: 'Checks your myki card',
  exec: async (msg, args, bot) => {
    let target = msg.author
    let user = `${target.username}#${target.discriminator}`

    if (args[0] === 'register' && args[1]) {
      if (parseInt(args[1]) && args[1].length === 15) {
        mykiCards[user] = args[1]
        fs.writeFile(mykiPath, JSON.stringify(mykiCards, null, 2), () => {
          msg.reply('Saved your myki card!')
        })
      } else {
        msg.reply('Sorry, that doesn\'t look like a valid myki card')
      }
    } else if (!args[0]) {
      let userMyki = mykiCards[user]
      if (userMyki) {
        let data
        if (!(data = dataCache.get(userMyki))) {
          data = JSON.parse(await request(`https://mykiapi.ptv.vic.gov.au/myki/card/${userMyki}`))
          dataCache.set(userMyki, data)
        }

        let balance = parseFloat(data.mykiBalance)
        let expiry = data.mykiCardExpiryDate
        let topupPending = data.mykiBalanceIncludingPending - balance
        let cardType = cardTypes[data.passengerCode]

        let embed = new MessageEmbed()
          .setTitle(`${target.username}'s Myki Details`)
          .addFields(
            { name: 'Balance', value: `${balance < 0 ? '-$' : '$'}${Math.abs(balance.toFixed(2))}`, inline: true },
            { name: 'Expiry', value: expiry, inline: true },
            { name: 'Card Type', value: cardType, inline: true },
            { name: 'Topup Pending', value: '$' + topupPending.toFixed(2) }
        )

        if (data.Product.length) {
          let pass = data.Product[0]
          let expiry = moment.tz(pass.lastUtilizationDate, 'Australia/Melbourne')
          let now = moment.tz('Australia/Melbourne')

          let difference = moment.duration(expiry.diff(now))

          let years = Math.abs(difference.years())
          let months = Math.abs(difference.months())
          let days = Math.abs(difference.days())

          let hours = Math.abs(difference.hours())
          let minutes = Math.abs(difference.minutes())

          let joining = []
          if (years) joining.push(years + ' years')
          if (months) joining.push(months + ' months')
          if (days) joining.push(days + ' days')

          if (!joining.length) {
            joining.push(hours + 'hours')
            joining.push(minutes + 'minutes')
          }

          embed.addFields(
            { name: 'Myki Pass Zones', value: `${pass.zoneMin} - ${pass.zoneMax}`, inline: true },
            { name: 'Myki Pass Expiry', value: joining.join(', '), inline: true }
          )
        }

        msg.reply(embed)
      } else {
        msg.reply('Sorry, I don\'t know your myki')
      }
    }
  }
}
