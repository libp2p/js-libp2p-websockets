'use strict'

const connect = require('it-ws/client')
const mafmt = require('mafmt')
const withIs = require('class-is')
const toUri = require('multiaddr-to-uri')
const log = require('debug')('libp2p:websockets:transport')
const abortable = require('abortable-iterator')
const { AbortError } = require('interface-transport')
const createListener = require('./listener')

class WebSockets {
  async dial (ma, options) {
    options = options || {}
    log('dialing %s', ma)

    const socket = connect(toUri(ma), Object.assign({ binary: true }, options))
    const getObservedAddrs = () => [ma]

    if (!options.signal) {
      socket.getObservedAddrs = getObservedAddrs
      await socket.connected()
      log('connected %s', ma)
      return socket
    }

    // Allow abort via signal during connect
    let onAbort
    const abort = new Promise((resolve, reject) => {
      onAbort = () => {
        reject(new AbortError())
        socket.close()
      }

      // Already aborted?
      if (options.signal.aborted) return onAbort()
      options.signal.addEventListener('abort', onAbort)
    })

    try {
      await Promise.race([abort, socket.connected()])
    } finally {
      options.signal.removeEventListener('abort', onAbort)
    }

    log('connected %s', ma)
    return {
      sink: async source => {
        try {
          await socket.sink(abortable(source, options.signal))
        } catch (err) {
          // Re-throw non-aborted errors
          if (err.type !== 'aborted') throw err
          // Otherwise, this is fine...
          await socket.close()
        }
      },
      source: abortable(socket.source, options.signal),
      getObservedAddrs
    }
  }

  createListener (options, handler) {
    return createListener(options, handler)
  }

  filter (multiaddrs) {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    return multiaddrs.filter((ma) => {
      if (ma.protoNames().includes('p2p-circuit')) {
        return false
      }

      if (ma.protoNames().includes('ipfs')) {
        ma = ma.decapsulate('ipfs')
      }

      return mafmt.WebSockets.matches(ma) || mafmt.WebSocketsSecure.matches(ma)
    })
  }
}

module.exports = withIs(WebSockets, {
  className: 'WebSockets',
  symbolName: '@libp2p/js-libp2p-websockets/websockets'
})
