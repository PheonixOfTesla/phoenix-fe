// planets.js - Planet Orbital System

class PlanetSystem {
    constructor() {
        this.planets = {
            mercury: { angle: 0, speed: 0.5, radius: 280, color: '#00ffff' },
            venus: { angle: 60, speed: 0.4, radius: 280, color: '#00ffff' },
            earth: { angle: 120, speed: 0.35, radius: 280, color: '#00ffff' },
            mars: { angle: 180, speed: 0.3, radius: 280, color: '#00ffff' },
            jupiter: { angle: 240, speed: 0.25, radius: 280, color: '#00ffff' },
            saturn: { angle: 300, speed: 0.2, radius: 280, color: '#00ffff' }
        };
        this.selectedPlanet = null;
        this.animationFrame = null;
        this.centerX = 450;
        this.centerY = 350;
    }

    init() {
        console.log('🪐 Initializing Planet System...');
        this.render();
        this.animate();
        this.setupHoverEffects();
        console.log('✅ Planet System initialized');
    }

    render() {
        // Initial positioning is handled by CSS
        // This method can update positions dynamically if needed
        Object.keys(this.planets).forEach(planetName => {
            this.updatePlanetPosition(planetName);
        });
    }

    animate() {
        // Rotate planets around core
        Object.entries(this.planets).forEach(([name, planet]) => {
            planet.angle += planet.speed * 0.01;
            if (planet.angle >= 360) planet.angle -= 360;
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    updatePlanetPosition(planetName) {
        const planet = this.planets[planetName];
        if (!planet) return;

        const planetEl = document.getElementById(`planet-${planetName}`);
        if (!planetEl) return;

        // Orbital animation is handled by CSS
        // This can be extended for dynamic positioning
    }

    selectPlanet(planetName) {
        if (this.selectedPlanet === planetName) return;

        // Deselect previous
        if (this.selectedPlanet) {
            this.deselectPlanet();
        }

        this.selectedPlanet = planetName;
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) {
            planetEl.classList.add('selected');
            planetEl.style.transform = 'scale(1.2)';
            planetEl.style.boxShadow = '0 0 40px rgba(0, 255, 255, 1)';
        }

        // Draw correlation lines if applicable
        this.drawCorrelationLines(planetName);
    }

    deselectPlanet() {
        if (!this.selectedPlanet) return;

        const planetEl = document.getElementById(`planet-${this.selectedPlanet}`);
        if (planetEl) {
            planetEl.classList.remove('selected');
            planetEl.style.transform = '';
            planetEl.style.boxShadow = '';
        }

        this.clearCorrelationLines();
        this.selectedPlanet = null;
    }

    drawCorrelationLines(planetName) {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;

        // Clear existing lines
        svg.innerHTML = '';

        // Define correlations
        const correlations = {
            mercury: ['venus'], // Health correlates with Fitness
            venus: ['mercury'], // Fitness correlates with Health
            earth: ['mars'],    // Calendar correlates with Goals
            mars: ['earth']     // Goals correlate with Calendar
        };

        const relatedPlanets = correlations[planetName] || [];
        
        relatedPlanets.forEach(targetPlanet => {
            this.drawCorrelationLine(planetName, targetPlanet);
        });
    }

    drawCorrelationLine(planet1, planet2) {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;

        const el1 = document.getElementById(`planet-${planet1}`);
        const el2 = document.getElementById(`planet-${planet2}`);
        if (!el1 || el2) return;

        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 - svgRect.left;
        const y1 = rect1.top + rect1.height / 2 - svgRect.top;
        const x2 = rect2.left + rect2.width / 2 - svgRect.left;
        const y2 = rect2.top + rect2.height / 2 - svgRect.top;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'rgba(0, 255, 255, 0.3)');
        line.setAttribute('stroke-width', '2');
        line.style.animation = 'lineGlow 2s ease-in-out infinite';

        svg.appendChild(line);
    }

    clearCorrelationLines() {
        const svg = document.getElementById('correlation-lines');
        if (svg) svg.innerHTML = '';
    }

    setupHoverEffects() {
        Object.keys(this.planets).forEach(planetName => {
            const planetEl = document.getElementById(`planet-${planetName}`);
            if (!planetEl) return;

            planetEl.addEventListener('mouseenter', () => {
                if (this.selectedPlanet !== planetName) {
                    planetEl.style.filter = 'brightness(1.3)';
                    this.drawCorrelationLines(planetName);
                }
            });

            planetEl.addEventListener('mouseleave', () => {
                if (this.selectedPlanet !== planetName) {
                    planetEl.style.filter = '';
                    if (!this.selectedPlanet) {
                        this.clearCorrelationLines();
                    } else {
                        this.drawCorrelationLines(this.selectedPlanet);
                    }
                }
            });
        });
    }

    showLoadingState(planetName) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) {
            planetEl.classList.add('loading');
            
            // Speed up gear rotation
            const gearOuter = planetEl.querySelector('.gear-outer');
            const gearInner = planetEl.querySelector('.gear-inner');
            if (gearOuter) gearOuter.style.animationDuration = '2s';
            if (gearInner) gearInner.style.animationDuration = '1.5s';
        }
    }

    hideLoadingState(planetName) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) {
            planetEl.classList.remove('loading');
            
            // Reset gear rotation speed
            const gearOuter = planetEl.querySelector('.gear-outer');
            const gearInner = planetEl.querySelector('.gear-inner');
            if (gearOuter) gearOuter.style.animationDuration = '8s';
            if (gearInner) gearInner.style.animationDuration = '6s';
        }
    }

    updateMetric(planetName, value) {
        const metricEl = document.getElementById(`${planetName}-metric`);
        if (metricEl) {
            metricEl.textContent = value;
            
            // Pulse animation on update
            metricEl.style.animation = 'none';
            setTimeout(() => {
                metricEl.style.animation = 'metricPulse 0.5s ease-out';
            }, 10);
        }
    }

    setPlanetGlow(planetName, intensity) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) {
            const color = this.planets[planetName].color;
            planetEl.style.filter = `drop-shadow(0 0 ${intensity}px ${color})`;
        }
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// Initialize
const planetSystem = new PlanetSystem();
window.planetSystem = planetSystem;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => planetSystem.init());
} else {
    planetSystem.init();
}

// Add CSS animation for metric pulse
const style = document.createElement('style');
style.textContent = `
    @keyframes metricPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
