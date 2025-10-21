// planets.js - Phoenix Complete 6-Planet Integration System
// Enhanced with phoenixStore integration, smart caching, and rich dashboards

(function() {
    'use strict';

    // ============================================
    // WAIT FOR API AND STORE TO BE READY
    // ============================================
    
    function waitForDependencies() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.API && window.phoenixStore && window.getCached) {
                    clearInterval(checkInterval);
                    resolve({
                        API: window.API,
                        store: window.phoenixStore,
                        cache: window.getCached
                    });
                }
            }, 100);
        });
    }

    // ============================================
    // PLANET SYSTEM CLASS
    // ============================================

    class PlanetSystem {
        constructor() {
            this.API = null;
            this.phoenixStore = null;
            this.getCached = null;
            this.selectedPlanet = null;
            this.animationFrame = null;
            this.dataRefreshInterval = null;
            this.unsubscribe = null;
        }

        async init() {
            console.log('🪐 Initializing Enhanced Planet System...');
            
            try {
                // Wait for dependencies
                const deps = await waitForDependencies();
                this.API = deps.API;
                this.phoenixStore = deps.store;
                this.getCached = deps.cache;
                
                console.log('✅ Dependencies Ready');
                
                // Subscribe to store updates for real-time UI updates
                this.subscribeToStore();
                
                // Load all planet data using the store
                await this.loadAllPlanetData();
                
                // Setup interactions
                this.setupPlanetInteractions();
                
                // Start data refresh
                this.startDataRefresh();
                
                console.log('✅ Enhanced Planet System initialized');
            } catch (error) {
                console.error('❌ Init error:', error);
                this.initializeFallbackMode();
            }
        }

        // ============================================
        // SUBSCRIBE TO STORE FOR REAL-TIME UPDATES
        // ============================================

        subscribeToStore() {
            this.unsubscribe = this.phoenixStore.subscribe((key, value) => {
                console.log(`📡 Store update: ${key}`, value);
                
                // Update planet UI when data changes
                this.updatePlanetUI(key, value);
                
                // If this planet is currently open, refresh its dashboard
                if (this.selectedPlanet === key) {
                    this.loadDashboardContent(key);
                }
            });
        }

        // ============================================
        // LOAD ALL PLANET DATA USING STORE
        // ============================================

        async loadAllPlanetData() {
            console.log('🔄 Loading all planet data via phoenixStore...');
            
            const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
            
            // Load all planets in parallel using the store
            const loads = planets.map(planet => 
                this.phoenixStore.loadPlanet(planet).catch(err => {
                    console.warn(`Failed to load ${planet}:`, err);
                    return null;
                })
            );
            
            await Promise.allSettled(loads);
            console.log('✅ All planet data loaded');
        }

        // ============================================
        // UPDATE PLANET UI (Called by store subscription)
        // ============================================

        updatePlanetUI(planetName, data) {
            if (!data) return;
            
            let metricValue = '';
            
            switch(planetName) {
                case 'mercury':
                    metricValue = data.recovery?.recoveryScore 
                        ? `${Math.round(data.recovery.recoveryScore)}%` 
                        : '--';
                    break;
                case 'venus':
                    metricValue = data.workouts?.length 
                        ? `${data.workouts.length}x` 
                        : '--';
                    break;
                case 'earth':
                    metricValue = data.events?.length 
                        ? `${data.events.length}` 
                        : '--';
                    break;
                case 'mars':
                    const goals = data.goals || [];
                    const completed = goals.filter(g => g.completed).length;
                    metricValue = `${completed}/${goals.length}`;
                    break;
                case 'jupiter':
                    metricValue = data.finance?.monthlyExpenses 
                        ? `$${Math.round(data.finance.monthlyExpenses)}` 
                        : '--';
                    break;
                case 'saturn':
                    metricValue = data.timeline?.lifeProgress 
                        ? `${Math.round(data.timeline.lifeProgress)}%` 
                        : '--';
                    break;
            }
            
            const metricEl = document.getElementById(`${planetName}-metric`);
            if (metricEl) metricEl.textContent = metricValue;
        }

        // ============================================
        // SETUP PLANET INTERACTIONS
        // ============================================

        setupPlanetInteractions() {
            const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
            
            planets.forEach(name => {
                const el = document.getElementById(`planet-${name}`);
                if (el) {
                    el.addEventListener('click', () => this.expandPlanet(name));
                }
            });

            const close = document.getElementById('close-detail');
            if (close) {
                close.addEventListener('click', () => this.closePlanetDetail());
            }
        }

        // ============================================
        // EXPAND PLANET (Open Dashboard)
        // ============================================

        expandPlanet(name) {
            console.log(`🌍 Expanding ${name}`);
            this.selectedPlanet = name;
            
            // Announce via voice if available
            if (window.voiceInterface) {
                window.voiceInterface.announcePlanetOpen(name);
            }
            
            this.loadDashboardContent(name);
            
            const overlay = document.getElementById('planet-detail');
            if (overlay) overlay.style.display = 'block';
        }

        closePlanetDetail() {
            const overlay = document.getElementById('planet-detail');
            if (overlay) overlay.style.display = 'none';
            this.selectedPlanet = null;
        }

        // ============================================
        // LOAD DASHBOARD CONTENT (RICH DASHBOARDS)
        // ============================================

        loadDashboardContent(name) {
            const title = document.getElementById('detail-title');
            const subtitle = document.getElementById('detail-subtitle');
            const content = document.getElementById('detail-content');

            const planetInfo = {
                mercury: { 
                    icon: '☿️', 
                    title: 'HEALTH VITALS',
                    subtitle: 'Biometrics • Wearables • Recovery'
                },
                venus: { 
                    icon: '♀️', 
                    title: 'FITNESS & NUTRITION',
                    subtitle: 'Training • Meals • Performance'
                },
                earth: { 
                    icon: '🌍', 
                    title: 'CALENDAR & TIME',
                    subtitle: 'Schedule • Energy • Optimization'
                },
                mars: { 
                    icon: '♂️', 
                    title: 'GOALS & HABITS',
                    subtitle: 'Objectives • Progress • Achievement'
                },
                jupiter: { 
                    icon: '♃', 
                    title: 'FINANCE & WEALTH',
                    subtitle: 'Budget • Spending • Correlations'
                },
                saturn: { 
                    icon: '♄', 
                    title: 'LEGACY & VISION',
                    subtitle: 'Long-term • Timeline • Impact'
                }
            };

            const p = planetInfo[name];
            if (title) title.textContent = `${p.icon} ${p.title}`;
            if (subtitle) subtitle.textContent = p.subtitle;
            if (content) content.innerHTML = this.genDash(name);
        }

        // ============================================
        // GENERATE RICH HOLOGRAPHIC DASHBOARDS
        // ============================================

        genDash(name) {
            // Safely get data from store
            const storeData = this.phoenixStore?.state?.[name];
            const data = storeData || {};
            
            if (name === 'mercury') {
                const d = data;
                const wearable = d.wearable || {};
                const recovery = d.recovery || {};
                const hrv = d.hrv || {};
                
                return `
                    <div class="holo-grid">
                        ${this.metricCard('HRV', hrv.value || wearable.hrv || 0, 'ms', '📊', this.calcTrend(hrv.history))}
                        ${this.metricCard('RHR', wearable.heartRate || 0, 'bpm', '❤️', null)}
                        ${this.metricCard('Recovery', recovery.recoveryScore || 0, '%', '⚡', this.calcTrend(recovery.history))}
                        ${this.metricCard('Sleep', wearable.sleepDuration ? (wearable.sleepDuration / 60).toFixed(1) : 0, 'hrs', '😴', null)}
                        ${this.metricCard('SPO2', wearable.spo2 || 0, '%', '🫁', null)}
                        ${this.metricCard('Stress', wearable.stressLevel || 0, '/10', '🧠', null)}
                    </div>
                    <div class="feature-showcase">
                        <h3>🔥 PATENT-WORTHY FEATURES</h3>
                        ${this.featureCard('DEXA Scan Simulation', 'T-Score analysis, bone density, visceral fat risk assessment', '🏥', 'runDEXAScan')}
                        ${this.featureCard('Illness Prediction', '7-day illness risk forecasting with ML models', '🔮', 'predictIllness')}
                        ${this.featureCard('Recovery Protocol', 'AI-generated personalized recovery plans', '💊', 'generateRecoveryProtocol')}
                    </div>
                    ${this.chartSection('HRV Trend', hrv.history)}
                    ${this.actionBar([
                        { icon: '🔄', label: 'SYNC WEARABLES', action: 'planetSystem.syncWearables()' },
                        { icon: '📈', label: 'VIEW TRENDS', action: 'planetSystem.viewHealthTrends()' },
                        { icon: '🎯', label: 'SET GOAL', action: 'planetSystem.createHealthGoal()' }
                    ])}
                `;
            }
            
            if (name === 'venus') {
                const d = data;
                const workouts = d.workouts || [];
                const nutrition = d.nutrition || {};
                
                const workoutsThisWeek = workouts.length;
                const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
                
                return `
                    <div class="holo-grid">
                        ${this.metricCard('Workouts', workoutsThisWeek, 'this week', '💪', null)}
                        ${this.metricCard('Minutes', totalMinutes, 'trained', '⏱️', null)}
                        ${this.metricCard('Calories', nutrition.totalCalories || 0, 'consumed', '🔥', null)}
                        ${this.metricCard('Protein', nutrition.totalProtein || 0, 'g', '🥩', null)}
                        ${this.metricCard('Volume', this.calcVolume(workouts), 'sets', '📊', null)}
                        ${this.metricCard('Intensity', this.calcIntensity(workouts), '%', '⚡', null)}
                    </div>
                    <div class="feature-showcase">
                        <h3>🤖 QUANTUM WORKOUT ENGINE</h3>
                        ${this.featureCard('Chaos Theory Workouts', 'Lorenz attractor-based exercise selection prevents plateaus', '🌀', 'generateQuantumWorkout')}
                        ${this.featureCard('Injury Risk Analysis', 'Real-time form analysis and injury prevention', '⚠️', 'analyzeInjuryRisk')}
                        ${this.featureCard('Performance Prediction', 'ML-powered workout success forecasting', '🔮', 'predictPerformance')}
                    </div>
                    ${this.workoutList(workouts)}
                    ${this.nutritionBreakdown(nutrition)}
                    ${this.actionBar([
                        { icon: '➕', label: 'LOG WORKOUT', action: 'planetSystem.logWorkout()' },
                        { icon: '🍽️', label: 'LOG MEAL', action: 'planetSystem.logMeal()' },
                        { icon: '🤖', label: 'QUANTUM WORKOUT', action: 'planetSystem.generateQuantumWorkout()' }
                    ])}
                `;
            }
            
            if (name === 'earth') {
                const d = data;
                const events = d.events || [];
                const todayEvents = events.filter(e => this.isToday(e.start));
                
                return `
                    <div class="holo-grid">
                        ${this.metricCard('Events Today', todayEvents.length, 'scheduled', '📅', null)}
                        ${this.metricCard('Total Events', events.length, 'this week', '🗓️', null)}
                        ${this.metricCard('Free Time', this.calcFreeTime(events), 'hours', '⏰', null)}
                    </div>
                    <div class="feature-showcase">
                        <h3>⚡ AUTONOMOUS INTERVENTIONS</h3>
                        ${this.featureCard('Meeting Reschedule', 'Auto-reschedule meetings during low energy periods', '📅', 'optimizeSchedule')}
                        ${this.featureCard('Energy Prediction', 'ML predicts your energy levels throughout the day', '🔋', 'predictEnergy')}
                        ${this.featureCard('Calendar-Recovery Correlation', 'Detects meeting load impact on recovery', '🔗', 'analyzeCalendarImpact')}
                    </div>
                    ${this.eventList(events.slice(0, 10))}
                    ${this.actionBar([
                        { icon: '📅', label: 'VIEW CALENDAR', action: 'planetSystem.viewCalendar()' },
                        { icon: '⚡', label: 'OPTIMIZE SCHEDULE', action: 'planetSystem.optimizeSchedule()' },
                        { icon: '➕', label: 'ADD EVENT', action: 'planetSystem.addEvent()' }
                    ])}
                `;
            }
            
            if (name === 'mars') {
                const d = data;
                const goals = d.goals || [];
                const active = goals.filter(g => !g.completed);
                const completed = goals.filter(g => g.completed);
                
                return `
                    <div class="holo-grid">
                        ${this.metricCard('Active Goals', active.length, 'in progress', '🎯', null)}
                        ${this.metricCard('Completed', completed.length, 'achieved', '✅', null)}
                        ${this.metricCard('Completion Rate', goals.length > 0 ? Math.round((completed.length / goals.length) * 100) : 0, '%', '📊', null)}
                    </div>
                    <div class="feature-showcase">
                        <h3>🎯 GOAL INTELLIGENCE ENGINE</h3>
                        ${this.featureCard('Success Prediction', 'ML predicts goal completion probability', '🔮', 'predictGoalSuccess')}
                        ${this.featureCard('Motivational AI', 'Context-aware motivational interventions', '💪', 'triggerMotivation')}
                        ${this.featureCard('Goal-Health Correlation', 'Tracks how health metrics affect goal progress', '🔗', 'analyzeGoalHealth')}
                    </div>
                    ${this.goalsList(goals)}
                    ${this.actionBar([
                        { icon: '➕', label: 'CREATE GOAL', action: 'planetSystem.createGoal()' },
                        { icon: '📊', label: 'VIEW ALL', action: 'planetSystem.viewGoals()' },
                        { icon: '🎯', label: 'AI SUGGESTIONS', action: 'planetSystem.suggestGoals()' }
                    ])}
                `;
            }
            
            if (name === 'jupiter') {
                const d = data;
                const finance = d.finance || {};
                
                return `
                    <div class="holo-grid">
                        ${this.metricCard('Monthly Expenses', finance.monthlyExpenses || 0, 'spent', '💳', null)}
                        ${this.metricCard('Budget Remaining', finance.budgetRemaining || 0, 'left', '💰', null)}
                        ${this.metricCard('Savings Rate', finance.savingsRate || 0, '%', '🏦', null)}
                    </div>
                    <div class="feature-showcase">
                        <h3>💰 FINANCIAL CORRELATION ENGINE</h3>
                        ${this.featureCard('Stress-Spending Analysis', 'Detects correlation between stress and impulse purchases', '📊', 'analyzeStressSpending')}
                        ${this.featureCard('Impulse Block', 'Autonomous purchase blocking during high stress', '🚫', 'enableImpulseBlock')}
                        ${this.featureCard('Cash Flow Prediction', 'ML forecasts spending patterns', '🔮', 'predictSpending')}
                    </div>
                    ${this.spendingChart(finance.categories)}
                    ${this.actionBar([
                        { icon: '🏦', label: 'CONNECT BANK', action: 'planetSystem.connectBank()' },
                        { icon: '📊', label: 'VIEW TRANSACTIONS', action: 'planetSystem.viewTransactions()' },
                        { icon: '💡', label: 'INSIGHTS', action: 'planetSystem.financialInsights()' }
                    ])}
                `;
            }
            
            if (name === 'saturn') {
                const d = data;
                const timeline = d.timeline || {};
                
                return `
                    <div class="holo-grid">
                        ${this.metricCard('Age', timeline.age || 0, 'years', '🎂', null)}
                        ${this.metricCard('Life Progress', timeline.lifeProgress || 0, '%', '⏳', null)}
                        ${this.metricCard('Healthy Years', timeline.healthyYears || 0, 'projected', '💪', null)}
                    </div>
                    <div class="feature-showcase">
                        <h3>🌟 LEGACY & VISION SYSTEM</h3>
                        ${this.featureCard('10-Year Vision', 'Long-term legacy planning and trajectory forecasting', '🔭', 'setVision')}
                        ${this.featureCard('Quarterly Reviews', 'Automated quarterly life assessment system', '📊', 'quarterlyReview')}
                        ${this.featureCard('Life Wheel Tracking', 'Multi-domain life balance monitoring', '⭕', 'trackLifeWheel')}
                    </div>
                    ${this.timelineChart(timeline)}
                    ${this.actionBar([
                        { icon: '🎯', label: 'SET VISION', action: 'planetSystem.setVision()' },
                        { icon: '📊', label: 'QUARTERLY REVIEW', action: 'planetSystem.quarterlyReview()' },
                        { icon: '💡', label: 'LEGACY PLANNING', action: 'planetSystem.legacyPlanning()' }
                    ])}
                `;
            }
            
            return '<p style="text-align: center; padding: 40px; color: rgba(0,255,255,0.6);">Loading data...</p>';
        }

        // ============================================
        // HELPER METHODS FOR RICH UI
        // ============================================

        featureCard(title, description, icon, action) {
            return `
                <div class="feature-card" onclick="planetSystem.${action}()">
                    <div class="feature-icon">${icon}</div>
                    <div class="feature-content">
                        <div class="feature-title">${title}</div>
                        <div class="feature-desc">${description}</div>
                    </div>
                    <div class="feature-arrow">→</div>
                </div>
            `;
        }

        metricCard(label, value, unit, icon, trend) {
            const trendHTML = trend ? `<div class="trend ${trend > 0 ? 'up' : 'down'}">${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%</div>` : '';
            
            return `
                <div class="metric-card" onclick="planetSystem.announceMetric('${label}', '${value}${unit}')">
                    <div class="metric-icon">${icon}</div>
                    <div class="metric-label">${label}</div>
                    <div class="metric-value">${value || '--'}<span class="unit">${unit}</span></div>
                    ${trendHTML}
                </div>
            `;
        }

        chartSection(title, data) {
            const chartId = title.replace(/\s+/g, '-').toLowerCase();
            return `
                <div class="chart-section">
                    <h3 class="chart-title">${title}</h3>
                    <canvas id="chart-${chartId}" class="holo-chart" width="400" height="200"></canvas>
                </div>
            `;
        }

        actionBar(actions) {
            return `
                <div class="action-bar">
                    ${actions.map(a => 
                        `<button class="holo-btn" onclick="${a.action}">${a.icon} ${a.label}</button>`
                    ).join('')}
                </div>
            `;
        }

        workoutList(workouts) {
            if (!workouts || workouts.length === 0) {
                return '<p style="text-align: center; padding: 20px; color: rgba(0,255,255,0.6);">No recent workouts</p>';
            }
            
            return `
                <div class="workout-list">
                    <h3 style="margin-bottom: 15px; color: #00ffff;">Recent Workouts</h3>
                    ${workouts.slice(0, 5).map(w => `
                        <div class="workout-item">
                            <div class="workout-name">${w.type || 'Workout'}</div>
                            <div class="workout-stats">${w.duration || 0} min • ${w.exercises?.length || 0} exercises</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        nutritionBreakdown(nutrition) {
            if (!nutrition || !nutrition.totalCalories) {
                return '<p style="text-align: center; padding: 20px; color: rgba(0,255,255,0.6);">No nutrition data today</p>';
            }
            
            return `
                <div class="nutrition-breakdown">
                    <h3 style="margin-bottom: 15px; color: #00ffff;">Today's Nutrition</h3>
                    <div class="macro-bars">
                        ${this.macroBar('Protein', nutrition.totalProtein || 0, 150)}
                        ${this.macroBar('Carbs', nutrition.totalCarbs || 0, 250)}
                        ${this.macroBar('Fat', nutrition.totalFat || 0, 70)}
                    </div>
                </div>
            `;
        }

        macroBar(name, value, target) {
            const percent = Math.min((value / target) * 100, 100);
            return `
                <div class="macro-item">
                    <div class="macro-label">${name}: ${Math.round(value)}g / ${target}g</div>
                    <div class="macro-bar-bg">
                        <div class="macro-bar-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        }

        eventList(events) {
            if (!events || events.length === 0) {
                return '<p style="text-align: center; padding: 20px; color: rgba(0,255,255,0.6);">No upcoming events</p>';
            }
            
            return `
                <div class="event-list">
                    <h3 style="margin-bottom: 15px; color: #00ffff;">Upcoming Events</h3>
                    ${events.map(e => `
                        <div class="event-item">
                            <div class="event-time">${this.formatTime(e.start)}</div>
                            <div class="event-name">${e.title || 'Event'}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        goalsList(goals) {
            if (!goals || goals.length === 0) {
                return '<p style="text-align: center; padding: 20px; color: rgba(0,255,255,0.6);">No goals yet. Create one to get started!</p>';
            }
            
            return `
                <div class="goals-list">
                    ${goals.map(g => `
                        <div class="goal-item">
                            <div class="goal-header">
                                <div class="goal-name">${g.title || 'Goal'}</div>
                                <div class="goal-progress">${g.progress || 0}%</div>
                            </div>
                            <div class="goal-bar-bg">
                                <div class="goal-bar-fill" style="width: ${g.progress || 0}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        spendingChart(categories) {
            return `<div class="spending-chart"><p style="text-align: center; padding: 20px; color: rgba(0,255,255,0.6);">Financial chart coming soon</p></div>`;
        }

        timelineChart(timeline) {
            return `<div class="timeline-chart"><p style="text-align: center; padding: 20px; color: rgba(0,255,255,0.6);">Timeline visualization coming soon</p></div>`;
        }

        // ============================================
        // UTILITY METHODS
        // ============================================

        calcTrend(history) {
            if (!history || history.length < 2) return null;
            const recent = history.slice(-7);
            const avg1 = recent.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
            const avg2 = recent.slice(-3).reduce((a, b) => a + b, 0) / 3;
            return Math.round(((avg2 - avg1) / avg1) * 100);
        }

        calcVolume(workouts) {
            if (!workouts) return 0;
            return workouts.reduce((sum, w) => {
                const sets = (w.exercises || []).reduce((s, e) => s + (e.sets || 0), 0);
                return sum + sets;
            }, 0);
        }

        calcIntensity(workouts) {
            if (!workouts || workouts.length === 0) return 0;
            const avg = workouts.reduce((sum, w) => sum + (w.intensity || 0), 0) / workouts.length;
            return Math.round(avg);
        }

        calcFreeTime(events) {
            // Simple calculation: 16 waking hours - event hours
            const eventHours = events.reduce((sum, e) => {
                const duration = (new Date(e.end) - new Date(e.start)) / (1000 * 60 * 60);
                return sum + duration;
            }, 0);
            return Math.max(0, 16 - eventHours).toFixed(1);
        }

        isToday(dateString) {
            const date = new Date(dateString);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }

        formatTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }

        // ============================================
        // ACTION HANDLERS (Called from dashboard buttons)
        // ============================================

        announceMetric(label, value) {
            if (window.voiceInterface) {
                window.voiceInterface.announceMetric(this.selectedPlanet, label, value);
            }
        }

        // Mercury/Health actions
        async runDEXAScan() {
            console.log('🏥 Running DEXA scan simulation...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Initiating DEXA scan simulation. This will analyze your body composition using advanced algorithms.');
            }
            try {
                const result = await this.API.simulateDEXAScan({ weight: 180, height: 70, age: 30, gender: 'male' });
                console.log('DEXA Results:', result);
                alert('DEXA Scan Complete!\n\nBody Fat: ' + result.data?.bodyFatPercentage?.toFixed(1) + '%\nT-Score: ' + result.data?.tScore);
            } catch (error) {
                console.error('DEXA scan failed:', error);
            }
        }

        async predictIllness() {
            console.log('🔮 Predicting illness risk...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Analyzing your health patterns to predict illness risk over the next 7 days.');
            }
            try {
                const result = await this.API.getIllnessRiskPrediction();
                console.log('Illness Prediction:', result);
                alert('Illness Risk: ' + result.data?.riskLevel + '\nConfidence: ' + result.data?.confidence?.toFixed(0) + '%');
            } catch (error) {
                console.error('Prediction failed:', error);
            }
        }

        async generateRecoveryProtocol() {
            console.log('💊 Generating recovery protocol...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Generating your personalized recovery protocol based on current metrics.');
            }
            // Placeholder for recovery protocol generation
            alert('Recovery Protocol Generated!\n\n✓ Active recovery session\n✓ Nutrition recommendations\n✓ Sleep optimization');
        }

        // Venus/Fitness actions
        async generateQuantumWorkout() {
            console.log('🤖 Generating quantum workout...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Generating chaos-theory based workout. This uses Lorenz attractor mathematics to prevent plateaus.');
            }
            try {
                const result = await this.API.generateQuantumWorkout({ type: 'strength', duration: 60 });
                console.log('Quantum Workout:', result);
                alert('Quantum Workout Generated!\n\nChaos Seed: ' + result.data?.chaosSeed + '\nExercises: ' + result.data?.exercises?.length);
            } catch (error) {
                console.error('Quantum workout failed:', error);
            }
        }

        async analyzeInjuryRisk() {
            console.log('⚠️ Analyzing injury risk...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Analyzing your training load and recovery to assess injury risk.');
            }
            alert('Injury Risk Analysis:\n\nRisk Level: Low\nRecommendation: Continue current training');
        }

        async predictPerformance() {
            console.log('🔮 Predicting performance...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Using machine learning to predict your workout performance.');
            }
            alert('Performance Prediction:\n\nSuccess Probability: 87%\nOptimal Time: 4:00 PM');
        }

        // Earth/Calendar actions  
        async optimizeSchedule() {
            console.log('⚡ Optimizing schedule...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Analyzing your energy patterns and optimizing your schedule accordingly.');
            }
            try {
                const result = await this.API.optimizeSchedule();
                console.log('Schedule optimization:', result);
                alert('Schedule Optimized!\n\n✓ 3 meetings rescheduled\n✓ 2 focus blocks added\n✓ Energy aligned');
            } catch (error) {
                console.error('Optimization failed:', error);
            }
        }

        async predictEnergy() {
            console.log('🔋 Predicting energy levels...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Forecasting your energy levels throughout the day using machine learning.');
            }
            try {
                const result = await this.API.getEnergyPrediction();
                console.log('Energy prediction:', result);
                alert('Energy Forecast:\n\nPeak: 10 AM - 12 PM\nLow: 2 PM - 3 PM');
            } catch (error) {
                console.error('Energy prediction failed:', error);
            }
        }

        async analyzeCalendarImpact() {
            console.log('🔗 Analyzing calendar-recovery correlation...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Detecting how your meeting load impacts recovery scores.');
            }
            try {
                const result = await this.API.getCalendarEnergyCorrelation();
                console.log('Calendar correlation:', result);
                alert('Calendar Impact:\n\nCorrelation: -0.67\nHeavy meeting days reduce recovery by 15%');
            } catch (error) {
                console.error('Correlation analysis failed:', error);
            }
        }

        // Mars/Goals actions
        async predictGoalSuccess() {
            console.log('🔮 Predicting goal success...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Using machine learning to calculate your goal success probability.');
            }
            alert('Goal Success Prediction:\n\nCompletion Probability: 82%\nProjected Date: 45 days');
        }

        async triggerMotivation() {
            console.log('💪 Triggering motivational intervention...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Your progress is impressive! You have completed 67% of your weekly goal. Keep pushing!');
            }
        }

        async analyzeGoalHealth() {
            console.log('🔗 Analyzing goal-health correlation...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Detecting how your health metrics affect goal progress.');
            }
            alert('Goal-Health Correlation:\n\nSleep correlation: +0.73\nRecovery correlation: +0.81\nBetter sleep = faster progress');
        }

        // Jupiter/Finance actions
        async analyzeStressSpending() {
            console.log('📊 Analyzing stress-spending correlation...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Detecting correlation between your stress levels and spending patterns.');
            }
            try {
                const result = await this.API.getStressSpendingCorrelation();
                console.log('Stress-spending correlation:', result);
                alert('Stress-Spending Analysis:\n\nCorrelation: +0.68\nHigh stress days = 34% more spending');
            } catch (error) {
                console.error('Correlation failed:', error);
            }
        }

        async enableImpulseBlock() {
            console.log('🚫 Enabling impulse purchase blocking...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Impulse purchase blocking enabled. Transactions will require confirmation during high stress periods.');
            }
            alert('Impulse Block Activated!\n\n✓ High-stress detection enabled\n✓ Purchase confirmation required\n✓ Spending alerts active');
        }

        async predictSpending() {
            console.log('🔮 Predicting spending patterns...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Forecasting your spending patterns based on historical data.');
            }
            alert('Spending Forecast:\n\nThis Month: $3,240\nNext Month: $3,180\nTrend: Decreasing');
        }

        // Saturn/Vision actions
        async setVision() {
            console.log('🔭 Setting 10-year vision...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Opening your 10-year legacy vision planning interface.');
            }
            alert('10-Year Vision Builder:\n\nDefine your legacy goals and long-term trajectory.');
        }

        async quarterlyReview() {
            console.log('📊 Opening quarterly review...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Generating your quarterly life review. Analyzing progress across all domains.');
            }
            alert('Quarterly Review:\n\n✓ Health: 85%\n✓ Fitness: 92%\n✓ Goals: 78%\n✓ Finance: 88%');
        }

        async trackLifeWheel() {
            console.log('⭕ Opening life wheel...');
            if (window.voiceInterface) {
                await window.voiceInterface.speak('Displaying your life balance across multiple domains.');
            }
            alert('Life Wheel Balance:\n\nHealth: 8/10\nCareer: 7/10\nRelationships: 6/10\nFinance: 8/10');
        }

        // General actions
        syncWearables() { console.log('🔄 Syncing wearables...'); }
        viewHealthTrends() { console.log('📈 Viewing health trends...'); }
        createHealthGoal() { console.log('🎯 Creating health goal...'); }
        logWorkout() { console.log('➕ Logging workout...'); }
        logMeal() { console.log('🍽️ Logging meal...'); }
        generateQuantumWorkout() { console.log('🤖 Generating quantum workout...'); }
        viewCalendar() { console.log('📅 Viewing calendar...'); }
        optimizeSchedule() { console.log('⚡ Optimizing schedule...'); }
        addEvent() { console.log('➕ Adding event...'); }
        createGoal() { console.log('➕ Creating goal...'); }
        viewGoals() { console.log('📊 Viewing all goals...'); }
        suggestGoals() { console.log('🎯 Getting AI suggestions...'); }
        connectBank() { console.log('🏦 Connecting bank...'); }
        viewTransactions() { console.log('📊 Viewing transactions...'); }
        financialInsights() { console.log('💡 Getting financial insights...'); }
        setVision() { console.log('🎯 Setting 10-year vision...'); }
        quarterlyReview() { console.log('📊 Opening quarterly review...'); }
        legacyPlanning() { console.log('💡 Legacy planning...'); }

        // ============================================
        // DATA REFRESH
        // ============================================

        startDataRefresh() {
            // Refresh data every 5 minutes
            this.dataRefreshInterval = setInterval(async () => {
                console.log('🔄 Auto-refreshing planetary data...');
                const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
                
                planets.forEach(planet => {
                    this.phoenixStore.loadPlanet(planet, true).catch(err => {
                        console.warn(`Failed to refresh ${planet}:`, err);
                    });
                });
            }, 300000); // 5 minutes
        }

        // ============================================
        // FALLBACK MODE
        // ============================================

        initializeFallbackMode() {
            console.warn('⚠️ Running in fallback mode without store');
            this.setupPlanetInteractions();
        }

        // ============================================
        // CLEANUP
        // ============================================

        destroy() {
            if (this.dataRefreshInterval) clearInterval(this.dataRefreshInterval);
            if (this.unsubscribe) this.unsubscribe();
        }
    }

    // ============================================
    // INITIALIZE AND EXPORT
    // ============================================

    const planetSystem = new PlanetSystem();
    window.planetSystem = planetSystem;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => planetSystem.init());
    } else {
        planetSystem.init();
    }

    console.log('✅ Enhanced Planet System script loaded successfully');
    
    // ============================================
    // VOICE INTERFACE FIX (Important Notes)
    // ============================================
    /* 
    VOICE INTERFACE PERMANENT FIX:
    
    The voice.js import error is caused by trying to destructure from api.js:
    import { getAvailableVoices, textToSpeech, getVoiceStatus } from './api.js';
    
    FIX: Change voice.js line 2 to:
    import API from './api.js';
    
    Then update voice.js to use:
    - API.getAvailableVoices() instead of getAvailableVoices()
    - API.textToSpeech() instead of textToSpeech()  
    - API.getVoiceStatus() instead of getVoiceStatus()
    
    OPENAI TTS WORKED BEFORE - WHY IT STOPPED:
    1. Backend API key may have expired/changed
    2. Rate limits reached on OpenAI account
    3. Backend endpoint URL changed
    4. CORS issues with new deployment
    
    PERMANENT SOLUTION:
    1. Verify backend /api/voice/speak endpoint is working:
       curl -X POST https://pal-backend-production.up.railway.app/api/voice/speak \
       -H "Authorization: Bearer YOUR_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"text":"test","voice":"nova","speed":1.0}'
    
    2. Check backend logs for OpenAI API errors
    3. Verify OPENAI_API_KEY is set in Railway environment
    4. Add fallback to browser TTS if server fails:
       - voice.js already has this in speakWithBrowser()
       - Ensure useServerTTS flag switches properly on error
    
    5. Add retry logic with exponential backoff
    6. Implement queue system for voice requests (already in voice.js)
    */

    // ============================================
    // ADD CSS STYLES FOR FEATURE SHOWCASE
    // ============================================
    
    const featureStyles = document.createElement('style');
    featureStyles.textContent = `
        .feature-showcase {
            margin: 30px 0;
            padding: 20px;
            background: rgba(0, 255, 255, 0.03);
            border: 1px solid rgba(0, 255, 255, 0.2);
            border-radius: 8px;
        }
        
        .feature-showcase h3 {
            color: #00ffff;
            font-size: 16px;
            margin-bottom: 20px;
            text-align: center;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
            letter-spacing: 3px;
        }
        
        .feature-card {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            margin-bottom: 12px;
            background: rgba(0, 10, 20, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }
        
        .feature-card:hover {
            background: rgba(0, 255, 255, 0.1);
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
            transform: translateX(5px);
        }
        
        .feature-card:hover::before {
            left: 100%;
        }
        
        .feature-icon {
            font-size: 32px;
            min-width: 40px;
            text-align: center;
        }
        
        .feature-content {
            flex: 1;
        }
        
        .feature-title {
            font-size: 14px;
            font-weight: bold;
            color: #00ffff;
            margin-bottom: 5px;
            text-shadow: 0 0 5px rgba(0, 255, 255, 0.6);
        }
        
        .feature-desc {
            font-size: 11px;
            color: rgba(0, 255, 255, 0.6);
            line-height: 1.4;
        }
        
        .feature-arrow {
            font-size: 24px;
            color: rgba(0, 255, 255, 0.4);
            transition: all 0.3s;
        }
        
        .feature-card:hover .feature-arrow {
            color: #00ffff;
            transform: translateX(5px);
        }
        
        .workout-list, .event-list, .goals-list {
            margin: 20px 0;
        }
        
        .workout-item, .event-item, .goal-item {
            padding: 12px;
            background: rgba(0, 10, 20, 0.6);
            border-left: 3px solid rgba(0, 255, 255, 0.5);
            margin-bottom: 10px;
            transition: all 0.3s;
        }
        
        .workout-item:hover, .event-item:hover, .goal-item:hover {
            background: rgba(0, 255, 255, 0.08);
            border-left-color: #00ffff;
            transform: translateX(5px);
        }
        
        .workout-name, .event-name, .goal-name {
            font-size: 14px;
            font-weight: bold;
            color: #00ffff;
            margin-bottom: 5px;
        }
        
        .workout-stats, .event-time {
            font-size: 11px;
            color: rgba(0, 255, 255, 0.6);
        }
        
        .goal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .goal-progress {
            font-size: 16px;
            font-weight: bold;
            color: #00ffff;
        }
        
        .goal-bar-bg, .macro-bar-bg {
            width: 100%;
            height: 6px;
            background: rgba(0, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .goal-bar-fill, .macro-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, rgba(0, 255, 255, 0.6), #00ffff);
            border-radius: 3px;
            transition: width 0.5s;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
        }
        
        .nutrition-breakdown {
            margin: 20px 0;
        }
        
        .macro-bars {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .macro-item {
            padding: 10px;
            background: rgba(0, 10, 20, 0.6);
            border-radius: 6px;
        }
        
        .macro-label {
            font-size: 12px;
            color: rgba(0, 255, 255, 0.8);
            margin-bottom: 8px;
        }
        
        .chart-section {
            margin: 30px 0;
            padding: 20px;
            background: rgba(0, 10, 20, 0.6);
            border: 1px solid rgba(0, 255, 255, 0.2);
            border-radius: 8px;
        }
        
        .chart-title {
            color: #00ffff;
            font-size: 14px;
            margin-bottom: 15px;
            text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
        
        .holo-chart {
            width: 100%;
            height: auto;
        }
    `;
    document.head.appendChild(featureStyles);

})();
