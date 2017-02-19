'use strict'

const connect = require('pull-ws/client')
const mafmt = require('mafmt')
const includes = require('lodash.includes')
const Connection = require('interface-connection').Connection
const multiaddr = require('multiaddr')

const debug = require('debug')
const log = debug('libp2p:websockets:dialer')

const createListener = require('./listener')

function maToUrl (ma) {
  const maStrSplit = ma.toString().split('/')
  const proto = ma.protos()[2].name

  if (!(proto === 'ws' || proto === 'wss')) {
    throw new Error('invalid multiaddr' + ma.toString())
  }

  let url = ma.protos()[2].name + '://' + maStrSplit[2]

  if (!multiaddr.isName(ma)) {
    url += ':' + maStrSplit[4]
  }

  return url
}

module.exports =
  class WebSockets {
    dial (ma, options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }

      if (!callback) {
        callback = () => {
        }
      }

      const url = maToUrl(ma)
      log('dialing %s', url)
      const socket = connect(url, {
        binary: true,
        onConnect: () => callback()
      })

      const conn = new Connection(socket)
      conn.getObservedAddrs = (cb) => cb(null, [ma])
      conn.close = (cb) => socket.close(cb)

      return conn
    }

    createListener (options, handler) {
      if (typeof options === 'function') {
        handler = options
        options = {}
      }

      return createListener(options, handler)
    }

    filter (multiaddrs) {
      if (!Array.isArray(multiaddrs)) {
        multiaddrs = [multiaddrs]
      }

      return multiaddrs.filter((ma) => {
        if (includes(ma.protoNames(), 'ipfs')) {
          ma = ma.decapsulate('ipfs')
        }
        return mafmt.WebSockets.matches(ma)
      })
    }
}
