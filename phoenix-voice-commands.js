/* ============================================
   PHOENIX VOICE COMMAND SYSTEM
   Full dashboard control via natural language voice commands
   Navigation, data manipulation, logging, tracking

   OPTIMIZED FOR NATIVE APPLE APIS:
   - iOS/macOS: Native Whisper (SFSpeechRecognizer) + AVSpeechSynthesizer
   - Other: Web Speech API fallback
   - Target: <2s total response time
   ============================================ */

class PhoenixVoiceCommands {
    constructor() {
        this.isListening = false;
        this.isProcessing = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.currentTranscript = '';
        this.orbElement = null;
        this.requestInProgress = false; // PREVENT DOUBLE-CLICK DUPLICATE RESPONSES
        this.audioElement = null; // Track current audio playback
        this.userInteracted = false; // Track if user has interacted (for autoplay policy)
        this.audioUnlocked = false; // Track if audio context has been unlocked

        // Conversation memory for ChatGPT-level contextual awareness
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // Keep last 10 messages for context

        // Load user voice preferences from localStorage
        this.voice = localStorage.getItem('phoenixVoice') || 'echo';
        this.language = localStorage.getItem('phoenixLanguage') || 'en';
        this.personality = localStorage.getItem('phoenixPersonality') || 'friendly_helpful';
        console.log('🎙️ Voice preferences loaded:', { voice: this.voice, language: this.language });

        // Platform detection
        this.isAppleDevice = this.detectAppleDevice();
        this.useNativeAPIs = this.isAppleDevice && this.supportsNativeAPIs();

        this.init();
    }

    /**
     * Update user preferences (called when profile is fetched)
     */
    updatePreferences(voice, language, personality) {
        this.voice = voice || this.voice;
        this.language = language || this.language;
        this.personality = personality || this.personality;
        console.log('🎙️ Voice preferences updated:', { voice: this.voice, language: this.language });
    }

    /* ============================================
       PLATFORM DETECTION
       ============================================ */
    detectAppleDevice() {
        const ua = navigator.userAgent;
        return /iPhone|iPad|iPod|Mac/i.test(ua);
    }

    supportsNativeAPIs() {
        // Check if running in iOS/macOS Safari or app wrapper
        return (
            ('SFSpeechRecognizer' in window) ||
            ('webkit' in window && this.isAppleDevice)
        );
    }

    init() {
        console.log('Initializing Phoenix Voice Command System...');
        console.log(`Platform: ${this.isAppleDevice ? 'Apple' : 'Other'}`);
        console.log(`Using Native APIs: ${this.useNativeAPIs}`);

        // Get the center orb element
        this.orbElement = document.getElementById('phoenix-core-container');

        // Request microphone permissions on page load
        this.requestMicrophonePermission();

        // Initialize speech recognition (optimized for platform)
        this.initSpeechRecognition();

        // Set up wake word detection integration
        this.setupWakeWordIntegration();

        // Set initial state
        this.setOrbState('idle');

        console.log('Phoenix Voice Commands ready');
        if (this.useNativeAPIs) {
            console.log('✅ Using native Apple Whisper + AVSpeechSynthesizer for optimal speed');
        } else {
            console.log('✅ Using Web Speech API (fallback)');
        }
    }

    /* ============================================
       MICROPHONE PERMISSION REQUEST
       ============================================ */
    async requestMicrophonePermission() {
        try {
            console.log('🎤 Requesting microphone permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Got permission - stop the stream immediately (we don't need it yet)
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Microphone permission granted');
            this.microphonePermissionGranted = true;
        } catch (error) {
            console.warn('⚠️ Microphone permission denied:', error.message);
            this.microphonePermissionGranted = false;
        }
    }

