// src/api.js - Production API Integration with Voice Support
// Connects to Railway Backend: https://pal-backend-production.up.railway.app

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
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

export const getAuthHeaders = () => {
    const token = localStorage.getItem('phoenixToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// ========================================
// VOICE SERVICES (NEW - 4 FUNCTIONS)
// ========================================

/**
 * Get available TTS voices with metadata
 */
export const getAvailableVoices = async () => {
    const response = await fetch(`${API_BASE_URL}/voice/voices`);
    return await response.json();
};

/**
 * Convert text to speech using OpenAI TTS
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice ID (alloy, echo, fable, onyx, nova, shimmer)
 * @param {number} speed - Speech speed (0.25 - 4.0)
 * @returns {Promise<Blob>} Audio blob
 */
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

/**
 * Check if voice service is available
 */
export const getVoiceStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/voice/status`);
    return await response.json();
};

/**
 * Get voice usage statistics for current user
 */
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
// WORKOUT LOGGING
// ========================================

export const logWorkout = async (workoutData) => {
    const response = await fetch(`${API_BASE_URL}/workouts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            name: workoutData.name,
            type: workoutData.type || 'strength',
            exercises: workoutData.exercises,
            duration: workoutData.duration,
            notes: workoutData.notes,
            mood: workoutData.mood
        })
    });
    return await response.json();
};

export const getRecentWorkouts = async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/workouts/recent?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getLastWorkout = async (type) => {
    const response = await fetch(`${API_BASE_URL}/workouts/last/${type}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getWorkoutSuggestion = async (type) => {
    const response = await fetch(`${API_BASE_URL}/workouts/suggest/${type}`, {
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

// ========================================
// NUTRITION LOGGING
// ========================================

export const logMeal = async (mealData) => {
    const response = await fetch(`${API_BASE_URL}/nutrition/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            name: mealData.name,
            calories: mealData.calories,
            protein: mealData.protein,
            carbs: mealData.carbs,
            fat: mealData.fat,
            mealType: mealData.mealType,
            timestamp: mealData.timestamp || new Date().toISOString()
        })
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
// GOAL CREATION
// ========================================

export const createGoal = async (goalData) => {
    const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            title: goalData.title,
            type: goalData.type,
            target: goalData.target,
            deadline: goalData.deadline,
            metric: goalData.metric
        })
    });
    return await response.json();
};

export const getActiveGoals = async () => {
    const response = await fetch(`${API_BASE_URL}/goals/active`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const updateGoalProgress = async (goalId, progress) => {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ progress })
    });
    return await response.json();
};

// ========================================
// MERCURY - WEARABLES & HEALTH
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

// ========================================
// VENUS - WORKOUTS & NUTRITION
// ========================================

export const getWorkoutAnalysis = async () => {
    const response = await fetch(`${API_BASE_URL}/venus/analysis`, {
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

// ========================================
// EARTH - CALENDAR
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

// ========================================
// MARS - GOALS
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

// ========================================
// JUPITER - FINANCE
// ========================================

export const getFinancialOverview = async () => {
    const response = await fetch(`${API_BASE_URL}/jupiter/overview`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getStressSpendingCorrelation = async () => {
    const response = await fetch(`${API_BASE_URL}/jupiter/stress-spending`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// SATURN - LEGACY
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

// ========================================
// PHOENIX COMPANION (AI CHAT)
// ========================================

export const sendChatMessage = async (message, context = {}) => {
    const response = await fetch(`${API_BASE_URL}/phoenix-companion/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, context })
    });
    return await response.json();
};

export const getChatHistory = async (limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/phoenix-companion/history?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const triggerProactiveCheck = async () => {
    const response = await fetch(`${API_BASE_URL}/phoenix-companion/proactive-check`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// INTERVENTIONS
// ========================================

export const getActiveInterventions = async () => {
    const response = await fetch(`${API_BASE_URL}/interventions/active`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const analyzeForInterventions = async () => {
    const response = await fetch(`${API_BASE_URL}/interventions/analyze`, {
        method: 'POST',
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

// ========================================
// PREDICTIONS
// ========================================

export const getPredictions = async () => {
    const response = await fetch(`${API_BASE_URL}/predictions`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

export const getIllnessRiskPrediction = async () => {
    const response = await fetch(`${API_BASE_URL}/predictions/illness-risk`, {
        headers: getAuthHeaders()
    });
    return await response.json();
};

// ========================================
// INTELLIGENCE
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
