# PHOENIX AI - Complete Implementation Documentation

**Last Updated:** November 9, 2025
**Version:** 1.0
**Author:** Phoenix Development Team

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Architecture](#2-core-architecture)
3. [Brain Structure (Consciousness & Orchestration)](#3-brain-structure)
4. [Voice System](#4-voice-system)
5. [Widget System](#5-widget-system)
6. [Mode Toggle (Voice vs Manual)](#6-mode-toggle)
7. [Smart Planet Pages](#7-smart-planet-pages)
8. [Life Management Integration](#8-life-management-integration)
9. [Authentication & API](#9-authentication--api)
10. [File Reference](#10-file-reference)

---

## 1. System Overview

### What is Phoenix?

Phoenix is an AI-powered life management system that combines:
- **Real-time health tracking** (biometrics, recovery, sleep)
- **Fitness & nutrition planning** (AI workout generation)
- **Calendar intelligence** (energy-optimized scheduling)
- **Goal & habit tracking** (OKRs, streak monitoring)
- **Financial intelligence** (net worth, budgets)
- **Legacy planning** (mortality awareness, long-term vision)
- **Proactive AI companion** (pattern detection, therapeutic insights)

### Philosophy

Phoenix doesn't just track your life - it **orchestrates** it. Using cross-domain pattern detection, Phoenix identifies correlations between health, productivity, relationships, and finances that humans miss. It's JARVIS for your life.

### Technology Stack

**Frontend:**
- Pure JavaScript (ES6+)
- HTML5 with responsive CSS
- Web Speech API (voice recognition)
- Speech Synthesis API (TTS)
- SVG animations
- LocalStorage for state persistence

**Backend:**
- Node.js + Express
- MongoDB Atlas (database)
- JWT authentication
- Pattern detection engine
- Chaos theory algorithms (workout generation)

**Deployment:**
- **Frontend:** Vercel (https://phoenix-fe-indol.vercel.app)
- **Backend:** Railway (https://pal-backend-production.up.railway.app)
- **Auto-deploy:** Push to `main` branch

**External Integrations:**
- Oura Ring, WHOOP, Apple Health, Garmin, Fitbit (wearables)
- Plaid (banking)
- Google Calendar, Apple Calendar (scheduling)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │ Planet Pages │  │  Voice Orb   │         │
│  │   (Central)  │  │  (7 planets) │  │   (Always)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR LAYER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Phoenix Orchestrator (67-step initialization)          │  │
│  │  - Authentication      - API Client    - User Profile   │  │
│  │  - Planet Data Loader  - AI Context    - Cache Manager  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     AI INTELLIGENCE LAYER                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  JARVIS     │  │ Consciousness│  │  Pattern Detection    │ │
│  │  Engine     │  │   Display    │  │      Engine           │ │
│  └─────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Mercury│ Venus │ Earth │ Mars  │Jupiter│Saturn│ Phoenix│    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                              │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │  MongoDB Atlas   │  │  External APIs (Oura, Plaid, etc.) │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architecture

### File Structure

```
phoenix-fe/
├── index.html              # Login page
├── dashboard.html          # Main dashboard (post-login)
├── onboarding.html         # Registration flow
├── mercury.html            # Health & Recovery planet
├── venus.html              # Fitness & Training planet
├── earth.html              # Calendar & Scheduling planet
├── mars.html               # Goals & Habits planet
├── jupiter.html            # Finance planet
├── saturn.html             # Legacy Planning planet
│
├── src/
│   ├── orchestrator.js     # 🧠 System orchestrator (26,030 lines)
│   ├── jarvis.js           # 💬 AI conversation engine
│   ├── api.js              # 🌐 API client (307 endpoints)
│   ├── consciousness-display.js  # 👁️ Proactive insights UI
│   ├── phoenix-orb.js      # 🎙️ Voice interaction orb
│   ├── wearables.js        # ⌚ Device connector
│   ├── config.js           # ⚙️ Configuration
│   └── [planet-specific].js # 🪐 Planet dashboards
│
├── widget-manager.js       # 📊 Dynamic UI widgets
├── voice-controller.js     # 🎤 Voice/Manual mode toggle
├── phoenix-voice-commands.js # 🗣️ Natural language router
├── wake-word-detector.js   # 👂 "Hey Phoenix" detection
│
├── PHOENIX-REFERENCE.md    # Feature reference
├── STARTUP.md              # Deployment & architecture
└── PHOENIX-IMPLEMENTATION.md  # This document
```

### Initialization Flow

When a user loads Phoenix, the following happens:

```
1. index.html loads
2. User logs in → JWT token received
3. Token passed to dashboard.html via URL hash
4. dashboard.html loads orchestrator.js
5. Orchestrator runs 67-step initialization sequence:
   ┌─ Step 1-3: Authenticate
   ├─ Step 4: Initialize API client
   ├─ Step 5-6: Load user profile
   ├─ Step 7-13: Load planet data (PARALLEL)
   ├─ Step 14-16: Initialize AI context
   ├─ Step 17-18: Initialize Butler
   ├─ Step 19-40: Restore cache (22 endpoints)
   ├─ Step 41: Start health monitoring
   ├─ Step 42: Setup network reconnection
   ├─ Step 43: Restore UI state
   └─ Step 44: Dispatch 'phoenix:ready' event
6. Dashboard visible (300-500ms total)
7. Consciousness display activates
8. Voice orb ready for commands
```

**File:** `src/orchestrator.js` (Lines 1-600)

---

## 3. Brain Structure (Consciousness & Orchestration)

### The Orchestrator

The orchestrator is Phoenix's "central nervous system" - it coordinates all subsystems, ensures proper initialization order, and maintains global state.

**File:** `src/orchestrator.js` (26,030 lines)

#### Key Responsibilities

1. **Authentication Management**
   - Validates JWT tokens before every API call
   - Auto-refreshes expired tokens
   - Falls back to guest mode on public routes
   - Stores token in localStorage

2. **Parallel Data Loading**
   - Loads all 7 planet systems simultaneously
   - Reduces init time from ~3-4s to <500ms
   - Handles failures gracefully (continues if some planets fail)

3. **Cache Management**
   - Loads 22 cached endpoints on startup
   - Populates widgets instantly (no loading spinners)
   - Refreshes cache every 5 minutes

4. **Health Monitoring**
   - Checks system health every 30 seconds
   - Auto-reconnects on network failure
   - Logs errors for debugging

5. **Event Coordination**
   - Dispatches `phoenix:ready` when fully initialized
   - Listens for `phoenix:reload` to restart
   - Handles `visibilitychange` for battery optimization

#### Example: Loading Planet Data

```javascript
// src/orchestrator.js (Lines 200-250)
async loadPlanetData() {
    console.log('🔌 Checking planetary connections in parallel...');

    const planetPromises = [
        this.api.mercury.getRecovery(),      // Mercury
        this.api.venus.getActiveWorkout(),   // Venus
        this.api.earth.getCalendarEvents(),  // Earth
        this.api.mars.getGoals(),            // Mars
        this.api.jupiter.getBudgets(),       // Jupiter
        this.api.saturn.getQuarterlyReviews(), // Saturn
        this.api.phoenix.getPatterns()       // Phoenix (AI patterns)
    ];

    const results = await Promise.allSettled(planetPromises);

    // Store results even if some failed
    this.planetData = {
        mercury: results[0].status === 'fulfilled' ? results[0].value : null,
        venus: results[1].status === 'fulfilled' ? results[1].value : null,
        // ... etc
    };

    console.log('✅ Parallel connection check completed in < 1s (vs 3-4s sequential)');
}
```

### Consciousness Display

The consciousness display is Phoenix's "thoughts made visible" - it shows proactive insights without user prompting.

**File:** `src/consciousness-display.js` (513 lines)

#### Features

1. **Mood Indicator**
   - `calm` (blue glow) - Normal state
   - `concerned` (orange glow) - Detected issue
   - `excited` (green glow) - Positive pattern
   - `analytical` (purple glow) - Processing complex data

2. **Proactive Insights**
   - Appears automatically based on backend orchestration
   - Example: "I noticed your HRV correlates strongly with 7+ hours sleep"
   - Example: "Your recovery has been declining. Want to talk about it?"

3. **Auto-Orchestration Triggers**
   - Every 5 minutes automatically
   - When recovery score changes ±20%
   - When HRV changes >15%
   - User navigates to different planet
   - Voice query processed

#### Example: Showing an Insight

```javascript
// src/consciousness-display.js (Lines 100-150)
show(text, mood = 'calm', duration = 8000) {
    const panel = document.getElementById('consciousness-panel');
    const thoughtText = document.getElementById('consciousness-thought');
    const moodIndicator = document.getElementById('consciousness-mood');

    // Update text
    thoughtText.textContent = text;

    // Update mood (changes glow color)
    moodIndicator.className = `mood-${mood}`;

    // Slide in from right
    panel.style.right = '20px';

    // Auto-hide after duration
    setTimeout(() => {
        panel.style.right = '-400px';
    }, duration);
}

// Usage from orchestrator:
consciousnessDisplay.show(
    "I noticed your sleep quality drops on days you skip breakfast",
    'analytical',
    10000
);
```

### Pattern Detection Engine

The pattern detection engine runs on the backend and analyzes data from all 9 domains simultaneously.

**Backend File:** `pal-backend/Src/services/phoenix/patternDetectionEngine.js`

#### How It Works

1. **Data Collection**
   - Gathers last 30 days of data from all domains
   - Mercury: HRV, recovery, sleep, heart rate
   - Venus: Workout frequency, intensity
   - Earth: Calendar stress, meeting density
   - Mars: Goal completion rate
   - Jupiter: Financial stress, spending patterns
   - Saturn: Quarterly review scores

2. **Pattern Matching**
   - Each pattern has conditions with operators:
     - `DROPS_FROM_BASELINE` - Value dropped >X% from personal average
     - `INCREASES_FROM_BASELINE` - Value increased >X%
     - `SPIKES_FROM_BASELINE` - Sudden >X% increase
     - `BELOW_THRESHOLD` - Value < X
     - `ABOVE_THRESHOLD` - Value > X

3. **Pattern Examples**

```javascript
// Pattern R001: Sudden Relationship Ending
{
  id: 'R001',
  name: 'Sudden Relationship Ending',
  conditions: [
    { behavior: 'hrv', operator: 'DROPS_FROM_BASELINE', threshold: 20 },
    { behavior: 'sleepDuration', operator: 'DROPS_FROM_BASELINE', threshold: 18 },
    { behavior: 'restingHeartRate', operator: 'INCREASES_FROM_BASELINE', threshold: 12 }
  ],
  message: "Your body's been through something intense. How are you holding up?",
  recommendedAction: "Talk to someone, prioritize sleep, light exercise"
}

// Pattern H007: Overtraining Syndrome
{
  id: 'H007',
  name: 'Overtraining Syndrome',
  conditions: [
    { behavior: 'hrv', operator: 'DROPS_FROM_BASELINE', threshold: 15 },
    { behavior: 'recovery', operator: 'BELOW_THRESHOLD', threshold: 60 },
    { behavior: 'workoutFrequency', operator: 'ABOVE_THRESHOLD', threshold: 6 }
  ],
  message: "Your body is screaming for rest. You're overtraining.",
  recommendedAction: "Take 2-3 rest days, reduce intensity"
}
```

4. **Confidence Scoring**
   - Each pattern match gets a confidence score 0-100%
   - Based on:
     - How many conditions met (3/3 = higher confidence)
     - How far from baseline (20% drop > 10% drop)
     - Historical accuracy (has this pattern been right before?)

5. **Surfacing to User**
   - High confidence (>70%) → Consciousness display shows insight
   - Medium confidence (40-70%) → Logged silently, shown if user asks
   - Low confidence (<40%) → Ignored

---

## 4. Voice System

### Architecture

Phoenix's voice system has 3 layers:

1. **Wake Word Detection** (`wake-word-detector.js`)
2. **Voice Orb UI** (`src/phoenix-orb.js`)
3. **Natural Language Router** (`phoenix-voice-commands.js`)

### Wake Word Detection

**File:** `wake-word-detector.js`

Listens for "Hey Phoenix" continuously (in voice mode only).

```javascript
// wake-word-detector.js (Lines 50-100)
class WakeWordDetector {
    constructor() {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;  // Never stops listening
        this.recognition.interimResults = false;
    }

    start() {
        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();

            if (transcript.includes('hey phoenix') || transcript.includes('ok phoenix')) {
                // Wake word detected!
                this.onWakeWord();
            }
        };

        this.recognition.start();
    }

    onWakeWord() {
        // Activate voice orb
        window.phoenixOrb.startVoiceFromOrb();
    }
}
```

**Battery Optimization:**
- Wake word pauses when page is hidden (user switched tabs)
- Disabled entirely in manual mode
- Uses native speech recognition (no cloud processing)

### Voice Orb

**File:** `src/phoenix-orb.js` (500+ lines)

The voice orb is the visual interface for voice interaction.

#### States

1. **Idle** - Gentle pulse, waiting for wake word
2. **Listening** - Bright glow, capturing voice input
3. **Processing** - Spin animation, sending to backend
4. **Speaking** - Pulsing to speech rhythm
5. **Error** - Red flash

#### Voice Command Flow

```
1. User clicks orb OR wake word detected
   → Orb state: idle → listening

2. Speech recognition captures text
   → Orb state: listening → processing

3. Send to backend: POST /api/phoenix/universal
   Body: { query: "How's my recovery?" }

4. Backend returns:
   {
     response: "Your recovery is 87%. Excellent!",
     navigation: { target: 'mercury', action: 'spotlight_metric', metric: 'recovery' },
     data: { recoveryScore: 87, trend: 'improving' }
   }

5. Frontend:
   - Phoenix speaks response (TTS)
   - Navigates to mercury.html
   - Opens recovery spotlight modal
   → Orb state: processing → speaking → idle
```

#### Example: Processing Voice Command

```javascript
// src/phoenix-orb.js (Lines 200-300)
async processCommand(transcript) {
    this.setState('processing');

    try {
        // Send to universal NL router
        const response = await fetch('https://pal-backend-production.up.railway.app/api/phoenix/universal', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('phoenix_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: transcript })
        });

        const data = await response.json();

        // Speak response
        this.speak(data.response);

        // Navigate if needed
        if (data.navigation) {
            this.navigate(data.navigation);
        }

        // Update consciousness display
        if (data.insight) {
            consciousnessDisplay.show(data.insight, 'analytical');
        }

    } catch (error) {
        this.speak("Sorry, I couldn't process that. Can you try again?");
        this.setState('error');
    }
}
```

### Natural Language Router

**File:** `phoenix-voice-commands.js` (700+ lines)

Routes natural language to specific actions.

#### Command Categories

1. **Navigation**
   - "Show me Mercury" → Navigate to mercury.html
   - "Go to my calendar" → Navigate to earth.html
   - "Open Jupiter" → Navigate to jupiter.html

2. **Data Queries**
   - "How's my recovery?" → Fetch recovery data, spotlight metric
   - "What's my HRV?" → Fetch HRV data, open modal
   - "Show my goals" → Navigate to Mars, show goals tab

3. **Actions**
   - "Log a workout" → Open Venus workout modal
   - "Add an event" → Open Earth calendar modal
   - "Check my net worth" → Navigate to Jupiter overview

4. **Mode Switching**
   - "Switch to manual mode" → Call switchToManualMode()
   - "Enable voice mode" → Call switchToVoiceMode()

#### Example: Handling "How's my recovery?"

```javascript
// phoenix-voice-commands.js (Lines 200-250)
async handleCommand(text) {
    const lower = text.toLowerCase();

    // Recovery query
    if (lower.includes('recovery') && (lower.includes('how') || lower.includes('what'))) {
        // Navigate to Mercury
        window.location.href = 'mercury.html';

        // Set spotlight metric for when page loads
        sessionStorage.setItem('phoenix_spotlight_metric', 'recovery_score');

        // Speak response
        const recovery = await this.api.mercury.getRecovery();
        this.speak(`Your recovery is ${recovery.score}%. ${recovery.status}!`);

        return;
    }

    // ... more command handlers
}
```

---

## 5. Widget System

### Overview

Phoenix uses a JARVIS-style dynamic widget system. Widgets appear, resize, and reorder based on context and AI orchestration.

**File:** `widget-manager.js` (430 lines)

### Widget Types

1. **health-recovery** - Mercury recovery score ring
2. **health-hrv** - HRV trend chart
3. **health-sleep** - Sleep stages breakdown
4. **finance-overview** - Net worth summary
5. **finance-spending** - Spending by category
6. **calendar-today** - Today's events list
7. **goals-progress** - OKR progress rings
8. **workout-plan** - Today's workout
9. **nutrition-stats** - Macro rings (protein/carbs/fat)
10. **legacy-countdown** - Weeks remaining display

### Widget Lifecycle

```
1. JARVIS orchestration determines which widgets to show
2. Widget Manager receives layout instructions
3. Creates widget HTML elements
4. Fetches data from API
5. Renders widget with data
6. Positions widget based on priority
7. Animates into view
```

### Priority System

Widgets have:
- **Priority:** 0-10 (0 = highest, shows at top)
- **Urgency:** high/medium/low (affects border color + glow)
- **Size:** small/medium/large

### Example: Creating Recovery Widget

```javascript
// widget-manager.js (Lines 100-200)
createWidget(type, data, config = {}) {
    const widget = document.createElement('div');
    widget.className = `phoenix-widget widget-${config.size || 'medium'} urgency-${config.urgency || 'medium'}`;
    widget.dataset.priority = config.priority || 5;

    if (type === 'health-recovery') {
        widget.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">Recovery</span>
                <span class="widget-value">${data.score}%</span>
            </div>
            <div class="widget-body">
                <svg width="200" height="200">
                    <circle cx="100" cy="100" r="80"
                            stroke="${this.getRecoveryColor(data.score)}"
                            stroke-width="12"
                            fill="none"
                            stroke-dasharray="${(data.score / 100) * 502} 502" />
                </svg>
                <div class="widget-status">${data.status}</div>
            </div>
        `;
    }

    // Add click handler to open detail modal
    widget.addEventListener('click', () => {
        window.location.href = `mercury.html?spotlight=recovery`;
    });

    return widget;
}
```

### Orchestration Example

When backend returns orchestration layout:

```javascript
// Response from POST /api/phoenix/orchestrate
{
    layout: {
        widgets: [
            { id: 'health-recovery', priority: 0, urgency: 'high', size: 'large' },
            { id: 'workout-plan', priority: 1, urgency: 'medium', size: 'medium' },
            { id: 'calendar-today', priority: 2, urgency: 'low', size: 'small' }
        ],
        hidden: ['finance-spending'],
        dimmed: ['goals-progress']
    }
}

// Widget Manager applies layout:
widgetManager.displayFromOrchestration(response.layout);
```

---

## 6. Mode Toggle (Voice vs Manual)

### Overview

Phoenix has two interaction modes:
- **Voice Mode:** Always listening for "Hey Phoenix", optimized for hands-free
- **Manual Mode:** Button/menu-based, battery-optimized

**File:** `voice-controller.js` (286 lines)

### Voice Mode

**Characteristics:**
- Wake word detection active
- Orb pulses gently (always visible)
- Keyboard shortcuts enabled (V/M keys)
- Body attribute: `data-mode="voice"`

**UI Changes:**
- Voice button highlighted (blue glow)
- Manual button dimmed
- Orb positioned prominently
- Tooltips say "Say 'Hey Phoenix' to interact"

**Audio Feedback:**
- Ascending tone (600Hz → 1200Hz) when activated
- Notification: "Voice Mode Active - Say 'Hey Phoenix' to interact"

### Manual Mode

**Characteristics:**
- Wake word detection disabled (saves battery)
- Orb still clickable but not pulsing
- Focus on buttons/menus
- Body attribute: `data-mode="manual"`

**UI Changes:**
- Manual button highlighted (blue glow)
- Voice button dimmed
- Buttons/menus more prominent
- Tooltips say "Click buttons to interact"

**Audio Feedback:**
- Descending tone (1200Hz → 600Hz) when activated
- Notification: "Manual Mode Active - Use buttons and menus"

### Implementation

```javascript
// voice-controller.js (Lines 122-146)
function switchToVoiceMode() {
    // Update body attribute
    document.body.dataset.mode = 'voice';

    // Save preference
    localStorage.setItem('phoenix_ui_mode', 'voice');

    // Play ascending audio transition
    playTone(600, 1200, 300);  // 600Hz → 1200Hz over 300ms

    // Enable wake word
    if (window.wakeWordDetector) {
        window.wakeWordDetector.start();
    }

    // Show notification
    showNotification('Voice Mode Active - Say "Hey Phoenix" to interact', 'success');

    // Update button states
    document.getElementById('voice-mode-btn').classList.add('active');
    document.getElementById('manual-mode-btn').classList.remove('active');
}

function switchToManualMode() {
    document.body.dataset.mode = 'manual';
    localStorage.setItem('phoenix_ui_mode', 'manual');
    playTone(1200, 600, 300);  // 1200Hz → 600Hz

    // Disable wake word to save battery
    if (window.wakeWordDetector) {
        window.wakeWordDetector.stop();
    }

    showNotification('Manual Mode Active - Use buttons and menus', 'success');

    document.getElementById('manual-mode-btn').classList.add('active');
    document.getElementById('voice-mode-btn').classList.remove('active');
}
```

### Keyboard Shortcuts

```javascript
// voice-controller.js (Lines 200-220)
document.addEventListener('keydown', (e) => {
    // Don't trigger if typing in input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    if (e.key === 'v' || e.key === 'V') {
        switchToVoiceMode();
    }

    if (e.key === 'm' || e.key === 'M') {
        switchToManualMode();
    }
});
```

### Battery Optimization

```javascript
// voice-controller.js (Lines 257-277)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page hidden (user switched tabs)
        // Pause wake word to save battery
        if (window.wakeWordDetector && document.body.dataset.mode === 'voice') {
            window.wakeWordDetector.pause();
            console.log('⏸️ Wake word paused (page hidden)');
        }
    } else {
        // Page visible again
        // Resume wake word
        if (window.wakeWordDetector && document.body.dataset.mode === 'voice') {
            window.wakeWordDetector.resume();
            console.log('▶️ Wake word resumed (page visible)');
        }
    }
});
```

---

## 7. Smart Planet Pages

Each planet is a specialized dashboard for a life domain. All planets follow a consistent architecture:

1. **Hero Section** - Large key metric (recovery ring, net worth, etc.)
2. **Quick Actions** - 4 common actions in a row
3. **Tabs** - Different views of the data
4. **Modals** - Detail views and data entry

### 7.1 Mercury (Health & Recovery)

**File:** `mercury.html` (1,703 lines)
**JavaScript:** `src/mercury-dashboard.js`

**Purpose:** Real-time biometric tracking, recovery optimization, health intelligence

#### Key Features

**1. Recovery Score Ring**

Large SVG ring showing 0-100 recovery score.

```html
<!-- mercury.html (Lines 897-915) -->
<div id="recovery-hero">
    <div class="recovery-ring-container">
        <svg width="300" height="300">
            <circle cx="150" cy="150" r="120"
                    stroke="#1a1a1a"
                    stroke-width="20"
                    fill="none" />
            <circle id="recovery-ring-progress"
                    cx="150" cy="150" r="120"
                    stroke="#00d9ff"
                    stroke-width="20"
                    fill="none"
                    stroke-dasharray="754 754"
                    transform="rotate(-90 150 150)" />
        </svg>
        <div class="recovery-score" id="recovery-score-text">87</div>
        <div class="recovery-status">Excellent</div>
    </div>
</div>
```

**Animation:**

```javascript
// src/mercury-dashboard.js
function renderRecoveryRing(score) {
    const circumference = 2 * Math.PI * 120;  // 754
    const offset = circumference - (score / 100) * circumference;

    const ring = document.getElementById('recovery-ring-progress');
    ring.style.strokeDashoffset = offset;

    // Color based on score
    if (score >= 80) ring.setAttribute('stroke', '#00ff00');      // Green
    else if (score >= 60) ring.setAttribute('stroke', '#00d9ff'); // Blue
    else if (score >= 40) ring.setAttribute('stroke', '#ffa500'); // Orange
    else ring.setAttribute('stroke', '#ff0000');                  // Red
}
```

**2. Recovery Breakdown**

Shows contributing factors:

```html
<!-- mercury.html (Lines 917-930) -->
<div class="recovery-breakdown">
    <div class="factor">
        <span class="factor-label">Sleep Contribution</span>
        <div class="factor-bar">
            <div class="factor-fill" style="width: 85%"></div>
        </div>
        <span class="factor-value">85%</span>
    </div>
    <div class="factor">
        <span class="factor-label">HRV Contribution</span>
        <div class="factor-bar">
            <div class="factor-fill" style="width: 72%"></div>
        </div>
        <span class="factor-value">72%</span>
    </div>
    <div class="factor">
        <span class="factor-label">RHR Contribution</span>
        <div class="factor-bar">
            <div class="factor-fill" style="width: 90%"></div>
        </div>
        <span class="factor-value">90%</span>
    </div>
</div>
```

**3. Tabs**

- **Overview:** Recovery, HRV, Sleep summary cards
- **Sleep:** Sleep stages (deep/light/REM/awake), efficiency
- **HRV & Stress:** HRV trends, stress triggers
- **Body Composition:** Weight, body fat %, muscle mass, BMI
- **Correlations:** AI-detected patterns

**4. Wearables Integration**

```html
<!-- mercury.html (Lines 1153-1161) -->
<div class="wearables-section">
    <div class="wearable" data-device="oura">
        <img src="assets/oura-icon.png" />
        <span class="status">Connected</span>
        <span class="last-sync">Last sync: 2 min ago</span>
    </div>
    <div class="wearable" data-device="whoop">
        <img src="assets/whoop-icon.png" />
        <span class="status">Syncing...</span>
    </div>
</div>
```

**5. Metric Spotlight Modal**

Voice-activated deep dives: "Show me my HRV"

```javascript
// src/mercury-dashboard.js
function spotlightMetric(metric, title) {
    // Open modal
    const modal = document.getElementById('metric-spotlight-modal');
    modal.style.display = 'block';

    // Set title
    document.getElementById('spotlight-title').textContent = title;

    // Fetch data
    const endpoint = {
        'recovery_score': '/api/mercury/recovery/latest',
        'hrv': '/api/mercury/biometrics/hrv',
        'sleep_score': '/api/mercury/sleep/analysis',
        'heart_rate': '/api/mercury/biometrics/heart-rate'
    }[metric];

    fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        // Display current value
        document.getElementById('spotlight-value').textContent = data.current;

        // Display trend (improving/declining/stable)
        document.getElementById('spotlight-trend').textContent = data.trend;

        // Render 7-day history chart
        renderSpotlightChart(data.history);
    });
}
```

#### Backend Endpoints

- `GET /api/mercury/recovery/latest` - Current recovery score
- `GET /api/mercury/biometrics/hrv?days=30` - HRV history
- `GET /api/mercury/sleep/analysis` - Sleep breakdown
- `GET /api/mercury/devices` - Connected wearables
- `POST /api/wearables/sync/oura` - Trigger Oura sync

---

### 7.2 Venus (Fitness & Training)

**File:** `venus.html` (1,031 lines)
**JavaScript:** `src/venus-app.js`

**Purpose:** AI-powered workout generation, nutrition tracking, progress analytics

#### Key Features

**1. Quick Actions**

```html
<!-- venus.html (Lines 677-706) -->
<div class="quick-actions">
    <button onclick="quickStartWorkout()">
        <span class="icon">🏋️</span>
        <span class="label">Quick Start</span>
    </button>
    <button onclick="continueLastWorkout()">
        <span class="icon">▶️</span>
        <span class="label">Continue Last</span>
    </button>
    <button onclick="scanFood()">
        <span class="icon">📷</span>
        <span class="label">Scan Food</span>
    </button>
    <button onclick="viewProgress()">
        <span class="icon">📊</span>
        <span class="label">View Progress</span>
    </button>
</div>
```

**2. Tabs**

- **Workouts:** Recent list, personal records (PR grid)
- **Nutrition:** Macro goals, meal log
- **Progress:** Strength charts, body metrics
- **Exercise Library:** Searchable database
- **Quantum:** Chaos theory workout generator

**3. Workout Logging Modal**

```html
<!-- venus.html (Lines 851-878) -->
<div id="workout-modal" class="modal">
    <div class="modal-content">
        <h3>Log Workout</h3>
        <input type="text" id="workout-name" placeholder="Workout name" />
        <select id="workout-type">
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="hiit">HIIT</option>
            <option value="yoga">Yoga</option>
            <option value="sports">Sports</option>
        </select>
        <input type="number" id="workout-duration" placeholder="Duration (min)" />
        <button onclick="saveWorkout()">Save</button>
    </div>
</div>
```

**4. Quantum Workout Generator**

Uses chaos theory for intelligent variation (prevents plateaus).

```javascript
// src/venus-app.js
async function generateQuantumWorkout() {
    // Call backend quantum algorithm
    const response = await fetch('/api/venus/workout/generate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'strength',
            focus: 'push',  // or 'pull', 'legs', 'full-body'
            duration: 60
        })
    });

    const workout = await response.json();

    // Display workout
    displayWorkout(workout);
    /*
    Example output:
    {
        name: "Push Workout - Chaos Protocol",
        exercises: [
            { name: "Bench Press", sets: 4, reps: "8-12", rest: 90 },
            { name: "Incline Dumbbell Press", sets: 4, reps: "10-15", rest: 75 },
            { name: "Cable Flyes", sets: 3, reps: "12-15", rest: 60 },
            { name: "Tricep Dips", sets: 3, reps: "AMRAP", rest: 60 }
        ]
    }
    */
}
```

**5. Nutrition Tracking**

```html
<!-- venus.html (Lines 881-909) -->
<div id="nutrition-modal" class="modal">
    <h3>Log Meal</h3>
    <input type="text" id="meal-name" placeholder="Meal name" />
    <input type="number" id="meal-calories" placeholder="Calories" />
    <div class="macros">
        <input type="number" id="meal-protein" placeholder="Protein (g)" />
        <input type="number" id="meal-carbs" placeholder="Carbs (g)" />
        <input type="number" id="meal-fat" placeholder="Fat (g)" />
    </div>
    <button onclick="saveMeal()">Save</button>
