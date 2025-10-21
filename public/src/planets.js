// planets.js - Phoenix Complete 6-Planet Integration System
// Integrates ALL backend features into unified planetary architecture

import * as API from './api.js';

class PlanetSystem {
    constructor() {
        this.planets = {
            mercury: { 
                name: 'Mercury',
                icon: '☿️',
                title: 'HEALTH VITALS',
                subtitle: 'Biometrics • Wearables • Recovery',
                angle: 0, 
                speed: 0.02, 
                radius: 280, 
                color: '#ff6b35',
                data: null,
                loading: false,
                features: [
                    'Real-time wearable sync',
                    'HRV & heart rate monitoring',
                    'Sleep analysis & optimization',
                    'Recovery score calculation',
                    'DEXA body composition',
                    'Illness prediction AI',
                    'Biometric trends'
                ]
            },
            venus: { 
                name: 'Venus',
                icon: '♀️',
                title: 'FITNESS & NUTRITION',
                subtitle: 'Training • Meals • Performance',
                angle: 60, 
                speed: 0.018, 
                radius: 280, 
                color: '#ff66ff',
                data: null,
                loading: false,
                features: [
                    'Quantum workout generation',
                    'Real-time form analysis',
                    'AI meal planning',
                    'Macro tracking',
                    'Photo nutrition analysis',
                    'Supplement optimization',
                    'Performance predictions'
                ]
            },
            earth: { 
                name: 'Earth',
                icon: '🌍',
                title: 'CALENDAR & TIME',
                subtitle: 'Schedule • Energy • Optimization',
                angle: 120, 
                speed: 0.015, 
                radius: 280, 
                color: '#00ff88',
                data: null,
                loading: false,
                features: [
                    'Google Calendar sync',
                    'Energy-based scheduling',
                    'Meeting load analysis',
                    'Optimal workout windows',
                    'Event rescheduling AI',
                    'Time pattern detection',
                    'Calendar-recovery correlation'
                ]
            },
            mars: { 
                name: 'Mars',
                icon: '♂️',
                title: 'GOALS & HABITS',
                subtitle: 'Objectives • Progress • Achievement',
                angle: 180, 
                speed: 0.012, 
                radius: 280, 
                color: '#ff4444',
                data: null,
                loading: false,
                features: [
                    'AI goal generation',
                    'Progress velocity tracking',
                    'Habit streak monitoring',
                    'Success predictions',
                    'Motivational interventions',
                    'Goal-health correlation',
                    'Gamification system'
                ]
            },
            jupiter: { 
                name: 'Jupiter',
                icon: '♃',
                title: 'FINANCE & WEALTH',
                subtitle: 'Budget • Spending • Correlations',
                angle: 240, 
                speed: 0.01, 
                radius: 280, 
                color: '#ffaa00',
                data: null,
                loading: false,
                features: [
                    'Plaid bank integration',
                    'Transaction tracking',
                    'Stress-spending correlation',
                    'Budget management',
                    'Cash flow analysis',
                    'Financial intervention triggers',
                    'Net worth tracking'
                ]
            },
            saturn: { 
                name: 'Saturn',
                icon: '♄',
                title: 'LEGACY & VISION',
                subtitle: 'Long-term • Timeline • Impact',
                angle: 300, 
                speed: 0.008, 
                radius: 280, 
                color: '#8844ff',
                data: null,
                loading: false,
                features: [
                    '10-year vision planning',
                    'Life timeline visualization',
                    'Quarterly reviews',
                    'Mortality awareness',
                    'Trajectory forecasting',
                    'Value alignment tracking',
                    'Legacy goal setting'
                ]
            }
        };
        
        this.selectedPlanet = null;
        this.animationFrame = null;
        this.correlations = [];
        this.dataRefreshInterval = null;
        this.realTimeConnections = new Map();
    }

    async init() {
        console.log('🪐 Initializing Complete Planet System...');
        
        // Load all planetary data from backend
        await this.loadAllPlanetData();
        
        // Start orbital animation
        this.animate();
        
        // Setup interactions
        this.setupPlanetInteractions();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Load correlations
        await this.loadCorrelations();
        
        // Auto-refresh data
        this.startDataRefresh();
        
        console.log('✅ Planet System initialized with full backend integration');
    }

    // ========================================
    // MERCURY - HEALTH VITALS
    // ========================================

    async loadMercuryData() {
        console.log('☿️ Loading Mercury (Health Vitals)...');
        this.showLoadingState('mercury');
        
        try {
            const [wearable, recovery, biometric, predictions] = await Promise.all([
                API.getLatestWearableData(),
                API.getRecoveryScore(),
                API.getBiometricData(),
                API.getHRVPrediction()
            ]);

            this.planets.mercury.data = {
                // Real-time wearable metrics
                hrv: wearable.data?.hrv || 0,
                restingHeartRate: wearable.data?.heartRate || 0,
                spo2: wearable.data?.spo2 || 98,
                steps: wearable.data?.steps || 0,
                calories: wearable.data?.calories || 0,
                
                // Sleep analysis
                sleepDuration: wearable.data?.sleepDuration ? (wearable.data.sleepDuration / 60).toFixed(1) : 0,
                sleepScore: wearable.data?.sleepScore || 0,
                deepSleep: wearable.data?.deepSleep || 0,
                remSleep: wearable.data?.remSleep || 0,
                
                // Recovery metrics
                recoveryScore: recovery.data?.recoveryScore || 0,
                recoveryStatus: this.getRecoveryStatus(recovery.data?.recoveryScore),
                readiness: recovery.data?.readiness || 0,
                
                // Body composition (DEXA simulation)
                bodyFat: biometric.data?.bodyFatPercentage || 0,
                muscleMass: biometric.data?.muscleMass || 0,
                bmr: biometric.data?.bmr || 0,
                tdee: biometric.data?.tdee || 0,
                
                // Predictions
                illnessRisk: predictions.data?.illnessRisk || 0,
                hrvForecast: predictions.data?.forecast || [],
                burnoutRisk: predictions.data?.burnoutRisk || 0,
                
                // Meta
                lastSync: wearable.data?.timestamp || new Date(),
                dataQuality: this.assessDataQuality([wearable, recovery, biometric])
            };

            this.updateMetric('mercury', `${Math.round(this.planets.mercury.data.recoveryScore)}%`);
            
            // Announce if voice is available
            if (window.voiceInterface) {
                window.voiceInterface.announceMetric('mercury', 'recovery', this.planets.mercury.data.recoveryScore);
            }
            
        } catch (error) {
            console.error('Mercury data load error:', error);
            this.showError('Failed to load health vitals');
        } finally {
            this.hideLoadingState('mercury');
        }
    }

