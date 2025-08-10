const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || ["https://*.vercel.app"] 
      : (origin, callback) => {
          // Allow all localhost and local network origins in development
          if (!origin || 
              origin.includes('localhost:') || 
              origin.includes('127.0.0.1:') ||
              origin.match(/192\.168\.\d+\.\d+/)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  serveClient: false,
  allowUpgrades: true
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || ["https://*.vercel.app"] 
    : (origin, callback) => {
        // Allow all localhost and local network origins in development
        if (!origin || 
            origin.includes('localhost:') || 
            origin.includes('127.0.0.1:') ||
            origin.match(/192\.168\.\d+\.\d+/)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  methods: ["GET", "POST"],
  credentials: false
}));
app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeGames: games.size,
    waitingPlayers: waitingPlayers.length,
    privateRooms: privateRooms.size
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'WordMash Battle Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Game state
const games = new Map();
const waitingPlayers = [];
const privateRooms = new Map(); // roomCode -> room data

// Load words data
const wordsPath = path.join(__dirname, 'public', 'words.json');
const translationWordsPath = path.join(__dirname, 'public', 'translation-words.json');
const metaphoricalSentencesPath = path.join(__dirname, 'public', 'metaphorical-sentences.json');
let wordsData = [];
let translationWordsData = [];
let metaphoricalSentencesData = [];

try {
  const wordsFile = fs.readFileSync(wordsPath, 'utf8');
  const rawWordsData = JSON.parse(wordsFile);
  
  // Convert the structure to array format
  wordsData = [];
  Object.keys(rawWordsData).forEach(difficulty => {
    rawWordsData[difficulty].forEach(word => {
      wordsData.push({ word, difficulty });
    });
  });
} catch (error) {
  console.error('Error loading words data:', error);
}

try {
  const translationWordsFile = fs.readFileSync(translationWordsPath, 'utf8');
  const rawTranslationWordsData = JSON.parse(translationWordsFile);
  
  // Convert the structure to array format
  translationWordsData = [];
  Object.keys(rawTranslationWordsData).forEach(difficulty => {
    rawTranslationWordsData[difficulty].forEach(wordObj => {
      translationWordsData.push({ 
        english: wordObj.english,
        arabic: wordObj.arabic,
        wrongOptions: wordObj.wrongOptions,
        difficulty 
      });
    });
  });
} catch (error) {
  console.error('Error loading translation words data:', error);
}

try {
  const metaphoricalSentencesFile = fs.readFileSync(metaphoricalSentencesPath, 'utf8');
  const rawMetaphoricalData = JSON.parse(metaphoricalSentencesFile);
  
  // Convert the structure to array format
  metaphoricalSentencesData = [];
  Object.keys(rawMetaphoricalData).forEach(difficulty => {
    rawMetaphoricalData[difficulty].forEach(sentenceObj => {
      metaphoricalSentencesData.push({ 
        english: sentenceObj.english,
        arabic: sentenceObj.arabic,
        metaphor: sentenceObj.metaphor,
        wrongOptions: sentenceObj.wrongOptions,
        difficulty 
      });
    });
  });
} catch (error) {
  console.error('Error loading metaphorical sentences data:', error);
}

// Helper functions
function generateGameId() {
  return Math.random().toString(36).substring(2, 15);
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomWords() {
  if (!wordsData.length) return [];
  
  const easyWords = wordsData.filter(w => w.difficulty === 'easy');
  const mediumWords = wordsData.filter(w => w.difficulty === 'medium');
  const hardWords = wordsData.filter(w => w.difficulty === 'hard');
  
  const selectedWords = [];
  const usedIndices = new Set(); // Track used items to avoid duplicates
  
  // Select 2 easy words without duplicates
  if (easyWords.length >= 2) {
    const easyUsed = new Set();
    for (let i = 0; i < 2; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * easyWords.length);
      } while (easyUsed.has(randomIndex) && easyUsed.size < easyWords.length);
      
      easyUsed.add(randomIndex);
      selectedWords.push(easyWords[randomIndex]);
    }
  }
  
  // Select 2 medium words without duplicates
  if (mediumWords.length >= 2) {
    const mediumUsed = new Set();
    for (let i = 0; i < 2; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * mediumWords.length);
      } while (mediumUsed.has(randomIndex) && mediumUsed.size < mediumWords.length);
      
      mediumUsed.add(randomIndex);
      selectedWords.push(mediumWords[randomIndex]);
    }
  }
  
  // Select 1 hard word
  if (hardWords.length >= 1) {
    const randomIndex = Math.floor(Math.random() * hardWords.length);
    selectedWords.push(hardWords[randomIndex]);
  }
  
  return selectedWords.slice(0, 5);
}

