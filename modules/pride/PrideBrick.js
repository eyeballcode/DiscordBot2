const ptvAPI = require('./ptv-api')
const audioConfig = require('../../data/audio')
const stationCodes = require('../../data/station-codes')
const stopGTFSIDs = require('../../data/stations')
const TimedCache = require('../../TimedCache')
const generateAudioPattern = require('./GenerateAudioPattern')
const async = require('async')
const path = require('path')
const fs = require('fs')
const wav = require('node-wav')
const moment = require('moment')
require('moment-timezone')

let patternCache = new TimedCache(1000 * 60 * 3)


function transformDeparture(departure) {
  if (departure.route_id === 13) { // stony point
    if (departure.stop_id === 1073) { // frankston
      departure.platform_number = '3'
    } else {
      departure.platform_number = '1'
    }
  }

  if (departure.flags.includes('RRB-RUN')) {
    departure.platform_number = 'RRB'
  }

  departure.actual_departure_utc = departure.estimated_departure_utc || departure.scheduled_departure_utc

  return departure
}

function getServiceNameFiles(scheduledMoment, destination) {
  let scheduledHour = scheduledMoment.get('hour')
  let scheduledHour12 = scheduledHour % 12
  let scheduledMinute = scheduledMoment.get('minute')

  let departureTime = []

  let minuteFile = `time/minutes/min_${scheduledMinute < 10 ? '0' + scheduledMinute : scheduledMinute}`
  let hourFile = `time/the_hour/the_${scheduledHour12 < 10 ? '0' + scheduledHour12 : scheduledHour12}`
  if (scheduledHour12 === 0) hourFile = 'time/the_hour/the_12'

  if (scheduledMinute === 0) {
    if (scheduledHour === 0) {
      departureTime = ['item/item40', 'time/on_hour/midnight']
    } else if (scheduledHour < 12) {
      minuteFile = 'time/on_hour/am'
    } else if (scheduledHour === 12) {
      departureTime = ['item/item40', 'time/on_hour/noon']
    } else {
      minuteFile = 'time/on_hour/pm'
    }
  }

  if (departureTime.length === 0) {
    if (scheduledHour === 0) hourFile = 'time/the_hour/the_12'
    departureTime = [hourFile, minuteFile]
  }

  return [
    ...departureTime,
    `station/dst/${stationCodes[destination]}_dst`
  ]
}

function minutesDifference(time) {
  return (new Date(time) - new Date()) / 1000 / 60
}


function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function writeFile(file, data) {
  return new Promise(resolve => {
    fs.writeFile(file, data, err => {
      resolve()
    })
  })
}

async function writeAudio(pattern, outputFile) {
  let fileData = await async.map([...pattern, 'tone/pause3', 'tone/dtmf_s', 'tone/dtmf_s'], async name => {
    let filePath = path.join(audioConfig.audio_path, name + '.wav')
    let fileData = await readFile(filePath)
    let result = wav.decode(fileData)
    return result.channelData
  })

  let left = []
  let right = []
  fileData.forEach(fileData => {
    left = [...left, ...fileData[0]]
    right = [...right, ...fileData[1]]
  })

  let original = 44100
  let dropFactor = 2
  let final = Math.floor(original / dropFactor)

  left = left.filter((e, i) => i % dropFactor == 0)
  right = right.filter((e, i) => i % dropFactor == 0)

  let buffer = wav.encode([left, right], {sampleRate: final, bitDepth: 16})

  await writeFile(outputFile, buffer)
}


module.exports = async (station, platform, bot) => {
  let server = bot.guilds.cache.find(guild => guild.name === audioConfig.server_name)
  let voiceChannel = server.channels.cache.find(channel => channel.name === audioConfig.channel_name)

  let voiceConnection = await voiceChannel.join()

  try {
    let url = `/v3/departures/route_type/0/stop/${stopGTFSIDs[station]}?gtfs=true&max_results=2&expand=run&expand=route&platform_numbers=${platform}`
    let departurePayload = await ptvAPI(url)

    let departures = departurePayload.departures.map(transformDeparture)

    let runs = departurePayload.runs
    let routes = departurePayload.routes

    let nextDepartures = departures.filter(e => e.platform_number !== 'RRB').sort((a, b) => new Date(a.actual_departure_utc) - new Date(b.actual_departure_utc)).slice(0, 4)

    let departureAudioFiles = (await async.map(nextDepartures, async nextDeparture => {
      if (minutesDifference(nextDeparture.actual_departure_utc) > 59) return null

      let runID = nextDeparture.run_id
      let routeName = routes[nextDeparture.route_id].route_name

      let patternPayload
      let url = `/v3/pattern/run/${runID}/route_type/0?expand=stop&expand=route`
      if (!(patternPayload = patternCache.get(url))) {
        patternPayload = await ptvAPI(url)
        patternCache.set(url, patternPayload)
      }

      let { audioPattern, destination, viaCityLoop } = generateAudioPattern(patternPayload, station)
      let announcedDestination = (destination === 'Flinders Street' && viaCityLoop) ? 'City Loop' : destination

      let scheduledDepartureTime = moment.tz(nextDeparture.scheduled_departure_utc, 'Australia/Melbourne')

      let departingInAudio = ['item/item47', `platform/name/eos/plteos${platform < 10 ? '0' + platform : platform}`]

      if (nextDeparture.estimated_departure_utc) {
        let minutesToDeparture = minutesDifference(nextDeparture.estimated_departure_utc)

        if (minutesToDeparture < 1) {
          departingInAudio = ['item/item34']
        } else {
          let rounded = Math.round(minutesToDeparture)
          departingInAudio = [
            'item/item47',
            `time/dept_min/dep${rounded < 10 ? '0' + rounded : rounded}_m`
          ]
        }
      }

      let serviceName = getServiceNameFiles(scheduledDepartureTime, announcedDestination)

      let fullAudio = [...serviceName, ...audioPattern, 'tone/pause2', ...departingInAudio]

      return fullAudio
    })).filter(Boolean)

    let fullAudio

    if (departureAudioFiles.length === 0) {
      fullAudio = [
        'item/qitem20',
        `station/dst/${stationCodes[station]}_dst`,
        'tone/pause2',
        `platform/name/eos/plteos${platform < 10 ? '0' + platform : platform}`,
        'tone/pause2',
        'item/qitem30'
      ]
    } else {
      fullAudio = [
        'item/item49',
        `station/dst/${stationCodes[station]}_dst`,
        `platform/name/ctr/pltctr${platform < 10 ? '0' + platform : platform}`,
        'item/are',
        'tone/pause2',
        ...(departureAudioFiles).reduce((a, e) => [...a, ...e, 'tone/pause3'], []),
        'item/qitem14'
      ]
    }

    let outputFile = path.join(__dirname, 'audio-out', `output-${station}-brick.wav`)
    await writeAudio(fullAudio, outputFile)

    let dispatcher = voiceConnection.play(outputFile)

    dispatcher.on('finish', () => {
      fs.unlink(outputFile, e => {})
      voiceConnection.disconnect()
    })
  } catch (e) {
    let dispatcher = voiceConnection.play(path.join(audioConfig.audio_path, 'item', 'qitem32.wav'))

    dispatcher.on('finish', () => {
      voiceConnection.disconnect()
    })
  }
}
