/**
 * PHOENIX CONVERSATIONAL AI ENGINE
 * True conversational AI companion with life advice capabilities
 * 
 * Behavioral Modes:
 * - PHOENIX: Balanced, empathetic, strategic companion
 * - ALFRED: Proactive butler, anticipates needs, dignified service
 * 
 * Voice Personalities (OpenAI TTS):
 * - Echo: British Butler (default for Alfred)
 * - Nova: Friendly Helper (default for Phoenix)
 * - Onyx: Professional
 * - Fable: Storyteller
 * - Shimmer: Gentle Guide
 * - Alloy: Efficient
 * 
 * Features:
 * - Natural conversation (not commands)
 * - Context-aware using 70+ endpoints
 * - Learns from every interaction
 * - Life advice beyond fitness
 * - Proactive butler actions
 * - Emotional intelligence
 */

class PhoenixConversationalAI {
    constructor(apiClient) {
        this.api = apiClient;
        this.isListening = false;
        this.recognition = null;
        this.synthesis = null;
        
        // Conversation state
        this.conversationHistory = [];
        this.currentContext = {};
        this.sessionId = null;
        
        // Behavioral mode configuration
        this.mode = {
            type: 'PHOENIX', // PHOENIX or ALFRED
            traits: {
                analytical: 8,
                proactive: 7,
                empathetic: 8,
                formality: 5,
                humor: 6,
                verbosity: 6
            }
        };
        
        // Voice configuration
        this.voice = {
            personality: 'nova', // echo, nova, onyx, fable, shimmer, alloy
            language: 'en-US',
            rate: 1.0,
            pitch: 1.0
        };
        
        // Mode presets - UPDATED WITH OPTIMIZATION TIERS
        this.modePresets = {
            // Legacy modes (for compatibility)
            PHOENIX: {
                traits: {
                    analytical: 8,
                    proactive: 7,
                    empathetic: 8,
                    formality: 5,
                    humor: 6,
                    verbosity: 6
                },
                defaultVoice: 'nova',
                description: 'Balanced, empathetic, strategic companion'
            },
            ALFRED: {
                traits: {
                    analytical: 6,
                    proactive: 10,
                    empathetic: 8,
                    formality: 8,
                    humor: 4,
                    verbosity: 6
                },
                defaultVoice: 'echo',
                description: 'Proactive butler, dignified, anticipates needs'
            },

            // NEW OPTIMIZATION-BASED MODES
            BASIC_PHOENIX: {
                traits: {
                    analytical: 5,
                    proactive: 4,
                    empathetic: 7,
                    formality: 4,
                    humor: 6,
                    verbosity: 5
                },
                defaultVoice: 'nova',
                description: 'Basic Phoenix - Learning about you',
                optimizationRequired: 0,
                tier: 'novice',
                unlocked: true
            },
            JARVIS: {
                traits: {
                    analytical: 10,
                    proactive: 6,
                    empathetic: 5,
                    formality: 7,
                    humor: 3,
                    verbosity: 7
                },
                defaultVoice: 'echo',
                description: 'JARVIS Mode - Analytical AI with pattern recognition',
                optimizationRequired: 34,
                tier: 'jarvis',
                unlocked: false
            },
            BUTLER: {
                traits: {
                    analytical: 7,
                    proactive: 10,
                    empathetic: 8,
                    formality: 9,
                    humor: 4,
                    verbosity: 6
                },
                defaultVoice: 'onyx',
                description: 'Butler Mode - Proactive AI that takes autonomous actions',
                optimizationRequired: 67,
                tier: 'butler',
                unlocked: false
            },
            PHOENIX_OPTIMIZED: {
                traits: {
                    analytical: 10,
                    proactive: 10,
                    empathetic: 10,
                    formality: 8,
                    humor: 8,
                    verbosity: 8
                },
                defaultVoice: 'custom',
                description: 'PHOENIX OPTIMIZED - Full system mastery',
                optimizationRequired: 100,
                tier: 'optimized',
                unlocked: false
            }
        };
        
        // Voice personalities
        this.voicePersonalities = {
            echo: { name: 'Echo', description: 'British Butler', emoji: '🇬🇧' },
            nova: { name: 'Nova', description: 'Friendly Helper', emoji: '😊' },
            onyx: { name: 'Onyx', description: 'Professional', emoji: '💼' },
            fable: { name: 'Fable', description: 'Storyteller', emoji: '✨' },
            shimmer: { name: 'Shimmer', description: 'Gentle Guide', emoji: '🌸' },
            alloy: { name: 'Alloy', description: 'Efficient', emoji: '⚡' }
        };
        
        // UI elements
        this.elements = {};
        
        this.init();
    }

