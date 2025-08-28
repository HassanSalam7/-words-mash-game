class SocketHandlers {
  constructor(io, gameService) {
    this.io = io;
    this.gameService = gameService;
    this.games = new Map();
    this.waitingPlayers = [];
    this.privateRooms = new Map();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      const isMobile = socket.handshake.query.mobile === 'true';
      const clientIP = socket.handshake.address;
      
      console.log(`🔌 Client connected: ${socket.id} (Total: ${this.io.engine.clientsCount})`);
      console.log(`📱 Mobile: ${isMobile ? 'Yes' : 'No'}, IP: ${clientIP}`);
      console.log(`🔗 Initial Transport: ${socket.conn.transport.name}`);
      
      // Store minimal client info for debugging
      socket.clientInfo = { isMobile, clientIP, connectedAt: new Date() };

      // Connection event handlers
      this.setupConnectionHandlers(socket);
      
      // Game event handlers
      this.setupGameHandlers(socket);
      
      // Private room handlers
      this.setupPrivateRoomHandlers(socket);
      
      // Story/translation submission handlers
      this.setupSubmissionHandlers(socket);
      
      // Disconnection handler
      this.setupDisconnectionHandler(socket);
    });
    
    // Enhanced connection error handling for mobile
    this.io.engine.on('connection_error', (err) => {
      console.log('🚨 Connection error details:');
      console.log('  - Request URL:', err.req?.url || 'Unknown');
      console.log('  - User Agent:', err.req?.headers['user-agent'] || 'Unknown');
      console.log('  - Error Code:', err.code);
      console.log('  - Error Message:', err.message);
      console.log('  - Error Context:', err.context);
    });
  }

  setupConnectionHandlers(socket) {
    socket.on('connect', () => {
      console.log(`✅ Socket ${socket.id} connected successfully`);
    });

    socket.on('ping', (callback) => {
      if (callback) callback('pong');
    });
  }

  setupGameHandlers(socket) {
    socket.on('join-game', (data) => {
      try {
        console.log('🎮 Player joining game:', data);
        
        if (!data || !data.name || !data.gameMode) {
          socket.emit('join-error', { message: 'Invalid player data' });
          return;
        }
        
        socket.playerData = data;
        
        // Remove from waiting list if already there
        this.removeFromWaitingList(socket.id);
        
        // Add to waiting list
        this.waitingPlayers.push({
          id: socket.id,
          name: data.name,
          avatar: data.avatar,
          gameMode: data.gameMode,
          translationMode: data.translationMode,
          joinedAt: Date.now()
        });
        
        this.broadcastWaitingPlayers();
        this.tryMatchPlayers();
        
      } catch (error) {
        console.error('Error in join-game handler:', error);
        socket.emit('join-error', { message: 'Failed to join game' });
      }
    });

    socket.on('join-queue', (data) => {
      try {
        console.log('🎮 Player joining queue (legacy):', data);
        
        if (!data || !data.playerName || !data.gameMode) {
          socket.emit('join-error', { message: 'Invalid player data' });
          return;
        }
        
        socket.playerData = {
          name: data.playerName,
          avatar: data.avatar,
          gameMode: data.gameMode,
          translationMode: data.translationMode
        };
        
        // Remove from waiting list if already there
        this.removeFromWaitingList(socket.id);
        
        // Add to waiting list
        this.waitingPlayers.push({
          id: socket.id,
          name: data.playerName,
          avatar: data.avatar,
          gameMode: data.gameMode,
          translationMode: data.translationMode,
          joinedAt: Date.now()
        });
        
        this.broadcastWaitingPlayers();
        this.tryMatchPlayers();
        
      } catch (error) {
        console.error('Error in join-queue handler:', error);
        socket.emit('join-error', { message: 'Failed to join queue' });
      }
    });

    socket.on('leave-queue', () => {
      try {
        if (this.removeFromWaitingList(socket.id)) {
          this.broadcastWaitingPlayers();
          console.log(`🚪 Player ${socket.id} left queue`);
        }
      } catch (error) {
        console.error('Error in leave-queue handler:', error);
      }
    });

    socket.on('select-answer-mode', (data) => {
      try {
        const gameId = socket.gameId;
        const game = this.games.get(gameId);
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }
        
        game.answerMode = data.answerMode;
        game.gameStatus = 'playing';
        console.log(`🎯 Answer mode selected: ${data.answerMode} for game ${gameId}`);
        
        // Start the actual game with selected answer mode
        this.io.to(gameId).emit('game-start', game);
        
      } catch (error) {
        console.error('Error in select-answer-mode handler:', error);
        socket.emit('game-error', { message: 'Failed to select answer mode' });
      }
    });
  }

  setupPrivateRoomHandlers(socket) {
    socket.on('create-private-room', (data) => {
      try {
        const roomCode = this.gameService.generateRoomCode();
        const room = {
          code: roomCode,
          host: socket.id,
          players: [{
            id: socket.id,
            name: data.name,
            avatar: data.avatar,
            isHost: true
          }],
          gameMode: data.gameMode,
          translationMode: data.translationMode,
          status: 'waiting',
          createdAt: Date.now()
        };
        
        this.privateRooms.set(roomCode, room);
        socket.roomCode = roomCode;
        socket.playerData = data;
        socket.join(`room_${roomCode}`);
        
        socket.emit('room-created', { room });
        console.log(`🏠 Private room created: ${roomCode} by ${data.name}`);
      } catch (error) {
        console.error('Error creating private room:', error);
        socket.emit('room-error', { message: 'Failed to create room' });
      }
    });

    socket.on('join-private-room', (data) => {
      try {
        const room = this.privateRooms.get(data.roomCode.toUpperCase());
        
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' });
          return;
        }
        
        if (room.players.length >= 2) {
          socket.emit('room-error', { message: 'Room is full' });
          return;
        }
        
        if (room.status !== 'waiting') {
          socket.emit('room-error', { message: 'Game already started' });
          return;
        }
        
        room.players.push({
          id: socket.id,
          name: data.playerData.name,
          avatar: data.playerData.avatar,
          isHost: false
        });
        
        socket.roomCode = room.code;
        socket.playerData = data.playerData;
        socket.join(`room_${room.code}`);
        
        this.io.to(`room_${room.code}`).emit('room-updated', { room });
        
        console.log(`🏠 ${data.playerData.name} joined private room: ${room.code}`);
      } catch (error) {
        console.error('Error joining private room:', error);
        socket.emit('room-error', { message: 'Failed to join room' });
      }
    });
  }

  setupSubmissionHandlers(socket) {
    socket.on('submit-story', (data) => {
      try {
        const gameId = socket.gameId;
        const game = this.games.get(gameId);
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }
        
        const player = game.players.find(p => p.id === socket.id);
        if (!player) {
          socket.emit('game-error', { message: 'Player not in game' });
          return;
        }
        
        player.story = data.story;
        player.usedWords = data.usedWords;
        player.submittedAt = Date.now();
        
        console.log(`📝 Story submitted by ${player.name}`);
        
        // Check if all players have submitted
        const allSubmitted = game.players.every(p => p.story);
        
        if (allSubmitted) {
          const gameResults = {
            gameId: gameId,
            stories: game.players.map(p => ({
              playerName: p.name,
              avatar: p.avatar,
              story: p.story,
              usedWords: p.usedWords || [],
              wordsCount: p.usedWords ? p.usedWords.length : 0
            }))
          };
          
          this.io.to(gameId).emit('game-results', gameResults);
          
          // Clean up game
          this.games.delete(gameId);
        }
      } catch (error) {
        console.error('Error in submit-story handler:', error);
        socket.emit('game-error', { message: 'Failed to submit story' });
      }
    });

    socket.on('submit-translation-answer', (data) => {
      try {
        const gameId = socket.gameId;
        const game = this.games.get(gameId);
        if (!game) {
          socket.emit('game-error', { message: 'Game not found' });
          return;
        }
        
        const player = game.players.find(p => p.id === socket.id);
        if (!player) {
          socket.emit('game-error', { message: 'Player not in game' });
          return;
        }
        
        player.currentAnswer = data.answer;
        player.timeUsed = data.timeUsed;
        
        console.log(`✅ Answer submitted by ${player.name}: ${data.answer}`);
        
        // Send feedback to players
        this.io.to(gameId).emit('round-feedback', {
          gameStatus: 'showing-result',
          lastRoundWinner: player,
          correctAnswer: data.answer,
          players: game.players
        });
        
      } catch (error) {
        console.error('Error in submit-translation-answer handler:', error);
        socket.emit('game-error', { message: 'Failed to submit answer' });
      }
    });
  }

  setupDisconnectionHandler(socket) {
    socket.on('disconnect', (reason) => {
      const isMobile = socket.clientInfo?.isMobile || false;
      const connectedFor = socket.clientInfo?.connectedAt 
        ? Math.round((new Date() - socket.clientInfo.connectedAt) / 1000) 
        : 'Unknown';
      
      console.log(`❌ Client disconnected: ${socket.id} - ${reason} (Total: ${this.io.engine.clientsCount})`);
      console.log(`📱 Mobile: ${isMobile ? 'Yes' : 'No'}, Connected for: ${connectedFor}s`);
      
      // Log mobile-specific disconnect reasons
      if (isMobile) {
        switch (reason) {
          case 'transport error':
            console.log('📱 Mobile transport error - likely network switching or poor signal');
            break;
          case 'transport close':
            console.log('📱 Mobile transport close - likely app backgrounded or network change');
            break;
          case 'ping timeout':
            console.log('📱 Mobile ping timeout - likely poor network connection');
            break;
          case 'client namespace disconnect':
            console.log('📱 Mobile client disconnect - app closed or tab switched');
            break;
          default:
            console.log(`📱 Mobile disconnect reason: ${reason}`);
        }
      }
      
      try {
        // Remove from waiting list
        if (this.removeFromWaitingList(socket.id)) {
          this.broadcastWaitingPlayers();
        }
        
        // Handle private room disconnection
        this.handlePrivateRoomDisconnection(socket);
        
        // Handle game disconnection
        this.handleGameDisconnection(socket);
        
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });

    // Track transport upgrades for mobile debugging
    socket.on('upgrade', () => {
      console.log(`⬆️ Transport upgraded: ${socket.id} -> ${socket.conn.transport.name}`);
    });

    // Track transport downgrades
    socket.on('upgradeError', (error) => {
      console.log(`⬇️ Transport upgrade failed: ${socket.id} - ${error.message}`);
    });
  }

  handlePrivateRoomDisconnection(socket) {
    const roomCode = socket.roomCode;
    if (roomCode) {
      const room = this.privateRooms.get(roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          this.privateRooms.delete(roomCode);
          console.log(`🗑️  Empty room ${roomCode} deleted`);
        } else {
          this.io.to(`room_${roomCode}`).emit('room-updated', { room });
          this.io.to(`room_${roomCode}`).emit('player-left', { 
            playerName: socket.playerData?.name 
          });
        }
      }
    }
  }

  handleGameDisconnection(socket) {
    const gameId = socket.gameId;
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        socket.to(gameId).emit('opponent-disconnected');
        
        // Clean up game after delay
        setTimeout(() => {
          if (this.games.has(gameId)) {
            this.games.delete(gameId);
            console.log(`🗑️  Game ${gameId} cleaned up after disconnection`);
          }
        }, 30000);
      }
    }
  }

  removeFromWaitingList(socketId) {
    const playerIndex = this.waitingPlayers.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      this.waitingPlayers.splice(playerIndex, 1);
      return true;
    }
    return false;
  }

  broadcastWaitingPlayers() {
    const waitingList = this.waitingPlayers.map(p => ({ 
      name: p.name, 
      avatar: p.avatar,
      gameMode: p.gameMode,
      joinedAt: p.joinedAt
    }));
    this.io.emit('waiting-players-update', waitingList);
  }

  tryMatchPlayers() {
    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers[0];
      let player2 = null;
      
      // Find compatible players
      for (let i = 1; i < this.waitingPlayers.length; i++) {
        const candidate = this.waitingPlayers[i];
        if (candidate.gameMode === player1.gameMode && 
            candidate.translationMode === player1.translationMode) {
          player2 = candidate;
          break;
        }
      }
      
      if (player2) {
        // Remove matched players from waiting list
        const index1 = this.waitingPlayers.indexOf(player1);
        const index2 = this.waitingPlayers.indexOf(player2);
        this.waitingPlayers.splice(Math.max(index1, index2), 1);
        this.waitingPlayers.splice(Math.min(index1, index2), 1);
        
        // Create game
        this.createGame(player1, player2);
        
        // Broadcast updated waiting list
        this.broadcastWaitingPlayers();
      }
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
          { 
            id: player1.id, 
            name: player1.name, 
            avatar: player1.avatar, 
            score: 0,
            color: '#8B5CF6'
          },
          { 
            id: player2.id, 
            name: player2.name, 
            avatar: player2.avatar, 
            score: 0,
            color: '#EF4444'
          }
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
      console.log(`🎮 Creating game for mode: ${player1.gameMode}, translation mode: ${player1.translationMode || 'N/A'}`);
      
      switch (player1.gameMode) {
        case 'translation':
          try {
            if (player1.translationMode === 'metaphorical') {
              console.log('📚 Loading metaphorical sentences for metaphorical translation mode...');
              gameData.metaphoricalSentences = this.gameService.getRandomMetaphoricalSentences(15, 'mixed');
              console.log(`✅ Loaded ${gameData.metaphoricalSentences.length} metaphorical sentences`);
            } else {
              console.log('📚 Loading translation words for regular translation mode...');
              gameData.translationWords = this.gameService.getRandomTranslationWords(15, 'mixed');
              console.log(`✅ Loaded ${gameData.translationWords.length} translation words`);
            }
          } catch (error) {
            console.error('❌ Error loading translation content:', error.message);
            console.error('Stack trace:', error.stack);
            // Fallback to basic content
            gameData.translationWords = [];
          }
          
          // For translation games, show answer mode selection first
          setTimeout(() => {
            this.io.to(gameId).emit('select-answer-mode', { isHost: true });
          }, 1000);
          break;
          
        case 'conversation-generator':
          gameData.gameStatus = 'waiting_for_player1';
          break;
          
        default: // story-writing
          try {
            console.log('📚 Loading story words for story-writing mode...');
            gameData.words = this.gameService.getRandomWords(5, 'mixed');
            console.log(`✅ Loaded ${gameData.words.length} story words`);
          } catch (error) {
            console.error('❌ Error loading story words:', error.message);
            console.error('Stack trace:', error.stack);
            // Fallback to basic words
            gameData.words = [
              { word: 'adventure', difficulty: 'easy' },
              { word: 'magic', difficulty: 'easy' },
              { word: 'forest', difficulty: 'easy' },
              { word: 'mysterious', difficulty: 'medium' },
              { word: 'journey', difficulty: 'medium' }
            ];
            console.log('🔄 Using fallback story words');
          }
      }
      
      this.games.set(gameId, gameData);
      
      // Join game rooms
      const socket1 = this.io.sockets.sockets.get(player1.id);
      const socket2 = this.io.sockets.sockets.get(player2.id);
      
      if (socket1) {
        socket1.join(gameId);
        socket1.gameId = gameId;
      }
      if (socket2) {
        socket2.join(gameId);
        socket2.gameId = gameId;
      }
      
      // Send game data to each player with their specific perspective
      if (socket1) {
        socket1.emit('game-start', { ...gameData, isPlayer1: true });
      }
      if (socket2) {
        socket2.emit('game-start', { ...gameData, isPlayer1: false });
      }
      
      console.log(`🎮 Game created: ${gameId} (${player1.gameMode}) - ${player1.name} vs ${player2.name}`);
      
    } catch (error) {
      console.error('Error creating game:', error);
    }
  }
}

module.exports = SocketHandlers;