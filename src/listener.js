'use strict'

const multiaddr = require('multiaddr')
const os = require('os')

const createServer = require('it-ws/server')

module.exports = (options, handler) => {
  const server = createServer(options, socket => {
    socket.getObservedAddrs = () => []
    handler(socket)
  })

  let listeningMultiaddr

  const listen = server.listen
  server.listen = ma => {
    listeningMultiaddr = ma

    if (ma.protoNames().includes('ipfs')) {
      ma = ma.decapsulate('ipfs')
    }

    return listen(ma.toOptions())
  }

  server.getAddrs = async () => {
    const multiaddrs = []
    const address = server.address()

    if (!address) {
      throw new Error('Listener is not ready yet')
    }

    let ipfsId = listeningMultiaddr.getPeerId()

    // Because TCP will only return the IPv6 version
    // we need to capture from the passed multiaddr
    if (listeningMultiaddr.toString().indexOf('ip4') !== -1) {
      let m = listeningMultiaddr.decapsulate('tcp')
      m = m.encapsulate('/tcp/' + address.port + '/ws')
      if (listeningMultiaddr.getPeerId()) {
        m = m.encapsulate('/ipfs/' + ipfsId)
      }

      if (m.toString().indexOf('0.0.0.0') !== -1) {
        const netInterfaces = os.networkInterfaces()
        Object.keys(netInterfaces).forEach((niKey) => {
          netInterfaces[niKey].forEach((ni) => {
            if (ni.family === 'IPv4') {
              multiaddrs.push(multiaddr(m.toString().replace('0.0.0.0', ni.address)))
            }
          })
        })
      } else {
        multiaddrs.push(m)
      }
    }

    return multiaddrs
  }

  return server
}