    // ========================================
    // VENUS - FITNESS & NUTRITION
    // ========================================

    async loadVenusData() {
        console.log('♀️ Loading Venus (Fitness & Nutrition)...');
        this.showLoadingState('venus');
        
        try {
            const [workouts, analysis, nutrition, recommendations] = await Promise.all([
                API.getRecentWorkouts(10),
                API.getWorkoutAnalysis(),
                API.getTodayNutrition(),
                API.getNutritionRecommendations()
            ]);

            this.planets.venus.data = {
                // Workout metrics
                workoutsThisWeek: workouts.data?.length || 0,
                totalMinutes: this.calculateTotalMinutes(workouts.data),
                avgHeartRate: analysis.data?.avgHeartRate || 0,
                totalVolume: analysis.data?.totalVolume || 0,
                lastWorkout: workouts.data?.[0] || null,
                
                // Performance analysis
                performanceScore: analysis.data?.performanceScore || 0,
                injuryRisk: analysis.data?.injuryRisk || 0,
                formScore: analysis.data?.formScore || 0,
                progressRate: analysis.data?.progressRate || 0,
                
                // Nutrition tracking
                calories: nutrition.data?.totalCalories || 0,
                protein: nutrition.data?.totalProtein || 0,
                carbs: nutrition.data?.totalCarbs || 0,
                fats: nutrition.data?.totalFats || 0,
                hydration: nutrition.data?.hydration || 0,
                
                // Macros vs targets
                proteinTarget: nutrition.data?.proteinTarget || 0,
                carbsTarget: nutrition.data?.carbsTarget || 0,
                fatsTarget: nutrition.data?.fatsTarget || 0,
                
                // AI recommendations
                nextWorkout: recommendations.data?.nextWorkout || 'Rest',
                mealSuggestions: recommendations.data?.meals || [],
                supplementStack: recommendations.data?.supplements || [],
                
                // Quantum workouts
                quantumReady: true,
                plateauDetected: analysis.data?.plateauDetected || false
            };

            this.updateMetric('venus', `${this.planets.venus.data.workoutsThisWeek}x`);
            
        } catch (error) {
            console.error('Venus data load error:', error);
            this.showError('Failed to load fitness data');
        } finally {
            this.hideLoadingState('venus');
        }
    }

    // ========================================
    // EARTH - CALENDAR & TIME
    // ========================================

    async loadEarthData() {
        console.log('🌍 Loading Earth (Calendar & Time)...');
        this.showLoadingState('earth');
        
        try {
            const [events, analysis, optimization] = await Promise.all([
                API.getCalendarEvents(),
                API.getTimeAnalysis(),
                API.optimizeSchedule()
            ]);

            this.planets.earth.data = {
                // Today's schedule
                eventsToday: events.data?.filter(e => this.isToday(e.start)).length || 0,
                totalEvents: events.data?.length || 0,
                nextEvent: events.data?.[0] || null,
                
                // Time analysis
                meetingLoad: analysis.data?.meetingLoad || 0,
                focusTime: analysis.data?.focusTime || 0,
                breakTime: analysis.data?.breakTime || 0,
                busyHours: analysis.data?.busyHours || [],
                
                // Energy patterns
                energyPeaks: analysis.data?.energyPeaks || [],
                optimalWorkoutWindow: analysis.data?.optimalWorkoutWindow || null,
                mentalFatigueScore: analysis.data?.mentalFatigueScore || 0,
                
                // Optimization suggestions
                rescheduleRecommendations: optimization.data?.reschedule || [],
                blockingNeeded: optimization.data?.blockingNeeded || false,
                calendarHealth: optimization.data?.calendarHealth || 0,
                
                // Correlations
                calendarRecoveryCorr: await this.getCalendarRecoveryCorrelation(),
                meetingEnergyCorr: await this.getMeetingEnergyCorrelation()
            };

            this.updateMetric('earth', `${this.planets.earth.data.eventsToday}`);
            
        } catch (error) {
            console.error('Earth data load error:', error);
            this.showError('Failed to load calendar data');
        } finally {
            this.hideLoadingState('earth');
        }
    }

    // ========================================
    // MARS - GOALS & HABITS
    // ========================================

