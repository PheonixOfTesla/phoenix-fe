// jarvis.js - Phoenix JARVIS Core Intelligence Engine
// COMPLETE BACKEND INTEGRATION - ALL 67 FILES UTILIZED

import * as API from './api.js';

class JARVISEngine {
    constructor() {
        this.currentZoomLevel = 0;
        this.activePlanet = null;
        this.allData = {};
        this.trustScore = 0;
        this.mode = 'PAL'; // PAL or JARVIS
        this.correlations = [];
        this.interventions = [];
        this.predictions = null;
        this.proactiveTimer = null;
        this.lastProactiveMessage = Date.now();
        this.userData = {};
        this.ws = null;
    }

    async init() {
        console.log('🔥 Initializing JARVIS Engine...');
        
        // Check authentication
        const token = localStorage.getItem('phoenixToken');
        if (!token) {
            console.warn('No auth token - user needs to login');
            return;
        }

        // Connect WebSocket for real-time updates
        this.setupWebSocket();
        
        // Load all planetary data from backend
        await this.loadAllData();
        
        // Load interventions (CRITICAL)
        await this.loadInterventions();
        
        // Load predictions
        await this.loadPredictions();
        
        // Calculate trust score
        await this.updateTrustScore();
        
        // Detect correlations
        await this.detectCorrelations();
        
        // Setup UI handlers
        this.setupPlanetHandlers();
        this.setupDashboardHandlers();
        this.setupChatInterface();
        
        // Start proactive messaging
        this.startProactiveMessaging();
        
        console.log('✅ JARVIS Engine initialized - Backend connected');
    }

