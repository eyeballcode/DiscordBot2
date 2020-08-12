let tracks = require('./tracks.json')
let fs = require('fs')

let track = tracks.features.find(t => t.properties.FAC_NAME === process.argv[2])
let geo = track.geometry
let joined
if (geo.type === 'MultiLineString')
  joined = geo.coordinates.reduce((a, e) => a.concat(e.slice(0, -1)), [])
else
  joined = geo.coordinates

if (process.argv[3]) joined.reverse()

fs.writeFileSync('./out.json', JSON.stringify({type: 'LineString', coordinates: joined}))
