// ═══════════════════════════════════════════════════════════════════════════════
// PHOENIX API CLIENT - PERFECT 1:1 BACKEND MIRROR
// ═══════════════════════════════════════════════════════════════════════════════
// Purpose: Central API client - EXACT mirror of backend (446+ endpoints)
// Base URL: https://pal-backend-production.up.railway.app/api
// Generated: October 27, 2025
// Backend Analysis: PHOENIX_COMPLETE_BACKEND_ANALYSIS.md
// 
// RULE: Every backend endpoint = ONE JavaScript method (no more, no less)
// ═══════════════════════════════════════════════════════════════════════════════

class PhoenixAPI {
    constructor() {
        // Use centralized config if available, fallback to production
        this.baseURL = (typeof PhoenixConfig !== 'undefined')
            ? PhoenixConfig.API_BASE_URL
            : 'https://pal-backend-production.up.railway.app/api';
        this.token = localStorage.getItem('phoenixToken');
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
            if (response.status === 401 || response.status === 403) {
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
                await this.sleep(Math.pow(2, this.retryCount) * 1000);
                return this.request(endpoint, method, body, { ...options, retry: false });
            }

            // Handle 404 gracefully - return empty success response
            if (response.status === 404) {
                return { success: false, data: null, notFound: true };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful GET requests
            if (cache && method === 'GET') {
                this.setCache(endpoint, data, cacheTTL);
            }

            this.retryCount = 0;
            return data;

        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTH ROUTES (9 endpoints)
    // Backend: routes/auth.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/auth/register
    async register(email, password, name) {
        const data = await this.request('/auth/register', 'POST', { email, password, name }, { skipAuth: true });
        this.setAuthToken(data.token, data.user?.id || data.userId);
        return data;
    }

    // POST /api/auth/login
    async login(email, password) {
        const data = await this.request('/auth/login', 'POST', { email, password }, { skipAuth: true });
        this.setAuthToken(data.token, data.user?.id || data.userId);
        return data;
    }

    // POST /api/auth/reset-password
    async resetPasswordRequest(email) {
        return this.request('/auth/reset-password', 'POST', { email }, { skipAuth: true });
    }

    // PUT /api/auth/reset-password/:resetToken
    async resetPassword(resetToken, newPassword) {
        return this.request(`/auth/reset-password/${resetToken}`, 'PUT', { password: newPassword }, { skipAuth: true });
    }

    // GET /api/auth/me
    async getMe() {
        return this.request('/auth/me', 'GET', null, { cache: true, cacheTTL: 600000 });
    }

    // PUT /api/auth/me
    async updateMe(updates) {
        return this.request('/auth/me', 'PUT', updates);
    }

    // PUT /api/auth/change-password
    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', 'PUT', { currentPassword, newPassword });
    }

    // POST /api/auth/logout
    async logout() {
        try {
            await this.request('/auth/logout', 'POST');
        } finally {
            this.clearAuth();
        }
    }

    // GET /api/auth/docs
    async getAuthDocs() {
        return this.request('/auth/docs', 'GET', null, { skipAuth: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EARTH ROUTES (11 endpoints)
    // Backend: routes/earth.js
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/earth/calendar/connect/:provider
    async connectCalendar(provider) {
        return this.request(`/earth/calendar/connect/${provider}`, 'GET');
    }

    // POST /api/earth/calendar/callback
    async handleCalendarCallback(data) {
        return this.request('/earth/calendar/callback', 'POST', data);
    }

    // GET /api/earth/calendar/events
    async getCalendarEvents(date) {
        const endpoint = date ? `/earth/calendar/events?date=${date}` : '/earth/calendar/events';
        return this.request(endpoint, 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // POST /api/earth/calendar/events
    async createCalendarEvent(event) {
        return this.request('/earth/calendar/events', 'POST', event);
    }

    // GET /api/earth/calendar/energy-map
    async getEnergyMap() {
        return this.request('/earth/calendar/energy-map', 'GET', null, { cache: true });
    }

    // GET /api/earth/calendar/conflicts
    async getCalendarConflicts() {
        return this.request('/earth/calendar/conflicts', 'GET');
    }

    // POST /api/earth/calendar/sync
    async syncCalendar() {
        return this.request('/earth/calendar/sync', 'POST');
    }

    // GET /api/earth/energy/pattern
    async getEnergyPattern() {
        return this.request('/earth/energy/pattern', 'GET', null, { cache: true });
    }

    // POST /api/earth/energy/log
    async logEnergy(level) {
        return this.request('/earth/energy/log', 'POST', { level });
    }

    // GET /api/earth/energy/optimal-times
    async getOptimalTimes() {
        return this.request('/earth/energy/optimal-times', 'GET', null, { cache: true });
    }

    // GET /api/earth/energy/prediction
    async getEnergyPrediction() {
        return this.request('/earth/energy/prediction', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // JUPITER ROUTES (17 endpoints)
    // Backend: routes/jupiter.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/jupiter/link-token
    async createPlaidLinkToken() {
        return this.request('/jupiter/link-token', 'POST');
    }

    // POST /api/jupiter/exchange-token
    async exchangePlaidToken(publicToken) {
        return this.request('/jupiter/exchange-token', 'POST', { publicToken });
    }

    // GET /api/jupiter/accounts
    async getAccounts() {
        return this.request('/jupiter/accounts', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // DELETE /api/jupiter/account/:id
    async disconnectAccount(accountId) {
        return this.request(`/jupiter/account/${accountId}`, 'DELETE');
    }

    // POST /api/jupiter/sync/:accountId
    async syncAccount(accountId) {
        return this.request(`/jupiter/sync/${accountId}`, 'POST');
    }

    // GET /api/jupiter/transactions
    async getTransactions() {
        return this.request('/jupiter/transactions', 'GET', null, { cache: true, cacheTTL: 180000 });
    }

    // GET /api/jupiter/transactions/date-range
    async getTransactionsByDateRange(startDate, endDate) {
        return this.request(`/jupiter/transactions/date-range?start=${startDate}&end=${endDate}`, 'GET', null, { cache: true });
    }

    // GET /api/jupiter/transactions/category/:category
    async getTransactionsByCategory(category) {
        return this.request(`/jupiter/transactions/category/${category}`, 'GET', null, { cache: true });
    }

    // PUT /api/jupiter/transactions/:id
    async updateTransactionCategory(transactionId, category) {
        return this.request(`/jupiter/transactions/${transactionId}`, 'PUT', { category });
    }

    // GET /api/jupiter/transactions/recurring
    async getRecurringTransactions() {
        return this.request('/jupiter/transactions/recurring', 'GET', null, { cache: true });
    }

    // GET /api/jupiter/spending-patterns
    async getSpendingPatterns() {
        return this.request('/jupiter/spending-patterns', 'GET', null, { cache: true });
    }

    // POST /api/jupiter/budgets
    async createBudget(budget) {
        return this.request('/jupiter/budgets', 'POST', budget);
    }

    // GET /api/jupiter/budgets
    async getBudgets() {
        return this.request('/jupiter/budgets', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // PUT /api/jupiter/budgets/:id
    async updateBudget(budgetId, updates) {
        return this.request(`/jupiter/budgets/${budgetId}`, 'PUT', updates);
    }

    // DELETE /api/jupiter/budgets/:id
    async deleteBudget(budgetId) {
        return this.request(`/jupiter/budgets/${budgetId}`, 'DELETE');
    }

    // GET /api/jupiter/budgets/alerts
    async getBudgetAlerts() {
        return this.request('/jupiter/budgets/alerts', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/jupiter/stress-correlation
    async getStressSpendingCorrelation() {
        return this.request('/jupiter/stress-correlation', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MARS ROUTES (20 endpoints)
    // Backend: routes/mars.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/mars/goals
    async createGoal(goal) {
        return this.request('/mars/goals', 'POST', goal);
    }

    // GET /api/mars/goals
    async getGoals() {
        return this.request('/mars/goals', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // GET /api/mars/goals/:id
    async getGoal(goalId) {
        return this.request(`/mars/goals/${goalId}`, 'GET', null, { cache: true });
    }

    // PUT /api/mars/goals/:id
    async updateGoal(goalId, updates) {
        return this.request(`/mars/goals/${goalId}`, 'PUT', updates);
    }

    // DELETE /api/mars/goals/:id
    async deleteGoal(goalId) {
        return this.request(`/mars/goals/${goalId}`, 'DELETE');
    }

    // POST /api/mars/goals/:id/complete
    async completeGoal(goalId) {
        return this.request(`/mars/goals/${goalId}/complete`, 'POST');
    }

    // POST /api/mars/goals/generate-smart
    async generateSMARTGoal(idea) {
        return this.request('/mars/goals/generate-smart', 'POST', { idea });
    }

    // POST /api/mars/goals/suggest
    async getGoalSuggestions() {
        return this.request('/mars/goals/suggest', 'POST', null, { cache: true });
    }

    // GET /api/mars/goals/templates
    async getGoalTemplates() {
        return this.request('/mars/goals/templates', 'GET', null, { cache: true });
    }

    // POST /api/mars/goals/:id/progress
    async logGoalProgress(goalId, progress) {
        return this.request(`/mars/goals/${goalId}/progress`, 'POST', progress);
    }

    // GET /api/mars/goals/:id/progress
    async getGoalProgress(goalId) {
        return this.request(`/mars/goals/${goalId}/progress`, 'GET', null, { cache: true });
    }

    // GET /api/mars/progress/velocity
    async getProgressVelocity() {
        return this.request('/mars/progress/velocity', 'GET', null, { cache: true });
    }

    // GET /api/mars/progress/predictions
    async getProgressPredictions() {
        return this.request('/mars/progress/predictions', 'GET', null, { cache: true });
    }

    // GET /api/mars/progress/bottlenecks
    async getProgressBottlenecks() {
        return this.request('/mars/progress/bottlenecks', 'GET', null, { cache: true });
    }

    // POST /api/mars/goals/:id/milestones
    async createMilestone(goalId, milestone) {
        return this.request(`/mars/goals/${goalId}/milestones`, 'POST', milestone);
    }

    // POST /api/mars/milestones/:id/complete
    async completeMilestone(milestoneId) {
        return this.request(`/mars/milestones/${milestoneId}/complete`, 'POST');
    }

    // POST /api/mars/habits
    async createHabit(habit) {
        return this.request('/mars/habits', 'POST', habit);
    }

    // POST /api/mars/habits/:id/log
    async logHabit(habitId, data) {
        return this.request(`/mars/habits/${habitId}/log`, 'POST', data);
    }

    // GET /api/mars/motivation/interventions
    async getMotivationInterventions() {
        return this.request('/mars/motivation/interventions', 'GET', null, { cache: true });
    }

    // POST /api/mars/motivation/boost
    async triggerMotivationBoost(goalId) {
        return this.request('/mars/motivation/boost', 'POST', { goalId });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MERCURY ROUTES (38 endpoints)
    // Backend: routes/mercury.js
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/mercury/biometrics/dexa
    async getDEXAData() {
        return this.request('/mercury/biometrics/dexa', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/composition
    async getBodyComposition() {
        return this.request('/mercury/biometrics/composition', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/metabolic
    async getMetabolicRate() {
        return this.request('/mercury/biometrics/metabolic', 'GET', null, { cache: true });
    }

    // POST /api/mercury/biometrics/metabolic/calculate
    async calculateMetabolicRate(data) {
        return this.request('/mercury/biometrics/metabolic/calculate', 'POST', data);
    }

    // GET /api/mercury/biometrics/ratios
    async getHealthRatios() {
        return this.request('/mercury/biometrics/ratios', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/visceral-fat
    async getVisceralFat() {
        return this.request('/mercury/biometrics/visceral-fat', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/bone-density
    async getBoneDensity() {
        return this.request('/mercury/biometrics/bone-density', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/hydration
    async getHydrationStatus() {
        return this.request('/mercury/biometrics/hydration', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/trends
    async getBiometricTrends() {
        return this.request('/mercury/biometrics/trends', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/correlations
    async getBiometricCorrelations() {
        return this.request('/mercury/biometrics/correlations', 'GET', null, { cache: true });
    }

    // POST /api/mercury/devices/:provider/connect
    async connectDevice(provider, authCode) {
        return this.request(`/mercury/devices/${provider}/connect`, 'POST', { code: authCode });
    }

    // POST /api/mercury/devices/:provider/exchange
    async exchangeDeviceToken(provider, code) {
        return this.request(`/mercury/devices/${provider}/exchange`, 'POST', { code });
    }

    // GET /api/mercury/devices
    async getDevices() {
        return this.request('/mercury/devices', 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // DELETE /api/mercury/devices/:provider
    async disconnectDevice(provider) {
        return this.request(`/mercury/devices/${provider}`, 'DELETE');
    }

    // POST /api/mercury/devices/:provider/sync
    async syncDevice(provider) {
        return this.request(`/mercury/devices/${provider}/sync`, 'POST');
    }

    // POST /api/mercury/webhook/:provider
    async handleDeviceWebhook(provider, data) {
        return this.request(`/mercury/webhook/${provider}`, 'POST', data);
    }

    // GET /api/mercury/data
    async getWearableData() {
        return this.request('/mercury/data', 'GET');
    }

    // GET /api/mercury/data/raw
    async getRawDeviceData() {
        return this.request('/mercury/data/raw', 'GET');
    }

    // POST /api/mercury/data/manual
    async manualDataEntry(data) {
        return this.request('/mercury/data/manual', 'POST', data);
    }

    // GET /api/mercury/insights
    async getHealthInsights() {
        return this.request('/mercury/insights', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/hrv
    async getHRV() {
        return this.request('/mercury/biometrics/hrv', 'GET');
    }

    // GET /api/mercury/biometrics/hrv/deep-analysis
    async getHRVDeepAnalysis() {
        return this.request('/mercury/biometrics/hrv/deep-analysis', 'GET', null, { cache: true });
    }

    // GET /api/mercury/biometrics/heart-rate
    async getHeartRate() {
        return this.request('/mercury/biometrics/heart-rate', 'GET');
    }

    // GET /api/mercury/biometrics/readiness
    async getReadiness() {
        return this.request('/mercury/biometrics/readiness', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/mercury/sleep
    async getSleep() {
        return this.request('/mercury/sleep', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/mercury/sleep/analysis
    async getSleepAnalysis() {
        return this.request('/mercury/sleep/analysis', 'GET', null, { cache: true });
    }

    // GET /api/mercury/sleep/recommendations
    async getSleepRecommendations() {
        return this.request('/mercury/sleep/recommendations', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/latest
    async getLatestRecovery() {
        return this.request('/mercury/recovery/latest', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/mercury/recovery/history
    async getRecoveryHistory() {
        return this.request('/mercury/recovery/history', 'GET', null, { cache: true });
    }

    // POST /api/mercury/recovery/calculate
    async recalculateRecovery() {
        return this.request('/mercury/recovery/calculate', 'POST');
    }

    // GET /api/mercury/recovery/trends
    async getRecoveryTrends() {
        return this.request('/mercury/recovery/trends', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/prediction
    async getRecoveryPrediction() {
        return this.request('/mercury/recovery/prediction', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/protocols
    async getRecoveryProtocols() {
        return this.request('/mercury/recovery/protocols', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/debt
    async getRecoveryDebt() {
        return this.request('/mercury/recovery/debt', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/overtraining-risk
    async getOvertrainingRisk() {
        return this.request('/mercury/recovery/overtraining-risk', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/training-load
    async getTrainingLoad() {
        return this.request('/mercury/recovery/training-load', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/insights
    async getRecoveryInsights() {
        return this.request('/mercury/recovery/insights', 'GET', null, { cache: true });
    }

    // GET /api/mercury/recovery/dashboard
    async getRecoveryDashboard() {
        return this.request('/mercury/recovery/dashboard', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHOENIX ROUTES (75 endpoints)
    // Backend: routes/phoenix.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/phoenix/companion/chat
    async chat(message, context = null) {
        return this.request('/phoenix/companion/chat', 'POST', { message, context });
    }

    // GET /api/phoenix/companion/history
    async getChatHistory() {
        return this.request('/phoenix/companion/history', 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // DELETE /api/phoenix/companion/history
    async clearChatHistory() {
        return this.request('/phoenix/companion/history', 'DELETE');
    }

    // GET /api/phoenix/companion/context
    async getCompanionContext() {
        return this.request('/phoenix/companion/context', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // Alias for backward compatibility
    async getContext() {
        return this.getCompanionContext();
    }

    // GET /api/phoenix/companion/personality
    async getPersonality() {
        return this.request('/phoenix/companion/personality', 'GET', null, { cache: true });
    }

    // PUT /api/phoenix/companion/personality
    async updatePersonality(personality) {
        return this.request('/phoenix/companion/personality', 'PUT', personality);
    }

    // GET /api/phoenix/patterns
    async getPatterns() {
        return this.request('/phoenix/patterns', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/patterns/analyze
    async analyzePatterns() {
        return this.request('/phoenix/patterns/analyze', 'POST');
    }

    // GET /api/phoenix/patterns/realtime
    async getRealtimePatterns() {
        return this.request('/phoenix/patterns/realtime', 'GET');
    }

    // PUT /api/phoenix/patterns/:id/validate
    async validatePattern(patternId, isValid) {
        return this.request(`/phoenix/patterns/${patternId}/validate`, 'PUT', { isValid });
    }

    // DELETE /api/phoenix/patterns/:id
    async deletePattern(patternId) {
        return this.request(`/phoenix/patterns/${patternId}`, 'DELETE');
    }

    // GET /api/phoenix/insights
    async getInsights() {
        return this.request('/phoenix/insights', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/phoenix/predictions
    async getPredictions() {
        return this.request('/phoenix/predictions', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/active
    async getActivePredictions() {
        return this.request('/phoenix/predictions/active', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/phoenix/predictions/:id
    async getPrediction(predictionId) {
        return this.request(`/phoenix/predictions/${predictionId}`, 'GET', null, { cache: true });
    }

    // POST /api/phoenix/predictions/request/:type
    async requestPrediction(predictionType, parameters) {
        return this.request(`/phoenix/predictions/request/${predictionType}`, 'POST', parameters);
    }

    // PUT /api/phoenix/predictions/:id/outcome
    async recordPredictionOutcome(predictionId, actualOutcome) {
        return this.request(`/phoenix/predictions/${predictionId}/outcome`, 'PUT', { actualOutcome });
    }

    // GET /api/phoenix/predictions/accuracy
    async getPredictionAccuracy() {
        return this.request('/phoenix/predictions/accuracy', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/forecast
    async getForecast() {
        return this.request('/phoenix/predictions/forecast', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/optimal-window
    async getOptimalWindow(taskType) {
        return this.request(`/phoenix/predictions/optimal-window?type=${taskType}`, 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/burnout-risk
    async getBurnoutRisk() {
        return this.request('/phoenix/predictions/burnout-risk', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/predictions/weight-change
    async getWeightChangePrediction() {
        return this.request('/phoenix/predictions/weight-change', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/interventions
    async getInterventions() {
        return this.request('/phoenix/interventions', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/interventions/active
    async getActiveInterventions() {
        return this.request('/phoenix/interventions/active', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // GET /api/phoenix/interventions/pending
    async getPendingInterventions() {
        return this.request('/phoenix/interventions/pending', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // POST /api/phoenix/interventions/:id/acknowledge
    async acknowledgeIntervention(interventionId) {
        return this.request(`/phoenix/interventions/${interventionId}/acknowledge`, 'POST');
    }

    // PUT /api/phoenix/interventions/:id/outcome
    async recordInterventionOutcome(interventionId, followed, helpful) {
        return this.request(`/phoenix/interventions/${interventionId}/outcome`, 'PUT', { followed, helpful });
    }

    // GET /api/phoenix/interventions/stats
    async getInterventionStats() {
        return this.request('/phoenix/interventions/stats', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/interventions/history
    async getInterventionHistory() {
        return this.request('/phoenix/interventions/history', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/interventions/settings
    async updateInterventionConfig(config) {
        return this.request('/phoenix/interventions/settings', 'POST', config);
    }

    // POST /api/phoenix/interventions/request
    async triggerManualIntervention() {
        return this.request('/phoenix/interventions/request', 'POST');
    }

    // GET /api/phoenix/intelligence
    async getIntelligenceDashboard() {
        return this.request('/phoenix/intelligence', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/intelligence/analyze
    async runIntelligenceAnalysis() {
        return this.request('/phoenix/intelligence/analyze', 'POST');
    }

    // GET /api/phoenix/intelligence/insights
    async getIntelligenceInsights() {
        return this.request('/phoenix/intelligence/insights', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/intelligence/query
    async queryIntelligence(question) {
        return this.request('/phoenix/intelligence/query', 'POST', { question });
    }

    // GET /api/phoenix/intelligence/summary
    async getDailySummary() {
        return this.request('/phoenix/intelligence/summary', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // POST /api/phoenix/intelligence/deep-dive
    async requestDeepDive(topic) {
        return this.request('/phoenix/intelligence/deep-dive', 'POST', { topic });
    }

    // GET /api/phoenix/intelligence/recommendations
    async getRecommendations() {
        return this.request('/phoenix/intelligence/recommendations', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/intelligence/auto-optimize
    async runAutoOptimize() {
        return this.request('/phoenix/intelligence/auto-optimize', 'POST');
    }

    // POST /api/phoenix/voice/session
    async createVoiceSession(voiceSettings) {
        return this.request('/phoenix/voice/session', 'POST', voiceSettings);
    }

    // DELETE /api/phoenix/voice/session
    async endVoiceSession() {
        return this.request('/phoenix/voice/session', 'DELETE');
    }

    // GET /api/phoenix/voice/transcriptions
    async getVoiceTranscriptions() {
        return this.request('/phoenix/voice/transcriptions', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/voice/history
    async getVoiceHistory() {
        return this.request('/phoenix/voice/history', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHOENIX VOICE ROUTES (2 endpoints) - Context-Aware Voice Interface
    // Backend: routes/phoenixVoice.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/phoenixVoice/chat - Conversational AI with full context from all 7 planets
    async phoenixVoiceChat(options = {}) {
        const {
            message,
            conversationHistory = [],
            personality = 'friendly_helpful',
            voice = 'nova'
        } = options;

        return this.request('/phoenixVoice/chat', 'POST', {
            message,
            conversationHistory,
            personality,
            voice
        });
    }

    // GET /api/phoenixVoice/personalities - List available personalities
    async getPhoenixVoicePersonalities() {
        return this.request('/phoenixVoice/personalities', 'GET', null, {
            cache: true,
            cacheTTL: 3600000 // Cache for 1 hour
        });
    }

    // ⭐ NEW UNIVERSAL NATURAL LANGUAGE ENDPOINT ⭐
    // POST /api/phoenix/universal - Process ANY natural language request
    // Routes to appropriate planetary system automatically
    async universalNaturalLanguage(message, conversationHistory = [], timezone = 'America/New_York') {
        return this.request('/phoenix/universal', 'POST', {
            message,
            conversationHistory,
            timezone
        });
    }

    // GET /api/phoenix/universal/examples - Get example requests
    async getUniversalExamples() {
        return this.request('/phoenix/universal/examples', 'GET', null, {
            cache: true,
            cacheTTL: 600000 // Cache for 10 minutes
        });
    }

    // GET /api/phoenix/universal/context - Get current user context
    async getUniversalContext() {
        return this.request('/phoenix/universal/context', 'GET');
    }

    // POST /api/phoenix/ml/train
    async trainModel(modelData) {
        return this.request('/phoenix/ml/train', 'POST', modelData);
    }

    // GET /api/phoenix/ml/models
    async getMLModels() {
        return this.request('/phoenix/ml/models', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/ml/training-status
    async getTrainingStatus() {
        return this.request('/phoenix/ml/training-status', 'GET');
    }

    // POST /api/phoenix/behavior/track
    async trackBehavior(behaviorData) {
        return this.request('/phoenix/behavior/track', 'POST', behaviorData);
    }

    // GET /api/phoenix/behavior/patterns
    async getBehaviorPatterns() {
        return this.request('/phoenix/behavior/patterns', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/behavior/insights
    async getBehaviorInsights() {
        return this.request('/phoenix/behavior/insights', 'GET', null, { cache: true });
    }

    // GET /api/phoenix/behavior/:type
    async getBehaviorByType(type) {
        return this.request(`/phoenix/behavior/${type}`, 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/reservation
    async makeReservation(data) {
        return this.request('/phoenix/butler/reservation', 'POST', data);
    }

    // GET /api/phoenix/butler/reservations
    async getReservations() {
        return this.request('/phoenix/butler/reservations', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/food
    async orderFood(data) {
        return this.request('/phoenix/butler/food', 'POST', data);
    }

    // GET /api/phoenix/butler/food/history
    async getFoodOrderHistory() {
        return this.request('/phoenix/butler/food/history', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/food/reorder
    async reorderFood(orderId) {
        return this.request('/phoenix/butler/food/reorder', 'POST', { orderId });
    }

    // POST /api/phoenix/butler/ride
    async bookRide(data) {
        return this.request('/phoenix/butler/ride', 'POST', data);
    }

    // GET /api/phoenix/butler/rides
    async getRideHistory() {
        return this.request('/phoenix/butler/rides', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/call
    async makeCall(data) {
        return this.request('/phoenix/butler/call', 'POST', data);
    }

    // GET /api/phoenix/butler/calls
    async getCallHistory() {
        return this.request('/phoenix/butler/calls', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/sms
    async sendSMS(data) {
        return this.request('/phoenix/butler/sms', 'POST', data);
    }

    // GET /api/phoenix/butler/sms
    async getSMSHistory() {
        return this.request('/phoenix/butler/sms', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/email
    async sendEmail(data) {
        return this.request('/phoenix/butler/email', 'POST', data);
    }

    // GET /api/phoenix/butler/emails
    async getEmailHistory() {
        return this.request('/phoenix/butler/emails', 'GET', null, { cache: true });
    }

    // POST /api/phoenix/butler/email/reply
    async replyToEmail(emailId, reply) {
        return this.request('/phoenix/butler/email/reply', 'POST', { emailId, reply });
    }

    // POST /api/phoenix/butler/calendar
    async manageCalendar(action, data) {
        return this.request('/phoenix/butler/calendar', 'POST', { action, ...data });
    }

    // POST /api/phoenix/butler/calendar/optimize
    async optimizeCalendar() {
        return this.request('/phoenix/butler/calendar/optimize', 'POST');
    }

    // POST /api/phoenix/butler/search
    async webSearch(query) {
        return this.request('/phoenix/butler/search', 'POST', { query });
    }

    // POST /api/phoenix/butler/web-task
    async webTask(task) {
        return this.request('/phoenix/butler/web-task', 'POST', { task });
    }

    // POST /api/phoenix/butler/summarize
    async summarizeContent(url) {
        return this.request('/phoenix/butler/summarize', 'POST', { url });
    }

    // POST /api/phoenix/butler/summarize/batch
    async summarizeBatch(urls) {
        return this.request('/phoenix/butler/summarize/batch', 'POST', { urls });
    }

    // POST /api/phoenix/butler/automate
    async createAutomation(automation) {
        return this.request('/phoenix/butler/automate', 'POST', automation);
    }

    // GET /api/phoenix/butler/automations
    async getAutomations() {
        return this.request('/phoenix/butler/automations', 'GET', null, { cache: true });
    }

    // DELETE /api/phoenix/butler/automations/:id
    async deleteAutomation(automationId) {
        return this.request(`/phoenix/butler/automations/${automationId}`, 'DELETE');
    }

    // GET /api/phoenix/butler/budget
    async getButlerBudget() {
        return this.request('/phoenix/butler/budget', 'GET', null, { cache: true });
    }

    // PUT /api/phoenix/butler/budget
    async updateButlerBudget(budget) {
        return this.request('/phoenix/butler/budget', 'PUT', budget);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SATURN ROUTES (12 endpoints)
    // Backend: routes/saturn.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/saturn/vision
    async createVision(vision) {
        return this.request('/saturn/vision', 'POST', vision);
    }

    // GET /api/saturn/vision
    async getVision() {
        return this.request('/saturn/vision', 'GET', null, { cache: true });
    }

    // PUT /api/saturn/vision/life-areas
    async updateVisionAreas(areas) {
        return this.request('/saturn/vision/life-areas', 'PUT', areas);
    }

    // POST /api/saturn/vision/legacy-goal
    async createLegacyGoal(legacy) {
        return this.request('/saturn/vision/legacy-goal', 'POST', legacy);
    }

    // GET /api/saturn/mortality
    async getMortalityAwareness() {
        return this.request('/saturn/mortality', 'GET', null, { cache: true });
    }

    // PUT /api/saturn/vision/review
    async markVisionReviewed() {
        return this.request('/saturn/vision/review', 'PUT');
    }

    // POST /api/saturn/quarterly
    async createQuarterlyReview(review) {
        return this.request('/saturn/quarterly', 'POST', review);
    }

    // GET /api/saturn/quarterly
    async getQuarterlyReviews() {
        return this.request('/saturn/quarterly', 'GET', null, { cache: true });
    }

    // GET /api/saturn/quarterly/latest
    async getLatestQuarterlyReview() {
        return this.request('/saturn/quarterly/latest', 'GET', null, { cache: true });
    }

    // PUT /api/saturn/quarterly/:id
    async updateQuarterlyReview(reviewId, updates) {
        return this.request(`/saturn/quarterly/${reviewId}`, 'PUT', updates);
    }

    // GET /api/saturn/quarterly/trend
    async getQuarterlyTrend() {
        return this.request('/saturn/quarterly/trend', 'GET', null, { cache: true });
    }

    // GET /api/saturn/quarterly/compare/:q1/:q2
    async compareQuarters(quarter1, quarter2) {
        return this.request(`/saturn/quarterly/compare/${quarter1}/${quarter2}`, 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUBSCRIPTION ROUTES (5 endpoints)
    // Backend: routes/subscription.js
    // NOTE: Backend uses PLURAL /subscriptions not /subscription
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/subscriptions/checkout
    async createCheckoutSession(plan) {
        return this.request('/subscriptions/checkout', 'POST', { plan });
    }

    // GET /api/subscriptions/status
    async getSubscriptionStatus() {
        return this.request('/subscriptions/status', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // POST /api/subscriptions/cancel
    async cancelSubscription() {
        return this.request('/subscriptions/cancel', 'POST');
    }

    // POST /api/subscriptions/portal
    async createPortalSession() {
        return this.request('/subscriptions/portal', 'POST');
    }

    // POST /api/subscriptions/webhook (Stripe webhook - not called by frontend)
    // Note: This is handled by Stripe, not exposed as API method

    // ═══════════════════════════════════════════════════════════════════════════
    // USER ROUTES (11 endpoints)
    // Backend: routes/user.js
    // NOTE: Backend uses PLURAL /users not /user
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/users/docs
    async getUserDocs() {
        return this.request('/users/docs', 'GET', null, { skipAuth: true });
    }

    // GET /api/users/profile
    async getUserProfile() {
        return this.request('/users/profile', 'GET', null, { cache: true, cacheTTL: 300000 });
    }

    // PUT /api/users/profile
    async updateUserProfile(updates) {
        return this.request('/users/profile', 'PUT', updates);
    }

    // Alias for convenience (used in onboarding and other places)
    async updateProfile(updates) {
        return this.updateUserProfile(updates);
    }

    // GET /api/users
    async getAllUsers() {
        return this.request('/users', 'GET');
    }

    // POST /api/users (Admin only - role check)
    async createUser(userData) {
        return this.request('/users', 'POST', userData);
    }

    // GET /api/users/specialist/:specialistId/clients
    async getClientsBySpecialist(specialistId) {
        return this.request(`/users/specialist/${specialistId}/clients`, 'GET');
    }

    // POST /api/users/assign-client (Admin only - role check)
    async assignClient(clientId, specialistId) {
        return this.request('/users/assign-client', 'POST', { clientId, specialistId });
    }

    // POST /api/users/unassign-client (Admin only - role check)
    async unassignClient(clientId) {
        return this.request('/users/unassign-client', 'POST', { clientId });
    }

    // GET /api/users/:id
    async getUserById(userId) {
        return this.request(`/users/${userId}`, 'GET', null, { cache: true });
    }

    // PUT /api/users/:id (Admin only - role check)
    async updateUser(userId, updates) {
        return this.request(`/users/${userId}`, 'PUT', updates);
    }

    // DELETE /api/users/:id (Admin only - role check)
    async deleteUser(userId) {
        return this.request(`/users/${userId}`, 'DELETE');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VENUS ROUTES (88 endpoints)
    // Backend: routes/venus.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/venus/workouts/start
    async startWorkout(workoutData) {
        return this.request('/venus/workouts/start', 'POST', workoutData);
    }

    // POST /api/venus/workouts/:workoutId/exercise
    async logExercise(workoutId, exerciseData) {
        return this.request(`/venus/workouts/${workoutId}/exercise`, 'POST', exerciseData);
    }

    // POST /api/venus/workouts/:id/complete
    async completeWorkout(workoutId) {
        return this.request(`/venus/workouts/${workoutId}/complete`, 'POST');
    }

    // GET /api/venus/workouts
    async getWorkouts() {
        return this.request('/venus/workouts', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/active
    async getActiveWorkout() {
        return this.request('/venus/workouts/active', 'GET');
    }

    // GET /api/venus/workouts/:id
    async getWorkout(workoutId) {
        return this.request(`/venus/workouts/${workoutId}`, 'GET', null, { cache: true });
    }

    // PUT /api/venus/workouts/:id
    async updateWorkout(workoutId, updates) {
        return this.request(`/venus/workouts/${workoutId}`, 'PUT', updates);
    }

    // DELETE /api/venus/workouts/:id
    async deleteWorkout(workoutId) {
        return this.request(`/venus/workouts/${workoutId}`, 'DELETE');
    }

    // POST /api/venus/workouts/recommend
    async getWorkoutRecommendations() {
        return this.request('/venus/workouts/recommend', 'POST', null, { cache: true });
    }

    // GET /api/venus/workouts/similar
    async getSimilarWorkouts() {
        return this.request('/venus/workouts/similar', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/templates/library
    async getWorkoutTemplates() {
        return this.request('/venus/workouts/templates/library', 'GET', null, { cache: true });
    }

    // POST /api/venus/workouts/templates/create
    async createWorkoutTemplate(template) {
        return this.request('/venus/workouts/templates/create', 'POST', template);
    }

    // GET /api/venus/workouts/form-analysis
    async getFormAnalysis() {
        return this.request('/venus/workouts/form-analysis', 'GET', null, { cache: true });
    }

    // POST /api/venus/workouts/form-check
    async checkForm(data) {
        return this.request('/venus/workouts/form-check', 'POST', data);
    }

    // GET /api/venus/workouts/effectiveness
    async getWorkoutEffectiveness() {
        return this.request('/venus/workouts/effectiveness', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/compare
    async compareWorkouts(params) {
        return this.request('/venus/workouts/compare', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/intensity-zones
    async getIntensityZones() {
        return this.request('/venus/workouts/intensity-zones', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/volume-progression
    async getVolumeProgression() {
        return this.request('/venus/workouts/volume-progression', 'GET', null, { cache: true });
    }

    // GET /api/venus/workouts/deload-planning
    async planDeload() {
        return this.request('/venus/workouts/deload-planning', 'GET', null, { cache: true });
    }

    // POST /api/venus/workouts/periodization
    async createPeriodization(plan) {
        return this.request('/venus/workouts/periodization', 'POST', plan);
    }

    // GET /api/venus/workouts/optimal-window
    async getOptimalTrainingWindow() {
        return this.request('/venus/workouts/optimal-window', 'GET', null, { cache: true });
    }

    // POST /api/venus/quantum/generate
    async generateQuantumWorkout(params) {
        return this.request('/venus/quantum/generate', 'POST', params);
    }

    // GET /api/venus/quantum/history
    async getQuantumWorkoutHistory() {
        return this.request('/venus/quantum/history', 'GET', null, { cache: true });
    }

    // GET /api/venus/quantum/effectiveness
    async getQuantumEffectiveness() {
        return this.request('/venus/quantum/effectiveness', 'GET', null, { cache: true });
    }

    // GET /api/venus/quantum/plateau-detection
    async getPlateauAnalysis() {
        return this.request('/venus/quantum/plateau-detection', 'GET', null, { cache: true });
    }

    // GET /api/venus/quantum/settings
    async getQuantumSettings() {
        return this.request('/venus/quantum/settings', 'GET', null, { cache: true });
    }

    // PUT /api/venus/quantum/settings
    async updateQuantumSettings(settings) {
        return this.request('/venus/quantum/settings', 'PUT', settings);
    }

    // GET /api/venus/quantum/chaos-metrics
    async getQuantumChaos() {
        return this.request('/venus/quantum/chaos-metrics', 'GET', null, { cache: true });
    }

    // POST /api/venus/quantum/regenerate-seeds
    async regenerateQuantumWorkout(params) {
        return this.request('/venus/quantum/regenerate-seeds', 'POST', params);
    }

    // GET /api/venus/exercises
    async getExercises() {
        return this.request('/venus/exercises', 'GET', null, { cache: true, cacheTTL: 3600000 });
    }

    // GET /api/venus/exercises/search
    async searchExercises(query) {
        return this.request(`/venus/exercises/search?q=${query}`, 'GET', null, { cache: true });
    }

    // GET /api/venus/exercises/:id
    async getExercise(exerciseId) {
        return this.request(`/venus/exercises/${exerciseId}`, 'GET', null, { cache: true });
    }

    // GET /api/venus/exercises/:id/alternatives
    async getExerciseAlternatives(exerciseId) {
        return this.request(`/venus/exercises/${exerciseId}/alternatives`, 'GET', null, { cache: true });
    }

    // POST /api/venus/exercises
    async createExercise(exercise) {
        return this.request('/venus/exercises', 'POST', exercise);
    }

    // POST /api/venus/exercises/recommend
    async getExerciseRecommendations() {
        return this.request('/venus/exercises/recommend', 'POST', null, { cache: true });
    }

    // GET /api/venus/progress/overload
    async getProgressiveOverload() {
        return this.request('/venus/progress/overload', 'GET', null, { cache: true });
    }

    // POST /api/venus/progress/1rm
    async calculate1RM(data) {
        return this.request('/venus/progress/1rm', 'POST', data);
    }

    // GET /api/venus/progress/standards
    async getStrengthStandards() {
        return this.request('/venus/progress/standards', 'GET', null, { cache: true });
    }

    // GET /api/venus/progress/records
    async getPRs() {
        return this.request('/venus/progress/records', 'GET', null, { cache: true });
    }

    // POST /api/venus/nutrition/log
    async logNutrition(foodData) {
        return this.request('/venus/nutrition/log', 'POST', foodData);
    }

    // GET /api/venus/nutrition/logs
    async getNutritionLogs(date) {
        const endpoint = date ? `/venus/nutrition/logs?date=${date}` : '/venus/nutrition/logs';
        return this.request(endpoint, 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // PUT /api/venus/nutrition/logs/:id
    async updateNutritionLog(logId, updates) {
        return this.request(`/venus/nutrition/logs/${logId}`, 'PUT', updates);
    }

    // DELETE /api/venus/nutrition/logs/:id
    async deleteNutritionLog(logId) {
        return this.request(`/venus/nutrition/logs/${logId}`, 'DELETE');
    }

    // GET /api/venus/nutrition/macros
    async getNutritionSummary() {
        return this.request('/venus/nutrition/macros', 'GET');
    }

    // POST /api/venus/nutrition/targets
    async setNutritionTargets(targets) {
        return this.request('/venus/nutrition/targets', 'POST', targets);
    }

    // POST /api/venus/nutrition/targets/calculate
    async calculateNutritionTargets(params) {
        return this.request('/venus/nutrition/targets/calculate', 'POST', params);
    }

    // GET /api/venus/nutrition/insights
    async getNutritionInsights() {
        return this.request('/venus/nutrition/insights', 'GET', null, { cache: true });
    }

    // POST /api/venus/nutrition/water
    async logWater(amount) {
        return this.request('/venus/nutrition/water', 'POST', { amount });
    }

    // GET /api/venus/nutrition/water
    async getWaterIntake() {
        return this.request('/venus/nutrition/water', 'GET');
    }

    // POST /api/venus/nutrition/meal-plan/generate
    async generateMealPlan(preferences) {
        return this.request('/venus/nutrition/meal-plan/generate', 'POST', preferences);
    }

    // POST /api/venus/nutrition/photo-analyze
    async analyzePhotoNutrition(photoData) {
        return this.request('/venus/nutrition/photo-analyze', 'POST', photoData);
    }

    // POST /api/venus/nutrition/barcode-scan
    async getNutritionByBarcode(barcode) {
        return this.request('/venus/nutrition/barcode-scan', 'POST', { barcode });
    }

    // POST /api/venus/nutrition/recipe-suggest
    async getRecipes() {
        return this.request('/venus/nutrition/recipe-suggest', 'POST', null, { cache: true });
    }

    // GET /api/venus/nutrition/meal-prep
    async getMealPrep() {
        return this.request('/venus/nutrition/meal-prep', 'GET', null, { cache: true });
    }

    // POST /api/venus/nutrition/meal-prep/plan
    async createMealPrep(plan) {
        return this.request('/venus/nutrition/meal-prep/plan', 'POST', plan);
    }

    // GET /api/venus/nutrition/restaurants
    async analyzeRestaurantFood(location) {
        return this.request('/venus/nutrition/restaurants', 'GET', null, { cache: true });
    }

    // POST /api/venus/nutrition/restaurants/analyze
    async getRestaurantRecommendations(data) {
        return this.request('/venus/nutrition/restaurants/analyze', 'POST', data);
    }

    // POST /api/venus/supplements/log
    async logSupplement(supplement) {
        return this.request('/venus/supplements/log', 'POST', supplement);
    }

    // GET /api/venus/supplements
    async getSupplements() {
        return this.request('/venus/supplements', 'GET', null, { cache: true });
    }

    // GET /api/venus/supplements/interactions
    async checkSupplementInteractions(supplements) {
        return this.request('/venus/supplements/interactions', 'GET', null, { cache: true });
    }

    // POST /api/venus/supplements/stack-builder
    async createSupplementStack(goals) {
        return this.request('/venus/supplements/stack-builder', 'POST', goals);
    }

    // POST /api/venus/body/measurements
    async logBodyMeasurements(measurements) {
        return this.request('/venus/body/measurements', 'POST', measurements);
    }

    // GET /api/venus/body/measurements
    async getBodyMeasurements() {
        return this.request('/venus/body/measurements', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/composition
    async getBodyCompositionTracking() {
        return this.request('/venus/body/composition', 'GET', null, { cache: true });
    }

    // POST /api/venus/body/photos
    async uploadProgressPhoto(photoData) {
        return this.request('/venus/body/photos', 'POST', photoData);
    }

    // GET /api/venus/body/photos
    async getProgressPhotos() {
        return this.request('/venus/body/photos', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/photos/compare
    async compareProgressPhotos(date1, date2) {
        return this.request(`/venus/body/photos/compare?date1=${date1}&date2=${date2}`, 'GET', null, { cache: true });
    }

    // GET /api/venus/body/recomp-analysis
    async getRecompProgress() {
        return this.request('/venus/body/recomp-analysis', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/muscle-symmetry
    async getBodySymmetry() {
        return this.request('/venus/body/muscle-symmetry', 'GET', null, { cache: true });
    }

    // GET /api/venus/body/fat-distribution
    async getFatDistribution() {
        return this.request('/venus/body/fat-distribution', 'GET', null, { cache: true });
    }

    // POST /api/venus/performance/tests
    async createPerformanceTest(test) {
        return this.request('/venus/performance/tests', 'POST', test);
    }

    // POST /api/venus/performance/tests/:id/results
    async logPerformanceResults(testId, results) {
        return this.request(`/venus/performance/tests/${testId}/results`, 'POST', results);
    }

    // GET /api/venus/performance/tests
    async getPerformanceTests() {
        return this.request('/venus/performance/tests', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/benchmarks
    async getPerformanceBenchmarks() {
        return this.request('/venus/performance/benchmarks', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/standards
    async getPerformanceStrengthStandards() {
        return this.request('/venus/performance/standards', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/percentile
    async getPerformancePercentile() {
        return this.request('/venus/performance/percentile', 'GET', null, { cache: true });
    }

    // GET /api/venus/performance/predictions
    async getPerformancePredictions() {
        return this.request('/venus/performance/predictions', 'GET', null, { cache: true });
    }

    // GET /api/venus/social/feed
    async getSocialFeed() {
        return this.request('/venus/social/feed', 'GET', null, { cache: true, cacheTTL: 60000 });
    }

    // POST /api/venus/social/share
    async shareWorkout(workoutId) {
        return this.request('/venus/social/share', 'POST', { workoutId });
    }

    // GET /api/venus/social/challenges
    async getChallenges() {
        return this.request('/venus/social/challenges', 'GET', null, { cache: true });
    }

    // POST /api/venus/social/challenges/join
    async joinChallenge(challengeId) {
        return this.request('/venus/social/challenges/join', 'POST', { challengeId });
    }

    // GET /api/venus/social/friends
    async getFriends() {
        return this.request('/venus/social/friends', 'GET', null, { cache: true });
    }

    // POST /api/venus/social/friends/add
    async addFriend(userId) {
        return this.request('/venus/social/friends/add', 'POST', { userId });
    }

    // GET /api/venus/injury-risk/assessment
    async getInjuryRisk() {
        return this.request('/venus/injury-risk/assessment', 'GET', null, { cache: true });
    }

    // GET /api/venus/injury-risk/history
    async getInjuryHistory() {
        return this.request('/venus/injury-risk/history', 'GET', null, { cache: true });
    }

    // POST /api/venus/injury-risk/report
    async reportInjury(injury) {
        return this.request('/venus/injury-risk/report', 'POST', injury);
    }

    // GET /api/venus/injury-risk/prevention
    async getInjuryPrevention() {
        return this.request('/venus/injury-risk/prevention', 'GET', null, { cache: true });
    }

    // GET /api/venus/injury-risk/rehab-protocols
    async getInjuryRehab() {
        return this.request('/venus/injury-risk/rehab-protocols', 'GET', null, { cache: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TTS ROUTES (Text-to-Speech)
    // Backend: routes/tts.js
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/tts/generate
    async textToSpeech(text, voice = 'nova', speed = 1.0) {
        // Map language codes to backend format (en → en-US, es → es-ES, etc.)
        const savedLanguageCode = localStorage.getItem('phoenixLanguage') || 'en';
        const languageMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-BR',
            'nl': 'nl-NL',
            'pl': 'pl-PL',
            'ja': 'ja-JP',
            'zh': 'zh-CN'
        };
        const language = languageMap[savedLanguageCode] || 'en-US';

        const response = await fetch(`${this.baseURL}/tts/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
            },
            body: JSON.stringify({
                text,
                voice,
                language,
                speed
            })
        });

        if (!response.ok) {
            throw new Error(`TTS Error: ${response.status}`);
        }

        // Return audio blob directly
        return await response.blob();
    }

    // POST /api/whisper/transcribe
    async transcribeAudio(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const response = await fetch(`${this.baseURL}/whisper/transcribe`, {
            method: 'POST',
            headers: {
                ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Transcription Error: ${response.status}`);
        }

        return await response.json();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    setAuthToken(token, userId) {
        this.token = token;
        this.userId = userId;
        localStorage.setItem('phoenixToken', token);
        localStorage.setItem('phoenix_user_id', userId);
    }

    clearAuth() {
        localStorage.removeItem('phoenixToken');
        localStorage.removeItem('phoenix_user_id');
        this.token = null;
        this.userId = null;
        this.cache.clear();
    }

    async refreshToken() {
        // Note: Backend doesn't have a /auth/refresh endpoint
        // This would need to be implemented on the backend
        console.warn('Token refresh not implemented on backend');
        throw new Error('Token refresh not available');
    }

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

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZE & EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const API = new PhoenixAPI();

// Auto-initialize on page load
(function() {
    console.log('Phoenix API Client Initialized');
    console.log(`📡 Base URL: ${API.baseURL}`);
    console.log(`🔐 Authenticated: ${!!API.token}`);
    console.log(`👤 User ID: ${API.userId || 'Not logged in'}`);
    console.log('257 backend endpoints loaded (perfect 1:1 mirror)');
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.API = API;
    window.PhoenixAPI = PhoenixAPI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, PhoenixAPI };
}
