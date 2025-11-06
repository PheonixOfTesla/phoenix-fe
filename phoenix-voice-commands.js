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

            if (finalTranscript) {
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

        // Command routing
        const command = this.parseCommand(transcript);

        if (command) {
            await this.executeCommand(command);
        } else {
            // Fallback to AI conversation
            await this.sendToAI(transcript);
        }

        this.isProcessing = false;

        if (!this.isSpeaking) {
            this.setOrbState('idle');
        }
    }

    /* ============================================
       COMMAND PARSING (Natural Language)
       ============================================ */
    parseCommand(transcript) {
        const t = transcript.toLowerCase();

        // NAVIGATION COMMANDS
        if (t.match(/open|show|go to|navigate to|take me to/)) {
            if (t.includes('mercury') || t.includes('health') || t.includes('biometric')) {
                return { type: 'navigate', target: 'mercury' };
            }
            if (t.includes('venus') || t.includes('fitness') || t.includes('nutrition') || t.includes('workout')) {
                return { type: 'navigate', target: 'venus' };
            }
            if (t.includes('earth') || t.includes('calendar') || t.includes('schedule') || t.includes('time')) {
                return { type: 'navigate', target: 'earth' };
            }
            if (t.includes('mars') || t.includes('goal') || t.includes('habit')) {
                return { type: 'navigate', target: 'mars' };
            }
            if (t.includes('jupiter') || t.includes('finance') || t.includes('money') || t.includes('budget')) {
                return { type: 'navigate', target: 'jupiter' };
            }
            if (t.includes('saturn') || t.includes('social') || t.includes('relationship')) {
                return { type: 'navigate', target: 'saturn' };
            }
            if (t.includes('dashboard') || t.includes('home') || t.includes('main')) {
                return { type: 'navigate', target: 'dashboard' };
            }
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
            this.speak(`Opening ${target}`);
            await this.delay(800);
            window.location.href = planetUrls[target];
        }
    }

    /* ============================================
       SHOW HANDLERS
       ============================================ */
    async handleShow(target) {
        switch (target) {
            case 'today-schedule':
                this.speak('Showing your schedule for today');
                // Open Earth planet or calendar view
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'earth.html';
                }
                break;

            case 'health-metrics':
                this.speak('Displaying your health metrics');
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'mercury.html';
                }
                break;

            case 'finance-overview':
                this.speak('Showing your financial overview');
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'jupiter.html';
                }
                break;

            case 'goals-progress':
                this.speak('Here are your goals and progress');
                if (window.location.pathname.includes('dashboard')) {
                    window.location.href = 'mars.html';
                }
                break;

            case 'workout-plan':
                this.speak('Loading your workout plan');
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
        switch (target) {
            case 'all-panels':
                this.speak('Closing all panels');
                // Close any open menus or panels
                document.querySelectorAll('.panel, .menu, [id*="menu"]').forEach(el => {
                    el.style.display = 'none';
                });
                break;

            case 'health':
            case 'finance':
                this.speak(`Hiding ${target} information`);
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
    speak(text) {
        console.log('Speaking:', text);

        this.setOrbState('speaking');
        this.isSpeaking = true;

        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
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
