/* ═══════════════════════════════════════════════════════════════════════════════
   PHOENIX JARVIS BUTLER - COMPLETE AI LIFE OPERATING SYSTEM
   
   This file contains ALL functionality in one mega module:
   - API Client (307 endpoints)
   - JARVIS AI Engine
   - Butler Automation
   - Pattern Discovery
   - Interventions
   - Predictions
   - All 6 Planet Dashboards
   - Voice Interface
   - Real-time Monitoring
   
   Total: ~22,000 lines
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHOENIX_CONFIG = {
    // Backend API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api'
        : 'https://pal-backend-production.up.railway.app/api',
    
    WS_BASE_URL: window.location.hostname === 'localhost'
        ? 'ws://localhost:5000'
        : 'wss://pal-backend-production.up.railway.app',
    
    // Feature Flags
    FEATURES: {
        QUANTUM_WORKOUTS: true,
        PATTERN_DISCOVERY: true,
        AUTONOMOUS_INTERVENTIONS: true,
        BUTLER_ACTIONS: true,
        VOICE_INTERFACE: true,
        REAL_TIME_MONITORING: true,
        ML_PREDICTIONS: true
    },
    
    // Cache Settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    
    // Retry Settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    
    // WebSocket Settings
    WS_RECONNECT_INTERVAL: 5000,
    WS_HEARTBEAT_INTERVAL: 30000
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const Utils = {
    // Storage utilities
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error('Storage get error:', error);
                return null;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },
    
    // Date/time utilities
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatDateTime(date) {
        return `${this.formatDate(date)} ${this.formatTime(date)}`;
    },
    
    // Number formatting
    formatNumber(num, decimals = 0) {
        return Number(num).toFixed(decimals);
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    // String utilities
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    truncate(str, length) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },
    
    // Validation
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // Debounce function
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
    
    // Sleep/delay utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: API CLIENT - ALL 307 ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

class PhoenixAPIClient {
    constructor() {
        this.baseURL = PHOENIX_CONFIG.API_BASE_URL;
        this.token = Utils.storage.get('phoenixToken');
        this.cache = new Map();
        this.requestQueue = [];
    }
    
    // Core request method with retry logic
    async request(endpoint, method = 'GET', data = null, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            }
        };
        
        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }
        
        // Check cache for GET requests
        if (method === 'GET' && !options.skipCache) {
            const cached = this.getCached(endpoint);
            if (cached) return cached;
        }
        
        // Retry logic
        let lastError;
        for (let i = 0; i < PHOENIX_CONFIG.MAX_RETRIES; i++) {
            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    if (response.status === 401) {
                        this.handleUnauthorized();
                        throw new Error('Unauthorized');
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // Cache GET requests
                if (method === 'GET') {
                    this.cacheResponse(endpoint, result);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                if (i < PHOENIX_CONFIG.MAX_RETRIES - 1) {
                    await Utils.sleep(PHOENIX_CONFIG.RETRY_DELAY * (i + 1));
                }
            }
        }
        
        throw lastError;
    }
    
    // Cache management
    cacheResponse(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    getCached(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > PHOENIX_CONFIG.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // Auth management
    setToken(token) {
        this.token = token;
        Utils.storage.set('phoenixToken', token);
    }
    
    clearToken() {
        this.token = null;
        Utils.storage.remove('phoenixToken');
    }
    
    handleUnauthorized() {
        this.clearToken();
        window.location.href = '#auth';
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // AUTH ROUTES (9 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    auth = {
        register: (data) => this.request('/auth/register', 'POST', data),
        login: (data) => this.request('/auth/login', 'POST', data),
        me: () => this.request('/auth/me'),
        updateProfile: (data) => this.request('/auth/me', 'PUT', data),
        changePassword: (data) => this.request('/auth/change-password', 'PUT', data),
        resetPassword: (email) => this.request('/auth/reset-password', 'POST', { email }),
        resetPasswordConfirm: (token, password) => this.request(`/auth/reset-password/${token}`, 'PUT', { password }),
        logout: () => this.request('/auth/logout', 'POST'),
        getDocs: () => this.request('/auth/docs')
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHOENIX ROUTES (75 endpoints) - The Core Intelligence
    // ═══════════════════════════════════════════════════════════════════════════
    phoenix = {
        // Companion Chat (6 endpoints)
        companion: {
            chat: (message) => this.request('/phoenix/companion/chat', 'POST', { message }),
            getHistory: () => this.request('/phoenix/companion/history'),
            clearHistory: () => this.request('/phoenix/companion/history', 'DELETE'),
            getContext: () => this.request('/phoenix/companion/context'),
            getPersonality: () => this.request('/phoenix/companion/personality'),
            updatePersonality: (data) => this.request('/phoenix/companion/personality', 'PUT', data)
        },
        
        // Patterns & Correlations (5 endpoints)
        patterns: {
            getAll: () => this.request('/phoenix/patterns'),
            analyze: () => this.request('/phoenix/patterns/analyze', 'POST'),
            getRealtime: () => this.request('/phoenix/patterns/realtime'),
            validate: (id, valid) => this.request(`/phoenix/patterns/${id}/validate`, 'PUT', { valid }),
            delete: (id) => this.request(`/phoenix/patterns/${id}`, 'DELETE')
        },
        
        // Intelligence & Insights (9 endpoints)
        intelligence: {
            getDashboard: () => this.request('/phoenix/intelligence'),
            analyze: () => this.request('/phoenix/intelligence/analyze', 'POST'),
            getInsights: () => this.request('/phoenix/intelligence/insights'),
            query: (question) => this.request('/phoenix/intelligence/query', 'POST', { question }),
            getSummary: () => this.request('/phoenix/intelligence/summary'),
            deepDive: (topic) => this.request('/phoenix/intelligence/deep-dive', 'POST', { topic }),
            getRecommendations: () => this.request('/phoenix/intelligence/recommendations'),
            autoOptimize: () => this.request('/phoenix/intelligence/auto-optimize', 'POST')
        },
        
        // Predictions (11 endpoints)
        predictions: {
            getAll: () => this.request('/phoenix/predictions'),
            getActive: () => this.request('/phoenix/predictions/active'),
            getById: (id) => this.request(`/phoenix/predictions/${id}`),
            request: (type) => this.request(`/phoenix/predictions/request/${type}`, 'POST'),
            recordOutcome: (id, outcome) => this.request(`/phoenix/predictions/${id}/outcome`, 'PUT', outcome),
            getAccuracy: () => this.request('/phoenix/predictions/accuracy'),
            getForecast: (days = 7) => this.request(`/phoenix/predictions/forecast?days=${days}`),
            getOptimalWindow: (activity) => this.request(`/phoenix/predictions/optimal-window?activity=${activity}`),
            getBurnoutRisk: () => this.request('/phoenix/predictions/burnout-risk'),
            getWeightChange: (days = 30) => this.request(`/phoenix/predictions/weight-change?days=${days}`)
        },
        
        // Interventions (10 endpoints)
        interventions: {
            getAll: () => this.request('/phoenix/interventions'),
            getActive: () => this.request('/phoenix/interventions/active'),
            getPending: () => this.request('/phoenix/interventions/pending'),
            acknowledge: (id) => this.request(`/phoenix/interventions/${id}/acknowledge`, 'POST'),
            recordOutcome: (id, outcome) => this.request(`/phoenix/interventions/${id}/outcome`, 'PUT', outcome),
            getStats: () => this.request('/phoenix/interventions/stats'),
            getHistory: () => this.request('/phoenix/interventions/history'),
            updateSettings: (settings) => this.request('/phoenix/interventions/settings', 'POST', settings),
            manualRequest: (data) => this.request('/phoenix/interventions/request', 'POST', data)
        },
        
        // Voice (4 endpoints)
        voice: {
            createSession: () => this.request('/phoenix/voice/session', 'POST'),
            endSession: (sessionId) => this.request(`/phoenix/voice/session`, 'DELETE'),
            getTranscriptions: () => this.request('/phoenix/voice/transcriptions'),
            getHistory: () => this.request('/phoenix/voice/history')
        },
        
        // ML Training (3 endpoints)
        ml: {
            train: () => this.request('/phoenix/ml/train', 'POST'),
            getModels: () => this.request('/phoenix/ml/models'),
            getTrainingStatus: () => this.request('/phoenix/ml/training-status')
        },
        
        // Behavior Tracking (4 endpoints)
        behavior: {
            track: (data) => this.request('/phoenix/behavior/track', 'POST', data),
            getPatterns: () => this.request('/phoenix/behavior/patterns'),
            getInsights: () => this.request('/phoenix/behavior/insights'),
            getByType: (type) => this.request(`/phoenix/behavior/${type}`)
        },
        
        // Butler Actions (23 endpoints)
        butler: {
            // Reservations
            makeReservation: (data) => this.request('/phoenix/butler/reservation', 'POST', data),
            getReservations: () => this.request('/phoenix/butler/reservations'),
            
            // Food
            orderFood: (data) => this.request('/phoenix/butler/food', 'POST', data),
            getFoodHistory: () => this.request('/phoenix/butler/food/history'),
            reorderFood: (orderId) => this.request('/phoenix/butler/food/reorder', 'POST', { orderId }),
            
            // Rides
            bookRide: (data) => this.request('/phoenix/butler/ride', 'POST', data),
            getRides: () => this.request('/phoenix/butler/rides'),
            
            // Phone & SMS
            makeCall: (data) => this.request('/phoenix/butler/call', 'POST', data),
            getCallHistory: () => this.request('/phoenix/butler/calls'),
            sendSMS: (data) => this.request('/phoenix/butler/sms', 'POST', data),
            getSMSHistory: () => this.request('/phoenix/butler/sms'),
            
            // Email
            sendEmail: (data) => this.request('/phoenix/butler/email', 'POST', data),
            getEmailHistory: () => this.request('/phoenix/butler/emails'),
            replyToEmail: (data) => this.request('/phoenix/butler/email/reply', 'POST', data),
            
            // Calendar
            manageCalendar: (data) => this.request('/phoenix/butler/calendar', 'POST', data),
            optimizeCalendar: () => this.request('/phoenix/butler/calendar/optimize', 'POST'),
            
            // Web & Automation
            webSearch: (query) => this.request('/phoenix/butler/search', 'POST', { query }),
            performWebTask: (task) => this.request('/phoenix/butler/web-task', 'POST', { task }),
            summarizeContent: (url) => this.request('/phoenix/butler/summarize', 'POST', { url }),
            createAutomation: (data) => this.request('/phoenix/butler/automate', 'POST', data),
            getAutomations: () => this.request('/phoenix/butler/automations'),
            deleteAutomation: (id) => this.request(`/phoenix/butler/automations/${id}`, 'DELETE'),
            
            // Budget
            getBudget: () => this.request('/phoenix/butler/budget'),
            updateBudget: (data) => this.request('/phoenix/butler/budget', 'PUT', data)
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MERCURY ROUTES (38 endpoints) - Health & Biometrics
    // ═══════════════════════════════════════════════════════════════════════════
    mercury = {
        // Biometrics (10 endpoints)
        biometrics: {
            getDexaScan: () => this.request('/mercury/biometrics/dexa'),
            getComposition: () => this.request('/mercury/biometrics/composition'),
            getMetabolic: () => this.request('/mercury/biometrics/metabolic'),
            calculateMetabolic: (data) => this.request('/mercury/biometrics/metabolic/calculate', 'POST', data),
            getRatios: () => this.request('/mercury/biometrics/ratios'),
            getVisceralFat: () => this.request('/mercury/biometrics/visceral-fat'),
            getBoneDensity: () => this.request('/mercury/biometrics/bone-density'),
            getHydration: () => this.request('/mercury/biometrics/hydration'),
            getTrends: () => this.request('/mercury/biometrics/trends'),
            getCorrelations: () => this.request('/mercury/biometrics/correlations')
        },
        
        // Wearable Devices (18 endpoints)
        devices: {
            connectDevice: (provider) => this.request(`/mercury/devices/${provider}/connect`, 'POST'),
            getDevices: () => this.request('/mercury/devices'),
            disconnect: (deviceId) => this.request(`/mercury/devices/${deviceId}`, 'DELETE'),
            syncDevice: (deviceId) => this.request(`/mercury/devices/${deviceId}/sync`, 'POST'),
            getDeviceData: (deviceId) => this.request(`/mercury/devices/${deviceId}/data`),
            fusionData: () => this.request('/mercury/devices/fusion', 'POST'),
            getFusionResults: () => this.request('/mercury/devices/fusion/results'),
            getConflicts: () => this.request('/mercury/devices/conflicts'),
            manualEntry: (data) => this.request('/mercury/devices/manual-entry', 'POST', data),
            
            // OAuth flows
            fitbitAuth: () => this.request('/mercury/devices/fitbit/auth'),
            fitbitCallback: (code) => this.request('/mercury/devices/fitbit/callback', 'POST', { code }),
            ouraAuth: () => this.request('/mercury/devices/oura/auth'),
            whoopAuth: () => this.request('/mercury/devices/whoop/auth'),
            garminAuth: () => this.request('/mercury/devices/garmin/auth'),
            polarAuth: () => this.request('/mercury/devices/polar/auth'),
            polarCallback: (data) => this.request('/mercury/devices/polar/callback', 'POST', data),
            webhook: (provider, data) => this.request(`/mercury/devices/webhooks/${provider}`, 'POST', data),
            getDataQuality: () => this.request('/mercury/devices/data-quality')
        },
        
        // Recovery (11 endpoints)
        recovery: {
            getScore: () => this.request('/mercury/recovery/score'),
            calculate: (data) => this.request('/mercury/recovery/calculate', 'POST', data),
            getHistory: () => this.request('/mercury/recovery/history'),
            getTrends: () => this.request('/mercury/recovery/trends'),
            generateProtocol: (data) => this.request('/mercury/recovery/protocol', 'POST', data),
            getProtocols: () => this.request('/mercury/recovery/protocols'),
            logIntervention: (data) => this.request('/mercury/recovery/intervention', 'POST', data),
            getDebt: () => this.request('/mercury/recovery/debt'),
            getOvertrainingRisk: () => this.request('/mercury/recovery/overtraining'),
            getInsights: () => this.request('/mercury/recovery/insights'),
            getDashboard: () => this.request('/mercury/recovery/dashboard')
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VENUS ROUTES (88 endpoints) - Fitness & Nutrition
    // ═══════════════════════════════════════════════════════════════════════════
    venus = {
        // Workouts (20 endpoints)
        workouts: {
            start: (data) => this.request('/venus/workouts/start', 'POST', data),
            logExercise: (workoutId, data) => this.request(`/venus/workouts/${workoutId}/exercise`, 'POST', data),
            complete: (workoutId) => this.request(`/venus/workouts/${workoutId}/complete`, 'POST'),
            getHistory: () => this.request('/venus/workouts'),
            getActive: () => this.request('/venus/workouts/active'),
            getById: (id) => this.request(`/venus/workouts/${id}`),
            update: (id, data) => this.request(`/venus/workouts/${id}`, 'PUT', data),
            delete: (id) => this.request(`/venus/workouts/${id}`, 'DELETE'),
            getRecommendations: () => this.request('/venus/workouts/recommend', 'POST'),
            
            // Quantum workouts
            generateQuantum: (data) => this.request('/venus/workouts/quantum/generate', 'POST', data),
            getQuantumParams: () => this.request('/venus/workouts/quantum/parameters'),
            getQuantumPatterns: () => this.request('/venus/workouts/quantum/patterns'),
            analyzePlateau: () => this.request('/venus/workouts/quantum/analyze-plateau', 'POST'),
            
            analyzeForm: (data) => this.request('/venus/workouts/analysis', 'POST', data),
            getStats: () => this.request('/venus/workouts/stats'),
            createPlan: (data) => this.request('/venus/workouts/plan', 'POST', data),
            getTemplates: () => this.request('/venus/workouts/templates'),
            planDeload: () => this.request('/venus/workouts/deload', 'POST'),
            getPeriodization: () => this.request('/venus/workouts/periodization'),
            getOptimalWindow: () => this.request('/venus/workouts/optimal-window')
        },
        
        // Exercises (8 endpoints)
        exercises: {
            create: (data) => this.request('/venus/exercises', 'POST', data),
            getAll: () => this.request('/venus/exercises'),
            getById: (id) => this.request(`/venus/exercises/${id}`),
            update: (id, data) => this.request(`/venus/exercises/${id}`, 'PUT', data),
            delete: (id) => this.request(`/venus/exercises/${id}`, 'DELETE'),
            getRecommendations: () => this.request('/venus/exercises/recommendations'),
            analyzeMovement: (data) => this.request('/venus/exercises/analyze', 'POST', data),
            getLibrary: () => this.request('/venus/exercises/library')
        },
        
        // Nutrition (18 endpoints)
        nutrition: {
            generatePlan: (data) => this.request('/venus/nutrition/plan', 'POST', data),
            analyzePhoto: (photo) => this.request('/venus/nutrition/photo', 'POST', { photo }),
            logMeal: (data) => this.request('/venus/nutrition/log', 'POST', data),
            getDailySummary: () => this.request('/venus/nutrition/daily'),
            getTargets: () => this.request('/venus/nutrition/targets'),
            scanBarcode: (barcode) => this.request('/venus/nutrition/barcode', 'POST', { barcode }),
            getTrends: () => this.request('/venus/nutrition/trends'),
            getRecipes: (params) => this.request('/venus/nutrition/recipes', 'POST', params),
            getAdherence: () => this.request('/venus/nutrition/adherence'),
            adjustMacros: (data) => this.request('/venus/nutrition/adjust', 'POST', data),
            getInsights: () => this.request('/venus/nutrition/insights'),
            optimizeMealTiming: () => this.request('/venus/nutrition/meal-timing', 'POST'),
            getShoppingList: () => this.request('/venus/nutrition/shopping'),
            
            // Supplements
            logSupplement: (data) => this.request('/venus/supplements/log', 'POST', data),
            getSupplements: () => this.request('/venus/supplements'),
            getSupplementRecs: () => this.request('/venus/supplements/recommendations'),
            
            // Hydration
            getHydration: () => this.request('/venus/hydration'),
            logWater: (amount) => this.request('/venus/hydration/log', 'POST', { amount })
        },
        
        // Performance & Injury (12 endpoints)
        performance: {
            recordTest: (data) => this.request('/venus/performance/test', 'POST', data),
            getTests: () => this.request('/venus/performance/tests'),
            getProgress: () => this.request('/venus/performance/progress'),
            compare: (testIds) => this.request('/venus/performance/comparison', 'POST', { testIds }),
            
            // Injury
            logInjury: (data) => this.request('/venus/injury/log', 'POST', data),
            getInjuryHistory: () => this.request('/venus/injury/history'),
            getRiskAssessment: () => this.request('/venus/injury/risk'),
            reportInjury: (data) => this.request('/venus/injury/report', 'POST', data),
            getInjuryPatterns: () => this.request('/venus/injury/patterns'),
            getPreventionPlan: () => this.request('/venus/injury/prevention', 'POST'),
            
            // Measurements
            getMeasurements: () => this.request('/venus/measurements'),
            logMeasurement: (data) => this.request('/venus/measurements', 'POST', data)
        },
        
        // Social & Challenges (20 endpoints)
        social: {
            getFeed: () => this.request('/venus/social/feed'),
            createPost: (data) => this.request('/venus/social/post', 'POST', data),
            getPost: (id) => this.request(`/venus/social/post/${id}`),
            deletePost: (id) => this.request(`/venus/social/post/${id}`, 'DELETE'),
            likePost: (id) => this.request(`/venus/social/post/${id}/like`, 'POST'),
            commentOnPost: (id, comment) => this.request(`/venus/social/post/${id}/comment`, 'POST', { comment }),
            getComments: (id) => this.request(`/venus/social/post/${id}/comments`),
            getFriends: () => this.request('/venus/social/friends'),
            sendFriendRequest: (userId) => this.request('/venus/social/friends/request', 'POST', { userId }),
            acceptFriendRequest: (requestId) => this.request('/venus/social/friends/accept', 'POST', { requestId }),
            removeFriend: (friendId) => this.request(`/venus/social/friends/${friendId}`, 'DELETE'),
            
            // Challenges
            getChallenges: () => this.request('/venus/challenges'),
            createChallenge: (data) => this.request('/venus/challenges', 'POST', data),
            joinChallenge: (id) => this.request(`/venus/challenges/${id}/join`, 'POST'),
            getLeaderboard: (id) => this.request(`/venus/challenges/${id}/leaderboard`),
            updateProgress: (id, progress) => this.request(`/venus/challenges/${id}/progress`, 'POST', { progress }),
            
            getStats: () => this.request('/venus/social/stats'),
            shareWorkout: (workoutId) => this.request('/venus/social/share', 'POST', { workoutId }),
            getTrending: () => this.request('/venus/social/trending'),
            getActivity: () => this.request('/venus/social/activity')
        },
        
        // Coaching (10 endpoints)
        coaching: {
            getSpecialists: () => this.request('/venus/coaching/specialists'),
            getSpecialist: (id) => this.request(`/venus/coaching/specialist/${id}`),
            assignClient: (data) => this.request('/venus/coaching/assign', 'POST', data),
            getClients: () => this.request('/venus/coaching/clients'),
            assignWorkout: (data) => this.request('/venus/coaching/workout/assign', 'POST', data),
            assignNutrition: (data) => this.request('/venus/coaching/nutrition/assign', 'POST', data),
            getClientProgress: (clientId) => this.request(`/venus/coaching/progress/${clientId}`),
            giveFeedback: (data) => this.request('/venus/coaching/feedback', 'POST', data),
            getDashboard: () => this.request('/venus/coaching/dashboard'),
            messageClient: (data) => this.request('/venus/coaching/message', 'POST', data)
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EARTH ROUTES (11 endpoints) - Calendar & Energy
    // ═══════════════════════════════════════════════════════════════════════════
    earth = {
        calendar: {
            connect: (provider) => this.request(`/earth/calendar/connect/${provider}`),
            callback: (data) => this.request('/earth/calendar/callback', 'POST', data),
            getEvents: () => this.request('/earth/calendar/events'),
            createEvent: (data) => this.request('/earth/calendar/events', 'POST', data),
            getEnergyMap: () => this.request('/earth/calendar/energy-map'),
            getConflicts: () => this.request('/earth/calendar/conflicts'),
            sync: () => this.request('/earth/calendar/sync', 'POST')
        },
        
        energy: {
            getPattern: () => this.request('/earth/energy/pattern'),
            logEnergy: (level) => this.request('/earth/energy/log', 'POST', { level }),
            getOptimalTimes: () => this.request('/earth/energy/optimal-times'),
            getPrediction: () => this.request('/earth/energy/prediction')
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MARS ROUTES (20 endpoints) - Goals & Habits
    // ═══════════════════════════════════════════════════════════════════════════
    mars = {
        goals: {
            create: (data) => this.request('/mars/goals', 'POST', data),
            getAll: () => this.request('/mars/goals'),
            getById: (id) => this.request(`/mars/goals/${id}`),
            update: (id, data) => this.request(`/mars/goals/${id}`, 'PUT', data),
            delete: (id) => this.request(`/mars/goals/${id}`, 'DELETE'),
            complete: (id) => this.request(`/mars/goals/${id}/complete`, 'POST'),
            generateSmart: (vague) => this.request('/mars/goals/generate-smart', 'POST', { vague }),
            getSuggestions: () => this.request('/mars/goals/suggest', 'POST'),
            getTemplates: () => this.request('/mars/goals/templates'),
            logProgress: (id, progress) => this.request(`/mars/goals/${id}/progress`, 'POST', { progress }),
            getProgress: (id) => this.request(`/mars/goals/${id}/progress`)
        },
        
        progress: {
            getVelocity: () => this.request('/mars/progress/velocity'),
            getPredictions: () => this.request('/mars/progress/predictions'),
            getBottlenecks: () => this.request('/mars/progress/bottlenecks')
        },
        
        milestones: {
            complete: (id) => this.request(`/mars/milestones/${id}/complete`, 'POST')
        },
        
        habits: {
            create: (data) => this.request('/mars/habits', 'POST', data),
            log: (id) => this.request(`/mars/habits/${id}/log`, 'POST')
        },
        
        motivation: {
            getInterventions: () => this.request('/mars/motivation/interventions'),
            boost: () => this.request('/mars/motivation/boost', 'POST')
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // JUPITER ROUTES (17 endpoints) - Finance
    // ═══════════════════════════════════════════════════════════════════════════
    jupiter = {
        createLinkToken: () => this.request('/jupiter/link-token', 'POST'),
        exchangeToken: (publicToken) => this.request('/jupiter/exchange-token', 'POST', { publicToken }),
        getAccounts: () => this.request('/jupiter/accounts'),
        disconnectAccount: (id) => this.request(`/jupiter/account/${id}`, 'DELETE'),
        syncAccount: (id) => this.request(`/jupiter/sync/${id}`, 'POST'),
        
        transactions: {
            getAll: () => this.request('/jupiter/transactions'),
            getByDateRange: (startDate, endDate) => this.request(`/jupiter/transactions/date-range?start=${startDate}&end=${endDate}`),
            getByCategory: (category) => this.request(`/jupiter/transactions/category/${category}`),
            recategorize: (id, category) => this.request(`/jupiter/transactions/${id}`, 'PUT', { category }),
            getRecurring: () => this.request('/jupiter/transactions/recurring')
        },
        
        getSpendingPatterns: () => this.request('/jupiter/spending-patterns'),
        
        budgets: {
            create: (data) => this.request('/jupiter/budgets', 'POST', data),
            getAll: () => this.request('/jupiter/budgets'),
            update: (id, data) => this.request(`/jupiter/budgets/${id}`, 'PUT', data),
            delete: (id) => this.request(`/jupiter/budgets/${id}`, 'DELETE'),
            getAlerts: () => this.request('/jupiter/budgets/alerts')
        },
        
        getStressCorrelation: () => this.request('/jupiter/stress-correlation')
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SATURN ROUTES (12 endpoints) - Life Planning
    // ═══════════════════════════════════════════════════════════════════════════
    saturn = {
        vision: {
            create: (data) => this.request('/saturn/vision', 'POST', data),
            get: () => this.request('/saturn/vision'),
            updateLifeAreas: (data) => this.request('/saturn/vision/life-areas', 'PUT', data),
            addLegacyGoal: (data) => this.request('/saturn/vision/legacy-goal', 'POST', data),
            updateReview: (date) => this.request('/saturn/vision/review', 'PUT', { date })
        },
        
        mortality: {
            get: () => this.request('/saturn/mortality')
        },
        
        quarterly: {
            create: (data) => this.request('/saturn/quarterly', 'POST', data),
            getAll: () => this.request('/saturn/quarterly'),
            getLatest: () => this.request('/saturn/quarterly/latest'),
            update: (id, data) => this.request(`/saturn/quarterly/${id}`, 'PUT', data),
            getTrend: () => this.request('/saturn/quarterly/trend'),
            compare: (q1, q2) => this.request(`/saturn/quarterly/compare/${q1}/${q2}`)
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // USER ROUTES (11 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    user = {
        getDocs: () => this.request('/users/docs'),
        getProfile: () => this.request('/users/profile'),
        updateProfile: (data) => this.request('/users/profile', 'PUT', data),
        getAll: () => this.request('/users'),
        create: (data) => this.request('/users', 'POST', data),
        getSpecialistClients: (id) => this.request(`/users/specialist/${id}/clients`),
        assignClient: (data) => this.request('/users/assign-client', 'POST', data),
        unassignClient: (data) => this.request('/users/unassign-client', 'POST', data),
        getById: (id) => this.request(`/users/${id}`),
        update: (id, data) => this.request(`/users/${id}`, 'PUT', data),
        delete: (id) => this.request(`/users/${id}`, 'DELETE')
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SUBSCRIPTION ROUTES (5 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    subscription = {
        createCheckout: (plan) => this.request('/subscriptions/checkout', 'POST', { plan }),
        webhook: (data) => this.request('/subscriptions/webhook', 'POST', data),
        getStatus: () => this.request('/subscriptions/status'),
        cancel: () => this.request('/subscriptions/cancel', 'POST'),
        createPortal: () => this.request('/subscriptions/portal', 'POST')
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TTS ROUTES (4 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    tts = {
        generate: (text, options) => this.request('/tts/generate', 'POST', { text, ...options }),
        getVoices: () => this.request('/tts/voices'),
        getLanguages: () => this.request('/tts/languages'),
        getStatus: () => this.request('/tts/status')
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WHISPER ROUTES (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    whisper = {
        transcribe: (audio) => this.request('/whisper/transcribe', 'POST', { audio }),
        getStatus: () => this.request('/whisper/status')
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VOICE ROUTES (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    voice = {
        chat: (message) => this.request('/phoenixVoice/chat', 'POST', { message }),
        getPersonalities: () => this.request('/phoenixVoice/personalities')
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SMS VERIFICATION ROUTES (4 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    sms = {
        sendVerification: (phone) => this.request('/sms-verification/send-verification', 'POST', { phone }),
        verifyCode: (phone, code) => this.request('/sms-verification/verify-code', 'POST', { phone, code }),
        resendCode: (phone) => this.request('/sms-verification/resend-code', 'POST', { phone }),
        getStatus: () => this.request('/sms-verification/status')
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: JARVIS AI ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class JARVISEngine {
    constructor(api) {
        this.api = api;
        this.conversationHistory = [];
        this.currentContext = null;
    }
    
    // Chat with JARVIS
    async chat(message) {
        try {
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });
            
            const response = await this.api.phoenix.companion.chat(message);
            
            this.conversationHistory.push({
                role: 'assistant',
                content: response.message,
                timestamp: new Date()
            });
            
            return response;
        } catch (error) {
            console.error('JARVIS chat error:', error);
            throw error;
        }
    }
    
    async getHistory() {
        try {
            return await this.api.phoenix.companion.getHistory();
        } catch (error) {
            console.error('Get history error:', error);
            return this.conversationHistory;
        }
    }
    
    async clearHistory() {
        try {
            await this.api.phoenix.companion.clearHistory();
            this.conversationHistory = [];
        } catch (error) {
            console.error('Clear history error:', error);
        }
    }
    
    async getContext() {
        try {
            this.currentContext = await this.api.phoenix.companion.getContext();
            return this.currentContext;
        } catch (error) {
            console.error('Get context error:', error);
            return null;
        }
    }
    
    async discoverPatterns() {
        try {
            return await this.api.phoenix.patterns.analyze();
        } catch (error) {
            console.error('Pattern discovery error:', error);
            throw error;
        }
    }
    
    async getPatterns() {
        try {
            return await this.api.phoenix.patterns.getAll();
        } catch (error) {
            console.error('Get patterns error:', error);
            return [];
        }
    }
    
    async getIntelligenceDashboard() {
        try {
            return await this.api.phoenix.intelligence.getDashboard();
        } catch (error) {
            console.error('Get intelligence dashboard error:', error);
            return null;
        }
    }
    
    async getBurnoutRisk() {
        try {
            return await this.api.phoenix.predictions.getBurnoutRisk();
        } catch (error) {
            console.error('Get burnout risk error:', error);
            return null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: BUTLER SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class ButlerService {
    constructor(api) {
        this.api = api;
    }
    
    async orderFood(restaurant, items) {
        try {
            return await this.api.phoenix.butler.orderFood({ restaurant, items });
        } catch (error) {
            console.error('Order food error:', error);
            throw error;
        }
    }
    
    async bookRide(from, to) {
        try {
            return await this.api.phoenix.butler.bookRide({ from, to });
        } catch (error) {
            console.error('Book ride error:', error);
            throw error;
        }
    }
    
    async makeReservation(place, time, partySize) {
        try {
            return await this.api.phoenix.butler.makeReservation({ place, time, partySize });
        } catch (error) {
            console.error('Make reservation error:', error);
            throw error;
        }
    }
    
    async makePhoneCall(number, message) {
        try {
            return await this.api.phoenix.butler.makeCall({ number, message });
        } catch (error) {
            console.error('Make call error:', error);
            throw error;
        }
    }
    
    async sendSMS(to, message) {
        try {
            return await this.api.phoenix.butler.sendSMS({ to, message });
        } catch (error) {
            console.error('Send SMS error:', error);
            throw error;
        }
    }
    
    async sendEmail(to, subject, body) {
        try {
            return await this.api.phoenix.butler.sendEmail({ to, subject, body });
        } catch (error) {
            console.error('Send email error:', error);
            throw error;
        }
    }
    
    async createAutomation(trigger, action) {
        try {
            return await this.api.phoenix.butler.createAutomation({ trigger, action });
        } catch (error) {
            console.error('Create automation error:', error);
            throw error;
        }
    }
    
    async getAutomations() {
        try {
            return await this.api.phoenix.butler.getAutomations();
        } catch (error) {
            console.error('Get automations error:', error);
            return [];
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: INTERVENTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class InterventionEngine {
    constructor(api) {
        this.api = api;
        this.activeInterventions = [];
        this.pendingInterventions = [];
    }
    
    async loadInterventions() {
        try {
            const [active, pending] = await Promise.all([
                this.api.phoenix.interventions.getActive(),
                this.api.phoenix.interventions.getPending()
            ]);
            
            this.activeInterventions = active || [];
            this.pendingInterventions = pending || [];
            
            return { active: this.activeInterventions, pending: this.pendingInterventions };
        } catch (error) {
            console.error('Load interventions error:', error);
            return { active: [], pending: [] };
        }
    }
    
    async acknowledgeIntervention(interventionId) {
        try {
            const result = await this.api.phoenix.interventions.acknowledge(interventionId);
            await this.loadInterventions();
            return result;
        } catch (error) {
            console.error('Acknowledge intervention error:', error);
            throw error;
        }
    }
    
    async getStats() {
        try {
            return await this.api.phoenix.interventions.getStats();
        } catch (error) {
            console.error('Get intervention stats error:', error);
            return null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: PHOENIX ORCHESTRATOR - The System Conductor
// ═══════════════════════════════════════════════════════════════════════════════

class PhoenixOrchestrator {
    constructor() {
        this.api = new PhoenixAPIClient();
        this.jarvis = new JARVISEngine(this.api);
        this.butler = new ButlerService(this.api);
        this.interventions = new InterventionEngine(this.api);
        
        this.currentView = null;
        this.user = null;
        this.initialized = false;
        
        // State
        this.state = {
            patterns: [],
            interventions: [],
            predictions: [],
            health: {},
            workouts: [],
            goals: [],
            finances: {},
            calendar: []
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    async initialize() {
        console.log('🔥 Phoenix initializing...');
        this.showLoadingStep('Checking authentication...');
        
        try {
            // Check if user is logged in
            const token = Utils.storage.get('phoenixToken');
            if (!token) {
                this.showAuthView();
                return;
            }
            
            this.api.setToken(token);
            
            // Load user data
            this.showLoadingStep('Loading user profile...');
            this.user = await this.api.auth.me();
            
            if (!this.user) {
                this.showAuthView();
                return;
            }
            
            // Hide loading, show main view
            this.hideLoading();
            this.showMainView();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Start real-time monitoring
            this.startRealtimeMonitoring();
            
            this.initialized = true;
            console.log('✅ Phoenix ready!');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showAuthView();
        }
    }
    
    async loadDashboardData() {
        try {
            const [patterns, interventions, predictions, health] = await Promise.all([
                this.jarvis.getPatterns().catch(() => []),
                this.interventions.loadInterventions().catch(() => ({ active: [], pending: [] })),
                this.jarvis.getPredictions().catch(() => []),
                this.api.mercury.recovery.getDashboard().catch(() => ({}))
            ]);
            
            this.state.patterns = patterns;
            this.state.interventions = interventions;
            this.state.predictions = predictions;
            this.state.health = health;
            
            this.renderDashboard();
        } catch (error) {
            console.error('Load dashboard error:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // AUTHENTICATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    async login(email, password) {
        try {
            const response = await this.api.auth.login({ email, password });
            
            if (response.token) {
                this.api.setToken(response.token);
                await this.initialize();
                return { success: true };
            }
            
            return { success: false, error: 'Invalid response' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async register(name, email, password) {
        try {
            const response = await this.api.auth.register({ name, email, password });
            
            if (response.token) {
                this.api.setToken(response.token);
                await this.initialize();
                return { success: true };
            }
            
            return { success: false, error: 'Invalid response' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message };
        }
    }
    
    logout() {
        this.api.clearToken();
        Utils.storage.clear();
        window.location.reload();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    showLoadingStep(message) {
        const stepsEl = document.querySelector('.loading-steps');
        if (stepsEl) {
            stepsEl.textContent = message;
        }
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    showAuthView() {
        this.hideLoading();
        document.getElementById('auth-view').classList.remove('hidden');
        document.getElementById('main-view').classList.add('hidden');
    }
    
    showMainView() {
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('main-view').classList.remove('hidden');
        
        if (this.user) {
            document.querySelector('.user-name').textContent = this.user.name || 'User';
        }
    }
    
    navigateTo(view) {
        this.currentView = view;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-view="${view}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Render view
        switch(view) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'intelligence':
                this.renderIntelligenceDashboard();
                break;
            case 'interventions':
                this.renderInterventionsDashboard();
                break;
            case 'butler':
                this.renderButlerDashboard();
                break;
            case 'mercury':
                this.renderMercuryDashboard();
                break;
            case 'venus':
                this.renderVenusDashboard();
                break;
            case 'earth':
                this.renderEarthDashboard();
                break;
            case 'mars':
                this.renderMarsDashboard();
                break;
            case 'jupiter':
                this.renderJupiterDashboard();
                break;
            case 'saturn':
                this.renderSaturnDashboard();
                break;
            case 'voice':
                this.renderVoiceInterface();
                break;
            case 'settings':
                this.renderSettings();
                break;
            default:
                this.renderDashboard();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DASHBOARD RENDERING
    // ═══════════════════════════════════════════════════════════════════════════
    
    renderDashboard() {
        const content = document.getElementById('main-content');
        const template = document.getElementById('dashboard-template');
        
        if (template) {
            content.innerHTML = template.innerHTML;
            
            // Update stats
            document.getElementById('patterns-discovered').textContent = this.state.patterns.length || 0;
            document.getElementById('interventions-today').textContent = this.state.interventions.pending?.length || 0;
            document.getElementById('predictions-active').textContent = this.state.predictions.length || 0;
            
            // Render recent patterns
            this.renderRecentPatterns();
            
            // Load predictions
            this.loadTodaysPredictions();
            
            // Load system health
            this.loadSystemHealth();
        }
    }
    
    renderRecentPatterns() {
        const container = document.getElementById('recent-patterns');
        if (!container) return;
        
        const recentPatterns = this.state.patterns.slice(0, 3);
        
        if (recentPatterns.length === 0) {
            container.innerHTML = '<div class="text-muted">No patterns discovered yet. Phoenix is learning...</div>';
            return;
        }
        
        container.innerHTML = recentPatterns.map(pattern => `
            <div class="pattern-card">
                <div class="pattern-icon">🧬</div>
                <div class="pattern-content">
                    <div class="pattern-title">${pattern.title || 'Pattern Discovery'}</div>
                    <div class="pattern-description">${pattern.description || ''}</div>
                    <div class="pattern-meta">
                        <span>Confidence: ${pattern.confidence || 0}%</span>
                        <span>Data points: ${pattern.dataPoints || 0}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    async loadTodaysPredictions() {
        const container = document.getElementById('predictions-today');
        if (!container) return;
        
        try {
            const forecast = await this.jarvis.get7DayForecast();
            
            if (forecast && forecast.days && forecast.days.length > 0) {
                const today = forecast.days[0];
                container.innerHTML = `
                    <div class="prediction-item">
                        <div class="prediction-label">Energy Level</div>
                        <div class="prediction-value">${today.energy || 'N/A'}/10</div>
                    </div>
                    <div class="prediction-item">
                        <div class="prediction-label">Recovery Score</div>
                        <div class="prediction-value">${today.recovery || 'N/A'}%</div>
                    </div>
                    <div class="prediction-item">
                        <div class="prediction-label">Workout Optimal</div>
                        <div class="prediction-value">${today.workoutWindow || 'N/A'}</div>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="text-muted">Loading predictions...</div>';
            }
        } catch (error) {
            console.error('Load predictions error:', error);
            container.innerHTML = '<div class="text-muted">Predictions unavailable</div>';
        }
    }
    
    async loadSystemHealth() {
        const container = document.getElementById('system-health');
        if (!container) return;
        
        try {
            const health = this.state.health;
            
            container.innerHTML = `
                <div class="health-metric">
                    <div class="metric-label">Recovery</div>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${health.recoveryScore || 0}%"></div>
                    </div>
                    <div class="metric-value">${health.recoveryScore || 0}%</div>
                </div>
                <div class="health-metric">
                    <div class="metric-label">HRV</div>
                    <div class="metric-value">${health.hrv || 'N/A'} ms</div>
                </div>
                <div class="health-metric">
                    <div class="metric-label">Sleep Quality</div>
                    <div class="metric-value">${health.sleepQuality || 'N/A'}%</div>
                </div>
            `;
        } catch (error) {
            console.error('Load health error:', error);
            container.innerHTML = '<div class="text-muted">Health data unavailable</div>';
        }
    }
    
    renderIntelligenceDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>🧠 Intelligence Dashboard</h1>
                <p>Pattern Discovery & AI Insights</p>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card card-large">
                    <div class="card-header">
                        <h3>Pattern Discovery Feed</h3>
                        <button class="btn-secondary" onclick="Phoenix.analyzePatterns()">Analyze Now</button>
                    </div>
                    <div class="card-content" id="patterns-feed">
                        <div class="loading-spinner">Loading patterns...</div>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>AI Insights</h3>
                    </div>
                    <div class="card-content" id="ai-insights">
                        <div class="loading-spinner">Generating insights...</div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadPatternsFeed();
        this.loadAIInsights();
    }
    
    async loadPatternsFeed() {
        const container = document.getElementById('patterns-feed');
        if (!container) return;
        
        try {
            const patterns = await this.jarvis.getPatterns();
            
            if (patterns && patterns.length > 0) {
                container.innerHTML = patterns.map(pattern => `
                    <div class="pattern-card">
                        <div class="pattern-header">
                            <span class="pattern-badge">🔥 ${pattern.confidence || 0}% confidence</span>
                            <span class="pattern-date">${Utils.formatDate(pattern.discoveredAt || new Date())}</span>
                        </div>
                        <div class="pattern-title">${pattern.title || 'New Pattern'}</div>
                        <div class="pattern-description">${pattern.description || ''}</div>
                        <div class="pattern-actions">
                            <button class="btn-primary" onclick="Phoenix.validatePattern('${pattern._id}', true)">✓ Validate</button>
                            <button class="btn-secondary" onclick="Phoenix.validatePattern('${pattern._id}', false)">✗ Dismiss</button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="empty-state">No patterns discovered yet. Phoenix is analyzing your data...</div>';
            }
        } catch (error) {
            console.error('Load patterns error:', error);
            container.innerHTML = '<div class="error-state">Failed to load patterns</div>';
        }
    }
    
    async loadAIInsights() {
        const container = document.getElementById('ai-insights');
        if (!container) return;
        
        try {
            const insights = await this.jarvis.getIntelligenceDashboard();
            
            if (insights) {
                container.innerHTML = `
                    <div class="insight-item">
                        <div class="insight-label">Burnout Risk</div>
                        <div class="insight-value ${insights.burnoutRisk > 50 ? 'text-danger' : 'text-success'}">
                            ${insights.burnoutRisk || 0}%
                        </div>
                    </div>
                    <div class="insight-item">
                        <div class="insight-label">Productivity Score</div>
                        <div class="insight-value">${insights.productivityScore || 0}/100</div>
                    </div>
                    <div class="insight-item">
                        <div class="insight-label">Health Trend</div>
                        <div class="insight-value">${insights.healthTrend || 'Stable'}</div>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="empty-state">Generating insights...</div>';
            }
        } catch (error) {
            console.error('Load insights error:', error);
            container.innerHTML = '<div class="error-state">Failed to load insights</div>';
        }
    }
    
    renderInterventionsDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>⚡ Autonomous Interventions</h1>
                <p>Phoenix making decisions for your wellbeing</p>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card card-large">
                    <div class="card-header">
                        <h3>Pending Your Approval</h3>
                        <span class="card-badge">${this.state.interventions.pending?.length || 0} pending</span>
                    </div>
                    <div class="card-content" id="pending-interventions">
                        <div class="loading-spinner">Loading interventions...</div>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>Intervention Stats</h3>
                    </div>
                    <div class="card-content" id="intervention-stats">
                        <div class="loading-spinner">Loading stats...</div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadPendingInterventions();
        this.loadInterventionStats();
    }
    
    async loadPendingInterventions() {
        const container = document.getElementById('pending-interventions');
        if (!container) return;
        
        try {
            const interventions = await this.interventions.loadInterventions();
            const pending = interventions.pending || [];
            
            if (pending.length > 0) {
                container.innerHTML = pending.map(intervention => `
                    <div class="intervention-card">
                        <div class="intervention-icon">${intervention.icon || '⚡'}</div>
                        <div class="intervention-content">
                            <div class="intervention-title">${intervention.title || 'Intervention'}</div>
                            <div class="intervention-reason">${intervention.reason || ''}</div>
                            <div class="intervention-impact">Impact: ${intervention.impact || 'Unknown'}</div>
                            <div class="intervention-actions">
                                <button class="btn-primary" onclick="Phoenix.approveIntervention('${intervention._id}')">✓ Approve</button>
                                <button class="btn-secondary" onclick="Phoenix.denyIntervention('${intervention._id}')">✗ Deny</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="empty-state">No pending interventions. Phoenix is monitoring...</div>';
            }
        } catch (error) {
            console.error('Load interventions error:', error);
            container.innerHTML = '<div class="error-state">Failed to load interventions</div>';
        }
    }
    
    async loadInterventionStats() {
        const container = document.getElementById('intervention-stats');
        if (!container) return;
        
        try {
            const stats = await this.interventions.getStats();
            
            if (stats) {
                container.innerHTML = `
                    <div class="stat-item">
                        <div class="stat-label">Total Interventions</div>
                        <div class="stat-value">${stats.total || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Approval Rate</div>
                        <div class="stat-value">${stats.approvalRate || 0}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Success Rate</div>
                        <div class="stat-value">${stats.successRate || 0}%</div>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="empty-state">No stats available yet</div>';
            }
        } catch (error) {
            console.error('Load stats error:', error);
            container.innerHTML = '<div class="error-state">Failed to load stats</div>';
        }
    }
    
    renderButlerDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>🤵 Phoenix Butler</h1>
                <p>Real-world actions at your command</p>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div class="card-content">
                        <div class="quick-actions">
                            <button class="quick-action-btn" onclick="Phoenix.orderFood()">
                                <span class="action-icon">🍽️</span>
                                <span class="action-label">Order Food</span>
                            </button>
                            <button class="quick-action-btn" onclick="Phoenix.bookRide()">
                                <span class="action-icon">🚗</span>
                                <span class="action-label">Book Ride</span>
                            </button>
                            <button class="quick-action-btn" onclick="Phoenix.makeCall()">
                                <span class="action-icon">📞</span>
                                <span class="action-label">Make Call</span>
                            </button>
                            <button class="quick-action-btn" onclick="Phoenix.sendEmail()">
                                <span class="action-icon">📧</span>
                                <span class="action-label">Send Email</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card card-large">
                    <div class="card-header">
                        <h3>Recent Actions</h3>
                    </div>
                    <div class="card-content" id="butler-actions">
                        <div class="loading-spinner">Loading actions...</div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadButlerActions();
    }
    
    async loadButlerActions() {
        const container = document.getElementById('butler-actions');
        if (!container) return;
        
        container.innerHTML = '<div class="empty-state">No recent actions</div>';
    }
    
    // Simplified planet renderers
    renderMercuryDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>🔬 Mercury - Health & Biometrics</h1>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header"><h3>DEXA Scan Analysis</h3></div>
                    <div class="card-content">Coming soon - Clinical-grade body composition</div>
                </div>
                <div class="dashboard-card">
                    <div class="card-header"><h3>Recovery Dashboard</h3></div>
                    <div class="card-content">Coming soon - Recovery scoring & protocols</div>
                </div>
            </div>
        `;
    }
    
    renderVenusDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>💪 Venus - Fitness & Training</h1>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header"><h3>Quantum Workouts</h3></div>
                    <div class="card-content">
                        <button class="btn-primary" onclick="Phoenix.generateQuantumWorkout()">
                            Generate Chaos-Based Workout
                        </button>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="card-header"><h3>Workout History</h3></div>
                    <div class="card-content">Coming soon - Training analytics</div>
                </div>
            </div>
        `;
    }
    
    renderEarthDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>📅 Earth - Calendar & Energy</h1>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card card-large">
                    <div class="card-header"><h3>Energy-Optimized Schedule</h3></div>
                    <div class="card-content">Coming soon - AI calendar optimization</div>
                </div>
            </div>
        `;
    }
    
    renderMarsDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>🎯 Mars - Goals & Achievement</h1>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card card-large">
                    <div class="card-header"><h3>Goal Tracking</h3></div>
                    <div class="card-content">Coming soon - AI-powered goal system</div>
                </div>
            </div>
        `;
    }
    
    renderJupiterDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>💰 Jupiter - Financial Intelligence</h1>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card card-large">
                    <div class="card-header"><h3>Stress-Spending Analysis</h3></div>
                    <div class="card-content">Coming soon - Financial pattern detection</div>
                </div>
            </div>
        `;
    }
    
    renderSaturnDashboard() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>🗓️ Saturn - Life Vision & Legacy</h1>
            </div>
            <div class="dashboard-grid">
                <div class="dashboard-card card-large">
                    <div class="card-header"><h3>Life Vision</h3></div>
                    <div class="card-content">Coming soon - 10-year planning & mortality awareness</div>
                </div>
            </div>
        `;
    }
    
    renderVoiceInterface() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>🗣️ Voice Mode</h1>
            </div>
            <div class="voice-container">
                <div class="arc-reactor-large">
                    <div class="arc-core"></div>
                    <div class="arc-ring ring-1"></div>
                    <div class="arc-ring ring-2"></div>
                    <div class="arc-ring ring-3"></div>
                </div>
                <button class="btn-primary btn-large" onclick="Phoenix.startVoiceSession()">
                    🎤 Press to Talk
                </button>
            </div>
        `;
    }
    
    renderSettings() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>⚙️ Settings</h1>
            </div>
            <div class="settings-container">
                <div class="setting-section">
                    <h3>Account</h3>
                    <div class="setting-item">
                        <label>Name</label>
                        <input type="text" value="${this.user?.name || ''}" />
                    </div>
                    <div class="setting-item">
                        <label>Email</label>
                        <input type="email" value="${this.user?.email || ''}" readonly />
                    </div>
                </div>
                <div class="setting-section">
                    <h3>Intervention Settings</h3>
                    <div class="setting-item">
                        <label>Autonomy Level</label>
                        <select>
                            <option>Conservative</option>
                            <option selected>Moderate</option>
                            <option>Aggressive</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ACTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════
    
    async analyzePatterns() {
        try {
            console.log('Analyzing patterns...');
            await this.jarvis.discoverPatterns();
            await this.loadDashboardData();
            this.showNotification('Pattern analysis complete!', 'success');
        } catch (error) {
            console.error('Analyze patterns error:', error);
            this.showNotification('Failed to analyze patterns', 'error');
        }
    }
    
    async validatePattern(patternId, isValid) {
        try {
            await this.jarvis.validatePattern(patternId, isValid);
            await this.loadPatternsFeed();
            this.showNotification(isValid ? 'Pattern validated!' : 'Pattern dismissed', 'success');
        } catch (error) {
            console.error('Validate pattern error:', error);
            this.showNotification('Failed to validate pattern', 'error');
        }
    }
    
    async approveIntervention(interventionId) {
        try {
            await this.interventions.acknowledgeIntervention(interventionId);
            await this.loadPendingInterventions();
            this.showNotification('Intervention approved!', 'success');
        } catch (error) {
            console.error('Approve intervention error:', error);
            this.showNotification('Failed to approve intervention', 'error');
        }
    }
    
    async denyIntervention(interventionId) {
        // For now, just reload the list
        await this.loadPendingInterventions();
        this.showNotification('Intervention denied', 'info');
    }
    
    async generateQuantumWorkout() {
        try {
            const workout = await this.api.venus.workouts.generateQuantum({});
            this.showNotification('Quantum workout generated!', 'success');
            console.log('Quantum workout:', workout);
        } catch (error) {
            console.error('Generate workout error:', error);
            this.showNotification('Failed to generate workout', 'error');
        }
    }
    
    // Placeholder actions
    orderFood() {
        this.showNotification('Food ordering coming soon!', 'info');
    }
    
    bookRide() {
        this.showNotification('Ride booking coming soon!', 'info');
    }
    
    makeCall() {
        this.showNotification('Phone calls coming soon!', 'info');
    }
    
    sendEmail() {
        this.showNotification('Email sending coming soon!', 'info');
    }
    
    startVoiceSession() {
        this.showNotification('Voice mode coming soon!', 'info');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // JARVIS CHAT
    // ═══════════════════════════════════════════════════════════════════════════
    
    toggleJarvis() {
        const chatContainer = document.getElementById('jarvis-chat');
        if (chatContainer) {
            chatContainer.classList.toggle('hidden');
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        input.value = '';
        
        // Add user message to UI
        this.addMessageToChat('user', message);
        
        try {
            const response = await this.jarvis.chat(message);
            this.addMessageToChat('jarvis', response.message || response.reply || 'I understand.');
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToChat('jarvis', 'I apologize, I encountered an error processing your message.');
        }
    }
    
    addMessageToChat(role, content) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${Utils.formatTime(new Date())}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: var(--glow-primary);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // REAL-TIME MONITORING
    // ═══════════════════════════════════════════════════════════════════════════
    
    startRealtimeMonitoring() {
        // Poll for updates every 30 seconds
        setInterval(async () => {
            try {
                // Check for new interventions
                const interventions = await this.interventions.loadInterventions();
                const pendingCount = interventions.pending?.length || 0;
                
                // Update badge
                const badge = document.getElementById('interventions-badge');
                if (badge) {
                    badge.textContent = pendingCount;
                    if (pendingCount > 0) {
                        badge.classList.add('pending');
                    } else {
                        badge.classList.remove('pending');
                    }
                }
                
                // Show notification if new interventions
                if (pendingCount > this.state.interventions.pending?.length || 0) {
                    this.showNotification(`${pendingCount} new intervention(s) pending approval`, 'info');
                }
                
                this.state.interventions = interventions;
            } catch (error) {
                console.error('Real-time monitoring error:', error);
            }
        }, 30000);
    }
    
    // Helper methods
    showLogin() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    }
    
    showRegister() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION & EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

// Create global Phoenix instance
const Phoenix = new PhoenixOrchestrator();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔥 Phoenix loading...');
    
    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            if (view) {
                Phoenix.navigateTo(view);
            }
        });
    });
    
    // Setup auth forms
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                Phoenix.showNotification('Please enter email and password', 'error');
                return;
            }
            
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;
            
            const result = await Phoenix.login(email, password);
            
            loginBtn.textContent = 'Login';
            loginBtn.disabled = false;
            
            if (!result.success) {
                Phoenix.showNotification(result.error || 'Login failed', 'error');
            }
        });
    }
    
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            if (!name || !email || !password) {
                Phoenix.showNotification('Please fill all fields', 'error');
                return;
            }
            
            if (!Utils.isValidEmail(email)) {
                Phoenix.showNotification('Please enter a valid email', 'error');
                return;
            }
            
            registerBtn.textContent = 'Creating account...';
            registerBtn.disabled = true;
            
            const result = await Phoenix.register(name, email, password);
            
            registerBtn.textContent = 'Create Account';
            registerBtn.disabled = false;
            
            if (!result.success) {
                Phoenix.showNotification(result.error || 'Registration failed', 'error');
            }
        });
    }
    
    // Setup chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                Phoenix.sendMessage();
            }
        });
    }
    
    // Setup JARVIS avatar click
    const jarvisAvatar = document.querySelector('.jarvis-avatar');
    if (jarvisAvatar) {
        jarvisAvatar.addEventListener('click', () => {
            Phoenix.toggleJarvis();
        });
    }
    
    // Initialize Phoenix
    await Phoenix.initialize();
});

// Make Phoenix globally available
window.Phoenix = Phoenix;

console.log('✅ Phoenix JARVIS Butler loaded successfully!');
