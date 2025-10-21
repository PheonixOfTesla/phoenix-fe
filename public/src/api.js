// ============================================
// PAL/PHOENIX SECURE API CLIENT
// Maximum Security Implementation
// ============================================

// ============================================
// SECURITY CONFIGURATION
// ============================================

const getAPIBaseURL = () => {
    const url = import.meta.env.VITE_API_URL;
    
    // SECURITY: Force HTTPS in production
    if (import.meta.env.PROD && url && !url.startsWith('https://')) {
        console.error('🚨 SECURITY: API must use HTTPS in production');
        throw new Error('Insecure API URL detected');
    }
    
    // Development fallback
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return url || 'http://localhost:3001/api';
    }
    
    // Production: must have VITE_API_URL set
    if (!url) {
        console.error('🚨 VITE_API_URL not configured');
        throw new Error('API URL not configured');
    }
    
    return url;
};

const API_BASE_URL = getAPIBaseURL();

// Token storage keys (encrypted storage keys)
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'phoenixToken';
const USER_KEY = import.meta.env.VITE_USER_KEY || 'phoenixUser';
const REFRESH_KEY = 'phoenixRefresh';

// Request throttling
const requestQueue = new Map();
const MAX_REQUESTS_PER_MINUTE = 60;
const THROTTLE_WINDOW = 60000; // 1 minute

// CSRF Token
let csrfToken = null;

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Simple XOR encryption for localStorage (basic obfuscation)
 * Note: This is NOT cryptographic security, just prevents casual inspection
 */
const encryptStorage = (data) => {
    const key = 'PAL_PHOENIX_2024'; // In production, this should be dynamic
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
};

const decryptStorage = (encrypted) => {
    try {
        const key = 'PAL_PHOENIX_2024';
        const data = atob(encrypted);
        let decrypted = '';
        for (let i = 0; i < data.length; i++) {
            decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return decrypted;
    } catch {
        return null;
    }
};

/**
 * Secure storage wrapper with encryption
 */
const secureStorage = {
    setItem: (key, value) => {
        try {
            const encrypted = encryptStorage(value);
            localStorage.setItem(key, encrypted);
        } catch (error) {
            console.error('Storage encryption failed:', error);
        }
    },
    
    getItem: (key) => {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            return decryptStorage(encrypted);
        } catch (error) {
            console.error('Storage decryption failed:', error);
            return null;
        }
    },
    
    removeItem: (key) => {
        localStorage.removeItem(key);
    },
    
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REFRESH_KEY);
    }
};

/**
 * Request throttling to prevent API abuse
 */
const throttleRequest = (endpoint) => {
    const now = Date.now();
    const requests = requestQueue.get(endpoint) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < THROTTLE_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        throw new Error('Too many requests. Please slow down.');
    }
    
    recentRequests.push(now);
    requestQueue.set(endpoint, recentRequests);
};

/**
 * Sanitize error messages to prevent information leakage
 */
const sanitizeError = (error) => {
    // Don't expose internal errors to users
    const safeErrors = {
        'Network request failed': 'Unable to connect to server',
        'Failed to fetch': 'Connection error. Please check your internet.',
        'Unauthorized': 'Session expired. Please login again.',
        'Forbidden': 'You do not have permission for this action.',
        'Too Many Requests': 'Too many requests. Please wait a moment.',
        'Internal Server Error': 'Something went wrong. Please try again.',
    };
    
    const message = error.message || 'Unknown error';
    
    // Check for known safe errors
    for (const [pattern, safeMessage] of Object.entries(safeErrors)) {
        if (message.includes(pattern)) {
            return new Error(safeMessage);
        }
    }
    
    // Generic error for everything else
    return new Error('An error occurred. Please try again.');
};

/**
 * Validate response integrity
 */
const validateResponse = (response) => {
    // Check for suspicious responses
    if (!response.ok && response.status === 0) {
        throw new Error('Network request failed');
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
        console.warn('⚠️  Unexpected content type:', contentType);
    }
    
    return response;
};

/**
 * Token expiration check
 */
const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= expirationTime;
    } catch {
        return true;
    }
};

/**
 * Automatic token refresh
 */
const refreshAuthToken = async () => {
    try {
        const refreshToken = secureStorage.getItem(REFRESH_KEY);
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed');
        }
        
        const data = await response.json();
        if (data.success && data.token) {
            secureStorage.setItem(TOKEN_KEY, data.token);
            if (data.refreshToken) {
                secureStorage.setItem(REFRESH_KEY, data.refreshToken);
            }
            return data.token;
        }
        
        throw new Error('Invalid refresh response');
    } catch (error) {
        // Refresh failed, clear everything and force re-login
        secureStorage.clear();
        throw new Error('Session expired. Please login again.');
    }
};

