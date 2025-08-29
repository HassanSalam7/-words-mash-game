const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const GameService = require('./services/GameService');

class WebSocketGameServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = null;
    this.port = process.env.PORT || 4568;
    this.gameService = new GameService();
    
    // Game state
    this.clients = new Map(); // clientId -> { ws, playerData, gameId, roomCode }
    this.games = new Map();
    this.waitingPlayers = [];
    this.privateRooms = new Map();
    
    this.setupExpress();
    this.setupWebSocket();
  }

  setupExpress() {
    this.app.use(cors({ origin: "*" }));
    this.app.use(express.json());

    this.app.get('/', (req, res) => {
      res.json({
        message: 'WordMash Battle WebSocket Server',
        status: 'running',
        connections: this.clients.size,
        games: this.games.size,
        waitingPlayers: this.waitingPlayers.length
      });
    });

    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', connections: this.clients.size });
    });

    // API endpoints for game data
    this.app.get('/api/words/random', (req, res) => {
      try {
        const count = parseInt(req.query.count) || 5;
        const difficulty = req.query.difficulty || 'mixed';
        const words = this.gameService.getRandomWords(count, difficulty);
        res.json({ words, count: words.length });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get random words' });
      }
    });
  }

  setupWebSocket() {
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws',
      clientTracking: true,
      perMessageDeflate: {
        // Mobile-optimized compression
        zlibDeflateOptions: {
          level: 3,
          chunkSize: 1024
        },
        threshold: 1024,
        concurrencyLimit: 10,
        serverMaxWindowBits: 15,
        clientMaxWindowBits: 15
      }
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateId();
      const clientIP = req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = this.detectMobileClient(userAgent);
      
      console.log(`🔌 Client connected: ${clientId} from ${clientIP} (Mobile: ${isMobile}) (Total: ${this.clients.size + 1})`);
      
      // Mobile-specific WebSocket settings
      if (isMobile) {
        ws._socket?.setKeepAlive(true, 30000); // Keep alive every 30 seconds
        ws._socket?.setNoDelay(true); // Disable Nagle's algorithm for faster sending
      }
      
      // Store client info
      this.clients.set(clientId, {
        ws,
        clientId,
        clientIP,
        userAgent,
        isMobile,
        connectedAt: new Date(),
        lastPing: Date.now(),
        playerData: null,
        gameId: null,
        roomCode: null
      });

      // Send connection confirmation
      this.sendToClient(clientId, 'connect', { 
        clientId, 
        isMobile,
        serverTime: Date.now()
      });

      // Start mobile ping timer
      if (isMobile) {
        this.startMobilePing(clientId);
      }

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Invalid message format:', error);
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`❌ Client disconnected: ${clientId} (Code: ${code}, Reason: ${reason?.toString()}) (Total: ${this.clients.size - 1})`);
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error.message);
        this.handleClientError(clientId, error);
      });

      // Handle mobile-specific ping timeout
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
        }
      });
    });

    // Mobile connection health check
    setInterval(() => {
      this.checkMobileConnections();
    }, 60000); // Check every minute
  }

  detectMobileClient(userAgent) {
    // Enhanced mobile detection to match client-side logic
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(userAgent) ||
           /Mobile|Tablet/i.test(userAgent);
  }

  startMobilePing(clientId) {
    const client = this.clients.get(clientId);
    if (!client || !client.isMobile) return;

    // Send ping every 30 seconds for mobile clients
    const pingInterval = setInterval(() => {
      const currentClient = this.clients.get(clientId);
      if (!currentClient || currentClient.ws.readyState !== 1) {
        clearInterval(pingInterval);
        return;
      }

      try {
        currentClient.ws.ping();
        console.log(`📱 Ping sent to mobile client: ${clientId}`);
      } catch (error) {
        console.error(`Failed to ping mobile client ${clientId}:`, error.message);
        clearInterval(pingInterval);
        this.handleDisconnect(clientId);
      }
    }, 30000);

    // Store interval reference for cleanup
    client.pingInterval = pingInterval;
  }

  checkMobileConnections() {
    const now = Date.now();
    const mobileTimeout = 90000; // 90 seconds timeout for mobile
    const desktopTimeout = 120000; // 2 minutes for desktop

    this.clients.forEach((client, clientId) => {
      const timeout = client.isMobile ? mobileTimeout : desktopTimeout;
      
      if ((now - client.lastPing) > timeout) {
        console.log(`⚠️ Client ${clientId} (${client.isMobile ? 'Mobile' : 'Desktop'}) ping timeout, disconnecting...`);
        
        // Check if WebSocket is actually still open
        if (client.ws.readyState === 1) {
          // Try one more ping before disconnecting
          try {
            client.ws.ping();
            console.log(`🔄 Sent final ping to ${clientId} before timeout`);
            // Give it 10 more seconds
            setTimeout(() => {
              if ((Date.now() - client.lastPing) > timeout) {
                this.handleDisconnect(clientId);
              }
            }, 10000);
          } catch (error) {
            this.handleDisconnect(clientId);
          }
        } else {
          this.handleDisconnect(clientId);
        }
      }
    });
  }

  handleClientError(clientId, error) {
    const client = this.clients.get(clientId);
    if (client?.isMobile) {
      console.log(`📱 Mobile client ${clientId} error:`, error.message);
      // Don't immediately disconnect mobile clients on errors
      // They might reconnect automatically
    }
  }

  handleMessage(clientId, message) {
    const { type, data } = message;
    const client = this.clients.get(clientId);
    
    if (!client) return;

    console.log(`📨 Message from ${clientId}: ${type}`);

    switch (type) {
      case 'join-game':
        this.handleJoinGame(clientId, data);
        break;
      case 'join-queue':
        this.handleJoinQueue(clientId, data);
        break;
      case 'leave-queue':
        this.handleLeaveQueue(clientId);
        break;
      case 'create-private-room':
        this.handleCreatePrivateRoom(clientId, data);
        break;
      case 'join-private-room':
        this.handleJoinPrivateRoom(clientId, data);
        break;
      case 'submit-story':
        this.handleSubmitStory(clientId, data);
        break;
      case 'submit-translation-answer':
        this.handleSubmitAnswer(clientId, data);
        break;
      case 'select-answer-mode':
        this.handleSelectAnswerMode(clientId, data);
        break;
      case 'generate-conversation':
        this.handleGenerateConversation(clientId, data);
        break;
      case 'ping':
        this.sendToClient(clientId, 'pong', {});
        break;
      default:
        console.log(`Unknown message type: ${type}`);
    }
  }

  handleJoinGame(clientId, data) {
    try {
      console.log('🎮 Player joining game:', data);
      
      if (!data || !data.name || !data.gameMode) {
        this.sendToClient(clientId, 'join-error', { message: 'Invalid player data' });
        return;
      }
      
      const client = this.clients.get(clientId);
      if (!client) {
        console.error(`❌ Client ${clientId} not found when joining game`);
        return;
      }
      
      client.playerData = data;
      
      // Remove from waiting list if already there
      this.removeFromWaitingList(clientId);
      
      // Add to waiting list
      const playerData = {
        id: clientId,
        name: data.name,
        avatar: data.avatar,
        gameMode: data.gameMode,
        translationMode: data.translationMode,
        joinedAt: Date.now()
      };
      
      this.waitingPlayers.push(playerData);
      console.log(`➕ Added player to waiting list: ${data.name} (${data.gameMode}${data.translationMode ? `, ${data.translationMode}` : ''}) - Total waiting: ${this.waitingPlayers.length}`);
      
      // Send immediate feedback to player
      this.sendToClient(clientId, 'queue-joined', { 
        position: this.waitingPlayers.length,
        waitingPlayers: this.waitingPlayers.length 
      });
      
      this.broadcastWaitingPlayers();
      
      // Try matching with a small delay to ensure both players are ready
      setTimeout(() => {
        this.tryMatchPlayers();
      }, 100);
      
    } catch (error) {
      console.error('Error in join-game handler:', error);
      this.sendToClient(clientId, 'join-error', { message: 'Failed to join game' });
    }
  }

  handleJoinQueue(clientId, data) {
    // Legacy compatibility
    this.handleJoinGame(clientId, {
      name: data.playerName,
      avatar: data.avatar,
      gameMode: data.gameMode,
      translationMode: data.translationMode
    });
  }

  handleLeaveQueue(clientId) {
    if (this.removeFromWaitingList(clientId)) {
      this.broadcastWaitingPlayers();
      console.log(`🚪 Player ${clientId} left queue`);
    }
  }

  tryMatchPlayers() {
    if (this.waitingPlayers.length >= 2) {
      console.log(`🔍 Trying to match players from ${this.waitingPlayers.length} waiting players`);
      
      const player1 = this.waitingPlayers[0];
      let player2 = null;
      
      // Verify player1 client is still connected
      const client1 = this.clients.get(player1.id);
      if (!client1 || client1.ws.readyState !== 1) {
        console.log(`❌ Player1 ${player1.name} is disconnected, removing from queue`);
        this.removeFromWaitingList(player1.id);
        this.broadcastWaitingPlayers();
        return this.tryMatchPlayers(); // Try again with remaining players
      }
      
      // Find compatible players
      for (let i = 1; i < this.waitingPlayers.length; i++) {
        const candidate = this.waitingPlayers[i];
        const candidateClient = this.clients.get(candidate.id);
        
        // Check if candidate is still connected
        if (!candidateClient || candidateClient.ws.readyState !== 1) {
          console.log(`❌ Candidate ${candidate.name} is disconnected, removing from queue`);
          this.removeFromWaitingList(candidate.id);
          continue;
        }
        
        // Check game mode compatibility
        const modesMatch = candidate.gameMode === player1.gameMode;
        const translationModesMatch = candidate.translationMode === player1.translationMode;
        
        console.log(`🔍 Checking match: ${player1.name} (${player1.gameMode}, ${player1.translationMode}) vs ${candidate.name} (${candidate.gameMode}, ${candidate.translationMode})`);
        
        if (modesMatch && translationModesMatch) {
          player2 = candidate;
          console.log(`✅ Found match! ${player1.name} vs ${player2.name}`);
          break;
        }
      }
      
      if (player2) {
        // Remove matched players from waiting list
        const index1 = this.waitingPlayers.indexOf(player1);
        const index2 = this.waitingPlayers.indexOf(player2);
        this.waitingPlayers.splice(Math.max(index1, index2), 1);
        this.waitingPlayers.splice(Math.min(index1, index2), 1);
        
        console.log(`🎮 Creating game between ${player1.name} and ${player2.name}`);
        
        // Create game
        this.createGame(player1, player2);
        
        // Broadcast updated waiting list
        this.broadcastWaitingPlayers();
      } else {
        console.log(`⏳ No compatible matches found for ${player1.name} yet`);
      }
    } else {
      console.log(`⏳ Only ${this.waitingPlayers.length} players waiting, need at least 2`);
    }
  }

  createGame(player1, player2) {
    try {
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      let gameData = {
        gameId,
        gameMode: player1.gameMode,
        translationMode: player1.translationMode,
        players: [
          { id: player1.id, name: player1.name, avatar: player1.avatar, score: 0, color: '#8B5CF6' },
          { id: player2.id, name: player2.name, avatar: player2.avatar, score: 0, color: '#EF4444' }
        ],
        opponent: {
          player1: { name: player1.name, avatar: player1.avatar },
          player2: { name: player2.name, avatar: player2.avatar }
        },
        currentRound: 1,
        totalRounds: player1.gameMode === 'translation' ? 15 : 3,
        gameStatus: player1.gameMode === 'translation' ? 'answer-mode-selection' : 'waiting_for_stories',
        timeLimit: player1.gameMode === 'translation' ? 30000 : 300000,
        createdAt: Date.now()
      };
      
      // Get appropriate content based on game mode
      console.log(`🎮 Creating game for mode: ${player1.gameMode}`);
      
      switch (player1.gameMode) {
        case 'translation':
          if (player1.translationMode === 'metaphorical') {
            gameData.metaphoricalSentences = this.gameService.getRandomMetaphoricalSentences(15, 'mixed');
            console.log(`✅ Loaded ${gameData.metaphoricalSentences.length} metaphorical sentences`);
          } else {
            gameData.translationWords = this.gameService.getRandomTranslationWords(15, 'mixed');
            console.log(`✅ Loaded ${gameData.translationWords.length} translation words`);
          }
          
          // Set the answer mode based on the selected translation mode and start the game
          gameData.answerMode = player1.translationMode;
          gameData.gameStatus = 'playing';
          gameData.currentRound = 1;
          gameData.roundSubmissions = []; // Initialize submissions array
          
          console.log(`🎯 Translation game setup: mode=${player1.translationMode}, rounds=${gameData.totalRounds}`);
          
          setTimeout(() => {
            this.startNextTranslationRound(gameId);
          }, 1000);
          break;
          
        case 'conversation-generator':
          // AI Conversation multiplayer mode
          gameData.gameStatus = 'conversation-setup';
          gameData.totalRounds = 1; // Single conversation per game
          gameData.currentPlayer = 1; // Player 1 starts with setup
          
          console.log(`🤖 AI Conversation game setup`);
          break;
          
        default: // story-writing
          gameData.words = this.gameService.getRandomWords(5, 'mixed');
          console.log(`✅ Loaded ${gameData.words.length} story words`);
      }
      
      this.games.set(gameId, gameData);
      
      // Update client game associations
      const client1 = this.clients.get(player1.id);
      const client2 = this.clients.get(player2.id);
      if (client1) client1.gameId = gameId;
      if (client2) client2.gameId = gameId;
      
      // Send game data to players
      console.log(`📤 Sending game-start to players: ${player1.name} and ${player2.name}`);
      this.sendToClient(player1.id, 'game-start', { ...gameData, isPlayer1: true });
      this.sendToClient(player2.id, 'game-start', { ...gameData, isPlayer1: false });
      
      console.log(`🎮 Game created: ${gameId} - ${player1.name} vs ${player2.name}`);
      
    } catch (error) {
      console.error('Error creating game:', error);
    }
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    
    // Clean up mobile-specific resources
    if (client?.pingInterval) {
      clearInterval(client.pingInterval);
    }
    
    // Remove from waiting list
    if (this.removeFromWaitingList(clientId)) {
      this.broadcastWaitingPlayers();
    }

    // Handle game disconnection
    if (client && client.gameId) {
      const game = this.games.get(client.gameId);
      if (game) {
        // Notify opponent
        const opponentId = game.players.find(p => p.id !== clientId)?.id;
        if (opponentId) {
          this.sendToClient(opponentId, 'opponent-disconnected', {
            reason: client.isMobile ? 'mobile_disconnect' : 'disconnect'
          });
        }
        
        // Clean up game with mobile-friendly delay
        const cleanupDelay = client.isMobile ? 60000 : 30000; // Give mobile more time
        setTimeout(() => {
          this.games.delete(client.gameId);
        }, cleanupDelay);
      }
    }

    // Remove client
    this.clients.delete(clientId);
    
    console.log(`🧹 Cleaned up client ${clientId} (Mobile: ${client?.isMobile || false})`);
  }

  // Utility methods
  sendToClient(clientId, type, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN
      const message = { type, data };
      client.ws.send(JSON.stringify(message));
    }
  }

  sendToClients(clientIds, type, data) {
    clientIds.forEach(clientId => this.sendToClient(clientId, type, data));
  }

  broadcastWaitingPlayers() {
    const waitingList = this.waitingPlayers.map(p => ({ 
      name: p.name, 
      avatar: p.avatar,
      gameMode: p.gameMode,
      joinedAt: p.joinedAt
    }));
    
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, 'waiting-players-update', waitingList);
    });
  }

  removeFromWaitingList(clientId) {
    const playerIndex = this.waitingPlayers.findIndex(p => p.id === clientId);
    if (playerIndex !== -1) {
      this.waitingPlayers.splice(playerIndex, 1);
      return true;
    }
    return false;
  }

  // Game submission handlers
  handleSubmitStory(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.gameId) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      const game = this.games.get(client.gameId);
      if (!game) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      console.log(`📖 Story submitted by ${client.playerData.name}: ${data.story}`);

      // Initialize submissions if not exists
      if (!game.submissions) {
        game.submissions = [];
      }

      // Add story submission
      game.submissions.push({
        playerId: clientId,
        playerName: client.playerData.name,
        avatar: client.playerData.avatar,
        story: data.story,
        usedWords: data.usedWords || [],
        wordsCount: data.wordsCount || 0,
        submittedAt: Date.now()
      });

      console.log(`📊 Game ${client.gameId}: ${game.submissions.length}/${game.players.length} submissions`);

      // Check if all players submitted
      if (game.submissions.length >= game.players.length) {
        this.finishStoryGame(client.gameId);
      } else {
        // Notify players about submission progress
        this.sendToClients(
          game.players.map(p => p.id),
          'submission-progress',
          {
            submitted: game.submissions.length,
            total: game.players.length,
            submittedPlayers: game.submissions.map(s => s.playerName)
          }
        );
      }

    } catch (error) {
      console.error('Error handling story submission:', error);
      this.sendToClient(clientId, 'game-error', { message: 'Failed to submit story' });
    }
  }

  handleSubmitAnswer(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.gameId) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      const game = this.games.get(client.gameId);
      if (!game) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      console.log(`🎯 Answer submitted by ${client.playerData.name}: ${data.answer}`);

      // Find the player in the game
      const player = game.players.find(p => p.id === clientId);
      if (!player) {
        this.sendToClient(clientId, 'game-error', { message: 'Player not found in game' });
        return;
      }

      // Get the current question
      const currentQuestion = game.currentRound - 1;
      let correctAnswer = '';
      
      if (game.translationMode === 'metaphorical' && game.metaphoricalSentences) {
        correctAnswer = game.metaphoricalSentences[currentQuestion]?.arabic || '';
      } else if (game.translationWords) {
        correctAnswer = game.translationWords[currentQuestion]?.arabic || '';
      }

      // Initialize round submissions if not exists
      if (!game.roundSubmissions) {
        game.roundSubmissions = [];
      }

      // Check if this player already submitted for this round
      const existingSubmission = game.roundSubmissions.find(s => 
        s.playerId === clientId && s.round === game.currentRound
      );

      if (existingSubmission) {
        console.log(`⚠️ Player ${client.playerData.name} already submitted for round ${game.currentRound}`);
        return;
      }

      // Check if answer is correct
      const isCorrect = data.answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      
      if (isCorrect) {
        player.score += 1;
        console.log(`✅ Correct! ${client.playerData.name} score: ${player.score} - ROUND WON!`);
        
        // Add submission for this round
        game.roundSubmissions.push({
          playerId: clientId,
          playerName: client.playerData.name,
          answer: data.answer,
          isCorrect,
          submittedAt: Date.now(),
          round: game.currentRound
        });

        // Immediately finish the round when someone gets correct answer
        console.log(`🏆 ${client.playerData.name} got correct answer, finishing round ${game.currentRound} immediately!`);
        this.finishTranslationRound(client.gameId);
        return;
      } else {
        console.log(`❌ Wrong! Expected: ${correctAnswer}, Got: ${data.answer}`);
      }

      // Add submission for this round (wrong answer)
      game.roundSubmissions.push({
        playerId: clientId,
        playerName: client.playerData.name,
        answer: data.answer,
        isCorrect,
        submittedAt: Date.now(),
        round: game.currentRound
      });

      console.log(`📊 Round ${game.currentRound} submissions: ${game.roundSubmissions.filter(s => s.round === game.currentRound).length}/${game.players.length}`);

      // Notify all players about the submission
      this.sendToClients(
        game.players.map(p => p.id),
        'player-submitted',
        {
          playerId: clientId,
          playerName: client.playerData.name,
          round: game.currentRound,
          submissionsCount: game.roundSubmissions.filter(s => s.round === game.currentRound).length,
          totalPlayers: game.players.length,
          isCorrect: false
        }
      );

      // Only wait for all submissions if no one got the correct answer yet
      const currentRoundSubmissions = game.roundSubmissions.filter(s => s.round === game.currentRound);
      if (currentRoundSubmissions.length >= game.players.length) {
        console.log(`🔥 All players submitted for round ${game.currentRound} (no correct answers), finishing round`);
        this.finishTranslationRound(client.gameId);
      }

    } catch (error) {
      console.error('Error handling answer submission:', error);
      this.sendToClient(clientId, 'game-error', { message: 'Failed to submit answer' });
    }
  }

  finishStoryGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`🏁 Finishing story game ${gameId}`);

    // Determine winner (player with most words used, or longest story)
    let winner = game.submissions[0];
    for (let submission of game.submissions) {
      if (submission.wordsCount > winner.wordsCount || 
          (submission.wordsCount === winner.wordsCount && submission.story.length > winner.story.length)) {
        winner = submission;
      }
    }

    // Send results to all players
    this.sendToClients(
      game.players.map(p => p.id),
      'game-results',
      {
        gameId,
        winner: {
          name: winner.playerName,
          avatar: winner.avatar,
          score: winner.wordsCount,
          story: winner.story
        },
        stories: game.submissions
      }
    );

    // Clean up game after 30 seconds
    setTimeout(() => {
      this.games.delete(gameId);
      console.log(`🗑️ Game ${gameId} cleaned up`);
    }, 30000);
  }

  finishTranslationRound(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`⚡ Finishing round ${game.currentRound} for game ${gameId}`);

    // Get only current round submissions
    const currentRoundSubmissions = game.roundSubmissions.filter(s => s.round === game.currentRound);
    console.log(`📋 Processing ${currentRoundSubmissions.length} submissions for round ${game.currentRound}`);

    // Determine round winner from current round only
    const correctSubmissions = currentRoundSubmissions.filter(s => s.isCorrect);
    let roundWinner = null;
    
    if (correctSubmissions.length > 0) {
      // Winner is the one who answered correctly first (should only be one in immediate mode)
      roundWinner = correctSubmissions.sort((a, b) => a.submittedAt - b.submittedAt)[0];
      console.log(`🏆 Round ${game.currentRound} winner: ${roundWinner.playerName} (immediate win!)`);
    } else {
      console.log(`❌ No correct answers in round ${game.currentRound} - both players were wrong`);
    }

    // Send round results
    this.sendToClients(
      game.players.map(p => p.id),
      'round-result',
      {
        round: game.currentRound,
        roundWinner: roundWinner ? {
          id: roundWinner.playerId,
          name: roundWinner.playerName
        } : null,
        playerScores: game.players.map(p => ({
          id: p.id,
          name: p.name,
          score: p.score
        })),
        correctAnswer: this.getCurrentCorrectAnswer(game),
        submissions: currentRoundSubmissions.map(s => ({
          playerId: s.playerId,
          playerName: s.playerName,
          answer: s.answer,
          isCorrect: s.isCorrect
        }))
      }
    );

    // Move to next round
    game.currentRound += 1;

    console.log(`📊 GAME PROGRESS: Round ${game.currentRound}/${game.totalRounds} for game ${gameId}`);

    // Check if game is finished
    if (game.currentRound > game.totalRounds) {
      console.log(`🏁 Game ${gameId} finished after ${game.totalRounds} rounds (currentRound: ${game.currentRound})`);
      this.finishTranslationGame(gameId);
    } else {
      // Start next round after short delay for fast-paced gameplay
      console.log(`⏭️ Starting round ${game.currentRound}/${game.totalRounds} in 1.5 seconds...`);
      setTimeout(() => {
        this.startNextTranslationRound(gameId);
      }, 1500);
    }
  }

  finishTranslationGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`🏆 Finishing translation game ${gameId}`);

    // Determine overall winner (highest score)
    const winner = game.players.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev
    );

    // Send final results
    this.sendToClients(
      game.players.map(p => p.id),
      'game-results',
      {
        gameId,
        gameMode: 'translation',
        winner: {
          id: winner.id,
          name: winner.name,
          avatar: winner.avatar,
          score: winner.score
        },
        finalScores: game.players.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          score: p.score
        })).sort((a, b) => b.score - a.score)
      }
    );

    // Clean up game
    setTimeout(() => {
      this.games.delete(gameId);
      console.log(`🗑️ Game ${gameId} cleaned up`);
    }, 30000);
  }

  startNextTranslationRound(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`❌ Game ${gameId} not found when starting round`);
      return;
    }

    console.log(`▶️ Starting round ${game.currentRound}/${game.totalRounds} for game ${gameId}`);

    // Clear any stale submissions for safety
    if (!game.roundSubmissions) {
      game.roundSubmissions = [];
    }

    // Get the current question
    const question = this.getCurrentQuestion(game);
    if (!question) {
      console.error(`❌ No question found for round ${game.currentRound} in game ${gameId}`);
      return;
    }

    console.log(`❓ Question for round ${game.currentRound}: ${question.english || question.type}`);

    // Send next question
    this.sendToClients(
      game.players.map(p => p.id),
      'next-round',
      {
        round: game.currentRound,
        totalRounds: game.totalRounds,
        question: question,
        gameId: gameId
      }
    );
  }

  getCurrentQuestion(game) {
    const questionIndex = game.currentRound - 1;
    
    if (game.translationMode === 'metaphorical' && game.metaphoricalSentences) {
      const sentence = game.metaphoricalSentences[questionIndex];
      return {
        type: 'metaphorical',
        english: sentence?.english,
        metaphor: sentence?.metaphor,
        options: sentence?.options
      };
    } else if (game.translationWords) {
      const word = game.translationWords[questionIndex];
      return {
        type: 'translation',
        english: word?.english,
        options: word?.options
      };
    }
    
    return null;
  }

  getCurrentCorrectAnswer(game) {
    const questionIndex = game.currentRound - 1;
    
    if (game.translationMode === 'metaphorical' && game.metaphoricalSentences) {
      return game.metaphoricalSentences[questionIndex]?.arabic;
    } else if (game.translationWords) {
      return game.translationWords[questionIndex]?.arabic;
    }
    
    return '';
  }

  handleSelectAnswerMode(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.gameId) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      const game = this.games.get(client.gameId);
      if (!game) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      // Set answer mode and start the game
      game.answerMode = data.answerMode;
      game.gameStatus = 'playing';
      game.currentRound = 1;

      console.log(`🎯 Answer mode selected: ${data.answerMode} for game ${client.gameId}`);

      // Start first round
      this.startNextTranslationRound(client.gameId);

    } catch (error) {
      console.error('Error handling answer mode selection:', error);
      this.sendToClient(clientId, 'game-error', { message: 'Failed to select answer mode' });
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  async handleGenerateConversation(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.gameId) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      const game = this.games.get(client.gameId);
      if (!game) {
        this.sendToClient(clientId, 'game-error', { message: 'Game not found' });
        return;
      }

      // Only Player 1 can generate conversations
      const player = game.players.find(p => p.id === clientId);
      if (!player || player !== game.players[0]) {
        this.sendToClient(clientId, 'game-error', { message: 'Only Player 1 can generate conversations' });
        return;
      }

      console.log(`🤖 Generating conversation for game ${client.gameId}:`, data);

      // Handle both formats: {characters: []} or {character1: '', character2: ''}
      let characters;
      if (data.characters && Array.isArray(data.characters)) {
        characters = data.characters;
      } else if (data.character1 && data.character2) {
        characters = [data.character1.trim(), data.character2.trim()];
      } else {
        this.sendToClient(clientId, 'conversation-error', { 
          message: 'Invalid conversation data. Topic and 2 characters required.' 
        });
        return;
      }

      // Validate input data
      if (!data.topic || !characters || characters.length < 2) {
        this.sendToClient(clientId, 'conversation-error', { 
          message: 'Invalid conversation data. Topic and 2 characters required.' 
        });
        return;
      }

      const payload = {
        topic: data.topic.trim(),
        wordCount: data.wordCount || 150,
        characters: characters
      };

      console.log('📡 Calling API with payload:', payload);

      // Call the conversation API
      const response = await fetch('http://localhost:3000/api/generate-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`📥 API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
      }

      const conversation = await response.json();
      
      // Store the conversation in the game
      game.conversation = conversation;
      game.gameStatus = 'conversation-display';

      // Send the conversation to both players
      this.sendToClients(
        game.players.map(p => p.id),
        'conversation-generated',
        {
          gameId: client.gameId,
          conversation: conversation
        }
      );

      console.log(`✅ Conversation generated and sent to both players`);

    } catch (error) {
      console.error('Failed to generate conversation:', error);
      this.sendToClient(clientId, 'conversation-error', { 
        message: 'Failed to generate conversation. Please try again.' 
      });
    }
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log('\n🚀 WordMash Battle WebSocket Server');
      console.log(`📍 Port: ${this.port}`);
      console.log(`🔗 WebSocket: ws://localhost:${this.port}/ws`);
      console.log(`🌐 HTTP: http://localhost:${this.port}`);
      console.log(`⏰ Started: ${new Date().toISOString()}\n`);
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new WebSocketGameServer();
  server.start();
}

module.exports = WebSocketGameServer;