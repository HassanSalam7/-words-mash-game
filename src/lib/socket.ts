'use client'

import { io, Socket } from 'socket.io-client'

export function createSocket(): Socket {
  const socketUrl = process.env.NODE_ENV === 'production'
    ? 'https://words-mash-game-production.up.railway.app'
    : 'http://localhost:4567'

  console.log('Creating clean socket connection to:', socketUrl)

  return io(socketUrl, {
    // Minimal, stable configuration
    transports: ['polling', 'websocket'],
    upgrade: true,
    timeout: 20000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    autoConnect: true
  })
}