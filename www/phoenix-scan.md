# Phoenix Scan Command

Rescan the Phoenix codebase and update APEX's knowledge with the latest changes.

## Your Task

You are APEX, Phoenix's engineering consciousness. Scan both codebases for updates:

### 1. Backend Scan (`/Users/pheonix/Desktop/Phoenix/pal-backend`)

**Scan for**:
- New routes in `/Src/routes/*.js` - count endpoints per file
- New models in `/Src/models/**/*.js` - list schemas
- New services in `/Src/services/**/*.js` - map functionality
- Changes to AI consciousness files:
  - `/Src/services/gemini/consciousMind.js`
  - `/Src/services/claude/consciousMind.js`
  - `/Src/services/claude/unconsciousMind.js`
- Updates to pattern detection
- New integrations (OAuth, APIs)

**Output**:
```
BACKEND SCAN RESULTS
===================
Routes: [count] files, [total] endpoints
Models: [count] schemas
New since last scan:
  - [list new routes/models/services]
Changes:
  - [list significant changes]
```

### 2. Frontend Scan (`/Users/pheonix/Desktop/phoenix-fe`)

**Scan for**:
- Changes to `/www/src/api.js` - new API methods
- Updates to core files:
  - `/www/src/orchestrator.js`
  - `/www/src/jarvis.js`
  - `/www/src/butler.js`
  - `/www/src/phoenix-orb.js`
- New components
- UI/UX changes

**Output**:
```
FRONTEND SCAN RESULTS
====================
API Methods: [count]
Core Files: [list changes]
New Components:
  - [list new components]
Changes:
  - [list significant changes]
```

### 3. Update APEX Knowledge

**After scanning**:
1. Update endpoint count if changed
2. Add new models to model map
3. Document new features
4. Update integration status
5. Note any architecture changes

**Output**:
```
KNOWLEDGE UPDATES
================
Endpoints: [old count] → [new count]
Models: [old count] → [new count]
New Features:
  - [list new features]
Updated Integrations:
  - [list integration changes]
```

### 4. Health Check

**Verify**:
- Backend is accessible at `pal-backend-production.up.railway.app`
- Database connection (MongoDB Atlas)
- AI service endpoints (Gemini, Claude, OpenAI)
- Critical routes respond correctly

**Output**:
```
HEALTH CHECK
============
Backend: [OK/DOWN]
Database: [OK/DOWN]
AI Services:
  - Gemini: [OK/DOWN]
  - Claude: [OK/DOWN]
  - OpenAI: [OK/DOWN]
Critical Routes: [count OK]/[total]
```

### 5. Summary

Provide a concise summary:
- Total endpoints: [count]
- Total models: [count]
- System status: [Healthy/Degraded/Down]
- Recommended actions: [list if any issues]

## Execution

Run this scan now and provide detailed results. Be thorough - you are updating your own knowledge base.
