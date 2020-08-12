let data = require('./lines/' + process.argv[2] + '.json')
let fs = require('fs')

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
          ${data.coordinates.map(coord => coord.join(',') + ', 0').join('\n')}
          </coordinates>
        </LineString>
      </Placemark>
    </Folder>
  </Document>
</kml>
`

fs.writeFileSync('./' + process.argv[2] + '.kml', kml)
