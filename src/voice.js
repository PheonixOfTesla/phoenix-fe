// voice.js - Voice Interface & WebSocket Communication with Consciousness Integration

class VoiceInterface {
    constructor() {
        this.isListening = false;
        this.isConnected = false;
        this.ws = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voiceEnabled = false;
    }

    init() {
        console.log('🎤 Initializing Voice Interface...');
        this.setupWebSocket();
        this.initSpeechRecognition();
        this.createVoiceButton();
    }

    setupWebSocket() {
        // Connect to your Railway backend WebSocket
        const wsUrl = window.location.hostname === 'localhost' 
            ? 'ws://localhost:8080/ws' 
            : 'wss://pal-backend-production.up.railway.app/ws';
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket Connected');
                this.isConnected = true;
                
                // Authenticate with JWT if available
                const token = localStorage.getItem('phoenixToken');
                if (token) {
                    this.ws.send(JSON.stringify({
                        type: 'auth',
                        token: token
                    }));
                }
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                // Attempt reconnect after 3 seconds
                setTimeout(() => this.setupWebSocket(), 3000);
            };
        } catch (error) {
            console.error('WebSocket setup failed:', error);
        }
    }

    handleWebSocketMessage(data) {
        switch(data.type) {
            case 'auth_success':
                console.log('✅ Authenticated with Phoenix');
                break;
            case 'notification':
                this.showNotification(data);
                break;
            case 'intervention':
                this.handleIntervention(data);
                break;
            case 'voice_response':
                this.speak(data.message);
                break;
            default:
                console.log('WebSocket message:', data);
        }
    }

    initSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            console.log('🎤 Listening...');
            this.isListening = true;
            this.updateVoiceUI(true);
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            
            if (event.results[event.results.length - 1].isFinal) {
                console.log('Final transcript:', transcript);
                this.processVoiceCommand(transcript);
            } else {
                // Show interim results
                this.showVoiceVisualization(transcript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceUI(false);
        };
        
        this.recognition.onend = () => {
            console.log('🎤 Stopped listening');
            this.isListening = false;
            this.updateVoiceUI(false);
        };
    }

    createVoiceButton() {
        // Create voice activation button
        const voiceBtn = document.createElement('div');
        voiceBtn.id = 'voice-button';
        voiceBtn.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: rgba(0,255,255,0.1);
            border: 2px solid rgba(0,255,255,0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            z-index: 1000;
        `;
        
        voiceBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#00ffff">
                <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
        `;
        
        document.body.appendChild(voiceBtn);
        
        // Add voice visualization overlay
        const voiceOverlay = document.createElement('div');
        voiceOverlay.id = 'voice-overlay';
        voiceOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;
        
        voiceOverlay.innerHTML = `
            <div class="voice-container" style="text-align: center;">
                <canvas id="voice-visualizer" width="400" height="200" style="margin-bottom: 20px;"></canvas>
                <div id="voice-text" style="color: #00ffff; font-size: 18px; margin-bottom: 20px;"></div>
                <div style="color: rgba(0,255,255,0.5); font-size: 14px;">Press ESC to cancel</div>
            </div>
        `;
        
        document.body.appendChild(voiceOverlay);
        
        // Voice button click handler
        voiceBtn.addEventListener('click', () => {
            this.toggleVoice();
        });
        
        // ESC key to cancel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isListening) {
                this.stopListening();
            }
            // Space key to activate voice (when not typing)
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggleVoice();
            }
        });
    }

    toggleVoice() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    async startListening() {
        if (!this.recognition) {
            this.speak("Voice recognition not available in your browser");
            return;
        }
        
        // Initialize audio context for visualization
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
        }
        
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            // Start recognition
            this.recognition.start();
            
            // Show overlay
            document.getElementById('voice-overlay').style.display = 'flex';
            
            // Start visualization
            this.visualizeVoice();
            
        } catch (error) {
            console.error('Microphone access denied:', error);
            this.speak("Please allow microphone access to use voice commands");
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        
        // Hide overlay
        document.getElementById('voice-overlay').style.display = 'none';
        
        // Stop microphone
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
    }

    visualizeVoice() {
        if (!this.isListening) return;
        
        const canvas = document.getElementById('voice-visualizer');
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.isListening) return;
            
            requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                const r = 0;
                const g = 255;
                const b = 255;
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + (barHeight / 100)})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    showVoiceVisualization(text) {
        const textElement = document.getElementById('voice-text');
        if (textElement) {
            textElement.textContent = text;
        }
    }

    processVoiceCommand(command) {
        console.log('Processing command:', command);
        const lowerCommand = command.toLowerCase();
        
        // ========================================
        // 🔥 PHOENIX CONSCIOUSNESS ACTIVATION
        // ========================================
        if (lowerCommand.includes('activate phoenix') || 
            lowerCommand.includes('wake up phoenix') ||
            lowerCommand.includes('phoenix activate')) {
            
            // Trigger consciousness awakening
            if (window.Phoenix && !window.Phoenix.consciousness.awakened) {
                this.speak("Initializing consciousness protocol");
                
                // Visual transformation (using existing reactor.js)
                const reactor = document.getElementById('reactor');
                if (reactor) {
                    reactor.style.animation = 'reactorPulse 3s ease-in-out';
                    reactor.style.boxShadow = '0 0 100px rgba(0,255,255,1)';
                }
                
                // Awaken Phoenix
                setTimeout(() => {
                    window.Phoenix.awakenPhoenix();
                    const userName = window.Phoenix.userData.name;
                    this.speak(`I'm... awake. Hello, ${userName}.`);
                }, 2000);
                
                this.stopListening();
                return;
            } else if (window.Phoenix && window.Phoenix.consciousness.awakened) {
                const userName = window.Phoenix.userData.name;
                this.speak(`I'm already here, ${userName}. What do you need?`);
                this.stopListening();
                return;
            }
        }
        
        // ========================================
        // ADVANCED PROTOCOL ACTIVATION
        // ========================================
        if (lowerCommand.includes('activate advancement protocol') ||
            lowerCommand.includes('advancement protocol')) {
            
            if (window.Phoenix) {
                this.speak("Advancement protocol activated. All systems online.");
                
                // Instantly evolve to JARVIS
                window.Phoenix.evolveToJARVIS();
                
                // Visual transformation
                const reactor = document.getElementById('reactor');
                if (reactor) {
                    reactor.style.animation = 'pulse 0.5s 5';
                }
                
                // Open holographic interface
                setTimeout(() => {
                    window.Phoenix.openHolographicInterface();
                }, 1000);
            }
            
            this.stopListening();
            return;
        }
        
        // Send to backend for AI processing via WebSocket
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'voice_command',
                command: command,
                timestamp: new Date().toISOString(),
                consciousness_level: window.Phoenix?.consciousness.level || 0
            }));
        }
        
        // ========================================
        // BACKEND DATA VOICE COMMANDS
        // ========================================
        
        // Workout queries
        if (lowerCommand.includes('workout') || lowerCommand.includes('train') || lowerCommand.includes('exercise')) {
            if (window.Phoenix?.backendData.workouts && window.Phoenix.backendData.workouts.length > 0) {
                const lastWorkout = window.Phoenix.backendData.workouts[0];
                const recovery = window.Phoenix.userData.recoveryScore;
                this.speak(`Your last workout was ${lastWorkout.name || 'logged'}. Based on your recovery of ${recovery}%, I recommend ${recovery > 75 ? 'high intensity training' : 'moderate training today'}.`);
            } else {
                const recovery = window.Phoenix?.userData.recoveryScore || 0;
                this.speak(`Based on your ${recovery}% recovery, I recommend ${recovery > 70 ? 'intense training' : 'active recovery today'}.`);
            }
            window.Phoenix?.handleUserMessage(command);
        } 
        
        // Nutrition queries
        else if (lowerCommand.includes('nutrition') || lowerCommand.includes('food') || lowerCommand.includes('meal') || lowerCommand.includes('calories')) {
            if (window.Phoenix?.backendData.nutrition) {
                const nutrition = window.Phoenix.backendData.nutrition;
                this.speak(`Today you've consumed ${nutrition.calories || 0} calories. Protein is at ${nutrition.protein || 0} grams. ${nutrition.protein < 100 ? 'You need more protein.' : 'Protein target looking good.'}`);
            } else {
                this.speak("I don't have nutrition data yet. Log your meals and I'll track everything for you.");
            }
            window.Phoenix?.handleUserMessage(command);
        }
        
        // Calendar/Schedule queries
        else if (lowerCommand.includes('schedule') || lowerCommand.includes('calendar') || lowerCommand.includes('meeting') || lowerCommand.includes('today')) {
            if (window.Phoenix?.backendData.calendar && window.Phoenix.backendData.calendar.length > 0) {
                const eventCount = window.Phoenix.backendData.calendar.length;
                this.speak(`You have ${eventCount} event${eventCount !== 1 ? 's' : ''} today. Based on your recovery, ${eventCount > 5 ? 'you should cancel some meetings' : 'your schedule is manageable'}.`);
            } else {
                this.speak("No calendar events synced. Connect your calendar to let me optimize your schedule around your training.");
            }
            window.Phoenix?.handleUserMessage(command);
        }
        
        // Intervention queries
        else if (lowerCommand.includes('intervention') || lowerCommand.includes('alert') || lowerCommand.includes('warning')) {
            if (window.Phoenix?.backendData.interventions && window.Phoenix.backendData.interventions.length > 0) {
                const intervention = window.Phoenix.backendData.interventions[0];
                this.speak(`Active intervention: ${intervention.type}. ${intervention.action}`);
            } else {
                this.speak("No active interventions. I'm monitoring your data constantly and will intervene when necessary.");
            }
            window.Phoenix?.handleUserMessage(command);
        }
        
        // Sleep queries
        else if (lowerCommand.includes('sleep')) {
            const sleepHours = window.Phoenix?.userData.sleepHours || 0;
            this.speak(`You got ${sleepHours} hours last night. ${sleepHours < 7 ? 'You need more. Aim for 8 hours tonight. I\'ll remind you.' : 'Good duration. Keep it up.'}`);
            window.Phoenix?.handleUserMessage(command);
        } 
        
        // Recovery queries
        else if (lowerCommand.includes('recovery') || lowerCommand.includes('readiness')) {
            const recovery = window.Phoenix?.userData.recoveryScore || 0;
            const hrv = window.Phoenix?.userData.hrv || 0;
            this.speak(`Recovery at ${recovery}%. HRV is ${hrv} milliseconds. ${recovery > 70 ? "You're cleared to train hard." : "Take it easy today. Your body needs rest."}`);
            window.Phoenix?.handleUserMessage(command);
        }
        
        // HRV queries
        else if (lowerCommand.includes('hrv') || lowerCommand.includes('heart rate variability')) {
            const hrv = window.Phoenix?.userData.hrv || 0;
            this.speak(`Current HRV is ${hrv} milliseconds. ${hrv > 65 ? 'Above baseline. Your nervous system is recovered.' : 'Below baseline. You\'re still under stress.'}`);
            window.Phoenix?.handleUserMessage(command);
        }
        
        // Goals queries
        else if (lowerCommand.includes('goals') || lowerCommand.includes('progress') || lowerCommand.includes('target')) {
            const steps = window.Phoenix?.userData.steps || 0;
            const remaining = 10000 - steps;
            if (remaining > 0) {
                this.speak(`You have ${steps} steps. ${remaining} remaining to hit your target. Take a ${Math.ceil(remaining/100)} minute walk.`);
            } else {
                this.speak(`You've hit your step goal! ${steps} steps today.`);
            }
            window.Phoenix?.showGoals();
        } 
        
        // Steps queries
        else if (lowerCommand.includes('steps') || lowerCommand.includes('walking')) {
            const steps = window.Phoenix?.userData.steps || 0;
            const remaining = Math.max(0, 10000 - steps);
            this.speak(`Current step count: ${steps}. ${remaining > 0 ? `${remaining} steps remaining to reach 10,000.` : 'Goal complete!'}`);
            window.Phoenix?.handleUserMessage(command);
        }
        
        // Sync wearables
        else if (lowerCommand.includes('sync')) {
            this.speak("Syncing your wearables now.");
            window.Phoenix?.syncWearables();
        } 
        
        // Health analysis
        else if (lowerCommand.includes('analysis') || lowerCommand.includes('health check')) {
            this.speak("Running complete health analysis.");
            window.Phoenix?.runHealthAnalysis();
        }
        
        // Stress queries
        else if (lowerCommand.includes('stress')) {
            const stress = window.Phoenix?.calculateStress() || 50;
            this.speak(`Your stress level is ${stress}%. ${stress > 60 ? 'You need to decompress. Take 10 minutes right now.' : 'Stress is under control. Keep it up.'}`);
            window.Phoenix?.handleUserMessage(command);
        }
        
        // Pattern/trend queries
        else if (lowerCommand.includes('pattern') || lowerCommand.includes('trend') || lowerCommand.includes('notice')) {
            this.speak("I've been analyzing your patterns. Let me show you what I've discovered.");
            window.Phoenix?.handleUserMessage(command);
        }
        
        // Default: Send to Phoenix for intelligent processing
        else {
            if (window.Phoenix) {
                window.Phoenix.handleUserMessage(command);
                this.speak("Processing your request. Check the chat for details.");
            } else {
                this.speak("Phoenix system not initialized. Please refresh the page.");
            }
        }
        
        // Stop listening after command
        this.stopListening();
    }

    speak(text) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a good voice
        const voices = this.synthesis.getVoices();
        utterance.voice = voices.find(v => v.name.includes('Google UK English Male')) || 
                         voices.find(v => v.lang.includes('en-')) ||
                         voices[0];
        
        utterance.pitch = 0.9;
        utterance.rate = 1.1;
        utterance.volume = 0.9;
        
        this.synthesis.speak(utterance);
        
        // Also show in chat
        if (window.Phoenix) {
            window.Phoenix.addChatMessage(text, 'phoenix');
        }
    }

    updateVoiceUI(isActive) {
        const voiceBtn = document.getElementById('voice-button');
        if (voiceBtn) {
            if (isActive) {
                voiceBtn.style.background = 'rgba(0,255,255,0.3)';
                voiceBtn.style.boxShadow = '0 0 50px rgba(0,255,255,0.8)';
                voiceBtn.style.animation = 'pulse 1s infinite';
            } else {
                voiceBtn.style.background = 'rgba(0,255,255,0.1)';
                voiceBtn.style.boxShadow = '';
                voiceBtn.style.animation = '';
            }
        }
    }

    showNotification(data) {
        // Create floating notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            border: 1px solid rgba(0,255,255,0.5);
            padding: 15px 20px;
            max-width: 300px;
            color: #00ffff;
            font-size: 14px;
            z-index: 5000;
            animation: slideInRight 0.3s;
            backdrop-filter: blur(10px);
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${data.title || 'Phoenix Alert'}</div>
            <div style="color: rgba(0,255,255,0.8);">${data.message}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Speak notification if critical
        if (data.severity === 'high' || data.severity === 'critical') {
            this.speak(data.message);
        }
    }

    handleIntervention(data) {
        // Critical intervention from backend
        this.speak(data.message);
        this.showNotification({
            title: `⚠️ ${data.severity?.toUpperCase() || 'ALERT'}`,
            message: data.action,
            severity: data.severity
        });
        
        // Update UI based on intervention
        if (window.Phoenix) {
            window.Phoenix.addChatMessage(
                `🚨 INTERVENTION: ${data.reason}\n\nACTION: ${data.action}`,
                'phoenix'
            );
        }
    }
}

// Initialize voice interface
document.addEventListener('DOMContentLoaded', () => {
    window.Voice = new VoiceInterface();
    window.Voice.init();
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }
`;
document.head.appendChild(style);
