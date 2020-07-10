const ptvAPI = require('./ptv-api')
const audioConfig = require('../../data/audio')
const stationCodes = require('./station-codes')
const stopGTFSIDs = require('./stations')
const TimedCache = require('../../TimedCache')
const async = require('async')
const fs = require('fs')
const moment = require('moment')
const path = require('path')
const wav = require('node-wav')
const generateAudioPattern = require('./GenerateAudioPattern')
require('moment-timezone')

let patternCache = new TimedCache(1000 * 60 * 3)

module.exports = class StationMonitor {
  constructor(station, platform, audioQueue) {
    this.station = station
    this.platform = platform
    this.monitorTimeouts = {}
    this.audioSchedulerTimeout = -1
    this.nextDepartures = []
    this.audioQueue = audioQueue

    this.runIDsSeen = []

    this.currentlyReading = []

    let audioPath = path.join(__dirname, 'audio-out')
    let files = fs.readdirSync(audioPath).filter(e => e.endsWith('.wav'))
    files.forEach(file => {
      let filePath = path.join(audioPath, file)
      fs.unlinkSync(filePath)
    })
  }

  async audioScheduler() {
    let nextDepartures = await this.getFullNextDepartures()
    if (!nextDepartures.length) return setTimeout(this.audioScheduler.bind(this), 1000 * 60 * 12)
    this.nextDepartures = nextDepartures

    this.nextDepartures.forEach(nextDeparture => {
      clearTimeout(this.monitorTimeouts[nextDeparture.runID])
      let deviance = 0
      if (nextDeparture.estimatedDepartureTime)
        deviance = nextDeparture.estimatedDepartureTime - nextDeparture.scheduledDepartureTime

      let msToSchDeparture = nextDeparture.scheduledDepartureTime - this.moment()
      let twoMinToSchDeparture = msToSchDeparture - 1000 * 60 * 2

      let timeout

      if (deviance > 1000 * 60 * 5) { // more than 5min late
        let timeToDeparture = nextDeparture.estimatedDepartureTime - this.moment()

        if (timeToDeparture < 1000 * 60) { // delayed train arriving now, play regular announcement now
          console.log(`Scheduling arrival announcement for late ${nextDeparture.scheduledDepartureTime.format('HH:mm')} ${nextDeparture.destination} which is delayed by ${deviance / 1000 / 60} minutes now`)
          timeout = setTimeout(this.playServiceAudio.bind(this, false, null, nextDeparture), 0)
        } else { // delayed train, play delay announcement at scheduled
          if (twoMinToSchDeparture > 1000 * -60) {
            console.log(`Scheduling delay announcement for ${nextDeparture.scheduledDepartureTime.format('HH:mm')} ${nextDeparture.destination} which is delayed by ${deviance / 1000 / 60} minutes in ${twoMinToSchDeparture / 1000} seconds`)
            timeout = setTimeout(this.playServiceAudio.bind(this, true, timeToDeparture, nextDeparture), twoMinToSchDeparture)
          }
        }
      } else { // on time train arriving, play regular announcement at scheduled
        twoMinToSchDeparture += Math.floor(deviance / 1000 / 30) * 1000 * 30 // round to nearest half minute since
        console.log(`Scheduling arrival announcement for ${nextDeparture.scheduledDepartureTime.format('HH:mm')} ${nextDeparture.destination} in ${(twoMinToSchDeparture) / 1000} seconds`)
        timeout = setTimeout(this.playServiceAudio.bind(this, false, null, nextDeparture), twoMinToSchDeparture)
      }

      this.monitorTimeouts[nextDeparture.runID] = timeout
    })

    this.audioSchedulerTimeout = setTimeout(this.audioScheduler.bind(this), 1000 * 60)
  }

  async playServiceAudio(playDelayed, msToDeparture, nextDeparture) {
    let index = this.currentlyReading.length
    this.currentlyReading.push(nextDeparture.outputFile)

    if (playDelayed) {
      let minutesToDeparture = Math.round(msToDeparture / 1000 / 60)
      let serviceName = this.getServiceNameFiles(nextDeparture.scheduledDepartureTime, nextDeparture.destination)

      let messageData = [
        ...serviceName, 'item/qitem06',
        `time/dept_min/dep${minutesToDeparture < 10 ? '0' + minutesToDeparture : minutesToDeparture}_m`
      ]

      let data = [
        'tone/chime', `platform/attn/pltatn${nextDeparture.platform < 10 ? '0' + nextDeparture.platform : nextDeparture.platform}`,
        ...messageData, 'tone/pause3', ...messageData
      ]


      let audioPath = path.join(__dirname, 'audio-out')
      let outputFile = path.join(audioPath, `output-${nextDeparture.scheduledDepartureTime.format('HHmm')}-delay.wav`)

      await this.writeAudio(data, outputFile)
      this.audioQueue.schedulePlay(outputFile)
    } else {
      if (this.runIDsSeen.includes(nextDeparture.runID)) return fs.unlink(nextDeparture.outputFile, () => {})
      this.runIDsSeen.push(nextDeparture.runID)
      this.audioQueue.schedulePlay(nextDeparture.outputFile)
    }

    this.runIDsSeen = this.runIDsSeen.slice(-15)
    this.currentlyReading.splice(index, 1)
  }

  transformDeparture(departure) {
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

  minutesDifference(time) {
    return (new Date(time) - new Date()) / 1000 / 60
  }

  getMinutesPastMidnight(time) {
    return time.get('hours') * 60 + time.get('minutes')
  }

  moment(utc) {
    if (utc)
      return moment.tz(utc, 'Australia/Melbourne')
    else
      return moment.tz('Australia/Melbourne')
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }

  writeFile(file, data) {
    return new Promise(resolve => {
      fs.writeFile(file, data, err => {
        resolve()
      })
    })
  }

  getServiceNameFiles(scheduledMoment, destination) {
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

  async writeAudio(pattern, outputFile) {
    let fileData = await async.map(pattern.concat(['tone/pause3', 'tone/dtmf_s', 'tone/dtmf_s']), async name => {
      let filePath = path.join(audioConfig.audio_path, name + '.wav')
      let fileData = await this.readFile(filePath)
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

    await this.writeFile(outputFile, buffer)
  }

  async generateAudio(platform, audioPattern, scheduledDepartureTime, destination, station) {
    let greeting
    let now = this.moment()
    let hourNow = now.get('hour')

    if (hourNow < 12)
      greeting = 'item/item01'
    else if (hourNow < 17)
      greeting = 'item/item02'
    else
      greeting = 'item/item03'

    let serviceName = this.getServiceNameFiles(scheduledDepartureTime, destination)

    let serviceData = [
      `platform/next/pn_${platform < 10 ? '0' + platform : platform}`,
      'tone/pause2',
      ...serviceName,
      ...audioPattern
    ]

    let intro = [
      'tone/chime', greeting, 'tone/pause3'
    ]

    let fullPattern = [
      ...intro, ...serviceData, 'tone/pause3',
      ...serviceData, 'tone/pause3', 'item/qitem14'
    ]

    let audioPath = path.join(__dirname, 'audio-out')
    let outputFile = path.join(audioPath, `output-${station}-${scheduledDepartureTime.format('HHmm')}-${destination}.wav`)

    if (!this.currentlyReading.includes(outputFile))
      await this.writeAudio(fullPattern, outputFile)

    return outputFile
  }

  async getFullNextDepartures() {
    let url = `/v3/departures/route_type/0/stop/${stopGTFSIDs[this.station]}?gtfs=true&max_results=2&expand=run&expand=route`
    if (this.platform) url += `&platform_numbers=${this.platform}`
    let departurePayload = await ptvAPI(url)

    let departures = departurePayload.departures.map(this.transformDeparture)
      .filter(departure => !this.runIDsSeen.includes(departure.run_id))
    let runs = departurePayload.runs
    let routes = departurePayload.routes

    let nextDepartures = departures.filter(e => e.platform_number !== 'RRB').sort((a, b) => new Date(a.actual_departure_utc) - new Date(b.actual_departure_utc)).slice(0, 4)
    return (await async.map(nextDepartures, async nextDeparture => {
      if (this.minutesDifference(nextDeparture.actual_departure_utc) > 20) return null

      let runID = nextDeparture.run_id
      let routeName = routes[nextDeparture.route_id].route_name

      let patternPayload
      let url = `/v3/pattern/run/${runID}/route_type/0?expand=stop&expand=route`
      if (!(patternPayload = patternCache.get(url))) {
        patternPayload = await ptvAPI(url)
        patternCache.set(url, patternPayload)
      }

      let { audioPattern, destination, viaCityLoop } = generateAudioPattern(patternPayload, this.station)

      let announcedDestination = (destination === 'Flinders Street' && viaCityLoop) ? 'City Loop' : destination

      let outputFile = await this.generateAudio(nextDeparture.platform_number, audioPattern, this.moment(nextDeparture.scheduled_departure_utc), announcedDestination, this.station)

      return {
        scheduledDepartureTime: this.moment(nextDeparture.scheduled_departure_utc),
        estimatedDepartureTime: nextDeparture.estimated_departure_utc ? this.moment(nextDeparture.estimated_departure_utc) : null,
        destination: announcedDestination,
        outputFile,
        runID: nextDeparture.run_id,
        platform: nextDeparture.platform_number
      }
    })).filter(Boolean)
  }

  async stop() {
    await this.audioQueue.stop()
    clearTimeout(this.audioSchedulerTimeout)
    Object.keys(this.monitorTimeouts).forEach(runID => {
      clearTimeout(this.monitorTimeouts[runID])
    })
  }
}
