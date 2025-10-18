# 🔥 Phoenix JARVIS Interface

An Iron Man-inspired holographic health & life management system that evolves from a friendly PAL to a powerful JARVIS interface.

## Features
- Arc reactor visualization with real-time biometrics
- Six planetary systems (Health, Fitness, Calendar, Goals, Finance, Legacy)
- Voice-activated AI assistant
- WebGL holographic effects
- Real-time WebSocket data streaming
- Proactive health interventions

## Quick Start
1. Clone the repository
2. Open `src/index.html` in a modern browser
3. Or deploy to Vercel/Netlify for instant hosting

## Backend Integration
Configure your Railway backend URL in `src/api.js`:
```javascript
this.baseURL = 'https://your-backend.railway.app/api'
```

## Technologies
- Vanilla JavaScript (no framework dependencies)
- WebGL shaders for holographic effects
- WebSocket for real-time communication
- Web Speech API for voice control
```

### **.gitignore**
```
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local

# Build
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output

# Cache
.cache/
.parcel-cache/
```

### **.env.example**
```
# Backend Configuration
BACKEND_URL=https://pal-backend-production.up.railway.app
WS_URL=wss://pal-backend-production.up.railway.app/ws

# API Keys (optional for enhanced features)
OPENAI_API_KEY=your_openai_key_here
GOOGLE_MAPS_API_KEY=your_maps_key_here

# Demo Credentials
DEMO_EMAIL=john@client.com
DEMO_PASSWORD=password123