const lines = require('./LineData')
const stationCodes = require('./station-codes')

let northernGroup = [
  'Craigieburn',
  'Sunbury',
  'Upfield',
  'Werribee',
  'Williamstown',
  'Showgrounds/Flemington'
]

let crossCityGroup = [
  'Werribee',
  'Williamstown',
  'Frankston'
]

let gippslandLines = [
  'Bairnsdale',
  'Traralgon'
]

let cityLoopStations = ['Southern Cross', 'Parliament', 'Flagstaff', 'Melbourne Central']

function getStoppingPattern(ptvPayload, isUp, station) {
  let departures = ptvPayload.departures
  let stops = ptvPayload.stops

  let stoppingPattern = departures.map(stop => stops[stop.stop_id].stop_name)

  if (stoppingPattern.includes('Jolimont-MCG')) {
    stoppingPattern[stoppingPattern.indexOf('Jolimont-MCG')] = 'Jolimont'
  }

  let fssIndex = stoppingPattern.indexOf('Flinders Street')
  if (fssIndex !== -1) {
    if (isUp) {
      stoppingPattern = stoppingPattern.slice(0, fssIndex + 1)
    } else {
      let stopIndex = stoppingPattern.indexOf(station)
      if (fssIndex < stopIndex) {
        stopIndex = fssIndex
      }
      stoppingPattern = stoppingPattern.slice(stopIndex)
    }
  }

  return stoppingPattern
}

function getRouteStops(lineName) {
  if (['Pakenham', 'Traralgon', 'Bairnsdale'].includes(lineName)) return lines.Gippsland
  if (lineName === 'Cranbourne') return lines.Cranbourne
  if (lineName === 'Belgrave') return lines.Belgrave
  if (lineName === 'Lilydale') return lines.Lilydale
  if (lineName === 'Alamein') return lines.Alamein
  if (['Craigieburn', 'Seymour', 'Shepparton'].includes(lineName)) return lines.Shepparton
  if (lineName === 'Albury') return lines.Albury
  if (lineName === 'Maryborough') return lines.Maryborough
  if (['Ballarat', 'Ararat'].includes(lineName)) return lines.Ararat
  if (['Geelong', 'Warrnambool'].includes(lineName)) return lines.Warrnambool
  if (lineName === 'Werribee') return lines.Werribee
  if (lineName === 'Williamstown') return lines.Williamstown
  if (lineName === 'Sandringham') return lines.Sandringham
  if (lineName === 'Upfield') return lines.Upfield
  if (['Frankston', 'Stony Point'].includes(lineName)) return lines['Stony Point']
  if (['Sunbury', 'Bendigo', 'Echuca'].includes(lineName)) return lines.Echuca
  if (lineName === 'Swan Hill') return lines['Swan Hill']
  if (lineName === 'Glen Waverley') return lines['Glen Waverley']
  if (lineName === 'Mernda') return lines.Mernda
  if (lineName === 'Hurstbridge') return lines.Hurstbridge
}

function getExpressParts(stoppingPattern, relevantStops) {
  let expressParts = []

  let lastMainMatch = 0
  let expressStops = 0

  for (let scheduledStop of stoppingPattern) {
    let matchIndex = -1

    for (let stop of relevantStops) {
      matchIndex++

      if (stop === scheduledStop) {

        if (matchIndex !== lastMainMatch) { // there has been a jump - exp section
          let expressPart = relevantStops.slice(lastMainMatch, matchIndex)
          expressParts.push(expressPart)
        }

        lastMainMatch = matchIndex + 1
        break
      }
    }
  }

  return expressParts
}

function getRelevantRouteStops(routeName, stoppingPattern, isUp, station) {
  let routeStops = getRouteStops(routeName).slice(0)

  if (isUp) routeStops.reverse()

  let viaCityLoop = stoppingPattern.includes('Parliament') || stoppingPattern.includes('Flagstaff')

  if (viaCityLoop) {
    let cityLoopStops = stoppingPattern.filter(e => cityLoopStations.includes(e))
    routeStops = routeStops.filter(e => !cityLoopStations.includes(e))

    if (isUp) {
      routeStops = routeStops.slice(0, -1).concat(cityLoopStops)
      routeStops.push('Flinders Street')
    } else {
      routeStops = ['Flinders Street', ...cityLoopStops, ...routeStops.slice(1)]
    }
  } else {
    routeStops = routeStops.filter(stop => !cityLoopStations.includes(stop))
    if (northernGroup.includes(routeName)) {
      if (isUp) {
        routeStops = [...routeStops.slice(0, -1), 'Southern Cross', 'Flinders Street']
      } else {
        routeStops = ['Flinders Street', 'Southern Cross', ...routeStops.slice(1)]
      }
    }
  }

  let startIndex = stoppingPattern.indexOf(station)
  stoppingPattern = stoppingPattern.slice(startIndex)

  let stillViaCityLoop = stoppingPattern.includes('Parliament') || stoppingPattern.includes('Flagstaff')

  let routeStartIndex = routeStops.indexOf(station)
  let routeEndIndex = routeStops.indexOf(stoppingPattern.slice(-1)[0])

  let relevantStops = routeStops.slice(routeStartIndex, routeEndIndex + 1)

  return { stoppingPattern, relevantStops, viaCityLoop: stillViaCityLoop }
}

