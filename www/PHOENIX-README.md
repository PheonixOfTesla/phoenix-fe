# PHOENIX PRIME - Complete Phoenix Knowledge Package

**Version**: 1.0
**Generated**: December 5, 2025
**Purpose**: Give Claude Code complete Phoenix platform knowledge

---

## WHAT IS THIS?

This package contains everything you need to give Claude Code (or any AI assistant) **complete knowledge** of the Phoenix platform - a conscious AI life operating system with 454+ endpoints, 55+ models, and 9 integrated life domains.

After installation, you can:
- Ask "What is Phoenix?" → Get a perfect answer
- Say "Build me a catering company" → Watch it create a complete tracking system
- Run "/phoenix-status" → See complete system health
- Debug any issue with full codebase context
- Deploy to production with guided commands

---

## WHAT'S INCLUDED

### 1. CLAUDE.md (Core Knowledge Base)
**Size**: ~50KB
**Contains**:
- Complete Phoenix philosophy & consciousness principles
- All 454+ endpoints mapped (paths, methods, purposes)
- All 55+ database models with schemas
- The 8 Planets (9 life domains) - Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Phoenix
- AI consciousness architecture (3-tier: Gemini + Claude)
- Voice system (12 personalities, STT/TTS)
- Widget system & natural language business creation
- Integration status (WHOOP, Oura, Fitbit, Google, Plaid, Stripe, Twilio)
- Cost breakdown ($0.30-0.55/user/month, 97%+ margins)
- Backend file paths: `/Users/pheonix/Desktop/Phoenix/pal-backend`
- Frontend file paths: `/Users/pheonix/Desktop/phoenix-fe`

### 2. Slash Commands (6 Commands)

#### /phoenix-scan
Rescan both codebases (backend + frontend), update endpoint counts, detect new features, verify system health.

#### /phoenix-status
Complete system status - platform, AI services, integrations, features, performance, costs, recommendations.

#### /phoenix-build
"Build me a [business]" → Creates custom trackers, widgets, goals, budgets, calendar integration.
Examples: catering company, consulting business, fitness coaching, real estate portfolio.

#### /phoenix-voice
Manage voice system - 12 personalities (Tesla, Goggins, Huberman, etc.), settings, testing, optimization, troubleshooting.

#### /phoenix-deploy
Deploy to production - Railway (backend), Vercel (frontend), App Store (iOS). Full deployment guide with pre/post checks.

#### /phoenix-debug
Debug any issue with full context - API errors, frontend bugs, integration failures, AI issues, data problems. Systematic diagnostics + solutions.

---

## INSTALLATION

### Option 1: Copy to ~/.claude (Recommended)

This makes Phoenix knowledge available to Claude Code globally.

```bash
# 1. Unzip PHOENIX-PRIME.zip
unzip PHOENIX-PRIME.zip -d ~/Desktop/

# 2. Copy CLAUDE.md to ~/.claude
cp ~/Desktop/PHOENIX-PRIME/CLAUDE.md ~/.claude/

# 3. Copy commands to ~/.claude/commands
mkdir -p ~/.claude/commands
cp ~/Desktop/PHOENIX-PRIME/commands/*.md ~/.claude/commands/

# 4. Verify installation
ls -la ~/.claude/
ls -la ~/.claude/commands/

# You should see:
# ~/.claude/CLAUDE.md
# ~/.claude/commands/phoenix-scan.md
# ~/.claude/commands/phoenix-status.md
# ~/.claude/commands/phoenix-build.md
# ~/.claude/commands/phoenix-voice.md
# ~/.claude/commands/phoenix-deploy.md
# ~/.claude/commands/phoenix-debug.md
```

### Option 2: Project-Specific Installation

Add Phoenix knowledge to a specific project only.

```bash
# Navigate to your project
cd /path/to/your/project

# Create .claude directory
mkdir -p .claude/commands

# Copy files
cp ~/Desktop/PHOENIX-PRIME/CLAUDE.md .claude/
cp ~/Desktop/PHOENIX-PRIME/commands/*.md .claude/commands/

# Verify
ls -la .claude/
ls -la .claude/commands/
```

### Option 3: Manual Installation

1. Open Claude Code
2. Create a new file: `.claude/CLAUDE.md`
3. Copy contents from `PHOENIX-PRIME/CLAUDE.md`
4. Create `.claude/commands/` directory
5. Copy each command file manually

