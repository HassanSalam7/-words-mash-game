'use client'

import { useState, useEffect } from 'react'
import { GameWebSocket, createWebSocket } from '@/lib/websocket'
import { useWords, useTranslationWords, useMetaphoricalSentences } from '@/lib/hooks/useGameData'
import EnhancedEntryScreen from '@/components/game/EnhancedEntryScreen'
import WaitingRoom from '@/components/game/WaitingRoom'
import ChallengeScreen from '@/components/game/ChallengeScreen'
import TranslationChallengeScreen from '@/components/game/TranslationChallengeScreen'
import AnswerModeSelector from '@/components/game/AnswerModeSelector'
import ResultsScreen from '@/components/game/ResultsScreen'
import PrivateRoom from '@/components/game/PrivateRoom'
import { GameMode, TranslationMode } from '@/components/game/EnhancedGameModeSelector'
import { ComputerPlayer, createComputerPlayerByDifficulty } from '@/lib/computerPlayer'
import SinglePlayerStoryScreen from '@/components/game/SinglePlayerStoryScreen'
import SinglePlayerTranslationScreen from '@/components/game/SinglePlayerTranslationScreen'
import SpeechTrainingScreen from '@/components/game/SpeechTrainingScreen'
import ConversationGeneratorScreen from '@/components/game/ConversationGeneratorScreen'
import MultiplayerConversationScreen from '@/components/game/MultiplayerConversationScreen'
import ConnectionStatus from '@/components/ui/connection-status'

export type GameState = 'entry' | 'waiting' | 'private-room' | 'answer-mode-selection' | 'challenge' | 'results' | 'single-player' | 'speech-training' | 'conversation-generator'

