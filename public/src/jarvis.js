// jarvis.js - Phoenix JARVIS Core Intelligence Engine
// ⭐ ENHANCED with phoenixStore Integration, Smart Caching & Real-time Updates

class JARVISEngine {
    constructor() {
        this.currentZoomLevel = 0; // 0 = overview, 1 = planet dashboard, 2 = deep metric
        this.activePlanet = null;
        this.allData = {};
        this.trustScore = 0;
        this.correlations = [];
        this.proactiveTimer = null;
        this.lastProactiveMessage = Date.now();
        this.unsubscribe = null;
        this.storeConnected = false;
        this.API = null;
        this.phoenixStore = null;
        this.interventionHistory = [];
        this.patternCache = new Map();
    }

    async init() {
        console.log('🔥 Initializing Enhanced JARVIS Engine...');
        
        // Wait for dependencies
        await this.waitForDependencies();
        
        // ⭐ NEW: Subscribe to phoenixStore instead of connectToBackend()
        this.subscribeToStore();
        
        // Load all planetary data via store
        await this.loadAllData();
        
        // Setup click handlers
        this.setupPlanetHandlers();
        this.setupDashboardHandlers();
        
        // Initialize proactive messaging
        this.startProactiveMessaging();
        
        // Setup chat interface
        this.setupChatInterface();
        
        // ⭐ NEW: Start real-time correlation detection
        this.startRealtimeCorrelationDetection();
        
        console.log('✅ Enhanced JARVIS Engine initialized');
    }

    // ========================================
    // ⭐ NEW: WAIT FOR DEPENDENCIES
    // ========================================
    
