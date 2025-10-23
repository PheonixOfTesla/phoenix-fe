// orchestrator.js - Phoenix Master Intelligence Orchestrator
// This is the BRAIN that connects everything: frontend modules → backend APIs → real-time updates
// Goal: Create seamless JARVIS/Alfred experience with zero manual intervention

class PhoenixOrchestrator {
    constructor() {
        this.API = null;
        this.phoenixStore = null;
        this.reactorCore = null;
        this.voiceInterface = null;
        this.jarvisEngine = null;
        this.planetSystem = null;
        
        this.autoSyncInterval = null;
        this.healthCheckInterval = null;
        this.intelligenceTimer = null;
        
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
            goalDeadlineDays: 7
        };
    }

    // ========================================
    // 🚀 INITIALIZATION - Wait for all modules
    // ========================================

    async init() {
        console.log('🧠 Initializing Phoenix Master Orchestrator...');
        
        try {
            // Wait for all dependencies
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
            
            // Check wearable status
            await this.checkWearableConnections();
            
            // Start intelligence loops
            this.startAutoSync();
            this.startHealthMonitoring();
            this.startIntelligentInterventions();
            
            // Setup UI handlers
            this.setupGlobalHandlers();
            
            // Initial data load
            await this.initialDataSync();
            
            // Voice greeting
            if (this.voiceInterface) {
                setTimeout(() => {
                    this.voiceInterface.sayInitialGreeting();
                }, 2000);
            }
            
            console.log('✅ Phoenix Orchestrator fully operational');
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
                
                if (window.API && window.phoenixStore && window.reactorCore && 
                    window.voiceInterface && window.jarvisEngine && window.planetSystem) {
                    clearInterval(checkInterval);
                    
                    this.API = window.API;
                    this.phoenixStore = window.phoenixStore;
                    this.reactorCore = window.reactorCore;
                    this.voiceInterface = window.voiceInterface;
                    this.jarvisEngine = window.jarvisEngine;
                    this.planetSystem = window.planetSystem;
                    
                    console.log('✅ All modules loaded');
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

    async authenticate() {
        try {
            const response = await this.API.getMe();
            if (response.success && response.user) {
                this.user = response.user;
                console.log('✅ User authenticated:', this.user.name);
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
            
            // Speak update if voice enabled
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
            // Get connected providers from backend
            const providers = await this.API.getConnectedWearables();
            
            if (providers && providers.length > 0) {
                // Sync each provider
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
        
        // Critical recovery alert
        if (recovery && recovery < this.thresholds.criticalRecovery) {
            this.triggerAlert('critical-recovery', {
                title: 'CRITICAL: Low Recovery',
                message: `Recovery at ${Math.round(recovery)}%. Immediate rest recommended.`,
                action: 'block-high-intensity',
                severity: 'critical'
            });
        }
        
        // High stress alert
        if (stress && stress > this.thresholds.highStress) {
            this.triggerAlert('high-stress', {
                title: 'High Stress Detected',
                message: `Stress level at ${stress}/10. Consider breathing exercises.`,
                action: 'suggest-recovery',
                severity: 'warning'
            });
        }
        
        // Poor sleep alert
        if (sleep && sleep < 360) { // Less than 6 hours
            this.triggerAlert('poor-sleep', {
                title: 'Sleep Alert',
                message: `Only ${(sleep / 60).toFixed(1)} hours of sleep. Recovery may be compromised.`,
                action: 'adjust-training',
                severity: 'warning'
            });
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
            }
        }
        
        // ⭐ INTERVENTION 3: Workout plateau detected
        if (state.venus?.plateauDetected) {
            this.triggerIntervention('workout-plateau', {
                insight: 'Training plateau detected over last 3 weeks',
                recommendation: 'Quantum workout generation available to break through',
                action: 'generate-quantum-workout',
                severity: 'medium'
            });
        }
        
        // ⭐ INTERVENTION 4: Stress-spending correlation
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
            }
        }
        
        // ⭐ INTERVENTION 5: Goal deadline approaching
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
            }
        }
        
        // ⭐ INTERVENTION 6: Calendar-recovery correlation
        if (state.earth?.events?.length > 5 && 
            state.mercury?.recovery?.recoveryScore < 70) {
            this.triggerIntervention('schedule-recovery', {
                insight: 'Busy schedule with sub-optimal recovery',
                recommendation: 'Consider blocking recovery time in calendar',
                action: 'optimize-schedule',
                severity: 'medium'
            });
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
        
        // Auto-execute certain actions
        if (intervention.action === 'generate-quantum-workout') {
            this.offerQuantumWorkout();
        } else if (intervention.action === 'optimize-schedule') {
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
                // Show prompt to connect wearables
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
                Connect your Fitbit or Polar device for real-time health tracking and AI-powered insights.
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
            ">
                CONNECT DEVICE
            </button>
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
            ">
                Maybe Later
            </button>
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
        // This will be handled by wearables.js
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
        } else if (planet === 'venus') {
            this.updateFitnessDisplays(data);
        } else if (planet === 'mars') {
            this.updateGoalsDisplays(data);
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
        // Update HUD displays
        const recovery = data.recovery?.recoveryScore;
        if (recovery) {
            const recoveryEl = document.getElementById('recovery-value');
            if (recoveryEl) recoveryEl.textContent = Math.round(recovery) + '%';
            
            const recoveryFill = document.getElementById('recovery-fill');
            if (recoveryFill) recoveryFill.style.width = recovery + '%';
        }
        
        // Update vitals panel
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
        // Update workout count
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
            
            // Update trust score
            if (this.reactorCore) {
                this.reactorCore.setTrustScore(percentage);
            }
        }
    }

    // ========================================
    // 🎬 ACTION HANDLERS
    // ========================================

    async offerQuantumWorkout() {
        const confirmed = confirm('Phoenix has detected a training plateau.\n\nWould you like to generate a chaos-theory workout to break through?');
        
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
                    
                    // Open Venus dashboard to show workout
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

    async offerScheduleOptimization() {
        const confirmed = confirm('Phoenix has detected calendar overload.\n\nWould you like to optimize your schedule for better recovery?');
        
        if (confirmed) {
            try {
                this.showNotification('Optimizing Schedule', 'Analyzing energy patterns...');
                
                const result = await this.API.optimizeSchedule();
                
                if (result.success) {
                    this.showNotification(
                        'Schedule Optimized',
                        `Rescheduled ${result.data.movesCount} meetings for better energy alignment`
                    );
                }
            } catch (error) {
                console.error('Schedule optimization failed:', error);
                this.showNotification('Error', 'Failed to optimize schedule', 'error');
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
        
        // Chat button
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
        
        // Meal button
        const mealBtn = document.getElementById('quick-meal');
        if (mealBtn) {
            mealBtn.addEventListener('click', () => {
                this.openMealLogger();
            });
        }
    }

    openWorkoutLogger() {
        // Open Venus dashboard
        if (this.planetSystem) {
            this.planetSystem.expandPlanet('venus');
        }
        
        // TODO: Show workout logging form
        this.showNotification('Workout Logger', 'Opening workout logging interface...');
    }

    openMealLogger() {
        // Open Venus dashboard
        if (this.planetSystem) {
            this.planetSystem.expandPlanet('venus');
        }
        
        // TODO: Show meal logging form
        this.showNotification('Meal Logger', 'Opening meal logging interface...');
    }

    // ========================================
    // 📊 INITIAL DATA SYNC
    // ========================================

    async initialDataSync() {
        console.log('🔄 Initial data sync...');
        
        // Load user preferences
        await this.loadUserPreferences();
        
        // Full sync
        await this.syncAllData();
        
        // Analyze initial state
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
                
                console.log('✅ User preferences loaded');
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
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

console.log('✅ Phoenix Master Orchestrator loaded');

export default orchestrator;
