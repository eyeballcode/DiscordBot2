const turf = require('@turf/turf')

let signalDesignation = {
  'D': 'PKM',
  'X': 'CBE',
  'F': 'FKN',
  'B': 'SHM',
  'C': 'UFD',
  'DG': 'GWY',
  'E': 'CGB',
  'H': 'LIL',
  'L': 'BEG',
  'LA': 'ALM',
  'M': 'SUY',
  'S': 'HBE',
  'T': 'MDD',
  'W': 'WIL',
  'G': 'WER'
}

let lineOffsets = {
  'L': -0.042,
  'H': -0.02,
  'DG': -0.105,
  'T': -0.31,
  'S': -0.34,
  'E': 0.062,
  'M': 0.1,
  'W': 0.08
}

let datum = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Point',
    coordinates: [ 144.96836481772024, -37.81793656954258 ]
  }
}

module.exports = point => {
  let [_, lineCode, number] = point.match(/([A-Z]+)([\d.]+)/)
  if (lineCode === 'GG') lineCode = 'G' //Simplify this
  let destinationCode = signalDesignation[lineCode]

  let line = require('./lines/' + destinationCode.toLowerCase() + '.json')
  let coords = line.coordinates

  let lineEnd = turf.point(coords.slice(-1)[0])
  let slicedLine = turf.lineSlice(datum, lineEnd, line)

  let km

  if (lineCode === 'M' && number > 900) { // Cant diff signals at WFY and DRT
    km = number * 100 / 1000
  } else {
    let feet = number * 100
    let metres = feet * 0.3048
    km = metres / 1000
  }

  km += lineOffsets[lineCode] || 0

  let calculatedCoords = turf.along(slicedLine, km, { units: 'kilometers' })
  return calculatedCoords.geometry.coordinates.reverse().join(', ')
}
