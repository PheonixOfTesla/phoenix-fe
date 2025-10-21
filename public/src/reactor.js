// reactor.js - Phoenix Reactor Core with REAL Backend Data Integration

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
    }

    init() {
        console.log('⚡ Initializing Reactor Core...');
        this.createCanvas();
        this.generateParticles();
        this.setupBeams();
        this.setupDataStreams();
        this.setupHUD();
        this.animate();
        this.setupResizeHandler();
        this.connectToBackend();
        console.log('✅ Reactor Core initialized');
    }

    // ========================================
    // BACKEND CONNECTION
    // ========================================

    connectToBackend() {
        // Listen for JARVIS engine updates
        setInterval(() => {
            if (window.jarvisEngine) {
                const userData = window.jarvisEngine.userData || {};
                
                // Update live metrics from backend
                this.liveMetrics.hrv = userData.hrv || 0;
                this.liveMetrics.rhr = userData.heartRate || 0;
                this.liveMetrics.recovery = userData.recoveryScore || 0;
                this.liveMetrics.spo2 = userData.spo2 || 98;
                
                // Update energy based on recovery score
                this.setEnergy(userData.recoveryScore || 100);
                
                // Update trust score
                this.setTrustScore(window.jarvisEngine.trustScore || 0);
                
                // Update mode
                this.mode = window.jarvisEngine.mode || 'PAL';
            }
        }, 1000);
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
                orbitSpeed: Math.random() * 0.01 + 0.005
            });
        }
    }

    updateParticles() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.particles.forEach(p => {
            // Orbital motion around center - speed based on REAL recovery score
            p.angle += p.orbitSpeed * (this.energy / 100);
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
        // Energy beams from core to planets
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
                active: true, // Always active for real-time connection
                planetIndex: i
            });
        });
    }

    drawEnergyBeams() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.beams.forEach((beam, i) => {
            // Beam intensity based on planet activity and energy
            const baseIntensity = beam.active ? 0.3 : 0.1;
            const pulseIntensity = 0.5 + Math.sin(this.pulsePhase + beam.phase) * 0.5;
            const energyMultiplier = this.energy / 100;
            const intensity = baseIntensity * pulseIntensity * energyMultiplier;
            
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
        });
    }

    // ========================================
    // DATA STREAMS
    // ========================================

    setupDataStreams() {
        // Vertical data streams (Matrix-style)
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
        // Corner HUD elements with REAL backend data
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

        // Draw corner brackets
        this.drawCornerBrackets();
        
        // Draw live biometric data
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
        // Draw REAL biometric data from backend
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

        // Update and draw components
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
    // PUBLIC API (Called by jarvis.js)
    // ========================================

    setEnergy(value) {
        this.energy = Math.max(0, Math.min(100, value));
        
        // Update particle behavior based on energy
        if (this.energy < 40) {
            // Low energy - slow particles
            this.particles.forEach(p => {
                p.orbitSpeed = Math.max(0.003, p.orbitSpeed * 0.95);
            });
        } else if (this.energy > 80) {
            // High energy - fast particles
            this.particles.forEach(p => {
                p.orbitSpeed = Math.min(0.02, p.orbitSpeed * 1.05);
            });
        }
    }

    setTrustScore(value) {
        this.trustScore = Math.max(0, Math.min(100, value));
        
        // Visual change at 70% trust (PAL → JARVIS)
        if (this.trustScore >= 70 && this.mode === 'PAL') {
            this.triggerEvolutionEffect();
        }
    }

    setSyncStatus(status) {
        this.syncStatus = status.toUpperCase();
        
        // Visual feedback for sync
        if (status === 'SYNCING' || status === 'CONNECTED') {
            this.activateBeam(0); // Activate Mercury beam
        } else if (status === 'SYNCED') {
            setTimeout(() => this.deactivateBeam(0), 2000);
        }
    }

    activateBeam(index) {
        if (this.beams[index]) {
            this.beams[index].active = true;
            this.beams[index].intensity = 1;
        }
    }

    deactivateBeam(index) {
        if (this.beams[index]) {
            this.beams[index].active = false;
            this.beams[index].intensity = 0;
        }
    }

    triggerEvolutionEffect() {
        // Visual effect when evolving to JARVIS
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
        
        // Activate all beams
        this.beams.forEach((beam, i) => {
            setTimeout(() => this.activateBeam(i), i * 200);
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
        });
    }

    // ========================================
    // CLEANUP
    // ========================================

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
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
