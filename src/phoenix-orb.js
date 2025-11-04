/**
 * ========================================
 * PHOENIX ORB - UNIVERSAL AI ASSISTANT
 * ========================================
 * Version: 2.0.0
 * Features: Wake Word, TTS, Voice+Text, Behavior Tracking, Universal NL, Planet-Adaptive, SMS
 * Backend: Railway Production API
 * ========================================
 */

class PhoenixOrb {
    constructor() {
        this.currentPlanet = this.detectPlanet();
        this.isExpanded = false;
        this.isListening = false;
        this.recognition = null;
        this.conversationHistory = [];
        this.activityLog = [];
        this.activityBatchQueue = [];

        // NEW: Wake Word Detection & TTS
        this.wakeWordDetector = null;
        this.tts = null;
        this.userName = null; // User's name for personalization

        // Initialize
        this.init();
    }

    /**
     * Detect current planet from URL
     */
    detectPlanet() {
        const path = window.location.pathname;
        if (path.includes('mercury')) return 'mercury';
        if (path.includes('venus')) return 'venus';
        if (path.includes('earth')) return 'earth';
        if (path.includes('mars')) return 'mars';
        if (path.includes('jupiter')) return 'jupiter';
        if (path.includes('saturn')) return 'saturn';
        return 'mercury'; // default
    }

    /**
     * Initialize Phoenix Orb
     */
    async init() {
        console.log(`🔥 Phoenix Orb initializing on ${this.currentPlanet.toUpperCase()}...`);

        // Fetch user name for personalization
        await this.fetchUserName();

        // Create orb UI
        this.createOrbUI();

        // Initialize voice recognition
        this.initVoiceRecognition();

        // NEW: Initialize TTS (Text-to-Speech)
        this.initTTS();

        // NEW: Initialize Wake Word Detection
        this.initWakeWordDetection();

        // Start behavior tracking
        this.startBehaviorTracking();

        // Set up activity batch sending
        setInterval(() => this.sendActivityBatch(), 5000); // Send every 5 seconds

        console.log('✅ Phoenix Orb ready');

        // Check for post-navigation greeting
        this.checkPostNavigationGreeting();
    }

