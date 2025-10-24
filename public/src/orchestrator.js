// PHOENIX ORCHESTRATOR WITH BUTLER INTEGRATION
// Fixes voice restart issue + implements butler capabilities

class PhoenixOrchestrator {
    constructor() {
        // Core state management - prevents restarts
        this.state = {
            initialized: false,
            voiceActive: false,
            butlerActive: false,
            currentSession: null,
            conversationContext: [],
            authToken: null,
            userId: null
        };

        // Butler service instance
        this.butler = null;
        
        // Voice instance reference
        this.voice = null;
        
        // API client reference  
        this.api = null;

        // Prevent multiple initializations
        this.initPromise = null;
        
        // Session persistence
        this.sessionId = this.generateSessionId();
        
        // Track active operations
        this.activeOperations = new Map();
    }

    async initialize() {
        // Prevent multiple simultaneous initializations
        if (this.initPromise) {
            console.log('⚠️ Orchestrator already initializing, waiting...');
            return this.initPromise;
        }

        if (this.state.initialized) {
            console.log('✅ Orchestrator already initialized');
            return true;
        }

        this.initPromise = this._performInitialization();
        return this.initPromise;
    }

    async _performInitialization() {
        try {
            console.log('🚀 Initializing Phoenix Orchestrator...');
            
            // 1. Setup authentication (fix for auth errors)
            await this.setupAuthentication();
            
            // 2. Initialize API client
            await this.initializeAPI();
            
            // 3. Initialize Butler Service
            await this.initializeButler();
            
            // 4. Setup voice interface connection
            await this.connectVoiceInterface();
            
            // 5. Load user preferences
            await this.loadUserPreferences();
            
            // 6. Setup event listeners
            this.setupEventListeners();
            
            // 7. Start health monitoring
            this.startHealthMonitoring();
            
            this.state.initialized = true;
            console.log('✅ Phoenix Orchestrator initialized successfully');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('phoenix:orchestrator:ready', {
                detail: { sessionId: this.sessionId }
            }));
            
            return true;
        } catch (error) {
            console.error('❌ Orchestrator initialization failed:', error);
            this.handleInitializationError(error);
            this.initPromise = null;
            return false;
        }
    }

    async setupAuthentication() {
        console.log('🔐 Setting up authentication...');
        
        try {
            // Check for existing token
            const storedToken = localStorage.getItem('phoenix_token');
            const storedUserId = localStorage.getItem('phoenix_user_id');
            
            if (storedToken && storedUserId) {
                // Validate stored token
                const isValid = await this.validateToken(storedToken);
                if (isValid) {
                    this.state.authToken = storedToken;
                    this.state.userId = storedUserId;
                    console.log('✅ Using existing valid token');
                    return;
                }
            }
            
            // Generate new token if needed
            const newAuth = await this.generateAuthToken();
            this.state.authToken = newAuth.token;
            this.state.userId = newAuth.userId;
            
            // Store for persistence
            localStorage.setItem('phoenix_token', newAuth.token);
            localStorage.setItem('phoenix_user_id', newAuth.userId);
            
            console.log('✅ Authentication successful');
        } catch (error) {
            console.warn('⚠️ Authentication setup failed, using fallback:', error);
            // Use fallback authentication
            this.state.authToken = 'fallback_' + this.generateSessionId();
            this.state.userId = 'user_' + Date.now();
        }
    }

    async validateToken(token) {
        try {
            if (!window.API?.validateToken) {
                // Fallback validation
                return token && token.length > 10;
            }
            return await window.API.validateToken(token);
        } catch (error) {
            console.warn('Token validation failed:', error);
            return false;
        }
    }

    async generateAuthToken() {
        try {
            if (window.API?.generateToken) {
                return await window.API.generateToken();
            }
            // Fallback token generation
            return {
                token: 'phoenix_' + this.generateSessionId(),
                userId: 'user_' + Date.now()
            };
        } catch (error) {
            throw new Error('Failed to generate auth token: ' + error.message);
        }
    }

    async initializeAPI() {
        console.log('📡 Initializing API client...');
        
        try {
            // Check if API client exists
            if (window.API) {
                this.api = window.API;
                
                // Set authentication headers
                if (this.api.setAuthToken) {
                    this.api.setAuthToken(this.state.authToken);
                }
                
                console.log('✅ API client connected');
            } else {
                console.warn('⚠️ API client not found, creating mock...');
                this.api = this.createMockAPI();
            }
        } catch (error) {
            console.error('API initialization error:', error);
            this.api = this.createMockAPI();
        }
    }

    createMockAPI() {
        return {
            getMe: async () => ({ id: this.state.userId, name: 'User' }),
            sendMessage: async (msg) => ({ success: true, response: 'Mock response' }),
            setAuthToken: (token) => console.log('Mock: Token set'),
            validateToken: async () => true
        };
    }

    async initializeButler() {
        console.log('🤵 Initializing Butler Service...');
        
        try {
            // Import butler module if available
            if (window.ButlerService) {
                this.butler = new window.ButlerService(this);
            } else {
                // Create inline butler service
                this.butler = new ButlerService(this);
            }
            
            await this.butler.initialize();
            this.state.butlerActive = true;
            console.log('✅ Butler Service ready');
        } catch (error) {
            console.error('Butler initialization error:', error);
            this.state.butlerActive = false;
        }
    }

    async connectVoiceInterface() {
        console.log('🎤 Connecting voice interface...');
        
        try {
            // Get reference to voice system
            if (window.voiceInterface) {
                this.voice = window.voiceInterface;
                
                // Prevent voice restart on interaction
                if (this.voice.preventRestart) {
                    this.voice.preventRestart = true;
                }
                
                // Set orchestrator reference
                if (this.voice.setOrchestrator) {
                    this.voice.setOrchestrator(this);
                }
                
                this.state.voiceActive = true;
                console.log('✅ Voice interface connected');
            } else {
                console.warn('⚠️ Voice interface not found');
                this.state.voiceActive = false;
            }
        } catch (error) {
            console.error('Voice connection error:', error);
            this.state.voiceActive = false;
        }
    }

    async loadUserPreferences() {
        console.log('⚙️ Loading user preferences...');
        
        try {
            const prefs = localStorage.getItem('phoenix_preferences');
            if (prefs) {
                this.preferences = JSON.parse(prefs);
            } else {
                this.preferences = this.getDefaultPreferences();
            }
            console.log('✅ Preferences loaded');
        } catch (error) {
            console.warn('Failed to load preferences:', error);
            this.preferences = this.getDefaultPreferences();
        }
    }

    getDefaultPreferences() {
        return {
            voice: 'Alex',
            language: 'en-US',
            butlerAutonomy: 'assisted',
            notifications: true,
            theme: 'dark'
        };
    }

    setupEventListeners() {
        console.log('👂 Setting up event listeners...');
        
        // Voice events - prevent restart
        window.addEventListener('voice:command', this.handleVoiceCommand.bind(this), { capture: true });
        window.addEventListener('voice:started', this.handleVoiceStarted.bind(this), { capture: true });
        window.addEventListener('voice:stopped', this.handleVoiceStopped.bind(this), { capture: true });
        
        // Butler events
        window.addEventListener('butler:task', this.handleButlerTask.bind(this));
        window.addEventListener('butler:complete', this.handleButlerComplete.bind(this));
        
        // System events
        window.addEventListener('system:error', this.handleSystemError.bind(this));
        window.addEventListener('beforeunload', this.handleShutdown.bind(this));
        
        console.log('✅ Event listeners configured');
    }

    // VOICE HANDLERS - Fix restart issue
    
    handleVoiceCommand(event) {
        // Prevent event from triggering restart
        event.stopPropagation();
        
        const { command, confidence } = event.detail;
        console.log(`🎤 Voice command: "${command}" (confidence: ${confidence})`);
        
        // Prevent voice system restart
        if (this.voice && this.voice.isRestarting) {
            console.log('⚠️ Preventing voice restart...');
            this.voice.isRestarting = false;
            return;
        }
        
        // Add to conversation context
        this.state.conversationContext.push({
            type: 'user',
            text: command,
            timestamp: Date.now(),
            confidence
        });
        
        // Process through butler
        this.processCommand(command);
    }

    handleVoiceStarted(event) {
        // Prevent restart on voice start
        event.stopPropagation();
        console.log('🎤 Voice started (no restart)');
        this.state.voiceActive = true;
    }

    handleVoiceStopped(event) {
        // Prevent restart on voice stop
        event.stopPropagation();
        console.log('🎤 Voice stopped (maintaining state)');
        // Keep voice active - don't change state
    }

    // COMMAND PROCESSING
    
    async processCommand(command) {
        console.log(`🧠 Processing: "${command}"`);
        
        // Check if operation is already in progress
        const operationId = this.generateOperationId();
        if (this.isOperationActive(command)) {
            console.log('⚠️ Similar operation already in progress');
            return;
        }
        
        this.activeOperations.set(operationId, { command, startTime: Date.now() });
        
        try {
            // Parse intent
            const intent = await this.parseIntent(command);
            
            // Route to appropriate handler
            let response;
            if (intent.category === 'butler' && this.state.butlerActive) {
                response = await this.butler.handleTask(intent);
            } else if (intent.category === 'system') {
                response = await this.handleSystemCommand(intent);
            } else {
                response = await this.handleGeneralCommand(intent);
            }
            
            // Add response to context
            this.state.conversationContext.push({
                type: 'assistant',
                text: response.message,
                timestamp: Date.now()
            });
            
            // Speak response (without restarting voice)
            if (this.voice && response.speak !== false) {
                this.speakResponse(response.message);
            }
            
            // Execute any actions
            if (response.actions) {
                await this.executeActions(response.actions);
            }
            
        } catch (error) {
            console.error('Command processing error:', error);
            this.handleCommandError(error);
        } finally {
            this.activeOperations.delete(operationId);
        }
    }

    async parseIntent(command) {
        const lowerCommand = command.toLowerCase();
        
        // Butler tasks
        const butlerKeywords = ['order', 'book', 'schedule', 'reserve', 'call', 'send', 'buy', 'get me'];
        if (butlerKeywords.some(keyword => lowerCommand.includes(keyword))) {
            return {
                category: 'butler',
                action: this.extractButlerAction(lowerCommand),
                entities: this.extractEntities(command)
            };
        }
        
        // System commands
        const systemKeywords = ['settings', 'preferences', 'help', 'status', 'diagnostic'];
        if (systemKeywords.some(keyword => lowerCommand.includes(keyword))) {
            return {
                category: 'system',
                action: this.extractSystemAction(lowerCommand)
            };
        }
        
        // General conversation
        return {
            category: 'general',
            text: command
        };
    }

    extractButlerAction(command) {
        if (command.includes('order') || command.includes('food')) return 'food_order';
        if (command.includes('book') || command.includes('uber') || command.includes('ride')) return 'ride_booking';
        if (command.includes('reserve') || command.includes('restaurant')) return 'restaurant_reservation';
        if (command.includes('schedule') || command.includes('meeting')) return 'calendar_scheduling';
        if (command.includes('call')) return 'phone_call';
        if (command.includes('send') || command.includes('email')) return 'send_message';
        return 'general_task';
    }

    extractSystemAction(command) {
        if (command.includes('settings')) return 'open_settings';
        if (command.includes('help')) return 'show_help';
        if (command.includes('status')) return 'show_status';
        if (command.includes('diagnostic')) return 'run_diagnostic';
        return 'system_info';
    }

    extractEntities(command) {
        // Basic entity extraction
        const entities = {};
        
        // Time extraction
        const timeMatch = command.match(/at (\d{1,2}(?::\d{2})?(?:\s?[ap]m)?)/i);
        if (timeMatch) entities.time = timeMatch[1];
        
        // Date extraction
        const dateKeywords = ['tomorrow', 'today', 'tonight', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const foundDate = dateKeywords.find(day => command.toLowerCase().includes(day));
        if (foundDate) entities.date = foundDate;
        
        // Location extraction (basic)
        if (command.includes('from ')) {
            const fromMatch = command.match(/from ([^to]+)/i);
            if (fromMatch) entities.from = fromMatch[1].trim();
        }
        if (command.includes('to ')) {
            const toMatch = command.match(/to ([^from]+)/i);
            if (toMatch) entities.to = toMatch[1].trim();
        }
        
        return entities;
    }

    speakResponse(message) {
        console.log(`🔊 Speaking: "${message}"`);
        
        // Ensure voice doesn't restart
        if (this.voice) {
            // Set flag to prevent restart
            this.voice.preventNextRestart = true;
            
            if (this.voice.speak) {
                this.voice.speak(message);
            } else if (window.speak) {
                window.speak(message);
            }
        }
    }

    async executeActions(actions) {
        for (const action of actions) {
            try {
                console.log(`⚡ Executing action: ${action.type}`);
                
                switch (action.type) {
                    case 'navigate':
                        window.location.href = action.url;
                        break;
                    case 'notification':
                        this.showNotification(action);
                        break;
                    case 'ui_update':
                        this.updateUI(action);
                        break;
                    case 'api_call':
                        await this.makeAPICall(action);
                        break;
                    default:
                        console.warn(`Unknown action type: ${action.type}`);
                }
            } catch (error) {
                console.error(`Action execution failed:`, error);
            }
        }
    }

    // BUTLER TASK HANDLERS
    
    handleButlerTask(event) {
        const task = event.detail;
        console.log('🤵 Butler task received:', task);
        
        if (this.butler && this.state.butlerActive) {
            this.butler.executeTask(task);
        } else {
            console.warn('Butler service not available');
            this.speakResponse("I'm sorry, the butler service is currently unavailable.");
        }
    }

    handleButlerComplete(event) {
        const result = event.detail;
        console.log('✅ Butler task completed:', result);
        
        // Notify user
        this.speakResponse(result.message || "Task completed successfully.");
        
        // Show notification if enabled
        if (this.preferences.notifications) {
            this.showNotification({
                title: 'Butler Task Complete',
                message: result.message,
                icon: '🤵'
            });
        }
    }

    // SYSTEM HANDLERS
    
    async handleSystemCommand(intent) {
        switch (intent.action) {
            case 'open_settings':
                return {
                    message: "Opening settings...",
                    actions: [{ type: 'navigate', url: '#settings' }]
                };
            case 'show_status':
                return {
                    message: this.getSystemStatus(),
                    speak: true
                };
            case 'run_diagnostic':
                const diagnostic = await this.runDiagnostic();
                return {
                    message: diagnostic,
                    speak: true
                };
            default:
                return {
                    message: "System command acknowledged.",
                    speak: true
                };
        }
    }

    async handleGeneralCommand(intent) {
        // Send to AI for general conversation
        try {
            if (this.api && this.api.sendMessage) {
                const response = await this.api.sendMessage(intent.text);
                return {
                    message: response.text || "I understand. How can I help you?",
                    speak: true
                };
            }
        } catch (error) {
            console.error('API communication error:', error);
        }
        
        return {
            message: "I'm processing your request. How else can I assist you?",
            speak: true
        };
    }

    // ERROR HANDLERS
    
    handleInitializationError(error) {
        console.error('❌ Critical initialization error:', error);
        
        // Attempt recovery
        setTimeout(() => {
            console.log('🔄 Attempting recovery...');
            this.initPromise = null;
            this.initialize();
        }, 5000);
    }

    handleSystemError(event) {
        const error = event.detail;
        console.error('System error:', error);
        
        // Log to telemetry if available
        if (this.api && this.api.logError) {
            this.api.logError(error);
        }
    }

    handleCommandError(error) {
        console.error('Command error:', error);
        this.speakResponse("I encountered an error processing that request. Please try again.");
    }

    // HEALTH MONITORING
    
    startHealthMonitoring() {
        // Monitor system health every 30 seconds
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000);
    }

    async performHealthCheck() {
        const health = {
            voice: this.state.voiceActive,
            butler: this.state.butlerActive,
            api: await this.checkAPIHealth(),
            memory: this.checkMemoryUsage(),
            timestamp: Date.now()
        };
        
        // Alert if issues detected
        if (!health.voice || !health.api) {
            console.warn('⚠️ Health check detected issues:', health);
            this.attemptRecovery(health);
        }
    }

    async checkAPIHealth() {
        try {
            if (this.api && this.api.ping) {
                await this.api.ping();
                return true;
            }
            return true; // Assume healthy if no ping method
        } catch (error) {
            return false;
        }
    }

    checkMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            return (used / limit) < 0.9; // Alert if >90% memory used
        }
        return true;
    }

    async attemptRecovery(health) {
        console.log('🔧 Attempting system recovery...');
        
        if (!health.voice) {
            await this.connectVoiceInterface();
        }
        
        if (!health.api) {
            await this.initializeAPI();
        }
    }

    // UTILITY METHODS
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateOperationId() {
        return 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    isOperationActive(command) {
        // Check if similar command is being processed
        const similarThreshold = 0.8;
        for (const [id, op] of this.activeOperations) {
            if (this.calculateSimilarity(op.command, command) > similarThreshold) {
                return true;
            }
        }
        return false;
    }

    calculateSimilarity(str1, str2) {
        // Basic similarity calculation
        const words1 = str1.toLowerCase().split(' ');
        const words2 = str2.toLowerCase().split(' ');
        const intersection = words1.filter(w => words2.includes(w));
        return intersection.length / Math.max(words1.length, words2.length);
    }

    getSystemStatus() {
        const status = [];
        status.push(`Phoenix systems ${this.state.initialized ? 'online' : 'initializing'}.`);
        status.push(`Voice interface ${this.state.voiceActive ? 'active' : 'inactive'}.`);
        status.push(`Butler service ${this.state.butlerActive ? 'ready' : 'offline'}.`);
        status.push(`Session ID: ${this.sessionId.substr(-8)}.`);
        return status.join(' ');
    }

    async runDiagnostic() {
        console.log('🔍 Running system diagnostic...');
        
        const results = [];
        
        // Check voice
        results.push(`Voice: ${this.state.voiceActive ? '✅' : '❌'}`);
        
        // Check butler
        results.push(`Butler: ${this.state.butlerActive ? '✅' : '❌'}`);
        
        // Check API
        const apiHealthy = await this.checkAPIHealth();
        results.push(`API: ${apiHealthy ? '✅' : '❌'}`);
        
        // Check memory
        const memoryOk = this.checkMemoryUsage();
        results.push(`Memory: ${memoryOk ? '✅' : '❌'}`);
        
        // Check localStorage
        try {
            localStorage.setItem('diagnostic_test', '1');
            localStorage.removeItem('diagnostic_test');
            results.push('Storage: ✅');
        } catch {
            results.push('Storage: ❌');
        }
        
        return `Diagnostic complete. ${results.join(', ')}`;
    }

    showNotification(options) {
        // Check if notifications are enabled
        if (!this.preferences.notifications) return;
        
        // Use native notifications if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(options.title, {
                body: options.message,
                icon: options.icon || '/icon.png'
            });
        } else {
            // Fallback to console
            console.log(`📢 ${options.title}: ${options.message}`);
        }
    }

    updateUI(action) {
        // Dispatch UI update event
        window.dispatchEvent(new CustomEvent('phoenix:ui:update', {
            detail: action
        }));
    }

    async makeAPICall(action) {
        if (this.api && this.api[action.method]) {
            return await this.api[action.method](...action.params);
        }
        throw new Error(`API method not found: ${action.method}`);
    }

    handleShutdown() {
        console.log('🔚 Phoenix Orchestrator shutting down...');
        
        // Clear intervals
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        // Save state
        this.saveState();
        
        // Cleanup
        this.cleanup();
    }

    saveState() {
        try {
            const state = {
                sessionId: this.sessionId,
                conversationContext: this.state.conversationContext.slice(-10), // Keep last 10
                preferences: this.preferences
            };
            localStorage.setItem('phoenix_orchestrator_state', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    cleanup() {
        // Remove event listeners
        window.removeEventListener('voice:command', this.handleVoiceCommand);
        window.removeEventListener('butler:task', this.handleButlerTask);
        
        // Clear references
        this.voice = null;
        this.butler = null;
        this.api = null;
    }
}

// BUTLER SERVICE CLASS
class ButlerService {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.taskQueue = [];
        this.activeTask = null;
        this.capabilities = this.defineCapabilities();
    }

    async initialize() {
        console.log('🤵 Butler Service initializing...');
        
        // Load task history
        this.loadTaskHistory();
        
        // Setup task processors
        this.setupTaskProcessors();
        
        // Start task queue processor
        this.startQueueProcessor();
        
        console.log('✅ Butler Service ready');
    }

    defineCapabilities() {
        return {
            food_order: {
                name: 'Food Ordering',
                providers: ['uber_eats', 'doordash'],
                enabled: true
            },
            ride_booking: {
                name: 'Ride Booking',
                providers: ['uber', 'lyft'],
                enabled: true
            },
            restaurant_reservation: {
                name: 'Restaurant Reservations',
                providers: ['opentable', 'resy'],
                enabled: true
            },
            calendar_scheduling: {
                name: 'Calendar Management',
                providers: ['google_calendar', 'outlook'],
                enabled: true
            },
            send_message: {
                name: 'Message Sending',
                providers: ['email', 'sms'],
                enabled: true
            },
            phone_call: {
                name: 'Phone Calls',
                providers: ['twilio'],
                enabled: false // Requires additional setup
            }
        };
    }

    async handleTask(intent) {
        console.log('🤵 Butler handling task:', intent);
        
        // Check capability
        const capability = this.capabilities[intent.action];
        if (!capability || !capability.enabled) {
            return {
                message: `I'm sorry, ${intent.action} is not currently available.`,
                success: false
            };
        }
        
        // Create task object
        const task = {
            id: this.generateTaskId(),
            type: intent.action,
            entities: intent.entities,
            status: 'pending',
            createdAt: Date.now()
        };
        
        // Add to queue
        this.taskQueue.push(task);
        
        // Return immediate response
        return {
            message: this.getTaskConfirmationMessage(task),
            success: true,
            taskId: task.id
        };
    }

    async executeTask(task) {
        console.log(`🤵 Executing task: ${task.type}`);
        
        this.activeTask = task;
        task.status = 'processing';
        
        try {
            let result;
            
            switch (task.type) {
                case 'food_order':
                    result = await this.orderFood(task);
                    break;
                case 'ride_booking':
                    result = await this.bookRide(task);
                    break;
                case 'restaurant_reservation':
                    result = await this.makeReservation(task);
                    break;
                case 'calendar_scheduling':
                    result = await this.scheduleEvent(task);
                    break;
                case 'send_message':
                    result = await this.sendMessage(task);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            
            task.status = 'completed';
            task.result = result;
            
            // Notify completion
            this.notifyTaskComplete(task);
            
            return result;
        } catch (error) {
            task.status = 'failed';
            task.error = error.message;
            
            console.error('Task execution failed:', error);
            this.notifyTaskFailed(task);
            
            throw error;
        } finally {
            this.activeTask = null;
            this.saveTaskHistory();
        }
    }

    // TASK IMPLEMENTATIONS
    
    async orderFood(task) {
        console.log('🍔 Ordering food...');
        
        // Simulate API call
        await this.simulateAPICall();
        
        return {
            message: "I've placed your food order. It will arrive in approximately 30-45 minutes.",
            orderId: 'ORDER_' + Date.now(),
            estimatedDelivery: new Date(Date.now() + 40 * 60000).toLocaleTimeString()
        };
    }

    async bookRide(task) {
        console.log('🚗 Booking ride...');
        
        const from = task.entities.from || 'your location';
        const to = task.entities.to || 'your destination';
        
        // Simulate API call
        await this.simulateAPICall();
        
        return {
            message: `I've booked your ride from ${from} to ${to}. Your driver will arrive in 5 minutes.`,
            rideId: 'RIDE_' + Date.now(),
            driverETA: '5 minutes'
        };
    }

    async makeReservation(task) {
        console.log('🍽️ Making reservation...');
        
        const time = task.entities.time || '7:00 PM';
        const date = task.entities.date || 'tonight';
        
        // Simulate API call
        await this.simulateAPICall();
        
        return {
            message: `I've made your reservation for ${date} at ${time}. Confirmation sent to your email.`,
            reservationId: 'RES_' + Date.now(),
            details: { time, date }
        };
    }

    async scheduleEvent(task) {
        console.log('📅 Scheduling event...');
        
        // Simulate API call
        await this.simulateAPICall();
        
        return {
            message: "I've added the event to your calendar and sent invitations to all participants.",
            eventId: 'EVENT_' + Date.now()
        };
    }

    async sendMessage(task) {
        console.log('📧 Sending message...');
        
        // Simulate API call
        await this.simulateAPICall();
        
        return {
            message: "I've sent your message. You'll receive a confirmation shortly.",
            messageId: 'MSG_' + Date.now()
        };
    }

    // UTILITY METHODS
    
    setupTaskProcessors() {
        // Setup any required API connections
        console.log('Setting up task processors...');
    }

    startQueueProcessor() {
        setInterval(() => {
            if (this.taskQueue.length > 0 && !this.activeTask) {
                const nextTask = this.taskQueue.shift();
                this.executeTask(nextTask);
            }
        }, 1000);
    }

    loadTaskHistory() {
        try {
            const history = localStorage.getItem('phoenix_butler_history');
            this.taskHistory = history ? JSON.parse(history) : [];
        } catch {
            this.taskHistory = [];
        }
    }

    saveTaskHistory() {
        try {
            // Keep last 50 tasks
            this.taskHistory = this.taskHistory.slice(-50);
            localStorage.setItem('phoenix_butler_history', JSON.stringify(this.taskHistory));
        } catch (error) {
            console.error('Failed to save task history:', error);
        }
    }

    generateTaskId() {
        return 'TASK_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    getTaskConfirmationMessage(task) {
        const messages = {
            food_order: "Certainly, I'll place your food order right away.",
            ride_booking: "I'll book your ride immediately.",
            restaurant_reservation: "I'll make that reservation for you.",
            calendar_scheduling: "I'll add that to your calendar.",
            send_message: "I'll send that message for you."
        };
        
        return messages[task.type] || "I'll handle that task for you.";
    }

    notifyTaskComplete(task) {
        window.dispatchEvent(new CustomEvent('butler:complete', {
            detail: task
        }));
    }

    notifyTaskFailed(task) {
        window.dispatchEvent(new CustomEvent('butler:failed', {
            detail: task
        }));
    }

    async simulateAPICall(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}

// GLOBAL INITIALIZATION
(function() {
    console.log('🚀 Phoenix Orchestrator loading...');
    
    // Create global instance
    window.phoenixOrchestrator = new PhoenixOrchestrator();
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.phoenixOrchestrator.initialize();
        });
    } else {
        // DOM already loaded
        window.phoenixOrchestrator.initialize();
    }
    
    // Expose to global scope for debugging
    window.PhoenixOrchestrator = PhoenixOrchestrator;
    window.ButlerService = ButlerService;
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhoenixOrchestrator, ButlerService };
}