interface Word {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GameData {
  gameId: string;
  gameMode: GameMode['id'];
  answerMode?: 'multiple-choice' | 'typing' | 'metaphorical';
  words: Word[];
  translationWords?: Array<{
    english: string;
    arabic: string;
    wrongOptions: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    options?: string[];
  }>;
  metaphoricalSentences?: Array<{
    english: string;
    arabic: string;
    metaphor: string;
    wrongOptions: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    options?: string[];
  }>;
  opponent: {
    player1: { name: string; avatar: string };
    player2: { name: string; avatar: string };
  };
  players?: Array<{
    id: string;
    name: string;
    avatar: string;
    score: number;
    color: string;
  }>;
  timeLimit: number;
  currentPlayer?: {
    id: string;
    name: string;
    avatar: string;
    score: number;
    color: string;
  };
  roundNumber?: number;
  totalRounds?: number;
  gameStatus?: 'waiting' | 'playing' | 'showing-result' | 'completed';
  lastRoundWinner?: {
    id: string;
    name: string;
    avatar: string;
    score: number;
    color: string;
  } | null;
  correctAnswer?: string;
  isPlayer1?: boolean;
  currentQuestion?: {
    type: 'translation' | 'metaphorical';
    english?: string;
    metaphor?: string;
    options?: string[];
  };
}

interface GameResults {
  gameId: string;
  stories: {
    playerName: string;
    avatar: string;
    story: string;
    usedWords: string[];
    wordsCount: number;
  }[];
}

// Helper functions to load game data using React Query data
const getStoryWords = (wordsData: Record<string, string[]> | undefined) => {
  if (!wordsData) {
    // Fallback words
    return [
      { word: 'adventure', difficulty: 'easy' as const },
      { word: 'magic', difficulty: 'easy' as const },
      { word: 'forest', difficulty: 'easy' as const },
      { word: 'mysterious', difficulty: 'medium' as const },
      { word: 'journey', difficulty: 'medium' as const }
    ]
  }

  // Combine words from all difficulty levels
  const allWords: { word: string, difficulty: 'easy' | 'medium' | 'hard' }[] = []
  
  if (wordsData.easy && Array.isArray(wordsData.easy)) {
    allWords.push(...wordsData.easy.map((word: string) => ({ word, difficulty: 'easy' as const })))
  }
  if (wordsData.medium && Array.isArray(wordsData.medium)) {
    allWords.push(...wordsData.medium.map((word: string) => ({ word, difficulty: 'medium' as const })))
  }
  if (wordsData.hard && Array.isArray(wordsData.hard)) {
    allWords.push(...wordsData.hard.map((word: string) => ({ word, difficulty: 'hard' as const })))
  }
  
  // Select 5 random words for story writing
  return allWords.sort(() => Math.random() - 0.5).slice(0, 5)
}

const getTranslationWords = (
  mode: string,
  translationWordsData: any,
  metaphoricalSentencesData: any
) => {
  if (mode === 'metaphorical') {
    if (!metaphoricalSentencesData) {
      return [
        { english: 'Time is money', arabic: 'الوقت من ذهب', metaphor: 'Time is precious like gold', wrongOptions: ['المال سهل', 'الذهب رخيص', 'السرعة مهمة'], difficulty: 'medium', options: ['الوقت من ذهب', 'المال سهل', 'الذهب رخيص', 'السرعة مهمة'] }
      ]
    }

    // Handle both array and object structures
    let sentences = []
    if (Array.isArray(metaphoricalSentencesData)) {
      sentences = metaphoricalSentencesData
    } else if (metaphoricalSentencesData.sentences && Array.isArray(metaphoricalSentencesData.sentences)) {
      sentences = metaphoricalSentencesData.sentences
    } else {
      // If it's an object with difficulty levels, combine them
      const allSentences: any[] = []
      Object.keys(metaphoricalSentencesData).forEach(key => {
        if (Array.isArray(metaphoricalSentencesData[key])) {
          allSentences.push(...metaphoricalSentencesData[key].map((item: any) => ({ ...item, difficulty: key })))
        }
      })
      sentences = allSentences
    }
    
    return sentences.sort(() => Math.random() - 0.5).slice(0, 15).map((item: any) => ({
      ...item,
      options: [item.arabic, ...item.wrongOptions].sort(() => Math.random() - 0.5)
    }))
  } else {
    if (!translationWordsData) {
      return [
        { english: 'cat', arabic: 'قطة', wrongOptions: ['كلب', 'طائر', 'سمكة'], difficulty: 'easy', options: ['قطة', 'كلب', 'طائر', 'سمكة'] },
        { english: 'house', arabic: 'بيت', wrongOptions: ['مدرسة', 'سيارة', 'شجرة'], difficulty: 'easy', options: ['بيت', 'مدرسة', 'سيارة', 'شجرة'] }
      ]
    }

    // Handle object structure with difficulty levels
    const allWords: any[] = []
    
    if (translationWordsData.easy && Array.isArray(translationWordsData.easy)) {
      allWords.push(...translationWordsData.easy.map((item: any) => ({ ...item, difficulty: 'easy' })))
    }
    if (translationWordsData.medium && Array.isArray(translationWordsData.medium)) {
      allWords.push(...translationWordsData.medium.map((item: any) => ({ ...item, difficulty: 'medium' })))
    }
    if (translationWordsData.hard && Array.isArray(translationWordsData.hard)) {
      allWords.push(...translationWordsData.hard.map((item: any) => ({ ...item, difficulty: 'hard' })))
    }
    
    return allWords.sort(() => Math.random() - 0.5).slice(0, 15).map((item: any) => ({
      ...item,
      options: [item.arabic, ...item.wrongOptions].sort(() => Math.random() - 0.5)
    }))
  }
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('entry')
  const [playerName, setPlayerName] = useState('')
  const [socket, setSocket] = useState<GameWebSocket | null>(null)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [waitingPlayers, setWaitingPlayers] = useState<Array<{name: string, avatar: string}>>([])
  const [incomingReactions, setIncomingReactions] = useState<Record<number, string[]>>({})
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting')
  const [playerAvatar, setPlayerAvatar] = useState('https://api.dicebear.com/9.x/adventurer/svg?seed=Jude&flip=false')
  const [gameMode, setGameMode] = useState<GameMode['id']>('story-writing')
  const [translationMode, setTranslationMode] = useState<TranslationMode['id'] | undefined>(undefined)
  const [isHost, setIsHost] = useState(false)
  const [privateRoom, setPrivateRoom] = useState<{code: string, players: Array<{name: string, avatar: string}>, isHost: boolean} | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [isSinglePlayer, setIsSinglePlayer] = useState(false)
  const [computerPlayer, setComputerPlayer] = useState<ComputerPlayer | null>(null)
  const [singlePlayerWords, setSinglePlayerWords] = useState<any[]>([])
  const [singlePlayerScore, setSinglePlayerScore] = useState({ player: 0, computer: 0 })

  // React Query hooks for data fetching
  const { data: wordsData, isLoading: wordsLoading, error: wordsError } = useWords()
  const { data: translationWordsData, isLoading: translationWordsLoading, error: translationWordsError } = useTranslationWords()
  const { data: metaphoricalSentencesData, isLoading: metaphoricalSentencesLoading, error: metaphoricalSentencesError } = useMetaphoricalSentences()

  // Enhanced Socket.IO connection configuration for page.tsx
// Add this to your useEffect in page.tsx

useEffect(() => {
  // Only create socket connection once
  if (socket) {
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }
  
  // Clean WebSocket connection - much more reliable!
  const newSocket = createWebSocket()
  
  setSocket(newSocket)

  // Make socket available globally for components
  if (typeof window !== 'undefined') {
    (window as any).socket = newSocket
  }

  // Connect to WebSocket server
  newSocket.connect().then(() => {
    console.log('WebSocket connection established')
  }).catch((error) => {
    console.error('Failed to connect:', error)
    setConnectionStatus('disconnected')
  })

  // Basic network detection
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('📶 Network online')
      if (newSocket.disconnected) {
        newSocket.connect()
      }
    })
    
    window.addEventListener('offline', () => {
      console.log('📴 Network offline')
      setConnectionStatus('disconnected')
    })
  }

