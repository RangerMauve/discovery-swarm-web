#!/usr/bin/env node
const http = require('http')
const DiscoverySwarmWebServer = require('./server')

const DEFAULT_PORT = 3472

const page = `
<!DOCTYPEn html>
<title>discovery-swarm-web</title>
<p>
  This is a
  <a href="https://www.npmjs.com/package/discovery-swarm-web">discovery-swarm-web</a>
  server used for proxying to the <a href="https://datproject.org/">Dat</a> P2P network.
</p>
`

const argv = require('yargs').argv

let port = argv.port || DEFAULT_PORT
let defaultHash = argv.defaultHash
let defaultHandshake = argv.defaultHandshake

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })
  res.end(page)
})

DiscoverySwarmWebServer.createServer({
  defaultHash,
  defaultHandshake,
  server
})

server.listen(port)

console.log('discovery-swarm-web server running on port', port)
