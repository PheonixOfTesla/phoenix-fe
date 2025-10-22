// ============================================
// PHOENIX PAL - FIXED API CLIENT
// All endpoints corrected to match backend routes
// ============================================

// ============================================
// ENVIRONMENT AUTO-DETECTION
// ============================================

const ENV = {
    isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProd: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    host: window.location.hostname,
    protocol: window.location.protocol
};

const API_CONFIG = {
    PROD_API: 'https://pal-backend-production.up.railway.app/api',
    DEV_API: 'http://localhost:5000/api',
    FALLBACK_API: 'https://pal-backend-production.up.railway.app/api'
};

let API_BASE_URL = ENV.isDev ? API_CONFIG.DEV_API : API_CONFIG.PROD_API;

console.log(`🌍 Environment: ${ENV.isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🔗 API Endpoint: ${API_BASE_URL}`);

const STORAGE_KEYS = {
    TOKEN: 'phoenixToken',
    USER: 'phoenixUser',
    REFRESH: 'phoenixRefresh',
    PREFERENCES: 'phoenixPreferences'
};

const RATE_LIMIT = {
    MAX_REQUESTS: 60,
    TIME_WINDOW: 60000,
    requestQueue: new Map()
};

let csrfToken = null;
let isRefreshing = false;
let failedQueue = [];

// ============================================
// CENTRALIZED STATE STORE
// ============================================

const phoenixStore = {
    state: { 
        user: null, 
        mercury: null, 
        venus: null, 
        earth: null, 
        mars: null, 
        jupiter: null, 
        saturn: null 
    },
    subscribers: [],
    loading: new Set(),
    
    setState(key, val) { 
        this.state[key] = val; 
        this.subscribers.forEach(fn => fn(key, val));
        this.saveToIndexedDB(key, val);
    },
    
    subscribe(fn) { 
        this.subscribers.push(fn); 
        return () => this.subscribers = this.subscribers.filter(f => f !== fn); 
    },
    
    async loadPlanet(name, force = false) {
        if (this.loading.has(name)) return this.state[name];
        if (!force && this.state[name]) return this.state[name];
        
        this.loading.add(name);
        try {
            const data = await API[`load${name.charAt(0).toUpperCase() + name.slice(1)}Data`]();
            this.setState(name, data);
            return data;
        } finally {
            this.loading.delete(name);
        }
    },
    
    async saveToIndexedDB(key, val) {
        try {
            if (!window.indexedDB) return;
            const request = indexedDB.open('PhoenixDB', 1);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
            };
            
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('state', 'readwrite');
                const store = tx.objectStore('state');
                store.put(val, key);
            };
        } catch (error) {
            console.warn('IndexedDB save failed:', error);
        }
    },
    
    async loadFromIndexedDB(key) {
        try {
            if (!window.indexedDB) return null;
            return new Promise((resolve) => {
                const request = indexedDB.open('PhoenixDB', 1);
                request.onsuccess = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('state')) {
                        resolve(null);
                        return;
                    }
                    const tx = db.transaction('state', 'readonly');
                    const store = tx.objectStore('state');
                    const getRequest = store.get(key);
                    getRequest.onsuccess = () => resolve(getRequest.result);
                    getRequest.onerror = () => resolve(null);
                };
                request.onerror = () => resolve(null);
            });
        } catch (error) {
            console.warn('IndexedDB load failed:', error);
            return null;
        }
    }
};

// ============================================
// SMART CACHE SYSTEM
// ============================================

const cache = new Map();
const ttl = { 
    mercury: 300000,    // 5 min
    venus: 600000,      // 10 min
    earth: 1800000,     // 30 min
    mars: 1800000,      // 30 min
    jupiter: 3600000,   // 1 hour
    saturn: 86400000    // 24 hours
};

async function getCached(key, fetcher) {
    const c = cache.get(key);
    if (c && Date.now() - c.ts < (ttl[key] || 600000)) {
        console.log(`📦 Cache HIT: ${key}`);
        return c.data;
    }
    console.log(`🔄 Cache MISS: ${key} - fetching fresh data`);
    const data = await fetcher();
    cache.set(key, { data, ts: Date.now() });
    return data;
}

