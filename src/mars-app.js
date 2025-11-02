/**
 * ============================================================================
 * MARS GOALS & HABITS - OKR Dashboard + Habit Tracker
 * ============================================================================
 *
 * Integrates with Phoenix backend Mars endpoints (20 total):
 * - /api/mars/okr/current - Current quarter OKR
 * - /api/mars/okr/progress - OKR progress update
 * - /api/mars/key-results/list - All key results for current OKR
 * - /api/mars/goals/active - Active goals list
 * - /api/mars/habits/grid - 365-day habit completion grid
 * - /api/mars/habits/streak - Current habit streak
 * - /api/mars/milestones/upcoming - Upcoming milestones
 */

class MarsApp {
    constructor() {
        this.apiBaseUrl = window.PhoenixConfig.API_BASE_URL;
        this.refreshInterval = 300000; // Refresh every 5 minutes
    }

    /**
     * Initialize the app
     */
    async init() {
        console.log('🔥 Initializing Mars Goals & Habits...');

        // Get auth token
        this.authToken = localStorage.getItem('authToken');

        if (!this.authToken) {
            this.showLoginRequired();
            return;
        }

        try {
            // Load all dashboard data
            await this.loadDashboardData();

            // Set up auto-refresh
            setInterval(() => this.loadDashboardData(), this.refreshInterval);

            console.log('✅ Mars initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Mars:', error);
            this.showError(error);
        }
    }

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        try {
            // Show loading
            document.getElementById('loading').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';

            // Fetch data in parallel
            const [okr, keyResults, goals, habitGrid, streak, milestones] = await Promise.allSettled([
                this.fetchCurrentOKR(),
                this.fetchKeyResults(),
                this.fetchActiveGoals(),
                this.fetchHabitGrid(),
                this.fetchStreak(),
                this.fetchUpcomingMilestones()
            ]);

            // Check if we have any data
            const hasData = okr.status === 'fulfilled' ||
                           keyResults.status === 'fulfilled' ||
                           goals.status === 'fulfilled';

            if (!hasData) {
                // Show empty state
                document.getElementById('loading').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                return;
            }

            // Render all data
            if (okr.status === 'fulfilled') {
                this.renderCurrentOKR(okr.value);
            }

            if (keyResults.status === 'fulfilled') {
                this.renderKeyResults(keyResults.value);
            }

            if (goals.status === 'fulfilled') {
                this.renderActiveGoals(goals.value);
            }

            if (habitGrid.status === 'fulfilled' && streak.status === 'fulfilled') {
                this.renderHabitTracking(habitGrid.value, streak.value);
            }

            if (milestones.status === 'fulfilled') {
                this.renderMilestones(milestones.value);
            }

            // Show dashboard
            document.getElementById('loading').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError(error);
        }
    }

    /**
     * Fetch current OKR
     */
    async fetchCurrentOKR() {
        const response = await fetch(`${this.apiBaseUrl}/mars/okr/current`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`OKR API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch key results
     */
    async fetchKeyResults() {
        const response = await fetch(`${this.apiBaseUrl}/mars/key-results/list`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Key Results API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch active goals
     */
    async fetchActiveGoals() {
        const response = await fetch(`${this.apiBaseUrl}/mars/goals/active`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Goals API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch habit grid (365 days)
     */
    async fetchHabitGrid() {
        const response = await fetch(`${this.apiBaseUrl}/mars/habits/grid?days=365`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Habit Grid API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch current streak
     */
    async fetchStreak() {
        const response = await fetch(`${this.apiBaseUrl}/mars/habits/streak`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Streak API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch upcoming milestones
     */
    async fetchUpcomingMilestones() {
        const response = await fetch(`${this.apiBaseUrl}/mars/milestones/upcoming?limit=5`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Milestones API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Render current OKR
     */
    renderCurrentOKR(data) {
        const objective = data.objective || data.title || 'Set your first OKR';
        const progress = data.progress || 0;
        const weeksRemaining = data.weeks_remaining || data.weeksRemaining || 12;

        // Update objective text
        document.getElementById('currentObjective').textContent = objective;

        // Update progress ring
        const circle = document.getElementById('okrProgressCircle');
        const circumference = 502.4;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // Update progress text
        document.getElementById('okrProgressText').textContent = `${Math.round(progress)}%`;

        // Update time remaining
        document.getElementById('okrTimeRemaining').textContent =
            `${weeksRemaining} week${weeksRemaining !== 1 ? 's' : ''} remaining`;
    }

    /**
     * Render key results
     */
    renderKeyResults(data) {
        const keyResults = data.keyResults || data.items || data || [];
        const container = document.getElementById('keyResultsList');

        // Update count
        document.getElementById('keyResultsCount').textContent = `${keyResults.length} active`;

        if (!keyResults.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No key results yet. Create an OKR to get started.
                </div>
            `;
            return;
        }

        const html = keyResults.map(kr => {
            const title = kr.title || kr.name || 'Untitled Key Result';
            const current = kr.current_value || kr.current || 0;
            const target = kr.target_value || kr.target || 100;
            const progress = Math.min(100, (current / target) * 100);
            const deadline = kr.deadline ? new Date(kr.deadline).toLocaleDateString() : 'No deadline';

            return `
                <div class="key-result-item">
                    <div class="key-result-header">
                        <div class="key-result-title">${title}</div>
                        <div class="key-result-percentage">${Math.round(progress)}%</div>
                    </div>
                    <div class="key-result-progress">
                        <div class="key-result-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="key-result-meta">
                        <span>${current} / ${target}</span>
                        <span>Due: ${deadline}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render active goals
     */
    renderActiveGoals(data) {
        const goals = data.goals || data.items || data || [];
        const container = document.getElementById('goalsList');

        // Update count
        document.getElementById('goalsCount').textContent = `${goals.length} goals`;

        if (!goals.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No active goals. Set your first goal to get started.
                </div>
            `;
            return;
        }

        const html = goals.slice(0, 5).map(goal => {
            const title = goal.title || goal.name || 'Untitled Goal';
            const icon = goal.icon || '🎯';
            const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline';
            const status = goal.status || 'active';
            const isCompleted = status === 'completed';

            return `
                <div class="goal-item">
                    <div class="goal-icon">${icon}</div>
                    <div class="goal-content">
                        <div class="goal-title">${title}</div>
                        <div class="goal-deadline">Deadline: ${deadline}</div>
                    </div>
                    <div class="goal-status ${isCompleted ? 'completed' : ''}">
                        ${isCompleted ? '✓ Done' : 'In Progress'}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render habit tracking grid
     */
    renderHabitTracking(gridData, streakData) {
        const grid = gridData.grid || gridData.data || [];
        const streak = streakData.current_streak || streakData.streak || 0;
        const totalHabits = streakData.total_habits || streakData.total || 0;
        const completionRate = streakData.completion_rate || 0;

        // Update streak display
        document.getElementById('currentStreak').textContent = `${streak} day streak 🔥`;

        // Update stats
        document.getElementById('totalHabits').textContent = totalHabits;
        document.getElementById('completionRate').textContent = `${Math.round(completionRate)}%`;

        // Render 365-day grid (GitHub style)
        const container = document.getElementById('habitGrid');
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setDate(today.getDate() - 364);

        let html = '';
        for (let i = 0; i < 365; i++) {
            const date = new Date(oneYearAgo);
            date.setDate(oneYearAgo.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            // Find data for this date
            const dayData = grid.find(d => d.date === dateStr || d.day === dateStr);
            const count = dayData ? (dayData.count || dayData.completed || 0) : 0;

            // Determine level (0-4) based on completion count
            let level = 0;
            if (count >= 4) level = 4;
            else if (count >= 3) level = 3;
            else if (count >= 2) level = 2;
            else if (count >= 1) level = 1;

            const levelClass = level > 0 ? `level-${level}` : '';
            const title = `${dateStr}: ${count} habit${count !== 1 ? 's' : ''}`;

            html += `<div class="habit-cell ${levelClass}" title="${title}"></div>`;
        }

        container.innerHTML = html;
    }

    /**
     * Render milestones
     */
    renderMilestones(data) {
        const milestones = data.milestones || data.items || data || [];
        const container = document.getElementById('milestonesList');

        // Update count
        document.getElementById('milestonesCount').textContent = `${milestones.length} upcoming`;

        if (!milestones.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No upcoming milestones
                </div>
            `;
            return;
        }

        const html = milestones.slice(0, 5).map(milestone => {
            const title = milestone.title || milestone.name || 'Untitled Milestone';
            const description = milestone.description || '';
            const date = milestone.date ? new Date(milestone.date).toLocaleDateString() : 'TBD';

            return `
                <div class="milestone-item">
                    <div class="milestone-date">${date}</div>
                    <div class="milestone-title">${title}</div>
                    ${description ? `<div class="milestone-description">${description}</div>` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Create new OKR
     */
    createOKR() {
        const objective = prompt('What\'s your quarterly objective?');
        if (!objective) return;

        console.log('Creating OKR:', objective);
        alert('OKR creation will open in the full interface. For now, this is a demo.');
        // TODO: Implement OKR creation modal
    }

    /**
     * Log a habit
     */
    async logHabit() {
        console.log('Logging habit...');

        try {
            const response = await fetch(`${this.apiBaseUrl}/mars/habits/log`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    habits_completed: 1
                })
            });

            if (response.ok) {
                this.showAchievement('✅', 'Habit Logged!', 'Keep the streak alive');
                await this.loadDashboardData(); // Refresh
            } else {
                alert('Failed to log habit. Please try again.');
            }
        } catch (error) {
            console.error('Habit logging error:', error);
            alert('Habit logging coming soon! Backend integration pending.');
        }
    }

    /**
     * Update progress on a key result
     */
    updateProgress() {
        console.log('Updating progress...');
        alert('Progress updates will open in the full interface. For now, this is a demo.');
        // TODO: Implement progress update modal
    }

    /**
     * Weekly review
     */
    weeklyReview() {
        console.log('Starting weekly review...');
        alert('Weekly review will open in the full interface. For now, this is a demo.');
        // TODO: Implement weekly review flow
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

        // Auto-hide after 4 seconds
        setTimeout(() => {
            popup.style.display = 'none';
        }, 4000);
    }

    /**
     * Show login required message
     */
    showLoginRequired() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <div class="empty-state-text">Please log in to view your goals</div>
                <button class="start-button" onclick="window.location.href='index.html'">
                    Go to Login
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }

    /**
     * Show error message
     */
    showError(error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Error loading goals: ${error.message}</div>
                <button class="start-button" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }
}

// Initialize app when page loads
window.marsApp = new MarsApp();
document.addEventListener('DOMContentLoaded', () => {
    window.marsApp.init();
});
