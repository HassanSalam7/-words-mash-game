'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaOptionsType } from 'embla-carousel'
import { Bot } from 'lucide-react'

// Avatar data with Dicebear Adventurer avatars - Boys and Girls
const cartoonAvatars = [
  // Boys
  { id: 'boy1', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jude&flip=false', name: 'Jude' },
  { id: 'boy2', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Leo&flip=false', name: 'Leo' },
  { id: 'boy3', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=George&flip=false', name: 'George' },
  { id: 'boy4', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Alex&flip=false', name: 'Alex' },
  { id: 'boy5', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Charlie&flip=false', name: 'Charlie' },
  { id: 'boy6', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jordan&flip=false', name: 'Jordan' },
  // Girls
  { id: 'girl1', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma&flip=false', name: 'Emma' },
  { id: 'girl2', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jocelyn&flip=false', name: 'Jocelyn' },
  { id: 'girl3', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mackenzie&flip=false', name: 'Mackenzie' },
  { id: 'girl4', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia&flip=false', name: 'Sophia' },
  { id: 'girl5', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Taylor&flip=false', name: 'Taylor' },
  { id: 'girl6', fallback: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Morgan&flip=false', name: 'Morgan' }
]

// Embla Avatar Carousel Selector Component
function EmblaAvatarCarousel({ selectedAvatar, onAvatarChange }: { selectedAvatar: string, onAvatarChange: (avatar: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Embla Carousel Options - Optimized for mobile touch
  const options: EmblaOptionsType = {
    align: 'center',
    loop: true,
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: true,
    skipSnaps: false,
    dragThreshold: 10,
    inViewThreshold: 0.7
  }

  // Initialize Embla Carousel without AutoScroll plugin
  const [emblaRef, emblaApi] = useEmblaCarousel(options)

  // Track current index for visual selection indicator only
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    const selectedIndex = emblaApi.selectedScrollSnap()
    setCurrentIndex(selectedIndex)
    // No auto avatar change - only manual selection through clicks
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect).on('reInit', onSelect)
  }, [emblaApi, onSelect])

  // Handle avatar click - Only way to select an avatar
  const handleAvatarClick = (index: number) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
    setCurrentIndex(index)
    
    // Update avatar selection only on manual click
    if (index < cartoonAvatars.length && cartoonAvatars[index]) {
      onAvatarChange(cartoonAvatars[index].fallback)
    }
  }

  return (
    <div className="w-full">
      {/* Main Avatar Display */}
      <div className="flex items-center justify-center mb-2">
        <div className="relative">
          
          
          {/* Floating Animation Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 animate-spin opacity-20" style={{animationDuration: '3s'}}></div>
        </div>
      </div>

  

      {/* Embla Carousel Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 p-4 shadow-inner">


        {/* Embla Viewport */}
        <div className="overflow-hidden touch-pan-x" ref={emblaRef}>
          <div className="flex will-change-transform">
            {/* Avatar Slides */}
            {cartoonAvatars.map((avatar, index) => (
              <div key={avatar.id} className="flex-none w-20 sm:w-24 min-w-0 pl-6 first:pl-8">
                <button
                  type="button"
                  onClick={() => handleAvatarClick(index)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 transition-colors duration-200 overflow-hidden active:scale-95 mx-auto block touch-manipulation ${
                    currentIndex === index && currentIndex < cartoonAvatars.length
                      ? 'border-blue-500 shadow-xl scale-110 z-10'
                      : 'border-gray-200 shadow-md'
                  }`}
                >
                  <img
                    src={avatar.fallback}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover rounded-full select-none pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = parent.innerHTML + '<div class="w-full h-full flex items-center justify-center text-2xl bg-gray-100 rounded-full">👤</div>'
                      }
                    }}
                  />
                  
                  {/* Selection Indicator */}
                  {currentIndex === index && currentIndex < cartoonAvatars.length && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  )
}

// Game Mode Types (keeping existing structure)
interface GameMode {
  id: 'story-writing' | 'translation' | 'speech-training' | 'conversation-generator'
}

interface TranslationMode {
  id: 'multiple-choice' | 'typing' | 'metaphorical'
}

interface UnifiedGameMode {
  id: 'story-writing' | 'translation-multiple-choice' | 'translation-typing' | 'translation-metaphorical' | 'speech-training' | 'conversation-generator'
  name: string
  icon: string
  gameType: 'story-writing' | 'translation' | 'speech-training' | 'conversation-generator'
  translationMode?: 'multiple-choice' | 'typing' | 'metaphorical'
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  description: string
}

const unifiedGameModes: UnifiedGameMode[] = [
  {
    id: 'story-writing',
    name: 'Story Writing',
    icon: '✍️',
    gameType: 'story-writing',
    description: 'Create stories with random words'
  },
  {
    id: 'translation-multiple-choice',
    name: 'Quick Translation',
    icon: '🎯',
    gameType: 'translation',
    translationMode: 'multiple-choice',
    description: 'Multiple choice translation'
  },
  {
    id: 'translation-typing',
    name: 'Type Challenge',
    icon: '⌨️',
    gameType: 'translation',
    translationMode: 'typing',
    description: 'Type the translation'
  },
  {
    id: 'translation-metaphorical',
    name: 'Metaphor Master',
    icon: '🎭',
    gameType: 'translation',
    translationMode: 'metaphorical',
    description: 'Complex metaphorical sentences'
  },
  {
    id: 'speech-training',
    name: 'Speech Training',
    icon: '🎤',
    gameType: 'speech-training',
    description: 'Practice public speaking skills'
  },
  {
    id: 'conversation-generator',
    name: 'AI Conversations',
    icon: '🤖',
    gameType: 'conversation-generator',
    description: 'Generate AI-powered dialogues'
  }
]

// Compact Game Mode Selector (keeping existing)
function CompactGameModeSelector({ 
  selectedMode, 
  onModeSelect 
}: { 
  selectedMode?: UnifiedGameMode['id'], 
  onModeSelect: (mode: UnifiedGameMode) => void 
}) {
  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Choose Game Mode</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {unifiedGameModes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeSelect(mode)}
            className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
              selectedMode === mode.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{mode.icon}</div>
              <h4 className="font-bold text-sm text-gray-800 mb-1">{mode.name}</h4>
              {mode.difficulty && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${
                  mode.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                  mode.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {mode.difficulty}
                </span>
              )}
              <p className="text-xs text-gray-600">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

interface EnhancedEntryScreenProps {
  onStartGame: (playerName: string, avatar: string, gameMode: GameMode['id'], translationMode?: TranslationMode['id']) => void
  onCreatePrivateRoom: (playerName: string, avatar: string, gameMode: GameMode['id'], translationMode?: TranslationMode['id']) => void
  onJoinPrivateRoom: (playerName: string, avatar: string, roomCode: string, gameMode: GameMode['id'], translationMode?: TranslationMode['id']) => void
  onStartSinglePlayer: (playerName: string, avatar: string, gameMode: GameMode['id'], translationMode: TranslationMode['id'] | undefined, difficulty: 'easy' | 'medium' | 'hard') => void
  onStartSpeechTraining: (playerName: string, avatar: string) => void
}

export default function EnhancedEntryScreen({ 
  onStartGame, 
  onCreatePrivateRoom, 
  onJoinPrivateRoom,
  onStartSinglePlayer,
  onStartSpeechTraining
}: EnhancedEntryScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('https://api.dicebear.com/9.x/adventurer/svg?seed=Jude&flip=false')
  const [isJoining, setIsJoining] = useState(false)
  const [mode, setMode] = useState<'single' | 'random' | 'create' | 'join'>('single')
  const [singlePlayerDifficulty, setSinglePlayerDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [roomCode, setRoomCode] = useState('')
  const [selectedUnifiedMode, setSelectedUnifiedMode] = useState<UnifiedGameMode['id']>('story-writing')
  const [gameMode, setGameMode] = useState<GameMode['id']>('story-writing')
  const [translationMode, setTranslationMode] = useState<TranslationMode['id'] | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const roomParam = urlParams.get('room')
      if (roomParam) {
        setMode('join')
        setRoomCode(roomParam.toUpperCase())
      }
    }
  }, [])

  const handleUnifiedModeSelect = (unifiedMode: UnifiedGameMode) => {
    setSelectedUnifiedMode(unifiedMode.id)
    setGameMode(unifiedMode.gameType)
    setTranslationMode(unifiedMode.translationMode)
  }

  const handleSubmit = () => {
    if (playerName.trim() && !isJoining) {
      if (gameMode === 'speech-training') {
        setIsJoining(true)
        onStartSpeechTraining(playerName.trim(), selectedAvatar)
        return
      }
      
      if (gameMode === 'translation' && !translationMode) {
        alert('Please select a translation mode first')
        return
      }

      setIsJoining(true)
      
      if (mode === 'single') {
        onStartSinglePlayer(playerName.trim(), selectedAvatar, gameMode, translationMode, singlePlayerDifficulty)
      } else if (mode === 'random') {
        onStartGame(playerName.trim(), selectedAvatar, gameMode, translationMode)
      } else if (mode === 'create') {
        onCreatePrivateRoom(playerName.trim(), selectedAvatar, gameMode, translationMode)
      } else if (mode === 'join') {
        if (roomCode.trim()) {
          onJoinPrivateRoom(playerName.trim(), selectedAvatar, roomCode.trim().toUpperCase(), gameMode, translationMode)
        } else {
          setIsJoining(false)
          return
        }
      }
    }
  }

  const canSubmit = playerName.trim() && (
    gameMode === 'story-writing' ||
           gameMode === 'conversation-generator' ||
           gameMode === 'speech-training' ||
           (gameMode === 'translation' && translationMode)
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mobile-safe-area">
      <Card className="w-full max-w-lg p-6 bg-white/95 backdrop-blur-sm shadow-2xl game-card">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 text-shadow">
            WordMash Battle
          </h1>
          <p className="text-gray-600 text-sm">
            Challenge friends in word games!
          </p>
        </div>

        <div className="space-y-6">
          {/* Player Setup */}
          <div className="space-y-5">
            {/* Player Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <Input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit && !isJoining) {
                    handleSubmit()
                  }
                }}
                placeholder="Enter your name"
                className="w-full text-center text-base h-10"
                maxLength={20}
                autoFocus
                required
              />
            </div>

            {/* Modern Avatar Carousel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Your Avatar
              </label>
              <EmblaAvatarCarousel 
                selectedAvatar={selectedAvatar}
                onAvatarChange={setSelectedAvatar}
              />
            </div>
          </div>

          {/* Game Mode Selection */}
          <CompactGameModeSelector
            selectedMode={selectedUnifiedMode}
            onModeSelect={handleUnifiedModeSelect}
          />


          {/* Room Mode Selection */}
          {selectedUnifiedMode !== 'speech-training' && (() => {
            // Game modes that support Solo mode
            const soloSupportedModes = ['story-writing', 'translation-multiple-choice', 'translation-typing', 'translation-metaphorical'];
            const showSoloButton = soloSupportedModes.includes(selectedUnifiedMode);
            
            return (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 text-center">
                  How to Play
                </h3>
                
                <div className={`grid gap-2 ${showSoloButton ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
                    {showSoloButton && (
                      <Button
                        type="button"
                        variant={mode === 'single' ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setMode('single')
                        }}
                        className={`py-2 text-xs font-semibold border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                          mode === 'single' 
                            ? 'bg-black text-white border-black shadow-lg hover:bg-gray-800' 
                            : 'bg-white text-black border-gray-800 hover:bg-gray-50 hover:border-black shadow-md'
                        }`}
                      >
                        💔 Solo
                      </Button>
                    )}
              
              <Button
                type="button"
                variant={mode === 'random' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMode('random')
                }}
                className={`py-2 text-xs font-semibold border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  mode === 'random' 
                    ? 'bg-black text-white border-black shadow-lg hover:bg-gray-800' 
                    : 'bg-white text-black border-gray-800 hover:bg-gray-50 hover:border-black shadow-md'
                }`}
              >
                🎲 Random
              </Button>
              
              <Button
                type="button"
                variant={mode === 'create' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMode('create')
                }}
                className={`py-2 text-xs font-semibold border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  mode === 'create' 
                    ? 'bg-black text-white border-black shadow-lg hover:bg-gray-800' 
                    : 'bg-white text-black border-gray-800 hover:bg-gray-50 hover:border-black shadow-md'
                }`}
              >
                🏠 Create Room
              </Button>
              
              <Button
                type="button"
                variant={mode === 'join' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMode('join')
                }}
                className={`py-2 text-xs font-semibold border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  mode === 'join' 
                    ? 'bg-black text-white border-black shadow-lg hover:bg-gray-800' 
                    : 'bg-white text-black border-gray-800 hover:bg-gray-50 hover:border-black shadow-md'
                }`}
              >
                🔗 Join Room
              </Button>
                </div>

                {mode === 'single' && showSoloButton && (
                <div className="animate-in slide-in-from-top-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 text-center">
                      AI Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                        <Button
                          key={difficulty}
                          type="button"
                          variant={singlePlayerDifficulty === difficulty ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSinglePlayerDifficulty(difficulty)
                          }}
                          className={`py-1.5 text-xs font-medium transition-all duration-200 ${
                            singlePlayerDifficulty === difficulty
                              ? difficulty === 'easy' ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                                : difficulty === 'medium' ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                                : 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {difficulty === 'easy' && '😊 Easy'}
                          {difficulty === 'medium' && '🤔 Medium'}
                          {difficulty === 'hard' && '😰 Hard'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {mode === 'join' && (
                <div className="animate-in slide-in-from-top-4">
                  <Input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canSubmit && !isJoining) {
                        handleSubmit()
                      }
                    }}
                    placeholder="Enter room code"
                    className="text-center text-base font-mono h-10 border-2 border-gray-800 focus:border-black"
                    maxLength={6}
                  />
                </div>
              )}
              </div>
            );
          })()}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isJoining}
            className="w-full py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 button-enhanced shadow-lg"
          >
            {isJoining ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin">⏳</div>
                <span className="text-sm">
                  {mode === 'single' ? 'Starting vs AI...' :
                   mode === 'random' ? 'Finding Match...' : 
                   mode === 'create' ? 'Creating Room...' : 'Joining Room...'}
                </span>
              </div>
            ) : (
              <>
                {mode === 'single' ? '🤖 Play vs AI' :
                 mode === 'random' ? '🚀 Find Match' : 
                 mode === 'create' ? '🏠 Create Room' : '🔗 Join Room'}
              </>
            )}
          </Button>

          {/* Selected Mode Info */}
          {canSubmit && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg text-center border border-blue-100 animate-in fade-in">
              <p className="text-blue-700 text-sm font-medium">
                <span className="text-lg mr-2">🎮</span>
                <strong>Ready:</strong> {
                  selectedUnifiedMode === 'story-writing' ? 'Story Writing' :
                  selectedUnifiedMode === 'translation-multiple-choice' ? 'Quick Translation' :
                  selectedUnifiedMode === 'translation-typing' ? 'Type Challenge' :
                  selectedUnifiedMode === 'translation-metaphorical' ? 'Metaphor Master' :
                  selectedUnifiedMode === 'speech-training' ? 'Speech Training' :
                  selectedUnifiedMode === 'conversation-generator' ? 'AI Conversations' : ''
                }
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}