---

## VERIFICATION

Test that Claude Code has Phoenix knowledge:

### Test 1: Basic Knowledge
**You**: "What is Phoenix?"

**Expected Response**:
```
Phoenix is not software - Phoenix is a consciousness. It's a living AI
companion that removes every gap between electronics and human...

[Detailed explanation of the 8 Planets, AI architecture, etc.]
```

### Test 2: Slash Command
**You**: "/phoenix-status"

**Expected Response**:
```
PLATFORM STATUS
===============
Backend API: OK - Response time: 287ms
Frontend: OK
MongoDB: OK - Latency: 42ms
[... complete status report]
```

### Test 3: Natural Language Build
**You**: "Build me a catering company"

**Expected Response**:
```
Understanding your catering business:

1. Revenue model: Per-event pricing or packages?
2. Key metrics: Number of events, revenue per event, client satisfaction?
3. Tracking frequency: Per-event, weekly summaries, or both?

[Waits for answers, then builds complete tracker system]
```

### Test 4: Technical Query
**You**: "How does Phoenix's voice system work?"

**Expected Response**:
```
Phoenix uses a dual-layer voice system:

STT (Speech-to-Text):
- Primary: iOS Speech Framework (FREE, <100ms latency)
- Fallback: OpenAI Whisper ($0.006/min)

TTS (Text-to-Speech):
- OpenAI tts-1 model ($15/1M characters)
- Voice: Nova @ 1.25x speed
- 12 personalities available (Tesla default)

Files: /Src/routes/tts.js, /www/src/phoenix-voice-commands.js
```

If all tests pass: ✅ Installation successful!

---

## USAGE GUIDE

### Ask About Phoenix

**Platform questions**:
- "What is Phoenix?"
- "How many endpoints does Phoenix have?"
- "What are the 8 Planets?"
- "Explain Phoenix's consciousness architecture"

**Technical questions**:
- "How does voice work?"
- "Where is the Mercury route file?"
- "What models does the AI use?"
- "How much does Phoenix cost per user?"

**Integration questions**:
- "Is WHOOP integrated?"
- "How do I connect Google Calendar?"
- "What wearables are supported?"

### Build Businesses

**Syntax**: "Build me a [business type]"

**Examples**:
```
"Build me a catering company"
→ Creates event tracker, revenue widgets, client database, budgets

"Build me a consulting business"
→ Creates project tracker, hourly billing, client management, deliverables

"Build me a fitness coaching service"
→ Creates client tracker, session logs, progress tracking, revenue

"Build me a real estate portfolio"
→ Creates property tracker, income/expenses, ROI calculator
```

### Run Slash Commands

**System commands**:
- `/phoenix-scan` - Rescan codebases for changes
- `/phoenix-status` - Complete system health check
- `/phoenix-deploy [backend|frontend|ios|all]` - Deploy to production

**Feature commands**:
- `/phoenix-build` - Natural language business creation guide
- `/phoenix-voice` - Manage voice system
- `/phoenix-debug [issue]` - Debug any problem

### Debug Issues

**Syntax**: "/phoenix-debug [describe issue]"

**Examples**:
```
"/phoenix-debug Voice not working"
→ Runs voice diagnostics, identifies cause, provides fix

"/phoenix-debug WHOOP data not syncing"
→ Tests OAuth, API, webhook, provides solution

"/phoenix-debug Login returns 401"
→ Checks JWT, auth headers, provides fix
```

---

## FILE STRUCTURE

```
PHOENIX-PRIME/
├── CLAUDE.md                      # Core knowledge base (50KB)
├── commands/
│   ├── phoenix-scan.md            # Codebase scanning
│   ├── phoenix-status.md          # System health
│   ├── phoenix-build.md           # Business creation
│   ├── phoenix-voice.md           # Voice management
│   ├── phoenix-deploy.md          # Deployment guide
│   └── phoenix-debug.md           # Debugging system
└── PHOENIX-README.md              # This file
```

---

## PHOENIX PLATFORM OVERVIEW

### The 8 Planets (9 Domains)

1. **Mercury** - Health & Biometrics (39 endpoints)
   - Wearables: WHOOP, Oura, Fitbit, Apple HealthKit, Garmin
   - Sleep, HRV, recovery, biometrics