</div>
```

**Macro Rings Display:**

```javascript
// src/venus-app.js
function renderMacroRings(consumed, goals) {
    const macros = ['protein', 'carbs', 'fat'];

    macros.forEach(macro => {
        const percentage = (consumed[macro] / goals[macro]) * 100;
        const ring = document.getElementById(`${macro}-ring`);

        // Calculate stroke-dashoffset
        const circumference = 2 * Math.PI * 60;
        const offset = circumference - (percentage / 100) * circumference;
        ring.style.strokeDashoffset = offset;

        // Update label
        document.getElementById(`${macro}-label`).textContent =
            `${consumed[macro]}g / ${goals[macro]}g`;
    });
}
```

#### Backend Endpoints

- `POST /api/venus/workout/generate` - Generate AI workout
- `GET /api/venus/workouts/history?limit=10` - Recent workouts
- `POST /api/venus/workouts` - Log workout
- `POST /api/venus/nutrition/meals` - Log meal
- `GET /api/venus/progress/strength?exercise=bench-press` - Strength progress

---

### 7.3 Earth (Calendar & Scheduling)

**File:** `earth.html`
**JavaScript:** `src/earth-app.js`

**Purpose:** Energy-optimized scheduling, calendar intelligence, time blocking

#### Key Features

**1. Energy Curve Hero**

Displays real-time energy forecast.

```html
<!-- earth.html (Lines 37-74) -->
<div id="energy-curve-hero">
    <h2>Your Energy Today</h2>
    <div class="energy-stats">
        <div class="stat">
            <span class="label">Current</span>
            <span class="value" id="energy-current">72%</span>
        </div>
        <div class="stat">
            <span class="label">Peak Window</span>
            <span class="value" id="peak-window">10am-12pm</span>
        </div>
    </div>

    <!-- SVG energy curve -->
    <svg width="800" height="200" id="energy-curve">
        <path d="M0,150 Q200,50 400,100 T800,80"
              stroke="#00d9ff"
              stroke-width="3"
              fill="none" />
    </svg>
