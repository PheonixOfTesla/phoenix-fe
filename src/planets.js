// planets.js - Phoenix Planet System with REAL Backend Data

import * as API from './api.js';

class PlanetSystem {
    constructor() {
        this.planets = {
            mercury: { 
                angle: 0, 
                speed: 0.02, 
                radius: 280, 
                color: '#00ffff',
                data: null,
                loading: false
            },
            venus: { 
                angle: 60, 
                speed: 0.018, 
                radius: 280, 
                color: '#00ffff',
                data: null,
                loading: false
            },
            earth: { 
                angle: 120, 
                speed: 0.015, 
                radius: 280, 
                color: '#00ffff',
                data: null,
                loading: false
            },
            mars: { 
                angle: 180, 
                speed: 0.012, 
                radius: 280, 
                color: '#00ffff',
                data: null,
                loading: false
            },
            jupiter: { 
                angle: 240, 
                speed: 0.01, 
                radius: 280, 
                color: '#00ffff',
                data: null,
                loading: false
            },
            saturn: { 
                angle: 300, 
                speed: 0.008, 
                radius: 280, 
                color: '#00ffff',
                data: null,
                loading: false
            }
        };
        this.selectedPlanet = null;
        this.animationFrame = null;
        this.correlations = [];
        this.dataRefreshInterval = null;
    }

    async init() {
        console.log('🪐 Initializing Planet System...');
        
        // Load real data from backend
        await this.loadAllPlanetData();
        
        // Start orbital animation
        this.animate();
        
        // Setup interactions
        this.setupHoverEffects();
        
        // Auto-refresh data every 30 seconds
        this.startDataRefresh();
        
        console.log('✅ Planet System initialized with backend data');
    }

    // ========================================
    // LOAD REAL BACKEND DATA
    // ========================================

    async loadAllPlanetData() {
        console.log('🌍 Loading planet data from backend...');
        
        try {
            // Fetch all data in parallel
            const [wearable, recovery, workouts, nutrition, calendar, goals, finance, timeline] = await Promise.all([
                API.getLatestWearableData(),
                API.getRecoveryScore(),
                API.getRecentWorkouts(5),
                API.getTodayNutrition(),
                API.getCalendarEvents(),
                API.getActiveGoals(),
                API.getFinancialOverview(),
                API.getLifeTimeline()
            ]);

            // Store REAL data for each planet
            this.planets.mercury.data = {
                hrv: wearable.data?.hrv || 0,
                rhr: wearable.data?.heartRate || 0,
                recovery: recovery.data?.recoveryScore || 0,
                sleep: wearable.data?.sleepDuration ? (wearable.data.sleepDuration / 60).toFixed(1) : 0,
                steps: wearable.data?.steps || 0
            };

            this.planets.venus.data = {
                workouts: workouts.data?.length || 0,
                calories: nutrition.data?.totalCalories || 0,
                protein: nutrition.data?.totalProtein || 0,
                lastWorkout: workouts.data?.[0]?.name || 'None'
            };

            this.planets.earth.data = {
                events: calendar.data?.length || 0,
                nextEvent: calendar.data?.[0]?.title || 'Free',
                time: calendar.data?.[0]?.time || '--:--'
            };

            this.planets.mars.data = {
                active: goals.data?.length || 0,
                completed: goals.data?.filter(g => g.completed).length || 0,
                progress: this.calculateProgress(goals.data)
            };

            this.planets.jupiter.data = {
                budget: finance.data?.budget || 0,
                spent: finance.data?.expenses || 0,
                remaining: (finance.data?.budget || 0) - (finance.data?.expenses || 0)
            };

            this.planets.saturn.data = {
                lifeProgress: timeline.data?.lifeProgress || 0,
                daysLeft: timeline.data?.daysRemaining || 0,
                achievements: timeline.data?.achievements || 0
            };

            // Update UI with real metrics
            this.updateAllMetrics();

            console.log('✅ Planet data loaded:', this.planets);

        } catch (error) {
            console.error('Failed to load planet data:', error);
        }
    }

    updateAllMetrics() {
        // Update each planet's displayed metric
        this.updateMetric('mercury', `${this.planets.mercury.data?.recovery || 0}%`);
        this.updateMetric('venus', `${this.planets.venus.data?.workouts || 0}x`);
        this.updateMetric('earth', `${this.planets.earth.data?.events || 0}`);
        
        const mars = this.planets.mars.data;
        this.updateMetric('mars', `${mars?.completed || 0}/${mars?.active || 0}`);
        
        this.updateMetric('jupiter', `$${this.planets.jupiter.data?.spent || 0}`);
        this.updateMetric('saturn', `${this.planets.saturn.data?.lifeProgress || 0}%`);
    }

