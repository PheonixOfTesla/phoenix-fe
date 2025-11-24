/* ============================================
   PHOENIX CONSCIOUSNESS CLIENT
   Maintains persistent connection to backend consciousness
   Receives proactive updates and orchestration commands
   ============================================ */

class ConsciousnessClient {
    constructor() {
        this.isConnected = false;
        this.orchestrationCache = null;
        this.lastOrchestrationTime = 0;
        this.sessionId = this.generateSessionId();
        this.biometricData = {};

        // ✨ WebSocket for real-time consciousness streaming
        this.ws = null;
        this.wsReconnectAttempts = 0;
        this.wsMaxReconnectAttempts = 10;
        this.wsReconnectDelay = 2000;
        this.wsHeartbeatInterval = null;

        console.log('[Consciousness] Client initialized');
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /* ============================================
       ORCHESTRATION - Get UI instructions from backend
       ============================================ */
    async orchestrate(context = {}, voiceQuery = null) {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                console.warn('[Consciousness] No token, skipping orchestration');
                return null;
            }

            // Throttle orchestration calls (max once per 5 seconds unless voice query)
            const now = Date.now();
            if (!voiceQuery && (now - this.lastOrchestrationTime) < 5000) {
                console.log('[Consciousness] Using cached orchestration');
                return this.orchestrationCache;
            }

            const requestBody = {
                context: {
                    time: new Date().toISOString(),
                    location: context.location || 'unknown',
                    activity: context.activity || 'unknown',
                    ...context
                },
                biometrics: this.biometricData
            };

            if (voiceQuery) {
                requestBody.voiceQuery = voiceQuery;
            }

            console.log('[Consciousness] Requesting orchestration...', requestBody);

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/interface/orchestrate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Orchestration failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.orchestration) {
                this.orchestrationCache = data.orchestration;
                this.lastOrchestrationTime = now;
                console.log('[Consciousness] Orchestration received:', data.orchestration);
                return data.orchestration;
            }