</div>
```

**2. Week View**

7-column grid showing events.

```html
<!-- earth.html (Lines 119-192) -->
<div class="week-view">
    <div class="day-column" data-date="2025-11-09">
        <div class="day-header">
            <span class="day-name">Monday</span>
            <span class="day-date">Nov 9</span>
        </div>
        <div class="events">
            <div class="event" data-event-id="123">
                <span class="event-time">9:00 AM</span>
                <span class="event-title">Team Standup</span>
            </div>
            <div class="event" data-event-id="124">
                <span class="event-time">2:00 PM</span>
                <span class="event-title">Client Call</span>
            </div>
        </div>
    </div>
    <!-- ... 6 more columns -->
</div>
```

**3. Quick Actions**

- Add Event
- Optimize Day (AI rearranges for energy)
- View Week
- Time Blocks (focus/deep work/meetings)

**4. Time Blocks**

```html
<!-- earth.html (Lines 268-296) -->
<div class="time-blocks">
    <div class="block focus-time">
        <span class="icon">🎯</span>
        <span class="duration">2 hours</span>
        <span class="description">Deep focus work</span>
    </div>
    <div class="block meetings">
        <span class="icon">👥</span>
        <span class="duration">3 hours</span>
        <span class="description">Meetings & calls</span>
    </div>
