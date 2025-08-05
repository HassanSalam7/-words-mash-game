'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import GameModeSelector, { GameMode } from './GameModeSelector'

interface EntryScreenProps {
  onStartGame: (playerName: string, avatar: string, gameMode: GameMode['id']) => void
  onCreatePrivateRoom: (playerName: string, avatar: string, gameMode: GameMode['id']) => void
  onJoinPrivateRoom: (playerName: string, avatar: string, roomCode: string, gameMode: GameMode['id']) => void
}

export default function EntryScreen({ onStartGame, onCreatePrivateRoom, onJoinPrivateRoom }: EntryScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('👤')
  const [isJoining, setIsJoining] = useState(false)
  const [mode, setMode] = useState<'random' | 'create' | 'join'>('random')
  const [roomCode, setRoomCode] = useState('')
  const [gameMode, setGameMode] = useState<GameMode['id']>('story-writing')

  useEffect(() => {
    // Check for room parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const roomParam = urlParams.get('room')
      if (roomParam) {
        setMode('join')
        setRoomCode(roomParam.toUpperCase())
      }
    }
  }, [])

  const avatars = ['👤', '😊', '😎', '🤖', '👨‍💻', '👩‍💻', '🎮', '🚀', '🌟', '🔥', '💎', '🦄', '🐱', '🐶', '🦊', '🐸']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim() && !isJoining) {
      setIsJoining(true)
      
      if (mode === 'random') {
        onStartGame(playerName.trim(), selectedAvatar, gameMode)
      } else if (mode === 'create') {
        onCreatePrivateRoom(playerName.trim(), selectedAvatar, gameMode)
      } else if (mode === 'join') {
        if (roomCode.trim()) {
          onJoinPrivateRoom(playerName.trim(), selectedAvatar, roomCode.trim().toUpperCase(), gameMode)
        } else {
          setIsJoining(false)
          return
        }
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            WordMash Battle
          </h1>
          <p className="text-gray-600 text-lg">
            🎮 Random Word Challenge
          </p>
          <p className="text-gray-500 mt-2">
            Create stories, practice English, have fun!
          </p>
        </div>

        <GameModeSelector 
          selectedMode={gameMode}
          onModeChange={setGameMode}
        />

        <div className="mb-6">
          <div className="flex rounded-lg border-2 border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setMode('random')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'random'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎲 Random Match
            </button>
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'create'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏠 Create Room
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'join'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔑 Join Room
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your name
            </label>
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name here..."
              className="w-full text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>

          {mode === 'join' && (
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <Input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code..."
                className="w-full text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-center font-mono tracking-wider"
                maxLength={6}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose your avatar
            </label>
            <div className="grid grid-cols-4 gap-3">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`text-2xl p-3 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    selectedAvatar === avatar
                      ? 'border-purple-500 bg-purple-100 scale-110 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isJoining || (mode === 'join' && !roomCode.trim())}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                {mode === 'random' && 'Joining Game...'}
                {mode === 'create' && 'Creating Room...'}
                {mode === 'join' && 'Joining Room...'}
              </>
            ) : (
              <>
                {mode === 'random' && '🚀 Start Random Match'}
                {mode === 'create' && '🏠 Create Private Room'}
                {mode === 'join' && '🔑 Join Private Room'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <div className="text-sm text-gray-500 space-y-1">
            <p>✨ No signup required</p>
            <p>⚡ Instant access</p>
            <p>🌍 Practice English creatively</p>
          </div>
        </div>
      </Card>
    </div>
  )
}