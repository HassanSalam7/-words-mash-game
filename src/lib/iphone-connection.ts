'use client'

import { GameConnection, createBestConnection } from './connection-manager'
import { createWebSocket, GameWebSocket } from './websocket'

export interface iPhoneConnectionOptions {
  onConnect: () => void
  onDisconnect: (reason: string) => void
  onError: (error: any) => void
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void
}

export class iPhoneConnectionManager {
  private connection: GameConnection | null = null
  private options: iPhoneConnectionOptions
  private retryCount = 0
  private maxRetries = 3

  constructor(options: iPhoneConnectionOptions) {
    this.options = options
    console.log('📱 iPhone Connection Manager initialized')
  }

  // Force iOS mode detection
  private detectiPhone(): boolean {
    const userAgent = navigator.userAgent
    const checks = {
      userAgent: /iPhone|iPad|iPod/.test(userAgent),
      safari: /Safari/.test(userAgent) && !/Chrome|CriOS/.test(userAgent),
      mobile: /Mobile/.test(userAgent),
      touch: 'ontouchstart' in window && navigator.maxTouchPoints > 0,
      standalone: (navigator as any).standalone !== undefined,
      forceParam: window.location.search.includes('iphone=true') || 
                  window.location.search.includes('ios=true'),
      localStorage: localStorage.getItem('forceIOSMode') === 'true'
    }

    const isIPhone = checks.userAgent || checks.forceParam || checks.localStorage || 
                     (checks.safari && checks.mobile && checks.touch)

    console.log('📱 iPhone Detection:', { ...checks, result: isIPhone })
    return isIPhone
  }

  // Method 1: Enhanced WebSocket with forced iOS optimizations
  private async tryEnhancedWebSocket(): Promise<GameConnection> {
    console.log('📱 Method 1: Enhanced WebSocket with iOS optimizations')
    
    const socket = createWebSocket() as any
    
    // Force iOS mode manually on the socket
    if (socket.isIOS !== undefined) {
      socket.isIOS = true
      console.log('🍎 Forced iOS mode on WebSocket')
    }

    // Add iPhone-specific settings
    if (socket.pingInterval) {
      clearInterval(socket.pingInterval)
      socket.pingInterval = setInterval(() => {
        if (socket.ws && socket.ws.readyState === WebSocket.OPEN) {
          socket.ws.send(JSON.stringify({ type: 'ping', data: {} }))
          console.log('🏓 iPhone ping (10s interval)')
        }
      }, 10000) // Very frequent pings for iPhone
    }

    await socket.connect()
    return socket
  }

  // Method 2: Socket.IO fallback
  private async trySocketIO(): Promise<GameConnection> {
    console.log('📱 Method 2: Socket.IO fallback for iPhone')
    return await createBestConnection()
  }

  // Method 3: Basic WebSocket as last resort
  private async tryBasicWebSocket(): Promise<GameConnection> {
    console.log('📱 Method 3: Basic WebSocket (last resort)')
    const socket = createWebSocket()
    await socket.connect()
    return socket
  }

  // Main connection method with multiple fallbacks
  async connect(): Promise<GameConnection> {
    if (!this.detectiPhone()) {
      console.log('📱 Not iPhone, using standard connection')
      return await this.tryBasicWebSocket()
    }

    this.options.onStatusChange('connecting')
    console.log('📱 iPhone detected - starting connection sequence...')

    const methods = [
      { name: 'Enhanced WebSocket', fn: () => this.tryEnhancedWebSocket() },
      { name: 'Socket.IO', fn: () => this.trySocketIO() },
      { name: 'Basic WebSocket', fn: () => this.tryBasicWebSocket() }
    ]

    for (const method of methods) {
      try {
        console.log(`📱 Trying: ${method.name}`)
        const connection = await method.fn()
        
        this.connection = connection
        this.setupEventHandlers(connection)
        
        console.log(`✅ iPhone connected via ${method.name}`)
        this.options.onConnect()
        this.options.onStatusChange('connected')
        
        return connection
      } catch (error) {
        console.log(`❌ ${method.name} failed:`, error)
        continue
      }
    }

    // All methods failed
    const errorMsg = 'All iPhone connection methods failed'
    console.error('📱 ' + errorMsg)
    this.options.onError(new Error(errorMsg))
    this.options.onStatusChange('disconnected')
    throw new Error(errorMsg)
  }

  private setupEventHandlers(connection: GameConnection) {
    connection.on('disconnect', (data: any) => {
      console.log('📱 iPhone disconnected:', data?.reason)
      this.options.onDisconnect(data?.reason || 'Unknown')
      this.options.onStatusChange('disconnected')
      
      // Auto-retry for iPhone
      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        console.log(`📱 iPhone auto-retry ${this.retryCount}/${this.maxRetries}`)
        setTimeout(() => this.connect(), 2000)
      }
    })

    connection.on('connect_error', (error: any) => {
      console.error('📱 iPhone connection error:', error)
      this.options.onError(error)
      this.options.onStatusChange('disconnected')
    })

    connection.on('connect', () => {
      console.log('📱 iPhone connected successfully')
      this.retryCount = 0 // Reset retry count on successful connection
      this.options.onConnect()
      this.options.onStatusChange('connected')
    })
  }

  disconnect() {
    if (this.connection) {
      console.log('📱 Disconnecting iPhone connection')
      this.connection.disconnect()
      this.connection = null
    }
  }

  getConnection(): GameConnection | null {
    return this.connection
  }
}

// Helper function to create iPhone connection
export async function createiPhoneConnection(options: iPhoneConnectionOptions): Promise<GameConnection> {
  const manager = new iPhoneConnectionManager(options)
  return await manager.connect()
}

// Quick setup function for the main app
export function enableiPhoneMode() {
  localStorage.setItem('forceIOSMode', 'true')
  console.log('📱 iPhone mode enabled - refresh to activate')
  alert('iPhone mode enabled! Please refresh the page.')
}

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).enableiPhoneMode = enableiPhoneMode
}