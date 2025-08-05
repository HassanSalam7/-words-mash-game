# 🌐 Remote Play Setup Guide

## Quick Setup for Playing with Friends Online

### Method 1: Using ngrok (Recommended)

1. **Install ngrok**: Download from https://ngrok.com/download or run:
   ```bash
   npm install -g ngrok
   ```

2. **Start your game servers** (2 terminals):
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd server && node index.js
   ```

3. **Create tunnels** (2 more terminals):
   ```bash
   # Terminal 3: Frontend tunnel
   ngrok http 3000
   
   # Terminal 4: Backend tunnel  
   ngrok http 4569
   ```

4. **Update configuration**:
   - Copy the backend ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Edit `.env.local` file:
     ```
     NEXT_PUBLIC_SOCKET_URL=https://your-backend-ngrok-url.ngrok.io
     ```

5. **Share with friend**:
   - Send the **frontend ngrok URL** to your friend
   - They can access it from anywhere in the world!

### Method 2: Using Localtunnel (Alternative)

```bash
# Install
npm install -g localtunnel

# Start servers, then create tunnels:
lt --port 3000 --subdomain your-game-frontend
lt --port 4569 --subdomain your-game-backend
```

### Method 3: Deploy to Cloud (Production)

Deploy to Vercel/Netlify for frontend and Railway/Heroku for backend.

## 🎮 How to Play:

1. **Host**: Set up tunnels and share the frontend URL
2. **Friend**: Visit the shared URL
3. **Both**: Use "Random Match" or create/join private rooms
4. **Enjoy**: Play translation challenges or story writing together!

## 🔧 Troubleshooting:

- **Connection issues**: Make sure both tunnel URLs are working
- **Game not starting**: Check that backend tunnel is properly configured
- **Slow performance**: Try using a different ngrok region

## 💡 Tips:

- Free ngrok sessions expire after 2 hours
- Use private rooms for better matching with specific friends
- Test the setup locally first before sharing with friends