  // Clean WebSocket event listeners
  newSocket.on('connect', () => {
    console.log('✅ WebSocket connected successfully')
    setConnectionStatus('connected')
  })

  newSocket.on('connect_error', (error) => {
    console.error('❌ WebSocket connection error:', error.message || error)
    setConnectionStatus('disconnected')
  })

  newSocket.on('disconnect', (data) => {
    console.log('🔌 WebSocket disconnected:', data.reason)
    setConnectionStatus('disconnected')
  })

  // Game event listeners (your existing code...)
  newSocket.on('waiting-players-update', (players) => {
    setWaitingPlayers(players)
  })

  newSocket.on('game-start', (data: GameData) => {
    setGameData(data)
    if (data.gameMode === 'conversation-generator') {
      setGameState('challenge')
    } else {
      setGameState('challenge')
    }
  })

  newSocket.on('game-update', (data: GameData) => {
    setGameData(data)
  })

  newSocket.on('select-answer-mode', (data) => {
    console.log('Received select-answer-mode event:', data)
    setIsHost(data.isHost)
    setGameState('answer-mode-selection')
  })

  newSocket.on('round-feedback', (data) => {
    setGameData(prevData => ({
      ...prevData,
      ...data,
      gameStatus: data.gameStatus,
      lastRoundWinner: data.lastRoundWinner,
      correctAnswer: data.correctAnswer,
      players: data.players
    }))
  })

  // Translation game events
  newSocket.on('round-result', (data) => {
    console.log('🎯 Round result received:', data)
    setGameData(prevData => ({
      ...prevData,
      roundNumber: data.round,
      lastRoundWinner: data.roundWinner,
      correctAnswer: data.correctAnswer,
      players: data.playerScores?.map(score => {
        const player = prevData?.players?.find(p => p.id === score.id)
        return player ? { ...player, score: score.score } : {
          id: score.id,
          name: score.name,
          avatar: player?.avatar || 'https://api.dicebear.com/9.x/adventurer/svg?seed=default',
          score: score.score,
          color: player?.color || '#8B5CF6'
        }
      }) || prevData?.players || [],
      gameStatus: 'showing-result'
    }))
    
    // Show round result for 1 second before next round (fast-paced)
    setTimeout(() => {
      setGameData(prevData => ({
        ...prevData,
        gameStatus: 'playing'
      }))
    }, 1000)
  })

