'use client'

import { Card } from '@/components/ui/card'

export interface UnifiedGameMode {
  id: 'story-writing' | 'translation-multiple-choice' | 'translation-typing' | 'translation-metaphorical'
  name: string
  icon: string
  gameType: 'story-writing' | 'translation'
  translationMode?: 'multiple-choice' | 'typing' | 'metaphorical'
  difficulty?: 'Easy' | 'Medium' | 'Hard'
}

interface UnifiedGameModeSelectorProps {
  selectedMode?: UnifiedGameMode['id']
  onModeSelect: (mode: UnifiedGameMode) => void
}

const unifiedGameModes: UnifiedGameMode[] = [
  {
    id: 'story-writing',
    name: 'Story Writing',
    icon: '✍️',
    gameType: 'story-writing'
  },
  {
    id: 'translation-multiple-choice',
    name: 'Quick Translation',
    icon: '🎯',
    gameType: 'translation',
    translationMode: 'multiple-choice',
    difficulty: 'Easy'
  },
  {
    id: 'translation-typing',
    name: 'Type Challenge',
    icon: '⌨️',
    gameType: 'translation',
    translationMode: 'typing',
    difficulty: 'Medium'
  },
  {
    id: 'translation-metaphorical',
    name: 'Metaphor Master',
    icon: '🎭',
    gameType: 'translation',
    translationMode: 'metaphorical',
    difficulty: 'Hard'
  }
]

export default function UnifiedGameModeSelector({ 
  selectedMode, 
  onModeSelect 
}: UnifiedGameModeSelectorProps) {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Game Mode</h2>
        <p className="text-gray-600">Select a game mode to start playing</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
        {unifiedGameModes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group game-card ${
              selectedMode === mode.id
                ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg animate-gentle-glow'
                : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50'
            }`}
            onClick={() => onModeSelect(mode)}
          >
            <div className="p-4 md:p-6 text-center h-full flex flex-col justify-between">
              <div>
                <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-200 drop-shadow-sm">
                  {mode.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2 text-shadow">
                  {mode.name}
                </h3>
              </div>
              {mode.difficulty && (
                <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium transition-all duration-200 ${
                  mode.difficulty === 'Easy' ? 'bg-green-100 text-green-700 group-hover:bg-green-200' :
                  mode.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200' :
                  'bg-red-100 text-red-700 group-hover:bg-red-200'
                }`}>
                  {mode.difficulty}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export { unifiedGameModes }