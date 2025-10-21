// src/api.js - Complete Frontend API Integration
// Connects to PAL Backend: https://pal-backend-production.up.railway.app

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : 'https://pal-backend-production.up.railway.app/api';

// ========================================
// AUTHENTICATION
// ========================================

export const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success && data.token) {
        localStorage.setItem('phoenixToken', data.token);
        localStorage.setItem('phoenixUser', JSON.stringify(data.user));
    }
    return data;
};

export const register = async (name, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'client' })
    });
    const data = await response.json();
    if (data.success && data.token) {
        localStorage.setItem('phoenixToken', data.token);
        localStorage.setItem('phoenixUser', JSON.stringify(data.user));
    }
    return data;
};

export const logout = () => {
    localStorage.removeItem('phoenixToken');
    localStorage.removeItem('phoenixUser');
};

export const getAuthHeaders = () => {
    const token = localStorage.getItem('phoenixToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// ========================================
// USER MANAGEMENT
// ========================================

export const getCurrentUser = async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const updateUserProfile = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
    });
    return await response.json();
};

// ========================================
// AI COMPANION
// ========================================

export const sendChatMessage = async (message, context = {}) => {
    const response = await fetch(`${API_BASE_URL}/companion/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, context })
    });
    return await response.json();
};

export const getChatHistory = async (limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/companion/history?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const triggerProactiveCheck = async () => {
    const response = await fetch(`${API_BASE_URL}/companion/proactive-check`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// VOICE CHAT
// ========================================

export const getAvailableVoices = async () => {
    const response = await fetch(`${API_BASE_URL}/voice/voices`);
    return await response.json();
};

export const textToSpeech = async (text, voice = 'nova', speed = 1.0) => {
    const response = await fetch(`${API_BASE_URL}/voice/speak`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text, voice, speed })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate speech');
    }
    
    return await response.blob();
};

export const getVoiceStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/voice/status`);
    return await response.json();
};

