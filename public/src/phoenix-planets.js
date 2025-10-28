/**
 * 🪐 PHOENIX PLANETS - ALL 6 PLANET DASHBOARDS
 * 
 * Purpose: Comprehensive planet-based UI system
 * Size: ~8,000 lines
 * Dependencies: phoenix-core.js
 * 
 * PLANETS:
 * 1. Mercury - Health & Biometrics (DEXA, Recovery, Wearables)
 * 2. Venus - Fitness & Nutrition (Quantum Workouts, Meal Planning)
 * 3. Earth - Calendar & Energy (Energy Optimization, Scheduling)
 * 4. Mars - Goals & Progress (SMART Goals, Milestones, Habits)
 * 5. Jupiter - Finance (Spending, Stress Correlation, Budgets)
 * 6. Saturn - Life Vision (North Star, Purpose, Legacy)
 */

(function() {
    'use strict';

    // ============================================================================
    // MERCURY PLANET - HEALTH & BIOMETRICS
    // ============================================================================

    class MercuryPlanet {
        constructor() {
            this.currentView = 'dashboard';
            this.connectedDevices = [];
            this.latestRecovery = null;
            this.dexaData = null;
        }

        async render(container) {
            container.innerHTML = `
                <div class="planet-mercury">
                    <div class="planet-header">
                        <div class="planet-icon">☿</div>
                        <div class="planet-title">
                            <h1>Mercury</h1>
                            <p class="planet-subtitle">Health & Biometrics Intelligence</p>
                        </div>
                        <div class="planet-actions">
                            <button class="btn-primary" onclick="PhoenixPlanets.Mercury.syncAllDevices()">
                                🔄 Sync All Devices
                            </button>
                            <button class="btn-secondary" onclick="PhoenixPlanets.Mercury.showDeviceManager()">
                                📱 Manage Devices
                            </button>
                        </div>
                    </div>

                    <div class="mercury-nav">
                        <button class="nav-btn active" data-view="dashboard" onclick="PhoenixPlanets.Mercury.switchView('dashboard')">
                            📊 Dashboard
                        </button>
                        <button class="nav-btn" data-view="recovery" onclick="PhoenixPlanets.Mercury.switchView('recovery')">
                            💪 Recovery
                        </button>
                        <button class="nav-btn" data-view="biometrics" onclick="PhoenixPlanets.Mercury.switchView('biometrics')">
                            📈 Biometrics
                        </button>
                        <button class="nav-btn" data-view="dexa" onclick="PhoenixPlanets.Mercury.switchView('dexa')">
                            🔬 DEXA Scan
                        </button>
                        <button class="nav-btn" data-view="sleep" onclick="PhoenixPlanets.Mercury.switchView('sleep')">
                            😴 Sleep
                        </button>
                        <button class="nav-btn" data-view="devices" onclick="PhoenixPlanets.Mercury.switchView('devices')">
                            ⌚ Devices
                        </button>
                    </div>

                    <div id="mercury-content" class="planet-content">
                        <div class="loading-spinner">Loading Mercury data...</div>
                    </div>
                </div>
            `;

            await this.loadDashboard();
        }

        async switchView(view) {
            this.currentView = view;
            
            // Update nav
            document.querySelectorAll('.mercury-nav .nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === view) btn.classList.add('active');
            });

            // Load view
            const content = document.getElementById('mercury-content');
            content.innerHTML = '<div class="loading-spinner">Loading...</div>';

            switch(view) {
                case 'dashboard': await this.loadDashboard(); break;
                case 'recovery': await this.loadRecovery(); break;
                case 'biometrics': await this.loadBiometrics(); break;
                case 'dexa': await this.loadDexa(); break;
                case 'sleep': await this.loadSleep(); break;
                case 'devices': await this.loadDevices(); break;
            }
        }

        async loadDashboard() {
            const content = document.getElementById('mercury-content');
            
            try {
                // Load all dashboard data in parallel
                const [recovery, devices, hrv, sleep] = await Promise.all([
                    PhoenixCore.API.mercury.recovery.latest(),
                    PhoenixCore.API.mercury.devices.list(),
                    PhoenixCore.API.mercury.biometrics.hrv(),
                    PhoenixCore.API.mercury.sleep.latest()
                ]);

                this.latestRecovery = recovery;
                this.connectedDevices = devices;

                const recoveryScore = recovery?.score || 0;
                const recoveryColor = recoveryScore >= 70 ? '#00ff88' : recoveryScore >= 40 ? '#ffaa00' : '#ff4444';

                content.innerHTML = `
                    <div class="mercury-dashboard">
                        <!-- Recovery Score Hero -->
                        <div class="recovery-hero" style="border-color: ${recoveryColor}">
                            <div class="recovery-score">
                                <div class="score-value" style="color: ${recoveryColor}">${recoveryScore}</div>
                                <div class="score-label">Recovery Score</div>
                                <div class="score-date">${new Date(recovery?.date).toLocaleDateString()}</div>
                            </div>
                            <div class="recovery-ring">
                                <svg viewBox="0 0 200 200">
                                    <circle cx="100" cy="100" r="90" fill="none" stroke="#1a1a2e" stroke-width="10"/>
                                    <circle cx="100" cy="100" r="90" fill="none" stroke="${recoveryColor}" stroke-width="10"
                                            stroke-dasharray="${(recoveryScore / 100) * 565} 565" 
                                            stroke-linecap="round" transform="rotate(-90 100 100)"/>
                                </svg>
                            </div>
                            <div class="recovery-recommendation">
                                ${this.getRecoveryRecommendation(recoveryScore)}
                            </div>
                        </div>

                        <!-- Quick Stats Grid -->
                        <div class="quick-stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">❤️</div>
                                <div class="stat-value">${hrv?.latest?.value || '--'}</div>
                                <div class="stat-label">HRV (ms)</div>
                                <div class="stat-trend ${hrv?.trend > 0 ? 'up' : 'down'}">
                                    ${hrv?.trend > 0 ? '↑' : '↓'} ${Math.abs(hrv?.trend || 0)}%
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">😴</div>
                                <div class="stat-value">${this.formatDuration(sleep?.duration || 0)}</div>
                                <div class="stat-label">Sleep</div>
                                <div class="stat-score">${sleep?.score || '--'}/100</div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">🔥</div>
                                <div class="stat-value">${recovery?.readiness || '--'}</div>
                                <div class="stat-label">Readiness</div>
                                <div class="stat-status ${recovery?.readiness >= 70 ? 'optimal' : 'caution'}">
                                    ${recovery?.readiness >= 70 ? 'Optimal' : 'Caution'}
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">⚡</div>
                                <div class="stat-value">${recovery?.strain || '--'}</div>
                                <div class="stat-label">Strain</div>
                                <div class="stat-range">0-21 scale</div>
                            </div>
                        </div>

                        <!-- Connected Devices -->
                        <div class="connected-devices">
                            <h3>📱 Connected Devices</h3>
                            <div class="device-list">
                                ${devices.map(device => `
                                    <div class="device-card ${device.status === 'active' ? 'active' : 'inactive'}">
                                        <div class="device-icon">${this.getDeviceIcon(device.provider)}</div>
                                        <div class="device-info">
                                            <div class="device-name">${device.provider}</div>
                                            <div class="device-status">
                                                ${device.status === 'active' ? 
                                                    `Last sync: ${this.formatTimeAgo(device.lastSync)}` : 
                                                    'Disconnected'}
                                            </div>
                                        </div>
                                        <button class="btn-sync" onclick="PhoenixPlanets.Mercury.syncDevice('${device.provider}')">
                                            Sync
                                        </button>
                                    </div>
                                `).join('') || '<p class="no-devices">No devices connected. <a href="#" onclick="PhoenixPlanets.Mercury.showDeviceManager()">Connect a device</a></p>'}
                            </div>
                        </div>

                        <!-- Recent Insights -->
                        <div class="mercury-insights">
                            <h3>💡 Recent Insights</h3>
                            <div class="insights-list" id="mercury-insights-list">
                                <div class="loading-spinner">Loading insights...</div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="quick-actions">
                            <button class="action-btn" onclick="PhoenixPlanets.Mercury.recalculateRecovery()">
                                🔄 Recalculate Recovery
                            </button>
                            <button class="action-btn" onclick="PhoenixPlanets.Mercury.viewRecoveryHistory()">
                                📊 View History
                            </button>
                            <button class="action-btn" onclick="PhoenixPlanets.Mercury.exportData()">
                                💾 Export Data
                            </button>
                        </div>
                    </div>
                `;

                // Load insights
                this.loadInsights();

            } catch (error) {
                console.error('Error loading Mercury dashboard:', error);
                content.innerHTML = `
                    <div class="error-state">
                        <h3>Unable to load dashboard</h3>
                        <p>${error.message}</p>
                        <button onclick="PhoenixPlanets.Mercury.loadDashboard()">Retry</button>
                    </div>
                `;
            }
        }

        async loadRecovery() {
            const content = document.getElementById('mercury-content');
            
            try {
                const [dashboard, history, trends, protocols, debt] = await Promise.all([
                    PhoenixCore.API.mercury.recovery.dashboard(),
                    PhoenixCore.API.mercury.recovery.history({ days: 30 }),
                    PhoenixCore.API.mercury.recovery.trends(),
                    PhoenixCore.API.mercury.recovery.protocols(),
                    PhoenixCore.API.mercury.recovery.debt()
                ]);

                content.innerHTML = `
                    <div class="recovery-view">
                        <div class="recovery-header">
                            <h2>💪 Recovery Intelligence</h2>
                            <p>AI-powered recovery tracking and optimization</p>
                        </div>

                        <!-- Recovery Dashboard -->
                        <div class="recovery-cards">
                            <div class="recovery-card main">
                                <h3>Today's Recovery</h3>
                                <div class="recovery-gauge">
                                    <canvas id="recovery-gauge-canvas"></canvas>
                                    <div class="gauge-value">${dashboard.score}</div>
                                </div>
                                <div class="recovery-factors">
                                    <div class="factor">
                                        <span>Sleep Quality</span>
                                        <div class="factor-bar">
                                            <div class="factor-fill" style="width: ${dashboard.factors?.sleep || 0}%"></div>
                                        </div>
                                        <span>${dashboard.factors?.sleep || 0}%</span>
                                    </div>
                                    <div class="factor">
                                        <span>HRV</span>
                                        <div class="factor-bar">
                                            <div class="factor-fill" style="width: ${dashboard.factors?.hrv || 0}%"></div>
                                        </div>
                                        <span>${dashboard.factors?.hrv || 0}%</span>
                                    </div>
                                    <div class="factor">
                                        <span>Resting HR</span>
                                        <div class="factor-bar">
                                            <div class="factor-fill" style="width: ${dashboard.factors?.rhr || 0}%"></div>
                                        </div>
                                        <span>${dashboard.factors?.rhr || 0}%</span>
                                    </div>
                                    <div class="factor">
                                        <span>Strain</span>
                                        <div class="factor-bar">
                                            <div class="factor-fill" style="width: ${dashboard.factors?.strain || 0}%"></div>
                                        </div>
                                        <span>${dashboard.factors?.strain || 0}%</span>
                                    </div>
                                </div>
                            </div>

                            <div class="recovery-card">
                                <h3>Recovery Debt</h3>
                                <div class="debt-indicator ${debt.level}">
                                    <div class="debt-value">${debt.hours}h</div>
                                    <div class="debt-label">${debt.level}</div>
                                </div>
                                <p class="debt-description">${debt.description}</p>
                                <button class="btn-primary" onclick="PhoenixPlanets.Mercury.planRecovery()">
                                    Plan Recovery
                                </button>
                            </div>

                            <div class="recovery-card">
                                <h3>Training Load</h3>
                                <div class="load-chart">
                                    <canvas id="training-load-chart"></canvas>
                                </div>
                                <div class="load-stats">
                                    <div class="load-stat">
                                        <span>Acute</span>
                                        <strong>${dashboard.trainingLoad?.acute || 0}</strong>
                                    </div>
                                    <div class="load-stat">
                                        <span>Chronic</span>
                                        <strong>${dashboard.trainingLoad?.chronic || 0}</strong>
                                    </div>
                                    <div class="load-stat">
                                        <span>Ratio</span>
                                        <strong>${dashboard.trainingLoad?.ratio?.toFixed(2) || 0}</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="recovery-card">
                                <h3>Overtraining Risk</h3>
                                <div class="risk-meter">
                                    <div class="risk-level ${dashboard.overtrainingRisk?.level}">
                                        ${dashboard.overtrainingRisk?.percentage || 0}%
                                    </div>
                                    <div class="risk-label">${dashboard.overtrainingRisk?.level || 'Unknown'}</div>
                                </div>
                                ${dashboard.overtrainingRisk?.warning ? 
                                    `<div class="risk-warning">⚠️ ${dashboard.overtrainingRisk.warning}</div>` : 
                                    ''}
                            </div>
                        </div>

                        <!-- Recovery History Chart -->
                        <div class="recovery-history">
                            <h3>30-Day Recovery Trend</h3>
                            <div class="chart-container">
                                <canvas id="recovery-history-chart"></canvas>
                            </div>
                        </div>

                        <!-- Recovery Protocols -->
                        <div class="recovery-protocols">
                            <h3>🛠️ Recommended Protocols</h3>
                            <div class="protocols-grid">
                                ${protocols.map(protocol => `
                                    <div class="protocol-card">
                                        <div class="protocol-icon">${protocol.icon}</div>
                                        <h4>${protocol.name}</h4>
                                        <p>${protocol.description}</p>
                                        <div class="protocol-benefits">
                                            ${protocol.benefits.map(b => `<span class="benefit-tag">${b}</span>`).join('')}
                                        </div>
                                        <button class="btn-outline" onclick="PhoenixPlanets.Mercury.startProtocol('${protocol.id}')">
                                            Start Protocol
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Recovery Insights -->
                        <div class="recovery-insights">
                            <h3>💡 AI Insights</h3>
                            <div class="insights-grid">
                                ${dashboard.insights?.map(insight => `
                                    <div class="insight-card ${insight.type}">
                                        <div class="insight-icon">${insight.icon}</div>
                                        <div class="insight-content">
                                            <h4>${insight.title}</h4>
                                            <p>${insight.message}</p>
                                            ${insight.action ? 
                                                `<button class="insight-action" onclick="${insight.action}">
                                                    ${insight.actionLabel}
                                                </button>` : 
                                                ''}
                                        </div>
                                    </div>
                                `).join('') || '<p>No insights available yet</p>'}
                            </div>
                        </div>
                    </div>
                `;

                // Render charts
                this.renderRecoveryCharts(dashboard, history, trends);

            } catch (error) {
                console.error('Error loading recovery view:', error);
                content.innerHTML = `<div class="error-state">Error loading recovery data: ${error.message}</div>`;
            }
        }

        async loadBiometrics() {
            const content = document.getElementById('mercury-content');
            
            try {
                const [composition, metabolic, ratios, trends, correlations, hrv, heartRate] = await Promise.all([
                    PhoenixCore.API.mercury.biometrics.composition(),
                    PhoenixCore.API.mercury.biometrics.metabolic(),
                    PhoenixCore.API.mercury.biometrics.ratios(),
                    PhoenixCore.API.mercury.biometrics.trends(),
                    PhoenixCore.API.mercury.biometrics.correlations(),
                    PhoenixCore.API.mercury.biometrics.hrvDeepAnalysis(),
                    PhoenixCore.API.mercury.biometrics.heartRate()
                ]);

                content.innerHTML = `
                    <div class="biometrics-view">
                        <div class="biometrics-header">
                            <h2>📈 Biometric Intelligence</h2>
                            <div class="header-actions">
                                <button class="btn-secondary" onclick="PhoenixPlanets.Mercury.manualEntry()">
                                    ➕ Manual Entry
                                </button>
                                <button class="btn-primary" onclick="PhoenixPlanets.Mercury.analyzeCorrelations()">
                                    🔍 Analyze Correlations
                                </button>
                            </div>
                        </div>

                        <!-- Body Composition -->
                        <div class="composition-section">
                            <h3>Body Composition</h3>
                            <div class="composition-grid">
                                <div class="comp-card">
                                    <div class="comp-icon">⚖️</div>
                                    <div class="comp-value">${composition.weight} ${composition.unit}</div>
                                    <div class="comp-label">Weight</div>
                                    <div class="comp-change ${composition.weightChange > 0 ? 'up' : 'down'}">
                                        ${composition.weightChange > 0 ? '+' : ''}${composition.weightChange}
                                    </div>
                                </div>

                                <div class="comp-card">
                                    <div class="comp-icon">💪</div>
                                    <div class="comp-value">${composition.muscleMass} kg</div>
                                    <div class="comp-label">Muscle Mass</div>
                                    <div class="comp-percentage">${composition.muscleMassPercent}%</div>
                                </div>

                                <div class="comp-card">
                                    <div class="comp-icon">🔥</div>
                                    <div class="comp-value">${composition.bodyFat}%</div>
                                    <div class="comp-label">Body Fat</div>
                                    <div class="comp-status ${composition.bodyFatStatus}">${composition.bodyFatStatus}</div>
                                </div>

                                <div class="comp-card">
                                    <div class="comp-icon">💧</div>
                                    <div class="comp-value">${composition.hydration}%</div>
                                    <div class="comp-label">Hydration</div>
                                    <div class="comp-status ${composition.hydrationStatus}">${composition.hydrationStatus}</div>
                                </div>

                                <div class="comp-card">
                                    <div class="comp-icon">🦴</div>
                                    <div class="comp-value">${composition.boneDensity}</div>
                                    <div class="comp-label">Bone Density</div>
                                    <div class="comp-zscore">Z-Score: ${composition.boneDensityZScore}</div>
                                </div>

                                <div class="comp-card">
                                    <div class="comp-icon">🫀</div>
                                    <div class="comp-value">${composition.visceralFat}</div>
                                    <div class="comp-label">Visceral Fat</div>
                                    <div class="comp-risk ${composition.visceralFatRisk}">${composition.visceralFatRisk}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Metabolic Rate -->
                        <div class="metabolic-section">
                            <h3>Metabolic Profile</h3>
                            <div class="metabolic-cards">
                                <div class="metabolic-card">
                                    <h4>Basal Metabolic Rate</h4>
                                    <div class="metabolic-value">${metabolic.bmr} cal/day</div>
                                    <p>Calories burned at rest</p>
                                </div>
                                <div class="metabolic-card">
                                    <h4>Total Daily Energy</h4>
                                    <div class="metabolic-value">${metabolic.tdee} cal/day</div>
                                    <p>Total calories with activity</p>
                                </div>
                                <div class="metabolic-card">
                                    <h4>Metabolic Age</h4>
                                    <div class="metabolic-value">${metabolic.metabolicAge} years</div>
                                    <p>${metabolic.metabolicAge < metabolic.chronologicalAge ? 'Younger than biological age! 🎉' : 'Room for improvement'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Health Ratios -->
                        <div class="ratios-section">
                            <h3>Health Ratios</h3>
                            <div class="ratios-grid">
                                ${Object.entries(ratios).map(([key, ratio]) => `
                                    <div class="ratio-card">
                                        <div class="ratio-name">${ratio.name}</div>
                                        <div class="ratio-value ${ratio.status}">${ratio.value}</div>
                                        <div class="ratio-range">
                                            Optimal: ${ratio.optimal}
                                        </div>
                                        <div class="ratio-bar">
                                            <div class="ratio-fill ${ratio.status}" style="width: ${ratio.percentage}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- HRV Deep Analysis -->
                        <div class="hrv-deep-section">
                            <h3>❤️ HRV Deep Analysis</h3>
                            <div class="hrv-analysis">
                                <div class="hrv-summary">
                                    <div class="hrv-current">
                                        <div class="hrv-value">${hrv.current} ms</div>
                                        <div class="hrv-label">Current HRV</div>
                                    </div>
                                    <div class="hrv-baseline">
                                        <div class="hrv-value">${hrv.baseline} ms</div>
                                        <div class="hrv-label">Your Baseline</div>
                                    </div>
                                    <div class="hrv-status ${hrv.status}">
                                        ${hrv.status.toUpperCase()}
                                    </div>
                                </div>
                                <div class="hrv-chart">
                                    <canvas id="hrv-chart"></canvas>
                                </div>
                                <div class="hrv-insights">
                                    <h4>What This Means:</h4>
                                    <ul>
                                        ${hrv.insights.map(insight => `<li>${insight}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Correlations -->
                        <div class="correlations-section">
                            <h3>🔗 Biometric Correlations</h3>
                            <div class="correlations-matrix">
                                ${correlations.map(corr => `
                                    <div class="correlation-card">
                                        <div class="corr-header">
                                            <span>${corr.metric1}</span>
                                            <span class="corr-arrow">↔️</span>
                                            <span>${corr.metric2}</span>
                                        </div>
                                        <div class="corr-strength ${corr.strength}">
                                            ${corr.coefficient > 0 ? '+' : ''}${(corr.coefficient * 100).toFixed(1)}%
                                        </div>
                                        <div class="corr-description">${corr.description}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Trends -->
                        <div class="trends-section">
                            <h3>📊 Long-term Trends</h3>
                            <div class="trends-charts">
                                <canvas id="biometric-trends-chart"></canvas>
                            </div>
                        </div>
                    </div>
                `;

                // Render charts
                this.renderBiometricCharts(hrv, trends);

            } catch (error) {
                console.error('Error loading biometrics:', error);
                content.innerHTML = `<div class="error-state">Error loading biometrics: ${error.message}</div>`;
            }
        }

        async loadDexa() {
            const content = document.getElementById('mercury-content');
            
            try {
                const dexa = await PhoenixCore.API.mercury.biometrics.dexa();
                this.dexaData = dexa;

                content.innerHTML = `
                    <div class="dexa-view">
                        <div class="dexa-header">
                            <h2>🔬 DEXA Scan Analysis</h2>
                            <p>Gold-standard body composition measurement</p>
                            ${dexa.scans.length > 0 ? 
                                `<div class="scan-date">Latest: ${new Date(dexa.scans[0].date).toLocaleDateString()}</div>` : 
                                ''}
                        </div>

                        ${dexa.scans.length === 0 ? `
                            <div class="empty-state">
                                <div class="empty-icon">🔬</div>
                                <h3>No DEXA Scans Yet</h3>
                                <p>DEXA scans provide the most accurate body composition data available.</p>
                                <button class="btn-primary" onclick="PhoenixPlanets.Mercury.scheduleDexaScan()">
                                    Schedule DEXA Scan
                                </button>
                            </div>
                        ` : `
                            <!-- Body Visualization -->
                            <div class="dexa-visualization">
                                <div class="body-model">
                                    <svg viewBox="0 0 400 800" id="dexa-body-svg">
                                        <!-- Body outline with color-coded regions -->
                                        <defs>
                                            <linearGradient id="fatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:0.7" />
                                                <stop offset="100%" style="stop-color:#ffd93d;stop-opacity:0.7" />
                                            </linearGradient>
                                            <linearGradient id="muscleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#00d2ff;stop-opacity:0.7" />
                                                <stop offset="100%" style="stop-color:#3a7bd5;stop-opacity:0.7" />
                                            </linearGradient>
                                        </defs>
                                        ${this.renderDexaBodyModel(dexa.scans[0])}
                                    </svg>
                                </div>

                                <div class="dexa-legend">
                                    <div class="legend-item">
                                        <div class="legend-color muscle"></div>
                                        <span>Muscle Mass</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color fat"></div>
                                        <span>Fat Mass</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color bone"></div>
                                        <span>Bone Mass</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Detailed Metrics -->
                            <div class="dexa-metrics">
                                <div class="metric-group">
                                    <h3>Total Body Composition</h3>
                                    <div class="metrics-grid">
                                        <div class="metric-card">
                                            <div class="metric-label">Total Mass</div>
                                            <div class="metric-value">${dexa.scans[0].totalMass} kg</div>
                                        </div>
                                        <div class="metric-card">
                                            <div class="metric-label">Lean Mass</div>
                                            <div class="metric-value">${dexa.scans[0].leanMass} kg</div>
                                            <div class="metric-percent">${dexa.scans[0].leanPercent}%</div>
                                        </div>
                                        <div class="metric-card">
                                            <div class="metric-label">Fat Mass</div>
                                            <div class="metric-value">${dexa.scans[0].fatMass} kg</div>
                                            <div class="metric-percent">${dexa.scans[0].fatPercent}%</div>
                                        </div>
                                        <div class="metric-card">
                                            <div class="metric-label">Bone Mass</div>
                                            <div class="metric-value">${dexa.scans[0].boneMass} kg</div>
                                            <div class="metric-percent">${dexa.scans[0].bonePercent}%</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="metric-group">
                                    <h3>Regional Analysis</h3>
                                    <div class="regions-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Region</th>
                                                    <th>Lean (kg)</th>
                                                    <th>Fat (kg)</th>
                                                    <th>Fat %</th>
                                                    <th>Assessment</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${this.renderRegionalData(dexa.scans[0].regions)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div class="metric-group">
                                    <h3>Visceral Adipose Tissue (VAT)</h3>
                                    <div class="vat-analysis">
                                        <div class="vat-value ${dexa.scans[0].vat.risk}">
                                            ${dexa.scans[0].vat.area} cm²
                                        </div>
                                        <div class="vat-gauge">
                                            <div class="gauge-bar">
                                                <div class="gauge-fill ${dexa.scans[0].vat.risk}" 
                                                     style="width: ${Math.min((dexa.scans[0].vat.area / 200) * 100, 100)}%">
                                                </div>
                                            </div>
                                            <div class="gauge-labels">
                                                <span>Low</span>
                                                <span>Normal</span>
                                                <span>High</span>
                                            </div>
                                        </div>
                                        <div class="vat-info">
                                            <strong>Risk Level:</strong> ${dexa.scans[0].vat.risk}<br>
                                            ${dexa.scans[0].vat.description}
                                        </div>
                                    </div>
                                </div>

                                ${dexa.scans.length > 1 ? `
                                    <div class="metric-group">
                                        <h3>Progress Tracking</h3>
                                        <div class="progress-chart">
                                            <canvas id="dexa-progress-chart"></canvas>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- AI Insights -->
                            <div class="dexa-insights">
                                <h3>💡 AI-Powered Insights</h3>
                                <div class="insights-list">
                                    ${dexa.insights.map(insight => `
                                        <div class="insight-item ${insight.type}">
                                            <div class="insight-icon">${insight.icon}</div>
                                            <div class="insight-content">
                                                <h4>${insight.title}</h4>
                                                <p>${insight.message}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Recommendations -->
                            <div class="dexa-recommendations">
                                <h3>📋 Personalized Recommendations</h3>
                                <div class="recommendations-grid">
                                    ${dexa.recommendations.map(rec => `
                                        <div class="recommendation-card">
                                            <div class="rec-icon">${rec.icon}</div>
                                            <h4>${rec.title}</h4>
                                            <p>${rec.description}</p>
                                            <button class="btn-outline" onclick="${rec.action}">
                                                ${rec.actionLabel}
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="dexa-actions">
                                <button class="btn-primary" onclick="PhoenixPlanets.Mercury.scheduleDexaScan()">
                                    Schedule Next Scan
                                </button>
                                <button class="btn-secondary" onclick="PhoenixPlanets.Mercury.exportDexaReport()">
                                    Export Report
                                </button>
                                <button class="btn-secondary" onclick="PhoenixPlanets.Mercury.shareDexaData()">
                                    Share with Trainer
                                </button>
                            </div>
                        `}
                    </div>
                `;

                if (dexa.scans.length > 1) {
                    this.renderDexaProgressChart(dexa.scans);
                }

            } catch (error) {
                console.error('Error loading DEXA data:', error);
                content.innerHTML = `<div class="error-state">Error loading DEXA data: ${error.message}</div>`;
            }
        }

        async loadSleep() {
            const content = document.getElementById('mercury-content');
            
            try {
                const [sleep, analysis, recommendations] = await Promise.all([
                    PhoenixCore.API.mercury.sleep.latest(),
                    PhoenixCore.API.mercury.sleep.analysis(),
                    PhoenixCore.API.mercury.sleep.recommendations()
                ]);

                content.innerHTML = `
                    <div class="sleep-view">
                        <div class="sleep-header">
                            <h2>😴 Sleep Intelligence</h2>
                            <p>Deep sleep analysis and optimization</p>
                        </div>

                        <!-- Sleep Score -->
                        <div class="sleep-score-card">
                            <div class="score-circle">
                                <svg viewBox="0 0 200 200">
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#1a1a2e" stroke-width="15"/>
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#6366f1" stroke-width="15"
                                            stroke-dasharray="${(sleep.score / 100) * 502} 502" 
                                            stroke-linecap="round" transform="rotate(-90 100 100)"/>
                                </svg>
                                <div class="score-text">
                                    <div class="score-number">${sleep.score}</div>
                                    <div class="score-label">Sleep Score</div>
                                </div>
                            </div>
                            <div class="sleep-summary">
                                <div class="summary-item">
                                    <span class="summary-label">Duration</span>
                                    <span class="summary-value">${this.formatDuration(sleep.duration)}</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Bedtime</span>
                                    <span class="summary-value">${sleep.bedtime}</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Wake Time</span>
                                    <span class="summary-value">${sleep.wakeTime}</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Efficiency</span>
                                    <span class="summary-value">${sleep.efficiency}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Sleep Stages -->
                        <div class="sleep-stages">
                            <h3>Sleep Stages</h3>
                            <div class="stages-chart">
                                <canvas id="sleep-stages-chart"></canvas>
                            </div>
                            <div class="stages-breakdown">
                                <div class="stage-item">
                                    <div class="stage-color awake"></div>
                                    <div class="stage-info">
                                        <div class="stage-name">Awake</div>
                                        <div class="stage-duration">${this.formatDuration(sleep.stages.awake)}</div>
                                        <div class="stage-percent">${sleep.stages.awakePercent}%</div>
                                    </div>
                                </div>
                                <div class="stage-item">
                                    <div class="stage-color rem"></div>
                                    <div class="stage-info">
                                        <div class="stage-name">REM</div>
                                        <div class="stage-duration">${this.formatDuration(sleep.stages.rem)}</div>
                                        <div class="stage-percent">${sleep.stages.remPercent}%</div>
                                    </div>
                                </div>
                                <div class="stage-item">
                                    <div class="stage-color light"></div>
                                    <div class="stage-info">
                                        <div class="stage-name">Light</div>
                                        <div class="stage-duration">${this.formatDuration(sleep.stages.light)}</div>
                                        <div class="stage-percent">${sleep.stages.lightPercent}%</div>
                                    </div>
                                </div>
                                <div class="stage-item">
                                    <div class="stage-color deep"></div>
                                    <div class="stage-info">
                                        <div class="stage-name">Deep</div>
                                        <div class="stage-duration">${this.formatDuration(sleep.stages.deep)}</div>
                                        <div class="stage-percent">${sleep.stages.deepPercent}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sleep Analysis -->
                        <div class="sleep-analysis">
                            <h3>Detailed Analysis</h3>
                            <div class="analysis-grid">
                                <div class="analysis-card">
                                    <h4>Heart Rate</h4>
                                    <div class="analysis-chart">
                                        <canvas id="sleep-hr-chart"></canvas>
                                    </div>
                                    <div class="analysis-stats">
                                        <span>Average: ${analysis.heartRate.average} bpm</span>
                                        <span>Lowest: ${analysis.heartRate.lowest} bpm</span>
                                    </div>
                                </div>

                                <div class="analysis-card">
                                    <h4>Respiratory Rate</h4>
                                    <div class="analysis-chart">
                                        <canvas id="sleep-rr-chart"></canvas>
                                    </div>
                                    <div class="analysis-stats">
                                        <span>Average: ${analysis.respiratoryRate.average} br/min</span>
                                    </div>
                                </div>

                                <div class="analysis-card">
                                    <h4>Movement</h4>
                                    <div class="movement-indicator">
                                        <div class="movement-level ${analysis.movement.level}">
                                            ${analysis.movement.count} movements
                                        </div>
                                        <div class="movement-description">${analysis.movement.description}</div>
                                    </div>
                                </div>

                                <div class="analysis-card">
                                    <h4>Sleep Debt</h4>
                                    <div class="debt-gauge">
                                        <div class="debt-value ${analysis.debt.level}">
                                            ${this.formatDuration(analysis.debt.hours)}
                                        </div>
                                        <div class="debt-description">${analysis.debt.description}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sleep Recommendations -->
                        <div class="sleep-recommendations">
                            <h3>💡 Personalized Recommendations</h3>
                            <div class="recommendations-list">
                                ${recommendations.map(rec => `
                                    <div class="recommendation-item ${rec.priority}">
                                        <div class="rec-icon">${rec.icon}</div>
                                        <div class="rec-content">
                                            <h4>${rec.title}</h4>
                                            <p>${rec.description}</p>
                                            <div class="rec-impact">
                                                <span>Expected Impact:</span>
                                                <strong>${rec.impact}</strong>
                                            </div>
                                        </div>
                                        <button class="rec-action" onclick="${rec.action}">
                                            ${rec.actionLabel}
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Sleep History -->
                        <div class="sleep-history">
                            <h3>30-Day Sleep Trend</h3>
                            <div class="history-chart">
                                <canvas id="sleep-history-chart"></canvas>
                            </div>
                        </div>
                    </div>
                `;

                // Render charts
                this.renderSleepCharts(sleep, analysis);

            } catch (error) {
                console.error('Error loading sleep data:', error);
                content.innerHTML = `<div class="error-state">Error loading sleep data: ${error.message}</div>`;
            }
        }

        async loadDevices() {
            const content = document.getElementById('mercury-content');
            
            try {
                const devices = await PhoenixCore.API.mercury.devices.list();
                const availableProviders = ['oura', 'fitbit', 'whoop', 'garmin', 'apple_health', 'polar'];

                content.innerHTML = `
                    <div class="devices-view">
                        <div class="devices-header">
                            <h2>📱 Device Management</h2>
                            <p>Connect and manage your wearable devices</p>
                        </div>

                        <!-- Connected Devices -->
                        <div class="connected-devices-section">
                            <h3>Connected Devices</h3>
                            ${devices.length > 0 ? `
                                <div class="devices-grid">
                                    ${devices.map(device => `
                                        <div class="device-card ${device.status}">
                                            <div class="device-header">
                                                <div class="device-logo">${this.getDeviceIcon(device.provider)}</div>
                                                <div class="device-status-badge ${device.status}">
                                                    ${device.status === 'active' ? '✓ Connected' : '⚠️ Disconnected'}
                                                </div>
                                            </div>
                                            <div class="device-info">
                                                <h4>${device.provider}</h4>
                                                <div class="device-meta">
                                                    <span>Connected: ${new Date(device.connectedAt).toLocaleDateString()}</span>
                                                    <span>Last Sync: ${this.formatTimeAgo(device.lastSync)}</span>
                                                </div>
                                                <div class="device-data-types">
                                                    ${device.dataTypes.map(type => `<span class="data-type-tag">${type}</span>`).join('')}
                                                </div>
                                            </div>
                                            <div class="device-actions">
                                                <button class="btn-primary" onclick="PhoenixPlanets.Mercury.syncDevice('${device.provider}')">
                                                    🔄 Sync Now
                                                </button>
                                                <button class="btn-outline" onclick="PhoenixPlanets.Mercury.viewDeviceData('${device.provider}')">
                                                    📊 View Data
                                                </button>
                                                <button class="btn-danger" onclick="PhoenixPlanets.Mercury.disconnectDevice('${device.provider}')">
                                                    🔌 Disconnect
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="empty-state">
                                    <div class="empty-icon">📱</div>
                                    <h3>No Devices Connected</h3>
                                    <p>Connect a wearable device to start tracking your health data</p>
                                </div>
                            `}
                        </div>

                        <!-- Available Devices -->
                        <div class="available-devices-section">
                            <h3>Available Devices</h3>
                            <div class="providers-grid">
                                ${availableProviders.map(provider => {
                                    const isConnected = devices.some(d => d.provider === provider);
                                    return `
                                        <div class="provider-card ${isConnected ? 'connected' : ''}">
                                            <div class="provider-logo">${this.getDeviceIcon(provider)}</div>
                                            <div class="provider-info">
                                                <h4>${provider}</h4>
                                                <p>${this.getDeviceDescription(provider)}</p>
                                                <div class="provider-features">
                                                    ${this.getDeviceFeatures(provider).map(f => `<span class="feature-tag">${f}</span>`).join('')}
                                                </div>
                                            </div>
                                            ${!isConnected ? `
                                                <button class="btn-primary" onclick="PhoenixPlanets.Mercury.connectDevice('${provider}')">
                                                    Connect
                                                </button>
                                            ` : `
                                                <div class="connected-badge">✓ Connected</div>
                                            `}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Data Sync Status -->
                        <div class="sync-status-section">
                            <h3>Data Sync Status</h3>
                            <div class="sync-timeline">
                                <div class="timeline-item">
                                    <div class="timeline-icon">✓</div>
                                    <div class="timeline-content">
                                        <h4>Last Successful Sync</h4>
                                        <p>${devices.length > 0 ? this.formatTimeAgo(Math.max(...devices.map(d => new Date(d.lastSync)))) : 'No syncs yet'}</p>
                                    </div>
                                </div>
                                <div class="timeline-item">
                                    <div class="timeline-icon">📊</div>
                                    <div class="timeline-content">
                                        <h4>Data Points Collected</h4>
                                        <p>${devices.reduce((sum, d) => sum + (d.dataPointsCollected || 0), 0).toLocaleString()} total</p>
                                    </div>
                                </div>
                                <div class="timeline-item">
                                    <div class="timeline-icon">🔄</div>
                                    <div class="timeline-content">
                                        <h4>Auto-Sync</h4>
                                        <p>Every 4 hours</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Manual Data Entry -->
                        <div class="manual-entry-section">
                            <h3>Manual Data Entry</h3>
                            <p>Don't have a wearable? You can still track your data manually.</p>
                            <button class="btn-outline" onclick="PhoenixPlanets.Mercury.manualEntry()">
                                ➕ Add Manual Entry
                            </button>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading devices:', error);
                content.innerHTML = `<div class="error-state">Error loading devices: ${error.message}</div>`;
            }
        }

        // Helper Methods
        getRecoveryRecommendation(score) {
            if (score >= 80) return '🚀 Peak Performance - Train Hard!';
            if (score >= 60) return '💪 Good to Go - Normal Training';
            if (score >= 40) return '⚠️ Active Recovery - Light Activity';
            return '🛑 Rest Day - Focus on Recovery';
        }

        getDeviceIcon(provider) {
            const icons = {
                oura: '💍',
                fitbit: '⌚',
                whoop: '📿',
                garmin: '⌚',
                apple_health: '🍎',
                polar: '⚡'
            };
            return icons[provider] || '📱';
        }

        getDeviceDescription(provider) {
            const descriptions = {
                oura: 'Sleep & recovery tracking ring',
                fitbit: 'All-day activity & health tracking',
                whoop: 'Performance optimization strap',
                garmin: 'GPS & fitness tracking',
                apple_health: 'Comprehensive health data',
                polar: 'Training & recovery analysis'
            };
            return descriptions[provider] || 'Wearable device';
        }

        getDeviceFeatures(provider) {
            const features = {
                oura: ['Sleep', 'Recovery', 'HRV', 'Temperature'],
                fitbit: ['Activity', 'Heart Rate', 'Sleep', 'Calories'],
                whoop: ['Strain', 'Recovery', 'Sleep', 'HRV'],
                garmin: ['GPS', 'Heart Rate', 'Training', 'VO2 Max'],
                apple_health: ['All Metrics', 'Workouts', 'Nutrition', 'Sleep'],
                polar: ['Training Load', 'Recovery', 'Sleep', 'Running Power']
            };
            return features[provider] || ['Health Tracking'];
        }

        formatDuration(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }

        formatTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
        }

        renderDexaBodyModel(scan) {
            // SVG body model with regional data visualization
            return `
                <!-- Head -->
                <ellipse cx="200" cy="50" rx="30" ry="40" fill="url(#muscleGradient)" opacity="0.8"/>
                
                <!-- Torso -->
                <rect x="150" y="90" width="100" height="150" rx="20" fill="url(#fatGradient)" opacity="${scan.regions.trunk.fatPercent / 100}"/>
                <rect x="160" y="100" width="80" height="130" rx="15" fill="url(#muscleGradient)" opacity="${scan.regions.trunk.leanPercent / 100}"/>
                
                <!-- Arms -->
                <rect x="100" y="100" width="40" height="120" rx="20" fill="url(#muscleGradient)" opacity="${scan.regions.leftArm.leanPercent / 100}"/>
                <rect x="260" y="100" width="40" height="120" rx="20" fill="url(#muscleGradient)" opacity="${scan.regions.rightArm.leanPercent / 100}"/>
                
                <!-- Legs -->
                <rect x="160" y="250" width="35" height="150" rx="20" fill="url(#muscleGradient)" opacity="${scan.regions.leftLeg.leanPercent / 100}"/>
                <rect x="205" y="250" width="35" height="150" rx="20" fill="url(#muscleGradient)" opacity="${scan.regions.rightLeg.leanPercent / 100}"/>
                
                <!-- Annotations -->
                <text x="200" y="30" text-anchor="middle" fill="#00ff88" font-size="12">Head</text>
                <text x="200" y="165" text-anchor="middle" fill="#00ff88" font-size="12">Trunk: ${scan.regions.trunk.fatPercent}% fat</text>
                <text x="70" y="160" text-anchor="middle" fill="#00ff88" font-size="10">L Arm</text>
                <text x="330" y="160" text-anchor="middle" fill="#00ff88" font-size="10">R Arm</text>
                <text x="177" y="330" text-anchor="middle" fill="#00ff88" font-size="10">L Leg</text>
                <text x="222" y="330" text-anchor="middle" fill="#00ff88" font-size="10">R Leg</text>
            `;
        }

        renderRegionalData(regions) {
            return Object.entries(regions).map(([name, data]) => `
                <tr>
                    <td>${name}</td>
                    <td>${data.lean} kg</td>
                    <td>${data.fat} kg</td>
                    <td>${data.fatPercent}%</td>
                    <td class="assessment ${data.assessment.toLowerCase()}">
                        ${data.assessment}
                    </td>
                </tr>
            `).join('');
        }

        async loadInsights() {
            try {
                const insights = await PhoenixCore.API.mercury.insights();
                const container = document.getElementById('mercury-insights-list');
                
                if (insights.length === 0) {
                    container.innerHTML = '<p class="no-insights">No new insights yet. Keep tracking!</p>';
                    return;
                }

                container.innerHTML = insights.map(insight => `
                    <div class="insight-card ${insight.type}">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-content">
                            <h4>${insight.title}</h4>
                            <p>${insight.message}</p>
                            <div class="insight-meta">
                                <span>${this.formatTimeAgo(insight.timestamp)}</span>
                                ${insight.confidence ? `<span>Confidence: ${insight.confidence}%</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading insights:', error);
            }
        }

        async syncDevice(provider) {
            try {
                showToast('Syncing device...', 'info');
                await PhoenixCore.API.mercury.devices.sync(provider);
                showToast('Device synced successfully!', 'success');
                await this.loadDashboard();
            } catch (error) {
                showToast('Failed to sync device: ' + error.message, 'error');
            }
        }

        async syncAllDevices() {
            try {
                showToast('Syncing all devices...', 'info');
                const devices = await PhoenixCore.API.mercury.devices.list();
                await Promise.all(devices.map(d => PhoenixCore.API.mercury.devices.sync(d.provider)));
                showToast('All devices synced!', 'success');
                await this.loadDashboard();
            } catch (error) {
                showToast('Failed to sync some devices: ' + error.message, 'error');
            }
        }

        async connectDevice(provider) {
            try {
                const authUrl = await PhoenixCore.API.mercury.devices.connect(provider);
                window.location.href = authUrl;
            } catch (error) {
                showToast('Failed to connect device: ' + error.message, 'error');
            }
        }

        async disconnectDevice(provider) {
            if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
            
            try {
                await PhoenixCore.API.mercury.devices.disconnect(provider);
                showToast('Device disconnected', 'success');
                await this.loadDevices();
            } catch (error) {
                showToast('Failed to disconnect device: ' + error.message, 'error');
            }
        }

        renderRecoveryCharts(dashboard, history, trends) {
            // Implement chart rendering using Chart.js or similar
            console.log('Rendering recovery charts:', dashboard, history, trends);
        }

        renderBiometricCharts(hrv, trends) {
            // Implement biometric chart rendering
            console.log('Rendering biometric charts:', hrv, trends);
        }

        renderSleepCharts(sleep, analysis) {
            // Implement sleep chart rendering
            console.log('Rendering sleep charts:', sleep, analysis);
        }

        renderDexaProgressChart(scans) {
            // Implement DEXA progress chart
            console.log('Rendering DEXA progress chart:', scans);
        }
    }

    // ============================================================================
    // VENUS PLANET - FITNESS & NUTRITION
    // ============================================================================

    class VenusPlanet {
        constructor() {
            this.currentView = 'dashboard';
        }

        async render(container) {
            container.innerHTML = `
                <div class="planet-venus">
                    <div class="planet-header">
                        <div class="planet-icon">♀</div>
                        <div class="planet-title">
                            <h1>Venus</h1>
                            <p class="planet-subtitle">Fitness & Nutrition Optimization</p>
                        </div>
                        <div class="planet-actions">
                            <button class="btn-primary quantum-btn" onclick="PhoenixPlanets.Venus.generateQuantumWorkout()">
                                ⚛️ Generate Quantum Workout
                            </button>
                            <button class="btn-secondary" onclick="PhoenixPlanets.Venus.logWorkout()">
                                ➕ Log Workout
                            </button>
                        </div>
                    </div>

                    <div class="venus-nav">
                        <button class="nav-btn active" data-view="dashboard" onclick="PhoenixPlanets.Venus.switchView('dashboard')">
                            📊 Dashboard
                        </button>
                        <button class="nav-btn" data-view="quantum" onclick="PhoenixPlanets.Venus.switchView('quantum')">
                            ⚛️ Quantum Workouts
                        </button>
                        <button class="nav-btn" data-view="workouts" onclick="PhoenixPlanets.Venus.switchView('workouts')">
                            🏋️ Workouts
                        </button>
                        <button class="nav-btn" data-view="nutrition" onclick="PhoenixPlanets.Venus.switchView('nutrition')">
                            🍎 Nutrition
                        </button>
                        <button class="nav-btn" data-view="programs" onclick="PhoenixPlanets.Venus.switchView('programs')">
                            📋 Programs
                        </button>
                        <button class="nav-btn" data-view="social" onclick="PhoenixPlanets.Venus.switchView('social')">
                            👥 Social
                        </button>
                    </div>

                    <div id="venus-content" class="planet-content">
                        <div class="loading-spinner">Loading Venus data...</div>
                    </div>
                </div>
            `;

            await this.loadDashboard();
        }

        async switchView(view) {
            this.currentView = view;
            
            document.querySelectorAll('.venus-nav .nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === view) btn.classList.add('active');
            });

            const content = document.getElementById('venus-content');
            content.innerHTML = '<div class="loading-spinner">Loading...</div>';

            switch(view) {
                case 'dashboard': await this.loadDashboard(); break;
                case 'quantum': await this.loadQuantum(); break;
                case 'workouts': await this.loadWorkouts(); break;
                case 'nutrition': await this.loadNutrition(); break;
                case 'programs': await this.loadPrograms(); break;
                case 'social': await this.loadSocial(); break;
            }
        }

        async loadDashboard() {
            const content = document.getElementById('venus-content');
            
            try {
                const [stats, recentWorkouts, nutrition, recommendations] = await Promise.all([
                    PhoenixCore.API.venus.fitness.dashboard(),
                    PhoenixCore.API.venus.workouts.recent(),
                    PhoenixCore.API.venus.nutrition.today(),
                    PhoenixCore.API.venus.workouts.recommendations()
                ]);

                content.innerHTML = `
                    <div class="venus-dashboard">
                        <!-- Fitness Stats Hero -->
                        <div class="fitness-stats-hero">
                            <div class="stat-card large">
                                <div class="stat-icon">💪</div>
                                <div class="stat-content">
                                    <div class="stat-value">${stats.totalWorkouts}</div>
                                    <div class="stat-label">Total Workouts</div>
                                    <div class="stat-streak">🔥 ${stats.currentStreak} day streak</div>
                                </div>
                            </div>

                            <div class="stat-card large">
                                <div class="stat-icon">⚡</div>
                                <div class="stat-content">
                                    <div class="stat-value">${stats.totalVolume.toLocaleString()}</div>
                                    <div class="stat-label">Total Volume (lbs)</div>
                                    <div class="stat-trend up">↑ ${stats.volumeChange}% this week</div>
                                </div>
                            </div>

                            <div class="stat-card large">
                                <div class="stat-icon">🎯</div>
                                <div class="stat-content">
                                    <div class="stat-value">${stats.personalRecords}</div>
                                    <div class="stat-label">Personal Records</div>
                                    <div class="stat-recent">Latest: ${stats.latestPR?.exercise || 'None'}</div>
                                </div>
                            </div>

                            <div class="stat-card large">
                                <div class="stat-icon">📊</div>
                                <div class="stat-content">
                                    <div class="stat-value">${stats.fitnessScore}</div>
                                    <div class="stat-label">Fitness Score</div>
                                    <div class="stat-percentile">Top ${stats.percentile}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- Quantum Workout CTA -->
                        <div class="quantum-cta">
                            <div class="quantum-visual">
                                <div class="quantum-particles"></div>
                                <div class="quantum-title">⚛️ Quantum Workout System</div>
                                <p>AI-powered, chaos-driven workouts that adapt to your physiology in real-time</p>
                            </div>
                            <button class="btn-quantum" onclick="PhoenixPlanets.Venus.generateQuantumWorkout()">
                                Generate Quantum Workout
                            </button>
                        </div>

                        <!-- Recent Workouts -->
                        <div class="recent-workouts">
                            <h3>📅 Recent Workouts</h3>
                            <div class="workouts-timeline">
                                ${recentWorkouts.map(workout => `
                                    <div class="workout-card">
                                        <div class="workout-date">${new Date(workout.date).toLocaleDateString()}</div>
                                        <div class="workout-info">
                                            <h4>${workout.name}</h4>
                                            <div class="workout-stats">
                                                <span>⏱️ ${workout.duration}min</span>
                                                <span>💪 ${workout.exercises.length} exercises</span>
                                                <span>⚡ ${workout.totalVolume} lbs</span>
                                            </div>
                                            ${workout.prs.length > 0 ? `
                                                <div class="workout-prs">
                                                    ${workout.prs.map(pr => `<span class="pr-badge">🎯 PR: ${pr}</span>`).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                        <button class="btn-outline" onclick="PhoenixPlanets.Venus.viewWorkout('${workout.id}')">
                                            View Details
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Nutrition Summary -->
                        <div class="nutrition-summary">
                            <h3>🍎 Today's Nutrition</h3>
                            <div class="nutrition-rings">
                                <div class="nutrition-ring">
                                    <svg viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" stroke-width="8"/>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#ff6b6b" stroke-width="8"
                                                stroke-dasharray="${(nutrition.calories.current / nutrition.calories.target) * 251} 251" 
                                                stroke-linecap="round" transform="rotate(-90 50 50)"/>
                                    </svg>
                                    <div class="ring-label">
                                        <div class="ring-value">${nutrition.calories.current}</div>
                                        <div class="ring-target">/${nutrition.calories.target}</div>
                                        <div class="ring-name">Calories</div>
                                    </div>
                                </div>

                                <div class="nutrition-ring">
                                    <svg viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" stroke-width="8"/>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#00d2ff" stroke-width="8"
                                                stroke-dasharray="${(nutrition.protein.current / nutrition.protein.target) * 251} 251" 
                                                stroke-linecap="round" transform="rotate(-90 50 50)"/>
                                    </svg>
                                    <div class="ring-label">
                                        <div class="ring-value">${nutrition.protein.current}g</div>
                                        <div class="ring-target">/${nutrition.protein.target}g</div>
                                        <div class="ring-name">Protein</div>
                                    </div>
                                </div>

                                <div class="nutrition-ring">
                                    <svg viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" stroke-width="8"/>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#ffd93d" stroke-width="8"
                                                stroke-dasharray="${(nutrition.carbs.current / nutrition.carbs.target) * 251} 251" 
                                                stroke-linecap="round" transform="rotate(-90 50 50)"/>
                                    </svg>
                                    <div class="ring-label">
                                        <div class="ring-value">${nutrition.carbs.current}g</div>
                                        <div class="ring-target">/${nutrition.carbs.target}g</div>
                                        <div class="ring-name">Carbs</div>
                                    </div>
                                </div>

                                <div class="nutrition-ring">
                                    <svg viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" stroke-width="8"/>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#9d4edd" stroke-width="8"
                                                stroke-dasharray="${(nutrition.fat.current / nutrition.fat.target) * 251} 251" 
                                                stroke-linecap="round" transform="rotate(-90 50 50)"/>
                                    </svg>
                                    <div class="ring-label">
                                        <div class="ring-value">${nutrition.fat.current}g</div>
                                        <div class="ring-target">/${nutrition.fat.target}g</div>
                                        <div class="ring-name">Fat</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Workout Recommendations -->
                        <div class="workout-recommendations">
                            <h3>💡 Recommended Workouts</h3>
                            <div class="recommendations-grid">
                                ${recommendations.map(rec => `
                                    <div class="recommendation-card">
                                        <div class="rec-icon">${rec.icon}</div>
                                        <h4>${rec.name}</h4>
                                        <p>${rec.reason}</p>
                                        <div class="rec-tags">
                                            ${rec.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                                        </div>
                                        <button class="btn-primary" onclick="PhoenixPlanets.Venus.startWorkout('${rec.id}')">
                                            Start Workout
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading Venus dashboard:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadQuantum() {
            const content = document.getElementById('venus-content');
            
            try {
                const quantumData = await PhoenixCore.API.venus.workouts.quantum.history();

                content.innerHTML = `
                    <div class="quantum-view">
                        <div class="quantum-header">
                            <h2>⚛️ Quantum Workout System</h2>
                            <p class="quantum-tagline">Patent-pending AI system using chaos theory and quantum mechanics</p>
                        </div>

                        <!-- Quantum Explainer -->
                        <div class="quantum-explainer">
                            <div class="explainer-visual">
                                <div class="lorenz-attractor"></div>
                            </div>
                            <div class="explainer-content">
                                <h3>How It Works</h3>
                                <div class="explainer-steps">
                                    <div class="step">
                                        <div class="step-number">1</div>
                                        <div class="step-content">
                                            <h4>Seed Your Chaos</h4>
                                            <p>Uses Lorenz attractor (butterfly effect) seeded with your biometrics</p>
                                        </div>
                                    </div>
                                    <div class="step">
                                        <div class="step-number">2</div>
                                        <div class="step-content">
                                            <h4>Quantum Selection</h4>
                                            <p>Non-deterministic exercise selection prevents adaptation plateaus</p>
                                        </div>
                                    </div>
                                    <div class="step">
                                        <div class="step-number">3</div>
                                        <div class="step-content">
                                            <h4>Chaotic Programming</h4>
                                            <p>Wave loading, clusters, and chaos sets based on recovery data</p>
                                        </div>
                                    </div>
                                    <div class="step">
                                        <div class="step-number">4</div>
                                        <div class="step-content">
                                            <h4>Adaptive Variation</h4>
                                            <p>Each workout is unique, optimized for your current state</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Generate Quantum Workout -->
                        <div class="quantum-generator">
                            <h3>Generate Your Next Workout</h3>
                            <div class="generator-controls">
                                <div class="control-group">
                                    <label>Workout Type</label>
                                    <select id="quantum-type" class="quantum-select">
                                        <option value="strength">Strength</option>
                                        <option value="hypertrophy">Hypertrophy</option>
                                        <option value="power">Power</option>
                                        <option value="endurance">Endurance</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div class="control-group">
                                    <label>Duration</label>
                                    <select id="quantum-duration" class="quantum-select">
                                        <option value="30">30 minutes</option>
                                        <option value="45" selected>45 minutes</option>
                                        <option value="60">60 minutes</option>
                                        <option value="90">90 minutes</option>
                                    </select>
                                </div>
                                <div class="control-group">
                                    <label>Focus Areas</label>
                                    <div class="checkbox-group">
                                        <label><input type="checkbox" value="push"> Push</label>
                                        <label><input type="checkbox" value="pull"> Pull</label>
                                        <label><input type="checkbox" value="legs"> Legs</label>
                                        <label><input type="checkbox" value="core"> Core</label>
                                    </div>
                                </div>
                            </div>
                            <button class="btn-quantum large" onclick="PhoenixPlanets.Venus.generateQuantumWorkout()">
                                ⚛️ Generate Quantum Workout
                            </button>
                        </div>

                        <!-- Quantum History -->
                        ${quantumData.workouts.length > 0 ? `
                            <div class="quantum-history">
                                <h3>Previous Quantum Workouts</h3>
                                <div class="history-grid">
                                    ${quantumData.workouts.map(workout => `
                                        <div class="quantum-workout-card">
                                            <div class="workout-header">
                                                <h4>⚛️ ${workout.name}</h4>
                                                <div class="workout-date">${new Date(workout.date).toLocaleDateString()}</div>
                                            </div>
                                            <div class="workout-seeds">
                                                <div class="seed-badge">Seed: ${workout.quantumSeed.substring(0, 8)}...</div>
                                                <div class="chaos-badge">Chaos: ${workout.chaosLevel}%</div>
                                            </div>
                                            <div class="workout-exercises">
                                                ${workout.exercises.slice(0, 3).map(ex => `
                                                    <div class="exercise-preview">
                                                        ${ex.name} - ${ex.setScheme}
                                                    </div>
                                                `).join('')}
                                                ${workout.exercises.length > 3 ? `
                                                    <div class="exercise-more">+${workout.exercises.length - 3} more</div>
                                                ` : ''}
                                            </div>
                                            <div class="workout-stats">
                                                <span>⏱️ ${workout.duration}min</span>
                                                <span>💪 ${workout.totalVolume} lbs</span>
                                                <span>⚡ ${workout.intensity}% intensity</span>
                                            </div>
                                            <div class="workout-actions">
                                                <button class="btn-outline" onclick="PhoenixPlanets.Venus.viewQuantumWorkout('${workout.id}')">
                                                    View Details
                                                </button>
                                                <button class="btn-secondary" onclick="PhoenixPlanets.Venus.repeatQuantumWorkout('${workout.id}')">
                                                    Repeat
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-icon">⚛️</div>
                                <h3>No Quantum Workouts Yet</h3>
                                <p>Generate your first quantum workout to experience the future of training</p>
                            </div>
                        `}

                        <!-- Quantum Insights -->
                        <div class="quantum-insights">
                            <h3>📊 Quantum Performance Analysis</h3>
                            <div class="insights-grid">
                                <div class="insight-card">
                                    <h4>Plateau Prevention</h4>
                                    <div class="insight-value">${quantumData.plateauRisk}%</div>
                                    <p>Risk of adaptation plateau</p>
                                    <div class="insight-status ${quantumData.plateauRisk < 30 ? 'good' : 'warning'}">
                                        ${quantumData.plateauRisk < 30 ? '✓ Optimal Variation' : '⚠️ Consider Quantum'}
                                    </div>
                                </div>

                                <div class="insight-card">
                                    <h4>Adaptation Score</h4>
                                    <div class="insight-value">${quantumData.adaptationScore}</div>
                                    <p>Your body's adaptation rate</p>
                                    <canvas id="adaptation-chart"></canvas>
                                </div>

                                <div class="insight-card">
                                    <h4>Pattern Diversity</h4>
                                    <div class="insight-value">${quantumData.patternDiversity}%</div>
                                    <p>Exercise variation coverage</p>
                                    <div class="diversity-bar">
                                        <div class="diversity-fill" style="width: ${quantumData.patternDiversity}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading quantum view:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadWorkouts() {
            const content = document.getElementById('venus-content');
            
            try {
                const [workouts, templates, programs] = await Promise.all([
                    PhoenixCore.API.venus.workouts.list(),
                    PhoenixCore.API.venus.workouts.templates(),
                    PhoenixCore.API.venus.programs.list()
                ]);

                content.innerHTML = `
                    <div class="workouts-view">
                        <div class="workouts-header">
                            <h2>🏋️ Workout Library</h2>
                            <div class="header-actions">
                                <button class="btn-primary" onclick="PhoenixPlanets.Venus.createCustomWorkout()">
                                    ➕ Create Workout
                                </button>
                                <button class="btn-secondary" onclick="PhoenixPlanets.Venus.browseTemplates()">
                                    📋 Templates
                                </button>
                            </div>
                        </div>

                        <!-- Workout History -->
                        <div class="workout-history">
                            <h3>Workout History</h3>
                            <div class="history-filters">
                                <button class="filter-btn active" data-filter="all">All</button>
                                <button class="filter-btn" data-filter="strength">Strength</button>
                                <button class="filter-btn" data-filter="hypertrophy">Hypertrophy</button>
                                <button class="filter-btn" data-filter="cardio">Cardio</button>
                                <button class="filter-btn" data-filter="quantum">Quantum</button>
                            </div>

                            <div class="workouts-grid">
                                ${workouts.map(workout => `
                                    <div class="workout-card ${workout.type}">
                                        <div class="workout-header">
                                            <div class="workout-type-badge">${workout.type}</div>
                                            <div class="workout-date">${new Date(workout.date).toLocaleDateString()}</div>
                                        </div>
                                        <h4>${workout.name}</h4>
                                        <div class="workout-stats">
                                            <div class="stat">
                                                <span class="stat-label">Duration</span>
                                                <span class="stat-value">⏱️ ${workout.duration}min</span>
                                            </div>
                                            <div class="stat">
                                                <span class="stat-label">Volume</span>
                                                <span class="stat-value">💪 ${workout.totalVolume} lbs</span>
                                            </div>
                                            <div class="stat">
                                                <span class="stat-label">Exercises</span>
                                                <span class="stat-value">🎯 ${workout.exercises.length}</span>
                                            </div>
                                        </div>
                                        ${workout.prs.length > 0 ? `
                                            <div class="workout-achievements">
                                                ${workout.prs.map(pr => `<span class="achievement-badge">🏆 ${pr}</span>`).join('')}
                                            </div>
                                        ` : ''}
                                        <div class="workout-actions">
                                            <button class="btn-outline" onclick="PhoenixPlanets.Venus.viewWorkout('${workout.id}')">
                                                View
                                            </button>
                                            <button class="btn-secondary" onclick="PhoenixPlanets.Venus.repeatWorkout('${workout.id}')">
                                                Repeat
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Workout Templates -->
                        <div class="workout-templates">
                            <h3>Workout Templates</h3>
                            <div class="templates-grid">
                                ${templates.map(template => `
                                    <div class="template-card">
                                        <div class="template-icon">${template.icon}</div>
                                        <h4>${template.name}</h4>
                                        <p>${template.description}</p>
                                        <div class="template-meta">
                                            <span>⏱️ ${template.duration}min</span>
                                            <span>💪 ${template.difficulty}</span>
                                            <span>🎯 ${template.exercises.length} exercises</span>
                                        </div>
                                        <button class="btn-primary" onclick="PhoenixPlanets.Venus.startTemplate('${template.id}')">
                                            Start Workout
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading workouts:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadNutrition() {
            const content = document.getElementById('venus-content');
            
            try {
                const [today, targets, meals, insights] = await Promise.all([
                    PhoenixCore.API.venus.nutrition.today(),
                    PhoenixCore.API.venus.nutrition.targets(),
                    PhoenixCore.API.venus.nutrition.meals(),
                    PhoenixCore.API.venus.nutrition.insights()
                ]);

                content.innerHTML = `
                    <div class="nutrition-view">
                        <div class="nutrition-header">
                            <h2>🍎 Nutrition Tracking</h2>
                            <div class="header-actions">
                                <button class="btn-primary" onclick="PhoenixPlanets.Venus.logMeal()">
                                    ➕ Log Meal
                                </button>
                                <button class="btn-secondary" onclick="PhoenixPlanets.Venus.scanFood()">
                                    📸 Scan Food
                                </button>
                            </div>
                        </div>

                        <!-- Daily Overview -->
                        <div class="daily-overview">
                            <h3>Today's Nutrition</h3>
                            <div class="macro-rings">
                                ${this.renderMacroRing('Calories', today.calories, targets.calories, '#ff6b6b')}
                                ${this.renderMacroRing('Protein', today.protein, targets.protein, '#00d2ff', 'g')}
                                ${this.renderMacroRing('Carbs', today.carbs, targets.carbs, '#ffd93d', 'g')}
                                ${this.renderMacroRing('Fat', today.fat, targets.fat, '#9d4edd', 'g')}
                            </div>
                        </div>

                        <!-- Meal Log -->
                        <div class="meal-log">
                            <h3>Meal Log</h3>
                            <div class="meals-timeline">
                                ${meals.map(meal => `
                                    <div class="meal-card">
                                        <div class="meal-header">
                                            <div class="meal-icon">${this.getMealIcon(meal.type)}</div>
                                            <div class="meal-info">
                                                <h4>${meal.name}</h4>
                                                <div class="meal-time">${meal.time}</div>
                                            </div>
                                        </div>
                                        <div class="meal-macros">
                                            <span>Cal: ${meal.calories}</span>
                                            <span>P: ${meal.protein}g</span>
                                            <span>C: ${meal.carbs}g</span>
                                            <span>F: ${meal.fat}g</span>
                                        </div>
                                        ${meal.items ? `
                                            <div class="meal-items">
                                                ${meal.items.map(item => `<div class="meal-item">${item.name} (${item.amount})</div>`).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Nutrition Insights -->
                        <div class="nutrition-insights">
                            <h3>💡 Insights</h3>
                            <div class="insights-grid">
                                ${insights.map(insight => `
                                    <div class="insight-card ${insight.type}">
                                        <div class="insight-icon">${insight.icon}</div>
                                        <h4>${insight.title}</h4>
                                        <p>${insight.message}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading nutrition:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadPrograms() {
            const content = document.getElementById('venus-content');
            
            try {
                const programs = await PhoenixCore.API.venus.programs.list();

                content.innerHTML = `
                    <div class="programs-view">
                        <div class="programs-header">
                            <h2>📋 Training Programs</h2>
                            <button class="btn-primary" onclick="PhoenixPlanets.Venus.createProgram()">
                                ➕ Create Program
                            </button>
                        </div>

                        <div class="programs-grid">
                            ${programs.map(program => `
                                <div class="program-card">
                                    <div class="program-header">
                                        <h3>${program.name}</h3>
                                        <span class="program-badge">${program.type}</span>
                                    </div>
                                    <p>${program.description}</p>
                                    <div class="program-meta">
                                        <span>📅 ${program.duration} weeks</span>
                                        <span>🏋️ ${program.workoutsPerWeek}x/week</span>
                                        <span>💪 ${program.difficulty}</span>
                                    </div>
                                    <div class="program-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${program.progress}%"></div>
                                        </div>
                                        <span>${program.progress}% Complete</span>
                                    </div>
                                    <button class="btn-primary" onclick="PhoenixPlanets.Venus.viewProgram('${program.id}')">
                                        View Program
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading programs:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadSocial() {
            const content = document.getElementById('venus-content');
            
            try {
                const [feed, challenges, friends] = await Promise.all([
                    PhoenixCore.API.venus.social.feed(),
                    PhoenixCore.API.venus.social.challenges(),
                    PhoenixCore.API.venus.social.friends()
                ]);

                content.innerHTML = `
                    <div class="social-view">
                        <div class="social-header">
                            <h2>👥 Fitness Social</h2>
                            <div class="header-actions">
                                <button class="btn-primary" onclick="PhoenixPlanets.Venus.shareWorkout()">
                                    📤 Share Workout
                                </button>
                                <button class="btn-secondary" onclick="PhoenixPlanets.Venus.findFriends()">
                                    👥 Find Friends
                                </button>
                            </div>
                        </div>

                        <!-- Activity Feed -->
                        <div class="social-feed">
                            <h3>Activity Feed</h3>
                            <div class="feed-list">
                                ${feed.map(post => `
                                    <div class="feed-post">
                                        <div class="post-user">
                                            <div class="user-avatar">${post.user.avatar}</div>
                                            <div class="user-info">
                                                <div class="user-name">${post.user.name}</div>
                                                <div class="post-time">${this.formatTimeAgo(post.timestamp)}</div>
                                            </div>
                                        </div>
                                        <div class="post-content">
                                            <p>${post.message}</p>
                                            ${post.workout ? `
                                                <div class="post-workout">
                                                    <h4>${post.workout.name}</h4>
                                                    <div class="workout-stats">
                                                        <span>⏱️ ${post.workout.duration}min</span>
                                                        <span>💪 ${post.workout.volume} lbs</span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                        <div class="post-actions">
                                            <button class="action-btn">👍 ${post.likes}</button>
                                            <button class="action-btn">💬 ${post.comments}</button>
                                            <button class="action-btn">🔥 Motivate</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Challenges -->
                        <div class="challenges-section">
                            <h3>🏆 Active Challenges</h3>
                            <div class="challenges-grid">
                                ${challenges.map(challenge => `
                                    <div class="challenge-card">
                                        <div class="challenge-icon">${challenge.icon}</div>
                                        <h4>${challenge.name}</h4>
                                        <p>${challenge.description}</p>
                                        <div class="challenge-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${challenge.progress}%"></div>
                                            </div>
                                            <span>${challenge.progress}% - ${challenge.daysLeft} days left</span>
                                        </div>
                                        <div class="challenge-leaderboard">
                                            <span>🏅 ${challenge.rank}/${challenge.participants} participants</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Friends -->
                        <div class="friends-section">
                            <h3>Friends</h3>
                            <div class="friends-list">
                                ${friends.map(friend => `
                                    <div class="friend-card">
                                        <div class="friend-avatar">${friend.avatar}</div>
                                        <div class="friend-info">
                                            <div class="friend-name">${friend.name}</div>
                                            <div class="friend-stats">
                                                <span>🏋️ ${friend.workouts} workouts</span>
                                                <span>🔥 ${friend.streak} day streak</span>
                                            </div>
                                        </div>
                                        <button class="btn-outline">View Profile</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading social:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async generateQuantumWorkout() {
            try {
                showToast('Generating quantum workout...', 'info');
                
                const type = document.getElementById('quantum-type')?.value || 'strength';
                const duration = document.getElementById('quantum-duration')?.value || 45;

                const workout = await PhoenixCore.API.venus.workouts.quantum.generate({
                    type,
                    duration,
                    adaptToRecovery: true
                });

                // Display workout in modal
                this.displayQuantumWorkout(workout);
                showToast('Quantum workout generated!', 'success');

            } catch (error) {
                console.error('Error generating quantum workout:', error);
                showToast('Failed to generate workout: ' + error.message, 'error');
            }
        }

        displayQuantumWorkout(workout) {
            const modal = document.createElement('div');
            modal.className = 'modal quantum-modal';
            modal.innerHTML = `
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>⚛️ ${workout.name}</h2>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="quantum-workout-details">
                            <div class="workout-meta">
                                <div class="meta-item">
                                    <span class="meta-label">Quantum Seed</span>
                                    <code>${workout.quantumSeed}</code>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Chaos Level</span>
                                    <span class="chaos-badge">${workout.chaosLevel}%</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Duration</span>
                                    <span>⏱️ ${workout.duration} minutes</span>
                                </div>
                            </div>

                            <div class="exercise-list">
                                ${workout.exercises.map((ex, i) => `
                                    <div class="exercise-item">
                                        <div class="exercise-number">${i + 1}</div>
                                        <div class="exercise-info">
                                            <h4>${ex.name}</h4>
                                            <div class="exercise-scheme">${ex.setScheme}</div>
                                            <div class="exercise-details">
                                                <span>Sets: ${ex.sets}</span>
                                                <span>Reps: ${ex.reps}</span>
                                                <span>Intensity: ${ex.intensity}%</span>
                                                <span>Rest: ${ex.rest}s</span>
                                            </div>
                                            ${ex.technique ? `
                                                <div class="exercise-technique">
                                                    <strong>Technique:</strong> ${ex.technique}
                                                </div>
                                            ` : ''}
                                            ${ex.notes ? `
                                                <div class="exercise-notes">${ex.notes}</div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            ${workout.aiOptimization ? `
                                <div class="ai-optimization">
                                    <h4>🤖 AI Optimization Notes</h4>
                                    <p>${workout.aiOptimization}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button class="btn-primary" onclick="PhoenixPlanets.Venus.startQuantumWorkout('${workout.id}')">
                            Start Workout
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        renderMacroRing(label, current, target, color, unit = '') {
            const percentage = Math.min((current / target) * 100, 100);
            const circumference = 2 * Math.PI * 40;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

            return `
                <div class="macro-ring">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" stroke-width="8"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="8"
                                stroke-dasharray="${strokeDasharray}" 
                                stroke-linecap="round" transform="rotate(-90 50 50)"/>
                    </svg>
                    <div class="ring-content">
                        <div class="ring-value">${current}${unit}</div>
                        <div class="ring-target">/${target}${unit}</div>
                        <div class="ring-label">${label}</div>
                    </div>
                </div>
            `;
        }

        getMealIcon(type) {
            const icons = {
                breakfast: '🍳',
                lunch: '🥗',
                dinner: '🍽️',
                snack: '🍎'
            };
            return icons[type] || '🍴';
        }

        formatTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
        }
    }

    // ============================================================================
    // EARTH PLANET - CALENDAR & ENERGY
    // ============================================================================

    class EarthPlanet {
        constructor() {
            this.currentView = 'dashboard';
        }

        async render(container) {
            container.innerHTML = `
                <div class="planet-earth">
                    <div class="planet-header">
                        <div class="planet-icon">🌍</div>
                        <div class="planet-title">
                            <h1>Earth</h1>
                            <p class="planet-subtitle">Calendar & Energy Optimization</p>
                        </div>
                        <div class="planet-actions">
                            <button class="btn-primary" onclick="PhoenixPlanets.Earth.optimizeSchedule()">
                                ⚡ Optimize Schedule
                            </button>
                            <button class="btn-secondary" onclick="PhoenixPlanets.Earth.syncCalendar()">
                                🔄 Sync Calendar
                            </button>
                        </div>
                    </div>

                    <div class="earth-nav">
                        <button class="nav-btn active" data-view="dashboard" onclick="PhoenixPlanets.Earth.switchView('dashboard')">
                            📊 Dashboard
                        </button>
                        <button class="nav-btn" data-view="calendar" onclick="PhoenixPlanets.Earth.switchView('calendar')">
                            📅 Calendar
                        </button>
                        <button class="nav-btn" data-view="energy" onclick="PhoenixPlanets.Earth.switchView('energy')">
                            ⚡ Energy Map
                        </button>
                        <button class="nav-btn" data-view="conflicts" onclick="PhoenixPlanets.Earth.switchView('conflicts')">
                            ⚠️ Conflicts
                            </button>
                    </div>

                    <div id="earth-content" class="planet-content">
                        <div class="loading-spinner">Loading Earth data...</div>
                    </div>
                </div>
            `;

            await this.loadDashboard();
        }

        async switchView(view) {
            this.currentView = view;
            
            document.querySelectorAll('.earth-nav .nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === view) btn.classList.add('active');
            });

            const content = document.getElementById('earth-content');
            content.innerHTML = '<div class="loading-spinner">Loading...</div>';

            switch(view) {
                case 'dashboard': await this.loadDashboard(); break;
                case 'calendar': await this.loadCalendar(); break;
                case 'energy': await this.loadEnergyMap(); break;
                case 'conflicts': await this.loadConflicts(); break;
            }
        }

        async loadDashboard() {
            const content = document.getElementById('earth-content');
            
            try {
                const [todayEvents, energyPattern, conflicts, optimalTimes] = await Promise.all([
                    PhoenixCore.API.earth.calendar.events({ date: new Date().toISOString() }),
                    PhoenixCore.API.earth.energy.pattern(),
                    PhoenixCore.API.earth.calendar.conflicts(),
                    PhoenixCore.API.earth.energy.optimalTimes()
                ]);

                content.innerHTML = `
                    <div class="earth-dashboard">
                        <!-- Today's Schedule -->
                        <div class="today-schedule">
                            <h3>📅 Today's Schedule</h3>
                            <div class="schedule-timeline">
                                ${todayEvents.length > 0 ? todayEvents.map(event => `
                                    <div class="event-card">
                                        <div class="event-time">${event.startTime}</div>
                                        <div class="event-info">
                                            <h4>${event.title}</h4>
                                            ${event.location ? `<p class="event-location">📍 ${event.location}</p>` : ''}
                                            <div class="event-meta">
                                                <span>${event.duration} min</span>
                                                ${event.energyScore ? `<span class="energy-badge ${event.energyScore >= 70 ? 'high' : 'low'}">
                                                    ⚡ ${event.energyScore}% energy
                                                </span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<p class="empty-message">No events scheduled for today</p>'}
                            </div>
                        </div>

                        <!-- Energy Pattern -->
                        <div class="energy-pattern">
                            <h3>⚡ Your Energy Pattern</h3>
                            <div class="energy-chart">
                                <canvas id="energy-pattern-chart"></canvas>
                            </div>
                            <div class="energy-insights">
                                <div class="insight-item">
                                    <span class="insight-icon">🌅</span>
                                    <div class="insight-text">
                                        <strong>Peak Energy:</strong> ${energyPattern.peakTime}
                                    </div>
                                </div>
                                <div class="insight-item">
                                    <span class="insight-icon">😴</span>
                                    <div class="insight-text">
                                        <strong>Low Energy:</strong> ${energyPattern.lowTime}
                                    </div>
                                </div>
                                <div class="insight-item">
                                    <span class="insight-icon">💡</span>
                                    <div class="insight-text">
                                        <strong>Best for Focus:</strong> ${energyPattern.focusTime}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Optimal Meeting Times -->
                        <div class="optimal-times">
                            <h3>🎯 Optimal Meeting Times</h3>
                            <div class="times-grid">
                                ${optimalTimes.map(slot => `
                                    <div class="time-slot ${slot.quality}">
                                        <div class="slot-time">${slot.time}</div>
                                        <div class="slot-score">⚡ ${slot.energyScore}%</div>
                                        <div class="slot-reason">${slot.reason}</div>
                                        <button class="btn-outline" onclick="PhoenixPlanets.Earth.scheduleAtTime('${slot.time}')">
                                            Schedule Here
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Schedule Conflicts -->
                        ${conflicts.length > 0 ? `
                            <div class="conflicts-alert">
                                <h3>⚠️ Schedule Conflicts Detected</h3>
                                <div class="conflicts-list">
                                    ${conflicts.map(conflict => `
                                        <div class="conflict-card">
                                            <div class="conflict-icon">⚠️</div>
                                            <div class="conflict-info">
                                                <h4>${conflict.title}</h4>
                                                <p>${conflict.description}</p>
                                                <div class="conflict-events">
                                                    ${conflict.events.map(e => `<span>${e}</span>`).join(' • ')}
                                                </div>
                                            </div>
                                            <button class="btn-primary" onclick="PhoenixPlanets.Earth.resolveConflict('${conflict.id}')">
                                                Resolve
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- AI Recommendations -->
                        <div class="schedule-recommendations">
                            <h3>💡 AI Recommendations</h3>
                            <div class="recommendations-list">
                                <div class="recommendation-card">
                                    <div class="rec-icon">🌅</div>
                                    <div class="rec-content">
                                        <h4>Schedule Deep Work Earlier</h4>
                                        <p>Your energy peaks at ${energyPattern.peakTime}. Move complex tasks to this window.</p>
                                    </div>
                                </div>
                                <div class="recommendation-card">
                                    <div class="rec-icon">🍽️</div>
                                    <div class="rec-content">
                                        <h4>Block Lunch Time</h4>
                                        <p>You have back-to-back meetings. Block 30min for lunch at 12:00 PM.</p>
                                    </div>
                                </div>
                                <div class="recommendation-card">
                                    <div class="rec-icon">💆</div>
                                    <div class="rec-content">
                                        <h4>Add Recovery Buffer</h4>
                                        <p>3 high-intensity meetings in a row. Add 15min buffer for recovery.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                this.renderEnergyChart(energyPattern);

            } catch (error) {
                console.error('Error loading Earth dashboard:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadCalendar() {
            const content = document.getElementById('earth-content');
            
            try {
                const events = await PhoenixCore.API.earth.calendar.events();

                content.innerHTML = `
                    <div class="calendar-view">
                        <div class="calendar-header">
                            <h2>📅 Calendar</h2>
                            <div class="calendar-controls">
                                <button class="btn-nav">← Previous</button>
                                <h3 id="current-month">${this.getCurrentMonth()}</h3>
                                <button class="btn-nav">Next →</button>
                            </div>
                            <button class="btn-primary" onclick="PhoenixPlanets.Earth.addEvent()">
                                ➕ Add Event
                            </button>
                        </div>

                        <div class="calendar-grid" id="calendar-grid">
                            ${this.renderCalendarGrid(events)}
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading calendar:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadEnergyMap() {
            const content = document.getElementById('earth-content');
            
            try {
                const energyMap = await PhoenixCore.API.earth.calendar.energyMap();

                content.innerHTML = `
                    <div class="energy-map-view">
                        <div class="energy-map-header">
                            <h2>⚡ Energy-Optimized Schedule</h2>
                            <p>AI-powered scheduling based on your energy patterns</p>
                        </div>

                        <div class="energy-heatmap">
                            <div class="heatmap-header">
                                <h3>Weekly Energy Heatmap</h3>
                                <div class="heatmap-legend">
                                    <span class="legend-item"><div class="color-box high"></div>High Energy</span>
                                    <span class="legend-item"><div class="color-box medium"></div>Medium Energy</span>
                                    <span class="legend-item"><div class="color-box low"></div>Low Energy</span>
                                </div>
                            </div>
                            <div class="heatmap-grid">
                                ${this.renderEnergyHeatmap(energyMap)}
                            </div>
                        </div>

                        <div class="optimization-suggestions">
                            <h3>💡 Optimization Suggestions</h3>
                            <div class="suggestions-list">
                                ${energyMap.suggestions.map(suggestion => `
                                    <div class="suggestion-card">
                                        <div class="suggestion-icon">${suggestion.icon}</div>
                                        <div class="suggestion-content">
                                            <h4>${suggestion.title}</h4>
                                            <p>${suggestion.description}</p>
                                            <div class="suggestion-impact">
                                                <strong>Impact:</strong> ${suggestion.impact}
                                            </div>
                                        </div>
                                        <button class="btn-primary" onclick="PhoenixPlanets.Earth.applySuggestion('${suggestion.id}')">
                                            Apply
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading energy map:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadConflicts() {
            const content = document.getElementById('earth-content');
            
            try {
                const conflicts = await PhoenixCore.API.earth.calendar.conflicts();

                content.innerHTML = `
                    <div class="conflicts-view">
                        <div class="conflicts-header">
                            <h2>⚠️ Schedule Conflicts</h2>
                            <p>${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''} detected</p>
                        </div>

                        ${conflicts.length > 0 ? `
                            <div class="conflicts-list">
                                ${conflicts.map(conflict => `
                                    <div class="conflict-card-detailed">
                                        <div class="conflict-severity ${conflict.severity}">
                                            ${conflict.severity.toUpperCase()}
                                        </div>
                                        <div class="conflict-details">
                                            <h3>${conflict.title}</h3>
                                            <p class="conflict-description">${conflict.description}</p>
                                            <div class="conflict-timeline">
                                                ${conflict.events.map(event => `
                                                    <div class="timeline-event">
                                                        <div class="event-time">${event.time}</div>
                                                        <div class="event-title">${event.title}</div>
                                                    </div>
                                                `).join('<div class="timeline-overlap">OVERLAP</div>')}
                                            </div>
                                        </div>
                                        <div class="conflict-resolutions">
                                            <h4>Suggested Resolutions:</h4>
                                            ${conflict.resolutions.map(resolution => `
                                                <button class="resolution-option" onclick="PhoenixPlanets.Earth.applyResolution('${conflict.id}', '${resolution.id}')">
                                                    ${resolution.description}
                                                </button>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-icon">✅</div>
                                <h3>No Conflicts Detected</h3>
                                <p>Your schedule is optimized!</p>
                            </div>
                        `}
                    </div>
                `;

            } catch (error) {
                console.error('Error loading conflicts:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        getCurrentMonth() {
            return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        renderCalendarGrid(events) {
            // Simplified calendar grid rendering
            return '<div class="calendar-placeholder">Calendar grid rendering...</div>';
        }

        renderEnergyHeatmap(energyMap) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const hours = Array.from({length: 24}, (_, i) => i);

            return `
                <table class="heatmap-table">
                    <thead>
                        <tr>
                            <th></th>
                            ${days.map(day => `<th>${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${hours.map(hour => `
                            <tr>
                                <td class="hour-label">${hour}:00</td>
                                ${days.map((_, dayIndex) => {
                                    const energy = energyMap.data[dayIndex][hour];
                                    const level = energy >= 70 ? 'high' : energy >= 40 ? 'medium' : 'low';
                                    return `<td class="heatmap-cell ${level}" title="${energy}% energy"></td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        renderEnergyChart(pattern) {
            // Chart rendering would go here
            console.log('Rendering energy chart:', pattern);
        }
    }

    // ============================================================================
    // MARS PLANET - GOALS & PROGRESS
    // ============================================================================

    class MarsPlanet {
        constructor() {
            this.currentView = 'dashboard';
        }

        async render(container) {
            container.innerHTML = `
                <div class="planet-mars">
                    <div class="planet-header">
                        <div class="planet-icon">♂</div>
                        <div class="planet-title">
                            <h1>Mars</h1>
                            <p class="planet-subtitle">Goals & Progress Tracking</p>
                        </div>
                        <div class="planet-actions">
                            <button class="btn-primary" onclick="PhoenixPlanets.Mars.createGoal()">
                                🎯 New Goal
                            </button>
                            <button class="btn-secondary" onclick="PhoenixPlanets.Mars.generateSmartGoal()">
                                🤖 AI Goal Generator
                            </button>
                        </div>
                    </div>

                    <div class="mars-nav">
                        <button class="nav-btn active" data-view="dashboard" onclick="PhoenixPlanets.Mars.switchView('dashboard')">
                            📊 Dashboard
                        </button>
                        <button class="nav-btn" data-view="goals" onclick="PhoenixPlanets.Mars.switchView('goals')">
                            🎯 Goals
                        </button>
                        <button class="nav-btn" data-view="habits" onclick="PhoenixPlanets.Mars.switchView('habits')">
                            ✅ Habits
                        </button>
                        <button class="nav-btn" data-view="analytics" onclick="PhoenixPlanets.Mars.switchView('analytics')">
                            📈 Analytics
                        </button>
                    </div>

                    <div id="mars-content" class="planet-content">
                        <div class="loading-spinner">Loading Mars data...</div>
                    </div>
                </div>
            `;

            await this.loadDashboard();
        }

        async switchView(view) {
            this.currentView = view;
            
            document.querySelectorAll('.mars-nav .nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === view) btn.classList.add('active');
            });

            const content = document.getElementById('mars-content');
            content.innerHTML = '<div class="loading-spinner">Loading...</div>';

            switch(view) {
                case 'dashboard': await this.loadDashboard(); break;
                case 'goals': await this.loadGoals(); break;
                case 'habits': await this.loadHabits(); break;
                case 'analytics': await this.loadAnalytics(); break;
            }
        }

        async loadDashboard() {
            const content = document.getElementById('mars-content');
            
            try {
                const [activeGoals, velocity, predictions, interventions] = await Promise.all([
                    PhoenixCore.API.mars.goals.list({ status: 'active' }),
                    PhoenixCore.API.mars.progress.velocity(),
                    PhoenixCore.API.mars.progress.predictions(),
                    PhoenixCore.API.mars.motivation.interventions()
                ]);

                content.innerHTML = `
                    <div class="mars-dashboard">
                        <!-- Progress Overview -->
                        <div class="progress-overview">
                            <div class="overview-card">
                                <div class="card-icon">🎯</div>
                                <div class="card-content">
                                    <div class="card-value">${activeGoals.length}</div>
                                    <div class="card-label">Active Goals</div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-icon">⚡</div>
                                <div class="card-content">
                                    <div class="card-value">${velocity.score}</div>
                                    <div class="card-label">Velocity Score</div>
                                    <div class="card-trend ${velocity.trend > 0 ? 'up' : 'down'}">
                                        ${velocity.trend > 0 ? '↑' : '↓'} ${Math.abs(velocity.trend)}%
                                    </div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-icon">🔥</div>
                                <div class="card-content">
                                    <div class="card-value">${velocity.streak}</div>
                                    <div class="card-label">Day Streak</div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-icon">📅</div>
                                <div class="card-content">
                                    <div class="card-value">${predictions.onTrack}/${predictions.total}</div>
                                    <div class="card-label">On Track</div>
                                </div>
                            </div>
                        </div>

                        <!-- Active Goals -->
                        <div class="active-goals">
                            <h3>🎯 Active Goals</h3>
                            <div class="goals-grid">
                                ${activeGoals.map(goal => `
                                    <div class="goal-card">
                                        <div class="goal-header">
                                            <h4>${goal.title}</h4>
                                            <span class="goal-category">${goal.category}</span>
                                        </div>
                                        <div class="goal-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${goal.progress}%"></div>
                                            </div>
                                            <div class="progress-text">
                                                <span>${goal.progress}% complete</span>
                                                <span class="goal-deadline">${this.formatDeadline(goal.deadline)}</span>
                                            </div>
                                        </div>
                                        <div class="goal-prediction">
                                            ${goal.prediction?.onTrack ? 
                                                `<span class="prediction-badge on-track">✓ On track to complete by ${new Date(goal.deadline).toLocaleDateString()}</span>` :
                                                `<span class="prediction-badge at-risk">⚠️ At risk - ${goal.prediction?.recommendation}</span>`
                                            }
                                        </div>
                                        <div class="goal-actions">
                                            <button class="btn-primary" onclick="PhoenixPlanets.Mars.logProgress('${goal.id}')">
                                                Log Progress
                                            </button>
                                            <button class="btn-outline" onclick="PhoenixPlanets.Mars.viewGoal('${goal.id}')">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Motivational Interventions -->
                        ${interventions.length > 0 ? `
                            <div class="motivational-interventions">
                                <h3>💪 Motivation Boost</h3>
                                <div class="interventions-list">
                                    ${interventions.map(int => `
                                        <div class="intervention-card ${int.type}">
                                            <div class="int-icon">${int.icon}</div>
                                            <div class="int-content">
                                                <h4>${int.title}</h4>
                                                <p>${int.message}</p>
                                                ${int.action ? `
                                                    <button class="btn-motivation" onclick="${int.action}">
                                                        ${int.actionLabel}
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Quick Actions -->
                        <div class="quick-actions">
                            <button class="action-card" onclick="PhoenixPlanets.Mars.createGoal()">
                                <div class="action-icon">➕</div>
                                <div class="action-label">Add New Goal</div>
                            </button>
                            <button class="action-card" onclick="PhoenixPlanets.Mars.viewBottlenecks()">
                                <div class="action-icon">🚧</div>
                                <div class="action-label">View Bottlenecks</div>
                            </button>
                            <button class="action-card" onclick="PhoenixPlanets.Mars.getSuggestions()">
                                <div class="action-icon">💡</div>
                                <div class="action-label">Goal Suggestions</div>
                            </button>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading Mars dashboard:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadGoals() {
            const content = document.getElementById('mars-content');
            
            try {
                const [goals, templates, suggestions] = await Promise.all([
                    PhoenixCore.API.mars.goals.list(),
                    PhoenixCore.API.mars.goals.templates(),
                    PhoenixCore.API.mars.goals.suggestions()
                ]);

                content.innerHTML = `
                    <div class="goals-view">
                        <div class="goals-header">
                            <h2>🎯 All Goals</h2>
                            <div class="goals-filters">
                                <button class="filter-btn active" data-filter="all">All</button>
                                <button class="filter-btn" data-filter="active">Active</button>
                                <button class="filter-btn" data-filter="completed">Completed</button>
                                <button class="filter-btn" data-filter="archived">Archived</button>
                            </div>
                        </div>

                        <div class="goals-list">
                            ${goals.map(goal => `
                                <div class="goal-item-detailed">
                                    <div class="goal-status-indicator ${goal.status}"></div>
                                    <div class="goal-main">
                                        <div class="goal-info">
                                            <h3>${goal.title}</h3>
                                            <p>${goal.description}</p>
                                            <div class="goal-meta">
                                                <span class="meta-item">📁 ${goal.category}</span>
                                                <span class="meta-item">📅 ${new Date(goal.deadline).toLocaleDateString()}</span>
                                                <span class="meta-item">🎯 ${goal.milestones?.length || 0} milestones</span>
                                            </div>
                                        </div>
                                        <div class="goal-progress-detailed">
                                            <div class="progress-ring">
                                                <svg viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" stroke-width="8"/>
                                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#00ff88" stroke-width="8"
                                                            stroke-dasharray="${(goal.progress / 100) * 251} 251" 
                                                            stroke-linecap="round" transform="rotate(-90 50 50)"/>
                                                </svg>
                                                <div class="progress-value">${goal.progress}%</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="goal-actions-row">
                                        <button class="btn-outline" onclick="PhoenixPlanets.Mars.viewGoal('${goal.id}')">View</button>
                                        <button class="btn-secondary" onclick="PhoenixPlanets.Mars.logProgress('${goal.id}')">Log Progress</button>
                                        <button class="btn-primary" onclick="PhoenixPlanets.Mars.editGoal('${goal.id}')">Edit</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Goal Templates -->
                        <div class="goal-templates-section">
                            <h3>📋 Goal Templates</h3>
                            <div class="templates-grid">
                                ${templates.map(template => `
                                    <div class="template-card">
                                        <div class="template-icon">${template.icon}</div>
                                        <h4>${template.title}</h4>
                                        <p>${template.description}</p>
                                        <button class="btn-outline" onclick="PhoenixPlanets.Mars.useTemplate('${template.id}')">
                                            Use Template
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- AI Suggestions -->
                        <div class="goal-suggestions-section">
                            <h3>💡 AI-Suggested Goals</h3>
                            <div class="suggestions-list">
                                ${suggestions.map(suggestion => `
                                    <div class="suggestion-card">
                                        <div class="suggestion-content">
                                            <h4>${suggestion.title}</h4>
                                            <p>${suggestion.reason}</p>
                                            <div class="suggestion-details">
                                                <span>Timeline: ${suggestion.timeline}</span>
                                                <span>Difficulty: ${suggestion.difficulty}</span>
                                            </div>
                                        </div>
                                        <button class="btn-primary" onclick="PhoenixPlanets.Mars.acceptSuggestion('${suggestion.id}')">
                                            Add Goal
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading goals:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadHabits() {
            const content = document.getElementById('mars-content');
            
            try {
                const habits = await PhoenixCore.API.mars.habits.list();

                content.innerHTML = `
                    <div class="habits-view">
                        <div class="habits-header">
                            <h2>✅ Habit Tracking</h2>
                            <button class="btn-primary" onclick="PhoenixPlanets.Mars.createHabit()">
                                ➕ New Habit
                            </button>
                        </div>

                        <div class="habits-grid">
                            ${habits.map(habit => `
                                <div class="habit-card">
                                    <div class="habit-header">
                                        <h3>${habit.name}</h3>
                                        <span class="habit-streak">🔥 ${habit.streak} days</span>
                                    </div>
                                    <div class="habit-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${habit.completionRate}%"></div>
                                        </div>
                                        <span>${habit.completionRate}% completion rate</span>
                                    </div>
                                    <div class="habit-calendar">
                                        ${this.renderHabitCalendar(habit.history)}
                                    </div>
                                    <button class="btn-primary" onclick="PhoenixPlanets.Mars.logHabit('${habit.id}')">
                                        ✓ Mark Complete
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading habits:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadAnalytics() {
            const content = document.getElementById('mars-content');
            
            try {
                const [velocity, predictions, bottlenecks] = await Promise.all([
                    PhoenixCore.API.mars.progress.velocity(),
                    PhoenixCore.API.mars.progress.predictions(),
                    PhoenixCore.API.mars.progress.bottlenecks()
                ]);

                content.innerHTML = `
                    <div class="analytics-view">
                        <div class="analytics-header">
                            <h2>📈 Progress Analytics</h2>
                        </div>

                        <!-- Velocity Analysis -->
                        <div class="velocity-section">
                            <h3>⚡ Velocity Analysis</h3>
                            <div class="velocity-chart">
                                <canvas id="velocity-chart"></canvas>
                            </div>
                            <div class="velocity-insights">
                                <div class="insight-item">
                                    <strong>Current Velocity:</strong> ${velocity.score}
                                </div>
                                <div class="insight-item">
                                    <strong>Trend:</strong> ${velocity.trend > 0 ? '📈 Improving' : '📉 Declining'}
                                </div>
                                <div class="insight-item">
                                    <strong>Average Time to Goal:</strong> ${velocity.averageTime} days
                                </div>
                            </div>
                        </div>

                        <!-- Predictions -->
                        <div class="predictions-section">
                            <h3>🔮 Goal Predictions</h3>
                            <div class="predictions-grid">
                                ${predictions.goals.map(pred => `
                                    <div class="prediction-card ${pred.status}">
                                        <h4>${pred.goalTitle}</h4>
                                        <div class="prediction-probability">
                                            <span class="probability-value">${pred.probability}%</span>
                                            <span class="probability-label">Completion Probability</span>
                                        </div>
                                        <div class="prediction-date">
                                            Expected: ${new Date(pred.expectedDate).toLocaleDateString()}
                                        </div>
                                        ${pred.recommendation ? `
                                            <div class="prediction-recommendation">
                                                💡 ${pred.recommendation}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Bottlenecks -->
                        <div class="bottlenecks-section">
                            <h3>🚧 Bottleneck Analysis</h3>
                            <div class="bottlenecks-list">
                                ${bottlenecks.map(bottleneck => `
                                    <div class="bottleneck-card">
                                        <div class="bottleneck-severity ${bottleneck.severity}">
                                            ${bottleneck.severity.toUpperCase()}
                                        </div>
                                        <div class="bottleneck-content">
                                            <h4>${bottleneck.title}</h4>
                                            <p>${bottleneck.description}</p>
                                            <div class="bottleneck-impact">
                                                Affecting: ${bottleneck.affectedGoals.join(', ')}
                                            </div>
                                        </div>
                                        <div class="bottleneck-solutions">
                                            <h5>Suggested Solutions:</h5>
                                            ${bottleneck.solutions.map(solution => `
                                                <button class="solution-btn" onclick="PhoenixPlanets.Mars.applySolution('${bottleneck.id}', '${solution.id}')">
                                                    ${solution.description}
                                                </button>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading analytics:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        formatDeadline(deadline) {
            const date = new Date(deadline);
            const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
            if (days < 0) return '⚠️ Overdue';
            if (days === 0) return '🔥 Due today';
            if (days <= 7) return `⏰ ${days} days left`;
            return `📅 ${date.toLocaleDateString()}`;
        }

        renderHabitCalendar(history) {
            // Simplified habit calendar - last 30 days
            return `
                <div class="habit-calendar-grid">
                    ${Array.from({length: 30}, (_, i) => {
                        const completed = history[i];
                        return `<div class="calendar-day ${completed ? 'completed' : 'missed'}"></div>`;
                    }).join('')}
                </div>
            `;
        }
    }

    // ============================================================================
    // JUPITER PLANET - FINANCE
    // ============================================================================

    class JupiterPlanet {
        constructor() {
            this.currentView = 'dashboard';
        }

        async render(container) {
            container.innerHTML = `
                <div class="planet-jupiter">
                    <div class="planet-header">
                        <div class="planet-icon">♃</div>
                        <div class="planet-title">
                            <h1>Jupiter</h1>
                            <p class="planet-subtitle">Financial Intelligence</p>
                        </div>
                        <div class="planet-actions">
                            <button class="btn-primary" onclick="PhoenixPlanets.Jupiter.linkAccount()">
                                🏦 Link Account
                            </button>
                            <button class="btn-secondary" onclick="PhoenixPlanets.Jupiter.sync()">
                                🔄 Sync
                            </button>
                        </div>
                    </div>

                    <div class="jupiter-nav">
                        <button class="nav-btn active" data-view="dashboard" onclick="PhoenixPlanets.Jupiter.switchView('dashboard')">
                            📊 Dashboard
                        </button>
                        <button class="nav-btn" data-view="transactions" onclick="PhoenixPlanets.Jupiter.switchView('transactions')">
                            💳 Transactions
                        </button>
                        <button class="nav-btn" data-view="budgets" onclick="PhoenixPlanets.Jupiter.switchView('budgets')">
                            💰 Budgets
                        </button>
                        <button class="nav-btn" data-view="insights" onclick="PhoenixPlanets.Jupiter.switchView('insights')">
                            🧠 Insights
                        </button>
                    </div>

                    <div id="jupiter-content" class="planet-content">
                        <div class="loading-spinner">Loading Jupiter data...</div>
                    </div>
                </div>
            `;

            await this.loadDashboard();
        }

        async switchView(view) {
            this.currentView = view;
            
            document.querySelectorAll('.jupiter-nav .nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === view) btn.classList.add('active');
            });

            const content = document.getElementById('jupiter-content');
            content.innerHTML = '<div class="loading-spinner">Loading...</div>';

            switch(view) {
                case 'dashboard': await this.loadDashboard(); break;
                case 'transactions': await this.loadTransactions(); break;
                case 'budgets': await this.loadBudgets(); break;
                case 'insights': await this.loadInsights(); break;
            }
        }

        async loadDashboard() {
            const content = document.getElementById('jupiter-content');
            
            try {
                const [accounts, patterns, stressCorrelation] = await Promise.all([
                    PhoenixCore.API.jupiter.accounts(),
                    PhoenixCore.API.jupiter.spendingPatterns(),
                    PhoenixCore.API.jupiter.stressCorrelation()
                ]);

                const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

                content.innerHTML = `
                    <div class="jupiter-dashboard">
                        <!-- Financial Overview -->
                        <div class="financial-overview">
                            <div class="overview-card large">
                                <div class="card-icon">💰</div>
                                <div class="card-content">
                                    <div class="card-value">$${totalBalance.toLocaleString()}</div>
                                    <div class="card-label">Total Balance</div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-icon">📈</div>
                                <div class="card-content">
                                    <div class="card-value">$${patterns.monthlyIncome.toLocaleString()}</div>
                                    <div class="card-label">Monthly Income</div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-icon">📉</div>
                                <div class="card-content">
                                    <div class="card-value">$${patterns.monthlySpending.toLocaleString()}</div>
                                    <div class="card-label">Monthly Spending</div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-icon">💎</div>
                                <div class="card-content">
                                    <div class="card-value">$${(patterns.monthlyIncome - patterns.monthlySpending).toLocaleString()}</div>
                                    <div class="card-label">Net Savings</div>
                                </div>
                            </div>
                        </div>

                        <!-- Stress-Spending Correlation -->
                        <div class="stress-correlation-section">
                            <h3>🧠 Stress-Spending Correlation</h3>
                            <div class="correlation-card featured">
                                <div class="correlation-visual">
                                    <div class="correlation-value ${stressCorrelation.strength}">
                                        ${(stressCorrelation.coefficient * 100).toFixed(0)}%
                                    </div>
                                    <div class="correlation-label">Correlation Strength</div>
                                </div>
                                <div class="correlation-insights">
                                    <h4>${stressCorrelation.title}</h4>
                                    <p>${stressCorrelation.description}</p>
                                    <div class="correlation-stats">
                                        <div class="stat">
                                            <span class="stat-label">Stress Purchases</span>
                                            <span class="stat-value">${stressCorrelation.stressPurchases}</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-label">Amount Spent</span>
                                            <span class="stat-value">$${stressCorrelation.amount.toLocaleString()}</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-label">Potential Savings</span>
                                            <span class="stat-value highlight">$${stressCorrelation.potentialSavings.toLocaleString()}/mo</span>
                                        </div>
                                    </div>
                                    ${stressCorrelation.interventionsActive ? `
                                        <div class="intervention-status">
                                            ✓ Phoenix is monitoring and will intervene before stress purchases
                                        </div>
                                    ` : `
                                        <button class="btn-primary" onclick="PhoenixPlanets.Jupiter.enableInterventions()">
                                            Enable Stress-Purchase Prevention
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>

                        <!-- Connected Accounts -->
                        <div class="connected-accounts">
                            <h3>🏦 Connected Accounts</h3>
                            <div class="accounts-grid">
                                ${accounts.map(account => `
                                    <div class="account-card">
                                        <div class="account-header">
                                            <div class="account-icon">${this.getAccountIcon(account.type)}</div>
                                            <div class="account-info">
                                                <h4>${account.name}</h4>
                                                <p>${account.institutionName}</p>
                                            </div>
                                        </div>
                                        <div class="account-balance">
                                            <div class="balance-value">$${account.balance.toLocaleString()}</div>
                                            <div class="balance-type">${account.type}</div>
                                        </div>
                                        <div class="account-meta">
                                            <span>Last synced: ${this.formatTimeAgo(account.lastSync)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Spending Patterns -->
                        <div class="spending-patterns">
                            <h3>📊 Spending Patterns</h3>
                            <div class="patterns-chart">
                                <canvas id="spending-chart"></canvas>
                            </div>
                            <div class="patterns-breakdown">
                                ${Object.entries(patterns.byCategory).map(([category, amount]) => `
                                    <div class="category-row">
                                        <div class="category-name">
                                            <span class="category-icon">${this.getCategoryIcon(category)}</span>
                                            ${category}
                                        </div>
                                        <div class="category-bar">
                                            <div class="category-fill" style="width: ${(amount / patterns.monthlySpending) * 100}%"></div>
                                        </div>
                                        <div class="category-amount">$${amount.toLocaleString()}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading Jupiter dashboard:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadTransactions() {
            const content = document.getElementById('jupiter-content');
            
            try {
                const transactions = await PhoenixCore.API.jupiter.transactions();

                content.innerHTML = `
                    <div class="transactions-view">
                        <div class="transactions-header">
                            <h2>💳 Transactions</h2>
                            <div class="transaction-filters">
                                <input type="text" placeholder="Search transactions..." class="search-input">
                                <select class="filter-select">
                                    <option value="all">All Categories</option>
                                    <option value="food">Food & Dining</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="transport">Transportation</option>
                                    <option value="bills">Bills & Utilities</option>
                                </select>
                            </div>
                        </div>

                        <div class="transactions-list">
                            ${transactions.map(tx => `
                                <div class="transaction-item">
                                    <div class="tx-icon">${this.getCategoryIcon(tx.category)}</div>
                                    <div class="tx-info">
                                        <div class="tx-merchant">${tx.merchantName || tx.name}</div>
                                        <div class="tx-meta">
                                            <span class="tx-category">${tx.category}</span>
                                            <span class="tx-date">${new Date(tx.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div class="tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}">
                                        ${tx.amount > 0 ? '+' : ''}$${Math.abs(tx.amount).toLocaleString()}
                                    </div>
                                    <button class="tx-action" onclick="PhoenixPlanets.Jupiter.viewTransaction('${tx.id}')">
                                        Details
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading transactions:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadBudgets() {
            const content = document.getElementById('jupiter-content');
            
            try {
                const [budgets, alerts] = await Promise.all([
                    PhoenixCore.API.jupiter.budgets.list(),
                    PhoenixCore.API.jupiter.budgets.alerts()
                ]);

                content.innerHTML = `
                    <div class="budgets-view">
                        <div class="budgets-header">
                            <h2>💰 Budgets</h2>
                            <button class="btn-primary" onclick="PhoenixPlanets.Jupiter.createBudget()">
                                ➕ Create Budget
                            </button>
                        </div>

                        ${alerts.length > 0 ? `
                            <div class="budget-alerts">
                                <h3>⚠️ Budget Alerts</h3>
                                ${alerts.map(alert => `
                                    <div class="alert-card ${alert.severity}">
                                        <div class="alert-icon">${alert.icon}</div>
                                        <div class="alert-content">
                                            <h4>${alert.title}</h4>
                                            <p>${alert.message}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        <div class="budgets-grid">
                            ${budgets.map(budget => `
                                <div class="budget-card">
                                    <div class="budget-header">
                                        <h3>${budget.category}</h3>
                                        <span class="budget-period">${budget.period}</span>
                                    </div>
                                    <div class="budget-progress">
                                        <div class="progress-bar ${budget.percentUsed >= 90 ? 'danger' : budget.percentUsed >= 75 ? 'warning' : ''}">
                                            <div class="progress-fill" style="width: ${budget.percentUsed}%"></div>
                                        </div>
                                        <div class="progress-text">
                                            <span>$${budget.spent.toLocaleString()} / $${budget.limit.toLocaleString()}</span>
                                            <span>${budget.percentUsed}% used</span>
                                        </div>
                                    </div>
                                    <div class="budget-remaining">
                                        <span>Remaining: $${(budget.limit - budget.spent).toLocaleString()}</span>
                                    </div>
                                    <button class="btn-outline" onclick="PhoenixPlanets.Jupiter.editBudget('${budget.id}')">
                                        Edit Budget
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading budgets:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadInsights() {
            const content = document.getElementById('jupiter-content');
            
            try {
                const [patterns, recurring, stressCorrelation] = await Promise.all([
                    PhoenixCore.API.jupiter.spendingPatterns(),
                    PhoenixCore.API.jupiter.transactions.recurring(),
                    PhoenixCore.API.jupiter.stressCorrelation()
                ]);

                content.innerHTML = `
                    <div class="insights-view">
                        <div class="insights-header">
                            <h2>🧠 Financial Insights</h2>
                        </div>

                        <!-- Key Insights -->
                        <div class="key-insights">
                            <div class="insight-card featured">
                                <div class="insight-icon">🧠</div>
                                <div class="insight-content">
                                    <h3>Stress-Purchase Pattern Detected</h3>
                                    <p>${stressCorrelation.description}</p>
                                    <div class="insight-stats">
                                        <span>Correlation: ${(stressCorrelation.coefficient * 100).toFixed(0)}%</span>
                                        <span>Potential Savings: $${stressCorrelation.potentialSavings.toLocaleString()}/mo</span>
                                    </div>
                                </div>
                            </div>

                            ${patterns.insights.map(insight => `
                                <div class="insight-card">
                                    <div class="insight-icon">${insight.icon}</div>
                                    <div class="insight-content">
                                        <h4>${insight.title}</h4>
                                        <p>${insight.message}</p>
                                        ${insight.action ? `
                                            <button class="btn-primary" onclick="${insight.action}">
                                                ${insight.actionLabel}
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Recurring Transactions -->
                        <div class="recurring-section">
                            <h3>🔄 Recurring Transactions</h3>
                            <div class="recurring-list">
                                ${recurring.map(tx => `
                                    <div class="recurring-item">
                                        <div class="recurring-info">
                                            <h4>${tx.merchantName}</h4>
                                            <p>Every ${tx.frequency}</p>
                                        </div>
                                        <div class="recurring-amount">$${tx.amount.toLocaleString()}</div>
                                        <div class="recurring-next">
                                            Next: ${new Date(tx.nextDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading insights:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        getAccountIcon(type) {
            const icons = {
                checking: '🏦',
                savings: '💰',
                credit: '💳',
                investment: '📈'
            };
            return icons[type] || '🏦';
        }

        getCategoryIcon(category) {
            const icons = {
                food: '🍔',
                shopping: '🛍️',
                transport: '🚗',
                bills: '📄',
                entertainment: '🎬',
                health: '⚕️',
                other: '📦'
            };
            return icons[category.toLowerCase()] || '📦';
        }

        formatTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
        }
    }

    // ============================================================================
    // SATURN PLANET - LIFE VISION
    // ============================================================================

    class SaturnPlanet {
        constructor() {
            this.currentView = 'dashboard';
        }

        async render(container) {
            container.innerHTML = `
                <div class="planet-saturn">
                    <div class="planet-header">
                        <div class="planet-icon">♄</div>
                        <div class="planet-title">
                            <h1>Saturn</h1>
                            <p class="planet-subtitle">Life Vision & Purpose</p>
                        </div>
                        <div class="planet-actions">
                            <button class="btn-primary" onclick="PhoenixPlanets.Saturn.defineVision()">
                                ✨ Define Vision
                            </button>
                        </div>
                    </div>

                    <div class="saturn-nav">
                        <button class="nav-btn active" data-view="dashboard" onclick="PhoenixPlanets.Saturn.switchView('dashboard')">
                            📊 Dashboard
                        </button>
                        <button class="nav-btn" data-view="vision" onclick="PhoenixPlanets.Saturn.switchView('vision')">
                            🎯 North Star
                        </button>
                        <button class="nav-btn" data-view="values" onclick="PhoenixPlanets.Saturn.switchView('values')">
                            💎 Values
                        </button>
                        <button class="nav-btn" data-view="legacy" onclick="PhoenixPlanets.Saturn.switchView('legacy')">
                            🏛️ Legacy
                        </button>
                    </div>

                    <div id="saturn-content" class="planet-content">
                        <div class="loading-spinner">Loading Saturn data...</div>
                    </div>
                </div>
            `;

            await this.loadDashboard();
        }

        async switchView(view) {
            this.currentView = view;
            
            document.querySelectorAll('.saturn-nav .nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === view) btn.classList.add('active');
            });

            const content = document.getElementById('saturn-content');
            content.innerHTML = '<div class="loading-spinner">Loading...</div>';

            switch(view) {
                case 'dashboard': await this.loadDashboard(); break;
                case 'vision': await this.loadVision(); break;
                case 'values': await this.loadValues(); break;
                case 'legacy': await this.loadLegacy(); break;
            }
        }

        async loadDashboard() {
            const content = document.getElementById('saturn-content');
            
            try {
                const vision = await PhoenixCore.API.saturn.vision();

                content.innerHTML = `
                    <div class="saturn-dashboard">
                        ${vision.defined ? `
                            <!-- Vision Overview -->
                            <div class="vision-overview">
                                <div class="vision-statement">
                                    <h2>Your North Star</h2>
                                    <blockquote class="vision-quote">
                                        "${vision.statement}"
                                    </blockquote>
                                    <div class="vision-meta">
                                        <span>Defined: ${new Date(vision.definedDate).toLocaleDateString()}</span>
                                        <span>Last reviewed: ${this.formatTimeAgo(vision.lastReview)}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Alignment Score -->
                            <div class="alignment-section">
                                <h3>🎯 Vision Alignment</h3>
                                <div class="alignment-score">
                                    <div class="score-circle">
                                        <svg viewBox="0 0 200 200">
                                            <circle cx="100" cy="100" r="80" fill="none" stroke="#1a1a2e" stroke-width="15"/>
                                            <circle cx="100" cy="100" r="80" fill="none" stroke="#00ff88" stroke-width="15"
                                                    stroke-dasharray="${(vision.alignmentScore / 100) * 502} 502" 
                                                    stroke-linecap="round" transform="rotate(-90 100 100)"/>
                                        </svg>
                                        <div class="score-text">
                                            <div class="score-number">${vision.alignmentScore}</div>
                                            <div class="score-label">Alignment</div>
                                        </div>
                                    </div>
                                    <div class="alignment-details">
                                        <h4>Your daily actions are ${vision.alignmentScore >= 70 ? 'strongly' : vision.alignmentScore >= 40 ? 'moderately' : 'weakly'} aligned with your vision</h4>
                                        <div class="alignment-factors">
                                            ${vision.alignmentFactors.map(factor => `
                                                <div class="factor-item">
                                                    <span class="factor-name">${factor.name}</span>
                                                    <div class="factor-bar">
                                                        <div class="factor-fill" style="width: ${factor.score}%"></div>
                                                    </div>
                                                    <span class="factor-score">${factor.score}%</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Core Values -->
                            <div class="values-section">
                                <h3>💎 Core Values</h3>
                                <div class="values-grid">
                                    ${vision.values.map(value => `
                                        <div class="value-card">
                                            <div class="value-icon">${value.icon}</div>
                                            <h4>${value.name}</h4>
                                            <p>${value.description}</p>
                                            <div class="value-alignment">
                                                Living this: ${value.alignment}%
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Progress Towards Vision -->
                            <div class="vision-progress">
                                <h3>📈 Progress Towards Vision</h3>
                                <div class="milestones-timeline">
                                    ${vision.milestones.map(milestone => `
                                        <div class="milestone-item ${milestone.completed ? 'completed' : 'pending'}">
                                            <div class="milestone-marker"></div>
                                            <div class="milestone-content">
                                                <h4>${milestone.title}</h4>
                                                <p>${milestone.description}</p>
                                                <div class="milestone-date">
                                                    ${milestone.completed ? 
                                                        `✓ Completed ${new Date(milestone.completedDate).toLocaleDateString()}` : 
                                                        `Target: ${new Date(milestone.targetDate).toLocaleDateString()}`
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : `
                            <!-- Vision Not Defined -->
                            <div class="vision-empty-state">
                                <div class="empty-visual">
                                    <div class="stars-animation"></div>
                                    <h2>✨ Define Your North Star</h2>
                                </div>
                                <div class="empty-content">
                                    <p>Your North Star is your life's vision - the ultimate purpose that guides all your decisions.</p>
                                    <p>Phoenix will help you discover and define your vision through a guided process.</p>
                                    <button class="btn-primary large" onclick="PhoenixPlanets.Saturn.startVisionQuest()">
                                        Begin Vision Quest
                                    </button>
                                </div>
                                <div class="vision-benefits">
                                    <h3>Why Define Your Vision?</h3>
                                    <div class="benefits-grid">
                                        <div class="benefit-item">
                                            <div class="benefit-icon">🎯</div>
                                            <h4>Clear Direction</h4>
                                            <p>Know exactly what you're working towards</p>
                                        </div>
                                        <div class="benefit-item">
                                            <div class="benefit-icon">⚡</div>
                                            <h4>Aligned Actions</h4>
                                            <p>Make decisions that serve your purpose</p>
                                        </div>
                                        <div class="benefit-item">
                                            <div class="benefit-icon">🚀</div>
                                            <h4>Accelerated Growth</h4>
                                            <p>Focus energy on what truly matters</p>
                                        </div>
                                        <div class="benefit-item">
                                            <div class="benefit-icon">😌</div>
                                            <h4>Inner Peace</h4>
                                            <p>Live with clarity and purpose</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `}
                    </div>
                `;

            } catch (error) {
                console.error('Error loading Saturn dashboard:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadVision() {
            const content = document.getElementById('saturn-content');
            
            try {
                const vision = await PhoenixCore.API.saturn.vision();

                content.innerHTML = `
                    <div class="vision-view">
                        <div class="vision-editor">
                            <h2>🎯 Your North Star</h2>
                            <textarea class="vision-input" placeholder="What is your life's ultimate purpose?">${vision.statement || ''}</textarea>
                            <button class="btn-primary" onclick="PhoenixPlanets.Saturn.saveVision()">
                                Save Vision
                            </button>
                        </div>

                        <div class="vision-guide">
                            <h3>Crafting Your Vision</h3>
                            <div class="guide-sections">
                                <div class="guide-section">
                                    <h4>What is a North Star?</h4>
                                    <p>Your North Star is a clear, compelling vision of who you want to become and the impact you want to have on the world. It's your life's GPS.</p>
                                </div>
                                <div class="guide-section">
                                    <h4>Questions to Consider</h4>
                                    <ul>
                                        <li>What do you want to be remembered for?</li>
                                        <li>What would you do if money wasn't a concern?</li>
                                        <li>What problems do you want to solve?</li>
                                        <li>Who do you want to help?</li>
                                        <li>What legacy do you want to leave?</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading vision:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadValues() {
            const content = document.getElementById('saturn-content');
            
            try {
                const values = await PhoenixCore.API.saturn.values();

                content.innerHTML = `
                    <div class="values-view">
                        <div class="values-header">
                            <h2>💎 Core Values</h2>
                            <p>Values are the principles that guide your decisions and actions</p>
                        </div>

                        <div class="values-list">
                            ${values.map(value => `
                                <div class="value-card-detailed">
                                    <div class="value-main">
                                        <div class="value-icon">${value.icon}</div>
                                        <div class="value-info">
                                            <h3>${value.name}</h3>
                                            <p>${value.description}</p>
                                        </div>
                                    </div>
                                    <div class="value-alignment-bar">
                                        <div class="alignment-label">How well are you living this value?</div>
                                        <div class="alignment-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${value.alignment}%"></div>
                                            </div>
                                            <span>${value.alignment}%</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <button class="btn-primary" onclick="PhoenixPlanets.Saturn.addValue()">
                            ➕ Add Value
                        </button>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading values:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        async loadLegacy() {
            const content = document.getElementById('saturn-content');
            
            try {
                const legacy = await PhoenixCore.API.saturn.legacy();

                content.innerHTML = `
                    <div class="legacy-view">
                        <div class="legacy-header">
                            <h2>🏛️ Your Legacy</h2>
                            <p>What will you leave behind?</p>
                        </div>

                        <div class="legacy-content">
                            <div class="legacy-statement">
                                <h3>Legacy Statement</h3>
                                <textarea class="legacy-input" placeholder="How do you want to be remembered?">${legacy.statement || ''}</textarea>
                            </div>

                            <div class="legacy-projects">
                                <h3>Legacy Projects</h3>
                                <div class="projects-list">
                                    ${legacy.projects?.map(project => `
                                        <div class="project-card">
                                            <h4>${project.name}</h4>
                                            <p>${project.description}</p>
                                            <div class="project-status">${project.status}</div>
                                        </div>
                                    `).join('') || '<p>No legacy projects yet</p>'}
                                </div>
                                <button class="btn-outline" onclick="PhoenixPlanets.Saturn.addLegacyProject()">
                                    ➕ Add Project
                                </button>
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Error loading legacy:', error);
                content.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
            }
        }

        formatTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
            if (seconds < 86400) return 'Today';
            if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
            return `${Math.floor(seconds / 604800)} weeks ago`;
        }
    }

    // ============================================================================
    // GLOBAL PHOENIX PLANETS MANAGER
    // ============================================================================

    class PhoenixPlanetsManager {
        constructor() {
            this.planets = {
                Mercury: new MercuryPlanet(),
                Venus: new VenusPlanet(),
                Earth: new EarthPlanet(),
                Mars: new MarsPlanet(),
                Jupiter: new JupiterPlanet(),
                Saturn: new SaturnPlanet()
            };
            this.currentPlanet = null;
        }

        async renderPlanet(planetName, container) {
            if (!this.planets[planetName]) {
                throw new Error(`Planet ${planetName} not found`);
            }

            this.currentPlanet = planetName;
            await this.planets[planetName].render(container);
        }

        getPlanet(planetName) {
            return this.planets[planetName];
        }
    }

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================================================
    // EXPORT
    // ============================================================================

    window.PhoenixPlanets = new PhoenixPlanetsManager();

    // Also export individual planets for direct access
    window.PhoenixPlanets.Mercury = window.PhoenixPlanets.planets.Mercury;
    window.PhoenixPlanets.Venus = window.PhoenixPlanets.planets.Venus;
    window.PhoenixPlanets.Earth = window.PhoenixPlanets.planets.Earth;
    window.PhoenixPlanets.Mars = window.PhoenixPlanets.planets.Mars;
    window.PhoenixPlanets.Jupiter = window.PhoenixPlanets.planets.Jupiter;
    window.PhoenixPlanets.Saturn = window.PhoenixPlanets.planets.Saturn;

    console.log('🪐 Phoenix Planets initialized - All 6 planets ready!');

})();
