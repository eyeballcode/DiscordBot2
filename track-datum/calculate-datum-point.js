let pkm = require('./lines/pkm.json')
let turf = require('@turf/turf')

let joined = pkm.geometry.coordinates.reduce((a, e) => a.concat(e.slice(0, -1)), [])

let pkmLine = turf.lineString(joined)

function find(point, coords) {
  let hundredFeet = parseFloat(point.slice(1))
  let feet = hundredFeet * 100
  let metres = feet * 0.3048
  let km = metres / 1000

  let geoCoords = turf.point([ coords[1], coords[0] ])

  let lineStart = turf.point(joined[0])

  let cityToPoint = turf.lineSlice(lineStart, geoCoords, pkmLine)
  let length = turf.length(cityToPoint, { units: 'kilometers' })
  let extra = length - km

  let datumPoint = turf.along(cityToPoint, extra, { units: 'kilometers' })
  return datumPoint.geometry.coordinates
}

let calculated = []

calculated.push(find('D544.00', [-37.909834, 145.100980]))
calculated.push(find('D542.55', [-37.909572, 145.100605]))
calculated.push(find('D540.51', [-37.909173, 145.100051]))
calculated.push(find('D505.60', [-37.902567, 145.091329]))
calculated.push(find('D504.25', [-37.902317, 145.091015]))
calculated.push(find('D499.87', [-37.901462, 145.089935]))

let allPoints = turf.multiPoint(calculated)
let centrePoint = turf.center(allPoints)

console.log(centrePoint)

let lineEnd = turf.point(joined.slice(-1)[0])

let slicedLine = turf.lineSlice(centrePoint, lineEnd, pkmLine)

function fromPoint(point) {
  let hundredFeet = parseFloat(point.slice(1))
  let feet = hundredFeet * 100
  let metres = feet * 0.3048
  let km = metres / 1000

  let coords = turf.along(slicedLine, km, { units: 'kilometers' })
  return coords
}

console.log(fromPoint('D825').geometry.coordinates.reverse().join(', '))
