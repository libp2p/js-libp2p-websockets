'use strict'

const abortable = require('abortable-iterator')
const { CLOSE_TIMEOUT } = require('./constants')
const toMultiaddr = require('libp2p-utils/src/ip-port-to-multiaddr')

const log = require('debug')('libp2p:websockets:socket')

// Convert a stream into a MultiaddrConnection
// https://github.com/libp2p/interface-transport#multiaddrconnection
module.exports = (stream, options = {}) => {
  const socket = options.socket

  const maConn = {
    async sink (source) {
      if (options.signal) {
        source = abortable(source, options.signal)
      }

      try {
        await stream.sink(source)
      } catch (err) {
        // Re-throw non-aborted errors
        if (err.type !== 'aborted') throw err
        // Otherwise, this is fine...
        await stream.close()
      }
    },

    source: options.signal ? abortable(stream.source, options.signal) : stream.source,

    conn: socket,

    localAddr: undefined,

    // If the remote address was passed, use it - it may have the peer ID encapsulated
    remoteAddr: options.remoteAddr || toMultiaddr(stream.remoteAddress, stream.remotePort),

    timeline: { open: Date.now() },

    close () {
      return new Promise(async (resolve) => { // eslint-disable-line no-async-promise-executor
        const start = Date.now()

        // Attempt to end the socket. If it takes longer to close than the
        // timeout, destroy it manually.
        const timeout = setTimeout(() => {
          const { host, port } = maConn.remoteAddr.toOptions()
          log('timeout closing socket to %s:%s after %dms, destroying it manually',
            host, port, Date.now() - start)

          socket.terminate()
          maConn.timeline.close = Date.now()
          return resolve()
        }, CLOSE_TIMEOUT)

        await stream.close()

        clearTimeout(timeout)
        maConn.timeline.close = Date.now()

        resolve()
      })
    }
  }

  return maConn
}
