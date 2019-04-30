const DSS = require('discovery-swarm-stream/server')
const websocket = require('websocket-stream')

module.exports = {
  createServer (opts) {
    const dss = new DSS({})

    websocket.createServer(opts, (stream) => {
      dss.addClient(stream)
    })

    return dss
  }
}