function generateAudioPattern(expressParts, relevantStops, destination, viaCityLoop, station) {
  let pattern = []
  if (expressParts.length === 0) {
    pattern.push('item/item42')
    if (viaCityLoop) {
      pattern.push(`station/phr/${stationCodes[destination]}_phr`)
      pattern.push('item/item15')
    } else {
      pattern.push(`station/sen/${stationCodes[destination]}_sen`)
    }

    return pattern
  } else if (expressParts.length === 1 && expressParts[0].length === 1) {
    pattern.push('item/item42')
    if (viaCityLoop) {
      pattern.push(`station/phr/${stationCodes[destination]}_phr`)
      pattern.push(`station/exc/${stationCodes[expressParts[0][0]]}_exc`)
      pattern.push('item/item15')
    } else {
      pattern.push(`station/phr/${stationCodes[destination]}_phr`)
      pattern.push(`station/exc/${stationCodes[expressParts[0][0]]}_exc`)
    }

    return pattern
  }

  let lastStop

  expressParts.forEach((expressSector, i) => {
    let firstExpressStop = expressSector[0]
    let lastExpressStop = expressSector.slice(-1)[0]

    let previousStopIndex = relevantStops.indexOf(firstExpressStop) - 1
    let nextStopIndex = relevantStops.indexOf(lastExpressStop) + 1

    let previousStop = relevantStops[previousStopIndex]
    let nextStop = relevantStops[nextStopIndex]

    if (lastStop) {
      let lastStopIndex = relevantStops.indexOf(lastStop)

      if (i === expressParts.length - 1 && nextStop === destination) {
        pattern.push('item/item48')
        if (lastStopIndex !== previousStopIndex) {
          pattern.push('item/item10')
        }
        pattern.push(`station/flt/${stationCodes[previousStop]}_flt`)
        pattern.push(`station/phr/${stationCodes[nextStop]}_phr`)
      } else if (lastStop === previousStop) {
        pattern.push(`station/flt/${stationCodes[previousStop]}_flt`)
        pattern.push(`station/phr/${stationCodes[nextStop]}_phr`)
      } else if (lastStopIndex + 1 == previousStopIndex) {
        pattern.push('item/item10')
        pattern.push(`station/flt/${stationCodes[previousStop]}_flt`)
        pattern.push(`station/phr/${stationCodes[nextStop]}_phr`)
      } else {
        pattern.push('item/item42')
        pattern.push(`station/phr/${stationCodes[previousStop]}_phr`)
        pattern.push('item/item10')
        pattern.push(`station/flt/${stationCodes[previousStop]}_flt`)
        pattern.push(`station/phr/${stationCodes[nextStop]}_phr`)
      }
    } else {
      if (station === previousStop) {
        pattern.push('item/item10')
        pattern.push(`station/flt/${stationCodes[previousStop]}_flt`)
        pattern.push(`station/phr/${stationCodes[nextStop]}_phr`)
      } else {
        pattern.push('item/item42')
        pattern.push(`station/phr/${stationCodes[previousStop]}_phr`)
        pattern.push('item/item10')
        pattern.push(`station/flt/${stationCodes[previousStop]}_flt`)
        pattern.push(`station/phr/${stationCodes[nextStop]}_phr`)
      }
    }

    lastStop = nextStop
  })

  if (relevantStops[relevantStops.indexOf(lastStop)] !== destination) {
    pattern.push('item/item48')
    pattern.push('item/item42')
    if (viaCityLoop) {
      pattern.push(`station/phr/${stationCodes[destination]}_phr`)
      pattern.push('item/item15')
    } else {
      pattern.push(`station/sen/${stationCodes[destination]}_sen`)
    }
  }

  return pattern
}

module.exports = (ptvPayload, station) => {
  let nextDeparture = ptvPayload.departures[0]
  let routeName = ptvPayload.routes[nextDeparture.route_id].route_name

  let directionID = nextDeparture.direction_id
  let routeID = nextDeparture.route_id

  let isUp = directionID === 1
  if (routeID === '13') { // Stony point
    isUp = directionID === 5
  }

  let rawStoppingPattern = getStoppingPattern(ptvPayload, isUp, station)
  let { stoppingPattern, relevantStops, viaCityLoop } = getRelevantRouteStops(routeName, rawStoppingPattern, isUp, station)
  let expressParts = getExpressParts(stoppingPattern, relevantStops)

  let destination = stoppingPattern.slice(-1)[0]

  let audioPattern = generateAudioPattern(expressParts, relevantStops, destination, viaCityLoop, station)

  return { audioPattern, destination, viaCityLoop }
}
