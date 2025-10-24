// orchestrator.js - Phoenix Master Intelligence Orchestrator with Butler Integration
// Complete brain that connects everything: Butler + Voice + JARVIS + Real-time interventions

class PhoenixOrchestrator {
    constructor() {
        this.API = null;
        this.phoenixStore = null;
        this.reactorCore = null;
        this.voiceInterface = null;
        this.jarvisEngine = null;
        this.planetSystem = null;
        this.butlerService = null; // ⭐ NEW: Butler integration
        
        this.autoSyncInterval = null;
        this.healthCheckInterval = null;
        this.intelligenceTimer = null;
        this.butlerMonitoringInterval = null; // ⭐ NEW
        
        this.user = null;
        this.wearablesConnected = false;
        this.lastSync = null;
        this.syncInProgress = false;
        
        // Intelligence thresholds
        this.thresholds = {
            criticalRecovery: 40,
            lowRecovery: 60,
            highStress: 7,
            plateauWorkouts: 5,
            goalDeadlineDays: 7,
            lowEnergy: 40,
            highSpending: 150 // % of daily average
        };

        // Butler automation settings
        this.butlerAutomation = {
            morningRoutine: true,
            mealOrdering: true,
            rideBooking: true,
            calendarOptimization: true,
            emailDrafting: false,
            phoneHandling: false
        };
    }

    // ========================================
    // 🚀 INITIALIZATION - Wait for all modules
    // ========================================

    async init() {
        console.log('🧠 Initializing Phoenix Master Orchestrator with Butler...');
        
        try {
            // Wait for all dependencies including Butler
            await this.waitForModules();
            
            // Authenticate user
            const authenticated = await this.authenticate();
            if (!authenticated) {
                console.error('❌ Authentication failed');
                window.location.href = '/login';
                return;
            }
            
            // Connect all modules
            this.connectModules();
            
            // Initialize Butler Service
            await this.initializeButler();
            
            // Check wearable status
            await this.checkWearableConnections();
            
            // Start intelligence loops
            this.startAutoSync();
            this.startHealthMonitoring();
            this.startIntelligentInterventions();
            this.startButlerMonitoring(); // ⭐ NEW
            
            // Setup UI handlers
            this.setupGlobalHandlers();
            
            // Initial data load
            await this.initialDataSync();
            
            // Voice greeting with Butler mention
            if (this.voiceInterface) {
                setTimeout(() => {
                    this.voiceInterface.sayInitialGreeting();
                    if (this.butlerService?.autonomousMode) {
                        this.voiceInterface.speak(
                            'Butler mode is active. I\'m monitoring your schedule and will handle routine tasks automatically.',
                            'normal'
                        );
                    }
                }, 2000);
            }
            
            console.log('✅ Phoenix Orchestrator with Butler fully operational');
            this.showSystemStatus('ONLINE');
            
        } catch (error) {
            console.error('❌ Orchestrator init failed:', error);
            this.showSystemStatus('ERROR');
        }
    }