</div>
```

#### Backend Endpoints

- `GET /api/earth/calendar/events?start=2025-11-09&end=2025-11-16` - Week events
- `POST /api/earth/calendar/optimize` - Optimize day for energy
- `GET /api/phoenix/cache` (energy_forecast field) - Energy curve data
- `POST /api/earth/calendar/events` - Create event

---

### 7.4 Mars (Goals & Habits)

**File:** `mars.html`
**JavaScript:** `src/mars-app.js`

**Purpose:** OKR tracking, habit formation, accountability

#### Key Features

**1. OKR Hero**

Large objective with circular progress ring.

```html
<!-- mars.html (Lines 57-119) -->
<div id="okr-hero">
    <h2 class="objective">Build $1M ARR Business</h2>
    <div class="okr-ring-container">
        <svg width="250" height="250">
            <circle cx="125" cy="125" r="100"
                    stroke="#1a1a1a"
                    stroke-width="15"
                    fill="none" />
            <circle id="okr-progress-ring"
                    cx="125" cy="125" r="100"
                    stroke="#00d9ff"
                    stroke-width="15"
                    fill="none"
                    stroke-dasharray="628 628"
                    transform="rotate(-90 125 125)" />
        </svg>
        <div class="okr-percentage">67%</div>
    </div>
