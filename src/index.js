'use strict'

const connect = require('it-ws/client')
const mafmt = require('mafmt')
const withIs = require('class-is')
const toUri = require('multiaddr-to-uri')
const log = require('debug')('libp2p:websockets:transport')

const createListener = require('./listener')

class WebSockets {
  async dial (ma, options) {
    log('dialing %s', ma)
    const url = toUri(ma)
    const socket = connect(url, { binary: true })
    socket.getObservedAddrs = () => [ma]
    log('connected %s', ma)
    return socket
  }

  createListener (options, handler) {
    return createListener(options, handler)
  }

  filter (multiaddrs) {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }

    return multiaddrs.filter((ma) => {
      if (ma.protoNames().includes('p2p-circuit')) {
        return false
      }

      if (ma.protoNames().includes('ipfs')) {
        ma = ma.decapsulate('ipfs')
      }

      return mafmt.WebSockets.matches(ma) ||
        mafmt.WebSocketsSecure.matches(ma)
    })
  }
}

module.exports = withIs(WebSockets, { className: 'WebSockets', symbolName: '@libp2p/js-libp2p-websockets/websockets' })
