#!/usr/bin/env node
const http = require('http')
const DiscoverySwarmWebServer = require('./server')

const DEFAULT_PORT = 3472

const argv = require('yargs').argv

let port = argv.port || require('yargs')

const server = http.createServer()

DiscoverySwarmWebServer.createServer({
  server
})

server.listen(port)
