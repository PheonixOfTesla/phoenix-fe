/* ============================================
   PHOENIX VOICE COMMAND SYSTEM
   Full dashboard control via natural language voice commands
   Navigation, data manipulation, logging, tracking

   OPTIMIZED FOR NATIVE APPLE APIS:
   - iOS/macOS: Native Whisper (SFSpeechRecognizer) + AVSpeechSynthesizer
   - Other: Web Speech API fallback
   - Target: <2s total response time
   ============================================ */

const DEBUG_MODE = false; // Set to true to enable verbose debug logging

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
        this.silentAudioUnlocked = false; // Track if silent audio unlock completed

        // Conversation memory for ChatGPT-level contextual awareness
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // Keep last 10 messages for context

        // Load user voice preferences from localStorage (TESLA DEFAULTS)
        this.voice = localStorage.getItem('phoenixVoice') || 'nova';
        this.language = localStorage.getItem('phoenixLanguage') || 'en';
        this.personality = localStorage.getItem('phoenixPersonality') || 'tesla';
        console.log('🎙️ Voice preferences loaded:', { voice: this.voice, language: this.language });

        // Platform detection
        this.isAppleDevice = this.detectAppleDevice();
        this.useNativeAPIs = this.isAppleDevice && this.supportsNativeAPIs();

        // WebSocket for real-time streaming (audio chunks, widget updates)
        this.ws = null;
        this.wsReconnectAttempts = 0;
        this.wsMaxReconnectAttempts = 0; // Disable WebSocket reconnection (non-critical)
        this.audioChunkQueue = []; // Queue for sequential audio playback
        this.currentAudioIndex = 0;

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

        // 🔧 FIX: Wake word detection DISABLED - app uses tap-to-talk only
        // this.setupWakeWordIntegration();

        // Initialize WebSocket connection for streaming
        this.initWebSocket();

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
       WEBSOCKET CONNECTION (STREAMING AUDIO + WIDGETS)
       ============================================ */
    initWebSocket() {
        const token = localStorage.getItem('phoenixToken');
        if (!token) {
            console.warn('⚠️ No auth token - WebSocket will connect when user logs in');
            return;
        }

        const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
            ? window.PhoenixConfig.API_BASE_URL
            : 'https://pal-backend-production.up.railway.app/api';

        // Convert HTTP to WS protocol
        const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '');
        const wsEndpoint = `${wsUrl}/phoenix-stream?token=${token}`;

        console.log('🔌 Connecting to WebSocket:', wsEndpoint);

        try {
            this.ws = new WebSocket(wsEndpoint);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected for streaming');
                this.wsReconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('❌ WebSocket message parse error:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                // Auto-reconnect with exponential backoff
                if (this.wsReconnectAttempts < this.wsMaxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 30000);
                    console.log(`🔄 Reconnecting in ${delay}ms...`);
                    setTimeout(() => {
                        this.wsReconnectAttempts++;
                        this.initWebSocket();
                    }, delay);
                }
            };

        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
        }
    }

    handleWebSocketMessage(message) {
        console.log('📩 WebSocket message:', message.type);

        switch (message.type) {
            case 'audio_chunk':
                this.handleAudioChunk(message);
                break;

            case 'widget_create':
                this.handleWidgetCreate(message);
                break;

            case 'widget_update':
                this.handleWidgetUpdate(message);
                break;

            case 'widget_complete':
                this.handleWidgetComplete(message);
                break;

            case 'processing_status':
                this.handleProcessingStatus(message);
                break;

            case 'heartbeat':
                // Respond to heartbeat to keep connection alive
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
                }
                break;

            default:
                console.log('Unknown WebSocket message type:', message.type);
        }
    }

    handleAudioChunk(message) {
        // Add audio chunk to queue
        this.audioChunkQueue.push({
            sequence: message.sequence,
            audioData: message.chunk,
            format: message.format || 'base64'
        });

        // Sort by sequence number (in case they arrive out of order)
        this.audioChunkQueue.sort((a, b) => a.sequence - b.sequence);

        console.log(`🎵 Audio chunk ${message.sequence} queued (${this.audioChunkQueue.length} in queue)`);

        // Start playing if not already playing
        if (!this.isSpeaking) {
            this.playAudioQueue();
        }
    }

    async playAudioQueue() {
        if (this.audioChunkQueue.length === 0) {
            console.log('✅ Audio queue empty');
            this.isSpeaking = false;
            this.setOrbState('idle');
            return;
        }

        // Get next chunk
        const chunk = this.audioChunkQueue.shift();
        this.isSpeaking = true;
        this.setOrbState('speaking');

        try {
            // Convert base64 to blob
            const audioBytes = atob(chunk.audioData);
            const arrayBuffer = new ArrayBuffer(audioBytes.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioBytes.length; i++) {
                uint8Array[i] = audioBytes.charCodeAt(i);
            }
            const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Play audio
            const audio = new Audio(audioUrl);
            this.audioElement = audio;

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                console.log(`✅ Chunk ${chunk.sequence} played`);
                // Play next chunk
                this.playAudioQueue();
            };

            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                console.error(`❌ Chunk ${chunk.sequence} playback error`);
                // Skip to next chunk
                this.playAudioQueue();
            };

            await audio.play();

        } catch (error) {
            console.error('❌ Audio playback error:', error);
            // Skip to next chunk
            this.playAudioQueue();
        }
    }

    handleWidgetCreate(message) {
        console.log('👁️ Creating widget:', message.category);

        // Show widget via widget manager
        if (window.widgetManager && window.widgetManager.showOrbitalWidget) {
            window.widgetManager.showOrbitalWidget(message.category, {
                status: 'generating',
                title: message.title,
                ...message.data
            });
        }

        // Show text bubble
        this.showTextBubble(`Creating ${message.title}...`);
    }

    handleWidgetUpdate(message) {
        console.log('👁️ Updating widget:', message.progress);

        // Update widget via widget manager
        if (window.widgetManager && window.widgetManager.updateWidget) {
            window.widgetManager.updateWidget(message.widgetId, {
                status: 'generating',
                progress: message.progress,
                currentSection: message.section,
                ...message.data
            });
        }
    }

    handleWidgetComplete(message) {
        console.log('👁️ Widget complete:', message.category);

        // Update widget to complete state
        if (window.widgetManager && window.widgetManager.showOrbitalWidget) {
            window.widgetManager.showOrbitalWidget(message.category, {
                status: 'complete',
                ...message.data
            });
        }

        // Show completion message
        this.showTextBubble(message.message || 'Complete!');
    }

    handleProcessingStatus(message) {
        console.log('⚙️ Processing status:', message.status);
        this.setOrbState(message.status || 'processing');
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
        // Use generic 'en' instead of 'en-US' for better accent support across all English variants
        // This handles US, UK, Australian, Indian, and other English accents better
        this.recognition.lang = 'en';
        // Get top 3 alternatives to handle slang, accents, and ambiguous speech better
        this.recognition.maxAlternatives = 3;

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
                // Get the best transcript (alternative 0)
                const transcript = event.results[i][0].transcript;

                // Log alternatives for debugging (helps understand accent/slang issues)
                if (DEBUG_MODE && event.results[i].isFinal && event.results[i].length > 1) {
                    console.log('🎤 Alternatives:', Array.from(event.results[i]).map((alt, idx) =>
                        `${idx + 1}: "${alt.transcript}" (${Math.round(alt.confidence * 100)}%)`
                    ).join(', '));
                }

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

            // 🔧 FIX: Auto-reset lock after 30s if stuck
            if (this.requestTimeout) clearTimeout(this.requestTimeout);
            this.requestTimeout = setTimeout(() => {
                console.log('[VOICE] Request timeout - resetting lock');
                this.requestInProgress = false;
            }, 30000);

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
            const msg = transcript.toLowerCase();

            // ========== WORKSPACE INTERCEPT - MUST BE FIRST ==========
            // Intercepts email/calendar/tasks/contacts/drive commands BEFORE any AI processing
            if (msg.includes('email') || msg.includes('inbox') || msg.includes('mail') ||
                msg.includes('calendar') || msg.includes('schedule') || msg.includes('event') || msg.includes('meeting') ||
                msg.includes('task') || msg.includes('todo') || msg.includes('reminder') ||
                msg.includes('contact') || msg.includes('people') ||
                msg.includes('drive') || msg.includes('file') || msg.includes('document')) {

                console.log('📂 [WORKSPACE] Intercepted workspace command');
                const result = await this.handleWorkspaceCommand(transcript);
                if (result) {
                    this.showTextBubble(result.response);
                    this.speak(result.response);
                    return; // EXIT - don't continue to AI
                }
            }
            // ========== END WORKSPACE INTERCEPT ==========

            // ========== REFLEX LAYER - INSTANT RESPONSES (NO LLM) ==========
            const REFLEX_RESPONSES = {
                'hey': "Hey! What's up?",
                'hello': "Hello! How can I help?",
                'hi': "Hi there! What do you need?",
                'hey phoenix': "I'm here. What do you need?",
                'hi phoenix': "Hey! What can I do for you?",
                'what time is it': () => `It's ${new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}`,
                "what's the time": () => `It's ${new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}`,
                'good morning': () => `Good morning! Ready to conquer the day?`,
                'good night': "Good night! Rest well.",
                'good evening': "Good evening! How can I help?",
                'thank you': "You're welcome!",
                'thanks': "Anytime!",
            };

            const normalizedQuery = transcript.toLowerCase().trim();
            const reflexResponse = REFLEX_RESPONSES[normalizedQuery];
            if (reflexResponse) {
                const response = typeof reflexResponse === 'function' ? reflexResponse() : reflexResponse;
                console.log('[REFLEX] ⚡ Instant response (no LLM):', response);
                this.showTextBubble(response);
                this.speak(response);
                return; // SKIP LLM ENTIRELY - saves 1-2 seconds!
            }
            // ========== END REFLEX LAYER ==========

            // ========== HEALTH/FITNESS INTERCEPT ==========
            if (msg.includes('health') || msg.includes('recovery') || msg.includes('hrv') ||
                msg.includes('sleep') || msg.includes('heart rate') || msg.includes('fitness') ||
                msg.includes('workout') || msg.includes('exercise')) {
                // Try to fetch real health data from API
                try {
                    const token = localStorage.getItem('phoenixToken');
                    const baseUrl = window.PhoenixConfig?.API_BASE_URL || 'https://pal-backend-production.up.railway.app/api';
                    const res = await fetch(`${baseUrl}/wearables/health/summary`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const healthData = await res.json();
                        if (window.widgetManager?.showOrbitalWidget) {
                            window.widgetManager.showOrbitalWidget('health', healthData);
                        }
                        this.showTextBubble(`Your recovery is at ${healthData.recoveryScore || 'N/A'}%. ${healthData.readiness || 'Check your wearable for more details.'}`);
                        this.speak(`Your recovery is at ${healthData.recoveryScore || 'not available'}. ${healthData.readiness || 'Check your wearable for more details.'}`);
                        return;
                    }
                } catch (e) { /* Fall through to default message */ }
                // No health data connected
                if (window.widgetManager?.showOrbitalWidget) {
                    window.widgetManager.showOrbitalWidget('preview-health', {});
                }
                this.showTextBubble(`Connect a wearable device like Whoop, Oura, or Apple Watch to track your health metrics. Tap the Health icon to get started.`);
                this.speak(`Connect a wearable device to track your health metrics. I can monitor your recovery, HRV, and sleep quality.`);
                return;
            }
            // ========== END HEALTH/FITNESS INTERCEPT ==========

            // ========== FINANCE INTERCEPT ==========
            if (msg.includes('budget') || msg.includes('finance') || msg.includes('spending') ||
                msg.includes('money') || msg.includes('expense') || msg.includes('savings')) {
                // Try to fetch real finance data
                try {
                    const token = localStorage.getItem('phoenixToken');
                    const baseUrl = window.PhoenixConfig?.API_BASE_URL || 'https://pal-backend-production.up.railway.app/api';
                    const res = await fetch(`${baseUrl}/finance/summary`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const financeData = await res.json();
                        if (window.widgetManager?.showOrbitalWidget) {
                            window.widgetManager.showOrbitalWidget('finance', financeData);
                        }
                        this.showTextBubble(`You have $${financeData.budgetRemaining || 0} remaining this month.`);
                        this.speak(`You have ${financeData.budgetRemaining || 'no data'} dollars remaining this month.`);
                        return;
                    }
                } catch (e) { /* Fall through to default message */ }
                // No finance data connected
                if (window.widgetManager?.showOrbitalWidget) {
                    window.widgetManager.showOrbitalWidget('preview-finance', {});
                }
                this.showTextBubble(`Connect your bank or budgeting app to track spending and savings goals. Tap the Finance icon to link your accounts.`);
                this.speak(`Connect your bank or budgeting app to track your finances. I can help you manage budgets and savings goals.`);
                return;
            }
            // ========== END FINANCE INTERCEPT ==========

            // ========== GOALS INTERCEPT ==========
            if (msg.includes('goal') || msg.includes('progress') || msg.includes('habit') ||
                msg.includes('streak') || msg.includes('tracking')) {
                // Try to fetch real goals data
                try {
                    const token = localStorage.getItem('phoenixToken');
                    const baseUrl = window.PhoenixConfig?.API_BASE_URL || 'https://pal-backend-production.up.railway.app/api';
                    const res = await fetch(`${baseUrl}/goals/active`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const goalsData = await res.json();
                        if (goalsData.goals?.length > 0 && window.widgetManager?.showOrbitalWidget) {
                            window.widgetManager.showOrbitalWidget('goals', goalsData);
                            this.showTextBubble(`You're at ${goalsData.goals[0].progress}% on ${goalsData.goals[0].name}!`);
                            this.speak(`You're at ${goalsData.goals[0].progress} percent on ${goalsData.goals[0].name}.`);
                            return;
                        }
                    }
                } catch (e) { /* Fall through to default message */ }
                // No goals set up
                if (window.widgetManager?.showOrbitalWidget) {
                    window.widgetManager.showOrbitalWidget('preview-goals', {});
                }
                this.showTextBubble(`Set up your goals in the Goals section. I'll help you track progress and build streaks.`);
                this.speak(`Set up your goals and I'll help you track your progress and build streaks.`);
                return;
            }
            // ========== END GOALS INTERCEPT ==========

            // ========== CAPABILITY QUESTIONS - SHOW PREVIEW WIDGETS ==========
            if (msg.match(/what can you do|what are your capabilities|help me|what do you do/)) {
                const response = `I'm Phoenix, your personal AI butler. I can manage your workspace - emails, calendar, tasks, contacts, and files. I track your health metrics, help with goals, handle finances, and automate daily routines. Just ask me anything or say "show me my emails" to get started.`;

                // Show preview widgets orbiting around the orb
                if (window.widgetManager && window.widgetManager.showOrbitalWidget) {
                    // Show multiple preview widgets with staggered timing
                    setTimeout(() => window.widgetManager.showOrbitalWidget('preview-health', {}), 0);
                    setTimeout(() => window.widgetManager.showOrbitalWidget('preview-finance', {}), 200);
                    setTimeout(() => window.widgetManager.showOrbitalWidget('preview-calendar', {}), 400);
                    setTimeout(() => window.widgetManager.showOrbitalWidget('preview-fitness', {}), 600);
                }

                this.showTextBubble(response);
                this.speak(response);
                return;
            }
            // ========== END CAPABILITY QUESTIONS ==========

            // STEP 1: Classify intent (ACTION vs WISDOM)
            const classification = await this.classifyCommand(transcript);

            if (classification && classification.category === 'butler_action') {
                // BUTLER ACTION: Execute real-world action
                if (DEBUG_MODE) console.log('🎯 Butler action detected:', classification.actionType);
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

            // Clear request timeout
            if (this.requestTimeout) {
                clearTimeout(this.requestTimeout);
                this.requestTimeout = null;
            }

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
            if (DEBUG_MODE) console.log('📊 Classification result:', data.classification);
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

        // GOD MODE - "Optimize my life"
        if (t.match(/optimize my life|optimize everything|god mode|full optimization|analyze everything/)) {
            return { type: 'god_mode' };
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

            case 'god_mode':
                await this.handleGodMode();
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
       GOD MODE HANDLER
       ============================================ */
    async handleGodMode() {
        console.log('[PhoenixVoice] 🌟 God Mode activated');

        // Set orb to processing state
        this.setOrbState('processing');

        // Speak confirmation
        this.speak('Initiating full life optimization. Give me a moment to analyze everything.');

        // Execute God Mode
        if (window.godMode) {
            await window.godMode.execute();
        } else {
            console.error('[PhoenixVoice] God Mode not loaded');
            this.speak('God Mode is not available. Please refresh the page.');
        }

        // Return to idle
        this.setOrbState('idle');
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

            // WORKSPACE COMMAND INTERCEPTION - Handle email/calendar/tasks/contacts/drive locally
            const workspaceResult = await this.handleWorkspaceCommand(transcript, token, baseUrl);
            if (workspaceResult) {
                console.log('📂 Workspace command handled locally');
                this.showTextBubble(workspaceResult.response);
                this.speakAsync(workspaceResult.response);
                this.setOrbState('idle');
                return;
            }

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
                if (DEBUG_MODE) console.log(`📊 Phoenix Classification: ${classificationTier}`);

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
                    let responseText = aiResponse.message || aiResponse.response;

                    // 🔧 FIX: Parse JSON-wrapped responses from backend
                    // Backend sometimes returns: {"reply": "message", "confidence": 1.0}
                    // Or with markdown code fences: ```json\n{"reply": "..."}\n```
                    try {
                        // Remove markdown code fences if present
                        let jsonText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

                        // Try to parse as JSON
                        const parsed = JSON.parse(jsonText);

                        // Extract the actual message from common JSON response formats
                        if (parsed.reply) {
                            responseText = parsed.reply;
                        } else if (parsed.message) {
                            responseText = parsed.message;
                        } else if (parsed.response) {
                            responseText = parsed.response;
                        }
                    } catch (e) {
                        // Not JSON, use as-is (this is fine - most responses are plain text)
                    }

                    // Strip any JSON metadata that might be appended to the response
                    responseText = responseText.replace(/\s*\{[^}]*"confidence_score"[^}]*\}\s*$/i, '').trim();
                    responseText = responseText.replace(/\s*\{[^}]*"mood"[^}]*\}\s*$/i, '').trim();

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

            // ⏱️ TIMING: LLM Request Start
            const t0 = Date.now();
            console.log(`[LLM_REQUEST_START] ${t0}`);

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
                // ⏱️ TIMING: Response Received
                const t1 = Date.now();
                console.log(`[LLM_RESPONSE_COMPLETE] ${t1} (+${t1 - t0}ms)`);

                const data = await response.json();
                // Backend returns: { success: true, data: { message: "..." } }
                const message = (data.data && data.data.message) || data.message || data.response || 'No response';

                // ⏱️ TIMING: Response Parsed
                const t2 = Date.now();
                console.log(`[LLM_RESPONSE_PARSED] ${t2} (+${t2 - t1}ms)`);
                console.log('✅ Received AI response:', message.substring(0, 100));

                this.speak(message);
            } else {
                console.error('❌ AI request failed:', response.status, response.statusText);
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
    /* ============================================
       PROACTIVE GREETING - Called on app open
       ============================================ */
    async proactiveGreeting(context, orchestration) {
        console.log('[PhoenixVoice] Proactive greeting triggered', context);

        // Build greeting message
        let greeting = '';

        // Time-based greeting
        const timeOfDay = context.timeOfDay || 'morning';
        if (timeOfDay === 'morning') {
            greeting = 'Good morning! ';
        } else if (timeOfDay === 'afternoon') {
            greeting = 'Good afternoon! ';
        } else if (timeOfDay === 'evening') {
            greeting = 'Good evening! ';
        } else {
            greeting = 'Hello! ';
        }

        // Add context-aware information
        const greetingParts = [greeting];

        if (context.recovery !== null && context.recovery !== undefined) {
            if (context.recovery < 60) {
                greetingParts.push(`Your recovery score is ${context.recovery} percent. You might want to take it easy today.`);
            } else if (context.recovery > 80) {
                greetingParts.push(`You're at ${context.recovery} percent recovery. You're primed for a great day.`);
            }
        }

        if (context.upcomingEvents > 0) {
            greetingParts.push(`You have ${context.upcomingEvents} event${context.upcomingEvents > 1 ? 's' : ''} on your calendar today.`);
        }

        if (context.insights && context.insights.length > 0) {
            greetingParts.push(`I found ${context.insights.length} insight${context.insights.length > 1 ? 's' : ''} for you.`);
        }

        // Fallback if no context
        if (greetingParts.length === 1) {
            greetingParts.push('How can I help you today?');
        }

        const fullGreeting = greetingParts.join(' ');

        // Speak the greeting
        await this.speak(fullGreeting);

        console.log('[PhoenixVoice] Proactive greeting complete');
    }

    async speak(text, skipStateChange = false) {
        // ⏱️ TIMING: TTS Pipeline Start
        const ttsStart = Date.now();
        console.log(`[TTS_PIPELINE_START] ${ttsStart}`);

        // Strip JSON metadata before speaking
        text = text.replace(/\s*\{[\s\S]*?"confidence_score"[\s\S]*?\}\s*$/i, '').trim();
        text = text.replace(/\s*\{[\s\S]*?"mood"[\s\S]*?\}\s*$/i, '').trim();
        text = text.replace(/\s*\{[\s\S]*?"action_taken"[\s\S]*?\}\s*$/i, '').trim();

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

            // ⏱️ TIMING: TTS Request Start
            const ttsStart = Date.now();
            console.log(`[TTS_REQUEST_SENT] ${ttsStart} (+${ttsStart - window.lastTtsStart || 0}ms)`);

            // Request base64 format for iOS compatibility
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
                    model: 'tts-1',
                    format: 'base64'        // iOS compatibility
                })
            });

            if (!response.ok) {
                throw new Error('TTS generation failed');
            }

            // ⏱️ TIMING: TTS Audio Received
            const ttsReceived = Date.now();
            console.log(`[TTS_AUDIO_RECEIVED] ${ttsReceived} (+${ttsReceived - ttsStart}ms)`);

            // Convert base64 to blob for iOS compatibility
            const data = await response.json();
            const audioBase64 = data.audio;
            const audioBytes = atob(audioBase64);
            const arrayBuffer = new ArrayBuffer(audioBytes.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioBytes.length; i++) {
                uint8Array[i] = audioBytes.charCodeAt(i);
            }
            const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });

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

            // 🔧 iOS FIX: Stop speech recognition before TTS playback
            // iOS audio session can't handle simultaneous mic input + speaker output
            const wasListening = this.isListening;
            if (wasListening && this.recognition) {
                try {
                    this.recognition.stop();
                    this.isListening = false;
                    console.log('🎤 Paused speech recognition for TTS playback');
                } catch (e) {
                    // Already stopped
                }
            }

            // FIX AUTOPLAY: Now play() is called on element created during user gesture
            try {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }

                // ⏱️ TIMING: Audio Playback Started
                const playbackStart = Date.now();
                console.log(`[AUDIO_PLAYBACK_START] ${playbackStart} (+${playbackStart - ttsReceived}ms)`);
                console.log('✅ Audio playing via OpenAI TTS');

                // 🔧 iOS FIX: Resume speech recognition after TTS completes
                if (wasListening) {
                    audio.addEventListener('ended', () => {
                        setTimeout(() => {
                            if (!this.isListening && this.recognition) {
                                try {
                                    this.recognition.start();
                                    this.isListening = true;
                                    console.log('🎤 Resumed speech recognition after TTS');
                                } catch (e) {
                                    // Handle restart error
                                }
                            }
                        }, 300); // Small delay to ensure audio session is released
                    });
                }
            } catch (playError) {
                // 🔧 iOS FIX: Resume speech recognition on playback error
                if (wasListening && this.recognition) {
                    try {
                        this.recognition.start();
                        this.isListening = true;
                    } catch (e) {
                        // Handle restart error
                    }
                }

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

            // Request base64 format for iOS compatibility
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
                    model: 'tts-1',
                    format: 'base64'        // iOS compatibility
                })
            });

            if (!response.ok) {
                throw new Error('TTS generation failed');
            }

            // Convert base64 to blob for iOS compatibility
            const data = await response.json();
            const audioBase64 = data.audio;
            const audioBytes = atob(audioBase64);
            const arrayBuffer = new ArrayBuffer(audioBytes.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioBytes.length; i++) {
                uint8Array[i] = audioBytes.charCodeAt(i);
            }
            const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });

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
            // Handle autoplay restrictions silently
            if (error.name === 'NotAllowedError' || error.message?.includes('autoplay') || error.message?.includes('user agent')) {
                // iOS/Safari autoplay block - completely normal, text already shown
            } else {
                console.error('TTS Error:', error.message);
            }
            this.clearStatusMessage();
            this.isSpeaking = false;
            this.setOrbState('idle');
        }
    }

    /* ============================================
       TEXT BUBBLE DISPLAY
       ============================================ */
    showTextBubble(text, sender = 'phoenix') {
        // Strip JSON metadata before displaying
        text = text.replace(/\s*\{[\s\S]*?"confidence_score"[\s\S]*?\}\s*$/i, '').trim();
        text = text.replace(/\s*\{[\s\S]*?"mood"[\s\S]*?\}\s*$/i, '').trim();
        text = text.replace(/\s*\{[\s\S]*?"action_taken"[\s\S]*?\}\s*$/i, '').trim();

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
       WORKSPACE COMMAND HANDLER
       Intercepts email/calendar/tasks/contacts/drive commands
       FAST: Simple string matching, no async Google check upfront
       ============================================ */
    async handleWorkspaceCommand(message, token, baseUrl) {
        try {
            const msg = message.toLowerCase();
            console.log(`📂 [Workspace] Checking: "${msg}"`);

            // FAST: Simple keyword matching
            let matchedType = null;
            if (msg.includes('email') || msg.includes('inbox') || msg.includes('mail')) {
                matchedType = 'email';
            } else if (msg.includes('calendar') || msg.includes('schedule') || msg.includes('event') || msg.includes('meeting')) {
                matchedType = 'calendar';
            } else if (msg.includes('task') || msg.includes('todo') || msg.includes('reminder')) {
                matchedType = 'tasks';
            } else if (msg.includes('contact') || msg.includes('people')) {
                matchedType = 'contacts';
            } else if (msg.includes('drive') || msg.includes('file') || msg.includes('document')) {
                matchedType = 'drive';
            }

            if (!matchedType) {
                console.log(`📂 [Workspace] No workspace keyword found`);
                return null;
            }

            if (DEBUG_MODE) console.log(`📂 [Workspace] ✓ Matched: ${matchedType}`);

            // Immediately show loading feedback
            this.showTextBubble(`Fetching your ${matchedType}...`);

            // Try to fetch data (this will check auth implicitly)
            const endpoints = {
                email: '/google/gmail/recent?limit=8',
                calendar: '/google/calendar/upcoming?limit=8',
                tasks: '/google/tasks/lists',
                contacts: '/google/contacts?limit=15',
                drive: '/google/drive/files?limit=8'
            };

            const res = await fetch(`${baseUrl}${endpoints[matchedType]}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                // Check if it's an auth issue
                if (res.status === 401) {
                    return { response: `To access your ${matchedType}, please connect your Google account. Click the DESK button at the top.` };
                }
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();

            // Check if Google not connected
            if (data.error && data.error.includes('not connected')) {
                return { response: `To access your ${matchedType}, please connect your Google account. Click the DESK button at the top.` };
            }

            // Show the ORBITAL widget (animated, positioned around orb)
            if (window.widgetManager && window.widgetManager.showOrbitalWidget) {
                window.widgetManager.showOrbitalWidget(matchedType, data);
                console.log(`🌐 [Orbital] Showing ${matchedType} widget`);
            } else if (window.showDynamicWidget) {
                // Fallback to old system
                window.showDynamicWidget(matchedType, data);
            }

            const count = data.count || data.emails?.length || data.events?.length || data.taskLists?.length || data.contacts?.length || data.files?.length || 0;
            return { response: `Here are your ${count} ${matchedType}.` };

        } catch (error) {
            console.error('📂 [Workspace] Error:', error);
            // Still return a response so we don't fall through to AI
            return { response: `I couldn't fetch your workspace data. Please check your Google connection in the DESK panel.` };
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

async function initPhoenixVoiceCommands() {
    phoenixVoiceCommands = new PhoenixVoiceCommands();
    window.phoenixVoiceCommands = phoenixVoiceCommands;
    console.log('✅ Phoenix Voice Commands loaded and initialized');

    // 🔧 FIX: Pre-warm AI backend on page load for faster first response
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            const baseUrl = (window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL)
                ? window.PhoenixConfig.API_BASE_URL
                : 'https://pal-backend-production.up.railway.app/api';

            // Fire and forget - don't block initialization
            fetch(`${baseUrl}/interface/orchestrate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: 'Phoenix ready',
                    context: 'warmup'
                })
            }).then(() => {
                console.log('🔥 [WARMUP] AI backend pre-warmed - ready for instant responses');
            }).catch(() => {
                console.log('⚠️ [WARMUP] Pre-warm failed - will be cold start on first query');
            });
        }
    } catch (e) {
        // Silent fail - not critical
    }
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
