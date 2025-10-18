// jarvis.js - Phoenix JARVIS Intelligence Engine

class PhoenixJARVIS {
    constructor() {
        this.state = 'PAL'; // Start simple, evolve to JARVIS
        this.userData = {
            name: 'Josh',
            recoveryScore: 78,
            hrv: 68,
            sleepHours: 7.3,
            steps: 4250,
            activeMinutes: 22,
            goals: [
                { name: 'Morning workout', completed: true },
                { name: 'Hit 10k steps', completed: false, current: 4250 },
                { name: 'Meditate 10 min', completed: false },
                { name: 'Drink 8 glasses water', completed: false, current: 3 },
                { name: 'Sleep by 10:30 PM', completed: false }
            ]
        };
        this.isVoiceActive = false;
        this.personality = {
            mode: 'friendly',
            confidence: 0.7,
            proactivity: 0.8
        };
    }

    init() {
        console.log('🔥 Phoenix JARVIS Initializing...');
        this.setupEventListeners();
        this.updateTime();
        this.startAnalytics();
        this.checkUserState();
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
        
        // Run proactive checks every 30 seconds
        setInterval(() => this.proactiveCheck(), 30000);
    }

    setupEventListeners() {
        // Reactor click - opens holographic overlay
        const reactor = document.getElementById('reactor');
        reactor.addEventListener('click', () => {
            this.openHolographicInterface();
        });

        // Quick action buttons
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncWearables();
        });

        document.getElementById('goalsBtn').addEventListener('click', () => {
            this.showGoals();
        });

        document.getElementById('analysisBtn').addEventListener('click', () => {
            this.runHealthAnalysis();
        });

        // Chat interface
        const chatToggle = document.getElementById('chatToggle');
        const chatBox = document.getElementById('chatBox');
        const closeChat = document.getElementById('closeChat');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');

        chatToggle.addEventListener('click', () => {
            chatBox.classList.toggle('active');
            if (chatBox.classList.contains('active')) {
                chatInput.focus();
            }
        });

        closeChat.addEventListener('click', () => {
            chatBox.classList.remove('active');
        });

        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                this.handleUserMessage(message);
                chatInput.value = '';
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeDisplay = document.getElementById('timeDisplay');
        const dateDisplay = document.getElementById('dateDisplay');
        
        if (timeDisplay) {
            timeDisplay.textContent = `${hours}:${minutes}`;
        }
        
        if (dateDisplay) {
            const options = { weekday: 'long', month: 'short', day: 'numeric' };
            dateDisplay.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
        }
    }

    checkUserState() {
        // Analyze user's current state and adapt interface
        const hour = new Date().getHours();
        const { recoveryScore, hrv, sleepHours } = this.userData;

        let greeting = '';
        let recommendation = '';

        if (hour < 12) {
            greeting = `Good morning, ${this.userData.name}`;
            if (recoveryScore < 50) {
                recommendation = "Recovery is low. Consider light movement only today.";
            } else if (recoveryScore > 75) {
                recommendation = "Excellent recovery! You're primed for intense training.";
            } else {
                recommendation = "Moderate recovery. Steady-state cardio recommended.";
            }
        } else if (hour < 17) {
            greeting = `Good afternoon, ${this.userData.name}`;
            recommendation = "Optimal time for your main workout. HRV is stable.";
        } else {
            greeting = `Good evening, ${this.userData.name}`;
            recommendation = "Wind down mode. Focus on recovery and tomorrow's preparation.";
        }

        // Update welcome message
        const welcomeH1 = document.querySelector('.welcome-message h1');
        const welcomeP = document.querySelector('.welcome-message p');
        if (welcomeH1) welcomeH1.textContent = greeting;
        if (welcomeP) welcomeP.textContent = recommendation;
    }

    proactiveCheck() {
        // Run proactive health checks
        const alerts = [];
        const hour = new Date().getHours();

        // Check water intake
        const waterGoal = this.userData.goals.find(g => g.name.includes('water'));
        if (waterGoal && waterGoal.current < 4 && hour > 14) {
            alerts.push("💧 Hydration alert: You're behind on water intake");
        }

        // Check step count
        if (this.userData.steps < 5000 && hour > 15) {
            alerts.push("🚶 Movement needed: " + (10000 - this.userData.steps) + " steps to goal");
        }

        // Check for upcoming sleep time
        if (hour >= 21) {
            alerts.push("🌙 Begin wind-down routine in 30 minutes");
        }

        // Display alert if any
        if (alerts.length > 0 && Math.random() > 0.7) { // 30% chance to show
            this.showPhoenixMessage(alerts[0]);
        }
    }

    handleUserMessage(message) {
        // Add user message to chat
        this.addChatMessage(message, 'user');

        // Process message and generate response
        const response = this.generateResponse(message.toLowerCase());
        
        setTimeout(() => {
            this.addChatMessage(response, 'phoenix');
        }, 500 + Math.random() * 500); // Simulate thinking
    }

    generateResponse(message) {
        // Simple response logic - would connect to real AI in production
        if (message.includes('workout')) {
            return `Based on your ${this.userData.recoveryScore}% recovery, I recommend a 45-minute upper body session. Your legs need another 24 hours.`;
        } else if (message.includes('sleep')) {
            return `You got ${this.userData.sleepHours} hours last night. Aim for 8 hours tonight. Set a reminder for 10 PM to start winding down.`;
        } else if (message.includes('recovery')) {
            return `Recovery at ${this.userData.recoveryScore}%. HRV is ${this.userData.hrv}ms (baseline: 65ms). You're above baseline - good to train.`;
        } else if (message.includes('goal')) {
            const incomplete = this.userData.goals.filter(g => !g.completed).length;
            return `You have ${incomplete} goals remaining today. Priority: Hit your step target (${10000 - this.userData.steps} to go).`;
        } else if (message.includes('stress')) {
            return `Your HRV indicates low stress. Maintain this with your planned meditation session at 2 PM.`;
        } else if (message.includes('food') || message.includes('nutrition')) {
            return `Based on your training today, aim for 180g protein, 250g carbs. You're at 65% of protein target.`;
        } else {
            return `Analyzing: "${message}". Your metrics look solid. Specific question about recovery, training, or goals?`;
        }
    }

    addChatMessage(content, sender) {
        const messagesDiv = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    showPhoenixMessage(message) {
        // Show proactive message in chat if open
        const chatBox = document.getElementById('chatBox');
        if (chatBox.classList.contains('active')) {
            this.addChatMessage(message, 'phoenix');
        }
    }

    syncWearables() {
        const btn = document.getElementById('syncBtn');
        btn.textContent = 'SYNCING...';
        btn.style.background = 'rgba(0,255,255,0.3)';

        // Simulate sync
        setTimeout(() => {
            this.userData.steps = 4850;
            this.userData.activeMinutes = 28;
            this.userData.recoveryScore = 76;
            
            btn.textContent = 'SYNCED ✓';
            btn.style.background = 'rgba(0,255,0,0.2)';
            
            this.showPhoenixMessage('Wearables synced. Steps: 4,850. Recovery dropped 2% - normal post-activity.');
            
            setTimeout(() => {
                btn.textContent = 'SYNC WEARABLES';
                btn.style.background = '';
            }, 2000);
        }, 2000);
    }

    showGoals() {
        const goalsHtml = this.userData.goals.map(goal => {
            const status = goal.completed ? '✅' : '⏳';
            const progress = goal.current ? ` (${goal.current}/${goal.name.match(/\d+/)?.[0] || '?'})` : '';
            return `${status} ${goal.name}${progress}`;
        }).join('\n');

        this.addChatMessage(`Today's Goals:\n${goalsHtml}`, 'phoenix');
    }

    runHealthAnalysis() {
        const btn = document.getElementById('analysisBtn');
        btn.textContent = 'ANALYZING...';

        setTimeout(() => {
            const analysis = `
HEALTH ANALYSIS COMPLETE:
━━━━━━━━━━━━━━━━━━━━━
Recovery: ${this.userData.recoveryScore}% [GOOD]
HRV: ${this.userData.hrv}ms [ABOVE BASELINE]
Sleep: ${this.userData.sleepHours}h [ADEQUATE]
Activity: ${this.userData.steps} steps [MODERATE]
Training Load: 72/100 [OPTIMAL]

RECOMMENDATION: Ready for high-intensity training.
Next optimal window: 2:00 PM - 3:30 PM
            `.trim();

            this.addChatMessage(analysis, 'phoenix');
            btn.textContent = 'HEALTH ANALYSIS';
        }, 1500);
    }

    openHolographicInterface() {
        const overlay = document.getElementById('holoOverlay');
        overlay.classList.add('active');
        
        // Initialize planet system if not already done
        if (window.PlanetSystem) {
            window.PlanetSystem.init();
        }
        
        // Close on escape or click outside
        const closeOverlay = (e) => {
            if (e.key === 'Escape' || e.target === overlay) {
                overlay.classList.remove('active');
                document.removeEventListener('keydown', closeOverlay);
                overlay.removeEventListener('click', closeOverlay);
            }
        };
        
        document.addEventListener('keydown', closeOverlay);
        overlay.addEventListener('click', closeOverlay);
    }

    startAnalytics() {
        // Simulate real-time data updates
        setInterval(() => {
            // Update steps
            if (Math.random() > 0.7) {
                this.userData.steps += Math.floor(Math.random() * 50);
                const goalsWidget = document.querySelector('.goals-widget .widget-value');
                if (goalsWidget && this.userData.steps > 5000) {
                    goalsWidget.textContent = '4/5'; // Update goal completion
                }
            }
        }, 10000); // Every 10 seconds
    }

    evolveToJARVIS() {
        // After user engagement, reveal more advanced features
        if (this.state === 'PAL') {
            console.log('🚀 Evolving to JARVIS mode...');
            this.state = 'JARVIS';
            this.personality.confidence = 0.95;
            this.personality.proactivity = 1.0;
            
            // Add more data streams, enable voice, show advanced metrics
            document.querySelector('.phoenix-text').textContent = 'JARVIS';
        }
    }
}

// Initialize Phoenix JARVIS when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.Phoenix = new PhoenixJARVIS();
    window.Phoenix.init();
});