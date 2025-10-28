/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔥 PHOENIX CORE - API GATEWAY
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Purpose: Complete API Gateway for all 307 Phoenix endpoints
 * Dependencies: None (pure JavaScript)
 * Used By: All other Phoenix files
 * 
 * Architecture:
 * - Zero external dependencies
 * - Intelligent caching system
 * - Network retry logic
 * - Auth token management
 * - Error handling & recovery
 * 
 * @version 1.0.0
 * @author Phoenix Team
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📡 CONFIGURATION & CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PHOENIX_CONFIG = {
    // API Configuration
    BASE_URL: 'pal-backend-production.up.railway.app',
    API_VERSION: 'v1',
    TIMEOUT: 30000,
    
    // Cache Configuration
    CACHE_DURATION: {
        SHORT: 60000,        // 1 minute
        MEDIUM: 300000,      // 5 minutes
        LONG: 1800000,       // 30 minutes
        PERSISTENT: 86400000 // 24 hours
    },
    
    // Retry Configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_BACKOFF: 2,
    
    // Headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 PHOENIX API CLASS - MAIN GATEWAY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class PhoenixAPI {
    constructor() {
        this.baseURL = PHOENIX_CONFIG.BASE_URL;
        this.cache = new CacheManager();
        this.network = new NetworkManager();
        this.auth = new AuthManager();
        this.utils = new Utils();
        
        // Initialize auth interceptor
        this.setupInterceptors();
    }
    
    setupInterceptors() {
        // Add auth token to all requests
        this.network.addRequestInterceptor((config) => {
            const token = this.auth.getToken();
            if (token) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        });
        
        // Handle auth errors
        this.network.addResponseInterceptor(
            (response) => response,
            async (error) => {
                if (error.status === 401) {
                    // Token expired, try to refresh
                    const refreshed = await this.auth.refreshToken();
                    if (refreshed) {
                        // Retry the original request
                        return this.network.request(error.config);
                    }
                    // Refresh failed, logout user
                    this.auth.logout();
                    window.location.href = '/login';
                }
                throw error;
            }
        );
    }
    
    // Core request method
    async request(method, endpoint, data = null, options = {}) {
        const config = {
            method,
            url: `${this.baseURL}${endpoint}`,
            data,
            ...options
        };
        
        // Check cache for GET requests
        if (method === 'GET' && !options.skipCache) {
            const cached = this.cache.get(endpoint);
            if (cached) {
                return cached;
            }
        }
        
        try {
            const response = await this.network.request(config);
            
            // Cache successful GET requests
            if (method === 'GET' && response) {
                const cacheDuration = options.cacheDuration || PHOENIX_CONFIG.CACHE_DURATION.MEDIUM;
                this.cache.set(endpoint, response, cacheDuration);
            }
            
            return response;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }
    
    // Convenience methods
    get(endpoint, options) {
        return this.request('GET', endpoint, null, options);
    }
    
    post(endpoint, data, options) {
        return this.request('POST', endpoint, data, options);
    }
    
    put(endpoint, data, options) {
        return this.request('PUT', endpoint, data, options);
    }
    
    delete(endpoint, options) {
        return this.request('DELETE', endpoint, null, options);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTH ROUTES (9 ENDPOINTS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const authAPI = {
    /**
     * Register new user
     * POST /api/auth/register
     */
    register: async (userData) => {
        const api = new PhoenixAPI();
        return api.post('/api/auth/register', userData);
    },
    
    /**
     * User login
     * POST /api/auth/login
     */
    login: async (credentials) => {
        const api = new PhoenixAPI();
        const response = await api.post('/api/auth/login', credentials);
        if (response.token) {
            api.auth.setToken(response.token);
        }
        return response;
    },
    
    /**
     * Request password reset
     * POST /api/auth/reset-password
     */
    resetPasswordRequest: async (email) => {
        const api = new PhoenixAPI();
        return api.post('/api/auth/reset-password', { email });
    },
    
    /**
     * Reset password with token
     * PUT /api/auth/reset-password/:resetToken
     */
    resetPassword: async (resetToken, newPassword) => {
        const api = new PhoenixAPI();
        return api.put(`/api/auth/reset-password/${resetToken}`, { password: newPassword });
    },
    
    /**
     * Get current user profile
     * GET /api/auth/me
     */
    getCurrentUser: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/auth/me');
    },
    
    /**
     * Update user preferences
     * PUT /api/auth/me
     */
    updateUserPreferences: async (preferences) => {
        const api = new PhoenixAPI();
        return api.put('/api/auth/me', preferences);
    },
    
    /**
     * Change password
     * PUT /api/auth/change-password
     */
    changePassword: async (currentPassword, newPassword) => {
        const api = new PhoenixAPI();
        return api.put('/api/auth/change-password', { currentPassword, newPassword });
    },
    
    /**
     * Logout user
     * POST /api/auth/logout
     */
    logout: async () => {
        const api = new PhoenixAPI();
        const response = await api.post('/api/auth/logout');
        api.auth.clearToken();
        return response;
    },
    
    /**
     * Get API documentation
     * GET /api/auth/docs
     */
    getDocs: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/auth/docs');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 SMS ROUTES (4 ENDPOINTS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const smsAPI = {
    /**
     * Send SMS message
     * POST /api/sms/send
     */
    send: async (to, message) => {
        const api = new PhoenixAPI();
        return api.post('/api/sms/send', { to, message });
    },
    
    /**
     * Get SMS history
     * GET /api/sms/history
     */
    getHistory: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/sms/history');
    },
    
    /**
     * Handle incoming SMS webhook
     * POST /api/sms/webhook
     */
    handleWebhook: async (data) => {
        const api = new PhoenixAPI();
        return api.post('/api/sms/webhook', data);
    },
    
    /**
     * Get SMS preferences
     * GET /api/sms/preferences
     */
    getPreferences: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/sms/preferences');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👤 USER ROUTES (11 ENDPOINTS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const userAPI = {
    /**
     * Get user profile
     * GET /api/users/profile
     */
    getProfile: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/users/profile');
    },
    
    /**
     * Update user profile
     * PUT /api/users/profile
     */
    updateProfile: async (profileData) => {
        const api = new PhoenixAPI();
        return api.put('/api/users/profile', profileData);
    },
    
    /**
     * Get user settings
     * GET /api/users/settings
     */
    getSettings: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/users/settings');
    },
    
    /**
     * Update user settings
     * PUT /api/users/settings
     */
    updateSettings: async (settings) => {
        const api = new PhoenixAPI();
        return api.put('/api/users/settings', settings);
    },
    
    /**
     * Get user notifications
     * GET /api/users/notifications
     */
    getNotifications: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/users/notifications');
    },
    
    /**
     * Mark notification as read
     * PUT /api/users/notifications/:id/read
     */
    markNotificationRead: async (notificationId) => {
        const api = new PhoenixAPI();
        return api.put(`/api/users/notifications/${notificationId}/read`);
    },
    
    /**
     * Get user activity log
     * GET /api/users/activity
     */
    getActivity: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/users/activity');
    },
    
    /**
     * Get user stats
     * GET /api/users/stats
     */
    getStats: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/users/stats');
    },
    
    /**
     * Upload user avatar
     * POST /api/users/avatar
     */
    uploadAvatar: async (formData) => {
        const api = new PhoenixAPI();
        return api.post('/api/users/avatar', formData);
    },
    
    /**
     * Delete user account
     * DELETE /api/users/account
     */
    deleteAccount: async () => {
        const api = new PhoenixAPI();
        return api.delete('/api/users/account');
    },
    
    /**
     * Export user data
     * GET /api/users/export
     */
    exportData: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/users/export');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳 SUBSCRIPTION ROUTES (5 ENDPOINTS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const subscriptionAPI = {
    /**
     * Get subscription status
     * GET /api/subscription/status
     */
    getStatus: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/subscription/status');
    },
    
    /**
     * Create subscription
     * POST /api/subscription/create
     */
    create: async (planId, paymentMethod) => {
        const api = new PhoenixAPI();
        return api.post('/api/subscription/create', { planId, paymentMethod });
    },
    
    /**
     * Update subscription
     * PUT /api/subscription/update
     */
    update: async (planId) => {
        const api = new PhoenixAPI();
        return api.put('/api/subscription/update', { planId });
    },
    
    /**
     * Cancel subscription
     * POST /api/subscription/cancel
     */
    cancel: async () => {
        const api = new PhoenixAPI();
        return api.post('/api/subscription/cancel');
    },
    
    /**
     * Get billing history
     * GET /api/subscription/billing
     */
    getBillingHistory: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/subscription/billing');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🩺 MERCURY ROUTES (38 ENDPOINTS) - Wearables & Biometrics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mercuryAPI = {
    // ═══════════════════════════════════════════════════════════════════════════
    // DEVICE MANAGEMENT (7 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    devices: {
        /**
         * Connect wearable device
         * POST /api/mercury/devices/:provider/connect
         */
        connect: async (provider) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mercury/devices/${provider}/connect`);
        },
        
        /**
         * Exchange auth token
         * POST /api/mercury/devices/:provider/exchange
         */
        exchangeToken: async (provider, code) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mercury/devices/${provider}/exchange`, { code });
        },
        
        /**
         * Get connected devices
         * GET /api/mercury/devices
         */
        getAll: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/devices');
        },
        
        /**
         * Disconnect device
         * DELETE /api/mercury/devices/:provider
         */
        disconnect: async (provider) => {
            const api = new PhoenixAPI();
            return api.delete(`/api/mercury/devices/${provider}`);
        },
        
        /**
         * Sync device data
         * POST /api/mercury/devices/:provider/sync
         */
        sync: async (provider) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mercury/devices/${provider}/sync`);
        },
        
        /**
         * Handle device webhook
         * POST /api/mercury/webhook/:provider
         */
        handleWebhook: async (provider, data) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mercury/webhook/${provider}`, data);
        },
        
        /**
         * Get wearable insights
         * GET /api/mercury/insights
         */
        getInsights: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/insights');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // BIOMETRICS (10 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    biometrics: {
        /**
         * Get DEXA scan data
         * GET /api/mercury/biometrics/dexa
         */
        getDexa: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/dexa', {
                cacheDuration: PHOENIX_CONFIG.CACHE_DURATION.LONG
            });
        },
        
        /**
         * Get body composition
         * GET /api/mercury/biometrics/composition
         */
        getComposition: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/composition');
        },
        
        /**
         * Get metabolic rate
         * GET /api/mercury/biometrics/metabolic
         */
        getMetabolic: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/metabolic');
        },
        
        /**
         * Calculate metabolic rate
         * POST /api/mercury/biometrics/metabolic/calculate
         */
        calculateMetabolic: async (data) => {
            const api = new PhoenixAPI();
            return api.post('/api/mercury/biometrics/metabolic/calculate', data);
        },
        
        /**
         * Get health ratios
         * GET /api/mercury/biometrics/ratios
         */
        getRatios: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/ratios');
        },
        
        /**
         * Get visceral fat data
         * GET /api/mercury/biometrics/visceral-fat
         */
        getVisceralFat: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/visceral-fat');
        },
        
        /**
         * Get bone density
         * GET /api/mercury/biometrics/bone-density
         */
        getBoneDensity: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/bone-density');
        },
        
        /**
         * Get hydration status
         * GET /api/mercury/biometrics/hydration
         */
        getHydration: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/hydration');
        },
        
        /**
         * Get biometric trends
         * GET /api/mercury/biometrics/trends
         */
        getTrends: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/trends');
        },
        
        /**
         * Get biometric correlations
         * GET /api/mercury/biometrics/correlations
         */
        getCorrelations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/correlations');
        },
        
        /**
         * Get HRV data
         * GET /api/mercury/biometrics/hrv
         */
        getHRV: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/hrv');
        },
        
        /**
         * Get deep HRV analysis
         * GET /api/mercury/biometrics/hrv/deep-analysis
         */
        getDeepHRVAnalysis: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/hrv/deep-analysis');
        },
        
        /**
         * Get heart rate data
         * GET /api/mercury/biometrics/heart-rate
         */
        getHeartRate: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/heart-rate');
        },
        
        /**
         * Get readiness score
         * GET /api/mercury/biometrics/readiness
         */
        getReadiness: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/biometrics/readiness');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RECOVERY (11 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    recovery: {
        /**
         * Get latest recovery score
         * GET /api/mercury/recovery/latest
         */
        getLatest: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/latest', {
                cacheDuration: PHOENIX_CONFIG.CACHE_DURATION.SHORT
            });
        },
        
        /**
         * Get recovery history
         * GET /api/mercury/recovery/history
         */
        getHistory: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/history');
        },
        
        /**
         * Recalculate recovery score
         * POST /api/mercury/recovery/calculate
         */
        recalculate: async () => {
            const api = new PhoenixAPI();
            return api.post('/api/mercury/recovery/calculate');
        },
        
        /**
         * Get recovery trends
         * GET /api/mercury/recovery/trends
         */
        getTrends: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/trends');
        },
        
        /**
         * Get recovery prediction
         * GET /api/mercury/recovery/prediction
         */
        getPrediction: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/prediction');
        },
        
        /**
         * Get recovery protocols
         * GET /api/mercury/recovery/protocols
         */
        getProtocols: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/protocols');
        },
        
        /**
         * Get recovery debt
         * GET /api/mercury/recovery/debt
         */
        getDebt: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/debt');
        },
        
        /**
         * Get overtraining risk
         * GET /api/mercury/recovery/overtraining-risk
         */
        getOvertrainingRisk: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/overtraining-risk');
        },
        
        /**
         * Get training load
         * GET /api/mercury/recovery/training-load
         */
        getTrainingLoad: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/training-load');
        },
        
        /**
         * Get recovery insights
         * GET /api/mercury/recovery/insights
         */
        getInsights: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/insights');
        },
        
        /**
         * Get recovery dashboard (P0 CRITICAL)
         * GET /api/mercury/recovery/dashboard
         */
        getDashboard: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/recovery/dashboard', {
                cacheDuration: PHOENIX_CONFIG.CACHE_DURATION.SHORT
            });
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SLEEP (3 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    sleep: {
        /**
         * Get sleep data
         * GET /api/mercury/sleep
         */
        get: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/sleep');
        },
        
        /**
         * Get sleep analysis
         * GET /api/mercury/sleep/analysis
         */
        getAnalysis: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/sleep/analysis');
        },
        
        /**
         * Get sleep recommendations
         * GET /api/mercury/sleep/recommendations
         */
        getRecommendations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mercury/sleep/recommendations');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DATA MANAGEMENT (7 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    data: {
        /**
         * Get wearable data
         * GET /api/mercury/data
         */
        get: async (params) => {
            const api = new PhoenixAPI();
            const queryString = new URLSearchParams(params).toString();
            return api.get(`/api/mercury/data?${queryString}`);
        },
        
        /**
         * Get raw wearable data
         * GET /api/mercury/data/raw
         */
        getRaw: async (params) => {
            const api = new PhoenixAPI();
            const queryString = new URLSearchParams(params).toString();
            return api.get(`/api/mercury/data/raw?${queryString}`);
        },
        
        /**
         * Manual data entry
         * POST /api/mercury/data/manual
         */
        manualEntry: async (data) => {
            const api = new PhoenixAPI();
            return api.post('/api/mercury/data/manual', data);
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💪 VENUS ROUTES (88 ENDPOINTS) - Fitness & Nutrition
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const venusAPI = {
    // ═══════════════════════════════════════════════════════════════════════════
    // QUANTUM WORKOUTS (4 endpoints) - PATENT SHOWCASE
    // ═══════════════════════════════════════════════════════════════════════════
    workouts: {
        quantum: {
            /**
             * Generate quantum workout (P0 CRITICAL)
             * POST /api/venus/workouts/quantum/generate
             */
            generate: async (preferences) => {
                const api = new PhoenixAPI();
                return api.post('/api/venus/workouts/quantum/generate', preferences);
            },
            
            /**
             * Get quantum workout history
             * GET /api/venus/workouts/quantum/history
             */
            getHistory: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts/quantum/history');
            },
            
            /**
             * Regenerate quantum workout
             * POST /api/venus/workouts/quantum/regenerate
             */
            regenerate: async (workoutId) => {
                const api = new PhoenixAPI();
                return api.post('/api/venus/workouts/quantum/regenerate', { workoutId });
            },
            
            /**
             * Get quantum parameters
             * GET /api/venus/workouts/quantum/parameters
             */
            getParameters: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts/quantum/parameters');
            }
        },
        
        // ═══════════════════════════════════════════════════════════════════════
        // STANDARD WORKOUTS (15 endpoints)
        // ═══════════════════════════════════════════════════════════════════════
        standard: {
            /**
             * Create workout
             * POST /api/venus/workouts
             */
            create: async (workout) => {
                const api = new PhoenixAPI();
                return api.post('/api/venus/workouts', workout);
            },
            
            /**
             * Get all workouts
             * GET /api/venus/workouts
             */
            getAll: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts');
            },
            
            /**
             * Get workout by ID
             * GET /api/venus/workouts/:id
             */
            getById: async (workoutId) => {
                const api = new PhoenixAPI();
                return api.get(`/api/venus/workouts/${workoutId}`);
            },
            
            /**
             * Update workout
             * PUT /api/venus/workouts/:id
             */
            update: async (workoutId, data) => {
                const api = new PhoenixAPI();
                return api.put(`/api/venus/workouts/${workoutId}`, data);
            },
            
            /**
             * Delete workout
             * DELETE /api/venus/workouts/:id
             */
            delete: async (workoutId) => {
                const api = new PhoenixAPI();
                return api.delete(`/api/venus/workouts/${workoutId}`);
            },
            
            /**
             * Log workout
             * POST /api/venus/workouts/:id/log
             */
            log: async (workoutId, logData) => {
                const api = new PhoenixAPI();
                return api.post(`/api/venus/workouts/${workoutId}/log`, logData);
            },
            
            /**
             * Get workout recommendations
             * GET /api/venus/workouts/recommendations
             */
            getRecommendations: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts/recommendations');
            },
            
            /**
             * Analyze workout form
             * POST /api/venus/workouts/analyze-form
             */
            analyzeForm: async (videoData) => {
                const api = new PhoenixAPI();
                return api.post('/api/venus/workouts/analyze-form', videoData);
            },
            
            /**
             * Get workout templates
             * GET /api/venus/workouts/templates
             */
            getTemplates: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts/templates');
            },
            
            /**
             * Create periodization plan
             * POST /api/venus/workouts/periodization
             */
            createPeriodizationPlan: async (goals) => {
                const api = new PhoenixAPI();
                return api.post('/api/venus/workouts/periodization', goals);
            },
            
            /**
             * Plan deload week
             * POST /api/venus/workouts/deload
             */
            planDeload: async () => {
                const api = new PhoenixAPI();
                return api.post('/api/venus/workouts/deload');
            },
            
            /**
             * Get volume recommendations
             * GET /api/venus/workouts/volume
             */
            getVolumeRecommendations: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts/volume');
            },
            
            /**
             * Find optimal workout window
             * GET /api/venus/workouts/optimal-time
             */
            getOptimalTime: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts/optimal-time');
            },
            
            /**
             * Get workout stats
             * GET /api/venus/workouts/stats
             */
            getStats: async () => {
                const api = new PhoenixAPI();
                return api.get('/api/venus/workouts/stats');
            },
            
            /**
             * Get workout history
             * GET /api/venus/workouts/history
             */
            getHistory: async (params) => {
                const api = new PhoenixAPI();
                const queryString = new URLSearchParams(params).toString();
                return api.get(`/api/venus/workouts/history?${queryString}`);
            }
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NUTRITION (13 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    nutrition: {
        /**
         * Log meal
         * POST /api/venus/nutrition/log
         */
        logMeal: async (meal) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/nutrition/log', meal);
        },
        
        /**
         * Get today's nutrition
         * GET /api/venus/nutrition/today
         */
        getToday: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/nutrition/today', {
                cacheDuration: PHOENIX_CONFIG.CACHE_DURATION.SHORT
            });
        },
        
        /**
         * Get nutrition history
         * GET /api/venus/nutrition/history
         */
        getHistory: async (params) => {
            const api = new PhoenixAPI();
            const queryString = new URLSearchParams(params).toString();
            return api.get(`/api/venus/nutrition/history?${queryString}`);
        },
        
        /**
         * Calculate macro targets
         * POST /api/venus/nutrition/targets
         */
        calculateTargets: async (goals) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/nutrition/targets', goals);
        },
        
        /**
         * Analyze food photo
         * POST /api/venus/nutrition/analyze-photo
         */
        analyzePhoto: async (photoData) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/nutrition/analyze-photo', photoData);
        },
        
        /**
         * Generate meal plan
         * POST /api/venus/nutrition/meal-plan
         */
        generateMealPlan: async (preferences) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/nutrition/meal-plan', preferences);
        },
        
        /**
         * Get recipe suggestions
         * GET /api/venus/nutrition/recipes
         */
        getRecipes: async (filters) => {
            const api = new PhoenixAPI();
            const queryString = new URLSearchParams(filters).toString();
            return api.get(`/api/venus/nutrition/recipes?${queryString}`);
        },
        
        /**
         * Get restaurant recommendations
         * GET /api/venus/nutrition/restaurants
         */
        getRestaurants: async (location) => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/nutrition/restaurants', { params: { location } });
        },
        
        /**
         * Calculate water intake
         * GET /api/venus/nutrition/water
         */
        getWaterIntake: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/nutrition/water');
        },
        
        /**
         * Log water intake
         * POST /api/venus/nutrition/water/log
         */
        logWater: async (amount) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/nutrition/water/log', { amount });
        },
        
        /**
         * Get nutrition insights
         * GET /api/venus/nutrition/insights
         */
        getInsights: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/nutrition/insights');
        },
        
        /**
         * Get macro balance
         * GET /api/venus/nutrition/macro-balance
         */
        getMacroBalance: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/nutrition/macro-balance');
        },
        
        /**
         * Get nutrition stats
         * GET /api/venus/nutrition/stats
         */
        getStats: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/nutrition/stats');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SUPPLEMENTS (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    supplements: {
        /**
         * Get supplement recommendations
         * GET /api/venus/supplements
         */
        getRecommendations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/supplements');
        },
        
        /**
         * Log supplement intake
         * POST /api/venus/supplements/log
         */
        log: async (supplement) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/supplements/log', supplement);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FITNESS DATA (35 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    fitness: {
        /**
         * Get exercises
         * GET /api/venus/exercises
         */
        getExercises: async (filters) => {
            const api = new PhoenixAPI();
            const queryString = filters ? new URLSearchParams(filters).toString() : '';
            return api.get(`/api/venus/exercises${queryString ? '?' + queryString : ''}`);
        },
        
        /**
         * Get exercise by ID
         * GET /api/venus/exercises/:id
         */
        getExerciseById: async (exerciseId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/venus/exercises/${exerciseId}`);
        },
        
        /**
         * Create custom exercise
         * POST /api/venus/exercises
         */
        createExercise: async (exercise) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/exercises', exercise);
        },
        
        /**
         * Log exercise set
         * POST /api/venus/exercises/:id/sets
         */
        logSet: async (exerciseId, setData) => {
            const api = new PhoenixAPI();
            return api.post(`/api/venus/exercises/${exerciseId}/sets`, setData);
        },
        
        /**
         * Get personal records
         * GET /api/venus/fitness/prs
         */
        getPersonalRecords: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/prs');
        },
        
        /**
         * Get strength standards
         * GET /api/venus/fitness/standards
         */
        getStrengthStandards: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/standards');
        },
        
        /**
         * Calculate one-rep max
         * POST /api/venus/fitness/1rm
         */
        calculateOneRepMax: async (weight, reps) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/fitness/1rm', { weight, reps });
        },
        
        /**
         * Get progression analysis
         * GET /api/venus/fitness/progression
         */
        getProgression: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/progression');
        },
        
        /**
         * Get injury risk assessment
         * GET /api/venus/fitness/injury-risk
         */
        getInjuryRisk: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/injury-risk');
        },
        
        /**
         * Get muscle imbalances
         * GET /api/venus/fitness/imbalances
         */
        getMuscleImbalances: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/imbalances');
        },
        
        /**
         * Get training volume
         * GET /api/venus/fitness/volume
         */
        getTrainingVolume: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/volume');
        },
        
        /**
         * Get training frequency
         * GET /api/venus/fitness/frequency
         */
        getTrainingFrequency: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/frequency');
        },
        
        /**
         * Get training intensity
         * GET /api/venus/fitness/intensity
         */
        getTrainingIntensity: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/intensity');
        },
        
        /**
         * Get body measurements
         * GET /api/venus/fitness/measurements
         */
        getMeasurements: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/measurements');
        },
        
        /**
         * Log body measurement
         * POST /api/venus/fitness/measurements
         */
        logMeasurement: async (measurement) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/fitness/measurements', measurement);
        },
        
        /**
         * Get progress photos
         * GET /api/venus/fitness/photos
         */
        getProgressPhotos: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/photos');
        },
        
        /**
         * Upload progress photo
         * POST /api/venus/fitness/photos
         */
        uploadProgressPhoto: async (photoData) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/fitness/photos', photoData);
        },
        
        /**
         * Get workout split recommendation
         * GET /api/venus/fitness/split
         */
        getSplitRecommendation: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/split');
        },
        
        /**
         * Get muscle group analysis
         * GET /api/venus/fitness/muscle-groups
         */
        getMuscleGroupAnalysis: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/muscle-groups');
        },
        
        /**
         * Get exercise alternatives
         * GET /api/venus/exercises/:id/alternatives
         */
        getExerciseAlternatives: async (exerciseId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/venus/exercises/${exerciseId}/alternatives`);
        },
        
        /**
         * Get exercise technique tips
         * GET /api/venus/exercises/:id/technique
         */
        getTechniqueTips: async (exerciseId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/venus/exercises/${exerciseId}/technique`);
        },
        
        /**
         * Get workout intensity zones
         * GET /api/venus/fitness/zones
         */
        getIntensityZones: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/zones');
        },
        
        /**
         * Get cardio recommendations
         * GET /api/venus/fitness/cardio
         */
        getCardioRecommendations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/cardio');
        },
        
        /**
         * Log cardio session
         * POST /api/venus/fitness/cardio/log
         */
        logCardio: async (cardioData) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/fitness/cardio/log', cardioData);
        },
        
        /**
         * Get flexibility assessment
         * GET /api/venus/fitness/flexibility
         */
        getFlexibilityAssessment: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/flexibility');
        },
        
        /**
         * Get mobility exercises
         * GET /api/venus/fitness/mobility
         */
        getMobilityExercises: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/mobility');
        },
        
        /**
         * Get warm-up routine
         * GET /api/venus/fitness/warmup
         */
        getWarmupRoutine: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/warmup');
        },
        
        /**
         * Get cool-down routine
         * GET /api/venus/fitness/cooldown
         */
        getCooldownRoutine: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/cooldown');
        },
        
        /**
         * Get recovery exercises
         * GET /api/venus/fitness/recovery-exercises
         */
        getRecoveryExercises: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/recovery-exercises');
        },
        
        /**
         * Get fitness age
         * GET /api/venus/fitness/age
         */
        getFitnessAge: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/age');
        },
        
        /**
         * Get fitness benchmarks
         * GET /api/venus/fitness/benchmarks
         */
        getBenchmarks: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/benchmarks');
        },
        
        /**
         * Get training recommendations
         * GET /api/venus/fitness/recommendations
         */
        getRecommendations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/recommendations');
        },
        
        /**
         * Get fitness goals
         * GET /api/venus/fitness/goals
         */
        getGoals: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/goals');
        },
        
        /**
         * Set fitness goal
         * POST /api/venus/fitness/goals
         */
        setGoal: async (goal) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/fitness/goals', goal);
        },
        
        /**
         * Get achievement badges
         * GET /api/venus/fitness/achievements
         */
        getAchievements: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/fitness/achievements');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SOCIAL FEATURES (12 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    social: {
        /**
         * Get social feed
         * GET /api/venus/social/feed
         */
        getFeed: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/social/feed');
        },
        
        /**
         * Get trending posts
         * GET /api/venus/social/trending
         */
        getTrending: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/social/trending');
        },
        
        /**
         * Share workout
         * POST /api/venus/social/share
         */
        shareWorkout: async (workoutId) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/social/share', { workoutId });
        },
        
        /**
         * Get challenges
         * GET /api/venus/social/challenges
         */
        getChallenges: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/social/challenges');
        },
        
        /**
         * Join challenge
         * POST /api/venus/social/challenges/:id/join
         */
        joinChallenge: async (challengeId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/venus/social/challenges/${challengeId}/join`);
        },
        
        /**
         * Update challenge progress
         * POST /api/venus/social/challenges/:id/progress
         */
        updateChallengeProgress: async (challengeId, progress) => {
            const api = new PhoenixAPI();
            return api.post(`/api/venus/social/challenges/${challengeId}/progress`, progress);
        },
        
        /**
         * Get challenge leaderboard
         * GET /api/venus/social/challenges/:id/leaderboard
         */
        getChallengeLeaderboard: async (challengeId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/venus/social/challenges/${challengeId}/leaderboard`);
        },
        
        /**
         * Get friends
         * GET /api/venus/social/friends
         */
        getFriends: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/social/friends');
        },
        
        /**
         * Send friend request
         * POST /api/venus/social/friends/request
         */
        sendFriendRequest: async (userId) => {
            const api = new PhoenixAPI();
            return api.post('/api/venus/social/friends/request', { userId });
        },
        
        /**
         * Get user social stats
         * GET /api/venus/social/stats
         */
        getStats: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/social/stats');
        },
        
        /**
         * Get activity feed
         * GET /api/venus/social/activity
         */
        getActivity: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/venus/social/activity');
        },
        
        /**
         * Like post
         * POST /api/venus/social/posts/:id/like
         */
        likePost: async (postId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/venus/social/posts/${postId}/like`);
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 EARTH ROUTES (11 ENDPOINTS) - Calendar & Energy Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const earthAPI = {
    // ═══════════════════════════════════════════════════════════════════════════
    // CALENDAR (7 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    calendar: {
        /**
         * Connect calendar provider
         * GET /api/earth/calendar/connect/:provider
         */
        connect: async (provider) => {
            const api = new PhoenixAPI();
            return api.get(`/api/earth/calendar/connect/${provider}`);
        },
        
        /**
         * Handle calendar OAuth callback
         * POST /api/earth/calendar/callback
         */
        handleCallback: async (data) => {
            const api = new PhoenixAPI();
            return api.post('/api/earth/calendar/callback', data);
        },
        
        /**
         * Get calendar events
         * GET /api/earth/calendar/events
         */
        getEvents: async (params) => {
            const api = new PhoenixAPI();
            const queryString = params ? new URLSearchParams(params).toString() : '';
            return api.get(`/api/earth/calendar/events${queryString ? '?' + queryString : ''}`);
        },
        
        /**
         * Create calendar event
         * POST /api/earth/calendar/events
         */
        createEvent: async (event) => {
            const api = new PhoenixAPI();
            return api.post('/api/earth/calendar/events', event);
        },
        
        /**
         * Get energy-optimized schedule (P1 CRITICAL)
         * GET /api/earth/calendar/energy-map
         */
        getEnergyMap: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/earth/calendar/energy-map');
        },
        
        /**
         * Detect calendar conflicts
         * GET /api/earth/calendar/conflicts
         */
        detectConflicts: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/earth/calendar/conflicts');
        },
        
        /**
         * Sync calendar
         * POST /api/earth/calendar/sync
         */
        sync: async () => {
            const api = new PhoenixAPI();
            return api.post('/api/earth/calendar/sync');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ENERGY MANAGEMENT (4 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    energy: {
        /**
         * Get energy pattern
         * GET /api/earth/energy/pattern
         */
        getPattern: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/earth/energy/pattern');
        },
        
        /**
         * Log energy level
         * POST /api/earth/energy/log
         */
        log: async (level) => {
            const api = new PhoenixAPI();
            return api.post('/api/earth/energy/log', { level });
        },
        
        /**
         * Get optimal meeting times
         * GET /api/earth/energy/optimal-times
         */
        getOptimalTimes: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/earth/energy/optimal-times');
        },
        
        /**
         * Predict energy levels
         * GET /api/earth/energy/prediction
         */
        getPrediction: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/earth/energy/prediction');
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 MARS ROUTES (20 ENDPOINTS) - Goals & Motivation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const marsAPI = {
    // ═══════════════════════════════════════════════════════════════════════════
    // GOALS (10 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    goals: {
        /**
         * Create goal
         * POST /api/mars/goals
         */
        create: async (goal) => {
            const api = new PhoenixAPI();
            return api.post('/api/mars/goals', goal);
        },
        
        /**
         * Get all goals
         * GET /api/mars/goals
         */
        getAll: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mars/goals');
        },
        
        /**
         * Get goal by ID
         * GET /api/mars/goals/:id
         */
        getById: async (goalId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/mars/goals/${goalId}`);
        },
        
        /**
         * Update goal
         * PUT /api/mars/goals/:id
         */
        update: async (goalId, data) => {
            const api = new PhoenixAPI();
            return api.put(`/api/mars/goals/${goalId}`, data);
        },
        
        /**
         * Delete goal
         * DELETE /api/mars/goals/:id
         */
        delete: async (goalId) => {
            const api = new PhoenixAPI();
            return api.delete(`/api/mars/goals/${goalId}`);
        },
        
        /**
         * Complete goal
         * POST /api/mars/goals/:id/complete
         */
        complete: async (goalId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mars/goals/${goalId}/complete`);
        },
        
        /**
         * Generate SMART goal
         * POST /api/mars/goals/generate-smart
         */
        generateSmart: async (vague) => {
            const api = new PhoenixAPI();
            return api.post('/api/mars/goals/generate-smart', { vague });
        },
        
        /**
         * Get goal suggestions
         * POST /api/mars/goals/suggest
         */
        getSuggestions: async (context) => {
            const api = new PhoenixAPI();
            return api.post('/api/mars/goals/suggest', context);
        },
        
        /**
         * Get goal templates
         * GET /api/mars/goals/templates
         */
        getTemplates: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mars/goals/templates');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PROGRESS TRACKING (4 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    progress: {
        /**
         * Log progress
         * POST /api/mars/goals/:id/progress
         */
        log: async (goalId, progressData) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mars/goals/${goalId}/progress`, progressData);
        },
        
        /**
         * Get progress history
         * GET /api/mars/goals/:id/progress
         */
        getHistory: async (goalId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/mars/goals/${goalId}/progress`);
        },
        
        /**
         * Get progress velocity
         * GET /api/mars/progress/velocity
         */
        getVelocity: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mars/progress/velocity');
        },
        
        /**
         * Get progress predictions (P1 CRITICAL)
         * GET /api/mars/progress/predictions
         */
        getPredictions: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mars/progress/predictions');
        },
        
        /**
         * Get bottlenecks
         * GET /api/mars/progress/bottlenecks
         */
        getBottlenecks: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mars/progress/bottlenecks');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HABITS (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    habits: {
        /**
         * Create habit
         * POST /api/mars/habits
         */
        create: async (habit) => {
            const api = new PhoenixAPI();
            return api.post('/api/mars/habits', habit);
        },
        
        /**
         * Log habit completion
         * POST /api/mars/habits/:id/log
         */
        log: async (habitId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mars/habits/${habitId}/log`);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MOTIVATION (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    motivation: {
        /**
         * Get motivational interventions
         * GET /api/mars/motivation/interventions
         */
        getInterventions: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/mars/motivation/interventions');
        },
        
        /**
         * Trigger motivation boost
         * POST /api/mars/motivation/boost
         */
        triggerBoost: async () => {
            const api = new PhoenixAPI();
            return api.post('/api/mars/motivation/boost');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MILESTONES (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    milestones: {
        /**
         * Create milestone
         * POST /api/mars/goals/:id/milestones
         */
        create: async (goalId, milestone) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mars/goals/${goalId}/milestones`, milestone);
        },
        
        /**
         * Complete milestone
         * POST /api/mars/milestones/:id/complete
         */
        complete: async (milestoneId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/mars/milestones/${milestoneId}/complete`);
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 JUPITER ROUTES (17 ENDPOINTS) - Financial Intelligence
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const jupiterAPI = {
    /**
     * Create Plaid link token
     * POST /api/jupiter/link-token
     */
    createLinkToken: async () => {
        const api = new PhoenixAPI();
        return api.post('/api/jupiter/link-token');
    },
    
    /**
     * Exchange Plaid public token
     * POST /api/jupiter/exchange-token
     */
    exchangeToken: async (publicToken) => {
        const api = new PhoenixAPI();
        return api.post('/api/jupiter/exchange-token', { publicToken });
    },
    
    /**
     * Get linked accounts
     * GET /api/jupiter/accounts
     */
    getAccounts: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/jupiter/accounts');
    },
    
    /**
     * Disconnect account
     * DELETE /api/jupiter/account/:id
     */
    disconnectAccount: async (accountId) => {
        const api = new PhoenixAPI();
        return api.delete(`/api/jupiter/account/${accountId}`);
    },
    
    /**
     * Sync account
     * POST /api/jupiter/sync/:accountId
     */
    syncAccount: async (accountId) => {
        const api = new PhoenixAPI();
        return api.post(`/api/jupiter/sync/${accountId}`);
    },
    
    /**
     * Get transactions
     * GET /api/jupiter/transactions
     */
    getTransactions: async (params) => {
        const api = new PhoenixAPI();
        const queryString = params ? new URLSearchParams(params).toString() : '';
        return api.get(`/api/jupiter/transactions${queryString ? '?' + queryString : ''}`);
    },
    
    /**
     * Get transactions by date range
     * GET /api/jupiter/transactions/date-range
     */
    getTransactionsByDateRange: async (startDate, endDate) => {
        const api = new PhoenixAPI();
        return api.get(`/api/jupiter/transactions/date-range?start=${startDate}&end=${endDate}`);
    },
    
    /**
     * Get transactions by category
     * GET /api/jupiter/transactions/category/:category
     */
    getTransactionsByCategory: async (category) => {
        const api = new PhoenixAPI();
        return api.get(`/api/jupiter/transactions/category/${category}`);
    },
    
    /**
     * Recategorize transaction
     * PUT /api/jupiter/transactions/:id
     */
    recategorizeTransaction: async (transactionId, newCategory) => {
        const api = new PhoenixAPI();
        return api.put(`/api/jupiter/transactions/${transactionId}`, { category: newCategory });
    },
    
    /**
     * Get recurring transactions
     * GET /api/jupiter/transactions/recurring
     */
    getRecurringTransactions: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/jupiter/transactions/recurring');
    },
    
    /**
     * Get spending patterns
     * GET /api/jupiter/spending-patterns
     */
    getSpendingPatterns: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/jupiter/spending-patterns');
    },
    
    /**
     * Create budget
     * POST /api/jupiter/budgets
     */
    createBudget: async (budget) => {
        const api = new PhoenixAPI();
        return api.post('/api/jupiter/budgets', budget);
    },
    
    /**
     * Get budgets
     * GET /api/jupiter/budgets
     */
    getBudgets: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/jupiter/budgets');
    },
    
    /**
     * Update budget
     * PUT /api/jupiter/budgets/:id
     */
    updateBudget: async (budgetId, data) => {
        const api = new PhoenixAPI();
        return api.put(`/api/jupiter/budgets/${budgetId}`, data);
    },
    
    /**
     * Delete budget
     * DELETE /api/jupiter/budgets/:id
     */
    deleteBudget: async (budgetId) => {
        const api = new PhoenixAPI();
        return api.delete(`/api/jupiter/budgets/${budgetId}`);
    },
    
    /**
     * Get budget alerts
     * GET /api/jupiter/budgets/alerts
     */
    getBudgetAlerts: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/jupiter/budgets/alerts');
    },
    
    /**
     * Get stress correlation (P1 CRITICAL)
     * GET /api/jupiter/stress-correlation
     */
    getStressCorrelation: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/jupiter/stress-correlation');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🪐 SATURN ROUTES (12 ENDPOINTS) - Life Vision
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const saturnAPI = {
    /**
     * Get life vision
     * GET /api/saturn/vision
     */
    getVision: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/vision');
    },
    
    /**
     * Create life vision
     * POST /api/saturn/vision
     */
    createVision: async (vision) => {
        const api = new PhoenixAPI();
        return api.post('/api/saturn/vision', vision);
    },
    
    /**
     * Update life vision
     * PUT /api/saturn/vision
     */
    updateVision: async (vision) => {
        const api = new PhoenixAPI();
        return api.put('/api/saturn/vision', vision);
    },
    
    /**
     * Get life areas
     * GET /api/saturn/life-areas
     */
    getLifeAreas: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/life-areas');
    },
    
    /**
     * Update life area
     * PUT /api/saturn/life-areas/:area
     */
    updateLifeArea: async (area, data) => {
        const api = new PhoenixAPI();
        return api.put(`/api/saturn/life-areas/${area}`, data);
    },
    
    /**
     * Get values
     * GET /api/saturn/values
     */
    getValues: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/values');
    },
    
    /**
     * Set values
     * POST /api/saturn/values
     */
    setValues: async (values) => {
        const api = new PhoenixAPI();
        return api.post('/api/saturn/values', values);
    },
    
    /**
     * Get life balance
     * GET /api/saturn/balance
     */
    getBalance: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/balance');
    },
    
    /**
     * Get life alignment
     * GET /api/saturn/alignment
     */
    getAlignment: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/alignment');
    },
    
    /**
     * Get purpose assessment
     * GET /api/saturn/purpose
     */
    getPurpose: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/purpose');
    },
    
    /**
     * Get legacy goals
     * GET /api/saturn/legacy
     */
    getLegacy: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/legacy');
    },
    
    /**
     * Get life reflections
     * GET /api/saturn/reflections
     */
    getReflections: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/saturn/reflections');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔥 PHOENIX ROUTES (75 ENDPOINTS) - AI Core System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const phoenixAPI = {
    // ═══════════════════════════════════════════════════════════════════════════
    // COMPANION (7 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    companion: {
        /**
         * Chat with Phoenix
         * POST /api/phoenix/companion/chat
         */
        chat: async (message, context) => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/companion/chat', { message, context });
        },
        
        /**
         * Get chat history
         * GET /api/phoenix/companion/history
         */
        getHistory: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/companion/history');
        },
        
        /**
         * Get conversation by ID
         * GET /api/phoenix/companion/conversation/:id
         */
        getConversation: async (conversationId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/phoenix/companion/conversation/${conversationId}`);
        },
        
        /**
         * Delete conversation
         * DELETE /api/phoenix/companion/conversation/:id
         */
        deleteConversation: async (conversationId) => {
            const api = new PhoenixAPI();
            return api.delete(`/api/phoenix/companion/conversation/${conversationId}`);
        },
        
        /**
         * Get personality settings
         * GET /api/phoenix/companion/personality
         */
        getPersonality: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/companion/personality');
        },
        
        /**
         * Update personality
         * PUT /api/phoenix/companion/personality
         */
        updatePersonality: async (settings) => {
            const api = new PhoenixAPI();
            return api.put('/api/phoenix/companion/personality', settings);
        },
        
        /**
         * Get quick suggestions
         * GET /api/phoenix/companion/suggestions
         */
        getSuggestions: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/companion/suggestions');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PATTERNS (8 endpoints) - P0 CRITICAL
    // ═══════════════════════════════════════════════════════════════════════════
    patterns: {
        /**
         * Get discovered patterns (P0 CRITICAL)
         * GET /api/phoenix/patterns
         */
        getAll: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/patterns', {
                cacheDuration: PHOENIX_CONFIG.CACHE_DURATION.SHORT
            });
        },
        
        /**
         * Get pattern by ID
         * GET /api/phoenix/patterns/:id
         */
        getById: async (patternId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/phoenix/patterns/${patternId}`);
        },
        
        /**
         * Get pattern feed
         * GET /api/phoenix/patterns/feed
         */
        getFeed: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/patterns/feed');
        },
        
        /**
         * Get pattern insights
         * GET /api/phoenix/patterns/insights
         */
        getInsights: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/patterns/insights');
        },
        
        /**
         * Acknowledge pattern
         * POST /api/phoenix/patterns/:id/acknowledge
         */
        acknowledge: async (patternId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/phoenix/patterns/${patternId}/acknowledge`);
        },
        
        /**
         * Dismiss pattern
         * POST /api/phoenix/patterns/:id/dismiss
         */
        dismiss: async (patternId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/phoenix/patterns/${patternId}/dismiss`);
        },
        
        /**
         * Get pattern correlations
         * GET /api/phoenix/patterns/correlations
         */
        getCorrelations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/patterns/correlations');
        },
        
        /**
         * Trigger pattern analysis
         * POST /api/phoenix/patterns/analyze
         */
        analyze: async () => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/patterns/analyze');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INTERVENTIONS (10 endpoints) - P0 CRITICAL
    // ═══════════════════════════════════════════════════════════════════════════
    interventions: {
        /**
         * Get active interventions (P0 CRITICAL)
         * GET /api/phoenix/interventions/active
         */
        getActive: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/interventions/active', {
                cacheDuration: PHOENIX_CONFIG.CACHE_DURATION.SHORT
            });
        },
        
        /**
         * Get pending interventions
         * GET /api/phoenix/interventions/pending
         */
        getPending: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/interventions/pending');
        },
        
        /**
         * Get intervention history
         * GET /api/phoenix/interventions/history
         */
        getHistory: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/interventions/history');
        },
        
        /**
         * Get intervention by ID
         * GET /api/phoenix/interventions/:id
         */
        getById: async (interventionId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/phoenix/interventions/${interventionId}`);
        },
        
        /**
         * Approve intervention
         * POST /api/phoenix/interventions/:id/approve
         */
        approve: async (interventionId) => {
            const api = new PhoenixAPI();
            return api.post(`/api/phoenix/interventions/${interventionId}/approve`);
        },
        
        /**
         * Deny intervention
         * POST /api/phoenix/interventions/:id/deny
         */
        deny: async (interventionId, reason) => {
            const api = new PhoenixAPI();
            return api.post(`/api/phoenix/interventions/${interventionId}/deny`, { reason });
        },
        
        /**
         * Get intervention impact
         * GET /api/phoenix/interventions/:id/impact
         */
        getImpact: async (interventionId) => {
            const api = new PhoenixAPI();
            return api.get(`/api/phoenix/interventions/${interventionId}/impact`);
        },
        
        /**
         * Get intervention types
         * GET /api/phoenix/interventions/types
         */
        getTypes: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/interventions/types');
        },
        
        /**
         * Get intervention settings
         * GET /api/phoenix/interventions/settings
         */
        getSettings: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/interventions/settings');
        },
        
        /**
         * Update intervention settings
         * PUT /api/phoenix/interventions/settings
         */
        updateSettings: async (settings) => {
            const api = new PhoenixAPI();
            return api.put('/api/phoenix/interventions/settings', settings);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTEXT (4 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    context: {
        /**
         * Get full context
         * GET /api/phoenix/context
         */
        getFull: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/context');
        },
        
        /**
         * Get context summary
         * GET /api/phoenix/context/summary
         */
        getSummary: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/context/summary');
        },
        
        /**
         * Update context
         * POST /api/phoenix/context/update
         */
        update: async (contextData) => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/context/update', contextData);
        },
        
        /**
         * Get context history
         * GET /api/phoenix/context/history
         */
        getHistory: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/context/history');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INTELLIGENCE (7 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    intelligence: {
        /**
         * Get predictions
         * GET /api/phoenix/intelligence/predictions
         */
        getPredictions: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/intelligence/predictions');
        },
        
        /**
         * Get recommendations
         * GET /api/phoenix/intelligence/recommendations
         */
        getRecommendations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/intelligence/recommendations');
        },
        
        /**
         * Get insights
         * GET /api/phoenix/intelligence/insights
         */
        getInsights: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/intelligence/insights');
        },
        
        /**
         * Get anomalies
         * GET /api/phoenix/intelligence/anomalies
         */
        getAnomalies: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/intelligence/anomalies');
        },
        
        /**
         * Get optimization opportunities
         * GET /api/phoenix/intelligence/optimizations
         */
        getOptimizations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/intelligence/optimizations');
        },
        
        /**
         * Get risk assessment
         * GET /api/phoenix/intelligence/risks
         */
        getRisks: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/intelligence/risks');
        },
        
        /**
         * Get intelligence report
         * GET /api/phoenix/intelligence/report
         */
        getReport: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/intelligence/report');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ANALYTICS (14 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    analytics: {
        /**
         * Get dashboard
         * GET /api/phoenix/analytics/dashboard
         */
        getDashboard: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/dashboard');
        },
        
        /**
         * Get health score
         * GET /api/phoenix/analytics/health-score
         */
        getHealthScore: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/health-score');
        },
        
        /**
         * Get performance metrics
         * GET /api/phoenix/analytics/performance
         */
        getPerformance: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/performance');
        },
        
        /**
         * Get trends
         * GET /api/phoenix/analytics/trends
         */
        getTrends: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/trends');
        },
        
        /**
         * Get correlations
         * GET /api/phoenix/analytics/correlations
         */
        getCorrelations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/correlations');
        },
        
        /**
         * Get achievements
         * GET /api/phoenix/analytics/achievements
         */
        getAchievements: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/achievements');
        },
        
        /**
         * Get streaks
         * GET /api/phoenix/analytics/streaks
         */
        getStreaks: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/streaks');
        },
        
        /**
         * Get milestones
         * GET /api/phoenix/analytics/milestones
         */
        getMilestones: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/milestones');
        },
        
        /**
         * Get improvement metrics
         * GET /api/phoenix/analytics/improvements
         */
        getImprovements: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/improvements');
        },
        
        /**
         * Get comparison data
         * GET /api/phoenix/analytics/comparison
         */
        getComparison: async (params) => {
            const api = new PhoenixAPI();
            const queryString = params ? new URLSearchParams(params).toString() : '';
            return api.get(`/api/phoenix/analytics/comparison${queryString ? '?' + queryString : ''}`);
        },
        
        /**
         * Get time series
         * GET /api/phoenix/analytics/timeseries
         */
        getTimeSeries: async (metric, timeRange) => {
            const api = new PhoenixAPI();
            return api.get(`/api/phoenix/analytics/timeseries?metric=${metric}&range=${timeRange}`);
        },
        
        /**
         * Get summary stats
         * GET /api/phoenix/analytics/summary
         */
        getSummary: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/analytics/summary');
        },
        
        /**
         * Export analytics
         * GET /api/phoenix/analytics/export
         */
        export: async (format) => {
            const api = new PhoenixAPI();
            return api.get(`/api/phoenix/analytics/export?format=${format}`);
        },
        
        /**
         * Get custom report
         * POST /api/phoenix/analytics/report
         */
        generateReport: async (reportConfig) => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/analytics/report', reportConfig);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // BUTLER (17 endpoints) - AI Actions
    // ═══════════════════════════════════════════════════════════════════════════
    butler: {
        /**
         * Get active automations
         * GET /api/phoenix/butler/automations
         */
        getAutomations: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/automations');
        },
        
        /**
         * Create automation
         * POST /api/phoenix/butler/automations
         */
        createAutomation: async (automation) => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/butler/automations', automation);
        },
        
        /**
         * Update automation
         * PUT /api/phoenix/butler/automations/:id
         */
        updateAutomation: async (automationId, data) => {
            const api = new PhoenixAPI();
            return api.put(`/api/phoenix/butler/automations/${automationId}`, data);
        },
        
        /**
         * Delete automation
         * DELETE /api/phoenix/butler/automations/:id
         */
        deleteAutomation: async (automationId) => {
            const api = new PhoenixAPI();
            return api.delete(`/api/phoenix/butler/automations/${automationId}`);
        },
        
        /**
         * Get automation history
         * GET /api/phoenix/butler/history
         */
        getHistory: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/history');
        },
        
        /**
         * Execute butler action
         * POST /api/phoenix/butler/execute
         */
        executeAction: async (action) => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/butler/execute', action);
        },
        
        /**
         * Get available actions
         * GET /api/phoenix/butler/actions
         */
        getActions: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/actions');
        },
        
        /**
         * Get action templates
         * GET /api/phoenix/butler/templates
         */
        getTemplates: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/templates');
        },
        
        /**
         * Get action suggestions
         * GET /api/phoenix/butler/suggestions
         */
        getSuggestions: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/suggestions');
        },
        
        /**
         * Get triggers
         * GET /api/phoenix/butler/triggers
         */
        getTriggers: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/triggers');
        },
        
        /**
         * Create trigger
         * POST /api/phoenix/butler/triggers
         */
        createTrigger: async (trigger) => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/butler/triggers', trigger);
        },
        
        /**
         * Get workflows
         * GET /api/phoenix/butler/workflows
         */
        getWorkflows: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/workflows');
        },
        
        /**
         * Create workflow
         * POST /api/phoenix/butler/workflows
         */
        createWorkflow: async (workflow) => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/butler/workflows', workflow);
        },
        
        /**
         * Get action impact
         * GET /api/phoenix/butler/impact
         */
        getImpact: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/impact');
        },
        
        /**
         * Get time saved
         * GET /api/phoenix/butler/time-saved
         */
        getTimeSaved: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/time-saved');
        },
        
        /**
         * Get butler settings
         * GET /api/phoenix/butler/settings
         */
        getSettings: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/butler/settings');
        },
        
        /**
         * Update butler settings
         * PUT /api/phoenix/butler/settings
         */
        updateSettings: async (settings) => {
            const api = new PhoenixAPI();
            return api.put('/api/phoenix/butler/settings', settings);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SYSTEM (8 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    system: {
        /**
         * Get system status
         * GET /api/phoenix/system/status
         */
        getStatus: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/system/status');
        },
        
        /**
         * Get system health
         * GET /api/phoenix/system/health
         */
        getHealth: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/system/health');
        },
        
        /**
         * Get system metrics
         * GET /api/phoenix/system/metrics
         */
        getMetrics: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/system/metrics');
        },
        
        /**
         * Get system logs
         * GET /api/phoenix/system/logs
         */
        getLogs: async (params) => {
            const api = new PhoenixAPI();
            const queryString = params ? new URLSearchParams(params).toString() : '';
            return api.get(`/api/phoenix/system/logs${queryString ? '?' + queryString : ''}`);
        },
        
        /**
         * Get system diagnostics
         * GET /api/phoenix/system/diagnostics
         */
        getDiagnostics: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/system/diagnostics');
        },
        
        /**
         * Trigger system sync
         * POST /api/phoenix/system/sync
         */
        sync: async () => {
            const api = new PhoenixAPI();
            return api.post('/api/phoenix/system/sync');
        },
        
        /**
         * Get system settings
         * GET /api/phoenix/system/settings
         */
        getSettings: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/phoenix/system/settings');
        },
        
        /**
         * Update system settings
         * PUT /api/phoenix/system/settings
         */
        updateSettings: async (settings) => {
            const api = new PhoenixAPI();
            return api.put('/api/phoenix/system/settings', settings);
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎙️ VOICE ROUTES (8 ENDPOINTS) - TTS, Whisper, Voice
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const voiceAPI = {
    // ═══════════════════════════════════════════════════════════════════════════
    // TEXT-TO-SPEECH (4 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    tts: {
        /**
         * Generate speech
         * POST /api/tts/generate
         */
        generate: async (text, options) => {
            const api = new PhoenixAPI();
            return api.post('/api/tts/generate', { text, ...options });
        },
        
        /**
         * Get available voices
         * GET /api/tts/voices
         */
        getVoices: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/tts/voices');
        },
        
        /**
         * Get TTS settings
         * GET /api/tts/settings
         */
        getSettings: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/tts/settings');
        },
        
        /**
         * Update TTS settings
         * PUT /api/tts/settings
         */
        updateSettings: async (settings) => {
            const api = new PhoenixAPI();
            return api.put('/api/tts/settings', settings);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SPEECH-TO-TEXT (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    whisper: {
        /**
         * Transcribe audio
         * POST /api/whisper/transcribe
         */
        transcribe: async (audioData) => {
            const api = new PhoenixAPI();
            return api.post('/api/whisper/transcribe', audioData);
        },
        
        /**
         * Get transcription history
         * GET /api/whisper/history
         */
        getHistory: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/whisper/history');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VOICE COMMANDS (2 endpoints)
    // ═══════════════════════════════════════════════════════════════════════════
    commands: {
        /**
         * Process voice command
         * POST /api/voice/command
         */
        process: async (audioData) => {
            const api = new PhoenixAPI();
            return api.post('/api/voice/command', audioData);
        },
        
        /**
         * Get available commands
         * GET /api/voice/commands
         */
        getAvailable: async () => {
            const api = new PhoenixAPI();
            return api.get('/api/voice/commands');
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📞 TWILIO ROUTES (9 ENDPOINTS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const twilioAPI = {
    /**
     * Make phone call
     * POST /api/twilio/call
     */
    makeCall: async (to, message) => {
        const api = new PhoenixAPI();
        return api.post('/api/twilio/call', { to, message });
    },
    
    /**
     * Send SMS
     * POST /api/twilio/sms
     */
    sendSMS: async (to, message) => {
        const api = new PhoenixAPI();
        return api.post('/api/twilio/sms', { to, message });
    },
    
    /**
     * Get call history
     * GET /api/twilio/calls
     */
    getCallHistory: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/twilio/calls');
    },
    
    /**
     * Get SMS history
     * GET /api/twilio/messages
     */
    getSMSHistory: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/twilio/messages');
    },
    
    /**
     * Handle incoming call webhook
     * POST /api/twilio/webhook/call
     */
    handleCallWebhook: async (data) => {
        const api = new PhoenixAPI();
        return api.post('/api/twilio/webhook/call', data);
    },
    
    /**
     * Handle incoming SMS webhook
     * POST /api/twilio/webhook/sms
     */
    handleSMSWebhook: async (data) => {
        const api = new PhoenixAPI();
        return api.post('/api/twilio/webhook/sms', data);
    },
    
    /**
     * Get phone numbers
     * GET /api/twilio/numbers
     */
    getNumbers: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/twilio/numbers');
    },
    
    /**
     * Get Twilio settings
     * GET /api/twilio/settings
     */
    getSettings: async () => {
        const api = new PhoenixAPI();
        return api.get('/api/twilio/settings');
    },
    
    /**
     * Update Twilio settings
     * PUT /api/twilio/settings
     */
    updateSettings: async (settings) => {
        const api = new PhoenixAPI();
        return api.put('/api/twilio/settings', settings);
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗄️ CACHE MANAGER - Intelligent Caching System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.startCleanupInterval();
    }
    
    set(key, value, duration = PHOENIX_CONFIG.CACHE_DURATION.MEDIUM) {
        this.cache.set(key, value);
        this.timestamps.set(key, {
            stored: Date.now(),
            duration
        });
    }
    
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }
        
        const timestamp = this.timestamps.get(key);
        if (!timestamp) {
            return null;
        }
        
        const age = Date.now() - timestamp.stored;
        if (age > timestamp.duration) {
            // Cache expired
            this.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }
    
    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
    }
    
    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }
    
    startCleanupInterval() {
        // Clean up expired cache entries every 5 minutes
        setInterval(() => {
            const now = Date.now();
            for (const [key, timestamp] of this.timestamps.entries()) {
                const age = now - timestamp.stored;
                if (age > timestamp.duration) {
                    this.delete(key);
                }
            }
        }, 300000); // 5 minutes
    }
    
    getSize() {
        return this.cache.size;
    }
    
    has(key) {
        return this.cache.has(key) && this.get(key) !== null;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 NETWORK MANAGER - Request Handling with Retry Logic
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class NetworkManager {
    constructor() {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
    }
    
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }
    
    addResponseInterceptor(onSuccess, onError) {
        this.responseInterceptors.push({ onSuccess, onError });
    }
    
    async request(config, retryCount = 0) {
        // Apply request interceptors
        let modifiedConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            modifiedConfig = await interceptor(modifiedConfig);
        }
        
        try {
            const response = await this.executeRequest(modifiedConfig);
            
            // Apply response interceptors (success)
            let modifiedResponse = response;
            for (const interceptor of this.responseInterceptors) {
                if (interceptor.onSuccess) {
                    modifiedResponse = await interceptor.onSuccess(modifiedResponse);
                }
            }
            
            return modifiedResponse;
        } catch (error) {
            // Apply response interceptors (error)
            let handledError = error;
            for (const interceptor of this.responseInterceptors) {
                if (interceptor.onError) {
                    try {
                        return await interceptor.onError(handledError);
                    } catch (e) {
                        handledError = e;
                    }
                }
            }
            
            // Retry logic
            if (this.shouldRetry(error) && retryCount < PHOENIX_CONFIG.MAX_RETRIES) {
                const delay = PHOENIX_CONFIG.RETRY_DELAY * Math.pow(PHOENIX_CONFIG.RETRY_BACKOFF, retryCount);
                await this.sleep(delay);
                return this.request(config, retryCount + 1);
            }
            
            throw handledError;
        }
    }
    
    async executeRequest(config) {
        const { method, url, data, headers } = config;
        
        const requestOptions = {
            method,
            headers: {
                ...PHOENIX_CONFIG.DEFAULT_HEADERS,
                ...headers
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(data);
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PHOENIX_CONFIG.TIMEOUT);
        requestOptions.signal = controller.signal;
        
        try {
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    data: await response.json().catch(() => null),
                    config
                };
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw {
                    status: 0,
                    statusText: 'Request Timeout',
                    message: 'Request timed out',
                    config
                };
            }
            throw error;
        }
    }
    
    shouldRetry(error) {
        // Retry on network errors or 5xx server errors
        return !error.status || error.status >= 500;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 AUTH MANAGER - Token & Session Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class AuthManager {
    constructor() {
        this.TOKEN_KEY = 'phoenix_auth_token';
        this.REFRESH_TOKEN_KEY = 'phoenix_refresh_token';
        this.USER_KEY = 'phoenix_user';
    }
    
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }
    
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }
    
    clearToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }
    
    setRefreshToken(token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
    
    getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    
    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }
    
    isAuthenticated() {
        return !!this.getToken();
    }
    
    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return false;
        }
        
        try {
            const response = await fetch(`${PHOENIX_CONFIG.BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: PHOENIX_CONFIG.DEFAULT_HEADERS,
                body: JSON.stringify({ refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setToken(data.token);
                if (data.refreshToken) {
                    this.setRefreshToken(data.refreshToken);
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }
    
    logout() {
        this.clearToken();
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Utils {
    /**
     * Format date to ISO string
     */
    formatDate(date) {
        return new Date(date).toISOString();
    }
    
    /**
     * Parse date from various formats
     */
    parseDate(dateString) {
        return new Date(dateString);
    }
    
    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * Debounce function
     */
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
    }
    
    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Calculate percentage
     */
    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }
    
    /**
     * Sleep/delay function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
    
    /**
     * Merge objects deeply
     */
    deepMerge(target, source) {
        const output = { ...target };
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        return output;
    }
    
    /**
     * Check if value is object
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 EXPORTS & INITIALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Create global Phoenix Core object
window.PhoenixCore = {
    // API Gateway - All 307 endpoints organized by category
    API: {
        auth: authAPI,
        sms: smsAPI,
        user: userAPI,
        subscription: subscriptionAPI,
        mercury: mercuryAPI,
        venus: venusAPI,
        earth: earthAPI,
        mars: marsAPI,
        jupiter: jupiterAPI,
        saturn: saturnAPI,
        phoenix: phoenixAPI,
        voice: voiceAPI,
        twilio: twilioAPI
    },
    
    // Core Managers
    Cache: CacheManager,
    Network: NetworkManager,
    Auth: AuthManager,
    Utils: Utils,
    
    // Configuration
    Config: PHOENIX_CONFIG,
    
    // Version
    version: '1.0.0'
};

// Initialize on load
if (typeof window !== 'undefined') {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║         🔥 PHOENIX CORE v1.0.0 - INITIALIZED 🔥            ║
    ║                                                              ║
    ║  ✅ 307 API Endpoints Loaded                                ║
    ║  ✅ Cache Manager Active                                     ║
    ║  ✅ Network Handler Ready                                    ║
    ║  ✅ Auth System Initialized                                  ║
    ║                                                              ║
    ║  Ready to transform lives. 🚀                                ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.PhoenixCore;
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📊 ENDPOINT SUMMARY
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Total Endpoints: 307
 * 
 * ┌─────────────────┬───────────┐
 * │ Category        │ Endpoints │
 * ├─────────────────┼───────────┤
 * │ Auth            │     9     │
 * │ SMS             │     4     │
 * │ User            │    11     │
 * │ Subscription    │     5     │
 * │ Mercury         │    38     │
 * │ Venus           │    88     │
 * │ Earth           │    11     │
 * │ Mars            │    20     │
 * │ Jupiter         │    17     │
 * │ Saturn          │    12     │
 * │ Phoenix         │    75     │
 * │ Voice (All)     │     8     │
 * │ Twilio          │     9     │
 * └─────────────────┴───────────┘
 * 
 * 🎯 P0 CRITICAL ENDPOINTS (Must Work Day 1):
 * - POST /api/auth/login
 * - GET /api/auth/me
 * - GET /api/phoenix/patterns
 * - GET /api/phoenix/interventions/active
 * - POST /api/venus/workouts/quantum/generate
 * - GET /api/mercury/recovery/dashboard
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
