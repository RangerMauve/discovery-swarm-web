var path = require('path')

// This is a dirty hack for browserify to work. 😅
if (!path.posix) path.posix = path

const discoverySwarmWeb = require('../')
var hyperdrive = require('hyperdrive')
var RAM = require('random-access-memory')

const ARCHIVE_KEY = '60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330'

const archive = hyperdrive(RAM, ARCHIVE_KEY, {
  sparse: true
})

archive.ready(loadSwarm)

function loadSwarm () {
  const swarm = discoverySwarmWeb({
    stream: replicate
  })

  console.log('Joining', archive.discoveryKey.toString('hex'))
  swarm.join(archive.discoveryKey)

  archive.metadata.update(() => {
    console.log('Metadata loaded')

    archive.readdir('/', console.log)
    archive.readFile('/about/index.html', 'utf-8', (err, data) => {
      if (err) throw err
      console.log('Loaded data', data)
      document.body.innerHTML = data
    })
  })

  swarm.on('connection', (connection, info) => {
    console.log('Got connection', info)
  })
}

function replicate (info) {
  return archive.replicate({
    live: true
  })
}
