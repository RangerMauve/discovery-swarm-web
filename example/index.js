const DiscoverySwarmWeb = require('../')
var hyperdrive = require('hyperdrive')
var RAM = require('random-access-memory')

const ARCHIVE_KEY = '60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330'

const archive = hyperdrive(RAM, ARCHIVE_KEY, {
  sparse: true
})

archive.ready(loadSwarm)

function loadSwarm () {
  const swarm = new DiscoverySwarmWeb({
    stream: replicate
  })

  swarm.join(archive.discoveryKey)

  archive.readFile('/about/index.html', 'utf-8', (err, data) => {
    if (err) throw err
    document.body.innerHTML = data
  })
}

function replicate () {
  return archive.replicate({
    live: true
  })
}
