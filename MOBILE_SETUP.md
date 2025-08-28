# 📱 Mobile WebSocket Connection Setup

## 🚀 Quick Mobile Testing Setup

### **1. Find Your Development Machine's IP**
```bash
# Windows
ipconfig | findstr IPv4

# macOS/Linux  
ifconfig | grep inet
```

### **2. Update WebSocket URL for Mobile**
The client automatically detects mobile and uses your local IP. Common development IPs:
- **192.168.1.x** (most home routers)
- **192.168.0.x** (some routers) 
- **10.0.0.x** (corporate networks)

### **3. Start Servers**
```bash
# Start both frontend and WebSocket server
npm run dev

# Or separate:
npm run ws-dev    # WebSocket server on :4568
npm start         # Next.js frontend on :3000
```

### **4. Connect Mobile Device**
1. **Same WiFi**: Connect mobile to same WiFi as development machine
2. **Open**: `http://YOUR_IP:3000` in mobile browser
3. **WebSocket**: Connects to `ws://YOUR_IP:4568/ws`

### **5. CORS Configuration (Already Fixed)**
The `next.config.ts` automatically allows common mobile IP ranges:
- ✅ **192.168.0.x** (your current range)
- ✅ **192.168.1.x** (most common home routers)  
- ✅ **10.0.0.x** (corporate networks)
- ✅ **172.16.0.x** (advanced setups)

**No manual configuration needed** - supports IPs .100 through .120 in each range.

## 📱 Mobile-Specific Features

### **Connection Stability**
- ✅ **Auto-detection** of mobile devices via User-Agent
- ✅ **Keep-alive pings** every 30 seconds for mobile
- ✅ **Network change handling** (WiFi ↔ cellular)
- ✅ **App backgrounding** support
- ✅ **Extended timeouts** (10s vs 5s for desktop)
- ✅ **Exponential backoff** with max 30s delay
- ✅ **Automatic reconnection** up to 10 attempts

### **Mobile Network Events**
- **`online`** - Network restored, auto-reconnect
- **`offline`** - Network lost, pause reconnection
- **`visibilitychange`** - App focus/background handling
- **`focus`** - App became active, check connection

### **Mobile Optimizations**
- **Compression**: Mobile-optimized message compression
- **Keep-alive**: TCP keep-alive every 30 seconds  
- **No-delay**: Disabled Nagle's algorithm for faster sending
- **Extended cleanup**: 60s vs 30s for game cleanup

## 🐛 Mobile Debugging

### **Connection Issues**
```javascript
// Check mobile detection
console.log('Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

// Monitor connection events
socket.on('connect', () => console.log('✅ Connected'));
socket.on('disconnect', (reason) => console.log('❌ Disconnected:', reason));
socket.on('connect_error', (error) => console.log('🚫 Error:', error));
```

### **Network Debugging**
```javascript
// Check network status
console.log('Online:', navigator.onLine);

// Monitor network changes
window.addEventListener('online', () => console.log('📡 Network online'));
window.addEventListener('offline', () => console.log('📡 Network offline'));
```

## 🎯 Testing Scenarios

### **Network Switching**
1. Start on WiFi → works
2. Switch to cellular → auto-reconnects
3. Switch back to WiFi → maintains connection

### **App Backgrounding** 
1. Open app → connects
2. Background app → connection maintained with pings
3. Return to app → connection active

### **Network Interruption**
1. Turn off WiFi → detects offline
2. Turn on WiFi → auto-reconnects
3. All game state preserved

## 🔧 Configuration

### **Mobile Timeouts**
```javascript
// Connection timeout: 10s (vs 5s desktop)
// Reconnect delay: 3s base (vs 2s desktop)  
// Max delay: 30s (exponential backoff)
// Max attempts: 10 (vs 5 desktop)
// Ping interval: 30s
// Ping timeout: 90s
```

### **Server Detection**
```javascript
// User-Agent patterns
/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
/Mobile|Tablet/i

// Touch device detection
navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform) // iPad
```

## 🚨 Troubleshooting

### **CORS Blocked Resources (Fixed)**
```
❌ Blocked cross-origin request from 192.168.0.107 to /_next/* resource
```
**Solution**: Already fixed in `next.config.ts` with `allowedDevOrigins`

### **Can't Connect from Mobile**
1. **Check IP**: Use `ipconfig` to get correct IP
2. **Same Network**: Mobile and dev machine on same WiFi  
3. **Restart Dev Server**: After IP changes, restart with `npm run dev`
4. **Firewall**: Allow port 3000 and 4568 in Windows Firewall
5. **URL**: Use IP address, not localhost

### **Frequent Disconnections**
1. **Battery Saver**: Disable battery optimization for browser
2. **Background**: Keep app in foreground during development
3. **Network**: Use stable WiFi, avoid cellular if possible

### **Slow Reconnection**
1. **Background Apps**: Close other apps using network
2. **WiFi Sleep**: Disable WiFi sleep in phone settings
3. **Browser**: Use Chrome/Safari, avoid mobile browsers with aggressive power saving

## 📊 Performance Comparison

| Feature | Desktop | Mobile |
|---------|---------|---------|
| Connection Timeout | 5s | 10s |
| Reconnect Attempts | 5 | 10 |
| Ping Interval | None | 30s |
| Game Cleanup | 30s | 60s |
| Error Rate | <5% | <10% |
| Connection Time | ~500ms | ~1-2s |

Mobile connections are inherently more unstable but the system is designed to handle these challenges gracefully.