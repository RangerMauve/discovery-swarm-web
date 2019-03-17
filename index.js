const signalhubws = require('signalhubws')
const webrtcSwarm = require('@geut/discovery-swarm-webrtc')
const DSS = require('discovery-swarm-stream/client')
const websocket = require('websocket-stream')

const EventEmitter = require('events')

const DEFAULT_SIGNALHUB = ['wss://signalhubws.mauve.moe']
const DEFAULT_DISCOVERY = 'wss://discoveryswarm.mauve.moe'
const APP_NAME = 'discovery-swarm-web'

// Check if the page was loaded from HTTPS
const IS_SECURE = self.location.href.startsWith('https')

module.exports = class DiscoverySwarmWeb extends EventEmitter {
  constructor (opts = {}) {
    super()
    const signalhubURL = opts.signalhub || DEFAULT_SIGNALHUB
    const discoveryURL = opts.discovery || DEFAULT_DISCOVERY

    const id = opts.id
    const stream = opts.stream

    const isInstance = (typeof signalhubURL === 'object' && !Array.isArray(signalhubURL))
    const hub = isInstance
      ? signalhubURL : signalhubws(APP_NAME, signalhubURL.map(setSecure))

    this.hub = hub

    this.webrtc = webrtcSwarm({
      id, stream, hub
    })
    this.dss = new DiscoverySwarmStreamWebsocket({
      id, stream, discovery: setSecure(discoveryURL)
    })
  }

  join (channelName, opts = {}) {
    this.webrtc.join(channelName, opts)
    this.dss.join(channelName, opts)
  }

  leave (channelName, opts = {}) {
    this.webrtc.leave(channelName, opts)
    this.dss.leave(channelName, opts)
  }

  close (cb) {
    this.dss.close(() => {
      this.webrtc.close(cb)
    })
  }

  destroy (cb) {
    this.close(cb)
  }
}

class DiscoverySwarmStreamWebsocket extends DSS {
  constructor (opts) {
    const discovery = opts.discovery
    const stream = opts.stream

    const connection = websocket(discovery)

    super({
      connection,
      stream
    })
  }
}

function setSecure (url) {
  if (IS_SECURE) {
    if (url.startsWith('http:')) {
      return 'https:' + url.slice(6)
    } else if (url.startsWith('ws:')) {
      return 'wss:' + url.slice(3)
    } else {
      return url
    }
  } else {
    if (url.startsWith('https:')) {
      return 'http:' + url.slice(7)
    } else if (url.startsWith('wss:')) {
      return 'ws:' + url.slice(4)
    } else {
      return url
    }
  }
}
