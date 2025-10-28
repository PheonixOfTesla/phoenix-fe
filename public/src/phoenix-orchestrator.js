/**
 * 🔥 PHOENIX ORCHESTRATOR
 * 
 * The System Conductor - Manages initialization, routing, state, and coordination
 * 
 * @version 2.0.0
 * @author Phoenix Team
 * @description Central orchestration system for the Phoenix application
 * 
 * Key Responsibilities:
 * - 67-step initialization sequence
 * - Application routing & navigation
 * - Global state management
 * - Real-time monitoring & health checks
 * - Module coordination
 * - Event bus system
 * - Error recovery & offline handling
 * 
 * Dependencies: phoenix-core.js
 * Used By: index.html (auto-initializes)
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const ORCHESTRATOR_CONFIG = {
    version: '2.0.0',
    environment: 'production',
    debugMode: false,
    
    // Initialization
    initTimeout: 60000, // 60 seconds max
    stepTimeout: 5000,   // 5 seconds per step
    retryAttempts: 3,
    
    // Health checks
    healthCheckInterval: 30000, // 30 seconds
    heartbeatInterval: 10000,   // 10 seconds
    
    // Cache
    cacheWarming: true,
    preloadEnabled: true,
    
    // WebSocket
    wsReconnectDelay: 5000,
    wsMaxRetries: 10,
    
    // Routes
    defaultRoute: '/dashboard',
    loginRoute: '/login',
    
    // Performance
    performanceMonitoring: true,
    analyticsEnabled: true,
    
    // Features
    offlineMode: true,
    serviceWorker: true,
    pushNotifications: true
};

const APP_ROUTES = {
    // Auth
    '/login': { view: 'login', auth: false, preload: [] },
    '/register': { view: 'register', auth: false, preload: [] },
    '/reset-password': { view: 'reset-password', auth: false, preload: [] },
    
    // Main
    '/dashboard': { view: 'dashboard', auth: true, preload: ['patterns', 'interventions', 'stats'] },
    '/companion': { view: 'companion', auth: true, preload: ['chat-history'] },
    
    // Planets
    '/mercury': { view: 'mercury', auth: true, preload: ['biometrics', 'recovery', 'devices'] },
    '/venus': { view: 'venus', auth: true, preload: ['workouts', 'nutrition', 'fitness'] },
    '/earth': { view: 'earth', auth: true, preload: ['calendar', 'energy'] },
    '/mars': { view: 'mars', auth: true, preload: ['goals', 'progress', 'habits'] },
    '/jupiter': { view: 'jupiter', auth: true, preload: ['accounts', 'transactions', 'budgets'] },
    '/saturn': { view: 'saturn', auth: true, preload: ['vision', 'identity', 'values'] },
    
    // Features
    '/patterns': { view: 'patterns', auth: true, preload: ['patterns'] },
    '/interventions': { view: 'interventions', auth: true, preload: ['interventions'] },
    '/butler': { view: 'butler', auth: true, preload: ['automations'] },
    '/analytics': { view: 'analytics', auth: true, preload: ['analytics-data'] },
    
    // Settings
    '/settings': { view: 'settings', auth: true, preload: ['user-preferences'] },
    '/profile': { view: 'profile', auth: true, preload: ['user-profile'] },
    '/subscription': { view: 'subscription', auth: true, preload: ['subscription-info'] },
    
    // Other
    '/404': { view: '404', auth: false, preload: [] }
};

const STATE_KEYS = {
    // User
    USER_PROFILE: 'user.profile',
    USER_PREFERENCES: 'user.preferences',
    USER_SUBSCRIPTION: 'user.subscription',
    USER_ROLES: 'user.roles',
    
    // Session
    SESSION_TOKEN: 'session.token',
    SESSION_ACTIVE: 'session.active',
    SESSION_LAST_ACTIVITY: 'session.lastActivity',
    
    // Data
    CONNECTED_DEVICES: 'data.devices',
    LATEST_BIOMETRICS: 'data.biometrics',
    TODAY_RECOVERY: 'data.recovery',
    RECENT_WORKOUTS: 'data.workouts',
    TODAY_NUTRITION: 'data.nutrition',
    ACTIVE_GOALS: 'data.goals',
    TODAY_CALENDAR: 'data.calendar',
    FINANCIAL_ACCOUNTS: 'data.financial',
    
    // Phoenix
    DISCOVERED_PATTERNS: 'phoenix.patterns',
    ACTIVE_INTERVENTIONS: 'phoenix.interventions.active',
    PENDING_INTERVENTIONS: 'phoenix.interventions.pending',
    LIFE_VISION: 'phoenix.vision',
    RECENT_CHAT: 'phoenix.chat',
    ACTIVE_AUTOMATIONS: 'phoenix.automations',
    
    // UI
    CURRENT_ROUTE: 'ui.route',
    CURRENT_VIEW: 'ui.view',
    THEME: 'ui.theme',
    NOTIFICATIONS: 'ui.notifications',
    
    // System
    INIT_STATUS: 'system.initStatus',
    HEALTH_STATUS: 'system.health',
    WEBSOCKET_STATUS: 'system.websocket',
    OFFLINE_MODE: 'system.offline'
};

// ============================================================================
// PHOENIX ORCHESTRATOR CLASS
// ============================================================================

class PhoenixOrchestrator {
    constructor() {
        this.config = ORCHESTRATOR_CONFIG;
        this.routes = APP_ROUTES;
        this.state = new Map();
        this.subscribers = new Map();
        this.eventBus = new Map();
        
        // System status
        this.initialized = false;
        this.initStartTime = null;
        this.initEndTime = null;
        this.currentStep = 0;
        this.failedSteps = [];
        
        // Components
        this.router = null;
        this.websocket = null;
        this.healthCheckInterval = null;
        this.heartbeatInterval = null;
        
        // Performance tracking
        this.metrics = {
            initTime: 0,
            routeChanges: 0,
            stateUpdates: 0,
            errors: 0,
            apiCalls: 0
        };
        
        // Error recovery
        this.errorQueue = [];
        this.offlineQueue = [];
        
        console.log('🔥 Phoenix Orchestrator initialized');
    }
    
    // ========================================================================
    // 67-STEP INITIALIZATION SEQUENCE
    // ========================================================================
    
    async initialize() {
        if (this.initialized) {
            console.warn('Orchestrator already initialized');
            return true;
        }
        
        this.initStartTime = Date.now();
        console.log('🚀 Starting 67-step initialization sequence...');
        
        try {
            // Set initial state
            this.setState(STATE_KEYS.INIT_STATUS, 'initializing');
            
            // ================================================================
            // PHASE 1: Authentication (Steps 1-10)
            // ================================================================
            console.log('📍 PHASE 1: Authentication');
            
            await this.executeStep(1, 'Check existing session', async () => {
                return await this.step1_checkExistingSession();
            });
            
            await this.executeStep(2, 'Validate token', async () => {
                return await this.step2_validateToken();
            });
            
            await this.executeStep(3, 'Refresh if expired', async () => {
                return await this.step3_refreshIfExpired();
            });
            
            await this.executeStep(4, 'Load user profile', async () => {
                return await this.step4_loadUserProfile();
            });
            
            await this.executeStep(5, 'Load user preferences', async () => {
                return await this.step5_loadUserPreferences();
            });
            
            await this.executeStep(6, 'Check subscription', async () => {
                return await this.step6_checkSubscription();
            });
            
            await this.executeStep(7, 'Load user roles', async () => {
                return await this.step7_loadUserRoles();
            });
            
            await this.executeStep(8, 'Setup auth interceptor', async () => {
                return await this.step8_setupAuthInterceptor();
            });
            
            await this.executeStep(9, 'Track login', async () => {
                return await this.step9_trackLogin();
            });
            
            await this.executeStep(10, 'Initialize user context', async () => {
                return await this.step10_initializeUserContext();
            });
            
            // ================================================================
            // PHASE 2: Data Loading (Steps 11-35)
            // ================================================================
            console.log('📍 PHASE 2: Data Loading');
            
            await this.executeStep(11, 'Load connected devices', async () => {
                return await this.step11_loadConnectedDevices();
            });
            
            await this.executeStep(12, 'Load latest biometrics', async () => {
                return await this.step12_loadLatestBiometrics();
            });
            
            await this.executeStep(13, 'Load today recovery', async () => {
                return await this.step13_loadTodayRecovery();
            });
            
            await this.executeStep(14, 'Load recent workouts', async () => {
                return await this.step14_loadRecentWorkouts();
            });
            
            await this.executeStep(15, 'Load today nutrition', async () => {
                return await this.step15_loadTodayNutrition();
            });
            
            await this.executeStep(16, 'Load active goals', async () => {
                return await this.step16_loadActiveGoals();
            });
            
            await this.executeStep(17, 'Load today calendar', async () => {
                return await this.step17_loadTodayCalendar();
            });
            
            await this.executeStep(18, 'Load financial accounts', async () => {
                return await this.step18_loadFinancialAccounts();
            });
            
            await this.executeStep(19, 'Load life vision', async () => {
                return await this.step19_loadLifeVision();
            });
            
            await this.executeStep(20, 'Load discovered patterns', async () => {
                return await this.step20_loadDiscoveredPatterns();
            });
            
            await this.executeStep(21, 'Load active interventions', async () => {
                return await this.step21_loadActiveInterventions();
            });
            
            await this.executeStep(22, 'Load pending interventions', async () => {
                return await this.step22_loadPendingInterventions();
            });
            
            await this.executeStep(23, 'Load recent chat', async () => {
                return await this.step23_loadRecentChat();
            });
            
            await this.executeStep(24, 'Load active automations', async () => {
                return await this.step24_loadActiveAutomations();
            });
            
            await this.executeStep(25, 'Load voice preferences', async () => {
                return await this.step25_loadVoicePreferences();
            });
            
            await this.executeStep(26, 'Preload quick stats', async () => {
                return await this.step26_preloadQuickStats();
            });
            
            await this.executeStep(27, 'Calculate dashboard metrics', async () => {
                return await this.step27_calculateDashboardMetrics();
            });
            
            await this.executeStep(28, 'Load notifications', async () => {
                return await this.step28_loadNotifications();
            });
            
            await this.executeStep(29, 'Sync device data', async () => {
                return await this.step29_syncDeviceData();
            });
            
            await this.executeStep(30, 'Check for updates', async () => {
                return await this.step30_checkForUpdates();
            });
            
            await this.executeStep(31, 'Load user achievements', async () => {
                return await this.step31_loadUserAchievements();
            });
            
            await this.executeStep(32, 'Calculate streaks', async () => {
                return await this.step32_calculateStreaks();
            });
            
            await this.executeStep(33, 'Load recommendations', async () => {
                return await this.step33_loadRecommendations();
            });
            
            await this.executeStep(34, 'Prefetch common queries', async () => {
                return await this.step34_prefetchCommonQueries();
            });
            
            await this.executeStep(35, 'Warmup cache', async () => {
                return await this.step35_warmupCache();
            });
            
            // ================================================================
            // PHASE 3: System Setup (Steps 36-55)
            // ================================================================
            console.log('📍 PHASE 3: System Setup');
            
            await this.executeStep(36, 'Setup WebSocket', async () => {
                return await this.step36_setupWebSocket();
            });
            
            await this.executeStep(37, 'Subscribe to patterns', async () => {
                return await this.step37_subscribeToPatterns();
            });
            
            await this.executeStep(38, 'Subscribe to interventions', async () => {
                return await this.step38_subscribeToInterventions();
            });
            
            await this.executeStep(39, 'Start realtime monitoring', async () => {
                return await this.step39_startRealtimeMonitoring();
            });
            
            await this.executeStep(40, 'Initialize voice engine', async () => {
                return await this.step40_initializeVoiceEngine();
            });
            
            await this.executeStep(41, 'Setup notification system', async () => {
                return await this.step41_setupNotificationSystem();
            });
            
            await this.executeStep(42, 'Start health check', async () => {
                return await this.step42_startHealthCheck();
            });
            
            await this.executeStep(43, 'Setup error recovery', async () => {
                return await this.step43_setupErrorRecovery();
            });
            
            await this.executeStep(44, 'Initialize analytics', async () => {
                return await this.step44_initializeAnalytics();
            });
            
            await this.executeStep(45, 'Setup performance monitoring', async () => {
                return await this.step45_setupPerformanceMonitoring();
            });
            
            await this.executeStep(46, 'Warmup prediction models', async () => {
                return await this.step46_warmupPredictionModels();
            });
            
            await this.executeStep(47, 'Initialize butler', async () => {
                return await this.step47_initializeButler();
            });
            
            await this.executeStep(48, 'Setup event bus', async () => {
                return await this.step48_setupEventBus();
            });
            
            await this.executeStep(49, 'Register service worker', async () => {
                return await this.step49_registerServiceWorker();
            });
            
            await this.executeStep(50, 'Setup offline queue', async () => {
                return await this.step50_setupOfflineQueue();
            });
            
            await this.executeStep(51, 'Initialize cache policies', async () => {
                return await this.step51_initializeCachePolicies();
            });
            
            await this.executeStep(52, 'Setup background sync', async () => {
                return await this.step52_setupBackgroundSync();
            });
            
            await this.executeStep(53, 'Register push notifications', async () => {
                return await this.step53_registerPushNotifications();
            });
            
            await this.executeStep(54, 'Setup deep links', async () => {
                return await this.step54_setupDeepLinks();
            });
            
            await this.executeStep(55, 'Initialize sharing', async () => {
                return await this.step55_initializeSharing();
            });
            
            // ================================================================
            // PHASE 4: UI Preparation (Steps 56-67)
            // ================================================================
            console.log('📍 PHASE 4: UI Preparation');
            
            await this.executeStep(56, 'Preload dashboard assets', async () => {
                return await this.step56_preloadDashboardAssets();
            });
            
            await this.executeStep(57, 'Setup router', async () => {
                return await this.step57_setupRouter();
            });
            
            await this.executeStep(58, 'Initialize view transitions', async () => {
                return await this.step58_initializeViewTransitions();
            });
            
            await this.executeStep(59, 'Setup gestures', async () => {
                return await this.step59_setupGestures();
            });
            
            await this.executeStep(60, 'Initialize animations', async () => {
                return await this.step60_initializeAnimations();
            });
            
            await this.executeStep(61, 'Load theme preferences', async () => {
                return await this.step61_loadThemePreferences();
            });
            
            await this.executeStep(62, 'Setup accessibility', async () => {
                return await this.step62_setupAccessibility();
            });
            
            await this.executeStep(63, 'Preload planet data', async () => {
                return await this.step63_preloadPlanetData();
            });
            
            await this.executeStep(64, 'Warmup visualization', async () => {
                return await this.step64_warmupVisualization();
            });
            
            await this.executeStep(65, 'Finalize state', async () => {
                return await this.step65_finalizeState();
            });
            
            await this.executeStep(66, 'Render initial view', async () => {
                return await this.step66_renderInitialView();
            });
            
            await this.executeStep(67, 'Complete initialization', async () => {
                return await this.step67_completeInitialization();
            });
            
            // Finalize
            this.initialized = true;
            this.initEndTime = Date.now();
            this.metrics.initTime = this.initEndTime - this.initStartTime;
            
            this.setState(STATE_KEYS.INIT_STATUS, 'complete');
            
            console.log(`✅ Initialization complete in ${this.metrics.initTime}ms`);
            console.log(`   Steps completed: ${67 - this.failedSteps.length}/67`);
            if (this.failedSteps.length > 0) {
                console.warn(`   Failed steps:`, this.failedSteps);
            }
            
            // Emit initialization complete event
            this.emit('orchestrator:initialized', {
                duration: this.metrics.initTime,
                failedSteps: this.failedSteps
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Critical initialization error:', error);
            this.setState(STATE_KEYS.INIT_STATUS, 'failed');
            this.handleInitializationError(error);
            return false;
        }
    }
    
    // Helper method to execute a step with timeout and error handling
    async executeStep(stepNumber, stepName, stepFunction) {
        this.currentStep = stepNumber;
        const startTime = Date.now();
        
        try {
            console.log(`  [${stepNumber}/67] ${stepName}...`);
            
            // Execute with timeout
            const result = await Promise.race([
                stepFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Step timeout')), this.config.stepTimeout)
                )
            ]);
            
            const duration = Date.now() - startTime;
            console.log(`  ✓ Step ${stepNumber} complete (${duration}ms)`);
            
            return result;
            
        } catch (error) {
            console.error(`  ✗ Step ${stepNumber} failed:`, error.message);
            this.failedSteps.push({ step: stepNumber, name: stepName, error: error.message });
            
            // Continue initialization even if non-critical steps fail
            // Only critical auth steps should halt initialization
            if (stepNumber <= 10) {
                throw error;
            }
            
            return null;
        }
    }
    
    // ========================================================================
    // INITIALIZATION STEPS - PHASE 1: Authentication (1-10)
    // ========================================================================
    
    async step1_checkExistingSession() {
        const token = localStorage.getItem('phoenix_token');
        const user = localStorage.getItem('phoenix_user');
        
        if (token && user) {
            this.setState(STATE_KEYS.SESSION_TOKEN, token);
            this.setState(STATE_KEYS.USER_PROFILE, JSON.parse(user));
            this.setState(STATE_KEYS.SESSION_ACTIVE, true);
            return true;
        }
        
        return false;
    }
    
    async step2_validateToken() {
        const token = this.getState(STATE_KEYS.SESSION_TOKEN);
        
        if (!token) {
            return false;
        }
        
        try {
            const response = await window.PhoenixCore.API.auth.getCurrentUser();
            if (response.success) {
                this.setState(STATE_KEYS.USER_PROFILE, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }
    
    async step3_refreshIfExpired() {
        const token = this.getState(STATE_KEYS.SESSION_TOKEN);
        
        if (!token) {
            return false;
        }
        
        try {
            // Check if token is expired (decode JWT)
            const payload = this.decodeJWT(token);
            const now = Date.now() / 1000;
            
            if (payload.exp && payload.exp < now) {
                console.log('Token expired, refreshing...');
                // Token refresh would happen here if implemented
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async step4_loadUserProfile() {
        try {
            const response = await window.PhoenixCore.API.auth.getCurrentUser();
            if (response.success) {
                this.setState(STATE_KEYS.USER_PROFILE, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load user profile:', error);
            return false;
        }
    }
    
    async step5_loadUserPreferences() {
        try {
            const user = this.getState(STATE_KEYS.USER_PROFILE);
            if (user && user.preferences) {
                this.setState(STATE_KEYS.USER_PREFERENCES, user.preferences);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load user preferences:', error);
            return false;
        }
    }
    
    async step6_checkSubscription() {
        try {
            const response = await window.PhoenixCore.API.subscription.getStatus();
            if (response.success) {
                this.setState(STATE_KEYS.USER_SUBSCRIPTION, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to check subscription:', error);
            return false;
        }
    }
    
    async step7_loadUserRoles() {
        try {
            const user = this.getState(STATE_KEYS.USER_PROFILE);
            if (user && user.role) {
                this.setState(STATE_KEYS.USER_ROLES, [user.role]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load user roles:', error);
            return false;
        }
    }
    
    async step8_setupAuthInterceptor() {
        // Setup automatic token injection for API calls
        const token = this.getState(STATE_KEYS.SESSION_TOKEN);
        if (token && window.PhoenixCore) {
            window.PhoenixCore.Auth.setToken(token);
            return true;
        }
        return false;
    }
    
    async step9_trackLogin() {
        try {
            this.setState(STATE_KEYS.SESSION_LAST_ACTIVITY, Date.now());
            this.trackEvent('user:login', {
                timestamp: Date.now()
            });
            return true;
        } catch (error) {
            console.error('Failed to track login:', error);
            return false;
        }
    }
    
    async step10_initializeUserContext() {
        const user = this.getState(STATE_KEYS.USER_PROFILE);
        const preferences = this.getState(STATE_KEYS.USER_PREFERENCES);
        const subscription = this.getState(STATE_KEYS.USER_SUBSCRIPTION);
        
        if (user) {
            console.log(`User context initialized: ${user.name || user.email}`);
            return true;
        }
        
        return false;
    }
    
    // ========================================================================
    // INITIALIZATION STEPS - PHASE 2: Data Loading (11-35)
    // ========================================================================
    
    async step11_loadConnectedDevices() {
        try {
            const response = await window.PhoenixCore.API.mercury.devices.getAll();
            if (response.success) {
                this.setState(STATE_KEYS.CONNECTED_DEVICES, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load devices:', error);
            return false;
        }
    }
    
    async step12_loadLatestBiometrics() {
        try {
            const response = await window.PhoenixCore.API.mercury.data.getLatest();
            if (response.success) {
                this.setState(STATE_KEYS.LATEST_BIOMETRICS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load biometrics:', error);
            return false;
        }
    }
    
    async step13_loadTodayRecovery() {
        try {
            const response = await window.PhoenixCore.API.mercury.recovery.getLatest();
            if (response.success) {
                this.setState(STATE_KEYS.TODAY_RECOVERY, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load recovery:', error);
            return false;
        }
    }
    
    async step14_loadRecentWorkouts() {
        try {
            const response = await window.PhoenixCore.API.venus.workouts.getRecent({ limit: 10 });
            if (response.success) {
                this.setState(STATE_KEYS.RECENT_WORKOUTS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load workouts:', error);
            return false;
        }
    }
    
    async step15_loadTodayNutrition() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await window.PhoenixCore.API.venus.nutrition.getByDate(today);
            if (response.success) {
                this.setState(STATE_KEYS.TODAY_NUTRITION, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load nutrition:', error);
            return false;
        }
    }
    
    async step16_loadActiveGoals() {
        try {
            const response = await window.PhoenixCore.API.mars.goals.getAll({ status: 'active' });
            if (response.success) {
                this.setState(STATE_KEYS.ACTIVE_GOALS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load goals:', error);
            return false;
        }
    }
    
    async step17_loadTodayCalendar() {
        try {
            const today = new Date();
            const response = await window.PhoenixCore.API.earth.calendar.getEvents({
                startDate: today.toISOString(),
                endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
            });
            if (response.success) {
                this.setState(STATE_KEYS.TODAY_CALENDAR, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load calendar:', error);
            return false;
        }
    }
    
    async step18_loadFinancialAccounts() {
        try {
            const response = await window.PhoenixCore.API.jupiter.getAccounts();
            if (response.success) {
                this.setState(STATE_KEYS.FINANCIAL_ACCOUNTS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load financial accounts:', error);
            return false;
        }
    }
    
    async step19_loadLifeVision() {
        try {
            const response = await window.PhoenixCore.API.saturn.getVision();
            if (response.success) {
                this.setState(STATE_KEYS.LIFE_VISION, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load life vision:', error);
            return false;
        }
    }
    
    async step20_loadDiscoveredPatterns() {
        try {
            const response = await window.PhoenixCore.API.phoenix.patterns.getAll({ limit: 20 });
            if (response.success) {
                this.setState(STATE_KEYS.DISCOVERED_PATTERNS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load patterns:', error);
            return false;
        }
    }
    
    async step21_loadActiveInterventions() {
        try {
            const response = await window.PhoenixCore.API.phoenix.interventions.getActive();
            if (response.success) {
                this.setState(STATE_KEYS.ACTIVE_INTERVENTIONS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load active interventions:', error);
            return false;
        }
    }
    
    async step22_loadPendingInterventions() {
        try {
            const response = await window.PhoenixCore.API.phoenix.interventions.getPending();
            if (response.success) {
                this.setState(STATE_KEYS.PENDING_INTERVENTIONS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load pending interventions:', error);
            return false;
        }
    }
    
    async step23_loadRecentChat() {
        try {
            const response = await window.PhoenixCore.API.phoenix.companion.getHistory({ limit: 50 });
            if (response.success) {
                this.setState(STATE_KEYS.RECENT_CHAT, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load recent chat:', error);
            return false;
        }
    }
    
    async step24_loadActiveAutomations() {
        try {
            const response = await window.PhoenixCore.API.phoenix.butler.getAutomations({ status: 'active' });
            if (response.success) {
                this.setState(STATE_KEYS.ACTIVE_AUTOMATIONS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load automations:', error);
            return false;
        }
    }
    
    async step25_loadVoicePreferences() {
        try {
            const response = await window.PhoenixCore.API.voice.getSettings();
            if (response.success) {
                this.setState('voice.preferences', response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load voice preferences:', error);
            return false;
        }
    }
    
    async step26_preloadQuickStats() {
        try {
            const response = await window.PhoenixCore.API.phoenix.analytics.getQuickStats();
            if (response.success) {
                this.setState('stats.quick', response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to preload quick stats:', error);
            return false;
        }
    }
    
    async step27_calculateDashboardMetrics() {
        try {
            // Calculate key metrics from loaded data
            const recovery = this.getState(STATE_KEYS.TODAY_RECOVERY);
            const patterns = this.getState(STATE_KEYS.DISCOVERED_PATTERNS);
            const interventions = this.getState(STATE_KEYS.ACTIVE_INTERVENTIONS);
            
            const metrics = {
                recoveryScore: recovery?.score || 0,
                patternsCount: patterns?.length || 0,
                activeInterventionsCount: interventions?.length || 0,
                lastUpdated: Date.now()
            };
            
            this.setState('dashboard.metrics', metrics);
            return true;
        } catch (error) {
            console.error('Failed to calculate dashboard metrics:', error);
            return false;
        }
    }
    
    async step28_loadNotifications() {
        try {
            const response = await window.PhoenixCore.API.user.getNotifications({ unread: true });
            if (response.success) {
                this.setState(STATE_KEYS.NOTIFICATIONS, response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load notifications:', error);
            return false;
        }
    }
    
    async step29_syncDeviceData() {
        try {
            const devices = this.getState(STATE_KEYS.CONNECTED_DEVICES);
            if (devices && devices.length > 0) {
                // Trigger background sync for all devices
                const syncPromises = devices.map(device => 
                    window.PhoenixCore.API.mercury.devices.sync(device.provider)
                );
                await Promise.allSettled(syncPromises);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to sync device data:', error);
            return false;
        }
    }
    
    async step30_checkForUpdates() {
        try {
            // Check for app updates
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CHECK_FOR_UPDATES'
                });
            }
            return true;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return false;
        }
    }
    
    async step31_loadUserAchievements() {
        try {
            const response = await window.PhoenixCore.API.user.getAchievements();
            if (response.success) {
                this.setState('user.achievements', response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load achievements:', error);
            return false;
        }
    }
    
    async step32_calculateStreaks() {
        try {
            const response = await window.PhoenixCore.API.user.getStreaks();
            if (response.success) {
                this.setState('user.streaks', response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to calculate streaks:', error);
            return false;
        }
    }
    
    async step33_loadRecommendations() {
        try {
            const response = await window.PhoenixCore.API.phoenix.intelligence.getRecommendations();
            if (response.success) {
                this.setState('recommendations', response.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            return false;
        }
    }
    
    async step34_prefetchCommonQueries() {
        try {
            // Prefetch commonly accessed data
            const queries = [
                window.PhoenixCore.API.phoenix.patterns.getTrending(),
                window.PhoenixCore.API.phoenix.interventions.getRecent({ limit: 5 }),
                window.PhoenixCore.API.mercury.recovery.getTrends({ days: 7 })
            ];
            
            await Promise.allSettled(queries);
            return true;
        } catch (error) {
            console.error('Failed to prefetch queries:', error);
            return false;
        }
    }
    
    async step35_warmupCache() {
        try {
            if (window.PhoenixCore && window.PhoenixCore.Cache) {
                await window.PhoenixCore.Cache.warmup();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to warmup cache:', error);
            return false;
        }
    }
    
    // ========================================================================
    // INITIALIZATION STEPS - PHASE 3: System Setup (36-55)
    // ========================================================================
    
    async step36_setupWebSocket() {
        try {
            const token = this.getState(STATE_KEYS.SESSION_TOKEN);
            if (!token) return false;
            
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.setState(STATE_KEYS.WEBSOCKET_STATUS, 'connected');
                
                // Authenticate
                this.websocket.send(JSON.stringify({
                    type: 'auth',
                    token: token
                }));
            };
            
            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.setState(STATE_KEYS.WEBSOCKET_STATUS, 'disconnected');
                this.scheduleWebSocketReconnect();
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            return true;
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
            return false;
        }
    }
    
    async step37_subscribeToPatterns() {
        try {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'patterns'
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to subscribe to patterns:', error);
            return false;
        }
    }
    
    async step38_subscribeToInterventions() {
        try {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'interventions'
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to subscribe to interventions:', error);
            return false;
        }
    }
    
    async step39_startRealtimeMonitoring() {
        try {
            // Start monitoring real-time metrics
            this.startHeartbeat();
            return true;
        } catch (error) {
            console.error('Failed to start realtime monitoring:', error);
            return false;
        }
    }
    
    async step40_initializeVoiceEngine() {
        try {
            // Initialize voice recognition and synthesis
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                this.setState('voice.available', true);
                return true;
            }
            this.setState('voice.available', false);
            return false;
        } catch (error) {
            console.error('Failed to initialize voice engine:', error);
            return false;
        }
    }
    
    async step41_setupNotificationSystem() {
        try {
            // Setup notification handlers
            this.on('notification:show', (notification) => {
                this.showNotification(notification);
            });
            return true;
        } catch (error) {
            console.error('Failed to setup notification system:', error);
            return false;
        }
    }
    
    async step42_startHealthCheck() {
        try {
            this.healthCheckInterval = setInterval(() => {
                this.performHealthCheck();
            }, this.config.healthCheckInterval);
            
            // Perform initial health check
            await this.performHealthCheck();
            return true;
        } catch (error) {
            console.error('Failed to start health check:', error);
            return false;
        }
    }
    
    async step43_setupErrorRecovery() {
        try {
            // Setup global error handlers
            window.addEventListener('error', (event) => {
                this.handleError(event.error);
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(event.reason);
            });
            
            return true;
        } catch (error) {
            console.error('Failed to setup error recovery:', error);
            return false;
        }
    }
    
    async step44_initializeAnalytics() {
        try {
            if (this.config.analyticsEnabled) {
                this.trackEvent('app:initialized', {
                    timestamp: Date.now(),
                    version: this.config.version
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
            return false;
        }
    }
    
    async step45_setupPerformanceMonitoring() {
        try {
            if (this.config.performanceMonitoring && 'PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.trackPerformance(entry);
                    }
                });
                
                observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to setup performance monitoring:', error);
            return false;
        }
    }
    
    async step46_warmupPredictionModels() {
        try {
            // Warmup ML models for faster predictions
            if (window.PhoenixAI && window.PhoenixAI.PredictionEngine) {
                await window.PhoenixAI.PredictionEngine.warmup();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to warmup prediction models:', error);
            return false;
        }
    }
    
    async step47_initializeButler() {
        try {
            if (window.PhoenixAI && window.PhoenixAI.ButlerService) {
                await window.PhoenixAI.ButlerService.initialize();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize butler:', error);
            return false;
        }
    }
    
    async step48_setupEventBus() {
        try {
            // Event bus is already initialized in constructor
            // Setup core event listeners
            this.on('state:changed', (data) => {
                this.handleStateChange(data);
            });
            
            this.on('route:changed', (data) => {
                this.handleRouteChange(data);
            });
            
            return true;
        } catch (error) {
            console.error('Failed to setup event bus:', error);
            return false;
        }
    }
    
    async step49_registerServiceWorker() {
        try {
            if (this.config.serviceWorker && 'serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to register service worker:', error);
            return false;
        }
    }
    
    async step50_setupOfflineQueue() {
        try {
            if (this.config.offlineMode) {
                // Setup queue for offline requests
                window.addEventListener('online', () => {
                    this.processOfflineQueue();
                });
                
                window.addEventListener('offline', () => {
                    this.setState(STATE_KEYS.OFFLINE_MODE, true);
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to setup offline queue:', error);
            return false;
        }
    }
    
    async step51_initializeCachePolicies() {
        try {
            if (window.PhoenixCore && window.PhoenixCore.Cache) {
                window.PhoenixCore.Cache.setPolicies({
                    patterns: { ttl: 300000 }, // 5 minutes
                    interventions: { ttl: 60000 }, // 1 minute
                    biometrics: { ttl: 600000 }, // 10 minutes
                    workouts: { ttl: 1800000 }, // 30 minutes
                    goals: { ttl: 1800000 } // 30 minutes
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize cache policies:', error);
            return false;
        }
    }
    
    async step52_setupBackgroundSync() {
        try {
            if ('sync' in navigator.serviceWorker && navigator.serviceWorker.controller) {
                // Register background sync
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('phoenix-sync');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to setup background sync:', error);
            return false;
        }
    }
    
    async step53_registerPushNotifications() {
        try {
            if (this.config.pushNotifications && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    // Don't request permission during init, wait for user action
                    return true;
                } else if (Notification.permission === 'granted') {
                    // Already have permission, setup push
                    const registration = await navigator.serviceWorker.ready;
                    await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.getVapidPublicKey()
                    });
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to register push notifications:', error);
            return false;
        }
    }
    
    async step54_setupDeepLinks() {
        try {
            // Handle deep links / URL parameters
            const params = new URLSearchParams(window.location.search);
            
            if (params.has('action')) {
                this.setState('deeplink.action', params.get('action'));
            }
            
            if (params.has('view')) {
                this.setState('deeplink.view', params.get('view'));
            }
            
            return true;
        } catch (error) {
            console.error('Failed to setup deep links:', error);
            return false;
        }
    }
    
    async step55_initializeSharing() {
        try {
            // Check if Web Share API is available
            if (navigator.share) {
                this.setState('sharing.available', true);
                return true;
            }
            this.setState('sharing.available', false);
            return false;
        } catch (error) {
            console.error('Failed to initialize sharing:', error);
            return false;
        }
    }
    
    // ========================================================================
    // INITIALIZATION STEPS - PHASE 4: UI Preparation (56-67)
    // ========================================================================
    
    async step56_preloadDashboardAssets() {
        try {
            // Preload critical dashboard assets
            const assets = [
                '/assets/dashboard-bg.webp',
                '/assets/phoenix-logo.svg'
            ];
            
            const preloadPromises = assets.map(asset => {
                return new Promise((resolve) => {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.href = asset;
                    link.as = asset.endsWith('.webp') ? 'image' : 'image';
                    link.onload = resolve;
                    link.onerror = resolve; // Don't fail if asset doesn't exist
                    document.head.appendChild(link);
                });
            });
            
            await Promise.allSettled(preloadPromises);
            return true;
        } catch (error) {
            console.error('Failed to preload dashboard assets:', error);
            return false;
        }
    }
    
    async step57_setupRouter() {
        try {
            this.router = new PhoenixRouter(this);
            
            // Setup route change listener
            window.addEventListener('popstate', () => {
                this.router.handlePopState();
            });
            
            // Handle initial route
            const initialRoute = this.getInitialRoute();
            this.setState(STATE_KEYS.CURRENT_ROUTE, initialRoute);
            
            return true;
        } catch (error) {
            console.error('Failed to setup router:', error);
            return false;
        }
    }
    
    async step58_initializeViewTransitions() {
        try {
            // Setup view transition API if available
            if (document.startViewTransition) {
                this.setState('transitions.available', true);
                return true;
            }
            this.setState('transitions.available', false);
            return false;
        } catch (error) {
            console.error('Failed to initialize view transitions:', error);
            return false;
        }
    }
    
    async step59_setupGestures() {
        try {
            // Setup touch/gesture handlers for mobile
            if ('ontouchstart' in window) {
                this.setupTouchGestures();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to setup gestures:', error);
            return false;
        }
    }
    
    async step60_initializeAnimations() {
        try {
            // Setup animation preferences
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.setState('animations.reducedMotion', prefersReducedMotion);
            return true;
        } catch (error) {
            console.error('Failed to initialize animations:', error);
            return false;
        }
    }
    
    async step61_loadThemePreferences() {
        try {
            const preferences = this.getState(STATE_KEYS.USER_PREFERENCES);
            const theme = preferences?.theme || 'dark';
            
            this.setState(STATE_KEYS.THEME, theme);
            document.documentElement.setAttribute('data-theme', theme);
            
            return true;
        } catch (error) {
            console.error('Failed to load theme preferences:', error);
            return false;
        }
    }
    
    async step62_setupAccessibility() {
        try {
            // Setup accessibility features
            const preferences = this.getState(STATE_KEYS.USER_PREFERENCES);
            
            if (preferences?.highContrast) {
                document.documentElement.classList.add('high-contrast');
            }
            
            if (preferences?.largeText) {
                document.documentElement.classList.add('large-text');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to setup accessibility:', error);
            return false;
        }
    }
    
    async step63_preloadPlanetData() {
        try {
            // Preload data for all planets
            const planetDataPromises = [
                window.PhoenixCore.API.mercury.recovery.getDashboard(),
                window.PhoenixCore.API.venus.workouts.getStats(),
                window.PhoenixCore.API.earth.calendar.getEnergyMap(),
                window.PhoenixCore.API.mars.progress.getVelocity(),
                window.PhoenixCore.API.jupiter.getSpendingPatterns(),
                window.PhoenixCore.API.saturn.getVision()
            ];
            
            await Promise.allSettled(planetDataPromises);
            return true;
        } catch (error) {
            console.error('Failed to preload planet data:', error);
            return false;
        }
    }
    
    async step64_warmupVisualization() {
        try {
            // Warmup visualization libraries
            if (window.PhoenixPlanets && window.PhoenixPlanets.warmup) {
                await window.PhoenixPlanets.warmup();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to warmup visualization:', error);
            return false;
        }
    }
    
    async step65_finalizeState() {
        try {
            // Finalize application state
            this.setState('app.ready', true);
            this.setState('app.version', this.config.version);
            this.setState('app.initialized', Date.now());
            
            return true;
        } catch (error) {
            console.error('Failed to finalize state:', error);
            return false;
        }
    }
    
    async step66_renderInitialView() {
        try {
            const route = this.getState(STATE_KEYS.CURRENT_ROUTE);
            await this.router.navigate(route);
            return true;
        } catch (error) {
            console.error('Failed to render initial view:', error);
            return false;
        }
    }
    
    async step67_completeInitialization() {
        try {
            // Final cleanup and notifications
            this.hideLoadingScreen();
            this.showWelcomeNotification();
            
            // Log initialization metrics
            console.log('📊 Initialization Metrics:', this.metrics);
            
            return true;
        } catch (error) {
            console.error('Failed to complete initialization:', error);
            return false;
        }
    }
    
    // ========================================================================
    // ROUTER & NAVIGATION SYSTEM
    // ========================================================================
    
    navigate(route, options = {}) {
        if (this.router) {
            return this.router.navigate(route, options);
        }
        console.error('Router not initialized');
        return false;
    }
    
    goBack() {
        if (this.router) {
            return this.router.goBack();
        }
        return false;
    }
    
    getInitialRoute() {
        // Check for deep link
        const deepLinkView = this.getState('deeplink.view');
        if (deepLinkView) {
            return `/${deepLinkView}`;
        }
        
        // Check if user is authenticated
        const isAuthenticated = this.getState(STATE_KEYS.SESSION_ACTIVE);
        if (!isAuthenticated) {
            return this.config.loginRoute;
        }
        
        // Return default route
        return this.config.defaultRoute;
    }
    
    handleRouteChange(data) {
        console.log('Route changed:', data);
        
        // Update state
        this.setState(STATE_KEYS.CURRENT_ROUTE, data.route);
        this.setState(STATE_KEYS.CURRENT_VIEW, data.view);
        
        // Track page view
        this.trackEvent('page:view', {
            route: data.route,
            view: data.view,
            timestamp: Date.now()
        });
        
        // Update session activity
        this.setState(STATE_KEYS.SESSION_LAST_ACTIVITY, Date.now());
    }
    
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    getState(key) {
        return this.state.get(key);
    }
    
    setState(key, value) {
        const oldValue = this.state.get(key);
        this.state.set(key, value);
        
        // Increment metrics
        this.metrics.stateUpdates++;
        
        // Notify subscribers
        const subscribers = this.subscribers.get(key) || [];
        subscribers.forEach(callback => {
            try {
                callback(value, oldValue);
            } catch (error) {
                console.error('Error in state subscriber:', error);
            }
        });
        
        // Emit state change event
        this.emit('state:changed', { key, value, oldValue });
        
        return true;
    }
    
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        
        const subscribers = this.subscribers.get(key);
        subscribers.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        };
    }
    
    unsubscribe(key, callback) {
        const subscribers = this.subscribers.get(key);
        if (subscribers) {
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        }
    }
    
    clearState(key) {
        this.state.delete(key);
        return true;
    }
    
    getAllState() {
        return Object.fromEntries(this.state);
    }
    
    handleStateChange(data) {
        // Handle specific state changes
        if (data.key === STATE_KEYS.SESSION_ACTIVE && !data.value) {
            // Session ended, redirect to login
            this.navigate(this.config.loginRoute);
        }
    }
    
    // ========================================================================
    // CACHE WARMING & PRELOADING
    // ========================================================================
    
    async warmupCache(resources = []) {
        try {
            console.log('Warming up cache...');
            
            const defaultResources = [
                '/api/phoenix/patterns',
                '/api/phoenix/interventions/active',
                '/api/mercury/recovery/dashboard',
                '/api/venus/workouts/quantum/templates'
            ];
            
            const allResources = [...defaultResources, ...resources];
            
            const warmupPromises = allResources.map(async (resource) => {
                try {
                    const response = await fetch(resource, {
                        headers: {
                            'Authorization': `Bearer ${this.getState(STATE_KEYS.SESSION_TOKEN)}`
                        }
                    });
                    return response.ok;
                } catch (error) {
                    return false;
                }
            });
            
            await Promise.allSettled(warmupPromises);
            console.log('Cache warmup complete');
            
            return true;
        } catch (error) {
            console.error('Cache warmup failed:', error);
            return false;
        }
    }
    
    async preloadRoute(route) {
        try {
            const routeConfig = this.routes[route];
            if (!routeConfig || !routeConfig.preload) {
                return false;
            }
            
            const preloadPromises = routeConfig.preload.map(async (resource) => {
                // Map resource name to API call
                switch (resource) {
                    case 'patterns':
                        return window.PhoenixCore.API.phoenix.patterns.getAll();
                    case 'interventions':
                        return window.PhoenixCore.API.phoenix.interventions.getActive();
                    case 'biometrics':
                        return window.PhoenixCore.API.mercury.data.getLatest();
                    case 'recovery':
                        return window.PhoenixCore.API.mercury.recovery.getLatest();
                    case 'workouts':
                        return window.PhoenixCore.API.venus.workouts.getRecent();
                    case 'goals':
                        return window.PhoenixCore.API.mars.goals.getAll();
                    default:
                        return Promise.resolve(null);
                }
            });
            
            await Promise.allSettled(preloadPromises);
            return true;
        } catch (error) {
            console.error('Failed to preload route:', error);
            return false;
        }
    }
    
    // ========================================================================
    // WEBSOCKET & REAL-TIME MONITORING
    // ========================================================================
    
    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'pattern:discovered':
                    this.handleNewPattern(data.payload);
                    break;
                    
                case 'intervention:triggered':
                    this.handleNewIntervention(data.payload);
                    break;
                    
                case 'biometrics:updated':
                    this.handleBiometricsUpdate(data.payload);
                    break;
                    
                case 'notification':
                    this.showNotification(data.payload);
                    break;
                    
                default:
                    console.log('Unknown WebSocket message:', data);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }
    
    handleNewPattern(pattern) {
        console.log('New pattern discovered:', pattern);
        
        // Update state
        const patterns = this.getState(STATE_KEYS.DISCOVERED_PATTERNS) || [];
        patterns.unshift(pattern);
        this.setState(STATE_KEYS.DISCOVERED_PATTERNS, patterns);
        
        // Show notification
        this.showNotification({
            title: '🔥 New Pattern Discovered',
            message: pattern.title,
            type: 'pattern',
            action: () => this.navigate('/patterns')
        });
        
        // Emit event
        this.emit('pattern:discovered', pattern);
    }
    
    handleNewIntervention(intervention) {
        console.log('New intervention triggered:', intervention);
        
        // Update state
        const interventions = this.getState(STATE_KEYS.ACTIVE_INTERVENTIONS) || [];
        interventions.unshift(intervention);
        this.setState(STATE_KEYS.ACTIVE_INTERVENTIONS, interventions);
        
        // Show notification
        this.showNotification({
            title: '⚡ Phoenix Intervention',
            message: intervention.message,
            type: 'intervention',
            action: () => this.navigate('/interventions')
        });
        
        // Emit event
        this.emit('intervention:triggered', intervention);
    }
    
    handleBiometricsUpdate(data) {
        console.log('Biometrics updated:', data);
        
        // Update state
        this.setState(STATE_KEYS.LATEST_BIOMETRICS, data);
        
        // Emit event
        this.emit('biometrics:updated', data);
    }
    
    scheduleWebSocketReconnect() {
        let retryCount = 0;
        
        const reconnect = () => {
            if (retryCount >= this.config.wsMaxRetries) {
                console.error('Max WebSocket reconnection attempts reached');
                return;
            }
            
            retryCount++;
            console.log(`Attempting WebSocket reconnection (${retryCount}/${this.config.wsMaxRetries})...`);
            
            setTimeout(() => {
                this.step36_setupWebSocket().then(success => {
                    if (!success) {
                        reconnect();
                    }
                });
            }, this.config.wsReconnectDelay * retryCount);
        };
        
        reconnect();
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({ type: 'ping' }));
            }
        }, this.config.heartbeatInterval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    // ========================================================================
    // HEALTH CHECK SYSTEM
    // ========================================================================
    
    async performHealthCheck() {
        const health = {
            timestamp: Date.now(),
            status: 'healthy',
            checks: {}
        };
        
        try {
            // Check API connectivity
            health.checks.api = await this.checkAPIHealth();
            
            // Check WebSocket
            health.checks.websocket = this.websocket?.readyState === WebSocket.OPEN;
            
            // Check cache
            health.checks.cache = window.PhoenixCore?.Cache?.isHealthy() || false;
            
            // Check memory
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                health.checks.memory = memoryUsage < 0.9; // < 90% usage
                health.memoryUsage = (memoryUsage * 100).toFixed(2) + '%';
            }
            
            // Check errors
            health.checks.errors = this.errorQueue.length < 10;
            health.errorCount = this.errorQueue.length;
            
            // Determine overall status
            const allHealthy = Object.values(health.checks).every(check => check === true);
            health.status = allHealthy ? 'healthy' : 'degraded';
            
            // Update state
            this.setState(STATE_KEYS.HEALTH_STATUS, health);
            
            // Log if unhealthy
            if (health.status !== 'healthy') {
                console.warn('Health check failed:', health);
            }
            
            return health;
        } catch (error) {
            console.error('Health check error:', error);
            health.status = 'unhealthy';
            health.error = error.message;
            this.setState(STATE_KEYS.HEALTH_STATUS, health);
            return health;
        }
    }
    
    async checkAPIHealth() {
        try {
            const response = await window.PhoenixCore.API.system.health();
            return response.success;
        } catch (error) {
            return false;
        }
    }
    
    // ========================================================================
    // NOTIFICATION SYSTEM
    // ========================================================================
    
    showNotification(notification) {
        console.log('Showing notification:', notification);
        
        // Add to notification list
        const notifications = this.getState(STATE_KEYS.NOTIFICATIONS) || [];
        notifications.unshift({
            id: Date.now(),
            ...notification,
            timestamp: Date.now(),
            read: false
        });
        this.setState(STATE_KEYS.NOTIFICATIONS, notifications);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/assets/phoenix-icon.png',
                badge: '/assets/phoenix-badge.png',
                tag: notification.type || 'general'
            });
        }
        
        // Emit event
        this.emit('notification:show', notification);
    }
    
    hideNotification(id) {
        const notifications = this.getState(STATE_KEYS.NOTIFICATIONS) || [];
        const filtered = notifications.filter(n => n.id !== id);
        this.setState(STATE_KEYS.NOTIFICATIONS, filtered);
        
        this.emit('notification:hide', { id });
    }
    
    markNotificationRead(id) {
        const notifications = this.getState(STATE_KEYS.NOTIFICATIONS) || [];
        const notification = notifications.find(n => n.id === id);
        
        if (notification) {
            notification.read = true;
            this.setState(STATE_KEYS.NOTIFICATIONS, [...notifications]);
            
            this.emit('notification:read', { id });
        }
    }
    
    clearAllNotifications() {
        this.setState(STATE_KEYS.NOTIFICATIONS, []);
        this.emit('notifications:cleared');
    }
    
    showWelcomeNotification() {
        const user = this.getState(STATE_KEYS.USER_PROFILE);
        const patterns = this.getState(STATE_KEYS.DISCOVERED_PATTERNS) || [];
        const interventions = this.getState(STATE_KEYS.ACTIVE_INTERVENTIONS) || [];
        
        const name = user?.name || user?.email?.split('@')[0] || 'there';
        
        this.showNotification({
            title: `Welcome back, ${name}!`,
            message: `${patterns.length} new patterns, ${interventions.length} active interventions`,
            type: 'welcome'
        });
    }
    
    // ========================================================================
    // ERROR RECOVERY & OFFLINE HANDLING
    // ========================================================================
    
    handleError(error) {
        console.error('Application error:', error);
        
        // Add to error queue
        this.errorQueue.push({
            error: error,
            timestamp: Date.now(),
            stack: error.stack
        });
        
        // Keep queue size manageable
        if (this.errorQueue.length > 50) {
            this.errorQueue.shift();
        }
        
        // Increment metrics
        this.metrics.errors++;
        
        // Emit error event
        this.emit('error:occurred', { error });
        
        // Attempt recovery for specific error types
        if (error.message?.includes('token') || error.message?.includes('401')) {
            this.handleAuthenticationError();
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            this.handleNetworkError();
        }
    }
    
    handleAuthenticationError() {
        console.warn('Authentication error detected, redirecting to login...');
        
        // Clear session
        this.setState(STATE_KEYS.SESSION_ACTIVE, false);
        this.setState(STATE_KEYS.SESSION_TOKEN, null);
        
        // Redirect to login
        this.navigate(this.config.loginRoute);
    }
    
    handleNetworkError() {
        console.warn('Network error detected, entering offline mode...');
        
        this.setState(STATE_KEYS.OFFLINE_MODE, true);
        
        this.showNotification({
            title: '📶 Connection Lost',
            message: 'Working offline. Changes will sync when reconnected.',
            type: 'warning'
        });
    }
    
    handleInitializationError(error) {
        console.error('Initialization failed:', error);
        
        // Show error message to user
        const errorContainer = document.getElementById('init-error');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <h2>Initialization Failed</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }
    
    addToOfflineQueue(request) {
        this.offlineQueue.push({
            request: request,
            timestamp: Date.now()
        });
        
        console.log('Request queued for offline sync:', request);
    }
    
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) {
            return;
        }
        
        console.log(`Processing ${this.offlineQueue.length} offline requests...`);
        
        const results = await Promise.allSettled(
            this.offlineQueue.map(item => this.retryRequest(item.request))
        );
        
        // Clear successfully processed requests
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        this.offlineQueue = [];
        
        console.log(`Processed ${successCount}/${results.length} offline requests`);
        
        this.setState(STATE_KEYS.OFFLINE_MODE, false);
        
        this.showNotification({
            title: '✅ Back Online',
            message: `Synced ${successCount} pending changes`,
            type: 'success'
        });
    }
    
    async retryRequest(request) {
        // Retry the request with exponential backoff
        let retries = 0;
        
        while (retries < this.config.retryAttempts) {
            try {
                const response = await fetch(request.url, request.options);
                if (response.ok) {
                    return response;
                }
            } catch (error) {
                retries++;
                if (retries < this.config.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
                }
            }
        }
        
        throw new Error('Request failed after retries');
    }
    
    // ========================================================================
    // USER SESSION MANAGEMENT
    // ========================================================================
    
    updateLastActivity() {
        this.setState(STATE_KEYS.SESSION_LAST_ACTIVITY, Date.now());
    }
    
    checkSessionTimeout() {
        const lastActivity = this.getState(STATE_KEYS.SESSION_LAST_ACTIVITY);
        const timeout = 30 * 60 * 1000; // 30 minutes
        
        if (lastActivity && (Date.now() - lastActivity > timeout)) {
            this.handleSessionTimeout();
        }
    }
    
    handleSessionTimeout() {
        console.warn('Session timeout');
        
        this.showNotification({
            title: '⏱️ Session Timeout',
            message: 'Your session has expired. Please login again.',
            type: 'warning'
        });
        
        this.logout();
    }
    
    async logout() {
        try {
            // Call logout API
            await window.PhoenixCore.API.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // Clear session
        this.setState(STATE_KEYS.SESSION_ACTIVE, false);
        this.setState(STATE_KEYS.SESSION_TOKEN, null);
        this.setState(STATE_KEYS.USER_PROFILE, null);
        
        localStorage.removeItem('phoenix_token');
        localStorage.removeItem('phoenix_user');
        
        // Close WebSocket
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        // Redirect to login
        this.navigate(this.config.loginRoute);
    }
    
    // ========================================================================
    // ANALYTICS TRACKING
    // ========================================================================
    
    trackEvent(eventName, data = {}) {
        if (!this.config.analyticsEnabled) {
            return;
        }
        
        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            user: this.getState(STATE_KEYS.USER_PROFILE)?.id
        };
        
        console.log('📊 Track:', eventName, data);
        
        // Send to backend
        if (window.PhoenixCore && window.PhoenixCore.API.phoenix.analytics) {
            window.PhoenixCore.API.phoenix.analytics.trackEvent(event).catch(error => {
                console.error('Analytics tracking failed:', error);
            });
        }
        
        // Emit event
        this.emit('analytics:tracked', event);
    }
    
    trackPageView(route) {
        this.trackEvent('page:view', {
            route: route,
            referrer: document.referrer,
            timestamp: Date.now()
        });
    }
    
    trackAction(action, data = {}) {
        this.trackEvent(`action:${action}`, data);
    }
    
    // ========================================================================
    // PERFORMANCE MONITORING
    // ========================================================================
    
    trackPerformance(entry) {
        console.log('Performance entry:', entry);
        
        if (entry.entryType === 'navigation') {
            this.trackEvent('performance:navigation', {
                loadTime: entry.loadEventEnd - entry.loadEventStart,
                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                responseTime: entry.responseEnd - entry.requestStart
            });
        }
        
        if (entry.entryType === 'resource') {
            if (entry.duration > 1000) { // Log slow resources
                console.warn('Slow resource:', entry.name, `${entry.duration}ms`);
            }
        }
    }
    
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - (this.initEndTime || Date.now()),
            stateSize: this.state.size,
            subscriberCount: Array.from(this.subscribers.values()).reduce((sum, subs) => sum + subs.length, 0),
            errorQueueSize: this.errorQueue.length,
            offlineQueueSize: this.offlineQueue.length
        };
    }
    
    // ========================================================================
    // MODULE COORDINATION
    // ========================================================================
    
    async loadModule(moduleName) {
        try {
            console.log(`Loading module: ${moduleName}`);
            
            // Check if module is already loaded
            if (window[moduleName]) {
                return window[moduleName];
            }
            
            // Dynamic import would go here
            // For now, assume modules are already loaded
            
            return null;
        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            return null;
        }
    }
    
    registerModule(moduleName, module) {
        console.log(`Registering module: ${moduleName}`);
        window[moduleName] = module;
        
        this.emit('module:registered', { moduleName, module });
    }
    
    unregisterModule(moduleName) {
        console.log(`Unregistering module: ${moduleName}`);
        delete window[moduleName];
        
        this.emit('module:unregistered', { moduleName });
    }
    
    // ========================================================================
    // EVENT BUS SYSTEM
    // ========================================================================
    
    on(eventName, callback) {
        if (!this.eventBus.has(eventName)) {
            this.eventBus.set(eventName, []);
        }
        
        const listeners = this.eventBus.get(eventName);
        listeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }
    
    off(eventName, callback) {
        const listeners = this.eventBus.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(eventName, data) {
        const listeners = this.eventBus.get(eventName) || [];
        
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }
    
    once(eventName, callback) {
        const wrappedCallback = (data) => {
            callback(data);
            this.off(eventName, wrappedCallback);
        };
        
        this.on(eventName, wrappedCallback);
    }
    
    // ========================================================================
    // UTILITY METHODS
    // ========================================================================
    
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    }
    
    getVapidPublicKey() {
        // This would be loaded from config in production
        return 'YOUR_VAPID_PUBLIC_KEY';
    }
    
    setupTouchGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }
    
    handleSwipe(startX, endX) {
        const swipeDistance = endX - startX;
        const threshold = 100;
        
        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance > 0) {
                this.emit('gesture:swipe-right');
            } else {
                this.emit('gesture:swipe-left');
            }
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }
    
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.style.opacity = '1';
        }
    }
    
    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    destroy() {
        console.log('Destroying Phoenix Orchestrator...');
        
        // Clear intervals
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Close WebSocket
        if (this.websocket) {
            this.websocket.close();
        }
        
        // Clear state
        this.state.clear();
        this.subscribers.clear();
        this.eventBus.clear();
        
        // Reset flags
        this.initialized = false;
        
        console.log('Orchestrator destroyed');
    }
}

// ============================================================================
// PHOENIX ROUTER CLASS
// ============================================================================

class PhoenixRouter {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.currentRoute = null;
        this.history = [];
    }
    
    async navigate(route, options = {}) {
        console.log('Navigating to:', route);
        
        // Check if route exists
        const routeConfig = this.orchestrator.routes[route];
        if (!routeConfig) {
            console.warn('Route not found:', route);
            return this.navigate('/404');
        }
        
        // Check authentication
        if (routeConfig.auth) {
            const isAuthenticated = this.orchestrator.getState(STATE_KEYS.SESSION_ACTIVE);
            if (!isAuthenticated) {
                console.warn('Authentication required for:', route);
                return this.navigate(this.orchestrator.config.loginRoute);
            }
        }
        
        // Preload data for route
        if (routeConfig.preload && routeConfig.preload.length > 0) {
            await this.orchestrator.preloadRoute(route);
        }
        
        // Update browser history
        if (!options.replace) {
            window.history.pushState({ route }, '', route);
        } else {
            window.history.replaceState({ route }, '', route);
        }
        
        // Add to internal history
        this.history.push(route);
        
        // Update current route
        this.currentRoute = route;
        
        // Emit route change event
        this.orchestrator.emit('route:changed', {
            route: route,
            view: routeConfig.view
        });
        
        // Render view
        await this.renderView(routeConfig.view);
        
        return true;
    }
    
    async renderView(viewName) {
        console.log('Rendering view:', viewName);
        
        // Get main container
        const container = document.getElementById('app-content');
        if (!container) {
            console.error('App container not found');
            return false;
        }
        
        // Show loading state
        container.innerHTML = '<div class="loading">Loading...</div>';
        
        // Render view based on name
        try {
            let content = '';
            
            switch (viewName) {
                case 'dashboard':
                    content = await this.renderDashboard();
                    break;
                    
                case 'companion':
                    content = await this.renderCompanion();
                    break;
                    
                case 'mercury':
                case 'venus':
                case 'earth':
                case 'mars':
                case 'jupiter':
                case 'saturn':
                    content = await this.renderPlanet(viewName);
                    break;
                    
                case 'patterns':
                    content = await this.renderPatterns();
                    break;
                    
                case 'interventions':
                    content = await this.renderInterventions();
                    break;
                    
                case 'login':
                    content = await this.renderLogin();
                    break;
                    
                case '404':
                    content = this.render404();
                    break;
                    
                default:
                    content = '<div>View not implemented: ' + viewName + '</div>';
            }
            
            // Update container
            container.innerHTML = content;
            
            // Initialize view-specific scripts
            this.initializeView(viewName);
            
            return true;
        } catch (error) {
            console.error('Error rendering view:', error);
            container.innerHTML = '<div class="error">Failed to load view</div>';
            return false;
        }
    }
    
    async renderDashboard() {
        const metrics = this.orchestrator.getState('dashboard.metrics') || {};
        const patterns = this.orchestrator.getState(STATE_KEYS.DISCOVERED_PATTERNS) || [];
        const interventions = this.orchestrator.getState(STATE_KEYS.ACTIVE_INTERVENTIONS) || [];
        
        return `
            <div class="dashboard">
                <h1>Phoenix Dashboard</h1>
                
                <div class="quick-stats">
                    <div class="stat-card">
                        <h3>Recovery Score</h3>
                        <div class="stat-value">${metrics.recoveryScore || 0}%</div>
                    </div>
                    <div class="stat-card">
                        <h3>Patterns Discovered</h3>
                        <div class="stat-value">${patterns.length}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Active Interventions</h3>
                        <div class="stat-value">${interventions.length}</div>
                    </div>
                </div>
                
                <div class="recent-patterns">
                    <h2>Recent Patterns</h2>
                    ${patterns.slice(0, 5).map(p => `
                        <div class="pattern-item">
                            <strong>${p.title}</strong>
                            <p>${p.description}</p>
                        </div>
                    `).join('') || '<p>No patterns discovered yet</p>'}
                </div>
            </div>
        `;
    }
    
    async renderCompanion() {
        return `
            <div class="companion">
                <h1>Phoenix Companion</h1>
                <div id="chat-container" class="chat-container">
                    <!-- Chat interface will be rendered here -->
                </div>
            </div>
        `;
    }
    
    async renderPlanet(planetName) {
        return `
            <div class="planet-view ${planetName}">
                <h1>${planetName.charAt(0).toUpperCase() + planetName.slice(1)}</h1>
                <div id="${planetName}-content">
                    <!-- Planet content will be rendered here -->
                </div>
            </div>
        `;
    }
    
    async renderPatterns() {
        const patterns = this.orchestrator.getState(STATE_KEYS.DISCOVERED_PATTERNS) || [];
        
        return `
            <div class="patterns-view">
                <h1>Discovered Patterns</h1>
                <div class="patterns-list">
                    ${patterns.map(p => `
                        <div class="pattern-card">
                            <h3>${p.title}</h3>
                            <p>${p.description}</p>
                            <div class="pattern-meta">
                                <span>Confidence: ${p.confidence}%</span>
                                <span>Impact: ${p.impact}</span>
                            </div>
                        </div>
                    `).join('') || '<p>No patterns discovered yet</p>'}
                </div>
            </div>
        `;
    }
    
    async renderInterventions() {
        const interventions = this.orchestrator.getState(STATE_KEYS.ACTIVE_INTERVENTIONS) || [];
        
        return `
            <div class="interventions-view">
                <h1>Active Interventions</h1>
                <div class="interventions-list">
                    ${interventions.map(i => `
                        <div class="intervention-card">
                            <h3>${i.title}</h3>
                            <p>${i.message}</p>
                            <div class="intervention-actions">
                                <button onclick="phoenixOrchestrator.approveIntervention('${i.id}')">Approve</button>
                                <button onclick="phoenixOrchestrator.denyIntervention('${i.id}')">Deny</button>
                            </div>
                        </div>
                    `).join('') || '<p>No active interventions</p>'}
                </div>
            </div>
        `;
    }
    
    async renderLogin() {
        return `
            <div class="login-view">
                <div class="login-container">
                    <h1>🔥 Phoenix</h1>
                    <p>Your AI Life Optimizer</p>
                    
                    <form id="login-form">
                        <input type="email" placeholder="Email" required />
                        <input type="password" placeholder="Password" required />
                        <button type="submit">Login</button>
                    </form>
                    
                    <div class="login-footer">
                        <a href="/register">Create Account</a>
                        <a href="/reset-password">Forgot Password?</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    render404() {
        return `
            <div class="error-404">
                <h1>404</h1>
                <p>Page not found</p>
                <button onclick="phoenixOrchestrator.navigate('/dashboard')">Go to Dashboard</button>
            </div>
        `;
    }
    
    initializeView(viewName) {
        // Initialize view-specific functionality
        console.log('Initializing view:', viewName);
        
        // Setup event listeners, load data, etc.
    }
    
    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // Remove current
            const previousRoute = this.history[this.history.length - 1];
            return this.navigate(previousRoute, { replace: true });
        }
        return false;
    }
    
    handlePopState() {
        const state = window.history.state;
        if (state && state.route) {
            this.navigate(state.route, { replace: true });
        }
    }
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Create global instance
window.phoenixOrchestrator = new PhoenixOrchestrator();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.phoenixOrchestrator.initialize();
    });
} else {
    // DOM already loaded
    window.phoenixOrchestrator.initialize();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoenixOrchestrator;
}

console.log('🔥 Phoenix Orchestrator loaded and ready');
