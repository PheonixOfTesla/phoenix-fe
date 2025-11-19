/* ============================================
   PHOENIX VOICE COMMAND SYSTEM
   Full dashboard control via natural language voice commands
   Navigation, data manipulation, logging, tracking

   NATIVE iOS SPEECH RECOGNITION:
   - Uses Capacitor SpeechRecognition plugin
   - Native iOS Whisper (SFSpeechRecognizer)
   - Better accent, slang, and multi-language support
   - Target: <2s total response time
   ============================================ */

// Import Capacitor Speech Recognition plugin
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

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

        // Request microphone permissions on first user interaction
        this.setupFirstInteractionMicRequest();

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
       FIRST INTERACTION MIC REQUEST
       Request mic permission on ANY user interaction (browser-compliant)
       ============================================ */
    setupFirstInteractionMicRequest() {
        // Check if we've already requested permission
        const micPermissionRequested = localStorage.getItem('phoenixMicRequested');

        if (micPermissionRequested === 'true') {
            console.log('🎤 Mic permission already requested previously');
            return;
        }

        // Create one-time handler for ANY user interaction
        const firstInteractionHandler = async (event) => {
            console.log('🎤 First user interaction detected - requesting mic permission');

            // Remove listeners immediately to prevent multiple requests
            document.removeEventListener('click', firstInteractionHandler, true);
            document.removeEventListener('touchstart', firstInteractionHandler, true);
            document.removeEventListener('keydown', firstInteractionHandler, true);

            // Mark as requested so we don't ask again
            localStorage.setItem('phoenixMicRequested', 'true');

            // Hide the prompt if visible
            const prompt = document.getElementById('mic-permission-onboarding');
            if (prompt) {
                prompt.style.transition = 'opacity 0.3s ease-out';
                prompt.style.opacity = '0';
                setTimeout(() => {
                    if (prompt.parentNode) {
                        prompt.parentNode.removeChild(prompt);
                    }
                }, 300);
            }

            // Request mic permission
            await this.requestMicrophonePermission();
        };

        // Add listeners for click, touch, and keyboard (captures first interaction)
        // Use capture phase (true) to catch events before they bubble
        document.addEventListener('click', firstInteractionHandler, true);
        document.addEventListener('touchstart', firstInteractionHandler, true);
        document.addEventListener('keydown', firstInteractionHandler, true);

        console.log('🎤 Waiting for first user interaction to request mic permission');

        // Show visual prompt immediately (after page loads)
        setTimeout(() => {
            this.showMicPermissionPrompt();
        }, 100);
    }

    /* ============================================
       VISUAL MIC PERMISSION PROMPT
       Friendly onboarding prompt to guide users
       ============================================ */
    showMicPermissionPrompt() {
        // Check if already dismissed or requested
        if (localStorage.getItem('phoenixMicRequested') === 'true') {
            return;
        }

        // Check if prompt already exists
        if (document.getElementById('mic-permission-onboarding')) {
            return;
        }

        // Create overlay prompt
        const prompt = document.createElement('div');
        prompt.id = 'mic-permission-onboarding';
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 10, 20, 0.98);
            border: 2px solid rgba(0, 217, 255, 0.6);
            border-radius: 20px;
            padding: 30px 40px;
            color: #00d9ff;
            font-size: 18px;
            text-align: center;
            z-index: 10001;
            backdrop-filter: blur(20px);
            box-shadow: 0 0 60px rgba(0, 217, 255, 0.4);
            animation: pulseGlow 2s ease-in-out infinite;
            max-width: 90%;
            width: 400px;
            opacity: 0;
            transition: opacity 0.5s ease-in;
        `;

        prompt.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🎤</div>
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px; letter-spacing: 1px;">
                Enable Voice Commands
            </div>
            <div style="font-size: 14px; color: rgba(0, 217, 255, 0.8); margin-bottom: 20px; line-height: 1.5;">
                Tap anywhere to activate voice control.<br>
                You can then click the orb or say "Hey Phoenix" to speak.
            </div>
            <div style="font-size: 12px; color: rgba(0, 217, 255, 0.5);">
                This prompt will disappear after your first interaction
            </div>
        `;

        document.body.appendChild(prompt);

        // Add pulsing animation if not already present
        if (!document.getElementById('mic-prompt-animation-style')) {
            const style = document.createElement('style');
            style.id = 'mic-prompt-animation-style';
            style.textContent = `
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 60px rgba(0, 217, 255, 0.4); }
                    50% { box-shadow: 0 0 80px rgba(0, 217, 255, 0.6); }
                }
            `;
            document.head.appendChild(style);
        }

        // Fade in the prompt
        requestAnimationFrame(() => {
            prompt.style.opacity = '1';
        });
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
       SPEECH RECOGNITION SETUP - NATIVE iOS
       ============================================ */
    async initSpeechRecognition() {
        // Check if speech recognition is available
        const { available } = await SpeechRecognition.available();
        if (!available) {
            console.error('❌ Speech recognition not available on this device');
            return;
        }

        // Request permissions
        const permStatus = await SpeechRecognition.requestPermissions();
        if (permStatus.speechRecognition !== 'granted') {
            console.error('❌ Speech recognition permission denied');
            // Track permission error for optimization
            this.trackError('permission_denied', { permission: 'speech' });
            return;
        }

        console.log('✅ Native iOS speech recognition initialized');

        // Set up partial results listener for real-time feedback
        await SpeechRecognition.addListener('partialResults', (data) => {
            if (data.matches && data.matches.length > 0) {
                this.currentTranscript = data.matches[0];
                console.log('🎤 Partial:', this.currentTranscript);
            }
        });

        // Set up listening state listener
        await SpeechRecognition.addListener('listeningState', (data) => {
            if (data.status === 'started') {
                console.log('✅ Voice recognition started');
                this.isListening = true;
                this.setOrbState('listening');
            } else if (data.status === 'stopped') {
                console.log('⏹️ Voice recognition stopped');
                this.isListening = false;
                if (!this.isProcessing && !this.isSpeaking) {
                    this.setOrbState('idle');
                }
            }
        });
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
        this.orbElement.classList.remove('idle', 'listening', 'thinking', 'speaking', 'generating-voice', 'user-speaking', 'processing');

        // Add new state
        this.orbElement.classList.add(state);

        // VISUAL FEEDBACK: Clear console messages for user
        const stateMessages = {
            'listening': '🎤 Listening...',
            'thinking': '💭 Thinking...',
            'speaking': '🗣️ Speaking...',
            'generating-voice': '🎵 Generating voice...',
            'processing': '⚙️ Processing...',
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
        if (this.isListening || this.requestInProgress) {
            if (this.requestInProgress) {
                console.log('⚠️ Request already in progress - ignoring click');
            }
            return;
        }

        // Mark user interaction (for autoplay policy)
        this.userInteracted = true;

        // CRITICAL FIX: Unlock audio context on first user interaction
        // This ensures TTS autoplay will work
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
            this.setOrbState('listening');

            // Start native iOS speech recognition with partial results
            const result = await SpeechRecognition.start({
                language: 'en', // Generic 'en' for better accent support (US, UK, AU, IN, etc.)
                maxResults: 3,  // Get top 3 alternatives for slang/accent handling
                partialResults: true,  // Real-time interim transcripts
                popup: false    // No Android popup (iOS only)
            });

            // Process final result when recognition completes
            if (result.matches && result.matches.length > 0) {
                const finalTranscript = result.matches[0];
                console.log('🎤 Final transcript:', finalTranscript);

                // Log alternatives for debugging accent/slang issues
                if (result.matches.length > 1) {
                    console.log('🎤 Alternatives:', result.matches.slice(1).map((alt, idx) =>
                        `${idx + 2}: "${alt}"`
                    ).join(', '));
                }

                // Process the command
                await this.processCommand(finalTranscript.trim().toLowerCase());
            }
        } catch (error) {
            console.error('❌ Speech recognition error:', error);
            this.trackError('recognition_failed', { error: error.message });
            this.setOrbState('idle');
            this.requestInProgress = false; // Release lock on error
        }
    }

    async stopListening() {
        if (!this.isListening) return;

        try {
            await SpeechRecognition.stop();
            this.isListening = false;
        } catch (error) {
            console.error('❌ Error stopping recognition:', error);
            this.trackError('stop_failed', { error: error.message });
        }
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
            // STEP 1: Classify intent (ACTION vs WISDOM)
            const classification = await this.classifyCommand(transcript);

            if (classification && classification.category === 'butler_action') {
                // BUTLER ACTION: Execute real-world action
                console.log('🎯 Butler action detected:', classification.actionType);
                await this.executeButlerAction(classification);
            } else {
                // WISDOM: Route to AI for conversation
                console.log('💬 Wisdom query detected, routing to AI');
                await this.sendToAIIntelligent(transcript);
            }
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
       BUTLER ACTION CLASSIFICATION
       ============================================ */
    async classifyCommand(transcript) {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                console.warn('No token for classification, routing to AI');
                return null;
            }

            const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
                ? window.PhoenixConfig.API_BASE_URL
                : 'https://pal-backend-production.up.railway.app/api';

            const response = await fetch(`${baseUrl}/butler/router/classify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command: transcript,
                    context: {
                        currentLocation: 'Unknown' // TODO: Get user's actual location
                    }
                })
            });

            if (!response.ok) {
                console.warn('Classification failed, routing to AI');
                return null;
            }

            const data = await response.json();
            console.log('📊 Classification result:', data.classification);
            return data.classification;

        } catch (error) {
            console.error('Classification error:', error);
            return null; // Fall back to AI
        }
    }

    /* ============================================
       BUTLER ACTION EXECUTION
       ============================================ */
    async executeButlerAction(classification) {
        try {
            // STEP 1: Get confirmation with price
            const confirmed = await this.confirmButlerAction(classification);
            if (!confirmed) {
                this.speak('Okay, cancelled.');
                this.setOrbState('idle');
                return;
            }

            // STEP 2: Execute action
            this.speak('Executing...');
            this.setOrbState('working');

            const token = localStorage.getItem('phoenixToken');
            const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
                ? window.PhoenixConfig.API_BASE_URL
                : 'https://pal-backend-production.up.railway.app/api';

            const response = await fetch(`${baseUrl}/butler/router/execute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    actionType: classification.actionType,
                    method: classification.method,
                    parameters: classification.parameters,
                    confirmed: true
                })
            });

            const data = await response.json();

            if (data.success) {
                // Success feedback
                console.log('✅ Butler action completed:', data.result);
                this.speak(data.confirmationMessage || 'Done!');
                this.setOrbState('success');
            } else {
                // Error feedback
                console.error('❌ Butler action failed:', data.error);
                this.speak(data.userMessage || 'Sorry, that action failed.');
                this.setOrbState('error');
            }

        } catch (error) {
            console.error('Butler execution error:', error);
            this.speak('Sorry, I had trouble completing that action.');
            this.setOrbState('error');
        }
    }

    /* ============================================
       BUTLER ACTION CONFIRMATION
       ============================================ */
    async confirmButlerAction(classification) {
        return new Promise((resolve) => {
            // Speak confirmation message
            const confirmMessage = classification.confirmationMessage || 'Should I proceed?';
            this.speak(confirmMessage);

            // Wait for voice response
            setTimeout(() => {
                this.startListening();

                // Listen for "yes" or "no"
                const confirmHandler = (event) => {
                    // Extract transcript from speech recognition event
                    if (!event.results || !event.results[0]) return;

                    const transcript = event.results[0][0].transcript;
                    const response = transcript.toLowerCase();

                    if (response.includes('yes') || response.includes('yeah') ||
                        response.includes('sure') || response.includes('do it') ||
                        response.includes('go ahead') || response.includes('proceed')) {
                        this.recognition.removeEventListener('result', confirmHandler);
                        this.stopListening();
                        resolve(true);
                    } else if (response.includes('no') || response.includes('cancel') ||
                               response.includes('stop') || response.includes('nevermind')) {
                        this.recognition.removeEventListener('result', confirmHandler);
                        this.stopListening();
                        resolve(false);
                    }
                };

                // Attach temporary listener for confirmation
                if (this.recognition) {
                    this.recognition.addEventListener('result', confirmHandler);
                }

                // Timeout after 10 seconds
                setTimeout(() => {
                    this.stopListening();
                    resolve(false);
                }, 10000);

            }, 2000); // Wait 2s after confirmation message
        });
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

                // Gather real-time context from dashboard
                const context = {
                    location: window.PhoenixEngine?.location?.city || 'unknown',
                    activity: 'voice_command',
                    voiceQuery: transcript,
                    weather: window.PhoenixEngine?.weather || null,
                    userName: window.PhoenixEngine?.userName || null
                };

                promises.push(
                    window.consciousnessClient.orchestrate(context, transcript)
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

                    // ⭐ NEW: Show text bubble immediately for instant feedback
                    this.showTextBubble(responseText);

                    // ⭐ NEW: Generate audio in parallel (non-blocking)
                    // CRITICAL: Call speak() immediately to preserve user gesture for autoplay
                    // Don't use setTimeout as it breaks the gesture chain
                    this.speakAsync(responseText);
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
       ASYNC SPEAK - NON-BLOCKING TTS WITH STATUS
       ============================================ */
    async speakAsync(text, skipStateChange = false) {
        console.log('🗣️ Speaking async:', text);

        // Show "Generating voice..." indicator
        this.showStatusMessage('Generating voice...');

        // Stop any current audio
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }

        // CRITICAL FIX: Create Audio element IMMEDIATELY (during user gesture)
        const audio = new Audio();
        this.audioElement = audio;

        // Set generating state
        this.setOrbState('generating-voice');

        try {
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
                    voice: this.voice,
                    speed: 1.0,
                    language: this.language,
                    model: 'tts-1'
                })
            });

            if (!response.ok) {
                throw new Error('TTS generation failed');
            }

            const audioBlob = await response.blob();

            // Clear "Generating voice..." status
            this.clearStatusMessage();

            // Load and play audio
            const audioUrl = URL.createObjectURL(audioBlob);
            audio.src = audioUrl;

            // Set speaking state
            this.setOrbState('speaking');
            this.isSpeaking = true;

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.isSpeaking = false;
                this.audioElement = null;
                if (!this.isListening && !this.isProcessing) {
                    this.setOrbState('idle');
                }
            };

            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                this.isSpeaking = false;
                this.audioElement = null;
                this.setOrbState('idle');
            };

            audio.load();

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }

        } catch (error) {
            console.error('❌ Async TTS Error:', error);
            this.clearStatusMessage();
            this.isSpeaking = false;
            this.setOrbState('idle');
        }
    }

    /* ============================================
       TEXT BUBBLE DISPLAY
       ============================================ */
    showTextBubble(text, sender = 'phoenix') {
        console.log(`💬 Showing text bubble: "${text.substring(0, 50)}..."`);

        let conversationEl = document.getElementById('phoenix-conversation');

        if (!conversationEl) {
            conversationEl = document.createElement('div');
            conversationEl.id = 'phoenix-conversation';
            conversationEl.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 600px;
                max-height: 400px;
                overflow-y: auto;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(conversationEl);
            console.log('✅ Conversation container created');
        }

        const bubble = document.createElement('div');
        bubble.className = `phoenix-bubble phoenix-bubble-${sender}`;
        bubble.style.cssText = `
            background: ${sender === 'phoenix' ? 'rgba(0, 217, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            border: 2px solid ${sender === 'phoenix' ? 'rgba(0, 217, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)'};
            border-radius: 20px;
            padding: 15px 20px;
            color: ${sender === 'phoenix' ? '#00d9ff' : '#fff'};
            font-size: 16px;
            line-height: 1.5;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px ${sender === 'phoenix' ? 'rgba(0, 217, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            animation: bubbleSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            align-self: ${sender === 'phoenix' ? 'flex-start' : 'flex-end'};
            max-width: 80%;
        `;
        bubble.textContent = text;

        conversationEl.appendChild(bubble);
        conversationEl.scrollTop = conversationEl.scrollHeight;

        // Remove old bubbles (keep last 5)
        const bubbles = conversationEl.querySelectorAll('.phoenix-bubble');
        if (bubbles.length > 5) {
            bubbles[0].style.animation = 'bubbleFadeOut 0.5s ease-out';
            setTimeout(() => bubbles[0].remove(), 500);
        }

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.style.animation = 'bubbleFadeOut 0.5s ease-out';
                setTimeout(() => bubble.remove(), 500);
            }
        }, 30000);
    }

    /* ============================================
       STATUS MESSAGE OVERLAY
       ============================================ */
    showStatusMessage(message) {
        let statusEl = document.getElementById('phoenix-status-message');

        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'phoenix-status-message';
            statusEl.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 10, 20, 0.95);
                border: 2px solid rgba(0, 217, 255, 0.6);
                border-radius: 20px;
                padding: 20px 40px;
                color: #00d9ff;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 1px;
                z-index: 10000;
                backdrop-filter: blur(15px);
                box-shadow: 0 0 40px rgba(0, 217, 255, 0.4);
                animation: statusFadeIn 0.3s ease-out;
                pointer-events: none;
            `;
            document.body.appendChild(statusEl);
        }

        statusEl.textContent = message;
        statusEl.style.display = 'block';
    }

    clearStatusMessage() {
        const statusEl = document.getElementById('phoenix-status-message');
        if (statusEl) {
            statusEl.style.animation = 'statusFadeOut 0.3s ease-out';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 300);
        }
    }

    /* ============================================
       ERROR TRACKING FOR OPTIMIZATION
       ============================================ */
    async trackError(errorType, metadata = {}) {
        try {
            const token = localStorage.getItem('phoenixToken');
            if (!token) {
                console.warn('⚠️ Cannot track error - no auth token');
                return;
            }

            const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
                ? window.PhoenixConfig.API_BASE_URL
                : 'https://pal-backend-production.up.railway.app/api';

            // Send error to backend analytics endpoint
            await fetch(`${baseUrl}/analytics/speech-errors`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    errorType,
                    metadata,
                    timestamp: new Date().toISOString(),
                    platform: 'iOS',
                    userAgent: navigator.userAgent
                })
            });

            console.log('📊 Error tracked:', errorType, metadata);
        } catch (error) {
            // Silently fail - don't interrupt user experience for tracking errors
            console.error('Failed to track error:', error);
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
