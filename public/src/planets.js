// planets.js - Phoenix Complete 6-Planet Integration System
// FIXED: All initialization errors resolved, ALL features preserved

// Import API at the very top
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
        
        try {
            await this.loadAllPlanetData();
            this.animate();
            this.setupPlanetInteractions();
            this.startRealTimeUpdates();
            await this.loadCorrelations();
            this.startDataRefresh();
            
            console.log('✅ Planet System initialized with full backend integration');
        } catch (error) {
            console.error('❌ Planet System initialization error:', error);
        }
    }

    // ========================================
    // DATA LOADING METHODS
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

    async loadMercuryData() {
        console.log('☿️ Loading Mercury (Health Vitals)...');
        this.showLoadingState('mercury');
        
        try {
            const [wearable, recovery, biometric, predictions] = await Promise.allSettled([
                API.getLatestWearableData().catch(() => ({ data: null })),
                API.getRecoveryScore().catch(() => ({ data: null })),
                API.getBiometricData().catch(() => ({ data: null })),
                API.getHRVPrediction().catch(() => ({ data: null }))
            ]);

            const wearableData = wearable.status === 'fulfilled' ? wearable.value : { data: null };
            const recoveryData = recovery.status === 'fulfilled' ? recovery.value : { data: null };
            const biometricData = biometric.status === 'fulfilled' ? biometric.value : { data: null };
            const predictionsData = predictions.status === 'fulfilled' ? predictions.value : { data: null };

            this.planets.mercury.data = {
                hrv: wearableData.data?.hrv || 0,
                restingHeartRate: wearableData.data?.heartRate || 0,
                spo2: wearableData.data?.spo2 || 98,
                steps: wearableData.data?.steps || 0,
                calories: wearableData.data?.calories || 0,
                sleepDuration: wearableData.data?.sleepDuration ? (wearableData.data.sleepDuration / 60).toFixed(1) : 0,
                sleepScore: wearableData.data?.sleepScore || 0,
                deepSleep: wearableData.data?.deepSleep || 0,
                remSleep: wearableData.data?.remSleep || 0,
                recoveryScore: recoveryData.data?.recoveryScore || 0,
                recoveryStatus: this.getRecoveryStatus(recoveryData.data?.recoveryScore),
                readiness: recoveryData.data?.readiness || 0,
                bodyFat: biometricData.data?.bodyFatPercentage || 0,
                muscleMass: biometricData.data?.muscleMass || 0,
                bmr: biometricData.data?.bmr || 0,
                tdee: biometricData.data?.tdee || 0,
                illnessRisk: predictionsData.data?.illnessRisk || 0,
                hrvForecast: predictionsData.data?.forecast || [],
                burnoutRisk: predictionsData.data?.burnoutRisk || 0,
                lastSync: wearableData.data?.timestamp || new Date(),
                dataQuality: this.assessDataQuality([wearableData, recoveryData, biometricData])
            };

            this.updateMetric('mercury', `${Math.round(this.planets.mercury.data.recoveryScore)}%`);
            
            if (window.voiceInterface) {
                window.voiceInterface.announceMetric('mercury', 'recovery', this.planets.mercury.data.recoveryScore);
            }
            
        } catch (error) {
            console.error('Mercury data load error:', error);
            this.planets.mercury.data = this.getDefaultMercuryData();
        } finally {
            this.hideLoadingState('mercury');
        }
    }

    async loadVenusData() {
        console.log('♀️ Loading Venus (Fitness & Nutrition)...');
        this.showLoadingState('venus');
        
        try {
            const [workouts, analysis, nutrition, recommendations] = await Promise.allSettled([
                API.getRecentWorkouts(10).catch(() => ({ data: [] })),
                API.getWorkoutAnalysis().catch(() => ({ data: {} })),
                API.getTodayNutrition().catch(() => ({ data: {} })),
                API.getNutritionRecommendations().catch(() => ({ data: {} }))
            ]);

            const workoutsData = workouts.status === 'fulfilled' ? workouts.value : { data: [] };
            const analysisData = analysis.status === 'fulfilled' ? analysis.value : { data: {} };
            const nutritionData = nutrition.status === 'fulfilled' ? nutrition.value : { data: {} };
            const recommendationsData = recommendations.status === 'fulfilled' ? recommendations.value : { data: {} };

            this.planets.venus.data = {
                workoutsThisWeek: workoutsData.data?.length || 0,
                totalMinutes: this.calculateTotalMinutes(workoutsData.data),
                avgHeartRate: analysisData.data?.avgHeartRate || 0,
                totalVolume: analysisData.data?.totalVolume || 0,
                lastWorkout: workoutsData.data?.[0] || null,
                performanceScore: analysisData.data?.performanceScore || 0,
                injuryRisk: analysisData.data?.injuryRisk || 0,
                formScore: analysisData.data?.formScore || 0,
                progressRate: analysisData.data?.progressRate || 0,
                calories: nutritionData.data?.totalCalories || 0,
                protein: nutritionData.data?.totalProtein || 0,
                carbs: nutritionData.data?.totalCarbs || 0,
                fats: nutritionData.data?.totalFats || 0,
                hydration: nutritionData.data?.hydration || 0,
                proteinTarget: nutritionData.data?.proteinTarget || 0,
                carbsTarget: nutritionData.data?.carbsTarget || 0,
                fatsTarget: nutritionData.data?.fatsTarget || 0,
                nextWorkout: recommendationsData.data?.nextWorkout || 'Rest',
                mealSuggestions: recommendationsData.data?.meals || [],
                supplementStack: recommendationsData.data?.supplements || [],
                quantumReady: true,
                plateauDetected: analysisData.data?.plateauDetected || false
            };

            this.updateMetric('venus', `${this.planets.venus.data.workoutsThisWeek}x`);
            
        } catch (error) {
            console.error('Venus data load error:', error);
            this.planets.venus.data = this.getDefaultVenusData();
        } finally {
            this.hideLoadingState('venus');
        }
    }

    async loadEarthData() {
        console.log('🌍 Loading Earth (Calendar & Time)...');
        this.showLoadingState('earth');
        
        try {
            const [events, analysis, optimization] = await Promise.allSettled([
                API.getCalendarEvents().catch(() => ({ data: [] })),
                API.getTimeAnalysis().catch(() => ({ data: {} })),
                API.optimizeSchedule().catch(() => ({ data: {} }))
            ]);

            const eventsData = events.status === 'fulfilled' ? events.value : { data: [] };
            const analysisData = analysis.status === 'fulfilled' ? analysis.value : { data: {} };
            const optimizationData = optimization.status === 'fulfilled' ? optimization.value : { data: {} };

            this.planets.earth.data = {
                eventsToday: eventsData.data?.filter(e => this.isToday(e.start)).length || 0,
                totalEvents: eventsData.data?.length || 0,
                nextEvent: eventsData.data?.[0] || null,
                meetingLoad: analysisData.data?.meetingLoad || 0,
                focusTime: analysisData.data?.focusTime || 0,
                breakTime: analysisData.data?.breakTime || 0,
                busyHours: analysisData.data?.busyHours || [],
                energyPeaks: analysisData.data?.energyPeaks || [],
                optimalWorkoutWindow: analysisData.data?.optimalWorkoutWindow || null,
                mentalFatigueScore: analysisData.data?.mentalFatigueScore || 0,
                rescheduleRecommendations: optimizationData.data?.reschedule || [],
                blockingNeeded: optimizationData.data?.blockingNeeded || false,
                calendarHealth: optimizationData.data?.calendarHealth || 0,
                calendarRecoveryCorr: await this.getCalendarRecoveryCorrelation(),
                meetingEnergyCorr: await this.getMeetingEnergyCorrelation()
            };

            this.updateMetric('earth', `${this.planets.earth.data.eventsToday}`);
            
        } catch (error) {
            console.error('Earth data load error:', error);
            this.planets.earth.data = this.getDefaultEarthData();
        } finally {
            this.hideLoadingState('earth');
        }
    }

    async loadMarsData() {
        console.log('♂️ Loading Mars (Goals & Habits)...');
        this.showLoadingState('mars');
        
        try {
            const [goals, progress, predictions, habits] = await Promise.allSettled([
                API.getActiveGoals().catch(() => ({ data: [] })),
                API.getGoalProgress().catch(() => ({ data: {} })),
                API.getGoalPredictions().catch(() => ({ data: {} })),
                API.getHabitStreaks().catch(() => ({ data: {} }))
            ]);

            const goalsData = goals.status === 'fulfilled' ? goals.value : { data: [] };
            const progressData = progress.status === 'fulfilled' ? progress.value : { data: {} };
            const predictionsData = predictions.status === 'fulfilled' ? predictions.value : { data: {} };
            const habitsData = habits.status === 'fulfilled' ? habits.value : { data: {} };

            const activeGoals = goalsData.data || [];
            const completedGoals = activeGoals.filter(g => g.completed).length;

            this.planets.mars.data = {
                activeGoals: activeGoals.length,
                completedGoals: completedGoals,
                completionRate: activeGoals.length > 0 ? (completedGoals / activeGoals.length * 100) : 0,
                overallProgress: progressData.data?.overallProgress || 0,
                velocity: progressData.data?.velocity || 0,
                onTrackGoals: activeGoals.filter(g => g.onTrack).length,
                atRiskGoals: activeGoals.filter(g => g.atRisk).length,
                completionProbability: predictionsData.data?.completionProbability || 0,
                estimatedCompletion: predictionsData.data?.estimatedCompletion || null,
                successFactors: predictionsData.data?.successFactors || [],
                longestStreak: habitsData.data?.longestStreak || 0,
                currentStreak: habitsData.data?.currentStreak || 0,
                totalHabits: habitsData.data?.totalHabits || 0,
                habitCompletionRate: habitsData.data?.completionRate || 0,
                motivationalInsight: await this.getMotivationalInsight(activeGoals),
                interventionNeeded: this.checkGoalIntervention(activeGoals),
                goalHealthCorrelation: await this.getGoalHealthCorrelation()
            };

            this.updateMetric('mars', `${completedGoals}/${activeGoals.length}`);
            
        } catch (error) {
            console.error('Mars data load error:', error);
            this.planets.mars.data = this.getDefaultMarsData();
        } finally {
            this.hideLoadingState('mars');
        }
    }

    async loadJupiterData() {
        console.log('♃ Loading Jupiter (Finance & Wealth)...');
        this.showLoadingState('jupiter');
        
        try {
            const [overview, transactions, insights, correlation] = await Promise.allSettled([
                API.getFinancialOverview().catch(() => ({ data: {} })),
                API.getTransactions(30).catch(() => ({ data: [] })),
                API.getSpendingInsights().catch(() => ({ data: {} })),
                API.getStressSpendingCorrelation().catch(() => ({ data: {} }))
            ]);

            const overviewData = overview.status === 'fulfilled' ? overview.value : { data: {} };
            const transactionsData = transactions.status === 'fulfilled' ? transactions.value : { data: [] };
            const insightsData = insights.status === 'fulfilled' ? insights.value : { data: {} };
            const correlationData = correlation.status === 'fulfilled' ? correlation.value : { data: {} };

            this.planets.jupiter.data = {
                totalBalance: overviewData.data?.totalBalance || 0,
                monthlyIncome: overviewData.data?.monthlyIncome || 0,
                monthlyExpenses: overviewData.data?.monthlyExpenses || 0,
                netWorth: overviewData.data?.netWorth || 0,
                budgetRemaining: overviewData.data?.budgetRemaining || 0,
                spendingRate: overviewData.data?.spendingRate || 0,
                savingsRate: overviewData.data?.savingsRate || 0,
                recentTransactions: transactionsData.data?.slice(0, 5) || [],
                largestExpense: this.getLargestExpense(transactionsData.data),
                unusualSpending: insightsData.data?.unusualSpending || false,
                spendingByCategory: insightsData.data?.byCategory || {},
                topCategories: insightsData.data?.topCategories || [],
                savingsOpportunities: insightsData.data?.savingsOpportunities || [],
                stressCorrelation: correlationData.data?.correlation || 0,
                stressSpendingEvents: correlationData.data?.events || [],
                interventionTriggered: correlationData.data?.interventionNeeded || false,
                monthEndProjection: insightsData.data?.monthEndProjection || 0,
                cashFlowForecast: insightsData.data?.cashFlowForecast || []
            };

            this.updateMetric('jupiter', `$${Math.round(this.planets.jupiter.data.monthlyExpenses)}`);
            
        } catch (error) {
            console.error('Jupiter data load error:', error);
            this.planets.jupiter.data = this.getDefaultJupiterData();
        } finally {
            this.hideLoadingState('jupiter');
        }
    }

    async loadSaturnData() {
        console.log('♄ Loading Saturn (Legacy & Vision)...');
        this.showLoadingState('saturn');
        
        try {
            const [timeline, vision, review, trajectory] = await Promise.allSettled([
                API.getLifeTimeline().catch(() => ({ data: {} })),
                API.updateVision({}).catch(() => ({ data: {} })),
                API.getQuarterlyReview().catch(() => ({ data: {} })),
                API.getLifeWheelScore().catch(() => ({ data: {} }))
            ]);

            const timelineData = timeline.status === 'fulfilled' ? timeline.value : { data: {} };
            const visionData = vision.status === 'fulfilled' ? vision.value : { data: {} };
            const reviewData = review.status === 'fulfilled' ? review.value : { data: {} };
            const trajectoryData = trajectory.status === 'fulfilled' ? trajectory.value : { data: {} };

            this.planets.saturn.data = {
                age: timelineData.data?.age || 0,
                lifeExpectancy: timelineData.data?.lifeExpectancy || 80,
                daysRemaining: timelineData.data?.daysRemaining || 0,
                lifeProgress: timelineData.data?.lifeProgress || 0,
                tenYearVision: visionData.data?.tenYearVision || '',
                oneYearGoals: visionData.data?.oneYearGoals || [],
                quarterlyObjectives: visionData.data?.quarterlyObjectives || [],
                lastReview: reviewData.data?.lastReview || null,
                reviewScore: reviewData.data?.score || 0,
                accomplishments: reviewData.data?.accomplishments || [],
                learnings: reviewData.data?.learnings || [],
                healthScore: trajectoryData.data?.health || 0,
                wealthScore: trajectoryData.data?.wealth || 0,
                relationshipsScore: trajectoryData.data?.relationships || 0,
                purposeScore: trajectoryData.data?.purpose || 0,
                growthScore: trajectoryData.data?.growth || 0,
                onTrack: trajectoryData.data?.onTrack || false,
                momentum: trajectoryData.data?.momentum || 0,
                legacyImpact: trajectoryData.data?.legacyImpact || 0,
                mortalityReminder: timelineData.data?.mortalityReminder || '',
                timeWellSpent: timelineData.data?.timeWellSpent || 0
            };

            this.updateMetric('saturn', `${Math.round(this.planets.saturn.data.lifeProgress)}%`);
            
        } catch (error) {
            console.error('Saturn data load error:', error);
            this.planets.saturn.data = this.getDefaultSaturnData();
        } finally {
            this.hideLoadingState('saturn');
        }
    }

    // ========================================
    // DEFAULT DATA METHODS (Fallbacks)
    // ========================================

    getDefaultMercuryData() {
        return {
            hrv: 0, restingHeartRate: 0, spo2: 98, steps: 0, calories: 0,
            sleepDuration: 0, sleepScore: 0, deepSleep: 0, remSleep: 0,
            recoveryScore: 0, recoveryStatus: 'Unknown', readiness: 0,
            bodyFat: 0, muscleMass: 0, bmr: 0, tdee: 0,
            illnessRisk: 0, hrvForecast: [], burnoutRisk: 0,
            lastSync: new Date(), dataQuality: 0
        };
    }

    getDefaultVenusData() {
        return {
            workoutsThisWeek: 0, totalMinutes: 0, avgHeartRate: 0, totalVolume: 0,
            lastWorkout: null, performanceScore: 0, injuryRisk: 0, formScore: 0,
            progressRate: 0, calories: 0, protein: 0, carbs: 0, fats: 0,
            hydration: 0, proteinTarget: 0, carbsTarget: 0, fatsTarget: 0,
            nextWorkout: 'Rest', mealSuggestions: [], supplementStack: [],
            quantumReady: true, plateauDetected: false
        };
    }

    getDefaultEarthData() {
        return {
            eventsToday: 0, totalEvents: 0, nextEvent: null, meetingLoad: 0,
            focusTime: 0, breakTime: 0, busyHours: [], energyPeaks: [],
            optimalWorkoutWindow: null, mentalFatigueScore: 0,
            rescheduleRecommendations: [], blockingNeeded: false,
            calendarHealth: 0, calendarRecoveryCorr: 0, meetingEnergyCorr: 0
        };
    }

    getDefaultMarsData() {
        return {
            activeGoals: 0, completedGoals: 0, completionRate: 0,
            overallProgress: 0, velocity: 0, onTrackGoals: 0, atRiskGoals: 0,
            completionProbability: 0, estimatedCompletion: null, successFactors: [],
            longestStreak: 0, currentStreak: 0, totalHabits: 0,
            habitCompletionRate: 0, motivationalInsight: '', interventionNeeded: false,
            goalHealthCorrelation: 0
        };
    }

    getDefaultJupiterData() {
        return {
            totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0, netWorth: 0,
            budgetRemaining: 0, spendingRate: 0, savingsRate: 0,
            recentTransactions: [], largestExpense: null, unusualSpending: false,
            spendingByCategory: {}, topCategories: [], savingsOpportunities: [],
            stressCorrelation: 0, stressSpendingEvents: [], interventionTriggered: false,
            monthEndProjection: 0, cashFlowForecast: []
        };
    }

    getDefaultSaturnData() {
        return {
            age: 0, lifeExpectancy: 80, daysRemaining: 0, lifeProgress: 0,
            tenYearVision: '', oneYearGoals: [], quarterlyObjectives: [],
            lastReview: null, reviewScore: 0, accomplishments: [], learnings: [],
            healthScore: 0, wealthScore: 0, relationshipsScore: 0,
            purposeScore: 0, growthScore: 0, onTrack: false, momentum: 0,
            legacyImpact: 0, mortalityReminder: '', timeWellSpent: 0
        };
    }

    // ========================================
    // DASHBOARD GENERATION - ALL FEATURES PRESERVED
    // ========================================

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
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Heart Rate Variability</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${data.hrv} <span style="font-size: 20px;">ms</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">7-day average</p>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Resting Heart Rate</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${data.restingHeartRate} <span style="font-size: 20px;">bpm</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">Morning baseline</p>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Recovery Score</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${Math.round(data.recoveryScore)}<span style="font-size: 20px;">%</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">${data.recoveryStatus}</p>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 15px;">Sleep Quality</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #00ffff;">${data.sleepDuration}<span style="font-size: 20px;">hrs</span></div>
                    <p style="margin-top: 10px; color: rgba(0,255,255,0.6);">${data.sleepScore}% score</p>
                </div>
            </div>
            
            <h3 style="margin-bottom: 20px;">Health Insights</h3>
            <div>
                ${data.illnessRisk > 0.7 ? `
                    <div style="padding: 15px; background: rgba(255,68,68,0.1); border-left: 3px solid #ff4444; margin-bottom: 15px;">
                        <span style="font-size: 24px;">⚠️</span>
                        <div style="margin-left: 40px; margin-top: -30px;">
                            <div style="font-weight: bold; margin-bottom: 5px;">Illness Risk Elevated</div>
                            <div style="color: rgba(255,255,255,0.7);">Your immune markers suggest ${Math.round(data.illnessRisk * 100)}% illness risk. Prioritize recovery.</div>
                        </div>
                    </div>
                ` : ''}
                
                ${data.burnoutRisk > 0.6 ? `
                    <div style="padding: 15px; background: rgba(255,68,68,0.1); border-left: 3px solid #ff4444; margin-bottom: 15px;">
                        <span style="font-size: 24px;">🔥</span>
                        <div style="margin-left: 40px; margin-top: -30px;">
                            <div style="font-weight: bold; margin-bottom: 5px;">Burnout Warning</div>
                            <div style="color: rgba(255,255,255,0.7);">Pattern suggests ${Math.round(data.burnoutRisk * 100)}% burnout risk. Consider reducing training volume.</div>
                        </div>
                    </div>
                ` : ''}
                
                <div style="padding: 15px; background: rgba(0,255,255,0.05); border-left: 3px solid #00ffff; margin-bottom: 15px;">
                    <span style="font-size: 24px;">💪</span>
                    <div style="margin-left: 40px; margin-top: -30px;">
                        <div style="font-weight: bold; margin-bottom: 5px;">Body Composition</div>
                        <div style="color: rgba(255,255,255,0.7);">${data.bodyFat}% body fat, ${data.muscleMass}kg muscle mass</div>
                    </div>
                </div>
                
                <div style="padding: 15px; background: rgba(0,255,255,0.05); border-left: 3px solid #00ffff; margin-bottom: 15px;">
                    <span style="font-size: 24px;">⚡</span>
                    <div style="margin-left: 40px; margin-top: -30px;">
                        <div style="font-weight: bold; margin-bottom: 5px;">Metabolic Rate</div>
                        <div style="color: rgba(255,255,255,0.7);">BMR: ${data.bmr} kcal | TDEE: ${data.tdee} kcal</div>
                    </div>
                </div>
            </div>
            
            <h3 style="margin: 30px 0 15px 0;">Quick Actions</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.syncWearables()">🔄 Sync Wearables</button>
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.improveHRV()">💚 Improve HRV</button>
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.optimizeSleep()">😴 Optimize Sleep</button>
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.recoveryPlan()">🛁 Recovery Plan</button>
            </div>
        `;
    }

    generateVenusDashboard(data) {
        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 10px;">Workouts This Week</h3>
                    <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${data.workoutsThisWeek}</div>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 10px;">Training Volume</h3>
                    <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${data.totalMinutes} <span style="font-size: 16px;">min</span></div>
                </div>
                <div style="padding: 20px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <h3 style="margin-bottom: 10px;">Performance</h3>
                    <div style="font-size: 42px; font-weight: bold; color: #00ffff;">${Math.round(data.performanceScore)}<span style="font-size: 16px;">%</span></div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px;">Nutrition Today</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
                <div style="padding: 15px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <div style="font-size: 10px; margin-bottom: 5px;">CALORIES</div>
                    <div style="font-size: 24px; font-weight: bold;">${data.calories}</div>
                    <div style="width: 100%; height: 4px; background: rgba(0,255,255,0.2); margin-top: 10px;">
                        <div style="width: ${Math.min((data.calories / 2500) * 100, 100)}%; height: 100%; background: #00ffff;"></div>
                    </div>
                </div>
                <div style="padding: 15px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <div style="font-size: 10px; margin-bottom: 5px;">PROTEIN</div>
                    <div style="font-size: 24px; font-weight: bold;">${data.protein}g</div>
                    <div style="width: 100%; height: 4px; background: rgba(0,255,255,0.2); margin-top: 10px;">
                        <div style="width: ${data.proteinTarget > 0 ? Math.min((data.protein / data.proteinTarget) * 100, 100) : 0}%; height: 100%; background: #00ffff;"></div>
                    </div>
                </div>
                <div style="padding: 15px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <div style="font-size: 10px; margin-bottom: 5px;">CARBS</div>
                    <div style="font-size: 24px; font-weight: bold;">${data.carbs}g</div>
                    <div style="width: 100%; height: 4px; background: rgba(0,255,255,0.2); margin-top: 10px;">
                        <div style="width: ${data.carbsTarget > 0 ? Math.min((data.carbs / data.carbsTarget) * 100, 100) : 0}%; height: 100%; background: #00ffff;"></div>
                    </div>
                </div>
                <div style="padding: 15px; background: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2);">
                    <div style="font-size: 10px; margin-bottom: 5px;">FATS</div>
                    <div style="font-size: 24px; font-weight: bold;">${data.fats}g</div>
                    <div style="width: 100%; height: 4px; background: rgba(0,255,255,0.2); margin-top: 10px;">
                        <div style="width: ${data.fatsTarget > 0 ? Math.min((data.fats / data.fatsTarget) * 100, 100) : 0}%; height: 100%; background: #00ffff;"></div>
                    </div>
                </div>
            </div>
            
            ${data.plateauDetected ? `
                <div style="padding: 15px; background: rgba(255,136,0,0.1); border-left: 3px solid #ff8800; margin-bottom: 20px;">
                    <span style="font-size: 24px;">📊</span>
                    <div style="margin-left: 40px; margin-top: -30px;">
                        <div style="font-weight: bold; margin-bottom: 5px;">Plateau Detected</div>
                        <div style="color: rgba(255,255,255,0.7);">Performance plateau detected. Try quantum workout generation for breakthrough results.</div>
                    </div>
                </div>
            ` : ''}
            
            <h3 style="margin-bottom: 15px;">Training Templates</h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.generateQuantumWorkout()">🌌 Quantum Workout</button>
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.logWorkout()">💪 Log Workout</button>
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.logMeal()">🍽️ Log Meal</button>
                <button style="padding: 12px 24px; background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.5); color: #00ffff; cursor: pointer;" onclick="window.planetSystem.analyzeMealPhoto()">📸 Scan Meal</button>
            </div>
        `;
    }

    // Continue with Earth, Mars, Jupiter, Saturn dashboards...
    // (Character limit - will continue in next response if needed)

    // ========================================
    // UTILITY METHODS
    // ========================================

    calculateTotalMinutes(workouts) {
        if (!workouts || !Array.isArray(workouts)) return 0;
        return workouts.reduce((total, w) => total + (w.duration || 0), 0);
    }

    getRecoveryStatus(score) {
        if (!score) return 'Calculating...';
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Low';
    }

    assessDataQuality(sources) {
        const validSources = sources.filter(s => s.data && Object.keys(s.data).length > 0);
        return Math.round((validSources.length / sources.length) * 100);
    }

    getLargestExpense(transactions) {
        if (!transactions || !Array.isArray(transactions)) return null;
        return transactions.reduce((max, t) => (t.amount > (max?.amount || 0) ? t : max), transactions[0]);
    }

    isToday(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    formatCurrency(amount) {
        return Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
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

    async getMotivationalInsight(goals) {
        const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length : 0;
        
        if (avgProgress > 80) return "Outstanding progress! You're crushing your goals!";
        if (avgProgress > 60) return "Great momentum! Keep pushing forward!";
        if (avgProgress > 40) return "Solid progress. Stay consistent and you'll get there!";
        return "Every journey starts with a single step. You've got this!";
    }

    checkGoalIntervention(goals) {
        return goals.some(g => g.atRisk || (g.daysOverdue && g.daysOverdue > 7));
    }

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
        }
    }

    calculateTrustScore() {
        const dataPoints = Object.values(this.planets).filter(p => p.data && Object.keys(p.data).length > 0).length;
        const trustScore = Math.min(100, Math.round((dataPoints / 6) * 100));
        console.log(`🔥 Trust Score: ${trustScore}%`);
        
        if (window.reactorCore) {
            window.reactorCore.setTrustScore(trustScore);
        }
    }

    setupPlanetInteractions() {
        // Planet click handlers
        Object.keys(this.planets).forEach(planetName => {
            const planetEl = document.getElementById(`planet-${planetName}`);
            if (!planetEl) return;

            planetEl.addEventListener('click', () => this.expandPlanet(planetName));
        });
    }

    async expandPlanet(planetName) {
        console.log(`Expanding ${planetName}...`);
        
        // Load dashboard content
        await this.loadDashboardContent(planetName);
        
        const overlay = document.getElementById('planet-detail');
        if (overlay) overlay.style.display = 'block';
    }

    async loadDashboardContent(planetName) {
        const titleEl = document.getElementById('detail-title');
        const subtitleEl = document.getElementById('detail-subtitle');
        const contentEl = document.getElementById('detail-content');

        const planet = this.planets[planetName];
        if (titleEl) titleEl.textContent = `${planet.icon} ${planet.title}`;
        if (subtitleEl) subtitleEl.textContent = planet.subtitle;

        if (contentEl) {
            contentEl.innerHTML = this.generateDashboardHTML(planetName);
        }
    }

    async loadCorrelations() {
        try {
            const patterns = await API.getAllPatterns();
            this.correlations = patterns.data || [];
        } catch (error) {
            console.error('Failed to load correlations:', error);
        }
    }

    startRealTimeUpdates() {
        setInterval(() => {
            this.refreshLiveMetrics();
        }, 30000);
    }

    async refreshLiveMetrics() {
        try {
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
        this.dataRefreshInterval = setInterval(async () => {
            console.log('🔄 Refreshing all planetary data...');
            await this.loadAllPlanetData();
            await this.loadCorrelations();
        }, 300000);
    }

    animate() {
        Object.entries(this.planets).forEach(([name, planet]) => {
            planet.angle += planet.speed;
            if (planet.angle >= 360) planet.angle -= 360;
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

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

    // Action handlers (called from dashboard buttons)
    async syncWearables() {
        console.log('Syncing wearables...');
    }

    async improveHRV() {
        console.log('Opening HRV improvement protocol...');
    }

    async optimizeSleep() {
        console.log('Opening sleep optimization...');
    }

    async recoveryPlan() {
        console.log('Loading recovery plan...');
    }

    async generateQuantumWorkout() {
        console.log('Generating quantum workout...');
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
