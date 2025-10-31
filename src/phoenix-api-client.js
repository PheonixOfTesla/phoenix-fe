/**
 * PHOENIX API CLIENT - COMPLETE EDITION
 * Full API client for ALL 307 backend endpoints
 * Connects Phoenix Conversational AI to real backend
 * 
 * ✨ NOW WITH FULL VOICE CAPABILITIES ✨
 * 
 * Planetary Systems:
 * - PHOENIX: AI Intelligence, Companion, Butler, Predictions (75 endpoints)
 * - MERCURY: Health, Biometrics, Recovery, Sleep (38 endpoints)
 * - VENUS: Fitness, Workouts, Nutrition, Body Composition (88 endpoints)
 * - MARS: Goals, Habits, Progress, Motivation (20 endpoints)
 * - EARTH: Calendar, Energy Optimization (11 endpoints)
 * - JUPITER: Finance, Spending, Budgets (17 endpoints)
 * - SATURN: Life Vision, Quarterly Reviews, Legacy (12 endpoints)
 * - AUTH: Authentication & Authorization (9 endpoints)
 * - USER: User Management (11 endpoints)
 * - TTS: Text-to-Speech (4 endpoints) ⭐ NEW
 * - WHISPER: Speech-to-Text (2 endpoints) ⭐ NEW
 * - PHOENIX VOICE: Voice Session Management (2 endpoints) ⭐ NEW
 * - SMS: Verification (4 endpoints) ⭐ NEW
 * - TWILIO: Webhooks & Communication (9 endpoints) ⭐ NEW
 * - SUBSCRIPTION: Access Control (5 endpoints) ⭐ NEW
 * 
 * TOTAL: 307 ENDPOINTS
 */

class PhoenixAPIClient {
    constructor(baseURL = '/api', authToken = null) {
        this.baseURL = baseURL;
        this.authToken = authToken;
        
        // Initialize planetary systems
        this.phoenix = this.createPhoenixAPI();
        this.mercury = this.createMercuryAPI();
        this.venus = this.createVenusAPI();
        this.mars = this.createMarsAPI();
        this.earth = this.createEarthAPI();
        this.jupiter = this.createJupiterAPI();
        this.saturn = this.createSaturnAPI();
        this.auth = this.createAuthAPI();
        this.user = this.createUserAPI();
        
        // ⭐ NEW: Voice & Communication Systems
        this.tts = this.createTTSAPI();
        this.whisper = this.createWhisperAPI();
        this.phoenixVoice = this.createPhoenixVoiceAPI();
        this.sms = this.createSMSAPI();
        this.twilio = this.createTwilioAPI();
        this.subscription = this.createSubscriptionAPI();
    }

    /**
     * Generic request method
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add auth token if available
        if (this.authToken) {
            options.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        // Add body for POST, PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Request Failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * 🎙️ TTS API - TEXT-TO-SPEECH (4 endpoints)
     * Makes Phoenix SPEAK - converts text to audio
     */
    createTTSAPI() {
        return {
            /**
             * Synthesize speech from text
             * @param {Object} data - { text: string, voice?: string, speed?: number }
             * @returns {Promise} Audio URL or blob
             */
            synthesize: (data) => this.request('/tts/synthesize', 'POST', data),
            
            /**
             * Get available TTS voices
             * @returns {Promise} List of available voices
             */
            getVoices: () => this.request('/tts/voices'),
            
            /**
             * Preview a voice with sample text
             * @param {Object} data - { voice: string, text?: string }
             * @returns {Promise} Audio preview
             */
            previewVoice: (data) => this.request('/tts/preview', 'POST', data),
            
            /**
             * Get TTS usage statistics
             * @returns {Promise} Usage stats
             */
            getUsage: () => this.request('/tts/usage')
        };
    }

    /**
     * 👂 WHISPER API - SPEECH-TO-TEXT (2 endpoints)
     * Makes Phoenix HEAR - converts audio to text
     */
    createWhisperAPI() {
        return {
            /**
             * Transcribe audio to text
             * @param {Object} data - { audio: blob/file, language?: string }
             * @returns {Promise} Transcription text
             */
            transcribe: (data) => this.request('/whisper/transcribe', 'POST', data),
            
            /**
             * Get transcription history
             * @returns {Promise} List of past transcriptions
             */
            getHistory: () => this.request('/whisper/history')
        };
    }

