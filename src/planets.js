// planets.js - Phoenix Six Planet System

class PlanetSystem {
    constructor() {
        this.planets = [
            {
                name: 'MERCURY',
                label: 'HEALTH',
                orbit: 150,
                angle: 0,
                speed: 0.02,
                color: '#ff6b6b',
                data: {
                    heartRate: 52,
                    bloodPressure: '118/76',
                    temperature: 98.2,
                    spo2: 98
                }
            },
            {
                name: 'VENUS',
                label: 'FITNESS',
                orbit: 200,
                angle: Math.PI / 3,
                speed: 0.018,
                color: '#4ecdc4',
                data: {
                    workouts: 3,
                    calories: 2250,
                    activeMinutes: 28,
                    vo2max: 48
                }
            },
            {
                name: 'EARTH',
                label: 'CALENDAR',
                orbit: 250,
                angle: 2 * Math.PI / 3,
                speed: 0.015,
                color: '#45b7d1',
                data: {
                    events: 4,
                    nextMeeting: '2:00 PM',
                    freeTime: '4.5 hours',
                    conflicts: 0
                }
            },
            {
                name: 'MARS',
                label: 'GOALS',
                orbit: 300,
                angle: Math.PI,
                speed: 0.012,
                color: '#f7931e',
                data: {
                    active: 5,
                    completed: 2,
                    progress: 60,
                    streak: 7
                }
            },
            {
                name: 'JUPITER',
                label: 'FINANCE',
                orbit: 350,
                angle: 4 * Math.PI / 3,
                speed: 0.01,
                color: '#9b59b6',
                data: {
                    spending: 142,
                    budget: 500,
                    saved: 1250,
                    investments: '+4.2%'
                }
            },
            {
                name: 'SATURN',
                label: 'LEGACY',
                orbit: 400,
                angle: 5 * Math.PI / 3,
                speed: 0.008,
                color: '#95a5a6',
                data: {
                    daysRemaining: 18250,
                    lifeProgress: 35,
                    achievements: 24,
                    impact: 'Growing'
                }
            }
        ];
        this.selectedPlanet = null;
        this.animationFrame = null;
    }

    init() {
        console.log('🌍 Initializing Planet System...');
        const container = document.querySelector('.planet-system');
        if (!container) {
            this.createContainer();
        }
        this.render();
        this.animate();
        this.setupInteractions();
    }

    createContainer() {
        const overlay = document.getElementById('holoOverlay');
        const system = document.createElement('div');
        system.className = 'planet-system';
        overlay.appendChild(system);
    }

