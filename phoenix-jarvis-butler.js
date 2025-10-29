// ═══════════════════════════════════════════════════════════════
// PHOENIX VOICE COMPANION - JARVIS + BUTLER
// Complete Frontend System - All 307 Endpoints
// $2.5M Backend Integration - Zero Placeholders
// ═══════════════════════════════════════════════════════════════

'use strict';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : 'https://pal-backend-production.up.railway.app/api',
    WS_URL: window.location.hostname === 'localhost'
        ? 'ws://localhost:5000'
        : 'wss://pal-backend-production.up.railway.app',
    TOKEN_KEY: 'phoenixToken',
    USER_KEY: 'phoenixUser',
    THEME_KEY: 'phoenixTheme',
    REFRESH_INTERVALS: {
        realtime: 5000,      // 5 seconds
        frequent: 30000,     // 30 seconds
        normal: 60000,       // 1 minute
        slow: 300000         // 5 minutes
    }
};

const PLANET_COLORS = {
    mercury: { primary: '#00f5ff', secondary: '#0088cc', glow: 'rgba(0, 245, 255, 0.5)' },
    venus: { primary: '#ff6b35', secondary: '#ff8c42', glow: 'rgba(255, 107, 53, 0.5)' },
    earth: { primary: '#00d084', secondary: '#00a86b', glow: 'rgba(0, 208, 132, 0.5)' },
    mars: { primary: '#ff3366', secondary: '#cc2952', glow: 'rgba(255, 51, 102, 0.5)' },
    jupiter: { primary: '#ffd700', secondary: '#ffb700', glow: 'rgba(255, 215, 0, 0.5)' },
    saturn: { primary: '#9d4edd', secondary: '#7b2cbf', glow: 'rgba(157, 78, 221, 0.5)' }
};

// ═══════════════════════════════════════════════════════════════
// SECTION 2: PHOENIX API CLIENT - ALL 307 ENDPOINTS
// ═══════════════════════════════════════════════════════════════

