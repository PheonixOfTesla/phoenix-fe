/**
 * ============================================================================
 * SATURN LEGACY - Mortality Awareness & Life Planning
 * ============================================================================
 *
 * Integrates with Phoenix backend Saturn endpoints:
 * - /api/saturn/mortality/calculate - Calculate weeks remaining
 * - /api/saturn/reviews/list - Quarterly life reviews
 * - /api/saturn/goals/long-term - 5/10/25 year goals
 * - /api/saturn/legacy/projects - Legacy projects tracking
 * - /api/saturn/relationships/important - Important people tracker
 * - /api/saturn/satisfaction/current - Life satisfaction scores
 */

class SaturnApp {
    constructor() {
        this.apiBaseUrl = window.PhoenixConfig.API_BASE_URL;
        this.refreshInterval = 600000; // Refresh every 10 minutes
        this.satisfactionAreas = [
            'Health & Fitness',
            'Career & Purpose',
            'Relationships',
            'Personal Growth',
            'Financial Security',
            'Fun & Adventure'
        ];
    }

    /**
     * Initialize the app
     */
    async init() {
        console.log('🪐 Initializing Saturn Legacy...');

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

            console.log('✅ Saturn initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Saturn:', error);
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
            const [mortality, reviews, goals, legacy, relationships, satisfaction] = await Promise.allSettled([
                this.fetchMortality(),
                this.fetchReviews(),
                this.fetchLongTermGoals(),
                this.fetchLegacyProjects(),
                this.fetchRelationships(),
                this.fetchSatisfaction()
            ]);

            // Check if we have any data (mortality should always work)
            const hasData = mortality.status === 'fulfilled';

            if (!hasData) {
                // Show empty state
                document.getElementById('loading').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                return;
            }

            // Render all data
            if (mortality.status === 'fulfilled') {
                this.renderMortality(mortality.value);
            }

            if (reviews.status === 'fulfilled') {
                this.renderReviews(reviews.value);
            }

            if (goals.status === 'fulfilled') {
                this.renderLongTermGoals(goals.value);
            }

            if (legacy.status === 'fulfilled') {
                this.renderLegacyProjects(legacy.value);
            }

            if (relationships.status === 'fulfilled') {
                this.renderRelationships(relationships.value);
            }

            if (satisfaction.status === 'fulfilled') {
                this.renderSatisfaction(satisfaction.value);
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
     * Fetch mortality data
     */
    async fetchMortality() {
        const response = await fetch(`${this.apiBaseUrl}/saturn/mortality/calculate`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Mortality API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch quarterly reviews
     */
    async fetchReviews() {
        const response = await fetch(`${this.apiBaseUrl}/saturn/reviews/list?limit=5`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Reviews API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch long-term goals
     */
    async fetchLongTermGoals() {
        const response = await fetch(`${this.apiBaseUrl}/saturn/goals/long-term`, {
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
     * Fetch legacy projects
     */
    async fetchLegacyProjects() {
        const response = await fetch(`${this.apiBaseUrl}/saturn/legacy/projects`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Legacy API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch important relationships
     */
    async fetchRelationships() {
        const response = await fetch(`${this.apiBaseUrl}/saturn/relationships/important`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Relationships API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch life satisfaction
     */
    async fetchSatisfaction() {
        const response = await fetch(`${this.apiBaseUrl}/saturn/satisfaction/current`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Satisfaction API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Render mortality counter
     */
    renderMortality(data) {
        const weeksRemaining = data.weeks_remaining || data.weeksRemaining || 3000;
        const yearsLived = data.years_lived || data.age || 25;
        const lifeExpectancy = data.life_expectancy || 80;
        const lifeProgress = (yearsLived / lifeExpectancy) * 100;

        // Update counter
        document.getElementById('weeksRemaining').textContent = weeksRemaining.toLocaleString();

        // Update life stats
        document.getElementById('yearsLived').textContent = `${yearsLived} years lived`;
        document.getElementById('lifeExpectancy').textContent = `Est. ${lifeExpectancy} years total`;

        // Update progress bar
        document.getElementById('lifeProgressBar').style.width = `${lifeProgress}%`;

        // Set motivational message based on age
        const messages = [
            "Make every week count.",
            "Your legacy is being written today.",
            "Time is your most valuable asset.",
            "Live with intention, die without regret.",
            "The best time to plant a tree was 20 years ago. The second best time is now."
        ];
        document.getElementById('mortalityMessage').textContent = messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Render quarterly reviews
     */
    renderReviews(data) {
        const reviews = data.reviews || data.items || data || [];
        const container = document.getElementById('reviewsTimeline');

        // Update count
        document.getElementById('reviewsCount').textContent = `${reviews.length} completed`;

        if (!reviews.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No reviews yet. Start your first quarterly review.
                </div>
            `;
            return;
        }

        const html = reviews.map(review => {
            const quarter = review.quarter || 'Q1 2024';
            const highlights = review.highlights || review.summary || 'No highlights recorded';
            const score = review.satisfaction_score || review.score || 7;

            return `
                <div class="review-item">
                    <div class="review-quarter">${quarter}</div>
                    <div class="review-highlights">${highlights}</div>
                    <div class="review-score">Satisfaction: ${score}/10</div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render long-term goals
     */
    renderLongTermGoals(data) {
        const goals = data.goals || data || {};
        const fiveYear = goals['5year'] || goals.five_year || [];
        const tenYear = goals['10year'] || goals.ten_year || [];
        const twentyFiveYear = goals['25year'] || goals.twenty_five_year || [];

        // Render 5-year goals
        const fiveYearHtml = fiveYear.length ? fiveYear.map(g => `
            <div class="goal-item">${g.title || g}</div>
        `).join('') : '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.3); font-size: 12px;">Set goals</div>';

        // Render 10-year goals
        const tenYearHtml = tenYear.length ? tenYear.map(g => `
            <div class="goal-item">${g.title || g}</div>
        `).join('') : '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.3); font-size: 12px;">Set goals</div>';

        // Render 25-year goals
        const twentyFiveYearHtml = twentyFiveYear.length ? twentyFiveYear.map(g => `
            <div class="goal-item">${g.title || g}</div>
        `).join('') : '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.3); font-size: 12px;">Set goals</div>';

        // Update grid
        document.getElementById('longTermGoals').innerHTML = `
            <div class="goal-column">
                <div class="goal-timeframe">5 Year</div>
                <div class="goal-list">${fiveYearHtml}</div>
            </div>
            <div class="goal-column">
                <div class="goal-timeframe">10 Year</div>
                <div class="goal-list">${tenYearHtml}</div>
            </div>
            <div class="goal-column">
                <div class="goal-timeframe">25 Year</div>
                <div class="goal-list">${twentyFiveYearHtml}</div>
            </div>
        `;
    }

    /**
     * Render legacy projects
     */
    renderLegacyProjects(data) {
        const projects = data.projects || data.items || data || [];
        const container = document.getElementById('legacyList');

        // Update count
        document.getElementById('legacyCount').textContent = `${projects.length} active`;

        if (!projects.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    What will you leave behind?
                </div>
            `;
            return;
        }

        const html = projects.map(project => {
            const title = project.title || project.name || 'Untitled Project';
            const description = project.description || 'No description';
            const status = project.status || 'In Progress';
            const progress = project.progress || 0;

            return `
                <div class="legacy-item">
                    <div class="legacy-header">
                        <div class="legacy-title">${title}</div>
                        <div class="legacy-status">${status}</div>
                    </div>
                    <div class="legacy-description">${description}</div>
                    <div class="legacy-progress">
                        <div class="legacy-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render important relationships
     */
    renderRelationships(data) {
        const relationships = data.relationships || data.items || data || [];
        const container = document.getElementById('relationshipsGrid');

        // Update count
        document.getElementById('relationshipsCount').textContent = `${relationships.length} tracked`;

        if (!relationships.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4); grid-column: 1/-1;">
                    Add the people who matter most
                </div>
            `;
            return;
        }

        const html = relationships.map(person => {
            const name = person.name || 'Unknown';
            const role = person.role || person.relationship || 'Friend';
            const lastContact = person.last_contact ? this.getTimeAgo(new Date(person.last_contact)) : 'Never';
            const avatar = person.avatar || '👤';

            return `
                <div class="relationship-card">
                    <div class="relationship-avatar">${avatar}</div>
                    <div class="relationship-name">${name}</div>
                    <div class="relationship-role">${role}</div>
                    <div class="relationship-last-contact">Last contact: ${lastContact}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render life satisfaction
     */
    renderSatisfaction(data) {
        const scores = data.scores || data.satisfaction || {};
        const container = document.getElementById('satisfactionGrid');

        const html = this.satisfactionAreas.map(area => {
            const key = area.toLowerCase().replace(/\s+&\s+/g, '_').replace(/\s+/g, '_');
            const score = scores[key] || scores[area] || 5;
            const percentage = (score / 10) * 100;

            return `
                <div class="satisfaction-area">
                    <div class="satisfaction-label">${area}</div>
                    <div class="satisfaction-score">
                        <div class="satisfaction-number">${score}/10</div>
                        <div class="satisfaction-bar">
                            <div class="satisfaction-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Start quarterly review
     */
    quarterlyReview() {
        alert('📝 Quarterly review flow coming soon! This will guide you through reflecting on the past 3 months.');
    }

    /**
     * Set long-term goal
     */
    setLongTermGoal() {
        alert('🎯 10-year goal setting coming soon! Think big - what do you want to accomplish in the next decade?');
    }

    /**
     * Add legacy project
     */
    addLegacyProject() {
        alert('🌟 Legacy project creation coming soon! What lasting impact do you want to make?');
    }

    /**
     * Contact important person
     */
    contactImportant() {
        alert('💬 Quick contact reminder coming soon! Life is short - reach out to someone important today.');
    }

    /**
     * Setup profile
     */
    setupProfile() {
        const birthYear = prompt('What year were you born?');
        if (birthYear) {
            const age = new Date().getFullYear() - parseInt(birthYear);
            alert(`Welcome! At ${age} years old, you have approximately ${(80 - age) * 52} weeks left. Make them count.`);
            this.loadDashboardData();
        }
    }

    /**
     * Helper: Get time ago
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    /**
     * Show login required message
     */
    showLoginRequired() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <div class="empty-state-text">Please log in to plan your legacy</div>
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
                <div class="empty-state-text">Error loading legacy data: ${error.message}</div>
                <button class="start-button" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }
}

// Initialize app when page loads
window.saturnApp = new SaturnApp();
document.addEventListener('DOMContentLoaded', () => {
    window.saturnApp.init();
});
