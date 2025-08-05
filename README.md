# 🎮 WordMash Battle – Random Word Challenge

A fun, real-time, interactive online word challenge game that blends entertainment with creativity. Perfect for Arabic-speaking users practicing English, but enjoyable for everyone!

## 🎯 Game Overview

WordMash Battle is an instant-play multiplayer word game where players create creative stories using random words. No signup required – just type your name and start playing!

### ✅ Core Gameplay
- **Instant Matching**: Get matched with a random opponent or invite friends
- **5 Random Words**: Both players receive the same set of words (easy, medium, hard difficulty)
- **10-Minute Timer**: Create a short story, paragraph, or scene using ALL words
- **Story Reveal**: Stories appear side-by-side when time's up
- **Emoji Reactions**: React with 👍 ❤️ 😂 🤯 💩 👎 to stories
- **No Winners**: Focus on creativity, laughter, and English practice!

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, Socket.IO
- **Real-time**: WebSocket connections
- **Styling**: Modern gradient design with purple + cyan themes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation & Setup

1. **Clone and install frontend dependencies:**
   ```bash
   git clone <your-repo>
   cd word-battle-latest
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

### 🏃‍♂️ Running the Game

#### Option 1: Manual Start (Recommended for Development)

1. **Start the backend server** (Terminal 1):
   ```bash
   cd server
   npm run dev
   # Server runs on http://localhost:3001
   ```

2. **Start the frontend** (Terminal 2):
   ```bash
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

3. **Open your browser** and go to `http://localhost:3000`

#### Option 2: Quick Start Scripts

Add these scripts to your main `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "server": "cd server && npm run dev",
    "start:all": "concurrently \"npm run server\" \"npm run dev\"",
    "build": "next build"
  }
}
```

Then install concurrently and run both:
```bash
npm install --save-dev concurrently
npm run start:all
```

## 📱 Mobile Testing Setup

Test the game on your phone while developing on PC:

1. **Find your PC's local IP address:**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig | grep inet
   ```

2. **Make sure your phone and PC are on the same Wi-Fi network**

3. **On your phone's browser, visit:**
   ```
   http://192.168.1.100:3000
   ```
   (Replace with your actual IP address)

4. **Join from both devices** to test real-time multiplayer!

## 🎮 Game Components

### 1. Entry Screen
- Modern purple-cyan gradient design
- Username input (no registration needed)
- "Start Playing Now" button
- Avatar selection

### 2. Waiting Room (Lobby)
- Shows connected players with avatars
- Real-time player list updates
- Game rules display
- "Looking for opponent..." status

### 3. Challenge Screen
- 5 random word cards (categorized by difficulty)
- 10-minute countdown timer
- Large text editor for story writing
- Real-time word usage tracking
- Progress bar showing words used (x/5)

### 4. Results Screen
- Side-by-side story comparison
- Word highlighting in stories
- Emoji reaction system
- Share functionality
- Fun statistics display
- "Play Again" option

## 💾 Word Data Structure

The game uses `public/words.json` with ~1000 words categorized as:

```json
[
  {
    "word": "adventure",
    "difficulty": "easy"
  },
  {
    "word": "magnificent",
    "difficulty": "medium"
  },
  {
    "word": "serendipitous",
    "difficulty": "hard"
  }
]
```

- **Easy**: Common everyday words
- **Medium**: Less common but familiar words  
- **Hard**: Rare/academic vocabulary

Each game selects: 2 easy + 2 medium + 1 hard word

## 🎨 Design Features

- **Colors**: White → Electric Blue → Sky Blue gradients
- **Typography**: Inter/Poppins fonts
- **Effects**: Smooth shadows, glows, subtle animations
- **Layout**: Rounded corners, modern card-based design
- **Responsive**: Works on mobile, tablet, and desktop
- **Interactions**: Hover effects, shake animations, color transitions

## 📡 Multiplayer Architecture

### Socket.IO Events:

**Client → Server:**
- `join-game`: Player joins with name and avatar
- `submit-story`: Player submits completed story
- `emoji-reaction`: Player reacts to opponent's story

**Server → Client:**
- `waiting-players-update`: Updates lobby player list
- `game-start`: Sends game data (words, opponent info)
- `game-results`: Sends both stories for comparison
- `opponent-finished`: Notifies when opponent completes story
- `opponent-disconnected`: Handles disconnections

### Game Flow:
1. Player joins → Added to waiting pool
2. When 2+ players → Create game room
3. Distribute same 5 words to both players
4. 10-minute timer starts
5. Players submit stories → Results screen
6. Players can react and play again

## 🚀 Deployment Options

### Local Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### Production Deployment
1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Set environment variables:**
   ```bash
   # Frontend
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
   
   # Backend
   PORT=3001
   CORS_ORIGIN=https://your-frontend-url.com
   ```

3. **Deploy separately:**
   - Frontend: Vercel, Netlify, or any static host
   - Backend: Railway, Render, Heroku, or VPS

## 🔧 Project Structure

```
word-battle-latest/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # App layout
│   │   └── page.tsx            # Main game component
│   ├── components/
│   │   ├── game/
│   │   │   ├── EntryScreen.tsx     # Name input screen
│   │   │   ├── WaitingRoom.tsx     # Lobby/matching screen
│   │   │   ├── ChallengeScreen.tsx # Story writing screen
│   │   │   └── ResultsScreen.tsx   # Story comparison screen
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   └── styles/
│       └── globals.css         # Global styles
├── server/
│   ├── index.js               # Socket.IO server
│   └── package.json           # Server dependencies
├── public/
│   └── words.json             # Word database
├── data/
│   └── words.json             # Word database (backup)
└── package.json               # Frontend dependencies
```

## 🎯 Unique Selling Points

- ✅ **Zero Friction**: No signup, email, or login required
- 🌍 **Educational**: Perfect for English language learning
- 🎨 **Creative**: Encourages storytelling and imagination
- 📱 **Cross-Platform**: Works on all devices
- ⚡ **Real-time**: Instant multiplayer experience
- 🎪 **Social**: Shareable results and emoji reactions
- 🆓 **Free**: Completely free to play

## 🎮 How to Play

1. **Enter Your Name**: Type any name (no account needed)
2. **Wait for Match**: System finds you an opponent automatically
3. **Get Your Words**: Both players receive the same 5 random words
4. **Write Your Story**: Create anything - funny, dramatic, mysterious!
5. **Submit & Compare**: Stories appear side-by-side when done
6. **React & Share**: Use emojis to react, share results
7. **Play Again**: Jump back in for another round!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or building your own games!

---

**Ready to battle with words? Let the creativity begin! 🚀✨**