const http = require('http')
const https = require('https')
const tls = require('tls')
const fs = require('fs')
const path = require('path')

let classes = []
let classPath = path.join(__dirname, 'classes.json')
let activityPath = path.join(__dirname, 'activities.json')
let subjectsPath = path.join(__dirname, 'code-to-names.json')

function createSecureContext() {
  let certPath = path.join(__dirname, 'https')
  const sslCertPath = path.join(certPath, 'fullchain.pem')
  const sslKeyPath = path.join(certPath, 'privkey.pem')
  const caPath = path.join(certPath, 'chain.pem')

  return tls.createSecureContext({
    cert: fs.readFileSync(sslCertPath),
    key: fs.readFileSync(sslKeyPath),
    ca: fs.readFileSync(caPath),
    minVersion: 'TLSv1.2'
  })
}

let context = createSecureContext()

let server = https.createServer({
  SNICallback: (s, c) => c(null, context)
}, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  res.setHeader('Access-Control-Allow-Credentials', true)

  if (req.method === 'POST') {
    let body = []
    req.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      let data = JSON.parse(body)

      if (req.url === '/activities') {
        fs.writeFileSync(activityPath, JSON.stringify(data, null, 2))
      } else if (req.url === '/subjects') {
        fs.writeFileSync(subjectsPath, JSON.stringify(data, null, 2))
      } else if (req.url === '/classes') {
        classes = classes.concat(data)
        fs.writeFileSync(classPath, JSON.stringify(classes))

        if (data[0]) { // Some subjects have no classes
          console.log('recieved classes for', data[0].classCode, 'total', classes.length, 'classes')
        }
      }

      res.end()
    })
  } else res.end('bad method or url')
})

server.listen(443)
