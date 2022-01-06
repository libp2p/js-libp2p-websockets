import { EventEmitter } from 'events'
import os from 'os'
import { Multiaddr, protocols } from '@multiformats/multiaddr'
import { createServer } from 'it-ws/server'
import debug from 'debug'
import { socketToMaConn } from './socket-to-conn.js'
import { ipPortToMultiaddr as toMultiaddr } from '@libp2p/utils/ip-port-to-multiaddr'
import type { ListenerOptions, Upgrader, Listener } from '@libp2p/interfaces/transport'
import type { Server } from 'http'
import type { WebSocketServer } from 'it-ws/server'
import type { DuplexWebSocket } from 'it-ws/duplex'

const log = Object.assign(debug('libp2p:websockets:listener'), {
  error: debug('libp2p:websockets:listener:error')
})

export interface WebSocketListenerOptions extends ListenerOptions {
  server?: Server
}

export function createListener (upgrader: Upgrader, options?: WebSocketListenerOptions): Listener {
  options = options ?? {}
  let server: WebSocketServer // eslint-disable-line prefer-const
  let listeningMultiaddr: Multiaddr
  // Keep track of open connections to destroy when the listener is closed
  const connections = new Set<DuplexWebSocket>()

  const listener: Listener = Object.assign(new EventEmitter(), {
    close: async () => {
      await Promise.all(
        Array.from(connections).map(async maConn => await maConn.close())
      )

      if (server.address() == null) {
        // not listening, close will throw an error
        return
      }

      return await server.close()
    },
    listen: async (ma: Multiaddr) => {
      listeningMultiaddr = ma

      await server.listen(ma.toOptions())
    },
    getAddrs: () => {
      const multiaddrs = []
      const address = server.address()

      if (address == null) {
        throw new Error('Listener is not ready yet')
      }

      if (typeof address === 'string') {
        throw new Error('Wrong address type received - expected AddressInfo, got string - are you trying to listen on a unix socket?')
      }

      const ipfsId = listeningMultiaddr.getPeerId()
      const protos = listeningMultiaddr.protos()

      // Because TCP will only return the IPv6 version
      // we need to capture from the passed multiaddr
      if (protos.some(proto => proto.code === protocols('ip4').code)) {
        const wsProto = protos.some(proto => proto.code === protocols('ws').code) ? '/ws' : '/wss'
        let m = listeningMultiaddr.decapsulate('tcp')
        m = m.encapsulate(`/tcp/${address.port}${wsProto}`)
        if (ipfsId != null) {
          m = m.encapsulate(`/p2p/${ipfsId}`)
        }

        if (m.toString().includes('0.0.0.0')) {
          const netInterfaces = os.networkInterfaces()
          Object.values(netInterfaces).forEach(niInfos => {
            if (niInfos == null) {
              return
            }

            niInfos.forEach(ni => {
              if (ni.family === 'IPv4') {
                multiaddrs.push(new Multiaddr(m.toString().replace('0.0.0.0', ni.address)))
              }
            })
          })
        } else {
          multiaddrs.push(m)
        }
      }

      return multiaddrs
    }
  })

  server = createServer({
    ...options,
    onConnection: (stream: DuplexWebSocket) => {
      const maConn = socketToMaConn(stream, toMultiaddr(stream.remoteAddress ?? '', stream.remotePort ?? 0))
      log('new inbound connection %s', maConn.remoteAddr)

      connections.add(stream)

      stream.socket.on('close', function () {
        connections.delete(stream)
      })

      try {
        void upgrader.upgradeInbound(maConn)
          .then((conn) => {
            log('inbound connection %s upgraded', maConn.remoteAddr)

            if (options?.handler != null) {
              options?.handler(conn)
            }

            listener.emit('connection', conn)
          })
          .catch(async err => {
            log.error('inbound connection failed to upgrade', err)

            await maConn.close().catch(err => {
              log.error('inbound connection failed to close after upgrade failed', err)
            })
          })
      } catch (err) {
        log.error('inbound connection failed to upgrade', err)
        maConn.close().catch(err => {
          log.error('inbound connection failed to close after upgrade failed', err)
        })
      }
    }
  })

  server
    .on('listening', () => listener.emit('listening'))
    .on('error', (err: Error) => listener.emit('error', err))
    .on('close', () => listener.emit('close'))

  return listener
}
