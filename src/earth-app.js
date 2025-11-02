/**
 * ============================================================================
 * EARTH CALENDAR - Energy-Optimized Scheduling
 * ============================================================================
 *
 * Integrates with Phoenix backend Earth endpoints:
 * - /api/earth/calendar/events - Get calendar events
 * - /api/earth/calendar/connect - Connect Google Calendar
 * - /api/earth/energy/profile - Get user's energy profile
 * - /api/earth/energy/current - Current energy level
 * - /api/earth/schedule/optimize - Optimize schedule based on energy
 * - /api/earth/analytics/week - Weekly calendar analytics
 */

class EarthApp {
    constructor() {
        this.apiBaseUrl = window.PhoenixConfig.API_BASE_URL;
        this.refreshInterval = 300000; // Refresh every 5 minutes
    }

    /**
     * Initialize the app
     */
    async init() {
        console.log('🌍 Initializing Earth Calendar...');

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

            // Update energy curve every minute
            setInterval(() => this.updateCurrentTimeMarker(), 60000);

            console.log('✅ Earth initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Earth:', error);
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
            const [events, energy, analytics] = await Promise.allSettled([
                this.fetchCalendarEvents(),
                this.fetchEnergyProfile(),
                this.fetchWeeklyAnalytics()
            ]);

            // Check if we have any data
            const hasData = events.status === 'fulfilled' && events.value?.length >= 0;

            if (!hasData) {
                // Show empty state
                document.getElementById('loading').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                return;
            }

            // Render all data
            if (events.status === 'fulfilled') {
                this.renderWeekView(events.value);
                this.renderTodayEvents(events.value);
            }

            if (energy.status === 'fulfilled') {
                this.renderEnergyProfile(energy.value);
            }

            if (analytics.status === 'fulfilled') {
                this.renderAnalytics(analytics.value);
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
     * Fetch calendar events
     */
    async fetchCalendarEvents() {
        const startDate = this.getWeekStart();
        const endDate = this.getWeekEnd();

        const response = await fetch(
            `${this.apiBaseUrl}/earth/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Calendar API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch energy profile
     */
    async fetchEnergyProfile() {
        const response = await fetch(`${this.apiBaseUrl}/earth/energy/current`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Energy API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch weekly analytics
     */
    async fetchWeeklyAnalytics() {
        const response = await fetch(`${this.apiBaseUrl}/earth/analytics/week`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Analytics API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Render week view
     */
    renderWeekView(data) {
        const events = data.events || data.items || data || [];
        const container = document.getElementById('weekView');

        // Get week dates
        const weekStart = this.getWeekStart();
        const weekEnd = this.getWeekEnd();

        // Update week range display
        document.getElementById('weekRange').textContent =
            `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        // Generate 7 day columns
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);

            const isToday = date.getTime() === today.getTime();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayDate = date.getDate();

            // Filter events for this day
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.start || event.start_time);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === date.getTime();
            });

            // Render events
            const eventsHtml = dayEvents.slice(0, 5).map(event => {
                const title = event.title || event.summary || 'Untitled Event';
                const startTime = new Date(event.start || event.start_time);
                const timeStr = startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                return `
                    <div class="event-item">
                        <div class="event-time">${timeStr}</div>
                        <div class="event-title">${title}</div>
                    </div>
                `;
            }).join('');

