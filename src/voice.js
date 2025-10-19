// voice.js - Voice Interface & WebSocket Communication

class VoiceInterface {
    constructor() {
        this.ws = null;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.audioContext = null;
        this.analyser = null;
        this.wsReconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    init() {
        console.log('🎙️ Initializing Voice Interface...');
        this.setupWebSocket();
        this.initSpeechRecognition();
        this.setupVoiceButton();
        this.setupWaveformCanvas();
        console.log('✅ Voice Interface initialized');
    }

    setupWebSocket() {
        const wsUrl = 'wss://pal-backend-production.up.railway.app/ws';
        
        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.wsReconnectAttempts = 0;
                this.updateConnectionStatus('CONNECTED');
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('ERROR');
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateConnectionStatus('DISCONNECTED');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateConnectionStatus('FAILED');
        }
    }

    attemptReconnect() {
        if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
            this.wsReconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.wsReconnectAttempts}`);
            setTimeout(() => this.setupWebSocket(), 3000 * this.wsReconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            this.updateConnectionStatus('OFFLINE');
        }
    }

    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('WebSocket message:', message);

            switch (message.type) {
                case 'notification':
                    this.showNotification(message.data);
                    break;
                case 'intervention':
                    this.handleIntervention(message.data);
                    break;
                case 'data_update':
                    this.handleDataUpdate(message.data);
                    break;
                case 'sync_complete':
                    this.handleSyncComplete(message.data);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    showNotification(data) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: rgba(0, 10, 20, 0.95);
            border: 2px solid rgba(0, 255, 255, 0.5);
            padding: 20px;
            max-width: 300px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        `;
        
        notification.innerHTML = `
            <div style="font-size: 14px; font-weight: bold; color: #00ffff; margin-bottom: 10px;">
                ${data.title || 'Phoenix Notification'}
            </div>
            <div style="font-size: 12px; color: rgba(0, 255, 255, 0.7);">
                ${data.message || ''}
            </div>
        `;

        document.body.appendChild(notification);