/**
 * Secure fetch wrapper with auto-retry and token refresh
 */
const secureFetch = async (url, options = {}, retryCount = 0) => {
    try {
        // Throttle requests
        throttleRequest(url);
        
        // Check token expiration before request
        const token = secureStorage.getItem(TOKEN_KEY);
        if (token && isTokenExpired(token) && retryCount === 0) {
            console.log('🔄 Token expired, refreshing...');
            await refreshAuthToken();
            return secureFetch(url, options, retryCount + 1);
        }
        
        // Add CSRF token if available
        if (csrfToken) {
            options.headers = {
                ...options.headers,
                'X-CSRF-Token': csrfToken
            };
        }
        
        // Make request
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Send cookies for httpOnly token support
        });
        
        // Validate response
        validateResponse(response);
        
        // Handle 401 Unauthorized - token might be invalid
        if (response.status === 401 && retryCount === 0) {
            console.log('🔄 Unauthorized, attempting token refresh...');
            await refreshAuthToken();
            return secureFetch(url, options, retryCount + 1);
        }
        
        // Store new CSRF token if provided
        const newCsrfToken = response.headers.get('X-CSRF-Token');
        if (newCsrfToken) {
            csrfToken = newCsrfToken;
        }
        
        return response;
        
    } catch (error) {
        throw sanitizeError(error);
    }
};

// ============================================
// AUTH HEADERS
// ============================================

export const getAuthHeaders = () => {
    const token = secureStorage.getItem(TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Only add Authorization if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add CSRF token
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }
    
    return headers;
};

// ============================================
// AUTHENTICATION
// ============================================

export const login = async (email, password) => {
    // Input validation
    if (!email || !password) {
        throw new Error('Email and password are required');
    }
    
    if (!email.includes('@')) {
        throw new Error('Invalid email format');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
        secureStorage.setItem(TOKEN_KEY, data.token);
        secureStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        // Store refresh token if provided
        if (data.refreshToken) {
            secureStorage.setItem(REFRESH_KEY, data.refreshToken);
        }
        
        // Clear password from memory
        password = null;
    }
    
    return data;
};

export const register = async (name, email, password) => {
    // Input validation
    if (!name || !email || !password) {
        throw new Error('All fields are required');
    }
    
    if (!email.includes('@')) {
        throw new Error('Invalid email format');
    }
    
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'client' })
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
        secureStorage.setItem(TOKEN_KEY, data.token);
        secureStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        if (data.refreshToken) {
            secureStorage.setItem(REFRESH_KEY, data.refreshToken);
        }
        
        // Clear password from memory
        password = null;
    }
    
    return data;
};

export const logout = async () => {
    try {
        // Call backend logout endpoint
        await secureFetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear local storage
        secureStorage.clear();
        csrfToken = null;
        requestQueue.clear();
    }
};

export const getCurrentUser = () => {
    const userData = secureStorage.getItem(USER_KEY);
    if (!userData) return null;
    
    try {
        return JSON.parse(userData);
    } catch {
        return null;
    }
};

// ============================================
// USER MANAGEMENT
// ============================================

export const updateUserProfile = async (userData) => {
    const response = await secureFetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    // Update stored user data
    if (data.success && data.user) {
        secureStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    
    return data;
};

// ============================================
// AI COMPANION
// ============================================

export const sendChatMessage = async (message, context = {}) => {
    if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/companion/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: message.trim(), context })
    });
    
    return await response.json();
};

export const getChatHistory = async (limit = 20) => {
    const response = await secureFetch(`${API_BASE_URL}/companion/history?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const triggerProactiveCheck = async () => {
    const response = await secureFetch(`${API_BASE_URL}/companion/proactive-check`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// VOICE CHAT
// ============================================

export const getAvailableVoices = async () => {
    const response = await secureFetch(`${API_BASE_URL}/voice/voices`);
    return await response.json();
};

export const textToSpeech = async (text, voice = 'nova', speed = 1.0) => {
    if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
    }
    
    if (speed < 0.25 || speed > 4.0) {
        throw new Error('Speed must be between 0.25 and 4.0');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/voice/speak`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: text.trim(), voice, speed })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate speech');
    }
    
    return await response.blob();
};

export const getVoiceStatus = async () => {
    const response = await secureFetch(`${API_BASE_URL}/voice/status`);
    return await response.json();
};

