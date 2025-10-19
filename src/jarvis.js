// jarvis.js - Phoenix JARVIS Core Intelligence Engine

import { api } from './api.js';

class JARVISEngine {
    constructor() {
        this.currentZoomLevel = 0; // 0 = overview, 1 = planet dashboard, 2 = deep metric
        this.activePlanet = null;
        this.allData = {};
        this.trustScore = 0;
        this.correlations = [];
        this.proactiveTimer = null;
        this.lastProactiveMessage = Date.now();
    }

    async init() {
        console.log('🔥 Initializing JARVIS Engine...');
        
        // Load all planetary data
        await this.loadAllData();
        
        // Setup click handlers
        this.setupPlanetHandlers();
        this.setupDashboardHandlers();
        
        // Initialize proactive messaging
        this.startProactiveMessaging();
        
        // Setup chat interface
        this.setupChatInterface();
        
        // Detect correlations
        this.detectCorrelations();
        
        console.log('✅ JARVIS Engine initialized');
    }

    async loadAllData() {
        try {
            this.showLoading('all');
            
            // Fetch all planetary data in parallel
            const [health, fitness, calendar, goals, finance] = await Promise.all([
                api.getHealthMetrics(),
                api.getFitnessData(),
                api.getCalendarEvents(),
                api.getGoals(),
                api.getFinancialData()
            ]);

            this.allData = {
                mercury: health,
                venus: fitness,
                earth: calendar,
                mars: goals,
                jupiter: finance,
                saturn: { legacy: 'Coming soon' }
            };

            // Update planet metrics
            this.updatePlanetMetrics();
            
            // Update side panels
            this.updateVitalsPanel(health);
            this.updateGoalsPanel(goals);
            
            // Calculate trust score
            this.calculateTrustScore();
            
            this.hideLoading('all');
        } catch (error) {
            console.error('Error loading data:', error);
            this.hideLoading('all');
        }
    }

    setupPlanetHandlers() {
        const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
        
        planets.forEach(planetName => {
            const planet = document.getElementById(`planet-${planetName}`);
            if (planet) {
                planet.addEventListener('click', () => this.expandPlanet(planetName));
            }
        });

        // Core reactor click
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

        // Close on overlay click
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

        // Add active class to planet
        document.querySelectorAll('.planet-gear').forEach(p => p.classList.remove('active'));
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) planetEl.classList.add('active');

        // Load dashboard content
        await this.loadDashboardContent(planetName);
        
        // Show dashboard overlay
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

