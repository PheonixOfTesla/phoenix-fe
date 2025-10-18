// reactor.js - Arc Reactor Visualization & HUD

class ReactorCore {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.particles = [];
        this.energy = 78; // Matches recovery score
        this.pulsePhase = 0;
        this.dataStreams = [];
    }

    init() {
        this.createCanvas();
        this.generateParticles();
        this.animate();
        this.initDataStreams();
    }

    createCanvas() {
        // Create a canvas overlay for the reactor effects
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '100';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateParticles() {
        // Create energy particles around reactor
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 2 + 0.5,
                life: 1,
                decay: Math.random() * 0.02 + 0.005
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update pulse phase
        this.pulsePhase += 0.02;
        
        // Draw particles
        this.drawParticles();
        
        // Draw energy beams
        this.drawEnergyBeams();
        
        // Draw data streams
        this.drawDataStreams();
        
        // Draw HUD elements
        this.drawHUD();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawParticles() {
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            // Draw particle
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ffff';
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            
            // Respawn dead particles
            if (particle.life <= 0 || 
                particle.x < 0 || particle.x > this.canvas.width ||
                particle.y < 0 || particle.y > this.canvas.height) {
                    
                const angle = Math.random() * Math.PI * 2;
                const radius = 125; // Reactor radius
                particle.x = window.innerWidth / 2 + Math.cos(angle) * radius;
                particle.y = window.innerHeight / 2 + Math.sin(angle) * radius;
                particle.vx = Math.cos(angle) * (Math.random() + 0.5);
                particle.vy = Math.sin(angle) * (Math.random() + 0.5);
                particle.life = 1;
            }
        });
    }

    drawEnergyBeams() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const time = Date.now() * 0.001;
        
        // Draw rotating energy beams
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const innerRadius = 30;
            const outerRadius = 120 + Math.sin(this.pulsePhase + i) * 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(
                centerX + Math.cos(angle) * innerRadius,
                centerY + Math.sin(angle) * innerRadius
            );
            this.ctx.lineTo(
                centerX + Math.cos(angle) * outerRadius,
                centerY + Math.sin(angle) * outerRadius
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawDataStreams() {
        const now = Date.now();
        
        // Add new data points periodically
        if (Math.random() > 0.98) {
            this.dataStreams.push({
                x: Math.random() * this.canvas.width,
                y: -20,
                speed: Math.random() * 2 + 1,
                value: Math.random().toFixed(3),
                opacity: 1
            });
        }
        
        // Update and draw data streams
        this.ctx.save();
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#00ffff';
        
        this.dataStreams = this.dataStreams.filter(stream => {
            stream.y += stream.speed;
            stream.opacity = 1 - (stream.y / this.canvas.height);
            
            this.ctx.globalAlpha = stream.opacity * 0.5;
            this.ctx.fillText(stream.value, stream.x, stream.y);
            
            return stream.y < this.canvas.height;
        });
        
        this.ctx.restore();
    }

    drawHUD() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Draw scanning line
        this.ctx.save();
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.1;
        
        const scanAngle = Date.now() * 0.002;
        const scanRadius = 150;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(
            centerX + Math.cos(scanAngle) * scanRadius,
            centerY + Math.sin(scanAngle) * scanRadius
        );
        this.ctx.stroke();
        
        // Draw scan arc
        this.ctx.globalAlpha = 0.05;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, scanRadius, scanAngle - 0.5, scanAngle);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Draw corner brackets (HUD frame)
        this.drawCornerBrackets();
        
        // Draw live metrics
        this.drawMetrics();
    }

    drawCornerBrackets() {
        const margin = 20;
        const bracketSize = 30;
        const lineWidth = 1;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = lineWidth;
        this.ctx.globalAlpha = 0.3;
        
        // Top-left
        this.ctx.beginPath();
        this.ctx.moveTo(margin, margin + bracketSize);
        this.ctx.lineTo(margin, margin);
        this.ctx.lineTo(margin + bracketSize, margin);
        this.ctx.stroke();
        
        // Top-right
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - margin - bracketSize, margin);
        this.ctx.lineTo(this.canvas.width - margin, margin);
        this.ctx.lineTo(this.canvas.width - margin, margin + bracketSize);
        this.ctx.stroke();
        
        // Bottom-left
        this.ctx.beginPath();
        this.ctx.moveTo(margin, this.canvas.height - margin - bracketSize);
        this.ctx.lineTo(margin, this.canvas.height - margin);
        this.ctx.lineTo(margin + bracketSize, this.canvas.height - margin);
        this.ctx.stroke();
        
        // Bottom-right
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - margin - bracketSize, this.canvas.height - margin);
        this.ctx.lineTo(this.canvas.width - margin, this.canvas.height - margin);
        this.ctx.lineTo(this.canvas.width - margin, this.canvas.height - margin - bracketSize);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawMetrics() {
        // Draw live biometric readouts
        const metrics = [
            { label: 'HRV', value: 68 + Math.sin(this.pulsePhase) * 2, unit: 'ms' },
            { label: 'RHR', value: 52 + Math.sin(this.pulsePhase * 1.5) * 1, unit: 'bpm' },
            { label: 'RECOVERY', value: this.energy, unit: '%' },
            { label: 'O₂', value: 98 + Math.sin(this.pulsePhase * 0.5) * 0.5, unit: '%' }
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
            
            // Draw value
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillText(`${value}${metric.unit}`, x + 60, y);
            
            // Draw mini bar
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillRect(x + 120, y - 8, 50, 2);
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillRect(x + 120, y - 8, (metric.value / 100) * 50, 2);
        });
        
        this.ctx.restore();
    }

    initDataStreams() {
        // Initialize with some data streams
        for (let i = 0; i < 10; i++) {
            this.dataStreams.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: Math.random() * 2 + 1,
                value: Math.random().toFixed(3),
                opacity: 1
            });
        }
    }

    setEnergy(value) {
        this.energy = value;
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas) {
            document.body.removeChild(this.canvas);
        }
    }
}

// Initialize reactor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.Reactor = new ReactorCore();
    window.Reactor.init();
});