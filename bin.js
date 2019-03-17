#!/usr/bin/env node
const http = require('http')
const DiscoverySwarmWebServer = require('./server')

const DEFAULT_PORT = 3472

const argv = require('yargs').argv

let port = argv.port || DEFAULT_PORT

const server = http.createServer()

DiscoverySwarmWebServer.createServer({
  server
})

server.listen(port)

console.log('discovery-swarm-web server running on port', port)
