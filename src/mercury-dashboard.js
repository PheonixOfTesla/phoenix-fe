/**
 * ============================================================================
 * MERCURY HEALTH DASHBOARD - Real-time Health Intelligence
 * ============================================================================
 *
 * Integrates with Phoenix backend Mercury endpoints:
 * - /api/mercury/recovery/latest - Recovery score and metrics
 * - /api/mercury/biometrics/hrv - Heart rate variability data
 * - /api/mercury/sleep/analysis - Sleep quality breakdown
 * - /api/mercury/devices/list - Connected wearables
 * - /api/phoenix/insights - AI-generated health insights
 */

class MercuryDashboard {
    constructor() {
        this.apiBaseUrl = window.PhoenixConfig.API_BASE_URL;
        this.refreshInterval = 60000; // Refresh every 60 seconds
        this.charts = {};
        this.deviceTypes = [
            { id: 'apple_health', name: 'Apple Health', icon: '🍎', endpoint: '/api/mercury/devices/apple/connect' },
            { id: 'oura', name: 'Oura Ring', icon: '💍', endpoint: '/api/mercury/devices/oura/connect' },
            { id: 'whoop', name: 'WHOOP', icon: '⚡', endpoint: '/api/mercury/devices/whoop/connect' },
            { id: 'fitbit', name: 'Fitbit', icon: '⌚', endpoint: '/api/mercury/devices/fitbit/connect' },
            { id: 'garmin', name: 'Garmin', icon: '🏃', endpoint: '/api/mercury/devices/garmin/connect' }
        ];
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        console.log('🔬 Initializing Mercury Health Dashboard...');

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

            console.log('✅ Mercury Dashboard initialized');
        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.showError(error);
        }
    }

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        try {
            // Show loading
            document.getElementById('loading').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';

            // Fetch data in parallel for speed
            const [recovery, hrv, sleep, devices, insights] = await Promise.allSettled([
                this.fetchRecoveryData(),
                this.fetchHRVData(),
                this.fetchSleepData(),
                this.fetchConnectedDevices(),
                this.fetchAIInsights()
            ]);

            // Check if we have any data
            const hasData = recovery.status === 'fulfilled' ||
                           hrv.status === 'fulfilled' ||
                           sleep.status === 'fulfilled';

            if (!hasData) {
                // Show empty state
                document.getElementById('loading').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                this.renderDeviceList([]);
                return;
            }

            // Render all data
            if (recovery.status === 'fulfilled') {
                this.renderRecoveryScore(recovery.value);
            }

            if (hrv.status === 'fulfilled') {
                this.renderHRVData(hrv.value);
            }

            if (sleep.status === 'fulfilled') {
                this.renderSleepData(sleep.value);
            }

            if (devices.status === 'fulfilled') {
                this.renderDeviceList(devices.value);
            }

            if (insights.status === 'fulfilled') {
                this.renderAIInsights(insights.value);
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
     * Fetch recovery score data
     */
    async fetchRecoveryData() {
        const response = await fetch(`${this.apiBaseUrl}/mercury/recovery/latest`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Recovery API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch HRV data
     */
    async fetchHRVData() {
        const response = await fetch(`${this.apiBaseUrl}/mercury/biometrics/hrv?days=7`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HRV API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch sleep analysis data
     */
    async fetchSleepData() {
        const response = await fetch(`${this.apiBaseUrl}/mercury/sleep/analysis?nights=1`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Sleep API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch connected devices
     */
    async fetchConnectedDevices() {
        const response = await fetch(`${this.apiBaseUrl}/mercury/devices/list`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Devices API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch AI insights
     */
    async fetchAIInsights() {
        const response = await fetch(`${this.apiBaseUrl}/phoenix/insights?category=health&limit=5`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Insights API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Render recovery score
     */
    renderRecoveryScore(data) {
        const scoreEl = document.getElementById('recoveryScore');
        const statusEl = document.getElementById('recoveryStatus');

        // Extract score (handle different API response formats)
        const score = data.score || data.recovery_score || data.recoveryScore || 0;

        // Determine status and color
        let status, className;
        if (score >= 80) {
            status = 'Excellent - You\'re ready for anything';
            className = 'excellent';
        } else if (score >= 60) {
            status = 'Good - Ready for moderate activity';
            className = 'good';
        } else if (score >= 40) {
            status = 'Fair - Take it easy today';
            className = 'fair';
        } else {
            status = 'Low - Prioritize rest and recovery';
            className = 'poor';
        }

        scoreEl.textContent = Math.round(score);
        scoreEl.className = `recovery-score ${className}`;
        statusEl.textContent = status;
    }

    /**
     * Render HRV data
     */
    renderHRVData(data) {
        // Current HRV
        const currentHRV = data.current || data.latest || data.hrv || 0;
        const avgHRV = data.average || data.avg || 0;
        const trend = data.trend || this.calculateTrend(currentHRV, avgHRV);

        document.getElementById('currentHRV').innerHTML = `
            ${Math.round(currentHRV)} ms
            ${trend > 0 ? '<span class="metric-trend trend-up">↑</span>' : ''}
            ${trend < 0 ? '<span class="metric-trend trend-down">↓</span>' : ''}
        `;
        document.getElementById('avgHRV').textContent = `${Math.round(avgHRV)} ms`;

        // Render HRV chart if we have historical data
        if (data.history && data.history.length > 0) {
            this.renderHRVChart(data.history);
        }

        // Also update stress metrics
        const stressLevel = this.calculateStressLevel(currentHRV, avgHRV);
        document.getElementById('stressLevel').textContent = stressLevel;

        if (data.resting_heart_rate) {
            document.getElementById('restingHR').textContent = `${data.resting_heart_rate} bpm`;
        }
    }

    /**
     * Render sleep data
     */
    renderSleepData(data) {
        const sleepScore = data.score || data.sleep_score || 0;
        const totalSleep = data.total_sleep_minutes || data.duration || 0;
        const deepSleep = data.deep_sleep_minutes || data.deep || 0;
        const trend = data.trend || 0;

        document.getElementById('sleepScore').innerHTML = `
            ${Math.round(sleepScore)}
            ${trend > 0 ? '<span class="metric-trend trend-up">↑</span>' : ''}
            ${trend < 0 ? '<span class="metric-trend trend-down">↓</span>' : ''}
        `;
        document.getElementById('sleepDuration').textContent = this.formatDuration(totalSleep);
        document.getElementById('deepSleep').textContent = this.formatDuration(deepSleep);

        // Update recovery time based on sleep
        const recoveryTime = this.estimateRecoveryTime(sleepScore, totalSleep);
        document.getElementById('recoveryTime').textContent = recoveryTime;
    }

    /**
     * Render device list
     */
    renderDeviceList(connectedDevices) {
        const container = document.getElementById('wearablesList');

        const html = this.deviceTypes.map(device => {
            const isConnected = connectedDevices.some(d => d.type === device.id || d.id === device.id);

            return `
                <div class="wearable-card ${isConnected ? 'connected' : ''}"
                     onclick="window.mercuryDashboard.connectDevice('${device.id}', '${device.endpoint}')">
                    <div class="wearable-icon">${device.icon}</div>
                    <div class="wearable-name">${device.name}</div>
                    <div class="wearable-status ${isConnected ? 'connected' : ''}">
                        ${isConnected ? '✓ Connected' : 'Tap to connect'}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render AI insights
     */
    renderAIInsights(data) {
        const container = document.getElementById('aiInsights');

        // Extract insights array from response
        const insights = data.insights || data.items || data || [];

        if (!insights.length) {
            container.innerHTML = `
                <div class="insight-item">
                    <span class="insight-icon">💡</span>
                    <span class="insight-text">No insights available yet. Connect a device to get personalized recommendations.</span>
                </div>
            `;
            return;
        }

        const html = insights.slice(0, 5).map(insight => {
            const type = insight.type || insight.priority || 'info';
            const className = type === 'warning' ? 'warning' : (type === 'success' ? 'success' : '');
            const icon = type === 'warning' ? '⚠️' : (type === 'success' ? '✅' : '💡');
            const text = insight.message || insight.text || insight.insight;

            return `
                <div class="insight-item ${className}">
                    <span class="insight-icon">${icon}</span>
                    <span class="insight-text">${text}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render HRV chart (simple version - can be enhanced with Chart.js)
     */
    renderHRVChart(history) {
        const container = document.getElementById('hrvChart');

        // For now, create a simple SVG sparkline
        const values = history.map(h => h.value || h.hrv || 0);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;

        const width = container.clientWidth || 400;
        const height = 200;
        const points = values.map((val, i) => {
            const x = (i / (values.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - 20);
            return `${x},${y}`;
        }).join(' ');

        container.innerHTML = `
            <svg width="100%" height="${height}" style="overflow: visible;">
                <polyline
                    points="${points}"
                    fill="none"
                    stroke="rgba(0, 212, 255, 0.8)"
                    stroke-width="3"
                    style="filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));"
                />
                <circle cx="${width}" cy="${height - ((values[values.length-1] - min) / range) * (height - 20)}"
                        r="5" fill="#00d4ff" />
            </svg>
        `;
    }

    /**
     * Connect a wearable device
     */
    async connectDevice(deviceId, endpoint) {
        try {
            console.log(`Connecting to ${deviceId}...`);

            // For OAuth devices, redirect to authorization URL
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to connect: ${response.status}`);
            }

            const data = await response.json();

            // If we get an authorization URL, redirect to it
            if (data.authUrl || data.authorization_url) {
                window.location.href = data.authUrl || data.authorization_url;
            } else if (data.success) {
                alert(`✅ ${deviceId} connected successfully!`);
                this.loadDashboardData(); // Refresh
            }

        } catch (error) {
            console.error('Device connection error:', error);
            alert(`Failed to connect device: ${error.message}`);
        }
    }

    /**
     * Show device setup modal
     */
    showDeviceSetup() {
        // Scroll to wearables section
        const wearablesSection = document.querySelector('.glass-card:last-child');
        if (wearablesSection) {
            wearablesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Helper: Calculate trend
     */
    calculateTrend(current, average) {
        if (!current || !average) return 0;
        const diff = current - average;
        return diff / average;
    }

    /**
     * Helper: Calculate stress level from HRV
     */
    calculateStressLevel(hrv, avgHRV) {
        if (!hrv || !avgHRV) return 'Unknown';

        const ratio = hrv / avgHRV;
        if (ratio >= 1.1) return 'Low';
        if (ratio >= 0.9) return 'Moderate';
        return 'Elevated';
    }

    /**
     * Helper: Format duration
     */
    formatDuration(minutes) {
        if (!minutes) return '--';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    }

    /**
     * Helper: Estimate recovery time
     */
    estimateRecoveryTime(sleepScore, totalSleep) {
        if (!sleepScore || !totalSleep) return '--';

        const targetSleep = 480; // 8 hours
        const deficit = Math.max(0, targetSleep - totalSleep);

        if (deficit === 0 && sleepScore >= 80) {
            return 'Fully recovered';
        } else if (deficit < 60) {
            return '~2-4 hours';
        } else if (deficit < 120) {
            return '~6-8 hours';
        } else {
            return '12+ hours';
        }
    }

    /**
     * Show login required message
     */
    showLoginRequired() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <div class="empty-state-text">Please log in to view your health dashboard</div>
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
                <div class="empty-state-text">Error loading health data: ${error.message}</div>
                <button class="connect-button" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }
}

// Initialize dashboard when page loads
window.mercuryDashboard = new MercuryDashboard();
document.addEventListener('DOMContentLoaded', () => {
    window.mercuryDashboard.init();
});