</div>
```

**2. Key Results List**

```html
<!-- mars.html (Lines 157-221) -->
<div class="key-results">
    <div class="key-result">
        <h4>Launch MVP by Q1</h4>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 80%"></div>
        </div>
        <span class="progress-text">80% complete</span>
        <span class="deadline">Deadline: Mar 31</span>
    </div>
    <div class="key-result">
        <h4>Get 100 paying customers</h4>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 45%"></div>
        </div>
        <span class="progress-text">45 / 100 customers</span>
    </div>
</div>
```

**3. Habit Grid (GitHub-style)**

365-day habit tracking grid.

```html
<!-- mars.html (Lines 224-270) -->
<div class="habit-grid">
    <!-- 7 rows × 52 columns = 364 days -->
    <div class="grid-row">
        <div class="grid-cell level-0"></div>  <!-- No activity -->
        <div class="grid-cell level-1"></div>  <!-- Light activity -->
        <div class="grid-cell level-2"></div>  <!-- Medium -->
        <div class="grid-cell level-3"></div>  <!-- High -->
        <div class="grid-cell level-4"></div>  <!-- Max -->
        <!-- ... 47 more cells -->
    </div>
    <!-- ... 6 more rows -->
</div>

<div class="grid-legend">
    <span>Less</span>
    <div class="legend-cell level-0"></div>
    <div class="legend-cell level-1"></div>
    <div class="legend-cell level-2"></div>
    <div class="legend-cell level-3"></div>
    <div class="legend-cell level-4"></div>
    <span>More</span>