        // Generate content based on planet
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
        const hrv = data.hrv || '--';
        const rhr = data.restingHeartRate || '--';
        const recovery = data.recoveryScore || '--';
        const sleep = data.sleepScore || '--';

        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px;">
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Heart Rate Variability</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${hrv} <span style="font-size: 20px;">ms</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">7-day average</p>
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
            <h3 style="margin-bottom: 15px;">Quick Actions</h3>
            <div style="display: flex; gap: 15px;">
                <button class="action-btn" onclick="jarvisEngine.executeTemplate('improve-hrv')">Improve HRV Protocol</button>
                <button class="action-btn" onclick="jarvisEngine.executeTemplate('sleep-optimization')">Optimize Sleep</button>
                <button class="action-btn" onclick="jarvisEngine.executeTemplate('recovery')">Recovery Plan</button>
            </div>
        `;
    }

    generateFitnessDashboard(data) {
        const workouts = data.workoutsThisWeek || 0;
        const totalMinutes = data.totalMinutes || 0;
        const avgHR = data.avgHeartRate || '--';

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
                    <h3 style="margin-bottom: 10px;">Avg Heart Rate</h3>
                    <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${avgHR}</div>
                </div>
            </div>
            <h3 style="margin-bottom: 15px;">Training Templates</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="action-btn" onclick="jarvisEngine.executeTemplate('cardio')">Cardio Session</button>
                <button class="action-btn" onclick="jarvisEngine.executeTemplate('strength')">Strength Training</button>
                <button class="action-btn" onclick="jarvisEngine.executeTemplate('recovery-workout')">Active Recovery</button>
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
            <div style="margin-top: 30px;">
                <button class="action-btn" onclick="jarvisEngine.addCalendarEvent()">+ Add Event</button>
            </div>
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
            <div style="margin-top: 30px;">
                <button class="action-btn" onclick="jarvisEngine.createGoal()">+ Create Goal</button>
            </div>
        `;
    }

    generateFinanceDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Monthly Budget</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">$${data.budget || '0'}</div>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Expenses</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">$${data.expenses || '0'}</div>
                </div>
            </div>
            <p style="margin-top: 30px; color: rgba(0,255,255,0.6);">Financial tracking features coming soon...</p>
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
        return data.recoveryScore ? `${data.recoveryScore}%` : '--';
    }

    calculateFitnessScore() {
        const data = this.allData.venus || {};
        return data.workoutsThisWeek ? `${data.workoutsThisWeek}x` : '--';
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
            'hrv-value': healthData.hrv || '--',
            'rhr-value': healthData.restingHeartRate || '--',
            'recovery-value': healthData.recoveryScore || '--',
            'o2-value': healthData.spo2 || '--',
            'recovery-status': this.getRecoveryStatus(healthData.recoveryScore)
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

    detectCorrelations() {
        // Example: Low recovery correlates with poor sleep
        const health = this.allData.mercury || {};
        const fitness = this.allData.venus || {};

        if (health.recoveryScore < 60 && health.sleepScore < 70) {
            this.correlations.push({
                planets: ['mercury', 'venus'],
                insight: 'Low recovery linked to poor sleep quality'
            });
        }

        console.log('Correlations detected:', this.correlations);
    }

    startProactiveMessaging() {
        this.proactiveTimer = setInterval(() => {
            const elapsed = Date.now() - this.lastProactiveMessage;
            if (elapsed > 300000) { // 5 minutes
                this.sendProactiveMessage();
                this.lastProactiveMessage = Date.now();
            }
        }, 60000); // Check every minute
    }

    sendProactiveMessage() {
        const messages = [
            "Your recovery score is looking good. Ready for a workout?",
            "You have 3 upcoming events today. Want to review them?",
            "HRV has been trending up this week. Great progress!",
            "Don't forget to log your workout from this morning."
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];
        this.addChatMessage(message, 'phoenix');
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
        } else if (lowerCmd.includes('sync')) {
            document.getElementById('sync-modal').style.display = 'flex';
            this.addChatMessage('Opening sync options...', 'phoenix');
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

    executeTemplate(templateName) {
        console.log(`Executing template: ${templateName}`);
        this.addChatMessage(`Activating ${templateName} protocol...`, 'phoenix');
    }

    createGoal() {
        this.addChatMessage('Goal creation interface coming soon!', 'phoenix');
    }

    addCalendarEvent() {
        this.addChatMessage('Calendar integration coming soon!', 'phoenix');
    }

    async initiateOAuth(provider) {
        try {
            const response = await fetch(`https://pal-backend-production.up.railway.app/api/wearables/connect/${provider}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth token if user is logged in
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success && data.authUrl) {
                // Redirect to OAuth provider
                window.location.href = data.authUrl;
            } else {
                this.addChatMessage(data.message || 'Failed to initiate OAuth', 'phoenix');
            }
        } catch (error) {
            console.error('OAuth initiation error:', error);
            this.addChatMessage('Failed to connect to wearable service', 'phoenix');
        }
    }
}

// Initialize and expose globally
const jarvisEngine = new JARVISEngine();
window.jarvisEngine = jarvisEngine;

// Global OAuth helpers for inline script
window.connectFitbit = async function() {
    document.getElementById('fitbit-status').textContent = 'Connecting...';
    await jarvisEngine.initiateOAuth('fitbit');
};

window.connectPolar = async function() {
    document.getElementById('polar-status').textContent = 'Connecting...';
    await jarvisEngine.initiateOAuth('polar');
};
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
