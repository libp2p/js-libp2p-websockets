/* eslint-env mocha */
'use strict'

const tests = require('./compliance')
const multiaddr = require('multiaddr')
const WS = require('../../src/adapter')

describe('adapter compliance', () => {
  tests({
    setup (callback) {
      let ws = new WS()
      const addrs = [
        multiaddr('/ip4/127.0.0.1/tcp/9091/ws'),
        multiaddr('/ip4/127.0.0.1/tcp/9092/wss'),
        multiaddr('/dns4/ipfs.io/tcp/9092/ws'),
        multiaddr('/dns4/ipfs.io/tcp/9092/wss')
      ]
      callback(null, ws, addrs)
    },
    teardown (callback) {
      callback()
    }
  })
})