    async waitForModules() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                // Check for all modules including Butler
                if (window.API && window.phoenixStore && window.reactorCore && 
                    window.voiceInterface && window.jarvisEngine && window.planetSystem &&
                    window.butlerService) { // ⭐ NEW: Check for Butler
                    
                    clearInterval(checkInterval);
                    
                    this.API = window.API;
                    this.phoenixStore = window.phoenixStore;
                    this.reactorCore = window.reactorCore;
                    this.voiceInterface = window.voiceInterface;
                    this.jarvisEngine = window.jarvisEngine;
                    this.planetSystem = window.planetSystem;
                    this.butlerService = window.butlerService; // ⭐ NEW
                    
                    console.log('✅ All modules loaded (including Butler)');
                    resolve();
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('⚠️ Some modules missing, continuing with fallback');
                    resolve();
                }
            }, 200);
        });
    }

    // ========================================
    // 🤖 BUTLER INITIALIZATION
    // ========================================

    async initializeButler() {
        if (!this.butlerService) {
            console.warn('⚠️ Butler service not available');
            return;
        }

        console.log('🤖 Initializing Butler Service...');
        
        // Check user preferences for Butler settings
        const userPrefs = await this.loadUserPreferences();
        
        if (userPrefs?.butler) {
            this.butlerService.autonomousMode = userPrefs.butler.autonomousMode || false;
            this.butlerService.trustLevel = userPrefs.butler.trustLevel || 0;
            this.butlerAutomation = { ...this.butlerAutomation, ...userPrefs.butler.automation };
        }
        
        // Enable Butler in voice interface
        if (this.voiceInterface) {
            this.voiceInterface.butlerEnabled = true;
        }
        
        console.log('✅ Butler Service configured:', {
            autonomous: this.butlerService.autonomousMode,
            trustLevel: this.butlerService.trustLevel
        });
    }

    // ========================================
    // 🤖 BUTLER MONITORING
    // ========================================

    startButlerMonitoring() {
        console.log('🤖 Starting Butler monitoring...');
        
        // Check for Butler interventions every 2 minutes
        this.butlerMonitoringInterval = setInterval(() => {
            this.checkForButlerInterventions();
        }, 120000);
        
        // Initial check
        this.checkForButlerInterventions();
    }

    async checkForButlerInterventions() {
        if (!this.butlerService) return;
        
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // ⭐ Morning Routine (7:00 AM)
        if (hour === 7 && minute < 5 && this.butlerAutomation.morningRoutine) {
            await this.executeMorningButlerRoutine();
        }
        
        // ⭐ Lunch Time (11:45 AM)
        if (hour === 11 && minute === 45 && this.butlerAutomation.mealOrdering) {
            await this.checkLunchNeeds();
        }
        
        // ⭐ Dinner Time (6:00 PM)
        if (hour === 18 && minute === 0 && this.butlerAutomation.mealOrdering) {
            await this.checkDinnerNeeds();
        }
        
        // ⭐ Check upcoming events for ride needs
        if (this.butlerAutomation.rideBooking) {
            await this.checkUpcomingEventsForRides();
        }
        
        // ⭐ Calendar optimization check (every check)
        if (this.butlerAutomation.calendarOptimization) {
            await this.checkCalendarForOptimization();
        }
    }

    async executeMorningButlerRoutine() {
        console.log('🌅 Butler: Executing morning routine...');
        
        const state = this.phoenixStore?.state;
        const recovery = state?.mercury?.recovery?.recoveryScore || 75;
        
        // Announce morning status
        if (this.voiceInterface) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : 'Good afternoon';
            
            this.voiceInterface.speak(
                `${greeting}. Your recovery is at ${Math.round(recovery)} percent. ${
                    recovery >= 80 ? 'You\'re primed for peak performance today.' :
                    recovery >= 60 ? 'Moderate intensity recommended today.' :
                    'Consider a recovery day. I\'ll adjust your schedule accordingly.'
                }`,
                'normal'
            );
        }
        
        // If recovery is low, reschedule intensive activities
        if (recovery < 60) {
            await this.butlerService.optimizeCalendar();
        }
        
        // Check if breakfast should be ordered
        if (this.butlerAutomation.mealOrdering && recovery >= 40) {
            const events = state?.earth?.events || [];
            const hasMorningMeeting = events.some(e => {
                const eventHour = new Date(e.start).getHours();
                return eventHour >= 7 && eventHour <= 9;
            });
            
            if (!hasMorningMeeting) {
                if (this.voiceInterface) {
                    this.voiceInterface.speak(
                        'Would you like me to order your usual breakfast?',
                        'normal'
                    );
                }
            }
        }
    }

    async checkLunchNeeds() {
        const state = this.phoenixStore?.state;
        const events = state?.earth?.events || [];
        
        // Check if there's a lunch meeting
        const hasLunchMeeting = events.some(e => {
            const eventHour = new Date(e.start).getHours();
            return eventHour >= 11 && eventHour <= 14 && 
                   e.title.toLowerCase().includes('lunch');
        });
        
        if (!hasLunchMeeting && this.butlerService) {
            if (this.butlerService.autonomousMode && this.butlerService.trustLevel > 70) {
                // Auto-order lunch
                await this.butlerService.orderFood({
                    deliveryTime: '12:30 PM'
                });
            } else {
                // Ask first
                if (this.voiceInterface) {
                    this.voiceInterface.speak(
                        'It\'s almost noon. Would you like me to order lunch?',
                        'normal'
                    );
                }
            }
        }
    }

    async checkDinnerNeeds() {
        const state = this.phoenixStore?.state;
        const recovery = state?.mercury?.recovery?.recoveryScore || 75;
        
        // Check spending today
        const todaySpending = state?.jupiter?.finance?.todaySpending || 0;
        const avgSpending = state?.jupiter?.finance?.avgSpending || 100;
        
        // If spending is high, suggest cooking instead
        if (todaySpending > avgSpending * 1.5) {
            if (this.voiceInterface) {
                this.voiceInterface.speak(
                    'Your spending is above average today. Consider cooking at home for dinner.',
                    'normal'
                );
            }
        } else if (recovery < 50) {
            // Low recovery - order healthy food
            if (this.voiceInterface) {
                this.voiceInterface.speak(
                    'Your recovery is low. Shall I order something healthy and light for dinner?',
                    'normal'
                );
            }
        } else {
            // Normal dinner suggestion
            if (this.voiceInterface) {
                this.voiceInterface.speak(
                    'It\'s dinner time. Would you like me to order from your favorite restaurant?',
                    'normal'
                );
            }
        }
    }

    async checkUpcomingEventsForRides() {
        if (!this.butlerService) return;
        
        const state = this.phoenixStore?.state;
        const events = state?.earth?.events || [];
        const now = new Date();
        
        for (const event of events) {
            const eventTime = new Date(event.start);
            const minutesUntil = (eventTime - now) / (1000 * 60);
            
            // Check events 30-45 minutes away
            if (minutesUntil > 30 && minutesUntil < 45 && event.location) {
                const travelTime = 20; // Estimate 20 minutes travel time
                
                if (this.butlerService.autonomousMode && this.butlerService.trustLevel > 80) {
                    // Auto-book ride
                    await this.butlerService.bookRide(event.location, {
                        time: new Date(eventTime - travelTime * 60000).toISOString()
                    });
                } else {
                    // Ask first
                    if (this.voiceInterface) {
                        this.voiceInterface.speak(
                            `You have an event at ${event.location} in ${Math.round(minutesUntil)} minutes. Shall I book an Uber?`,
                            'urgent'
                        );
                    }
                }
            }
        }
    }

    async checkCalendarForOptimization() {
        const state = this.phoenixStore?.state;
        const recovery = state?.mercury?.recovery?.recoveryScore || 75;
        const events = state?.earth?.events || [];
        
        // Check for back-to-back meetings with low recovery
        if (recovery < 60 && events.length > 4) {
            const backToBack = events.filter((e, i) => {
                if (i === 0) return false;
                const prevEnd = new Date(events[i-1].end);
                const thisStart = new Date(e.start);
                return (thisStart - prevEnd) < 5 * 60 * 1000;
            });
            
            if (backToBack.length > 2) {
                if (this.butlerService.autonomousMode) {
                    await this.butlerService.optimizeCalendar();
                } else {
                    if (this.voiceInterface) {
                        this.voiceInterface.speak(
                            'Your recovery is low and you have back-to-back meetings. Shall I optimize your calendar?',
                            'normal'
                        );
                    }
                }
            }
        }
    }

    // ========================================
    // EXISTING METHODS WITH BUTLER INTEGRATION
    // ========================================

    async authenticate() {
        try {
            const response = await this.API.getMe();
            if (response.success && response.user) {
                this.user = response.user;
                console.log('✅ User authenticated:', this.user.name);
                
                // Store user name for Butler personalization
                localStorage.setItem('phoenixUserName', this.user.name.split(' ')[0]);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Authentication error:', error);
            return false;
        }
    }

    connectModules() {
        // Subscribe to store updates for real-time reactivity
        if (this.phoenixStore) {
            this.phoenixStore.subscribe((key, value) => {
                this.onDataUpdate(key, value);
            });
        }
    }

    // ========================================
    // 🔄 AUTO-SYNC SYSTEM
    // ========================================

    startAutoSync() {
        console.log('🔄 Starting auto-sync (every 5 minutes)...');
        
        // Immediate sync
        this.syncAllData();
        
        // Auto-sync every 5 minutes
        this.autoSyncInterval = setInterval(() => {
            if (!this.syncInProgress) {
                this.syncAllData();
            }
        }, 300000); // 5 minutes
    }

    async syncAllData() {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress, skipping...');
            return;
        }
        
        this.syncInProgress = true;
        this.showNotification('Syncing Data', 'Fetching latest from all sources...');
        
        if (this.reactorCore) {
            this.reactorCore.setSyncStatus('SYNCING');
        }
        
        try {
            console.log('🔄 Starting full data sync...');
            
            // 1. Sync wearables first (if connected)
            if (this.wearablesConnected) {
                await this.syncWearables();
            }
            
            // 2. Load all planet data in parallel
            const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
            const loads = planets.map(planet => 
                this.phoenixStore.loadPlanet(planet, true).catch(err => {
                    console.warn(`Failed to sync ${planet}:`, err);
                    return null;
                })
            );
            
            await Promise.allSettled(loads);
            
            this.lastSync = new Date();
            
            if (this.reactorCore) {
                this.reactorCore.setSyncStatus('SYNCED');
            }
            
            console.log('✅ Full sync complete');
            this.showNotification('Sync Complete', 'All data updated successfully');
            
            // Don't announce sync complete if Butler is speaking
            if (this.voiceInterface && !this.voiceInterface.isSpeaking) {
                this.voiceInterface.speak('Data sync complete. All systems updated.', 'normal');
            }
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            
            if (this.reactorCore) {
                this.reactorCore.setSyncStatus('ERROR');
            }
            
            this.showNotification('Sync Failed', error.message, 'error');
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncWearables() {
        console.log('⌚ Syncing wearables...');
        
        try {
            const providers = await this.API.getConnectedWearables();
            
            if (providers && providers.length > 0) {
                for (const provider of providers) {
                    console.log(`Syncing ${provider}...`);
                    await this.API.syncWearables(provider);
                }
                
                console.log('✅ Wearables synced');
                return true;
            } else {
                console.warn('⚠️ No wearables connected');
                return false;
            }
        } catch (error) {
            console.error('Wearable sync error:', error);
            return false;
        }
    }

    // ========================================
    // 🏥 HEALTH MONITORING SYSTEM
    // ========================================

    startHealthMonitoring() {
        console.log('💓 Starting health monitoring...');
        
        // Check every 60 seconds
        this.healthCheckInterval = setInterval(() => {
            this.checkHealthStatus();
        }, 60000);
        
        // Immediate check
        this.checkHealthStatus();
    }

    async checkHealthStatus() {
        const mercuryData = this.phoenixStore?.state?.mercury;
        if (!mercuryData) return;
        
        const recovery = mercuryData.recovery?.recoveryScore;
        const hrv = mercuryData.hrv?.value || mercuryData.wearable?.hrv;
        const stress = mercuryData.wearable?.stressLevel;
        const sleep = mercuryData.wearable?.sleepDuration;
        
        // Critical recovery alert - Butler intervention
        if (recovery && recovery < this.thresholds.criticalRecovery) {
            this.triggerAlert('critical-recovery', {
                title: 'CRITICAL: Low Recovery',
                message: `Recovery at ${Math.round(recovery)}%. Immediate rest recommended.`,
                action: 'block-high-intensity',
                severity: 'critical'
            });
            
            // Butler auto-intervention
            if (this.butlerService?.autonomousMode) {
                await this.butlerService.optimizeCalendar();
            }
        }
        
        // High stress alert - Butler can help
        if (stress && stress > this.thresholds.highStress) {
            this.triggerAlert('high-stress', {
                title: 'High Stress Detected',
                message: `Stress level at ${stress}/10. Consider breathing exercises.`,
                action: 'suggest-recovery',
                severity: 'warning'
            });
            
            // Butler: Block impulse purchases
            if (this.butlerService?.trustLevel > 60) {
                if (this.voiceInterface) {
                    this.voiceInterface.speak(
                        'High stress detected. I\'m monitoring your spending to prevent stress purchases.',
                        'normal'
                    );
                }
            }
        }
        
        // Poor sleep alert
        if (sleep && sleep < 360) { // Less than 6 hours
            this.triggerAlert('poor-sleep', {
                title: 'Sleep Alert',
                message: `Only ${(sleep / 60).toFixed(1)} hours of sleep. Recovery may be compromised.`,
                action: 'adjust-training',
                severity: 'warning'
            });
            
            // Butler: Adjust today's schedule
            if (this.butlerService) {
                await this.butlerService.optimizeCalendar();
            }
        }
        
        // Update reactor with latest vitals
        if (this.reactorCore) {
            this.reactorCore.updateHealthMetrics(mercuryData);
        }
    }

    // ========================================
    // 🧠 INTELLIGENT INTERVENTIONS
    // ========================================

    startIntelligentInterventions() {
        console.log('🤖 Starting intelligent interventions...');
        
        // Check for interventions every 2 minutes
        this.intelligenceTimer = setInterval(() => {
            this.analyzeForInterventions();
        }, 120000);
        
        // Immediate check
        this.analyzeForInterventions();
    }

    async analyzeForInterventions() {
        const state = this.phoenixStore?.state;
        if (!state) return;
        
        // ⭐ INTERVENTION 1: Low recovery + High workout frequency
        if (state.mercury?.recovery?.recoveryScore < 60 && 
            state.venus?.workouts?.length > 4) {
            this.triggerIntervention('recovery-workout-balance', {
                insight: 'Low recovery despite 4+ workouts this week',
                recommendation: 'Consider a rest day or active recovery session',
                action: 'suggest-rest-day',
                severity: 'high'
            });
            
            // Butler: Cancel today's workout booking
            if (this.butlerService?.autonomousMode) {
                // Cancel any gym bookings
            }
        }
        
        // ⭐ INTERVENTION 2: Poor sleep + Low goal progress
        if (state.mercury?.wearable?.sleepDuration < 360 && state.mars?.goals) {
            const goals = state.mars.goals;
            const avgProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
            
            if (avgProgress < 50) {
                this.triggerIntervention('sleep-goal-correlation', {
                    insight: 'Poor sleep correlating with lower goal progress',
                    recommendation: 'Prioritize 7+ hours of sleep tonight',
                    action: 'optimize-sleep',
                    severity: 'medium'
                });
                
                // Butler: Set sleep reminder for tonight
                if (this.butlerService) {
                    // Schedule evening wind-down reminder
                }
            }
        }
        
        // ⭐ INTERVENTION 3: Stress-spending correlation
        if (state.mercury?.wearable?.stressLevel > 7 && state.jupiter?.finance) {
            const todaySpending = state.jupiter.finance.todaySpending || 0;
            const avgSpending = state.jupiter.finance.avgSpending || 0;
            
            if (todaySpending > avgSpending * 1.5) {
                this.triggerIntervention('stress-spending', {
                    insight: 'High stress detected. Spending 50% above average today',
                    recommendation: 'Consider stress management before purchases',
                    action: 'enable-impulse-block',
                    severity: 'urgent'
                });
                
                // Butler: Enable spending protection
                if (this.butlerService) {
                    this.butlerService.preferences.impulseBlockEnabled = true;
                    this.butlerService.savePreferences();
                }
            }
        }
        
        // ⭐ INTERVENTION 4: Goal deadline approaching
        if (state.mars?.goals) {
            const now = Date.now();
            const urgentGoals = state.mars.goals.filter(g => {
                if (!g.deadline || g.completed) return false;
                const daysUntil = (new Date(g.deadline) - now) / (1000 * 60 * 60 * 24);
                return daysUntil <= this.thresholds.goalDeadlineDays && g.progress < 70;
            });
            
            if (urgentGoals.length > 0) {
                this.triggerIntervention('goal-deadline', {
                    insight: `${urgentGoals.length} goal(s) at risk of missing deadline`,
                    recommendation: 'Review and adjust priorities',
                    action: 'review-goals',
                    severity: 'high'
                });
                
                // Butler: Block time for goal work
                if (this.butlerService && this.butlerAutomation.calendarOptimization) {
                    // Block focus time for goal work
                }
            }
        }
        
        // ⭐ INTERVENTION 5: Calendar-recovery correlation
        if (state.earth?.events?.length > 5 && 
            state.mercury?.recovery?.recoveryScore < 70) {
            this.triggerIntervention('schedule-recovery', {
                insight: 'Busy schedule with sub-optimal recovery',
                recommendation: 'Consider blocking recovery time in calendar',
                action: 'optimize-schedule',
                severity: 'medium'
            });
            
            // Butler: Optimize calendar
            if (this.butlerService?.autonomousMode) {
                await this.butlerService.optimizeCalendar();
            }
        }
    }

    triggerIntervention(type, intervention) {
        console.log('🚨 INTERVENTION:', type, intervention);
        
        // Record intervention
        if (!this.interventions) this.interventions = [];
        this.interventions.push({
            type,
            intervention,
            timestamp: Date.now()
        });
        
        // Voice announcement for urgent interventions
        if (intervention.severity === 'urgent' && this.voiceInterface) {
            this.voiceInterface.speak(intervention.insight, 'urgent');
        }
        
        // Visual notification
        this.showNotification(
            'Phoenix Intervention',
            intervention.recommendation,
            intervention.severity === 'urgent' ? 'error' : 'warning'
        );
        
        // Trigger reactor visual effect
        if (this.reactorCore) {
            this.reactorCore.triggerEvolutionEffect();
        }
        
        // Auto-execute certain actions with Butler
        if (intervention.action === 'suggest-rest-day' && this.butlerService) {
            this.offerRestDayOptimization();
        } else if (intervention.action === 'optimize-schedule' && this.butlerService) {
            this.offerScheduleOptimization();
        }
    }

    triggerAlert(type, alert) {
        console.log('⚠️ ALERT:', type, alert);
        
        // Voice announcement for critical alerts
        if (alert.severity === 'critical' && this.voiceInterface) {
            this.voiceInterface.speak(alert.message, 'urgent');
        }
        
        // Visual notification
        this.showNotification(
            alert.title,
            alert.message,
            alert.severity === 'critical' ? 'error' : 'warning'
        );
        
        // Flash reactor
        if (this.reactorCore && alert.severity === 'critical') {
            for (let i = 0; i < 6; i++) {
                this.reactorCore.activateBeam(i);
            }
        }
    }

    // ========================================
    // 🔗 WEARABLE CONNECTION SYSTEM
    // ========================================

    async checkWearableConnections() {
        try {
            const response = await this.API.getConnectedWearables();
            this.wearablesConnected = response && response.length > 0;
            
            console.log('⌚ Wearables connected:', this.wearablesConnected);
            
            if (!this.wearablesConnected) {
                setTimeout(() => {
                    this.promptWearableConnection();
                }, 5000);
            }
            
            return this.wearablesConnected;
        } catch (error) {
            console.error('Failed to check wearables:', error);
            return false;
        }
    }

    promptWearableConnection() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: rgba(0, 10, 20, 0.98);
            border: 2px solid rgba(0, 255, 255, 0.5);
            padding: 25px;
            max-width: 350px;
            z-index: 10000;
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.4);
        `;
        
        notification.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; color: #00ffff; margin-bottom: 10px;">
                ⌚ Connect Wearable Device
            </div>
            <div style="font-size: 13px; color: rgba(0, 255, 255, 0.7); margin-bottom: 20px; line-height: 1.5;">
                Connect your wearable for real-time health tracking and AI-powered insights.
            </div>
            <button id="connect-wearable-btn" style="
                width: 100%;
                padding: 12px;
                background: rgba(0, 255, 255, 0.2);
                border: 2px solid #00ffff;
                color: #00ffff;
                font-family: inherit;
                font-size: 14px;
                cursor: pointer;
                letter-spacing: 2px;
                transition: all 0.3s;
            ">CONNECT DEVICE</button>
            <button id="dismiss-wearable-btn" style="
                width: 100%;
                margin-top: 10px;
                padding: 8px;
                background: transparent;
                border: 1px solid rgba(0, 255, 255, 0.3);
                color: rgba(0, 255, 255, 0.6);
                font-family: inherit;
                font-size: 12px;
                cursor: pointer;
            ">Maybe Later</button>
        `;
        
        document.body.appendChild(notification);
        
        document.getElementById('connect-wearable-btn').addEventListener('click', () => {
            notification.remove();
            this.openWearableConnectModal();
        });
        
        document.getElementById('dismiss-wearable-btn').addEventListener('click', () => {
            notification.remove();
        });
    }

    openWearableConnectModal() {
        if (window.wearableConnector) {
            window.wearableConnector.openModal();
        } else {
            console.warn('Wearable connector not loaded');
            this.showNotification('Error', 'Wearable connector not available', 'error');
        }
    }

    // ========================================
    // 🎯 DATA UPDATE HANDLER
    // ========================================

    onDataUpdate(planet, data) {
        console.log(`📊 Data updated: ${planet}`);
        
        // Update UI elements based on planet
        if (planet === 'mercury') {
            this.updateHealthDisplays(data);
            
            // Butler: Check if health requires intervention
            if (this.butlerService && data.recovery?.recoveryScore < 40) {
                this.butlerService.optimizeCalendar();
            }
        } else if (planet === 'venus') {
            this.updateFitnessDisplays(data);
        } else if (planet === 'mars') {
            this.updateGoalsDisplays(data);
            
            // Butler: Increase trust on goal completion
            if (this.butlerService && data.goals) {
                const completedGoals = data.goals.filter(g => g.completed).length;
                if (completedGoals > 0) {
                    this.butlerService.increaseTrust(10);
                }
            }
        }
        
        // Trigger reactor beam flash
        if (this.reactorCore) {
            const beamMap = {
                mercury: 0,
                venus: 1,
                earth: 2,
                mars: 3,
                jupiter: 4,
                saturn: 5
            };
            
            const beamIndex = beamMap[planet];
            if (beamIndex !== undefined) {
                this.reactorCore.activateBeam(beamIndex);
                setTimeout(() => this.reactorCore.deactivateBeam(beamIndex), 1000);
            }
        }
    }

    updateHealthDisplays(data) {
        const recovery = data.recovery?.recoveryScore;
        if (recovery) {
            const recoveryEl = document.getElementById('recovery-value');
            if (recoveryEl) recoveryEl.textContent = Math.round(recovery) + '%';
            
            const recoveryFill = document.getElementById('recovery-fill');
            if (recoveryFill) recoveryFill.style.width = recovery + '%';
        }
        
        const updates = {
            'hrv-value': data.hrv?.value || data.wearable?.hrv || '--',
            'rhr-value': data.wearable?.heartRate || '--',
            'o2-value': data.wearable?.spo2 || '--'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    updateFitnessDisplays(data) {
        if (data.workouts) {
            const count = data.workouts.length;
            const countEl = document.getElementById('workouts-count');
            if (countEl) countEl.textContent = count;
        }
    }

    updateGoalsDisplays(data) {
        if (data.goals) {
            const completed = data.goals.filter(g => g.completed).length;
            const total = data.goals.length;
            
            const fractionEl = document.getElementById('goals-fraction');
            if (fractionEl) fractionEl.textContent = `${completed}/${total}`;
            
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            const percentEl = document.getElementById('goals-percentage');
            if (percentEl) percentEl.textContent = `${percentage}% Complete`;
            
            if (this.reactorCore) {
                this.reactorCore.setTrustScore(percentage);
            }
        }
    }

    // ========================================
    // 🎬 ACTION HANDLERS WITH BUTLER
    // ========================================

    async offerRestDayOptimization() {
        if (this.butlerService?.autonomousMode) {
            // Auto-optimize for rest
            await this.butlerService.optimizeCalendar();
            
            if (this.voiceInterface) {
                this.voiceInterface.speak(
                    'I\'ve cleared your afternoon for recovery. Rest is productive.',
                    'normal'
                );
            }
        } else {
            const confirmed = confirm('Your recovery is low. Would you like me to optimize your schedule for rest?');
            
            if (confirmed && this.butlerService) {
                await this.butlerService.optimizeCalendar();
            }
        }
    }

    async offerScheduleOptimization() {
        if (this.butlerService?.autonomousMode) {
            await this.butlerService.optimizeCalendar();
            
            if (this.voiceInterface) {
                this.voiceInterface.speak(
                    'I\'ve optimized your calendar for better energy alignment.',
                    'normal'
                );
            }
        } else {
            const confirmed = confirm('Phoenix has detected calendar overload.\n\nWould you like to optimize your schedule?');
            
            if (confirmed && this.butlerService) {
                try {
                    this.showNotification('Optimizing Schedule', 'Analyzing energy patterns...');
                    
                    const result = await this.butlerService.optimizeCalendar();
                    
                    if (result.success) {
                        this.showNotification(
                            'Schedule Optimized',
                            `Made ${result.changes} adjustments for better recovery`
                        );
                    }
                } catch (error) {
                    console.error('Schedule optimization failed:', error);
                    this.showNotification('Error', 'Failed to optimize schedule', 'error');
                }
            }
        }
    }

    async offerQuantumWorkout() {
        const confirmed = confirm('Phoenix has detected a training plateau.\n\nWould you like to generate a chaos-theory workout?');
        
        if (confirmed) {
            try {
                this.showNotification('Generating Workout', 'Creating quantum workout...');
                
                const result = await this.API.generateQuantumWorkout({
                    type: 'strength',
                    duration: 60
                });
                
                if (result.success) {
                    this.showNotification(
                        'Quantum Workout Ready',
                        `Generated workout with chaos seed: ${result.data.chaosSeed}`
                    );
                    
                    if (this.planetSystem) {
                        this.planetSystem.expandPlanet('venus');
                    }
                }
            } catch (error) {
                console.error('Quantum workout failed:', error);
                this.showNotification('Error', 'Failed to generate workout', 'error');
            }
        }
    }

    // ========================================
    // 🔧 GLOBAL UI HANDLERS
    // ========================================

    setupGlobalHandlers() {
        // Sync button
        const syncBtn = document.getElementById('quick-sync');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                this.syncAllData();
            });
        }
        
        // Chat button - now with Butler
        const chatBtn = document.getElementById('quick-chat');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                if (this.voiceInterface) {
                    this.voiceInterface.startListening();
                }
            });
        }
        
        // Workout button
        const workoutBtn = document.getElementById('quick-workout');
        if (workoutBtn) {
            workoutBtn.addEventListener('click', () => {
                this.openWorkoutLogger();
            });
        }
        
        // Meal button - now with Butler
        const mealBtn = document.getElementById('quick-meal');
        if (mealBtn) {
            mealBtn.addEventListener('click', async () => {
                if (this.butlerService) {
                    await this.butlerService.orderFood();
                } else {
                    this.openMealLogger();
                }
            });
        }
    }

    openWorkoutLogger() {
        if (this.planetSystem) {
            this.planetSystem.expandPlanet('venus');
        }
        
        this.showNotification('Workout Logger', 'Opening workout logging interface...');
    }

    openMealLogger() {
        if (this.planetSystem) {
            this.planetSystem.expandPlanet('venus');
        }
        
        this.showNotification('Meal Logger', 'Opening meal logging interface...');
    }

    // ========================================
    // 📊 INITIAL DATA SYNC
    // ========================================

    async initialDataSync() {
        console.log('🔄 Initial data sync...');
        
        await this.loadUserPreferences();
        await this.syncAllData();
        await this.analyzeForInterventions();
    }

    async loadUserPreferences() {
        try {
            const user = await this.API.getMe();
            if (user.success && user.user.preferences) {
                const prefs = user.user.preferences;
                
                // Apply voice preferences
                if (prefs.voice && this.voiceInterface) {
                    this.voiceInterface.selectedVoice = prefs.voice;
                    this.voiceInterface.speechSpeed = prefs.speechSpeed || 1.0;
                }
                
                // Apply Butler preferences
                if (prefs.butler && this.butlerService) {
                    this.butlerService.autonomousMode = prefs.butler.autonomousMode || false;
                    this.butlerService.trustLevel = prefs.butler.trustLevel || 0;
                    this.butlerAutomation = { ...this.butlerAutomation, ...prefs.butler.automation };
                }
                
                console.log('✅ User preferences loaded');
                return prefs;
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
            return null;
        }
    }

    // ========================================
    // 🎨 UI HELPERS
    // ========================================

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: rgba(0, 10, 20, 0.95);
            border: 2px solid ${type === 'error' ? 'rgba(255, 68, 68, 0.5)' : 'rgba(0, 255, 255, 0.5)'};
            padding: 20px;
            max-width: 300px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 0 30px ${type === 'error' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(0, 255, 255, 0.3)'};
        `;
        
        notification.innerHTML = `
            <div style="font-size: 14px; font-weight: bold; color: ${type === 'error' ? '#ff4444' : '#00ffff'}; margin-bottom: 10px;">${title}</div>
            <div style="font-size: 12px; color: ${type === 'error' ? 'rgba(255, 68, 68, 0.7)' : 'rgba(0, 255, 255, 0.7)'};">${message}</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showSystemStatus(status) {
        const statusEl = document.getElementById('status-display');
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.style.color = status === 'ONLINE' ? '#00ff88' : status === 'ERROR' ? '#ff4444' : '#00ffff';
        }
    }

    // ========================================
    // 🧹 CLEANUP
    // ========================================

    destroy() {
        if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
        if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
        if (this.intelligenceTimer) clearInterval(this.intelligenceTimer);
        if (this.butlerMonitoringInterval) clearInterval(this.butlerMonitoringInterval);
        
        console.log('🔴 Orchestrator destroyed');
    }
}

// ========================================
// 🚀 INITIALIZE AND EXPOSE GLOBALLY
// ========================================

const orchestrator = new PhoenixOrchestrator();
window.orchestrator = orchestrator;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => orchestrator.init());
} else {
    orchestrator.init();
}

console.log('✅ Phoenix Master Orchestrator with Butler loaded');

export default orchestrator;