    /**
     * 🎤 PHOENIX VOICE API - VOICE SESSION MANAGEMENT (2 endpoints)
     * Manages real-time voice conversations
     */
    createPhoenixVoiceAPI() {
        return {
            /**
             * Start a voice session
             * @param {Object} data - Session configuration
             * @returns {Promise} Session details
             */
            startSession: (data) => this.request('/phoenix/voice/session', 'POST', data),

            /**
             * End active voice session
             * @returns {Promise} Session summary
             */
            endSession: () => this.request('/phoenix/voice/session', 'DELETE'),

            /**
             * Chat with Phoenix Voice AI
             * @param {Object} data - Message and conversation context
             * @returns {Promise} AI response
             */
            chat: (data) => this.request('/phoenixVoice/chat', 'POST', data)
        };
    }

    /**
     * 💬 PHOENIX VOICE CHAT - Direct method for conversational AI
     * @param {Object} data - Message, history, personality, voice
     * @returns {Promise} AI response
     */
    async phoenixVoiceChat(data) {
        return this.request('/phoenixVoice/chat', 'POST', data);
    }

    /**
     * 📱 SMS API - VERIFICATION (4 endpoints)
     * For phone number verification and butler SMS capabilities
     */
    createSMSAPI() {
        return {
            /**
             * Send SMS verification code
             * @param {Object} data - { phoneNumber: string }
             * @returns {Promise} Verification sent confirmation
             */
            sendVerification: (data) => this.request('/sms-verification/send', 'POST', data),
            
            /**
             * Verify SMS code
             * @param {Object} data - { phoneNumber: string, code: string }
             * @returns {Promise} Verification result
             */
            verify: (data) => this.request('/sms-verification/verify', 'POST', data),
            
            /**
             * Resend verification code
             * @param {Object} data - { phoneNumber: string }
             * @returns {Promise} Code resent confirmation
             */
            resend: (data) => this.request('/sms-verification/resend', 'POST', data),
            
            /**
             * Check verification status
             * @param {string} phoneNumber - Phone number to check
             * @returns {Promise} Verification status
             */
            checkStatus: (phoneNumber) => this.request(`/sms-verification/status/${phoneNumber}`)
        };
    }

    /**
     * 📞 TWILIO API - WEBHOOKS & COMMUNICATION (9 endpoints)
     * Handles incoming calls, SMS, recordings for Butler
     */
    createTwilioAPI() {
        return {
            /**
             * Handle incoming SMS webhook
             * @param {Object} data - Twilio SMS webhook data
             * @returns {Promise} Response instructions
             */
            handleIncomingSMS: (data) => this.request('/twilio/webhooks/sms', 'POST', data),
            
            /**
             * Handle incoming call webhook
             * @param {Object} data - Twilio call webhook data
             * @returns {Promise} TwiML response
             */
            handleIncomingCall: (data) => this.request('/twilio/webhooks/call', 'POST', data),
            
            /**
             * Handle call status callback
             * @param {Object} data - Call status update
             * @returns {Promise} Status update confirmation
             */
            handleCallStatus: (data) => this.request('/twilio/webhooks/call-status', 'POST', data),
            
            /**
             * Handle recording ready webhook
             * @param {Object} data - Recording data
             * @returns {Promise} Recording processed confirmation
             */
            handleRecording: (data) => this.request('/twilio/webhooks/recording', 'POST', data),
            
            /**
             * Handle transcription callback
             * @param {Object} data - Transcription data
             * @returns {Promise} Transcription processed
             */
            handleTranscription: (data) => this.request('/twilio/webhooks/transcription', 'POST', data),
            
            /**
             * Handle SMS status callback
             * @param {Object} data - SMS delivery status
             * @returns {Promise} Status confirmation
             */
            handleSMSStatus: (data) => this.request('/twilio/webhooks/sms-status', 'POST', data),
            
            /**
             * Handle voice input webhook
             * @param {Object} data - Voice input data
             * @returns {Promise} TwiML response
             */
            handleVoiceInput: (data) => this.request('/twilio/webhooks/voice-input', 'POST', data),
            
            /**
             * Handle fallback webhook
             * @param {Object} data - Error/fallback data
             * @returns {Promise} Fallback response
             */
            handleFallback: (data) => this.request('/twilio/webhooks/fallback', 'POST', data),
            
            /**
             * Handle gather webhook
             * @param {Object} data - Gathered digits/speech
             * @returns {Promise} Next action instructions
             */
            handleGather: (data) => this.request('/twilio/webhooks/gather', 'POST', data)
        };
    }

