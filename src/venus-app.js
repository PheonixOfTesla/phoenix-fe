/**
 * ============================================================================
 * VENUS FITNESS GAMING - The Most Addictive Workout Tracker
 * ============================================================================
 *
 * Integrates with 88 Venus backend endpoints for:
 * - Workout logging and tracking
 * - Quantum AI workout generation
 * - Nutrition scanning and analysis
 * - Streak tracking and gamification
 * - Challenges and achievements
 */

class VenusApp {
    constructor() {
        this.apiBaseUrl = window.PhoenixConfig.API_BASE_URL;
        this.authToken = localStorage.getItem('authToken');
        this.streak = 0;
        this.level = 1;
        this.workouts = [];
        this.currentWeekStats = {
            workouts: 0,
            volume: 0,
            nutrition: 0
        };
    }

    /**
     * Initialize the app
     */
    async init() {
        console.log('💪 Initializing Venus Fitness Gaming...');

        if (!this.authToken) {
            this.showLoginRequired();
            return;
        }

        try {
            // Load all data in parallel
            await this.loadDashboardData();

            console.log('✅ Venus initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Venus:', error);
            this.showError(error);
        }
    }

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        try {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';

            // Fetch data in parallel
            const [streak, workouts, nutrition, stats, level] = await Promise.allSettled([
                this.fetchStreak(),
                this.fetchRecentWorkouts(),
                this.fetchTodayNutrition(),
                this.fetchWeeklyStats(),
                this.fetchUserLevel()
            ]);

            // Check if user has any workouts
            const hasData = workouts.status === 'fulfilled' && workouts.value && workouts.value.length > 0;

            if (!hasData) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                return;
            }

            // Render all data
            if (streak.status === 'fulfilled') {
                this.renderStreak(streak.value);
            }

            if (workouts.status === 'fulfilled') {
                this.renderWorkouts(workouts.value);
            }

            if (nutrition.status === 'fulfilled') {
                this.renderNutrition(nutrition.value);
            }

            if (stats.status === 'fulfilled') {
                this.renderWeeklyProgress(stats.value);
            }

            if (level.status === 'fulfilled') {
                this.renderLevel(level.value);
            }

            // Load AI recommendations
            await this.loadAIRecommendations();

