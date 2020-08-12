let tracks = require('./tracks.json')
let fs = require('fs')
let turf = require('@turf/turf')

function coords(g) {
  let geo = g.geometry
  let joined
  if (geo.type === 'MultiLineString')
    joined = geo.coordinates.reduce((a, e) => a.concat(e.slice(0, -1)), [])
  else
    joined = geo.coordinates
  return joined
}

let track = tracks.features.filter(t => t.properties.FAC_NAME === process.argv[2])
  .map(x => coords(x))
  .sort((a, b) => b.length - a.length)[0]

let line = turf.lineString(track)
let endpoint
if (process.argv[3])
  endpoint = turf.point(process.argv[3].split(',').reverse())
else
  endpoint = turf.point(track.slice(-1)[0])

let sliced = turf.lineSlice(track[0], endpoint, line)

if (process.argv[4]) sliced.geometry.coordinates.reverse()

let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${process.argv[2]}</name>
    <description/>
    <Style id="line-000000-1200-nodesc-normal">
      <LineStyle>
        <color>ff000000</color>
        <width>1.2</width>
      </LineStyle>
      <BalloonStyle>
        <text><![CDATA[<h3>$[name]</h3>]]></text>
      </BalloonStyle>
    </Style>
    <Style id="line-000000-1200-nodesc-highlight">
      <LineStyle>
        <color>ff000000</color>
        <width>1.8</width>
      </LineStyle>
      <BalloonStyle>
        <text><![CDATA[<h3>$[name]</h3>]]></text>
      </BalloonStyle>
    </Style>
    <StyleMap id="line-000000-1200-nodesc">
      <Pair>
        <key>normal</key>
        <styleUrl>#line-000000-1200-nodesc-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#line-000000-1200-nodesc-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Folder>
      <name>${process.argv[2]}</name>
    </Folder>
    <Folder>
      <name>${process.argv[2]}</name>
      <Placemark>
        <name>Line 1</name>
        <styleUrl>#line-000000-1200-nodesc</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>
          ${sliced.geometry.coordinates.map(coord => coord.join(',') + ', 0').join('\n')}
          </coordinates>
        </LineString>
      </Placemark>
    </Folder>
  </Document>
</kml>
`

fs.writeFileSync('./out.kml', kml)
