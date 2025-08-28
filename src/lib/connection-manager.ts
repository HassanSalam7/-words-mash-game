'use client'

import { GameWebSocket, createWebSocket } from './websocket'
import { io, Socket } from 'socket.io-client'

export type ConnectionType = 'websocket' | 'socketio'

export interface GameConnection {
  connect(): Promise<void>
  emit(event: string, data: any): void
  on(event: string, handler: (data: any) => void): void
  disconnect(): void
  removeAllListeners(): void
  close(): void
  get connected(): boolean
  get disconnected(): boolean
  get id(): string
}

class SocketIOWrapper implements GameConnection {
  private socket: Socket

  constructor() {
    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://words-mash-game-production.up.railway.app'
      : 'http://localhost:4567'

    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 3
    })
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket.connected) {
        resolve()
        return
      }

      this.socket.once('connect', () => resolve())
      this.socket.once('connect_error', (error) => reject(error))
      
      if (!this.socket.connected) {
        this.socket.connect()
      }
    })
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data)
  }

  on(event: string, handler: (data: any) => void) {
    this.socket.on(event, handler)
  }

  disconnect() {
    this.socket.disconnect()
  }

  removeAllListeners() {
    this.socket.removeAllListeners()
  }

  close() {
    this.socket.close()
  }

  get connected() {
    return this.socket.connected
  }

  get disconnected() {
    return this.socket.disconnected
  }

  get id() {
    return this.socket.id || 'socketio-connection'
  }
}

export function createConnection(type: ConnectionType = 'websocket'): GameConnection {
  console.log(`🔌 Creating ${type} connection...`)
  
  if (type === 'websocket') {
    return createWebSocket()
  } else {
    return new SocketIOWrapper()
  }
}

export async function createBestConnection(): Promise<GameConnection> {
  const isMobile = typeof window !== 'undefined' && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
     (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)));
  
  console.log(`🔄 Testing connection types... (Mobile: ${isMobile})`)
  
  // Try WebSocket first (preferred for mobile)
  try {
    const wsConnection = createWebSocket()
    console.log(`🔌 Attempting WebSocket connection... (Mobile optimized: ${isMobile})`)
    await wsConnection.connect()
    console.log('✅ WebSocket connection successful')
    return wsConnection
  } catch (error) {
    console.log('❌ WebSocket failed, trying Socket.IO...', error instanceof Error ? error.message : 'Unknown error')
    
    // Fallback to Socket.IO only for desktop
    if (!isMobile) {
      try {
        const socketIOConnection = new SocketIOWrapper()
        await socketIOConnection.connect()
        console.log('✅ Socket.IO connection successful')
        return socketIOConnection
      } catch (socketIOError) {
        console.error('❌ Both connection types failed')
        throw new Error('Unable to establish any connection')
      }
    } else {
      // For mobile, retry WebSocket with different strategy
      console.log('📱 Mobile device detected, retrying WebSocket...')
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        const wsRetryConnection = createWebSocket()
        await wsRetryConnection.connect()
        console.log('✅ WebSocket retry successful on mobile')
        return wsRetryConnection
      } catch (retryError) {
        console.error('❌ Mobile WebSocket retry failed')
        throw new Error('Mobile WebSocket connection failed')
      }
    }
  }
}

export function getMobileConnectionInfo() {
  if (typeof window === 'undefined') return null;
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
  
  return {
    isMobile,
    userAgent: navigator.userAgent,
    isOnline: navigator.onLine,
    touchPoints: navigator.maxTouchPoints || 0,
    connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
    platform: navigator.platform
  };
}