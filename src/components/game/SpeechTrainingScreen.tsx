'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSpeeches } from '@/lib/hooks/useGameData'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { Speech } from '@/lib/gameApi'

interface SpeechTrainingScreenProps {
  onBackToHome: () => void
}

export default function SpeechTrainingScreen({ onBackToHome }: SpeechTrainingScreenProps) {
  // Use React Query hook for speeches data
  const { data: speechesData, isLoading, error } = useSpeeches()
  const speeches = speechesData || []
  
  const [currentSpeech, setCurrentSpeech] = useState<Speech | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'countdown' | 'speaking' | 'finished'>('menu')
  const [countdown, setCountdown] = useState(3)
  
  // Simple timing system
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [totalDuration, setTotalDuration] = useState(60)
  const [scrollProgress, setScrollProgress] = useState(0)
  
  // Refs for scrolling
  const speechRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  
  // Split speech into words for duration calculation only
  const speechWords = useMemo(() => {
    return currentSpeech ? currentSpeech.content.split(/\s+/) : []
  }, [currentSpeech])
  
  // Calculate speech duration based on word count (faster scrolling speed)
  const calculateSpeechDuration = (wordCount: number) => {
    // Faster scrolling - using 200 wpm for quicker pace
    const durationInMinutes = wordCount / 100
    const durationInSeconds = Math.max(20, Math.min(120, Math.round(durationInMinutes * 60)))
    return durationInSeconds
  }

  // Speeches are now loaded via React Query hook

  // Countdown effect
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState === 'countdown' && countdown === 0) {
      // Calculate appropriate duration based on speech length
      if (currentSpeech) {
        const wordCount = speechWords.length
        const duration = calculateSpeechDuration(wordCount)
        setTotalDuration(duration)
        setTimeRemaining(duration)
      }
      
      setGameState('speaking')
      setScrollProgress(0)
    }
  }, [gameState, countdown, currentSpeech, speechWords.length])

  // Smooth continuous scrolling animation
  useEffect(() => {
    if (gameState === 'speaking' && currentSpeech) {
      const startTime = Date.now()
      const totalMs = totalDuration * 1000
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(1, elapsed / totalMs)
        
        // Update progress and time every frame
        setScrollProgress(progress * 100)
        const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
        if (remaining !== timeRemaining) {
          setTimeRemaining(remaining)
        }
        
        // Continuous smooth auto-scroll upward movement
        // Bottom of text reaches middle of screen for comfortable reading
        if (containerRef.current && speechRef.current) {
          const container = containerRef.current
          const speech = speechRef.current
          const containerHeight = container.clientHeight
          const speechHeight = speech.scrollHeight
          
          if (speechHeight > containerHeight) {
            // Calculate scroll so bottom of text reaches middle of screen (50% of container height)
            const maxScroll = speechHeight - (containerHeight * 0.5)
            const scrollDistance = progress * maxScroll
            container.scrollTop = scrollDistance
          }
        }
        
        // Continue or finish
        if (progress >= 1) {
          setGameState('finished')
        } else {
          rafRef.current = requestAnimationFrame(animate)
        }
      }
      
      rafRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }
  }, [gameState, currentSpeech, totalDuration])

  

  const handleStartSpeech = (speech: Speech) => {
    setCurrentSpeech(speech)
    setGameState('countdown')
    setCountdown(3)
  }

  const handleFinishEarly = () => {
    setGameState('finished')
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const handleTryAgain = () => {
    if (currentSpeech) {
      setGameState('countdown')
      setCountdown(3)
    }
  }

  const handleBackToMenu = () => {
    setGameState('menu')
    setCurrentSpeech(null)
    setScrollProgress(0)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  // Bold text display for clear reading
  const renderWords = () => {
    if (!currentSpeech || speechWords.length === 0) return null
    
    return (
      <div className="leading-relaxed text-center text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wide">
        {currentSpeech.content}
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700">
        <Card className="p-8 text-center bg-white/90 backdrop-blur-md border border-white/30 shadow-xl">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-3 border-purple-500 border-b-transparent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <p className="text-lg text-slate-700 font-medium">Loading speeches...</p>
          <p className="text-sm text-slate-500 mt-2">Preparing your speaking exercise</p>
        </Card>
      </div>
    )
  }

  // Menu state - show speech selection with enhanced UI
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700 p-4 overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.7s'}}></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header with modern styling */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 p-2 bg-white/10 backdrop-blur-md rounded-full">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2 shadow-lg">
                <span className="text-3xl">🎤</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Speech Training
            </h1>
            <p className="text-white/90 text-lg mb-6 max-w-xl mx-auto">
              Practice your public speaking skills with these motivational speeches.
              Follow the karaoke-style prompter to improve your delivery.
            </p>
            <Button
              onClick={onBackToHome}
              className="mb-8 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6 py-2 shadow-lg transition-all duration-300 hover:scale-105"
            >
              ← Back to Home
            </Button>
          </div>

          {/* Speech Grid with enhanced cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {speeches.map((speech) => {
              // Calculate approximate reading time
              const wordCount = speech.content.split(/\s+/).length
              const readingMins = Math.ceil(wordCount / 150)
              
              return (
                <Card
                  key={speech.id}
                  className="group p-5 sm:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white/95 backdrop-blur-md border border-white/50 rounded-xl overflow-hidden relative"
                  onClick={() => handleStartSpeech(speech)}
                >
                  {/* Decorative accent */}
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                  
                  <div className="text-center relative z-10">
                    <div className="mb-3 inline-flex items-center justify-center">
                      <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                        {speech.id}
                      </span>
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                      {speech.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 font-medium">
                      by {speech.author}
                    </p>
                    
                    <div className="flex items-center justify-center text-xs text-gray-500 mb-4 space-x-3">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {readingMins} min
                      </span>
                      
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                        {wordCount} words
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-10 overflow-hidden">
                      {speech.content.substring(0, 100)}...
                    </p>
                    
                    <Button className="w-full text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-md group-hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                      <span className="text-lg">🎯</span> Practice This Speech
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Countdown state with enhanced visuals
  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700 p-4 overflow-hidden relative">
        {/* Background animation */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <Card className="p-8 sm:p-12 text-center bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl max-w-md w-full relative overflow-hidden z-10">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
              Get Ready to Speak!
            </h2>
            
            {/* Enhanced countdown animation */}
            <div className="relative w-32 h-32 mx-auto mb-6 sm:mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Countdown circle background */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="6"
                />
                
                {/* Animated countdown progress */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * countdown / 3)} 
                  style={{
                    transformOrigin: "center",
                    transform: "rotate(-90deg)",
                    transition: "stroke-dashoffset 900ms ease-in-out"
                  }}
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div 
                className="absolute inset-0 flex items-center justify-center text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600"
                style={{
                  animation: 'pulse 0.9s ease-in-out infinite alternate',
                  textShadow: '0 2px 5px rgba(59, 130, 246, 0.3)'
                }}
              >
                {countdown}
              </div>
            </div>
            
            <div className="relative p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-inner mb-2">
              <p className="text-lg sm:text-xl font-medium text-blue-700">
                "{currentSpeech?.title}"
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              Follow the karaoke prompt to improve your speaking skills
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Speaking state with clean UI
  if (gameState === 'speaking') {
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-2 sm:p-4 relative overflow-hidden">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-blue-800/5 to-transparent"></div>
        </div>
        
        <div className="max-w-6xl mx-auto h-full relative z-10">
          {/* Enhanced header with timer and controls */}
          <div className="text-center mb-4 sm:mb-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              {/* Recording indicator and finish button */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/70">Recording</span>
                </div>
                
                <Button
                  onClick={handleFinishEarly}
                  className="bg-red-500/80 hover:bg-red-600 text-white text-sm px-4 py-1 rounded-full backdrop-blur-sm border border-red-400/50 transition-all duration-300 hover:scale-105 shadow-md"
                >
                  ⏹️ Finish
                </Button>
              </div>
              
              {/* Speech title */}
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  "{currentSpeech?.title}"
                </h2>
                <p className="text-sm text-white/70 mt-1">
                  {currentSpeech?.author}
                </p>
              </div>
            </div>
          </div>

      {/* Enhanced Speech Display */}
      <div className="relative">
        <Card className="bg-transparent backdrop-blur-none h-[calc(100vh-220px)] overflow-hidden rounded-3xl border-0 shadow-none">
          {/* Speech container with transparent background */}
          <div
            ref={containerRef}
            className="h-full overflow-y-scroll px-4 md:px-6 py-12 md:py-16 scrollbar-none"
            style={{ 
              background: 'transparent',
              scrollBehavior: 'auto'
            }}
          >
            <div 
              ref={speechRef} 
              className="min-h-full flex flex-col justify-start items-center pt-20 pb-[50vh]"
            >
              <div className="max-w-5xl w-full px-4">
                {renderWords()}
              </div>
            </div>
          </div>
          
        </Card>
      </div>
        </div>
      </div>
    )
  }

  // Finished state with enhanced completion screen
  if (gameState === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700 p-4 overflow-hidden relative">
        {/* Background animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.7s'}}></div>
        </div>
        
        <Card className="p-6 sm:p-10 text-center bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl max-w-md w-full relative overflow-hidden z-10">
          {/* Decorative confetti effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => {
              const size = Math.random() * 10 + 5
              const left = `${Math.random() * 100}%`
              const top = `${Math.random() * 100}%`
              const color = [
                'bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 
                'bg-green-500', 'bg-yellow-500', 'bg-pink-500'
              ][Math.floor(Math.random() * 6)]
              const delay = Math.random() * 5
              
              return (
                <div 
                  key={i}
                  className={`absolute rounded-full ${color} opacity-70`}
                  style={{
                    width: size,
                    height: size,
                    left,
                    top,
                    animation: `confetti 10s ease-in-out infinite`,
                    animationDelay: `${delay}s`
                  }}
                ></div>
              )
            })}
          </div>
          
          <div className="relative z-10">
            {/* Animated success icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-20 animate-ping" style={{animationDuration: '3s'}}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl">🎉</span>
              </div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3 sm:mb-4">
              Great Job!
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6">
              <p className="text-base sm:text-xl text-gray-700 font-medium">
                You've completed the speech practice:
              </p>
              <p className="text-sm sm:text-base text-blue-700 font-bold mt-1">
                "{currentSpeech?.title}"
              </p>
              <p className="text-xs text-gray-500 mt-1">
                by {currentSpeech?.author}
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={handleTryAgain}
                className="w-full text-sm sm:text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg py-3"
              >
                🔄 Try Again
              </Button>
              
              <Button
                onClick={handleBackToMenu}
                className="w-full text-sm sm:text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg py-3"
              >
                🎤 Choose Another Speech
              </Button>
              
              <Button
                onClick={onBackToHome}
                variant="outline"
                className="w-full text-sm sm:text-base border-slate-300 hover:bg-slate-100 rounded-full py-3"
              >
                🏠 Back to Home
              </Button>
            </div>
            
            {/* Animation styles */}
            <style jsx>{`
              @keyframes confetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                10% { opacity: 0.7; }
                35% { transform: translateY(-50px) rotate(90deg); opacity: 0.7; }
                70% { transform: translateY(-100px) rotate(180deg); opacity: 0.5; }
                100% { transform: translateY(-150px) rotate(360deg); opacity: 0; }
              }
            `}</style>
          </div>
        </Card>
      </div>
    )
  }

  return null
}