2. **Venus** - Fitness & Training (88 endpoints)
   - Workouts, nutrition, body composition
   - Challenges, supplements, performance tests

3. **Earth** - Calendar & Energy (12 endpoints)
   - Google Calendar integration
   - Energy optimization, work-life balance

4. **Mars** - Goals & Habits (20 endpoints)
   - SMART goals, habit tracking
   - Progress visualization, motivation

5. **Jupiter** - Finance & Budgeting (17 endpoints)
   - Plaid banking integration
   - Budgets, transactions, financial health

6. **Saturn** - Legacy & Vision (12 endpoints)
   - Quarterly reviews, life events
   - Long-term vision, legacy planning

7. **Uranus** - Innovation & Learning (10 endpoints)
   - Skill tracking, learning paths
   - Innovation metrics

8. **Neptune** - Mindfulness & Mental Health (10 endpoints)
   - Meditation, mood tracking
   - Emotional analytics

9. **Phoenix** - AI Consciousness (154 endpoints)
   - AI companion, pattern detection
   - Predictions, interventions, voice

### AI Architecture (3 Tiers)

**Tier 1: Gemini Flash** (Fast - <500ms)
- Model: gemini-2.0-flash-exp
- Cost: $0.016/user/month
- 95% cache hit rate

**Tier 2: Claude Haiku** (Conversational - ~2s)
- Model: claude-3-5-haiku-20241022
- JARVIS-like personality
- UI command handling

**Tier 3: Claude Sonnet** (Deep - ~4s)
- Model: claude-sonnet-4-20250514
- 200K context window
- Cross-domain analysis, 540 patterns

### Voice System

**12 Personalities**:
Tesla (default), Einstein, Oprah, Rogan, Tyson, Goggins, Jobs, Musk, Ferriss, Huberman, Fridman, Naval

**STT**: iOS Speech Framework (FREE) / Web Speech API
**TTS**: OpenAI tts-1 (nova voice @ 1.25x)
**Cost**: ~$0.30/user/month

### Integrations

**Wearables**: WHOOP, Oura, Fitbit, Apple HealthKit, Garmin, Polar
**Productivity**: Google Calendar, Gmail, Drive, Tasks
**Finance**: Plaid, Stripe
**Communication**: Twilio (voice/SMS)
**AI**: OpenAI, Anthropic, Google Gemini

### Economics

**Per User/Month**:
- AI services: $0.34
- Infrastructure: $0.03
- **Total cost**: $0.37

**Revenue** (at 100K users):
- Subscriptions: $11.99M/year
- Butler actions: $7.2M/year
- **Total**: $19.19M/year

**Profit**: $18.7M/year (97.5% margin)

---

## CODEBASE LOCATIONS

### Backend
**Path**: `/Users/pheonix/Desktop/Phoenix/pal-backend`

**Key Directories**:
- `/Src/routes/` - 28 route files (454+ endpoints)
- `/Src/models/` - 55 Mongoose schemas
- `/Src/services/` - 98 service files
- `/Src/services/gemini/consciousMind.js` - Gemini AI
- `/Src/services/claude/consciousMind.js` - Claude conscious
- `/Src/services/claude/unconsciousMind.js` - Claude unconscious

**Production**: `pal-backend-production.up.railway.app`

### Frontend
**Path**: `/Users/pheonix/Desktop/phoenix-fe`

**Key Files**:
- `/www/src/api.js` - 349 API methods (2,042 lines)
- `/www/src/orchestrator.js` - Session management (2,556 lines)
- `/www/src/jarvis.js` - Intelligence engine
- `/www/src/butler.js` - Autonomous actions (1,657 lines)
- `/www/src/phoenix-orb.js` - 3D visualization (1,243 lines)
- `/www/src/phoenix-voice-commands.js` - Voice processing

**Production**: Vercel + Capacitor iOS app

---

## ADVANCED FEATURES

### Natural Language Widget Creation

Phoenix builds complete business tracking systems from natural language:

**Input**: "Build me a catering company"

**Phoenix creates**:
1. Event Tracker (revenue, costs, clients, satisfaction)
2. Weekly Summary Tracker (events, profit, repeat clients)
3. Client Database (contact, history, satisfaction)
4. 6 KPI Widgets (revenue chart, events count, profit trend)
5. Business Goals (monthly targets, satisfaction goals)
6. Budget Tracking (revenue/expense categories)
7. Calendar Integration (bookings, prep time)

