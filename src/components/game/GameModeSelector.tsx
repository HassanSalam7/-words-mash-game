'use client'

import { Card } from '@/components/ui/card'

export interface GameMode {
  id: 'story-writing' | 'translation'
  name: string
  description: string
  icon: string
  features: string[]
}

interface GameModeSelectorProps {
  selectedMode: GameMode['id']
  onModeChange: (mode: GameMode['id']) => void
}

const gameModes: GameMode[] = [
  {
    id: 'story-writing',
    name: 'Story Writing',
    description: 'Create creative stories using random words',
    icon: '✍️',
    features: ['Use 5 random words', 'Write creative stories', 'Express your imagination']
  },
  {
    id: 'translation',
    name: 'Translation Challenge',
    description: 'Translate English words to Arabic',
    icon: '🌍',
    features: ['English to Arabic', 'Multiple choice & typing', 'Score-based competition']
  }
]

export default function GameModeSelector({ selectedMode, onModeChange }: GameModeSelectorProps) {
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
              selectedMode === mode.id
                ? 'ring-2 ring-purple-500 bg-purple-50 shadow-md'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onModeChange(mode.id)}
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}