    async waitForDependencies() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.API && window.phoenixStore) {
                    clearInterval(checkInterval);
                    this.API = window.API;
                    this.phoenixStore = window.phoenixStore;
                    console.log('✅ Dependencies loaded (API + phoenixStore)');
                    resolve();
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.API || !this.phoenixStore) {
                    clearInterval(checkInterval);
                    console.warn('⚠️ Dependencies timeout - running in fallback mode');
                    resolve();
                }
            }, 10000);
        });
    }

    // ========================================
    // ⭐ NEW: SUBSCRIBE TO PHOENIXSTORE
    // ========================================
    
    subscribeToStore() {
        if (!this.phoenixStore) {
            console.warn('⚠️ phoenixStore not available');
            return;
        }
        
        console.log('📡 Subscribing to phoenixStore updates...');
        
        // Subscribe to ALL data changes
        this.unsubscribe = this.phoenixStore.subscribe((key, value) => {
            this.onDataChange(key, value);
        });
        
        this.storeConnected = true;
        console.log('✅ JARVIS connected to phoenixStore');
    }

    // ========================================
    // ⭐ NEW: ON DATA CHANGE HANDLER
    // ========================================
    
    onDataChange(planet, data) {
        if (!data) return;
        
        console.log(`📊 JARVIS received update: ${planet}`, data);
        
        // Update internal data cache
        this.allData[planet] = data;
        
        // Update planet metrics in UI
        this.updatePlanetMetrics();
        
        // Update side panels based on planet
        switch(planet) {
            case 'mercury':
                this.updateVitalsPanel(data);
                this.updateReactorMetrics(data);
                break;
            case 'mars':
                this.updateGoalsPanel(data);
                this.updateTrustScore(data);
                break;
        }
        
        // ⭐ NEW: Real-time correlation detection
        this.detectRealTimeCorrelations();
        
        // ⭐ NEW: Auto-trigger interventions
        this.analyzeForInterventions(planet, data);
        
        // ⭐ NEW: Context-aware voice announcements
        if (window.voiceInterface) {
            this.announceDataUpdate(planet, data);
        }
    }

    // ========================================
    // ⭐ NEW: REAL-TIME CORRELATION DETECTION
    // ========================================
    
    detectRealTimeCorrelations() {
        const { mercury, venus, jupiter, earth, mars } = this.allData;
        
        // Correlation 1: Low recovery + High workout frequency
        if (mercury?.recovery?.recoveryScore < 60 && venus?.workouts?.length > 4) {
            const correlation = {
                id: 'low-recovery-high-workouts',
                planets: ['mercury', 'venus'],
                insight: 'Low recovery detected despite 4+ workouts this week',
                recommendation: 'Consider a rest day or active recovery',
                severity: 'high',
                timestamp: Date.now()
            };
            
            if (!this.hasRecentCorrelation(correlation.id)) {
                this.correlations.push(correlation);
                this.triggerIntervention('recovery', correlation);
                console.log('🔍 Correlation detected:', correlation.insight);
            }
        }
        
        // Correlation 2: Poor sleep + Low goal progress
        if (mercury?.wearable?.sleepDuration && mercury.wearable.sleepDuration < 360 && mars?.goals) {
            const goals = mars.goals;
            const avgProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
            
            if (avgProgress < 50) {
                const correlation = {
                    id: 'poor-sleep-low-goals',
                    planets: ['mercury', 'mars'],
                    insight: 'Poor sleep correlates with lower goal progress',
                    recommendation: 'Prioritize 7+ hours of sleep tonight',
                    severity: 'medium',
                    timestamp: Date.now()
                };
                
                if (!this.hasRecentCorrelation(correlation.id)) {
                    this.correlations.push(correlation);
                    console.log('🔍 Correlation detected:', correlation.insight);
                }
            }
        }
        
        // Correlation 3: High stress + High spending
        if (mercury?.wearable?.stressLevel > 7 && jupiter?.finance) {
            const todaySpending = jupiter.finance.todaySpending || 0;
            const avgSpending = jupiter.finance.avgSpending || 0;
            
            if (todaySpending > avgSpending * 1.5) {
                const correlation = {
                    id: 'stress-spending',
                    planets: ['mercury', 'jupiter'],
                    insight: 'High stress detected. Spending is 50% above average',
                    recommendation: 'Consider stress management techniques before purchases',
                    severity: 'urgent',
                    timestamp: Date.now()
                };
                
                if (!this.hasRecentCorrelation(correlation.id)) {
                    this.correlations.push(correlation);
                    this.triggerIntervention('financial', correlation);
                    console.log('🔍 Correlation detected:', correlation.insight);
                }
            }
        }
        
        // Correlation 4: Busy schedule + Low recovery
        if (earth?.events?.length > 5 && mercury?.recovery?.recoveryScore < 70) {
            const correlation = {
                id: 'busy-schedule-low-recovery',
                planets: ['earth', 'mercury'],
                insight: 'Busy schedule detected with sub-optimal recovery',
                recommendation: 'Consider blocking recovery time in calendar',
                severity: 'medium',
                timestamp: Date.now()
            };
            
            if (!this.hasRecentCorrelation(correlation.id)) {
                this.correlations.push(correlation);
                console.log('🔍 Correlation detected:', correlation.insight);
            }
        }
        
        // Correlation 5: Low sleep + High workout intensity
        if (mercury?.wearable?.sleepScore < 70 && venus?.workouts) {
            const recentWorkout = venus.workouts[0];
            if (recentWorkout && recentWorkout.intensity > 85) {
                const correlation = {
                    id: 'low-sleep-high-intensity',
                    planets: ['mercury', 'venus'],
                    insight: 'Low sleep quality after high-intensity training',
                    recommendation: 'Recovery may be compromised. Monitor closely.',
                    severity: 'medium',
                    timestamp: Date.now()
                };
                
                if (!this.hasRecentCorrelation(correlation.id)) {
                    this.correlations.push(correlation);
                    console.log('🔍 Correlation detected:', correlation.insight);
                }
            }
        }
        
        // Clean up old correlations (older than 1 hour)
        const oneHourAgo = Date.now() - 3600000;
        this.correlations = this.correlations.filter(c => c.timestamp > oneHourAgo);
    }

    hasRecentCorrelation(id) {
        const fiveMinutesAgo = Date.now() - 300000;
        return this.correlations.some(c => c.id === id && c.timestamp > fiveMinutesAgo);
    }

    // ========================================
    // ⭐ NEW: AUTO-TRIGGER INTERVENTIONS
    // ========================================
    
    analyzeForInterventions(planet, data) {
        // Intervention 1: Critical low recovery
        if (planet === 'mercury' && data.recovery?.recoveryScore < 40) {
            this.triggerIntervention('critical-recovery', {
                type: 'health',
                message: 'Recovery critically low. Immediate rest recommended.',
                action: 'block-high-intensity-workouts',
                severity: 'urgent'
            });
        }
        
        // Intervention 2: Workout plateau detected
        if (planet === 'venus' && data.plateauDetected) {
            this.triggerIntervention('plateau', {
                type: 'fitness',
                message: 'Training plateau detected. Quantum workout available.',
                action: 'suggest-quantum-workout',
                severity: 'medium'
            });
        }
        
        // Intervention 3: Goal slipping
        if (planet === 'mars' && data.goals) {
            const slippingGoals = data.goals.filter(g => 
                !g.completed && g.progress < 30 && g.deadline && 
                new Date(g.deadline) - Date.now() < 7 * 24 * 60 * 60 * 1000
            );
            
            if (slippingGoals.length > 0) {
                this.triggerIntervention('goal-slipping', {
                    type: 'goals',
                    message: `${slippingGoals.length} goal(s) at risk of missing deadline`,
                    action: 'review-goals',
                    severity: 'high'
                });
            }
        }
    }

    triggerIntervention(type, intervention) {
        console.log('🚨 Intervention triggered:', type, intervention);
        
        // Record intervention
        this.interventionHistory.push({
            type,
            intervention,
            timestamp: Date.now()
        });
        
        // Voice announcement if urgent
        if (intervention.severity === 'urgent' && window.voiceInterface) {
            window.voiceInterface.speak(intervention.message, 'urgent');
        }
        
        // Visual notification
        this.showNotification(
            'Phoenix Intervention',
            intervention.message,
            intervention.severity === 'urgent' ? 'error' : 'warning'
        );
        
        // Update reactor core if available
        if (window.reactorCore) {
            window.reactorCore.triggerEvolutionEffect();
        }
    }

    // ========================================
    // ⭐ NEW: UPDATE REACTOR METRICS
    // ========================================
    
    updateReactorMetrics(healthData) {
        if (!window.reactorCore) return;
        
        const recovery = healthData.recovery?.recoveryScore || 0;
        const hrv = healthData.hrv?.value || healthData.wearable?.hrv || 0;
        const rhr = healthData.wearable?.heartRate || 0;
        const spo2 = healthData.wearable?.spo2 || 98;
        
        // Update reactor core live metrics
        window.reactorCore.liveMetrics = {
            hrv: hrv,
            rhr: rhr,
            recovery: recovery,
            spo2: spo2
        };
        
        // Update energy level based on recovery
        if (recovery > 0) {
            window.reactorCore.setEnergy(recovery);
        }
        
        console.log('⚡ Reactor metrics updated:', window.reactorCore.liveMetrics);
    }

    updateTrustScore(goalsData) {
        if (!goalsData || !goalsData.goals) return;
        
        const goals = goalsData.goals;
        if (goals.length === 0) return;
        
        const completed = goals.filter(g => g.completed).length;
        const completionRate = (completed / goals.length) * 100;
        
        this.trustScore = completionRate;
        
        if (window.reactorCore) {
            window.reactorCore.setTrustScore(completionRate);
        }
        
        console.log('🎯 Trust score updated:', completionRate);
    }

    // ========================================
    // ⭐ NEW: CONTEXT-AWARE ANNOUNCEMENTS
    // ========================================
    
    announceDataUpdate(planet, data) {
        // Don't announce if user is actively viewing that planet
        if (this.activePlanet === planet) return;
        
        // Only announce significant changes
        const announcements = {
            mercury: () => {
                const recovery = data.recovery?.recoveryScore;
                if (recovery && recovery < 50) {
                    return `Recovery score updated to ${Math.round(recovery)} percent. Consider rest.`;
                }
                return null;
            },
            venus: () => {
                if (data.workouts && data.workouts.length > 0) {
                    return 'New workout logged successfully.';
                }
                return null;
            },
            mars: () => {
                if (data.goals) {
                    const completed = data.goals.filter(g => g.completed).length;
                    const total = data.goals.length;
                    if (completed > 0) {
                        return `Goal progress updated. ${completed} of ${total} completed.`;
                    }
                }
                return null;
            }
        };
        
        const announcement = announcements[planet]?.();
        if (announcement && !window.voiceInterface.isSpeaking) {
            // Use normal priority to avoid interrupting
            window.voiceInterface.speak(announcement, 'normal');
        }
    }

    // ========================================
    // ⭐ NEW: START REAL-TIME CORRELATION DETECTION
    // ========================================
    
    startRealtimeCorrelationDetection() {
        // Check for correlations every 30 seconds
        setInterval(() => {
            this.detectRealTimeCorrelations();
        }, 30000);
        
        console.log('🔍 Real-time correlation detection started');
    }

    // ========================================
    // LOAD ALL DATA (ENHANCED WITH STORE)
    // ========================================

    async loadAllData() {
        try {
            if (!this.phoenixStore) {
                console.warn('⚠️ phoenixStore not available, skipping data load');
                return;
            }
            
            console.log('🔄 Loading all planet data via phoenixStore...');
            this.showLoading('all');
            
            // Load all planets using the store
            const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
            
            for (const planet of planets) {
                try {
                    const data = await this.phoenixStore.loadPlanet(planet);
                    this.allData[planet] = data;
                } catch (error) {
                    console.warn(`Failed to load ${planet}:`, error);
                }
            }
            
            // Update all UI elements
            this.updatePlanetMetrics();
            
            if (this.allData.mercury) {
                this.updateVitalsPanel(this.allData.mercury);
                this.updateReactorMetrics(this.allData.mercury);
            }
            
            if (this.allData.mars) {
                this.updateGoalsPanel(this.allData.mars);
                this.updateTrustScore(this.allData.mars);
            }
            
            // Calculate initial trust score
            this.calculateTrustScore();
            
            // Initial correlation detection
            this.detectRealTimeCorrelations();
            
            this.hideLoading('all');
            console.log('✅ All planet data loaded');
        } catch (error) {
            console.error('Error loading data:', error);
            this.hideLoading('all');
        }
    }

    // ========================================
    // EXISTING METHODS (UNCHANGED)
    // ========================================

    setupPlanetHandlers() {
        const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
        
        planets.forEach(planetName => {
            const planet = document.getElementById(`planet-${planetName}`);
            if (planet) {
                planet.addEventListener('click', () => this.expandPlanet(planetName));
            }
        });

        const core = document.getElementById('phoenix-core');
        if (core) {
            core.addEventListener('click', () => {
                if (this.currentZoomLevel > 0) {
                    this.collapseDashboard();
                }
            });
        }
    }

    setupDashboardHandlers() {
        const closeBtn = document.getElementById('dashboard-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.collapseDashboard());
        }

        const overlay = document.getElementById('dashboard-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.collapseDashboard();
                }
            });
        }
    }

    async expandPlanet(planetName) {
        if (this.activePlanet === planetName) return;
        
        console.log(`Expanding ${planetName}...`);
        
        this.showLoading(planetName);
        this.activePlanet = planetName;
        this.currentZoomLevel = 1;

        document.querySelectorAll('.planet-gear').forEach(p => p.classList.remove('active'));
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) planetEl.classList.add('active');

        await this.loadDashboardContent(planetName);
        
        const overlay = document.getElementById('dashboard-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }

        this.hideLoading(planetName);
    }

    collapseDashboard() {
        console.log('Collapsing dashboard...');
        
        const overlay = document.getElementById('dashboard-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        document.querySelectorAll('.planet-gear').forEach(p => p.classList.remove('active'));
        
        this.activePlanet = null;
        this.currentZoomLevel = 0;
    }

    async loadDashboardContent(planetName) {
        // Delegate to planets.js if available
        if (window.planetSystem) {
            window.planetSystem.loadDashboardContent(planetName);
            return;
        }
        
        // Fallback rendering
        const titleEl = document.getElementById('dashboard-title');
        const subtitleEl = document.getElementById('dashboard-subtitle');
        const contentEl = document.getElementById('dashboard-content');

        const planetInfo = {
            mercury: {
                title: 'MERCURY - HEALTH METRICS',
                subtitle: 'Biometric data, recovery analytics, illness prediction'
            },
            venus: {
                title: 'VENUS - FITNESS TRACKING',
                subtitle: 'Workouts, performance, training load'
            },
            earth: {
                title: 'EARTH - CALENDAR & SCHEDULE',
                subtitle: 'Events, meetings, time management'
            },
            mars: {
                title: 'MARS - GOALS & OBJECTIVES',
                subtitle: 'Progress tracking, milestones, achievements'
            },
            jupiter: {
                title: 'JUPITER - FINANCIAL OVERVIEW',
                subtitle: 'Budget, expenses, investments'
            },
            saturn: {
                title: 'SATURN - LEGACY & LONG-TERM',
                subtitle: 'Long-term goals, impact, legacy planning'
            }
        };

        if (titleEl) titleEl.textContent = planetInfo[planetName].title;
        if (subtitleEl) subtitleEl.textContent = planetInfo[planetName].subtitle;

        if (contentEl) {
            contentEl.innerHTML = this.generateDashboardHTML(planetName);
        }
    }

    generateDashboardHTML(planetName) {
        const data = this.allData[planetName] || {};

        switch (planetName) {
            case 'mercury':
                return this.generateHealthDashboard(data);
            case 'venus':
                return this.generateFitnessDashboard(data);
            case 'earth':
                return this.generateCalendarDashboard(data);
            case 'mars':
                return this.generateGoalsDashboard(data);
            case 'jupiter':
                return this.generateFinanceDashboard(data);
            case 'saturn':
                return '<p>Legacy planning features coming soon...</p>';
            default:
                return '<p>Loading...</p>';
        }
    }

    generateHealthDashboard(data) {
        const recovery = data.recovery?.recoveryScore || '--';
        const hrv = data.hrv?.value || data.wearable?.hrv || '--';
        const rhr = data.wearable?.heartRate || '--';
        const sleep = data.wearable?.sleepScore || '--';

        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px;">
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Heart Rate Variability</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${hrv} <span style="font-size: 20px;">ms</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">Current reading</p>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Resting Heart Rate</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${rhr} <span style="font-size: 20px;">bpm</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">Morning baseline</p>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Recovery Score</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${recovery}<span style="font-size: 20px;">%</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">Ready for training</p>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Sleep Quality</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${sleep}<span style="font-size: 20px;">%</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">Last night</p>
                </div>
            </div>
        `;
    }

    generateFitnessDashboard(data) {
        const workouts = data.workouts?.length || 0;
        const totalMinutes = data.workouts?.reduce((sum, w) => sum + (w.duration || 0), 0) || 0;

        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 10px;">Workouts This Week</h3>
                    <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${workouts}</div>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 10px;">Total Minutes</h3>
                    <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${totalMinutes}</div>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 10px;">Weekly Volume</h3>
                    <div style="font-size: 42px; font-weight: bold; color: #00ffff;">--</div>
                </div>
            </div>
        `;
    }

    generateCalendarDashboard(data) {
        const events = data.events || [];
        const upcomingHTML = events.slice(0, 5).map(e => `
            <div style="padding: 15px; background: rgba(0,255,255,0.05); border-left: 3px solid #00ffff; margin-bottom: 10px;">
                <div style="font-weight: bold; margin-bottom: 5px;">${e.title || 'Event'}</div>
                <div style="font-size: 12px; color: rgba(0,255,255,0.6);">${e.time || 'TBD'}</div>
            </div>
        `).join('');

        return `
            <h3 style="margin-bottom: 15px;">Upcoming Events</h3>
            ${upcomingHTML || '<p>No upcoming events</p>'}
        `;
    }

    generateGoalsDashboard(data) {
        const goals = data.goals || [];
        const goalsHTML = goals.map(g => `
            <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2); margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>${g.title || 'Goal'}</h3>
                    <span style="font-size: 24px; font-weight: bold; color: #00ffff;">${g.progress || 0}%</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(0,255,255,0.1); margin-top: 10px; border-radius: 4px;">
                    <div style="width: ${g.progress || 0}%; height: 100%; background: #00ffff; border-radius: 4px;"></div>
                </div>
            </div>
        `).join('');

        return `
            <h3 style="margin-bottom: 15px;">Active Goals</h3>
            ${goalsHTML || '<p>No active goals. Create one to get started!</p>'}
        `;
    }

    generateFinanceDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Monthly Budget</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">$${data.finance?.budget || '0'}</div>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Expenses</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">$${data.finance?.expenses || '0'}</div>
                </div>
            </div>
        `;
    }

    updatePlanetMetrics() {
        const metrics = {
            mercury: this.calculateHealthScore(),
            venus: this.calculateFitnessScore(),
            earth: this.calculateCalendarScore(),
            mars: this.calculateGoalsScore(),
            jupiter: '💰',
            saturn: '♄'
        };

        Object.entries(metrics).forEach(([planet, value]) => {
            const metricEl = document.getElementById(`${planet}-metric`);
            if (metricEl) metricEl.textContent = value;
        });
    }

    calculateHealthScore() {
        const data = this.allData.mercury || {};
        return data.recovery?.recoveryScore ? `${Math.round(data.recovery.recoveryScore)}%` : '--';
    }

    calculateFitnessScore() {
        const data = this.allData.venus || {};
        return data.workouts ? `${data.workouts.length}x` : '--';
    }

    calculateCalendarScore() {
        const data = this.allData.earth || {};
        const events = data.events || [];
        return events.length > 0 ? `${events.length}` : '--';
    }

    calculateGoalsScore() {
        const data = this.allData.mars || {};
        const goals = data.goals || [];
        const completed = goals.filter(g => g.completed).length;
        return `${completed}/${goals.length}`;
    }

    updateVitalsPanel(healthData) {
        if (!healthData) return;

        const updates = {
            'hrv-value': healthData.hrv?.value || healthData.wearable?.hrv || '--',
            'rhr-value': healthData.wearable?.heartRate || '--',
            'recovery-value': healthData.recovery?.recoveryScore ? Math.round(healthData.recovery.recoveryScore) : '--',
            'o2-value': healthData.wearable?.spo2 || '--',
            'recovery-status': this.getRecoveryStatus(healthData.recovery?.recoveryScore)
        };

        Object.entries(updates).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    getRecoveryStatus(score) {
        if (!score) return 'Calculating...';
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Low';
    }

    updateGoalsPanel(goalsData) {
        if (!goalsData || !goalsData.goals) return;

        const goals = goalsData.goals;
        const completed = goals.filter(g => g.completed).length;
        const total = goals.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const fractionEl = document.getElementById('goals-fraction');
        const percentEl = document.getElementById('goals-percentage');

        if (fractionEl) fractionEl.textContent = `${completed}/${total}`;
        if (percentEl) percentEl.textContent = `${percentage}% Complete`;
    }

    calculateTrustScore() {
        const dataPoints = Object.values(this.allData).filter(d => d && Object.keys(d).length > 0).length;
        this.trustScore = Math.min(100, Math.round((dataPoints / 6) * 100));
        
        if (this.trustScore >= 70) {
            console.log('🔥 JARVIS evolution threshold reached!');
        }
    }

    startProactiveMessaging() {
        this.proactiveTimer = setInterval(() => {
            const elapsed = Date.now() - this.lastProactiveMessage;
            if (elapsed > 300000) {
                this.sendProactiveMessage();
                this.lastProactiveMessage = Date.now();
            }
        }, 60000);
    }

    sendProactiveMessage() {
        const messages = this.generateProactiveMessages();
        
        if (messages.length > 0) {
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.addChatMessage(message, 'phoenix');
        }
    }

    generateProactiveMessages() {
        const messages = [];
        const { mercury, venus, earth, mars } = this.allData;
        
        if (mercury?.recovery?.recoveryScore >= 80) {
            messages.push("Your recovery score is excellent today. You're cleared for high-intensity training.");
        }
        
        if (venus?.workouts?.length > 4) {
            messages.push("Great consistency! You've completed 4+ workouts this week.");
        }
        
        if (earth?.events?.length > 0) {
            messages.push(`You have ${earth.events.length} upcoming events today.`);
        }
        
        if (this.correlations.length > 0) {
            const correlation = this.correlations[0];
            messages.push(correlation.insight);
        }
        
        return messages;
    }

    setupChatInterface() {
        const input = document.getElementById('chat-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    this.handleChatMessage(input.value.trim());
                    input.value = '';
                }
            });
        }
    }

    handleChatMessage(message) {
        this.addChatMessage(message, 'user');
        this.handleVoiceCommand(message);
    }

    handleVoiceCommand(command) {
        const lowerCmd = command.toLowerCase();

        if (lowerCmd.includes('health') || lowerCmd.includes('improve my health')) {
            this.expandPlanet('mercury');
            this.addChatMessage('Analyzing health data...', 'phoenix');
        } else if (lowerCmd.includes('fitness') || lowerCmd.includes('workout')) {
            this.expandPlanet('venus');
            this.addChatMessage('Loading fitness metrics...', 'phoenix');
        } else if (lowerCmd.includes('calendar') || lowerCmd.includes('schedule')) {
            this.expandPlanet('earth');
            this.addChatMessage('Checking your calendar...', 'phoenix');
        } else if (lowerCmd.includes('goals')) {
            this.expandPlanet('mars');
            this.addChatMessage('Reviewing your goals...', 'phoenix');
        } else if (lowerCmd.includes('correlations') || lowerCmd.includes('insights')) {
            const msg = this.correlations.length > 0 
                ? `I've detected ${this.correlations.length} correlation(s): ${this.correlations[0].insight}` 
                : 'No significant correlations detected at this time.';
            this.addChatMessage(msg, 'phoenix');
        } else {
            this.addChatMessage('How can I help you with that?', 'phoenix');
        }
    }

    addChatMessage(message, sender) {
        const messagesEl = document.getElementById('chat-messages');
        if (!messagesEl) return;

        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            background: ${sender === 'phoenix' ? 'rgba(0,255,255,0.1)' : 'rgba(0,255,255,0.05)'};
            border-left: 2px solid ${sender === 'phoenix' ? '#00ffff' : 'rgba(0,255,255,0.3)'};
        `;
        msgDiv.textContent = message;
        messagesEl.appendChild(msgDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    showLoading(planetName) {
        if (planetName === 'all') {
            document.querySelectorAll('.planet-gear').forEach(p => p.classList.add('loading'));
        } else {
            const planet = document.getElementById(`planet-${planetName}`);
            if (planet) planet.classList.add('loading');
        }
    }

    hideLoading(planetName) {
        if (planetName === 'all') {
            document.querySelectorAll('.planet-gear').forEach(p => p.classList.remove('loading'));
        } else {
            const planet = document.getElementById(`planet-${planetName}`);
            if (planet) planet.classList.remove('loading');
        }
    }

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

    // Cleanup
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.proactiveTimer) {
            clearInterval(this.proactiveTimer);
        }
    }
}

// Initialize and expose globally
const jarvisEngine = new JARVISEngine();
window.jarvisEngine = jarvisEngine;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jarvisEngine.init());
} else {
    jarvisEngine.init();
}

export default jarvisEngine;
