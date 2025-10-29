/**
 * 🔥 PHOENIX CONVERSATIONAL AI ENGINE
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
        
        // Mode presets
        this.modePresets = {
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
            console.log('🔥 Initializing Phoenix Conversational AI...');
            
            // Setup speech recognition
            this.setupSpeechRecognition();
            
            // Setup speech synthesis
            this.setupSpeechSynthesis();
            
            // Load saved personality settings
            await this.loadPersonalitySettings();
            
            // Start voice session
            await this.startVoiceSession();
            
            // Load conversation history
            await this.loadConversationHistory();
            
            // Initialize UI
            this.initializeUI();
            
            console.log('✅ Phoenix Conversational AI initialized');
            console.log(`🎭 Mode: ${this.mode.type}`);
            console.log(`🎤 Voice: ${this.voice.personality}`);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
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
            this.updateTranscript(userMessage, true);
            this.updateStatus('processing');

            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                message: userMessage,
                timestamp: new Date().toISOString()
            });

            // Classify the conversation type
            const classification = this.classifyConversation(userMessage);

            // Route to appropriate handler
            let response;
            switch (classification.type) {
                case 'data_query':
                    response = await this.handleDataQuery(userMessage, classification);
                    break;
                
                case 'action_request':
                    response = await this.handleButlerAction(userMessage, classification);
                    break;
                
                case 'life_advice':
                case 'emotional_support':
                case 'complex_decision':
                    response = await this.handleLifeAdvice(userMessage, classification);
                    break;
                
                case 'general_chat':
                    response = await this.handleGeneralConversation(userMessage, classification);
                    break;
                
                default:
                    response = await this.handleFallback(userMessage);
            }

            // Add to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                message: response.reply,
                timestamp: new Date().toISOString()
            });

            // Display and speak response
            this.updateStatus('responding');
            this.displayResponse(response);
            this.speak(response.reply);

            // Track behavior for learning
            await this.trackBehavior(userMessage, response, classification);

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
     * Speak text using selected voice
     */
    speak(text) {
        if (!this.synthesis) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.voice.rate;
        utterance.pitch = this.voice.pitch;

        // Try to find a voice that matches the personality
        const voices = this.synthesis.getVoices();
        
        // Map personalities to voice preferences
        const voicePreferences = {
            echo: ['Google UK English Male', 'Microsoft George', 'en-GB'],
            nova: ['Google US English', 'Microsoft Zira', 'en-US'],
            onyx: ['Google US English Male', 'Microsoft David', 'en-US'],
            fable: ['Google US English Female', 'Microsoft Zira', 'en-US'],
            shimmer: ['Google UK English Female', 'Microsoft Hazel', 'en-GB'],
            alloy: ['Google US English', 'Microsoft Mark', 'en-US']
        };

        const preferences = voicePreferences[this.voice.personality] || ['en-US'];
        
        for (const pref of preferences) {
            const matchingVoice = voices.find(v => v.name.includes(pref) || v.lang.includes(pref));
            if (matchingVoice) {
                utterance.voice = matchingVoice;
                break;
            }
        }

        this.synthesis.speak(utterance);
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
        avatar.textContent = role === 'user' ? '👤' : '🔥';
        
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
                'ALFRED': 'british_refined'
            };

            const response = await this.api.phoenixVoiceChat({
                message: message,
                conversationHistory: this.conversationHistory.slice(-10),
                personality: personalityMap[this.mode.type] || 'friendly_helpful',
                voice: this.voice.personality
            });

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
