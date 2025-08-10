'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ComputerPlayer } from '@/lib/computerPlayer'

interface TranslationWord {
  english: string;
  arabic: string;
  wrongOptions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
}

interface MetaphoricalSentence {
  english: string;
  arabic: string;
  metaphor: string;
  wrongOptions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
}

interface SinglePlayerTranslationScreenProps {
  words: (TranslationWord | MetaphoricalSentence)[];
  computerPlayer: ComputerPlayer;
  playerName: string;
  playerAvatar: string;
  translationMode: 'multiple-choice' | 'typing' | 'metaphorical';
  onGameEnd: (results: any) => void;
  onBackToHome: () => void;
}

export default function SinglePlayerTranslationScreen({
  words,
  computerPlayer,
  playerName,
  playerAvatar,
  translationMode,
  onGameEnd,
  onBackToHome
}: SinglePlayerTranslationScreenProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [computerScore, setComputerScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30) // 30 seconds per word
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [typedAnswer, setTypedAnswer] = useState('')
  const [gamePhase, setGamePhase] = useState<'playing' | 'showing-result' | 'computer-turn' | 'completed'>('playing')
  const [lastResult, setLastResult] = useState<{ correct: boolean; playerAnswer: string; computerAnswer: string; correctAnswer: string } | null>(null)
  const [playerAnswers, setPlayerAnswers] = useState<string[]>([])
  const [computerAnswers, setComputerAnswers] = useState<string[]>([])
  const [roundResults, setRoundResults] = useState<boolean[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const computerProfile = computerPlayer.getProfile()

  const currentWord = words[currentWordIndex]
  const totalWords = words.length

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [currentWordIndex, gamePhase])

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    
    setTimeLeft(30)
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          if (gamePhase === 'playing') {
            handleSubmitAnswer()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = timer as any
  }

  const handleSubmitAnswer = async () => {
    if (gamePhase !== 'playing') return

    const playerAnswer = translationMode === 'typing' ? typedAnswer.trim() : selectedAnswer
    const correctAnswer = currentWord.arabic
    const isPlayerCorrect = playerAnswer.toLowerCase() === correctAnswer.toLowerCase()
    
    // Update player answers and score
    const newPlayerAnswers = [...playerAnswers, playerAnswer]
    setPlayerAnswers(newPlayerAnswers)
    
    if (isPlayerCorrect) {
      setPlayerScore(prev => prev + 1)
    }

    setGamePhase('computer-turn')
    
    // Get computer's answer
    let computerResult
    try {
      if (translationMode === 'multiple-choice') {
        computerResult = await computerPlayer.selectMultipleChoice(currentWord as TranslationWord)
      } else if (translationMode === 'typing') {
        computerResult = await computerPlayer.typeTranslation(currentWord as TranslationWord)
      } else {
        computerResult = await computerPlayer.selectMetaphoricalChoice(currentWord as MetaphoricalSentence)
      }
    } catch (error) {
      computerResult = { answer: correctAnswer, timeUsed: 5000 }
    }
    
    const isComputerCorrect = computerResult.answer.toLowerCase() === correctAnswer.toLowerCase()
    const newComputerAnswers = [...computerAnswers, computerResult.answer]
    setComputerAnswers(newComputerAnswers)
    
    if (isComputerCorrect) {
      setComputerScore(prev => prev + 1)
    }

    // Store results
    setLastResult({
      correct: isPlayerCorrect,
      playerAnswer,
      computerAnswer: computerResult.answer,
      correctAnswer
    })
    
    setRoundResults(prev => [...prev, isPlayerCorrect])
    setGamePhase('showing-result')

    // Auto-advance after showing result
    setTimeout(() => {
      if (currentWordIndex >= totalWords - 1) {
        // Game completed
        setGamePhase('completed')
        showFinalResults()
      } else {
        // Next word
        setCurrentWordIndex(prev => prev + 1)
        setSelectedAnswer('')
        setTypedAnswer('')
        setGamePhase('playing')
      }
    }, 3000)
  }

  const showFinalResults = () => {
    const results = {
      gameId: 'single-player-translation',
      playerScore,
      computerScore,
      totalWords,
      playerAnswers,
      computerAnswers,
      correctAnswers: words.map(w => w.arabic),
      words: words.map(w => w.english),
      playerName,
      playerAvatar,
      computerName: computerProfile.name,
      computerAvatar: computerProfile.avatar,
      translationMode,
      roundResults
    }
    
    onGameEnd(results)
  }

  const handleAnswerSelect = (answer: string) => {
    if (gamePhase === 'playing') {
      setSelectedAnswer(answer)
    }
  }

  const formatTime = (seconds: number) => {
    return seconds.toString().padStart(2, '0')
  }

  const getProgressPercentage = () => {
    return ((currentWordIndex + 1) / totalWords) * 100
  }

  if (gamePhase === 'showing-result' && lastResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-500 to-cyan-400 p-2 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur-sm">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                {lastResult.correct ? '✅ Correct!' : '❌ Incorrect'}
              </h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="text-base sm:text-lg font-semibold text-gray-700">English:</div>
                  <div className="text-lg sm:text-xl text-gray-800 px-2">
                    {'metaphor' in currentWord ? `"${currentWord.metaphor}"` : currentWord.english}
                  </div>
                </div>
                
                <div>
                  <div className="text-base sm:text-lg font-semibold text-gray-700">Correct Answer:</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600 px-2">{lastResult.correctAnswer}</div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold mb-2">
                      {playerAvatar} You
                    </div>
                    <div className={`text-sm sm:text-base lg:text-lg p-2 sm:p-3 rounded-lg break-words ${
                      lastResult.playerAnswer.toLowerCase() === lastResult.correctAnswer.toLowerCase()
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}>
                      {lastResult.playerAnswer || 'No answer'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold mb-2">
                      {computerProfile.avatar} {computerProfile.name}
                    </div>
                    <div className={`text-sm sm:text-base lg:text-lg p-2 sm:p-3 rounded-lg break-words ${
                      lastResult.computerAnswer.toLowerCase() === lastResult.correctAnswer.toLowerCase()
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}>
                      {lastResult.computerAnswer}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold">
                Score: You {playerScore} - {computerScore} {computerProfile.name}
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (gamePhase === 'computer-turn') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-500 to-cyan-400 p-2 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">{computerProfile.avatar}</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">{computerProfile.name} is thinking...</h2>
              <div className="animate-pulse text-blue-500 text-base sm:text-lg">
                Analyzing the translation...
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-500 to-cyan-400 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <Button
            onClick={onBackToHome}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm text-sm sm:text-base px-3 sm:px-4 py-2 w-full sm:w-auto order-1 sm:order-none"
          >
            ← Back to Home
          </Button>
          <div className="text-center order-2 sm:order-none">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Translation Challenge vs AI</h1>
            <p className="text-sm sm:text-base text-white/80">Playing against {computerProfile.name}</p>
          </div>
          <div className="text-center sm:text-right order-3 sm:order-none">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2">
              <div className="text-white font-mono text-base sm:text-lg">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Question {currentWordIndex + 1} of {totalWords}
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Score: You {playerScore} - {computerScore} AI
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </Card>

        {/* Question Area */}
        <Card className="p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              Translate to Arabic:
            </h2>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-2 px-2 break-words">
              {'metaphor' in currentWord ? `"${currentWord.metaphor}"` : currentWord.english}
            </div>
            {translationMode === 'metaphorical' && 'metaphor' in currentWord && (
              <div className="text-sm sm:text-base lg:text-lg text-gray-600 italic px-2">
                Metaphorical meaning: {currentWord.english}
              </div>
            )}
          </div>

          {/* Answer Input Area */}
          <div className="max-w-2xl mx-auto">
            {translationMode === 'typing' ? (
              <div className="space-y-3 sm:space-y-4">
                <Input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedAnswer.trim()) {
                      handleSubmitAnswer()
                    }
                  }}
                  placeholder="Type your Arabic translation..."
                  className="text-base sm:text-lg lg:text-xl text-center h-12 sm:h-14 border-2 border-gray-300 focus:border-blue-500"
                  disabled={gamePhase !== 'playing'}
                />
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!typedAnswer.trim() || gamePhase !== 'playing'}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base lg:text-lg"
                >
                  Submit Answer
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {currentWord.options?.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`p-3 sm:p-4 text-sm sm:text-base lg:text-lg font-semibold border-2 transition-all duration-200 min-h-[48px] break-words ${
                      selectedAnswer === option
                        ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    disabled={gamePhase !== 'playing'}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {translationMode !== 'typing' && selectedAnswer && (
              <Button
                onClick={handleSubmitAnswer}
                className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base lg:text-lg"
                disabled={gamePhase !== 'playing'}
              >
                Submit Answer
              </Button>
            )}
          </div>
        </Card>

        {/* Computer Player Info */}
        <Card className="p-3 sm:p-4 bg-white/95 backdrop-blur-sm mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-2xl sm:text-3xl">{computerProfile.avatar}</div>
            <div className="text-center sm:text-left">
              <div className="font-semibold text-gray-800 text-sm sm:text-base">{computerProfile.name}</div>
              <div className="text-xs sm:text-sm text-gray-600">
                Speed: {computerProfile.speed} • Accuracy: {Math.round(computerProfile.accuracy * 100)}%
              </div>
            </div>
            <div className="text-blue-500 text-sm sm:text-base">
              {gamePhase === 'playing' ? '⏳ Waiting...' : '🤔 Thinking...'}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}