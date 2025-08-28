const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const ip = getLocalIPAddress();
console.log('🌐 Local IP Address:', ip);
console.log('');
console.log('📱 Mobile Test URLs:');
console.log(`   http://${ip}:3001 (Mobile Test Server)`);
console.log(`   http://${ip}:4567 (Main Game Server)`);
console.log(`   http://${ip}:3000 (Next.js Frontend)`);
console.log('');
console.log('💡 Instructions:');
console.log('1. Connect your mobile device to the same WiFi network');
console.log('2. Open one of the URLs above in your mobile browser');
console.log('3. Test the connection stability');

module.exports = { getLocalIPAddress };