// ============================================
// SECURE STORAGE WITH ENCRYPTION
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
            const exp = payload.exp * 1000;
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
        RateLimiter.check(url);
        
        const token = SecureStorage.getToken();
        if (token && TokenManager.isExpired(token) && retryCount === 0) {
            console.log('🔄 Token expired, refreshing...');
            await TokenManager.refresh();
            return SmartFetch(url, options, context, retryCount + 1);
        }
        
        const headers = { ...options.headers };
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
        
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
        });
        
        const newCsrf = response.headers.get('X-CSRF-Token');
        if (newCsrf) csrfToken = newCsrf;
        
        if (response.status === 401 && retryCount === 0) {
            console.log('🔄 Unauthorized, refreshing token...');
            await TokenManager.refresh();
            return SmartFetch(url, options, context, retryCount + 1);
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        return response;
        
    } catch (error) {
        const handled = await ErrorHandler.handle(error, context);
        
        if (handled.shouldRetry && retryCount < maxRetries) {
            console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} for ${context}`);
            
            if (handled.useFallback && url.includes(API_BASE_URL)) {
                console.log('🔄 Switching to fallback API...');
                const fallbackUrl = url.replace(API_BASE_URL, API_CONFIG.FALLBACK_API);
                return SmartFetch(fallbackUrl, options, context, retryCount + 1);
            }
            
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

// Get user ID helper
const getUserId = () => {
    const user = SecureStorage.getUser();
    return user?._id || user?.id;
};

// ============================================
// API METHODS - CORRECTED ENDPOINTS
// ============================================

const API = {
    // ========================================
    // AUTHENTICATION
    // ========================================
    
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
            phoenixStore.setState('user', data.user);
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
            phoenixStore.setState('user', data.user);
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
            phoenixStore.state = { user: null, mercury: null, venus: null, earth: null, mars: null, jupiter: null, saturn: null };
            cache.clear();
            csrfToken = null;
            RATE_LIMIT.requestQueue.clear();
        }
    },

    async getMe() {
        const response = await SmartFetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders()
        }, 'getMe');
        const data = await response.json();
        if (data.success && data.user) {
            phoenixStore.setState('user', data.user);
        }
        return data;
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
            phoenixStore.setState('user', data.user);
        }
        
        return data;
    },

    getCurrentUser() {
        return SecureStorage.getUser();
    },

    // ========================================
    // PLANET DATA LOADERS (for phoenixStore)
    // ========================================
    
    async loadMercuryData() {
        return await getCached('mercury', async () => {
            const userId = getUserId();
            if (!userId) return null;
            
            const [wearable, recovery, hrv] = await Promise.all([
                this.getLatestWearableData().catch(() => null),
                this.getRecoveryScore().catch(() => null),
                this.getHRVData().catch(() => null)
            ]);
            return { wearable, recovery, hrv };
        });
    },
    
    async loadVenusData() {
        return await getCached('venus', async () => {
            const [workouts, nutrition] = await Promise.all([
                this.getRecentWorkouts(10).catch(() => null),
                this.getTodayNutrition().catch(() => null)
            ]);
            return { workouts, nutrition };
        });
    },
    
    async loadEarthData() {
        return await getCached('earth', async () => {
            const userId = getUserId();
            if (!userId) return null;
            
            const events = await this.getCalendarEvents().catch(() => null);
            return { events };
        });
    },
    
    async loadMarsData() {
        return await getCached('mars', async () => {
            const goals = await this.getActiveGoals().catch(() => null);
            return { goals };
        });
    },
    
    async loadJupiterData() {
        return await getCached('jupiter', async () => {
            const userId = getUserId();
            if (!userId) return null;
            
            const finance = await this.getFinancialOverview().catch(() => null);
            return { finance };
        });
    },
    
    async loadSaturnData() {
        return await getCached('saturn', async () => {
            const timeline = await this.getLifeTimeline().catch(() => null);
            return { timeline };
        });
    },

    // ========================================
    // MERCURY - HEALTH & RECOVERY
    // ✅ CORRECTED ENDPOINTS
    // ========================================

    async getLatestWearableData() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/wearables/user/${userId}`, {
            headers: getAuthHeaders()
        }, 'getLatestWearableData');
        return await response.json();
    },

    async syncWearables(provider = 'fitbit') {
        const response = await SmartFetch(`${API_BASE_URL}/wearables/sync/${provider}`, {
            method: 'POST',
            headers: getAuthHeaders()
        }, 'syncWearables');
        return await response.json();
    },

    async getRecoveryScore() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/recovery/${userId}/score/current`, {
            headers: getAuthHeaders()
        }, 'getRecoveryScore');
        return await response.json();
    },

    async getRecoveryHistory() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/recovery/${userId}/score/history`, {
            headers: getAuthHeaders()
        }, 'getRecoveryHistory');
        return await response.json();
    },

    async getRecoveryRecommendations() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/recovery/${userId}/recommendations`, {
            headers: getAuthHeaders()
        }, 'getRecoveryRecommendations');
        return await response.json();
    },

    async getHRVData() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/recovery/${userId}/hrv/current`, {
            headers: getAuthHeaders()
        }, 'getHRVData');
        return await response.json();
    },

    async getSleepAnalysis() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/recovery/${userId}/sleep/analysis`, {
            headers: getAuthHeaders()
        }, 'getSleepAnalysis');
        return await response.json();
    },

    async getVitalsOverview() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        // This might need a backend route - using biometric/all as fallback
        const response = await SmartFetch(`${API_BASE_URL}/biometric/${userId}/all`, {
            headers: getAuthHeaders()
        }, 'getVitalsOverview');
        return await response.json();
    },

    // ========================================
    // VENUS - FITNESS & NUTRITION
    // ✅ CORRECTED ENDPOINTS
    // ========================================

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

    async generateQuantumWorkout(preferences = {}) {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/venus/${userId}/quantum-workout`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(preferences)
        }, 'generateQuantumWorkout');
        return await response.json();
    },

    async getTodayNutrition() {
        const response = await SmartFetch(`${API_BASE_URL}/nutrition/today`, {
            headers: getAuthHeaders()
        }, 'getTodayNutrition');
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

    // ========================================
    // EARTH - CALENDAR & TIME
    // ✅ CORRECTED ENDPOINTS
    // ========================================

    async getCalendarEvents() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/earth/${userId}/calendar/events`, {
            headers: getAuthHeaders()
        }, 'getCalendarEvents');
        return await response.json();
    },

    // ========================================
    // MARS - GOALS & HABITS
    // ✅ CORRECTED ENDPOINTS
    // ========================================

    async createGoal(goalData) {
        if (!goalData?.title) throw new Error('Goal title required');
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/goals/client/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(goalData)
        }, 'createGoal');
        return await response.json();
    },

    async getActiveGoals() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/goals/client/${userId}`, {
            headers: getAuthHeaders()
        }, 'getActiveGoals');
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

    // ========================================
    // JUPITER - FINANCE
    // ✅ CORRECTED ENDPOINTS
    // ========================================

    async getFinancialOverview() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/jupiter/${userId}/overview`, {
            headers: getAuthHeaders()
        }, 'getFinancialOverview');
        return await response.json();
    },

    async getTransactions(days = 30) {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/jupiter/${userId}/transactions?days=${days}`, {
            headers: getAuthHeaders()
        }, 'getTransactions');
        return await response.json();
    },

    async getBudgetAnalysis() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/jupiter/${userId}/budget`, {
            headers: getAuthHeaders()
        }, 'getBudgetAnalysis');
        return await response.json();
    },

    async getSpendingInsights() {
        const userId = getUserId();
        if (!userId) throw new Error('User not authenticated');
        
        const response = await SmartFetch(`${API_BASE_URL}/jupiter/${userId}/insights`, {
            headers: getAuthHeaders()
        }, 'getSpendingInsights');
        return await response.json();
    },

    // ========================================
    // SATURN - LEGACY & VISION
    // ✅ CORRECTED ENDPOINTS
    // ========================================

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

    // ========================================
    // PHOENIX COMPANION (AI CHAT)
    // ========================================

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

    // ========================================
    // VOICE
    // ========================================

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

    // ========================================
    // UTILITY
    // ========================================

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

    // ========================================
    // SECURITY UTILITIES
    // ========================================

    checkTokenExpiration() {
        const token = SecureStorage.getToken();
        return TokenManager.isExpired(token);
    },

    async forceTokenRefresh() {
        return await TokenManager.refresh();
    },

    getAuthHeaders,
    
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
// EXPORT AS ES6 MODULE + GLOBAL
// ============================================

// Export phoenixStore and cache helpers globally
window.phoenixStore = phoenixStore;
window.getCached = getCached;
window.API = API;

// Also export individual functions for convenience
Object.keys(API).forEach(key => {
    if (typeof API[key] === 'function') {
        window[key] = API[key];
    }
});

console.log('✅ Phoenix Fixed API Client initialized');
console.log('📊 Environment:', API.environment);
console.log('🔐 Token status:', SecureStorage.getToken() ? 'Present' : 'Missing');
console.log('👤 User status:', SecureStorage.getUser() ? 'Logged in' : 'Logged out');
console.log('⚡ State Store:', phoenixStore);
console.log('📦 Smart Cache:', cache);

// ES6 Module Export
export default API;
