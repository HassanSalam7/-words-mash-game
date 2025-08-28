const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Simple mobile test server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout: 120000,
  pingInterval: 30000,
  upgradeTimeout: 60000
});

let connectionCount = 0;
const connections = new Map();

// Serve a simple test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mobile Socket.IO Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; }
            .connected { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .disconnected { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .connecting { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            .log { background: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; margin: 10px 0; max-height: 200px; overflow-y: auto; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .info { background: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
        <script src="/socket.io/socket.io.js"></script>
    </head>
    <body>
        <div class="container">
            <h1>📱 Mobile Socket.IO Connection Test</h1>
            
            <div class="info">
                <strong>Device:</strong> <span id="deviceType">Unknown</span><br>
                <strong>User Agent:</strong> <span id="userAgent">Unknown</span><br>
                <strong>Network:</strong> <span id="networkType">Unknown</span><br>
                <strong>Online:</strong> <span id="onlineStatus">Unknown</span>
            </div>
            
            <div id="status" class="status disconnected">Disconnected</div>
            
            <div>
                <button onclick="connect()">Connect</button>
                <button onclick="disconnect()">Disconnect</button>
                <button onclick="sendPing()">Send Ping</button>
                <button onclick="clearLog()">Clear Log</button>
            </div>
            
            <div id="log" class="log"></div>
        </div>

        <script>
            let socket = null;
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Update device info
            document.getElementById('deviceType').textContent = isMobile ? 'Mobile' : 'Desktop';
            document.getElementById('userAgent').textContent = navigator.userAgent;
            document.getElementById('onlineStatus').textContent = navigator.onLine ? 'Yes' : 'No';
            
            // Network info
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                document.getElementById('networkType').textContent = connection.effectiveType || 'Unknown';
            }

            function log(message) {
                const logDiv = document.getElementById('log');
                const time = new Date().toLocaleTimeString();
                logDiv.innerHTML += \`<div>[\${time}] \${message}</div>\`;
                logDiv.scrollTop = logDiv.scrollHeight;
            }

            function updateStatus(status) {
                const statusDiv = document.getElementById('status');
                statusDiv.className = \`status \${status}\`;
                switch(status) {
                    case 'connected':
                        statusDiv.textContent = '✅ Connected';
                        break;
                    case 'connecting':
                        statusDiv.textContent = '🔄 Connecting...';
                        break;
                    case 'disconnected':
                        statusDiv.textContent = '❌ Disconnected';
                        break;
                }
            }

            function connect() {
                if (socket && socket.connected) {
                    log('Already connected');
                    return;
                }

                log('Creating socket connection...');
                updateStatus('connecting');

                socket = io({
                    transports: ['polling', 'websocket'],
                    upgrade: true,
                    timeout: 30000,
                    reconnection: true,
                    reconnectionDelay: 500,
                    reconnectionAttempts: 10,
                    query: {
                        mobile: isMobile,
                        userAgent: navigator.userAgent,
                        test: 'mobile-test'
                    }
                });

                socket.on('connect', () => {
                    log(\`Connected! Socket ID: \${socket.id}\`);
                    log(\`Transport: \${socket.io.engine.transport.name}\`);
                    updateStatus('connected');
                });

                socket.on('connect_error', (error) => {
                    log(\`Connection error: \${error.message}\`);
                    updateStatus('disconnected');
                });

                socket.on('disconnect', (reason) => {
                    log(\`Disconnected: \${reason}\`);
                    updateStatus('disconnected');
                });

                socket.on('upgrade', () => {
                    log(\`Transport upgraded to: \${socket.io.engine.transport.name}\`);
                });

                socket.on('upgradeError', (error) => {
                    log(\`Upgrade error: \${error.message}\`);
                });

                socket.on('pong', () => {
                    log('🏓 Pong received');
                });
            }

            function disconnect() {
                if (socket) {
                    socket.close();
                    socket = null;
                    log('Disconnected manually');
                    updateStatus('disconnected');
                }
            }

            function sendPing() {
                if (socket && socket.connected) {
                    log('🏓 Sending ping...');
                    socket.emit('ping');
                } else {
                    log('Not connected');
                }
            }

            function clearLog() {
                document.getElementById('log').innerHTML = '';
            }

            // Network change detection
            window.addEventListener('online', () => {
                log('📶 Network online');
                document.getElementById('onlineStatus').textContent = 'Yes';
            });

            window.addEventListener('offline', () => {
                log('📴 Network offline');
                document.getElementById('onlineStatus').textContent = 'No';
            });

            // Page visibility changes
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    log('👁️ Page hidden');
                } else {
                    log('👁️ Page visible');
                }
            });

            // Auto-connect on load
            log('Page loaded, auto-connecting...');
            connect();
        </script>
    </body>
    </html>
  `);
});

io.on('connection', (socket) => {
  connectionCount++;
  const isMobile = socket.handshake.query.mobile === 'true';
  const userAgent = socket.handshake.query.userAgent || 'Unknown';
  
  console.log(`📱 Connection ${connectionCount}: ${socket.id}`);
  console.log(`   Mobile: ${isMobile ? 'Yes' : 'No'}`);
  console.log(`   Transport: ${socket.conn.transport.name}`);
  console.log(`   User Agent: ${userAgent.substring(0, 50)}...`);

  connections.set(socket.id, {
    id: socket.id,
    isMobile,
    userAgent,
    connectedAt: new Date(),
    transport: socket.conn.transport.name
  });

  socket.on('ping', () => {
    console.log(`🏓 Ping from ${socket.id}`);
    socket.emit('pong');
  });

  socket.on('disconnect', (reason) => {
    const conn = connections.get(socket.id);
    const duration = conn ? Math.round((new Date() - conn.connectedAt) / 1000) : 'Unknown';
    
    console.log(`❌ Disconnected: ${socket.id} (${reason}) - Duration: ${duration}s`);
    connections.delete(socket.id);
  });

  socket.on('error', (error) => {
    console.log(`💥 Socket error: ${socket.id} - ${error.message}`);
  });
});

const port = process.env.PORT || 3001;
server.listen(port, '0.0.0.0', () => {
  console.log(`🧪 Mobile test server running on http://localhost:${port}`);
  console.log(`📱 Access from mobile: http://YOUR_IP:${port}`);
  console.log('');
  console.log('Instructions:');
  console.log('1. Find your local IP address');
  console.log('2. Open http://YOUR_IP:3001 on your mobile device');
  console.log('3. Test the connection stability');
});