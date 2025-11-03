/**
 * Phoenix Configuration
 * Central configuration for all API endpoints and settings
 */

window.PhoenixConfig = {
    // Backend API URL (Railway Production)
    API_BASE_URL: 'https://pal-backend-production.up.railway.app/api',

    // WebSocket URLs
    WS_URL: 'wss://pal-backend-production.up.railway.app/ws',
    VOICE_WS_URL: 'wss://pal-backend-production.up.railway.app/ws/voice',

    // Environment
    NODE_ENV: 'production',

    // Feature flags
    FEATURES: {
        voiceInterface: true,
        aiInsights: true,
        integrations: true
    }
};

console.log('✅ Phoenix Config Loaded:', window.PhoenixConfig.API_BASE_URL);
