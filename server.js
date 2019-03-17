const DSS = require('discovery-swarm-stream/server')
const websocket = require('websocket-stream')
var defaults = require('dat-swarm-defaults')

const SWARM_OPTS = defaults({
  hash: false
})

module.exports = {
  createServer (opts) {
    const dss = new DSS(SWARM_OPTS)

    websocket.createServer(opts, (stream) => {
      dss.addClient(stream)
    })

    return dss
  }
}