    /**
     * Fetch user name from API
     */
    async fetchUserName() {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                console.log('⚠️  No auth token, skipping user name fetch');
                return;
            }

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userName = data.user?.name || data.user?.email?.split('@')[0] || 'there';
                console.log(`👤 User name loaded: ${this.userName}`);
            }
        } catch (error) {
            console.error('Error fetching user name:', error);
            this.userName = 'there'; // Fallback
        }
    }

    /**
     * Initialize Text-to-Speech
     */
    initTTS() {
        if (typeof VoiceTTS === 'undefined') {
            console.error('❌ VoiceTTS not loaded');
            return;
        }

        this.tts = new VoiceTTS({
            rate: 1.1, // Slightly faster for responsiveness
            pitch: 1.0,
            volume: 0.8
        });

        console.log('🔊 TTS initialized');
    }

    /**
     * Initialize Wake Word Detection
     */
    initWakeWordDetection() {
        if (typeof WakeWordDetector === 'undefined') {
            console.error('❌ WakeWordDetector not loaded');
            return;
        }

        this.wakeWordDetector = new WakeWordDetector({
            wakeWords: ['phoenix', 'hey phoenix', 'ok phoenix'],
            confidenceThreshold: 0.6
        });

        // Handle wake word detection
        this.wakeWordDetector.onWakeWord((detection) => {
            console.log(`🔥 Wake word detected: "${detection.transcript}"`);

            // Expand panel if not expanded
            if (!this.isExpanded) {
                this.togglePanel();
            }

            // Switch to voice tab
            this.switchTab('voice');

            // Start listening for command
            this.startVoiceCommand();

            // Visual feedback
            this.showWakeWordDetected();
        });

        // Start wake word detection
        this.wakeWordDetector.start();

        console.log('🎤 Wake word detection started');
    }

    /**
     * Show visual feedback for wake word detection
     */
    showWakeWordDetected() {
        const orb = document.querySelector('.phoenix-orb');
        if (orb) {
            orb.classList.add('listening');
            setTimeout(() => {
                if (!this.isListening) {
                    orb.classList.remove('listening');
                }
            }, 2000);
        }
    }

    /**
     * Start listening for voice command after wake word
     */
    startVoiceCommand() {
        // Trigger voice recognition
        this.toggleVoice();
    }

    /**
     * Start voice interaction when clicking the center orb (like Siri)
     */
    startVoiceFromOrb() {
        console.log('🎤 Orb clicked - starting voice interaction');

        const orb = document.querySelector('.phoenix-orb');

        // Add immediate visual feedback (animate like Siri)
        orb.classList.add('listening');

        // Start voice recognition
        if (!this.isListening) {
            this.toggleVoice();
        }
    }

    /**
     * Get personalized greeting
     */
    getPersonalizedGreeting() {
        const greetings = [
            `Hey ${this.userName || 'there'}! I'm Phoenix, your AI assistant.`,
            `Welcome to ${this.currentPlanet.charAt(0).toUpperCase() + this.currentPlanet.slice(1)}, ${this.userName || 'there'}.`,
            `Hi ${this.userName || 'there'}! Phoenix here. What can I help you with?`,
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Speak text using TTS
     */
    async speak(text, options = {}) {
        if (!this.tts) {
            console.log('🔇 TTS not available');
            return;
        }

        try {
            const orb = document.querySelector('.phoenix-orb');

            // Add speaking animation (like Siri)
            orb.classList.add('speaking');

            await this.tts.speak(text, options);

            // Remove speaking animation when done
            orb.classList.remove('speaking');
        } catch (error) {
            console.error('TTS error:', error);
            // Remove animation even if error
            document.querySelector('.phoenix-orb')?.classList.remove('speaking');
        }
    }

    /**
     * Create Orb UI
     */
    createOrbUI() {
        const container = document.createElement('div');
        container.id = 'phoenixOrbContainer';
        container.className = `planet-${this.currentPlanet}`;

        container.innerHTML = `
            <!-- Collapsed Orb -->
            <div class="phoenix-orb" onclick="phoenixOrb.startVoiceFromOrb()" data-activity="0">
                <svg class="phoenix-orb-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>

            <!-- Expanded Panel -->
            <div class="phoenix-panel">
                <div class="phoenix-panel-header">
                    <div class="phoenix-panel-title">
                        Phoenix AI
                        <span class="phoenix-planet-badge">${this.currentPlanet}</span>
                    </div>
                    <button class="phoenix-close" onclick="phoenixOrb.togglePanel()">×</button>
                </div>

                <div class="phoenix-input-tabs">
                    <button class="phoenix-tab active" onclick="phoenixOrb.switchTab('voice')">
                        🎤 Voice
                    </button>
                    <button class="phoenix-tab" onclick="phoenixOrb.switchTab('text')">
                        💬 Text
                    </button>
                </div>

                <div class="phoenix-panel-content">
                    <!-- Voice Input -->
                    <div class="phoenix-voice-input active">
                        <button class="phoenix-voice-button" onclick="phoenixOrb.toggleVoice()">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            </svg>
                        </button>
                        <div class="phoenix-transcript" id="phoenixTranscript">
                            Click the button and speak...
                        </div>
                    </div>

                    <!-- Text Input -->
                    <div class="phoenix-text-input">
                        <textarea
                            class="phoenix-input-field"
                            id="phoenixTextInput"
                            placeholder="Ask Phoenix anything..."
                        ></textarea>
                        <button class="phoenix-send-button" onclick="phoenixOrb.sendTextMessage()">
                            Send
                        </button>
                    </div>

                    <!-- Response Area -->
                    <div class="phoenix-response" id="phoenixResponse" style="display:none;">
                        <div class="phoenix-intent-badge" id="phoenixIntent"></div>
                        <div class="phoenix-response-text" id="phoenixResponseText"></div>
                    </div>

                    <!-- Activity Log -->
                    <div class="phoenix-activity">
                        <div class="phoenix-activity-title">Recent Activity</div>
                        <div id="phoenixActivityLog"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    /**
     * Initialize Voice Recognition
     */
    initVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            document.querySelector('.phoenix-voice-button').classList.add('listening');
            document.querySelector('.phoenix-orb').classList.add('listening');
            this.logActivity('voice_started', { planet: this.currentPlanet });
        };

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            document.getElementById('phoenixTranscript').textContent = transcript;

            // Process final results
            if (event.results[event.results.length - 1].isFinal) {
                this.processCommand(transcript, 'voice');
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopVoice();
            this.logActivity('voice_error', { error: event.error });
        };

        this.recognition.onend = () => {
            this.stopVoice();
        };
    }

    /**
     * Start Behavior Tracking - EVERYTHING
     */
    startBehaviorTracking() {
        console.log('📊 Behavior tracking active - Phoenix is watching...');

        // Track all clicks
        document.addEventListener('click', (e) => {
            const target = e.target;
            const elementInfo = {
                tag: target.tagName,
                id: target.id,
                class: target.className,
                text: target.textContent?.substring(0, 50),
                planet: this.currentPlanet
            };
            this.logActivity('click', elementInfo);
            this.updateActivityIndicator();
        }, true);

        // Track all inputs
        document.addEventListener('input', (e) => {
            if (e.target.id === 'phoenixTextInput') return; // Ignore Phoenix's own input

            const elementInfo = {
                tag: e.target.tagName,
                id: e.target.id,
                name: e.target.name,
                type: e.target.type,
                planet: this.currentPlanet
            };
            this.logActivity('input', elementInfo);
        }, true);

        // Track scrolling (throttled)
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
                this.logActivity('scroll', { percent: scrollPercent, planet: this.currentPlanet });
            }, 1000);
        }, { passive: true });

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            this.logActivity('visibility', {
                hidden: document.hidden,
                planet: this.currentPlanet
            });
        });

        // Track navigation
        window.addEventListener('beforeunload', () => {
            this.sendActivityBatch(true); // Force send before leaving
        });
    }

    /**
     * Log Activity (queued for batch sending)
     */
    logActivity(type, data) {
        const activity = {
            type,
            data,
            timestamp: new Date().toISOString(),
            planet: this.currentPlanet,
            url: window.location.href
        };

        this.activityLog.unshift(activity);
        if (this.activityLog.length > 20) {
            this.activityLog.pop();
        }

        this.activityBatchQueue.push(activity);

        // Update UI
        this.updateActivityUI();
    }

    /**
     * Send Activity Batch to Backend
     */
    async sendActivityBatch(force = false) {
        if (this.activityBatchQueue.length === 0 && !force) return;

        const batch = [...this.activityBatchQueue];
        this.activityBatchQueue = [];

        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) return; // Skip if not authenticated

            // Send to behavior tracking endpoint
            await fetch(`${window.PhoenixConfig.API_BASE_URL}/phoenix/behavior/track`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    behaviorType: 'user_activity',
                    context: {
                        planet: this.currentPlanet,
                        activities: batch
                    },
                    metadata: {
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            console.log(`📤 Sent ${batch.length} activities to backend`);
        } catch (error) {
            console.error('Failed to send activity batch:', error);
            // Re-queue on failure
            this.activityBatchQueue.unshift(...batch);
        }
    }

    /**
     * Update Activity Indicator
     */
    updateActivityIndicator() {
        const orb = document.querySelector('.phoenix-orb');
        orb.classList.add('has-activity');

        // Count activities in last 60 seconds
        const recent = this.activityLog.filter(a =>
            (Date.now() - new Date(a.timestamp).getTime()) < 60000
        ).length;

        orb.setAttribute('data-activity', recent);

        // Fade out after 2 seconds
        setTimeout(() => {
            if (!this.isListening) {
                orb.classList.remove('has-activity');
            }
        }, 2000);
    }

    /**
     * Update Activity UI in Panel
     */
    updateActivityUI() {
        const activityLogEl = document.getElementById('phoenixActivityLog');
        if (!activityLogEl) return;

        const html = this.activityLog.slice(0, 5).map(activity => {
            const time = new Date(activity.timestamp).toLocaleTimeString();
            return `<div class="phoenix-activity-item">${activity.type} - ${time}</div>`;
        }).join('');

        activityLogEl.innerHTML = html || '<div class="phoenix-activity-item">No activity yet</div>';
    }

    /**
     * Toggle Panel
     */
    togglePanel() {
        this.isExpanded = !this.isExpanded;
        const container = document.getElementById('phoenixOrbContainer');

        if (this.isExpanded) {
            container.classList.add('expanded');
            this.logActivity('panel_opened', { planet: this.currentPlanet });
        } else {
            container.classList.remove('expanded');
            this.stopVoice();
            this.logActivity('panel_closed', { planet: this.currentPlanet });
        }
    }

    /**
     * Switch Input Tab
     */
    switchTab(tab) {
        // Update tabs
        document.querySelectorAll('.phoenix-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        // Update inputs
        document.querySelector('.phoenix-voice-input').classList.toggle('active', tab === 'voice');
        document.querySelector('.phoenix-text-input').classList.toggle('active', tab === 'text');

        this.logActivity('tab_switched', { tab, planet: this.currentPlanet });
    }

    /**
     * Toggle Voice
     */
    toggleVoice() {
        if (this.isListening) {
            this.stopVoice();
        } else {
            this.startVoice();
        }
    }

    /**
     * Start Voice
     */
    startVoice() {
        if (!this.recognition) {
            alert('Voice recognition not supported in this browser');
            return;
        }

        this.recognition.start();
        document.getElementById('phoenixTranscript').textContent = 'Listening...';
    }

    /**
     * Stop Voice
     */
    stopVoice() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        this.isListening = false;
        document.querySelector('.phoenix-voice-button')?.classList.remove('listening');
        document.querySelector('.phoenix-orb')?.classList.remove('listening');
    }

    /**
     * Send Text Message
     */
    sendTextMessage() {
        const input = document.getElementById('phoenixTextInput');
        const message = input.value.trim();

        if (!message) return;

        // Show user's message immediately (like ChatGPT)
        const responseEl = document.getElementById('phoenixResponse');
        const responseTextEl = document.getElementById('phoenixResponseText');
        responseTextEl.innerHTML = `<div style="color:#00ffff;margin-bottom:10px">You: ${message}</div><div style="color:#888">Phoenix is thinking...</div>`;
        responseEl.style.display = 'block';

        input.value = '';
        this.processCommand(message, 'text');
    }

    /**
     * Process Command via Universal NL
     */
    async processCommand(message, inputType) {
        console.log(`💬 Processing command: "${message}" (${inputType})`);

        // Show processing state
        const orb = document.querySelector('.phoenix-orb');
        orb.classList.add('processing');

        // Hide response
        document.getElementById('phoenixResponse').style.display = 'none';

        // Log activity
        this.logActivity('command', { message, inputType, planet: this.currentPlanet });

        try {
            const token = localStorage.getItem('phoenixToken');

            if (!token) {
                this.showResponse('error', 'Not authenticated', 'Please log in to use Phoenix AI');
                return;
            }

            // Send to Universal NL endpoint with 10-second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/phoenix/universal`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    conversationHistory: this.conversationHistory.slice(-5),
                    context: {
                        currentPlanet: this.currentPlanet,
                        url: window.location.href,
                        inputType
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            orb.classList.remove('processing');

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            console.log('🌟 Universal NL Response:', result);

            // Show response
            this.showResponse(result.intent, result.response, result.data);

            // Add to conversation history
            this.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: result.response }
            );

            // Keep only last 10 messages
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            // Log successful command
            this.logActivity('command_success', {
                message,
                intent: result.intent,
                planet: this.currentPlanet
            });

            // Auto-navigate if needed
            this.handleAutoNavigation(result);

        } catch (error) {
            console.error('❌ Command processing error:', error);
            orb.classList.remove('processing');

            // Handle timeout specifically
            if (error.name === 'AbortError') {
                this.showResponse('error', 'Response timeout', 'Phoenix took too long to respond. Try again.');
            } else {
                this.showResponse('error', 'Error processing command', error.message);
            }

            this.logActivity('command_error', {
                message,
                error: error.message,
                planet: this.currentPlanet
            });
        }
    }

    /**
     * Show Response
     */
    showResponse(intent, response, data) {
        const responseEl = document.getElementById('phoenixResponse');
        const intentEl = document.getElementById('phoenixIntent');
        const responseTextEl = document.getElementById('phoenixResponseText');

        if (typeof intent === 'object') {
            intentEl.textContent = `${intent.planet} | ${intent.action} (${Math.round(intent.confidence * 100)}%)`;
        } else {
            intentEl.textContent = intent;
        }

        // Add personalization to response
        const personalizedResponse = this.personalizeResponse(response);
        responseTextEl.textContent = personalizedResponse;
        responseEl.style.display = 'block';

        // Speak response using TTS
        this.speak(personalizedResponse);
    }

    /**
     * Personalize response with user's name
     */
    personalizeResponse(response) {
        if (!response) return response;

        // Don't add name if response already includes it
        const hasName = this.userName && response.toLowerCase().includes(this.userName.toLowerCase());
        if (hasName || !this.userName) {
            return response;
        }

        // Add name at beginning for certain response types
        if (response.length < 50 && !response.endsWith('?')) {
            return `${response}, ${this.userName}`;
        }

        return response;
    }

    /**
     * Handle Auto-Navigation
     */
    handleAutoNavigation(result) {
        // ⭐ NEW: Check for navigation command from backend FIRST
        if (result.navigation) {
            const { target, planetName, action } = result.navigation;
            console.log(`🧭 Navigation command received: ${target} (${action})`);

            const planetMap = {
                'mercury': 'mercury.html',
                'venus': 'venus.html',
                'earth': 'earth.html',
                'mars': 'mars.html',
                'jupiter': 'jupiter.html',
                'saturn': 'saturn.html',
                'uranus': 'uranus.html',
                'neptune': 'neptune.html'
            };

            const targetUrl = planetMap[target];
            if (targetUrl && !window.location.href.includes(targetUrl)) {
                // Pre-navigation announcement
                const announcement = `Taking you to ${planetName} now, ${this.userName || 'there'}`;
                this.speak(announcement);

                setTimeout(() => {
                    console.log(`🚀 Auto-navigating to ${targetUrl}`);
                    // Store greeting flag for post-navigation
                    sessionStorage.setItem('phoenixNavigated', 'true');
                    sessionStorage.setItem('phoenixTargetPlanet', target);
                    sessionStorage.setItem('phoenixFromVoice', 'true');
                    window.location.href = targetUrl;
                }, 2000);
            }
            return;
        }

        // ⭐ LEGACY: Fallback to old intent-based navigation
        if (!result.intent) return;

        const navigationActions = ['open', 'show', 'display', 'view', 'navigate'];
        if (navigationActions.some(action => result.intent.action?.toLowerCase().includes(action))) {
            const planetMap = {
                'mercury': 'mercury.html',
                'venus': 'venus.html',
                'earth': 'earth.html',
                'mars': 'mars.html',
                'jupiter': 'jupiter.html',
                'saturn': 'saturn.html',
                'uranus': 'uranus.html',
                'neptune': 'neptune.html'
            };

            const targetUrl = planetMap[result.intent.planet];
            if (targetUrl && !window.location.href.includes(targetUrl)) {
                // Pre-navigation announcement
                const planetName = result.intent.planet.charAt(0).toUpperCase() + result.intent.planet.slice(1);
                const announcement = `Taking you to ${planetName} now, ${this.userName || 'there'}`;
                this.speak(announcement);

                setTimeout(() => {
                    console.log(`🚀 Auto-navigating to ${targetUrl}`);
                    // Store greeting flag for post-navigation
                    sessionStorage.setItem('phoenixNavigated', 'true');
                    sessionStorage.setItem('phoenixTargetPlanet', result.intent.planet);
                    window.location.href = targetUrl;
                }, 2000);
            }
        }
    }

    /**
     * Check and speak post-navigation greeting
     */
    checkPostNavigationGreeting() {
        const navigated = sessionStorage.getItem('phoenixNavigated');
        const targetPlanet = sessionStorage.getItem('phoenixTargetPlanet');

        if (navigated === 'true' && targetPlanet === this.currentPlanet) {
            // Clear flags
            sessionStorage.removeItem('phoenixNavigated');
            sessionStorage.removeItem('phoenixTargetPlanet');

            // Speak welcome message
            setTimeout(() => {
                const planetName = this.currentPlanet.charAt(0).toUpperCase() + this.currentPlanet.slice(1);
                const greeting = `Welcome to ${planetName}, ${this.userName || 'there'}. What can I help you with?`;
                this.speak(greeting);
            }, 1000);
        }
    }

    /**
     * Handle SMS Intent
     */
    async handleSMSIntent(data) {
        console.log('📱 Handling SMS intent:', data);

        if (!data.contact || !data.message) {
            this.speak('I need a contact and message to send a text');
            return;
        }

        try {
            const token = localStorage.getItem('phoenixToken');
            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/phoenix/butler/sms`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: data.contact,
                    message: data.message
                })
            });

            if (response.ok) {
                const result = await response.json();
                const confirmation = `Text sent to ${data.contact}, ${this.userName || 'there'}`;
                this.speak(confirmation);
                this.showResponse('sms', confirmation, result);
            } else {
                throw new Error('Failed to send SMS');
            }
        } catch (error) {
            console.error('SMS error:', error);
            this.speak('Sorry, I couldn\'t send that text message');
            this.showResponse('error', 'Failed to send SMS', error.message);
        }
    }
}

// ========================================
// INITIALIZE PHOENIX ORB
// ========================================

let phoenixOrb;

// Wait for DOM and config to load
window.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure config.js loads
    setTimeout(() => {
        if (window.PhoenixConfig) {
            phoenixOrb = new PhoenixOrb();
        } else {
            console.error('❌ PhoenixConfig not found! Make sure config.js is loaded.');
        }
    }, 100);
});

// Export for global access
window.PhoenixOrb = PhoenixOrb;
