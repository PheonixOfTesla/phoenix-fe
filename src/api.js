// api.js - Phoenix API Bridge to Railway Backend

class PhoenixAPI {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:8080/api' 
            : 'https://pal-backend-production.up.railway.app/api';
        this.token = localStorage.getItem('phoenixToken');
        this.userId = localStorage.getItem('phoenixUserId');
        this.cache = new Map();
        this.syncInterval = null;
    }

    init() {
        console.log('🔗 Initializing Phoenix API...');
        
        // Auto-login for demo if no token
        if (!this.token) {
            this.demoLogin();
        } else {
            this.validateToken();
        }
        
        // Start periodic sync
        this.startAutoSync();
    }

    async demoLogin() {
        // Auto-login with demo credentials
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'john@client.com',
                    password: 'password123'
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.token) {
                this.token = data.token;
                this.userId = data.user._id;
                localStorage.setItem('phoenixToken', this.token);
                localStorage.setItem('phoenixUserId', this.userId);
                console.log('✅ Demo login successful');
                
                // Load initial data
                this.loadUserData();
            }
        } catch (error) {
            console.error('Demo login failed:', error);
            // Continue in offline mode
            this.offlineMode();
        }
    }

    async validateToken() {
        try {
            const response = await this.apiCall('/auth/me', 'GET');
            if (response.success) {
                console.log('✅ Token valid');
                this.loadUserData();
            } else {
                this.demoLogin();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.demoLogin();
        }
    }

    async apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            const data = await response.json();
            
            // Cache successful GET requests
            if (method === 'GET' && data.success) {
                this.cache.set(endpoint, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return data;
        } catch (error) {
            console.error(`API call failed: ${endpoint}`, error);
            
            // Return cached data if available
            if (method === 'GET' && this.cache.has(endpoint)) {
                console.log('📦 Using cached data for', endpoint);
                return this.cache.get(endpoint).data;
            }
            
            throw error;
        }
    }

    async loadUserData() {
        console.log('📊 Loading user data...');
        
        try {
            // Load all data in parallel
            const [
                intelligence,
                wearables,
                workouts,
                goals,
                measurements,
                nutrition
            ] = await Promise.all([
                this.getIntelligence(),
                this.getWearableData(),
                this.getWorkouts(),
                this.getGoals(),
                this.getMeasurements(),
                this.getNutrition()
            ]);
            
            // Update Phoenix with real data
            this.updatePhoenixData({
                intelligence,
                wearables,
                workouts,
                goals,
                measurements,
                nutrition
            });
            
            console.log('✅ User data loaded');
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.offlineMode();
        }
    }

    updatePhoenixData(data) {
        if (!window.Phoenix) return;
        
        // Update Phoenix with real backend data
        if (data.intelligence?.data) {
            const metrics = data.intelligence.data.metrics;
            window.Phoenix.userData.recoveryScore = metrics.recoveryScore || 78;
            window.Phoenix.userData.hrv = metrics.hrv || 68;
            window.Phoenix.userData.steps = metrics.steps || 4250;
            window.Phoenix.userData.sleepHours = (metrics.sleep / 60).toFixed(1) || 7.3;
        }
        
        if (data.goals?.length > 0) {
            window.Phoenix.userData.goals = data.goals.map(goal => ({
                name: goal.name,
                completed: goal.completed,
                current: goal.current,
                target: goal.target
            }));
        }
        
        // Update UI
        window.Phoenix.checkUserState();
        
        // Update widgets
        this.updateWidgets(data);
    }

    updateWidgets(data) {
        // Update goals widget
        if (data.goals) {
            const completed = data.goals.filter(g => g.completed).length;
            const total = data.goals.length;
            const goalsWidget = document.querySelector('.goals-widget .widget-value');
            if (goalsWidget) {
                goalsWidget.textContent = `${completed}/${total}`;
            }
        }
        
        // Trigger Phoenix evolution if enough data
        if (data.intelligence && data.wearables && data.goals) {
            setTimeout(() => {
                if (window.Phoenix && window.Phoenix.state === 'PAL') {
                    window.Phoenix.evolveToJARVIS();
                }
            }, 5000);
        }
    }

    // ============================================
    // API METHODS
    // ============================================

    async getIntelligence() {
        return this.apiCall(`/intelligence/${this.userId}`, 'GET');
    }

    async getWearableData() {
        return this.apiCall(`/wearables/user/${this.userId}`, 'GET');
    }

    async syncWearables(provider = 'fitbit') {
        return this.apiCall(`/wearables/sync/${provider}`, 'POST');
    }

    async getWorkouts() {
        return this.apiCall(`/workouts/client/${this.userId}`, 'GET');
    }

    async getGoals() {
        return this.apiCall(`/goals/client/${this.userId}`, 'GET');
    }

    async getMeasurements() {
        return this.apiCall(`/measurements/client/${this.userId}`, 'GET');
    }

    async getNutrition() {
        return this.apiCall(`/nutrition/client/${this.userId}`, 'GET');
    }

    async createWorkout(workout) {
        return this.apiCall(`/workouts/client/${this.userId}`, 'POST', workout);
    }

    async completeWorkout(workoutId, data) {
        return this.apiCall(`/workouts/${workoutId}/complete`, 'POST', data);
    }

    async updateGoal(goalId, data) {
        return this.apiCall(`/goals/${goalId}`, 'PUT', data);
    }

    async sendChatMessage(message) {
        return this.apiCall('/ai/chat', 'POST', { 
            message, 
            userId: this.userId 
        });
    }

    async getHealthAnalysis() {
        const [recovery, readiness, sleep] = await Promise.all([
            this.apiCall(`/health/recovery/${this.userId}`, 'GET'),
            this.apiCall(`/health/workout-readiness/${this.userId}`, 'GET'),
            this.apiCall(`/health/sleep/${this.userId}`, 'GET')
        ]);
        
        return { recovery, readiness, sleep };
    }

    async getCalendarData() {
        return this.apiCall(`/calendar/schedule/${this.userId}`, 'GET');
    }

    async triggerIntervention() {
        return this.apiCall(`/interventions/${this.userId}/analyze`, 'POST');
    }

    async getPredictions() {
        const [hrv, illness, energy] = await Promise.all([
            this.apiCall(`/predictions/${this.userId}/hrv`, 'GET'),
            this.apiCall(`/predictions/${this.userId}/illness`, 'GET'),
            this.apiCall(`/predictions/${this.userId}/energy`, 'GET')
        ]);
        
        return { hrv, illness, energy };
    }

    // ============================================
    // REAL-TIME SYNC
    // ============================================

    startAutoSync() {
        // Sync every 30 seconds
        this.syncInterval = setInterval(() => {
            this.syncData();
        }, 30000);
        
        // Initial sync
        setTimeout(() => this.syncData(), 2000);
    }

    async syncData() {
        if (!this.token || !this.userId) return;
        
        try {
            // Quick sync of critical metrics
            const intelligence = await this.getIntelligence();
            
            if (intelligence?.data) {
                // Update recovery score in real-time
                const newRecovery = intelligence.data.metrics.recoveryScore;
                if (window.Phoenix && newRecovery !== window.Phoenix.userData.recoveryScore) {
                    console.log(`📊 Recovery updated: ${newRecovery}%`);
                    window.Phoenix.userData.recoveryScore = newRecovery;
                    
                    // Update reactor energy
                    if (window.Reactor) {
                        window.Reactor.setEnergy(newRecovery);
                    }
                }
            }
        } catch (error) {
            console.log('Sync skipped:', error.message);
        }
    }

    // ============================================
    // OFFLINE MODE
    // ============================================

    offlineMode() {
        console.log('📴 Running in offline mode');
        
        // Use default demo data
        const demoData = {
            intelligence: {
                data: {
                    metrics: {
                        recoveryScore: 78,
                        hrv: 68,
                        steps: 4250,
                        sleep: 438
                    }
                }
            },
            goals: [
                { name: 'Morning workout', completed: true },
                { name: 'Hit 10k steps', completed: false, current: 4250, target: 10000 },
                { name: 'Meditate 10 min', completed: false },
                { name: 'Drink 8 glasses water', completed: false, current: 3, target: 8 },
                { name: 'Sleep by 10:30 PM', completed: false }
            ]
        };
        
        this.updatePhoenixData(demoData);
    }

    // ============================================
    // CLEANUP
    // ============================================

    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.cache.clear();
    }
}

// Initialize API when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.PhoenixAPI = new PhoenixAPI();
    window.PhoenixAPI.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.PhoenixAPI) {
        window.PhoenixAPI.destroy();
    }
});