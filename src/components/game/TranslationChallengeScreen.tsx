'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/ui/player-avatar'

interface TranslationWord {
  english: string
  arabic: string
  wrongOptions: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  options?: string[]
  metaphor?: string // For metaphorical mode
}

interface Player {
  id: string
  name: string
  avatar: string
  score: number
  color: string
}

interface TranslationChallengeScreenProps {
  words: TranslationWord[]
  players: Player[]
  currentPlayer: Player
  onSubmitAnswer: (answer: string, timeUsed: number) => void
  timeLimit?: number
  roundNumber: number
  totalRounds: number
  answerMode: 'multiple-choice' | 'typing' | 'metaphorical'
  gameStatus: 'waiting' | 'playing' | 'showing-result' | 'completed'
  lastRoundWinner?: Player | null
  correctAnswer?: string
}

export default function TranslationChallengeScreen({
  words,
  players,
  currentPlayer,
  onSubmitAnswer,
  timeLimit = 30,
  roundNumber,
  totalRounds,
  answerMode,
  gameStatus,
  lastRoundWinner,
  correctAnswer
}: TranslationChallengeScreenProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [typedAnswer, setTypedAnswer] = useState('')
  const [hasAnswered, setHasAnswered] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())

  const currentWord = words[0] || words[currentWordIndex]
  const allOptions = currentWord?.options || (currentWord ? [currentWord.arabic, ...currentWord.wrongOptions] : [])

  // Timer effect
  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0 && !hasAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, hasAnswered, gameStatus])

  // Reset for new round and sync word index  
  useEffect(() => {
    if (gameStatus === 'playing') {
      setTimeLeft(timeLimit)
      setSelectedAnswer('')
      setTypedAnswer('')
      setHasAnswered(false)
      setStartTime(Date.now())
      setCurrentWordIndex(roundNumber - 1)
    }
  }, [roundNumber, gameStatus, timeLimit])

  const handleSubmitAnswer = (answer: string) => {
    if (hasAnswered || gameStatus !== 'playing') return
    
    setHasAnswered(true)
    const timeUsed = (Date.now() - startTime) / 1000
    onSubmitAnswer(answer, timeUsed)
  }

  const formatTime = (seconds: number) => {
    return seconds.toString()
  }

  // Show result notification - keeps game flow
  const showResultNotification = gameStatus === 'showing-result'

  // If no current word, just render empty div to avoid errors
  if (!currentWord) {
    return <div></div>
  }


  if (gameStatus === 'waiting') {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm mx-auto text-center bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-6xl mb-6 animate-pulse">⚡</div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">Get Ready!</h2>
          <p className="text-gray-600 font-medium">Next word is coming...</p>
          <div className="mt-6 flex justify-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex flex-col game-ui mobile-safe-area relative overflow-y-auto">
      {/* Result Notification Overlay - doesn't break the flow */}
      {showResultNotification && (
        <div className="absolute top-20 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {lastRoundWinner ? (
                  <>
                    <div className="animate-bounce"><PlayerAvatar avatar={lastRoundWinner.avatar} size="md" /></div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: lastRoundWinner.color }}>
                        {lastRoundWinner.name} +1 🎯
                      </div>
                      <div className="text-xs text-gray-600 arabic-text" dir="rtl">{correctAnswer}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl">💔</div>
                    <div>
                      <div className="font-bold text-sm text-gray-600">No one got it!</div>
                      <div className="text-xs text-gray-600 arabic-text" dir="rtl">{correctAnswer}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500">Next word...</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="flex-shrink-0 p-4 bg-white/70 backdrop-blur-md border-b border-blue-200">
        <div className="flex items-center justify-between">
          {/* Timer - more prominent with enhanced visibility */}
          <div className={`px-4 py-2 rounded-xl font-bold text-base shadow-lg border-2 transition-all duration-300 ${
            timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse border-red-300 animate-gentle-glow' : 
            timeLeft <= 20 ? 'bg-yellow-500 text-white border-yellow-300' : 'bg-white text-gray-800 border-white/50'
          }`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
          
          {/* Progress - clearer with enhanced contrast */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border-2 border-blue-200 shadow-lg">
            <span className="text-blue-600 font-bold text-sm">{roundNumber}/{totalRounds}</span>
          </div>
          
          {/* Players info - enhanced visibility */}
          <div className="flex items-center space-x-3">
            {players.map((player) => (
              <div key={player.id} className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 border-2 border-blue-200 shadow-lg">
                <PlayerAvatar avatar={player.avatar} size="sm" />
                <span className="text-blue-600 font-bold text-sm">
                  {player.score}
                </span>
                {hasAnswered && player.id === currentPlayer.id && (
                  <span className="text-green-500 text-sm animate-pulse">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - enhanced visibility */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0 overflow-y-auto">
        {/* Word Display - enhanced contrast */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-4 ${
            currentWord.difficulty === 'easy' ? 'bg-green-500 text-white' :
            currentWord.difficulty === 'medium' ? 'bg-yellow-500 text-white' :
            'bg-red-500 text-white'
          }`}>
            {currentWord.difficulty === 'easy' ? '🚀 EASY' : 
             currentWord.difficulty === 'medium' ? '⚡ MEDIUM' : '🔥 HARD'}
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border-2 border-blue-200 shadow-2xl mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-blue-600 mb-2 english-text">
              {currentWord.english}
            </h2>
            {answerMode === 'metaphorical' && currentWord.metaphor && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-full overflow-hidden">
                <p className="text-blue-700 text-sm font-medium break-words">
                  💡 <strong>Meaning:</strong> {currentWord.metaphor}
                </p>
              </div>
            )}
            <p className="text-blue-500 text-sm font-semibold">
              {answerMode === 'metaphorical' ? 'Choose the correct Arabic translation' : 'Translate to Arabic'}
            </p>
          </div>
        </div>

        {/* Answer Input - enhanced visibility */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {answerMode === 'multiple-choice' || answerMode === 'metaphorical' ? (
            <div className="flex-1 flex flex-col gap-3 max-h-full overflow-y-auto pb-4">
              {allOptions.map((option, index) => (
                <button
                  key={`option-${index}-${option}`}
                  onClick={() => !hasAnswered && handleSubmitAnswer(option)}
                  disabled={hasAnswered}
                  className={`flex-shrink-0 min-h-[60px] max-h-[80px] px-4 sm:px-6 py-4 rounded-2xl border-2 text-base sm:text-lg font-bold transition-all duration-200 active:scale-95 shadow-lg button-enhanced overflow-hidden ${
                    hasAnswered
                      ? 'cursor-not-allowed opacity-40 bg-white/10 border-white/20 text-white/60'
                      : answerMode === 'metaphorical' 
                        ? 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 cursor-pointer hover:shadow-2xl active:bg-purple-50'
                        : 'bg-white text-gray-800 border-white hover:bg-blue-50 hover:border-blue-300 cursor-pointer hover:shadow-2xl active:bg-blue-100'
                  }`}
                  dir="rtl"
                >
                  <div className="flex items-center justify-between h-full">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md ${
                      hasAnswered ? 'bg-white/20 text-white/60' : answerMode === 'metaphorical' 
                        ? 'bg-purple-500 text-white border-2 border-purple-400'
                        : 'bg-blue-500 text-white border-2 border-blue-400'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="arabic-text flex-1 text-center px-2 sm:px-3 text-lg sm:text-xl break-words leading-tight">{option}</span>
                    <div className="w-8"></div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    disabled={hasAnswered}
                    placeholder="اكتب الترجمة هنا..."
                    className="text-xl p-6 text-center bg-white border-2 border-white/50 rounded-2xl shadow-xl focus:border-blue-400 focus:shadow-2xl transition-all duration-300"
                    dir="rtl"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && typedAnswer.trim() && !hasAnswered) {
                        handleSubmitAnswer(typedAnswer.trim())
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => handleSubmitAnswer(typedAnswer.trim())}
                  disabled={!typedAnswer.trim() || hasAnswered}
                  className="w-full py-4 text-lg font-bold bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 button-enhanced border-2 border-green-400 hover:border-green-300"
                  size="lg"
                >
                  Submit Answer ✨
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Status Message - enhanced */}
        {hasAnswered && !showResultNotification && (
          <div className="flex-shrink-0 mt-4">
            <div className="bg-white/90 backdrop-blur-md border-2 border-blue-200 rounded-2xl p-4 text-center shadow-xl">
              <div className="text-blue-600 font-bold text-sm mb-1 flex items-center justify-center gap-2">
                <div className="animate-spin">⏳</div>
                Waiting for opponent...
              </div>
              <div className="text-xs text-blue-500">
                Results coming soon!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="flex-shrink-0 p-4 bg-white/70 backdrop-blur-md border-t-2 border-blue-200">
        <div className="bg-blue-100 rounded-full h-3 overflow-hidden border-2 border-blue-200 shadow-lg">
          <div 
            className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full transition-all duration-700 ease-out shadow-inner"
            style={{ width: `${(roundNumber / totalRounds) * 100}%` }}
          />
        </div>
        <div className="text-center mt-2 text-xs text-blue-600 font-medium">
          🏃‍♂️ {roundNumber} / {totalRounds} words completed
        </div>
      </div>
    </div>
  )
}