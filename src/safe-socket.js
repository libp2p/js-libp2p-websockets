'use strict'

const pull = require('pull-stream')
function toBuffer (data) {
  if (Buffer.isBuffer(data)) return data
  try {
    return Buffer.from(data)
  } catch (e) {
    return Buffer.from('')
  }
}

function safe (conn) {
  return {
    sink: pull(
      pull.map(toBuffer),
      conn.sink
    ),
    source: pull(
      conn.source,
      pull.map(toBuffer)
    )
  }
}

module.exports = safe