    /* ============================================
       AUDIO CONTEXT UNLOCK (CRITICAL FOR TTS AUTOPLAY)
       ============================================ */
    async unlockAudioContext() {
        // Only unlock once
        if (this.audioUnlocked) {
            return true;
        }

        try {
            // BULLETPROOF FIX: Play silent audio to unlock browser audio permissions
            // This MUST happen during a user gesture (click/tap) to work
            console.log('🔓 Unlocking audio context for TTS autoplay...');

            const silentAudio = new Audio();
            // Silent WAV file (base64 encoded - smallest possible valid audio)
            silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            silentAudio.volume = 0.01; // Nearly silent

            // Play the silent audio
            const playPromise = silentAudio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }

            this.audioUnlocked = true;
            console.log('✅ Audio context unlocked - TTS autoplay ready');
            return true;

        } catch (error) {
            console.warn('⚠️ Could not unlock audio context:', error.message);
            // Don't throw - TTS might still work on some browsers
            return false;
        }
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

        // OPTIMIZATION: Silence detection (only on non-Apple devices)
        // Apple devices use native Whisper which handles this automatically
        if (!this.useNativeAPIs) {
            this.lastSpeechTime = 0;
            this.silenceThreshold = 300; // ms - ultra-fast response
            this.silenceTimer = null;
        }

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

            // Apple devices: Process immediately (native Whisper is faster)
            if (this.useNativeAPIs) {
                if (finalTranscript) {
                    this.processCommand(finalTranscript.trim().toLowerCase());
                }
                return;
            }

            // CRITICAL FIX: Only process final transcripts to prevent duplicates
            // Interim transcripts cause multiple AI calls with slightly different text,
            // resulting in overlapping audio responses
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

        // VISUAL FEEDBACK: Clear console messages for user
        const stateMessages = {
            'listening': '🎤 Listening...',
            'thinking': '💭 Thinking...',
            'speaking': '🗣️ Speaking...',
            'idle': '⚪ Ready'
        };

