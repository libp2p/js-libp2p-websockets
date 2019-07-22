'use strict'

const abortable = require('abortable-iterator')

const { Connection } = require('interface-connection')

class Libp2pSocket extends Connection {
  constructor (rawSocket, ma, opts = {}) {
    super(ma)

    this._rawSocket = rawSocket
    this._ma = ma

    this.sink = this._sink(opts)
    this.source = opts.signal ? abortable(rawSocket.source, opts.signal) : rawSocket.source
  }

  _sink (opts) {
    return async (source) => {
      try {
        await this._rawSocket.sink(abortable(source, opts.signal))
      } catch (err) {
        // Re-throw non-aborted errors
        if (err.type !== 'aborted') throw err
        // Otherwise, this is fine...
        await this._rawSocket.close()
      }
    }
  }
}

module.exports = Libp2pSocket
