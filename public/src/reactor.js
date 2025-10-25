// reactor.js - Phoenix Reactor Core with phoenixStore Integration
// Real-time backend data visualization | Smart particle system | Live biometrics

class ReactorCore {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.beams = [];
        this.dataStreams = [];
        this.hudElements = [];
        this.animationFrame = null;
        this.energy = 100;
        this.pulsePhase = 0;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.trustScore = 0;
        this.syncStatus = 'IDLE';
        this.mode = 'PAL';
        this.liveMetrics = {
            hrv: 0,
            rhr: 0,
            recovery: 0,
            spo2: 98
        };
        this.unsubscribe = null;
        this.storeConnected = false;
        
        // ⭐ NEW: Real backend URL
        this.baseURL = 'https://pal-backend-production.up.railway.app/api';
        
        // Pattern and prediction data
        this.patterns = [];
        this.predictions = [];
        this.burnoutRisk = 0;
    }

    init() {
        console.log('⚡ Initializing Enhanced Reactor Core...');
        this.createCanvas();
        this.generateParticles();
        this.setupBeams();
        this.setupDataStreams();
        this.setupHUD();
        this.connectToStore();
        this.loadPatternData(); // Load pattern/prediction data
        this.animate();
        this.setupResizeHandler();
        console.log('✅ Reactor Core initialized');
    }

    // ========================================
    // ⭐ NEW: REAL BACKEND API METHODS
    // ========================================

    getAuthHeaders() {
        const token = localStorage.getItem('phoenix_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async getPatterns() {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/patterns`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                return await response.json();
            }
            console.warn('Failed to fetch patterns:', response.status);
            return [];
        } catch (error) {
            console.error('Error fetching patterns:', error);
            return [];
        }
    }

    async analyzePatterns(data) {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/patterns/analyze`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error analyzing patterns:', error);
            return null;
        }
    }

    async getRealtimePatterns() {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/patterns/realtime`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching realtime patterns:', error);
            return [];
        }
    }

    async validatePattern(patternData) {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/patterns/validate`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(patternData)
            });
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error validating pattern:', error);
            return null;
        }
    }

    async deletePattern(patternId) {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/patterns/${patternId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting pattern:', error);
            return false;
        }
    }

    async getPredictions() {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/predictions`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching predictions:', error);
            return [];
        }
    }

    async getActivePredictions() {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/predictions/active`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching active predictions:', error);
            return [];
        }
    }

    async requestPrediction(predictionRequest) {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/predictions/request`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(predictionRequest)
            });
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error requesting prediction:', error);
            return null;
        }
    }

    async recordPredictionOutcome(predictionId, outcome) {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/predictions/${predictionId}/outcome`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(outcome)
            });
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error recording prediction outcome:', error);
            return null;
        }
    }

    async getPredictionAccuracy() {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/predictions/accuracy`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                return await response.json();
            }
            return { overall: 0, byType: {} };
        } catch (error) {
            console.error('Error fetching prediction accuracy:', error);
            return { overall: 0, byType: {} };
        }
    }

    async getForecast(days = 7) {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/predictions/forecast?days=${days}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching forecast:', error);
            return [];
        }
    }

    async getBurnoutRisk() {
        try {
            const response = await fetch(`${this.baseURL}/phoenix/predictions/burnout-risk`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                return data;
            }
            return { risk: 0, factors: [] };
        } catch (error) {
            console.error('Error fetching burnout risk:', error);
            return { risk: 0, factors: [] };
        }
    }

    // ========================================
    // ⭐ NEW: PATTERN DATA LOADING
    // ========================================

    async loadPatternData() {
        console.log('🔍 Loading pattern and prediction data...');
        
        try {
            // Load patterns
            const patterns = await this.getPatterns();
            if (patterns && patterns.length > 0) {
                this.patterns = patterns;
                console.log(`✅ Loaded ${patterns.length} patterns`);
                
                // Trigger visual effect for detected patterns
                this.activateBeam(4); // Jupiter beam for pattern detection
                setTimeout(() => this.deactivateBeam(4), 1000);
            }

            // Load active predictions
            const predictions = await getActivePredictions();
            if (predictions && predictions.length > 0) {
                this.predictions = predictions;
                console.log(`✅ Loaded ${predictions.length} active predictions`);
            }

            // Load burnout risk
            const burnoutData = await this.getBurnoutRisk();
            if (burnoutData && burnoutData.risk !== undefined) {
                this.burnoutRisk = burnoutData.risk;
                console.log(`⚠️ Burnout risk: ${this.burnoutRisk}%`);
                
                // Visual warning if high burnout risk
                if (this.burnoutRisk > 70) {
                    this.activateBeam(5); // Saturn beam for warning
                    this.energy = Math.min(this.energy, 50); // Lower visual energy
                }
            }

            // Load prediction accuracy for trust score
            const accuracy = await this.getPredictionAccuracy();
            if (accuracy && accuracy.overall !== undefined) {
                this.setTrustScore(accuracy.overall * 100);
                console.log(`🎯 Prediction accuracy: ${Math.round(accuracy.overall * 100)}%`);
            }

        } catch (error) {
            console.error('Failed to load pattern data:', error);
        }

        // Refresh pattern data every 30 seconds
        setInterval(() => {
            this.refreshPatternData();
        }, 30000);
    }

    async refreshPatternData() {
        // Silently refresh without console logs
        try {
            const realtimePatterns = await this.getRealtimePatterns();
            if (realtimePatterns && realtimePatterns.length > 0) {
                this.patterns = realtimePatterns;
                
                // Subtle beam pulse for new patterns
                this.activateBeam(4);
                setTimeout(() => this.deactivateBeam(4), 500);
            }
        } catch (error) {
            // Silent fail
        }
    }

    // ========================================
    // ⭐ PHOENIXSTORE INTEGRATION
    // ========================================

    connectToStore() {
        // Wait for phoenixStore to be available
        const checkStore = setInterval(() => {
            if (window.phoenixStore) {
                clearInterval(checkStore);
                this.initializeStoreConnection();
            }
        }, 100);

        // Fallback timeout after 5 seconds
        setTimeout(() => {
            if (!this.storeConnected) {
                clearInterval(checkStore);
                console.warn('⚠️ phoenixStore not available, using fallback polling');
                this.connectToBackendFallback();
            }
        }, 5000);
    }

    initializeStoreConnection() {
        console.log('📡 Connecting to phoenixStore...');
        
        // Subscribe to store updates for real-time data
        this.unsubscribe = window.phoenixStore.subscribe((key, value) => {
            this.onStoreUpdate(key, value);
        });

        this.storeConnected = true;
        this.syncStatus = 'CONNECTED';
        console.log('✅ Reactor Core connected to phoenixStore');

        // Load initial data
        this.loadInitialData();
    }

    onStoreUpdate(key, value) {
        if (!value) return;

        console.log(`📊 Store update received: ${key}`, value);

        // Update based on planet data
        switch(key) {
            case 'mercury':
                // Health metrics
                this.updateHealthMetrics(value);
                this.activateBeam(0); // Mercury beam pulse
                setTimeout(() => this.deactivateBeam(0), 1000);
                break;

            case 'venus':
                // Fitness metrics
                this.updateFitnessMetrics(value);
                this.activateBeam(1); // Venus beam pulse
                setTimeout(() => this.deactivateBeam(1), 1000);
                break;

            case 'earth':
                // Calendar events
                this.activateBeam(2);
                setTimeout(() => this.deactivateBeam(2), 1000);
                break;

            case 'mars':
                // Goals progress
                this.updateGoalsMetrics(value);
                this.activateBeam(3);
                setTimeout(() => this.deactivateBeam(3), 1000);
                break;

            case 'jupiter':
                // Financial data
                this.activateBeam(4);
                setTimeout(() => this.deactivateBeam(4), 1000);
                break;

            case 'saturn':
                // Legacy data
                this.activateBeam(5);
                setTimeout(() => this.deactivateBeam(5), 1000);
                break;
        }
    }

    updateHealthMetrics(data) {
        // Extract health metrics from mercury data
        const wearable = data.wearable || {};
        const recovery = data.recovery || {};
        const hrv = data.hrv || {};

        // Update live metrics
        this.liveMetrics.hrv = hrv.value || wearable.hrv || 0;
        this.liveMetrics.rhr = wearable.heartRate || 0;
        this.liveMetrics.recovery = recovery.recoveryScore || 0;
        this.liveMetrics.spo2 = wearable.spo2 || 98;

        // Update energy based on recovery score
        const recoveryScore = recovery.recoveryScore || 0;
        if (recoveryScore > 0) {
            this.setEnergy(recoveryScore);
        }

        console.log('💓 Health metrics updated:', this.liveMetrics);
    }

    updateFitnessMetrics(data) {
        const workouts = data.workouts || [];
        
        // Increase energy briefly when workouts are logged
        if (workouts.length > 0) {
            const tempEnergy = Math.min(100, this.energy + 10);
            this.setEnergy(tempEnergy);
            
            // Return to normal after animation
            setTimeout(() => {
                this.setEnergy(this.liveMetrics.recovery || 100);
            }, 2000);
        }
    }

    updateGoalsMetrics(data) {
        const goals = data.goals || [];
        
        if (goals.length > 0) {
            const completed = goals.filter(g => g.completed).length;
            const total = goals.length;
            const completionRate = total > 0 ? (completed / total) * 100 : 0;
            
            this.setTrustScore(completionRate);
            console.log('🎯 Goals completion rate:', completionRate);
        }
    }

    async loadInitialData() {
        // Try to load initial data from store state
        const state = window.phoenixStore.state;

        if (state.mercury) {
            this.updateHealthMetrics(state.mercury);
        }

        if (state.mars) {
            this.updateGoalsMetrics(state.mars);
        }

        // Trigger initial data load if empty
        if (!state.mercury || !state.venus) {
            console.log('🔄 Triggering initial planet data load...');
            this.syncStatus = 'SYNCING';
            
            const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
            for (const planet of planets) {
                try {
                    await window.phoenixStore.loadPlanet(planet);
                } catch (error) {
                    console.warn(`Failed to load ${planet}:`, error);
                }
            }
            
            this.syncStatus = 'SYNCED';
        }
    }

    // Fallback polling if store not available
    connectToBackendFallback() {
        console.log('🔄 Using fallback polling mode');
        
        setInterval(() => {
            if (window.jarvisEngine) {
                const userData = window.jarvisEngine.userData || {};
                
                this.liveMetrics.hrv = userData.hrv || 0;
                this.liveMetrics.rhr = userData.heartRate || 0;
                this.liveMetrics.recovery = userData.recoveryScore || 0;
                this.liveMetrics.spo2 = userData.spo2 || 98;
                
                this.setEnergy(userData.recoveryScore || 100);
                this.setTrustScore(window.jarvisEngine.trustScore || 0);
                this.mode = window.jarvisEngine.mode || 'PAL';
            }
        }, 2000);
    }

    // ========================================
    // CANVAS SETUP
    // ========================================

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'reactor-canvas';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.ctx = this.canvas.getContext('2d');
    }

    // ========================================
    // PARTICLE SYSTEM
    // ========================================

    generateParticles() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 300;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.3,
                angle: angle,
                orbitSpeed: Math.random() * 0.01 + 0.005,
                baseOrbitSpeed: Math.random() * 0.01 + 0.005
            });
        }
    }

    updateParticles() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.particles.forEach(p => {
            // Orbital motion - speed based on REAL recovery score
            const energyMultiplier = this.energy / 100;
            p.orbitSpeed = p.baseOrbitSpeed * energyMultiplier;
            
            // Clamp speeds to prevent too slow/fast
            p.orbitSpeed = Math.max(0.003, Math.min(0.02, p.orbitSpeed));
            
            p.angle += p.orbitSpeed;
            const distance = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
            
            p.x = centerX + Math.cos(p.angle) * distance;
            p.y = centerY + Math.sin(p.angle) * distance;

            // Add slight random drift
            p.x += p.vx;
            p.y += p.vy;

            // Keep particles in bounds
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            // Pulsing alpha based on energy
            p.alpha = (0.3 + Math.sin(this.pulsePhase + p.angle) * 0.2) * (this.energy / 100);
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
            this.ctx.fill();

            // Glow effect
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${p.alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
        });
    }

    // ========================================
    // ENERGY BEAMS (TO PLANETS)
    // ========================================

    setupBeams() {
        const planetPositions = [
            { x: 0.5, y: 0.25 },  // Mercury (top)
            { x: 0.75, y: 0.4 },  // Venus (top-right)
            { x: 0.75, y: 0.65 }, // Earth (bottom-right)
            { x: 0.25, y: 0.65 }, // Mars (bottom-left)
            { x: 0.25, y: 0.4 },  // Jupiter (top-left)
            { x: 0.5, y: 0.8 }    // Saturn (bottom)
        ];

        planetPositions.forEach((pos, i) => {
            this.beams.push({
                targetX: this.width * pos.x,
                targetY: this.height * pos.y,
                intensity: 0,
                phase: i * Math.PI / 3,
                active: false, // Inactive by default, activated on data updates
                planetIndex: i,
                activationTime: 0
            });
        });
    }

    drawEnergyBeams() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.beams.forEach((beam, i) => {
            // Beam intensity calculation
            const baseIntensity = beam.active ? 0.5 : 0.1;
            const pulseIntensity = 0.5 + Math.sin(this.pulsePhase + beam.phase) * 0.5;
            const energyMultiplier = this.energy / 100;
            
            // Fade out over time if active
            let activeFade = 1;
            if (beam.active && beam.activationTime > 0) {
                const elapsed = Date.now() - beam.activationTime;
                activeFade = Math.max(0, 1 - (elapsed / 1000)); // Fade over 1 second
            }
            
            const intensity = baseIntensity * pulseIntensity * energyMultiplier * activeFade;
            
            // Main beam
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(beam.targetX, beam.targetY);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.3})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Beam glow
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.1})`;
            this.ctx.lineWidth = 6;
            this.ctx.stroke();
            
            // Extra bright pulse when active
            if (beam.active && activeFade > 0.5) {
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.5})`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
        });
    }

    // ========================================
    // DATA STREAMS
    // ========================================

    setupDataStreams() {
        for (let i = 0; i < 15; i++) {
            this.dataStreams.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: Math.random() * 2 + 1,
                length: Math.random() * 100 + 50,
                chars: this.generateRandomChars(20)
            });
        }
    }

    generateRandomChars(count) {
        const chars = '01ABCDEF';
        let result = '';
        for (let i = 0; i < count; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    drawDataStreams() {
        this.dataStreams.forEach(stream => {
            stream.y += stream.speed;
            if (stream.y > this.height + stream.length) {
                stream.y = -stream.length;
                stream.x = Math.random() * this.width;
                stream.chars = this.generateRandomChars(20);
            }

            this.ctx.font = '12px monospace';
            
            for (let i = 0; i < stream.chars.length; i++) {
                const y = stream.y - i * 15;
                if (y < 0 || y > this.height) continue;

                const alpha = i === 0 ? 0.8 : (1 - i / stream.chars.length) * 0.5;
                this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
                this.ctx.fillText(stream.chars[i], stream.x, y);
            }
        });
    }

    // ========================================
    // HUD WITH REAL METRICS
    // ========================================

    setupHUD() {
        this.hudElements = [
            { x: 60, y: 60, label: 'RECOVERY', getValue: () => `${Math.round(this.energy)}%`, align: 'left' },
            { x: this.width - 60, y: 60, label: 'TRUST', getValue: () => `${Math.round(this.trustScore)}%`, align: 'right' },
            { x: 60, y: this.height - 40, label: 'SYNC', getValue: () => this.syncStatus, align: 'left' },
            { x: this.width - 60, y: this.height - 40, label: 'MODE', getValue: () => this.mode, align: 'right' }
        ];
    }

    drawHUD() {
        this.ctx.font = 'bold 11px monospace';
        
        this.hudElements.forEach(hud => {
            this.ctx.textAlign = hud.align;
            
            // Label
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            this.ctx.fillText(hud.label, hud.x, hud.y);
            
            // Value - REAL DATA FROM BACKEND
            this.ctx.fillStyle = 'rgba(0, 255, 255, 1)';
            this.ctx.font = 'bold 16px monospace';
            this.ctx.fillText(hud.getValue(), hud.x, hud.y + 20);
            
            // Reset font
            this.ctx.font = 'bold 11px monospace';
        });

        this.drawCornerBrackets();
        this.drawLiveBiometrics();
    }

    drawCornerBrackets() {
        const size = 30;
        const offset = 15;
        
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;

        // Top-left
        this.ctx.beginPath();
        this.ctx.moveTo(offset + size, offset);
        this.ctx.lineTo(offset, offset);
        this.ctx.lineTo(offset, offset + size);
        this.ctx.stroke();

        // Top-right
        this.ctx.beginPath();
        this.ctx.moveTo(this.width - offset - size, offset);
        this.ctx.lineTo(this.width - offset, offset);
        this.ctx.lineTo(this.width - offset, offset + size);
        this.ctx.stroke();

        // Bottom-left
        this.ctx.beginPath();
        this.ctx.moveTo(offset, this.height - offset - size);
        this.ctx.lineTo(offset, this.height - offset);
        this.ctx.lineTo(offset + size, this.height - offset);
        this.ctx.stroke();

        // Bottom-right
        this.ctx.beginPath();
        this.ctx.moveTo(this.width - offset, this.height - offset - size);
        this.ctx.lineTo(this.width - offset, this.height - offset);
        this.ctx.lineTo(this.width - offset - size, this.height - offset);
        this.ctx.stroke();
    }

    drawLiveBiometrics() {
        const metrics = [
            { label: 'HRV', value: this.liveMetrics.hrv, unit: 'ms' },
            { label: 'RHR', value: this.liveMetrics.rhr, unit: 'bpm' },
            { label: 'RECOVERY', value: this.liveMetrics.recovery, unit: '%' },
            { label: 'O₂', value: this.liveMetrics.spo2, unit: '%' }
        ];
        
        this.ctx.save();
        this.ctx.font = '11px monospace';
        this.ctx.fillStyle = '#00ffff';
        this.ctx.globalAlpha = 0.6;
        
        metrics.forEach((metric, index) => {
            const x = 30;
            const y = 100 + index * 25;
            const value = metric.value.toFixed(metric.unit === '%' ? 0 : 1);
            
            // Draw label
            this.ctx.globalAlpha = 0.4;
            this.ctx.fillText(metric.label, x, y);
            
            // Draw value - REAL from backend
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillText(`${value}${metric.unit}`, x + 60, y);
            
            // Draw mini bar
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillRect(x + 120, y - 8, 50, 2);
            this.ctx.globalAlpha = 0.6;
            const barWidth = metric.unit === '%' ? (metric.value / 100) * 50 : (metric.value / 200) * 50;
            this.ctx.fillRect(x + 120, y - 8, barWidth, 2);
        });
        
        this.ctx.restore();
    }

    drawScanningLine() {
        const y = (this.height / 2) + Math.sin(this.pulsePhase * 0.5) * 200;
        
        const gradient = this.ctx.createLinearGradient(0, y - 2, 0, y + 2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, y - 2, this.width, 4);
    }

    // ========================================
    // ANIMATION LOOP
    // ========================================

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.updateParticles();
        this.drawParticles();
        this.drawEnergyBeams();
        this.drawDataStreams();
        this.drawHUD();
        this.drawScanningLine();

        this.pulsePhase += 0.02;

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    // ========================================
    // PUBLIC API
    // ========================================

    setEnergy(value) {
        this.energy = Math.max(0, Math.min(100, value));
        
        // Update particle behavior based on energy
        if (this.energy < 40) {
            // Low energy - slow particles
            this.particles.forEach(p => {
                p.baseOrbitSpeed = Math.max(0.003, p.baseOrbitSpeed * 0.95);
            });
        } else if (this.energy > 80) {
            // High energy - fast particles
            this.particles.forEach(p => {
                p.baseOrbitSpeed = Math.min(0.02, p.baseOrbitSpeed * 1.05);
            });
        }
    }

    setTrustScore(value) {
        this.trustScore = Math.max(0, Math.min(100, value));
        
        // Visual change at 70% trust (PAL → JARVIS)
        if (this.trustScore >= 70 && this.mode === 'PAL') {
            this.mode = 'JARVIS';
            this.triggerEvolutionEffect();
        }
    }

    setSyncStatus(status) {
        this.syncStatus = status.toUpperCase();
        
        // Visual feedback for sync
        if (status === 'SYNCING' || status === 'CONNECTED') {
            this.activateBeam(0);
        } else if (status === 'SYNCED') {
            setTimeout(() => this.deactivateBeam(0), 2000);
        }
    }

    activateBeam(index) {
        if (this.beams[index]) {
            this.beams[index].active = true;
            this.beams[index].intensity = 1;
            this.beams[index].activationTime = Date.now();
        }
    }

    deactivateBeam(index) {
        if (this.beams[index]) {
            this.beams[index].active = false;
            this.beams[index].intensity = 0;
        }
    }

    triggerEvolutionEffect() {
        console.log('🔥 JARVIS EVOLUTION TRIGGERED');
        const originalEnergy = this.energy;
        
        // Pulse effect
        let pulses = 0;
        const pulseInterval = setInterval(() => {
            this.energy = originalEnergy + (pulses % 2 === 0 ? 20 : -20);
            pulses++;
            
            if (pulses >= 6) {
                clearInterval(pulseInterval);
                this.energy = originalEnergy;
            }
        }, 300);
        
        // Activate all beams sequentially
        this.beams.forEach((beam, i) => {
            setTimeout(() => this.activateBeam(i), i * 200);
            setTimeout(() => this.deactivateBeam(i), i * 200 + 1000);
        });
    }

    // ========================================
    // RESIZE HANDLER
    // ========================================

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.setupHUD();
            
            // Update beam targets
            this.beams.forEach((beam, i) => {
                const positions = [
                    { x: 0.5, y: 0.25 },
                    { x: 0.75, y: 0.4 },
                    { x: 0.75, y: 0.65 },
                    { x: 0.25, y: 0.65 },
                    { x: 0.25, y: 0.4 },
                    { x: 0.5, y: 0.8 }
                ];
                beam.targetX = this.width * positions[i].x;
                beam.targetY = this.height * positions[i].y;
            });
        });
    }

    // ========================================
    // CLEANUP
    // ========================================

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize
const reactorCore = new ReactorCore();
window.reactorCore = reactorCore;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => reactorCore.init());
} else {
    reactorCore.init();
}

export default reactorCore;
