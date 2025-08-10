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
import { ComputerPlayer, createComputerPlayerByDifficulty } from '@/lib/computerPlayer'
import SinglePlayerStoryScreen from '@/components/game/SinglePlayerStoryScreen'
import SinglePlayerTranslationScreen from '@/components/game/SinglePlayerTranslationScreen'
import SpeechTrainingScreen from '@/components/game/SpeechTrainingScreen'
import ConversationGeneratorScreen from '@/components/game/ConversationGeneratorScreen'
import MultiplayerConversationScreen from '@/components/game/MultiplayerConversationScreen'

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

// Helper functions to load game data
const loadStoryWords = async () => {
  try {
    const response = await fetch('/words.json')
    const wordsData = await response.json()
    
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
    const selectedWords = allWords.sort(() => Math.random() - 0.5).slice(0, 5)
    return selectedWords
  } catch (error) {
    console.error('Error loading words:', error)
    // Fallback words
    return [
      { word: 'adventure', difficulty: 'easy' as const },
      { word: 'magic', difficulty: 'easy' as const },
      { word: 'forest', difficulty: 'easy' as const },
      { word: 'mysterious', difficulty: 'medium' as const },
      { word: 'journey', difficulty: 'medium' as const }
    ]
  }
}

const loadTranslationWords = async (mode: string) => {
  try {
    if (mode === 'metaphorical') {
      const response = await fetch('/metaphorical-sentences.json')
      const data = await response.json()
      
      // Handle both array and object structures
      let sentences = []
      if (Array.isArray(data)) {
        sentences = data
      } else if (data.sentences && Array.isArray(data.sentences)) {
        sentences = data.sentences
      } else {
        // If it's an object with difficulty levels, combine them
        const allSentences: any[] = []
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            allSentences.push(...data[key].map((item: any) => ({ ...item, difficulty: key })))
          }
        })
        sentences = allSentences
      }
      
      return sentences.sort(() => Math.random() - 0.5).slice(0, 15).map((item: any) => ({
        ...item,
        options: [item.arabic, ...item.wrongOptions].sort(() => Math.random() - 0.5)
      }))
    } else {
      const response = await fetch('/translation-words.json')
      const data = await response.json()
      
      // Handle object structure with difficulty levels
      const allWords: any[] = []
      
      if (data.easy && Array.isArray(data.easy)) {
        allWords.push(...data.easy.map((item: any) => ({ ...item, difficulty: 'easy' })))
      }
      if (data.medium && Array.isArray(data.medium)) {
        allWords.push(...data.medium.map((item: any) => ({ ...item, difficulty: 'medium' })))
      }
      if (data.hard && Array.isArray(data.hard)) {
        allWords.push(...data.hard.map((item: any) => ({ ...item, difficulty: 'hard' })))
      }
      
      return allWords.sort(() => Math.random() - 0.5).slice(0, 15).map((item: any) => ({
        ...item,
        options: [item.arabic, ...item.wrongOptions].sort(() => Math.random() - 0.5)
      }))
    }
  } catch (error) {
    console.error('Error loading translation words:', error)
    // Fallback translation words
    return [
      { english: 'cat', arabic: 'قطة', wrongOptions: ['كلب', 'طائر', 'سمكة'], difficulty: 'easy', options: ['قطة', 'كلب', 'طائر', 'سمكة'] },
      { english: 'house', arabic: 'بيت', wrongOptions: ['مدرسة', 'سيارة', 'شجرة'], difficulty: 'easy', options: ['بيت', 'مدرسة', 'سيارة', 'شجرة'] }
    ]
  }
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
      // For conversation-generator mode, handle it differently
      if (data.gameMode === 'conversation-generator') {
        setGameState('challenge') // We'll use challenge state but render conversation screen
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
        newSocket.emit('join-game', { 
          name: playerName, 
          avatar: playerAvatar,
          gameMode: gameMode,
          translationMode: translationMode 
        })
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
      const words = await loadStoryWords()
      setSinglePlayerWords(words)
    } else if (selectedGameMode === 'translation') {
      // Load translation words based on mode
      const translationWords = await loadTranslationWords(selectedTranslationMode || 'multiple-choice')
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
                opponent: gameData.isPlayer1 ? gameData.opponent.player1 : gameData.opponent.player2,
                gameStatus: gameData.gameStatus || 'waiting_for_player1',
                isPlayer1: gameData.isPlayer1 || false
              }}
              onBackToHome={handleBackToHome}
            />
          ) : gameData.gameMode === 'translation' ? (
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