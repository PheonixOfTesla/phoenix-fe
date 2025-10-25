// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 PHOENIX API CLIENT - SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════════════════════════════════════════════════
// Purpose: Central API client for all 282 backend endpoints
// Base URL: https://pal-backend-production.up.railway.app/api
// Last Updated: October 25, 2025
// ═══════════════════════════════════════════════════════════════════════════════

class PhoenixAPI {
    constructor() {
        this.baseURL = 'https://pal-backend-production.up.railway.app/api';
        this.token = localStorage.getItem('phoenix_token');
        this.userId = localStorage.getItem('phoenix_user_id');
        this.retryCount = 0;
        this.maxRetries = 3;
        this.cache = new Map();
        this.requestQueue = [];
        this.isRefreshing = false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CORE REQUEST HANDLER
    // ═══════════════════════════════════════════════════════════════════════════

    async request(endpoint, method = 'GET', body = null, options = {}) {
        const {
            skipAuth = false,
            cache = false,
            cacheTTL = 300000, // 5 minutes default
            retry = true
        } = options;

        // Check cache first
        if (cache && method === 'GET') {
            const cached = this.getFromCache(endpoint);
            if (cached) return cached;
        }

        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && !skipAuth ? { 'Authorization': `Bearer ${this.token}` } : {})
            }
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);

            // Handle auth errors
            if (response.status === 401 || response.status === 411) {
                if (retry && this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    await this.refreshToken();
                    return this.request(endpoint, method, body, { ...options, retry: false });
                }
                throw new Error('Authentication failed');
            }

            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || 5;
                await this.sleep(retryAfter * 1000);
                return this.request(endpoint, method, body, options);
            }

            // Handle server errors with retry
            if (response.status >= 500 && retry && this.retryCount < this.maxRetries) {
                this.retryCount++;
                await this.sleep(Math.pow(2, this.retryCount) * 1000); // Exponential backoff
                return this.request(endpoint, method, body, { ...options, retry: false });
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful GET requests
            if (cache && method === 'GET') {
                this.setCache(endpoint, data, cacheTTL);
            }

            this.retryCount = 0; // Reset on success
            return data;

        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTHENTICATION ENDPOINTS (3)
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/auth/login
    // Example: User logs in with email/password
    async login(email, password) {
        const data = await this.request('/auth/login', 'POST', { email, password }, { skipAuth: true });
        this.setAuthToken(data.token, data.user?.id || data.userId);
        return data;
    }

    // POST /api/auth/register
    // Example: New user creates account with email, password, name
    async register(email, password, name) {
        const data = await this.request('/auth/register', 'POST', { email, password, name }, { skipAuth: true });
        this.setAuthToken(data.token, data.user?.id || data.userId);
        return data;
    }

    // GET /api/auth/me
    // Example: Get current user profile on app startup
    async getMe() {
        return this.request('/auth/me', 'GET', null, { cache: true, cacheTTL: 600000 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MERCURY - HEALTH & RECOVERY (44 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────
    // BIOMETRICS (10)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/mercury/biometrics/dexa
    // Example: View DEXA scan results showing body fat %, muscle mass, bone density
    async getDEXAData() {
        return this.request('/mercury/biometrics/dexa', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/composition
    // Example: See body composition breakdown (fat, muscle, water, bone)
    async getBodyComposition() {
        return this.request('/mercury/biometrics/composition', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/metabolic
    // Example: View metabolic rate (BMR, TDEE) for calorie planning
    async getMetabolicRate() {
        return this.request('/mercury/biometrics/metabolic', 'GET', null, { cache: true });
    }

    // POST /api/mercury/biometrics/metabolic/calculate
    // Example: Calculate metabolic rate from height, weight, age, activity level
    async calculateMetabolicRate(data) {
        return this.request('/mercury/biometrics/metabolic/calculate', 'POST', data);
    }

    // GET /api/mercury/biometrics/ratios
    // Example: View health ratios (waist-to-hip, waist-to-height, BMI)
    async getHealthRatios() {
        return this.request('/mercury/biometrics/ratios', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/visceral-fat
    // Example: Check visceral fat levels (dangerous internal fat)
    async getVisceralFat() {
        return this.request('/mercury/biometrics/visceral-fat', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/bone-density
    // Example: View bone mineral density (osteoporosis risk)
    async getBoneDensity() {
        return this.request('/mercury/biometrics/bone-density', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/hydration
    // Example: Check hydration status from body water percentage
    async getHydrationStatus() {
        return this.request('/mercury/biometrics/hydration', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/trends
    // Example: View 30-day trends of all biometric markers
    async getBiometricTrends() {
        return this.request('/mercury/biometrics/trends', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/correlations
    // Example: Discover correlations between biometrics (e.g., sleep affects HRV)
    async getBiometricCorrelations() {
        return this.request('/mercury/biometrics/correlations', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HEART & HRV (4)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/mercury/biometrics/hrv
    // Example: Get current HRV reading (checked every 5 minutes while wearing device)
    async getHRV() {
        return this.request('/mercury/biometrics/hrv');
    }

    // GET /api/mercury/biometrics/hrv/deep-analysis
    // Example: View daily HRV analysis with trends, variability, stress indicators
    async getHRVDeepAnalysis() {
        return this.request('/mercury/biometrics/hrv/deep-analysis', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/heart-rate
    // Example: Get live heart rate (updated every minute)
    async getHeartRate() {
        return this.request('/mercury/biometrics/heart-rate');
    }

    // GET /api/mercury/biometrics/readiness
    // Example: Check readiness score (0-100) to determine training intensity
    async getReadiness() {
        return this.request('/mercury/biometrics/readiness', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SLEEP (3)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/mercury/sleep
    // Example: View last night's sleep data (duration, quality, stages, interruptions)
    async getSleep() {
        return this.request('/mercury/sleep', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/mercury/sleep/analysis
    // Example: Get AI analysis of sleep patterns with improvement recommendations
    async getSleepAnalysis() {
        return this.request('/mercury/sleep/analysis', 'GET', null, { cache: true });
    }

    // GET /api/mercury/sleep/recommendations
    // Example: Receive personalized sleep optimization tips based on data
    async getSleepRecommendations() {
        return this.request('/mercury/sleep/recommendations', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECOVERY (11)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/mercury/recovery/latest
    // Example: Get current recovery score (0-100) updated hourly
    async getLatestRecovery() {
        return this.request('/mercury/recovery/latest', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/mercury/recovery/history
    // Example: View recovery history over past 30 days with trend line
    async getRecoveryHistory() {
        return this.request('/mercury/recovery/history', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/trends
    // Example: Analyze weekly recovery trends to optimize training schedule
    async getRecoveryTrends() {
        return this.request('/mercury/recovery/trends', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/prediction
    // Example: Predict tomorrow's recovery based on today's training + sleep
    async getRecoveryPrediction() {
        return this.request('/mercury/recovery/prediction', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/protocols
    // Example: Get recovery protocol recommendations (ice bath, massage, active recovery)
    async getRecoveryProtocols() {
        return this.request('/mercury/recovery/protocols', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/debt
    // Example: View accumulated recovery debt from consecutive hard training
    async getRecoveryDebt() {
        return this.request('/mercury/recovery/debt', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/overtraining-risk
    // Example: Check overtraining risk percentage based on volume + recovery
    async getOvertrainingRisk() {
        return this.request('/mercury/recovery/overtraining-risk', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/training-load
    // Example: View training load score (acute vs chronic ratio)
    async getTrainingLoad() {
        return this.request('/mercury/recovery/training-load', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/insights
    // Example: Get AI insights on recovery patterns and optimization opportunities
    async getRecoveryInsights() {
        return this.request('/mercury/recovery/insights', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/dashboard
    // Example: Load complete Mercury dashboard with all recovery metrics
    async getRecoveryDashboard() {
        return this.request('/mercury/recovery/dashboard', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // POST /api/mercury/recovery/recalculate
    // Example: Force recalculation of recovery score after manual data entry
    async recalculateRecovery() {
        return this.request('/mercury/recovery/recalculate', 'POST');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEVICE STATUS (5)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/mercury/devices
    // Example: View connected devices (Oura, Whoop, Fitbit, Garmin, Polar) with sync status
    async getDevices() {
        return this.request('/mercury/devices', 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // GET /api/mercury/data
    // Example: Get aggregated wearable data (continuous when device connected)
    async getWearableData() {
        return this.request('/mercury/data');
    }

    // GET /api/mercury/data/raw
    // Example: Access raw device data for advanced analysis
    async getRawDeviceData() {
        return this.request('/mercury/data/raw');
    }

    // POST /api/mercury/data/manual
    // Example: Manually enter health data when no device available (HRV, sleep, etc.)
    async manualDataEntry(data) {
        return this.request('/mercury/data/manual', 'POST', data);
    }

    // GET /api/mercury/insights
    // Example: Get AI-generated health insights from all connected devices
    async getHealthInsights() {
        return this.request('/mercury/insights', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEVICE CONNECTIONS (25) - Managed by wearables.js but defined here
    // ─────────────────────────────────────────────────────────────────────────

    // OURA RING
    async connectOura(authCode) {
        return this.request('/mercury/devices/connect/oura', 'POST', { code: authCode });
    }
    async exchangeOuraToken(code) {
        return this.request('/mercury/devices/exchange-token/oura', 'POST', { code });
    }
    async disconnectOura() {
        return this.request('/mercury/devices/oura', 'DELETE');
    }
    async syncOura() {
        return this.request('/mercury/devices/sync/oura', 'POST');
    }
    async ouraWebhook(data) {
        return this.request('/mercury/webhook/oura', 'POST', data);
    }

    // WHOOP
    async connectWhoop(authCode) {
        return this.request('/mercury/devices/connect/whoop', 'POST', { code: authCode });
    }
    async exchangeWhoopToken(code) {
        return this.request('/mercury/devices/exchange-token/whoop', 'POST', { code });
    }
    async disconnectWhoop() {
        return this.request('/mercury/devices/whoop', 'DELETE');
    }
    async syncWhoop() {
        return this.request('/mercury/devices/sync/whoop', 'POST');
    }
    async whoopWebhook(data) {
        return this.request('/mercury/webhook/whoop', 'POST', data);
    }

    // FITBIT
    async connectFitbit(authCode) {
        return this.request('/mercury/devices/connect/fitbit', 'POST', { code: authCode });
    }
    async exchangeFitbitToken(code) {
        return this.request('/mercury/devices/exchange-token/fitbit', 'POST', { code });
    }
    async disconnectFitbit() {
        return this.request('/mercury/devices/fitbit', 'DELETE');
    }
    async syncFitbit() {
        return this.request('/mercury/devices/sync/fitbit', 'POST');
    }
    async fitbitWebhook(data) {
        return this.request('/mercury/webhook/fitbit', 'POST', data);
    }

    // GARMIN
    async connectGarmin(authCode) {
        return this.request('/mercury/devices/connect/garmin', 'POST', { code: authCode });
    }
    async exchangeGarminToken(code) {
        return this.request('/mercury/devices/exchange-token/garmin', 'POST', { code });
    }
    async disconnectGarmin() {
        return this.request('/mercury/devices/garmin', 'DELETE');
    }
    async syncGarmin() {
        return this.request('/mercury/devices/sync/garmin', 'POST');
    }
    async garminWebhook(data) {
        return this.request('/mercury/webhook/garmin', 'POST', data);
    }

    // POLAR
    async connectPolar(authCode) {
        return this.request('/mercury/devices/connect/polar', 'POST', { code: authCode });
    }
    async exchangePolarToken(code) {
        return this.request('/mercury/devices/exchange-token/polar', 'POST', { code });
    }
    async disconnectPolar() {
        return this.request('/mercury/devices/polar', 'DELETE');
    }
    async syncPolar() {
        return this.request('/mercury/devices/sync/polar', 'POST');
    }
    async polarWebhook(data) {
        return this.request('/mercury/webhook/polar', 'POST', data);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VENUS - FITNESS & NUTRITION (68 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────
    // WORKOUTS (28)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/venus/workouts/start
    // Example: User taps "Start Workout" button to begin leg day
    async startWorkout(workoutData) {
        return this.request('/venus/workouts/start', 'POST', workoutData);
    }

    // POST /api/venus/workouts/:id/exercise
    // Example: Log 3 sets of 225lbs squats for 10 reps each during active workout
    async logExercise(workoutId, exerciseData) {
        return this.request(`/venus/workouts/${workoutId}/exercise`, 'POST', exerciseData);
    }

    // POST /api/venus/workouts/:id/complete
    // Example: User finishes workout, calculate total volume and update recovery
    async completeWorkout(workoutId) {
        return this.request(`/venus/workouts/${workoutId}/complete`, 'POST');
    }

    // GET /api/venus/workouts
    // Example: View workout history for past 30 days with volume trends
    async getWorkouts() {
        return this.request('/venus/workouts', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/active
    // Example: Poll active workout status every 10 seconds for live updates
    async getActiveWorkout() {
        return this.request('/venus/workouts/active');
    }

    // GET /api/venus/workouts/:id
    // Example: View details of specific workout from last Tuesday
    async getWorkout(workoutId) {
        return this.request(`/venus/workouts/${workoutId}`, 'GET', null, { cache: true });
    }

    // DELETE /api/venus/workouts/:id
    // Example: Delete accidentally logged workout from yesterday
    async deleteWorkout(workoutId) {
        return this.request(`/venus/workouts/${workoutId}`, 'DELETE');
    }

    // PUT /api/venus/workouts/:id
    // Example: Edit workout notes or exercise weights after completion
    async updateWorkout(workoutId, updates) {
        return this.request(`/venus/workouts/${workoutId}`, 'PUT', updates);
    }

    // GET /api/venus/workouts/recommendations
    // Example: Get AI workout suggestions based on recovery, past performance, goals
    async getWorkoutRecommendations() {
        return this.request('/venus/workouts/recommendations', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/similar
    // Example: Find similar workouts to compare performance
    async getSimilarWorkouts() {
        return this.request('/venus/workouts/similar', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/templates/library
    // Example: Browse workout template library (push/pull/legs, upper/lower)
    async getWorkoutTemplates() {
        return this.request('/venus/workouts/templates/library', 'GET', null, { cache: true });
    }

    // POST /api/venus/workouts/templates
    // Example: Create custom workout template from today's session
    async createWorkoutTemplate(template) {
        return this.request('/venus/workouts/templates', 'POST', template);
    }

    // POST /api/venus/workouts/form/analyze
    // Example: Upload video for AI form analysis (squat depth, bar path)
    async analyzeForm(videoData) {
        return this.request('/venus/workouts/form/analyze', 'POST', videoData);
    }

    // POST /api/venus/workouts/form/check
    // Example: Real-time form check using phone camera during set
    async checkForm(data) {
        return this.request('/venus/workouts/form/check', 'POST', data);
    }

    // GET /api/venus/workouts/:id/effectiveness
    // Example: Analyze workout effectiveness based on muscle groups, volume, recovery
    async getWorkoutEffectiveness(workoutId) {
        return this.request(`/venus/workouts/${workoutId}/effectiveness`, 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/compare
    // Example: Compare this month's leg day volume vs last month
    async compareWorkouts(params) {
        return this.request('/venus/workouts/compare', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/intensity-zones
    // Example: View training intensity distribution (low/moderate/high volume by week)
    async getIntensityZones() {
        return this.request('/venus/workouts/intensity-zones', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/volume-progression
    // Example: Track weekly volume progression for progressive overload
    async getVolumeProgression() {
        return this.request('/venus/workouts/volume-progression', 'GET', null, { cache: true });
    }

    // POST /api/venus/workouts/deload
    // Example: Schedule deload week after detecting high training stress
    async scheduleDeload(data) {
        return this.request('/venus/workouts/deload', 'POST', data);
    }

    // POST /api/venus/workouts/periodization
    // Example: Create 12-week periodization plan for strength cycle
    async createPeriodization(plan) {
        return this.request('/venus/workouts/periodization', 'POST', plan);
    }

    // POST /api/venus/workouts/quantum
    // Example: Generate quantum workout based on recovery, available equipment, time
    async generateQuantumWorkout(params) {
        return this.request('/venus/workouts/quantum', 'POST', params);
    }

    // GET /api/venus/workouts/quantum/history
    // Example: View history of quantum-generated workouts and their effectiveness
    async getQuantumWorkoutHistory() {
        return this.request('/venus/workouts/quantum/history', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/quantum/effectiveness
    // Example: Analyze effectiveness of quantum workout algorithm
    async getQuantumEffectiveness() {
        return this.request('/venus/workouts/quantum/effectiveness', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/plateau
    // Example: Detect training plateaus and get breakthrough strategies
    async getPlateauAnalysis() {
        return this.request('/venus/workouts/plateau', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/quantum/settings
    // Example: View quantum workout generation settings (chaos level, variety)
    async getQuantumSettings() {
        return this.request('/venus/workouts/quantum/settings', 'GET', null, { cache: true });
    }

    // PUT /api/venus/workouts/quantum/settings
    // Example: Adjust quantum chaos level (more/less exercise variation)
    async updateQuantumSettings(settings) {
        return this.request('/venus/workouts/quantum/settings', 'PUT', settings);
    }

    // GET /api/venus/workouts/quantum/chaos
    // Example: Get current chaos level for quantum generation
    async getQuantumChaos() {
        return this.request('/venus/workouts/quantum/chaos', 'GET', null, { cache: true });
    }

    // POST /api/venus/workouts/quantum/regenerate
    // Example: Regenerate quantum workout if user doesn't like current suggestion
    async regenerateQuantumWorkout(params) {
        return this.request('/venus/workouts/quantum/regenerate', 'POST', params);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXERCISES (10)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/venus/exercises
    // Example: Browse complete exercise library (500+ exercises)
    async getExercises() {
        return this.request('/venus/exercises', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/venus/exercises/:id
    // Example: View exercise details (form cues, muscle groups, equipment needed)
    async getExercise(exerciseId) {
        return this.request(`/venus/exercises/${exerciseId}`, 'GET', null, { cache: true });
    }

    // POST /api/venus/exercises
    // Example: Create custom exercise (cable crossover variation)
    async createExercise(exercise) {
        return this.request('/venus/exercises', 'POST', exercise);
    }

    // GET /api/venus/exercises/recommendations
    // Example: Get exercise recommendations based on available equipment, goals
    async getExerciseRecommendations() {
        return this.request('/venus/exercises/recommendations', 'GET', null, { cache: true });
    }

    // GET /api/venus/exercises/search
    // Example: Search exercises by name, muscle group, or equipment
    async searchExercises(query) {
        return this.request(`/venus/exercises/search?q=${query}`, 'GET', null, { cache: true });
    }

    // GET /api/venus/exercises/:id/alternatives
    // Example: Find alternatives to barbell squat (dumbbell squat, leg press, etc.)
    async getExerciseAlternatives(exerciseId) {
        return this.request(`/venus/exercises/${exerciseId}/alternatives`, 'GET', null, { cache: true });
    }

    // GET /api/venus/exercises/:id/progressive-overload
    // Example: View progressive overload progression for bench press over 12 weeks
    async getProgressiveOverload(exerciseId) {
        return this.request(`/venus/exercises/${exerciseId}/progressive-overload`, 'GET', null, { cache: true });
    }

    // POST /api/venus/exercises/1rm
    // Example: Calculate 1RM from 3 reps at 315lbs
    async calculate1RM(data) {
        return this.request('/venus/exercises/1rm', 'POST', data);
    }

    // GET /api/venus/exercises/strength-standards
    // Example: Compare bench press to strength standards (novice/intermediate/advanced)
    async getStrengthStandards() {
        return this.request('/venus/exercises/strength-standards', 'GET', null, { cache: true });
    }

    // GET /api/venus/exercises/prs
    // Example: View all personal records (PRs) by exercise
    async getPRs() {
        return this.request('/venus/exercises/prs', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NUTRITION (18)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/venus/nutrition/logs
    // Example: Log breakfast (3 eggs, 2 toast, 1 cup coffee) with macros
    async logNutrition(foodData) {
        return this.request('/venus/nutrition/logs', 'POST', foodData);
    }

    // GET /api/venus/nutrition/logs
    // Example: View today's food log with macro breakdown
    async getNutritionLogs(date) {
        return this.request(`/venus/nutrition/logs?date=${date || 'today'}`, 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // PUT /api/venus/nutrition/logs/:id
    // Example: Edit logged meal (forgot to add the protein shake)
    async updateNutritionLog(logId, updates) {
        return this.request(`/venus/nutrition/logs/${logId}`, 'PUT', updates);
    }

    // DELETE /api/venus/nutrition/logs/:id
    // Example: Delete accidentally double-logged snack
    async deleteNutritionLog(logId) {
        return this.request(`/venus/nutrition/logs/${logId}`, 'DELETE');
    }

    // GET /api/venus/nutrition/summary
    // Example: View real-time macro summary (150g protein, 45/210 goal)
    async getNutritionSummary() {
        return this.request('/venus/nutrition/summary');
    }

    // POST /api/venus/nutrition/targets
    // Example: Set macro targets (200g protein, 300g carbs, 70g fat)
    async setNutritionTargets(targets) {
        return this.request('/venus/nutrition/targets', 'POST', targets);
    }

    // GET /api/venus/nutrition/targets/calculate
    // Example: Auto-calculate macros from weight, goal (cut/bulk/maintain), activity
    async calculateNutritionTargets(params) {
        return this.request('/venus/nutrition/targets/calculate', 'GET', null, { cache: true });
    }

    // GET /api/venus/nutrition/insights
    // Example: Get nutrition insights (protein too low, carbs timing optimization)
    async getNutritionInsights() {
        return this.request('/venus/nutrition/insights', 'GET', null, { cache: true });
    }

    // POST /api/venus/nutrition/water
    // Example: Log 16oz water glass
    async logWater(amount) {
        return this.request('/venus/nutrition/water', 'POST', { amount });
    }

    // GET /api/venus/nutrition/water
    // Example: View water intake today (64oz / 100oz goal)
    async getWaterIntake() {
        return this.request('/venus/nutrition/water');
    }

    // POST /api/venus/nutrition/meal-plan
    // Example: Generate 7-day meal plan based on macros, preferences, restrictions
    async generateMealPlan(preferences) {
        return this.request('/venus/nutrition/meal-plan', 'POST', preferences);
    }

    // POST /api/venus/nutrition/analyze-photo
    // Example: Take photo of meal, AI estimates calories and macros
    async analyzePhotoNutrition(photoData) {
        return this.request('/venus/nutrition/analyze-photo', 'POST', photoData);
    }

    // GET /api/venus/nutrition/barcode/:barcode
    // Example: Scan barcode on protein powder, auto-log nutrition info
    async getNutritionByBarcode(barcode) {
        return this.request(`/venus/nutrition/barcode/${barcode}`, 'GET', null, { cache: true });
    }

    // GET /api/venus/nutrition/recipes
    // Example: Browse high-protein recipes that fit macro targets
    async getRecipes() {
        return this.request('/venus/nutrition/recipes', 'GET', null, { cache: true });
    }

    // GET /api/venus/nutrition/meal-prep
    // Example: View saved meal prep plans for the week
    async getMealPrep() {
        return this.request('/venus/nutrition/meal-prep', 'GET', null, { cache: true });
    }

    // POST /api/venus/nutrition/meal-prep
    // Example: Create Sunday meal prep plan (chicken, rice, broccoli x5)
    async createMealPrep(plan) {
        return this.request('/venus/nutrition/meal-prep', 'POST', plan);
    }

    // POST /api/venus/nutrition/restaurant/analyze
    // Example: Input restaurant menu item, estimate macros
    async analyzeRestaurantFood(data) {
        return this.request('/venus/nutrition/restaurant/analyze', 'POST', data);
    }

    // GET /api/venus/nutrition/restaurant/recommendations
    // Example: Find macro-friendly options at nearby restaurants
    async getRestaurantRecommendations(location) {
        return this.request('/venus/nutrition/restaurant/recommendations', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPLEMENTS (4)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/venus/supplements
    // Example: Log morning supplement stack (creatine, omega-3, vitamin D)
    async logSupplement(supplement) {
        return this.request('/venus/supplements', 'POST', supplement);
    }

    // GET /api/venus/supplements
    // Example: View daily supplement schedule and adherence
    async getSupplements() {
        return this.request('/venus/supplements', 'GET', null, { cache: true });
    }

    // POST /api/venus/supplements/interactions
    // Example: Check for interactions between current supplement stack
    async checkSupplementInteractions(supplements) {
        return this.request('/venus/supplements/interactions', 'POST', supplements);
    }

    // POST /api/venus/supplements/stack
    // Example: Create optimal supplement stack based on goals (muscle gain, sleep, etc.)
    async createSupplementStack(goals) {
        return this.request('/venus/supplements/stack', 'POST', goals);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BODY TRACKING (9)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/venus/body/measurements
    // Example: Log weekly body measurements (weight, waist, chest, arms, legs)
    async logBodyMeasurements(measurements) {
        return this.request('/venus/body/measurements', 'POST', measurements);
    }

    // GET /api/venus/body/measurements
    // Example: View body measurement history with trend lines
    async getBodyMeasurements() {
        return this.request('/venus/body/measurements', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/composition
    // Example: View body composition changes over time (muscle up, fat down)
    async getBodyCompositionTracking() {
        return this.request('/venus/body/composition', 'GET', null, { cache: true });
    }

    // POST /api/venus/body/photos
    // Example: Upload weekly progress photo (front, side, back)
    async uploadProgressPhoto(photoData) {
        return this.request('/venus/body/photos', 'POST', photoData);
    }

    // GET /api/venus/body/photos
    // Example: View progress photo timeline over past 12 weeks
    async getProgressPhotos() {
        return this.request('/venus/body/photos', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/photos/compare
    // Example: Compare current photo vs 8 weeks ago side-by-side
    async compareProgressPhotos(date1, date2) {
        return this.request(`/venus/body/photos/compare?date1=${date1}&date2=${date2}`, 'GET', null, { cache: true });
    }

    // GET /api/venus/body/recomp
    // Example: Track body recomposition progress (muscle gain + fat loss simultaneously)
    async getRecompProgress() {
        return this.request('/venus/body/recomp', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/symmetry
    // Example: Analyze muscle symmetry (left arm vs right arm development)
    async getBodySymmetry() {
        return this.request('/venus/body/symmetry', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/fat-distribution
    // Example: View fat distribution pattern (android vs gynoid)
    async getFatDistribution() {
        return this.request('/venus/body/fat-distribution', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PERFORMANCE (7)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/venus/performance/tests
    // Example: Record performance test (vertical jump, 40-yard dash, max pull-ups)
    async createPerformanceTest(test) {
        return this.request('/venus/performance/tests', 'POST', test);
    }

    // POST /api/venus/performance/tests/:id/results
    // Example: Log performance test results
    async logPerformanceResults(testId, results) {
        return this.request(`/venus/performance/tests/${testId}/results`, 'POST', results);
    }

    // GET /api/venus/performance/tests
    // Example: View all performance test history and progressions
    async getPerformanceTests() {
        return this.request('/venus/performance/tests', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/benchmarks
    // Example: Compare performance to benchmarks (athlete vs average person)
    async getPerformanceBenchmarks() {
        return this.request('/venus/performance/benchmarks', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/strength-standards
    // Example: See where strength lifts rank (novice/intermediate/advanced/elite)
    async getPerformanceStrengthStandards() {
        return this.request('/venus/performance/strength-standards', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/percentile
    // Example: View percentile ranking for age/gender (top 10% in deadlift)
    async getPerformancePercentile() {
        return this.request('/venus/performance/percentile', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/predictions
    // Example: Predict future performance based on current trajectory
    async getPerformancePredictions() {
        return this.request('/venus/performance/predictions', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SOCIAL (6)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/venus/social/feed
    // Example: View social feed of friends' workouts and achievements
    async getSocialFeed() {
        return this.request('/venus/social/feed', 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // POST /api/venus/social/share/:id
    // Example: Share workout achievement to social feed
    async shareWorkout(workoutId) {
        return this.request(`/venus/social/share/${workoutId}`, 'POST');
    }

    // GET /api/venus/challenges
    // Example: Browse active fitness challenges (30-day squat challenge)
    async getChallenges() {
        return this.request('/venus/challenges', 'GET', null, { cache: true });
    }

    // POST /api/venus/challenges/:id/join
    // Example: Join "100 Push-ups Daily" challenge
    async joinChallenge(challengeId) {
        return this.request(`/venus/challenges/${challengeId}/join`, 'POST');
    }

    // GET /api/venus/social/friends
    // Example: View fitness friends list
    async getFriends() {
        return this.request('/venus/social/friends', 'GET', null, { cache: true });
    }

    // POST /api/venus/social/friends/:userId
    // Example: Send friend request to another Phoenix user
    async addFriend(userId) {
        return this.request(`/venus/social/friends/${userId}`, 'POST');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INJURY (6)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/venus/injury/risk
    // Example: Check injury risk based on training volume, recovery, form issues
    async getInjuryRisk() {
        return this.request('/venus/injury/risk', 'GET', null, { cache: true });
    }

    // GET /api/venus/injury/history
    // Example: View injury history and recovery timelines
    async getInjuryHistory() {
        return this.request('/venus/injury/history', 'GET', null, { cache: true });
    }

    // POST /api/venus/injury/report
    // Example: Report new injury (right knee pain during squats)
    async reportInjury(injury) {
        return this.request('/venus/injury/report', 'POST', injury);
    }

    // GET /api/venus/injury/prevention
    // Example: Get injury prevention strategies (mobility work, volume management)
    async getInjuryPrevention() {
        return this.request('/venus/injury/prevention', 'GET', null, { cache: true });
    }

    // GET /api/venus/injury/rehab
    // Example: Get rehab protocols for current injury
    async getInjuryRehab() {
        return this.request('/venus/injury/rehab', 'GET', null, { cache: true });
    }

    // GET /api/venus/training/optimal-window
    // Example: Find optimal training window based on recovery and injury status
    async getOptimalTrainingWindow() {
        return this.request('/venus/training/optimal-window', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EARTH - CALENDAR & TIME (11 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────
    // CALENDAR (7)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/earth/calendar/connect/:provider
    // Example: Connect Google Calendar or Outlook to sync events
    async connectCalendar(provider) {
        return this.request(`/earth/calendar/connect/${provider}`);
    }

    // GET /api/earth/calendar/events
    // Example: View today's calendar events with energy recommendations
    async getCalendarEvents(date) {
        return this.request(`/earth/calendar/events?date=${date || 'today'}`, 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // POST /api/earth/calendar/events
    // Example: Add new calendar event "Team Meeting 2-3pm"
    async createCalendarEvent(event) {
        return this.request('/earth/calendar/events', 'POST', event);
    }

    // GET /api/earth/calendar/energy-map
    // Example: View energy level overlay on calendar (high energy = morning meetings)
    async getEnergyMap() {
        return this.request('/earth/calendar/energy-map', 'GET', null, { cache: true });
    }

    // GET /api/earth/calendar/conflicts
    // Example: Detect scheduling conflicts or back-to-back meetings
    async getCalendarConflicts() {
        return this.request('/earth/calendar/conflicts');
    }

    // POST /api/earth/calendar/sync
    // Example: Manually trigger calendar sync (runs automatically every hour)
    async syncCalendar() {
        return this.request('/earth/calendar/sync', 'POST');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENERGY (4)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/earth/energy/pattern
    // Example: View energy pattern analysis (morning person vs night owl)
    async getEnergyPattern() {
        return this.request('/earth/energy/pattern', 'GET', null, { cache: true });
    }

    // POST /api/earth/energy/log
    // Example: Log current energy level (1-10 scale) for pattern detection
    async logEnergy(level) {
        return this.request('/earth/energy/log', 'POST', { level });
    }

    // GET /api/earth/energy/optimal-times
    // Example: Find optimal times for focused work, workouts, creative tasks
    async getOptimalTimes() {
        return this.request('/earth/energy/optimal-times', 'GET', null, { cache: true });
    }

    // GET /api/earth/energy/prediction
    // Example: Predict energy levels for rest of day based on sleep, recovery, schedule
    async getEnergyPrediction() {
        return this.request('/earth/energy/prediction', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MARS - GOALS & HABITS (21 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────
    // GOALS (10)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/mars/goals
    // Example: Create new goal "Run a marathon in under 4 hours by December"
    async createGoal(goal) {
        return this.request('/mars/goals', 'POST', goal);
    }

    // GET /api/mars/goals
    // Example: View all active goals with progress percentages
    async getGoals() {
        return this.request('/mars/goals', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // GET /api/mars/goals/:id
    // Example: View specific goal details, milestones, and timeline
    async getGoal(goalId) {
        return this.request(`/mars/goals/${goalId}`, 'GET', null, { cache: true });
    }

    // PUT /api/mars/goals/:id
    // Example: Update goal target date or metrics
    async updateGoal(goalId, updates) {
        return this.request(`/mars/goals/${goalId}`, 'PUT', updates);
    }

    // DELETE /api/mars/goals/:id
    // Example: Delete abandoned goal
    async deleteGoal(goalId) {
        return this.request(`/mars/goals/${goalId}`, 'DELETE');
    }

    // POST /api/mars/goals/:id/complete
    // Example: Mark goal as complete (hit the marathon time!)
    async completeGoal(goalId) {
        return this.request(`/mars/goals/${goalId}/complete`, 'POST');
    }

    // POST /api/mars/goals/smart
    // Example: Generate SMART goal from vague idea "get stronger" → specific metrics
    async generateSMARTGoal(idea) {
        return this.request('/mars/goals/smart', 'POST', { idea });
    }

    // GET /api/mars/goals/suggestions
    // Example: Get AI goal suggestions based on current fitness, habits, interests
    async getGoalSuggestions() {
        return this.request('/mars/goals/suggestions', 'GET', null, { cache: true });
    }

    // GET /api/mars/goals/templates
    // Example: Browse goal templates (weight loss, muscle gain, run 5K, etc.)
    async getGoalTemplates() {
        return this.request('/mars/goals/templates', 'GET', null, { cache: true });
    }

    // GET /api/mars/goals/:id/progress
    // Example: View detailed progress breakdown for marathon training goal
    async getGoalProgress(goalId) {
        return this.request(`/mars/goals/${goalId}/progress`, 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROGRESS (4)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/mars/goals/:id/progress
    // Example: Log progress "Ran 10 miles this week" for marathon goal
    async logGoalProgress(goalId, progress) {
        return this.request(`/mars/goals/${goalId}/progress`, 'POST', progress);
    }

    // GET /api/mars/progress/velocity
    // Example: View progress velocity (on track, ahead of schedule, behind schedule)
    async getProgressVelocity() {
        return this.request('/mars/progress/velocity', 'GET', null, { cache: true });
    }

    // GET /api/mars/progress/predictions
    // Example: Predict goal completion date based on current velocity
    async getProgressPredictions() {
        return this.request('/mars/progress/predictions', 'GET', null, { cache: true });
    }

    // GET /api/mars/progress/bottlenecks
    // Example: Identify bottlenecks preventing goal progress (low consistency, time, etc.)
    async getProgressBottlenecks() {
        return this.request('/mars/progress/bottlenecks', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MILESTONES (2)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/mars/goals/:id/milestones
    // Example: Add milestone "Run 15 miles without stopping" to marathon goal
    async createMilestone(goalId, milestone) {
        return this.request(`/mars/goals/${goalId}/milestones`, 'POST', milestone);
    }

    // POST /api/mars/goals/:gId/milestones/:mId/complete
    // Example: Mark milestone complete with celebration animation
    async completeMilestone(goalId, milestoneId) {
        return this.request(`/mars/goals/${goalId}/milestones/${milestoneId}/complete`, 'POST');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HABITS (2)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/mars/habits
    // Example: Create daily habit "30 minutes reading" with streak tracking
    async createHabit(habit) {
        return this.request('/mars/habits', 'POST', habit);
    }

    // POST /api/mars/habits/:id/log
    // Example: Log today's habit completion (✓ read for 30 minutes)
    async logHabit(habitId, data) {
        return this.request(`/mars/habits/${habitId}/log`, 'POST', data);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOTIVATION (3)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/mars/motivation/interventions
    // Example: Get motivation boost when progress slows (inspiring quote, visual reminder)
    async getMotivationInterventions() {
        return this.request('/mars/motivation/interventions', 'GET', null, { cache: true });
    }

    // POST /api/mars/motivation/boost/:id
    // Example: Manually trigger motivation boost for specific goal
    async triggerMotivationBoost(goalId) {
        return this.request(`/mars/motivation/boost/${goalId}`, 'POST');
    }

    // GET /api/mars/motivation/settings
    // Example: Configure motivation intervention frequency and style
    async getMotivationSettings() {
        return this.request('/mars/motivation/settings', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // JUPITER - FINANCE & WEALTH (18 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────
    // ACCOUNTS (7)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/jupiter/link-token
    // Example: Initialize Plaid connection to link bank account
    async getPlaidLinkToken() {
        return this.request('/jupiter/link-token', 'POST');
    }

    // POST /api/jupiter/exchange-token
    // Example: Exchange Plaid public token for access token after successful link
    async exchangePlaidToken(publicToken) {
        return this.request('/jupiter/exchange-token', 'POST', { publicToken });
    }

    // GET /api/jupiter/accounts
    // Example: View all connected bank accounts with current balances
    async getAccounts() {
        return this.request('/jupiter/accounts', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // DELETE /api/jupiter/account/:id
    // Example: Disconnect specific bank account
    async deleteAccount(accountId) {
        return this.request(`/jupiter/account/${accountId}`, 'DELETE');
    }

    // POST /api/jupiter/account/:id/sync
    // Example: Manually sync account transactions (auto-syncs daily)
    async syncAccount(accountId) {
        return this.request(`/jupiter/account/${accountId}/sync`, 'POST');
    }

    // GET /api/jupiter/account/:id/balance
    // Example: Get current balance for specific account
    async getAccountBalance(accountId) {
        return this.request(`/jupiter/account/${accountId}/balance`, 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // GET /api/jupiter/account/:id
    // Example: View account details, type, institution
    async getAccount(accountId) {
        return this.request(`/jupiter/account/${accountId}`, 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRANSACTIONS (6)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/jupiter/transactions
    // Example: View all recent transactions across all accounts
    async getTransactions() {
        return this.request('/jupiter/transactions', 'GET', null, { cache: true, cacheTTL: 180000 });
    }

    // GET /api/jupiter/transactions/date-range
    // Example: Get transactions from last month for budgeting review
    async getTransactionsByDateRange(startDate, endDate) {
        return this.request(`/jupiter/transactions/date-range?start=${startDate}&end=${endDate}`, 'GET', null, { cache: true });
    }

    // GET /api/jupiter/transactions/category/:category
    // Example: View all "Food & Dining" transactions this month
    async getTransactionsByCategory(category) {
        return this.request(`/jupiter/transactions/category/${category}`, 'GET', null, { cache: true });
    }

    // PUT /api/jupiter/transactions/:id/category
    // Example: Recategorize transaction from "Other" to "Entertainment"
    async updateTransactionCategory(transactionId, category) {
        return this.request(`/jupiter/transactions/${transactionId}/category`, 'PUT', { category });
    }

    // GET /api/jupiter/transactions/recurring
    // Example: Identify recurring transactions (subscriptions, bills)
    async getRecurringTransactions() {
        return this.request('/jupiter/transactions/recurring', 'GET', null, { cache: true });
    }

    // GET /api/jupiter/spending-patterns
    // Example: Analyze spending patterns (stress-spending correlation, day-of-week trends)
    async getSpendingPatterns() {
        return this.request('/jupiter/spending-patterns', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BUDGETS (5)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/jupiter/budgets
    // Example: Create budget "$500/month for dining out"
    async createBudget(budget) {
        return this.request('/jupiter/budgets', 'POST', budget);
    }

    // GET /api/jupiter/budgets
    // Example: View all budgets with current spending vs limits
    async getBudgets() {
        return this.request('/jupiter/budgets', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // PUT /api/jupiter/budgets/:id
    // Example: Update budget limit or category
    async updateBudget(budgetId, updates) {
        return this.request(`/jupiter/budgets/${budgetId}`, 'PUT', updates);
    }

    // DELETE /api/jupiter/budgets/:id
    // Example: Delete unused budget category
    async deleteBudget(budgetId) {
        return this.request(`/jupiter/budgets/${budgetId}`, 'DELETE');
    }

    // GET /api/jupiter/budgets/alerts
    // Example: Check for budget alerts (80% spent, over budget)
    async getBudgetAlerts() {
        return this.request('/jupiter/budgets/alerts', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/jupiter/stress-correlation
    // Example: Discover correlation between stress levels and spending (stress shopping)
    async getStressSpendingCorrelation() {
        return this.request('/jupiter/stress-correlation', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SATURN - LEGACY & VISION (12 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────
    // VISION (5)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/saturn/vision
    // Example: Create life vision statement and 10-year goals
    async createVision(vision) {
        return this.request('/saturn/vision', 'POST', vision);
    }

    // GET /api/saturn/vision
    // Example: View life vision board and long-term aspirations
    async getVision() {
        return this.request('/saturn/vision', 'GET', null, { cache: true });
    }

    // PUT /api/saturn/vision/areas
    // Example: Update life areas (health, wealth, relationships, purpose, etc.)
    async updateVisionAreas(areas) {
        return this.request('/saturn/vision/areas', 'PUT', areas);
    }

    // POST /api/saturn/vision/legacy
    // Example: Define legacy goal "What do you want to be remembered for?"
    async createLegacyGoal(legacy) {
        return this.request('/saturn/vision/legacy', 'POST', legacy);
    }

    // PUT /api/saturn/vision/reviewed
    // Example: Mark vision as reviewed (quarterly reminder to reflect)
    async markVisionReviewed() {
        return this.request('/saturn/vision/reviewed', 'PUT');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MORTALITY (1)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/saturn/mortality
    // Example: View mortality awareness metrics (life expectancy, time remaining)
    async getMortalityAwareness() {
        return this.request('/saturn/mortality', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUARTERLY REVIEWS (6)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/saturn/quarterly
    // Example: Create Q1 2025 quarterly review (wins, lessons, Q2 focus)
    async createQuarterlyReview(review) {
        return this.request('/saturn/quarterly', 'POST', review);
    }

    // GET /api/saturn/quarterly
    // Example: View all quarterly reviews timeline
    async getQuarterlyReviews() {
        return this.request('/saturn/quarterly', 'GET', null, { cache: true });
    }

    // GET /api/saturn/quarterly/latest
    // Example: View most recent quarterly review
    async getLatestQuarterlyReview() {
        return this.request('/saturn/quarterly/latest', 'GET', null, { cache: true });
    }

    // PUT /api/saturn/quarterly/:id
    // Example: Edit quarterly review after reflection
    async updateQuarterlyReview(reviewId, updates) {
        return this.request(`/saturn/quarterly/${reviewId}`, 'PUT', updates);
    }

    // GET /api/saturn/quarterly/trend
    // Example: View life satisfaction trend across quarters
    async getQuarterlyTrend() {
        return this.request('/saturn/quarterly/trend', 'GET', null, { cache: true });
    }

    // GET /api/saturn/quarterly/compare/:q1/:q2
    // Example: Compare Q1 vs Q4 to see yearly progress
    async compareQuarters(quarter1, quarter2) {
        return this.request(`/saturn/quarterly/compare/${quarter1}/${quarter2}`, 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHOENIX - AI & INTELLIGENCE (58 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────────────
    // COMPANION CHAT (6)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/phoenix/companion/chat
    // Example: Send message "What's my recovery score today?" and get AI response
    async chat(message, context = null) {
        return this.request('/phoenix/companion/chat', 'POST', { message, context });
    }

    // GET /api/phoenix/companion/history
    // Example: Load chat history for context continuity
    async getChatHistory() {
        return this.request('/phoenix/companion/history', 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // DELETE /api/phoenix/companion/history
    // Example: Clear chat history (start fresh conversation)
    async clearChatHistory() {
        return this.request('/phoenix/companion/history', 'DELETE');
    }

    // GET /api/phoenix/companion/context
    // Example: Build AI context from all planetary systems (health, fitness, goals, etc.)
    async getCompanionContext() {
        return this.request('/phoenix/companion/context', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // GET /api/phoenix/companion/personality
    // Example: Load current AI personality (JARVIS, Samantha, Coach, etc.)
    async getPersonality() {
        return this.request('/phoenix/companion/personality', 'GET', null, { cache: true });
    }

    // PUT /api/phoenix/companion/personality
    // Example: Change AI personality to "Drill Sergeant" for motivation
    async updatePersonality(personality) {
        return this.request('/phoenix/companion/personality', 'PUT', personality);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATTERNS (5)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/phoenix/patterns
    // Example: View all discovered patterns (sleep affects HRV, stress increases spending)
    async getPatterns() {
        return this.request('/phoenix/patterns', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/patterns/analyze
    // Example: Run hourly pattern analysis across all data domains
    async analyzePatterns() {
        return this.request('/phoenix/patterns/analyze', 'POST');
    }

    // GET /api/phoenix/patterns/realtime
    // Example: Stream real-time pattern detection as new data arrives
    async getRealtimePatterns() {
        return this.request('/phoenix/patterns/realtime');
    }

    // POST /api/phoenix/patterns/:id/validate
    // Example: User confirms pattern is accurate (reinforcement learning)
    async validatePattern(patternId, isValid) {
        return this.request(`/phoenix/patterns/${patternId}/validate`, 'POST', { isValid });
    }

    // DELETE /api/phoenix/patterns/:id
    // Example: Remove false positive pattern
    async deletePattern(patternId) {
        return this.request(`/phoenix/patterns/${patternId}`, 'DELETE');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PREDICTIONS (11)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/phoenix/insights
    // Example: Get daily AI insights and recommendations
    async getInsights() {
        return this.request('/phoenix/insights', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/phoenix/predictions
    // Example: View all active predictions (recovery, weight change, goal completion)
    async getPredictions() {
        return this.request('/phoenix/predictions', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/active
    // Example: Get currently relevant predictions (today's recovery, burnout risk)
    async getActivePredictions() {
        return this.request('/phoenix/predictions/active', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/phoenix/predictions/:id
    // Example: View specific prediction details and confidence level
    async getPrediction(predictionId) {
        return this.request(`/phoenix/predictions/${predictionId}`, 'GET', null, { cache: true });
    }

    // POST /api/phoenix/predictions/request
    // Example: Request custom prediction "Will I hit my goal by June?"
    async requestPrediction(predictionType, parameters) {
        return this.request('/phoenix/predictions/request', 'POST', { predictionType, parameters });
    }

    // POST /api/phoenix/predictions/:id/outcome
    // Example: Record actual outcome to improve prediction accuracy
    async recordPredictionOutcome(predictionId, actualOutcome) {
        return this.request(`/phoenix/predictions/${predictionId}/outcome`, 'POST', { actualOutcome });
    }

    // GET /api/phoenix/predictions/accuracy
    // Example: Track prediction model accuracy over time
    async getPredictionAccuracy() {
        return this.request('/phoenix/predictions/accuracy', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/forecast
    // Example: Get 7-day forecast of recovery, energy, optimal training windows
    async getForecast() {
        return this.request('/phoenix/predictions/forecast', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/optimal-window
    // Example: Find optimal window for important tasks based on predicted energy
    async getOptimalWindow(taskType) {
        return this.request(`/phoenix/predictions/optimal-window?type=${taskType}`, 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/burnout-risk
    // Example: Check burnout risk percentage based on training, sleep, stress
    async getBurnoutRisk() {
        return this.request('/phoenix/predictions/burnout-risk', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/weight-change
    // Example: Predict weight trajectory based on current diet, exercise patterns
    async getWeightChangePrediction() {
        return this.request('/phoenix/predictions/weight-change', 'GET', null, { cache: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERVENTIONS (9)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/phoenix/interventions
    // Example: View all past interventions and their outcomes
    async getInterventions() {
        return this.request('/phoenix/interventions', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/interventions/active
    // Example: Check every 5 minutes for active intervention alerts
    async getActiveInterventions() {
        return this.request('/phoenix/interventions/active', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // GET /api/phoenix/interventions/pending
    // Example: Get pending interventions waiting for user action
    async getPendingInterventions() {
        return this.request('/phoenix/interventions/pending', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // POST /api/phoenix/interventions/:id/acknowledge
    // Example: User acknowledges intervention notification
    async acknowledgeIntervention(interventionId) {
        return this.request(`/phoenix/interventions/${interventionId}/acknowledge`, 'POST');
    }

    // POST /api/phoenix/interventions/:id/outcome
    // Example: Record whether user followed intervention advice (learning)
    async recordInterventionOutcome(interventionId, followed, helpful) {
        return this.request(`/phoenix/interventions/${interventionId}/outcome`, 'POST', { followed, helpful });
    }

    // GET /api/phoenix/interventions/stats
    // Example: View intervention effectiveness statistics
    async getInterventionStats() {
        return this.request('/phoenix/interventions/stats', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/interventions/history
    // Example: Browse intervention history with outcomes
    async getInterventionHistory() {
        return this.request('/phoenix/interventions/history', 'GET', null, { cache: true });
    }

    // PUT /api/phoenix/interventions/config
    // Example: Configure intervention settings (frequency, types, urgency levels)
    async updateInterventionConfig(config) {
        return this.request('/phoenix/interventions/config', 'PUT', config);
    }

    // POST /api/phoenix/interventions/manual
    // Example: Manually trigger intervention check
    async triggerManualIntervention() {
        return this.request('/phoenix/interventions/manual', 'POST');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTELLIGENCE (8)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/phoenix/intelligence
    // Example: View AI intelligence dashboard with all insights
    async getIntelligenceDashboard() {
        return this.request('/phoenix/intelligence', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/intelligence/analyze
    // Example: Run hourly deep analysis across all systems
    async runIntelligenceAnalysis() {
        return this.request('/phoenix/intelligence/analyze', 'POST');
    }

    // GET /api/phoenix/intelligence/insights
    // Example: Get AI-generated insights from latest analysis
    async getIntelligenceInsights() {
        return this.request('/phoenix/intelligence/insights', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/intelligence/query
    // Example: Ask natural language question "Why am I so tired lately?"
    async queryIntelligence(question) {
        return this.request('/phoenix/intelligence/query', 'POST', { question });
    }

    // GET /api/phoenix/intelligence/summary
    // Example: Get daily summary of all activity, patterns, recommendations
    async getDailySummary() {
        return this.request('/phoenix/intelligence/summary', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // POST /api/phoenix/intelligence/deep-dive
    // Example: Request deep-dive analysis on specific topic "sleep quality decline"
    async requestDeepDive(topic) {
        return this.request('/phoenix/intelligence/deep-dive', 'POST', { topic });
    }

    // GET /api/phoenix/intelligence/recommendations
    // Example: Get daily AI recommendations for optimization
    async getRecommendations() {
        return this.request('/phoenix/intelligence/recommendations', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/intelligence/auto-optimize
    // Example: Let AI automatically optimize schedule, training, nutrition
    async runAutoOptimize() {
        return this.request('/phoenix/intelligence/auto-optimize', 'POST');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BUTLER COORDINATION (19)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/phoenix/butler/reservations
    // Example: Voice command "Make reservation at Nobu for 7pm tonight, party of 4"
    async makeReservation(data) {
        return this.request('/phoenix/butler/reservations', 'POST', data);
    }

    // GET /api/phoenix/butler/reservations
    // Example: View reservation history and upcoming bookings
    async getReservations() {
        return this.request('/phoenix/butler/reservations', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/food
    // Example: "Order Thai food from Sukhothai, my usual order"
    async orderFood(data) {
        return this.request('/phoenix/butler/food', 'POST', data);
    }

    // GET /api/phoenix/butler/food/history
    // Example: View food order history with favorite restaurants
    async getFoodOrderHistory() {
        return this.request('/phoenix/butler/food/history', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/food/:id/reorder
    // Example: "Reorder my last DoorDash order"
    async reorderFood(orderId) {
        return this.request(`/phoenix/butler/food/${orderId}/reorder`, 'POST');
    }

    // POST /api/phoenix/butler/rides
    // Example: "Book me an Uber to the airport"
    async bookRide(data) {
        return this.request('/phoenix/butler/rides', 'POST', data);
    }

    // GET /api/phoenix/butler/rides
    // Example: View ride booking history
    async getRideHistory() {
        return this.request('/phoenix/butler/rides', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/calls
    // Example: "Call Mom"
    async makeCall(data) {
        return this.request('/phoenix/butler/calls', 'POST', data);
    }

    // GET /api/phoenix/butler/calls
    // Example: View call history
    async getCallHistory() {
        return this.request('/phoenix/butler/calls', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/emails
    // Example: "Send email to John about meeting tomorrow"
    async sendEmail(data) {
        return this.request('/phoenix/butler/emails', 'POST', data);
    }

    // GET /api/phoenix/butler/emails
    // Example: View email management history
    async getEmailHistory() {
        return this.request('/phoenix/butler/emails', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/emails/:id/reply
    // Example: "Reply to Sarah's email saying I'll be there"
    async replyToEmail(emailId, reply) {
        return this.request(`/phoenix/butler/emails/${emailId}/reply`, 'POST', { reply });
    }

    // POST /api/phoenix/butler/calendar
    // Example: "Add meeting to calendar at 2pm today"
    async manageCalendar(action, data) {
        return this.request('/phoenix/butler/calendar', 'POST', { action, ...data });
    }

    // POST /api/phoenix/butler/calendar/optimize
    // Example: Run daily calendar optimization (move meetings to optimal energy windows)
    async optimizeCalendar() {
        return this.request('/phoenix/butler/calendar/optimize', 'POST');
    }

    // POST /api/phoenix/butler/web/search
    // Example: "Search the web for best protein powder 2025"
    async webSearch(query) {
        return this.request('/phoenix/butler/web/search', 'POST', { query });
    }

    // POST /api/phoenix/butler/web/task
    // Example: "Find cheapest flight to NYC next week"
    async webTask(task) {
        return this.request('/phoenix/butler/web/task', 'POST', { task });
    }

    // POST /api/phoenix/butler/summarize
    // Example: "Summarize this article [URL]"
    async summarizeContent(url) {
        return this.request('/phoenix/butler/summarize', 'POST', { url });
    }

    // POST /api/phoenix/butler/summarize/batch
    // Example: Summarize multiple articles or documents
    async summarizeBatch(urls) {
        return this.request('/phoenix/butler/summarize/batch', 'POST', { urls });
    }

    // POST /api/phoenix/butler/automations
    // Example: Create automation "Order dinner when low energy + 7pm"
    async createAutomation(automation) {
        return this.request('/phoenix/butler/automations', 'POST', automation);
    }

    // GET /api/phoenix/butler/automations
    // Example: View all active automations
    async getAutomations() {
        return this.request('/phoenix/butler/automations', 'GET', null, { cache: true });
    }

    // DELETE /api/phoenix/butler/automations/:id
    // Example: Delete automation that's no longer needed
    async deleteAutomation(automationId) {
        return this.request(`/phoenix/butler/automations/${automationId}`, 'DELETE');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VOICE (4)
    // ─────────────────────────────────────────────────────────────────────────

    // POST /api/phoenix/voice/session
    // Example: Start voice session when user presses mic button
    async startVoiceSession(voiceSettings) {
        return this.request('/phoenix/voice/session', 'POST', voiceSettings);
    }

    // DELETE /api/phoenix/voice/session
    // Example: End voice session when user closes voice interface
    async endVoiceSession() {
        return this.request('/phoenix/voice/session', 'DELETE');
    }

    // GET /api/phoenix/voice/transcriptions
    // Example: View voice transcription history
    async getVoiceTranscriptions() {
        return this.request('/phoenix/voice/transcriptions', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/voice/history
    // Example: View past voice sessions and commands
    async getVoiceHistory() {
        return this.request('/phoenix/voice/history', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // USER MANAGEMENT (9 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/user/profile
    // Example: Load user profile with preferences, settings, metrics
    async getUserProfile() {
        return this.request('/user/profile', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // PUT /api/user/profile
    // Example: Update profile (name, age, timezone, units of measurement)
    async updateUserProfile(updates) {
        return this.request('/user/profile', 'PUT', updates);
    }

    // GET /api/user/settings
    // Example: Load user settings (notifications, privacy, display preferences)
    async getUserSettings() {
        return this.request('/user/settings', 'GET', null, { cache: true });
    }

    // PUT /api/user/settings
    // Example: Update settings (enable notifications, change theme)
    async updateUserSettings(settings) {
        return this.request('/user/settings', 'PUT', settings);
    }

    // GET /api/user/preferences
    // Example: Load preferences (units, language, AI personality)
    async getUserPreferences() {
        return this.request('/user/preferences', 'GET', null, { cache: true });
    }

    // PUT /api/user/preferences
    // Example: Update preferences (switch to metric, change language to Spanish)
    async updateUserPreferences(preferences) {
        return this.request('/user/preferences', 'PUT', preferences);
    }

    // POST /api/user/avatar
    // Example: Upload new profile avatar image
    async uploadAvatar(imageData) {
        return this.request('/user/avatar', 'POST', imageData);
    }

    // DELETE /api/user/account
    // Example: Delete user account (with confirmation)
    async deleteUserAccount(confirmation) {
        return this.request('/user/account', 'DELETE', { confirmation });
    }

    // POST /api/user/export
    // Example: Export all user data (GDPR compliance)
    async exportUserData() {
        return this.request('/user/export', 'POST');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUBSCRIPTION & BILLING (5 ENDPOINTS)
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/subscription/status
    // Example: Check current subscription status (Free/Pro/Elite)
    async getSubscriptionStatus() {
        return this.request('/subscription/status', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // POST /api/subscription/checkout
    // Example: Start subscription checkout flow (Stripe)
    async startCheckout(plan) {
        return this.request('/subscription/checkout', 'POST', { plan });
    }

    // POST /api/subscription/cancel
    // Example: Cancel subscription (keeps access until period ends)
    async cancelSubscription() {
        return this.request('/subscription/cancel', 'POST');
    }

    // PUT /api/subscription/update
    // Example: Update subscription (upgrade/downgrade plan)
    async updateSubscription(newPlan) {
        return this.request('/subscription/update', 'PUT', { plan: newPlan });
    }

    // GET /api/subscription/billing-history
    // Example: View billing history and invoices
    async getBillingHistory() {
        return this.request('/subscription/billing-history', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    setAuthToken(token, userId) {
        this.token = token;
        this.userId = userId;
        localStorage.setItem('phoenix_token', token);
        localStorage.setItem('phoenix_user_id', userId);
    }

    async refreshToken() {
        if (this.isRefreshing) {
            return new Promise(resolve => {
                this.requestQueue.push(resolve);
            });
        }

        this.isRefreshing = true;

        try {
            // Try to get new token
            const data = await this.request('/auth/refresh', 'POST', null, { skipAuth: false });
            this.setAuthToken(data.token, this.userId);

            // Process queued requests
            this.requestQueue.forEach(resolve => resolve());
            this.requestQueue = [];

            this.isRefreshing = false;
            return true;
        } catch (error) {
            // Token refresh failed, logout user
            this.logout();
            this.isRefreshing = false;
            throw error;
        }
    }

    async logout() {
        try {
            await this.request('/auth/logout', 'POST');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('phoenix_token');
            localStorage.removeItem('phoenix_user_id');
            this.token = null;
            this.userId = null;
            this.cache.clear();
        }
    }

    // Cache management
    setCache(key, data, ttl) {
        this.cache.set(key, {
            data,
            expires: Date.now() + ttl
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    clearCache() {
        this.cache.clear();
    }

    // Sleep utility for retry logic
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZE & EXPORT
// ═══════════════════════════════════════════════════════════════════════════

// Create singleton instance
const API = new PhoenixAPI();

// Auto-initialize on page load
(function() {
    console.log('🔥 Phoenix API Client Initialized');
    console.log(`📡 Base URL: ${API.baseURL}`);
    console.log(`🔐 Authenticated: ${!!API.token}`);
    console.log(`👤 User ID: ${API.userId || 'Not logged in'}`);
    console.log('✅ All 282 endpoints loaded');
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.API = API;
    window.PhoenixAPI = PhoenixAPI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, PhoenixAPI };
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
/*
✅ AUTH: 3 endpoints
✅ MERCURY (Health & Recovery): 44 endpoints
   - Biometrics: 10
   - Heart & HRV: 4
   - Sleep: 3
   - Recovery: 11
   - Devices: 5
   - Device Connections: 25 (5 providers × 5 operations)

✅ VENUS (Fitness & Nutrition): 68 endpoints
   - Workouts: 28
   - Exercises: 10
   - Nutrition: 18
   - Supplements: 4
   - Body Tracking: 9
   - Performance: 7
   - Social: 6
   - Injury: 6

✅ EARTH (Calendar & Time): 11 endpoints
   - Calendar: 7
   - Energy: 4

✅ MARS (Goals & Habits): 21 endpoints
   - Goals: 10
   - Progress: 4
   - Milestones: 2
   - Habits: 2
   - Motivation: 3

✅ JUPITER (Finance): 18 endpoints
   - Accounts: 7
   - Transactions: 6
   - Budgets: 5

✅ SATURN (Legacy & Vision): 12 endpoints
   - Vision: 5
   - Mortality: 1
   - Quarterly Reviews: 6

✅ PHOENIX (AI & Intelligence): 58 endpoints
   - Companion Chat: 6
   - Patterns: 5
   - Predictions: 11
   - Interventions: 9
   - Intelligence: 8
   - Butler: 19
   - Voice: 4

✅ USER MANAGEMENT: 9 endpoints
✅ SUBSCRIPTION: 5 endpoints

TOTAL: 282 ENDPOINTS ✓
*/
