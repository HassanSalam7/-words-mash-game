# WordMash Battle - Deployment Instructions

## 🚀 Quick Deploy Options

### Option 1: Docker (Recommended)
```bash
# 1. Set your Groq API key
export GROQ_API_KEY=your_groq_api_key_here

# 2. Build and run
docker-compose up -d

# Access at http://localhost:3000
```

### Option 2: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel:
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SOCKET_URL=https://your-railway-server.railway.app`
   - `NEXT_PUBLIC_GROQ_API_KEY=your_groq_key`

#### Backend on Railway:
1. Create new Railway project
2. Deploy from GitHub (server folder)
3. Set environment variables:
   - `PORT=4568`
   - `NODE_ENV=production`

### Option 3: VPS/Cloud Server

#### Prerequisites:
- Node.js 18+
- PM2 (process manager)
- Nginx (reverse proxy)

#### Setup:
```bash
# 1. Install dependencies
npm install
cd server && npm install

# 2. Build frontend
npm run build

# 3. Setup environment
cp .env.example .env.local
cp server/.env.example server/.env

# 4. Start with PM2
pm2 start ecosystem.config.js
```

## 🔧 Environment Variables

### Frontend (.env.local):
```
NEXT_PUBLIC_SOCKET_URL=https://your-server-domain.com
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
NODE_ENV=production
```

### Server (.env):
```
PORT=4568
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## 🎮 Game Features Status
✅ Story Writing Mode (Multiplayer)
✅ Quick Translation (Multiple Choice)
✅ Type Challenge (Typing Mode)  
✅ Metaphor Master Mode
✅ AI Conversations (Multiplayer)
✅ Speech Training (Single Player)
✅ Mobile WebSocket Support
✅ Private Rooms
✅ Real-time Multiplayer
✅ Progressive Web App Ready

## 📱 Supported Platforms
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet (iPad, Android tablets)
- ✅ Cross-platform multiplayer

## 🔒 Security Features
- Rate limiting
- Input validation
- CORS protection
- XSS prevention
- Mobile connection optimization

## 📈 Performance
- Fast WebSocket connections
- Optimized for mobile networks
- Auto-reconnection
- Efficient state management
- CDN-ready static assets

The game is **PRODUCTION READY** for deployment! 🎉