export const getVoiceStats = async () => {
    const user = getCurrentUser();
    const userId = user?._id || user?.id;
    
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/voice/stats/${userId}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// INTELLIGENCE ENGINE
// ============================================

export const getHealthInsights = async () => {
    const response = await secureFetch(`${API_BASE_URL}/intelligence/insights`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const analyzePatterns = async () => {
    const response = await secureFetch(`${API_BASE_URL}/intelligence/patterns`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getCrossSystemIntelligence = async () => {
    const response = await secureFetch(`${API_BASE_URL}/intelligence/cross-system`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// INTERVENTIONS
// ============================================

export const analyzeForInterventions = async () => {
    const response = await secureFetch(`${API_BASE_URL}/interventions/analyze`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getActiveInterventions = async () => {
    const response = await secureFetch(`${API_BASE_URL}/interventions/active`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getInterventionHistory = async () => {
    const response = await secureFetch(`${API_BASE_URL}/interventions/history`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const respondToIntervention = async (interventionId, response) => {
    if (!interventionId) {
        throw new Error('Intervention ID is required');
    }
    
    const res = await secureFetch(`${API_BASE_URL}/interventions/${interventionId}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ response })
    });
    return await res.json();
};

export const simulateIntervention = async () => {
    const response = await secureFetch(`${API_BASE_URL}/interventions/simulate`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// PREDICTIONS
// ============================================

export const getPredictions = async () => {
    const response = await secureFetch(`${API_BASE_URL}/predictions/all`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getHRVPrediction = async () => {
    const response = await secureFetch(`${API_BASE_URL}/predictions/hrv`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getIllnessRiskPrediction = async () => {
    const response = await secureFetch(`${API_BASE_URL}/predictions/illness`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getEnergyPrediction = async () => {
    const response = await secureFetch(`${API_BASE_URL}/predictions/energy`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getGoalCompletionPrediction = async (goalId) => {
    if (!goalId) {
        throw new Error('Goal ID is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/predictions/goal/${goalId}/completion`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// CORRELATION ENGINE
// ============================================

export const detectPatterns = async () => {
    const response = await secureFetch(`${API_BASE_URL}/correlation/patterns/detect`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getAllPatterns = async () => {
    const response = await secureFetch(`${API_BASE_URL}/correlation/patterns/all`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getSleepPerformanceCorrelation = async () => {
    const response = await secureFetch(`${API_BASE_URL}/correlation/sleep-performance`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getStressSpendingCorrelation = async () => {
    const response = await secureFetch(`${API_BASE_URL}/correlation/spending-stress`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getCalendarEnergyCorrelation = async () => {
    const response = await secureFetch(`${API_BASE_URL}/correlation/calendar-energy`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const startRealtimePatternDetection = async () => {
    const response = await secureFetch(`${API_BASE_URL}/correlation/patterns/real-time`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// MERCURY - HEALTH VITALS & RECOVERY
// ============================================

export const getLatestWearableData = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mercury/latest`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const syncWearables = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mercury/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getRecoveryScore = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mercury/recovery`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getHRVData = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mercury/hrv`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getSleepAnalysis = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mercury/sleep`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getVitalsOverview = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mercury/overview`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// VENUS - FITNESS & PERFORMANCE
// ============================================

export const getWorkoutAnalysis = async () => {
    const response = await secureFetch(`${API_BASE_URL}/venus/analysis`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const generateAIWorkout = async (type) => {
    if (!type) {
        throw new Error('Workout type is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/venus/generate-workout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type })
    });
    return await response.json();
};

export const getWorkoutRecommendations = async () => {
    const response = await secureFetch(`${API_BASE_URL}/venus/recommendations`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getPerformanceMetrics = async () => {
    const response = await secureFetch(`${API_BASE_URL}/venus/performance`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getNutritionRecommendations = async () => {
    const response = await secureFetch(`${API_BASE_URL}/venus/nutrition/recommendations`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const analyzeForm = async (exerciseData) => {
    if (!exerciseData) {
        throw new Error('Exercise data is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/venus/analyze-form`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(exerciseData)
    });
    return await response.json();
};

// ============================================
// EARTH - CALENDAR & TIME MANAGEMENT
// ============================================

export const getCalendarEvents = async () => {
    const response = await secureFetch(`${API_BASE_URL}/earth/calendar-events`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const optimizeSchedule = async () => {
    const response = await secureFetch(`${API_BASE_URL}/earth/optimize-schedule`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getTimeAnalysis = async () => {
    const response = await secureFetch(`${API_BASE_URL}/earth/time-analysis`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const scheduleWorkout = async (workoutData) => {
    if (!workoutData) {
        throw new Error('Workout data is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/earth/schedule-workout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData)
    });
    return await response.json();
};

// ============================================
// MARS - GOALS & HABITS
// ============================================

export const getGoalProgress = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mars/progress`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getGoalPredictions = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mars/predictions`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const createGoal = async (goalData) => {
    if (!goalData || !goalData.title) {
        throw new Error('Goal title is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/mars/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(goalData)
    });
    return await response.json();
};

export const getActiveGoals = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mars/goals/active`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const updateGoalProgress = async (goalId, progress) => {
    if (!goalId) {
        throw new Error('Goal ID is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/mars/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ progress })
    });
    return await response.json();
};

export const getHabitStreaks = async () => {
    const response = await secureFetch(`${API_BASE_URL}/mars/habits/streaks`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// JUPITER - FINANCE & WEALTH
// ============================================

export const getFinancialOverview = async () => {
    const response = await secureFetch(`${API_BASE_URL}/jupiter/overview`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getTransactions = async (days = 30) => {
    const response = await secureFetch(`${API_BASE_URL}/jupiter/transactions?days=${days}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getBudgetAnalysis = async () => {
    const response = await secureFetch(`${API_BASE_URL}/jupiter/budget`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getSpendingInsights = async () => {
    const response = await secureFetch(`${API_BASE_URL}/jupiter/insights`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// SATURN - LEGACY & LIFE PLANNING
// ============================================

export const getLifeTimeline = async () => {
    const response = await secureFetch(`${API_BASE_URL}/saturn/timeline`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const updateVision = async (visionData) => {
    if (!visionData) {
        throw new Error('Vision data is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/saturn/vision`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(visionData)
    });
    return await response.json();
};

export const getQuarterlyReview = async () => {
    const response = await secureFetch(`${API_BASE_URL}/saturn/quarterly-review`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getLifeWheelScore = async () => {
    const response = await secureFetch(`${API_BASE_URL}/saturn/life-wheel`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// HEALTH DATA
// ============================================

export const logHealthMetric = async (metricData) => {
    if (!metricData) {
        throw new Error('Metric data is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/health/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(metricData)
    });
    return await response.json();
};

export const getHealthHistory = async (metricType, days = 30) => {
    if (!metricType) {
        throw new Error('Metric type is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/health/history/${metricType}?days=${days}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// WEARABLES
// ============================================

export const connectFitbit = () => {
    // Open OAuth in new window for security
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
        `${API_BASE_URL}/wearables/connect/fitbit`,
        'Fitbit OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
    );
};

export const connectPolar = () => {
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
        `${API_BASE_URL}/wearables/connect/polar`,
        'Polar OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
    );
};

export const getWearableStatus = async () => {
    const response = await secureFetch(`${API_BASE_URL}/wearables/status`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const disconnectWearable = async (provider) => {
    if (!provider) {
        throw new Error('Provider is required');
    }
    
    const response = await secureFetch(`${API_BASE_URL}/wearables/disconnect/${provider}`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ============================================
// REMAINING ENDPOINTS (Validated & Secured)
// ============================================

export const getBiometricData = async () => {
    const response = await secureFetch(`${API_BASE_URL}/biometric/all`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const logBiometric = async (biometricData) => {
    if (!biometricData) throw new Error('Biometric data is required');
    const response = await secureFetch(`${API_BASE_URL}/biometric/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(biometricData)
    });
    return await response.json();
};

export const getCurrentRecoveryScore = async () => {
    const response = await secureFetch(`${API_BASE_URL}/recovery/score/current`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getRecoveryHistory = async () => {
    const response = await secureFetch(`${API_BASE_URL}/recovery/score/history`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getRecoveryRecommendations = async () => {
    const response = await secureFetch(`${API_BASE_URL}/recovery/recommendations`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const logWorkout = async (workoutData) => {
    if (!workoutData) throw new Error('Workout data is required');
    const response = await secureFetch(`${API_BASE_URL}/workouts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData)
    });
    return await response.json();
};

export const getRecentWorkouts = async (limit = 10) => {
    const response = await secureFetch(`${API_BASE_URL}/workouts/recent?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getWorkoutTemplates = async () => {
    const response = await secureFetch(`${API_BASE_URL}/workouts/templates`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const deleteWorkout = async (workoutId) => {
    if (!workoutId) throw new Error('Workout ID is required');
    const response = await secureFetch(`${API_BASE_URL}/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getExerciseLibrary = async () => {
    const response = await secureFetch(`${API_BASE_URL}/exercises/library`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const searchExercises = async (query) => {
    if (!query) throw new Error('Search query is required');
    const response = await secureFetch(`${API_BASE_URL}/exercises/search?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getAllGoals = async () => {
    const response = await secureFetch(`${API_BASE_URL}/goals`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const deleteGoal = async (goalId) => {
    if (!goalId) throw new Error('Goal ID is required');
    const response = await secureFetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const logMeasurement = async (measurementData) => {
    if (!measurementData) throw new Error('Measurement data is required');
    const response = await secureFetch(`${API_BASE_URL}/measurements`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(measurementData)
    });
    return await response.json();
};

export const getMeasurementHistory = async (type) => {
    if (!type) throw new Error('Measurement type is required');
    const response = await secureFetch(`${API_BASE_URL}/measurements/history/${type}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const logMeal = async (mealData) => {
    if (!mealData) throw new Error('Meal data is required');
    const response = await secureFetch(`${API_BASE_URL}/nutrition/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(mealData)
    });
    return await response.json();
};

export const getTodayNutrition = async () => {
    const response = await secureFetch(`${API_BASE_URL}/nutrition/today`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getNutritionHistory = async (days = 7) => {
    const response = await secureFetch(`${API_BASE_URL}/nutrition/history?days=${days}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getMealSuggestions = async () => {
    const response = await secureFetch(`${API_BASE_URL}/meals/suggestions`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const saveMealTemplate = async (mealData) => {
    if (!mealData) throw new Error('Meal data is required');
    const response = await secureFetch(`${API_BASE_URL}/meals/template`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(mealData)
    });
    return await response.json();
};

export const sendMessage = async (recipientId, message) => {
    if (!recipientId || !message) throw new Error('Recipient and message are required');
    const response = await secureFetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientId, message })
    });
    return await response.json();
};

export const getMessages = async () => {
    const response = await secureFetch(`${API_BASE_URL}/messages`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getSubscriptionStatus = async () => {
    const response = await secureFetch(`${API_BASE_URL}/subscription/status`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const upgradeSubscription = async (plan) => {
    if (!plan) throw new Error('Plan is required');
    const response = await secureFetch(`${API_BASE_URL}/subscription/upgrade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ plan })
    });
    return await response.json();
};

// ============================================
// UTILITY & HEALTH CHECK
// ============================================

export const getAPIHealth = async () => {
    const response = await secureFetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
    return await response.json();
};

export const testConnection = async () => {
    try {
        const response = await secureFetch(`${API_BASE_URL.replace('/api', '')}/`);
        return await response.json();
    } catch (error) {
        console.error('API Connection Error:', error);
        throw sanitizeError(error);
    }
};

// ============================================
// SECURITY UTILITIES EXPORT
// ============================================

export const checkTokenExpiration = () => {
    const token = secureStorage.getItem(TOKEN_KEY);
    return isTokenExpired(token);
};

export const forceTokenRefresh = async () => {
    return await refreshAuthToken();
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    // Auth
    login,
    register,
    logout,
    getAuthHeaders,
    getCurrentUser,
    updateUserProfile,
    checkTokenExpiration,
    forceTokenRefresh,
    
    // AI Systems
    sendChatMessage,
    getChatHistory,
    triggerProactiveCheck,
    getAvailableVoices,
    textToSpeech,
    getVoiceStatus,
    getVoiceStats,
    
    // Intelligence
    getHealthInsights,
    analyzePatterns,
    getCrossSystemIntelligence,
    analyzeForInterventions,
    getActiveInterventions,
    getInterventionHistory,
    respondToIntervention,
    simulateIntervention,
    
    // Predictions & Correlations
    getPredictions,
    getHRVPrediction,
    getIllnessRiskPrediction,
    getEnergyPrediction,
    detectPatterns,
    getAllPatterns,
    getSleepPerformanceCorrelation,
    getStressSpendingCorrelation,
    
    // Planets
    getLatestWearableData,
    syncWearables,
    getRecoveryScore,
    getWorkoutAnalysis,
    generateAIWorkout,
    getCalendarEvents,
    optimizeSchedule,
    getGoalProgress,
    getFinancialOverview,
    getLifeTimeline,
    
    // Core Features
    logWorkout,
    getRecentWorkouts,
    logMeal,
    getTodayNutrition,
    createGoal,
    getActiveGoals,
    updateGoalProgress,
    
    // Utility
    getAPIHealth,
    testConnection
};
