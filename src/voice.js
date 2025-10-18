// voice.js - Voice Interface & WebSocket Communication

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
        
        // Send to backend for AI processing
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'voice_command',
                command: command,
                timestamp: new Date().toISOString()
            }));
        }
        
        // Local command processing for immediate response
        if (lowerCommand.includes('workout') || lowerCommand.includes('train')) {
            this.speak("Based on your 78% recovery, I recommend upper body training. Your legs need another day.");
        } else if (lowerCommand.includes('sleep')) {
            this.speak("You got 7.3 hours last night. Aim for 8 tonight. I'll remind you at 10 PM.");
        } else if (lowerCommand.includes('recovery')) {
            this.speak(`Recovery at ${window.Phoenix.userData.recoveryScore}%. HRV is ${window.Phoenix.userData.hrv} milliseconds. You're ready for moderate intensity.`);
        } else if (lowerCommand.includes('goals')) {
            const incomplete = window.Phoenix.userData.goals.filter(g => !g.completed).length;
            this.speak(`You have ${incomplete} goals remaining today. Priority is hitting your step target.`);
        } else if (lowerCommand.includes('sync')) {
            this.speak("Syncing your wearables now.");
            window.Phoenix.syncWearables();
        } else if (lowerCommand.includes('analysis')) {
            this.speak("Running complete health analysis.");
            window.Phoenix.runHealthAnalysis();
        } else {
            // Default to Phoenix chat
            window.Phoenix.handleUserMessage(command);
        }
        
        // Stop listening after command
        this.stopListening();
    }

    speak(text) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.synthesis.getVoices().find(v => v.name.includes('Google UK English Male')) || 
                         this.synthesis.getVoices()[0];
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
    }

    handleIntervention(data) {
        // Critical intervention from backend
        this.speak(data.message);
        this.showNotification({
            title: `⚠️ ${data.severity.toUpperCase()} ALERT`,
            message: data.action
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
`;
document.head.appendChild(style);