    async loadMarsData() {
        console.log('♂️ Loading Mars (Goals & Habits)...');
        this.showLoadingState('mars');
        
        try {
            const [goals, progress, predictions, habits] = await Promise.all([
                API.getActiveGoals(),
                API.getGoalProgress(),
                API.getGoalPredictions(),
                API.getHabitStreaks()
            ]);

            const activeGoals = goals.data || [];
            const completedGoals = activeGoals.filter(g => g.completed).length;

            this.planets.mars.data = {
                // Goal metrics
                activeGoals: activeGoals.length,
                completedGoals: completedGoals,
                completionRate: activeGoals.length > 0 ? (completedGoals / activeGoals.length * 100) : 0,
                
                // Progress tracking
                overallProgress: progress.data?.overallProgress || 0,
                velocity: progress.data?.velocity || 0,
                onTrackGoals: activeGoals.filter(g => g.onTrack).length,
                atRiskGoals: activeGoals.filter(g => g.atRisk).length,
                
                // Predictions
                completionProbability: predictions.data?.completionProbability || 0,
                estimatedCompletion: predictions.data?.estimatedCompletion || null,
                successFactors: predictions.data?.successFactors || [],
                
                // Habits
                longestStreak: habits.data?.longestStreak || 0,
                currentStreak: habits.data?.currentStreak || 0,
                totalHabits: habits.data?.totalHabits || 0,
                habitCompletionRate: habits.data?.completionRate || 0,
                
                // AI insights
                motivationalInsight: await this.getMotivationalInsight(activeGoals),
                interventionNeeded: this.checkGoalIntervention(activeGoals),
                
                // Correlations
                goalHealthCorrelation: await this.getGoalHealthCorrelation()
            };

            this.updateMetric('mars', `${completedGoals}/${activeGoals.length}`);
            
        } catch (error) {
            console.error('Mars data load error:', error);
            this.showError('Failed to load goals data');
        } finally {
            this.hideLoadingState('mars');
        }
    }

    // ========================================
    // JUPITER - FINANCE & WEALTH
    // ========================================

    async loadJupiterData() {
        console.log('♃ Loading Jupiter (Finance & Wealth)...');
        this.showLoadingState('jupiter');
        
        try {
            const [overview, transactions, insights, correlation] = await Promise.all([
                API.getFinancialOverview(),
                API.getTransactions(30),
                API.getSpendingInsights(),
                API.getStressSpendingCorrelation()
            ]);

            this.planets.jupiter.data = {
                // Financial overview
                totalBalance: overview.data?.totalBalance || 0,
                monthlyIncome: overview.data?.monthlyIncome || 0,
                monthlyExpenses: overview.data?.monthlyExpenses || 0,
                netWorth: overview.data?.netWorth || 0,
                
                // Budget tracking
                budgetRemaining: overview.data?.budgetRemaining || 0,
                spendingRate: overview.data?.spendingRate || 0,
                savingsRate: overview.data?.savingsRate || 0,
                
                // Recent activity
                recentTransactions: transactions.data?.slice(0, 5) || [],
                largestExpense: this.getLargestExpense(transactions.data),
                unusualSpending: insights.data?.unusualSpending || false,
                
                // Insights
                spendingByCategory: insights.data?.byCategory || {},
                topCategories: insights.data?.topCategories || [],
                savingsOpportunities: insights.data?.savingsOpportunities || [],
                
                // Stress-spending correlation
                stressCorrelation: correlation.data?.correlation || 0,
                stressSpendingEvents: correlation.data?.events || [],
                interventionTriggered: correlation.data?.interventionNeeded || false,
                
                // Predictions
                monthEndProjection: insights.data?.monthEndProjection || 0,
                cashFlowForecast: insights.data?.cashFlowForecast || []
            };

            this.updateMetric('jupiter', `$${Math.round(this.planets.jupiter.data.monthlyExpenses)}`);
            
        } catch (error) {
            console.error('Jupiter data load error:', error);
            this.showError('Failed to load financial data');
        } finally {
            this.hideLoadingState('jupiter');
        }
    }

    // ========================================
    // SATURN - LEGACY & VISION
    // ========================================

    async loadSaturnData() {
        console.log('♄ Loading Saturn (Legacy & Vision)...');
        this.showLoadingState('saturn');
        
        try {
            const [timeline, vision, review, trajectory] = await Promise.all([
                API.getLifeTimeline(),
                API.updateVision({}), // Gets current vision
                API.getQuarterlyReview(),
                API.getLifeWheelScore()
            ]);

            this.planets.saturn.data = {
                // Life timeline
                age: timeline.data?.age || 0,
                lifeExpectancy: timeline.data?.lifeExpectancy || 80,
                daysRemaining: timeline.data?.daysRemaining || 0,
                lifeProgress: timeline.data?.lifeProgress || 0,
                
                // Vision & goals
                tenYearVision: vision.data?.tenYearVision || '',
                oneYearGoals: vision.data?.oneYearGoals || [],
                quarterlyObjectives: vision.data?.quarterlyObjectives || [],
                
                // Reviews
                lastReview: review.data?.lastReview || null,
                reviewScore: review.data?.score || 0,
                accomplishments: review.data?.accomplishments || [],
                learnings: review.data?.learnings || [],
                
                // Life wheel
                healthScore: trajectory.data?.health || 0,
                wealthScore: trajectory.data?.wealth || 0,
                relationshipsScore: trajectory.data?.relationships || 0,
                purposeScore: trajectory.data?.purpose || 0,
                growthScore: trajectory.data?.growth || 0,
                
                // Trajectory
                onTrack: trajectory.data?.onTrack || false,
                momentum: trajectory.data?.momentum || 0,
                legacyImpact: trajectory.data?.legacyImpact || 0,
                
                // Mortality awareness
                mortalityReminder: timeline.data?.mortalityReminder || '',
                timeWellSpent: timeline.data?.timeWellSpent || 0
            };

            this.updateMetric('saturn', `${Math.round(this.planets.saturn.data.lifeProgress)}%`);
            
        } catch (error) {
            console.error('Saturn data load error:', error);
            this.showError('Failed to load legacy data');
        } finally {
            this.hideLoadingState('saturn');
        }
    }

    // ========================================
    // UNIFIED DATA LOADING
    // ========================================