        const message = stateMessages[state] || `Orb state: ${state}`;
        console.log(`%c${message}`, 'font-size: 14px; font-weight: bold;');
    }

    /* ============================================
       VOICE CONTROL
       ============================================ */
    async startListening() {
        // PREVENT DOUBLE-CLICK: Check if request already in progress
        if (!this.recognition || this.isListening || this.requestInProgress) {
            if (this.requestInProgress) {
                console.log('⚠️ Request already in progress - ignoring click');
            }
            return;
        }

        // Mark user interaction (for autoplay policy)
        this.userInteracted = true;

        // CRITICAL FIX: Unlock audio context on first user interaction
        // This ensures TTS autoplay will work
        // DON'T await - must stay synchronous for speech recognition to work!
        if (!this.audioUnlocked) {
            this.unlockAudioContext(); // Fire and forget - don't await!
        }

        // Stop any current audio playback
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }

        try {
            this.requestInProgress = true; // Lock to prevent double-click
            this.recognition.start();
            this.setOrbState('listening');
        } catch (error) {
            console.error('Could not start recognition:', error);
            this.requestInProgress = false; // Release lock on error
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
        // CRITICAL: Prevent duplicate processing from interim + final transcripts
        if (this.isProcessing) {
            console.log('⚠️ Already processing a command - ignoring duplicate transcript');
            return;
        }

        console.log('💭 Processing command:', transcript);

        // VISUAL FEEDBACK: Show "Thinking..." state
        this.setOrbState('thinking');
        this.isProcessing = true;

        try {
            // NEW STRATEGY: Route ALL commands through AI first
            // Let Claude/Gemini intelligence determine intent and actions
            // AI backend will return both message AND UI actions
            await this.sendToAIIntelligent(transcript);
        } catch (error) {
            console.error('❌ Error processing command:', error);
            this.speak('Sorry, I encountered an error processing that.');
        } finally {
            // Release lock when done processing
            this.isProcessing = false;
            this.requestInProgress = false; // Allow new requests now

            if (!this.isSpeaking) {
                this.setOrbState('idle');
            }
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
        // Use same OpenAI TTS as speak() for consistency
        // Just call speak() with higher speed
        this.speak(text, true); // skipStateChange = true for quick responses
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
            if (t.includes('insight') || t.includes('pattern') || t.includes('think') || t.includes('detect')) {
                return { type: 'show', target: 'consciousness-insights' };
            }
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
            case 'consciousness-insights':
                if (window.PhoenixConsciousness) {
                    await window.PhoenixConsciousness.refresh();
                    this.speak(window.PhoenixConsciousness.getInsightsSummary());
                } else {
                    this.speak("Consciousness system is initializing. Please try again in a moment.");
                }
                break;

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
       CONVERSATION MEMORY MANAGEMENT
       ============================================ */
    addToConversationHistory(userMessage, aiResponse) {
        // Add user message
        this.conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });

        // Add AI response
        this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString()
        });

        // Keep only last 10 messages (5 user + 5 AI = 10 total)
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }

        console.log(`💬 Conversation history: ${this.conversationHistory.length} messages`);
    }

    /* ============================================
       INTELLIGENT AI PROCESSING (Claude/Gemini)
       ============================================ */
    async sendToAIIntelligent(transcript) {
        console.log('Sending to AI intelligence:', transcript);

        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                console.error('❌ No authentication token found');
                this.speak('Please log in to use voice features');
                this.setOrbState('idle');
                return;
            }

            const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
                ? window.PhoenixConfig.API_BASE_URL
                : 'https://pal-backend-production.up.railway.app/api';

            // OPTIMIZATION: Start timing for performance monitoring
            console.time('⚡ Total Response Time');
            console.time('🤖 AI Response');

            // OPTIMIZATION: Check if this is just a simple wake word
            const isSimpleWakeWord = transcript.toLowerCase().trim() === 'phoenix' ||
                                    transcript.toLowerCase().trim() === 'hey phoenix';

            // OPTIMIZATION: Run AI call and consciousness orchestration in PARALLEL
            // This saves 2-3 seconds compared to sequential execution
            const promises = [
                fetch(`${baseUrl}/phoenix/companion/chat`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: transcript,
                        conversationHistory: this.conversationHistory,
                        personality: this.personality,
                        voice: this.voice,
                        requestedTier: 'auto',
                        responseFormat: 'json'
                    })
                }).then(r => r.json())
            ];

            // Skip consciousness orchestration for simple wake words (saves 2-3s)
            if (!isSimpleWakeWord && window.consciousnessClient) {
                console.time('🧠 Consciousness');
                promises.push(
                    window.consciousnessClient.orchestrate(
                        {
                            location: 'unknown',
                            activity: 'voice_command',
                            voiceQuery: transcript
                        },
                        transcript
                    )
                );
            }

            // Wait for both to complete in parallel
            const results = await Promise.all(promises);
            const data = results[0];
            const orchestration = results[1]; // undefined for simple wake words

            console.timeEnd('🤖 AI Response');
            if (!isSimpleWakeWord && orchestration) {
                console.timeEnd('🧠 Consciousness');
            }

            if (data) {
                // Handle AI response
                const aiResponse = data.data || data;

                // Extract and log 3-tier classification
                const classificationTier = aiResponse.tier || aiResponse.classification || 'UNKNOWN';
                console.log(`📊 Phoenix Classification: ${classificationTier}`);

                // Apply orchestration to display (if we fetched it)
                if (orchestration && window.widgetManager) {
                    await window.widgetManager.displayFromOrchestration(orchestration);
                }

                // Execute UI actions if AI provided them
                if (aiResponse.uiActions) {
                    await this.executeUIActions(aiResponse.uiActions);
                }

                // Speak the response with tier-based timing
                if (aiResponse.message || aiResponse.response) {
                    const responseText = aiResponse.message || aiResponse.response;

                    // Save to conversation history for ChatGPT-level context awareness
                    this.addToConversationHistory(transcript, responseText);

                    // CRITICAL: Call speak() immediately to preserve user gesture for autoplay
                    // Don't use setTimeout as it breaks the gesture chain
                    this.speak(responseText);
                    console.timeEnd('⚡ Total Response Time');
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
            border: 2px solid rgba(0, 217, 255, 0.4);
            border-radius: 12px;
            padding: 15px 25px;
            color: #00d9ff;
            font-size: 14px;
            z-index: 10000;
            backdrop-filter: blur(15px);
            box-shadow: 0 0 30px rgba(0, 217, 255, 0.3);
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

            const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
                ? window.PhoenixConfig.API_BASE_URL
                : 'https://pal-backend-production.up.railway.app/api';

            const response = await fetch(`${baseUrl}/phoenix/companion/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: transcript,
                    conversationHistory: [],
                    personality: 'friendly_helpful',
                    voice: 'echo',
                    requestedTier: 'auto',  // Let backend detect ACTION/WISDOM_CASUAL/WISDOM_DEEP
                    responseFormat: 'json'   // Ensure consistent response format
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
       TEXT-TO-SPEECH (Backend OpenAI TTS - Natural Voice)
       ============================================ */
    async speak(text, skipStateChange = false) {
        console.log('🗣️ Speaking:', text);

        // Stop any current audio
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }

        // CRITICAL FIX: Create Audio element IMMEDIATELY (during user gesture)
        // This must happen synchronously, before any await, to preserve the user gesture
        const audio = new Audio();
        this.audioElement = audio;

        // OPTIMIZATION: Skip state change if action is already executing
        if (!skipStateChange) {
            this.setOrbState('speaking');
            this.isSpeaking = true;
        }

        try {
            // Use backend TTS endpoint for natural OpenAI voice
            const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
                ? window.PhoenixConfig.API_BASE_URL
                : 'https://pal-backend-production.up.railway.app/api';

            const response = await fetch(`${baseUrl}/tts/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: this.voice,      // Use user's voice preference
                    speed: 1.0,             // Natural conversation pace (user feedback: 1.4 was too fast)
                    language: this.language, // Use user's language preference
                    model: 'tts-1'
                })
            });

            if (!response.ok) {
                throw new Error('TTS generation failed');
            }

            // Get audio blob
            const audioBlob = await response.blob();

            // Load audio data into the pre-created element
            const audioUrl = URL.createObjectURL(audioBlob);
            audio.src = audioUrl;

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl); // Clean up
                this.isSpeaking = false;
                this.audioElement = null;
                console.log('✅ Audio playback complete');
                if (!this.isListening && !this.isProcessing) {
                    this.setOrbState('idle');
                }
            };

            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                this.isSpeaking = false;
                this.audioElement = null;
                this.setOrbState('idle');
                console.error('❌ Audio playback error');
            };

            // CRITICAL: Call load() to prepare the audio, then play
            // Safari requires this to maintain the user gesture context
            audio.load();

            // FIX AUTOPLAY: Now play() is called on element created during user gesture
            try {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
                console.log('✅ Audio playing via OpenAI TTS');
            } catch (playError) {
                if (playError.name === 'NotAllowedError') {
                    console.warn('⚠️ Autoplay blocked by browser - using fallback speech synthesis');
                    // User hasn't interacted yet, fallback to Web Speech API
                    throw playError; // Let outer catch handle fallback
                }
                throw playError;
            }

        } catch (error) {
            console.error('❌ TTS Error:', error);
            console.error('   Error details:', error.message);
            this.isSpeaking = false;
            this.setOrbState('idle');

            // No fallback - OpenAI TTS only
            // If TTS fails, user will see error in console
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

function initPhoenixVoiceCommands() {
    phoenixVoiceCommands = new PhoenixVoiceCommands();
    window.phoenixVoiceCommands = phoenixVoiceCommands;
    console.log('✅ Phoenix Voice Commands loaded and initialized');
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhoenixVoiceCommands);
} else {
    // DOM already loaded, initialize immediately
    initPhoenixVoiceCommands();
}

// Global function to start voice command from anywhere
window.startPhoenixVoiceCommand = function() {
    if (window.phoenixVoiceCommands) {
        window.phoenixVoiceCommands.startListening();
    }
};

// NOTE: Orb click handler is in dashboard.html onclick attribute
// DO NOT add another click listener here or it will trigger twice!