function getRandomTranslationWords(count = 10) {
  if (!translationWordsData.length) return [];
  
  const easyWords = translationWordsData.filter(w => w.difficulty === 'easy');
  const mediumWords = translationWordsData.filter(w => w.difficulty === 'medium');
  const hardWords = translationWordsData.filter(w => w.difficulty === 'hard');
  
  const selectedWords = [];
  const easyCount = Math.ceil(count * 0.5); // 50% easy
  const mediumCount = Math.ceil(count * 0.3); // 30% medium  
  const hardCount = Math.ceil(count * 0.2); // 20% hard
  
  // Select easy words without modifying original array
  const easyUsed = new Set();
  for (let i = 0; i < easyCount && easyWords.length > 0; i++) {
    let randomIndex;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * easyWords.length);
      attempts++;
    } while (easyUsed.has(randomIndex) && attempts < easyWords.length * 2);
    
    if (!easyUsed.has(randomIndex)) {
      easyUsed.add(randomIndex);
      selectedWords.push(easyWords[randomIndex]);
    }
  }
  
  // Select medium words without modifying original array
  const mediumUsed = new Set();
  for (let i = 0; i < mediumCount && mediumWords.length > 0; i++) {
    let randomIndex;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * mediumWords.length);
      attempts++;
    } while (mediumUsed.has(randomIndex) && attempts < mediumWords.length * 2);
    
    if (!mediumUsed.has(randomIndex)) {
      mediumUsed.add(randomIndex);
      selectedWords.push(mediumWords[randomIndex]);
    }
  }
  
  // Select hard words without modifying original array
  const hardUsed = new Set();
  for (let i = 0; i < hardCount && hardWords.length > 0; i++) {
    let randomIndex;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * hardWords.length);
      attempts++;
    } while (hardUsed.has(randomIndex) && attempts < hardWords.length * 2);
    
    if (!hardUsed.has(randomIndex)) {
      hardUsed.add(randomIndex);
      selectedWords.push(hardWords[randomIndex]);
    }
  }
  
  // Shuffle the selected words
  return selectedWords.sort(() => Math.random() - 0.5).slice(0, count);
}

function getRandomMetaphoricalSentences(count = 10) {
  if (!metaphoricalSentencesData.length) return [];
  
  const easyWords = metaphoricalSentencesData.filter(w => w.difficulty === 'easy');
  const mediumWords = metaphoricalSentencesData.filter(w => w.difficulty === 'medium');
  const hardWords = metaphoricalSentencesData.filter(w => w.difficulty === 'hard');
  
  const selectedWords = [];
  const easyCount = Math.ceil(count * 0.4); // 40% easy
  const mediumCount = Math.ceil(count * 0.4); // 40% medium  
  const hardCount = Math.ceil(count * 0.2); // 20% hard
  
  // Select easy sentences without modifying original array
  const easyUsed = new Set();
  for (let i = 0; i < easyCount && easyWords.length > 0; i++) {
    let randomIndex;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * easyWords.length);
      attempts++;
    } while (easyUsed.has(randomIndex) && attempts < easyWords.length * 2);
    
    if (!easyUsed.has(randomIndex)) {
      easyUsed.add(randomIndex);
      selectedWords.push(easyWords[randomIndex]);
    }
  }
  
  // Select medium sentences without modifying original array
  const mediumUsed = new Set();
  for (let i = 0; i < mediumCount && mediumWords.length > 0; i++) {
    let randomIndex;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * mediumWords.length);
      attempts++;
    } while (mediumUsed.has(randomIndex) && attempts < mediumWords.length * 2);
    
    if (!mediumUsed.has(randomIndex)) {
      mediumUsed.add(randomIndex);
      selectedWords.push(mediumWords[randomIndex]);
    }
  }
  
  // Select hard sentences without modifying original array
  const hardUsed = new Set();
  for (let i = 0; i < hardCount && hardWords.length > 0; i++) {
    let randomIndex;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * hardWords.length);
      attempts++;
    } while (hardUsed.has(randomIndex) && attempts < hardWords.length * 2);
    
    if (!hardUsed.has(randomIndex)) {
      hardUsed.add(randomIndex);
      selectedWords.push(hardWords[randomIndex]);
    }
  }
  
  // Shuffle the selected sentences
  return selectedWords.sort(() => Math.random() - 0.5).slice(0, count);
}

