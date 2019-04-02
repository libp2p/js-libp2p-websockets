/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const pull = require('pull-stream')
const goodbye = require('pull-goodbye')
const serializer = require('pull-serializer')

module.exports = (common) => {
  describe('dial', () => {
    let addrs
    let transport
    let listener

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

    beforeEach((done) => {
      listener = transport.createListener((conn) => {
        pull(conn, conn)
      })
      listener.listen(addrs[0], done)
    })

    afterEach((done) => {
      listener.close(done)
    })

    it('simple', (done) => {
      const s = serializer(goodbye({
        source: pull.values(['hey']),
        sink: pull.collect((err, values) => {
          expect(err).to.not.exist()
          expect(
            values
          ).to.be.eql(
            ['hey']
          )
          done()
        })
      }))

      pull(
        s,
        transport.dial(addrs[0]),
        s
      )
    })

    it('to non existent listener', (done) => {
      pull(
        transport.dial(addrs[1]),
        pull.onEnd((err) => {
          expect(err).to.exist()
          done()
        })
      )
    })
  })
}