            html += `
                <div class="day-column ${isToday ? 'today' : ''}">
                    <div class="day-header">
                        <div class="day-name">${dayName}</div>
                        <div class="day-date">${dayDate}</div>
                    </div>
                    ${eventsHtml || '<div style="text-align:center;color:rgba(255,255,255,0.3);font-size:11px;margin-top:20px;">No events</div>'}
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Render today's events
     */
    renderTodayEvents(data) {
        const events = data.events || data.items || data || [];
        const container = document.getElementById('todayEvents');

        // Filter today's events
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEvents = events.filter(event => {
            const eventDate = new Date(event.start || event.start_time);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === today.getTime();
        }).sort((a, b) => {
            const aTime = new Date(a.start || a.start_time);
            const bTime = new Date(b.start || b.start_time);
            return aTime - bTime;
        });

        // Update count
        document.getElementById('todayEventCount').textContent = `${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''}`;

        if (!todayEvents.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No events today - perfect for deep work!
                </div>
            `;
            return;
        }

        const html = todayEvents.map(event => {
            const title = event.title || event.summary || 'Untitled Event';
            const startTime = new Date(event.start || event.start_time);
            const endTime = new Date(event.end || event.end_time);
            const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes
            const location = event.location || '';
            const attendees = event.attendees ? event.attendees.length : 0;

            const timeStr = `${startTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })} - ${endTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })}`;

            return `
                <div class="event-card">
                    <div class="event-card-time">${timeStr}</div>
                    <div class="event-card-title">${title}</div>
                    <div class="event-card-meta">
                        <span>⏱️ ${duration} min</span>
                        ${attendees > 0 ? `<span>👥 ${attendees} people</span>` : ''}
                        ${location ? `<span>📍 ${location}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render energy profile
     */
    renderEnergyProfile(data) {
        const currentEnergy = data.current_energy || data.energy || 75;
        const profile = data.profile || data.energy_profile || this.getDefaultEnergyProfile();

        // Update current energy score
        document.getElementById('energyScore').textContent = Math.round(currentEnergy);

        // Update energy status
        let status = '';
        if (currentEnergy >= 80) {
            status = 'Peak Performance - Perfect for deep work';
        } else if (currentEnergy >= 60) {
            status = 'Good Energy - Ready for focused tasks';
        } else if (currentEnergy >= 40) {
            status = 'Moderate Energy - Better for meetings';
        } else {
            status = 'Low Energy - Time to recharge';
        }
        document.getElementById('energyStatus').textContent = status;

        // Render energy curve
        this.renderEnergyCurve(profile);

        // Update peak/low energy times
        const peakHour = profile.findIndex(val => val === Math.max(...profile));
        const lowHour = profile.findIndex(val => val === Math.min(...profile));

        const peakStart = (6 + peakHour);
        const peakEnd = peakStart + 2;
        document.getElementById('peakEnergyTime').textContent =
            `${this.formatHour(peakStart)} - ${this.formatHour(peakEnd)}`;

        const lowStart = (6 + lowHour);
        const lowEnd = lowStart + 2;
        document.getElementById('lowEnergyTime').textContent =
            `${this.formatHour(lowStart)} - ${this.formatHour(lowEnd)}`;
    }

    /**
     * Render energy curve
     */
    renderEnergyCurve(profile) {
        const svg = document.getElementById('energyCurve');
        const width = 1000;
        const height = 150;
        const points = profile.length;

        // Generate path data
        let pathData = `M 0,${height - (profile[0] / 100 * height)}`;
        let pathDataFill = `M 0,${height} L 0,${height - (profile[0] / 100 * height)}`;

        for (let i = 0; i < points; i++) {
            const x = (i / (points - 1)) * width;
            const y = height - (profile[i] / 100 * height);
            pathData += ` L ${x},${y}`;
            pathDataFill += ` L ${x},${y}`;
        }

        pathDataFill += ` L ${width},${height} Z`;

        // Update paths
        document.getElementById('energyLine').setAttribute('d', pathData);
        document.getElementById('energyPath').setAttribute('d', pathDataFill);

        // Position current time marker
        this.updateCurrentTimeMarker(profile);
    }

    /**
     * Update current time marker on energy curve
     */
    updateCurrentTimeMarker(profile) {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // Calculate position (6 AM to 9 PM = 15 hours)
        if (hour < 6 || hour >= 21) {
            // Outside display range
            document.getElementById('currentTimeMarker').setAttribute('r', '0');
            return;
        }

        const currentProfile = profile || this.getDefaultEnergyProfile();
        const hoursSince6AM = hour - 6 + (minute / 60);
        const x = (hoursSince6AM / 15) * 1000;

        // Interpolate energy value
        const index = Math.floor(hoursSince6AM);
        const fraction = hoursSince6AM - index;
        const energy = currentProfile[index] + (currentProfile[index + 1] - currentProfile[index]) * fraction;
        const y = 150 - (energy / 100 * 150);

        // Update marker position
        const marker = document.getElementById('currentTimeMarker');
        marker.setAttribute('cx', x);
        marker.setAttribute('cy', y);
        marker.setAttribute('r', '6');
    }

    /**
     * Render weekly analytics
     */
    renderAnalytics(data) {
        const totalEvents = data.total_events || 0;
        const totalMeetings = data.total_meetings || 0;
        const deepWorkHours = data.deep_work_hours || 0;
        const freeHours = data.free_hours || 0;

        document.getElementById('totalEvents').textContent = totalEvents;
        document.getElementById('totalMeetings').textContent = totalMeetings;
        document.getElementById('deepWorkHours').textContent = `${Math.round(deepWorkHours)}h`;
        document.getElementById('freeTime').textContent = `${Math.round(freeHours)}h`;
    }

    /**
     * Connect calendar
     */
    async connectCalendar() {
        try {
            console.log('Connecting Google Calendar...');

            const response = await fetch(`${this.apiBaseUrl}/earth/calendar/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get calendar authorization URL');
            }

            const data = await response.json();
            const authUrl = data.auth_url || data.authUrl;

            if (authUrl) {
                // Redirect to Google OAuth
                window.location.href = authUrl;
            } else {
                throw new Error('No authorization URL received');
            }

        } catch (error) {
            console.error('Calendar connection error:', error);
            alert('📅 Google Calendar integration coming soon! Backend integration pending.');
        }
    }

    /**
     * Block deep work time
     */
    blockDeepWork() {
        alert('🧠 Deep work blocking coming soon! This will create a 2-hour focus block during your peak energy time.');
    }

    /**
     * Add event
     */
    addEvent() {
        alert('➕ Event creation coming soon!');
    }

    /**
     * Optimize schedule
     */
    optimizeSchedule() {
        alert('⚡ Schedule optimization coming soon! This will rearrange your calendar to match your energy profile.');
    }

    /**
     * Helper: Get default energy profile (15 hours, 6AM to 9PM)
     */
    getDefaultEnergyProfile() {
        // Typical energy curve: low morning, peak mid-morning, dip afternoon, recovery evening
        return [
            40, // 6 AM
            55, // 7 AM
            70, // 8 AM
            85, // 9 AM - PEAK
            90, // 10 AM - PEAK
            85, // 11 AM
            75, // 12 PM
            65, // 1 PM
            50, // 2 PM - DIP
            45, // 3 PM - DIP
            55, // 4 PM
            60, // 5 PM
            65, // 6 PM
            60, // 7 PM
            50, // 8 PM
            40  // 9 PM
        ];
    }

    /**
     * Helper: Get week start (Sunday)
     */
    getWeekStart() {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day;
        const weekStart = new Date(date.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    /**
     * Helper: Get week end (Saturday)
     */
    getWeekEnd() {
        const weekStart = this.getWeekStart();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return weekEnd;
    }

    /**
     * Helper: Format hour
     */
    formatHour(hour) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:00 ${ampm}`;
    }

    /**
     * Show login required message
     */
    showLoginRequired() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <div class="empty-state-text">Please log in to view your calendar</div>
                <button class="connect-button" onclick="window.location.href='index.html'">
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
                <div class="empty-state-text">Error loading calendar: ${error.message}</div>
                <button class="connect-button" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }
}

// Initialize app when page loads
window.earthApp = new EarthApp();
document.addEventListener('DOMContentLoaded', () => {
    window.earthApp.init();
});
