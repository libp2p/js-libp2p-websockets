/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 6] */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const multiaddr = require('multiaddr')
const goodbye = require('it-goodbye')
const { collect, consume } = require('streaming-iterables')
const pipe = require('it-pipe')
const AbortController = require('abort-controller')

const WS = require('../src')

require('./compliance.node')

describe('instantiate the transport', () => {
  it('create', () => {
    const ws = new WS()
    expect(ws).to.exist()
  })
})

describe('listen', () => {
  describe('ip4', () => {
    let ws
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws')

    beforeEach(() => {
      ws = new WS()
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
      const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const listener = ws.createListener((conn) => { })

      await listener.listen(ma)
      await listener.close()
    })

    it.skip('close listener with connections, through timeout', (done) => {
      // TODO `ws` closes all anyway, we need to make it not close
      // first - https://github.com/diasdavid/simple-websocket-server
    })

    it.skip('listen on port 0', (done) => {
      // TODO port 0 not supported yet
    })

    it.skip('listen on any Interface', (done) => {
      // TODO 0.0.0.0 not supported yet
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
      const addr = multiaddr(`/ip4/127.0.0.1/tcp/0/ws`)
      const listener = ws.createListener((conn) => { })
      await listener.listen(addr)
      const addrs = await listener.getAddrs()
      expect(addrs.length).to.equal(1)
      expect(addrs.map((a) => a.toOptions().port)).to.not.include('0')
      await listener.close()
    })

    it('getAddrs from listening on 0.0.0.0', async () => {
      const addr = multiaddr(`/ip4/0.0.0.0/tcp/9003/ws`)
      const listener = ws.createListener((conn) => { })
      await listener.listen(addr)
      const addrs = await listener.getAddrs()
      expect(addrs.map((a) => a.toOptions().host)).to.not.include('0.0.0.0')
      await listener.close()
    })

    it('getAddrs from listening on 0.0.0.0 and port 0', async () => {
      const addr = multiaddr(`/ip4/0.0.0.0/tcp/0/ws`)
      const listener = ws.createListener((conn) => { })
      await listener.listen(addr)
      const addrs = await listener.getAddrs()
      expect(addrs.map((a) => a.toOptions().host)).to.not.include('0.0.0.0')
      expect(addrs.map((a) => a.toOptions().port)).to.not.include('0')
      await listener.close()
    })

    it('getAddrs preserves IPFS Id', async () => {
      const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
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
    const ma = multiaddr('/ip6/::1/tcp/9091/ws')

    beforeEach(() => {
      ws = new WS()
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
      const ma = multiaddr('/ip6/::1/tcp/9091/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
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
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9091/ws')

    beforeEach(() => {
      ws = new WS()
      listener = ws.createListener(conn => pipe(conn, conn))
      return listener.listen(ma)
    })

    afterEach(() => listener.close())

    it('dial', async () => {
      const conn = await ws.dial(ma)
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([Buffer.from('hey')])
    })

    it('dial with IPFS Id', async () => {
      const ma = multiaddr('/ip4/127.0.0.1/tcp/9091/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const conn = await ws.dial(ma)
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([Buffer.from('hey')])
    })

    it('should be abortable after connect', async () => {
      const controller = new AbortController()
      const conn = await ws.dial(ma, { signal: controller.signal })
      const s = goodbye({
        source: {
          [Symbol.asyncIterator] () {
            return this
          },
          next () {
            return new Promise(resolve => {
              setTimeout(() => resolve(Math.random()), 1000)
            })
          }
        },
        sink: consume
      })

      setTimeout(() => controller.abort(), 500)

      try {
        await pipe(s, conn, s)
      } catch (err) {
        expect(err.type).to.equal('aborted')
        return
      }

      throw new Error('connection was not aborted')
    })
  })

  // TODO: https://github.com/libp2p/js-libp2p-websockets/issues/84
  describe.skip('ip6', () => {
    let ws
    let listener
    const ma = multiaddr('/ip6/::1/tcp/9091')

    beforeEach(() => {
      ws = new WS()
      listener = ws.createListener(conn => pipe(conn, conn))
      return listener.listen(ma)
    })

    afterEach(() => listener.close())

    it('dial', async () => {
      const conn = await ws.dial(ma)
      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result).to.be.eql([Buffer.from('hey')])
    })

    it('dial with IPFS Id', async () => {
      const ma = multiaddr('/ip6/::1/tcp/9091/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const conn = await ws.dial(ma)

      const s = goodbye({
        source: ['hey'],
        sink: collect
      })

      const result = await pipe(s, conn, s)
      expect(result).to.be.eql([Buffer.from('hey')])
    })
  })
})

describe('filter addrs', () => {
  let ws

  before(() => {
    ws = new WS()
  })

  describe('filter valid addrs for this transport', function () {
    it('should fail invalid WS addresses', function () {
      const ma1 = multiaddr('/ip4/127.0.0.1/tcp/9090')
      const ma2 = multiaddr('/ip4/127.0.0.1/udp/9090')
      const ma3 = multiaddr('/ip6/::1/tcp/80')
      const ma4 = multiaddr('/dnsaddr/ipfs.io/tcp/80')

      const valid = ws.filter([ma1, ma2, ma3, ma4])
      expect(valid.length).to.equal(0)
    })

    it('should filter correct ipv4 addresses', function () {
      const ma1 = multiaddr('/ip4/127.0.0.1/tcp/80/ws')
      const ma2 = multiaddr('/ip4/127.0.0.1/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct ipv4 addresses with ipfs id', function () {
      const ma1 = multiaddr('/ip4/127.0.0.1/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = multiaddr('/ip4/127.0.0.1/tcp/80/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct ipv6 address', function () {
      const ma1 = multiaddr('/ip6/::1/tcp/80/ws')
      const ma2 = multiaddr('/ip6/::1/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct ipv6 addresses with ipfs id', function () {
      const ma1 = multiaddr('/ip6/::1/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = multiaddr('/ip6/::1/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns address', function () {
      const ma1 = multiaddr('/dnsaddr/ipfs.io/ws')
      const ma2 = multiaddr('/dnsaddr/ipfs.io/tcp/80/ws')
      const ma3 = multiaddr('/dnsaddr/ipfs.io/tcp/80/wss')

      const valid = ws.filter([ma1, ma2, ma3])
      expect(valid.length).to.equal(3)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
      expect(valid[2]).to.deep.equal(ma3)
    })

    it('should filter correct dns address with ipfs id', function () {
      const ma1 = multiaddr('/dnsaddr/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = multiaddr('/dnsaddr/ipfs.io/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns4 address', function () {
      const ma1 = multiaddr('/dns4/ipfs.io/tcp/80/ws')
      const ma2 = multiaddr('/dns4/ipfs.io/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns6 address', function () {
      const ma1 = multiaddr('/dns6/ipfs.io/tcp/80/ws')
      const ma2 = multiaddr('/dns6/ipfs.io/tcp/443/wss')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter correct dns6 address with ipfs id', function () {
      const ma1 = multiaddr('/dns6/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = multiaddr('/dns6/ipfs.io/tcp/443/wss/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma2)
    })

    it('should filter mixed addresses', function () {
      const ma1 = multiaddr('/dns6/ipfs.io/tcp/80/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
      const ma2 = multiaddr('/ip4/127.0.0.1/tcp/9090')
      const ma3 = multiaddr('/ip4/127.0.0.1/udp/9090')
      const ma4 = multiaddr('/dns6/ipfs.io/ws')
      const mh5 = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw' +
        '/p2p-circuit/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

      const valid = ws.filter([ma1, ma2, ma3, ma4, mh5])
      expect(valid.length).to.equal(2)
      expect(valid[0]).to.deep.equal(ma1)
      expect(valid[1]).to.deep.equal(ma4)
    })
  })

  it('filter a single addr for this transport', (done) => {
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

    const valid = ws.filter(ma)
    expect(valid.length).to.equal(1)
    expect(valid[0]).to.deep.equal(ma)
    done()
  })
})

describe('valid Connection', () => {
  const ma = multiaddr('/ip4/127.0.0.1/tcp/9092/ws')

  it('get observed addrs', async () => {
    let dialerObsAddrs
    let listenerObsAddrs

    const ws = new WS()

    const listener = ws.createListener(async conn => {
      expect(conn).to.exist()
      dialerObsAddrs = await conn.getObservedAddrs()
      pipe(conn, conn)
    })

    await listener.listen(ma)
    const conn = await ws.dial(ma)

    await pipe([], conn, consume)

    listenerObsAddrs = await conn.getObservedAddrs()

    await listener.close()

    expect(listenerObsAddrs[0]).to.deep.equal(ma)
    expect(dialerObsAddrs.length).to.equal(0)
  })
})