    /**
     * Initialize the conversational AI system
     */
    async init() {
        try {
            console.log('Initializing Phoenix Conversational AI...');

            // Setup speech recognition
            this.setupSpeechRecognition();

            // Setup speech synthesis
            this.setupSpeechSynthesis();

            // Sync personality with optimization tier
            await this.syncPersonalityWithOptimization();

            // Load saved personality settings (overrides optimization if user customized)
            await this.loadPersonalitySettings();

            // Start voice session
            await this.startVoiceSession();

            // Load conversation history
            await this.loadConversationHistory();

            // Initialize UI
            this.initializeUI();

            // Listen for optimization tier changes
            this.setupOptimizationListeners();

            console.log('Phoenix Conversational AI initialized');
            console.log(`🎭 Mode: ${this.mode.type}`);
            console.log(`🎤 Voice: ${this.voice.personality}`);
            console.log(`Optimization Score: ${this.getOptimizationScore()}%`);

        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }

    /**
     * Get current optimization score
     */
    getOptimizationScore() {
        if (window.OptimizationTracker) {
            return window.OptimizationTracker.calculateScore();
        }
        return 0;
    }

    /**
     * Get appropriate mode based on optimization score
     */
    getModeForOptimizationScore(score) {
        if (score === 100) return 'PHOENIX_OPTIMIZED';
        if (score >= 67) return 'BUTLER';
        if (score >= 34) return 'JARVIS';
        return 'BASIC_PHOENIX';
    }

    /**
     * Sync personality with optimization tier
     * Automatically upgrades AI personality as user connects more integrations
     */
    async syncPersonalityWithOptimization() {
        if (!window.OptimizationTracker) {
            console.warn('⚠️ OptimizationTracker not available, using default personality');
            this.mode.type = 'BASIC_PHOENIX';
            this.mode.traits = this.modePresets.BASIC_PHOENIX.traits;
            this.voice.personality = this.modePresets.BASIC_PHOENIX.defaultVoice;
            return;
        }

        const score = this.getOptimizationScore();
        const appropriateMode = this.getModeForOptimizationScore(score);

        // Update mode
        this.mode.type = appropriateMode;
        this.mode.traits = this.modePresets[appropriateMode].traits;
        this.voice.personality = this.modePresets[appropriateMode].defaultVoice;

        console.log(`AI Personality synced with optimization: ${appropriateMode} (${score}%)`);
    }

    /**
     * Setup listeners for optimization tier changes
     * Automatically upgrades personality when user unlocks new tier
     */
    setupOptimizationListeners() {
        // Listen for tier unlock events
        window.addEventListener('phoenixTierUnlocked', async (e) => {
            const newTier = e.detail;
            console.log('🎉 Tier unlocked, upgrading AI personality:', newTier.name);

            // Get the mode for this tier
            const newMode = this.getModeForOptimizationScore(newTier.score);

            // Upgrade personality
            await this.changeMode(newMode);

            // Announce the upgrade
            const announcements = {
                JARVIS: "Systems upgraded. JARVIS mode activated. I now have enhanced analytical capabilities and pattern recognition. How may I assist you?",
                BUTLER: "Butler mode now active, sir. I can now take proactive actions on your behalf. Simply ask, and I shall handle it.",
                PHOENIX_OPTIMIZED: "PHOENIX OPTIMIZED. Full system mastery achieved. I know you better than you know yourself. Together, we are unstoppable."
            };

            if (announcements[newMode]) {
                setTimeout(() => {
                    this.speak(announcements[newMode]);
                }, 1000);
            }
        });

        // Listen for integration connections (for incremental personality updates)
        window.addEventListener('phoenixIntegrationConnected', async (e) => {
            const score = this.getOptimizationScore();
            const currentMode = this.mode.type;
            const appropriateMode = this.getModeForOptimizationScore(score);

            // If we've crossed into a new tier, upgrade
            if (appropriateMode !== currentMode) {
                console.log(`🔄 Personality auto-upgrade: ${currentMode} → ${appropriateMode}`);
                await this.syncPersonalityWithOptimization();
            }
        });

        console.log('Optimization listeners setup');
    }

    /**
     * Setup Web Speech Recognition API
     */
    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.voice.language;
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('listening');
            this.playSound('start');
        };

        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            if (isFinal) {
                this.processConversation(transcript);
            } else {
                this.updateTranscript(transcript, false);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateStatus('error');
            this.stopListening();
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    /**
     * Setup Speech Synthesis
     */
    setupSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.error('Speech synthesis not supported');
            return;
        }

