'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import CallButton from '@/components/ui/call-button'

interface Player {
  id: string
  name: string
  avatar: string
  score: number
  color: string
}

interface ConversationTurn {
  character: string
  dialogue: string
}

interface GeneratedConversation {
  id: string
  topic: string
  wordCount: number
  characters: string[]
  turns: ConversationTurn[]
  createdAt: Date
}

interface MultiplayerConversationScreenProps {
  socket: any
  gameData: {
    gameId: string
    currentPlayer: Player
    opponent: Player
    gameStatus: string
    isPlayer1: boolean
  }
  onBackToHome: () => void
}

export default function MultiplayerConversationScreen({ 
  socket, 
  gameData, 
  onBackToHome 
}: MultiplayerConversationScreenProps) {
  const [gameState, setGameState] = useState<'setup' | 'generating' | 'display'>('setup')
  const [topic, setTopic] = useState('')
  const [wordCount, setWordCount] = useState(150)
  const [character1, setCharacter1] = useState('')
  const [character2, setCharacter2] = useState('')
  const [generatedConversation, setGeneratedConversation] = useState<GeneratedConversation | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  
  const isPlayer1 = gameData.isPlayer1
  const player1Name = gameData.currentPlayer.name
  const player2Name = gameData.opponent.name

  useEffect(() => {
    // Socket event listeners for real-time sync
    socket.on('conversation-generating', () => {
      setIsGenerating(true)
      setGameState('generating')
      setError('')
    })

    socket.on('conversation-generated', (data: { conversation: GeneratedConversation, gameStatus: string }) => {
      setGeneratedConversation(data.conversation)
      setIsGenerating(false)
      setGameState('display')
    })

    socket.on('conversation-error', (data: { message: string }) => {
      setError(data.message)
      setIsGenerating(false)
      setGameState('setup')
    })

    // Cleanup
    return () => {
      socket.off('conversation-generating')
      socket.off('conversation-generated')
      socket.off('conversation-error')
    }
  }, [socket])

  const generateConversation = () => {
    if (!topic.trim() || !character1.trim() || !character2.trim()) {
      setError('Please fill in all fields')
      return
    }

    setError('')
    
    // Send conversation generation request to server
    socket.emit('generate-conversation', {
      topic: topic.trim(),
      character1: character1.trim(),
      character2: character2.trim(),
      wordCount: wordCount
    })
  }

  // Waiting screen for player 2
  if (gameState === 'setup' && !isPlayer1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-4 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <Card className="p-8 sm:p-12 text-center bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl max-w-md w-full relative overflow-hidden z-10">
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-md overflow-hidden">
              <img 
                src={gameData.currentPlayer.avatar} 
                alt={gameData.currentPlayer.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-pink-500 border-b-transparent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">⏳</div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Please Wait...
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <p className="text-lg font-medium text-gray-700">{gameData.currentPlayer.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                Wait till {gameData.opponent.name} generates the conversation from the AI
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            
            <p className="text-sm text-gray-500">
              The conversation will appear automatically when ready
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Setup screen for player 1
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-4 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.7s'}}></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 p-2 bg-white/10 backdrop-blur-md rounded-full">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full p-2 shadow-lg">
                <span className="text-3xl">🎭</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              AI Conversation Generator
            </h1>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={gameData.currentPlayer.avatar} alt={gameData.currentPlayer.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-medium">{gameData.currentPlayer.name}</span>
              </div>
              <span className="text-white/80">VS</span>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={gameData.opponent.avatar} alt={gameData.opponent.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-medium">{gameData.opponent.name}</span>
              </div>
            </div>
            <p className="text-white/90 text-lg mb-6 max-w-xl mx-auto">
              Player 1, set up the conversation for both players to perform together
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Setup Form */}
            <Card className="p-6 bg-white/95 backdrop-blur-md border border-white/50 rounded-xl shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-purple-600">🎪</span> Create New Conversation
              </h2>
              
              <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">
                  Player 1 ({gameData.currentPlayer.name}) - Set up the conversation
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Fill in the details and generate the conversation for both players
                </p>
              </div>

              <div className="space-y-4">
                {/* Topic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversation Topic
                  </label>
                  <Input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Planning a vacation, Job interview, Restaurant order"
                    className="w-full"
                  />
                </div>

                {/* Characters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Character 1
                    </label>
                    <Input
                      type="text"
                      value={character1}
                      onChange={(e) => setCharacter1(e.target.value)}
                      placeholder="e.g., Sarah, Manager, Customer"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Character 2
                    </label>
                    <Input
                      type="text"
                      value={character2}
                      onChange={(e) => setCharacter2(e.target.value)}
                      placeholder="e.g., Mike, Employee, Waiter"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Word Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Words: {wordCount}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Short (50)</span>
                    <span>Medium (250)</span>
                    <span>Long (500)</span>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={generateConversation}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 text-lg font-semibold shadow-lg"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin">⏳</div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <>🎭 Generate Conversation</>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Generating screen
  if (gameState === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-4 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <Card className="p-8 sm:p-12 text-center bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl max-w-md w-full relative overflow-hidden z-10">
          <div className="relative z-10">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-pink-500 border-b-transparent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🎭</div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Creating Conversation...
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <p className="text-lg font-medium text-gray-700">"{topic}"</p>
              <p className="text-sm text-gray-600 mt-1">
                {character1 || 'Character 1'} & {character2 || 'Character 2'}
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              AI is generating your dialogue...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Display conversation
  if (gameState === 'display' && generatedConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-2 sm:p-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-4xl mx-auto h-full relative z-10">
          {/* Header */}
          <div className="text-center mb-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">"{generatedConversation.topic}"</h1>
            <p className="text-white/80 mb-4">
              {generatedConversation.characters.join(' & ')} • {generatedConversation.turns.length} turns
            </p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={gameData.currentPlayer.avatar} alt={gameData.currentPlayer.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-medium">{gameData.currentPlayer.name}</span>
              </div>
              <span className="text-white/80">and</span>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={gameData.opponent.avatar} alt={gameData.opponent.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-medium">{gameData.opponent.name}</span>
              </div>
            </div>
            <p className="text-white/80 text-sm">
              Both players can see the same conversation
            </p>
          </div>

          {/* Conversation Display */}
          <Card className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {generatedConversation.turns.map((turn, index) => (
                  <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-4 rounded-lg ${
                      index % 2 === 0 
                        ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' 
                        : 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800'
                    }`}>
                      <div className="font-bold text-sm mb-1">{turn.character}</div>
                      <div className="text-base leading-relaxed">{turn.dialogue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Call Button */}
        <CallButton
          gameId={gameData.gameId}
          currentPlayer={gameData.currentPlayer}
          opponent={gameData.opponent}
          socket={socket}
        />
      </div>
    )
  }

  return null
}