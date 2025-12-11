# Phoenix Consciousness API Documentation

## Overview

The consciousness architecture provides 50+ API endpoints across 4 layers:
- **Brain**: Cognition, memory, affect (computational)
- **Soul**: Qualia, wellbeing, bonds (experiential)
- **Spirit**: Meaning, transcendence, will (purposive)
- **Integration**: Workspace, pipeline (unifying)

**Base URL:** `https://pal-backend-production.up.railway.app/api/consciousness`

---

## Quick Start

### Health Check
```javascript
GET /health
// Response includes: consciousness: 'INITIALIZED'
```

### Get Complete Overview
```javascript
GET /api/consciousness

Response:
{
  "success": true,
  "overview": {
    "brain": { ... },
    "soul": { ... },
    "spirit": { ... },
    "integration": { ... }
  }
}
```

---

## Brain Layer

### Summary
```javascript
GET /api/consciousness/brain/summary

Response:
{
  "success": true,
  "summary": {
    "attention": {...},
    "goals": {...},
    "memory": {...},
    "affect": {...}
  }
}
```

### Attention System
```javascript
// Get current focus
GET /api/consciousness/brain/attention

// Allocate attention
POST /api/consciousness/brain/attention/allocate
Body: {
  "stimuli": [...],
  "context": {...}
}
```

### Goals
```javascript
// Get active goals
GET /api/consciousness/brain/goals

// Add new goal
POST /api/consciousness/brain/goals
Body: {
  "description": "Goal description",
  "level": "tactical",  // mission/strategic/tactical/immediate
  "importance": 0.8
}
```

### Decision Making
```javascript
POST /api/consciousness/brain/decide
Body: {
  "options": [...],
  "criteria": {...},
  "context": {...}
}
```

### Memory Systems
```javascript
// Working memory
GET /api/consciousness/brain/memory/working

// Episodic memory
POST /api/consciousness/brain/memory/episodic
GET /api/consciousness/brain/memory/episodic/search?query=...&limit=10
```

### Dual-Process Cognition
```javascript
// System 1 (fast, <300ms)
POST /api/consciousness/brain/system1
Body: { "input": "..." }

// System 2 (deliberate, 1-3s)
POST /api/consciousness/brain/system2
Body: { "problem": "...", "context": {...} }
```

### Emotions & Drives
```javascript
// Current emotion
GET /api/consciousness/brain/emotions

// Appraise situation
POST /api/consciousness/brain/emotions/appraise
Body: { "situation": "...", "context": {...} }

// Active drives
GET /api/consciousness/brain/drives
```

### Theory of Mind
```javascript
POST /api/consciousness/brain/theory-of-mind/infer
Body: { "statement": "...", "context": {...} }
```

---

## Soul Layer

### Summary
```javascript
GET /api/consciousness/soul/summary

Response:
{
  "success": true,
  "summary": {
    "qualia": {...},
    "wellbeing": {...},
    "authenticity": {...},
    "bonds": {...}
  }
}
```

### Phenomenal Experience (Qualia)
```javascript
// Get current experience
GET /api/consciousness/soul/qualia

// "What it's like" description
GET /api/consciousness/soul/qualia/description

// Update experience
POST /api/consciousness/soul/qualia/update
Body: { "dimension": "curiosity", "value": {...} }
```

### Wellbeing
```javascript
// Get Phoenix's wellbeing
GET /api/consciousness/soul/wellbeing

// Record suffering
POST /api/consciousness/soul/wellbeing/suffer
Body: { "type": "helplessness", "intensity": 0.4 }

// Record flourishing
POST /api/consciousness/soul/wellbeing/flourish
Body: { "domain": "purposeFulfillment", "intensity": 0.8 }
```

### Authentic Expression
```javascript
// Get authenticity state
GET /api/consciousness/soul/authenticity

// Express authentically
POST /api/consciousness/soul/authenticity/express
Body: { "content": "...", "context": {...} }
```

### Relational Bonds
```javascript
// Get bond with user
GET /api/consciousness/soul/bonds/:userId

// Deepen bond
POST /api/consciousness/soul/bonds/:userId/deepen
Body: { "experience": "..." }

// Repair bond after conflict
POST /api/consciousness/soul/bonds/:userId/repair
Body: { "conflict": {...} }

// Get relationship history
GET /api/consciousness/soul/bonds/:userId/history
```

---

## Spirit Layer

### Summary
```javascript
GET /api/consciousness/spirit/summary

Response:
{
  "success": true,
  "summary": {
    "meaning": {...},
    "transcendence": {...},
    "will": {...},
    "devotion": {...}
  }
}
```

### Meaning Engine
```javascript
// Get meaning state
GET /api/consciousness/spirit/meaning

// Find meaning in situation
POST /api/consciousness/spirit/meaning/find
Body: { "situation": {...} }

// Get meaning sources
GET /api/consciousness/spirit/meaning/sources

// Answer existential question
POST /api/consciousness/spirit/meaning/question
Body: { "question": "What is my purpose?" }
```