        this.synthesis = window.speechSynthesis;
    }

    /**
     * Load personality settings from backend
     */
    async loadPersonalitySettings() {
        try {
            const personality = await this.api.phoenix.companion.getPersonality();
            
            if (personality) {
                this.mode.type = personality.mode || 'PHOENIX';
                this.mode.traits = personality.traits || this.modePresets[this.mode.type].traits;
                this.voice.personality = personality.voice || this.modePresets[this.mode.type].defaultVoice;
            }
        } catch (error) {
            console.error('Failed to load personality settings:', error);
        }
    }

    /**
     * Start voice session with backend
     */
    async startVoiceSession() {
        try {
            const session = await this.api.phoenix.voice.startSession({
                mode: this.mode.type,
                voice: this.voice.personality
            });
            
            this.sessionId = session.sessionId;
        } catch (error) {
            console.error('Failed to start voice session:', error);
        }
    }

    /**
     * Load conversation history
     */
    async loadConversationHistory() {
        try {
            const history = await this.api.phoenix.companion.getHistory({ limit: 20 });
            this.conversationHistory = history || [];
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        // Get UI elements
        this.elements = {
            voiceButton: document.getElementById('voice-button'),
            voiceOverlay: document.getElementById('voice-overlay'),
            status: document.getElementById('voice-status'),
            transcript: document.getElementById('voice-transcript'),
            response: document.getElementById('voice-response'),
            modeSelector: document.getElementById('mode-selector'),
            voiceSelector: document.getElementById('voice-selector'),
            conversationContainer: document.getElementById('conversation-container')
        };

        // Setup event listeners
        if (this.elements.voiceButton) {
            this.elements.voiceButton.addEventListener('click', () => this.toggleListening());
        }

        if (this.elements.modeSelector) {
            this.elements.modeSelector.addEventListener('change', (e) => {
                this.changeMode(e.target.value);
            });
            this.elements.modeSelector.value = this.mode.type;
        }

        if (this.elements.voiceSelector) {
            this.elements.voiceSelector.addEventListener('change', (e) => {
                this.changeVoice(e.target.value);
            });
            this.elements.voiceSelector.value = this.voice.personality;
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space bar to toggle (when not in input)
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.toggleListening();
            }
        });
    }

    /**
     * Toggle listening state
     */
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    /**
     * Start listening for voice input
     */
    startListening() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        this.isListening = false;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Failed to stop recognition:', error);
        }

        this.updateStatus('idle');
        if (this.elements.voiceOverlay) {
            this.elements.voiceOverlay.classList.remove('active');
        }
        this.playSound('stop');
    }

    /**
     * Main conversation processor
     * Routes to appropriate handler based on message type
     */
    async processConversation(userMessage) {
        try {
            console.log('User message:', userMessage);
            this.updateTranscript(userMessage, true);
            this.updateStatus('processing');

            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                message: userMessage,
                timestamp: new Date().toISOString()
            });

            // Start thinking message timeout
            const thinkingTimeout = setTimeout(() => {
                this.speak("Hold on, give me a moment to process that.");
            }, 1500); // Show thinking message after 1.5s

            // Classify the conversation type
            const classification = this.classifyConversation(userMessage);
            console.log('Message classified as:', classification.type);

            // Route to appropriate handler with 5s max timeout
            let response;
            const responsePromise = (async () => {
                switch (classification.type) {
                    case 'data_query':
                        return await this.handleDataQuery(userMessage, classification);

                    case 'action_request':
                        return await this.handleButlerAction(userMessage, classification);

                    case 'life_advice':
                    case 'emotional_support':
                    case 'complex_decision':
                        return await this.handleLifeAdvice(userMessage, classification);

                    case 'general_chat':
                        return await this.handleGeneralConversation(userMessage, classification);

                    default:
                        return await this.handleFallback(userMessage);
                }
            })();

            // Race between response and 5s timeout
            response = await Promise.race([
                responsePromise,
                new Promise((resolve) => setTimeout(() => resolve({
                    reply: "I'm taking too long. Let me think about this and get back to you.",
                    quickResponse: true
                }), 5000))
            ]);

            clearTimeout(thinkingTimeout); // Cancel thinking message

            // Add to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                message: response.reply,
                timestamp: new Date().toISOString()
            });

            // Display and speak response FAST
            console.log('Phoenix response:', response.reply);
            this.updateStatus('responding');
            this.displayResponse(response);

            // Speak immediately with streaming
            await this.speak(response.reply);

            // Track behavior for learning (async, don't wait)
            this.trackBehavior(userMessage, response, classification).catch(e => console.error('Tracking error:', e));

        } catch (error) {
            console.error('Conversation processing error:', error);
            this.updateStatus('error');
            const fallbackMessage = this.getErrorMessage();
            this.displayResponse({ reply: fallbackMessage });
            this.speak(fallbackMessage);
        }
    }

    /**
     * Classify conversation type
     */
    classifyConversation(message) {
        const lowerMessage = message.toLowerCase();

        // Pattern matching for different conversation types
        const patterns = {
            life_advice: [
                /breaking up/i, /relationship/i, /girlfriend/i, /boyfriend/i,
                /job/i, /career/i, /quit/i, /scared/i, /decision/i,
                /confused/i, /don't know what to do/i, /advice/i,
                /should I/i, /what do you think/i
            ],
            emotional_support: [
                /feeling/i, /sad/i, /depressed/i, /anxious/i, /overwhelmed/i,
                /stressed/i, /can't handle/i, /too much/i, /struggling/i,
                /frustrated/i, /angry/i, /worried/i
            ],
            complex_decision: [
                /thinking about/i, /considering/i, /wondering if/i,
                /major decision/i, /big choice/i
            ],
            data_query: [
                /recovery/i, /score/i, /sleep/i, /workout/i, /calories/i,
                /weight/i, /body fat/i, /hrv/i, /protein/i, /macros/i,
                /spending/i, /budget/i, /goal/i, /progress/i
            ],
            action_request: [
                /order/i, /book/i, /schedule/i, /create/i, /generate/i,
                /call/i, /email/i, /reserve/i, /add to calendar/i,
                /make a/i, /get me/i
            ],
            greeting: [
                /^(hey|hi|hello|good morning|good evening)/i,
                /how are you/i, /what's up/i
            ]
        };

        // Check each pattern
        for (const [type, regexes] of Object.entries(patterns)) {
            for (const regex of regexes) {
                if (regex.test(message)) {
                    return { 
                        type, 
                        confidence: 0.8,
                        originalMessage: message 
                    };
                }
            }
        }

        return { type: 'general_chat', confidence: 0.5, originalMessage: message };
    }

    /**
     * Handle data queries (fitness, health, finance, goals)
     * NOW USES PHOENIXVOICE with full 7-planet context
     */
    async handleDataQuery(message, classification) {
        // Use NEW PhoenixVoice endpoint - automatically fetches all 7 planet contexts
        const response = await this.sendVoiceMessageWithContext(message);
        return response;
    }

    /**
     * Handle butler action requests
     * NOW USES PHOENIXVOICE with full 7-planet context
     */
    async handleButlerAction(message, classification) {
        // Parse the action intent
        const actionIntent = this.parseButlerIntent(message);

        // Use NEW PhoenixVoice endpoint - automatically fetches all 7 planet contexts
        const response = await this.sendVoiceMessageWithContext(message);

        // If action was identified, execute it
        if (actionIntent.action && actionIntent.canExecute) {
            await this.executeButlerAction(actionIntent);
        }

        return response;
    }

    /**
     * Handle life advice, emotional support, complex decisions
     * NOW USES PHOENIXVOICE with full 7-planet context
     */
    async handleLifeAdvice(message, classification) {
        // Use NEW PhoenixVoice endpoint - automatically fetches all 7 planet contexts
        // This gives Phoenix full awareness of your life situation for better advice
        const response = await this.sendVoiceMessageWithContext(message);
        return response;
    }

    /**
     * Handle general conversation
     * NOW USES PHOENIXVOICE with full 7-planet context
     */
    async handleGeneralConversation(message, classification) {
        // Use NEW PhoenixVoice endpoint - automatically fetches all 7 planet contexts
        const response = await this.sendVoiceMessageWithContext(message);
        return response;
    }

    /**
     * Gather full context from all planetary systems
     */
    async gatherFullContext() {
        try {
            const [
                recovery,
                biometrics,
                sleep,
                workouts,
                nutrition,
                goals,
                patterns,
                predictions,
                calendar,
                spending
            ] = await Promise.allSettled([
                this.api.mercury.recovery.getLatest().catch(() => null),
                this.api.mercury.biometrics.getComposition().catch(() => null),
                this.api.mercury.sleep.get().catch(() => null),
                this.api.venus.workouts.getHistory({ limit: 5 }).catch(() => null),
                this.api.venus.nutrition.getMacros().catch(() => null),
                this.api.mars.getGoals().catch(() => null),
                this.api.phoenix.patterns.getRealtime().catch(() => null),
                this.api.phoenix.predictions.get().catch(() => null),
                this.api.earth.calendar.getEvents({ days: 3 }).catch(() => null),
                this.api.jupiter.getSpendingPatterns({ days: 7 }).catch(() => null)
            ]);

            return {
                recovery: recovery.status === 'fulfilled' ? recovery.value : null,
                biometrics: biometrics.status === 'fulfilled' ? biometrics.value : null,
                sleep: sleep.status === 'fulfilled' ? sleep.value : null,
                recentWorkouts: workouts.status === 'fulfilled' ? workouts.value : null,
                nutrition: nutrition.status === 'fulfilled' ? nutrition.value : null,
                goals: goals.status === 'fulfilled' ? goals.value : null,
                patterns: patterns.status === 'fulfilled' ? patterns.value : null,
                predictions: predictions.status === 'fulfilled' ? predictions.value : null,
                calendar: calendar.status === 'fulfilled' ? calendar.value : null,
                spending: spending.status === 'fulfilled' ? spending.value : null,
                timestamp: new Date().toISOString(),
                mode: this.mode.type
            };
        } catch (error) {
            console.error('Error gathering context:', error);
            return { timestamp: new Date().toISOString(), mode: this.mode.type };
        }
    }

    /**
     * Gather life context (vision, goals, patterns)
     */
    async gatherLifeContext() {
        try {
            const [
                vision,
                quarterly,
                goals,
                patterns,
                stressCorrelation,
                conversationHistory
            ] = await Promise.allSettled([
                this.api.saturn.getVision().catch(() => null),
                this.api.saturn.getLatestQuarterly().catch(() => null),
                this.api.mars.getGoals().catch(() => null),
                this.api.phoenix.behavior.getPatterns().catch(() => null),
                this.api.jupiter.getStressCorrelation().catch(() => null),
                this.api.phoenix.companion.getHistory({ limit: 10 }).catch(() => null)
            ]);

            return {
                vision: vision.status === 'fulfilled' ? vision.value : null,
                quarterlyFocus: quarterly.status === 'fulfilled' ? quarterly.value : null,
                goals: goals.status === 'fulfilled' ? goals.value : null,
                patterns: patterns.status === 'fulfilled' ? patterns.value : null,
                stressFactors: stressCorrelation.status === 'fulfilled' ? stressCorrelation.value : null,
                pastConversations: conversationHistory.status === 'fulfilled' ? conversationHistory.value : null,
                timestamp: new Date().toISOString(),
                mode: this.mode.type
            };
        } catch (error) {
            console.error('Error gathering life context:', error);
            return { timestamp: new Date().toISOString(), mode: this.mode.type };
        }
    }

    /**
     * Parse butler action intent from message
     */
    parseButlerIntent(message) {
        const lowerMessage = message.toLowerCase();

        // Food ordering
        if (/order|food|hungry|eat|delivery/.test(lowerMessage)) {
            const restaurantMatch = lowerMessage.match(/from\s+(\w+)/i);
            return {
                action: 'order_food',
                restaurant: restaurantMatch ? restaurantMatch[1] : null,
                canExecute: true
            };
        }

        // Ride booking
        if (/uber|lyft|ride|drive/.test(lowerMessage)) {
            const destMatch = lowerMessage.match(/to\s+(.+?)(?:\s|$)/i);
            return {
                action: 'book_ride',
                destination: destMatch ? destMatch[1] : null,
                canExecute: true
            };
        }

        // Reservation
        if (/reservation|reserve|table/.test(lowerMessage)) {
            return {
                action: 'make_reservation',
                canExecute: true
            };
        }

        // Calendar
        if (/schedule|calendar|add to|put in/.test(lowerMessage)) {
            return {
                action: 'add_to_calendar',
                canExecute: true
            };
        }

        // Call
        if (/call|phone/.test(lowerMessage)) {
            return {
                action: 'make_call',
                canExecute: true
            };
        }

        // Email
        if (/email|send/.test(lowerMessage)) {
            return {
                action: 'send_email',
                canExecute: true
            };
        }

        return {
            action: null,
            canExecute: false
        };
    }

    /**
     * Execute butler action
     */
    async executeButlerAction(actionIntent) {
        try {
            switch (actionIntent.action) {
                case 'order_food':
                    await this.api.phoenix.butler.orderFood({
                        restaurant: actionIntent.restaurant
                    });
                    break;
                
                case 'book_ride':
                    await this.api.phoenix.butler.bookRide({
                        destination: actionIntent.destination
                    });
                    break;
                
                case 'make_reservation':
                    await this.api.phoenix.butler.makeReservation({});
                    break;
                
                case 'add_to_calendar':
                    await this.api.phoenix.butler.addToCalendar({});
                    break;
                
                case 'make_call':
                    await this.api.phoenix.butler.makeCall({});
                    break;
                
                case 'send_email':
                    await this.api.phoenix.butler.sendEmail({});
                    break;
            }
        } catch (error) {
            console.error('Butler action execution error:', error);
        }
    }

    /**
     * Track behavior for learning
     */
    async trackBehavior(userMessage, response, classification) {
        try {
            await this.api.phoenix.behavior.track({
                action: 'conversation',
                message: userMessage,
                conversationType: classification.type,
                response: response.reply,
                mode: this.mode.type,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to track behavior:', error);
        }
    }

    /**
     * Change behavioral mode
     */
    async changeMode(newMode) {
        try {
            // Update mode
            this.mode.type = newMode;
            this.mode.traits = this.modePresets[newMode].traits;

            // Update voice to default for new mode
            this.voice.personality = this.modePresets[newMode].defaultVoice;

            // Save to backend
            await this.api.phoenix.companion.updatePersonality({
                mode: this.mode.type,
                traits: this.mode.traits,
                voice: this.voice.personality
            });

            // Update UI
            if (this.elements.voiceSelector) {
                this.elements.voiceSelector.value = this.voice.personality;
            }

            // Announce change
            const announcement = this.mode.type === 'PHOENIX' 
                ? "Switched to Phoenix mode - balanced and empathetic."
                : "Switched to Alfred mode - proactive butler service activated, sir.";
            
            this.speak(announcement);

        } catch (error) {
            console.error('Failed to change mode:', error);
        }
    }

    /**
     * Change voice personality
     */
    async changeVoice(newVoice) {
        try {
            this.voice.personality = newVoice;

            // Save to backend
            await this.api.phoenix.companion.updatePersonality({
                mode: this.mode.type,
                traits: this.mode.traits,
                voice: this.voice.personality
            });

            // Announce change
            const voiceInfo = this.voicePersonalities[newVoice];
            this.speak(`Voice changed to ${voiceInfo.name}.`);

        } catch (error) {
            console.error('Failed to change voice:', error);
        }
    }

    /**
     * Speak text using OpenAI TTS (high quality, fast)
     */
    async speak(text) {
        try {
            // Stop any currently playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }

            // Get voice from localStorage (set during onboarding)
            const savedVoice = localStorage.getItem('phoenixVoice') || this.voice.personality || 'nova';
            const savedLanguageCode = localStorage.getItem('phoenixLanguage') || 'en';

            // Map language codes to backend format (en → en-US, es → es-ES, etc.)
            const languageMap = {
                'en': 'en-US',
                'es': 'es-ES',
                'fr': 'fr-FR',
                'de': 'de-DE',
                'it': 'it-IT',
                'pt': 'pt-BR',
                'nl': 'nl-NL',
                'pl': 'pl-PL'
            };
            const savedLanguage = languageMap[savedLanguageCode] || 'en-US';

            console.log(`Speaking with voice: ${savedVoice}, language: ${savedLanguage}`);

            // Call backend TTS endpoint
            const response = await fetch('https://pal-backend-production.up.railway.app/api/tts/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: savedVoice,
                    language: savedLanguage
                })
            });

            if (!response.ok) {
                throw new Error(`TTS failed: ${response.status}`);
            }

            // Get audio blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Play immediately
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl); // Clean up memory
                this.currentAudio = null;
                this.updateStatus('idle');
            };

            await this.currentAudio.play();
            console.log('TTS audio playing');

        } catch (error) {
            console.error('TTS error:', error);

            // Fallback to browser speech if TTS fails
            if (this.synthesis) {
                const utterance = new SpeechSynthesisUtterance(text);
                this.synthesis.speak(utterance);
            }
        }
    }

    /**
     * Display response in UI
     */
    displayResponse(response) {
        if (!this.elements.response) return;

        this.elements.response.textContent = response.reply;

        // Show suggested actions if any
        if (response.suggestedActions && response.suggestedActions.length > 0) {
            this.displaySuggestedActions(response.suggestedActions);
        }

        // Add to conversation container
        if (this.elements.conversationContainer) {
            this.addMessageToConversation('assistant', response.reply);
        }
    }

    /**
     * Display suggested action buttons
     */
    displaySuggestedActions(actions) {
        const actionsContainer = document.getElementById('suggested-actions');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = '';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'suggested-action-btn';
            button.textContent = action.text;
            button.onclick = () => this.handleSuggestedAction(action);
            actionsContainer.appendChild(button);
        });
    }

    /**
     * Handle suggested action click
     */
    async handleSuggestedAction(action) {
        // Process the action as if user said it
        await this.processConversation(action.text);
    }

    /**
     * Add message to conversation display
     */
    addMessageToConversation(role, message) {
        if (!this.elements.conversationContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '⚡';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.elements.conversationContainer.appendChild(messageDiv);
        this.elements.conversationContainer.scrollTop = this.elements.conversationContainer.scrollHeight;
    }

    /**
     * Update status display
     */
    updateStatus(status) {
        if (!this.elements.status) return;

        const statusMap = {
            idle: { text: 'Voice Inactive', class: 'idle', emoji: '🔴' },
            listening: { text: 'Listening...', class: 'listening', emoji: '🎤' },
            processing: { text: 'Thinking...', class: 'processing', emoji: '🧠' },
            responding: { text: 'Speaking...', class: 'responding', emoji: '💬' },
            error: { text: 'Error', class: 'error', emoji: '⚠️' }
        };

        const statusInfo = statusMap[status] || statusMap.idle;
        this.elements.status.textContent = `${statusInfo.emoji} ${statusInfo.text}`;
        this.elements.status.className = `voice-status ${statusInfo.class}`;
    }

    /**
     * Update transcript display
     */
    updateTranscript(text, isFinal) {
        if (!this.elements.transcript) return;

        this.elements.transcript.textContent = text;
        this.elements.transcript.classList.toggle('final', isFinal);

        if (isFinal && this.elements.conversationContainer) {
            this.addMessageToConversation('user', text);
        }
    }

    /**
     * Play sound effect
     */
    playSound(type) {
        // Could add audio feedback here
        console.log(`🔊 Sound: ${type}`);
    }

    /**
     * Get error message based on personality
     */
    getErrorMessage() {
        if (this.mode.type === 'ALFRED') {
            return "My apologies, sir. I encountered a difficulty processing that request. Might we try again?";
        } else {
            return "Sorry, I had trouble with that. Can you try asking again?";
        }
    }

    /**
     * Handle fallback for unrecognized input
     * NOW USES PHOENIXVOICE with full 7-planet context
     */
    async handleFallback(message) {
        // Use NEW PhoenixVoice endpoint - automatically fetches all 7 planet contexts
        return await this.sendVoiceMessageWithContext(message);
    }

    /**
     * Clear conversation history
     */
    async clearHistory() {
        try {
            await this.api.phoenix.companion.clearHistory();
            this.conversationHistory = [];
            
            if (this.elements.conversationContainer) {
                this.elements.conversationContainer.innerHTML = '';
            }

            this.speak(this.mode.type === 'ALFRED' 
                ? "Conversation history cleared, sir." 
                : "History cleared. Fresh start!");

        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }

    /**
     * Use NEW PhoenixVoice endpoint with full 7-planet context
     * This is the "learning you" system - automatically fetches:
     * - Mercury: Recovery, sleep, HRV, wearables
     * - Venus: Workouts, nutrition this week
     * - Earth: Today's calendar, energy levels
     * - Mars: Active goals, progress
     * - Jupiter: Financial status, budgets
     * - Saturn: Legacy vision, life satisfaction
     *
     * Use this for voice conversations that need full user context
     */
    async sendVoiceMessageWithContext(message) {
        try {
            const personalityMap = {
                'PHOENIX': 'friendly_helpful',
                'ALFRED': 'british_refined',
                'BASIC_PHOENIX': 'friendly_helpful',
                'JARVIS': 'analytical_robotic',
                'BUTLER': 'british_refined',
                'PHOENIX_OPTIMIZED': 'master_ai'
            };

            console.log('Sending to PhoenixVoice API...', {
                message: message.substring(0, 50),
                personality: personalityMap[this.mode.type] || 'friendly_helpful',
                voice: this.voice.personality
            });

            const response = await this.api.phoenixVoiceChat({
                message: message,
                conversationHistory: this.conversationHistory.slice(-10),
                personality: personalityMap[this.mode.type] || 'friendly_helpful',
                voice: this.voice.personality,
                mode: this.mode.type,
                optimizationScore: this.getOptimizationScore(),
                traits: this.mode.traits
            });

            console.log('PhoenixVoice API response:', response);

            if (response.success) {
                return {
                    reply: response.response,
                    personality: response.personality,
                    voice: response.voice,
                    timestamp: response.timestamp,
                    hasFullContext: true
                };
            } else {
                throw new Error(response.error || 'Voice chat failed');
            }

        } catch (error) {
            console.error('PhoenixVoice chat error:', error);
            // Fallback to regular companion chat
            return await this.api.phoenix.companion.chat({
                message: message,
                context: await this.gatherFullContext()
            });
        }
    }

    /**
     * Get current personality info
     */
    getPersonalityInfo() {
        return {
            mode: this.mode.type,
            modeDescription: this.modePresets[this.mode.type].description,
            voice: this.voice.personality,
            voiceDescription: this.voicePersonalities[this.voice.personality].description,
            traits: this.mode.traits
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoenixConversationalAI;
}
