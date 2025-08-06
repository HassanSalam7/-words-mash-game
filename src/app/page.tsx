'use client'

import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import EnhancedEntryScreen from '@/components/game/EnhancedEntryScreen'
import WaitingRoom from '@/components/game/WaitingRoom'
import ChallengeScreen from '@/components/game/ChallengeScreen'
import TranslationChallengeScreen from '@/components/game/TranslationChallengeScreen'
import AnswerModeSelector from '@/components/game/AnswerModeSelector'
import ResultsScreen from '@/components/game/ResultsScreen'
import PrivateRoom from '@/components/game/PrivateRoom'
import { GameMode, TranslationMode } from '@/components/game/EnhancedGameModeSelector'

export type GameState = 'entry' | 'waiting' | 'private-room' | 'answer-mode-selection' | 'challenge' | 'results'

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

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('entry')
  const [playerName, setPlayerName] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [waitingPlayers, setWaitingPlayers] = useState<Array<{name: string, avatar: string}>>([])
  const [incomingReactions, setIncomingReactions] = useState<Record<number, string[]>>({})
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting')
  const [playerAvatar, setPlayerAvatar] = useState('👤')
  const [gameMode, setGameMode] = useState<GameMode['id']>('story-writing')
  const [translationMode, setTranslationMode] = useState<TranslationMode['id'] | undefined>(undefined)
  const [isHost, setIsHost] = useState(false)
  const [privateRoom, setPrivateRoom] = useState<{code: string, players: Array<{name: string, avatar: string}>, isHost: boolean} | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)

  useEffect(() => {
    // Check for room parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const roomParam = urlParams.get('room')
      if (roomParam && gameState === 'entry') {
        // Auto-focus on join room mode if room parameter exists
        // This will be handled by the EntryScreen component
      }
    }
    
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (process.env.NODE_ENV === 'production'
        ? `https://${window.location.hostname}` // Fallback for production
        : 'http://localhost:4569') // Development fallback
    
    console.log('Socket URL:', socketUrl)
    const newSocket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      withCredentials: false
    })
    setSocket(newSocket)

    // Make socket available globally for components
    if (typeof window !== 'undefined') {
      (window as any).socket = newSocket
    }

    // Connection event listeners with enhanced mobile debugging
    newSocket.on('connect', () => {
      console.log('Socket connected successfully', {
        id: newSocket.id,
        transport: newSocket.io.engine?.transport?.name || 'unknown'
      })
      setConnectionStatus('connected')
    })

    newSocket.on('connect_error', (error) => {
      console.log('Socket connection error:', {
        message: error.message,
        description: (error as any).description,
        type: (error as any).type,
        transport: newSocket.io.engine?.transport?.name || 'unknown'
      })
      setConnectionStatus('disconnected')
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', {
        reason,
        transport: newSocket.io.engine?.transport?.name || 'unknown'
      })
      setConnectionStatus('disconnected')
    })

    // Transport upgrade monitoring removed for production compatibility

    // Try to connect with a small delay to prevent rapid reconnections
    setTimeout(() => {
      newSocket.connect()
    }, 100)

    // Socket event listeners
    newSocket.on('waiting-players-update', (players) => {
      setWaitingPlayers(players)
    })

    newSocket.on('game-start', (data: GameData) => {
      setGameData(data)
      setGameState('challenge')
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

    newSocket.on('game-results', (results: GameResults) => {
      setGameResults(results)
      setGameState('results')
    })

    newSocket.on('opponent-finished', () => {
      console.log('Opponent has finished their story!')
    })

    newSocket.on('opponent-disconnected', () => {
      console.log('Opponent disconnected')
      setGameState('waiting')
    })

    newSocket.on('emoji-reaction', (data) => {
      setIncomingReactions(prev => ({
        ...prev,
        [data.targetStory]: [...(prev[data.targetStory] || []), data.emoji]
      }))
    })

    newSocket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting')
    })

    newSocket.on('reconnect', () => {
      setConnectionStatus('connected')
      // Rejoin game if we were in one
      if (playerName && gameState === 'waiting') {
        newSocket.emit('join-game', { name: playerName, avatar: playerAvatar })
      }
    })

    // Private room events
    newSocket.on('room-created', (data) => {
      setPrivateRoom({
        code: data.roomCode,
        players: data.room.players.map((p: any) => ({ name: p.name, avatar: p.avatar })),
        isHost: true
      })
      setGameState('private-room')
    })

    newSocket.on('room-updated', (data) => {
      if (privateRoom) {
        setPrivateRoom({
          ...privateRoom,
          players: data.room.players.map((p: any) => ({ name: p.name, avatar: p.avatar }))
        })
      }
    })

    newSocket.on('room-error', (data) => {
      setRoomError(data.message)
      setGameState('entry')
      setTimeout(() => setRoomError(null), 5000)
    })

    newSocket.on('player-left', (data) => {
      console.log(`${data.playerName} left the room`)
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const handleStartGame = (name: string, avatar: string, selectedGameMode: GameMode['id'], selectedTranslationMode?: TranslationMode['id']) => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setGameMode(selectedGameMode)
    setTranslationMode(selectedTranslationMode)
    if (socket) {
      socket.emit('join-game', { name, avatar, gameMode: selectedGameMode, translationMode: selectedTranslationMode })
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

  const handleBackToHome = () => {
    setGameState('entry')
    setGameData(null)
    setGameResults(null)
    setIncomingReactions({})
    setPlayerName('')
    setPlayerAvatar('👤')
    setGameMode('story-writing')
    setTranslationMode(undefined)
    setPrivateRoom(null)
  }

  const renderGameState = () => {
    switch (gameState) {
      case 'entry':
        return (
          <EnhancedEntryScreen 
            onStartGame={handleStartGame}
            onCreatePrivateRoom={handleCreatePrivateRoom}
            onJoinPrivateRoom={handleJoinPrivateRoom}
          />
        )
      case 'waiting':
        return (
          <WaitingRoom 
            playerName={playerName}
            waitingPlayers={waitingPlayers}
            onGameStart={() => setGameState('challenge')}
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
          gameData.gameMode === 'translation' ? (
            <TranslationChallengeScreen
              words={gameData.answerMode === 'metaphorical' ? gameData.metaphoricalSentences || [] : gameData.translationWords || []}
              players={gameData.players || []}
              currentPlayer={gameData.currentPlayer || { id: '', name: playerName, avatar: playerAvatar, score: 0, color: '#8B5CF6' }}
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
      default:
        return (
          <EnhancedEntryScreen 
            onStartGame={handleStartGame}
            onCreatePrivateRoom={handleCreatePrivateRoom}
            onJoinPrivateRoom={handleJoinPrivateRoom}
          />
        )
    }
  }

  return (
    <main className="min-h-screen relative bg-gradient-to-br from-white via-blue-500 to-cyan-400">
      {/* Connection Status Indicator */}
      {connectionStatus !== 'connected' && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium ${
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