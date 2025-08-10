'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ComputerPlayer } from '@/lib/computerPlayer'

interface Word {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SinglePlayerStoryScreenProps {
  words: Word[];
  computerPlayer: ComputerPlayer;
  playerName: string;
  playerAvatar: string;
  onGameEnd: (results: any) => void;
  onBackToHome: () => void;
}

export default function SinglePlayerStoryScreen({
  words,
  computerPlayer,
  playerName,
  playerAvatar,
  onGameEnd,
  onBackToHome
}: SinglePlayerStoryScreenProps) {
  const [story, setStory] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [gamePhase, setGamePhase] = useState<'writing' | 'computer-writing' | 'results'>('writing')
  const [playerSubmitted, setPlayerSubmitted] = useState(false)
  const [computerStory, setComputerStory] = useState('')
  const [computerProgress, setComputerProgress] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const computerProfile = computerPlayer.getProfile()

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!playerSubmitted) {
            handleSubmitStory()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [playerSubmitted])

  const handleSubmitStory = async () => {
    if (playerSubmitted) return
    
    setPlayerSubmitted(true)
    setGamePhase('computer-writing')
    
    // Get computer's story
    try {
      const computerResult = await computerPlayer.generateStory(words)
      setComputerStory(computerResult.story)
      
      // Simulate typing effect for computer story
      let currentText = ''
      const fullText = computerResult.story
      let index = 0
      
      const typingInterval = setInterval(() => {
        if (index < fullText.length) {
          currentText += fullText[index]
          setComputerProgress(currentText)
          index++
        } else {
          clearInterval(typingInterval)
          setTimeout(() => {
            setGamePhase('results')
            showResults(computerResult)
          }, 1000)
        }
      }, 50) // Typing speed
      
    } catch (error) {
      console.error('Computer story generation failed:', error)
      setGamePhase('results')
      showResults({ story: 'The computer had a creative block!', usedWords: [], timeUsed: 0 })
    }
  }

  const showResults = (computerResult: any) => {
    const playerUsedWords = extractUsedWords(story, words)
    const results = {
      gameId: 'single-player',
      stories: [
        {
          playerName: playerName,
          avatar: playerAvatar,
          story: story || 'No story submitted',
          usedWords: playerUsedWords,
          wordsCount: playerUsedWords.length
        },
        {
          playerName: computerProfile.name,
          avatar: computerProfile.avatar,
          story: computerResult.story,
          usedWords: computerResult.usedWords,
          wordsCount: computerResult.usedWords.length
        }
      ]
    }
    
    onGameEnd(results)
  }

  const extractUsedWords = (storyText: string, wordList: Word[]): string[] => {
    const usedWords: string[] = []
    const storyLower = storyText.toLowerCase()
    
    wordList.forEach(wordObj => {
      if (storyLower.includes(wordObj.word.toLowerCase())) {
        usedWords.push(wordObj.word)
      }
    })
    
    return usedWords
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getUsedWordsCount = () => {
    return extractUsedWords(story, words).length
  }

  if (gamePhase === 'computer-writing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-500 to-cyan-400 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur-sm">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                {computerProfile.name} is writing...
              </h1>
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">{computerProfile.avatar}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(computerProgress.length / (computerStory.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Your Story:</h3>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {story || 'No story submitted'}
                </p>
                <div className="mt-2 text-xs sm:text-sm text-gray-500">
                  Words used: {getUsedWordsCount()}/{words.length}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{computerProfile.name}'s Story:</h3>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500 min-h-[80px] sm:min-h-[100px]">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {computerProgress}
                  {computerProgress && computerProgress.length < (computerStory.length || 0) && (
                    <span className="animate-pulse">|</span>
                  )}
                </p>
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
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Story Writing vs AI</h1>
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

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Words Panel */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm h-fit">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
                Your Words
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3">
                {words.map((wordObj, index) => {
                  const isUsed = story.toLowerCase().includes(wordObj.word.toLowerCase())
                  return (
                    <div
                      key={index}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-center lg:text-left ${
                        isUsed
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="font-semibold text-sm sm:text-base">{wordObj.word}</span>
                      {isUsed && (
                        <span className="ml-1 sm:ml-2 text-green-600">✓</span>
                      )}
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 sm:mt-6 text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-2">
                  Words Used: {getUsedWordsCount()}/{words.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(getUsedWordsCount() / words.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          </div>

          {/* Story Writing Area */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Write Your Story
              </h3>
              
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Start writing your creative story using the words provided..."
                className="w-full h-48 sm:h-56 lg:h-64 p-3 sm:p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                disabled={playerSubmitted}
              />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 sm:mt-4 gap-2 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-600">
                  Characters: {story.length}
                </div>
                
                <Button
                  onClick={handleSubmitStory}
                  disabled={playerSubmitted || !story.trim()}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto"
                >
                  {playerSubmitted ? 'Story Submitted' : 'Submit Story'}
                </Button>
              </div>
            </Card>

            {/* Computer Player Info */}
            <Card className="p-3 sm:p-4 bg-white/95 backdrop-blur-sm mt-3 sm:mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="text-2xl sm:text-3xl">{computerProfile.avatar}</div>
                <div className="text-center sm:text-left">
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">{computerProfile.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Speed: {computerProfile.speed} • Creativity: {Math.round(computerProfile.creativity * 100)}%
                  </div>
                </div>
                <div className="text-blue-500 text-sm sm:text-base">
                  {playerSubmitted ? '✍️ Writing...' : '⏳ Waiting...'}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}