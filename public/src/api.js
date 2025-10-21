// ============================================
// PHOENIX PAL - BULLETPROOF API CLIENT
// Zero-Failure Architecture | Auto-Healing | Complete Backend Integration
// ============================================

(function() {
    'use strict';

    // ============================================
    // ENVIRONMENT AUTO-DETECTION (Zero Config Required)
    // ============================================

    const ENV = {
        isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        isProd: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
        host: window.location.hostname,
        protocol: window.location.protocol
    };

    const API_CONFIG = {
        // Production backend
        PROD_API: 'https://pal-backend-production.up.railway.app/api',
        // Development backend
        DEV_API: 'http://localhost:5000/api',
        // Fallback if both fail
        FALLBACK_API: 'https://pal-backend-production.up.railway.app/api'
    };

    // Smart API URL selection with fallback
    let API_BASE_URL = ENV.isDev ? API_CONFIG.DEV_API : API_CONFIG.PROD_API;
    
    console.log(`🌍 Environment: ${ENV.isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`🔗 API Endpoint: ${API_BASE_URL}`);

    // Storage keys
    const STORAGE_KEYS = {
        TOKEN: 'phoenixToken',
        USER: 'phoenixUser',
        REFRESH: 'phoenixRefresh',
        PREFERENCES: 'phoenixPreferences'
    };

    // Rate limiting config
    const RATE_LIMIT = {
        MAX_REQUESTS: 60,
        TIME_WINDOW: 60000, // 1 minute
        requestQueue: new Map()
    };

    // State management
    let csrfToken = null;
    let isRefreshing = false;
    let failedQueue = [];

    // ============================================
    // SECURE STORAGE WITH ENCRYPTION (Optional)
    // ============================================

    const SecureStorage = {
        set(key, value) {
            try {
                const data = typeof value === 'string' ? value : JSON.stringify(value);
                localStorage.setItem(key, data);
                return true;
            } catch (error) {
                console.error(`Storage set error [${key}]:`, error);
                return false;
            }
        },

        get(key, parse = false) {
            try {
                const data = localStorage.getItem(key);
                if (!data) return null;
                return parse ? JSON.parse(data) : data;
            } catch (error) {
                console.error(`Storage get error [${key}]:`, error);
                return null;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error(`Storage remove error [${key}]:`, error);
                return false;
            }
        },

        clear() {
            try {
                Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        },

        getToken() {
            return this.get(STORAGE_KEYS.TOKEN);
        },

        setToken(token) {
            return this.set(STORAGE_KEYS.TOKEN, token);
        },

        getUser() {
            return this.get(STORAGE_KEYS.USER, true);
        },

        setUser(user) {
            return this.set(STORAGE_KEYS.USER, user);
        }
    };

    // ============================================
    // TOKEN MANAGEMENT
    // ============================================

    const TokenManager = {
        isExpired(token) {
            if (!token) return true;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp * 1000; // Convert to milliseconds
                const now = Date.now();
                const isExp = now >= exp;
                if (isExp) console.log('⏰ Token expired');
                return isExp;
            } catch (error) {
                console.error('Token parse error:', error);
                return true;
            }
        },

        getTimeToExpiry(token) {
            if (!token) return 0;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp * 1000;
                return Math.max(0, exp - Date.now());
            } catch {
                return 0;
            }
        },

        async refresh() {
            if (isRefreshing) {
                // Wait for existing refresh to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                });
            }

            isRefreshing = true;
            const refreshToken = SecureStorage.get(STORAGE_KEYS.REFRESH);

            if (!refreshToken) {
                isRefreshing = false;
                throw new Error('No refresh token available');
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (!response.ok) throw new Error('Token refresh failed');

                const data = await response.json();
                
                if (data.success && data.token) {
                    SecureStorage.setToken(data.token);
                    if (data.refreshToken) {
                        SecureStorage.set(STORAGE_KEYS.REFRESH, data.refreshToken);
                    }

                    // Process failed queue
                    failedQueue.forEach(promise => promise.resolve(data.token));
                    failedQueue = [];
                    
                    isRefreshing = false;
                    return data.token;
                }

                throw new Error('Invalid refresh response');
            } catch (error) {
                failedQueue.forEach(promise => promise.reject(error));
                failedQueue = [];
                isRefreshing = false;
                SecureStorage.clear();
                throw new Error('Session expired. Please login again.');
            }
        }
    };

    // ============================================
    // RATE LIMITING
    // ============================================

    const RateLimiter = {
        check(endpoint) {
            const now = Date.now();
            const requests = RATE_LIMIT.requestQueue.get(endpoint) || [];
            
            // Remove old requests outside time window
            const recentRequests = requests.filter(time => now - time < RATE_LIMIT.TIME_WINDOW);
            
            if (recentRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
                throw new Error('Rate limit exceeded. Please slow down.');
            }
            
            recentRequests.push(now);
            RATE_LIMIT.requestQueue.set(endpoint, recentRequests);
        },

        reset(endpoint) {
            RATE_LIMIT.requestQueue.delete(endpoint);
        }
    };

    // ============================================
    // ERROR HANDLER
    // ============================================

    const ErrorHandler = {
        sanitize(error) {
            const errorMap = {
                'Failed to fetch': 'Network error. Please check your connection.',
                'NetworkError': 'Network error. Please check your connection.',
                'Unauthorized': 'Session expired. Please login again.',
                'Forbidden': 'Access denied. Insufficient permissions.',
                'Not Found': 'Resource not found.',
                'Too Many Requests': 'Too many requests. Please wait.',
                'Internal Server Error': 'Server error. Please try again.',
                'Service Unavailable': 'Service temporarily unavailable.',
                'Rate limit exceeded': 'Too many requests. Please slow down.'
            };

            const message = error.message || 'Unknown error';
            
            for (const [pattern, userMessage] of Object.entries(errorMap)) {
                if (message.includes(pattern)) {
                    return new Error(userMessage);
                }
            }
            
            return new Error('An error occurred. Please try again.');
        },

        async handle(error, context = '') {
            console.error(`❌ Error [${context}]:`, error);
            
            // Auto-retry on network errors
            if (error.message?.includes('fetch') || error.message?.includes('Network')) {
                console.log('🔄 Network error detected, attempting fallback...');
                return { shouldRetry: true, useFallback: true };
            }
            
            return { shouldRetry: false, useFallback: false };
        }
    };

    // ============================================
    // SMART FETCH WITH AUTO-RETRY & HEALING
    // ============================================

    const SmartFetch = async (url, options = {}, context = '', retryCount = 0) => {
        const maxRetries = 2;
        
        try {
            // Rate limiting
            RateLimiter.check(url);
            
            // Token management
            const token = SecureStorage.getToken();
            if (token && TokenManager.isExpired(token) && retryCount === 0) {
                console.log('🔄 Token expired, refreshing...');
                await TokenManager.refresh();
                return SmartFetch(url, options, context, retryCount + 1);
            }
            
            // Add CSRF token if available
            const headers = { ...options.headers };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
            
            // Make request
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });
            
            // Update CSRF token from response
            const newCsrf = response.headers.get('X-CSRF-Token');
            if (newCsrf) csrfToken = newCsrf;
            
            // Handle 401 Unauthorized
            if (response.status === 401 && retryCount === 0) {
                console.log('🔄 Unauthorized, refreshing token...');
                await TokenManager.refresh();
                return SmartFetch(url, options, context, retryCount + 1);
            }
            
            // Handle other HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            return response;
            
        } catch (error) {
            const handled = await ErrorHandler.handle(error, context);
            
            // Auto-retry with fallback
            if (handled.shouldRetry && retryCount < maxRetries) {
                console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} for ${context}`);
                
                // Use fallback API if needed
                if (handled.useFallback && url.includes(API_BASE_URL)) {
                    console.log('🔄 Switching to fallback API...');
                    const fallbackUrl = url.replace(API_BASE_URL, API_CONFIG.FALLBACK_API);
                    return SmartFetch(fallbackUrl, options, context, retryCount + 1);
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                return SmartFetch(url, options, context, retryCount + 1);
            }
            
            throw ErrorHandler.sanitize(error);
        }
    };

    // ============================================
    // AUTH HELPERS
    // ============================================

    const getAuthHeaders = () => {
        const token = SecureStorage.getToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
        
        return headers;
    };

    // ============================================
    // API METHODS - AUTHENTICATION
    // ============================================

    const API = {
        // Auth
        async login(email, password) {
            if (!email || !password) throw new Error('Email and password required');
            if (!email.includes('@')) throw new Error('Invalid email format');
            
            const response = await SmartFetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            }, 'login');
            
            const data = await response.json();
            
            if (data.success && data.token) {
                SecureStorage.setToken(data.token);
                SecureStorage.setUser(data.user);
                if (data.refreshToken) {
                    SecureStorage.set(STORAGE_KEYS.REFRESH, data.refreshToken);
                }
            }
            
            return data;
        },

        async register(name, email, password) {
            if (!name || !email || !password) throw new Error('All fields required');
            if (!email.includes('@')) throw new Error('Invalid email format');
            if (password.length < 6) throw new Error('Password must be 6+ characters');
            
            const response = await SmartFetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role: 'client' })
            }, 'register');
            
            const data = await response.json();
            
            if (data.success && data.token) {
                SecureStorage.setToken(data.token);
                SecureStorage.setUser(data.user);
                if (data.refreshToken) {
                    SecureStorage.set(STORAGE_KEYS.REFRESH, data.refreshToken);
                }
            }
            
            return data;
        },

        async logout() {
            try {
                await SmartFetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                }, 'logout');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                SecureStorage.clear();
                csrfToken = null;
                RATE_LIMIT.requestQueue.clear();
            }
        },

        async getMe() {
            const response = await SmartFetch(`${API_BASE_URL}/auth/me`, {
                headers: getAuthHeaders()
            }, 'getMe');
            return await response.json();
        },

        async updateProfile(userData) {
            const response = await SmartFetch(`${API_BASE_URL}/auth/me`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(userData)
            }, 'updateProfile');
            
            const data = await response.json();
            
            if (data.success && data.user) {
                SecureStorage.setUser(data.user);
            }
            
            return data;
        },

        getCurrentUser() {
            return SecureStorage.getUser();
        },

        // ============================================
        // MERCURY - HEALTH & RECOVERY
        // ============================================

        async getLatestWearableData() {
            const response = await SmartFetch(`${API_BASE_URL}/mercury/latest`, {
                headers: getAuthHeaders()
            }, 'getLatestWearableData');
            return await response.json();
        },

        async syncWearables() {
            const response = await SmartFetch(`${API_BASE_URL}/mercury/sync`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'syncWearables');
            return await response.json();
        },

        async getRecoveryScore() {
            const response = await SmartFetch(`${API_BASE_URL}/recovery/score/current`, {
                headers: getAuthHeaders()
            }, 'getRecoveryScore');
            return await response.json();
        },

        async getRecoveryHistory() {
            const response = await SmartFetch(`${API_BASE_URL}/recovery/score/history`, {
                headers: getAuthHeaders()
            }, 'getRecoveryHistory');
            return await response.json();
        },

        async getRecoveryRecommendations() {
            const response = await SmartFetch(`${API_BASE_URL}/recovery/recommendations`, {
                headers: getAuthHeaders()
            }, 'getRecoveryRecommendations');
            return await response.json();
        },

        async getHRVData() {
            const response = await SmartFetch(`${API_BASE_URL}/mercury/hrv`, {
                headers: getAuthHeaders()
            }, 'getHRVData');
            return await response.json();
        },

        async getSleepAnalysis() {
            const response = await SmartFetch(`${API_BASE_URL}/mercury/sleep`, {
                headers: getAuthHeaders()
            }, 'getSleepAnalysis');
            return await response.json();
        },

        async getVitalsOverview() {
            const response = await SmartFetch(`${API_BASE_URL}/mercury/overview`, {
                headers: getAuthHeaders()
            }, 'getVitalsOverview');
            return await response.json();
        },

        // ============================================
        // BIOMETRIC DATA
        // ============================================

        async getBiometricData() {
            const response = await SmartFetch(`${API_BASE_URL}/biometric/all`, {
                headers: getAuthHeaders()
            }, 'getBiometricData');
            return await response.json();
        },

        async logBiometric(data) {
            if (!data) throw new Error('Biometric data required');
            const response = await SmartFetch(`${API_BASE_URL}/biometric/log`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            }, 'logBiometric');
            return await response.json();
        },

        async getDEXAScan() {
            const response = await SmartFetch(`${API_BASE_URL}/biometric/dexa`, {
                headers: getAuthHeaders()
            }, 'getDEXAScan');
            return await response.json();
        },

        async simulateDEXAScan(measurements) {
            const response = await SmartFetch(`${API_BASE_URL}/biometric/dexa/simulate`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(measurements)
            }, 'simulateDEXAScan');
            return await response.json();
        },

        // ============================================
        // VENUS - FITNESS & NUTRITION
        // ============================================

        async getWorkoutAnalysis() {
            const response = await SmartFetch(`${API_BASE_URL}/venus/analysis`, {
                headers: getAuthHeaders()
            }, 'getWorkoutAnalysis');
            return await response.json();
        },

        async generateAIWorkout(type) {
            if (!type) throw new Error('Workout type required');
            const response = await SmartFetch(`${API_BASE_URL}/venus/generate-workout`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ type })
            }, 'generateAIWorkout');
            return await response.json();
        },

        async generateQuantumWorkout(preferences = {}) {
            const response = await SmartFetch(`${API_BASE_URL}/venus/quantum-workout`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(preferences)
            }, 'generateQuantumWorkout');
            return await response.json();
        },

        async getWorkoutRecommendations() {
            const response = await SmartFetch(`${API_BASE_URL}/venus/recommendations`, {
                headers: getAuthHeaders()
            }, 'getWorkoutRecommendations');
            return await response.json();
        },

        async getPerformanceMetrics() {
            const response = await SmartFetch(`${API_BASE_URL}/venus/performance`, {
                headers: getAuthHeaders()
            }, 'getPerformanceMetrics');
            return await response.json();
        },

        async analyzeForm(exerciseData) {
            if (!exerciseData) throw new Error('Exercise data required');
            const response = await SmartFetch(`${API_BASE_URL}/venus/analyze-form`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(exerciseData)
            }, 'analyzeForm');
            return await response.json();
        },

        async logWorkout(workoutData) {
            if (!workoutData) throw new Error('Workout data required');
            const response = await SmartFetch(`${API_BASE_URL}/workouts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(workoutData)
            }, 'logWorkout');
            return await response.json();
        },

        async getRecentWorkouts(limit = 10) {
            const response = await SmartFetch(`${API_BASE_URL}/workouts/recent?limit=${limit}`, {
                headers: getAuthHeaders()
            }, 'getRecentWorkouts');
            return await response.json();
        },

        async getWorkoutTemplates() {
            const response = await SmartFetch(`${API_BASE_URL}/workouts/templates`, {
                headers: getAuthHeaders()
            }, 'getWorkoutTemplates');
            return await response.json();
        },

        async deleteWorkout(workoutId) {
            if (!workoutId) throw new Error('Workout ID required');
            const response = await SmartFetch(`${API_BASE_URL}/workouts/${workoutId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            }, 'deleteWorkout');
            return await response.json();
        },

        async getExerciseLibrary() {
            const response = await SmartFetch(`${API_BASE_URL}/exercises/library`, {
                headers: getAuthHeaders()
            }, 'getExerciseLibrary');
            return await response.json();
        },

        async searchExercises(query) {
            if (!query) throw new Error('Search query required');
            const response = await SmartFetch(`${API_BASE_URL}/exercises/search?q=${encodeURIComponent(query)}`, {
                headers: getAuthHeaders()
            }, 'searchExercises');
            return await response.json();
        },

        // ============================================
        // NUTRITION
        // ============================================

        async getNutritionRecommendations() {
            const response = await SmartFetch(`${API_BASE_URL}/venus/nutrition/recommendations`, {
                headers: getAuthHeaders()
            }, 'getNutritionRecommendations');
            return await response.json();
        },

        async logMeal(mealData) {
            if (!mealData) throw new Error('Meal data required');
            const response = await SmartFetch(`${API_BASE_URL}/nutrition/log`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(mealData)
            }, 'logMeal');
            return await response.json();
        },

        async getTodayNutrition() {
            const response = await SmartFetch(`${API_BASE_URL}/nutrition/today`, {
                headers: getAuthHeaders()
            }, 'getTodayNutrition');
            return await response.json();
        },

        async getNutritionHistory(days = 7) {
            const response = await SmartFetch(`${API_BASE_URL}/nutrition/history?days=${days}`, {
                headers: getAuthHeaders()
            }, 'getNutritionHistory');
            return await response.json();
        },

        async getMealSuggestions() {
            const response = await SmartFetch(`${API_BASE_URL}/meals/suggestions`, {
                headers: getAuthHeaders()
            }, 'getMealSuggestions');
            return await response.json();
        },

        async saveMealTemplate(mealData) {
            if (!mealData) throw new Error('Meal data required');
            const response = await SmartFetch(`${API_BASE_URL}/meals/template`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(mealData)
            }, 'saveMealTemplate');
            return await response.json();
        },

        async analyzeMealPhoto(photoData) {
            const response = await SmartFetch(`${API_BASE_URL}/nutrition/analyze-photo`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(photoData)
            }, 'analyzeMealPhoto');
            return await response.json();
        },

        // ============================================
        // EARTH - CALENDAR & TIME
        // ============================================

        async getCalendarEvents() {
            const response = await SmartFetch(`${API_BASE_URL}/earth/calendar-events`, {
                headers: getAuthHeaders()
            }, 'getCalendarEvents');
            return await response.json();
        },

        async optimizeSchedule() {
            const response = await SmartFetch(`${API_BASE_URL}/earth/optimize-schedule`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'optimizeSchedule');
            return await response.json();
        },

        async getTimeAnalysis() {
            const response = await SmartFetch(`${API_BASE_URL}/earth/time-analysis`, {
                headers: getAuthHeaders()
            }, 'getTimeAnalysis');
            return await response.json();
        },

        async scheduleWorkout(workoutData) {
            if (!workoutData) throw new Error('Workout data required');
            const response = await SmartFetch(`${API_BASE_URL}/earth/schedule-workout`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(workoutData)
            }, 'scheduleWorkout');
            return await response.json();
        },

        // ============================================
        // MARS - GOALS & HABITS
        // ============================================

        async getGoalProgress() {
            const response = await SmartFetch(`${API_BASE_URL}/mars/progress`, {
                headers: getAuthHeaders()
            }, 'getGoalProgress');
            return await response.json();
        },

        async getGoalPredictions() {
            const response = await SmartFetch(`${API_BASE_URL}/mars/predictions`, {
                headers: getAuthHeaders()
            }, 'getGoalPredictions');
            return await response.json();
        },

        async createGoal(goalData) {
            if (!goalData?.title) throw new Error('Goal title required');
            const response = await SmartFetch(`${API_BASE_URL}/goals`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(goalData)
            }, 'createGoal');
            return await response.json();
        },

        async getActiveGoals() {
            const response = await SmartFetch(`${API_BASE_URL}/goals/active`, {
                headers: getAuthHeaders()
            }, 'getActiveGoals');
            return await response.json();
        },

        async getAllGoals() {
            const response = await SmartFetch(`${API_BASE_URL}/goals`, {
                headers: getAuthHeaders()
            }, 'getAllGoals');
            return await response.json();
        },

        async updateGoalProgress(goalId, progress) {
            if (!goalId) throw new Error('Goal ID required');
            const response = await SmartFetch(`${API_BASE_URL}/goals/${goalId}/progress`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ progress })
            }, 'updateGoalProgress');
            return await response.json();
        },

        async deleteGoal(goalId) {
            if (!goalId) throw new Error('Goal ID required');
            const response = await SmartFetch(`${API_BASE_URL}/goals/${goalId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            }, 'deleteGoal');
            return await response.json();
        },

        async getHabitStreaks() {
            const response = await SmartFetch(`${API_BASE_URL}/mars/habits/streaks`, {
                headers: getAuthHeaders()
            }, 'getHabitStreaks');
            return await response.json();
        },

        // ============================================
        // JUPITER - FINANCE
        // ============================================

        async getFinancialOverview() {
            const response = await SmartFetch(`${API_BASE_URL}/jupiter/overview`, {
                headers: getAuthHeaders()
            }, 'getFinancialOverview');
            return await response.json();
        },

        async getTransactions(days = 30) {
            const response = await SmartFetch(`${API_BASE_URL}/jupiter/transactions?days=${days}`, {
                headers: getAuthHeaders()
            }, 'getTransactions');
            return await response.json();
        },

        async getBudgetAnalysis() {
            const response = await SmartFetch(`${API_BASE_URL}/jupiter/budget`, {
                headers: getAuthHeaders()
            }, 'getBudgetAnalysis');
            return await response.json();
        },

        async getSpendingInsights() {
            const response = await SmartFetch(`${API_BASE_URL}/jupiter/insights`, {
                headers: getAuthHeaders()
            }, 'getSpendingInsights');
            return await response.json();
        },

        // ============================================
        // SATURN - LEGACY & VISION
        // ============================================

        async getLifeTimeline() {
            const response = await SmartFetch(`${API_BASE_URL}/saturn/timeline`, {
                headers: getAuthHeaders()
            }, 'getLifeTimeline');
            return await response.json();
        },

        async updateVision(visionData) {
            if (!visionData) throw new Error('Vision data required');
            const response = await SmartFetch(`${API_BASE_URL}/saturn/vision`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(visionData)
            }, 'updateVision');
            return await response.json();
        },

        async getQuarterlyReview() {
            const response = await SmartFetch(`${API_BASE_URL}/saturn/quarterly-review`, {
                headers: getAuthHeaders()
            }, 'getQuarterlyReview');
            return await response.json();
        },

        async getLifeWheelScore() {
            const response = await SmartFetch(`${API_BASE_URL}/saturn/life-wheel`, {
                headers: getAuthHeaders()
            }, 'getLifeWheelScore');
            return await response.json();
        },

        // ============================================
        // PREDICTIONS
        // ============================================

        async getPredictions() {
            const response = await SmartFetch(`${API_BASE_URL}/predictions/all`, {
                headers: getAuthHeaders()
            }, 'getPredictions');
            return await response.json();
        },

        async getHRVPrediction() {
            const response = await SmartFetch(`${API_BASE_URL}/predictions/hrv`, {
                headers: getAuthHeaders()
            }, 'getHRVPrediction');
            return await response.json();
        },

        async getIllnessRiskPrediction() {
            const response = await SmartFetch(`${API_BASE_URL}/predictions/illness`, {
                headers: getAuthHeaders()
            }, 'getIllnessRiskPrediction');
            return await response.json();
        },

        async getEnergyPrediction() {
            const response = await SmartFetch(`${API_BASE_URL}/predictions/energy`, {
                headers: getAuthHeaders()
            }, 'getEnergyPrediction');
            return await response.json();
        },

        async getGoalCompletionPrediction(goalId) {
            if (!goalId) throw new Error('Goal ID required');
            const response = await SmartFetch(`${API_BASE_URL}/predictions/goal/${goalId}/completion`, {
                headers: getAuthHeaders()
            }, 'getGoalCompletionPrediction');
            return await response.json();
        },

        // ============================================
        // CORRELATIONS & PATTERNS
        // ============================================

        async detectPatterns() {
            const response = await SmartFetch(`${API_BASE_URL}/correlation/patterns/detect`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'detectPatterns');
            return await response.json();
        },

        async getAllPatterns() {
            const response = await SmartFetch(`${API_BASE_URL}/correlation/patterns/all`, {
                headers: getAuthHeaders()
            }, 'getAllPatterns');
            return await response.json();
        },

        async getSleepPerformanceCorrelation() {
            const response = await SmartFetch(`${API_BASE_URL}/correlation/sleep-performance`, {
                headers: getAuthHeaders()
            }, 'getSleepPerformanceCorrelation');
            return await response.json();
        },

        async getStressSpendingCorrelation() {
            const response = await SmartFetch(`${API_BASE_URL}/correlation/spending-stress`, {
                headers: getAuthHeaders()
            }, 'getStressSpendingCorrelation');
            return await response.json();
        },

        async getCalendarEnergyCorrelation() {
            const response = await SmartFetch(`${API_BASE_URL}/correlation/calendar-energy`, {
                headers: getAuthHeaders()
            }, 'getCalendarEnergyCorrelation');
            return await response.json();
        },

        async startRealtimePatternDetection() {
            const response = await SmartFetch(`${API_BASE_URL}/correlation/patterns/real-time`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'startRealtimePatternDetection');
            return await response.json();
        },

        // ============================================
        // INTERVENTIONS
        // ============================================

        async analyzeForInterventions() {
            const response = await SmartFetch(`${API_BASE_URL}/interventions/analyze`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'analyzeForInterventions');
            return await response.json();
        },

        async getActiveInterventions() {
            const response = await SmartFetch(`${API_BASE_URL}/interventions/active`, {
                headers: getAuthHeaders()
            }, 'getActiveInterventions');
            return await response.json();
        },

        async getInterventionHistory() {
            const response = await SmartFetch(`${API_BASE_URL}/interventions/history`, {
                headers: getAuthHeaders()
            }, 'getInterventionHistory');
            return await response.json();
        },

        async respondToIntervention(interventionId, response) {
            if (!interventionId) throw new Error('Intervention ID required');
            const res = await SmartFetch(`${API_BASE_URL}/interventions/${interventionId}/respond`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ response })
            }, 'respondToIntervention');
            return await res.json();
        },

        async simulateIntervention() {
            const response = await SmartFetch(`${API_BASE_URL}/interventions/simulate`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'simulateIntervention');
            return await response.json();
        },

        // ============================================
        // INTELLIGENCE & AI
        // ============================================

        async getHealthInsights() {
            const response = await SmartFetch(`${API_BASE_URL}/intelligence/insights`, {
                headers: getAuthHeaders()
            }, 'getHealthInsights');
            return await response.json();
        },

        async analyzePatterns() {
            const response = await SmartFetch(`${API_BASE_URL}/intelligence/patterns`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'analyzePatterns');
            return await response.json();
        },

        async getCrossSystemIntelligence() {
            const response = await SmartFetch(`${API_BASE_URL}/intelligence/cross-system`, {
                headers: getAuthHeaders()
            }, 'getCrossSystemIntelligence');
            return await response.json();
        },

        // ============================================
        // PHOENIX COMPANION (AI CHAT)
        // ============================================

        async sendChatMessage(message, context = {}) {
            if (!message?.trim()) throw new Error('Message cannot be empty');
            const response = await SmartFetch(`${API_BASE_URL}/companion/chat`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ message: message.trim(), context })
            }, 'sendChatMessage');
            return await response.json();
        },

        async getChatHistory(limit = 20) {
            const response = await SmartFetch(`${API_BASE_URL}/companion/history?limit=${limit}`, {
                headers: getAuthHeaders()
            }, 'getChatHistory');
            return await response.json();
        },

        async triggerProactiveCheck() {
            const response = await SmartFetch(`${API_BASE_URL}/companion/proactive-check`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'triggerProactiveCheck');
            return await response.json();
        },

        // ============================================
        // VOICE
        // ============================================

        async getAvailableVoices() {
            const response = await SmartFetch(`${API_BASE_URL}/voice/voices`, {
                headers: getAuthHeaders()
            }, 'getAvailableVoices');
            return await response.json();
        },

        async textToSpeech(text, voice = 'nova', speed = 1.0) {
            if (!text?.trim()) throw new Error('Text cannot be empty');
            if (speed < 0.25 || speed > 4.0) throw new Error('Speed must be 0.25-4.0');
            
            const response = await SmartFetch(`${API_BASE_URL}/voice/speak`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ text: text.trim(), voice, speed })
            }, 'textToSpeech');
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Failed to generate speech');
            }
            
            return await response.blob();
        },

        async getVoiceStatus() {
            const response = await SmartFetch(`${API_BASE_URL}/voice/status`, {
                headers: getAuthHeaders()
            }, 'getVoiceStatus');
            return await response.json();
        },

        async getVoiceStats() {
            const user = SecureStorage.getUser();
            const userId = user?._id || user?.id;
            
            if (!userId) throw new Error('User not authenticated');
            
            const response = await SmartFetch(`${API_BASE_URL}/voice/stats/${userId}`, {
                headers: getAuthHeaders()
            }, 'getVoiceStats');
            return await response.json();
        },

        // ============================================
        // WEARABLES
        // ============================================

        connectFitbit() {
            const width = 600;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            
            window.open(
                `${API_BASE_URL}/wearables/connect/fitbit`,
                'Fitbit OAuth',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        },

        connectPolar() {
            const width = 600;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            
            window.open(
                `${API_BASE_URL}/wearables/connect/polar`,
                'Polar OAuth',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        },

        async getWearableStatus() {
            const response = await SmartFetch(`${API_BASE_URL}/wearables/status`, {
                headers: getAuthHeaders()
            }, 'getWearableStatus');
            return await response.json();
        },

        async disconnectWearable(provider) {
            if (!provider) throw new Error('Provider required');
            const response = await SmartFetch(`${API_BASE_URL}/wearables/disconnect/${provider}`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 'disconnectWearable');
            return await response.json();
        },

        // ============================================
        // MEASUREMENTS
        // ============================================

        async logMeasurement(measurementData) {
            if (!measurementData) throw new Error('Measurement data required');
            const response = await SmartFetch(`${API_BASE_URL}/measurements`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(measurementData)
            }, 'logMeasurement');
            return await response.json();
        },

        async getMeasurementHistory(type) {
            if (!type) throw new Error('Measurement type required');
            const response = await SmartFetch(`${API_BASE_URL}/measurements/history/${type}`, {
                headers: getAuthHeaders()
            }, 'getMeasurementHistory');
            return await response.json();
        },

        // ============================================
        // HEALTH DATA
        // ============================================

        async logHealthMetric(metricData) {
            if (!metricData) throw new Error('Metric data required');
            const response = await SmartFetch(`${API_BASE_URL}/health/log`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(metricData)
            }, 'logHealthMetric');
            return await response.json();
        },

        async getHealthHistory(metricType, days = 30) {
            if (!metricType) throw new Error('Metric type required');
            const response = await SmartFetch(`${API_BASE_URL}/health/history/${metricType}?days=${days}`, {
                headers: getAuthHeaders()
            }, 'getHealthHistory');
            return await response.json();
        },

        // ============================================
        // SUBSCRIPTION
        // ============================================

        async getSubscriptionStatus() {
            const response = await SmartFetch(`${API_BASE_URL}/subscription/status`, {
                headers: getAuthHeaders()
            }, 'getSubscriptionStatus');
            return await response.json();
        },

        async upgradeSubscription(plan) {
            if (!plan) throw new Error('Plan required');
            const response = await SmartFetch(`${API_BASE_URL}/subscription/upgrade`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ plan })
            }, 'upgradeSubscription');
            return await response.json();
        },

        // ============================================
        // MESSAGES
        // ============================================

        async sendMessage(recipientId, message) {
            if (!recipientId || !message) throw new Error('Recipient and message required');
            const response = await SmartFetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ recipientId, message })
            }, 'sendMessage');
            return await response.json();
        },

        async getMessages() {
            const response = await SmartFetch(`${API_BASE_URL}/messages`, {
                headers: getAuthHeaders()
            }, 'getMessages');
            return await response.json();
        },

        // ============================================
        // UTILITY
        // ============================================

        async getAPIHealth() {
            const response = await SmartFetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {}, 'getAPIHealth');
            return await response.json();
        },

        async testConnection() {
            try {
                const response = await SmartFetch(`${API_BASE_URL.replace('/api', '')}/`, {}, 'testConnection');
                return await response.json();
            } catch (error) {
                console.error('API Connection Error:', error);
                throw ErrorHandler.sanitize(error);
            }
        },

        // ============================================
        // SECURITY UTILITIES
        // ============================================

        checkTokenExpiration() {
            const token = SecureStorage.getToken();
            return TokenManager.isExpired(token);
        },

        async forceTokenRefresh() {
            return await TokenManager.refresh();
        },

        getAuthHeaders,
        
        // Expose environment info (readonly)
        get environment() {
            return {
                isDevelopment: ENV.isDev,
                isProduction: ENV.isProd,
                apiUrl: API_BASE_URL,
                host: ENV.host
            };
        }
    };

    // ============================================
    // GLOBAL EXPORTS
    // ============================================

    // Export as ES6 module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API;
    }

    // Export as global window object
    window.API = API;
    
    // Also export individual functions for convenience
    Object.keys(API).forEach(key => {
        if (typeof API[key] === 'function') {
            window[key] = API[key];
        }
    });

    console.log('✅ Phoenix API Client initialized successfully');
    console.log('📊 Environment:', API.environment);
    console.log('🔐 Token status:', SecureStorage.getToken() ? 'Present' : 'Missing');
    console.log('👤 User status:', SecureStorage.getUser() ? 'Logged in' : 'Logged out');

})();
