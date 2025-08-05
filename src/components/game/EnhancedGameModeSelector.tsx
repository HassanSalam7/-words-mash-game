'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface GameMode {
  id: 'story-writing' | 'translation'
  name: string
  description: string
  icon: string
  features: string[]
}

export interface TranslationMode {
  id: 'multiple-choice' | 'typing' | 'metaphorical'
  name: string
  description: string
  icon: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  features: string[]
}

interface EnhancedGameModeSelectorProps {
  selectedMode: GameMode['id']
  selectedTranslationMode?: TranslationMode['id']
  onModeChange: (mode: GameMode['id'], translationMode?: TranslationMode['id']) => void
}

const gameModes: GameMode[] = [
  {
    id: 'story-writing',
    name: 'Story Writing',
    description: 'Create creative stories using random words',
    icon: '✍️',
    features: ['Use 5 random words', 'Write creative stories', 'Express your imagination', '10-minute time limit']
  },
  {
    id: 'translation',
    name: 'Translation Challenge',
    description: 'Test your Arabic translation skills',
    icon: '🌍',
    features: ['English to Arabic translation', 'Multiple game modes', 'Score-based competition', 'Real-time battles']
  }
]

const translationModes: TranslationMode[] = [
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    description: 'Choose the correct Arabic translation from 4 options',
    icon: '🎯',
    difficulty: 'Easy',
    features: ['4 answer choices', 'Quick decisions', 'Perfect for beginners', '30 seconds per word']
  },
  {
    id: 'typing',
    name: 'Typing Mode',
    description: 'Type the Arabic translation yourself',
    icon: '⌨️',
    difficulty: 'Medium',
    features: ['Free typing', 'Test your spelling', 'More challenging', 'Exact match required']
  },
  {
    id: 'metaphorical',
    name: 'Metaphorical Challenge',
    description: 'Translate complex metaphorical sentences',
    icon: '🎭',
    difficulty: 'Hard',
    features: ['Complex sentences', 'Cultural context', 'Advanced level', 'Multiple choice format']
  }
]

export default function EnhancedGameModeSelector({ 
  selectedMode, 
  selectedTranslationMode,
  onModeChange 
}: EnhancedGameModeSelectorProps) {
  const [showTranslationModes, setShowTranslationModes] = useState(selectedMode === 'translation')

  const handleGameModeChange = (mode: GameMode['id']) => {
    if (mode === 'translation') {
      setShowTranslationModes(true)
      // Don't call onModeChange yet, wait for translation mode selection
    } else {
      setShowTranslationModes(false)
      onModeChange(mode)
    }
  }

  const handleTranslationModeChange = (translationMode: TranslationMode['id']) => {
    onModeChange('translation', translationMode)
  }

  const handleBackToGameModes = () => {
    setShowTranslationModes(false)
  }

  if (showTranslationModes) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToGameModes}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Game Modes
          </Button>
          <h3 className="text-lg font-semibold text-gray-800">
            Choose Translation Mode
          </h3>
          <div></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {translationModes.map((mode) => (
            <Card
              key={mode.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTranslationMode === mode.id
                  ? 'ring-2 ring-cyan-500 bg-cyan-50 shadow-md'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleTranslationModeChange(mode.id)}
            >
              <div className="p-4">
                <div className="text-center mb-3">
                  <span className="text-3xl mb-2 block">{mode.icon}</span>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{mode.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      mode.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      mode.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {mode.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-cyan-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Choose your preferred translation challenge mode to find opponents with the same selection
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Choose Your Game Mode
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gameModes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedMode === mode.id && !showTranslationModes
                ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleGameModeChange(mode.id)}
          >
            <div className="p-4">
              <div className="text-center mb-3">
                <span className="text-3xl mb-2 block">{mode.icon}</span>
                <h4 className="font-semibold text-gray-800">{mode.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                {mode.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {mode.id === 'translation' && (
                <div className="mt-3 text-center">
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
                    3 Challenge Modes Available
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export { gameModes, translationModes }