    calculateProgress(goals) {
        if (!goals || !Array.isArray(goals) || goals.length === 0) return 0;
        const completed = goals.filter(g => g.completed).length;
        return Math.round((completed / goals.length) * 100);
    }

    // ========================================
    // ORBITAL ANIMATION
    // ========================================

    animate() {
        // Rotate planets around core
        Object.entries(this.planets).forEach(([name, planet]) => {
            planet.angle += planet.speed;
            if (planet.angle >= 360) planet.angle -= 360;
            
            // Update position if needed (CSS handles most of it)
            this.updatePlanetPosition(name, planet);
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    updatePlanetPosition(planetName, planet) {
        // CSS handles the base positions, but we can add dynamic adjustments here
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (!planetEl) return;

        // Add subtle pulsing based on data
        if (planet.data) {
            // Pulse intensity based on importance
            const intensity = this.calculatePlanetIntensity(planetName, planet.data);
            if (intensity > 0.7) {
                planetEl.style.filter = `brightness(${1 + intensity * 0.3}) drop-shadow(0 0 ${intensity * 20}px ${planet.color})`;
            }
        }
    }

    calculatePlanetIntensity(planetName, data) {
        switch(planetName) {
            case 'mercury':
                // High intensity if recovery is critical
                return data.recovery < 50 ? 1.0 : data.recovery / 100;
            case 'venus':
                // High intensity if active (recent workout)
                return data.workouts > 0 ? 0.9 : 0.5;
            case 'earth':
                // High intensity if busy schedule
                return data.events > 3 ? 0.9 : 0.6;
            case 'mars':
                // High intensity if goals at risk
                return data.progress < 50 ? 0.8 : 0.6;
            default:
                return 0.6;
        }
    }

    // ========================================
    // CORRELATION LINES (REAL DATA)
    // ========================================

    async updateCorrelations(correlations) {
        this.correlations = correlations || [];
        
        if (this.correlations.length === 0) {
            // Fetch from backend if not provided
            try {
                const result = await API.getCrossCorrelations?.();
                if (result?.success) {
                    this.correlations = result.data || [];
                } else {
                    this.correlations = this.detectLocalCorrelations();
                }
            } catch (error) {
                this.correlations = this.detectLocalCorrelations();
            }
        }
        
        this.drawAllCorrelationLines();
    }

    detectLocalCorrelations() {
        const corr = [];
        
        // Mercury ↔ Venus (Health ↔ Fitness)
        const mercury = this.planets.mercury.data;
        const venus = this.planets.venus.data;
        if (mercury?.recovery < 60 && venus?.workouts > 3) {
            corr.push({ from: 'mercury', to: 'venus', strength: 0.85 });
        }
        
        // Mercury ↔ Jupiter (Stress ↔ Spending)
        const jupiter = this.planets.jupiter.data;
        if (mercury?.hrv < 50 && jupiter?.spent > 100) {
            corr.push({ from: 'mercury', to: 'jupiter', strength: 0.72 });
        }
        
        // Earth ↔ Mars (Calendar ↔ Goals)
        const earth = this.planets.earth.data;
        const mars = this.planets.mars.data;
        if (earth?.events > 5 && mars?.progress < 50) {
            corr.push({ from: 'earth', to: 'mars', strength: 0.68 });
        }
        
        return corr;
    }

    drawAllCorrelationLines() {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;
        
        svg.innerHTML = ''; // Clear existing
        
        this.correlations.forEach(corr => {
            this.drawCorrelationLine(corr.from, corr.to, corr.strength);
        });
    }

    drawCorrelationLine(planet1Name, planet2Name, strength = 0.5) {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;

        const el1 = document.getElementById(`planet-${planet1Name}`);
        const el2 = document.getElementById(`planet-${planet2Name}`);
        if (!el1 || !el2) return;

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
        line.setAttribute('stroke', `rgba(0, 255, 255, ${strength * 0.6})`);
        line.setAttribute('stroke-width', Math.max(1, strength * 3));
        line.style.animation = 'lineGlow 2s ease-in-out infinite';

        svg.appendChild(line);
    }

    clearCorrelationLines() {
        const svg = document.getElementById('correlation-lines');
        if (svg) svg.innerHTML = '';
    }

    // ========================================
    // PLANET INTERACTION
    // ========================================

    setupHoverEffects() {
        Object.keys(this.planets).forEach(planetName => {
            const planetEl = document.getElementById(`planet-${planetName}`);
            if (!planetEl) return;

            planetEl.addEventListener('mouseenter', () => {
                if (this.selectedPlanet !== planetName) {
                    planetEl.style.filter = 'brightness(1.3)';
                    
                    // Show correlations on hover
                    this.highlightPlanetCorrelations(planetName);
                }
            });

            planetEl.addEventListener('mouseleave', () => {
                if (this.selectedPlanet !== planetName) {
                    planetEl.style.filter = '';
                    
                    // Restore all correlations
                    if (!this.selectedPlanet) {
                        this.drawAllCorrelationLines();
                    }
                }
            });
        });
    }

    highlightPlanetCorrelations(planetName) {
        const svg = document.getElementById('correlation-lines');
        if (!svg) return;
        
        svg.innerHTML = ''; // Clear
        
        // Only draw correlations involving this planet
        this.correlations
            .filter(c => c.from === planetName || c.to === planetName)
            .forEach(c => this.drawCorrelationLine(c.from, c.to, c.strength));
    }

    selectPlanet(planetName) {
        this.selectedPlanet = planetName;
        
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (planetEl) {
            planetEl.classList.add('selected');
            planetEl.style.transform = 'scale(1.2)';
            planetEl.style.filter = 'brightness(1.5) drop-shadow(0 0 40px #00ffff)';
        }
        
        this.highlightPlanetCorrelations(planetName);
    }

    deselectPlanet() {
        if (!this.selectedPlanet) return;

        const planetEl = document.getElementById(`planet-${this.selectedPlanet}`);
        if (planetEl) {
            planetEl.classList.remove('selected');
            planetEl.style.transform = '';
            planetEl.style.filter = '';
        }

        this.selectedPlanet = null;
        this.drawAllCorrelationLines();
    }

    // ========================================
    // LOADING STATES
    // ========================================

    showLoadingState(planetName) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (!planetEl) return;
        
        planetEl.classList.add('loading');
        this.planets[planetName].loading = true;
        
        // Speed up gear rotation
        const gearOuter = planetEl.querySelector('.gear-outer');
        const gearInner = planetEl.querySelector('.gear-inner');
        if (gearOuter) gearOuter.style.animationDuration = '2s';
        if (gearInner) gearInner.style.animationDuration = '1.5s';
    }

    hideLoadingState(planetName) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (!planetEl) return;
        
        planetEl.classList.remove('loading');
        this.planets[planetName].loading = false;
        
        // Reset gear rotation speed
        const gearOuter = planetEl.querySelector('.gear-outer');
        const gearInner = planetEl.querySelector('.gear-inner');
        if (gearOuter) gearOuter.style.animationDuration = '8s';
        if (gearInner) gearInner.style.animationDuration = '6s';
    }

    // ========================================
    // METRIC UPDATES
    // ========================================

    updateMetric(planetName, value) {
        const metricEl = document.getElementById(`${planetName}-metric`);
        if (!metricEl) return;
        
        metricEl.textContent = value;
        
        // Pulse animation on update
        metricEl.style.animation = 'none';
        setTimeout(() => {
            metricEl.style.animation = 'metricPulse 0.5s ease-out';
        }, 10);
    }

    setPlanetGlow(planetName, intensity) {
        const planetEl = document.getElementById(`planet-${planetName}`);
        if (!planetEl) return;
        
        const color = this.planets[planetName].color;
        planetEl.style.filter = `drop-shadow(0 0 ${intensity * 30}px ${color})`;
    }

    // ========================================
    // DATA REFRESH
    // ========================================

    startDataRefresh() {
        // Refresh planet data every 30 seconds
        this.dataRefreshInterval = setInterval(async () => {
            console.log('🔄 Refreshing planet data...');
            await this.loadAllPlanetData();
            await this.updateCorrelations();
        }, 30000);
    }

    // ========================================
    // CLEANUP
    // ========================================

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.dataRefreshInterval) {
            clearInterval(this.dataRefreshInterval);
        }
        
        this.selectedPlanet = null;
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

export default planetSystem;