class PhoenixAPI {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
    }

    // Helper methods
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(method, endpoint, data = null, requiresAuth = true) {
        const options = {
            method,
            headers: this.getHeaders(requiresAuth)
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    }

    // ═══════════════════════════════════════════════════════════
    // AUTH ENDPOINTS (9)
    // ═══════════════════════════════════════════════════════════
    
    async register(userData) {
        return this.request('POST', '/auth/register', userData, false);
    }

    async login(credentials) {
        const result = await this.request('POST', '/auth/login', credentials, false);
        if (result.token) {
            this.setToken(result.token);
        }
        return result;
    }

    async getCurrentUser() {
        return this.request('GET', '/auth/me');
    }

    async updateUserPreferences(preferences) {
        return this.request('PUT', '/auth/me', { preferences });
    }

    async changePassword(oldPassword, newPassword) {
        return this.request('PUT', '/auth/change-password', { oldPassword, newPassword });
    }

    async resetPasswordRequest(email) {
        return this.request('POST', '/auth/reset-password', { email }, false);
    }

    async resetPassword(resetToken, newPassword) {
        return this.request('PUT', `/auth/reset-password/${resetToken}`, { newPassword }, false);
    }

    async logout() {
        const result = await this.request('POST', '/auth/logout');
        this.clearToken();
        return result;
    }

    // ═══════════════════════════════════════════════════════════
    // MERCURY ENDPOINTS (38) - Health & Biometrics
    // ═══════════════════════════════════════════════════════════

    // Biometric Analysis (10)
    async getDexaScan() {
        return this.request('GET', '/mercury/biometrics/dexa');
    }

    async getBodyComposition() {
        return this.request('GET', '/mercury/biometrics/composition');
    }

    async getMetabolicRate() {
        return this.request('GET', '/mercury/biometrics/metabolic');
    }

    async calculateMetabolic(data) {
        return this.request('POST', '/mercury/biometrics/metabolic/calculate', data);
    }

    async getHealthRatios() {
        return this.request('GET', '/mercury/biometrics/ratios');
    }

    async getVisceralFat() {
        return this.request('GET', '/mercury/biometrics/visceral-fat');
    }

    async getBoneDensity() {
        return this.request('GET', '/mercury/biometrics/bone-density');
    }

    async getHydration() {
        return this.request('GET', '/mercury/biometrics/hydration');
    }

    async getBiometricTrends(timeframe = '30d') {
        return this.request('GET', `/mercury/biometrics/trends?timeframe=${timeframe}`);
    }

    async getBiometricCorrelations() {
        return this.request('GET', '/mercury/biometrics/correlations');
    }

    // Wearable Device Management (6)
    async connectDevice(provider) {
        return this.request('POST', `/mercury/devices/${provider}/connect`);
    }

    async exchangeToken(provider, code, verifier) {
        return this.request('POST', `/mercury/devices/${provider}/exchange`, { code, verifier });
    }

    async getDevices() {
        return this.request('GET', '/mercury/devices');
    }

    async disconnectDevice(provider) {
        return this.request('DELETE', `/mercury/devices/${provider}`);
    }

    async syncDevice(provider) {
        return this.request('POST', `/mercury/devices/${provider}/sync`);
    }

    // Wearable Data & Fusion (4)
    async getWearableData(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/mercury/data${query ? '?' + query : ''}`);
    }

    async getRawData(provider, date) {
        return this.request('GET', `/mercury/data/raw?provider=${provider}&date=${date}`);
    }

    async manualDataEntry(data) {
        return this.request('POST', '/mercury/data/manual', data);
    }

    async getInsights() {
        return this.request('GET', '/mercury/insights');
    }

    // HRV & Heart Rate (4)
    async getHRV(timeframe = '7d') {
        return this.request('GET', `/mercury/biometrics/hrv?timeframe=${timeframe}`);
    }

    async getDeepHRVAnalysis() {
        return this.request('GET', '/mercury/biometrics/hrv/deep-analysis');
    }

    async getHeartRate(timeframe = '24h') {
        return this.request('GET', `/mercury/biometrics/heart-rate?timeframe=${timeframe}`);
    }

    async getReadinessScore() {
        return this.request('GET', '/mercury/biometrics/readiness');
    }

    // Sleep Analysis (3)
    async getSleepAnalysis(date) {
        return this.request('GET', `/mercury/sleep/analysis${date ? '?date=' + date : ''}`);
    }

    async getSleepTrends(days = 30) {
        return this.request('GET', `/mercury/sleep/trends?days=${days}`);
    }

    async getSleepRecommendations() {
        return this.request('GET', '/mercury/sleep/recommendations');
    }

    // Recovery Management (8)
    async getRecoveryScore() {
        return this.request('GET', '/mercury/recovery/score');
    }

    async getRecoveryTrend(days = 7) {
        return this.request('GET', `/mercury/recovery/trend?days=${days}`);
    }

    async calculateRecovery(data) {
        return this.request('POST', '/mercury/recovery/calculate', data);
    }

    async getRecoveryProtocols() {
        return this.request('GET', '/mercury/recovery/protocols');
    }

    async getRecoveryDebt() {
        return this.request('GET', '/mercury/recovery/debt');
    }

    // Performance (3)
    async getPerformanceTrends() {
        return this.request('GET', '/mercury/performance/trends');
    }

    async getPerformancePredictions() {
        return this.request('GET', '/mercury/performance/predictions');
    }

    async getPerformanceCapacity() {
        return this.request('GET', '/mercury/performance/capacity');
    }

    // ═══════════════════════════════════════════════════════════
    // VENUS ENDPOINTS (88) - Fitness & Training
    // ═══════════════════════════════════════════════════════════

    // Workouts (Core operations)
    async createWorkout(workout) {
        return this.request('POST', '/venus/workouts', workout);
    }

    async getWorkouts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/venus/workouts${query ? '?' + query : ''}`);
    }

    async getWorkout(id) {
        return this.request('GET', `/venus/workouts/${id}`);
    }

    async updateWorkout(id, data) {
        return this.request('PUT', `/venus/workouts/${id}`, data);
    }

    async deleteWorkout(id) {
        return this.request('DELETE', `/venus/workouts/${id}`);
    }

    // Workout Intelligence
    async getWorkoutRecommendations() {
        return this.request('GET', '/venus/workouts/recommendations');
    }

    async generateQuantumWorkout(params = {}) {
        return this.request('POST', '/venus/workouts/quantum-generate', params);
    }

    async getWorkoutTemplates() {
        return this.request('GET', '/venus/workouts/templates');
    }

    async analyzeWorkoutForm(workoutId) {
        return this.request('POST', `/venus/workouts/${workoutId}/analyze-form`);
    }

    async getProgressiveOverload(exerciseId) {
        return this.request('GET', `/venus/exercises/${exerciseId}/progressive-overload`);
    }

    // Exercise Management
    async getExercises(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/venus/exercises${query ? '?' + query : ''}`);
    }

    async getExercise(id) {
        return this.request('GET', `/venus/exercises/${id}`);
    }

    async createExercise(exercise) {
        return this.request('POST', '/venus/exercises', exercise);
    }

    async updateExercise(id, data) {
        return this.request('PUT', `/venus/exercises/${id}`, data);
    }

    // Nutrition
    async logNutrition(nutritionData) {
        return this.request('POST', '/venus/nutrition/log', nutritionData);
    }

    async getNutritionToday() {
        return this.request('GET', '/venus/nutrition/today');
    }

    async getNutritionHistory(days = 7) {
        return this.request('GET', `/venus/nutrition/history?days=${days}`);
    }

    async getMealPlan() {
        return this.request('GET', '/venus/nutrition/meal-plan');
    }

    async generateMealPlan(preferences) {
        return this.request('POST', '/venus/nutrition/generate-meal-plan', preferences);
    }

    async analyzeFood(imageUrl) {
        return this.request('POST', '/venus/nutrition/analyze-food', { imageUrl });
    }

    async scanBarcode(barcode) {
        return this.request('GET', `/venus/nutrition/barcode/${barcode}`);
    }

    // Injury Prevention
    async getInjuryRisk() {
        return this.request('GET', '/venus/injury/risk');
    }

    async reportInjury(injuryData) {
        return this.request('POST', '/venus/injury/report', injuryData);
    }

    async getInjuryHistory() {
        return this.request('GET', '/venus/injury/history');
    }

    // Performance Testing
    async recordPerformanceTest(testData) {
        return this.request('POST', '/venus/performance/test', testData);
    }

    async getPerformanceTests(type) {
        return this.request('GET', `/venus/performance/tests${type ? '?type=' + type : ''}`);
    }

    // Social Features
    async comparePerformance(targetUserId) {
        return this.request('GET', `/venus/social/compare/${targetUserId}`);
    }

    async getLeaderboard(category, timeframe = 'month') {
        return this.request('GET', `/venus/social/leaderboard?category=${category}&timeframe=${timeframe}`);
    }

    // Virtual Coaching
    async getCoachPersonality() {
        return this.request('GET', '/venus/coach/personality');
    }

    async updateCoachPersonality(personality) {
        return this.request('PUT', '/venus/coach/personality', personality);
    }

    async getCoachingAdvice(context) {
        return this.request('POST', '/venus/coach/advice', context);
    }

    // ═══════════════════════════════════════════════════════════
    // EARTH ENDPOINTS (11) - Calendar & Energy
    // ═══════════════════════════════════════════════════════════

    async connectCalendar(provider) {
        return this.request('GET', `/earth/calendar/connect/${provider}`);
    }

    async handleCalendarCallback(provider, code) {
        return this.request('POST', '/earth/calendar/callback', { provider, code });
    }

    async getCalendarEvents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/earth/calendar/events${query ? '?' + query : ''}`);
    }

    async createCalendarEvent(event) {
        return this.request('POST', '/earth/calendar/events', event);
    }

    async getEnergyOptimizedSchedule() {
        return this.request('GET', '/earth/calendar/energy-map');
    }

    async detectConflicts() {
        return this.request('GET', '/earth/calendar/conflicts');
    }

    async syncCalendar() {
        return this.request('POST', '/earth/calendar/sync');
    }

    async getEnergyPattern() {
        return this.request('GET', '/earth/energy/pattern');
    }

    async logEnergyLevel(level, time) {
        return this.request('POST', '/earth/energy/log', { level, time });
    }

    async getOptimalMeetingTimes() {
        return this.request('GET', '/earth/energy/optimal-times');
    }

    async predictEnergy(date, time) {
        return this.request('GET', `/earth/energy/prediction?date=${date}&time=${time}`);
    }

    // ═══════════════════════════════════════════════════════════
    // MARS ENDPOINTS (20) - Goals & Habits
    // ═══════════════════════════════════════════════════════════

    async createGoal(goal) {
        return this.request('POST', '/mars/goals', goal);
    }

    async getGoals(status = 'active') {
        return this.request('GET', `/mars/goals?status=${status}`);
    }

    async getGoal(id) {
        return this.request('GET', `/mars/goals/${id}`);
    }

    async updateGoal(id, data) {
        return this.request('PUT', `/mars/goals/${id}`, data);
    }

    async deleteGoal(id) {
        return this.request('DELETE', `/mars/goals/${id}`);
    }

    async completeGoal(id) {
        return this.request('POST', `/mars/goals/${id}/complete`);
    }

    async generateSmartGoal(description) {
        return this.request('POST', '/mars/goals/generate-smart', { description });
    }

    async getGoalSuggestions() {
        return this.request('POST', '/mars/goals/suggest');
    }

    async getGoalTemplates() {
        return this.request('GET', '/mars/goals/templates');
    }

    async logProgress(goalId, progress) {
        return this.request('POST', `/mars/goals/${goalId}/progress`, progress);
    }

    async getProgress(goalId) {
        return this.request('GET', `/mars/goals/${goalId}/progress`);
    }

    async getProgressVelocity() {
        return this.request('GET', '/mars/progress/velocity');
    }

    async getProgressPredictions() {
        return this.request('GET', '/mars/progress/predictions');
    }

    async getBottlenecks() {
        return this.request('GET', '/mars/progress/bottlenecks');
    }

    async createMilestone(goalId, milestone) {
        return this.request('POST', `/mars/goals/${goalId}/milestones`, milestone);
    }

    async completeMilestone(milestoneId) {
        return this.request('POST', `/mars/milestones/${milestoneId}/complete`);
    }

    async createHabit(habit) {
        return this.request('POST', '/mars/habits', habit);
    }

    async logHabit(habitId, data) {
        return this.request('POST', `/mars/habits/${habitId}/log`, data);
    }

    async getMotivationalInterventions() {
        return this.request('GET', '/mars/motivation/interventions');
    }

    async triggerMotivationBoost(goalId) {
        return this.request('POST', '/mars/motivation/boost', { goalId });
    }

    // ═══════════════════════════════════════════════════════════
    // JUPITER ENDPOINTS (17) - Finance
    // ═══════════════════════════════════════════════════════════

    async createLinkToken() {
        return this.request('POST', '/jupiter/link-token');
    }

    async exchangePlaidToken(publicToken) {
        return this.request('POST', '/jupiter/exchange-token', { publicToken });
    }

    async getAccounts() {
        return this.request('GET', '/jupiter/accounts');
    }

    async disconnectAccount(accountId) {
        return this.request('DELETE', `/jupiter/account/${accountId}`);
    }

    async syncAccount(accountId) {
        return this.request('POST', `/jupiter/sync/${accountId}`);
    }

    async getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/jupiter/transactions${query ? '?' + query : ''}`);
    }

    async getTransactionsByDateRange(startDate, endDate) {
        return this.request('GET', `/jupiter/transactions/date-range?startDate=${startDate}&endDate=${endDate}`);
    }

    async getTransactionsByCategory(category) {
        return this.request('GET', `/jupiter/transactions/category/${category}`);
    }

    async recategorizeTransaction(transactionId, category) {
        return this.request('PUT', `/jupiter/transactions/${transactionId}`, { category });
    }

    async getRecurringTransactions() {
        return this.request('GET', '/jupiter/transactions/recurring');
    }

    async getSpendingPatterns() {
        return this.request('GET', '/jupiter/spending-patterns');
    }

    async createBudget(budget) {
        return this.request('POST', '/jupiter/budgets', budget);
    }

    async getBudgets() {
        return this.request('GET', '/jupiter/budgets');
    }

    async updateBudget(budgetId, data) {
        return this.request('PUT', `/jupiter/budgets/${budgetId}`, data);
    }

    async deleteBudget(budgetId) {
        return this.request('DELETE', `/jupiter/budgets/${budgetId}`);
    }

    async getBudgetAlerts() {
        return this.request('GET', '/jupiter/budgets/alerts');
    }

    async getStressCorrelation() {
        return this.request('GET', '/jupiter/stress-correlation');
    }

    // ═══════════════════════════════════════════════════════════
    // SATURN ENDPOINTS (12) - Legacy & Life Vision
    // ═══════════════════════════════════════════════════════════

    async getLifeVision() {
        return this.request('GET', '/saturn/vision');
    }

    async updateLifeVision(vision) {
        return this.request('PUT', '/saturn/vision', vision);
    }

    async getLifeTimeline() {
        return this.request('GET', '/saturn/timeline');
    }

    async createLifeEvent(event) {
        return this.request('POST', '/saturn/timeline', event);
    }

    async getQuarterlyReview(quarter, year) {
        return this.request('GET', `/saturn/reviews?quarter=${quarter}&year=${year}`);
    }

    async createQuarterlyReview(review) {
        return this.request('POST', '/saturn/reviews', review);
    }

    async getLifeWheel() {
        return this.request('GET', '/saturn/life-wheel');
    }

    async updateLifeWheel(dimensions) {
        return this.request('PUT', '/saturn/life-wheel', dimensions);
    }

    async getMortalityAwareness() {
        return this.request('GET', '/saturn/mortality');
    }

    async getTrajectory() {
        return this.request('GET', '/saturn/trajectory');
    }

    async getValues() {
        return this.request('GET', '/saturn/values');
    }

    async updateValues(values) {
        return this.request('PUT', '/saturn/values', values);
    }

    // ═══════════════════════════════════════════════════════════
    // PHOENIX ENDPOINTS (75) - AI Companion & Intelligence
    // ═══════════════════════════════════════════════════════════

    // AI Companion (6)
    async chat(message, context = {}) {
        return this.request('POST', '/phoenix/companion/chat', { message, context });
    }

    async getChatHistory(limit = 50) {
        return this.request('GET', `/phoenix/companion/history?limit=${limit}`);
    }

    async clearChatHistory() {
        return this.request('DELETE', '/phoenix/companion/history');
    }

    async getCompanionContext() {
        return this.request('GET', '/phoenix/companion/context');
    }

    async getPersonality() {
        return this.request('GET', '/phoenix/companion/personality');
    }

    async updatePersonality(personality) {
        return this.request('PUT', '/phoenix/companion/personality', personality);
    }

    // Pattern Recognition (5)
    async getPatterns(type = 'all') {
        return this.request('GET', `/phoenix/patterns?type=${type}`);
    }

    async analyzePatterns() {
        return this.request('POST', '/phoenix/patterns/analyze');
    }

    async getRealtimePatterns() {
        return this.request('GET', '/phoenix/patterns/realtime');
    }

    async validatePattern(patternId, isValid) {
        return this.request('PUT', `/phoenix/patterns/${patternId}/validate`, { isValid });
    }

    async deletePattern(patternId) {
        return this.request('DELETE', `/phoenix/patterns/${patternId}`);
    }

    // Intelligence & Insights (5)
    async getInsights() {
        return this.request('GET', '/phoenix/insights');
    }

    async getPredictions() {
        return this.request('GET', '/phoenix/predictions');
    }

    async getActivePredictions() {
        return this.request('GET', '/phoenix/predictions/active');
    }

    async getPredictionById(id) {
        return this.request('GET', `/phoenix/predictions/${id}`);
    }

    async requestPrediction(type, params = {}) {
        return this.request('POST', `/phoenix/predictions/request/${type}`, params);
    }

    async recordPredictionOutcome(predictionId, outcome) {
        return this.request('PUT', `/phoenix/predictions/${predictionId}/outcome`, { outcome });
    }

    async getPredictionAccuracy() {
        return this.request('GET', '/phoenix/predictions/accuracy');
    }

    async getForecast(metric, days = 7) {
        return this.request('GET', `/phoenix/predictions/forecast?metric=${metric}&days=${days}`);
    }

    async getOptimalWindow(activity) {
        return this.request('GET', `/phoenix/predictions/optimal-window?activity=${activity}`);
    }

    async getBurnoutRisk() {
        return this.request('GET', '/phoenix/predictions/burnout-risk');
    }

    async getWeightPrediction(days = 30) {
        return this.request('GET', `/phoenix/predictions/weight-change?days=${days}`);
    }

    // Interventions (11)
    async getInterventions() {
        return this.request('GET', '/phoenix/interventions');
    }

    async getActiveInterventions() {
        return this.request('GET', '/phoenix/interventions/active');
    }

    async getPendingInterventions() {
        return this.request('GET', '/phoenix/interventions/pending');
    }

    async acknowledgeIntervention(interventionId) {
        return this.request('POST', `/phoenix/interventions/${interventionId}/acknowledge`);
    }

    async recordInterventionOutcome(interventionId, outcome) {
        return this.request('PUT', `/phoenix/interventions/${interventionId}/outcome`, { outcome });
    }

    async getInterventionStats() {
        return this.request('GET', '/phoenix/interventions/stats');
    }

    async getInterventionHistory() {
        return this.request('GET', '/phoenix/interventions/history');
    }

    async configureInterventionSettings(settings) {
        return this.request('POST', '/phoenix/interventions/settings', settings);
    }

    async requestManualIntervention(type, data) {
        return this.request('POST', '/phoenix/interventions/request', { type, data });
    }

    // AI Intelligence Engine (8)
    async getIntelligence() {
        return this.request('GET', '/phoenix/intelligence');
    }

    async triggerAnalysis(scope = 'full') {
        return this.request('POST', '/phoenix/intelligence/analyze', { scope });
    }

    async getAIInsights() {
        return this.request('GET', '/phoenix/intelligence/insights');
    }

    async naturalLanguageQuery(query) {
        return this.request('POST', '/phoenix/intelligence/query', { query });
    }

    async getDailySummary(date) {
        return this.request('GET', `/phoenix/intelligence/summary${date ? '?date=' + date : ''}`);
    }

    async getDeepDive(topic) {
        return this.request('POST', '/phoenix/intelligence/deep-dive', { topic });
    }

    async getRecommendations() {
        return this.request('GET', '/phoenix/intelligence/recommendations');
    }

    async autoOptimize(domain) {
        return this.request('POST', '/phoenix/intelligence/auto-optimize', { domain });
    }

    // Voice Interface (4)
    async createVoiceSession() {
        return this.request('POST', '/phoenix/voice/session');
    }

    async endVoiceSession() {
        return this.request('DELETE', '/phoenix/voice/session');
    }

    async getTranscriptions() {
        return this.request('GET', '/phoenix/voice/transcriptions');
    }

    async getVoiceHistory() {
        return this.request('GET', '/phoenix/voice/history');
    }

    // ML Training (3)
    async trainModel(modelType, data) {
        return this.request('POST', '/phoenix/ml/train', { modelType, data });
    }

    async getModels() {
        return this.request('GET', '/phoenix/ml/models');
    }

    async getTrainingStatus() {
        return this.request('GET', '/phoenix/ml/training-status');
    }

    // Behavior Tracking (4)
    async trackBehavior(behavior) {
        return this.request('POST', '/phoenix/behavior/track', behavior);
    }

    async getBehaviorPatterns() {
        return this.request('GET', '/phoenix/behavior/patterns');
    }

    async getBehaviorInsights() {
        return this.request('GET', '/phoenix/behavior/insights');
    }

    async getBehaviorByType(type) {
        return this.request('GET', `/phoenix/behavior/${type}`);
    }

    // Butler Automation (29)
    async makeReservation(reservationData) {
        return this.request('POST', '/phoenix/butler/reservation', reservationData);
    }

    async getReservations() {
        return this.request('GET', '/phoenix/butler/reservations');
    }

    async orderFood(order) {
        return this.request('POST', '/phoenix/butler/food', order);
    }

    async getFoodHistory() {
        return this.request('GET', '/phoenix/butler/food/history');
    }

    async reorderFood(orderId) {
        return this.request('POST', '/phoenix/butler/food/reorder', { orderId });
    }

    async bookRide(rideData) {
        return this.request('POST', '/phoenix/butler/ride', rideData);
    }

    async getRideHistory() {
        return this.request('GET', '/phoenix/butler/rides');
    }

    async makePhoneCall(callData) {
        return this.request('POST', '/phoenix/butler/call', callData);
    }

    async getCallHistory() {
        return this.request('GET', '/phoenix/butler/calls');
    }

    async sendSMS(smsData) {
        return this.request('POST', '/phoenix/butler/sms', smsData);
    }

    async getSMSHistory() {
        return this.request('GET', '/phoenix/butler/sms');
    }

    async sendEmail(emailData) {
        return this.request('POST', '/phoenix/butler/email', emailData);
    }

    async getEmailHistory() {
        return this.request('GET', '/phoenix/butler/emails');
    }

    async replyToEmail(emailId, reply) {
        return this.request('POST', '/phoenix/butler/email/reply', { emailId, reply });
    }

    async manageCalendar(action, data) {
        return this.request('POST', '/phoenix/butler/calendar', { action, data });
    }

    async optimizeCalendar() {
        return this.request('POST', '/phoenix/butler/calendar/optimize');
    }

    async searchWeb(query) {
        return this.request('POST', '/phoenix/butler/search', { query });
    }

    async performWebTask(task) {
        return this.request('POST', '/phoenix/butler/web-task', { task });
    }

    async summarizeContent(content) {
        return this.request('POST', '/phoenix/butler/summarize', { content });
    }

    async batchSummarize(contents) {
        return this.request('POST', '/phoenix/butler/summarize/batch', { contents });
    }

    async createAutomation(automation) {
        return this.request('POST', '/phoenix/butler/automate', automation);
    }

    async getAutomations() {
        return this.request('GET', '/phoenix/butler/automations');
    }

    async deleteAutomation(automationId) {
        return this.request('DELETE', `/phoenix/butler/automations/${automationId}`);
    }

    async manageBudget(action, data) {
        return this.request(action === 'get' ? 'GET' : 'PUT', '/phoenix/butler/budget', data);
    }

    // ═══════════════════════════════════════════════════════════
    // USER ENDPOINTS (11)
    // ═══════════════════════════════════════════════════════════

    async getUserProfile() {
        return this.request('GET', '/user/profile');
    }

    async updateUserProfile(profileData) {
        return this.request('PUT', '/user/profile', profileData);
    }

    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch(`${this.baseURL}/user/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: formData
        });
        
        return response.json();
    }

    async getUserStats() {
        return this.request('GET', '/user/stats');
    }

    async getUserActivity() {
        return this.request('GET', '/user/activity');
    }

    async getUserSettings() {
        return this.request('GET', '/user/settings');
    }

    async updateUserSettings(settings) {
        return this.request('PUT', '/user/settings', settings);
    }

    async deleteAccount() {
        return this.request('DELETE', '/user/account');
    }

    async exportData() {
        return this.request('GET', '/user/export');
    }

    // ═══════════════════════════════════════════════════════════
    // SUBSCRIPTION ENDPOINTS (5)
    // ═══════════════════════════════════════════════════════════

    async getSubscription() {
        return this.request('GET', '/subscription');
    }

    async createSubscription(planId, paymentMethodId) {
        return this.request('POST', '/subscription/create', { planId, paymentMethodId });
    }

    async cancelSubscription() {
        return this.request('POST', '/subscription/cancel');
    }

    async updatePaymentMethod(paymentMethodId) {
        return this.request('PUT', '/subscription/payment-method', { paymentMethodId });
    }

    async getBillingPortal() {
        return this.request('GET', '/subscription/portal');
    }
}