function createGame(player1, player2, gameMode = 'story-writing', answerMode = 'multiple-choice') {
  const gameId = generateGameId();
  const playerColors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444']; // Purple, Green, Orange, Red
  
  // Pre-shuffle options for translation content to keep them consistent
  let translationWords = [];
  let metaphoricalSentences = [];
  
  if (gameMode === 'translation') {
    if (answerMode === 'metaphorical') {
      metaphoricalSentences = getRandomMetaphoricalSentences(10);
      metaphoricalSentences.forEach(sentence => {
        sentence.options = [sentence.arabic, ...sentence.wrongOptions].sort(() => Math.random() - 0.5);
      });
    } else {
      translationWords = getRandomTranslationWords(15);
      // Only add options for multiple-choice mode
      if (answerMode === 'multiple-choice') {
        translationWords.forEach(word => {
          word.options = [word.arabic, ...word.wrongOptions].sort(() => Math.random() - 0.5);
        });
      }
    }
  }
  
  const game = {
    id: gameId,
    gameMode: gameMode,
    answerMode: gameMode === 'translation' ? answerMode : null,
    players: [
      { ...player1, score: 0, color: playerColors[0] },
      { ...player2, score: 0, color: playerColors[1] }
    ],
    words: gameMode === 'story-writing' ? getRandomWords() : [],
    translationWords: translationWords,
    metaphoricalSentences: metaphoricalSentences,
    stories: {},
    answers: {},
    status: gameMode === 'translation' ? 'waiting_for_mode' : (gameMode === 'conversation-generator' ? 'waiting_for_conversation' : 'playing'),
    gameStatus: gameMode === 'translation' ? 'waiting' : (gameMode === 'conversation-generator' ? 'waiting_for_player1' : 'playing'),
    startTime: Date.now(),
    timeLimit: gameMode === 'story-writing' ? 600000 : 30000, // 10 minutes for story, 30 seconds per word for translation
    currentWordIndex: 0,
    roundNumber: 1,
    totalRounds: gameMode === 'translation' ? (answerMode === 'metaphorical' ? 10 : 15) : 1,
    roundStartTime: null,
    roundAnswers: {},
    lastRoundWinner: null,
    // Conversation-specific properties
    conversationData: null,
    conversationStatus: gameMode === 'conversation-generator' ? 'waiting_for_input' : null
  };
  
  games.set(gameId, game);
  return game;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join-game', (playerData) => {
    console.log('Player wants to join:', playerData);
    
    // Validate that gameMode is provided
    if (!playerData.gameMode) {
      console.error('Player tried to join without gameMode:', socket.id);
      socket.emit('join-error', { message: 'Game mode is required' });
      return;
    }
    
    const player = {
      id: socket.id,
      name: playerData.name,
      avatar: playerData.avatar || '👤',
      gameMode: playerData.gameMode,
      translationMode: playerData.translationMode || null
    };

    console.log('Player joining with gameMode:', player.gameMode, 'translationMode:', player.translationMode);

    // Try to match players BEFORE adding to waiting list
    // This prevents race conditions where the current player gets matched with themselves
    console.log('🔴 SERVER: Searching for compatible players');
    console.log('🔴 SERVER: Current player:', { 
      name: player.name, 
      gameMode: player.gameMode, 
      translationMode: player.translationMode,
      gameMode_type: typeof player.gameMode,
      translationMode_type: typeof player.translationMode
    });
    console.log('🔴 SERVER: All waiting players (BEFORE adding current):', waitingPlayers.map(p => ({ 
      id: p.id, 
      name: p.name, 
      gameMode: p.gameMode, 
      translationMode: p.translationMode,
      gameMode_type: typeof p.gameMode,
      translationMode_type: typeof p.translationMode
    })));
    
    // Find ONE compatible player from existing waiting players (not including current player)
    let matchedPlayer = null;
    for (const waitingPlayer of waitingPlayers) {
      const gameModeMatch = waitingPlayer.gameMode === player.gameMode;
      const translationModeMatch = (waitingPlayer.gameMode !== 'translation' || waitingPlayer.translationMode === player.translationMode);
      
      console.log(`🔴 SERVER: Checking compatibility with ${waitingPlayer.name}:`);
      console.log(`   - gameMode match: ${waitingPlayer.gameMode} === ${player.gameMode} = ${gameModeMatch}`);
      console.log(`   - translationMode check: ${waitingPlayer.gameMode !== 'translation'} || ${waitingPlayer.translationMode} === ${player.translationMode} = ${translationModeMatch}`);
      console.log(`   - Overall compatible: ${gameModeMatch && translationModeMatch}`);
      
      if (gameModeMatch && translationModeMatch) {
        matchedPlayer = waitingPlayer;
        console.log(`🔴 SERVER: MATCH FOUND! ${player.name} matched with ${waitingPlayer.name}`);
        break;
      }
    }
    
    if (matchedPlayer) {
      // Remove the matched player from waiting list
      const matchedIndex = waitingPlayers.findIndex(p => p.id === matchedPlayer.id);
      if (matchedIndex !== -1) {
        waitingPlayers.splice(matchedIndex, 1);
      }
      
      // Create game with matched players
      const game = createGame(matchedPlayer, player, player.gameMode, player.translationMode);
      console.log('🔴 SERVER: Game created with mode:', player.gameMode, 'Translation mode:', player.translationMode, 'Game ID:', game.id);
      
      // Move players to game room
      io.sockets.sockets.get(matchedPlayer.id)?.join(game.id);
      io.sockets.sockets.get(player.id)?.join(game.id);
      
      // Store game reference in socket
      io.sockets.sockets.get(matchedPlayer.id).gameId = game.id;
      io.sockets.sockets.get(player.id).gameId = game.id;
      
      // Start game immediately (translation mode already selected in entry screen)
      if (game.gameMode === 'translation') {
        // Start translation game with pre-selected mode
        game.status = 'playing';
        game.gameStatus = 'playing';
        game.roundStartTime = Date.now();
      } else if (game.gameMode === 'conversation-generator') {
        // Keep conversation mode in waiting state for player 1 to provide input
        game.status = 'waiting_for_conversation';
        game.gameStatus = 'waiting_for_player1';
      }
      
      // Start game immediately
      const gameStartData = {
        gameId: game.id,
        gameMode: game.gameMode,
        answerMode: game.answerMode,
        words: game.words,
        translationWords: game.translationWords,
        metaphoricalSentences: game.metaphoricalSentences,
        players: game.players,
        opponent: {
          player1: { name: player.name, avatar: player.avatar },
          player2: { name: matchedPlayer.name, avatar: matchedPlayer.avatar }
        },
        timeLimit: game.timeLimit,
        roundNumber: game.roundNumber,
        totalRounds: game.totalRounds,
        gameStatus: game.gameStatus,
        // Add player position information for conversation mode
        isPlayer1: false // This will be set per player below
      };
      
      // Send player-specific data
      io.sockets.sockets.get(matchedPlayer.id)?.emit('game-start', {
        ...gameStartData,
        currentPlayer: game.players[0],
        isPlayer1: true
      });
      
      io.sockets.sockets.get(player.id)?.emit('game-start', {
        ...gameStartData,
        currentPlayer: game.players[1],
        isPlayer1: false
      });
      
      console.log('🔴 SERVER: Game started:', game.id);
      
      // Update waiting list for remaining players
      const updatedWaitingList = waitingPlayers.map(p => ({ name: p.name, avatar: p.avatar }));
      io.emit('waiting-players-update', updatedWaitingList);
    } else {
      // No match found, add player to waiting list
      console.log('🔴 SERVER: No compatible player found, adding to waiting list');
      waitingPlayers.push(player);
      socket.playerData = player;

      // Emit updated waiting list to all waiting players
      const waitingList = waitingPlayers.map(p => ({ name: p.name, avatar: p.avatar }));
      io.emit('waiting-players-update', waitingList);
    }
  });

  socket.on('create-private-room', (playerData) => {
    console.log('Player creating private room:', playerData);
    
    const player = {
      id: socket.id,
      name: playerData.name,
      avatar: playerData.avatar || '👤',
      gameMode: playerData.gameMode || 'story-writing',
      translationMode: playerData.translationMode || null
    };
    
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      host: player,
      players: [player],
      gameMode: player.gameMode,
      translationMode: player.translationMode,
      status: 'waiting',
      createdAt: Date.now()
    };
    
    privateRooms.set(roomCode, room);
    socket.playerData = player;
    socket.roomCode = roomCode;
    socket.join(`room_${roomCode}`);
    
    socket.emit('room-created', { roomCode, room: room });
    console.log('Private room created:', roomCode, 'Game mode:', player.gameMode);
  });

  socket.on('join-private-room', (data) => {
    console.log('Player joining private room:', data);
    
    const { roomCode, playerData } = data;
    const room = privateRooms.get(roomCode);
    
    if (!room) {
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('room-error', { message: 'Room is full' });
      return;
    }
    
    if (room.status !== 'waiting') {
      socket.emit('room-error', { message: 'Room is not available' });
      return;
    }
    
    const player = {
      id: socket.id,
      name: playerData.name,
      avatar: playerData.avatar || '👤',
      gameMode: playerData.gameMode || 'story-writing',
      translationMode: playerData.translationMode || null
    };
    
    // Check game mode compatibility
    if (player.gameMode !== room.gameMode) {
      socket.emit('room-error', { message: `Room is for ${room.gameMode} mode, but you selected ${player.gameMode}` });
      return;
    }
    
    // Check translation mode compatibility for translation games
    if (player.gameMode === 'translation' && player.translationMode !== room.translationMode) {
      const translationModeNames = {
        'multiple-choice': 'Multiple Choice',
        'typing': 'Typing Mode', 
        'metaphorical': 'Metaphorical Challenge'
      };
      socket.emit('room-error', { 
        message: `Room is for ${translationModeNames[room.translationMode]} mode, but you selected ${translationModeNames[player.translationMode]}` 
      });
      return;
    }
    
    room.players.push(player);
    socket.playerData = player;
    socket.roomCode = roomCode;
    socket.join(`room_${roomCode}`);
    
    // Notify all players in the room
    io.to(`room_${roomCode}`).emit('room-updated', { room });
    
    // If room is full, start the game
    if (room.players.length === 2) {
      room.status = 'playing';
      const game = createGame(room.players[0], room.players[1], room.gameMode, room.translationMode);
      
      // Move players to game room
      room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.join(game.id);
          playerSocket.gameId = game.id;
        }
      });
      
      // Start the game
      const gameStartData = {
        gameId: game.id,
        gameMode: game.gameMode,
        answerMode: game.answerMode,
        words: game.words,
        translationWords: game.translationWords,
        metaphoricalSentences: game.metaphoricalSentences,
        players: game.players,
        opponent: {
          player1: { name: room.players[1].name, avatar: room.players[1].avatar },
          player2: { name: room.players[0].name, avatar: room.players[0].avatar }
        },
        timeLimit: game.timeLimit,
        roundNumber: game.roundNumber,
        totalRounds: game.totalRounds,
        gameStatus: game.gameStatus,
        isPrivateRoom: true
      };
      
      // Send player-specific data for translation mode
      if (game.gameMode === 'translation') {
        game.players.forEach((player, index) => {
          io.sockets.sockets.get(player.id)?.emit('game-start', {
            ...gameStartData,
            currentPlayer: game.players[index]
          });
        });
      } else {
        io.to(game.id).emit('game-start', gameStartData);
      }
      
      console.log('Private room game started:', game.id, 'Room:', roomCode, 'Mode:', room.gameMode);
    }
  });

  socket.on('submit-story', (data) => {
    const gameId = socket.gameId;
    const game = games.get(gameId);
    
    if (game && game.status === 'playing') {
      game.stories[socket.id] = {
        story: data.story,
        usedWords: data.usedWords,
        submittedAt: Date.now()
      };
      
      // Check if both players have submitted
      if (Object.keys(game.stories).length === 2) {
        game.status = 'completed';
        
        // Prepare results
        const results = {
          gameId: gameId,
          stories: []
        };
        
        game.players.forEach(player => {
          const playerStory = game.stories[player.id];
          results.stories.push({
            playerName: player.name,
            avatar: player.avatar,
            story: playerStory ? playerStory.story : '',
            usedWords: playerStory ? playerStory.usedWords : [],
            wordsCount: playerStory ? playerStory.usedWords.length : 0
          });
        });
        
        // Send results to both players
        io.to(gameId).emit('game-results', results);
        
        console.log('Game completed:', gameId);
      } else {
        // Notify the other player that opponent has finished
        socket.to(gameId).emit('opponent-finished');
      }
    }
  });

  // New event for answer mode selection
  socket.on('select-answer-mode', (data) => {
    const gameId = socket.gameId;
    const game = games.get(gameId);
    
    if (game && game.gameMode === 'translation' && game.status === 'waiting_for_mode') {
      game.answerMode = data.answerMode;
      game.status = 'playing';
      game.gameStatus = 'playing';
      game.roundStartTime = Date.now();
      
      // Start the first round
      const gameStartData = {
        gameId: game.id,
        gameMode: game.gameMode,
        answerMode: game.answerMode,
        words: game.words,
        translationWords: game.translationWords,
        players: game.players,
        opponent: {
          player1: { name: game.players[1].name, avatar: game.players[1].avatar },
          player2: { name: game.players[0].name, avatar: game.players[0].avatar }
        },
        timeLimit: game.timeLimit,
        roundNumber: game.roundNumber,
        totalRounds: game.totalRounds,
        gameStatus: 'playing'
      };
      
      // Send to both players
      game.players.forEach((player, index) => {
        io.sockets.sockets.get(player.id)?.emit('game-start', {
          ...gameStartData,
          currentPlayer: game.players[index]
        });
      });
      
      console.log('Translation game started with mode:', data.answerMode, 'Game:', gameId);
    }
  });

  socket.on('submit-translation-answer', (data) => {
    const gameId = socket.gameId;
    const game = games.get(gameId);
    
    if (game && game.status === 'playing' && game.gameMode === 'translation') {
      // Get current word/sentence based on answer mode
      const currentItem = game.answerMode === 'metaphorical' 
        ? game.metaphoricalSentences[game.currentWordIndex]
        : game.translationWords[game.currentWordIndex];
      if (!currentItem || game.gameStatus !== 'playing') return;
      
      // Find the player
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex === -1) return;
      
      // Check if this player already answered this round
      if (game.roundAnswers[socket.id]) return;
      
      // Check if answer is correct (with flexible matching for typing mode)
      const isCorrect = data.answer.trim().toLowerCase() === currentItem.arabic.trim().toLowerCase();
      
      // Store the answer
      game.roundAnswers[socket.id] = {
        answer: data.answer,
        timeUsed: data.timeUsed,
        isCorrect: isCorrect,
        submittedAt: Date.now(),
        playerId: socket.id
      };
      
      // Check if this is the first correct answer
      const correctAnswers = Object.values(game.roundAnswers).filter(ans => ans.isCorrect);
      const totalAnswers = Object.keys(game.roundAnswers).length;
      const allPlayersAnswered = totalAnswers === game.players.length;
      let roundWinner = null;
      
      // Function to advance to next word
      const advanceToNextWord = (winner = null) => {
        // Clear any existing timeout
        if (game.roundTimeout) {
          clearTimeout(game.roundTimeout);
          game.roundTimeout = null;
        }
        
        game.currentWordIndex++;
        game.roundNumber++;
        game.roundAnswers = {};
        game.lastRoundWinner = winner;
        
        const totalWords = game.answerMode === 'metaphorical' ? game.metaphoricalSentences.length : game.translationWords.length;
        if (game.currentWordIndex >= totalWords) {
          // Game completed
          game.status = 'completed';
          game.gameStatus = 'completed';
          
          // Prepare results
          const results = {
            gameId: gameId,
            gameMode: 'translation',
            players: game.players.map(player => ({
              name: player.name,
              avatar: player.avatar,
              score: player.score,
              color: player.color
            })),
            winner: game.players.reduce((prev, current) => (prev.score > current.score) ? prev : current)
          };
          
          io.to(gameId).emit('game-results', results);
          console.log('Translation game completed:', gameId);
        } else {
          // Continue to next word
          game.gameStatus = 'playing';
          game.roundStartTime = Date.now();
          
          const gameUpdateData = {
            gameId: game.id,
            gameMode: game.gameMode,
            answerMode: game.answerMode,
            translationWords: game.translationWords,
            metaphoricalSentences: game.metaphoricalSentences,
            players: game.players,
            roundNumber: game.roundNumber,
            totalRounds: game.totalRounds,
            gameStatus: 'playing'
          };
          
          // Send updated data to each player
          game.players.forEach((player, index) => {
            io.sockets.sockets.get(player.id)?.emit('game-update', {
              ...gameUpdateData,
              currentPlayer: game.players[index]
            });
          });
        }
      };
      
      if (isCorrect && correctAnswers.length === 1) {
        // This player got it right first!
        game.players[playerIndex].score += 1;
        roundWinner = game.players[playerIndex];
        game.lastRoundWinner = roundWinner;
        
        // End this round immediately
        game.gameStatus = 'showing-result';
        
        // Show result for 1.5 seconds, then move to next word
        setTimeout(() => {
          advanceToNextWord(roundWinner);
        }, 1500);
      } else if (allPlayersAnswered && correctAnswers.length === 0) {
        // All players answered but no one got it right - advance anyway
        console.log('All players answered incorrectly, advancing to next word');
        
        // Clear timeout since all players have answered
        if (game.roundTimeout) {
          clearTimeout(game.roundTimeout);
          game.roundTimeout = null;
        }
        
        game.gameStatus = 'showing-result';
        
        // Show "No one got it right" message for 1.5 seconds, then advance
        setTimeout(() => {
          advanceToNextWord(null);
        }, 1500);
      }
      
      // Set up round timeout if this is the first answer in the round
      if (totalAnswers === 1 && !game.roundTimeout) {
        game.roundTimeout = setTimeout(() => {
          // Time's up! Check if we need to advance
          const currentAnswers = Object.keys(game.roundAnswers).length;
          const currentCorrectAnswers = Object.values(game.roundAnswers).filter(ans => ans.isCorrect);
          
          if (currentCorrectAnswers.length === 0) {
            // No one got it right within time limit
            console.log('Round timeout - no correct answers, advancing');
            game.gameStatus = 'showing-result';
            game.lastRoundWinner = null;
            
            // Send feedback showing timeout
            const timeoutFeedbackData = {
              gameId: game.id,
              gameStatus: 'showing-result',
              lastRoundWinner: null,
              correctAnswer: currentItem.arabic,
              players: game.players
            };
            
            game.players.forEach((player, index) => {
              io.sockets.sockets.get(player.id)?.emit('round-feedback', {
                ...timeoutFeedbackData,
                currentPlayer: game.players[index]
              });
            });
            
            setTimeout(() => {
              advanceToNextWord(null);
            }, 1500);
          }
          
          // Clear the timeout reference
          game.roundTimeout = null;
        }, game.timeLimit);
      }
      
      // Send immediate feedback to all players
      const feedbackData = {
        gameId: game.id,
        gameStatus: game.gameStatus,
        lastRoundWinner: roundWinner,
        correctAnswer: currentItem.arabic,
        players: game.players
      };
      
      game.players.forEach((player, index) => {
        io.sockets.sockets.get(player.id)?.emit('round-feedback', {
          ...feedbackData,
          currentPlayer: game.players[index]
        });
      });
    }
  });

  socket.on('emoji-reaction', (data) => {
    const gameId = socket.gameId;
    if (gameId) {
      socket.to(gameId).emit('emoji-reaction', {
        emoji: data.emoji,
        targetStory: data.targetStory,
        from: socket.playerData?.name
      });
    }
  });

  // AI Conversation events
  socket.on('generate-conversation', async (data) => {
    const gameId = socket.gameId;
    const game = games.get(gameId);
    
    if (game && game.gameMode === 'conversation-generator' && game.status === 'waiting_for_conversation') {
      // Only player 1 can generate conversation
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== 0) return;
      
      game.conversationStatus = 'generating';
      
      // Notify both players that generation started
      io.to(gameId).emit('conversation-generating');
      
      try {
        console.log('Generating conversation with data:', { 
          topic: data.topic, 
          character1: data.character1, 
          character2: data.character2, 
          wordCount: data.wordCount 
        });
        
        // Generate conversation using AI with proper format
        const requestBody = {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a professional dialogue writer. Create a natural, engaging conversation between two characters. Format the response as JSON with this structure:
              {
                "turns": [
                  {"character": "Character1Name", "dialogue": "What they say"},
                  {"character": "Character2Name", "dialogue": "Their response"}
                ]
              }
              
              Make the conversation feel natural with:
              - Realistic dialogue patterns
              - Appropriate emotions and reactions  
              - Natural flow and transitions
              - Each turn should be 1-3 sentences max
              - Use the exact character names provided`
            },
            {
              role: 'user',
              content: `Create a conversation between "${data.character1}" and "${data.character2}" about "${data.topic}". Target approximately ${data.wordCount || 150} words total.`
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        };
        
        console.log('Groq API Request:', JSON.stringify(requestBody, null, 2));
        
        // Use native https module instead of fetch
        console.log('Making HTTPS request to Groq API...');
        
        const postData = JSON.stringify(requestBody);
        console.log('Request body:', postData);
        
        const apiData = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.groq.com',
            port: 443,
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const req = https.request(options, (res) => {
            console.log('Response status:', res.statusCode);
            console.log('Response headers:', res.headers);
            
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              console.log('Raw response:', data);
              
              if (res.statusCode !== 200) {
                console.error('API Error:', res.statusCode, data);
                // Handle 500 errors with fallback response
                if (res.statusCode === 500) {
                  console.log('API returned 500, using fallback response');
                  resolve({
                    choices: [{
                      message: {
                        content: JSON.stringify({
                          turns: [
                            {
                              character: "Player1",
                              dialogue: "Hello! How are you doing today?"
                            },
                            {
                              character: "Player2", 
                              dialogue: "I'm doing great! Thanks for asking."
                            }
                          ]
                        })
                      }
                    }]
                  });
                  return;
                }
                reject(new Error(`API Error: ${res.statusCode} ${data}`));
                return;
              }
              
              try {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
              } catch (error) {
                console.error('JSON Parse Error:', error, 'Raw data:', data);
                reject(error);
              }
            });
          });

          req.on('error', (error) => {
            console.error('Request Error:', error);
            reject(error);
          });

          // Set timeout to prevent hanging
          req.setTimeout(30000, () => {
            console.log('Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
          });

          req.write(postData);
          req.end();
        });
        
        console.log('Groq API Response:', apiData);
        
        const content = apiData.choices?.[0]?.message?.content;

        if (!content) {
          console.error('No content in API response:', apiData);
          throw new Error('No content received from API');
        }

        // Parse the JSON response from AI
        console.log('AI Generated Content:', content);
        
        let conversationData;
        try {
          // Try to parse as JSON first
          conversationData = JSON.parse(content);
        } catch (parseError) {
          console.log('Failed to parse as JSON, creating fallback conversation');
          // Fallback: create simple conversation if JSON parsing fails
          conversationData = {
            turns: [
              {
                character: data.character1,
                dialogue: `Hey ${data.character2}! Let's talk about ${data.topic}.`
              },
              {
                character: data.character2,
                dialogue: content.substring(0, 200) || "That sounds great! I'd love to discuss it."
              }
            ]
          };
        }
        
        const conversation = {
          id: Date.now().toString(),
          topic: data.topic,
          wordCount: data.wordCount || 150,
          characters: [data.character1, data.character2],
          turns: conversationData.turns || [
            {
              character: data.character1,
              dialogue: `Hello! Let's talk about ${data.topic}.`
            },
            {
              character: data.character2,
              dialogue: "That sounds interesting! Tell me more."
            }
          ],
          createdAt: new Date()
        };

        game.conversationData = conversation;
        game.status = 'playing';
        game.gameStatus = 'conversation_ready';
        game.conversationStatus = 'ready';

        // Send conversation to both players
        io.to(gameId).emit('conversation-generated', {
          conversation: conversation,
          gameStatus: 'conversation_ready'
        });

        console.log('Conversation generated for game:', gameId);

      } catch (error) {
        console.error('Conversation generation error:', error);
        game.conversationStatus = 'error';
        
        // Send error to both players
        io.to(gameId).emit('conversation-error', {
          message: error instanceof Error ? error.message : 'Failed to generate conversation'
        });
      }
    }
  });

  // Google Meet integration events
  socket.on('meeting-link-generated', (data) => {
    console.log('Meeting link generated:', data);
    const gameId = socket.gameId || data.gameId;
    
    if (gameId) {
      // Store the meeting session in the game if provided
      const game = games.get(gameId);
      if (game && data.meetingSession) {
        game.meetingSession = data.meetingSession;
      }
      
      // Broadcast to all players in the game
      socket.to(gameId).emit('meeting-link-received', {
        meetingLink: data.meetingLink,
        generatedBy: data.generatedBy,
        gameId: gameId
      });
      
      console.log('Meeting link broadcasted to game:', gameId);
    }
  });

  socket.on('join-meeting-request', (data) => {
    const gameId = socket.gameId || data.gameId;
    const game = games.get(gameId);
    
    if (game && game.meetingSession) {
      // Send existing meeting session to the requesting player
      socket.emit('existing-meeting-session', {
        meetingUrl: game.meetingSession.meetingUrl,
        gameId: gameId
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Remove from waiting players
    const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
    if (waitingIndex !== -1) {
      waitingPlayers.splice(waitingIndex, 1);
      const updatedWaitingList = waitingPlayers.map(p => ({ name: p.name, avatar: p.avatar }));
      io.emit('waiting-players-update', updatedWaitingList);
    }
    
    // Handle private room disconnection
    const roomCode = socket.roomCode;
    if (roomCode) {
      const room = privateRooms.get(roomCode);
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          // Delete empty room
          privateRooms.delete(roomCode);
        } else {
          // Notify remaining players
          io.to(`room_${roomCode}`).emit('room-updated', { room });
          io.to(`room_${roomCode}`).emit('player-left', { 
            playerName: socket.playerData?.name 
          });
        }
      }
    }
    
    // Handle game disconnection
    const gameId = socket.gameId;
    if (gameId) {
      const game = games.get(gameId);
      if (game && game.status === 'playing') {
        // Notify the other player
        socket.to(gameId).emit('opponent-disconnected');
        
        // Clean up game after a delay
        setTimeout(() => {
          games.delete(gameId);
        }, 30000); // 30 seconds
      }
    }
  });
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    gamesActive: games.size, 
    playersWaiting: waitingPlayers.length,
    privateRooms: privateRooms.size
  });
});

app.get('/api/words/random', (req, res) => {
  const words = getRandomWords();
  res.json(words);
});

app.get('/api/room/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const room = privateRooms.get(roomCode.toUpperCase());
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    code: room.code,
    players: room.players.map(p => ({ name: p.name, avatar: p.avatar })),
    status: room.status,
    canJoin: room.players.length < 2 && room.status === 'waiting'
  });
});

const PORT = process.env.PORT || 4569; // Railway will provide PORT automatically

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WordMash Battle server running on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`  - Local: http://localhost:${PORT}`);
  console.log(`  - Network: http://192.168.0....:${PORT}`);
  console.log(`Socket.IO server ready for connections`);
  console.log(`Loaded ${wordsData.length} story words from database`);
  console.log(`Loaded ${translationWordsData.length} translation words from database`);
  console.log(`Loaded ${metaphoricalSentencesData.length} metaphorical sentences from database`);
});