    async loadAllPlanetData() {
        console.log('🌌 Loading all planetary systems...');
        
        try {
            await Promise.all([
                this.loadMercuryData(),
                this.loadVenusData(),
                this.loadEarthData(),
                this.loadMarsData(),
                this.loadJupiterData(),
                this.loadSaturnData()
            ]);
            
            console.log('✅ All planetary data loaded');
            this.calculateTrustScore();
            
        } catch (error) {
            console.error('Failed to load all planetary data:', error);
        }
    }

    // ========================================
    // CORRELATIONS
    // ========================================

    async loadCorrelations() {
        try {
            const patterns = await API.getAllPatterns();
            const sleepPerf = await API.getSleepPerformanceCorrelation();
            const stressSpend = await API.getStressSpendingCorrelation();
            const calendarEnergy = await API.getCalendarEnergyCorrelation();
            
            this.correlations = [
                ...patterns.data || [],
                sleepPerf.data,
                stressSpend.data,
                calendarEnergy.data
            ].filter(Boolean);
            
            this.drawAllCorrelationLines();
            
        } catch (error) {
            console.error('Failed to load correlations:', error);
        }
    }

    async getCalendarRecoveryCorrelation() {
        try {
            const corr = await API.getCalendarEnergyCorrelation();
            return corr.data?.correlation || 0;
        } catch {
            return 0;
        }
    }

    async getMeetingEnergyCorrelation() {
        try {
            const corr = await API.getCalendarEnergyCorrelation();
            return corr.data?.meetingEnergyImpact || 0;
        } catch {
            return 0;
        }
    }

    async getGoalHealthCorrelation() {
        try {
            const patterns = await API.getAllPatterns();
            const goalHealth = patterns.data?.find(p => p.type === 'goal-health');
            return goalHealth?.strength || 0;
        } catch {
            return 0;
        }
    }

    // ========================================
    // ORBITAL ANIMATION
    // ========================================

