'use client'

import { useState, useRef, useEffect } from 'react'
import { useGenerateConversation } from '@/lib/hooks/useGameData'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import CallButton from '@/components/ui/call-button'

interface ConversationGeneratorScreenProps {
  onBackToHome: () => void
  isMultiplayer?: boolean
  currentPlayer?: 1 | 2
  onConversationGenerated?: (conversation: GeneratedConversation) => void
  waitingForGeneration?: boolean
  player1Name?: string
  player2Name?: string
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

export default function ConversationGeneratorScreen({ 
  onBackToHome, 
  isMultiplayer = false, 
  currentPlayer = 1, 
  onConversationGenerated,
  waitingForGeneration = false,
  player1Name = "Player 1",
  player2Name = "Player 2"
}: ConversationGeneratorScreenProps) {
  const [gameState, setGameState] = useState<'setup' | 'generating' | 'display'>('setup')
  const [topic, setTopic] = useState('')
  const [wordCount, setWordCount] = useState(150)
  const [character1, setCharacter1] = useState(isMultiplayer ? player1Name : '')
  const [character2, setCharacter2] = useState(isMultiplayer ? player2Name : '')
  const [generatedConversation, setGeneratedConversation] = useState<GeneratedConversation | null>(null)
  const [savedConversations, setSavedConversations] = useState<GeneratedConversation[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  
  // Use React Query mutation for conversation generation
  const generateConversationMutation = useGenerateConversation({
    onSuccess: (data) => {
      setGeneratedConversation(data)
      setIsGenerating(false)
      setGameState('display')
      
      // Save to localStorage
      const saved = localStorage.getItem('ai-conversations')
      const conversations = saved ? JSON.parse(saved) : []
      conversations.unshift(data)
      localStorage.setItem('ai-conversations', JSON.stringify(conversations.slice(0, 10)))
      setSavedConversations(conversations.slice(0, 10))
    },
    onError: (error) => {
      console.error('Conversation generation failed:', error)
      setError('Failed to generate conversation. Please try again.')
      setIsGenerating(false)
      setGameState('setup')
    }
  })

  // Load saved conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-conversations')
    if (saved) {
      try {
        const conversations = JSON.parse(saved).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt)
        }))
        setSavedConversations(conversations)
      } catch (error) {
        console.error('Error loading conversations:', error)
      }
    }
  }, [])

  // Save conversation to localStorage
  const saveConversation = (conversation: GeneratedConversation) => {
    const updated = [conversation, ...savedConversations.slice(0, 9)] // Keep latest 10
    setSavedConversations(updated)
    localStorage.setItem('ai-conversations', JSON.stringify(updated))
  }


  // Generate conversation using React Query mutation
  const generateConversation = async () => {
    console.log('🎭 Generate conversation clicked!', { topic, character1, character2, wordCount })
    
    if (!topic.trim() || !character1.trim() || !character2.trim()) {
      console.log('❌ Validation failed - missing fields')
      setError('Please fill in all fields')
      return
    }

    console.log('✅ Validation passed, starting generation...')
    setIsGenerating(true)
    setError('')
    setGameState('generating')

    // The mutation handles the API call and success/error states
    console.log('📡 Calling mutation with:', {
      topic,
      wordCount,
      characters: [character1, character2]
    })
    
    generateConversationMutation.mutate({
      topic,
      wordCount,
      characters: [character1, character2]
    })
  }

  // Load saved conversation
  const loadConversation = (conversation: GeneratedConversation) => {
    setGeneratedConversation(conversation)
    setTopic(conversation.topic)
    setWordCount(conversation.wordCount)
    setCharacter1(conversation.characters[0])
    setCharacter2(conversation.characters[1])
    setGameState('display')
  }


  // Waiting screen for player 2
  if (isMultiplayer && currentPlayer === 2 && waitingForGeneration) {
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
              <div className="absolute inset-0 flex items-center justify-center text-3xl">⏳</div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Please Wait...
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <p className="text-lg font-medium text-gray-700">Player 2</p>
              <p className="text-sm text-gray-600 mt-1">
                Wait till the first player generates the conversation from the AI
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

  // Setup screen
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
            <p className="text-white/90 text-lg mb-6 max-w-xl mx-auto">
              Generate realistic conversations between two characters on any topic using AI
            </p>
            <Button
              onClick={onBackToHome}
              className="mb-8 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6 py-2 shadow-lg transition-all duration-300 hover:scale-105"
            >
              ← Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Setup Form */}
            <Card className="p-6 bg-white/95 backdrop-blur-md border border-white/50 rounded-xl shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-purple-600">🎪</span> Create New Conversation
              </h2>
              
              {isMultiplayer && (
                <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700">
                    Player {currentPlayer} - Set up the conversation
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentPlayer === 1 ? "Fill in the details and generate the conversation" : "Only Player 1 can generate conversations"}
                  </p>
                </div>
              )}

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
                    disabled={isMultiplayer && currentPlayer === 2}
                  />
                </div>

                {/* Characters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Character 1 {isMultiplayer ? `(${player1Name})` : ''}
                    </label>
                    <Input
                      type="text"
                      value={character1}
                      onChange={(e) => setCharacter1(e.target.value)}
                      placeholder={isMultiplayer ? player1Name : "e.g., Sarah, Manager, Customer"}
                      className="w-full"
                      disabled={isMultiplayer}
                      readOnly={isMultiplayer}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Character 2 {isMultiplayer ? `(${player2Name})` : ''}
                    </label>
                    <Input
                      type="text"
                      value={character2}
                      onChange={(e) => setCharacter2(e.target.value)}
                      placeholder={isMultiplayer ? player2Name : "e.g., Mike, Employee, Waiter"}
                      className="w-full"
                      disabled={isMultiplayer}
                      readOnly={isMultiplayer}
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
                    disabled={isMultiplayer && currentPlayer === 2}
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
                  onClick={() => {
                    console.log('🔥 BUTTON CLICKED! State check:', { 
                      isGenerating, 
                      isMultiplayer, 
                      currentPlayer,
                      disabled: isGenerating || (isMultiplayer && currentPlayer === 2)
                    })
                    generateConversation()
                  }}
                  disabled={isGenerating || (isMultiplayer && currentPlayer === 2)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin">⏳</div>
                      <span>Generating...</span>
                    </div>
                  ) : isMultiplayer && currentPlayer === 2 ? (
                    <>🔒 Only Player 1 Can Generate</>
                  ) : (
                    <>🎭 Generate Conversation</>
                  )}
                </Button>
              </div>
            </Card>

            {/* Saved Conversations */}
            <Card className="p-6 bg-white/95 backdrop-blur-md border border-white/50 rounded-xl shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-indigo-600">📚</span> Saved Conversations
              </h2>
              
              {savedConversations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p>No conversations saved yet</p>
                  <p className="text-sm">Generate your first conversation!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    >
                      <h3 className="font-bold text-gray-800 truncate">{conv.topic}</h3>
                      <p className="text-sm text-gray-600">
                        {conv.characters.join(' & ')} • {conv.turns.length} turns
                      </p>
                      <p className="text-xs text-gray-400">
                        {conv.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
                {character1} & {character2}
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
            <p className="text-white/80">
              {generatedConversation.characters.join(' & ')} • {generatedConversation.turns.length} turns
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {!isMultiplayer && (
                <Button
                  onClick={() => setGameState('setup')}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-4 py-2 text-sm"
                >
                  ← Back
                </Button>
              )}
            </div>
          </div>

          {/* Conversation Display */}
          <Card className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {generatedConversation.turns.map((turn, index) => {
                  const isPlayer1Turn = turn.character === character1
                  const isCurrentPlayerTurn = (isPlayer1Turn && currentPlayer === 1) || (!isPlayer1Turn && currentPlayer === 2)
                  
                  return (
                    <div key={index} className={`flex ${isPlayer1Turn ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-4 rounded-lg ${
                        isPlayer1Turn 
                          ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' 
                          : 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800'
                      } ${isMultiplayer && isCurrentPlayerTurn ? 'ring-2 ring-yellow-400 ring-opacity-75 shadow-lg' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-sm">{turn.character}</div>
                          {isMultiplayer && isCurrentPlayerTurn && (
                            <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-medium">
                              Your Turn
                            </span>
                          )}
                        </div>
                        <div className="text-base leading-relaxed">{turn.dialogue}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Call Button - Only show in multiplayer mode */}
        {isMultiplayer && (
          <CallButton
            gameId={`solo-${Date.now()}`}
            currentPlayer={{
              id: `player-${currentPlayer}`,
              name: player1Name,
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + player1Name
            }}
            opponent={{
              id: `player-${currentPlayer === 1 ? 2 : 1}`,
              name: player2Name,
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + player2Name
            }}
          />
        )}
      </div>
    )
  }


  return null
}