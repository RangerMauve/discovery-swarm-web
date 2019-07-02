const DSS = require('discovery-swarm-stream/server')
const websocket = require('websocket-stream')
const debug = require('debug')('discovery-swarm-web-server')

module.exports = {
  createServer (opts) {
    const dss = new DSS(opts)

    websocket.createServer(opts, (stream) => {
      stream.on('error', (e) => {
        debug('Incoming connection error', e)
      })
      dss.addClient(stream)
    })

    return dss
  }
}