    animate() {
        Object.entries(this.planets).forEach(([name, planet]) => {
            planet.angle += planet.speed;
            if (planet.angle >= 360) planet.angle -= 360;
            
            this.updatePlanetPosition(name, planet);
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    updatePlanetPosition(planetName, planet) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (!planetEl) return;

        // Dynamic intensity based on data
        if (planet.data) {
            const intensity = this.calculatePlanetIntensity(planetName, planet.data);
            if (intensity > 0.7) {
                planetEl.style.filter = `brightness(${1 + intensity * 0.3}) drop-shadow(0 0 ${intensity * 20}px ${planet.color})`;
            }
        }
    }

    calculatePlanetIntensity(planetName, data) {
        switch(planetName) {
            case 'mercury':
                return data.recoveryScore < 50 ? 1.0 : data.recoveryScore / 100;
            case 'venus':
                return data.workoutsThisWeek > 0 ? 0.9 : 0.5;
            case 'earth':
                return data.eventsToday > 3 ? 0.9 : 0.6;
            case 'mars':
                return data.completionRate < 50 ? 0.8 : 0.6;
            case 'jupiter':
                return data.unusualSpending ? 0.9 : 0.6;
            case 'saturn':
                return data.onTrack ? 0.6 : 0.8;
            default:
                return 0.6;
        }
    }

    // ========================================
    // PLANET INTERACTIONS
    // ========================================

    setupPlanetInteractions() {
        Object.keys(this.planets).forEach(planetName => {
            const planetEl = document.getElementById(`planet-${planetName}`);
            if (!planetEl) return;

            planetEl.addEventListener('click', () => this.expandPlanet(planetName));
            
            planetEl.addEventListener('mouseenter', () => {
                if (this.selectedPlanet !== planetName) {
                    planetEl.style.filter = 'brightness(1.3)';
                    this.highlightPlanetCorrelations(planetName);
                    
                    // Voice announcement
                    if (window.voiceInterface) {
                        window.voiceInterface.announcePlanetOpen(planetName);
                    }
                }
            });

            planetEl.addEventListener('mouseleave', () => {
                if (this.selectedPlanet !== planetName) {
                    planetEl.style.filter = '';
                    if (!this.selectedPlanet) {
                        this.drawAllCorrelationLines();
                    }
                }
            });
        });
    }

    async expandPlanet(planetName) {
        if (this.activePlanet === planetName) return;
        
        console.log(`Expanding ${planetName}...`);
        this.showLoadingState(planetName);
        this.activePlanet = planetName;

        // Highlight planet
        document.querySelectorAll('.planet-gear').forEach(p => p.classList.remove('active'));
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) planetEl.classList.add('active');

        // Reload fresh data
        await this.reloadPlanetData(planetName);
        
        // Show dashboard with all features
        await this.loadDashboardContent(planetName);
        
        const overlay = document.getElementById('dashboard-overlay');
        if (overlay) overlay.style.display = 'flex';

        this.hideLoadingState(planetName);
    }

    async reloadPlanetData(planetName) {
        switch(planetName) {
            case 'mercury': return await this.loadMercuryData();
            case 'venus': return await this.loadVenusData();
            case 'earth': return await this.loadEarthData();
            case 'mars': return await this.loadMarsData();
            case 'jupiter': return await this.loadJupiterData();
            case 'saturn': return await this.loadSaturnData();
        }
    }

    async loadDashboardContent(planetName) {
        const titleEl = document.getElementById('dashboard-title');
        const subtitleEl = document.getElementById('dashboard-subtitle');
        const contentEl = document.getElementById('dashboard-content');

        const planet = this.planets[planetName];
        if (titleEl) titleEl.textContent = `${planet.icon} ${planet.title}`;
        if (subtitleEl) subtitleEl.textContent = planet.subtitle;

        if (contentEl) {
            contentEl.innerHTML = this.generateDashboardHTML(planetName);
        }
    }

    generateDashboardHTML(planetName) {
        const data = this.planets[planetName].data || {};
        
        switch (planetName) {
            case 'mercury': return this.generateMercuryDashboard(data);
            case 'venus': return this.generateVenusDashboard(data);
            case 'earth': return this.generateEarthDashboard(data);
            case 'mars': return this.generateMarsDashboard(data);
            case 'jupiter': return this.generateJupiterDashboard(data);
            case 'saturn': return this.generateSaturnDashboard(data);
            default: return '<p>Loading...</p>';
        }
    }

    generateMercuryDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px;">
                <div class="metric-card">
                    <h3>Heart Rate Variability</h3>
                    <div class="metric-value">${data.hrv} <span class="unit">ms</span></div>
                    <div class="metric-status ${this.getHRVStatus(data.hrv)}">${this.getHRVStatusText(data.hrv)}</div>
                </div>
                <div class="metric-card">
                    <h3>Resting Heart Rate</h3>
                    <div class="metric-value">${data.restingHeartRate} <span class="unit">bpm</span></div>
                    <div class="metric-status">Morning baseline</div>
                </div>
                <div class="metric-card">
                    <h3>Recovery Score</h3>
                    <div class="metric-value">${Math.round(data.recoveryScore)}<span class="unit">%</span></div>
                    <div class="metric-status ${this.getRecoveryStatusClass(data.recoveryScore)}">${data.recoveryStatus}</div>
                </div>
                <div class="metric-card">
                    <h3>Sleep Quality</h3>
                    <div class="metric-value">${data.sleepDuration}<span class="unit">hrs</span></div>
                    <div class="metric-status">${data.sleepScore}% score</div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 20px;">Health Insights</h3>
            <div class="insights-grid">
                ${data.illnessRisk > 0.7 ? `
                    <div class="insight-card warning">
                        <span class="insight-icon">⚠️</span>
                        <div>
                            <div class="insight-title">Illness Risk Elevated</div>
                            <div class="insight-text">Your immune markers suggest ${Math.round(data.illnessRisk * 100)}% illness risk. Prioritize recovery.</div>
                        </div>
                    </div>
                ` : ''}
                
                ${data.burnoutRisk > 0.6 ? `
                    <div class="insight-card warning">
                        <span class="insight-icon">🔥</span>
                        <div>
                            <div class="insight-title">Burnout Warning</div>
                            <div class="insight-text">Pattern suggests ${Math.round(data.burnoutRisk * 100)}% burnout risk. Consider reducing training volume.</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="insight-card">
                    <span class="insight-icon">💪</span>
                    <div>
                        <div class="insight-title">Body Composition</div>
                        <div class="insight-text">${data.bodyFat}% body fat, ${data.muscleMass}kg muscle mass</div>
                    </div>
                </div>
                
                <div class="insight-card">
                    <span class="insight-icon">⚡</span>
                    <div>
                        <div class="insight-title">Metabolic Rate</div>
                        <div class="insight-text">BMR: ${data.bmr} kcal | TDEE: ${data.tdee} kcal</div>
                    </div>
                </div>
            </div>
            
            <h3 style="margin: 30px 0 15px 0;">Quick Actions</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="action-btn" onclick="window.planetSystem.syncWearables()">🔄 Sync Wearables</button>
                <button class="action-btn" onclick="window.planetSystem.improveHRV()">💚 Improve HRV</button>
                <button class="action-btn" onclick="window.planetSystem.optimizeSleep()">😴 Optimize Sleep</button>
                <button class="action-btn" onclick="window.planetSystem.recoveryPlan()">🛁 Recovery Plan</button>
            </div>
        `;
    }

    generateVenusDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div class="metric-card">
                    <h3>Workouts This Week</h3>
                    <div class="metric-value">${data.workoutsThisWeek}</div>
                </div>
                <div class="metric-card">
                    <h3>Training Volume</h3>
                    <div class="metric-value">${data.totalMinutes} <span class="unit">min</span></div>
                </div>
                <div class="metric-card">
                    <h3>Performance</h3>
                    <div class="metric-value">${Math.round(data.performanceScore)}<span class="unit">%</span></div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px;">Nutrition Today</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
                <div class="macro-card">
                    <div class="macro-label">Calories</div>
                    <div class="macro-value">${data.calories}</div>
                    <div class="macro-bar">
                        <div class="macro-fill" style="width: ${Math.min((data.calories / 2500) * 100, 100)}%"></div>
                    </div>
                </div>
                <div class="macro-card">
                    <div class="macro-label">Protein</div>
                    <div class="macro-value">${data.protein}g</div>
                    <div class="macro-bar">
                        <div class="macro-fill" style="width: ${Math.min((data.protein / data.proteinTarget) * 100, 100)}%"></div>
                    </div>
                </div>
                <div class="macro-card">
                    <div class="macro-label">Carbs</div>
                    <div class="macro-value">${data.carbs}g</div>
                    <div class="macro-bar">
                        <div class="macro-fill" style="width: ${Math.min((data.carbs / data.carbsTarget) * 100, 100)}%"></div>
                    </div>
                </div>
                <div class="macro-card">
                    <div class="macro-label">Fats</div>
                    <div class="macro-value">${data.fats}g</div>
                    <div class="macro-bar">
                        <div class="macro-fill" style="width: ${Math.min((data.fats / data.fatsTarget) * 100, 100)}%"></div>
                    </div>
                </div>
            </div>
            
            ${data.plateauDetected ? `
                <div class="insight-card warning" style="margin-bottom: 20px;">
                    <span class="insight-icon">📊</span>
                    <div>
                        <div class="insight-title">Plateau Detected</div>
                        <div class="insight-text">Performance plateau detected. Try quantum workout generation for breakthrough results.</div>
                    </div>
                </div>
            ` : ''}
            
            <h3 style="margin-bottom: 15px;">Training Templates</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="action-btn" onclick="window.planetSystem.generateQuantumWorkout()">🌌 Quantum Workout</button>
                <button class="action-btn" onclick="window.planetSystem.logWorkout()">💪 Log Workout</button>
                <button class="action-btn" onclick="window.planetSystem.logMeal()">🍽️ Log Meal</button>
                <button class="action-btn" onclick="window.planetSystem.analyzeMealPhoto()">📸 Scan Meal</button>
            </div>
        `;
    }

    generateEarthDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div class="metric-card">
                    <h3>Events Today</h3>
                    <div class="metric-value">${data.eventsToday}</div>
                </div>
                <div class="metric-card">
                    <h3>Meeting Load</h3>
                    <div class="metric-value">${Math.round(data.meetingLoad)}<span class="unit">%</span></div>
                </div>
                <div class="metric-card">
                    <h3>Focus Time</h3>
                    <div class="metric-value">${data.focusTime} <span class="unit">hrs</span></div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px;">Upcoming Events</h3>
            <div class="events-list">
                ${data.nextEvent ? `
                    <div class="event-card">
                        <div class="event-time">${this.formatEventTime(data.nextEvent.start)}</div>
                        <div class="event-title">${data.nextEvent.title}</div>
                        <div class="event-type">${data.nextEvent.type || 'Meeting'}</div>
                    </div>
                ` : '<p>No upcoming events today</p>'}
            </div>
            
            <h3 style="margin: 30px 0 15px 0;">Schedule Optimization</h3>
            ${data.rescheduleRecommendations.length > 0 ? `
                <div class="insight-card">
                    <span class="insight-icon">💡</span>
                    <div>
                        <div class="insight-title">Optimization Opportunity</div>
                        <div class="insight-text">${data.rescheduleRecommendations.length} events could be rescheduled for better energy alignment</div>
                    </div>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 20px;">
                <button class="action-btn" onclick="window.planetSystem.syncCalendar()">🔄 Sync Calendar</button>
                <button class="action-btn" onclick="window.planetSystem.optimizeSchedule()">⚡ Optimize</button>
                <button class="action-btn" onclick="window.planetSystem.blockTime()">🛡️ Block Time</button>
            </div>
        `;
    }

    generateMarsDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px;">
                <div class="metric-card">
                    <h3>Active Goals</h3>
                    <div class="metric-value">${data.activeGoals}</div>
                    <div class="metric-status">${data.completedGoals} completed</div>
                </div>
                <div class="metric-card">
                    <h3>Completion Rate</h3>
                    <div class="metric-value">${Math.round(data.completionRate)}<span class="unit">%</span></div>
                    <div class="metric-status">${data.onTrackGoals} on track</div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px;">Goal Insights</h3>
            ${data.motivationalInsight ? `
                <div class="insight-card success" style="margin-bottom: 20px;">
                    <span class="insight-icon">🎯</span>
                    <div>
                        <div class="insight-title">Keep Going!</div>
                        <div class="insight-text">${data.motivationalInsight}</div>
                    </div>
                </div>
            ` : ''}
            
            ${data.atRiskGoals > 0 ? `
                <div class="insight-card warning" style="margin-bottom: 20px;">
                    <span class="insight-icon">⚠️</span>
                    <div>
                        <div class="insight-title">Goals At Risk</div>
                        <div class="insight-text">${data.atRiskGoals} goal${data.atRiskGoals === 1 ? '' : 's'} falling behind. Intervention recommended.</div>
                    </div>
                </div>
            ` : ''}
            
            <h3 style="margin: 30px 0 15px 0;">Habit Streaks</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-label">Current Streak</div>
                    <div class="stat-value">${data.currentStreak} days</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Longest Streak</div>
                    <div class="stat-value">${data.longestStreak} days</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="action-btn" onclick="window.planetSystem.createGoal()">➕ New Goal</button>
                <button class="action-btn" onclick="window.planetSystem.checkHabit()">✓ Check Habit</button>
                <button class="action-btn" onclick="window.planetSystem.viewProgress()">📊 View Progress</button>
            </div>
        `;
    }

    generateJupiterDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px;">
                <div class="metric-card">
                    <h3>Net Worth</h3>
                    <div class="metric-value">$${this.formatCurrency(data.netWorth)}</div>
                </div>
                <div class="metric-card">
                    <h3>Budget Remaining</h3>
                    <div class="metric-value">$${this.formatCurrency(data.budgetRemaining)}</div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px;">This Month</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-label">Income</div>
                    <div class="stat-value positive">+$${this.formatCurrency(data.monthlyIncome)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Expenses</div>
                    <div class="stat-value negative">-$${this.formatCurrency(data.monthlyExpenses)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Savings Rate</div>
                    <div class="stat-value">${Math.round(data.savingsRate)}%</div>
                </div>
            </div>
            
            ${data.stressCorrelation > 0.6 ? `
                <div class="insight-card warning" style="margin-bottom: 20px;">
                    <span class="insight-icon">💸</span>
                    <div>
                        <div class="insight-title">Stress-Spending Correlation Detected</div>
                        <div class="insight-text">Your spending increases ${Math.round(data.stressCorrelation * 100)}% when HRV drops. Consider spending alerts.</div>
                    </div>
                </div>
            ` : ''}
            
            <h3 style="margin: 30px 0 15px 0;">Recent Transactions</h3>
            <div class="transactions-list">
                ${data.recentTransactions.slice(0, 5).map(t => `
                    <div class="transaction-item">
                        <span class="transaction-name">${t.name || 'Transaction'}</span>
                        <span class="transaction-amount ${t.amount < 0 ? 'negative' : 'positive'}">
                            ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}
                        </span>
                    </div>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 20px;">
                <button class="action-btn" onclick="window.planetSystem.connectBank()">🏦 Connect Bank</button>
                <button class="action-btn" onclick="window.planetSystem.setBudget()">💰 Set Budget</button>
                <button class="action-btn" onclick="window.planetSystem.viewInsights()">📊 View Insights</button>
            </div>
        `;
    }

    generateSaturnDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-bottom: 30px;">
                <div class="metric-card">
                    <h3>Life Progress</h3>
                    <div class="metric-value">${Math.round(data.lifeProgress)}<span class="unit">%</span></div>
                    <div class="metric-status">${data.daysRemaining.toLocaleString()} days remaining</div>
                </div>
                <div class="metric-card">
                    <h3>Time Well Spent</h3>
                    <div class="metric-value">${Math.round(data.timeWellSpent)}<span class="unit">%</span></div>
                    <div class="metric-status">${data.onTrack ? 'On track' : 'Needs attention'}</div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px;">Life Wheel Balance</h3>
            <div class="life-wheel">
                <div class="wheel-segment">
                    <div class="wheel-label">Health</div>
                    <div class="wheel-bar">
                        <div class="wheel-fill" style="width: ${data.healthScore}%"></div>
                    </div>
                    <div class="wheel-value">${Math.round(data.healthScore)}%</div>
                </div>
                <div class="wheel-segment">
                    <div class="wheel-label">Wealth</div>
                    <div class="wheel-bar">
                        <div class="wheel-fill" style="width: ${data.wealthScore}%"></div>
                    </div>
                    <div class="wheel-value">${Math.round(data.wealthScore)}%</div>
                </div>
                <div class="wheel-segment">
                    <div class="wheel-label">Relationships</div>
                    <div class="wheel-bar">
                        <div class="wheel-fill" style="width: ${data.relationshipsScore}%"></div>
                    </div>
                    <div class="wheel-value">${Math.round(data.relationshipsScore)}%</div>
                </div>
                <div class="wheel-segment">
                    <div class="wheel-label">Purpose</div>
                    <div class="wheel-bar">
                        <div class="wheel-fill" style="width: ${data.purposeScore}%"></div>
                    </div>
                    <div class="wheel-value">${Math.round(data.purposeScore)}%</div>
                </div>
                <div class="wheel-segment">
                    <div class="wheel-label">Growth</div>
                    <div class="wheel-bar">
                        <div class="wheel-fill" style="width: ${data.growthScore}%"></div>
                    </div>
                    <div class="wheel-value">${Math.round(data.growthScore)}%</div>
                </div>
            </div>
            
            <h3 style="margin: 30px 0 15px 0;">Quarterly Review</h3>
            ${data.reviewScore > 0 ? `
                <div class="stat-card" style="margin-bottom: 20px;">
                    <div class="stat-label">Last Review Score</div>
                    <div class="stat-value">${Math.round(data.reviewScore)}/100</div>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="action-btn" onclick="window.planetSystem.updateVision()">🎯 Update Vision</button>
                <button class="action-btn" onclick="window.planetSystem.quarterlyReview()">📋 Quarterly Review</button>
                <button class="action-btn" onclick="window.planetSystem.viewTimeline()">⏳ View Timeline</button>
            </div>
        `;
    }

    // ========================================
    // CORRELATION LINES
    // ========================================

    drawAllCorrelationLines() {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;
        
        svg.innerHTML = '';
        this.correlations.forEach(corr => {
            this.drawCorrelationLine(corr.from, corr.to, corr.strength);
        });
    }

    highlightPlanetCorrelations(planetName) {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;
        
        svg.innerHTML = '';
        this.correlations
            .filter(c => c.from === planetName || c.to === planetName)
            .forEach(c => this.drawCorrelationLine(c.from, c.to, c.strength));
    }

    drawCorrelationLine(planet1Name, planet2Name, strength = 0.5) {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;

        const el1 = document.getElementById(`planet-${planet1Name}`);
        const el2 = document.getElementById(`planet-${planet2Name}`);
        if (!el1 || !el2) return;

        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 - svgRect.left;
        const y1 = rect1.top + rect1.height / 2 - svgRect.top;
        const x2 = rect2.left + rect2.width / 2 - svgRect.left;
        const y2 = rect2.top + rect2.height / 2 - svgRect.top;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', `rgba(0, 255, 255, ${strength * 0.6})`);
        line.setAttribute('stroke-width', Math.max(1, strength * 3));
        line.classList.add('correlation-line');

        svg.appendChild(line);
    }

    // ========================================
    // REAL-TIME UPDATES
    // ========================================

    startRealTimeUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.refreshLiveMetrics();
        }, 30000);
    }

