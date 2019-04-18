'use strict'

const { Adapter } = require('interface-transport')
const withIs = require('class-is')
const WebSockets = require('./')

// Legacy adapter to old transport & connection interface
class WebSocketsAdapter extends Adapter {
  constructor () {
    super(new WebSockets())
  }
}

module.exports = withIs(WebSocketsAdapter, {
  className: 'WebSockets',
  symbolName: '@libp2p/js-libp2p-websockets/websockets'
})
