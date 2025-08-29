'use client'

import { useState, useEffect } from 'react'

export function iPhoneWarning() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const isIPhone = /iPhone|iPad/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    if (isIPhone && isSafari) {
      setShowWarning(true)
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md text-center">
        <div className="text-6xl mb-4">🍎</div>
        <h2 className="text-xl font-bold mb-4">iPhone Safari Issue</h2>
        <p className="text-gray-600 mb-6">
          This game has connection issues with iPhone Safari. For the best experience:
        </p>
        
        <div className="space-y-3 text-left mb-6">
          <div className="flex items-center gap-2">
            <span>🔄</span>
            <span>Install Chrome on your iPhone</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💻</span>
            <span>Use a PC or Android device</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📱</span>
            <span>Or continue with limited experience</span>
          </div>
        </div>

        <div className="space-y-2">
          <a 
            href="https://apps.apple.com/app/google-chrome/id535886823"
            className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            target="_blank"
          >
            Download Chrome
          </a>
          <button 
            onClick={() => setShowWarning(false)}
            className="block w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  )
}