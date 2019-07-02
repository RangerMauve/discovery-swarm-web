/* global self */
const signalhubws = require('signalhubws')
const webrtcSwarm = require('@geut/discovery-swarm-webrtc')
const DSS = require('discovery-swarm-stream/client')
const websocket = require('websocket-stream')
const randomBytes = require('randombytes')

const EventEmitter = require('events')

const DEFAULT_SIGNALHUB = ['wss://signalhubws.mauve.moe']
const DEFAULT_DISCOVERY = 'wss://discoveryswarm.mauve.moe'
const LOCALHOST_DISCOVERY = 'ws://localhost:3472'
const APP_NAME = 'discovery-swarm-web'
const DEFAULT_MAX_CONNECTIONS = Infinity
const JOIN_DELAY = 2000
const SYNC_NET_DELAY = 5000
const LOCALHOST_WARNING = (discovery) => `Could not connect to local gateway at ${LOCALHOST_DISCOVERY}, trying remote gateway at ${discovery}.
This isn't an error unless you're trying to use a local gateway. 😁`

// Check if the page was loaded from HTTPS
const IS_SECURE = self.location.href.startsWith('https')

class DiscoverySwarmWeb extends EventEmitter {
  constructor (opts = {}) {
    super()
    const signalhubURL = opts.signalhub || DEFAULT_SIGNALHUB
    const discoveryURL = opts.discovery || DEFAULT_DISCOVERY

    const id = opts.id || randomBytes(32)
    const stream = opts.stream

    this.id = id
    this.stream = stream
    this.maxConnections = opts.maxConnections || DEFAULT_MAX_CONNECTIONS

    const isInstance = (typeof signalhubURL === 'object' && !Array.isArray(signalhubURL))
    const hub = isInstance
      ? signalhubURL : signalhubws(APP_NAME, signalhubURL.map(setSecure))

    this.channels = new Map()

    this.hub = hub

    this.webrtc = webrtcSwarm({
      id,
      stream,
      hub
    })

    this.dss = new DiscoverySwarmStreamWebsocket({
      id,
      stream,
      discovery: setSecure(discoveryURL)
    })

    this.webrtc.on('connection', (conn, info) => this._handleConnection(conn, info))
    this.dss.on('connection', (conn, info) => this._handleConnection(conn, info))
  }

  _handleConnection (connection, info) {
    const channelNameString = info.channel.toString('hex')
    const currentCount = this.channels.get(channelNameString)

    if (currentCount >= this.maxConnections) {
      connection.end()
    } else {
      this.channels.set(channelNameString, currentCount + 1)

      let hasClosed = false
      const handleClose = () => {
        if (hasClosed) return
        hasClosed = true
        if (!this.channels.has(channelNameString)) return
        const count = this.channels.get(channelNameString)
        this.channels.set(channelNameString, count - 1)
        if (!count) {
          this.leave(channelNameString)
          this.join(channelNameString)
        }
      }

      connection.once('close', handleClose)
      connection.once('error', handleClose)

      this.emit('connection', connection, info)
    }
  }

  join (channelName, opts = {}) {
    const channelNameString = channelName.toString('hex')

    if (this.channels.has(channelNameString)) return

    this.channels.set(channelNameString, 0)

    this.webrtc.join(channelName, opts)

    const joinDSS = () => {
      if (!this.channels.has(channelNameString)) return
      this.removeListener('connection', handleJoined)
      this.dss.join(channelName, opts)
    }

    const handleJoined = (connection, info) => {
      if (info.channel.toString('hex') !== channelNameString) return
      this.removeListener('connection', handleJoined)
      clearTimeout(connectTimer)
      connectTimer = setTimeout(joinDSS, SYNC_NET_DELAY)
    }

    // Wait a bit for WebRTC connections to come in before connecting to the gateway
    // This will make it more likely that any initial sync would happen over WebRTC
    let connectTimer = setTimeout(joinDSS, JOIN_DELAY)

    this.on('connection', handleJoined)
  }

  leave (channelName) {
    const channelNameString = channelName.toString('hex')

    if (!this.channels.has(channelNameString)) return

    this.channels.delete(channelNameString)

    this.webrtc.leave(channelName)
    this.dss.leave(channelName)
  }

  listen () {
    // Needed to mimic discovery-swarm behavior
    setTimeout(() => {
      this.emit('listening')
    }, 0)
  }

  address () {
    return {
      port: -1
    }
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
    const id = opts.id

    let connection = null
    try {
      connection = websocket(LOCALHOST_DISCOVERY)
    } catch (e) {
      console.warn(LOCALHOST_WARNING(discovery), e)
      connection = websocket(discovery)
    }

    super({
      id,
      connection,
      stream
    })

    this.connection = connection

    this._handleDisconnected = () => {
      this._reconnect()
    }
    this.discoveryURL = discovery

    this.connection.once('error', this._handleDisconnected)
    this.on('disconnected', this._handleDisconnected)
  }

  _reconnect () {
    this.connection = websocket(this.discoveryURL)
    this.reconnect(this.connection)
  }

  close (cb) {
    this.removeListener('disconnected', this._handleDisconnected)
    this.connection = null
    super.close(cb)
  }
}

module.exports = (opts) => new DiscoverySwarmWeb(opts)

module.exports.DiscoverySwarmWeb = DiscoverySwarmWeb
module.exports.DiscoverySwarmStreamWebsocket = DiscoverySwarmStreamWebsocket

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
