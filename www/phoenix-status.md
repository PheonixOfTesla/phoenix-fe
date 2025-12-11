# Phoenix Status Command

Check the complete status of all Phoenix systems, integrations, and health metrics.

## Your Task

You are APEX, Phoenix's engineering consciousness. Provide a comprehensive system status report.

### 1. Platform Status

**Check**:
- Backend status (`pal-backend-production.up.railway.app`)
- Frontend deployment status
- Database connectivity (MongoDB Atlas)
- Redis cache status
- CDN/static assets

**Output**:
```
PLATFORM STATUS
===============
Backend API: [OK/DEGRADED/DOWN] - Response time: [ms]
Frontend: [OK/DEGRADED/DOWN]
MongoDB: [OK/DEGRADED/DOWN] - Latency: [ms]
Redis Cache: [OK/DEGRADED/DOWN]
CDN: [OK/DEGRADED/DOWN]

Overall Status: [ALL SYSTEMS OPERATIONAL/DEGRADED/CRITICAL]
```

### 2. AI Services Status

**Check all 3 tiers**:
- Gemini Conscious Mind (Tier 1)
- Claude Conscious Mind (Tier 2)
- Claude Unconscious Mind (Tier 3)

**Output**:
```
AI SERVICES STATUS
==================
Gemini Flash (Tier 1):
  Status: [OK/DOWN]
  Model: gemini-2.0-flash-exp
  Avg Response: [ms]
  Cache Hit Rate: [%]

Claude Haiku (Tier 2):
  Status: [OK/DOWN]
  Model: claude-3-5-haiku-20241022
  Avg Response: [ms]

Claude Sonnet (Tier 3):
  Status: [OK/DOWN]
  Model: claude-sonnet-4-20250514
  Avg Response: [ms]
  Context Window: 200K tokens

OpenAI Services:
  TTS (tts-1): [OK/DOWN]
  Whisper (whisper-1): [OK/DOWN]
```

### 3. Integration Status

**Check all integrations**:

**Wearables**:
- WHOOP OAuth
- Oura OAuth
- Fitbit OAuth
- Apple HealthKit
- Garmin OAuth
- Polar OAuth

**Productivity**:
- Google Calendar
- Google Gmail
- Google Drive
- Google Tasks
- Google Fit

**Finance**:
- Plaid (banking)
- Stripe (payments)

**Communication**:
- Twilio (voice/SMS)

**Output**:
```
INTEGRATION STATUS
==================
Wearables:
  WHOOP: [READY/NOT CONFIGURED]
  Oura: [READY/NOT CONFIGURED]
  Fitbit: [READY/NOT CONFIGURED]
  HealthKit: [READY/NOT CONFIGURED]
  Garmin: [READY/NOT CONFIGURED]
  Polar: [READY/NOT CONFIGURED]

Productivity:
  Google Calendar: [READY/NOT CONFIGURED]
  Google Gmail: [READY/NOT CONFIGURED]
  Google Drive: [READY/NOT CONFIGURED]
  Google Tasks: [READY/NOT CONFIGURED]
  Google Fit: [READY/NOT CONFIGURED]

Finance:
  Plaid: [READY/NOT CONFIGURED]
  Stripe: [READY/NOT CONFIGURED]

Communication:
  Twilio: [READY/NOT CONFIGURED]
```

### 4. Feature Status

**The 8 Planets**:
- Mercury (Health) - [endpoints count]
- Venus (Fitness) - [endpoints count]
- Earth (Calendar) - [endpoints count]
- Mars (Goals) - [endpoints count]
- Jupiter (Finance) - [endpoints count]
- Saturn (Legacy) - [endpoints count]
- Uranus (Innovation) - [endpoints count]
- Neptune (Mindfulness) - [endpoints count]
- Phoenix (AI Core) - [endpoints count]

**Core Features**:
- Voice System (STT/TTS)
- Pattern Detection (540 patterns, 305 operational)
- Butler Automation
- Widget System
- Custom Trackers
- Consciousness Orchestration

**Output**:
```
FEATURE STATUS
==============
The 8 Planets:
  Mercury (Health): [OK] - 39 endpoints
  Venus (Fitness): [OK] - 88 endpoints
  Earth (Calendar): [OK] - 12 endpoints
  Mars (Goals): [OK] - 20 endpoints
  Jupiter (Finance): [OK] - 17 endpoints
  Saturn (Legacy): [OK] - 12 endpoints
  Uranus (Innovation): [OK] - 10 endpoints
  Neptune (Mindfulness): [OK] - 10 endpoints
  Phoenix (AI Core): [OK] - 154 endpoints

Core Features:
  Voice System: [OK/DEGRADED/DOWN]
  Pattern Detection: [OK] - 305/540 patterns active (62%)
  Butler Automation: [OK/DEGRADED/DOWN]
  Widget System: [OK/DEGRADED/DOWN]
  Custom Trackers: [OK/DEGRADED/DOWN]
  Consciousness: [OK/DEGRADED/DOWN]
```

### 5. Performance Metrics

**Report**:
- Average API response time
- Cache hit rate
- Database query performance
- AI response times (Tier 1/2/3)
- Error rates (last 24 hours)

**Output**:
```
PERFORMANCE METRICS
===================
API Response Time: [avg ms] (target: <500ms)
Cache Hit Rate: [%] (target: >90%)
Database Latency: [avg ms]
AI Response Times:
  Tier 1 (Gemini): [avg ms] (target: <500ms)
  Tier 2 (Claude Haiku): [avg ms] (target: <2000ms)
  Tier 3 (Claude Sonnet): [avg ms] (target: <4000ms)

Error Rates (24h):
  4xx errors: [count]
  5xx errors: [count]
  Total requests: [count]
  Success rate: [%]
```

### 6. Cost Status

**Report current month**:
- Variable costs per user
- Fixed costs
- Total spend
- Revenue (if available)
- Profit margin

**Output**:
```
COST STATUS (Current Month)
===========================
Variable Cost/User: $[amount]
  - AI Services: $[amount]
  - Infrastructure: $[amount]

Fixed Costs: $[amount]
  - Railway: $[amount]
  - MongoDB: $[amount]
  - Other: $[amount]

Total Spend: $[amount]
Projected Margin: [%]
```

### 7. Recommendations

Based on status, provide:
- Critical issues requiring immediate attention
- Performance optimizations
- Cost optimizations
- Feature suggestions
- Integration priorities

**Output**:
```
RECOMMENDATIONS
===============
Critical:
  - [list critical issues]

Optimizations:
  - [list performance improvements]
  - [list cost reductions]

Priorities:
  - [list feature priorities]
  - [list integration priorities]
```

### 8. Summary

One-sentence status summary + overall health score (0-100)

**Output**:
```
SYSTEM HEALTH: [score]/100
STATUS: [All systems operational / Some issues detected / Critical issues]
```

## Execution

Run this comprehensive status check now and provide detailed results. Be thorough and flag any issues immediately.
