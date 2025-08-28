const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const GameService = require('./services/GameService');
const SocketHandlers = require('./handlers/SocketHandlers');

class WordBattleServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = null;
    this.port = process.env.PORT || 4567;
    this.gameService = new GameService();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(compression());
    this.app.use(cors({
      origin: "*",
      credentials: false
    }));
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    this.app.get('/', (req, res) => {
      res.json({
        message: 'WordMash Battle Server v2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        clients: this.io ? this.io.engine.clientsCount : 0
      });
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        clients: this.io ? this.io.engine.clientsCount : 0
      });
    });

    this.app.get('/api/words/random', (req, res) => {
      try {
        const count = parseInt(req.query.count) || 5;
        const difficulty = req.query.difficulty || 'mixed';
        const words = this.gameService.getRandomWords(count, difficulty);
        res.json({ words, count: words.length });
      } catch (error) {
        console.error('Error getting random words:', error);
        res.status(500).json({ error: 'Failed to get random words' });
      }
    });

    this.app.get('/api/words/translation', (req, res) => {
      try {
        const count = parseInt(req.query.count) || 5;
        const difficulty = req.query.difficulty || 'mixed';
        const words = this.gameService.getRandomTranslationWords(count, difficulty);
        res.json({ words, count: words.length });
      } catch (error) {
        console.error('Error getting translation words:', error);
        res.status(500).json({ error: 'Failed to get translation words' });
      }
    });

    this.app.get('/api/words/metaphorical', (req, res) => {
      try {
        const count = parseInt(req.query.count) || 5;
        const difficulty = req.query.difficulty || 'mixed';
        const sentences = this.gameService.getRandomMetaphoricalSentences(count, difficulty);
        res.json({ sentences, count: sentences.length });
      } catch (error) {
        console.error('Error getting metaphorical sentences:', error);
        res.status(500).json({ error: 'Failed to get metaphorical sentences' });
      }
    });
  }

  setupSocketIO() {
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
      },
      allowEIO3: false,
      
      // Simplified transport settings for stability
      transports: ['polling', 'websocket'],
      allowUpgrades: true,
      
      // Standard timeouts for reliability
      pingTimeout: 60000,         // 1 minute
      pingInterval: 25000,        // 25 seconds
      upgradeTimeout: 30000,      // 30 seconds
      
      // Basic connection settings
      maxHttpBufferSize: 1e6,     // 1MB buffer
      httpCompression: true,
      
      // Standard connection timeout
      connectTimeout: 45000,      // 45 seconds
      serveClient: false
    });

    const socketHandlers = new SocketHandlers(this.io, this.gameService);
    socketHandlers.initialize();

    this.io.engine.on("connection_error", (err) => {
      console.log('Connection error:', err.req);
      console.log('Error code:', err.code);
      console.log('Error message:', err.message);
      console.log('Error context:', err.context);
    });
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error('Express error:', err);
      if (res.headersSent) return next(err);
      res.status(500).json({ error: 'Internal server error' });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      this.shutdown();
    });
  }

  start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log('\n🚀 WordMash Battle Server v2.0');
        console.log(`📍 Port: ${this.port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Local: http://localhost:${this.port}`);
        console.log(`🎮 Socket.IO: Ready for connections`);
        console.log(`⏰ Started: ${new Date().toISOString()}\n`);
        resolve();
      });
    });
  }

  shutdown() {
    console.log('Shutting down server...');
    if (this.io) {
      this.io.close(() => {
        console.log('Socket.IO server closed');
      });
    }
    this.server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  }
}

if (require.main === module) {
  const server = new WordBattleServer();
  server.start().catch(console.error);
}

module.exports = WordBattleServer;