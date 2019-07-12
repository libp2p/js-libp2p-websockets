/* eslint-env mocha */
'use strict'

const tests = require('interface-transport')
const multiaddr = require('multiaddr')
const WS = require('../src')

describe('compliance', () => {
  tests({
    setup (callback) {
      let ws = new WS()
      const addrs = [
        multiaddr('/ip4/127.0.0.1/tcp/9091/ws/libp2pEndpoint'),
        multiaddr('/ip4/127.0.0.1/tcp/9092/wss/libp2pEndpoint'),
        multiaddr('/dns4/ipfs.io/tcp/9092/ws/libp2pEndpoint'),
        multiaddr('/dns4/ipfs.io/tcp/9092/wss/libp2pEndpoint')
      ]
      callback(null, ws, addrs)
    },
    teardown (callback) {
      callback()
    }
  })
})