        // Speak notification if enabled
        if (data.speak) {
            this.speak(data.message);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    handleIntervention(data) {
        console.log('Intervention alert:', data);
        
        this.showNotification({
            title: '⚠️ INTERVENTION ALERT',
            message: data.message,
            speak: true
        });

        // Flash the screen border
        this.flashAlert();
    }

    handleDataUpdate(data) {
        console.log('Data update received:', data);
        
        // Trigger JARVIS engine to refresh data
        if (window.jarvisEngine) {
            window.jarvisEngine.loadAllData();
        }
    }

    handleSyncComplete(data) {
        this.showNotification({
            title: '✅ Sync Complete',
            message: `${data.source} data synced successfully`,
            speak: false
        });

        if (window.reactorCore) {
            window.reactorCore.setSyncStatus('SYNCED');
        }
    }

    flashAlert() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 5px solid #00ffff;
            pointer-events: none;
            z-index: 9999;
            animation: alertFlash 0.5s ease-out 3;
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1500);
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            console.log('🎤 Listening...');
            this.isListening = true;
            this.updateVoiceButtonState(true);
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Heard:', transcript);
            this.processVoiceCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceButtonState(false);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButtonState(false);
        };
    }

    setupVoiceButton() {
        const voiceBtn = document.getElementById('voice-button');
        const chatInterface = document.getElementById('chat-interface');
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (this.isListening) {
                    this.stopListening();
                } else {
                    this.startListening();
                }
                
                // Toggle chat interface
                if (chatInterface) {
                    chatInterface.classList.toggle('active');
                }
            });
        }
    }

    setupWaveformCanvas() {
        const voiceBtn = document.getElementById('voice-button');
        if (!voiceBtn) return;

        this.waveformCanvas = document.createElement('canvas');
        this.waveformCanvas.width = 60;
        this.waveformCanvas.height = 60;
        this.waveformCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        voiceBtn.appendChild(this.waveformCanvas);
        this.waveformCtx = this.waveformCanvas.getContext('2d');
    }

    startListening() {
        if (!this.recognition) {
            console.warn('Speech recognition not available');
            return;
        }

        try {
            this.recognition.start();
            this.animateWaveform();
        } catch (error) {
            console.error('Failed to start listening:', error);
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    animateWaveform() {
        if (!this.isListening || !this.waveformCtx) return;

        this.waveformCtx.clearRect(0, 0, 60, 60);
        
        // Draw circular waveform
        const centerX = 30;
        const centerY = 30;
        const radius = 20;
        const points = 16;

        this.waveformCtx.beginPath();
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const variation = Math.sin(Date.now() * 0.01 + i) * 5;
            const r = radius + variation;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
                this.waveformCtx.moveTo(x, y);
            } else {
                this.waveformCtx.lineTo(x, y);
            }
        }
        this.waveformCtx.closePath();
        this.waveformCtx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        this.waveformCtx.lineWidth = 2;
        this.waveformCtx.stroke();

        if (this.isListening) {
            requestAnimationFrame(() => this.animateWaveform());
        }
    }

    updateVoiceButtonState(active) {
        const voiceBtn = document.getElementById('voice-button');
        if (voiceBtn) {
            if (active) {
                voiceBtn.classList.add('active');
            } else {
                voiceBtn.classList.remove('active');
            }
        }
    }

    processVoiceCommand(command) {
        console.log('Processing command:', command);
        
        const lowerCmd = command.toLowerCase();

        // Context-aware commands
        if (lowerCmd.includes('activate phoenix') || lowerCmd.includes('hey phoenix')) {
            this.speak('Phoenix activated. How can I help?');
            return;
        }

        if (lowerCmd.includes('health') || lowerCmd.includes('improve my health')) {
            this.speak('Analyzing health data');
            if (window.jarvisEngine) {
                window.jarvisEngine.expandPlanet('mercury');
            }
            return;
        }

        if (lowerCmd.includes('fitness') || lowerCmd.includes('workout')) {
            this.speak('Loading fitness metrics');
            if (window.jarvisEngine) {
                window.jarvisEngine.expandPlanet('venus');
            }
            return;
        }

        if (lowerCmd.includes('calendar') || lowerCmd.includes('schedule')) {
            this.speak('Checking your calendar');
            if (window.jarvisEngine) {
                window.jarvisEngine.expandPlanet('earth');
            }
            return;
        }

        if (lowerCmd.includes('goals')) {
            this.speak('Reviewing goals');
            if (window.jarvisEngine) {
                window.jarvisEngine.expandPlanet('mars');
            }
            return;
        }

        if (lowerCmd.includes('sync wearables') || lowerCmd.includes('sync data')) {
            this.speak('Opening sync options');
            document.getElementById('sync-modal').style.display = 'flex';
            return;
        }

        if (lowerCmd.includes('close') || lowerCmd.includes('go back')) {
            if (window.jarvisEngine) {
                window.jarvisEngine.collapseDashboard();
            }
            return;
        }

        // Send to JARVIS engine for general processing
        if (window.jarvisEngine) {
            window.jarvisEngine.handleVoiceCommand(command);
        } else {
            this.speak('Command not recognized');
        }
    }

    speak(text) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        // Try to use a more robotic/AI voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes('Google') || v.name.includes('Microsoft')
        );
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            console.log('🔊 Speaking:', text);
        };

        utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
        };

        this.synthesis.speak(utterance);
    }

    updateConnectionStatus(status) {
        if (window.reactorCore) {
            window.reactorCore.setSyncStatus(status);
        }
    }

    sendMessage(type, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        } else {
            console.warn('WebSocket not connected');
        }
    }

    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.recognition) {
            this.recognition.stop();
        }
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
}

// Initialize
const voiceInterface = new VoiceInterface();
window.voiceInterface = voiceInterface;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => voiceInterface.init());
} else {
    voiceInterface.init();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @keyframes alertFlash {
        0%, 100% {
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
