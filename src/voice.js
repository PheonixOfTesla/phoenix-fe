// voice.js - WORKING Voice Interface for Phoenix JARVIS
// Drop-in replacement for your current voice.js

class VoiceInterface {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceEnabled = false;
        this.currentTranscript = '';
        this.volume = 0;
        this.visualizerActive = false;
        this.selectedVoice = null;
    }

    init() {
        console.log('🎙️ Initializing Voice Interface...');
        
        if (!this.checkSupport()) {
            console.warn('⚠️ Voice features not fully supported in this browser');
            this.showNotSupported();
            return false;
        }

        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.setupVoiceButton();
        this.setupWaveform();
        
        console.log('✅ Voice Interface Ready');
        return true;
    }

    // ========================================
    // BROWSER SUPPORT CHECK
    // ========================================

    checkSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const hasRecognition = !!SpeechRecognition;
        const hasSynthesis = !!window.speechSynthesis;
        
        console.log('Voice Recognition:', hasRecognition ? '✅' : '❌');
        console.log('Voice Synthesis:', hasSynthesis ? '✅' : '❌');
        
        return hasRecognition && hasSynthesis;
    }

    showNotSupported() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 68, 68, 0.1);
            border: 2px solid rgba(255, 68, 68, 0.5);
            padding: 30px;
            max-width: 400px;
            z-index: 10000;
            text-align: center;
        `;
        notification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
            <div style="font-size: 16px; color: #ff4444; margin-bottom: 10px;">
                Voice Features Not Supported
            </div>
            <div style="font-size: 12px; color: rgba(255, 68, 68, 0.7);">
                Please use Chrome, Edge, or Safari for full voice capabilities
            </div>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: rgba(255, 68, 68, 0.2);
                border: 1px solid rgba(255, 68, 68, 0.5);
                color: #ff4444;
                cursor: pointer;
            ">Close</button>
        `;
        document.body.appendChild(notification);
    }

    // ========================================
    // SPEECH RECOGNITION SETUP
    // ========================================

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            console.log('🎤 Listening started...');
            this.isListening = true;
            this.currentTranscript = '';
            this.updateUI('listening');
            this.startVisualizer();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            this.currentTranscript = (finalTranscript || interimTranscript).trim();
            this.displayTranscript(this.currentTranscript);

            if (finalTranscript) {
                console.log('📝 Final transcript:', finalTranscript);
                this.processCommand(finalTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.isListening = false;
            this.updateUI('idle');
            this.stopVisualizer();

            if (event.error === 'not-allowed') {
                this.showError('Microphone permission denied. Please enable it in browser settings.');
            } else if (event.error === 'no-speech') {
                this.showError('No speech detected. Try again.');
            } else if (event.error === 'network') {
                this.showError('Network error. Check your connection.');
            }
        };

        this.recognition.onend = () => {
            console.log('🎤 Listening stopped');
            this.isListening = false;
            this.updateUI('idle');
            this.stopVisualizer();
        };
    }

    // ========================================
    // SPEECH SYNTHESIS SETUP
    // ========================================

    setupSpeechSynthesis() {
        if (!this.synthesis) return;

        // Wait for voices to load
        const loadVoices = () => {
            const voices = this.synthesis.getVoices();
            
            // Prefer: Google UK English Female > Microsoft > Default
            this.selectedVoice = voices.find(v => 
                v.name.includes('Google UK English Female') ||
                v.name.includes('Google US English') ||
                v.name.includes('Microsoft Zira') ||
                v.name.includes('Microsoft David') ||
                v.name.includes('Alex')
            ) || voices[0];

            console.log('🔊 Selected voice:', this.selectedVoice?.name || 'Default');
        };

        if (this.synthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            this.synthesis.onvoiceschanged = loadVoices;
        }
    }

    // ========================================
    // VOICE BUTTON
    // ========================================

    setupVoiceButton() {
        const voiceBtn = document.getElementById('voice-button');
        if (!voiceBtn) {
            console.warn('Voice button not found, creating one...');
            this.createVoiceButton();
            return;
        }

        voiceBtn.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });
    }

    createVoiceButton() {
        const btn = document.createElement('div');
        btn.id = 'voice-button';
        btn.className = 'voice-button';
        btn.innerHTML = '🎤';
        btn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 70px;
            height: 70px;
            background: rgba(0, 255, 255, 0.1);
            border: 2px solid rgba(0, 255, 255, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            font-size: 30px;
            transition: all 0.3s;
        `;
        
        btn.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });

        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(0, 255, 255, 0.2)';
            btn.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.6)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(0, 255, 255, 0.1)';
            btn.style.boxShadow = 'none';
        });

        document.body.appendChild(btn);
    }

    // ========================================
    // WAVEFORM VISUALIZER
    // ========================================

    setupWaveform() {
        const canvas = document.getElementById('voice-waveform');
        if (canvas) {
            this.waveformCanvas = canvas;
            this.waveformCtx = canvas.getContext('2d');
        }
    }

    startVisualizer() {
        this.visualizerActive = true;
        this.animateWaveform();
    }

    stopVisualizer() {
        this.visualizerActive = false;
    }

    animateWaveform() {
        if (!this.visualizerActive || !this.waveformCanvas) return;

        const ctx = this.waveformCtx;
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw circular waveform
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        const bars = 16;

        for (let i = 0; i < bars; i++) {
            const angle = (i / bars) * Math.PI * 2;
            const barHeight = 10 + Math.sin(Date.now() * 0.01 + i) * 20;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now() * 0.01 + i) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        requestAnimationFrame(() => this.animateWaveform());
    }

    // ========================================
    // CORE FUNCTIONS
    // ========================================

    async startListening() {
        if (!this.recognition) {
            this.showError('Speech recognition not available');
            return;
        }

        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately, we just needed permission

            this.recognition.start();
        } catch (error) {
            console.error('Microphone access error:', error);
            this.showError('Could not access microphone. Please grant permission.');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    speak(text, callback) {
        if (!this.synthesis) {
            console.error('Speech synthesis not available');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }

        utterance.onstart = () => {
            console.log('🔊 Speaking:', text);
            this.isSpeaking = true;
            this.updateUI('speaking');
            this.displayResponse(text);
        };

        utterance.onend = () => {
            console.log('🔊 Finished speaking');
            this.isSpeaking = false;
            this.updateUI('idle');
            if (callback) callback();
        };

        utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            this.isSpeaking = false;
            this.updateUI('idle');
        };

        this.synthesis.speak(utterance);
    }

    // ========================================
    // COMMAND PROCESSING
    // ========================================

    processCommand(command) {
        console.log('🧠 Processing command:', command);

        const lowerCmd = command.toLowerCase();
        let response = '';

        // Activation commands
        if (lowerCmd.includes('hello') || lowerCmd.includes('hi phoenix')) {
            response = 'Hello! Phoenix AI companion online. How can I optimize your life today?';
        }
        // Health commands
        else if (lowerCmd.includes('health') || lowerCmd.includes('recovery')) {
            response = 'Analyzing your health metrics. Your recovery score is at 78 percent. Heart rate variability is stable at 52 milliseconds. You are cleared for training today.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('mercury'), 2000);
            }
        }
        // Fitness commands
        else if (lowerCmd.includes('fitness') || lowerCmd.includes('workout')) {
            response = 'You have completed 4 workouts this week. Based on your recovery, I recommend a moderate intensity session today. Focus on compound movements.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('mercury'), 2000);
            }
        }
        // Calendar commands
        else if (lowerCmd.includes('calendar') || lowerCmd.includes('schedule')) {
            response = 'Checking your schedule. You have 3 events today. Next appointment is at 2 PM. I can optimize your time blocks if needed.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('earth'), 2000);
            }
        }
        // Goals commands
        else if (lowerCmd.includes('goals') || lowerCmd.includes('progress')) {
            response = 'Reviewing your goals. You are on track with 3 out of 5 active goals. Your weight loss goal is progressing at 0.8 pounds per week. Excellent consistency.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('mars'), 2000);
            }
        }
        // Sync commands
        else if (lowerCmd.includes('sync') || lowerCmd.includes('update data')) {
            response = 'Syncing all data sources. Fitbit connected. Pulling latest biometrics. Sync complete. All systems updated.';
            if (window.phoenix) {
                window.phoenix.syncAllData();
            }
        }
        // Close commands
        else if (lowerCmd.includes('close') || lowerCmd.includes('go back')) {
            response = 'Closing dashboard';
            if (window.jarvisEngine) {
                window.jarvisEngine.closePlanetDetail();
            }
        }
        // Weather
        else if (lowerCmd.includes('weather')) {
            response = 'Current temperature is 72 degrees Fahrenheit. Clear skies. Optimal conditions for outdoor training.';
        }
        // Thank you
        else if (lowerCmd.includes('thank')) {
            response = 'You are welcome. I am here to optimize your performance. Always.';
        }
        // Default
        else {
            response = 'Command acknowledged. How can I assist you further? Try asking about health, fitness, calendar, or goals.';
        }

        // Speak the response
        this.speak(response);
    }

    // ========================================
    // UI UPDATES
    // ========================================

    updateUI(state) {
        const voiceBtn = document.getElementById('voice-button');
        if (!voiceBtn) return;

        switch (state) {
            case 'listening':
                voiceBtn.innerHTML = '🎤';
                voiceBtn.classList.add('active');
                voiceBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
                voiceBtn.style.background = 'rgba(0, 255, 255, 0.3)';
                voiceBtn.style.boxShadow = '0 0 40px rgba(0, 255, 255, 0.8)';
                break;
            case 'speaking':
                voiceBtn.innerHTML = '🔊';
                voiceBtn.style.animation = 'pulse 0.8s ease-in-out infinite';
                voiceBtn.style.background = 'rgba(0, 255, 255, 0.2)';
                break;
            case 'idle':
            default:
                voiceBtn.innerHTML = '🎤';
                voiceBtn.classList.remove('active');
                voiceBtn.style.animation = 'none';
                voiceBtn.style.background = 'rgba(0, 255, 255, 0.1)';
                voiceBtn.style.boxShadow = 'none';
                break;
        }
    }

    displayTranscript(text) {
        let transcriptEl = document.getElementById('voice-transcript');
        
        if (!transcriptEl) {
            transcriptEl = document.createElement('div');
            transcriptEl.id = 'voice-transcript';
            transcriptEl.style.cssText = `
                position: fixed;
                bottom: 120px;
                right: 30px;
                max-width: 350px;
                padding: 15px;
                background: rgba(0, 10, 20, 0.95);
                border: 1px solid rgba(0, 255, 255, 0.5);
                color: #00ffff;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                z-index: 1000;
                animation: slideIn 0.3s;
            `;
            document.body.appendChild(transcriptEl);
        }

        transcriptEl.innerHTML = `<div style="opacity: 0.6; font-size: 10px; margin-bottom: 5px;">YOU:</div>${text}`;
    }

    displayResponse(text) {
        let responseEl = document.getElementById('voice-response');
        
        if (!responseEl) {
            responseEl = document.createElement('div');
            responseEl.id = 'voice-response';
            responseEl.style.cssText = `
                position: fixed;
                bottom: 120px;
                right: 30px;
                max-width: 350px;
                padding: 15px;
                background: rgba(0, 255, 255, 0.1);
                border: 1px solid rgba(0, 255, 255, 0.5);
                color: #00ffff;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                z-index: 1000;
                animation: slideIn 0.3s;
            `;
            document.body.appendChild(responseEl);
        }

        responseEl.innerHTML = `<div style="opacity: 0.6; font-size: 10px; margin-bottom: 5px;">PHOENIX:</div>${text}`;

        // Hide transcript when showing response
        const transcriptEl = document.getElementById('voice-transcript');
        if (transcriptEl) {
            transcriptEl.style.display = 'none';
        }

        // Auto-hide after speaking finishes
        setTimeout(() => {
            if (responseEl && !this.isSpeaking) {
                responseEl.style.animation = 'slideOut 0.3s';
                setTimeout(() => responseEl.remove(), 300);
            }
        }, 8000);
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            padding: 15px;
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid rgba(255, 68, 68, 0.5);
            color: #ff4444;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            max-width: 300px;
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        errorEl.textContent = message;
        document.body.appendChild(errorEl);

        setTimeout(() => {
            errorEl.style.animation = 'slideOut 0.3s';
            setTimeout(() => errorEl.remove(), 300);
        }, 4000);
    }

    // ========================================
    // PUBLIC API
    // ========================================

    toggle() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    sayGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
        if (hour >= 18) greeting = 'Good evening';
        
        this.speak(`${greeting}. Phoenix AI companion online and ready.`);
    }

    destroy() {
        if (this.recognition) {
            this.recognition.stop();
        }
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        this.stopVisualizer();
    }
}

// ========================================
// INITIALIZE
// ========================================

const voiceInterface = new VoiceInterface();
window.voiceInterface = voiceInterface;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        voiceInterface.init();
        
        // Say greeting after 2 seconds
        setTimeout(() => {
            voiceInterface.sayGreeting();
        }, 2000);
    });
} else {
    voiceInterface.init();
    setTimeout(() => voiceInterface.sayGreeting(), 2000);
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

export default voiceInterface;
