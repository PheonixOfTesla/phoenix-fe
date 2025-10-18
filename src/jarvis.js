// src/jarvis.js - JARVIS Intelligence Engine with Input Handling
// FILE MODIFICATION #2: Add input handlers and data refresh

import * as API from './api.js';

class JARVISEngine {
    constructor() {
        this.mode = 'PAL'; // PAL or JARVIS
        this.trustLevel = 0;
        this.consciousness = {
            awakened: false,
            level: 0
        };
        this.userData = {};
        this.backendData = {
            workouts: [],
            nutrition: null,
            calendar: [],
            goals: [],
            interventions: [],
            predictions: null
        };
    }

    async init() {
        console.log('🔥 Initializing JARVIS Engine...');
        
        // Check if user is logged in
        const token = localStorage.getItem('phoenixToken');
        const user = localStorage.getItem('phoenixUser');
        
        if (!token || !user) {
            this.showLoginScreen();
            return;
        }
        
        this.userData = JSON.parse(user);
        
        // Load all backend data
        await this.loadAllData();
        
        // Setup input handlers
        this.setupInputHandlers();
        
        // Start data refresh loop
        this.startDataRefresh();
        
        console.log('✅ JARVIS Engine Ready');
    }

    // ========================================
    // DATA LOADING
    // ========================================

