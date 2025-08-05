# WordMash Battle - Deployment Guide

## Features Added ✨

### 🏠 Private Rooms
- **Create Private Rooms**: Players can create private rooms with unique 6-character codes
- **Join by Room Code**: Enter a room code to join a friend's private room  
- **Share Room Links**: Easy sharing via URL parameters or native sharing API
- **Real-time Updates**: See when friends join/leave rooms instantly

### 📱 Mobile Optimized
- **Responsive Design**: Works perfectly on iOS and Android devices
- **Touch Optimizations**: Better touch interactions and no zoom issues
- **PWA Support**: Can be installed as an app on mobile devices
- **Mobile-First UI**: Optimized layouts for small screens

### 🔗 Multiplayer Features
- **Random Matching**: Quick random player matching
- **Private Room System**: Play with specific friends
- **Real-time Sync**: Instant game updates via WebSocket
- **Connection Management**: Auto-reconnection and connection status

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

#### Frontend Deployment
1. Push your code to GitHub
2. Connect to Vercel: https://vercel.com
3. Import your repository
4. Deploy automatically

#### Backend Deployment (Railway/Render)
1. **Railway**: 
   - Go to https://railway.app
   - Connect GitHub repo
   - Deploy the `/server` folder
   - Set environment: `NODE_ENV=production`

2. **Render**:
   - Go to https://render.com
   - Create a new web service
   - Point to your repo's `/server` folder
   - Use build command: `npm install`
   - Use start command: `npm start`

### Option 2: Full Stack Platforms

#### 1. **Heroku**
```bash
# Install Heroku CLI
# Create two apps: one for frontend, one for backend
heroku create wordmash-frontend
heroku create wordmash-backend

# Deploy backend
cd server
git init
heroku git:remote -a wordmash-backend
git add .
git commit -m "Deploy backend"
git push heroku main

# Deploy frontend  
cd ..
heroku git:remote -a wordmash-frontend
git add .
git commit -m "Deploy frontend"
git push heroku main
```

#### 2. **DigitalOcean App Platform**
- Create a new app
- Connect your GitHub repository
- Configure two components:
  - Static Site (for Next.js frontend)
  - Web Service (for Node.js backend)

### Option 3: VPS/Cloud Server

#### Requirements
- Node.js 18+
- PM2 for process management
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt)

#### Setup Commands
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm nginx certbot

# Install PM2
npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd word-battle-latest

# Install and build frontend
npm install
npm run build

# Install backend dependencies
cd server
npm install

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:4567;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SOCKET_URL=wss://your-backend-domain.com
NODE_ENV=production
```

### Backend (.env)
```env
NODE_ENV=production
PORT=4567
CORS_ORIGIN=https://your-frontend-domain.com
```

## Mobile Installation

### PWA Installation
Users can install the game as an app:
1. **iOS Safari**: Tap Share → Add to Home Screen
2. **Android Chrome**: Tap menu → Add to Home Screen
3. **Desktop**: Install button in address bar

### Mobile Testing
- Test on real devices (iOS Safari, Android Chrome)
- Verify touch interactions work properly
- Check room sharing functionality
- Test network connectivity changes

## Production Checklist

### Security
- [ ] Update CORS origins in server code
- [ ] Use HTTPS/WSS for all connections
- [ ] Set proper CSP headers
- [ ] Remove debug logs

### Performance
- [ ] Enable Next.js production optimizations
- [ ] Configure CDN for static assets
- [ ] Set up proper caching headers
- [ ] Monitor memory usage on server

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor server health
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation

## Usage Instructions for Players

### Random Match
1. Enter your name and choose avatar
2. Click "🎲 Random Match"
3. Wait for another player to join
4. Start creating your story!

### Private Room
1. **Host**: Click "🏠 Create Room" → Share the room code
2. **Guest**: Click "🔑 Join Room" → Enter room code
3. Game starts automatically when both players join

### Mobile Sharing
- Room links work on any device
- Native sharing on mobile devices
- QR codes can be generated for easy sharing

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check if backend server is running
2. **Room Not Found**: Verify room code is correct (case sensitive)
3. **Mobile Not Responsive**: Clear browser cache
4. **Socket Errors**: Check CORS configuration

### Debug Mode
Add `?debug=true` to URL for additional logging.

## Support
For issues or questions, users can:
- Check browser console for error messages
- Try refreshing the page
- Use a different browser/device
- Contact support with specific error details