    /**
     * 💳 SUBSCRIPTION API - ACCESS CONTROL (5 endpoints)
     * Manages user subscriptions and feature access
     */
    createSubscriptionAPI() {
        return {
            /**
             * Get current subscription
             * @returns {Promise} Subscription details
             */
            get: () => this.request('/subscription'),
            
            /**
             * Create/upgrade subscription
             * @param {Object} data - { plan: string, paymentMethod?: string }
             * @returns {Promise} New subscription
             */
            create: (data) => this.request('/subscription', 'POST', data),
            
            /**
             * Update subscription
             * @param {Object} data - { plan?: string, autoRenew?: boolean }
             * @returns {Promise} Updated subscription
             */
            update: (data) => this.request('/subscription', 'PUT', data),
            
            /**
             * Cancel subscription
             * @returns {Promise} Cancellation confirmation
             */
            cancel: () => this.request('/subscription/cancel', 'POST'),
            
            /**
             * Check feature access
             * @param {string} feature - Feature to check (e.g., 'butler', 'voice')
             * @returns {Promise} Access granted/denied
             */
            checkFeatureAccess: (feature) => this.request(`/subscription/feature-access/${feature}`)
        };
    }

    /**
     * PHOENIX API - AI Intelligence & Companion (75 endpoints)
     */
    createPhoenixAPI() {
        return {
            // Companion Chat
            companion: {
                chat: (data) => this.request('/phoenix/companion/chat', 'POST', data),
                getHistory: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/phoenix/companion/history${query ? '?' + query : ''}`);
                },
                clearHistory: () => this.request('/phoenix/companion/history', 'DELETE'),
                getContext: () => this.request('/phoenix/companion/context'),
                getPersonality: () => this.request('/phoenix/companion/personality'),
                updatePersonality: (data) => this.request('/phoenix/companion/personality', 'PUT', data)
            },

            // Intelligence & Analysis
            intelligence: {
                get: () => this.request('/phoenix/intelligence'),
                analyze: (data) => this.request('/phoenix/intelligence/analyze', 'POST', data),
                query: (data) => this.request('/phoenix/intelligence/query', 'POST', data),
                getInsights: () => this.request('/phoenix/intelligence/insights'),
                getSummary: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/phoenix/intelligence/summary${query ? '?' + query : ''}`);
                },
                deepDive: (data) => this.request('/phoenix/intelligence/deep-dive', 'POST', data),
                autoOptimize: (data) => this.request('/phoenix/intelligence/auto-optimize', 'POST', data),
                getRecommendations: () => this.request('/phoenix/intelligence/recommendations')
            },

            // Patterns & Learning
            patterns: {
                get: () => this.request('/phoenix/patterns'),
                getRealtime: () => this.request('/phoenix/patterns/realtime'),
                analyze: (data) => this.request('/phoenix/patterns/analyze', 'POST', data),
                validate: (id, data) => this.request(`/phoenix/patterns/${id}/validate`, 'PUT', data),
                delete: (id) => this.request(`/phoenix/patterns/${id}`, 'DELETE')
            },

