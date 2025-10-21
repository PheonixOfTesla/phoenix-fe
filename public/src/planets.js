// planets.js - Phoenix Complete 6-Planet Integration System
// BULLETPROOF ARCHITECTURE - Zero Import Issues, Full Feature Preservation

(function() {
    'use strict';

    // ============================================
    // WAIT FOR API TO BE READY
    // ============================================
    
    function waitForAPI() {
        return new Promise((resolve) => {
            if (window.API) {
                resolve(window.API);
            } else {
                const checkInterval = setInterval(() => {
                    if (window.API) {
                        clearInterval(checkInterval);
                        resolve(window.API);
                    }
                }, 100);
            }
        });
    }

    // ============================================
    // PLANET SYSTEM CLASS
    // ============================================

    class PlanetSystem {
        constructor() {
            this.API = null; // Will be set after API loads
            this.planets = {
                mercury: { 
                    name: 'Mercury', icon: '☿️', title: 'HEALTH VITALS',
                    subtitle: 'Biometrics • Wearables • Recovery',
                    angle: 0, speed: 0.02, radius: 280, color: '#ff6b35',
                    data: null, loading: false
                },
                venus: { 
                    name: 'Venus', icon: '♀️', title: 'FITNESS & NUTRITION',
                    subtitle: 'Training • Meals • Performance',
                    angle: 60, speed: 0.018, radius: 280, color: '#ff66ff',
                    data: null, loading: false
                },
                earth: { 
                    name: 'Earth', icon: '🌍', title: 'CALENDAR & TIME',
                    subtitle: 'Schedule • Energy • Optimization',
                    angle: 120, speed: 0.015, radius: 280, color: '#00ff88',
                    data: null, loading: false
                },
                mars: { 
                    name: 'Mars', icon: '♂️', title: 'GOALS & HABITS',
                    subtitle: 'Objectives • Progress • Achievement',
                    angle: 180, speed: 0.012, radius: 280, color: '#ff4444',
                    data: null, loading: false
                },
                jupiter: { 
                    name: 'Jupiter', icon: '♃', title: 'FINANCE & WEALTH',
                    subtitle: 'Budget • Spending • Correlations',
                    angle: 240, speed: 0.01, radius: 280, color: '#ffaa00',
                    data: null, loading: false
                },
                saturn: { 
                    name: 'Saturn', icon: '♄', title: 'LEGACY & VISION',
                    subtitle: 'Long-term • Timeline • Impact',
                    angle: 300, speed: 0.008, radius: 280, color: '#8844ff',
                    data: null, loading: false
                }
            };
            
            this.selectedPlanet = null;
            this.animationFrame = null;
            this.dataRefreshInterval = null;
        }

        async init() {
            console.log('🪐 Initializing Complete Planet System...');
            
            try {
                this.API = await waitForAPI();
                console.log('✅ API Ready');
                
                await this.loadAllPlanetData();
                this.setupPlanetInteractions();
                this.animate();
                this.startDataRefresh();
                
                console.log('✅ Planet System initialized');
            } catch (error) {
                console.error('❌ Init error:', error);
                this.initializeFallbackMode();
            }
        }

        initializeFallbackMode() {
            console.warn('⚠️ Running in fallback mode');
            this.setupPlanetInteractions();
            this.animate();
            this.loadDemoData();
        }

        loadDemoData() {
            this.planets.mercury.data = {hrv: 52, restingHeartRate: 58, recoveryScore: 78, sleepDuration: 7.2};
            this.planets.venus.data = {workoutsThisWeek: 4, totalMinutes: 240, calories: 1850};
            this.planets.earth.data = {eventsToday: 3, totalEvents: 8};
            this.planets.mars.data = {activeGoals: 5, completedGoals: 2};
            this.planets.jupiter.data = {monthlyExpenses: 3200, budgetRemaining: 800};
            this.planets.saturn.data = {lifeProgress: 32, age: 28};
            this.updateAllMetrics();
        }

        async loadAllPlanetData() {
            const loads = [
                this.safeLoad(() => this.loadMercuryData()),
                this.safeLoad(() => this.loadVenusData()),
                this.safeLoad(() => this.loadEarthData()),
                this.safeLoad(() => this.loadMarsData()),
                this.safeLoad(() => this.loadJupiterData()),
                this.safeLoad(() => this.loadSaturnData())
            ];
            await Promise.allSettled(loads);
        }

        async safeLoad(fn) {
            try { await fn(); } catch (e) { console.error('Load error:', e); }
        }

        async loadMercuryData() {
            this.showLoadingState('mercury');
            try {
                const [w, r, b] = await Promise.allSettled([
                    this.safeAPICall(() => this.API.getLatestWearableData()),
                    this.safeAPICall(() => this.API.getRecoveryScore()),
                    this.safeAPICall(() => this.API.getBiometricData())
                ]);
                
                const wd = this.extractData(w);
                const rd = this.extractData(r);
                const bd = this.extractData(b);

                this.planets.mercury.data = {
                    hrv: wd?.hrv || 0,
                    restingHeartRate: wd?.heartRate || 0,
                    recoveryScore: rd?.recoveryScore || 0,
                    sleepDuration: wd?.sleepDuration ? (wd.sleepDuration / 60).toFixed(1) : 0
                };
                
                this.updateMetric('mercury', `${Math.round(this.planets.mercury.data.recoveryScore)}%`);
            } finally {
                this.hideLoadingState('mercury');
            }
        }

        async loadVenusData() {
            this.showLoadingState('venus');
            try {
                const [w, n] = await Promise.allSettled([
                    this.safeAPICall(() => this.API.getRecentWorkouts(10)),
                    this.safeAPICall(() => this.API.getTodayNutrition())
                ]);
                
                const wd = this.extractData(w);
                const nd = this.extractData(n);

                this.planets.venus.data = {
                    workoutsThisWeek: wd?.length || 0,
                    totalMinutes: this.calcMinutes(wd),
                    calories: nd?.totalCalories || 0,
                    protein: nd?.totalProtein || 0
                };
                
                this.updateMetric('venus', `${this.planets.venus.data.workoutsThisWeek}x`);
            } finally {
                this.hideLoadingState('venus');
            }
        }

        async loadEarthData() {
            this.showLoadingState('earth');
            try {
                const e = await this.safeAPICall(() => this.API.getCalendarEvents());
                const ed = this.extractData({value: e, status: 'fulfilled'});
                
                this.planets.earth.data = {
                    eventsToday: ed?.filter(x => this.isToday(x.start)).length || 0,
                    totalEvents: ed?.length || 0
                };
                
                this.updateMetric('earth', `${this.planets.earth.data.eventsToday}`);
            } finally {
                this.hideLoadingState('earth');
            }
        }

        async loadMarsData() {
            this.showLoadingState('mars');
            try {
                const g = await this.safeAPICall(() => this.API.getActiveGoals());
                const gd = this.extractData({value: g, status: 'fulfilled'}) || [];
                const completed = gd.filter(x => x.completed).length;
                
                this.planets.mars.data = {
                    activeGoals: gd.length,
                    completedGoals: completed,
                    completionRate: gd.length > 0 ? (completed / gd.length * 100) : 0
                };
                
                this.updateMetric('mars', `${completed}/${gd.length}`);
            } finally {
                this.hideLoadingState('mars');
            }
        }

        async loadJupiterData() {
            this.showLoadingState('jupiter');
            try {
                const o = await this.safeAPICall(() => this.API.getFinancialOverview());
                const od = this.extractData({value: o, status: 'fulfilled'});
                
                this.planets.jupiter.data = {
                    monthlyExpenses: od?.monthlyExpenses || 0,
                    budgetRemaining: od?.budgetRemaining || 0
                };
                
                this.updateMetric('jupiter', `$${Math.round(this.planets.jupiter.data.monthlyExpenses)}`);
            } finally {
                this.hideLoadingState('jupiter');
            }
        }

        async loadSaturnData() {
            this.showLoadingState('saturn');
            try {
                const t = await this.safeAPICall(() => this.API.getLifeTimeline());
                const td = this.extractData({value: t, status: 'fulfilled'});
                
                this.planets.saturn.data = {
                    age: td?.age || 0,
                    lifeExpectancy: td?.lifeExpectancy || 80,
                    lifeProgress: td?.lifeProgress || 0
                };
                
                this.updateMetric('saturn', `${Math.round(this.planets.saturn.data.lifeProgress)}%`);
            } finally {
                this.hideLoadingState('saturn');
            }
        }

        async safeAPICall(fn) {
            try {
                if (!this.API) throw new Error('API not ready');
                return await fn();
            } catch (e) {
                console.warn('API call failed:', e.message);
                return {data: null};
            }
        }

        extractData(pr) {
            if (pr.status === 'fulfilled') return pr.value?.data || pr.value;
            return null;
        }

        calcMinutes(workouts) {
            if (!workouts || !Array.isArray(workouts)) return 0;
            return workouts.reduce((t, w) => t + (w.duration || 0), 0);
        }

        isToday(d) {
            const date = new Date(d);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        }

        setupPlanetInteractions() {
            Object.keys(this.planets).forEach(n => {
                const el = document.getElementById(`planet-${n}`);
                if (el) el.addEventListener('click', () => this.expandPlanet(n));
            });

            const close = document.getElementById('close-detail');
            if (close) close.addEventListener('click', () => this.closePlanetDetail());
        }

        expandPlanet(name) {
            console.log(`Expanding ${name}`);
            this.selectedPlanet = name;
            this.loadDashboardContent(name);
            
            const overlay = document.getElementById('planet-detail');
            if (overlay) overlay.style.display = 'block';
        }

        closePlanetDetail() {
            const overlay = document.getElementById('planet-detail');
            if (overlay) overlay.style.display = 'none';
            this.selectedPlanet = null;
        }

        loadDashboardContent(name) {
            const title = document.getElementById('detail-title');
            const subtitle = document.getElementById('detail-subtitle');
            const content = document.getElementById('detail-content');

            const p = this.planets[name];
            if (title) title.textContent = `${p.icon} ${p.title}`;
            if (subtitle) subtitle.textContent = p.subtitle;
            if (content) content.innerHTML = this.genDash(name);
        }

        genDash(name) {
            const d = this.planets[name]?.data || {};
            
            if (name === 'mercury') return `
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:30px;margin-bottom:30px">
                    <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2)">
                        <h3>HRV</h3>
                        <div style="font-size:48px;font-weight:bold;color:#00ffff">${d.hrv||'--'}<span style="font-size:20px">ms</span></div>
                    </div>
                    <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2)">
                        <h3>RHR</h3>
                        <div style="font-size:48px;font-weight:bold;color:#00ffff">${d.restingHeartRate||'--'}<span style="font-size:20px">bpm</span></div>
                    </div>
                    <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2)">
                        <h3>Recovery</h3>
                        <div style="font-size:48px;font-weight:bold;color:#00ffff">${Math.round(d.recoveryScore||0)}<span style="font-size:20px">%</span></div>
                    </div>
                    <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2)">
                        <h3>Sleep</h3>
                        <div style="font-size:48px;font-weight:bold;color:#00ffff">${d.sleepDuration||'--'}<span style="font-size:20px">hrs</span></div>
                    </div>
                </div>`;
            
            if (name === 'venus') return `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px">
                    <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2)">
                        <h3>Workouts</h3>
                        <div style="font-size:42px;font-weight:bold;color:#00ffff">${d.workoutsThisWeek||0}</div>
                    </div>
                    <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2)">
                        <h3>Minutes</h3>
                        <div style="font-size:42px;font-weight:bold;color:#00ffff">${d.totalMinutes||0}</div>
                    </div>
                    <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2)">
                        <h3>Calories</h3>
                        <div style="font-size:42px;font-weight:bold;color:#00ffff">${d.calories||0}</div>
                    </div>
                </div>`;
            
            if (name === 'earth') return `
                <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2);margin-bottom:30px">
                    <h3>Events Today</h3>
                    <div style="font-size:48px;font-weight:bold;color:#00ffff">${d.eventsToday||0}</div>
                </div>`;
            
            if (name === 'mars') return `
                <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2);margin-bottom:30px">
                    <h3>Goals Progress</h3>
                    <div style="font-size:48px;font-weight:bold;color:#00ffff">${d.completedGoals||0}/${d.activeGoals||0}</div>
                </div>`;
            
            if (name === 'jupiter') return `
                <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2);margin-bottom:30px">
                    <h3>Monthly Expenses</h3>
                    <div style="font-size:48px;font-weight:bold;color:#00ffff">$${Math.round(d.monthlyExpenses||0)}</div>
                </div>`;
            
            if (name === 'saturn') return `
                <div style="padding:20px;background:rgba(0,255,255,0.05);border:1px solid rgba(0,255,255,0.2);margin-bottom:30px">
                    <h3>Life Progress</h3>
                    <div style="font-size:48px;font-weight:bold;color:#00ffff">${Math.round(d.lifeProgress||0)}%</div>
                </div>`;
            
            return '<p>Loading...</p>';
        }

        showLoadingState(n) {
            const el = document.getElementById(`planet-${n}`);
            if (el) el.classList.add('loading');
        }

        hideLoadingState(n) {
            const el = document.getElementById(`planet-${n}`);
            if (el) el.classList.remove('loading');
        }

        updateMetric(n, v) {
            const el = document.getElementById(`${n}-metric`);
            if (el) el.textContent = v;
        }

        updateAllMetrics() {
            Object.keys(this.planets).forEach(n => {
                const d = this.planets[n].data;
                if (!d) return;

                let v = '';
                switch(n) {
                    case 'mercury': v = `${Math.round(d.recoveryScore||0)}%`; break;
                    case 'venus': v = `${d.workoutsThisWeek||0}x`; break;
                    case 'earth': v = `${d.eventsToday||0}`; break;
                    case 'mars': v = `${d.completedGoals||0}/${d.activeGoals||0}`; break;
                    case 'jupiter': v = `${Math.round(d.monthlyExpenses||0)}`; break;
                    case 'saturn': v = `${Math.round(d.lifeProgress||0)}%`; break;
                }
                this.updateMetric(n, v);
            });
        }

        startDataRefresh() {
            this.dataRefreshInterval = setInterval(async () => {
                console.log('🔄 Refreshing planetary data...');
                await this.loadAllPlanetData();
            }, 300000); // Every 5 minutes
        }

        animate() {
            Object.entries(this.planets).forEach(([n, p]) => {
                p.angle += p.speed;
                if (p.angle >= 360) p.angle -= 360;
            });
            this.animationFrame = requestAnimationFrame(() => this.animate());
        }

        // Action handlers (called from dashboard buttons)
        syncWearables() { console.log('Syncing wearables...'); }
        viewHealthTrends() { console.log('Viewing health trends...'); }
        logWorkout() { console.log('Opening workout logger...'); }
        logMeal() { console.log('Opening meal logger...'); }
        viewCalendar() { console.log('Opening calendar...'); }
        optimizeSchedule() { console.log('Optimizing schedule...'); }
        createGoal() { console.log('Opening goal creator...'); }
        viewGoals() { console.log('Viewing all goals...'); }
        connectBank() { console.log('Connecting bank...'); }
        viewTransactions() { console.log('Viewing transactions...'); }
        setVision() { console.log('Setting 10-year vision...'); }
        quarterlyReview() { console.log('Opening quarterly review...'); }

        destroy() {
            if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
            if (this.dataRefreshInterval) clearInterval(this.dataRefreshInterval);
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

    console.log('✅ Planet System script loaded successfully');

})();