export const getVoiceStats = async () => {
    const user = JSON.parse(localStorage.getItem('phoenixUser') || '{}');
    const userId = user._id || user.id;
    
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${API_BASE_URL}/voice/stats/${userId}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// INTELLIGENCE ENGINE
// ========================================

export const getHealthInsights = async () => {
    const response = await fetch(`${API_BASE_URL}/intelligence/insights`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const analyzePatterns = async () => {
    const response = await fetch(`${API_BASE_URL}/intelligence/patterns`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getCrossSystemIntelligence = async () => {
    const response = await fetch(`${API_BASE_URL}/intelligence/cross-system`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// INTERVENTIONS
// ========================================

export const analyzeForInterventions = async () => {
    const response = await fetch(`${API_BASE_URL}/interventions/analyze`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getActiveInterventions = async () => {
    const response = await fetch(`${API_BASE_URL}/interventions/active`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getInterventionHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/interventions/history`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const respondToIntervention = async (interventionId, response) => {
    const res = await fetch(`${API_BASE_URL}/interventions/${interventionId}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ response })
    });
    return await res.json();
};

export const simulateIntervention = async () => {
    const response = await fetch(`${API_BASE_URL}/interventions/simulate`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// PREDICTIONS
// ========================================

export const getPredictions = async () => {
    const response = await fetch(`${API_BASE_URL}/predictions/all`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getHRVPrediction = async () => {
    const response = await fetch(`${API_BASE_URL}/predictions/hrv`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getIllnessRiskPrediction = async () => {
    const response = await fetch(`${API_BASE_URL}/predictions/illness`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getEnergyPrediction = async () => {
    const response = await fetch(`${API_BASE_URL}/predictions/energy`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getGoalCompletionPrediction = async (goalId) => {
    const response = await fetch(`${API_BASE_URL}/predictions/goal/${goalId}/completion`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// CORRELATION ENGINE
// ========================================

export const detectPatterns = async () => {
    const response = await fetch(`${API_BASE_URL}/correlation/patterns/detect`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getAllPatterns = async () => {
    const response = await fetch(`${API_BASE_URL}/correlation/patterns/all`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getSleepPerformanceCorrelation = async () => {
    const response = await fetch(`${API_BASE_URL}/correlation/sleep-performance`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getStressSpendingCorrelation = async () => {
    const response = await fetch(`${API_BASE_URL}/correlation/spending-stress`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getCalendarEnergyCorrelation = async () => {
    const response = await fetch(`${API_BASE_URL}/correlation/calendar-energy`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const startRealtimePatternDetection = async () => {
    const response = await fetch(`${API_BASE_URL}/correlation/patterns/real-time`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// MERCURY - HEALTH VITALS & RECOVERY
// ========================================

export const getLatestWearableData = async () => {
    const response = await fetch(`${API_BASE_URL}/mercury/latest`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const syncWearables = async () => {
    const response = await fetch(`${API_BASE_URL}/mercury/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getRecoveryScore = async () => {
    const response = await fetch(`${API_BASE_URL}/mercury/recovery`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getHRVData = async () => {
    const response = await fetch(`${API_BASE_URL}/mercury/hrv`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getSleepAnalysis = async () => {
    const response = await fetch(`${API_BASE_URL}/mercury/sleep`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getVitalsOverview = async () => {
    const response = await fetch(`${API_BASE_URL}/mercury/overview`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// VENUS - FITNESS & PERFORMANCE
// ========================================

export const getWorkoutAnalysis = async () => {
    const response = await fetch(`${API_BASE_URL}/venus/analysis`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const generateAIWorkout = async (type) => {
    const response = await fetch(`${API_BASE_URL}/venus/generate-workout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type })
    });
    return await response.json();
};

export const getWorkoutRecommendations = async () => {
    const response = await fetch(`${API_BASE_URL}/venus/recommendations`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getPerformanceMetrics = async () => {
    const response = await fetch(`${API_BASE_URL}/venus/performance`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getNutritionRecommendations = async () => {
    const response = await fetch(`${API_BASE_URL}/venus/nutrition/recommendations`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const analyzeForm = async (exerciseData) => {
    const response = await fetch(`${API_BASE_URL}/venus/analyze-form`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(exerciseData)
    });
    return await response.json();
};

// ========================================
// EARTH - CALENDAR & TIME MANAGEMENT
// ========================================

export const getCalendarEvents = async () => {
    const response = await fetch(`${API_BASE_URL}/earth/calendar-events`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const optimizeSchedule = async () => {
    const response = await fetch(`${API_BASE_URL}/earth/optimize-schedule`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getTimeAnalysis = async () => {
    const response = await fetch(`${API_BASE_URL}/earth/time-analysis`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const scheduleWorkout = async (workoutData) => {
    const response = await fetch(`${API_BASE_URL}/earth/schedule-workout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData)
    });
    return await response.json();
};

// ========================================
// MARS - GOALS & HABITS
// ========================================

export const getGoalProgress = async () => {
    const response = await fetch(`${API_BASE_URL}/mars/progress`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getGoalPredictions = async () => {
    const response = await fetch(`${API_BASE_URL}/mars/predictions`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const createGoal = async (goalData) => {
    const response = await fetch(`${API_BASE_URL}/mars/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(goalData)
    });
    return await response.json();
};

export const getActiveGoals = async () => {
    const response = await fetch(`${API_BASE_URL}/mars/goals/active`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const updateGoalProgress = async (goalId, progress) => {
    const response = await fetch(`${API_BASE_URL}/mars/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ progress })
    });
    return await response.json();
};

export const getHabitStreaks = async () => {
    const response = await fetch(`${API_BASE_URL}/mars/habits/streaks`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// JUPITER - FINANCE & WEALTH
// ========================================

export const getFinancialOverview = async () => {
    const response = await fetch(`${API_BASE_URL}/jupiter/overview`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getTransactions = async (days = 30) => {
    const response = await fetch(`${API_BASE_URL}/jupiter/transactions?days=${days}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getBudgetAnalysis = async () => {
    const response = await fetch(`${API_BASE_URL}/jupiter/budget`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getSpendingInsights = async () => {
    const response = await fetch(`${API_BASE_URL}/jupiter/insights`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// SATURN - LEGACY & LIFE PLANNING
// ========================================

export const getLifeTimeline = async () => {
    const response = await fetch(`${API_BASE_URL}/saturn/timeline`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const updateVision = async (visionData) => {
    const response = await fetch(`${API_BASE_URL}/saturn/vision`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(visionData)
    });
    return await response.json();
};

export const getQuarterlyReview = async () => {
    const response = await fetch(`${API_BASE_URL}/saturn/quarterly-review`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getLifeWheelScore = async () => {
    const response = await fetch(`${API_BASE_URL}/saturn/life-wheel`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// HEALTH DATA
// ========================================

export const logHealthMetric = async (metricData) => {
    const response = await fetch(`${API_BASE_URL}/health/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(metricData)
    });
    return await response.json();
};

export const getHealthHistory = async (metricType, days = 30) => {
    const response = await fetch(`${API_BASE_URL}/health/history/${metricType}?days=${days}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// WEARABLES
// ========================================

export const connectFitbit = async () => {
    window.location.href = `${API_BASE_URL}/wearables/connect/fitbit`;
};

export const connectPolar = async () => {
    window.location.href = `${API_BASE_URL}/wearables/connect/polar`;
};

export const getWearableStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/wearables/status`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const disconnectWearable = async (provider) => {
    const response = await fetch(`${API_BASE_URL}/wearables/disconnect/${provider}`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// BIOMETRICS
// ========================================

export const getBiometricData = async () => {
    const response = await fetch(`${API_BASE_URL}/biometric/all`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const logBiometric = async (biometricData) => {
    const response = await fetch(`${API_BASE_URL}/biometric/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(biometricData)
    });
    return await response.json();
};

// ========================================
// RECOVERY
// ========================================

export const getCurrentRecoveryScore = async () => {
    const response = await fetch(`${API_BASE_URL}/recovery/score/current`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getRecoveryHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/recovery/score/history`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getRecoveryRecommendations = async () => {
    const response = await fetch(`${API_BASE_URL}/recovery/recommendations`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// WORKOUTS
// ========================================

export const logWorkout = async (workoutData) => {
    const response = await fetch(`${API_BASE_URL}/workouts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData)
    });
    return await response.json();
};

export const getRecentWorkouts = async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/workouts/recent?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getWorkoutTemplates = async () => {
    const response = await fetch(`${API_BASE_URL}/workouts/templates`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const deleteWorkout = async (workoutId) => {
    const response = await fetch(`${API_BASE_URL}/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// EXERCISES
// ========================================

export const getExerciseLibrary = async () => {
    const response = await fetch(`${API_BASE_URL}/exercises/library`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const searchExercises = async (query) => {
    const response = await fetch(`${API_BASE_URL}/exercises/search?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// GOALS (Legacy endpoint support)
// ========================================

export const getAllGoals = async () => {
    const response = await fetch(`${API_BASE_URL}/goals`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const deleteGoal = async (goalId) => {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// MEASUREMENTS
// ========================================

export const logMeasurement = async (measurementData) => {
    const response = await fetch(`${API_BASE_URL}/measurements`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(measurementData)
    });
    return await response.json();
};

export const getMeasurementHistory = async (type) => {
    const response = await fetch(`${API_BASE_URL}/measurements/history/${type}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// NUTRITION
// ========================================

export const logMeal = async (mealData) => {
    const response = await fetch(`${API_BASE_URL}/nutrition/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(mealData)
    });
    return await response.json();
};

export const getTodayNutrition = async () => {
    const response = await fetch(`${API_BASE_URL}/nutrition/today`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getNutritionHistory = async (days = 7) => {
    const response = await fetch(`${API_BASE_URL}/nutrition/history?days=${days}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// MEALS
// ========================================

export const getMealSuggestions = async () => {
    const response = await fetch(`${API_BASE_URL}/meals/suggestions`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const saveMealTemplate = async (mealData) => {
    const response = await fetch(`${API_BASE_URL}/meals/template`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(mealData)
    });
    return await response.json();
};

// ========================================
// MESSAGES
// ========================================

export const sendMessage = async (recipientId, message) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientId, message })
    });
    return await response.json();
};

export const getMessages = async () => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// SUBSCRIPTION
// ========================================

export const getSubscriptionStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/subscription/status`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const upgradeSubscription = async (plan) => {
    const response = await fetch(`${API_BASE_URL}/subscription/upgrade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ plan })
    });
    return await response.json();
};

// ========================================
// UTILITY
// ========================================

export const getAPIHealth = async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
    return await response.json();
};

export const testConnection = async () => {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
        return await response.json();
    } catch (error) {
        console.error('API Connection Error:', error);
        throw error;
    }
};

export default {
    // Auth
    login,
    register,
    logout,
    getAuthHeaders,
    getCurrentUser,
    updateUserProfile,
    
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
