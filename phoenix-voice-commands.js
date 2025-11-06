/* ============================================
   PHOENIX VOICE COMMAND SYSTEM
   Full dashboard control via natural language voice commands
   Navigation, data manipulation, logging, tracking
   ============================================ */

class PhoenixVoiceCommands {
    constructor() {
        this.isListening = false;
        this.isProcessing = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.currentTranscript = '';
        this.orbElement = null;

        this.init();
    }

    init() {
        console.log('Initializing Phoenix Voice Command System...');

        // Get the center orb element
        this.orbElement = document.getElementById('phoenix-core-container');

        // Initialize speech recognition
        this.initSpeechRecognition();

        // Set up wake word detection integration
        this.setupWakeWordIntegration();

        // Set initial state
        this.setOrbState('idle');

        console.log('Phoenix Voice Commands ready');
    }

    /* ============================================
       SPEECH RECOGNITION SETUP
       ============================================ */
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // OPTIMIZATION: Track silence for faster response
        this.lastSpeechTime = 0;
        this.silenceThreshold = 300; // ms - ultra-fast response
        this.silenceTimer = null;

        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
            this.setOrbState('listening');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            this.currentTranscript = finalTranscript || interimTranscript;
            console.log('Transcript:', this.currentTranscript);

            // OPTIMIZATION: Track when user last spoke
            this.lastSpeechTime = Date.now();

            // Clear existing silence timer
            if (this.silenceTimer) {
                clearTimeout(this.silenceTimer);
            }

            // OPTIMIZATION: Process interim results after short silence
            if (interimTranscript && !finalTranscript) {
                this.silenceTimer = setTimeout(() => {
                    if (Date.now() - this.lastSpeechTime >= this.silenceThreshold) {
                        // User stopped talking, process command now
                        this.recognition.stop();
                        this.processCommand(interimTranscript.trim().toLowerCase());
                    }
                }, this.silenceThreshold);
            }

