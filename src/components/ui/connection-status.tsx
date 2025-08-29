'use client'

import { useState, useEffect } from 'react'

interface ConnectionStatusProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
}

export default function ConnectionStatus({ connectionStatus }: ConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [networkInfo, setNetworkInfo] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client-side only state to prevent hydration errors
    setIsClient(true)
    setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup listeners
    const cleanupOnlineListeners = () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // Get network information if available
    if (typeof window !== 'undefined' && 'navigator' in window) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        const updateNetworkInfo = () => {
          setNetworkInfo({
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          })
        }
        
        updateNetworkInfo()
        connection.addEventListener('change', updateNetworkInfo)
        
        return () => {
          connection.removeEventListener('change', updateNetworkInfo)
          cleanupOnlineListeners()
        }
      }
    }

    return cleanupOnlineListeners
  }, [])

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'disconnected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Reconnecting...'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}></div>
        <span>{getStatusText()}</span>
        {isMobile && (
          <span className="text-xs bg-blue-600 px-2 py-1 rounded">📱</span>
        )}
      </div>
      
      {showDetails && (
        <div className="mt-2 bg-black/90 text-white p-4 rounded-lg text-xs min-w-[250px]">
          <div className="space-y-1">
            <div><strong>Status:</strong> {getStatusText()}</div>
            <div><strong>Device:</strong> {isMobile ? 'Mobile' : 'Desktop'}</div>
            <div><strong>Online:</strong> {isOnline ? 'Yes' : 'No'}</div>
            
            {networkInfo && (
              <>
                <div><strong>Network:</strong> {networkInfo.effectiveType?.toUpperCase() || 'Unknown'}</div>
                {networkInfo.downlink && <div><strong>Speed:</strong> {networkInfo.downlink} Mbps</div>}
                {networkInfo.rtt && <div><strong>Latency:</strong> {networkInfo.rtt}ms</div>}
                {networkInfo.saveData && <div><strong>Data Saver:</strong> On</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}