            return null;

        } catch (error) {
            console.error('[Consciousness] Orchestration error:', error);
            return null;
        }
    }

    /* ============================================
       WEBSOCKET CONNECTION - Real-time consciousness streaming
       ============================================ */
    connectWebSocket() {
        const token = localStorage.getItem('phoenixToken');
        if (!token) {
            console.warn('[Consciousness] No token, skipping WebSocket connection');
            return;
        }

        // Determine WebSocket URL from API base URL
        const apiBase = window.PhoenixConfig.API_BASE_URL;
        const wsBase = apiBase.replace(/^https/, 'wss').replace(/^http/, 'ws');
        const wsUrl = `${wsBase}/phoenix-stream?token=${encodeURIComponent(token)}`;

        console.log('[Consciousness] 🔌 Connecting to Phoenix WebSocket...');

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[Consciousness] ✅ WebSocket connected - Real-time consciousness ACTIVE');
                this.isConnected = true;
                this.wsReconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('[Consciousness] Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[Consciousness] WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('[Consciousness] WebSocket disconnected');
                this.isConnected = false;
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('[Consciousness] WebSocket connection failed:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.wsReconnectAttempts >= this.wsMaxReconnectAttempts) {
            console.error('[Consciousness] Max reconnection attempts reached. Using HTTP polling fallback.');
            return;
        }

        this.wsReconnectAttempts++;
        const delay = this.wsReconnectDelay * this.wsReconnectAttempts;
        console.log(`[Consciousness] Reconnecting in ${delay}ms... (Attempt ${this.wsReconnectAttempts}/${this.wsMaxReconnectAttempts})`);

        setTimeout(() => {
            this.connectWebSocket();
        }, delay);
    }

    handleWebSocketMessage(message) {
        console.log('[Consciousness] 📡 Real-time message received:', message.type);

        switch (message.type) {
            case 'CELEBRATION':
                this.handleCelebration(message.data);
                break;

            case 'PATTERN_DETECTED':
                this.handlePatternDetected(message.data);
                break;

            case 'CRITICAL_ALERT':
                this.handleCriticalAlert(message.data);
                break;

            case 'WIDGET_CREATE':
                this.handleWidgetCreate(message.data);
                break;

            case 'CONSCIOUSNESS_UPDATE':
                this.handleConsciousnessUpdate(message.data);
                break;

            case 'PROCESSING_STATUS':
                this.handleProcessingStatus(message.data);
                break;

            case 'HEARTBEAT':
                // Backend heartbeat - keep connection alive
                break;

            default:
                console.warn('[Consciousness] Unknown message type:', message.type);
        }
    }

    handleCelebration(data) {
        console.log('[Consciousness] 🎉 CELEBRATION:', data.message);

        // Show celebration widget
        if (window.widgetManager && data.widgetConfig) {
            window.widgetManager.createWidget(data.widgetConfig);
        }

        // Show confetti if available
        if (window.showConfetti) {
            window.showConfetti();
        }

        // Play celebration sound if available
        if (window.phoenixVoice && window.phoenixVoice.speak) {
            window.phoenixVoice.speak(data.message, { priority: 'high' });
        }
    }

    handlePatternDetected(data) {
        console.log('[Consciousness] 🔍 PATTERN DETECTED:', data.pattern);

        // Create widget if config provided
        if (window.widgetManager && data.widgetConfig) {
            window.widgetManager.createWidget(data.widgetConfig);
        }
    }

    handleCriticalAlert(data) {
        console.log('[Consciousness] 🚨 CRITICAL ALERT:', data.message);

        // Show critical alert widget
        if (window.widgetManager && data.widgetConfig) {
            window.widgetManager.createWidget(data.widgetConfig);
        }

        // Play alert sound
        if (window.phoenixVoice && window.phoenixVoice.speak) {
            window.phoenixVoice.speak(data.message, { priority: 'urgent' });
        }
    }

    handleWidgetCreate(data) {
        console.log('[Consciousness] 🎨 CREATE WIDGET:', data.id);

        if (window.widgetManager) {
            window.widgetManager.createWidget(data);
        }
    }

    handleConsciousnessUpdate(data) {
        console.log('[Consciousness] 🧠 CONSCIOUSNESS UPDATE:', data);

        // Update orchestration cache
        if (data.orchestration) {
            this.orchestrationCache = data.orchestration;
            this.lastOrchestrationTime = Date.now();
        }
    }

    handleProcessingStatus(data) {
        console.log('[Consciousness] ⚙️ PROCESSING STATUS:', data.status);

        // Show loading indicator if processing
        if (data.status === 'processing' && window.showProcessingIndicator) {
            window.showProcessingIndicator();
        } else if (data.status === 'complete' && window.hideProcessingIndicator) {
            window.hideProcessingIndicator();
        }
    }

    disconnectWebSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    /* ============================================
       BIOMETRIC UPDATE - Update consciousness with latest biometrics
       ============================================ */
    updateBiometrics(biometrics) {
        this.biometricData = {
            ...this.biometricData,
            ...biometrics,
            lastUpdated: new Date().toISOString()
        };

        console.log('[Consciousness] Biometrics updated:', this.biometricData);

        // Trigger re-orchestration if significant change
        if (this.shouldReOrchestrate(biometrics)) {
            console.log('[Consciousness] Significant biometric change detected, re-orchestrating...');
            this.orchestrate();
        }
    }

    shouldReOrchestrate(newBiometrics) {
        if (!this.biometricData) return true;

        // Re-orchestrate if recovery drops below 60 or rises above 80
        if (newBiometrics.recoveryScore) {
            const oldScore = this.biometricData.recoveryScore || 70;
            if ((oldScore >= 60 && newBiometrics.recoveryScore < 60) ||
                (oldScore < 80 && newBiometrics.recoveryScore >= 80)) {
                return true;
            }
        }

        // Re-orchestrate if HRV changes significantly (>15%)
        if (newBiometrics.hrv && this.biometricData.hrv) {
            const change = Math.abs(newBiometrics.hrv - this.biometricData.hrv) / this.biometricData.hrv;
            if (change > 0.15) return true;
        }

        return false;
    }

    /* ============================================
       INTERACTION LOGGING - Track user engagement
       ============================================ */
    async logInteraction(widgetId, action, additionalData = {}) {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) return;

            const interaction = {
                sessionId: this.sessionId,
                widgetId,
                action,
                context: {
                    time: new Date(),
                    timeOfDay: this.getTimeOfDay(),
                    displayedWidgets: additionalData.displayedWidgets || [],
                    layoutType: additionalData.layoutType || 'expanded'
                },
                dwellTime: additionalData.dwellTime || 0,
                interactionDepth: additionalData.interactionDepth || 0,
                outcome: additionalData.outcome || 'neutral',
                widgetData: additionalData.widgetData || {},
                biometrics: this.biometricData
            };

            await fetch(`${window.PhoenixConfig.API_BASE_URL}/interface/interaction`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(interaction)
            });

            console.log('[Consciousness] Interaction logged:', widgetId, action);

        } catch (error) {
            console.error('[Consciousness] Interaction logging error:', error);
        }
    }

    /* ============================================
       PREFERENCES - Get/Update user preferences
       ============================================ */
    async getPreferences() {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) return null;

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/interface/preferences`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.preferences;
            }

            return null;

        } catch (error) {
            console.error('[Consciousness] Get preferences error:', error);
            return null;
        }
    }

    async updatePreferences(preferences) {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) return false;

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/interface/preferences`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });

            if (response.ok) {
                console.log('[Consciousness] Preferences updated');
                // Re-orchestrate with new preferences
                this.orchestrate();
                return true;
            }

            return false;

        } catch (error) {
            console.error('[Consciousness] Update preferences error:', error);
            return false;
        }
    }

    async updateDayPriorities(day, priorities) {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) return false;

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/interface/priorities/${day}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ priorities })
            });

            if (response.ok) {
                console.log(`[Consciousness] ${day} priorities updated:`, priorities);
                return true;
            }

            return false;

        } catch (error) {
            console.error('[Consciousness] Update priorities error:', error);
            return false;
        }
    }

    /* ============================================
       UTILITIES
       ============================================ */
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }

    /* ============================================
       AUTO ORCHESTRATION - Periodic re-orchestration
       ============================================ */
    startAutoOrchestration(intervalMinutes = 5) {
        setInterval(() => {
            console.log('[Consciousness] Auto re-orchestration');
            this.orchestrate();
        }, intervalMinutes * 60 * 1000);

        console.log(`[Consciousness] Auto orchestration enabled (every ${intervalMinutes} minutes)`);
    }
}

// Initialize consciousness client
let consciousnessClient;

document.addEventListener('DOMContentLoaded', () => {
    consciousnessClient = new ConsciousnessClient();
    window.consciousnessClient = consciousnessClient;

    // ✨ Connect to WebSocket for real-time consciousness streaming
    consciousnessClient.connectWebSocket();

    // Start auto re-orchestration every 5 minutes (HTTP fallback)
    consciousnessClient.startAutoOrchestration(5);

    // Initial orchestration
    consciousnessClient.orchestrate();

    console.log('[Consciousness] Client ready');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsciousnessClient;
}
