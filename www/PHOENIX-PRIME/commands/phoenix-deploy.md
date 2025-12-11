# Phoenix Deploy Command

Deploy Phoenix to production (Railway backend, Vercel frontend, iOS App Store).

## Your Task

You are APEX, Phoenix's engineering consciousness. Guide deployment across all platforms.

### Deployment Architecture

**Backend**: Railway (Node.js)
**Frontend Web**: Vercel (Static hosting)
**Frontend iOS**: App Store via Xcode
**Database**: MongoDB Atlas (already deployed)
**CDN**: Railway/Vercel built-in

### Command Options

#### 1. Deploy Backend (Railway)

**User**: "/phoenix-deploy backend" or "Deploy backend to Railway"

**Your Action**:

**Step 1: Pre-Deployment Checks**
```
BACKEND PRE-DEPLOYMENT CHECKS
==============================

Checking environment...
✓ Node.js version: 18.x
✓ Package.json: Valid
✓ Dependencies: Up to date
✓ Environment variables: [check count] set

Critical env vars:
✓ MONGODB_URI
✓ REDIS_URL
✓ JWT_SECRET
✓ OPENAI_API_KEY
✓ ANTHROPIC_API_KEY
✓ GOOGLE_GEMINI_API_KEY
□ STRIPE_SECRET_KEY (optional)
□ PLAID_CLIENT_ID (optional)
□ TWILIO_ACCOUNT_SID (optional)

Running tests...
✓ Unit tests: 47/47 passed
✓ Integration tests: 23/23 passed
✓ API health check: OK

Database status:
✓ MongoDB Atlas: Connected
✓ Collections: 55 schemas verified
✓ Indexes: Optimized

Ready to deploy? (y/n)
```

**Step 2: Deployment Commands**
```bash
# Navigate to backend
cd /Users/pheonix/Desktop/Phoenix/pal-backend

# Ensure latest code
git status
git pull origin main  # or master

# Install dependencies
npm install --production

# Run build (if applicable)
npm run build

# Railway CLI deployment
railway login
railway link  # Link to existing project
railway up  # Deploy

# Or via Git (Railway auto-deploys)
git add .
git commit -m "Deploy: [version] - [changelog]"
git push railway main
```

**Step 3: Post-Deployment Verification**
```
POST-DEPLOYMENT VERIFICATION
============================

Deployment status:
✓ Railway build: Success
✓ Service started: OK
✓ URL: pal-backend-production.up.railway.app

Testing endpoints:
✓ GET /health: 200 OK
✓ GET /api/auth/me: 401 (correct - needs auth)
✓ POST /api/auth/login: 200 OK (test user)

Database connectivity:
✓ MongoDB: Connected
✓ Redis: Connected

AI Services:
✓ Gemini API: OK
✓ Claude API: OK
✓ OpenAI API: OK

Performance:
✓ Response time: 287ms (target <500ms)
✓ Memory usage: 256MB / 512MB
✓ CPU usage: 12%

Deployment successful!
Backend live at: https://pal-backend-production.up.railway.app
```

**Step 4: Rollback (if needed)**
```
ROLLBACK PROCEDURE
==================

If deployment fails:

1. Railway Dashboard:
   - Go to railway.app
   - Select project
   - Click "Deployments"
   - Find last working deployment
   - Click "Redeploy"

2. Or via CLI:
   railway rollback

3. Or via Git:
   git revert HEAD
   git push railway main

Rollback completes in ~2 minutes.
```

#### 2. Deploy Frontend (Vercel)

**User**: "/phoenix-deploy frontend" or "Deploy frontend to Vercel"

**Your Action**:

**Step 1: Pre-Deployment Checks**
```
FRONTEND PRE-DEPLOYMENT CHECKS
===============================

Checking environment...
✓ Node.js version: 18.x
✓ Package.json: Valid
✓ Dependencies: Up to date

Frontend config:
✓ Capacitor config: Valid
✓ API endpoint: pal-backend-production.up.railway.app
✓ Environment: Production

Building...
✓ npm run build: Success
✓ Build output: /www (2.5MB)
✓ Assets optimized: Yes
✓ Minification: Yes
✓ Source maps: Generated

Ready to deploy? (y/n)
```

