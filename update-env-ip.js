const os = require('os');
const fs = require('fs');
const path = require('path');

function getCurrentNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  // Look for the first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (loopback) and IPv6 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return null;
}

function updateEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  const currentIP = getCurrentNetworkIP();
  
  if (!currentIP) {
    console.error('Could not detect network IP address');
    process.exit(1);
  }
  
  console.log(`Detected network IP: ${currentIP}`);
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the NEXT_PUBLIC_SOCKET_URL with the new IP
    const newSocketURL = `http://${currentIP}:4569`;
    const updatedContent = envContent.replace(
      /^NEXT_PUBLIC_SOCKET_URL=http:\/\/[\d.]+:4569$/m,
      `NEXT_PUBLIC_SOCKET_URL=${newSocketURL}`
    );
    
    if (updatedContent === envContent) {
      console.log('No changes needed - IP is already up to date');
    } else {
      fs.writeFileSync(envPath, updatedContent);
      console.log(`Updated NEXT_PUBLIC_SOCKET_URL to: ${newSocketURL}`);
    }
  } catch (error) {
    console.error('Error updating .env.local:', error.message);
    process.exit(1);
  }
}

updateEnvFile();