'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { ArrowLeft } from 'lucide-react'

interface WaitingRoomProps {
  playerName: string
  waitingPlayers: Array<{name: string, avatar: string}>
  onGameStart: () => void
  onBack: () => void
}

export default function WaitingRoom({ playerName, waitingPlayers, onGameStart, onBack }: WaitingRoomProps) {
  const [isWaiting, setIsWaiting] = useState(true)

  useEffect(() => {
    // Update waiting status based on players list
    setIsWaiting(waitingPlayers.length < 2)
  }, [waitingPlayers])

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl p-8 bg-white/90 backdrop-blur-sm shadow-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Game Lobby
          </h1>
          {isWaiting ? (
            <p className="text-gray-600 text-lg">
              🔍 Looking for your opponent...
            </p>
          ) : (
            <p className="text-green-600 text-lg font-semibold">
              ✅ Opponent found! Starting game...
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Players in Room
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waitingPlayers.map((player, index) => (
                <div key={index} className="flex items-center space-x-4 bg-white/70 rounded-lg p-4">
                  <PlayerAvatar avatar={player.avatar} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-800">{player.name}</p>
                    <p className="text-sm text-gray-500">
                      {player.name === playerName ? 'You' : 'Player'}
                    </p>
                  </div>
                  {player.name === playerName && (
                    <div className="ml-auto">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {isWaiting && waitingPlayers.length === 1 && (
                <div className="flex items-center space-x-4 bg-gray-100 rounded-lg p-4 opacity-60">
                  <div className="text-3xl animate-pulse">❓</div>
                  <div>
                    <p className="font-semibold text-gray-600">Waiting for player...</p>
                    <p className="text-sm text-gray-500">Finding opponent</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isWaiting && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">
                This usually takes just a few seconds...
              </p>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-800 mb-3">🎯 Game Rules:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Both players get the same 5 random English words</li>
              <li>• Create a short story using ALL words in 10 minutes</li>
              <li>• Be creative, funny, or dramatic - it's your choice!</li>
              <li>• React with emojis when stories are revealed</li>
              <li>• No winners or losers - just fun and creativity!</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}