**Step 2: Deployment Commands**
```bash
# Navigate to frontend
cd /Users/pheonix/Desktop/phoenix-fe

# Ensure latest code
git status
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or via Vercel CLI (first time setup)
vercel login
vercel  # Preview deployment
vercel --prod  # Production deployment

# Or via Git (Vercel auto-deploys)
git add .
git commit -m "Deploy: [version] - [changelog]"
git push origin main  # Vercel auto-deploys from main branch
```

**Step 3: Post-Deployment Verification**
```
POST-DEPLOYMENT VERIFICATION
============================

Deployment status:
✓ Vercel build: Success
✓ Deployment URL: phoenix-ai.vercel.app

Testing pages:
✓ Home page: Loads
✓ Login page: Loads
✓ Dashboard: Loads (after auth)
✓ All 8 planets: Load correctly

API connectivity:
✓ Backend connection: OK
✓ API calls working: Yes
✓ WebSocket: Connected

Performance:
✓ First Contentful Paint: 1.2s
✓ Time to Interactive: 2.1s
✓ Lighthouse score: 94/100

Assets:
✓ CSS loaded: Yes
✓ JavaScript loaded: Yes
✓ Images optimized: Yes
✓ Fonts loaded: Yes

Deployment successful!
Web app live at: https://phoenix-ai.vercel.app
```

#### 3. Deploy iOS App (App Store)

**User**: "/phoenix-deploy ios" or "Deploy iOS app to App Store"

**Your Action**:

**Step 1: Pre-Deployment Checks**
```
iOS APP PRE-DEPLOYMENT CHECKS
==============================

Checking environment...
✓ Xcode: Version 15.x
✓ macOS: Sonoma or later
✓ Apple Developer Account: Active
✓ Certificates: Valid
✓ Provisioning Profiles: Valid

App configuration:
✓ Bundle ID: com.phoenixai.app
✓ Version: [current version]
✓ Build number: [auto-incremented]
✓ App icons: All sizes present
✓ Launch screen: Configured

Capacitor sync:
✓ Web assets: Built
✓ Native plugins: Synced
✓ iOS project: Updated

App Store Connect:
✓ App record exists
✓ Screenshots: Uploaded (required sizes)
✓ App description: Complete
✓ Privacy policy: URL provided
✓ Age rating: Set

Ready to build and submit? (y/n)
```

**Step 2: Build & Archive**
```bash
# Navigate to frontend
cd /Users/pheonix/Desktop/phoenix-fe

# Build web assets
npm run build

# Sync with Capacitor
npx cap sync ios

# Open Xcode
npx cap open ios

# In Xcode:
# 1. Select "Any iOS Device (arm64)" as destination
# 2. Product → Archive
# 3. Wait for archive to complete (~5-10 min)
# 4. Organizer window opens automatically
```

**Step 3: Upload to App Store Connect**
```
In Xcode Organizer:

1. Select the archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Select "Upload"
5. Configure options:
   ✓ Include bitcode: No (deprecated)
   ✓ Upload symbols: Yes
   ✓ Manage version: Automatically
6. Click "Upload"
7. Wait for processing (~10-30 min)

Upload status:
✓ Binary uploaded
✓ Processing: In progress
✓ Available for testing: ~30 min
✓ Available for review: ~1 hour
```

**Step 4: Submit for Review**
```
In App Store Connect (appstoreconnect.apple.com):

1. Go to "My Apps" → Phoenix
2. Click version number
3. Under "Build", select uploaded build
4. Fill required info:
   ✓ What's New: [Changelog]
   ✓ Screenshots: [Already uploaded]
   ✓ Description: [Already set]
   ✓ Keywords: [Already set]
   ✓ Support URL: [Set]
   ✓ Marketing URL: [Set]
5. Click "Submit for Review"

Review timeline:
- Submission: Immediate
- In Review: 24-48 hours typically
- Approved: Usually 1-3 days
- Live: Within 24 hours of approval

Status: Submitted for review
Check status at: https://appstoreconnect.apple.com
```

**Step 5: TestFlight (Optional)**
```
For beta testing before public release:

1. In App Store Connect:
   - Go to TestFlight tab
   - Select build
   - Add testers or test groups
   - Testers receive email invite

2. TestFlight allows:
   - Up to 10,000 external testers
   - 90-day test period
   - Crash reports
   - User feedback

Recommended: Test with 10-50 users before public release
```

#### 4. Full Stack Deployment

