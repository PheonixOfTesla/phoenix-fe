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
            const data = this.phoenixStore.state[name] || {};
            
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
                    ${this.workoutList(workouts)}
                    ${this.nutritionBreakdown(nutrition)}
                    ${this.actionBar([
                        { icon: '➕', label: 'LOG WORKOUT', action: 'planetSystem.logWorkout()' },
                        { icon: '🍽️', label: 'LOG MEAL', action: 'planetSystem.logMeal()' },
                        { icon: '🤖', label: 'AI WORKOUT', action: 'planetSystem.generateQuantumWorkout()' }
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

})();
