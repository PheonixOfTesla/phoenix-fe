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
            { id: 'fitbit', name: 'Fitbit', icon: '⌚', endpoint: '/api/mercury/devices/fitbit/connect' }
            // Other wearables temporarily disabled - only Fitbit active
            // { id: 'polar', name: 'Polar', icon: '🏃', endpoint: '/api/mercury/devices/polar/connect' },
            // { id: 'apple_health', name: 'Apple Health', icon: '🍎', endpoint: '/api/mercury/devices/apple/connect' },
            // { id: 'oura', name: 'Oura Ring', icon: '💍', endpoint: '/api/mercury/devices/oura/connect' },
            // { id: 'whoop', name: 'WHOOP', icon: '💪', endpoint: '/api/mercury/devices/whoop/connect' },
            // { id: 'garmin', name: 'Garmin', icon: '🏔️', endpoint: '/api/mercury/devices/garmin/connect' }
        ];
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        console.log('[Mercury] Initializing Mercury Health Dashboard...');

        // Get auth token
        this.authToken = localStorage.getItem('phoenixToken');

        // Always show dashboard - will show empty states if no data available

        try {
            // Load all dashboard data
            await this.loadDashboardData();

            // Set up auto-refresh
            setInterval(() => this.loadDashboardData(), this.refreshInterval);

            console.log('[Mercury] Dashboard initialized successfully');
        } catch (error) {
            console.error('[Mercury] Failed to initialize dashboard:', error);
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
            const [recovery, hrv, sleep, devices, insights, vitals, activity] = await Promise.allSettled([
                this.fetchRecoveryData(),
                this.fetchHRVData(),
                this.fetchSleepData(),
                this.fetchConnectedDevices(),
                this.fetchAIInsights(),
                this.fetchVitalsData(),
                this.fetchActivityData()
            ]);

            // FIRST: Show the dashboard (so DOM elements exist for render methods)
            document.getElementById('loading').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('emptyState').style.display = 'none';

            // THEN: Render data (DOM elements now exist)
            // Render recovery data
            try {
                if (recovery.status === 'fulfilled' && recovery.value) {
                    this.renderRecoveryScore(recovery.value);
                } else {
                    // No data available - show empty state
                    this.renderRecoveryScore({
                        isEmpty: true,
                        message: "Connect a wearable device to see your recovery score",
                        connectUrl: "/settings/wearables"
                    });
                }
            } catch (error) {
                console.warn('Failed to render recovery score:', error.message);
            }

            // Render HRV data
            if (hrv.status === 'fulfilled') {
                this.renderHRVData(hrv.value);
            } else {
                // No data available - show empty state
                this.renderHRVData({
                    isEmpty: true,
                    message: "Connect Apple Watch, Whoop, or Oura to track your heart rate variability",
                    connectUrl: "/settings/wearables"
                });
            }

            // Render sleep data
            if (sleep.status === 'fulfilled') {
                this.renderSleepData(sleep.value);
            } else {
                // No data available - show empty state
                this.renderSleepData({
                    isEmpty: true,
                    message: "Connect a wearable device to track your sleep quality",
                    connectUrl: "/settings/wearables"
                });
            }

            // Render devices (show available devices if none connected)
            if (devices.status === 'fulfilled' && devices.value?.length > 0) {
                this.renderDeviceList(devices.value);
            } else {
                // Show message about connecting devices
                this.renderDeviceList([]);
            }

            // Render AI insights
            if (insights.status === 'fulfilled') {
                this.renderAIInsights(insights.value);
            } else {
                // No data available - show empty state
                this.renderAIInsights({
                    isEmpty: true,
                    message: "Connect a wearable device to see your health data",
                    connectUrl: "/settings/wearables"
                });
            }

            // Render vitals data (SpO2, respiratory rate, temperature, VO2 max, etc.)
            if (vitals.status === 'fulfilled') {
                this.renderVitalsData(vitals.value);
            }

            // Render activity data (steps, calories, active minutes, etc.)
            if (activity.status === 'fulfilled') {
                this.renderActivityData(activity.value);
            }

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
        try {
            const response = await fetch(`${this.apiBaseUrl}/mercury/devices/list`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 404) {
                // Endpoint doesn't exist yet - return empty array
                console.warn('⚠️ /mercury/devices/list endpoint not found - showing all devices as available');
                return [];
            }

            if (!response.ok) {
                throw new Error(`Devices API failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch connected devices:', error.message);
            return []; // Return empty array on error
        }
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
     * Fetch comprehensive vitals data (SpO2, respiratory rate, temperature, VO2 max, ECG)
     */
    async fetchVitalsData() {
        try {
            const [spO2, respiratory, temperature, vo2max, ecg, azm] = await Promise.allSettled([
                fetch(`${this.apiBaseUrl}/mercury/biometrics/oxygen-saturation`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null),
                fetch(`${this.apiBaseUrl}/mercury/biometrics/respiratory-rate`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null),
                fetch(`${this.apiBaseUrl}/mercury/biometrics/temperature`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null),
                fetch(`${this.apiBaseUrl}/mercury/biometrics/cardio-fitness`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null),
                fetch(`${this.apiBaseUrl}/mercury/biometrics/ecg`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null),
                fetch(`${this.apiBaseUrl}/mercury/biometrics/active-zone-minutes`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null)
            ]);

            return {
                spO2: spO2.status === 'fulfilled' ? spO2.value : null,
                respiratory: respiratory.status === 'fulfilled' ? respiratory.value : null,
                temperature: temperature.status === 'fulfilled' ? temperature.value : null,
                vo2max: vo2max.status === 'fulfilled' ? vo2max.value : null,
                ecg: ecg.status === 'fulfilled' ? ecg.value : null,
                activeZoneMinutes: azm.status === 'fulfilled' ? azm.value : null
            };
        } catch (error) {
            console.warn('Failed to fetch vitals:', error);
            return {};
        }
    }

    /**
     * Fetch daily activity data (steps, distance, calories, floors, active minutes)
     */
    async fetchActivityData() {
        try {
            const [activity, nutrition] = await Promise.allSettled([
                fetch(`${this.apiBaseUrl}/mercury/data?type=activity&date=today`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null),
                fetch(`${this.apiBaseUrl}/mercury/data?type=nutrition&date=today`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }).then(r => r.ok ? r.json() : null)
            ]);

            return {
                activity: activity.status === 'fulfilled' ? activity.value : null,
                nutrition: nutrition.status === 'fulfilled' ? nutrition.value : null
            };
        } catch (error) {
            console.warn('Failed to fetch activity:', error);
            return {};
        }
    }

    /**
     * Render vitals data to Vitals tab - only show cards with actual data
     */
    renderVitalsData(data) {
        if (!data) return;

        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        const showCard = (id) => { const e = document.getElementById(id); if (e) e.style.display = 'block'; };
        const hideCard = (id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; };

        // SpO2 - only show if we have data
        if (data.spO2 && (data.spO2.current || data.spO2.average)) {
            showCard('spO2Card');
            el('currentSpO2', data.spO2.current ? `${data.spO2.current}%` : '--%');
            el('avgSpO2', data.spO2.average ? `${data.spO2.average}%` : '--%');
            el('spO2Events', data.spO2.lowEvents || '0');
        } else {
            hideCard('spO2Card');
        }

        // Respiratory Rate - only show if we have data
        if (data.respiratory && (data.respiratory.current || data.respiratory.sleepAverage)) {
            showCard('respiratoryCard');
            el('currentRespRate', data.respiratory.current ? `${data.respiratory.current} bpm` : '-- bpm');
            el('avgRespRate', data.respiratory.sleepAverage ? `${data.respiratory.sleepAverage} bpm` : '-- bpm');
            el('deepRespRate', data.respiratory.deepSleep ? `${data.respiratory.deepSleep} bpm` : '-- bpm');
        } else {
            hideCard('respiratoryCard');
        }

        // Temperature - only show if we have data
        const tempVariation = data.temperature?.variation || data.temperature?.skinTempVariation;
        if (data.temperature && (tempVariation || data.temperature.baseline)) {
            showCard('temperatureCard');
            el('skinTempVariation', tempVariation ? `${tempVariation > 0 ? '+' : ''}${tempVariation.toFixed(1)}°` : '--°');
            el('tempBaseline', data.temperature.baseline ? `${data.temperature.baseline}°F` : '--°F');
            el('tempTrend', data.temperature.trend || '--');
        } else {
            hideCard('temperatureCard');
        }

        // VO2 Max / Cardio Fitness - only show if we have data
        if (data.vo2max && data.vo2max.value) {
            showCard('vo2Card');
            el('vo2Max', `${data.vo2max.value} ml/kg/min`);
            el('fitnessLevel', data.vo2max.level || data.vo2max.fitnessLevel || '--');
            el('vo2Percentile', data.vo2max.percentile ? `Top ${100 - data.vo2max.percentile}%` : '--');
        } else {
            hideCard('vo2Card');
        }

        // ECG - only show if we have data
        if (data.ecg && (data.ecg.lastReading || data.ecg.classification)) {
            showCard('ecgCard');
            el('ecgLastReading', data.ecg.lastReading || '--');
            el('ecgClassification', data.ecg.classification || 'Normal Sinus Rhythm');
            el('irregularAlerts', data.ecg.irregularAlerts || '0');
        } else {
            hideCard('ecgCard');
        }

        // Active Zone Minutes - only show if we have data
        if (data.activeZoneMinutes && (data.activeZoneMinutes.today || data.activeZoneMinutes.weekly)) {
            showCard('azmCard');
            const azm = data.activeZoneMinutes;
            el('todayAZM', azm.today ? `${azm.today} min` : '-- min');
            el('weeklyAZM', azm.weekly ? `${azm.weekly} min` : '-- min');
            el('azmGoalProgress', azm.goalProgress ? `${azm.goalProgress}%` : '--%');
            el('fatBurnMins', azm.fatBurn || '--');
            el('cardioMins', azm.cardio || '--');
            el('peakMins', azm.peak || '--');
        } else {
            hideCard('azmCard');
        }
    }

    /**
     * Render activity data to Vitals tab - only show sections with data
     */
    renderActivityData(data) {
        if (!data) return;

        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        const showCard = (id) => { const e = document.getElementById(id); if (e) e.style.display = 'block'; };
        const hideCard = (id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; };

        // Activity - only show if we have meaningful data
        if (data.activity && (data.activity.steps || data.activity.calories || data.activity.distance)) {
            showCard('activityCard');
            const a = data.activity;
            el('todaySteps', a.steps?.toLocaleString() || '--');
            el('todayDistance', a.distance ? a.distance.toFixed(1) : '--');
            el('todayCalories', a.calories?.toLocaleString() || '--');
            el('todayFloors', a.floors || '--');
            el('todayActiveMinutes', a.activeMinutes || a.veryActiveMinutes || '--');

            // Activity breakdown
            const formatTime = (mins) => {
                if (!mins) return '--h --m';
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                return `${h}h ${m}m`;
            };
            el('sedentaryTime', formatTime(a.sedentaryMinutes));
            el('lightlyActiveTime', formatTime(a.lightlyActiveMinutes));
            el('fairlyActiveTime', formatTime(a.fairlyActiveMinutes));
            el('veryActiveTime', formatTime(a.veryActiveMinutes));
        } else {
            hideCard('activityCard');
        }

        // Nutrition - only show if we have data
        if (data.nutrition && (data.nutrition.water || data.nutrition.caloriesIn || data.nutrition.carbs)) {
            showCard('nutritionCard');
            const n = data.nutrition;
            el('waterIntake', n.water ? `${n.water} oz` : '-- oz');
            el('caloriesIn', n.caloriesIn?.toLocaleString() || '--');
            el('netCalories', n.netCalories?.toLocaleString() || '--');
            el('carbsGrams', n.carbs ? `${n.carbs}g` : '--g');
            el('proteinGrams', n.protein ? `${n.protein}g` : '--g');
            el('fatGrams', n.fat ? `${n.fat}g` : '--g');
        } else {
            hideCard('nutritionCard');
        }

        // Check if vitals tab has any data at all - show empty state if not
        const vitalsTab = document.getElementById('tab-vitals');
        if (vitalsTab) {
            const visibleCards = vitalsTab.querySelectorAll('.glass-card:not([style*="display: none"])');
            const emptyState = document.getElementById('vitalsEmptyState');
            if (visibleCards.length === 0) {
                // No data - show connect prompt
                if (!emptyState) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.id = 'vitalsEmptyState';
                    emptyDiv.innerHTML = `
                        <div style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
                            <div style="font-size: 48px; margin-bottom: 20px; font-weight: 200;">+</div>
                            <div style="font-size: 18px; margin-bottom: 10px;">No vitals data yet</div>
                            <div style="font-size: 14px; margin-bottom: 30px;">Connect a wearable device to see your SpO2, respiratory rate, temperature, and more</div>
                            <button onclick="window.mercuryDashboard.showDeviceSetup()" style="
                                background: linear-gradient(135deg, #00d4ff, #00ffaa);
                                border: none; padding: 15px 40px; border-radius: 30px;
                                color: #000; font-weight: 700; cursor: pointer;">
                                Connect Device
                            </button>
                        </div>
                    `;
                    vitalsTab.querySelector('.dashboard-grid').appendChild(emptyDiv);
                }
            } else if (emptyState) {
                emptyState.remove();
            }
        }
    }

    /**
     * Render recovery score
     */
    renderRecoveryScore(data) {
        const scoreEl = document.getElementById('recoveryScore');
        const statusEl = document.getElementById('recoveryStatus');

        if (!scoreEl || !statusEl) {
            console.warn('Recovery score elements not found in DOM');
            return;
        }

        // Check for empty state
        if (data.isEmpty) {
            scoreEl.textContent = '--';
            scoreEl.className = 'recovery-score empty';
            statusEl.textContent = data.message || 'Connect a wearable device to see your recovery score';
            return;
        }

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
        // Check for empty state
        if (data.isEmpty) {
            const currentHRVEl = document.getElementById('currentHRV');
            if (currentHRVEl) {
                currentHRVEl.textContent = '--';
            }
            const avgHRVEl = document.getElementById('avgHRV');
            if (avgHRVEl) {
                avgHRVEl.textContent = '--';
            }
            const stressLevelEl = document.getElementById('stressLevel');
            if (stressLevelEl) {
                stressLevelEl.textContent = '--';
            }
            const restingHREl = document.getElementById('restingHR');
            if (restingHREl) {
                restingHREl.textContent = '--';
            }
            // Show empty state message in chart area
            const chartContainer = document.getElementById('hrvChart');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
                        <p>${data.message}</p>
                        <div class="connect-button" onclick="window.mercuryDashboard.showDeviceSetup()">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                        </div>
                    </div>
                `;
            }
            return;
        }

        // Current HRV
        const currentHRV = data.current || data.latest || data.hrv || 0;
        const avgHRV = data.average || data.avg || 0;
        const trend = data.trend || this.calculateTrend(currentHRV, avgHRV);

        const currentHRVEl = document.getElementById('currentHRV');
        if (!currentHRVEl) {
            console.warn('Element currentHRV not found');
            return;
        }
        currentHRVEl.innerHTML = `
            ${Math.round(currentHRV)} ms
            ${trend > 0 ? '<span class="metric-trend trend-up">↑</span>' : ''}
            ${trend < 0 ? '<span class="metric-trend trend-down">↓</span>' : ''}
        `;

        const avgHRVEl = document.getElementById('avgHRV');
        if (!avgHRVEl) {
            console.warn('Element avgHRV not found');
            return;
        }
        avgHRVEl.textContent = `${Math.round(avgHRV)} ms`;

        // Render HRV chart if we have historical data
        if (data.history && data.history.length > 0) {
            this.renderHRVChart(data.history);
        }

        // Also update stress metrics
        const stressLevel = this.calculateStressLevel(currentHRV, avgHRV);
        const stressLevelEl = document.getElementById('stressLevel');
        if (!stressLevelEl) {
            console.warn('Element stressLevel not found');
            return;
        }
        stressLevelEl.textContent = stressLevel;

        if (data.resting_heart_rate) {
            const restingHREl = document.getElementById('restingHR');
            if (!restingHREl) {
                console.warn('Element restingHR not found');
                return;
            }
            restingHREl.textContent = `${data.resting_heart_rate} bpm`;
        }
    }

    /**
     * Render sleep data
     */
    renderSleepData(data) {
        // Check for empty state
        if (data.isEmpty) {
            const sleepScoreEl = document.getElementById('sleepScore');
            if (sleepScoreEl) {
                sleepScoreEl.textContent = '--';
            }
            const sleepDurationEl = document.getElementById('sleepDuration');
            if (sleepDurationEl) {
                sleepDurationEl.textContent = '--';
            }
            const deepSleepEl = document.getElementById('deepSleep');
            if (deepSleepEl) {
                deepSleepEl.textContent = '--';
            }
            const recoveryTimeEl = document.getElementById('recoveryTime');
            if (recoveryTimeEl) {
                recoveryTimeEl.textContent = data.message || 'Connect a wearable device';
            }
            return;
        }

        const sleepScore = data.score || data.sleep_score || 0;
        const totalSleep = data.total_sleep_minutes || data.duration || 0;
        const deepSleep = data.deep_sleep_minutes || data.deep || 0;
        const trend = data.trend || 0;

        const sleepScoreEl = document.getElementById('sleepScore');
        if (!sleepScoreEl) {
            console.warn('Element sleepScore not found');
            return;
        }
        sleepScoreEl.innerHTML = `
            ${Math.round(sleepScore)}
            ${trend > 0 ? '<span class="metric-trend trend-up">↑</span>' : ''}
            ${trend < 0 ? '<span class="metric-trend trend-down">↓</span>' : ''}
        `;

        const sleepDurationEl = document.getElementById('sleepDuration');
        if (!sleepDurationEl) {
            console.warn('Element sleepDuration not found');
            return;
        }
        sleepDurationEl.textContent = this.formatDuration(totalSleep);

        const deepSleepEl = document.getElementById('deepSleep');
        if (!deepSleepEl) {
            console.warn('Element deepSleep not found');
            return;
        }
        deepSleepEl.textContent = this.formatDuration(deepSleep);

        // Update recovery time based on sleep
        const recoveryTime = this.estimateRecoveryTime(sleepScore, totalSleep);
        const recoveryTimeEl = document.getElementById('recoveryTime');
        if (!recoveryTimeEl) {
            console.warn('Element recoveryTime not found');
            return;
        }
        recoveryTimeEl.textContent = recoveryTime;
    }

    /**
     * Render device list
     */
    renderDeviceList(connectedDevices) {
        const container = document.getElementById('wearablesList');
        if (!container) {
            console.warn('Element wearablesList not found');
            return;
        }

        const html = this.deviceTypes.map(device => {
            const isConnected = connectedDevices.some(d => d.type === device.id || d.id === device.id);

            return `
                <div class="wearable-card ${isConnected ? 'connected' : ''}"
                     onclick="window.mercuryDashboard.connectDevice('${device.id}', '${device.endpoint}')">
                    <div class="wearable-icon">${device.icon}</div>
                    <div class="wearable-name">${device.name}</div>
                    <div class="wearable-status ${isConnected ? 'connected' : ''}">
                        ${isConnected ? 'Connected' : 'Tap to connect'}
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
        if (!container) {
            console.warn('Element aiInsights not found');
            return;
        }

        // Check for empty state
        if (data.isEmpty) {
            container.innerHTML = `
                <div class="insight-item">
                    <span class="insight-icon">Info</span>
                    <span class="insight-text">${data.message || 'Connect a wearable device to see your health data'}</span>
                </div>
                <div class="connect-button" onclick="window.mercuryDashboard.showDeviceSetup()">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                </div>
            `;
            return;
        }

        // Extract insights array from response
        const insights = data.insights || data.items || data || [];

        if (!insights.length) {
            container.innerHTML = `
                <div class="insight-item">
                    <span class="insight-icon">Info</span>
                    <span class="insight-text">No insights available yet. Connect a device to get personalized recommendations.</span>
                </div>
            `;
            return;
        }

        const html = insights.slice(0, 5).map(insight => {
            const type = insight.type || insight.priority || 'info';
            const className = type === 'warning' ? 'warning' : (type === 'success' ? 'success' : '');
            const icon = type === 'warning' ? 'Warning' : (type === 'success' ? 'Success' : 'Insight');
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
        if (!container) {
            console.warn('Element hrvChart not found');
            return;
        }

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
            console.log(`Endpoint: ${this.apiBaseUrl}${endpoint}`);

            // For OAuth devices, redirect to authorization URL
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                method: 'POST',
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
                showToast(`${deviceId} connected successfully!`, 'success');
                this.loadDashboardData(); // Refresh
            }

        } catch (error) {
            console.error('Device connection error:', error);
            showToast(`Failed to connect device: ${error.message}`, 'error');
        }
    }

    /**
     * Show device setup modal
     */
    showDeviceSetup() {
        // Create modal for device connections
        const modal = document.createElement('div');
        modal.id = 'deviceSetupModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            padding: 20px;
        `;
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(0,40,60,0.95), rgba(0,20,40,0.98));
                        border-radius: 20px; padding: 30px; max-width: 400px; width: 100%;
                        border: 1px solid rgba(0,217,255,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 style="color: #00d9ff; margin: 0; font-size: 20px;">Connect Device</h2>
                    <button onclick="document.getElementById('deviceSetupModal').remove()"
                            style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">&times;</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="window.mercuryDashboard.connectWearable('whoop')" class="device-btn" style="
                        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 15px;
                        cursor: pointer; transition: all 0.3s;">
                        <div style="width: 40px; height: 40px; background: #00d9ff; border-radius: 8px;
                                    display: flex; align-items: center; justify-content: center; font-weight: bold; color: #000;">W</div>
                        <div style="text-align: left;">
                            <div style="color: #fff; font-weight: 600;">WHOOP</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Recovery, Strain, Sleep</div>
                        </div>
                    </button>

                    <button onclick="window.mercuryDashboard.connectWearable('oura')" class="device-btn" style="
                        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 15px;
                        cursor: pointer; transition: all 0.3s;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #c0a080, #806040); border-radius: 8px;
                                    display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">O</div>
                        <div style="text-align: left;">
                            <div style="color: #fff; font-weight: 600;">Oura Ring</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Readiness, Sleep, Activity</div>
                        </div>
                    </button>

                    <button onclick="window.mercuryDashboard.connectWearable('fitbit')" class="device-btn" style="
                        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 15px;
                        cursor: pointer; transition: all 0.3s;">
                        <div style="width: 40px; height: 40px; background: #00B0B9; border-radius: 8px;
                                    display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">F</div>
                        <div style="text-align: left;">
                            <div style="color: #fff; font-weight: 600;">Fitbit</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Steps, Heart Rate, Sleep</div>
                        </div>
                    </button>

                    <button onclick="window.mercuryDashboard.connectWearable('apple')" class="device-btn" style="
                        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 15px;
                        cursor: pointer; transition: all 0.3s;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ff6b6b, #ff8e53); border-radius: 8px;
                                    display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">♥</div>
                        <div style="text-align: left;">
                            <div style="color: #fff; font-weight: 600;">Apple Health</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">All HealthKit data</div>
                        </div>
                    </button>

                    <button onclick="window.mercuryDashboard.connectWearable('garmin')" class="device-btn" style="
                        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 15px;
                        cursor: pointer; transition: all 0.3s;">
                        <div style="width: 40px; height: 40px; background: #000; border-radius: 8px;
                                    display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">G</div>
                        <div style="text-align: left;">
                            <div style="color: #fff; font-weight: 600;">Garmin</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Training, Body Battery</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Connect wearable device via OAuth
     * Fitbit scopes: activity, heartrate, sleep, oxygen_saturation, respiratory_rate,
     *                temperature, weight, nutrition, electrocardiogram, cardio_fitness, profile
     */
    async connectWearable(provider) {
        const baseUrl = window.PhoenixConfig?.API_BASE_URL || 'https://pal-backend-production.up.railway.app/api';

        // Close modal first
        const modal = document.getElementById('deviceSetupModal');
        if (modal) modal.remove();

        // Apple Health is handled natively via Capacitor
        if (provider === 'apple') {
            if (window.Capacitor?.isNativePlatform()) {
                try {
                    // Request HealthKit permissions via Capacitor plugin
                    showToast('Requesting Apple Health permissions...', 'info');
                    // This would use @nicetransition/capacitor-healthkit or similar
                    const { CapacitorHealthkit } = await import('@nicetransition/capacitor-healthkit');
                    await CapacitorHealthkit.requestAuthorization({
                        all: ['steps', 'heartRate', 'sleepAnalysis', 'oxygenSaturation',
                              'respiratoryRate', 'bodyTemperature', 'weight', 'activeEnergyBurned',
                              'heartRateVariability', 'restingHeartRate', 'walkingHeartRateAverage']
                    });
                    showToast('Apple Health connected!', 'success');
                    this.loadDashboardData();
                } catch (e) {
                    showToast('Open Settings > Privacy > Health > Phoenix to enable', 'info');
                }
            } else {
                showToast('Apple Health requires the iOS app', 'info');
            }
            return;
        }

        try {
            // Get OAuth URL from backend - backend handles all scopes
            const response = await fetch(`${baseUrl}/mercury/devices/${provider}/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // Request ALL available scopes for comprehensive data
                    scopes: provider === 'fitbit' ? [
                        'activity', 'heartrate', 'sleep', 'oxygen_saturation',
                        'respiratory_rate', 'temperature', 'weight', 'nutrition',
                        'electrocardiogram', 'cardio_fitness', 'profile', 'settings',
                        'location' // For GPS workout data
                    ] : undefined, // Other providers handle scopes server-side
                    redirect_uri: window.location.origin + '/mercury.html?connected=' + provider
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Redirect to OAuth provider
                if (data.authUrl || data.url || data.authorization_url) {
                    window.location.href = data.authUrl || data.url || data.authorization_url;
                } else {
                    showToast(`${provider} connected!`, 'success');
                    this.loadDashboardData();
                }
            } else {
                const err = await response.json();
                showToast(err.message || `Failed to connect ${provider}`, 'error');
            }
        } catch (error) {
            console.error(`Connect ${provider} error:`, error);
            showToast(`Connect ${provider}: Check your network connection`, 'error');
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
                <div class="empty-state-icon"><span class="icon-lock">Locked</span></div>
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
                <div class="empty-state-icon"><span class="icon-warning">Warning</span></div>
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
