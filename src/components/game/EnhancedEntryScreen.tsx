'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

// Import the improved avatar selector
const cartoonAvatars = [
  { id: 'wizard', fallback: '🧙‍♂️', name: 'Wizard' },
  { id: 'superhero', fallback: '🦸‍♂️', name: 'Hero' },
  { id: 'cat', fallback: '🐱', name: 'Cat' },
  { id: 'panda', fallback: '🐼', name: 'Panda' },
  { id: 'unicorn', fallback: '🦄', name: 'Unicorn' }
]

// Compact Avatar Selector Component
function CompactAvatarSelector({ selectedAvatar, onAvatarChange }: { selectedAvatar: string, onAvatarChange: (avatar: string) => void }) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Better file type validation for mobile
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      event.target.value = '' // Reset file input
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      event.target.value = '' // Reset file input
      return
    }

    setIsUploading(true)

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        alert('Canvas not supported by browser')
        setIsUploading(false)
        return
      }

      const img = new Image()
      
      // Add CORS support for mobile
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          canvas.width = 64
          canvas.height = 64

          const size = Math.min(img.width, img.height)
          const x = (img.width - size) / 2
          const y = (img.height - size) / 2

          // Clear canvas first
          ctx.clearRect(0, 0, 64, 64)
          
          // Draw image with better quality settings for mobile
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, x, y, size, size, 0, 0, 64, 64)

          // Try different formats for better mobile compatibility
          let resizedImage: string
          try {
            resizedImage = canvas.toDataURL('image/jpeg', 0.8)
          } catch (jpegError) {
            console.warn('JPEG conversion failed, trying PNG:', jpegError)
            resizedImage = canvas.toDataURL('image/png')
          }
          
          setUploadedImage(resizedImage)
          onAvatarChange(resizedImage)
          setIsUploading(false)
          // Reset file input
          const fileInput = document.getElementById('file-input') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        } catch (error) {
          console.error('Error processing image:', error)
          alert('Failed to process image. Try a different image.')
          setIsUploading(false)
          // Reset file input
          const fileInput = document.getElementById('file-input') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        }
      }

      img.onerror = (error) => {
        console.error('Image load error:', error)
        alert('Failed to load image. Please try a different image.')
        setIsUploading(false)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }

      // Use FileReader for better mobile compatibility
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.onerror = () => {
        alert('Failed to read image file')
        setIsUploading(false)
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image')
      setIsUploading(false)
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    }
  }

  const handleRemoveUploadedImage = () => {
    setUploadedImage(null)
    onAvatarChange(cartoonAvatars[0].fallback)
  }

  const isAvatarSelected = (avatar: any) => {
    if (uploadedImage) {
      return selectedAvatar === uploadedImage
    }
    return selectedAvatar === avatar.fallback
  }

  const isUploadSelected = uploadedImage && selectedAvatar === uploadedImage

  return (
    <div className="w-full">
      <div className="grid grid-cols-5 gap-2 mb-2">
        {cartoonAvatars.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => {
              setUploadedImage(null)
              onAvatarChange(avatar.fallback)
            }}
            className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 ${
              isAvatarSelected(avatar) && !uploadedImage
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-110'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {avatar.fallback}
            {isAvatarSelected(avatar) && !uploadedImage && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}

        <div className="relative">
          <button
            type="button"
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={isUploading}
            className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
              isUploadSelected
                ? 'border-green-500 bg-green-50 shadow-lg scale-110'
                : 'border-dashed border-gray-300 hover:border-blue-300'
            }`}
          >
            {uploadedImage && isUploadSelected ? (
              <>
                <img
                  src={uploadedImage}
                  alt="Your avatar"
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute -top-0.5 -left-0.5 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs md:text-xs leading-none">✓</span>
                </div>
              </>
            ) : (
              <span className={`text-lg ${isUploading ? 'animate-spin' : ''}`}>
                {isUploading ? '⏳' : '📷'}
              </span>
            )}
          </button>
          {uploadedImage && isUploadSelected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveUploadedImage()
              }}
              className="absolute -top-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 z-10 shadow-sm"
            >
              <span className="text-white text-xs md:text-xs leading-none">×</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-600">
          {uploadedImage && isUploadSelected ? (
            <span className="font-medium text-green-600">Custom Photo</span>
          ) : (
            cartoonAvatars.find(a => a.fallback === selectedAvatar)?.name || 'Select avatar'
          )}
        </p>
      </div>

      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleImageUpload}
        className="hidden"
        disabled={isUploading}
        capture="environment"
      />
    </div>
  )
}

// Game Mode Types
interface GameMode {
  id: 'story-writing' | 'translation'
}

interface TranslationMode {
  id: 'multiple-choice' | 'typing' | 'metaphorical'
}

interface UnifiedGameMode {
  id: 'story-writing' | 'translation-multiple-choice' | 'translation-typing' | 'translation-metaphorical'
  name: string
  icon: string
  gameType: 'story-writing' | 'translation'
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
  }
]

// Compact Game Mode Selector
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
      
      <div className="grid grid-cols-2 gap-3">
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
}

export default function EnhancedEntryScreen({ 
  onStartGame, 
  onCreatePrivateRoom, 
  onJoinPrivateRoom 
}: EnhancedEntryScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🥷')
  const [isJoining, setIsJoining] = useState(false)
  const [mode, setMode] = useState<'random' | 'create' | 'join'>('random')
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
      if (gameMode === 'translation' && !translationMode) {
        alert('Please select a translation mode first')
        return
      }

      setIsJoining(true)
      
      if (mode === 'random') {
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

  const canSubmit = playerName.trim() && (gameMode !== 'translation' || translationMode)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mobile-safe-area">
      <Card className="w-full max-w-md p-6 bg-white/95 backdrop-blur-sm shadow-2xl game-card">
        {/* Header - More Compact */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 text-shadow">
            WordMash Battle
          </h1>
          <p className="text-gray-600 text-sm">
            Challenge friends in word games!
          </p>
        </div>

        <div className="space-y-5">
          {/* Player Setup - Compact Layout */}
          <div className="space-y-4">
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
                required
              />
            </div>

            {/* Avatar Selection - Much More Compact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Avatar
              </label>
              <CompactAvatarSelector 
                selectedAvatar={selectedAvatar}
                onAvatarChange={setSelectedAvatar}
              />
            </div>
          </div>

          {/* Game Mode Selection - Compact */}
          <CompactGameModeSelector
            selectedMode={selectedUnifiedMode}
            onModeSelect={handleUnifiedModeSelect}
          />

          {/* Room Mode Selection - Compact */}
          {/* Room Mode Selection - Compact */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 text-center">
                How to Play
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
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
                  🏠 Create
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
                  🔗 Join
                </Button>
              </div>

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
                  {mode === 'random' ? 'Finding Match...' : 
                   mode === 'create' ? 'Creating Room...' : 'Joining Room...'}
                </span>
              </div>
            ) : (
              <>
                {mode === 'random' ? '🚀 Find Match' : 
                 mode === 'create' ? '🏠 Create Room' : '🔗 Join Room'}
              </>
            )}
          </Button>

          {/* Selected Mode Info - Compact */}
          {canSubmit && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg text-center border border-blue-100 animate-in fade-in">
              <p className="text-blue-700 text-sm font-medium">
                <span className="text-lg mr-2">🎮</span>
                <strong>Ready:</strong> {
                  selectedUnifiedMode === 'story-writing' ? 'Story Writing' :
                  selectedUnifiedMode === 'translation-multiple-choice' ? 'Quick Translation' :
                  selectedUnifiedMode === 'translation-typing' ? 'Type Challenge' :
                  selectedUnifiedMode === 'translation-metaphorical' ? 'Metaphor Master' : ''
                }
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}