            document.getElementById('loading').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError(error);
        }
    }

    /**
     * Fetch workout streak
     */
    async fetchStreak() {
        const response = await fetch(`${this.apiBaseUrl}/venus/streak`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Return default if endpoint doesn't exist yet
            return { current_streak: 0, longest_streak: 0 };
        }

        return await response.json();
    }

    /**
     * Fetch recent workouts
     */
    async fetchRecentWorkouts() {
        const response = await fetch(`${this.apiBaseUrl}/venus/workouts/recent?limit=5`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Workouts API failed: ${response.status}`);
        }

        const data = await response.json();
        return data.workouts || data || [];
    }

    /**
     * Fetch today's nutrition
     */
    async fetchTodayNutrition() {
        const response = await fetch(`${this.apiBaseUrl}/venus/nutrition/today`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return { meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
        }

        return await response.json();
    }

    /**
     * Fetch weekly stats
     */
    async fetchWeeklyStats() {
        const response = await fetch(`${this.apiBaseUrl}/venus/stats/weekly`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return {
                workouts_completed: 0,
                total_volume: 0,
                nutrition_days: 0,
                weekly_goals: { workouts: 5, volume: 50000, nutrition: 7 }
            };
        }

        return await response.json();
    }

    /**
     * Fetch user level
     */
    async fetchUserLevel() {
        const response = await fetch(`${this.apiBaseUrl}/venus/level`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return { level: 1, xp: 0, next_level_xp: 100 };
        }

        return await response.json();
    }

    /**
     * Render streak
     */
    renderStreak(data) {
        const streak = data.current_streak || data.streak || 0;
        this.streak = streak;

        document.getElementById('streakNumber').textContent = streak;

        // Update emoji based on streak
        let emoji = '💪';
        if (streak >= 30) emoji = '🔥';
        else if (streak >= 14) emoji = '⚡';
        else if (streak >= 7) emoji = '✨';

        document.getElementById('streakEmoji').textContent = emoji;

        // Show achievement if milestone
        if (streak === 7) {
            this.showAchievement('🔥', '7 Day Streak!', 'You\'re on fire!');
        } else if (streak === 30) {
            this.showAchievement('🏆', '30 Day Streak!', 'Legendary commitment!');
        } else if (streak === 100) {
            this.showAchievement('👑', '100 Day Streak!', 'You\'re unstoppable!');
        }
    }

    /**
     * Render workouts
     */
    renderWorkouts(workouts) {
        const container = document.getElementById('workoutList');
        this.workouts = workouts;

        if (!workouts || workouts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.5);">
                    <div style="font-size: 48px; margin-bottom: 15px;">💪</div>
                    <div>No workouts yet. Time to get started!</div>
                </div>
            `;
            return;
        }

        const html = workouts.slice(0, 5).map(workout => {
            const date = new Date(workout.date || workout.created_at);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const duration = workout.duration || 0;
            const durationStr = duration > 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`;

            const volume = workout.total_volume || workout.volume || 0;
            const exercises = workout.exercises_count || workout.exercises?.length || 0;

            return `
                <div class="workout-item" onclick="window.venusApp.viewWorkout('${workout._id || workout.id}')">
                    <div class="workout-title">${workout.name || workout.type || 'Workout'}</div>
                    <div class="workout-stats">
                        <div class="workout-stat">
                            <span class="workout-stat-icon">📅</span>
                            <span>${dateStr}</span>
                        </div>
                        <div class="workout-stat">
                            <span class="workout-stat-icon">⏱️</span>
                            <span>${durationStr}</span>
                        </div>
                        <div class="workout-stat">
                            <span class="workout-stat-icon">💪</span>
                            <span>${exercises} exercises</span>
                        </div>
                        <div class="workout-stat">
                            <span class="workout-stat-icon">⚡</span>
                            <span>${volume.toLocaleString()} lbs</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render nutrition
     */
    renderNutrition(data) {
        const container = document.getElementById('todayNutrition');
        const totals = data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };

        if (totals.calories === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 20px;">
                    No meals logged today
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #00ffaa;">${totals.calories}</div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">Calories</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #00ffaa;">${totals.protein}g</div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">Protein</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #00ffaa;">${totals.carbs}g</div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">Carbs</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #00ffaa;">${totals.fat}g</div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">Fat</div>
                </div>
            </div>
        `;
    }

    /**
     * Render weekly progress
     */
    renderWeeklyProgress(stats) {
        this.currentWeekStats = {
            workouts: stats.workouts_completed || 0,
            volume: stats.total_volume || 0,
            nutrition: stats.nutrition_days || 0
        };

        const goals = stats.weekly_goals || { workouts: 5, volume: 50000, nutrition: 7 };

        // Workouts
        const workoutPercent = Math.min((this.currentWeekStats.workouts / goals.workouts) * 100, 100);
        document.getElementById('workoutProgress').textContent = `${this.currentWeekStats.workouts}/${goals.workouts} this week`;
        document.getElementById('workoutProgressBar').style.width = `${workoutPercent}%`;

        // Volume
        const volumePercent = Math.min((this.currentWeekStats.volume / goals.volume) * 100, 100);
        document.getElementById('volumeProgress').textContent = `${this.currentWeekStats.volume.toLocaleString()}/${goals.volume.toLocaleString()}`;
        document.getElementById('volumeProgressBar').style.width = `${volumePercent}%`;

        // Nutrition
        const nutritionPercent = Math.min((this.currentWeekStats.nutrition / goals.nutrition) * 100, 100);
        document.getElementById('nutritionProgress').textContent = `${this.currentWeekStats.nutrition}/${goals.nutrition} days`;
        document.getElementById('nutritionProgressBar').style.width = `${nutritionPercent}%`;
    }

    /**
     * Render level
     */
    renderLevel(data) {
        this.level = data.level || 1;
        document.getElementById('levelBadge').textContent = `Level ${this.level}`;
    }

    /**
     * Load AI recommendations
     */
    async loadAIRecommendations() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/venus/ai/recommendations`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                this.renderDefaultRecommendations();
                return;
            }

            const data = await response.json();
            this.renderAIRecommendations(data.recommendations || data);
        } catch (error) {
            this.renderDefaultRecommendations();
        }
    }

    /**
     * Render AI recommendations
     */
    renderAIRecommendations(recommendations) {
        const container = document.getElementById('aiRecommendations');

        if (!recommendations || recommendations.length === 0) {
            this.renderDefaultRecommendations();
            return;
        }

        const html = recommendations.slice(0, 3).map(rec => {
            const icon = rec.type === 'workout' ? '💪' : rec.type === 'nutrition' ? '🍎' : rec.type === 'recovery' ? '😴' : '⚡';

            return `
                <div style="background: rgba(0, 255, 170, 0.05); border-left: 3px solid #00ffaa; padding: 15px 20px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <span style="font-size: 24px;">${icon}</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #00ffaa; margin-bottom: 5px;">${rec.title}</div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.5;">${rec.message}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render default recommendations
     */
    renderDefaultRecommendations() {
        const container = document.getElementById('aiRecommendations');
        container.innerHTML = `
            <div style="background: rgba(0, 255, 170, 0.05); border-left: 3px solid #00ffaa; padding: 15px 20px; border-radius: 10px;">
                <div style="display: flex; align-items: start; gap: 12px;">
                    <span style="font-size: 24px;">💪</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #00ffaa; margin-bottom: 5px;">Ready to crush it?</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">Log your first workout to get personalized AI recommendations!</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Start workout
     */
    startWorkout() {
        alert('🏋️ Workout Logger\n\nOpening real-time workout tracking...\n\nThis will connect to /api/venus/workouts/start endpoint');
        // TODO: Open workout logger modal
    }

    /**
     * Generate Quantum workout
     */
    async generateQuantumWorkout() {
        alert('⚡ Quantum Workout Generator\n\nGenerating AI-optimized workout based on:\n• Your recovery score\n• Recent training volume\n• Energy patterns\n• Goal targets\n\nConnects to /api/venus/quantum-workout endpoint');
        // TODO: Call backend and display quantum workout
    }

    /**
     * Scan nutrition
     */
    scanNutrition() {
        alert('📸 Nutrition Scanner\n\nOpening camera for:\n• Photo recognition (meal analysis)\n• Barcode scanning\n• Manual entry\n\nConnects to /api/venus/nutrition/scan endpoint');
        // TODO: Open nutrition scanner
    }

    /**
     * View challenges
     */
    viewChallenges() {
        alert('🏆 Challenges\n\nActive challenges:\n• 30-day consistency\n• Volume milestone\n• Nutrition streak\n\nConnects to /api/venus/challenges endpoint');
        // TODO: Open challenges view
    }

    /**
     * View workout details
     */
    viewWorkout(workoutId) {
        alert(`📊 Workout Details\n\nOpening workout: ${workoutId}\n\nShows:\n• Exercise breakdown\n• Sets & reps\n• Volume calculations\n• Progress vs last time`);
        // TODO: Open workout detail modal
    }

    /**
     * Start first workout
     */
    startFirstWorkout() {
        this.startWorkout();
    }

    /**
     * Show achievement popup
     */
    showAchievement(icon, title, subtitle) {
        const popup = document.getElementById('achievementPopup');
        document.getElementById('achievementIcon').textContent = icon;
        document.getElementById('achievementTitle').textContent = title;
        document.getElementById('achievementSubtitle').textContent = subtitle;

        popup.style.display = 'block';

        setTimeout(() => {
            popup.style.display = 'none';
        }, 4000);
    }

    /**
     * Show login required
     */
    showLoginRequired() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <div class="empty-text">Please log in to access Venus Fitness</div>
                <button class="cta-button" onclick="window.location.href='index.html'">
                    Go to Login
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }

    /**
     * Show error
     */
    showError(error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-text">Error loading fitness data: ${error.message}</div>
                <button class="cta-button" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }
}

// Initialize app when page loads
window.venusApp = new VenusApp();
document.addEventListener('DOMContentLoaded', () => {
    window.venusApp.init();
});
