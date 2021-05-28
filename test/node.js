/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 6] */
'use strict'

const https = require('https')
const fs = require('fs')

const AbortController = require('abort-controller').default
const { expect } = require('aegir/utils/chai')
const { Multiaddr } = require('multiaddr')
const goodbye = require('it-goodbye')
const isLoopbackAddr = require('is-loopback-addr')
const { collect } = require('streaming-iterables')
const pipe = require('it-pipe')
const BufferList = require('bl/BufferList')
const uint8ArrayFromString = require('uint8arrays/from-string')

const WS = require('../src')
const filters = require('../src/filters')

require('./compliance.node')

const mockUpgrader = {
  upgradeInbound: maConn => maConn,
  upgradeOutbound: maConn => maConn
}

describe('instantiate the transport', () => {
  it('create', () => {
    const ws = new WS({ upgrader: mockUpgrader })
    expect(ws).to.exist()
  })
})

describe('listen', () => {
  describe('ip4', () => {
    let ws
    const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws')

    beforeEach(() => {
      ws = new WS({ upgrader: mockUpgrader })
    })

    it('listen, check for promise', async () => {
      const listener = ws.createListener((conn) => { })
      await listener.listen(ma)
      await listener.close()
    })

    it('listen, check for listening event', (done) => {
      const listener = ws.createListener((conn) => { })

      listener.on('listening', async () => {
        await listener.close()
        done()
      })

      listener.listen(ma)
    })

    it('listen, check for the close event', (done) => {
      const listener = ws.createListener((conn) => { })

      listener.on('listening', () => {
        listener.on('close', done)
        listener.close()
      })

      listener.listen(ma)
    })

    it('listen on addr with /ipfs/QmHASH', async () => {
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const listener = ws.createListener((conn) => { })

      await listener.listen(ma)
      await listener.close()
    })

    it('listen on port 0', async () => {
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/0/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const listener = ws.createListener((conn) => { })

      await listener.listen(ma)
      const addrs = await listener.getAddrs()
      expect(addrs.map((a) => a.toOptions().port)).to.not.include(0)
      await listener.close()
    })

    it('listen on any Interface', async () => {
      const ma = new Multiaddr('/ip4/0.0.0.0/tcp/0/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const listener = ws.createListener((conn) => { })

      await listener.listen(ma)
      const addrs = await listener.getAddrs()
      expect(addrs.map((a) => a.toOptions().host)).to.not.include('0.0.0.0')
      await listener.close()
    })

    it('getAddrs', async () => {
      const listener = ws.createListener((conn) => { })
      await listener.listen(ma)
      const addrs = await listener.getAddrs()
      expect(addrs.length).to.equal(1)
      expect(addrs[0]).to.deep.equal(ma)
      await listener.close()
    })

    it('getAddrs on port 0 listen', async () => {
      const addr = new Multiaddr('/ip4/127.0.0.1/tcp/0/ws')
      const listener = ws.createListener((conn) => { })
      await listener.listen(addr)
      const addrs = await listener.getAddrs()
      expect(addrs.length).to.equal(1)
      expect(addrs.map((a) => a.toOptions().port)).to.not.include('0')
      await listener.close()
    })

    it('getAddrs from listening on 0.0.0.0', async () => {
      const addr = new Multiaddr('/ip4/0.0.0.0/tcp/9003/ws')
      const listener = ws.createListener((conn) => { })
      await listener.listen(addr)
      const addrs = await listener.getAddrs()
      expect(addrs.map((a) => a.toOptions().host)).to.not.include('0.0.0.0')
      await listener.close()
    })

    it('getAddrs from listening on 0.0.0.0 and port 0', async () => {
      const addr = new Multiaddr('/ip4/0.0.0.0/tcp/0/ws')
      const listener = ws.createListener((conn) => { })
      await listener.listen(addr)
      const addrs = await listener.getAddrs()
      expect(addrs.map((a) => a.toOptions().host)).to.not.include('0.0.0.0')
      expect(addrs.map((a) => a.toOptions().port)).to.not.include('0')
      await listener.close()
    })

    it('getAddrs preserves p2p Id', async () => {
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/p2p/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const listener = ws.createListener((conn) => { })

      await listener.listen(ma)
      const addrs = await listener.getAddrs()
      expect(addrs.length).to.equal(1)
      expect(addrs[0]).to.deep.equal(ma)
      await listener.close()
    })
  })

  describe('ip6', () => {
    let ws
    const ma = new Multiaddr('/ip6/::1/tcp/9091/ws')

    beforeEach(() => {
      ws = new WS({ upgrader: mockUpgrader })
    })

    it('listen, check for promise', async () => {
      const listener = ws.createListener((conn) => { })
      await listener.listen(ma)
      await listener.close()
    })

    it('listen, check for listening event', (done) => {
      const listener = ws.createListener((conn) => { })

      listener.on('listening', async () => {
        await listener.close()
        done()
      })

      listener.listen(ma)
    })

    it('listen, check for the close event', (done) => {
      const listener = ws.createListener((conn) => { })

      listener.on('listening', () => {
        listener.on('close', done)
        listener.close()
      })

      listener.listen(ma)
    })

    it('listen on addr with /ipfs/QmHASH', async () => {
      const ma = new Multiaddr('/ip6/::1/tcp/9091/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const listener = ws.createListener((conn) => { })
      await listener.listen(ma)
      await listener.close()
    })
  })
})

describe('dial', () => {
  describe('ip4', () => {
    let ws
    let listener
    const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9091/ws')

    beforeEach(() => {
      ws = new WS({ upgrader: mockUpgrader })
      listener = ws.createListener(conn => pipe(conn, conn))
      return listener.listen(ma)
    })

    afterEach(() => listener.close())

    it('dial', async () => {
      const conn = await ws.dial(ma)
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([uint8ArrayFromString('hey')])
    })

    it('dial with p2p Id', async () => {
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9091/ws/p2p/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const conn = await ws.dial(ma)
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([uint8ArrayFromString('hey')])
    })

    it('dial should throw on immediate abort', async () => {
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/0/ws')
      const controller = new AbortController()

      const conn = ws.dial(ma, { signal: controller.signal })
      controller.abort()

      await expect(conn).to.eventually.be.rejected()
    })

    it('should resolve port 0', async () => {
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/0/ws')
      const ws = new WS({ upgrader: mockUpgrader })

      // Create a Promise that resolves when a connection is handled
      let handled
      const handlerPromise = new Promise(resolve => { handled = resolve })
      const handler = conn => handled(conn)

      const listener = ws.createListener(handler)

      // Listen on the multiaddr
      await listener.listen(ma)

      const localAddrs = listener.getAddrs()
      expect(localAddrs.length).to.equal(1)

      // Dial to that address
      await ws.dial(localAddrs[0])

      // Wait for the incoming dial to be handled
      await handlerPromise

      // close the listener
      await listener.close()
    })
  })

  describe('ip4 no loopback', () => {
    let ws
    let listener
    const ma = new Multiaddr('/ip4/0.0.0.0/tcp/0/ws')

    beforeEach(() => {
      ws = new WS({ upgrader: mockUpgrader })
      listener = ws.createListener(conn => pipe(conn, conn))
      return listener.listen(ma)
    })

    afterEach(() => listener.close())

    it('dial', async () => {
      const addrs = listener.getAddrs().filter((ma) => {
        const { address } = ma.nodeAddress()

        return !isLoopbackAddr(address)
      })

      // Dial first no loopback address
      const conn = await ws.dial(addrs[0])
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([uint8ArrayFromString('hey')])
    })
  })

  describe('ip4 with wss', () => {
    let ws
    let listener
    const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9091/wss')

    const server = https.createServer({
      cert: fs.readFileSync('./test/fixtures/certificate.pem'),
      key: fs.readFileSync('./test/fixtures/key.pem')
    })

    beforeEach(() => {
      ws = new WS({ upgrader: mockUpgrader })
      listener = ws.createListener({ server }, conn => pipe(conn, conn))
      return listener.listen(ma)
    })

    afterEach(() => listener.close())

    it('should listen on wss address', () => {
      const addrs = listener.getAddrs()

      expect(addrs).to.have.lengthOf(1)
      expect(ma.equals(addrs[0])).to.eql(true)
    })

    it('dial', async () => {
      const conn = await ws.dial(ma, { websocket: { rejectUnauthorized: false } })
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([uint8ArrayFromString('hey')])
    })
  })

  describe('ip6', () => {
    let ws
    let listener
    const ma = new Multiaddr('/ip6/::1/tcp/9091')

    beforeEach(() => {
      ws = new WS({ upgrader: mockUpgrader })
      listener = ws.createListener(conn => pipe(conn, conn))
      return listener.listen(ma)
    })

    afterEach(() => listener.close())

    it('dial', async () => {
      const conn = await ws.dial(ma)
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([uint8ArrayFromString('hey')])
    })

    it('dial and use BufferList', async () => {
      const conn = await ws.dial(ma)
      const s = goodbye({ source: [new BufferList('hey')], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([uint8ArrayFromString('hey')])
    })

    it('dial with p2p Id', async () => {
      const ma = new Multiaddr('/ip6/::1/tcp/9091/ws/p2p/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const conn = await ws.dial(ma)

      const s = goodbye({
        source: ['hey'],
        sink: collect
      })

      const result = await pipe(s, conn, s)
      expect(result).to.be.eql([uint8ArrayFromString('hey')])
    })
  })
})

describe('filter addrs', () => {
  let ws

  describe('default filter addrs with only dns', () => {
    before(() => {
      ws = new WS({ upgrader: mockUpgrader })
    })

    it('should filter out invalid WS addresses', function () {
      const ma1 = new Multiaddr('/ip4/127.0.0.1/tcp/9090')
      const ma2 = new Multiaddr('/ip4/127.0.0.1/udp/9090')
      const ma3 = new Multiaddr('/ip6/::1/tcp/80')
      const ma4 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80')

      const valid = ws.filter([ma1, ma2, ma3, ma4])
      expect(valid.length).to.equal(0)
    })

    it('should filter correct dns address', function () {
      const ma1 = new Multiaddr('/dnsaddr/ipfs.io/ws')
      const ma2 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80/ws')
      const ma3 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80/wss')

      const valid = ws.filter([ma1, ma2, ma3])
      expect(valid.length).to.equal(3)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
      expect(valid[2]).to.deep.equal(ma3)
    })

    it('should filter correct dns address with ipfs id', function () {
      const ma1 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = new Multiaddr('/dnsaddr/ipfs.io/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns4 address', function () {
      const ma1 = new Multiaddr('/dns4/ipfs.io/tcp/80/ws')
      const ma2 = new Multiaddr('/dns4/ipfs.io/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns6 address', function () {
      const ma1 = new Multiaddr('/dns6/ipfs.io/tcp/80/ws')
      const ma2 = new Multiaddr('/dns6/ipfs.io/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns6 address with ipfs id', function () {
      const ma1 = new Multiaddr('/dns6/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = new Multiaddr('/dns6/ipfs.io/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })
  })

  describe('custom filter addrs', () => {
    before(() => {
      ws = new WS({ upgrader: mockUpgrader, filter: filters.all })
    })

    it('should fail invalid WS addresses', function () {
      const ma1 = new Multiaddr('/ip4/127.0.0.1/tcp/9090')
      const ma2 = new Multiaddr('/ip4/127.0.0.1/udp/9090')
      const ma3 = new Multiaddr('/ip6/::1/tcp/80')
      const ma4 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80')

      const valid = ws.filter([ma1, ma2, ma3, ma4])
      expect(valid.length).to.equal(0)
    })

    it('should filter correct ipv4 addresses', function () {
      const ma1 = new Multiaddr('/ip4/127.0.0.1/tcp/80/ws')
      const ma2 = new Multiaddr('/ip4/127.0.0.1/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct ipv4 addresses with ipfs id', function () {
      const ma1 = new Multiaddr('/ip4/127.0.0.1/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = new Multiaddr('/ip4/127.0.0.1/tcp/80/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct ipv6 address', function () {
      const ma1 = new Multiaddr('/ip6/::1/tcp/80/ws')
      const ma2 = new Multiaddr('/ip6/::1/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct ipv6 addresses with ipfs id', function () {
      const ma1 = new Multiaddr('/ip6/::1/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = new Multiaddr('/ip6/::1/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns address', function () {
      const ma1 = new Multiaddr('/dnsaddr/ipfs.io/ws')
      const ma2 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80/ws')
      const ma3 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80/wss')

      const valid = ws.filter([ma1, ma2, ma3])
      expect(valid.length).to.equal(3)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
      expect(valid[2]).to.deep.equal(ma3)
    })

    it('should filter correct dns address with ipfs id', function () {
      const ma1 = new Multiaddr('/dnsaddr/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = new Multiaddr('/dnsaddr/ipfs.io/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns4 address', function () {
      const ma1 = new Multiaddr('/dns4/ipfs.io/tcp/80/ws')
      const ma2 = new Multiaddr('/dns4/ipfs.io/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns6 address', function () {
      const ma1 = new Multiaddr('/dns6/ipfs.io/tcp/80/ws')
      const ma2 = new Multiaddr('/dns6/ipfs.io/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns6 address with ipfs id', function () {
      const ma1 = new Multiaddr('/dns6/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = new Multiaddr('/dns6/ipfs.io/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter mixed addresses', function () {
      const ma1 = new Multiaddr('/dns6/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = new Multiaddr('/ip4/127.0.0.1/tcp/9090')
      const ma3 = new Multiaddr('/ip4/127.0.0.1/udp/9090')
      const ma4 = new Multiaddr('/dns6/ipfs.io/ws')
      const mh5 = new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw' +
        '/p2p-circuit/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2, ma3, ma4, mh5])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma4)
    })

    it('filter a single addr for this transport', () => {
      const ma = new Multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter(ma)
      expect(valid.length).to.equal(1)
      expect(valid[0]).to.deep.equal(ma)
    })
  })
})