    render() {
        const container = document.querySelector('.planet-system');
        container.innerHTML = '';
        
        // Create central sun/core
        const core = document.createElement('div');
        core.className = 'system-core';
        core.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: radial-gradient(circle, rgba(0,255,255,0.8), rgba(0,255,255,0.1));
            border-radius: 50%;
            box-shadow: 0 0 100px rgba(0,255,255,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10;
        `;
        core.textContent = 'PHOENIX';
        container.appendChild(core);
        
        // Create planets
        this.planets.forEach(planet => {
            // Create orbit
            const orbit = document.createElement('div');
            orbit.className = 'planet-orbit';
            orbit.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: ${planet.orbit * 2}px;
                height: ${planet.orbit * 2}px;
                margin-left: -${planet.orbit}px;
                margin-top: -${planet.orbit}px;
                border: 1px solid rgba(0,255,255,0.1);
                border-radius: 50%;
                animation: none;
            `;
            container.appendChild(orbit);
            
            // Create planet
            const planetElement = document.createElement('div');
            planetElement.className = 'planet';
            planetElement.id = `planet-${planet.name.toLowerCase()}`;
            planetElement.style.cssText = `
                position: absolute;
                width: 70px;
                height: 70px;
                background: radial-gradient(circle, ${planet.color}, rgba(0,255,255,0.2));
                border: 2px solid ${planet.color};
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 0 30px ${planet.color}80;
                z-index: 5;
            `;
            
            // Add planet content
            const nameSpan = document.createElement('span');
            nameSpan.style.fontWeight = 'bold';
            nameSpan.style.marginBottom = '2px';
            nameSpan.textContent = planet.name;
            
            const labelSpan = document.createElement('span');
            labelSpan.style.fontSize = '8px';
            labelSpan.style.opacity = '0.8';
            labelSpan.textContent = planet.label;
            
            planetElement.appendChild(nameSpan);
            planetElement.appendChild(labelSpan);
            
            // Position planet on orbit
            this.updatePlanetPosition(planetElement, planet);
            
            container.appendChild(planetElement);
            
            // Add hover effect
            planetElement.addEventListener('mouseenter', () => {
                planetElement.style.transform = 'scale(1.2)';
                planetElement.style.boxShadow = `0 0 50px ${planet.color}`;
                planetElement.style.zIndex = '20';
            });
            
            planetElement.addEventListener('mouseleave', () => {
                if (this.selectedPlanet !== planet) {
                    planetElement.style.transform = 'scale(1)';
                    planetElement.style.boxShadow = `0 0 30px ${planet.color}80`;
                    planetElement.style.zIndex = '5';
                }
            });
            
            // Add click handler
            planetElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectPlanet(planet);
            });
        });
        
        // Add close button
        this.addCloseButton(container);
        
        // Add data panel
        this.addDataPanel(container);
    }

    updatePlanetPosition(element, planet) {
        const container = document.querySelector('.planet-system');
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const x = centerX + Math.cos(planet.angle) * planet.orbit - 35; // 35 is half planet width
        const y = centerY + Math.sin(planet.angle) * planet.orbit - 35;
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }

    animate() {
        this.planets.forEach(planet => {
            planet.angle += planet.speed;
            const element = document.getElementById(`planet-${planet.name.toLowerCase()}`);
            if (element) {
                this.updatePlanetPosition(element, planet);
            }
        });
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    selectPlanet(planet) {
        console.log('🪐 Selected planet:', planet.name);
        this.selectedPlanet = planet;
        
        // Update visual selection
        this.planets.forEach(p => {
            const element = document.getElementById(`planet-${p.name.toLowerCase()}`);
            if (p === planet) {
                element.style.transform = 'scale(1.3)';
                element.style.boxShadow = `0 0 70px ${p.color}`;
                element.style.zIndex = '25';
            } else {
                element.style.transform = 'scale(0.8)';
                element.style.opacity = '0.5';
            }
        });
        
        // Show data panel
        this.showPlanetData(planet);
    }

    showPlanetData(planet) {
        const panel = document.getElementById('planet-data-panel');
        if (!panel) return;
        
        panel.style.display = 'block';
        panel.style.opacity = '0';
        
        // Update content
        const title = panel.querySelector('.panel-title');
        const content = panel.querySelector('.panel-content');
        
        title.textContent = `${planet.name} - ${planet.label}`;
        
        // Generate data HTML
        let dataHtml = '<div class="planet-metrics">';
        Object.entries(planet.data).forEach(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
            dataHtml += `
                <div class="metric-row">
                    <span class="metric-label">${label}:</span>
                    <span class="metric-value">${value}</span>
                </div>
            `;
        });
        dataHtml += '</div>';
        
        content.innerHTML = dataHtml;
        
        // Fade in
        setTimeout(() => {
            panel.style.opacity = '1';
        }, 100);
    }

    addDataPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'planet-data-panel';
        panel.style.cssText = `
            position: absolute;
            top: 50px;
            right: 50px;
            width: 300px;
            background: rgba(0,0,0,0.9);
            border: 1px solid rgba(0,255,255,0.3);
            padding: 20px;
            display: none;
            transition: opacity 0.3s;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 50px rgba(0,255,255,0.2);
        `;
        
        panel.innerHTML = `
            <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div class="panel-title" style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;"></div>
                <span class="panel-close" style="cursor: pointer; font-size: 20px;">×</span>
            </div>
            <div class="panel-content"></div>
        `;
        
        container.appendChild(panel);
        
        // Close panel handler
        panel.querySelector('.panel-close').addEventListener('click', () => {
            panel.style.display = 'none';
            this.deselectPlanet();
        });
    }

    deselectPlanet() {
        this.selectedPlanet = null;
        this.planets.forEach(p => {
            const element = document.getElementById(`planet-${p.name.toLowerCase()}`);
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
            element.style.zIndex = '5';
        });
    }

    addCloseButton(container) {
        const closeBtn = document.createElement('div');
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border: 1px solid rgba(0,255,255,0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.3s;
            z-index: 100;
        `;
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => {
            const overlay = document.getElementById('holoOverlay');
            overlay.classList.remove('active');
            this.destroy();
        });
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(0,255,255,0.2)';
            closeBtn.style.transform = 'rotate(90deg)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '';
            closeBtn.style.transform = '';
        });
        container.appendChild(closeBtn);
    }

    setupInteractions() {
        // System core click - return to overview
        const core = document.querySelector('.system-core');
        if (core) {
            core.addEventListener('click', () => {
                this.deselectPlanet();
                const panel = document.getElementById('planet-data-panel');
                if (panel) panel.style.display = 'none';
            });
        }
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.selectedPlanet = null;
    }
}

// Global instance
window.PlanetSystem = new PlanetSystem();

// Add styles for metrics
const style = document.createElement('style');
style.textContent = `
    .planet-metrics {
        font-size: 12px;
        line-height: 1.8;
    }
    .metric-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid rgba(0,255,255,0.1);
    }
    .metric-row:last-child {
        border-bottom: none;
    }
    .metric-label {
        color: rgba(0,255,255,0.5);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .metric-value {
        color: #00ffff;
        font-weight: bold;
        text-shadow: 0 0 5px rgba(0,255,255,0.5);
    }
`;
document.head.appendChild(style);