</div>
```

**4. Habits Checklist**

```html
<!-- mars.html (Lines 272-300) -->
<div class="habits-checklist">
    <div class="habit-item">
        <input type="checkbox" id="habit-workout" onchange="checkHabit('workout')" />
        <label for="habit-workout">💪 Workout</label>
        <span class="streak">🔥 12 day streak</span>
    </div>
    <div class="habit-item">
        <input type="checkbox" id="habit-meditate" onchange="checkHabit('meditate')" />
        <label for="habit-meditate">🧘 Meditate</label>
        <span class="streak">🔥 5 day streak</span>
    </div>
</div>
```

#### Backend Endpoints

- `GET /api/mars/goals` - All goals (OKRs)
- `PUT /api/mars/goals/:id` - Update goal progress
- `GET /api/mars/habits` - All habits
- `POST /api/mars/habits/:id/check` - Check off habit
- `GET /api/mars/habits/streak?habitId=workout` - Get streak data

---

### 7.5 Jupiter (Finance)

**File:** `jupiter.html`
**JavaScript:** `src/jupiter-app.js`

**Purpose:** Financial intelligence, net worth tracking, budget optimization

#### Key Features

**1. Net Worth Hero**

```html
<!-- jupiter.html (Lines 17-63) -->
<div id="net-worth-hero">
    <h2>Net Worth</h2>
    <div class="net-worth-value">$485,230</div>
    <div class="net-worth-change positive">
        <span class="icon">↑</span>
        <span class="amount">+$12,450</span>
        <span class="percentage">(+2.6%)</span>
    </div>
    <span class="time-period">vs. last month</span>
</div>
```

**2. Quick Stats**

```html
<!-- jupiter.html (Lines 66-105) -->
<div class="quick-stats">
    <div class="stat">
        <span class="label">Income</span>
        <span class="value">$8,500</span>
        <span class="period">this month</span>
    </div>
    <div class="stat">
        <span class="label">Expenses</span>
        <span class="value">$4,200</span>
        <span class="period">this month</span>
    </div>
    <div class="stat">
        <span class="label">Savings Rate</span>
        <span class="value">51%</span>
    </div>
    <div class="stat">
        <span class="label">Investment Growth</span>
        <span class="value positive">+8.2%</span>
        <span class="period">YTD</span>
    </div>
</div>
```

**3. Spending Chart**

```html
<!-- jupiter.html (Lines 150-205) -->
<div class="spending-chart">
    <div class="category">
        <span class="icon">🏠</span>
        <span class="name">Housing</span>
        <div class="bar">
            <div class="fill" style="width: 60%; background: #ff6b6b"></div>
        </div>
        <span class="amount">$1,800</span>
        <span class="percentage">43%</span>
    </div>
    <div class="category">
        <span class="icon">🍔</span>
        <span class="name">Food</span>
        <div class="bar">
            <div class="fill" style="width: 40%; background: #4ecdc4"></div>
        </div>
        <span class="amount">$650</span>
        <span class="percentage">15%</span>
    </div>
    <!-- ... more categories -->
</div>
```

**4. Transactions List**

```html
<!-- jupiter.html (Lines 207-273) -->
<div class="transactions-list">
    <div class="transaction income">
        <span class="icon">💰</span>
        <div class="details">
            <span class="name">Salary Deposit</span>
            <span class="date">Nov 1, 2025</span>
        </div>
        <span class="amount positive">+$8,500.00</span>
    </div>
    <div class="transaction expense">
        <span class="icon">🏠</span>
        <div class="details">
            <span class="name">Rent</span>
            <span class="date">Nov 1, 2025</span>
        </div>
        <span class="amount negative">-$1,800.00</span>
    </div>
</div>
```

#### Backend Endpoints

- `GET /api/jupiter/net-worth` - Current net worth + breakdown
- `GET /api/jupiter/budgets` - Budget progress
- `GET /api/jupiter/transactions?start=2025-11-01&end=2025-11-30` - Transactions
- `POST /api/wearables/sync/plaid` - Sync bank accounts
- `GET /api/jupiter/investments` - Portfolio performance

---

### 7.6 Saturn (Legacy Planning)

**File:** `saturn.html`
**JavaScript:** `src/saturn-app.js`

**Purpose:** Mortality awareness, long-term vision, quarterly reflection

#### Key Features

**1. Mortality Counter Hero**

```html
<!-- saturn.html (Lines 17-102) -->
<div id="mortality-hero">
    <h2>Time Remaining</h2>
    <div class="countdown">
        <div class="countdown-value">3,542</div>
        <div class="countdown-unit">weeks remaining</div>
    </div>
    <div class="motivational-text">Make every week count</div>

    <!-- Life progress bar -->
    <div class="life-progress-bar">
        <div class="life-progress-fill" style="width: 32%"></div>
    </div>
    <div class="life-stats">
        <span class="stat">
            <span class="label">Weeks lived:</span>
            <span class="value">1,458</span>
        </span>
        <span class="stat">
            <span class="label">Weeks remaining:</span>
            <span class="value">3,542</span>
        </span>
    </div>
</div>
```

**Calculation:**

```javascript
// src/saturn-app.js
function calculateMortalityCounter(birthDate, lifeExpectancy = 80) {
    const now = new Date();
    const birth = new Date(birthDate);

    // Weeks lived
    const msLived = now - birth;
    const weeksLived = Math.floor(msLived / (7 * 24 * 60 * 60 * 1000));

    // Total expected weeks
    const totalWeeks = lifeExpectancy * 52;

    // Weeks remaining
    const weeksRemaining = totalWeeks - weeksLived;

    // Progress percentage
    const progress = (weeksLived / totalWeeks) * 100;

    return { weeksLived, weeksRemaining, progress };
}
```

**2. Quarterly Reviews Timeline**

```html
<!-- saturn.html (Lines 147-208) -->
<div class="quarterly-timeline">
    <div class="review-item">
        <div class="review-dot"></div>
        <div class="review-content">
            <h4>Q3 2025</h4>
            <p class="highlights">Launched MVP, gained first 10 customers</p>
            <span class="score">8/10</span>
        </div>
    </div>
    <div class="review-item">
        <div class="review-dot"></div>
        <div class="review-content">
            <h4>Q2 2025</h4>
            <p class="highlights">Built product, secured initial funding</p>
            <span class="score">7/10</span>
        </div>
    </div>
</div>
```

**3. Long-term Goals Grid**

```html
<!-- saturn.html (Lines 210-256) -->
<div class="long-term-goals">
    <div class="goal-column">
        <h3>1 Year</h3>
        <div class="goal-item">$1M ARR</div>
        <div class="goal-item">50 customers</div>
        <div class="goal-item">Hire 5 employees</div>
    </div>
    <div class="goal-column">
        <h3>5 Years</h3>
        <div class="goal-item">$10M ARR</div>
        <div class="goal-item">IPO or acquisition</div>
        <div class="goal-item">Own home</div>
    </div>
    <div class="goal-column">
        <h3>10 Years</h3>
        <div class="goal-item">Financial freedom</div>
        <div class="goal-item">Philanthropy</div>
        <div class="goal-item">Impact 1M lives</div>
    </div>
</div>
```

**4. Legacy Projects**

```html
<!-- saturn.html (Lines 257-300) -->
<div class="legacy-projects">
    <div class="project">
        <h4>Build AI Company</h4>
        <span class="status in-progress">In Progress</span>
        <p>Creating AI tools that make people 10x more productive</p>
        <div class="progress-bar">
            <div class="fill" style="width: 45%"></div>
        </div>
    </div>
    <div class="project">
        <h4>Write a Book</h4>
        <span class="status planned">Planned</span>
        <p>Book on building products with AI</p>
    </div>
