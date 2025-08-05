# WordMash Battle - Deployment Guide

This guide will help you deploy the WordMash Battle game to GitHub, Railway (backend), and Vercel (frontend).

## 📋 Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Git installed locally

## 🚀 Step 1: GitHub Repository Setup

### 1.1 Initialize Git Repository
```bash
cd word-battle-latest
git init
git add .
git commit -m "Initial commit: WordMash Battle game"
```

### 1.2 Use Your Existing Repository
You already have a repository ready at: `https://github.com/HassanSalam7/-words-mash-game`

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/HassanSalam7/-words-mash-game.git
git branch -M main
git push -u origin main
```

## 🚂 Step 2: Backend Deployment (Railway)

### 2.1 Deploy Server to Railway
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `-words-mash-game` repository
4. Railway will detect both frontend and backend - choose the backend

### 2.2 Configure Railway Environment
1. In Railway dashboard, go to your project
2. Click on "Variables" tab
3. Add these environment variables:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-app-name.vercel.app
   ```
   (You'll update FRONTEND_URL after deploying to Vercel)

### 2.3 Configure Build Settings
1. In Railway, go to "Settings" tab
2. Set the following:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2.4 Get Your Railway URL
After deployment, Railway will provide a URL like:
`https://your-project-name.up.railway.app`

Copy this URL - you'll need it for the frontend.

## ☁️ Step 3: Frontend Deployment (Vercel)

### 3.1 Deploy to Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository `-words-mash-game`
4. Vercel will auto-detect it's a Next.js project

### 3.2 Configure Environment Variables
1. In Vercel deployment settings, add environment variables:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-project-name.up.railway.app
   NODE_ENV=production
   ```
   (Replace with your actual Railway URL from Step 2.4)

### 3.3 Deploy
Click "Deploy" and wait for completion.

## 🔄 Step 4: Update CORS Settings

### 4.1 Update Railway Environment
1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` variable with your actual Vercel URL:
   ```
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

### 4.2 Redeploy if Needed
Railway should automatically redeploy with the new environment variable.

## ✅ Step 5: Verification

### 5.1 Test Your Deployment
1. Visit your Vercel URL
2. Try creating a game
3. Test with multiple browser tabs/devices
4. Verify real-time features work

### 5.2 Health Check
Visit your Railway URL + `/health` to verify backend status:
`https://your-project-name.up.railway.app/health`

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
- Ensure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check that both HTTP and HTTPS are handled correctly

#### Connection Issues
- Verify `NEXT_PUBLIC_SOCKET_URL` in Vercel points to your Railway URL
- Check Railway logs for connection errors

#### Build Failures
- Ensure all dependencies are in `package.json`
- Check that build commands are correct in Railway settings

### Debug Steps
1. Check Railway logs for backend errors
2. Check Vercel function logs for frontend errors
3. Use browser developer tools to check network requests
4. Verify environment variables are set correctly

## 📁 File Structure
```
-words-mash-game/
├── server/                 # Backend (Railway)
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment template
├── src/                   # Frontend (Vercel)
├── public/               # Static assets
├── package.json          # Frontend dependencies
├── vercel.json          # Vercel configuration
└── .env.example         # Frontend environment template
```

## 🌐 URLs After Deployment
- **Frontend**: https://your-app-name.vercel.app
- **Backend**: https://your-project-name.up.railway.app
- **GitHub**: https://github.com/HassanSalam7/-words-mash-game

## 🎮 Features Supported
- ✅ Real-time multiplayer gameplay
- ✅ Private rooms with codes
- ✅ Avatar upload and display
- ✅ Translation challenges
- ✅ Story writing challenges
- ✅ Mobile responsive design
- ✅ Cross-platform compatibility

## 🔄 Future Updates

To update your deployment:
1. Make changes locally
2. Commit and push to GitHub
3. Vercel will auto-deploy frontend changes
4. Railway will auto-deploy backend changes

Both platforms support automatic deployments from your main branch.

---

**Need Help?**
- Railway Documentation: https://docs.railway.app
- Vercel Documentation: https://vercel.com/docs
- Socket.IO Documentation: https://socket.io/docs/