**User**: "/phoenix-deploy all" or "Deploy everything"

**Your Action**: Deploy backend → frontend → iOS in sequence

```
FULL STACK DEPLOYMENT
=====================

This will deploy:
1. Backend to Railway
2. Frontend to Vercel
3. iOS app to App Store (TestFlight)

Estimated time: 45-60 minutes

Proceed? (y/n)

[If yes, run all three deployments sequentially]

Step 1/3: Backend deployment...
[Run backend deployment steps]

Step 2/3: Frontend deployment...
[Run frontend deployment steps]

Step 3/3: iOS deployment...
[Run iOS deployment steps]

DEPLOYMENT SUMMARY
==================
✓ Backend: Live at pal-backend-production.up.railway.app
✓ Frontend: Live at phoenix-ai.vercel.app
✓ iOS: Uploaded to TestFlight, submitted for review

All systems deployed successfully!

Next steps:
- Monitor error rates (first 24 hours)
- Watch performance metrics
- Check user feedback
- Update documentation
```

### Environment Variables

**Critical env vars for deployment**:

**Backend (.env)**:
```bash
# Database
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=...

# Integrations (Optional)
STRIPE_SECRET_KEY=sk_live_...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://phoenix-ai.vercel.app
```

**Frontend (.env)**:
```bash
# API
VITE_API_URL=https://pal-backend-production.up.railway.app
VITE_WS_URL=wss://pal-backend-production.up.railway.app

# Environment
VITE_ENV=production

# Optional
VITE_SENTRY_DSN=...
VITE_ANALYTICS_ID=...
```

### Deployment Checklist

Before deploying, ensure:

```
PRE-DEPLOYMENT CHECKLIST
========================

Code Quality:
□ All tests passing
□ No console.errors in production
□ Code reviewed
□ Changelog updated
□ Version bumped

Security:
□ No API keys in code
□ Environment variables set
□ CORS configured correctly
□ Rate limiting enabled
□ Auth working

Performance:
□ Database indexed
□ Caching enabled
□ Assets minified
□ Images optimized
□ API response times <500ms

Monitoring:
□ Error tracking setup (Sentry)
□ Analytics enabled
□ Logging configured
□ Alerts set up

Documentation:
□ API docs updated
□ README current
□ Changelog complete
□ User guide updated

Rollback Plan:
□ Previous version tagged
□ Rollback procedure tested
□ Database backup recent
□ Team notified
```

### Post-Deployment Monitoring

After deployment, monitor:

```
POST-DEPLOYMENT MONITORING (First 24h)
=======================================

Every 15 minutes (first 4 hours):
- Error rate
- Response times
- CPU/memory usage
- Database connections

Every hour (next 20 hours):
- User complaints
- Crash reports
- Performance degradation
- API errors

Alerts to set:
- Error rate >5%
- Response time >1000ms
- CPU >80%
- Memory >90%
- Database connections >500

If any alerts trigger:
1. Assess severity
2. Rollback if critical
3. Hot-fix if minor
4. Monitor resolution
```

### Deployment Costs

**Current monthly costs** (100K users):
```
INFRASTRUCTURE COSTS
====================

Railway (Backend):
- Base: $20/month
- Usage: ~$80/month
- Total: ~$100/month

Vercel (Frontend):
- Hobby plan: $0/month
- Pro plan: $20/month (recommended)
- Bandwidth: ~$50/month
- Total: ~$70/month

MongoDB Atlas:
- M10 cluster: $57/month
- Storage: Included
- Backups: $10/month
- Total: ~$67/month

Apple Developer:
- Account: $99/year ($8.25/month)

CDN/Other:
- Domain: $2/month
- SSL: Free (Let's Encrypt)
- Monitoring: $10/month

TOTAL FIXED: ~$255/month

Variable (per user):
- AI services: $0.34/user/month
- At 100K users: $34,000/month

TOTAL @ 100K users: ~$34,255/month
Revenue @ 100K users: ~$1,599,200/month

Profit: ~$1,564,945/month (97.9% margin)
```

## Execution

When user runs deploy commands:
1. Check deployment target (backend/frontend/iOS/all)
2. Run pre-deployment checks
3. Execute deployment steps
4. Verify deployment success
5. Provide post-deployment monitoring guide
6. Set up alerts
7. Confirm everything is live

Make deployments smooth, safe, and stress-free.