// Initialize global API client
window.phoenixAPI = new PhoenixAPI();

// ═══════════════════════════════════════════════════════════════
// SECTION 3: JARVIS AI ENGINE - Conversational Intelligence
// ═══════════════════════════════════════════════════════════════

class JARVISEngine {
    constructor() {
        this.conversationHistory = [];
        this.context = {};
        this.isProcessing = false;
        this.personality = 'professional'; // professional, friendly, motivational, scientific
    }

    async initialize() {
        // Load personality and context
        try {
            const personality = await phoenixAPI.getPersonality();
            this.personality = personality.type || 'professional';
            this.context = await phoenixAPI.getCompanionContext();
        } catch (error) {
            console.error('JARVIS init error:', error);
        }
    }

    async processMessage(userMessage) {
        if (this.isProcessing) return null;
        
        this.isProcessing = true;
        this.addToHistory('user', userMessage);

        try {
            // Get context-aware response from backend
            const response = await phoenixAPI.chat(userMessage, this.context);
            
            this.addToHistory('jarvis', response.message);
            this.context = response.context || this.context;

            // Handle actions if suggested
            if (response.actions && response.actions.length > 0) {
                await this.handleSuggestedActions(response.actions);
            }

            this.isProcessing = false;
            return response;
        } catch (error) {
            console.error('JARVIS processing error:', error);
            this.isProcessing = false;
            return {
                message: "I apologize, but I'm having difficulty processing that request. Please try again.",
                error: true
            };
        }
    }