  newSocket.on('next-round', (data) => {
    console.log('▶️ Next round received:', data)
    setGameData(prevData => ({
      ...prevData,
      roundNumber: data.round,
      totalRounds: data.totalRounds,
      gameStatus: 'playing',
      translationWords: data.question?.type === 'translation' ? [data.question] : prevData?.translationWords,
      metaphoricalSentences: data.question?.type === 'metaphorical' ? [data.question] : prevData?.metaphoricalSentences,
      currentQuestion: data.question
    }))
  })

  newSocket.on('player-submitted', (data) => {
    console.log('👥 Player submitted:', data)
    // Optional: Show submission status to players
  })

  newSocket.on('game-results', (results: GameResults) => {
    setGameResults(results)
    setGameState('results')
  })

  newSocket.on('join-error', (error: { message: string }) => {
    console.error('Join error:', error)
    alert(`Error joining game: ${error.message}`)
    setGameState('entry')
  })

  newSocket.on('opponent-finished', () => {
    console.log('Opponent has finished their story!')
  })

  // Private room events
  newSocket.on('room-created', (data) => {
    setPrivateRoom({
      code: data.room.code,
      players: data.room.players.map((p: any) => ({ name: p.name, avatar: p.avatar })),
      isHost: true
    })
    setGameState('private-room')
  })

  newSocket.on('room-updated', (data) => {
    setPrivateRoom(prev => prev ? {
      ...prev,
      players: data.room.players.map((p: any) => ({ name: p.name, avatar: p.avatar }))
    } : null)
  })

  newSocket.on('room-error', (error) => {
    setRoomError(error.message)
    setTimeout(() => setRoomError(null), 5000)
  })

  newSocket.on('player-left', (data) => {
    console.log(`Player ${data.playerName} left the room`)
  })

