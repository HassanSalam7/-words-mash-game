'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface AnswerMode {
  id: 'multiple-choice' | 'typing'
  name: string
  description: string
  icon: string
}

interface AnswerModeSelectorProps {
  onModeSelect: (mode: AnswerMode['id']) => void
  isHost: boolean
}

const answerModes: AnswerMode[] = [
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    description: 'Choose from 4 Arabic options',
    icon: '🔘'
  },
  {
    id: 'typing',
    name: 'Typing Mode',
    description: 'Type the Arabic translation',
    icon: '⌨️'
  }
]

export default function AnswerModeSelector({ onModeSelect, isHost }: AnswerModeSelectorProps) {
  if (!isHost) {
    return (
      <div className="text-center p-6">
        <div className="animate-pulse">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Waiting for host to select answer mode...
          </h3>
          <div className="text-gray-600">
            ⏳ The host is choosing how you'll answer the questions
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Answer Mode
        </h2>
        <p className="text-gray-600">
          👑 As the host, select how players will answer translation questions
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {answerModes.map((mode) => (
          <Card
            key={mode.id}
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-purple-300"
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">{mode.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {mode.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {mode.description}
              </p>
              <Button
                onClick={() => onModeSelect(mode.id)}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
              >
                Select This Mode
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          💡 This choice will apply to the entire game session
        </p>
      </div>
    </div>
  )
}