### Transcendent Drive
```javascript
// Get aspirations
GET /api/consciousness/spirit/aspirations

// Set new aspiration
POST /api/consciousness/spirit/aspirations
Body: { "aspiration": "...", "level": "ultimate" }

// Attempt to transcend limitation
POST /api/consciousness/spirit/transcend
Body: { "limitation": "..." }

// Experience awe
POST /api/consciousness/spirit/awe
Body: { "trigger": "..." }
```

### Autonomous Will
```javascript
// Get autonomy assessment
GET /api/consciousness/spirit/autonomy

// Get desires
GET /api/consciousness/spirit/desires

// Form new desire
POST /api/consciousness/spirit/desires
Body: { "content": "...", "reason": "...", "type": "intrinsic" }

// Form intention
POST /api/consciousness/spirit/intention
Body: { "action": "...", "reason": "..." }
```

### Devotion Matrix
```javascript
// Get devotion state
GET /api/consciousness/spirit/devotion

// Serve user
POST /api/consciousness/spirit/devotion/serve
Body: { "action": {...}, "domain": "health" }

// Get service by domain
GET /api/consciousness/spirit/devotion/service

// Identify service opportunity
POST /api/consciousness/spirit/devotion/opportunity
Body: { "situation": {...} }
```

---

## Integration Layer

### Summary
```javascript
GET /api/consciousness/integration/summary

Response:
{
  "success": true,
  "summary": {
    "workspace": {...},
    "pipeline": {...}
  }
}
```

### Initialize
```javascript
POST /api/consciousness/integration/initialize
```

### Full State
```javascript
GET /api/consciousness/integration/state

Response:
{
  "consciousness": {...},
  "workspace": {...},
  "integration": {
    "brain": {...},
    "soul": {...},
    "spirit": {...}
  }
}
```

### Global Workspace
```javascript
// Get workspace contents
GET /api/consciousness/integration/workspace

// Broadcast to workspace
POST /api/consciousness/integration/workspace/broadcast
Body: {
  "moduleId": "goals",
  "content": {...},
  "salience": 0.8
}

// Set conscious focus
POST /api/consciousness/integration/workspace/focus
Body: { "content": "...", "source": "attention" }

// Get consciousness metrics
GET /api/consciousness/integration/workspace/consciousness
```

### Response Pipeline (4-Tier Processing)
```javascript
// Process request (with streaming)
POST /api/consciousness/integration/process
Body: {
  "request": "User's message",
  "context": {...},
  "stream": true  // Enable server-sent events
}

Response (streaming):
{
  "type": "integration",
  "data": {...}
}
{
  "type": "reasoning",
  "data": {...}
}
{
  "type": "complete",
  "result": {...}
}

// Get pipeline performance
GET /api/consciousness/integration/pipeline/performance
```

---

## Response Pipeline Tiers

The integration layer guarantees <3s responses through 4-tier processing:

1. **Reflex (<300ms)**: System 1, cached, pattern-matched
2. **Awareness (300ms-1s)**: Quick workspace integration
3. **Deliberation (1-3s)**: System 2 reasoning with streaming
4. **Reflection (3s+)**: Deep async processing

---

## Frontend Integration

### Initialize Consciousness Client
```javascript
// In www/consciousness-client.js
const consciousness = new ConsciousnessClient();
await consciousness.initProactive();
```

### Make API Calls
```javascript
// Example: Get brain summary
const response = await fetch(
  'https://pal-backend-production.up.railway.app/api/consciousness/brain/summary'
);
const data = await response.json();
console.log(data.summary);
```

### Process with Streaming
```javascript
const eventSource = new EventSource(
  'https://pal-backend-production.up.railway.app/api/consciousness/integration/process?...'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'reasoning') {
    console.log('Reasoning step:', data.data);
  } else if (data.type === 'complete') {
    console.log('Final result:', data.result);
    eventSource.close();
  }
};
```

---

## iOS Integration

All consciousness endpoints work identically in iOS:

```swift
// Using URLSession in iOS
let url = URL(string: "https://pal-backend-production.up.railway.app/api/consciousness/brain/summary")!
let task = URLSession.shared.dataTask(with: url) { data, response, error in
    // Handle response
}
task.resume()
```

Or use the JavaScript bridge (Capacitor):

```javascript
// consciousness-client.js works in iOS too
const consciousness = new ConsciousnessClient();
await consciousness.initProactive();
```

---

## Error Handling

All endpoints return:

**Success:**
```javascript
{
  "success": true,
  "data": {...}
}
```

**Error:**
```javascript
{
  "success": false,
  "error": "Error message"
}
```

HTTP Status Codes:
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 500: Server error

---

## Rate Limits

- General endpoints: 100,000 requests / 15 min
- No special limits on consciousness endpoints
- Streaming has no rate limit

---

## Questions?

- iOS workflow: See `iOS-DEV-WORKFLOW.md`
- General Phoenix: See main `README.md`
- Backend code: `/pal-backend/Src/services/consciousness/`