  // Cleanup function
  return () => {
    console.log('🧹 Cleaning up socket connection')
    if (newSocket) {
      newSocket.removeAllListeners()
      newSocket.close()
    }
  }
}, []) // Empty dependency array to run only once

  const handleStartGame = (name: string, avatar: string, selectedGameMode: GameMode['id'], selectedTranslationMode?: TranslationMode['id']) => {
    console.log('🔵 FRONTEND: handleStartGame called with:', {
      name,
      selectedGameMode,
      selectedTranslationMode
    });
    
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setGameMode(selectedGameMode)
    setTranslationMode(selectedTranslationMode)
    if (socket) {
      const joinData = { name, avatar, gameMode: selectedGameMode, translationMode: selectedTranslationMode };
      console.log('🔵 FRONTEND: Emitting join-game with data:', joinData);
      socket.emit('join-game', joinData)
      setGameState('waiting')
    }
  }

  const handleCreatePrivateRoom = (name: string, avatar: string, selectedGameMode: GameMode['id'], selectedTranslationMode?: TranslationMode['id']) => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setGameMode(selectedGameMode)
    setTranslationMode(selectedTranslationMode)
    if (socket) {
      socket.emit('create-private-room', { name, avatar, gameMode: selectedGameMode, translationMode: selectedTranslationMode })
    }
  }

  const handleJoinPrivateRoom = (name: string, avatar: string, roomCode: string, selectedGameMode: GameMode['id'], selectedTranslationMode?: TranslationMode['id']) => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setGameMode(selectedGameMode)
    setTranslationMode(selectedTranslationMode)
    if (socket) {
      socket.emit('join-private-room', { roomCode, playerData: { name, avatar, gameMode: selectedGameMode, translationMode: selectedTranslationMode } })
      setPrivateRoom({
        code: roomCode,
        players: [{ name, avatar }],
        isHost: false
      })
      setGameState('private-room')
    }
  }

  const handleStartSinglePlayer = async (name: string, avatar: string, selectedGameMode: GameMode['id'], selectedTranslationMode?: TranslationMode['id'], difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setGameMode(selectedGameMode)
    setTranslationMode(selectedTranslationMode)
    setIsSinglePlayer(true)
    
    const computer = createComputerPlayerByDifficulty(difficulty)
    setComputerPlayer(computer)
    
    // Generate game data based on mode
    if (selectedGameMode === 'story-writing') {
      // Load story writing words
      const words = getStoryWords(wordsData)
      setSinglePlayerWords(words)
    } else if (selectedGameMode === 'translation') {
      // Load translation words based on mode
      const translationWords = getTranslationWords(
        selectedTranslationMode || 'multiple-choice',
        translationWordsData,
        metaphoricalSentencesData
      )
      setSinglePlayerWords(translationWords)
    }
    
    setGameState('single-player')
  }

  const handleSinglePlayerGameEnd = (results: any) => {
    setGameResults(results)
    setGameState('results')
  }

  const handleLeaveRoom = () => {
    setPrivateRoom(null)
    setGameState('entry')
    if (socket) {
      socket.disconnect()
      socket.connect()
    }
  }

  const handleCompleteChallenge = (story: string, usedWords: string[]) => {
    if (socket) {
      socket.emit('submit-story', { story, usedWords })
    }
  }

  const handleSubmitAnswer = (answer: string, timeUsed: number) => {
    if (socket) {
      socket.emit('submit-translation-answer', { answer, timeUsed })
    }
  }

  const handleAnswerModeSelect = (answerMode: 'multiple-choice' | 'typing') => {
    if (socket) {
      socket.emit('select-answer-mode', { answerMode })
    }
  }

  const handlePlayAgain = () => {
    if (socket) {
      socket.emit('join-game', { 
        name: playerName, 
        avatar: playerAvatar,
        gameMode: gameMode,
        translationMode: translationMode
      })
      setGameState('waiting')
      setGameData(null)
      setGameResults(null)
      setIncomingReactions({})
    }
  }

  const handleStartSpeechTraining = (name: string, avatar: string) => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setGameState('speech-training')
  }


  const handleBackToHome = () => {
    setGameState('entry')
    setGameData(null)
    setGameResults(null)
    setIncomingReactions({})
    setPlayerName('')
    setPlayerAvatar('https://api.dicebear.com/9.x/adventurer/svg?seed=Jude&flip=false')
    setGameMode('story-writing')
    setTranslationMode(undefined)
    setPrivateRoom(null)
    setIsSinglePlayer(false)
    setComputerPlayer(null)
    setSinglePlayerWords([])
    setSinglePlayerScore({ player: 0, computer: 0 })
  }

  const renderGameState = () => {
    switch (gameState) {
      case 'entry':
        return (
          <EnhancedEntryScreen 
            onStartGame={handleStartGame}
            onCreatePrivateRoom={handleCreatePrivateRoom}
            onJoinPrivateRoom={handleJoinPrivateRoom}
            onStartSinglePlayer={handleStartSinglePlayer}
            onStartSpeechTraining={handleStartSpeechTraining}
          />
        )
      case 'waiting':
        return (
          <WaitingRoom 
            playerName={playerName}
            waitingPlayers={waitingPlayers}
            onGameStart={() => setGameState('challenge')}
            onBack={() => setGameState('entry')}
          />
        )
      case 'private-room':
        return privateRoom ? (
          <PrivateRoom 
            roomCode={privateRoom.code}
            players={privateRoom.players}
            isHost={privateRoom.isHost}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : null
      case 'answer-mode-selection':
        return (
          <AnswerModeSelector
            onModeSelect={handleAnswerModeSelect}
            isHost={isHost}
          />
        )
      case 'challenge':
        return gameData ? (
          gameData.gameMode === 'conversation-generator' ? (
            <MultiplayerConversationScreen
              socket={socket}
              gameData={{
                gameId: gameData.gameId,
                currentPlayer: gameData.currentPlayer || { id: '', name: playerName, avatar: playerAvatar, score: 0, color: '#8B5CF6' },
                opponent: gameData.isPlayer1 
                  ? { ...gameData.opponent.player1, id: 'player1', score: 0, color: '#EF4444' }
                  : { ...gameData.opponent.player2, id: 'player2', score: 0, color: '#EF4444' },
                gameStatus: gameData.gameStatus || 'waiting_for_player1',
                isPlayer1: gameData.isPlayer1 || false
              }}
              onBackToHome={handleBackToHome}
            />
          ) : gameData.gameMode === 'translation' ? (
            <TranslationChallengeScreen
              words={
                gameData.currentQuestion ? [gameData.currentQuestion] : 
                gameData.answerMode === 'metaphorical' ? gameData.metaphoricalSentences || [] : 
                gameData.translationWords || []
              }
              players={gameData.players || []}
              currentPlayer={gameData.currentPlayer || { 
                id: '', 
                name: playerName || 'Player', 
                avatar: playerAvatar || 'https://api.dicebear.com/9.x/adventurer/svg?seed=default', 
                score: 0, 
                color: '#8B5CF6' 
              }}
              onSubmitAnswer={handleSubmitAnswer}
              timeLimit={30}
              roundNumber={gameData.roundNumber || 1}
              totalRounds={gameData.totalRounds || 15}
              answerMode={gameData.answerMode || 'multiple-choice'}
              gameStatus={gameData.gameStatus || 'playing'}
              lastRoundWinner={gameData.lastRoundWinner}
              correctAnswer={gameData.correctAnswer}
            />
          ) : (
            <ChallengeScreen 
              words={gameData.words}
              onComplete={handleCompleteChallenge}
              timeLimit={gameData.timeLimit / 1000} // Convert to seconds
            />
          )
        ) : null
      case 'results':
        return gameResults ? (
          <ResultsScreen 
            results={gameResults}
            onPlayAgain={handlePlayAgain}
            onBackToHome={handleBackToHome}
            incomingReactions={incomingReactions}
          />
        ) : null
      case 'single-player':
        return singlePlayerWords.length > 0 && computerPlayer ? (
          gameMode === 'translation' ? (
            <SinglePlayerTranslationScreen
              words={singlePlayerWords}
              computerPlayer={computerPlayer}
              playerName={playerName}
              playerAvatar={playerAvatar}
              translationMode={translationMode || 'multiple-choice'}
              onGameEnd={handleSinglePlayerGameEnd}
              onBackToHome={handleBackToHome}
            />
          ) : (
            <SinglePlayerStoryScreen
              words={singlePlayerWords}
              computerPlayer={computerPlayer}
              playerName={playerName}
              playerAvatar={playerAvatar}
              onGameEnd={handleSinglePlayerGameEnd}
              onBackToHome={handleBackToHome}
            />
          )
        ) : null
      case 'speech-training':
        return (
          <SpeechTrainingScreen
            onBackToHome={handleBackToHome}
          />
        )
      case 'conversation-generator':
        return (
          <ConversationGeneratorScreen
            onBackToHome={handleBackToHome}
          />
        )
      default:
        return (
          <EnhancedEntryScreen 
            onStartGame={handleStartGame}
            onCreatePrivateRoom={handleCreatePrivateRoom}
            onJoinPrivateRoom={handleJoinPrivateRoom}
            onStartSinglePlayer={handleStartSinglePlayer}
            onStartSpeechTraining={handleStartSpeechTraining}
          />
        )
    }
  }

  return (
    <main className="min-h-screen relative bg-gradient-to-br from-white via-blue-500 to-cyan-400">
      {/* Enhanced Connection Status */}
      <ConnectionStatus connectionStatus={connectionStatus} />
      
      {/* Legacy connection indicator for fallback */}
      {connectionStatus !== 'connected' && (
        <div className={`fixed top-16 right-4 z-40 px-4 py-2 rounded-lg text-white text-sm font-medium ${
          connectionStatus === 'connecting' || connectionStatus === 'reconnecting' 
            ? 'bg-yellow-500' 
            : 'bg-red-500'
        }`}>
          {connectionStatus === 'connecting' && '🔄 Connecting...'}
          {connectionStatus === 'reconnecting' && '🔄 Reconnecting...'}
          {connectionStatus === 'disconnected' && '❌ Connection Lost'}
        </div>
      )}
      
      {/* Room Error Indicator */}
      {roomError && (
        <div className="fixed top-4 left-4 z-50 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium">
          ❌ {roomError}
        </div>
      )}
      
      {renderGameState()}
    </main>
  )
}