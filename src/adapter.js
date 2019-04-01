'use strict'

const { Connection } = require('interface-connection')
const withIs = require('class-is')
const toPull = require('async-iterator-to-pull-stream')
const WebSockets = require('./')
const noop = () => {}

function callbackify (fn) {
  return async function (...args) {
    let cb = args.pop()
    if (typeof cb !== 'function') {
      args.push(cb)
      cb = noop
    }
    let res
    try {
      res = await fn(...args)
    } catch (err) {
      return cb(err)
    }
    cb(null, res)
  }
}

// Legacy adapter to old transport & connection interface
class WebSocketsAdapter extends WebSockets {
  dial (ma, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    callback = callback || noop

    const socket = super.dial(ma, options)
    const conn = new Connection(toPull.duplex(socket))

    conn.getObservedAddrs = callbackify(socket.getObservedAddrs.bind(socket))
    conn.close = callbackify(socket.close.bind(socket))

    socket.connected().then(callback).catch(callback)

    return conn
  }

  createListener (options, handler) {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    const server = super.createListener(options, socket => {
      const conn = new Connection(toPull.duplex(socket))
      conn.getObservedAddrs = callbackify(socket.getObservedAddrs.bind(socket))
      handler(conn)
    })

    const proxy = {
      listen: callbackify(server.listen.bind(server)),
      close: callbackify(server.close.bind(server)),
      getAddrs: callbackify(server.getAddrs.bind(server)),
      getObservedAddrs: callbackify(() => server.getObservedAddrs())
    }

    return new Proxy(server, { get: (_, prop) => proxy[prop] || server[prop] })
  }
}

module.exports = withIs(WebSocketsAdapter, {
  className: 'WebSockets',
  symbolName: '@libp2p/js-libp2p-websockets/websockets'
})
