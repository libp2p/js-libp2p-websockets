/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const multiaddr = require('multiaddr')
const pipe = require('it-pipe')
const goodbye = require('it-goodbye')
const { collect, take } = require('streaming-iterables')

const WS = require('../src')

describe('libp2p-websockets', () => {
  const ma = multiaddr('/ip4/127.0.0.1/tcp/9095/ws')
  let ws
  let conn

  beforeEach(async () => {
    ws = new WS()
    conn = await ws.dial(ma)
  })

  it('echo', async () => {
    const message = Buffer.from('Hello World!')
    const s = goodbye({ source: [message], sink: collect })

    const results = await pipe(s, conn, s)
    expect(results).to.eql([message])
  })

  describe('stress', () => {
    it('one big write', async () => {
      const rawMessage = Buffer.allocUnsafe(1000000).fill('a')

      const s = goodbye({ source: [rawMessage], sink: collect })

      const results = await pipe(s, conn, s)
      expect(results).to.eql([rawMessage])
    })

    it('many writes', async function () {
      this.timeout(100000)
      const s = goodbye({
        source: pipe(
          {
            [Symbol.iterator] () { return this },
            next: () => ({ done: false, value: Buffer.from(Math.random().toString()) })
          },
          take(20000)
        ),
        sink: collect
      })

      const result = await pipe(s, conn, s)
      expect(result).to.have.length(20000)
    })
  })

  it('.createServer throws in browser', () => {
    expect(new WS().createListener).to.throw()
  })
})
