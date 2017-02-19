/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const multiaddr = require('multiaddr')
const pull = require('pull-stream')
const goodbye = require('pull-goodbye')

const WS = require('../src')

require('./compliance.node')

describe('instantiate the transport', () => {
  it('create', () => {
    const ws = new WS()
    expect(ws).to.exist
  })
})

describe('listen', () => {
  let ws
  const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws')

  beforeEach(() => {
    ws = new WS()
  })

  it('listen, check for callback', (done) => {
    const listener = ws.createListener((conn) => {
    })
    listener.listen(ma, () => {
      listener.close(done)
    })
  })

  it('listen, check for listening event', (done) => {
    const listener = ws.createListener((conn) => {
    })
    listener.on('listening', () => {
      listener.close(done)
    })
    listener.listen(ma)
  })

  it('listen, check for the close event', (done) => {
    const listener = ws.createListener((conn) => {
    })
    listener.on('listening', () => {
      listener.on('close', done)
      listener.close()
    })
    listener.listen(ma)
  })

  it('listen on addr with /ipfs/QmHASH', (done) => {
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
    const listener = ws.createListener((conn) => {
    })
    listener.listen(ma, () => {
      listener.close(done)
    })
  })

  it.skip('close listener with connections, through timeout', (done) => {
    // TODO `ws` closes all anyway, we need to make it not close
    // first - https://github.com/diasdavid/simple-websocket-server
  })

  it.skip('listen on port 0', (done) => {
    // TODO port 0 not supported yet
  })
  it.skip('listen on IPv6 addr', (done) => {
    // TODO IPv6 not supported yet
  })

  it.skip('listen on any Interface', (done) => {
    // TODO 0.0.0.0 not supported yet
  })

  it('getAddrs', (done) => {
    const listener = ws.createListener((conn) => {
    })
    listener.listen(ma, () => {
      listener.getAddrs((err, addrs) => {
        expect(err).to.not.exist
        expect(addrs.length).to.equal(1)
        expect(addrs[0]).to.deep.equal(ma)
        listener.close(done)
      })
    })
  })

  it.skip('getAddrs on port 0 listen', (done) => {
    // TODO port 0 not supported yet
  })

  it.skip('getAddrs from listening on 0.0.0.0', (done) => {
    // TODO 0.0.0.0 not supported yet
  })

  it.skip('getAddrs from listening on 0.0.0.0 and port 0', (done) => {
    // TODO 0.0.0.0 or port 0 not supported yet
  })

  it('getAddrs preserves IPFS Id', (done) => {
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

    const listener = ws.createListener((conn) => {
    })
    listener.listen(ma, () => {
      listener.getAddrs((err, addrs) => {
        expect(err).to.not.exist
        expect(addrs.length).to.equal(1)
        expect(addrs[0]).to.deep.equal(ma)
        listener.close(done)
      })
    })
  })
})

describe('dial', () => {
  let ws
  let listener
  const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws')

  beforeEach((done) => {
    ws = new WS()
    listener = ws.createListener((conn) => {
      pull(conn, conn)
    })
    listener.listen(ma, done)
  })

  afterEach((done) => {
    listener.close(done)
  })

  it('dial on IPv4', (done) => {
    const conn = ws.dial(ma)

    const s = goodbye({
      source: pull.values(['hey']),
      sink: pull.collect((err, result) => {
        expect(err).to.not.exist

        expect(result).to.be.eql(['hey'])
        done()
      })
    })

    pull(s, conn, s)
  })

  it.skip('dial on IPv6', (done) => {
    // TODO IPv6 not supported yet
  })

  it('dial on IPv4 with IPFS Id', (done) => {
    const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
    const conn = ws.dial(ma)

    const s = goodbye({
      source: pull.values(['hey']),
      sink: pull.collect((err, result) => {
        expect(err).to.not.exist

        expect(result).to.be.eql(['hey'])
        done()
      })
    })

    pull(s, conn, s)
  })
})

describe('filter addrs', () => {
  let ws

  before(() => {
    ws = new WS()
  })

  it('filter valid addrs for this transport', (done) => {
    const mh1 = multiaddr('/ip4/127.0.0.1/tcp/9090')
    const mh2 = multiaddr('/ip4/127.0.0.1/udp/9090')
    const mh3 = multiaddr('/ip4/127.0.0.1/tcp/9090/ws')
    const mh4 = multiaddr('/ip4/127.0.0.1/tcp/9090/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')
    const mh5 = multiaddr('/dns/ipfs.io/ws')
    const mh6 = multiaddr('/dns/ipfs.io/ws/ipfs/Qmb6owHp6eaWArVbcJJbQSyifyJBttMMjYV76N2hMbf5Vw')

    const valid = ws.filter([mh1, mh2, mh3, mh4, mh5, mh6])
    expect(valid.length).to.equal(4)
    expect(valid[0]).to.deep.equal(mh3)
    expect(valid[1]).to.deep.equal(mh4)
    expect(valid[2]).to.deep.equal(mh5)
    expect(valid[3]).to.deep.equal(mh6)
    done()
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
  const ma = multiaddr('/ip4/127.0.0.1/tcp/9090/ws')

  it('get observed addrs', (done) => {
    let dialerObsAddrs
    let listenerObsAddrs

    const ws = new WS()

    const listener = ws.createListener((conn) => {
      expect(conn).to.exist

      conn.getObservedAddrs((err, addrs) => {
        expect(err).to.not.exist
        dialerObsAddrs = addrs
      })

      pull(conn, conn)
    })

    listener.listen(ma, () => {
      const conn = ws.dial(ma)

      pull(
        pull.empty(),
        conn,
        pull.onEnd(onEnd)
      )

      function onEnd () {
        conn.getObservedAddrs((err, addrs) => {
          expect(err).to.not.exist
          listenerObsAddrs = addrs

          listener.close(onClose)
          function onClose () {
            expect(listenerObsAddrs[0]).to.deep.equal(ma)
            expect(dialerObsAddrs.length).to.equal(0)
            done()
          }
        })
      }
    })
  })

  it('get Peer Info', (done) => {
    const ws = new WS()

    const listener = ws.createListener((conn) => {
      expect(conn).to.exist

      conn.getPeerInfo((err, peerInfo) => {
        expect(err).to.exist
      })

      pull(conn, conn)
    })

    listener.listen(ma, () => {
      const conn = ws.dial(ma)

      pull(
        pull.empty(),
        conn,
        pull.onEnd(onEnd)
      )

      function onEnd () {
        conn.getPeerInfo((err, peerInfo) => {
          expect(err).to.exit
          listener.close(done)
        })
      }
    })
  })

  it('set Peer Info', (done) => {
    const ws = new WS()

    const listener = ws.createListener((conn) => {
      expect(conn).to.exist
      conn.setPeerInfo('a')

      conn.getPeerInfo((err, peerInfo) => {
        expect(err).to.not.exist
        expect(peerInfo).to.equal('a')
      })

      pull(conn, conn)
    })

    listener.listen(ma, onListen)
    function onListen () {
      const conn = ws.dial(ma)
      conn.setPeerInfo('b')

      pull(
        pull.empty(),
        conn,
        pull.onEnd(onEnd)
      )

      function onEnd () {
        conn.getPeerInfo((err, peerInfo) => {
          expect(err).to.not.exist
          expect(peerInfo).to.equal('b')
          listener.close(done)
        })
      }
    }
  })
})

describe.skip('turbolence', () => {
  it('dialer - emits error on the other end is terminated abruptly', (done) => {
  })
  it('listener - emits error on the other end is terminated abruptly', (done) => {
  })
})