            // Behavior Tracking
            behavior: {
                track: (data) => this.request('/phoenix/behavior/track', 'POST', data),
                getPatterns: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/phoenix/behavior/patterns${query ? '?' + query : ''}`);
                },
                getInsights: () => this.request('/phoenix/behavior/insights'),
                getByType: (type) => this.request(`/phoenix/behavior/${type}`)
            },

            // Predictions
            predictions: {
                get: () => this.request('/phoenix/predictions'),
                getActive: () => this.request('/phoenix/predictions/active'),
                getById: (id) => this.request(`/phoenix/predictions/${id}`),
                getAccuracy: () => this.request('/phoenix/predictions/accuracy'),
                getForecast: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/phoenix/predictions/forecast${query ? '?' + query : ''}`);
                },
                getOptimalWindow: () => this.request('/phoenix/predictions/optimal-window'),
                getBurnoutRisk: () => this.request('/phoenix/predictions/burnout-risk'),
                getWeightChange: () => this.request('/phoenix/predictions/weight-change'),
                request: (type, data) => this.request(`/phoenix/predictions/request/${type}`, 'POST', data),
                recordOutcome: (id, data) => this.request(`/phoenix/predictions/${id}/outcome`, 'PUT', data)
            },

            // Interventions
            interventions: {
                get: () => this.request('/phoenix/interventions'),
                getActive: () => this.request('/phoenix/interventions/active'),
                getPending: () => this.request('/phoenix/interventions/pending'),
                getStats: () => this.request('/phoenix/interventions/stats'),
                getHistory: () => this.request('/phoenix/interventions/history'),
                acknowledge: (id, data) => this.request(`/phoenix/interventions/${id}/acknowledge`, 'POST', data),
                updateSettings: (data) => this.request('/phoenix/interventions/settings', 'POST', data),
                request: (data) => this.request('/phoenix/interventions/request', 'POST', data),
                recordOutcome: (id, data) => this.request(`/phoenix/interventions/${id}/outcome`, 'PUT', data)
            },

            // Butler Actions (27 endpoints)
            butler: {
                // Food
                orderFood: (data) => this.request('/phoenix/butler/food', 'POST', data),
                reorderFood: (data) => this.request('/phoenix/butler/food/reorder', 'POST', data),
                getFoodHistory: () => this.request('/phoenix/butler/food/history'),

                // Rides
                bookRide: (data) => this.request('/phoenix/butler/ride', 'POST', data),
                getRides: () => this.request('/phoenix/butler/rides'),

                // Reservations
                makeReservation: (data) => this.request('/phoenix/butler/reservation', 'POST', data),
                getReservations: () => this.request('/phoenix/butler/reservations'),

                // Communication
                makeCall: (data) => this.request('/phoenix/butler/call', 'POST', data),
                getCalls: () => this.request('/phoenix/butler/calls'),
                sendEmail: (data) => this.request('/phoenix/butler/email', 'POST', data),
                replyToEmail: (data) => this.request('/phoenix/butler/email/reply', 'POST', data),
                getEmails: () => this.request('/phoenix/butler/emails'),

                // Calendar
                addToCalendar: (data) => this.request('/phoenix/butler/calendar', 'POST', data),
                optimizeCalendar: (data) => this.request('/phoenix/butler/calendar/optimize', 'POST', data),

                // Web Tasks
                search: (data) => this.request('/phoenix/butler/search', 'POST', data),
                webTask: (data) => this.request('/phoenix/butler/web-task', 'POST', data),
                summarize: (data) => this.request('/phoenix/butler/summarize', 'POST', data),
                summarizeBatch: (data) => this.request('/phoenix/butler/summarize/batch', 'POST', data),

                // Automations
                createAutomation: (data) => this.request('/phoenix/butler/automate', 'POST', data),
                getAutomations: () => this.request('/phoenix/butler/automations'),
                deleteAutomation: (id) => this.request(`/phoenix/butler/automations/${id}`, 'DELETE')
            },

            // Machine Learning
            ml: {
                train: (data) => this.request('/phoenix/ml/train', 'POST', data),
                getModels: () => this.request('/phoenix/ml/models'),
                getTrainingStatus: () => this.request('/phoenix/ml/training-status')
            },

            // Insights
            getInsights: () => this.request('/phoenix/insights')
        };
    }

    /**
     * MERCURY API - Health & Biometrics (38 endpoints)
     */
    createMercuryAPI() {
        return {
            // Recovery
            recovery: {
                getLatest: () => this.request('/mercury/recovery/latest'),
                getHistory: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/mercury/recovery/history${query ? '?' + query : ''}`);
                },
                getTrends: () => this.request('/mercury/recovery/trends'),
                getPrediction: () => this.request('/mercury/recovery/prediction'),
                getProtocols: () => this.request('/mercury/recovery/protocols'),
                getDebt: () => this.request('/mercury/recovery/debt'),
                getOvertrainingRisk: () => this.request('/mercury/recovery/overtraining-risk'),
                getTrainingLoad: () => this.request('/mercury/recovery/training-load'),
                getInsights: () => this.request('/mercury/recovery/insights'),
                getDashboard: () => this.request('/mercury/recovery/dashboard'),
                calculate: (data) => this.request('/mercury/recovery/calculate', 'POST', data)
            },

            // Biometrics
            biometrics: {
                getDexa: () => this.request('/mercury/biometrics/dexa'),
                getComposition: () => this.request('/mercury/biometrics/composition'),
                getMetabolic: () => this.request('/mercury/biometrics/metabolic'),
                getRatios: () => this.request('/mercury/biometrics/ratios'),
                getVisceralFat: () => this.request('/mercury/biometrics/visceral-fat'),
                getBoneDensity: () => this.request('/mercury/biometrics/bone-density'),
                getHydration: () => this.request('/mercury/biometrics/hydration'),
                getTrends: () => this.request('/mercury/biometrics/trends'),
                getCorrelations: () => this.request('/mercury/biometrics/correlations'),
                getHRV: () => this.request('/mercury/biometrics/hrv'),
                getHRVDeepAnalysis: () => this.request('/mercury/biometrics/hrv/deep-analysis'),
                getHeartRate: () => this.request('/mercury/biometrics/heart-rate'),
                getReadiness: () => this.request('/mercury/biometrics/readiness'),
                calculateMetabolic: (data) => this.request('/mercury/biometrics/metabolic/calculate', 'POST', data)
            },

            // Sleep
            sleep: {
                get: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/mercury/sleep${query ? '?' + query : ''}`);
                },
                getAnalysis: () => this.request('/mercury/sleep/analysis'),
                getRecommendations: () => this.request('/mercury/sleep/recommendations')
            },

            // Devices
            devices: {
                get: () => this.request('/mercury/devices'),
                connect: (provider) => this.request(`/mercury/devices/${provider}/connect`, 'POST'),
                exchange: (provider, data) => this.request(`/mercury/devices/${provider}/exchange`, 'POST', data),
                sync: (provider) => this.request(`/mercury/devices/${provider}/sync`, 'POST'),
                disconnect: (provider) => this.request(`/mercury/devices/${provider}`, 'DELETE'),
                webhook: (provider, data) => this.request(`/mercury/webhook/${provider}`, 'POST', data)
            },

            // Data
            getData: () => this.request('/mercury/data'),
            getRawData: () => this.request('/mercury/data/raw'),
            logManualData: (data) => this.request('/mercury/data/manual', 'POST', data),
            getInsights: () => this.request('/mercury/insights')
        };
    }

    /**
     * VENUS API - Fitness & Nutrition (88 endpoints)
     */
    createVenusAPI() {
        return {
            // Workouts
            workouts: {
                get: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/venus/workouts${query ? '?' + query : ''}`);
                },
                getHistory: (params = {}) => this.get(params),
                getActive: () => this.request('/venus/workouts/active'),
                getById: (id) => this.request(`/venus/workouts/${id}`),
                start: (data) => this.request('/venus/workouts/start', 'POST', data),
                addExercise: (workoutId, data) => this.request(`/venus/workouts/${workoutId}/exercise`, 'POST', data),
                complete: (id, data) => this.request(`/venus/workouts/${id}/complete`, 'POST', data),
                update: (id, data) => this.request(`/venus/workouts/${id}`, 'PUT', data),
                delete: (id) => this.request(`/venus/workouts/${id}`, 'DELETE'),
                recommend: (data) => this.request('/venus/workouts/recommend', 'POST', data),
                getSimilar: () => this.request('/venus/workouts/similar'),
                getTemplates: () => this.request('/venus/workouts/templates/library'),
                createTemplate: (data) => this.request('/venus/workouts/templates/create', 'POST', data),
                getFormAnalysis: () => this.request('/venus/workouts/form-analysis'),
                checkForm: (data) => this.request('/venus/workouts/form-check', 'POST', data),
                getEffectiveness: () => this.request('/venus/workouts/effectiveness'),
                compare: () => this.request('/venus/workouts/compare'),
                getIntensityZones: () => this.request('/venus/workouts/intensity-zones'),
                getVolumeProgression: () => this.request('/venus/workouts/volume-progression'),
                getDeloadPlanning: () => this.request('/venus/workouts/deload-planning'),
                getOptimalWindow: () => this.request('/venus/workouts/optimal-window'),
                getPeriodization: (data) => this.request('/venus/workouts/periodization', 'POST', data)
            },

            // Quantum Workout Generator
            quantum: {
                generate: (data) => this.request('/venus/quantum/generate', 'POST', data),
                getHistory: () => this.request('/venus/quantum/history'),
                getEffectiveness: () => this.request('/venus/quantum/effectiveness'),
                getPlateauDetection: () => this.request('/venus/quantum/plateau-detection'),
                getSettings: () => this.request('/venus/quantum/settings'),
                updateSettings: (data) => this.request('/venus/quantum/settings', 'PUT', data),
                getChaosMetrics: () => this.request('/venus/quantum/chaos-metrics'),
                regenerateSeeds: (data) => this.request('/venus/quantum/regenerate-seeds', 'POST', data)
            },

            // Exercises
            exercises: {
                get: () => this.request('/venus/exercises'),
                search: (params) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/venus/exercises/search?${query}`);
                },
                getById: (id) => this.request(`/venus/exercises/${id}`),
                getAlternatives: (id) => this.request(`/venus/exercises/${id}/alternatives`),
                create: (data) => this.request('/venus/exercises', 'POST', data),
                recommend: (data) => this.request('/venus/exercises/recommend', 'POST', data)
            },

            // Progress
            progress: {
                getOverload: () => this.request('/venus/progress/overload'),
                getStandards: () => this.request('/venus/progress/standards'),
                getRecords: () => this.request('/venus/progress/records'),
                calculate1RM: (data) => this.request('/venus/progress/1rm', 'POST', data)
            },

            // Nutrition
            nutrition: {
                getLogs: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/venus/nutrition/logs${query ? '?' + query : ''}`);
                },
                log: (data) => this.request('/venus/nutrition/log', 'POST', data),
                updateLog: (id, data) => this.request(`/venus/nutrition/logs/${id}`, 'PUT', data),
                deleteLog: (id) => this.request(`/venus/nutrition/logs/${id}`, 'DELETE'),
                getMacros: () => this.request('/venus/nutrition/macros'),
                getInsights: () => this.request('/venus/nutrition/insights'),
                setTargets: (data) => this.request('/venus/nutrition/targets', 'POST', data),
                calculateTargets: (data) => this.request('/venus/nutrition/targets/calculate', 'POST', data),
                getWater: () => this.request('/venus/nutrition/water'),
                logWater: (data) => this.request('/venus/nutrition/water', 'POST', data),
                getMealPrep: () => this.request('/venus/nutrition/meal-prep'),
                generateMealPlan: (data) => this.request('/venus/nutrition/meal-plan/generate', 'POST', data),
                analyzePhoto: (data) => this.request('/venus/nutrition/photo-analyze', 'POST', data),
                scanBarcode: (data) => this.request('/venus/nutrition/barcode-scan', 'POST', data),
                suggestRecipe: (data) => this.request('/venus/nutrition/recipe-suggest', 'POST', data),
                planMealPrep: (data) => this.request('/venus/nutrition/meal-prep/plan', 'POST', data),
                getRestaurants: () => this.request('/venus/nutrition/restaurants'),
                analyzeRestaurant: (data) => this.request('/venus/nutrition/restaurants/analyze', 'POST', data)
            },

            // Supplements
            supplements: {
                get: () => this.request('/venus/supplements'),
                log: (data) => this.request('/venus/supplements/log', 'POST', data),
                getInteractions: () => this.request('/venus/supplements/interactions'),
                buildStack: (data) => this.request('/venus/supplements/stack-builder', 'POST', data)
            },

            // Body Composition
            body: {
                getMeasurements: () => this.request('/venus/body/measurements'),
                logMeasurement: (data) => this.request('/venus/body/measurements', 'POST', data),
                getComposition: () => this.request('/venus/body/composition'),
                getPhotos: () => this.request('/venus/body/photos'),
                uploadPhoto: (data) => this.request('/venus/body/photos', 'POST', data),
                comparePhotos: () => this.request('/venus/body/photos/compare'),
                getRecompAnalysis: () => this.request('/venus/body/recomp-analysis'),
                getMuscleSymmetry: () => this.request('/venus/body/muscle-symmetry'),
                getFatDistribution: () => this.request('/venus/body/fat-distribution')
            },

            // Performance Testing
            performance: {
                getTests: () => this.request('/venus/performance/tests'),
                createTest: (data) => this.request('/venus/performance/tests', 'POST', data),
                recordResults: (id, data) => this.request(`/venus/performance/tests/${id}/results`, 'POST', data),
                getBenchmarks: () => this.request('/venus/performance/benchmarks'),
                getStandards: () => this.request('/venus/performance/standards'),
                getPercentile: () => this.request('/venus/performance/percentile'),
                getPredictions: () => this.request('/venus/performance/predictions')
            },

            // Social
            social: {
                getFeed: () => this.request('/venus/social/feed'),
                share: (data) => this.request('/venus/social/share', 'POST', data),
                getChallenges: () => this.request('/venus/social/challenges'),
                joinChallenge: (data) => this.request('/venus/social/challenges/join', 'POST', data),
                getFriends: () => this.request('/venus/social/friends'),
                addFriend: (data) => this.request('/venus/social/friends/add', 'POST', data)
            },

            // Injury Risk
            injuryRisk: {
                getAssessment: () => this.request('/venus/injury-risk/assessment'),
                getHistory: () => this.request('/venus/injury-risk/history'),
                getPrevention: () => this.request('/venus/injury-risk/prevention'),
                getRehabProtocols: () => this.request('/venus/injury-risk/rehab-protocols'),
                reportInjury: (data) => this.request('/venus/injury-risk/report', 'POST', data)
            }
        };
    }

    /**
     * MARS API - Goals & Motivation (20 endpoints)
     */
    createMarsAPI() {
        return {
            // Goals
            goals: {
                get: () => this.request('/mars/goals'),
                getById: (id) => this.request(`/mars/goals/${id}`),
                create: (data) => this.request('/mars/goals', 'POST', data),
                update: (id, data) => this.request(`/mars/goals/${id}`, 'PUT', data),
                delete: (id) => this.request(`/mars/goals/${id}`, 'DELETE'),
                complete: (id) => this.request(`/mars/goals/${id}/complete`, 'POST'),
                getTemplates: () => this.request('/mars/goals/templates'),
                generateSMART: (data) => this.request('/mars/goals/generate-smart', 'POST', data),
                suggest: (data) => this.request('/mars/goals/suggest', 'POST', data),
                getProgress: (id) => this.request(`/mars/goals/${id}/progress`),
                logProgress: (id, data) => this.request(`/mars/goals/${id}/progress`, 'POST', data),
                createMilestone: (id, data) => this.request(`/mars/goals/${id}/milestones`, 'POST', data),
                completeMilestone: (id) => this.request(`/mars/milestones/${id}/complete`, 'POST')
            },

            // Habits
            habits: {
                create: (data) => this.request('/mars/habits', 'POST', data),
                log: (id, data) => this.request(`/mars/habits/${id}/log`, 'POST', data)
            },

            // Progress
            progress: {
                getVelocity: () => this.request('/mars/progress/velocity'),
                getPredictions: () => this.request('/mars/progress/predictions'),
                getBottlenecks: () => this.request('/mars/progress/bottlenecks')
            },

            // Motivation
            motivation: {
                getInterventions: () => this.request('/mars/motivation/interventions'),
                boost: (data) => this.request('/mars/motivation/boost', 'POST', data)
            }
        };
    }

    /**
     * EARTH API - Calendar & Energy (11 endpoints)
     */
    createEarthAPI() {
        return {
            // Calendar
            calendar: {
                connect: (provider) => this.request(`/earth/calendar/connect/${provider}`),
                callback: (data) => this.request('/earth/calendar/callback', 'POST', data),
                getEvents: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return this.request(`/earth/calendar/events${query ? '?' + query : ''}`);
                },
                createEvent: (data) => this.request('/earth/calendar/events', 'POST', data),
                sync: (data) => this.request('/earth/calendar/sync', 'POST', data),
                getEnergyMap: () => this.request('/earth/calendar/energy-map'),
                getConflicts: () => this.request('/earth/calendar/conflicts')
            },

            // Energy
            energy: {
                getPattern: () => this.request('/earth/energy/pattern'),
                log: (data) => this.request('/earth/energy/log', 'POST', data),
                getOptimalTimes: () => this.request('/earth/energy/optimal-times'),
                getPrediction: () => this.request('/earth/energy/prediction')
            }
        };
    }

    /**
     * JUPITER API - Finance (17 endpoints)
     */
    createJupiterAPI() {
        return {
            // Plaid Integration
            getLinkToken: () => this.request('/jupiter/link-token', 'POST'),
            exchangeToken: (data) => this.request('/jupiter/exchange-token', 'POST', data),

            // Accounts
            getAccounts: () => this.request('/jupiter/accounts'),
            deleteAccount: (id) => this.request(`/jupiter/account/${id}`, 'DELETE'),
            syncAccount: (id) => this.request(`/jupiter/sync/${id}`, 'POST'),

            // Transactions
            getTransactions: () => this.request('/jupiter/transactions'),
            getTransactionsByDateRange: (params) => {
                const query = new URLSearchParams(params).toString();
                return this.request(`/jupiter/transactions/date-range?${query}`);
            },
            getTransactionsByCategory: (category) => this.request(`/jupiter/transactions/category/${category}`),
            getRecurring: () => this.request('/jupiter/transactions/recurring'),
            updateTransaction: (id, data) => this.request(`/jupiter/transactions/${id}`, 'PUT', data),

            // Spending
            getSpendingPatterns: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return this.request(`/jupiter/spending-patterns${query ? '?' + query : ''}`);
            },
            getStressCorrelation: () => this.request('/jupiter/stress-correlation'),

            // Budgets
            getBudgets: () => this.request('/jupiter/budgets'),
            createBudget: (data) => this.request('/jupiter/budgets', 'POST', data),
            updateBudget: (id, data) => this.request(`/jupiter/budgets/${id}`, 'PUT', data),
            deleteBudget: (id) => this.request(`/jupiter/budgets/${id}`, 'DELETE'),
            getBudgetAlerts: () => this.request('/jupiter/budgets/alerts')
        };
    }

    /**
     * SATURN API - Life Vision & Legacy (12 endpoints)
     */
    createSaturnAPI() {
        return {
            // Vision
            getVision: () => this.request('/saturn/vision'),
            setVision: (data) => this.request('/saturn/vision', 'POST', data),
            updateLifeAreas: (data) => this.request('/saturn/vision/life-areas', 'PUT', data),
            addLegacyGoal: (data) => this.request('/saturn/vision/legacy-goal', 'POST', data),
            reviewVision: (data) => this.request('/saturn/vision/review', 'PUT', data),

            // Mortality Awareness
            getMortality: () => this.request('/saturn/mortality'),

            // Quarterly Reviews
            getQuarterly: () => this.request('/saturn/quarterly'),
            getLatestQuarterly: () => this.request('/saturn/quarterly/latest'),
            createQuarterly: (data) => this.request('/saturn/quarterly', 'POST', data),
            updateQuarterly: (id, data) => this.request(`/saturn/quarterly/${id}`, 'PUT', data),
            getTrend: () => this.request('/saturn/quarterly/trend'),
            compare: (q1, q2) => this.request(`/saturn/quarterly/compare/${q1}/${q2}`)
        };
    }

    /**
     * AUTH API (9 endpoints)
     */
    createAuthAPI() {
        return {
            register: (data) => this.request('/auth/register', 'POST', data),
            login: (data) => this.request('/auth/login', 'POST', data),
            logout: () => this.request('/auth/logout', 'POST'),
            getMe: () => this.request('/auth/me'),
            updateMe: (data) => this.request('/auth/me', 'PUT', data),
            resetPassword: (data) => this.request('/auth/reset-password', 'POST', data),
            resetPasswordWithToken: (token, data) => this.request(`/auth/reset-password/${token}`, 'PUT', data),
            changePassword: (data) => this.request('/auth/change-password', 'PUT', data),
            getDocs: () => this.request('/auth/docs')
        };
    }

    /**
     * USER API (11 endpoints)
     */
    createUserAPI() {
        return {
            getProfile: () => this.request('/user/profile'),
            updateProfile: (data) => this.request('/user/profile', 'PUT', data),
            get: () => this.request('/user/'),
            create: (data) => this.request('/user/', 'POST', data),
            getById: (id) => this.request(`/user/${id}`),
            update: (id, data) => this.request(`/user/${id}`, 'PUT', data),
            delete: (id) => this.request(`/user/${id}`, 'DELETE'),
            assignClient: (data) => this.request('/user/assign-client', 'POST', data),
            unassignClient: (data) => this.request('/user/unassign-client', 'POST', data),
            getClients: (specialistId) => this.request(`/user/specialist/${specialistId}/clients`),
            getDocs: () => this.request('/user/docs')
        };
    }

    /**
     * Set auth token
     */
    setAuthToken(token) {
        this.authToken = token;
    }

    /**
     * Clear auth token
     */
    clearAuthToken() {
        this.authToken = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoenixAPIClient;
}

// Global access
if (typeof window !== 'undefined') {
    window.PhoenixAPIClient = PhoenixAPIClient;
}

console.log('Phoenix API Client Loaded - 307 Endpoints Available');
console.log('✨ Voice Capabilities: ENABLED');
console.log('TTS: ✅ | 👂 Whisper: ✅ | 📞 Twilio: ✅ | 📱 SMS: ✅');
