let ptvAPI = require('./modules/pride/ptv-api')
let stationCodes = require('./data/stations')
let async = require('async')

let stations = `Aircraft
Alamein
Albion
Alphington
Altona
Anstey
Armadale
Ascot Vale
Ashburton
Aspendale
Auburn
Balaclava
Batman
Baxter
Bayswater
Beaconsfield
Belgrave
Bell
Bentleigh
Berwick
Bittern
Blackburn
Bonbeach
Boronia
Box Hill
Brighton Beach
Broadmeadows
Brunswick
Burnley
Burwood
Camberwell
Canterbury
Cardinia Road
Carnegie
Carrum
Caulfield
Chatham
Chelsea
Cheltenham
Clayton
Clifton Hill
Coburg
Collingwood
Coolaroo
Craigieburn
Cranbourne
Crib Point
Croxton
Croydon
Dandenong
Darebin
Darling
Dennis
Diamond Creek
Diggers Rest
Eaglemont
East Camberwell
East Malvern
East Richmond
Edithvale
Elsternwick
Eltham
Epping
Essendon
Fairfield
Fawkner
Ferntree Gully
Flagstaff
Flemington Bridge
Flemington Racecourse
Flinders Street
Footscray
Frankston
Gardenvale
Gardiner
Ginifer
Glen Iris
Glen Waverley
Glenbervie
Glenferrie
Glenhuntly
Glenroy
Gowrie
Greensborough
Hallam
Hampton
Hartwell
Hastings
Hawksburn
Hawkstowe
Hawthorn
Heatherdale
Heathmont
Heidelberg
Heyington
Highett
Holmesglen
Hoppers Crossing
Hughesdale
Huntingdale
Hurstbridge
Ivanhoe
Jacana
Jewell
Jolimont
Jordanville
Kananook
Keilor Plains
Kensington
Keon Park
Kooyong
Laburnum
Lalor
Laverton
Leawarra
Lilydale
Lynbrook
Macaulay
Macleod
Malvern
McKinnon
Melbourne Central
Mentone
Merinda Park
Merlynston
Mernda
Merri
Middle Brighton
Middle Footscray
Middle Gorge
Mitcham
Mont Albert
Montmorency
Moonee Ponds
Moorabbin
Mooroolbark
Mordialloc
Moreland
Morradoo
Mount Waverley
Murrumbeena
Narre Warren
Newmarket
Newport
Noble Park
North Brighton
North Melbourne
North Richmond
North Williamstown
Northcote
Nunawading
Oak Park
Oakleigh
Officer
Ormond
Pakenham
Parkdale
Parliament
Pascoe Vale
Patterson
Prahran
Preston
Regent
Reservoir
Richmond
Ringwood
Ringwood East
Ripponlea
Riversdale
Rosanna
Roxburgh Park
Royal Park
Rushall
Ruthven
Sandown Park
Sandringham
Seaford
Seaholme
Seddon
Showgrounds
Somerville
South Kensington
South Morang
South Yarra
Southern Cross
Southland
Spotswood
Springvale
St Albans
Stony Point
Strathmore
Sunbury
Sunshine
Surrey Hills
Syndal
Tecoma
Thomastown
Thornbury
Toorak
Tooronga
Tottenham
Tyabb
Upfield
Upper Ferntree Gully
Upwey
Victoria Park
Watergardens
Watsonia
Wattle Glen
Werribee
West Footscray
West Richmond
Westall
Westgarth
Westona
Williams Landing
Williamstown
Williamstown Beach
Willison
Windsor
Yarraman
Yarraville`.split('\n')

let stationData = {}

async function sleep() {
  return await new Promise(r => {
    setTimeout(r, 300)
  })
}

async function x() {
  await async.forEachSeries(stations, async stationName => {
    let stationCode = stationCodes[stationName]
    let data = await ptvAPI(`/v3/stops/${stationCode}/route_type/0?stop_amenities=true&stop_accessibility=true&stop_contact=true&stop_ticket=true&gtfs=true&stop_staffing=true`)
    if (!data.stop) return
    let stop = data.stop

    let staffedHours = stop.operating_hours
    if (staffedHours === 'N') staffedHours = 'Unstaffed'

    stationData[stationName] = {
      staffedHours,
      contact: {
        lostProperty: stop.stop_contact.lost_property,
        phone: stop.stop_contact.phone
      },
      stationType: stop.station_type,
      shelteredWaitingArea: stop.stop_amenities.sheltered_waiting_area || stop.stop_amenities.indoor_waiting_area,
      bicycleStorage: stop.stop_amenities.bicycle_rack + stop.stop_amenities.bicycle_locker,
      payphone: stop.stop_amenities.pay_phone,
      toilets: stop.stop_amenities.toilet,
      parkingLots: stop.stop_amenities.car_parking,
      taxis: stop.stop_amenities.taxi_rank,
      hearingLoop: stop.stop_accessibility.hearing_loop,
      escalators: stop.stop_accessibility.escalator,
      hearingLoop: stop.stop_accessibility.hearing_loop,
    }

    await sleep()
  })

  console.log(JSON.stringify(stationData))
}

x()