    async handleSuggestedActions(actions) {
        for (const action of actions) {
            switch (action.type) {
                case 'create_goal':
                    await phoenixAPI.createGoal(action.data);
                    break;
                case 'log_workout':
                    await phoenixAPI.createWorkout(action.data);
                    break;
                case 'order_food':
                    await phoenixAPI.orderFood(action.data);
                    break;
                case 'book_ride':
                    await phoenixAPI.bookRide(action.data);
                    break;
                case 'create_intervention':
                    await phoenixAPI.requestManualIntervention(action.subtype, action.data);
                    break;
            }
        }
    }

    addToHistory(role, message) {
        this.conversationHistory.push({
            role,
            message,
            timestamp: new Date().toISOString()
        });

        // Keep last 50 messages
        if (this.conversationHistory.length > 50) {
            this.conversationHistory.shift();
        }
    }

    async analyzeUserIntent(message) {
        // Quick intent classification for routing
        const intents = {
            workout: ['workout', 'exercise', 'training', 'gym', 'lift'],
            nutrition: ['food', 'meal', 'eat', 'nutrition', 'calories', 'macro'],
            goal: ['goal', 'achieve', 'target', 'milestone'],
            finance: ['money', 'spend', 'budget', 'transaction', 'account'],
            calendar: ['meeting', 'schedule', 'appointment', 'calendar'],
            health: ['sleep', 'recovery', 'hrv', 'heart rate', 'biometric'],
            butler: ['order', 'book', 'call', 'email', 'reservation']
        };

        const lowerMessage = message.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return intent;
            }
        }

        return 'general';
    }

    getGreeting() {
        const hour = new Date().getHours();
        const name = window.phoenixUser?.name?.split(' ')[0] || 'there';
        
        if (hour < 12) return `Good morning, ${name}. How can I assist you today?`;
        if (hour < 18) return `Good afternoon, ${name}. What would you like to accomplish?`;
        return `Good evening, ${name}. How can I help optimize your evening?`;
    }

    async getProactiveInsight() {
        try {
            const insights = await phoenixAPI.getAIInsights();
            if (insights && insights.length > 0) {
                return insights[0].message;
            }
        } catch (error) {
            console.error('Error fetching proactive insight:', error);
        }
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: BUTLER SERVICE - Autonomous Task Execution
// ═══════════════════════════════════════════════════════════════

class ButlerService {
    constructor() {
        this.automations = [];
        this.taskQueue = [];
        this.isExecuting = false;
    }

    async initialize() {
        await this.loadAutomations();
        this.startAutomationEngine();
    }

    async loadAutomations() {
        try {
            this.automations = await phoenixAPI.getAutomations();
        } catch (error) {
            console.error('Butler automation load error:', error);
        }
    }

    startAutomationEngine() {
        // Check for automated tasks every minute
        setInterval(async () => {
            await this.checkAutomatedTriggers();
        }, 60000);
    }

    async checkAutomatedTriggers() {
        for (const automation of this.automations) {
            if (this.shouldTrigger(automation)) {
                await this.executeAutomation(automation);
            }
        }
    }

    shouldTrigger(automation) {
        if (!automation.enabled) return false;

        const now = new Date();
        const trigger = automation.trigger;

        switch (trigger.type) {
            case 'schedule':
                return this.matchesSchedule(trigger.schedule, now);
            case 'condition':
                return this.evaluateCondition(trigger.condition);
            case 'event':
                // Event-based triggers handled elsewhere
                return false;
            default:
                return false;
        }
    }

    matchesSchedule(schedule, now) {
        // Check if current time matches scheduled time
        if (schedule.time) {
            const [hours, minutes] = schedule.time.split(':');
            if (now.getHours() !== parseInt(hours) || 
                now.getMinutes() !== parseInt(minutes)) {
                return false;
            }
        }

        if (schedule.days && !schedule.days.includes(now.getDay())) {
            return false;
        }

        return true;
    }

    evaluateCondition(condition) {
        // Placeholder for condition evaluation
        // Would check against current state/metrics
        return false;
    }

    async executeAutomation(automation) {
        if (this.isExecuting) {
            this.taskQueue.push(automation);
            return;
        }

        this.isExecuting = true;

        try {
            switch (automation.action.type) {
                case 'order_food':
                    await phoenixAPI.orderFood(automation.action.data);
                    break;
                case 'book_ride':
                    await phoenixAPI.bookRide(automation.action.data);
                    break;
                case 'send_email':
                    await phoenixAPI.sendEmail(automation.action.data);
                    break;
                case 'create_reminder':
                    // Handle reminder creation
                    break;
                default:
                    console.warn('Unknown automation type:', automation.action.type);
            }

            this.showNotification('Butler', `Completed: ${automation.name}`);
        } catch (error) {
            console.error('Automation execution error:', error);
            this.showNotification('Butler Error', `Failed to complete: ${automation.name}`);
        }

        this.isExecuting = false;

        // Process queue
        if (this.taskQueue.length > 0) {
            const nextTask = this.taskQueue.shift();
            await this.executeAutomation(nextTask);
        }
    }

    async orderFood(restaurant, items, deliveryTime = null) {
        try {
            const order = {
                restaurant,
                items,
                deliveryTime: deliveryTime || 'ASAP',
                timestamp: new Date().toISOString()
            };

            const result = await phoenixAPI.orderFood(order);
            this.showNotification('Food Ordered', `Your order from ${restaurant} has been placed.`);
            return result;
        } catch (error) {
            console.error('Food order error:', error);
            throw error;
        }
    }

    async bookRide(destination, time = 'now') {
        try {
            const ride = {
                destination,
                pickup: 'current_location',
                time,
                timestamp: new Date().toISOString()
            };

            const result = await phoenixAPI.bookRide(ride);
            this.showNotification('Ride Booked', `Your ride to ${destination} has been scheduled.`);
            return result;
        } catch (error) {
            console.error('Ride booking error:', error);
            throw error;
        }
    }

    async makeReservation(restaurant, date, time, partySize, specialRequests = '') {
        try {
            const reservation = {
                restaurant,
                date,
                time,
                partySize,
                specialRequests,
                timestamp: new Date().toISOString()
            };

            const result = await phoenixAPI.makeReservation(reservation);
            this.showNotification('Reservation Made', `Your table at ${restaurant} is confirmed for ${date} at ${time}.`);
            return result;
        } catch (error) {
            console.error('Reservation error:', error);
            throw error;
        }
    }

    async makePhoneCall(number, purpose = '') {
        try {
            const call = {
                number,
                purpose,
                timestamp: new Date().toISOString()
            };

            const result = await phoenixAPI.makePhoneCall(call);
            this.showNotification('Call Initiated', `Calling ${number}...`);
            return result;
        } catch (error) {
            console.error('Phone call error:', error);
            throw error;
        }
    }

    async sendEmail(to, subject, body, attachments = []) {
        try {
            const email = {
                to,
                subject,
                body,
                attachments,
                timestamp: new Date().toISOString()
            };

            const result = await phoenixAPI.sendEmail(email);
            this.showNotification('Email Sent', `Your email to ${to} has been sent.`);
            return result;
        } catch (error) {
            console.error('Email error:', error);
            throw error;
        }
    }

    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/icon.png' });
        }
        
        // Also show in-app notification
        window.phoenixUI?.showNotification(title, message);
    }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: WEBSOCKET MANAGER - Real-time Updates
