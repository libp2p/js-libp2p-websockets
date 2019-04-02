/* eslint max-nested-callbacks: ["error", 8] */
/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const pull = require('pull-stream')

module.exports = (common) => {
  describe('listen', () => {
    let addrs
    let transport

    before((done) => {
      common.setup((err, _transport, _addrs) => {
        if (err) return done(err)
        transport = _transport
        addrs = _addrs
        done()
      })
    })

    after((done) => {
      common.teardown(done)
    })

    it('simple', (done) => {
      const listener = transport.createListener((conn) => {})
      listener.listen(addrs[0], () => {
        listener.close(done)
      })
    })

    it('close listener with connections, through timeout', (done) => {
      const finish = plan(3, done)
      const listener = transport.createListener((conn) => {
        pull(conn, conn)
      })

      listener.listen(addrs[0], () => {
        const socket1 = transport.dial(addrs[0], () => {
          listener.close(finish)
        })

        pull(
          transport.dial(addrs[0]),
          pull.onEnd(() => {
            finish()
          })
        )

        pull(
          pull.values([Buffer.from('Some data that is never handled')]),
          socket1,
          pull.onEnd(() => {
            finish()
          })
        )
      })
    })

    describe('events', () => {
      // eslint-disable-next-line
      // TODO: figure out why it fails in the full test suite
      it.skip('connection', (done) => {
        const finish = plan(2, done)

        const listener = transport.createListener()

        listener.on('connection', (conn) => {
          expect(conn).to.exist()
          finish()
        })

        listener.listen(addrs[0], () => {
          transport.dial(addrs[0], () => {
            listener.close(finish)
          })
        })
      })

      it('listening', (done) => {
        const listener = transport.createListener()
        listener.on('listening', () => {
          listener.close(done)
        })
        listener.listen(addrs[0])
      })

      // eslint-disable-next-line
      // TODO: how to get the listener to emit an error?
      it.skip('error', (done) => {
        const listener = transport.createListener()
        listener.on('error', (err) => {
          expect(err).to.exist()
          listener.close(done)
        })
      })

      it('close', (done) => {
        const finish = plan(2, done)
        const listener = transport.createListener()
        listener.on('close', finish)

        listener.listen(addrs[0], () => {
          listener.close(finish)
        })
      })
    })
  })
}

function plan (n, done) {
  let i = 0
  return (err) => {
    if (err) return done(err)
    i++

    if (i === n) done()
  }
}