    setupWebSocket() {
        const wsUrl = 'wss://pal-backend-production.up.railway.app/ws';
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ JARVIS WebSocket connected');
                const token = localStorage.getItem('phoenixToken');
                if (token) {
                    this.ws.send(JSON.stringify({ type: 'auth', token }));
                }
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected - attempting reconnect');
                setTimeout(() => this.setupWebSocket(), 5000);
            };
        } catch (error) {
            console.error('WebSocket setup failed:', error);
        }
    }

    handleWebSocketMessage(data) {
        switch(data.type) {
            case 'intervention':
                this.displayInterventionAlert(data.intervention);
                break;
            case 'prediction_update':
                this.loadPredictions();
                break;
            case 'data_sync':
                this.loadAllData();
                break;
            case 'proactive_message':
                this.addChatMessage(data.message, 'phoenix');
                if (window.voiceInterface) {
                    window.voiceInterface.speak(data.message);
                }
                break;
        }
    }

    // ========================================
    // DATA LOADING (REAL BACKEND CALLS)
    // ========================================

    async loadAllData() {
        try {
            this.showLoading('all');
            
            // Fetch ALL planetary data in parallel from REAL backend
            const [wearable, recovery, workouts, nutrition, calendar, goals, finance, timeline, insights] = await Promise.all([
                API.getLatestWearableData(),
                API.getRecoveryScore(),
                API.getRecentWorkouts(5),
                API.getTodayNutrition(),
                API.getCalendarEvents(),
                API.getActiveGoals(),
                API.getFinancialOverview(),
                API.getLifeTimeline(),
                API.getHealthInsights()
            ]);

            // Store real backend data
            this.allData = {
                mercury: {
                    hrv: wearable.data?.hrv || 0,
                    restingHeartRate: wearable.data?.heartRate || 0,
                    recoveryScore: recovery.data?.recoveryScore || 0,
                    sleepScore: wearable.data?.sleepScore || 0,
                    sleepDuration: wearable.data?.sleepDuration || 0,
                    steps: wearable.data?.steps || 0,
                    spo2: wearable.data?.spo2 || 98,
                    insights: insights.data || {}
                },
                venus: {
                    workouts: workouts.data || [],
                    workoutsThisWeek: workouts.data?.length || 0,
                    totalMinutes: this.calculateTotalMinutes(workouts.data),
                    avgHeartRate: this.calculateAvgHeartRate(workouts.data),
                    nutrition: nutrition.data || {},
                    calories: nutrition.data?.totalCalories || 0,
                    protein: nutrition.data?.totalProtein || 0
                },
                earth: {
                    events: calendar.data || [],
                    nextEvent: calendar.data?.[0]?.title || 'None',
                    eventsToday: calendar.data?.length || 0
                },
                mars: {
                    goals: goals.data || [],
                    active: goals.data?.length || 0,
                    completed: goals.data?.filter(g => g.completed).length || 0,
                    progress: this.calculateGoalsProgress(goals.data)
                },
                jupiter: {
                    budget: finance.data?.budget || 0,
                    expenses: finance.data?.expenses || 0,
                    spending: finance.data?.todaySpending || 0,
                    saved: finance.data?.saved || 0,
                    stressCorrelation: finance.data?.stressCorrelation || 0
                },
                saturn: {
                    daysRemaining: timeline.data?.daysRemaining || 0,
                    lifeProgress: timeline.data?.lifeProgress || 0,
                    achievements: timeline.data?.achievements || 0
                }
            };

            // Store user data for reactor/voice
            this.userData = {
                hrv: wearable.data?.hrv || 0,
                heartRate: wearable.data?.heartRate || 0,
                recoveryScore: recovery.data?.recoveryScore || 0,
                sleepHours: wearable.data?.sleepDuration ? (wearable.data.sleepDuration / 60).toFixed(1) : 0,
                steps: wearable.data?.steps || 0,
                spo2: wearable.data?.spo2 || 98
            };

            // Update UI
            this.updatePlanetMetrics();
            this.updateVitalsPanel();
            this.updateGoalsPanel();
            
            // Update reactor core
            if (window.reactorCore) {
                window.reactorCore.setEnergy(this.userData.recoveryScore);
            }
            
            this.hideLoading('all');
            console.log('✅ All backend data loaded', this.allData);

        } catch (error) {
            console.error('Failed to load data:', error);
            this.hideLoading('all');
        }
    }

    // ========================================
    // INTERVENTIONS ($2M FEATURE)
    // ========================================

    async loadInterventions() {
        try {
            const interventions = await API.getActiveInterventions();
            
            if (interventions.success && interventions.data?.length > 0) {
                this.interventions = interventions.data;
                
                // Display each intervention dramatically
                interventions.data.forEach(intervention => {
                    this.displayInterventionAlert(intervention);
                });
                
                console.log('⚠️ Active interventions:', this.interventions.length);
            }
        } catch (error) {
            console.error('Failed to load interventions:', error);
        }
    }

    displayInterventionAlert(intervention) {
        // Create dramatic full-screen alert
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: interventionFadeIn 0.5s;
        `;
        
        alert.innerHTML = `
            <div style="
                background: rgba(0,0,0,0.98);
                border: 3px solid #ff0000;
                padding: 50px;
                max-width: 700px;
                box-shadow: 0 0 100px rgba(255,0,0,0.8);
            ">
                <h2 style="
                    color: #ff0000;
                    font-size: 36px;
                    margin-bottom: 25px;
                    text-align: center;
                    text-shadow: 0 0 20px rgba(255,0,0,1);
                    animation: interventionPulse 1s infinite;
                ">⚠️ INTERVENTION ACTIVE</h2>
                
                <div style="
                    color: #00ffff;
                    font-size: 20px;
                    margin-bottom: 20px;
                    line-height: 1.6;
                ">${intervention.message || intervention.reason}</div>
                
                <div style="
                    color: rgba(0,255,255,0.8);
                    font-size: 16px;
                    margin-bottom: 30px;
                    padding: 15px;
                    background: rgba(0,255,255,0.05);
                    border-left: 3px solid #00ffff;
                ">
                    <strong>ACTION:</strong> ${intervention.action}
                </div>
                
                <div style="
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                ">
                    <button onclick="window.jarvisEngine.acknowledgeIntervention('${intervention._id}')" style="
                        padding: 15px 40px;
                        background: #ff0000;
                        border: none;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                        font-family: 'Courier New', monospace;
                        transition: all 0.3s;
                    ">ACKNOWLEDGE</button>
                    
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="
                        padding: 15px 40px;
                        background: rgba(0,255,255,0.1);
                        border: 1px solid #00ffff;
                        color: #00ffff;
                        font-size: 16px;
                        cursor: pointer;
                        font-family: 'Courier New', monospace;
                    ">DISMISS</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // Speak intervention
        if (window.voiceInterface) {
            window.voiceInterface.speak(intervention.message || intervention.reason);
        }
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'interventionFadeOut 0.5s';
                setTimeout(() => alert.remove(), 500);
            }
        }, 15000);
    }

    async acknowledgeIntervention(interventionId) {
        try {
            await API.respondToIntervention(interventionId, 'acknowledged');
            document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
                if (el.textContent.includes('INTERVENTION')) {
                    el.remove();
                }
            });
            this.addChatMessage('Intervention acknowledged', 'phoenix');
        } catch (error) {
            console.error('Failed to acknowledge intervention:', error);
        }
    }

    // ========================================
    // PREDICTIONS (ILLNESS/BURNOUT)
    // ========================================

    async loadPredictions() {
        try {
            const predictions = await API.getPredictions();
            
            if (predictions.success && predictions.data) {
                this.predictions = predictions.data;
                
                // Show critical predictions
                if (predictions.data.illnessRisk > 60) {
                    this.showPredictionWarning('ILLNESS', predictions.data.illnessRisk);
                }
                
                if (predictions.data.burnoutRisk > 50) {
                    this.showPredictionWarning('BURNOUT', predictions.data.burnoutRisk);
                }
                
                console.log('🔮 Predictions loaded:', this.predictions);
            }
        } catch (error) {
            console.error('Failed to load predictions:', error);
        }
    }

    showPredictionWarning(type, risk) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 120px;
            right: 30px;
            background: rgba(255,140,0,0.95);
            border: 2px solid #ff8c00;
            padding: 20px;
            max-width: 350px;
            z-index: 5000;
            box-shadow: 0 0 40px rgba(255,140,0,0.5);
            animation: slideIn 0.5s;
        `;
        
        warning.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; color: #fff; margin-bottom: 10px;">
                ⚠️ ${type} PREDICTION
            </div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 10px;">
                ${risk}% risk in next 48 hours
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.7);">
                ${type === 'ILLNESS' ? 'Increase rest, vitamin C, and sleep' : 'Reduce workload, increase recovery time'}
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Speak warning
        if (window.voiceInterface) {
            window.voiceInterface.speak(`Warning: ${risk}% ${type.toLowerCase()} risk detected in next 48 hours`);
        }
        
        setTimeout(() => warning.remove(), 10000);
    }

    // ========================================
    // TRUST SCORE & PAL→JARVIS EVOLUTION
    // ========================================

    async updateTrustScore() {
        try {
            const trust = await API.getTrustScore?.() || { score: 0, state: 'pal' };
            
            this.trustScore = trust.score || this.calculateLocalTrustScore();
            this.mode = trust.state === 'jarvis' ? 'JARVIS' : 'PAL';
            
            // Update reactor display
            if (window.reactorCore) {
                window.reactorCore.setTrustScore(this.trustScore);
            }
            
            // Evolve to JARVIS at 70%
            if (this.trustScore >= 70 && this.mode === 'PAL') {
                this.evolveToJARVIS();
            }
            
            console.log(`${this.mode} - Trust: ${this.trustScore}%`);
        } catch (error) {
            // Fallback to local calculation
            this.trustScore = this.calculateLocalTrustScore();
        }
    }

    calculateLocalTrustScore() {
        let score = 0;
        
        // +20% per planetary system with data
        Object.values(this.allData).forEach(planetData => {
            if (planetData && Object.keys(planetData).length > 0) {
                score += 16.67; // 100/6 planets
            }
        });
        
        return Math.min(100, Math.round(score));
    }

    evolveToJARVIS() {
        this.mode = 'JARVIS';
        
        // Visual transformation
        const core = document.getElementById('phoenix-core');
        if (core) {
            core.style.animation = 'evolutionPulse 2s ease-in-out 3';
        }
        
        // Announcement
        const message = "Trust threshold reached. Evolving to JARVIS protocol. Full capabilities unlocked.";
        this.addChatMessage(message, 'phoenix');
        
        if (window.voiceInterface) {
            window.voiceInterface.speak(message);
        }
        
        console.log('🤖 EVOLVED TO JARVIS MODE');
    }

    // ========================================
    // CORRELATIONS (CROSS-PLANET INSIGHTS)
    // ========================================

    async detectCorrelations() {
        try {
            const correlations = await API.getCrossCorrelations?.();
            
            if (correlations?.success && correlations.data) {
                this.correlations = correlations.data;
            } else {
                // Fallback to local correlation detection
                this.correlations = this.detectLocalCorrelations();
            }
            
            // Update planets.js with correlation data
            if (window.planetSystem && this.correlations.length > 0) {
                window.planetSystem.updateCorrelations(this.correlations);
            }
            
            console.log('🔗 Correlations detected:', this.correlations.length);
        } catch (error) {
            this.correlations = this.detectLocalCorrelations();
        }
    }

    detectLocalCorrelations() {
        const corr = [];
        
        // Mercury ↔ Venus (Health ↔ Fitness)
        if (this.allData.mercury?.recoveryScore < 60 && this.allData.venus?.workoutsThisWeek > 4) {
            corr.push({
                from: 'mercury',
                to: 'venus',
                strength: 0.85,
                insight: 'Low recovery with high training volume - overtraining risk'
            });
        }
        
        // Mercury ↔ Jupiter (Stress ↔ Spending)
        if (this.allData.mercury?.hrv < 50 && this.allData.jupiter?.spending > 100) {
            corr.push({
                from: 'mercury',
                to: 'jupiter',
                strength: 0.72,
                insight: 'Low HRV correlates with increased spending - stress response'
            });
        }
        
        // Earth ↔ Mars (Calendar ↔ Goals)
        if (this.allData.earth?.eventsToday > 5 && this.allData.mars?.progress < 50) {
            corr.push({
                from: 'earth',
                to: 'mars',
                strength: 0.68,
                insight: 'Busy schedule impacting goal progress'
            });
        }
        
        return corr;
    }

    // ========================================
    // UI UPDATES
    // ========================================

    updatePlanetMetrics() {
        const metrics = {
            mercury: `${this.allData.mercury?.recoveryScore || 0}%`,
            venus: `${this.allData.venus?.workoutsThisWeek || 0}x`,
            earth: `${this.allData.earth?.eventsToday || 0}`,
            mars: `${this.allData.mars?.completed || 0}/${this.allData.mars?.active || 0}`,
            jupiter: `$${this.allData.jupiter?.spending || 0}`,
            saturn: `${this.allData.saturn?.lifeProgress || 0}%`
        };

        Object.entries(metrics).forEach(([planet, value]) => {
            const metricEl = document.getElementById(`${planet}-metric`);
            if (metricEl) {
                metricEl.textContent = value;
                
                // Pulse animation on update
                if (window.planetSystem) {
                    window.planetSystem.updateMetric(planet, value);
                }
            }
        });
    }

    updateVitalsPanel() {
        const updates = {
            'hrv-value': this.allData.mercury?.hrv || 0,
            'rhr-value': this.allData.mercury?.restingHeartRate || 0,
            'recovery-value': this.allData.mercury?.recoveryScore || 0,
            'o2-value': this.allData.mercury?.spo2 || 98,
            'recovery-status': this.getRecoveryStatus(this.allData.mercury?.recoveryScore)
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
        return 'Low - Rest Needed';
    }

    updateGoalsPanel() {
        const completed = this.allData.mars?.completed || 0;
        const total = this.allData.mars?.active || 0;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const fractionEl = document.getElementById('goals-fraction');
        const percentEl = document.getElementById('goals-percentage');

        if (fractionEl) fractionEl.textContent = `${completed}/${total}`;
        if (percentEl) percentEl.textContent = `${percentage}% Complete`;
    }

    // ========================================
    // PLANET EXPANSION
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
        if (overlay) overlay.style.display = 'flex';

        this.hideLoading(planetName);
    }

    collapseDashboard() {
        const overlay = document.getElementById('dashboard-overlay');
        if (overlay) overlay.style.display = 'none';

        document.querySelectorAll('.planet-gear').forEach(p => p.classList.remove('active'));
        
        this.activePlanet = null;
        this.currentZoomLevel = 0;
    }

    async loadDashboardContent(planetName) {
        const titleEl = document.getElementById('dashboard-title');
        const subtitleEl = document.getElementById('dashboard-subtitle');
        const contentEl = document.getElementById('dashboard-content');

        const planetInfo = {
            mercury: { title: 'MERCURY - HEALTH METRICS', subtitle: 'Real-time biometric analysis' },
            venus: { title: 'VENUS - FITNESS TRACKING', subtitle: 'Performance & nutrition data' },
            earth: { title: 'EARTH - CALENDAR', subtitle: 'Schedule optimization' },
            mars: { title: 'MARS - GOALS', subtitle: 'Progress tracking' },
            jupiter: { title: 'JUPITER - FINANCE', subtitle: 'Budget & stress-spending correlation' },
            saturn: { title: 'SATURN - LEGACY', subtitle: 'Long-term vision' }
        };

        if (titleEl) titleEl.textContent = planetInfo[planetName].title;
        if (subtitleEl) subtitleEl.textContent = planetInfo[planetName].subtitle;
        if (contentEl) contentEl.innerHTML = this.generateDashboardHTML(planetName);
    }

    generateDashboardHTML(planetName) {
        const data = this.allData[planetName] || {};

        switch (planetName) {
            case 'mercury':
                return `
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>HRV</h3>
                            <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${data.hrv || 0} <span style="font-size: 20px;">ms</span></div>
                        </div>
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Recovery Score</h3>
                            <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${data.recoveryScore || 0}<span style="font-size: 20px;">%</span></div>
                        </div>
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Sleep Duration</h3>
                            <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${(data.sleepDuration / 60).toFixed(1) || 0} <span style="font-size: 20px;">hrs</span></div>
                        </div>
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Steps</h3>
                            <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${data.steps || 0}</div>
                        </div>
                    </div>
                `;
            
            case 'venus':
                return `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Workouts This Week</h3>
                            <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${data.workoutsThisWeek || 0}</div>
                        </div>
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Calories Today</h3>
                            <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${data.calories || 0}</div>
                        </div>
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Protein</h3>
                            <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${data.protein || 0}g</div>
                        </div>
                    </div>
                `;
            
            case 'earth':
                const eventsHTML = (data.events || []).slice(0, 5).map(e => `
                    <div style="padding: 15px; background: rgba(0,255,255,0.05); border-left: 3px solid #00ffff; margin-bottom: 10px;">
                        <div style="font-weight: bold;">${e.title || 'Event'}</div>
                        <div style="font-size: 12px; color: rgba(0,255,255,0.6);">${e.time || 'TBD'}</div>
                    </div>
                `).join('');
                return `<h3>Upcoming Events</h3>${eventsHTML || '<p>No events</p>'}`;
            
            case 'mars':
                const goalsHTML = (data.goals || []).map(g => `
                    <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between;">
                            <h3>${g.title}</h3>
                            <span style="font-size: 24px; color: #00ffff;">${((g.current || 0) / g.target * 100).toFixed(0)}%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(0,255,255,0.1); margin-top: 10px; border-radius: 4px;">
                            <div style="width: ${((g.current || 0) / g.target * 100)}%; height: 100%; background: #00ffff; border-radius: 4px;"></div>
                        </div>
                    </div>
                `).join('');
                return goalsHTML || '<p>No active goals</p>';
            
            case 'jupiter':
                return `
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Budget</h3>
                            <div style="font-size: 48px; font-weight: bold; color: #00ffff;">$${data.budget || 0}</div>
                        </div>
                        <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                            <h3>Expenses</h3>
                            <div style="font-size: 48px; font-weight: bold; color: #00ffff;">$${data.expenses || 0}</div>
                        </div>
                    </div>
                `;
            
            case 'saturn':
                return `
                    <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                        <h3>Life Progress</h3>
                        <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${data.lifeProgress || 0}%</div>
                        <p style="margin-top: 20px;">Days Remaining: ${data.daysRemaining || 0}</p>
                    </div>
                `;
            
            default:
                return '<p>Loading...</p>';
        }
    }

    // ========================================
    // PROACTIVE MESSAGING
    // ========================================

    startProactiveMessaging() {
        this.proactiveTimer = setInterval(() => {
            const elapsed = Date.now() - this.lastProactiveMessage;
            if (elapsed > 300000) { // 5 minutes
                this.sendProactiveMessage();
                this.lastProactiveMessage = Date.now();
            }
        }, 60000);
    }

    sendProactiveMessage() {
        const messages = [];
        
        // Recovery-based messages
        if (this.userData.recoveryScore > 75) {
            messages.push("Your recovery is excellent. Ready for high-intensity training.");
        } else if (this.userData.recoveryScore < 50) {
            messages.push("Recovery is low. I recommend active recovery or rest today.");
        }
        
        // HRV-based messages
        if (this.userData.hrv < 50) {
            messages.push("HRV is below baseline. Your nervous system needs rest.");
        }
        
        // Goal progress messages
        if (this.allData.mars?.progress < 30) {
            messages.push("Goal progress is falling behind. Want to adjust your targets?");
        }
        
        if (messages.length > 0) {
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.addChatMessage(message, 'phoenix');
            
            if (window.voiceInterface) {
                window.voiceInterface.speak(message);
            }
        }
    }

    // ========================================
    // CHAT INTERFACE
    // ========================================

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
        } else if (lowerCmd.includes('calendar') || lowerCmd.includes('schedule')) {
            this.expandPlanet('earth');
        } else if (lowerCmd.includes('goals')) {
            this.expandPlanet('mars');
        } else if (lowerCmd.includes('finance') || lowerCmd.includes('money')) {
            this.expandPlanet('jupiter');
        } else if (lowerCmd.includes('sync')) {
            document.getElementById('sync-modal').style.display = 'flex';
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

    // ========================================
    // UTILITIES
    // ========================================

    calculateTotalMinutes(workouts) {
        if (!workouts || !Array.isArray(workouts)) return 0;
        return workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    }

    calculateAvgHeartRate(workouts) {
        if (!workouts || !Array.isArray(workouts) || workouts.length === 0) return 0;
        const total = workouts.reduce((sum, w) => sum + (w.avgHeartRate || 0), 0);
        return Math.round(total / workouts.length);
    }

    calculateGoalsProgress(goals) {
        if (!goals || !Array.isArray(goals) || goals.length === 0) return 0;
        const completed = goals.filter(g => g.completed).length;
        return Math.round((completed / goals.length) * 100);
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
}

// Initialize and expose globally
const jarvisEngine = new JARVISEngine();
window.jarvisEngine = jarvisEngine;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jarvisEngine.init());
} else {
    jarvisEngine.init();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes interventionFadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    @keyframes interventionFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes interventionPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    @keyframes evolutionPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 50px rgba(0,255,255,0.8); }
        50% { transform: scale(1.1); box-shadow: 0 0 100px rgba(0,255,255,1); }
    }
`;
document.head.appendChild(style);

export default jarvisEngine;