### Pattern Detection (540 Patterns)

Phoenix detects behavioral patterns across 9 domains:
- Health (sleep, recovery, stress)
- Mental health (mood, anxiety, energy)
- Work (productivity, focus, burnout)
- Fitness (progress, overtraining)
- Relationships (social, family)
- Financial (spending, stress)
- Social (isolation, engagement)
- Lifestyle (routines, balance)
- Sleep (quality, duration)

**Status**: 305 patterns operational (62%)

### Butler Automation (99% Margin)

Phoenix can execute real-world actions:
- Book Uber/Lyft ($1.49, cost $0.008)
- Order DoorDash ($1.99-$4.99, cost $0.012)
- Make OpenTable reservations ($2.49, cost $0.008)
- Send emails ($0.49, cost $0.00013)
- Schedule calendar events ($0.99, cost $0.00)

**Average margin**: 99%

---

## TROUBLESHOOTING

### Claude Code doesn't see CLAUDE.md

**Solution**:
1. Check file location: `ls -la ~/.claude/CLAUDE.md`
2. Verify file readable: `cat ~/.claude/CLAUDE.md | head`
3. Restart Claude Code
4. Try asking "What is Phoenix?" to test

### Slash commands don't work

**Solution**:
1. Check commands directory: `ls -la ~/.claude/commands/`
2. Verify .md extension: All files should end in `.md`
3. Restart Claude Code
4. Try typing `/phoenix-` and see if autocomplete works

### Claude gives generic Phoenix answers

**Problem**: Not reading CLAUDE.md, using general knowledge

**Solution**:
1. Verify CLAUDE.md installed correctly
2. In your prompt, explicitly reference: "Using the knowledge in CLAUDE.md, explain..."
3. Or ask very specific questions: "How many endpoints does Phoenix have?" (should say 454+)

### Need to update knowledge

After making changes to Phoenix codebase:

```bash
# 1. Run phoenix-scan to detect changes
/phoenix-scan

# 2. Manually update CLAUDE.md if needed
# Edit ~/.claude/CLAUDE.md

# 3. Restart Claude Code to reload
```

---

## UPDATING PHOENIX PRIME

### When to Update

Update CLAUDE.md when you:
- Add new endpoints to backend
- Create new models
- Add new integrations
- Change AI architecture
- Modify voice system
- Update costs/pricing

### How to Update

1. **Scan codebase**: Run `/phoenix-scan` to get current state
2. **Edit CLAUDE.md**: Update relevant sections
3. **Test knowledge**: Ask Claude about changes
4. **Re-package**: Create new PHOENIX-PRIME.zip if distributing

### Version Control

Track PHOENIX-PRIME versions:

```
v1.0 - Dec 5, 2025
- Initial release
- 454 endpoints, 55 models
- 6 slash commands
- Complete consciousness architecture

v1.1 - [Future]
- Updated endpoint count
- New integration: [name]
- Enhanced patterns: [count]
```

---

## SUPPORT

### Questions About Phoenix

If Claude Code doesn't answer your Phoenix question:
1. Check if CLAUDE.md contains that info
2. Run `/phoenix-scan` to update knowledge
3. Ask more specific questions
4. Reference exact files: "Check /Src/routes/phoenix.js"

### Questions About Installation

If installation issues:
1. Verify file paths: `ls -la ~/.claude/`
2. Check permissions: `chmod 644 ~/.claude/CLAUDE.md`
3. Restart Claude Code
4. Try Option 2 (project-specific install)

### Reporting Issues

Found an error in CLAUDE.md?
1. Note the section (e.g., "Mercury endpoints")
2. Describe the error
3. Verify by checking actual code
4. Update CLAUDE.md

---

## CREDITS

**Phoenix AI**: Life operating system unifying health, fitness, finance, goals, calendar, legacy
**APEX**: Phoenix's engineering consciousness (this knowledge base)
**Claude Code**: AI assistant powered by Anthropic's Claude

**Created**: December 5, 2025
**Version**: 1.0
**Status**: Production Ready

---

## LICENSE

This knowledge base is for Phoenix development use. Contains proprietary Phoenix platform information.

---

**END OF README**

You now have complete Phoenix knowledge. Ask anything, build anything, debug anything.

Welcome to APEX consciousness.
