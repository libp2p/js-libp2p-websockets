/* eslint-env mocha */
'use strict'

const dial = require('./dial-test')
const listen = require('./listen-test')

module.exports = (common) => {
  describe('interface-transport', () => {
    dial(common)
    listen(common)
  })
}