</div>
```

#### Backend Endpoints

- `GET /api/saturn/mortality-counter` - User's mortality data
- `GET /api/saturn/quarterly-reviews` - Past reviews
- `POST /api/saturn/quarterly-reviews` - Create new review
- `GET /api/saturn/long-term-goals` - 1/5/10 year goals

---

### 7.7 Phoenix (AI Core)

Phoenix (the AI) doesn't have a dedicated page - it's integrated throughout the entire system via:

1. **Consciousness Display** - Floating panel showing Phoenix's thoughts
2. **JARVIS Engine** - Conversational AI
3. **Voice Commands** - Universal natural language router

**Key Files:**
- `src/consciousness-display.js` - Proactive insights UI
- `src/jarvis.js` - Chat engine
- `phoenix-voice-commands.js` - Command router

Already covered in Section 3 (Brain Structure) and Section 4 (Voice System).

---

## 8. Life Management Integration

### How All Planetary Systems Work Together

Phoenix's true power comes from **cross-domain pattern detection** and **contextual orchestration**.

### Data Flow Example: "How's my recovery today?"

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER                                                         │
│    Says: "How's my recovery today?"                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. WAKE WORD DETECTOR (wake-word-detector.js)                  │
│    - Detects "hey phoenix" or user clicks orb                  │
│    - Activates speech recognition                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PHOENIX ORB (src/phoenix-orb.js:509)                        │
│    - Captures voice input                                       │
│    - Sets orb state: 'listening' → 'processing'                │
│    - Sends to backend                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND UNIVERSAL NL ROUTER                                  │
│    POST /api/phoenix/universal                                  │
│    Body: { query: "How's my recovery today?" }                 │
│                                                                 │
│    - Detects intent: { planet: 'mercury', action: 'check_recovery' }│
│    - Routes to Mercury service                                  │
│    - Fetches recovery data from MongoDB                        │
│    - Returns:                                                   │
│      {                                                          │
│        response: "Your recovery is 87%. Excellent!",           │
│        navigation: {                                            │
│          target: 'mercury',                                     │
│          action: 'spotlight_metric',                            │
│          metric: 'recovery'                                     │
│        },                                                       │
│        data: {                                                  │
│          recoveryScore: 87,                                     │
│          trend: 'improving',                                    │
│          breakdown: {                                           │
│            sleep: 85,                                           │
│            hrv: 72,                                             │
│            rhr: 90                                              │
│          }                                                      │
│        }                                                        │
│      }                                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. FRONTEND RECEIVES RESPONSE                                   │
│    - Phoenix Orb speaks: "Your recovery is 87%. Excellent!"    │
│    - Navigation handler: window.location.href = 'mercury.html' │
│    - sessionStorage: spotlightMetric = 'recovery'              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. MERCURY PAGE LOADS                                           │
│    - mercury-dashboard.js initializes                           │
│    - Checks sessionStorage for spotlight                        │
│    - Calls spotlightMetric('recovery_score', 'Recovery Score') │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. METRIC SPOTLIGHT MODAL (mercury.html:1382)                  │
│    - Fetches: GET /api/mercury/recovery/latest                 │
│    - Displays: Large 87 score, trend, 7-day history chart      │
│    - User sees deep dive into recovery                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. CONSCIOUSNESS DISPLAY (consciousness-display.js)             │
│    - Shows insight: "Your recovery correlates with 7+ hrs sleep"│
│    - Updates mood: 'excited' (green glow)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. PATTERN DETECTION (backend)                                  │
│    - Stores silent knowledge: User's recovery threshold = 80+  │
│    - Learns: When recovery >85, user performs best workouts    │
│    - Future prediction: "If you sleep 8hrs tonight, recovery = 92%"│
└─────────────────────────────────────────────────────────────────┘
```

### Cross-Domain Pattern Detection

#### Example 1: Sleep → Recovery → Workout Performance

```javascript
// Backend pattern detection (simplified)
function detectSleepRecoveryWorkoutPattern(userId) {
    // Gather 30 days of data
    const sleepData = getMercuryData(userId, 'sleep', 30);
    const recoveryData = getMercuryData(userId, 'recovery', 30);
    const workoutData = getVenusData(userId, 'workouts', 30);

    // Find correlations
    const correlations = [];

    for (let i = 0; i < 30; i++) {
        const sleep = sleepData[i].duration;
        const recovery = recoveryData[i].score;
        const workoutIntensity = workoutData[i]?.intensity || 0;

        if (sleep >= 7 && recovery >= 85 && workoutIntensity >= 8) {
            correlations.push({
                date: sleepData[i].date,
                sleep,
                recovery,
                intensity: workoutIntensity
            });
        }
    }

    // If correlation found on 70%+ of days
    if (correlations.length >= 21) {
        return {
            pattern: 'SLEEP_RECOVERY_WORKOUT',
            confidence: (correlations.length / 30) * 100,
            insight: "When you sleep 7+ hours, your recovery score averages 87%, and your workout intensity is 30% higher.",
            recommendation: "Prioritize 7+ hours sleep before heavy workout days."
        };
    }

    return null;
}
```

#### Example 2: Financial Stress → HRV Drop

```javascript
// Detect when financial stress affects health
function detectFinancialStressHealthPattern(userId) {
    const financialData = getJupiterData(userId, 'transactions', 30);
    const hrvData = getMercuryData(userId, 'hrv', 30);

    // Calculate spending vs income ratio per week
    const weeklyStress = [];

    for (let week = 0; week < 4; week++) {
        const weekSpending = getWeekSpending(financialData, week);
        const weekIncome = getWeekIncome(financialData, week);
        const ratio = weekSpending / weekIncome;

        const avgHRV = getWeekAvgHRV(hrvData, week);

        if (ratio > 0.9 && avgHRV < getUserBaseline(userId, 'hrv') * 0.85) {
            weeklyStress.push({ week, ratio, hrv: avgHRV });
        }
    }

    if (weeklyStress.length >= 2) {
        return {
            pattern: 'FINANCIAL_STRESS_HRV',
            confidence: 75,
            insight: "When your spending exceeds 90% of income, your HRV drops 15%. Your body is reacting to financial stress.",
            recommendation: "Review Jupiter budgets, consider expense cuts"
        };
    }
}
```

### Orchestration Priorities

When orchestrator runs, it applies these rules:

1. **Urgency-based Widget Display**
   - Recovery <60% → Health widgets priority 0 (top)
   - Upcoming deadline <24hrs → Calendar widgets priority 0
   - Spending >budget → Finance widgets priority 0

2. **Context-aware Navigation**
   - Morning (6am-9am) → Earth (calendar) default
   - Post-workout → Venus (nutrition) spotlight
   - Evening (8pm+) → Mars (habit checklist)

3. **Proactive Insights**
   - HRV drop >15% → Consciousness display shows "Take it easy today"
   - Workout PR achieved → "New record! Want to share?"
   - 7-day goal streak → "You're on fire! Keep going!"

---

## 9. Authentication & API

### Authentication Flow

**Files:**
- `index.html` - Login page
- `dashboard.html` - Auth check
- `src/orchestrator.js` - Token management

#### Login Sequence

