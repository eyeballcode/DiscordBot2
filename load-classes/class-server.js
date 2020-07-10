const http = require('http')
const https = require('https')
const tls = require('tls')
const fs = require('fs')
const path = require('path')

let classes = []
let classPath = path.join(__dirname, 'classes.json')

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

  if (req.url === '/classes' && req.method === 'POST') {
    let body = []
    req.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()

      let data = JSON.parse(body)

      classes = classes.concat(data)
      fs.writeFileSync(classPath, JSON.stringify(classes))
      console.log('recieved classes for', data[0].classCode, 'total', classes.length, 'classes')

      res.end()
    })
  } else res.end()
})

server.listen(443)