    async loadAllData() {
        try {
            // Load wearable data (Mercury)
            const wearableData = await API.getLatestWearableData();
            if (wearableData.success && wearableData.data) {
                this.userData.hrv = wearableData.data.hrv || 0;
                this.userData.sleepHours = wearableData.data.sleepDuration ? (wearableData.data.sleepDuration / 60).toFixed(1) : 0;
                this.userData.recoveryScore = wearableData.data.recoveryScore || 0;
                this.userData.steps = wearableData.data.steps || 0;
                this.userData.heartRate = wearableData.data.heartRate || 0;
            }

            // Load recent workouts (Venus)
            const workouts = await API.getRecentWorkouts(5);
            if (workouts.success) {
                this.backendData.workouts = workouts.data || [];
            }

            // Load nutrition (Venus)
            const nutrition = await API.getTodayNutrition();
            if (nutrition.success) {
                this.backendData.nutrition = nutrition.data;
            }

            // Load calendar (Earth)
            const calendar = await API.getCalendarEvents();
            if (calendar.success) {
                this.backendData.calendar = calendar.data || [];
            }

            // Load goals (Mars)
            const goals = await API.getActiveGoals();
            if (goals.success) {
                this.backendData.goals = goals.data || [];
            }

            // Load interventions
            const interventions = await API.getActiveInterventions();
            if (interventions.success) {
                this.backendData.interventions = interventions.data || [];
            }

            // Load predictions
            const predictions = await API.getPredictions();
            if (predictions.success) {
                this.backendData.predictions = predictions.data;
            }

            console.log('✅ All backend data loaded', this.backendData);
            this.updateUI();

        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    // ========================================
    // INPUT HANDLERS (NEW)
    // ========================================

    setupInputHandlers() {
        // Workout logging form
        const workoutForm = document.getElementById('workout-form');
        if (workoutForm) {
            workoutForm.addEventListener('submit', (e) => this.handleWorkoutSubmit(e));
        }

        // Quick workout input (natural language)
        const quickWorkoutInput = document.getElementById('quick-workout-input');
        if (quickWorkoutInput) {
            quickWorkoutInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleQuickWorkout(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Meal logging form
        const mealForm = document.getElementById('meal-form');
        if (mealForm) {
            mealForm.addEventListener('submit', (e) => this.handleMealSubmit(e));
        }

        // Quick meal input (natural language)
        const quickMealInput = document.getElementById('quick-meal-input');
        if (quickMealInput) {
            quickMealInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleQuickMeal(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Goal creation form
        const goalForm = document.getElementById('goal-form');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
        }

        // Sync button
        const syncBtn = document.getElementById('sync-wearables-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncWearables());
        }
    }

    // ========================================
    // WORKOUT HANDLING (NEW)
    // ========================================

    async handleWorkoutSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const workoutData = {
            name: formData.get('workout-name'),
            type: formData.get('workout-type'),
            exercises: this.parseExercises(formData.get('exercises')),
            duration: parseInt(formData.get('duration')),
            notes: formData.get('notes'),
            mood: formData.get('mood')
        };

        try {
            const result = await API.logWorkout(workoutData);
            
            if (result.success) {
                this.addChatMessage(`✅ Workout logged: ${workoutData.name}`, 'phoenix');
                this.speak(`Workout logged. Good work on ${workoutData.name}.`);
                
                // Refresh workout data
                await this.refreshWorkouts();
                
                // Clear form
                e.target.reset();
                
                // Hide form
                const modal = document.getElementById('workout-modal');
                if (modal) modal.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to log workout:', error);
            this.addChatMessage('❌ Failed to log workout. Try again.', 'phoenix');
        }
    }

    async handleQuickWorkout(input) {
        // Parse natural language: "bench press 225x5x5"
        const parsed = this.parseQuickWorkout(input);
        
        if (!parsed) {
            this.addChatMessage('I didn\'t understand that workout format. Try: "exercise weight x sets x reps"', 'phoenix');
            return;
        }

        try {
            const result = await API.logWorkout({
                name: parsed.exercise,
                type: 'strength',
                exercises: [{
                    name: parsed.exercise,
                    weight: parsed.weight,
                    sets: parsed.sets,
                    reps: parsed.reps
                }],
                duration: parsed.sets * 3 // Estimate 3 min per set
            });

            if (result.success) {
                this.addChatMessage(`✅ Logged: ${parsed.exercise} ${parsed.weight}lbs x${parsed.sets}x${parsed.reps}`, 'phoenix');
                this.speak(`Logged ${parsed.exercise}. Nice lift.`);
                await this.refreshWorkouts();
            }
        } catch (error) {
            console.error('Failed to log quick workout:', error);
        }
    }

    parseQuickWorkout(input) {
        // Patterns: "bench press 225x5x5" or "squat 315 5x5"
        const pattern1 = /(.+?)\s+(\d+)x(\d+)x(\d+)/i;
        const pattern2 = /(.+?)\s+(\d+)\s+(\d+)x(\d+)/i;
        
        let match = input.match(pattern1) || input.match(pattern2);
        
        if (match) {
            return {
                exercise: match[1].trim(),
                weight: parseInt(match[2]),
                sets: parseInt(match[3]),
                reps: parseInt(match[4])
            };
        }
        
        return null;
    }

    parseExercises(exercisesText) {
        // Parse multi-line exercise input
        const lines = exercisesText.split('\n');
        return lines.map(line => {
            const parts = line.split(',');
            return {
                name: parts[0]?.trim(),
                sets: parseInt(parts[1]) || 0,
                reps: parseInt(parts[2]) || 0,
                weight: parseInt(parts[3]) || 0
            };
        }).filter(ex => ex.name);
    }

    // ========================================
    // NUTRITION HANDLING (NEW)
    // ========================================

    async handleMealSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const mealData = {
            name: formData.get('meal-name'),
            calories: parseInt(formData.get('calories')),
            protein: parseInt(formData.get('protein')),
            carbs: parseInt(formData.get('carbs')),
            fat: parseInt(formData.get('fat')),
            mealType: formData.get('meal-type')
        };

        try {
            const result = await API.logMeal(mealData);
            
            if (result.success) {
                this.addChatMessage(`✅ Meal logged: ${mealData.name} (${mealData.calories} cal, ${mealData.protein}g protein)`, 'phoenix');
                this.speak(`Meal logged. ${mealData.protein} grams of protein. Good choice.`);
                
                // Refresh nutrition data
                await this.refreshNutrition();
                
                // Clear form
                e.target.reset();
                
                // Hide modal
                const modal = document.getElementById('meal-modal');
                if (modal) modal.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to log meal:', error);
            this.addChatMessage('❌ Failed to log meal. Try again.', 'phoenix');
        }
    }

    async handleQuickMeal(input) {
        // Parse: "chicken breast 400cal 40p"
        const pattern = /(.+?)\s+(\d+)cal\s+(\d+)p/i;
        const match = input.match(pattern);
        
        if (!match) {
            this.addChatMessage('Format: "food name 400cal 40p"', 'phoenix');
            return;
        }

        try {
            const result = await API.logMeal({
                name: match[1].trim(),
                calories: parseInt(match[2]),
                protein: parseInt(match[3]),
                carbs: 0,
                fat: 0,
                mealType: 'snack'
            });

            if (result.success) {
                this.addChatMessage(`✅ Logged: ${match[1]} - ${match[2]} cal, ${match[3]}g protein`, 'phoenix');
                await this.refreshNutrition();
            }
        } catch (error) {
            console.error('Failed to log quick meal:', error);
        }
    }

    // ========================================
    // GOAL HANDLING (NEW)
    // ========================================

    async handleGoalSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const goalData = {
            title: formData.get('goal-title'),
            type: formData.get('goal-type'),
            target: parseFloat(formData.get('target')),
            deadline: formData.get('deadline'),
            metric: formData.get('metric')
        };

        try {
            const result = await API.createGoal(goalData);
            
            if (result.success) {
                this.addChatMessage(`✅ Goal created: ${goalData.title}`, 'phoenix');
                this.speak(`New goal set. I'll track your progress on ${goalData.title}.`);
                
                // Refresh goals
                await this.refreshGoals();
                
                // Clear form
                e.target.reset();
                
                // Hide modal
                const modal = document.getElementById('goal-modal');
                if (modal) modal.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to create goal:', error);
            this.addChatMessage('❌ Failed to create goal. Try again.', 'phoenix');
        }
    }

    // ========================================
    // DATA REFRESH (NEW)
    // ========================================

    async refreshWorkouts() {
        const workouts = await API.getRecentWorkouts(5);
        if (workouts.success) {
            this.backendData.workouts = workouts.data || [];
            this.updateWorkoutsUI();
        }
    }

    async refreshNutrition() {
        const nutrition = await API.getTodayNutrition();
        if (nutrition.success) {
            this.backendData.nutrition = nutrition.data;
            this.updateNutritionUI();
        }
    }

    async refreshGoals() {
        const goals = await API.getActiveGoals();
        if (goals.success) {
            this.backendData.goals = goals.data || [];
            this.updateGoalsUI();
        }
    }

    async syncWearables() {
        this.addChatMessage('Syncing wearables...', 'phoenix');
        
        try {
            const result = await API.syncWearables();
            
            if (result.success) {
                this.addChatMessage('✅ Wearables synced', 'phoenix');
                this.speak('Wearables synced. Data updated.');
                await this.loadAllData();
            }
        } catch (error) {
            console.error('Sync failed:', error);
            this.addChatMessage('❌ Sync failed. Try again.', 'phoenix');
        }
    }

    startDataRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadAllData();
        }, 30000);
    }

    // ========================================
    // UI UPDATES (NEW)
    // ========================================

    updateWorkoutsUI() {
        const container = document.getElementById('recent-workouts');
        if (!container) return;
        
        const workouts = this.backendData.workouts.slice(0, 5);
        
        container.innerHTML = workouts.length > 0 
            ? workouts.map(w => `
                <div class="workout-item" style="padding: 10px; border-bottom: 1px solid rgba(0,255,255,0.2);">
                    <div style="color: #00ffff; font-weight: bold;">${w.name || 'Workout'}</div>
                    <div style="color: rgba(0,255,255,0.6); font-size: 12px;">
                        ${new Date(w.createdAt).toLocaleDateString()} - ${w.duration || 0} min
                    </div>
                </div>
            `).join('')
            : '<div style="color: rgba(0,255,255,0.5);">No recent workouts</div>';
    }

    updateNutritionUI() {
        const container = document.getElementById('nutrition-summary');
        if (!container || !this.backendData.nutrition) return;
        
        const n = this.backendData.nutrition;
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                <div>
                    <div style="color: #00ffff; font-size: 24px; font-weight: bold;">${n.totalCalories || 0}</div>
                    <div style="color: rgba(0,255,255,0.6); font-size: 12px;">Calories</div>
                </div>
                <div>
                    <div style="color: #00ffff; font-size: 24px; font-weight: bold;">${n.totalProtein || 0}g</div>
                    <div style="color: rgba(0,255,255,0.6); font-size: 12px;">Protein</div>
                </div>
                <div>
                    <div style="color: #00ffff; font-size: 24px; font-weight: bold;">${n.totalCarbs || 0}g</div>
                    <div style="color: rgba(0,255,255,0.6); font-size: 12px;">Carbs</div>
                </div>
                <div>
                    <div style="color: #00ffff; font-size: 24px; font-weight: bold;">${n.totalFat || 0}g</div>
                    <div style="color: rgba(0,255,255,0.6); font-size: 12px;">Fat</div>
                </div>
            </div>
        `;
    }

    updateGoalsUI() {
        const container = document.getElementById('active-goals');
        if (!container) return;
        
        const goals = this.backendData.goals.slice(0, 3);
        
        container.innerHTML = goals.length > 0
            ? goals.map(g => {
                const progress = ((g.current || 0) / g.target * 100).toFixed(0);
                return `
                    <div class="goal-item" style="padding: 10px; border-bottom: 1px solid rgba(0,255,255,0.2);">
                        <div style="color: #00ffff; font-weight: bold;">${g.title}</div>
                        <div style="margin-top: 5px;">
                            <div style="background: rgba(0,255,255,0.1); height: 8px; border-radius: 4px;">
                                <div style="background: #00ffff; height: 100%; width: ${progress}%; border-radius: 4px;"></div>
                            </div>
                            <div style="color: rgba(0,255,255,0.6); font-size: 12px; margin-top: 5px;">
                                ${progress}% complete
                            </div>
                        </div>
                    </div>
                `;
            }).join('')
            : '<div style="color: rgba(0,255,255,0.5);">No active goals</div>';
    }

    updateUI() {
        this.updateWorkoutsUI();
        this.updateNutritionUI();
        this.updateGoalsUI();
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    addChatMessage(message, sender = 'user') {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            padding: 10px;
            margin: 5px 0;
            background: ${sender === 'phoenix' ? 'rgba(0,255,255,0.1)' : 'rgba(255,255,255,0.05)'};
            border-left: 2px solid ${sender === 'phoenix' ? '#00ffff' : '#666'};
            color: ${sender === 'phoenix' ? '#00ffff' : '#fff'};
        `;
        messageDiv.textContent = message;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    speak(text) {
        if (window.Voice) {
            window.Voice.speak(text);
        }
    }

    showLoginScreen() {
        console.log('User not logged in - show login screen');
        // Implement login UI
    }
}

// Initialize
window.Phoenix = new JARVISEngine();
document.addEventListener('DOMContentLoaded', () => {
    window.Phoenix.init();
});
