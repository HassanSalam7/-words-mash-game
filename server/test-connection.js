const { io } = require('socket.io-client');

console.log('🧪 Testing Socket.IO Connection...\n');

const socket = io('http://localhost:4567', {
  transports: ['websocket', 'polling'],
  timeout: 10000
});

socket.on('connect', () => {
  console.log('✅ Connected successfully!');
  console.log('Socket ID:', socket.id);
  console.log('Transport:', socket.io.engine.transport.name);
  
  // Test ping
  socket.emit('ping', (response) => {
    console.log('🏓 Ping response:', response);
  });
  
  setTimeout(() => {
    console.log('\n🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('📴 Disconnected:', reason);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('⏰ Connection test timed out');
  process.exit(1);
}, 15000);