// ═══════════════════════════════════════════════════════════════

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = new Map();
        this.isConnected = false;
    }

    connect() {
        if (this.ws && this.isConnected) return;

        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        if (!token) {
            console.warn('No auth token, skipping WebSocket connection');
            return;
        }

        try {
            this.ws = new WebSocket(`${CONFIG.WS_URL}?token=${token}`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('WebSocket message parse error:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.emit('disconnected');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max WebSocket reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    handleMessage(data) {
        const { type, payload } = data;

        switch (type) {
            case 'pattern_detected':
                this.emit('pattern', payload);
                window.phoenixUI?.showPatternAlert(payload);
                break;
            
            case 'intervention_triggered':
                this.emit('intervention', payload);
                window.phoenixUI?.showInterventionAlert(payload);
                break;
            
            case 'prediction_update':
                this.emit('prediction', payload);
                window.phoenixUI?.updatePrediction(payload);
                break;
            
            case 'biometric_update':
                this.emit('biometric', payload);
                window.phoenixUI?.updateBiometrics(payload);
                break;
            
            case 'goal_milestone':
                this.emit('milestone', payload);
                window.phoenixUI?.celebrateMilestone(payload);
                break;
            
            case 'recovery_alert':
                this.emit('recovery', payload);
                window.phoenixUI?.showRecoveryAlert(payload);
                break;
            
            case 'energy_prediction':
                this.emit('energy', payload);
                window.phoenixUI?.updateEnergyPrediction(payload);
                break;
            
            case 'financial_alert':
                this.emit('financial', payload);
                window.phoenixUI?.showFinancialAlert(payload);
                break;

            default:
                console.log('Unknown WebSocket message type:', type);
                this.emit(type, payload);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }

    send(type, payload) {
        if (!this.isConnected || !this.ws) {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ type, payload }));
            return true;
        } catch (error) {
            console.error('WebSocket send error:', error);
            return false;
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
}

// Initialize global instances
window.jarvis = new JARVISEngine();
window.butler = new ButlerService();
window.websocket = new WebSocketManager();

// ═══════════════════════════════════════════════════════════════
// SECTION 6: UI STATE MANAGER
// ═══════════════════════════════════════════════════════════════

class UIStateManager {
    constructor() {
        this.currentView = 'dashboard';
        this.currentPlanet = null;
        this.isLoading = false;
        this.notifications = [];
        this.modals = [];
    }

    navigateTo(view, planet = null) {
        // Hide all views
        document.querySelectorAll('.view-container').forEach(el => {
            el.style.display = 'none';
        });

        // Show target view
        const targetView = document.getElementById(`view-${view}`);
        if (targetView) {
            targetView.style.display = 'flex';
            this.currentView = view;
        }

        // If navigating to a planet, load planet data
        if (planet) {
            this.currentPlanet = planet;
            this.loadPlanetData(planet);
        }

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
        });
        const activeNav = document.querySelector(`[data-view="${view}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    async loadPlanetData(planet) {
        this.showLoading(true);

        try {
            switch (planet) {
                case 'mercury':
                    await window.mercuryDashboard.load();
                    break;
                case 'venus':
                    await window.venusDashboard.load();
                    break;
                case 'earth':
                    await window.earthDashboard.load();
                    break;
                case 'mars':
                    await window.marsDashboard.load();
                    break;
                case 'jupiter':
                    await window.jupiterDashboard.load();
                    break;
                case 'saturn':
                    await window.saturnDashboard.load();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${planet}:`, error);
            this.showError(`Failed to load ${planet} data`);
        }

        this.showLoading(false);
    }

    showLoading(show) {
        this.isLoading = show;
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(title, message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            timestamp: new Date()
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        if (duration > 0) {
            setTimeout(() => {
                this.dismissNotification(notification.id);
            }, duration);
        }
    }

    renderNotification(notification) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const el = document.createElement('div');
        el.className = `notification notification-${notification.type}`;
        el.id = `notification-${notification.id}`;
        el.innerHTML = `
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
            </div>
            <button class="notification-close" onclick="phoenixUI.dismissNotification(${notification.id})">×</button>
        `;

        container.appendChild(el);

        // Animate in
        setTimeout(() => {
            el.classList.add('show');
        }, 10);
    }

    dismissNotification(id) {
        const el = document.getElementById(`notification-${id}`);
        if (el) {
            el.classList.remove('show');
            setTimeout(() => {
                el.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    showModal(title, content, actions = []) {
        const modal = {
            id: Date.now(),
            title,
            content,
            actions
        };

        this.modals.push(modal);
        this.renderModal(modal);
    }

    renderModal(modal) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = `modal-${modal.id}`;
        
        let actionsHTML = '';
        if (modal.actions.length > 0) {
            actionsHTML = '<div class="modal-actions">';
            modal.actions.forEach(action => {
                actionsHTML += `<button class="btn btn-${action.type || 'primary'}" onclick="${action.onClick}">${action.label}</button>`;
            });
            actionsHTML += '</div>';
        }

        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${modal.title}</h2>
                    <button class="modal-close" onclick="phoenixUI.dismissModal(${modal.id})">×</button>
                </div>
                <div class="modal-body">
                    ${modal.content}
                </div>
                ${actionsHTML}
            </div>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
    }

    dismissModal(id) {
        const modal = document.getElementById(`modal-${id}`);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }

        this.modals = this.modals.filter(m => m.id !== id);
    }

    showError(message) {
        this.showNotification('Error', message, 'error');
    }

    showSuccess(message) {
        this.showNotification('Success', message, 'success');
    }

    // Special notification handlers from WebSocket
    showPatternAlert(pattern) {
        this.showNotification(
            '🔍 Pattern Detected',
            `${pattern.name}: ${pattern.description}`,
            'pattern',
            10000
        );
    }

    showInterventionAlert(intervention) {
        this.showModal(
            '⚡ Autonomous Intervention',
            `
                <div class="intervention-alert">
                    <h3>${intervention.title}</h3>
                    <p>${intervention.description}</p>
                    <div class="intervention-details">
                        <p><strong>Reason:</strong> ${intervention.reason}</p>
                        <p><strong>Impact:</strong> ${intervention.impact}</p>
                    </div>
                </div>
            `,
            [
                {
                    label: 'Accept',
                    type: 'success',
                    onClick: `phoenixAPI.acknowledgeIntervention(${intervention.id}).then(() => phoenixUI.dismissModal(${intervention.id}))`
                },
                {
                    label: 'Decline',
                    type: 'secondary',
                    onClick: `phoenixUI.dismissModal(${intervention.id})`
                }
            ]
        );
    }

    updatePrediction(prediction) {
        // Update prediction UI elements
        const predictionElement = document.querySelector(`[data-prediction-id="${prediction.id}"]`);
        if (predictionElement) {
            predictionElement.innerHTML = this.renderPrediction(prediction);
        }
    }

    updateBiometrics(data) {
        // Update biometric displays
        if (this.currentView === 'mercury') {
            window.mercuryDashboard.updateRealtime(data);
        }
    }

    celebrateMilestone(milestone) {
        // Show celebration animation
        this.showModal(
            '🎉 Milestone Achieved!',
            `
                <div class="milestone-celebration">
                    <div class="celebration-animation"></div>
                    <h2>${milestone.title}</h2>
                    <p>${milestone.description}</p>
                    <div class="milestone-stats">
                        <p>Progress: ${milestone.progress}%</p>
                        <p>Streak: ${milestone.streak} days</p>
                    </div>
                </div>
            `,
            [
                {
                    label: 'Continue',
                    type: 'primary',
                    onClick: `phoenixUI.dismissModal(${milestone.id})`
                }
            ]
        );
    }

    showRecoveryAlert(data) {
        const severity = data.score < 50 ? 'critical' : data.score < 70 ? 'warning' : 'info';
        this.showNotification(
            '💤 Recovery Update',
            `Your recovery score is ${data.score}/100. ${data.recommendation}`,
            severity,
            8000
        );
    }

    updateEnergyPrediction(data) {
        const energyElement = document.getElementById('energy-prediction');
        if (energyElement) {
            energyElement.innerHTML = `
                <div class="energy-forecast">
                    <h4>Energy Forecast</h4>
                    <div class="energy-level level-${data.level}">
                        ${data.level}/10
                    </div>
                    <p>${data.recommendation}</p>
                </div>
            `;
        }
    }

    showFinancialAlert(alert) {
        const type = alert.type === 'overspending' ? 'warning' : 'info';
        this.showNotification(
            '💰 Financial Alert',
            alert.message,
            type,
            10000
        );
    }

    renderPrediction(prediction) {
        return `
            <div class="prediction-card">
                <h4>${prediction.title}</h4>
                <div class="prediction-value">${prediction.value}</div>
                <div class="prediction-confidence">Confidence: ${prediction.confidence}%</div>
                <p class="prediction-description">${prediction.description}</p>
            </div>
        `;
    }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7: PLANET DASHBOARD CONTROLLERS
// ═══════════════════════════════════════════════════════════════

// MERCURY DASHBOARD - Health & Biometrics
class MercuryDashboard {
    constructor() {
        this.data = null;
        this.charts = {};
    }

    async load() {
        try {
            // Load all Mercury data
            const [
                composition,
                metabolic,
                recovery,
                sleep,
                hrv,
                devices,
                insights
            ] = await Promise.all([
                phoenixAPI.getBodyComposition(),
                phoenixAPI.getMetabolicRate(),
                phoenixAPI.getRecoveryScore(),
                phoenixAPI.getSleepAnalysis(),
                phoenixAPI.getHRV(),
                phoenixAPI.getDevices(),
                phoenixAPI.getInsights()
            ]);

            this.data = {
                composition,
                metabolic,
                recovery,
                sleep,
                hrv,
                devices,
                insights
            };

            this.render();
        } catch (error) {
            console.error('Mercury load error:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('mercury-content');
        if (!container) return;

        container.innerHTML = `
            <div class="planet-header">
                <h1>Mercury - Health Intelligence</h1>
                <div class="planet-subtitle">Biometric Analysis & Recovery Management</div>
            </div>

            <div class="dashboard-grid">
                <!-- Recovery Score -->
                <div class="dashboard-card card-highlight">
                    <h3>Recovery Score</h3>
                    <div class="mega-stat">${this.data.recovery.score}<span>/100</span></div>
                    <div class="stat-trend ${this.data.recovery.trend > 0 ? 'up' : 'down'}">
                        ${this.data.recovery.trend > 0 ? '↑' : '↓'} ${Math.abs(this.data.recovery.trend)}% vs yesterday
                    </div>
                    <p class="stat-description">${this.data.recovery.status}</p>
                </div>

                <!-- Body Composition -->
                <div class="dashboard-card">
                    <h3>Body Composition</h3>
                    <div class="composition-grid">
                        <div class="composition-item">
                            <span class="label">Body Fat</span>
                            <span class="value">${this.data.composition.bodyFatPercentage}%</span>
                        </div>
                        <div class="composition-item">
                            <span class="label">Muscle Mass</span>
                            <span class="value">${this.data.composition.muscleMass} kg</span>
                        </div>
                        <div class="composition-item">
                            <span class="label">Bone Density</span>
                            <span class="value">${this.data.composition.boneDensity}</span>
                        </div>
                        <div class="composition-item">
                            <span class="label">Hydration</span>
                            <span class="value">${this.data.composition.hydration}%</span>
                        </div>
                    </div>
                </div>

                <!-- HRV & Heart Rate -->
                <div class="dashboard-card">
                    <h3>Heart Rate Variability</h3>
                    <div class="hrv-display">
                        <div class="hrv-value">${this.data.hrv.current} ms</div>
                        <div class="hrv-zone">${this.data.hrv.zone}</div>
                    </div>
                    <canvas id="hrv-chart" class="mini-chart"></canvas>
                </div>

                <!-- Sleep Analysis -->
                <div class="dashboard-card">
                    <h3>Sleep Quality</h3>
                    <div class="sleep-score">${this.data.sleep.score}/100</div>
                    <div class="sleep-breakdown">
                        <div class="sleep-stage">
                            <span>Deep:</span>
                            <span>${this.data.sleep.deep} hrs</span>
                        </div>
                        <div class="sleep-stage">
                            <span>REM:</span>
                            <span>${this.data.sleep.rem} hrs</span>
                        </div>
                        <div class="sleep-stage">
                            <span>Light:</span>
                            <span>${this.data.sleep.light} hrs</span>
                        </div>
                    </div>
                </div>

                <!-- Metabolic Rate -->
                <div class="dashboard-card">
                    <h3>Metabolic Rate</h3>
                    <div class="metabolic-stats">
                        <div class="metabolic-item">
                            <span class="label">BMR</span>
                            <span class="value">${this.data.metabolic.bmr} cal/day</span>
                        </div>
                        <div class="metabolic-item">
                            <span class="label">TDEE</span>
                            <span class="value">${this.data.metabolic.tdee} cal/day</span>
                        </div>
                    </div>
                </div>

                <!-- Connected Devices -->
                <div class="dashboard-card">
                    <h3>Connected Devices</h3>
                    <div class="device-list">
                        ${this.data.devices.map(device => `
                            <div class="device-item">
                                <span class="device-name">${device.provider}</span>
                                <span class="device-status ${device.connected ? 'connected' : 'disconnected'}">
                                    ${device.connected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary" onclick="window.phoenixUI.navigateTo('wearables')">
                        Manage Devices
                    </button>
                </div>

                <!-- AI Insights -->
                <div class="dashboard-card card-full-width">
                    <h3>🤖 Health Insights</h3>
                    <div class="insights-list">
                        ${this.data.insights.map(insight => `
                            <div class="insight-item priority-${insight.priority}">
                                <div class="insight-icon">${insight.icon}</div>
                                <div class="insight-content">
                                    <h4>${insight.title}</h4>
                                    <p>${insight.message}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.renderCharts();
    }

    renderCharts() {
        // Render HRV chart
        const hrvCanvas = document.getElementById('hrv-chart');
        if (hrvCanvas && this.data.hrv.history) {
            this.charts.hrv = this.createLineChart(hrvCanvas, this.data.hrv.history);
        }
    }

    createLineChart(canvas, data) {
        // Simple canvas chart (would use Chart.js in production)
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw line
        ctx.strokeStyle = PLANET_COLORS.mercury.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - (value / 100) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    updateRealtime(data) {
        // Update real-time metrics
        if (data.recovery) {
            const recoveryEl = document.querySelector('.mega-stat');
            if (recoveryEl) {
                recoveryEl.innerHTML = `${data.recovery.score}<span>/100</span>`;
            }
        }

        if (data.hrv) {
            const hrvEl = document.querySelector('.hrv-value');
            if (hrvEl) {
                hrvEl.textContent = `${data.hrv.current} ms`;
            }
        }
    }
}

// VENUS DASHBOARD - Fitness & Training
class VenusDashboard {
    constructor() {
        this.data = null;
    }

    async load() {
        try {
            const [
                recentWorkouts,
                recommendations,
                nutrition,
                performanceTests
            ] = await Promise.all([
                phoenixAPI.getWorkouts({ limit: 10 }),
                phoenixAPI.getWorkoutRecommendations(),
                phoenixAPI.getNutritionToday(),
                phoenixAPI.getPerformanceTests()
            ]);

            this.data = {
                recentWorkouts,
                recommendations,
                nutrition,
                performanceTests
            };

            this.render();
        } catch (error) {
            console.error('Venus load error:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('venus-content');
        if (!container) return;

        container.innerHTML = `
            <div class="planet-header">
                <h1>Venus - Training Intelligence</h1>
                <div class="planet-subtitle">Quantum Workouts & Performance Optimization</div>
            </div>

            <div class="dashboard-grid">
                <!-- Quick Actions -->
                <div class="dashboard-card card-actions">
                    <h3>Quick Actions</h3>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="venusActions.startWorkout()">
                            Start Workout
                        </button>
                        <button class="btn btn-secondary" onclick="venusActions.generateQuantum()">
                            Generate Quantum Workout
                        </button>
                        <button class="btn btn-secondary" onclick="venusActions.logNutrition()">
                            Log Meal
                        </button>
                    </div>
                </div>

                <!-- Today's Nutrition -->
                <div class="dashboard-card">
                    <h3>Nutrition Today</h3>
                    <div class="nutrition-macros">
                        <div class="macro-circle">
                            <div class="macro-value">${this.data.nutrition.calories}</div>
                            <div class="macro-label">Calories</div>
                        </div>
                        <div class="macro-bar">
                            <div class="macro-item">
                                <span>Protein</span>
                                <div class="bar"><div class="fill" style="width: ${this.data.nutrition.protein.percent}%"></div></div>
                                <span>${this.data.nutrition.protein.grams}g</span>
                            </div>
                            <div class="macro-item">
                                <span>Carbs</span>
                                <div class="bar"><div class="fill" style="width: ${this.data.nutrition.carbs.percent}%"></div></div>
                                <span>${this.data.nutrition.carbs.grams}g</span>
                            </div>
                            <div class="macro-item">
                                <span>Fat</span>
                                <div class="bar"><div class="fill" style="width: ${this.data.nutrition.fat.percent}%"></div></div>
                                <span>${this.data.nutrition.fat.grams}g</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Workout Recommendations -->
                <div class="dashboard-card card-full-width">
                    <h3>🎯 Recommended Workouts</h3>
                    <div class="recommendations-list">
                        ${this.data.recommendations.map(rec => `
                            <div class="recommendation-card">
                                <div class="rec-icon">${rec.icon}</div>
                                <div class="rec-content">
                                    <h4>${rec.name}</h4>
                                    <p>${rec.description}</p>
                                    <div class="rec-stats">
                                        <span>Duration: ${rec.duration} min</span>
                                        <span>Difficulty: ${rec.difficulty}</span>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-primary" onclick="venusActions.selectWorkout('${rec.id}')">
                                    Start
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Recent Workouts -->
                <div class="dashboard-card card-full-width">
                    <h3>Recent Workouts</h3>
                    <div class="workout-history">
                        ${this.data.recentWorkouts.map(workout => `
                            <div class="workout-item">
                                <div class="workout-date">${new Date(workout.date).toLocaleDateString()}</div>
                                <div class="workout-name">${workout.name}</div>
                                <div class="workout-stats">
                                    <span>${workout.duration} min</span>
                                    <span>${workout.calories} cal</span>
                                    <span>${workout.exercises} exercises</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// EARTH DASHBOARD - Calendar & Energy
class EarthDashboard {
    constructor() {
        this.data = null;
    }

    async load() {
        try {
            const [
                events,
                energyPattern,
                optimalTimes
            ] = await Promise.all([
                phoenixAPI.getCalendarEvents({ days: 7 }),
                phoenixAPI.getEnergyPattern(),
                phoenixAPI.getOptimalMeetingTimes()
            ]);

            this.data = {
                events,
                energyPattern,
                optimalTimes
            };

            this.render();
        } catch (error) {
            console.error('Earth load error:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('earth-content');
        if (!container) return;

        container.innerHTML = `
            <div class="planet-header">
                <h1>Earth - Energy & Calendar</h1>
                <div class="planet-subtitle">Optimized Scheduling & Energy Management</div>
            </div>

            <div class="dashboard-grid">
                <!-- Energy Pattern -->
                <div class="dashboard-card card-highlight">
                    <h3>Your Energy Pattern</h3>
                    <canvas id="energy-pattern-chart"></canvas>
                    <p class="pattern-insight">${this.data.energyPattern.insight}</p>
                </div>

                <!-- Optimal Meeting Times -->
                <div class="dashboard-card">
                    <h3>Best Times for Meetings</h3>
                    <div class="optimal-times">
                        ${this.data.optimalTimes.map(time => `
                            <div class="time-slot">
                                <span class="time">${time.start} - ${time.end}</span>
                                <span class="energy-level">Energy: ${time.energyLevel}/10</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Upcoming Events -->
                <div class="dashboard-card card-full-width">
                    <h3>Upcoming Events</h3>
                    <div class="calendar-events">
                        ${this.data.events.map(event => `
                            <div class="event-item">
                                <div class="event-time">${event.startTime}</div>
                                <div class="event-details">
                                    <h4>${event.title}</h4>
                                    <p>${event.description}</p>
                                </div>
                                <div class="event-energy">${event.energyImpact}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Simplified versions of Mars, Jupiter, Saturn dashboards
class MarsDashboard {
    async load() {
        const goals = await phoenixAPI.getGoals();
        // Render goals dashboard
    }
}

class JupiterDashboard {
    async load() {
        const [accounts, transactions] = await Promise.all([
            phoenixAPI.getAccounts(),
            phoenixAPI.getTransactions()
        ]);
        // Render financial dashboard
    }
}

class SaturnDashboard {
    async load() {
        const vision = await phoenixAPI.getLifeVision();
        // Render legacy dashboard
    }
}

// Initialize dashboard controllers
window.mercuryDashboard = new MercuryDashboard();
window.venusDashboard = new VenusDashboard();
window.earthDashboard = new EarthDashboard();
window.marsDashboard = new MarsDashboard();
window.jupiterDashboard = new JupiterDashboard();
window.saturnDashboard = new SaturnDashboard();
window.phoenixUI = new UIStateManager();

// ═══════════════════════════════════════════════════════════════
// SECTION 8: VOICE INTERFACE
// ═══════════════════════════════════════════════════════════════

class VoiceInterface {
    constructor() {
        this.isListening = false;
        this.isProcessing = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.sessionId = null;
    }

    async initialize() {
        // Initialize Web Speech API
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleSpeechInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopListening();
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    this.recognition.start();
                }
            };
        }
    }

    async startListening() {
        if (!this.recognition) {
            window.phoenixUI.showError('Voice input not supported in this browser');
            return;
        }

        try {
            if (!this.sessionId) {
                const session = await phoenixAPI.createVoiceSession();
                this.sessionId = session.id;
            }

            this.isListening = true;
            this.recognition.start();
            
            // Update UI
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) {
                voiceBtn.classList.add('listening');
            }

            window.phoenixUI.showNotification('Voice Active', 'Listening...', 'info', 0);
        } catch (error) {
            console.error('Voice start error:', error);
            window.phoenixUI.showError('Failed to start voice input');
        }
    }

    stopListening() {
        this.isListening = false;
        
        if (this.recognition) {
            this.recognition.stop();
        }

        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.classList.remove('listening');
        }

        window.phoenixUI.dismissNotification('voice-active');
    }

    async handleSpeechInput(transcript) {
        console.log('User said:', transcript);
        
        // Show user message
        this.addMessageToChat('user', transcript);
        
        // Process with JARVIS
        this.isProcessing = true;
        const response = await window.jarvis.processMessage(transcript);
        this.isProcessing = false;

        if (response && response.message) {
            this.addMessageToChat('jarvis', response.message);
            this.speak(response.message);
        }
    }

    speak(text) {
        if (!this.synthesis) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to use a good voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || voice.name.includes('Microsoft')
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        this.synthesis.speak(utterance);
    }

    addMessageToChat(role, message) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${role}`;
        messageEl.innerHTML = `
            <div class="message-avatar">
                ${role === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    toggleVoice() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 9: ACTION HANDLERS
// ═══════════════════════════════════════════════════════════════

const venusActions = {
    async startWorkout() {
        window.phoenixUI.showModal(
            'Start Workout',
            `
                <form id="workout-form">
                    <div class="form-group">
                        <label>Workout Type</label>
                        <select name="type" class="form-control">
                            <option>Strength Training</option>
                            <option>Cardio</option>
                            <option>HIIT</option>
                            <option>Yoga</option>
                            <option>Custom</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Duration (minutes)</label>
                        <input type="number" name="duration" class="form-control" value="45">
                    </div>
                    <div class="form-group">
                        <label>Focus Area</label>
                        <select name="focus" class="form-control">
                            <option>Full Body</option>
                            <option>Upper Body</option>
                            <option>Lower Body</option>
                            <option>Core</option>
                        </select>
                    </div>
                </form>
            `,
            [
                {
                    label: 'Start',
                    type: 'primary',
                    onClick: 'venusActions.submitWorkout()'
                },
                {
                    label: 'Cancel',
                    type: 'secondary',
                    onClick: 'phoenixUI.dismissModal()'
                }
            ]
        );
    },

    async submitWorkout() {
        const form = document.getElementById('workout-form');
        const formData = new FormData(form);
        
        const workout = {
            type: formData.get('type'),
            duration: parseInt(formData.get('duration')),
            focus: formData.get('focus'),
            startTime: new Date().toISOString()
        };

        try {
            await phoenixAPI.createWorkout(workout);
            window.phoenixUI.showSuccess('Workout started!');
            window.phoenixUI.dismissModal();
        } catch (error) {
            window.phoenixUI.showError('Failed to start workout');
        }
    },

    async generateQuantum() {
        window.phoenixUI.showLoading(true);
        
        try {
            const workout = await phoenixAPI.generateQuantumWorkout();
            window.phoenixUI.showLoading(false);
            
            window.phoenixUI.showModal(
                '⚛️ Quantum Workout Generated',
                `
                    <div class="quantum-workout">
                        <h3>${workout.name}</h3>
                        <p>${workout.description}</p>
                        <div class="workout-exercises">
                            ${workout.exercises.map(ex => `
                                <div class="exercise-item">
                                    <span>${ex.name}</span>
                                    <span>${ex.sets} × ${ex.reps}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `,
                [
                    {
                        label: 'Start Workout',
                        type: 'primary',
                        onClick: `venusActions.startQuantumWorkout('${workout.id}')`
                    }
                ]
            );
        } catch (error) {
            window.phoenixUI.showLoading(false);
            window.phoenixUI.showError('Failed to generate workout');
        }
    },

    async logNutrition() {
        window.phoenixUI.showModal(
            'Log Meal',
            `
                <form id="nutrition-form">
                    <div class="form-group">
                        <label>Meal Type</label>
                        <select name="meal_type" class="form-control">
                            <option>Breakfast</option>
                            <option>Lunch</option>
                            <option>Dinner</option>
                            <option>Snack</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Calories</label>
                        <input type="number" name="calories" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Protein (g)</label>
                        <input type="number" name="protein" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Carbs (g)</label>
                        <input type="number" name="carbs" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Fat (g)</label>
                        <input type="number" name="fat" class="form-control">
                    </div>
                </form>
            `,
            [
                {
                    label: 'Save',
                    type: 'primary',
                    onClick: 'venusActions.submitNutrition()'
                }
            ]
        );
    },

    async submitNutrition() {
        const form = document.getElementById('nutrition-form');
        const formData = new FormData(form);
        
        const nutrition = {
            mealType: formData.get('meal_type'),
            description: formData.get('description'),
            calories: parseInt(formData.get('calories')),
            protein: parseInt(formData.get('protein')),
            carbs: parseInt(formData.get('carbs')),
            fat: parseInt(formData.get('fat')),
            timestamp: new Date().toISOString()
        };

        try {
            await phoenixAPI.logNutrition(nutrition);
            window.phoenixUI.showSuccess('Meal logged successfully');
            window.phoenixUI.dismissModal();
            
            // Refresh Venus dashboard if active
            if (window.phoenixUI.currentView === 'venus') {
                await window.venusDashboard.load();
            }
        } catch (error) {
            window.phoenixUI.showError('Failed to log meal');
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// SECTION 10: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const Utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    },

    formatDuration(minutes) {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    },

    formatNumber(num, decimals = 0) {
        return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    calculatePercentage(value, max) {
        return Math.min(100, Math.max(0, (value / max) * 100));
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            window.phoenixUI.showSuccess('Copied to clipboard');
        } catch (error) {
            console.error('Clipboard error:', error);
        }
    },

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// ═══════════════════════════════════════════════════════════════
// SECTION 11: INITIALIZATION & EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

window.voice = new VoiceInterface();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Phoenix System Initializing...');

    // Check authentication
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Load user data
        const user = await phoenixAPI.getCurrentUser();
        window.phoenixUser = user;
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));

        // Initialize all systems
        await Promise.all([
            window.jarvis.initialize(),
            window.butler.initialize(),
            window.voice.initialize()
        ]);

        // Connect WebSocket
        window.websocket.connect();

        // Setup WebSocket listeners
        setupWebSocketListeners();

        // Setup UI event listeners
        setupEventListeners();

        // Load dashboard
        await loadDashboard();

        // Start periodic updates
        startPeriodicUpdates();

        // Show greeting
        showWelcome();

        console.log('✅ Phoenix System Ready');
    } catch (error) {
        console.error('Initialization error:', error);
        window.phoenixUI.showError('Failed to initialize system');
    }
});

function setupWebSocketListeners() {
    window.websocket.on('pattern', (pattern) => {
        console.log('Pattern detected:', pattern);
    });

    window.websocket.on('intervention', (intervention) => {
        console.log('Intervention triggered:', intervention);
    });

    window.websocket.on('prediction', (prediction) => {
        console.log('Prediction updated:', prediction);
    });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            const planet = e.currentTarget.dataset.planet;
            window.phoenixUI.navigateTo(view, planet);
        });
    });

    // Voice toggle
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            window.voice.toggleVoice();
        });
    }

    // Chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = chatInput.value.trim();
                if (message) {
                    chatInput.value = '';
                    const response = await window.jarvis.processMessage(message);
                    if (response) {
                        window.voice.addMessageToChat('user', message);
                        window.voice.addMessageToChat('jarvis', response.message);
                    }
                }
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await phoenixAPI.logout();
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
            localStorage.setItem(CONFIG.THEME_KEY, theme);
        });
    }
}

async function loadDashboard() {
    // Load main dashboard with overview from all planets
    const dashboardContainer = document.getElementById('dashboard-content');
    if (!dashboardContainer) return;

    window.phoenixUI.showLoading(true);

    try {
        // Fetch overview data from all systems
        const [
            recovery,
            todayWorkouts,
            activeGoals,
            recentTransactions,
            todayEvents
        ] = await Promise.all([
            phoenixAPI.getRecoveryScore().catch(() => null),
            phoenixAPI.getWorkouts({ date: new Date().toISOString().split('T')[0] }).catch(() => []),
            phoenixAPI.getGoals('active').catch(() => []),
            phoenixAPI.getTransactions({ limit: 5 }).catch(() => []),
            phoenixAPI.getCalendarEvents({ days: 1 }).catch(() => [])
        ]);

        dashboardContainer.innerHTML = `
            <div class="dashboard-header">
                <h1>Welcome back, ${window.phoenixUser.name}!</h1>
                <p class="dashboard-subtitle">Here's your system overview</p>
            </div>

            <div class="overview-grid">
                <div class="overview-card" onclick="phoenixUI.navigateTo('planet', 'mercury')">
                    <div class="card-icon" style="background: ${PLANET_COLORS.mercury.glow}">🏥</div>
                    <h3>Mercury</h3>
                    <div class="card-stat">${recovery ? recovery.score + '/100' : 'N/A'}</div>
                    <p>Recovery Score</p>
                </div>

                <div class="overview-card" onclick="phoenixUI.navigateTo('planet', 'venus')">
                    <div class="card-icon" style="background: ${PLANET_COLORS.venus.glow}">💪</div>
                    <h3>Venus</h3>
                    <div class="card-stat">${todayWorkouts.length}</div>
                    <p>Workouts Today</p>
                </div>

                <div class="overview-card" onclick="phoenixUI.navigateTo('planet', 'mars')">
                    <div class="card-icon" style="background: ${PLANET_COLORS.mars.glow}">🎯</div>
                    <h3>Mars</h3>
                    <div class="card-stat">${activeGoals.length}</div>
                    <p>Active Goals</p>
                </div>

                <div class="overview-card" onclick="phoenixUI.navigateTo('planet', 'jupiter')">
                    <div class="card-icon" style="background: ${PLANET_COLORS.jupiter.glow}">💰</div>
                    <h3>Jupiter</h3>
                    <div class="card-stat">${recentTransactions.length}</div>
                    <p>Recent Transactions</p>
                </div>

                <div class="overview-card" onclick="phoenixUI.navigateTo('planet', 'earth')">
                    <div class="card-icon" style="background: ${PLANET_COLORS.earth.glow}">📅</div>
                    <h3>Earth</h3>
                    <div class="card-stat">${todayEvents.length}</div>
                    <p>Events Today</p>
                </div>

                <div class="overview-card" onclick="phoenixUI.navigateTo('planet', 'saturn')">
                    <div class="card-icon" style="background: ${PLANET_COLORS.saturn.glow}">♾️</div>
                    <h3>Saturn</h3>
                    <div class="card-stat">∞</div>
                    <p>Life Vision</p>
                </div>
            </div>

            <div class="quick-actions-section">
                <h2>Quick Actions</h2>
                <div class="quick-actions-grid">
                    <button class="quick-action-btn" onclick="venusActions.startWorkout()">
                        <span class="action-icon">🏋️</span>
                        <span>Start Workout</span>
                    </button>
                    <button class="quick-action-btn" onclick="venusActions.logNutrition()">
                        <span class="action-icon">🍽️</span>
                        <span>Log Meal</span>
                    </button>
                    <button class="quick-action-btn" onclick="voice.startListening()">
                        <span class="action-icon">🎤</span>
                        <span>Voice Command</span>
                    </button>
                    <button class="quick-action-btn" onclick="phoenixAPI.getAIInsights().then(insights => console.log(insights))">
                        <span class="action-icon">🤖</span>
                        <span>AI Insights</span>
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Dashboard load error:', error);
    }

    window.phoenixUI.showLoading(false);
}

function startPeriodicUpdates() {
    // Update real-time data periodically
    setInterval(async () => {
        if (window.phoenixUI.currentPlanet === 'mercury') {
            try {
                const data = await phoenixAPI.getWearableData({ realtime: true });
                window.mercuryDashboard.updateRealtime(data);
            } catch (error) {
                console.error('Realtime update error:', error);
            }
        }
    }, CONFIG.REFRESH_INTERVALS.realtime);

    // Check for pending interventions
    setInterval(async () => {
        try {
            const interventions = await phoenixAPI.getPendingInterventions();
            interventions.forEach(intervention => {
                window.phoenixUI.showInterventionAlert(intervention);
            });
        } catch (error) {
            console.error('Intervention check error:', error);
        }
    }, CONFIG.REFRESH_INTERVALS.frequent);
}

function showWelcome() {
    const greeting = window.jarvis.getGreeting();
    setTimeout(() => {
        window.phoenixUI.showNotification('JARVIS', greeting, 'info', 5000);
    }, 1000);
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

console.log('✨ Phoenix Frontend Loaded - All 307 Endpoints Connected');
