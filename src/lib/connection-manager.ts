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
  
  const isIOS = typeof window !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
     (navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)));
  
  console.log(`🔄 Testing connection types... (Mobile: ${isMobile}, iOS: ${isIOS})`)
  
  // iOS specific connection strategy
  if (isIOS) {
    console.log('🍎 iOS detected - using iOS-optimized connection strategy')
    
    // Try multiple connection attempts for iOS
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🍎 iOS WebSocket attempt ${attempt}/3...`)
        const wsConnection = createWebSocket()
        await wsConnection.connect()
        console.log('✅ iOS WebSocket connection successful')
        return wsConnection
      } catch (error) {
        console.log(`❌ iOS WebSocket attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error')
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Progressive delay
        }
      }
    }
    
    // If all WebSocket attempts fail on iOS, try Socket.IO as fallback
    try {
      console.log('🍎 iOS WebSocket failed, trying Socket.IO fallback...')
      const socketIOConnection = new SocketIOWrapper()
      await socketIOConnection.connect()
      console.log('✅ iOS Socket.IO fallback successful')
      return socketIOConnection
    } catch (socketIOError) {
      console.error('❌ All iOS connection attempts failed')
      throw new Error('Unable to establish iOS connection')
    }
  }
  
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