    async refreshLiveMetrics() {
        try {
            // Quick refresh of critical metrics without full reload
            const wearable = await API.getLatestWearableData();
            if (wearable.data && this.planets.mercury.data) {
                this.planets.mercury.data.hrv = wearable.data.hrv || this.planets.mercury.data.hrv;
                this.planets.mercury.data.restingHeartRate = wearable.data.heartRate || this.planets.mercury.data.restingHeartRate;
                this.updateMetric('mercury', `${Math.round(this.planets.mercury.data.recoveryScore)}%`);
            }
        } catch (error) {
            console.error('Real-time update failed:', error);
        }
    }

    startDataRefresh() {
        // Full data refresh every 5 minutes
        this.dataRefreshInterval = setInterval(async () => {
            console.log('🔄 Refreshing all planetary data...');
            await this.loadAllPlanetData();
            await this.loadCorrelations();
        }, 300000);
    }

    // ========================================
    // UI HELPERS
    // ========================================

    showLoadingState(planetName) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) {
            planetEl.classList.add('loading');
            this.planets[planetName].loading = true;
        }
    }

    hideLoadingState(planetName) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) {
            planetEl.classList.remove('loading');
            this.planets[planetName].loading = false;
        }
    }

    updateMetric(planetName, value) {
        const metricEl = document.getElementById(`${planetName}-metric`);
        if (metricEl) {
            metricEl.textContent = value;
            metricEl.style.animation = 'none';
            setTimeout(() => {
                metricEl.style.animation = 'metricPulse 0.5s ease-out';
            }, 10);
        }
    }

    showError(message) {
        console.error(message);
        // Could integrate with notification system
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    calculateTotalMinutes(workouts) {
        if (!workouts || !Array.isArray(workouts)) return 0;
        return workouts.reduce((total, w) => total + (w.duration || 0), 0);
    }

    calculateTrustScore() {
        const dataPoints = Object.values(this.planets).filter(p => p.data && Object.keys(p.data).length > 0).length;
        const trustScore = Math.min(100, Math.round((dataPoints / 6) * 100));
        
        console.log(`🔥 Trust Score: ${trustScore}%`);
        
        if (window.reactorCore) {
            window.reactorCore.setTrustScore(trustScore);
        }
    }

    getRecoveryStatus(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Low';
    }

    getRecoveryStatusClass(score) {
        if (score >= 80) return 'status-excellent';
        if (score >= 60) return 'status-good';
        if (score >= 40) return 'status-fair';
        return 'status-low';
    }

    getHRVStatus(hrv) {
        if (hrv >= 60) return 'status-excellent';
        if (hrv >= 40) return 'status-good';
        if (hrv >= 25) return 'status-fair';
        return 'status-low';
    }

    getHRVStatusText(hrv) {
        if (hrv >= 60) return 'Excellent parasympathetic tone';
        if (hrv >= 40) return 'Good recovery capacity';
        if (hrv >= 25) return 'Moderate stress detected';
        return 'High stress - recovery needed';
    }

    getLargestExpense(transactions) {
        if (!transactions || !Array.isArray(transactions)) return null;
        return transactions.reduce((max, t) => t.amount > max.amount ? t : max, transactions[0]);
    }

    formatCurrency(amount) {
        return Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
    }

    formatEventTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    isToday(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    assessDataQuality(sources) {
        const validSources = sources.filter(s => s.data && Object.keys(s.data).length > 0);
        return Math.round((validSources.length / sources.length) * 100);
    }

    async getMotivationalInsight(goals) {
        // Simple motivational message based on goal progress
        const avgProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
        
        if (avgProgress > 80) return "Outstanding progress! You're crushing your goals!";
        if (avgProgress > 60) return "Great momentum! Keep pushing forward!";
        if (avgProgress > 40) return "Solid progress. Stay consistent and you'll get there!";
        return "Every journey starts with a single step. You've got this!";
    }

    checkGoalIntervention(goals) {
        return goals.some(g => g.atRisk || g.daysOverdue > 7);
    }

    // ========================================
    // ACTION HANDLERS (Called from dashboard buttons)
    // ========================================

    async syncWearables() {
        try {
            await API.syncWearables();
            await this.loadMercuryData();
            this.showSuccess('Wearables synced successfully');
        } catch (error) {
            this.showError('Failed to sync wearables');
        }
    }

    async improveHRV() {
        console.log('Opening HRV improvement protocol...');
        // Could open specific workout or recovery plan
    }

    async optimizeSleep() {
        console.log('Opening sleep optimization...');
        // Could show sleep recommendations
    }

    async recoveryPlan() {
        try {
            const plan = await API.getRecoveryRecommendations();
            console.log('Recovery plan:', plan);
        } catch (error) {
            this.showError('Failed to load recovery plan');
        }
    }

    async generateQuantumWorkout() {
        try {
            const workout = await API.generateAIWorkout('quantum');
            console.log('Quantum workout generated:', workout);
        } catch (error) {
            this.showError('Failed to generate quantum workout');
        }
    }

    async logWorkout() {
        console.log('Opening workout logger...');
    }

    async logMeal() {
        console.log('Opening meal logger...');
    }

    async analyzeMealPhoto() {
        console.log('Opening photo meal analyzer...');
    }

    async syncCalendar() {
        console.log('Syncing calendar...');
    }

    async optimizeSchedule() {
        try {
            const result = await API.optimizeSchedule();
            console.log('Schedule optimized:', result);
        } catch (error) {
            this.showError('Failed to optimize schedule');
        }
    }

    async blockTime() {
        console.log('Opening time blocking interface...');
    }

    async createGoal() {
        console.log('Opening goal creator...');
    }

    async checkHabit() {
        console.log('Checking habit...');
    }

    async viewProgress() {
        console.log('Opening progress viewer...');
    }

    async connectBank() {
        console.log('Initiating Plaid connection...');
    }

    async setBudget() {
        console.log('Opening budget setter...');
    }

    async viewInsights() {
        console.log('Opening financial insights...');
    }

    async updateVision() {
        console.log('Opening vision planner...');
    }

    async quarterlyReview() {
        console.log('Opening quarterly review...');
    }

    async viewTimeline() {
        console.log('Opening life timeline...');
    }

    showSuccess(message) {
        console.log('✅', message);
        // Could integrate with notification system
    }

    // ========================================
    // CLEANUP
    // ========================================

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.dataRefreshInterval) {
            clearInterval(this.dataRefreshInterval);
        }
        
        this.realTimeConnections.clear();
        this.selectedPlanet = null;
    }
}

// Initialize
const planetSystem = new PlanetSystem();
window.planetSystem = planetSystem;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => planetSystem.init());
} else {
    planetSystem.init();
}

export default planetSystem;