            if (finalTranscript) {
                if (this.silenceTimer) {
                    clearTimeout(this.silenceTimer);
                }
                this.processCommand(finalTranscript.trim().toLowerCase());
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.setOrbState('idle');
            this.isListening = false;
        };

        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            this.isListening = false;
            if (!this.isProcessing && !this.isSpeaking) {
                this.setOrbState('idle');
            }
        };
    }

    /* ============================================
       WAKE WORD INTEGRATION
       ============================================ */
    setupWakeWordIntegration() {
        // Listen for wake word detection from existing system
        window.addEventListener('phoenixWakeWordDetected', () => {
            console.log('Wake word detected - starting voice command');
            this.startListening();
        });
    }

    /* ============================================
       ORB VISUAL STATES (Siri-like)
       ============================================ */
    setOrbState(state) {
        if (!this.orbElement) return;

        // Remove all state classes
        this.orbElement.classList.remove('idle', 'listening', 'thinking', 'speaking', 'user-speaking');

        // Add new state
        this.orbElement.classList.add(state);

        console.log(`Orb state: ${state}`);
    }

    /* ============================================
       VOICE CONTROL
       ============================================ */
    startListening() {
        if (!this.recognition || this.isListening) return;

        try {
            this.recognition.start();
            this.setOrbState('listening');
        } catch (error) {
            console.error('Could not start recognition:', error);
        }
    }

    stopListening() {
        if (!this.recognition || !this.isListening) return;

        this.recognition.stop();
        this.isListening = false;
    }

    /* ============================================
       COMMAND PROCESSING
       ============================================ */
    async processCommand(transcript) {
        console.log('Processing command:', transcript);

        this.setOrbState('thinking');
        this.isProcessing = true;

        // NEW STRATEGY: Route ALL commands through AI first
        // Let Claude/Gemini intelligence determine intent and actions
        // AI backend will return both message AND UI actions
        await this.sendToAIIntelligent(transcript);

        this.isProcessing = false;

        if (!this.isSpeaking) {
            this.setOrbState('idle');
        }
    }

    /* ============================================
       LOCAL COMMAND CHECK
       ============================================ */
    isLocalCommand(command) {
        // Commands that don't require backend API calls
        const localTypes = ['navigate', 'show', 'hide', 'mode', 'replace'];
        return localTypes.includes(command.type);
    }

    /* ============================================
       NATURAL ACKNOWLEDGMENTS
       ============================================ */
    giveNaturalAcknowledgment(command) {
        // Fast, natural responses that feel conversational
        const acknowledgments = {
            'navigate': [
                'On it',
                'Opening that now',
                'Sure',
                'Got it'
            ],
            'show': [
                'Let me pull that up',
                'Here you go',
                'Sure thing',
                'Coming up'
            ],
            'hide': [
                'Done',
                'Hidden',
                'Got it',
                'Closing that'
            ],
            'replace': [
                'Swapping now',
                'On it',
                'Switching'
            ],
            'mode': [
                'Switching modes',
                'Done',
                'Changed'
            ],
            'log': [
                'Logged',
                'Got it',
                'Tracked',
                'Added'
            ],
            'sync': [
                'Syncing now',
                'On it',
                'Refreshing'
            ]
        };

        const phrases = acknowledgments[command.type] || ['Got it'];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];

        // Speak without blocking execution
        this.speakQuick(phrase);
    }

    /* ============================================
       QUICK SPEECH (non-blocking)
       ============================================ */
    speakQuick(text) {
        // Ultra-fast speech for acknowledgments
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.5; // Even faster for short phrases
            utterance.pitch = 1.0;
            utterance.volume = 0.8; // Slightly quieter for quick acks
            window.speechSynthesis.speak(utterance);
        }
    }

    /* ============================================
       COMMAND PARSING (Natural Language)
       ============================================ */
    parseCommand(transcript) {
        const t = transcript.toLowerCase();

        console.log('Parsing transcript:', t);

        // PRIORITY: Check for planet keywords FIRST (more flexible matching)
        // This ensures "open up nutrition" or just "nutrition" works
        if (t.includes('mercury') || t.includes('health') || t.includes('biometric') || t.includes('recovery')) {
            return { type: 'navigate', target: 'mercury' };
        }
        if (t.includes('venus') || t.includes('fitness') || t.includes('nutrition') || t.includes('workout') || t.includes('meal') || t.includes('food')) {
            return { type: 'navigate', target: 'venus' };
        }
        if (t.includes('earth') || t.includes('calendar') || t.includes('schedule') || t.includes('time') || t.includes('meeting')) {
            return { type: 'navigate', target: 'earth' };
        }
        if (t.includes('mars') || t.includes('goal') || t.includes('habit') || t.includes('progress')) {
            return { type: 'navigate', target: 'mars' };
        }
        if (t.includes('jupiter') || t.includes('finance') || t.includes('money') || t.includes('budget') || t.includes('spending') || t.includes('expense')) {
            return { type: 'navigate', target: 'jupiter' };
        }
        if (t.includes('saturn') || t.includes('social') || t.includes('relationship') || t.includes('people')) {
            return { type: 'navigate', target: 'saturn' };
        }
        if (t.includes('dashboard') || t.includes('home') || t.includes('main')) {
            return { type: 'navigate', target: 'dashboard' };
        }

        // VIEW COMMANDS - "show me X"
        if (t.match(/show me|what.?s|tell me about|display/)) {
            if (t.includes('day') || t.includes('today') || t.includes('schedule')) {
                return { type: 'show', target: 'today-schedule' };
            }
            if (t.includes('health') || t.includes('hrv') || t.includes('recovery')) {
                return { type: 'show', target: 'health-metrics' };
            }
            if (t.includes('finance') || t.includes('spending') || t.includes('budget')) {
                return { type: 'show', target: 'finance-overview' };
            }
            if (t.includes('goal') || t.includes('progress')) {
                return { type: 'show', target: 'goals-progress' };
            }
            if (t.includes('workout') || t.includes('exercise')) {
                return { type: 'show', target: 'workout-plan' };
            }
        }

        // HIDE/CLOSE COMMANDS
        if (t.match(/hide|close|dismiss|remove|push.*away/)) {
            if (t.includes('health')) {
                return { type: 'hide', target: 'health' };
            }
            if (t.includes('finance')) {
                return { type: 'hide', target: 'finance' };
            }
            if (t.includes('panel') || t.includes('menu') || t.includes('everything')) {
                return { type: 'hide', target: 'all-panels' };
            }
        }

        // REPLACE/SWAP COMMANDS
        if (t.match(/replace|swap|switch.*with/)) {
            const match = t.match(/(replace|swap)\s+(\w+)\s+with\s+(\w+)/);
            if (match) {
                return { type: 'replace', from: match[2], to: match[3] };
            }
        }

        // LOGGING/TRACKING COMMANDS
        if (t.match(/log|track|record|add/)) {
            if (t.includes('workout') || t.includes('exercise')) {
                return { type: 'log', category: 'workout', transcript };
            }
            if (t.includes('meal') || t.includes('food') || t.includes('ate')) {
                return { type: 'log', category: 'meal', transcript };
            }
            if (t.includes('water')) {
                return { type: 'log', category: 'water', transcript };
            }
            if (t.includes('sleep')) {
                return { type: 'log', category: 'sleep', transcript };
            }
            if (t.includes('mood') || t.includes('feeling')) {
                return { type: 'log', category: 'mood', transcript };
            }
            if (t.includes('expense') || t.includes('spent')) {
                return { type: 'log', category: 'expense', transcript };
            }
        }

        // MODE SWITCHING
        if (t.match(/switch to|change to|go to/)) {
            if (t.includes('voice mode')) {
                return { type: 'mode', target: 'voice' };
            }
            if (t.includes('manual mode')) {
                return { type: 'mode', target: 'manual' };
            }
        }

        // SYNC COMMANDS
        if (t.match(/sync|refresh|update/)) {
            return { type: 'sync', target: 'all' };
        }

        return null;
    }

    /* ============================================
       COMMAND EXECUTION
       ============================================ */
    async executeCommand(command) {
        console.log('Executing command:', command);

        switch (command.type) {
            case 'navigate':
                await this.handleNavigation(command.target);
                break;

            case 'show':
                await this.handleShow(command.target);
                break;

            case 'hide':
                await this.handleHide(command.target);
                break;

            case 'replace':
                await this.handleReplace(command.from, command.to);
                break;

            case 'log':
                await this.handleLogging(command.category, command.transcript);
                break;

            case 'mode':
                this.handleModeSwitch(command.target);
                break;

            case 'sync':
                await this.handleSync();
                break;

            default:
                console.log('Unknown command type');
        }
    }

    /* ============================================
       NAVIGATION HANDLERS
       ============================================ */
    async handleNavigation(target) {
        const planetUrls = {
            'mercury': 'mercury.html',
            'venus': 'venus.html',
            'earth': 'earth.html',
            'mars': 'mars.html',
            'jupiter': 'jupiter.html',
            'saturn': 'saturn.html',
            'dashboard': 'dashboard.html'
        };

        if (planetUrls[target]) {
            // OPTIMIZATION: Instant navigation, speak while transitioning
            window.location.href = planetUrls[target];
            // Note: speak() won't complete before navigation, but that's OK
        }
    }

    /* ============================================
       SHOW HANDLERS
       ============================================ */
    async handleShow(target) {
        // OPTIMIZATION: Instant navigation, no waiting
        switch (target) {
            case 'today-schedule':
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'earth.html';
                }
                break;

            case 'health-metrics':
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'mercury.html';
                }
                break;

            case 'finance-overview':
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'jupiter.html';
                }
                break;

            case 'goals-progress':
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'mars.html';
                }
                break;

            case 'workout-plan':
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'venus.html';
                }
                break;
        }
    }

    /* ============================================
       HIDE HANDLERS
       ============================================ */
    async handleHide(target) {
        // OPTIMIZATION: Execute instantly, no speech delay
        switch (target) {
            case 'all-panels':
                // Close any open menus or panels
                document.querySelectorAll('.panel, .menu, [id*="menu"]').forEach(el => {
                    el.style.display = 'none';
                });
                break;

            case 'health':
            case 'finance':
                // Logic to hide specific sections
                break;
        }
    }

    /* ============================================
       REPLACE HANDLERS
       ============================================ */
    async handleReplace(from, to) {
        this.speak(`Replacing ${from} with ${to}`);
        await this.delay(500);

        // Close current view
        await this.handleHide(from);

        // Open new view
        await this.handleShow(to);
    }

    /* ============================================
       LOGGING HANDLERS
       ============================================ */
    async handleLogging(category, transcript) {
        console.log(`Logging ${category}:`, transcript);

        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                this.speak('Please log in to track data');
                return;
            }

            // Extract details from transcript using simple parsing
            const logData = this.parseLogDetails(category, transcript);

            // Send to appropriate endpoint
            const endpoint = this.getLogEndpoint(category);

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });

            if (response.ok) {
                this.speak(`Got it. Logged your ${category}.`);
            } else {
                this.speak(`Sorry, I couldn't log that. Please try again.`);
            }
        } catch (error) {
            console.error('Logging error:', error);
            this.speak('There was an error logging that data');
        }
    }

    parseLogDetails(category, transcript) {
        // Simple parsing - can be enhanced with AI/NLP
        const data = {
            category,
            transcript,
            timestamp: new Date().toISOString(),
            source: 'voice'
        };

        // Extract numbers, times, etc.
        const numbers = transcript.match(/\d+/g);
        if (numbers) {
            data.value = parseInt(numbers[0]);
        }

        return data;
    }

    getLogEndpoint(category) {
        const endpoints = {
            'workout': '/venus/workouts',
            'meal': '/venus/meals',
            'water': '/mercury/water-intake',
            'sleep': '/mercury/sleep',
            'mood': '/mercury/mood',
            'expense': '/jupiter/transactions'
        };
        return endpoints[category] || '/phoenix/log';
    }

    /* ============================================
       MODE SWITCHING
       ============================================ */
    handleModeSwitch(mode) {
        if (mode === 'voice' && window.switchToVoiceMode) {
            window.switchToVoiceMode();
            this.speak('Switched to voice mode');
        } else if (mode === 'manual' && window.switchToManualMode) {
            window.switchToManualMode();
            this.speak('Switched to manual mode');
        }
    }

    /* ============================================
       SYNC HANDLER
       ============================================ */
    async handleSync() {
        this.speak('Syncing all your data');

        if (window.syncAllPlanets) {
            await window.syncAllPlanets();
        }

        this.speak('Sync complete');
    }

    /* ============================================
       INTELLIGENT AI PROCESSING (Claude/Gemini)
       ============================================ */
    async sendToAIIntelligent(transcript) {
        console.log('Sending to AI intelligence:', transcript);

        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                this.speak('Please log in to use Phoenix');
                return;
            }

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/phoenix/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: transcript,
                    includeContext: true,
                    context: {
                        page: window.location.pathname,
                        timestamp: new Date().toISOString(),
                        mode: document.body.getAttribute('data-mode')
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Handle AI response
                const aiResponse = data.data || data;

                // Execute UI actions if AI provided them
                if (aiResponse.uiActions) {
                    await this.executeUIActions(aiResponse.uiActions);
                }

                // Speak the response
                if (aiResponse.message || aiResponse.response) {
                    this.speak(aiResponse.message || aiResponse.response);
                }

                // Check for follow-up questions (conversational logging)
                if (aiResponse.followUp) {
                    setTimeout(() => {
                        this.speak(aiResponse.followUp);
                        // Re-enable listening for follow-up answer
                        setTimeout(() => this.startListening(), 2000);
                    }, 3000);
                }
            } else {
                this.speak('Sorry, I could not process that request');
            }
        } catch (error) {
            console.error('AI error:', error);
            this.speak('There was an error processing your request');
        }
    }

    /* ============================================
       EXECUTE UI ACTIONS FROM AI RESPONSE
       ============================================ */
    async executeUIActions(uiActions) {
        console.log('Executing UI actions:', uiActions);

        // Navigate to different page
        if (uiActions.navigation) {
            window.location.href = uiActions.navigation;
            return;
        }

        // Display widgets on dashboard
        if (uiActions.displayWidgets && uiActions.displayWidgets.length > 0) {
            if (window.widgetManager) {
                await window.widgetManager.displayWidgets(uiActions.displayWidgets, uiActions.widgetData);
            }
        }

        // Highlight specific metrics
        if (uiActions.highlightMetrics && uiActions.highlightMetrics.length > 0) {
            uiActions.highlightMetrics.forEach(metricId => {
                const element = document.getElementById(metricId);
                if (element) {
                    element.style.animation = 'highlight-pulse 1s ease-in-out 2';
                }
            });
        }

        // Hide widgets
        if (uiActions.hideWidgets && uiActions.hideWidgets.length > 0) {
            if (window.widgetManager) {
                await window.widgetManager.hideWidgets(uiActions.hideWidgets);
            }
        }

        // Show notification
        if (uiActions.notification) {
            this.showNotification(uiActions.notification);
        }
    }

    /* ============================================
       SHOW NOTIFICATION
       ============================================ */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 10, 20, 0.95);
            border: 2px solid rgba(0, 255, 255, 0.4);
            border-radius: 12px;
            padding: 15px 25px;
            color: #00ffff;
            font-size: 14px;
            z-index: 10000;
            backdrop-filter: blur(15px);
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
            animation: slideUp 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /* ============================================
       AI FALLBACK (for complex queries)
       ============================================ */
    async sendToAI(transcript) {
        console.log('Sending to AI:', transcript);

        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                this.speak('Please log in to use AI features');
                return;
            }

            const response = await fetch(`${window.PhoenixConfig.API_BASE_URL}/phoenix/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: transcript,
                    context: {
                        page: window.location.pathname,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.speak(data.response || data.message);
            } else {
                this.speak('Sorry, I could not process that request');
            }
        } catch (error) {
            console.error('AI error:', error);
            this.speak('There was an error processing your request');
        }
    }

    /* ============================================
       TEXT-TO-SPEECH
       ============================================ */
    speak(text, skipStateChange = false) {
        console.log('Speaking:', text);

        // OPTIMIZATION: Skip state change if action is already executing
        if (!skipStateChange) {
            this.setOrbState('speaking');
            this.isSpeaking = true;
        }

        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.3; // FASTER: 1.1 -> 1.3
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => {
                this.isSpeaking = false;
                if (!this.isListening && !this.isProcessing) {
                    this.setOrbState('idle');
                }
            };

            utterance.onerror = () => {
                this.isSpeaking = false;
                this.setOrbState('idle');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            // Fallback: no TTS available
            this.isSpeaking = false;
            this.setOrbState('idle');
        }
    }

    /* ============================================
       UTILITIES
       ============================================ */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize on page load
let phoenixVoiceCommands;

document.addEventListener('DOMContentLoaded', () => {
    phoenixVoiceCommands = new PhoenixVoiceCommands();
    window.phoenixVoiceCommands = phoenixVoiceCommands;

    console.log('Phoenix Voice Commands loaded');
});

// Global function to start voice command from anywhere
window.startPhoenixVoiceCommand = function() {
    if (window.phoenixVoiceCommands) {
        window.phoenixVoiceCommands.startListening();
    }
};

// Click center orb to activate
document.addEventListener('click', (e) => {
    const orb = document.getElementById('phoenix-core-container');
    if (orb && orb.contains(e.target)) {
        window.startPhoenixVoiceCommand();
    }
});
