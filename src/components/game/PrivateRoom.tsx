'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { PlayerAvatar } from '@/components/ui/player-avatar'

interface PrivateRoomProps {
  roomCode: string
  players: Array<{name: string, avatar: string}>
  isHost: boolean
  onLeaveRoom: () => void
}

export default function PrivateRoom({ roomCode, players, isHost, onLeaveRoom }: PrivateRoomProps) {
  const [shareMessage, setShareMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const shareableLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?room=${roomCode}`
    : `Room Code: ${roomCode}`

  const handleShare = async () => {
    const shareText = `🎮 Join my WordMash Battle room!\n\nRoom Code: ${roomCode}\nLink: ${shareableLink}\n\nCreate stories with random words and have fun! 🚀`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WordMash Battle - Join My Room',
          text: shareText,
          url: shareableLink
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Private Room
          </h1>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Room Code</p>
            <p className="text-3xl font-mono font-bold text-purple-600 tracking-wider">
              {roomCode}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Players ({players.length}/2)
          </h3>
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <PlayerAvatar avatar={player.avatar} size="md" />
                </Avatar>
                <span className="font-medium text-gray-800">{player.name}</span>
                {index === 0 && isHost && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full ml-auto">
                    HOST
                  </span>
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-xl">👤</span>
                </div>
                <span className="text-gray-500">Waiting for player...</span>
              </div>
            )}
          </div>
        </div>

        {players.length < 2 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Share Room
            </h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={shareableLink}
                  readOnly
                  className="flex-1 text-sm bg-gray-50"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="px-4"
                >
                  {copied ? '✅' : '📋'}
                </Button>
              </div>
              <Button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                📤 Share Room
              </Button>
            </div>
          </div>
        )}

        {players.length === 2 && (
          <div className="mb-6 text-center">
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="text-green-600 text-2xl mb-2">🎉</div>
              <p className="text-green-700 font-medium">Room is full!</p>
              <p className="text-green-600 text-sm">Game will start automatically...</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={onLeaveRoom}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            🚪 Leave Room
          </Button>
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-500 space-y-1">
            <p>🔗 Share the room code or link with your friend</p>
            <p>⚡ Game starts when both players join</p>
            <p>🎮 Have fun creating stories together!</p>
          </div>
        </div>
      </Card>
    </div>
  )
}