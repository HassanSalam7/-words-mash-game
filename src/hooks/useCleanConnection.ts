'use client'

import { useState, useEffect } from 'react'
import { GameConnection } from '@/lib/connection-manager'
import { createWebSocket } from '@/lib/websocket'
import { createiPhoneConnection } from '@/lib/iphone-connection'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export function useCleanConnection() {
  const [socket, setSocket] = useState<GameConnection | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    let connection: GameConnection | null = null
    let cleanup: (() => void) | null = null

    const setupConnection = async () => {
      try {
        console.log('🔌 Setting up clean connection...')
        setConnectionStatus('connecting')

        // Detect iPhone/iOS
        const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent) || 
                         window.location.search.includes('iphone=true') ||
                         localStorage.getItem('forceIOSMode') === 'true'

        if (isIPhone) {
          console.log('📱 iPhone detected - using iPhone connection manager')
          connection = await createiPhoneConnection({
            onConnect: () => {
              console.log('✅ iPhone connected')
              setConnectionStatus('connected')
            },
            onDisconnect: (reason) => {
              console.log('📱 iPhone disconnected:', reason)
              setConnectionStatus('disconnected')
            },
            onError: (error) => {
              console.error('📱 iPhone connection error:', error)
              setConnectionStatus('disconnected')
            },
            onStatusChange: (status) => {
              setConnectionStatus(status)
            }
          })
        } else {
          console.log('💻 Standard device - using WebSocket')
          connection = createWebSocket()
          
          // Setup event handlers
          connection.on('connect', () => {
            console.log('✅ Standard connection established')
            setConnectionStatus('connected')
          })
          
          connection.on('disconnect', () => {
            console.log('❌ Standard connection disconnected')
            setConnectionStatus('disconnected')
          })
          
          connection.on('connect_error', (error: any) => {
            console.error('❌ Standard connection error:', error)
            setConnectionStatus('disconnected')
          })
          
          await connection.connect()
        }

        setSocket(connection)
        
        // Make globally available
        if (typeof window !== 'undefined') {
          (window as any).socket = connection
        }

        console.log('✅ Connection setup complete')

      } catch (error) {
        console.error('❌ Connection setup failed:', error)
        setConnectionStatus('disconnected')
      }
    }

    setupConnection()

    // Cleanup function
    cleanup = () => {
      console.log('🧹 Cleaning up connection')
      if (connection) {
        connection.removeAllListeners()
        connection.disconnect()
      }
    }

    return cleanup
  }, [isClient])

  return {
    socket,
    connectionStatus,
    isClient
  }
}