```
1. User enters credentials (index.html)
   ↓
2. POST /api/auth/login
   Body: { email, password }
   ↓
3. Backend validates, returns JWT
   Response: { token: "eyJhbG...", user: {...} }
   ↓
4. Frontend saves token to localStorage
   localStorage.setItem('phoenix_token', token)
   ↓
5. Redirect to dashboard with token in URL hash
   window.location.href = `dashboard.html#token=${token}&t=${Date.now()}`
   ↓
6. Dashboard reads token from hash
   const hash = window.location.hash
   const token = hash.split('token=')[1].split('&')[0]
   ↓
7. Save to localStorage, clean URL
   localStorage.setItem('phoenix_token', token)
   history.replaceState(null, null, 'dashboard.html')
   ↓
8. Orchestrator validates token before every API call
```

**Why URL hash?**
- localStorage doesn't reliably persist across `window.location.replace()`
- URL hash guarantees token reaches dashboard
- Dashboard immediately saves and removes from URL

#### Token Validation

```javascript
// src/orchestrator.js (Lines 598-650)
async validateToken() {
    const token = localStorage.getItem('phoenix_token');

    if (!token) {
        console.log('⚠️ No valid authentication found - allowing guest mode');
        return false;
    }

    // Decode JWT to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();

    if (expiresAt < now) {
        console.log('⚠️ Token expired - refreshing...');
        await this.refreshToken();
    }

    return true;
}
```

### API Client

**File:** `src/api.js` (307 endpoints)

The API client is a 1:1 mirror of the backend. Every backend endpoint has a corresponding frontend method.

#### Structure

```javascript
// src/api.js
class PhoenixAPI {
    constructor(baseURL, token) {
        this.baseURL = baseURL;
        this.token = token;

        // Planet-specific namespaces
        this.mercury = new MercuryAPI(this);
        this.venus = new VenusAPI(this);
        this.earth = new EarthAPI(this);
        this.mars = new MarsAPI(this);
        this.jupiter = new JupiterAPI(this);
        this.saturn = new SaturnAPI(this);
        this.phoenix = new PhoenixAPI(this);
    }

    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }
}

// Mercury API
class MercuryAPI {
    constructor(client) {
        this.client = client;
    }

    async getRecovery() {
        return this.client.request('GET', '/api/mercury/recovery/latest');
    }

    async getHRV(days = 30) {
        return this.client.request('GET', `/api/mercury/biometrics/hrv?days=${days}`);
    }

    async getSleep() {
        return this.client.request('GET', '/api/mercury/sleep/analysis');
    }
}

// Usage:
const api = new PhoenixAPI('https://pal-backend-production.up.railway.app', token);
const recovery = await api.mercury.getRecovery();
```

---

## 10. File Reference

### Complete File Listing

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| **Core System** |
| Orchestrator | `src/orchestrator.js` | 26,030 | System initialization, coordination |
| API Client | `src/api.js` | ~2,000 | 307 backend endpoints (1:1 mirror) |
| Configuration | `src/config.js` | ~100 | Base URLs, constants |
| **AI & Intelligence** |
| JARVIS Engine | `src/jarvis.js` | ~500 | Conversational AI, chat history |
| Consciousness Display | `src/consciousness-display.js` | 513 | Proactive insights UI panel |
| Pattern Detection | Backend: `pal-backend/Src/services/phoenix/patternDetectionEngine.js` | ~1,000 | Cross-domain pattern detection |
| **Voice System** |
| Voice Orb | `src/phoenix-orb.js` | ~500 | Voice interaction UI |
| Voice Commands | `phoenix-voice-commands.js` | ~700 | Natural language router |
| Wake Word Detector | `wake-word-detector.js` | ~300 | "Hey Phoenix" detection |
| Voice Controller | `voice-controller.js` | 286 | Voice/Manual mode toggle |
| TTS Module | `src/voice-tts.js` | ~200 | Text-to-speech |
| **UI Systems** |
| Widget Manager | `widget-manager.js` | 430 | Dynamic JARVIS-style widgets |
| **Planet Pages** |
| Mercury Dashboard | `mercury.html` | 1,703 | Health & Recovery UI |
| Mercury Logic | `src/mercury-dashboard.js` | ~500 | Mercury functionality |
| Venus Dashboard | `venus.html` | 1,031 | Fitness & Training UI |
| Venus Logic | `src/venus-app.js` | ~600 | Workout/nutrition logic |
| Earth Dashboard | `earth.html` | ~500 | Calendar & Scheduling UI |
| Earth Logic | `src/earth-app.js` | ~400 | Calendar logic |
| Mars Dashboard | `mars.html` | ~500 | Goals & Habits UI |
| Mars Logic | `src/mars-app.js` | ~400 | OKR/habit logic |
| Jupiter Dashboard | `jupiter.html` | ~500 | Finance UI |
| Jupiter Logic | `src/jupiter-app.js` | ~400 | Finance logic |
| Saturn Dashboard | `saturn.html` | ~500 | Legacy Planning UI |
| Saturn Logic | `src/saturn-app.js` | ~400 | Mortality/review logic |
| **Authentication** |
| Login Page | `index.html` | ~1,500 | Login form, auth flow |
| Main Dashboard | `dashboard.html` | ~5,000 | Post-login central hub |
| Onboarding | `onboarding.html` | ~2,000 | Registration flow |
| **Integrations** |
| Wearables Connector | `src/wearables.js` | ~800 | Oura, WHOOP, Apple Health, etc. |
| **Documentation** |
| Feature Reference | `PHOENIX-REFERENCE.md` | ~2,000 | Feature documentation |
| Deployment Guide | `STARTUP.md` | ~200 | Deployment & architecture |
| Implementation Doc | `PHOENIX-IMPLEMENTATION.md` | This file | Complete implementation guide |

### Backend Structure

```
pal-backend/
├── Src/
│   ├── services/
│   │   └── phoenix/
│   │       ├── patternDetectionEngine.js
│   │       ├── consciousnessOrchestrator.js
│   │       ├── operatorExtensions.js
│   │       └── patterns/
│   │           ├── R001_relationship_ending.js
│   │           ├── H007_overtraining.js
│   │           └── ... (52 total patterns)
│   ├── routes/
│   │   ├── mercury.js
│   │   ├── venus.js
│   │   ├── earth.js
│   │   ├── mars.js
│   │   ├── jupiter.js
│   │   ├── saturn.js
│   │   └── phoenix.js
│   └── models/
│       ├── User.js
│       ├── Recovery.js
│       ├── Workout.js
│       ├── Goal.js
│       └── ...
```

---

## Conclusion

Phoenix is a complete AI-powered life management system that:

1. **Orchestrates** your entire life through intelligent coordination
2. **Detects patterns** across health, fitness, calendar, goals, finance, and legacy
3. **Proactively surfaces insights** before you ask
4. **Adapts to your preferences** (voice vs manual, widget priorities)
5. **Learns from your behavior** to improve recommendations

The system is built on:
- 67-step initialization sequence (orchestrator.js)
- 307 backend API endpoints (api.js)
- 7 planetary life domains (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Phoenix)
- Cross-domain pattern detection (52+ patterns)
- Voice-first interaction (wake word, natural language)
- Dynamic widget system (JARVIS-style UI)

This document provides the complete technical implementation for anyone new to Phoenix to understand how everything works together.

**For questions or contributions, see:**
- PHOENIX-REFERENCE.md (feature reference)
- STARTUP.md (deployment guide)

---

**END OF DOCUMENTATION**
