// src/voice.js - Complete Voice Interface with Queue System & Context-Aware Intelligence
// ✅ FIXED: Changed to default import from api.js
import API from './api.js';

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
        
        // Voice settings
        this.selectedVoice = 'nova'; // OpenAI TTS voice
        this.speechSpeed = 1.0;
        this.availableVoices = [];
        this.useServerTTS = true; // Use OpenAI TTS by default
        this.fallbackVoice = null; // Browser fallback voice
        
        // Audio management
        this.currentAudio = null;
        this.audioQueue = [];
        
        // ⭐ Speech Queue System
        this.queue = [];
        this.speaking = false;
        this.contextAware = true;
        
        // Proactive messaging
        this.proactiveTimer = null;
        this.lastProactiveMessage = Date.now();
    }

    async init() {
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
        this.createVoiceSettingsModal();
        
        // Load voice settings from localStorage
        this.loadSettings();
        
        // Fetch available voices from server
        await this.loadServerVoices();
        
        // Check server TTS status
        await this.checkServerStatus();
        
        // Start proactive messaging
        this.startProactiveMessaging();
        
        // Say initial greeting after 2 seconds
        setTimeout(() => {
            this.sayInitialGreeting();
        }, 2000);
        
        console.log('✅ Voice Interface Ready');
        return true;
    }

    // ========================================
    // ⭐ QUEUE SYSTEM FOR SPEECH
    // ========================================

    async speak(text, priority = 'normal') {
        console.log('🔊 Queueing speech:', text, 'Priority:', priority);
        
        // Add to queue based on priority
        this.queue[priority === 'urgent' ? 'unshift' : 'push']({ text, priority });
        
        // Start processing if not already speaking
        if (!this.speaking) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.speaking = false;
            return;
        }
        
        this.speaking = true;
        const { text, priority } = this.queue.shift();
        
        console.log(`🔊 Processing queued message (${priority}):`, text);
        
        // Use appropriate TTS method
        if (this.useServerTTS) {
            try {
                await this.speakWithServer(text);
            } catch (error) {
                console.error('Server TTS failed, falling back to browser:', error);
                await this.speakWithBrowser(text);
            }
        } else {
            await this.speakWithBrowser(text);
        }
        
        // Process next in queue after current finishes
        this.processQueue();
    }

    // ========================================
    // ⭐ LOAD SERVER VOICES (FIXED)
    // ========================================

    async loadServerVoices() {
        try {
            const data = await API.getAvailableVoices(); // ✅ FIXED
            if (data.voices) {
                this.availableVoices = data.voices;
                this.populateVoiceSelect();
                console.log('✅ Loaded', data.voices.length, 'server voices');
            }
        } catch (error) {
            console.error('Failed to load server voices:', error);
            this.useServerTTS = false;
            this.showError('Could not load server voices. Using browser fallback.');
        }
    }

    async checkServerStatus() {
        try {
            const status = await API.getVoiceStatus(); // ✅ FIXED
            const indicator = document.getElementById('voice-status-indicator');
            if (indicator) {
                if (status.available) {
                    indicator.innerHTML = `✅ Server TTS: Online | Model: ${status.service}`;
                    indicator.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                    indicator.style.color = 'rgba(0, 255, 136, 0.8)';
                    this.useServerTTS = true;
                    console.log('✅ OpenAI TTS available');
                } else {
                    indicator.innerHTML = '⚠️ Server TTS: Offline | Using browser fallback';
                    indicator.style.borderColor = 'rgba(255, 136, 0, 0.5)';
                    indicator.style.color = 'rgba(255, 136, 0, 0.8)';
                    this.useServerTTS = false;
                    console.warn('⚠️ OpenAI TTS unavailable, using browser fallback');
                }
            }
        } catch (error) {
            console.error('Failed to check voice status:', error);
            this.useServerTTS = false;
        }
    }

    async speakWithServer(text) {
        try {
            this.isSpeaking = true;
            this.updateUI('speaking');
            this.displayResponse(text);

            const audioBlob = await API.textToSpeech(text, this.selectedVoice, this.speechSpeed); // ✅ FIXED
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }

            this.currentAudio = new Audio(audioUrl);
            
            return new Promise((resolve, reject) => {
                this.currentAudio.onended = () => {
                    console.log('🔊 Finished speaking (server TTS)');
                    this.isSpeaking = false;
                    this.updateUI('idle');
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    resolve();
                };

                this.currentAudio.onerror = (error) => {
                    console.error('Audio playback error:', error);
                    this.isSpeaking = false;
                    this.updateUI('idle');
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    reject(new Error('Audio playback failed'));
                };

                this.currentAudio.play();
                console.log('✅ Playing audio via OpenAI TTS');
            });
        } catch (error) {
            this.isSpeaking = false;
            this.updateUI('idle');
            throw error;
        }
    }

    // ... rest of voice.js remains the same ...
    // (I'm showing the critical fixes - the rest of the file is identical to what you have)

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

    setupSpeechSynthesis() {
        if (!this.synthesis) return;

        const loadVoices = () => {
            const voices = this.synthesis.getVoices();
            
            this.fallbackVoice = voices.find(v => 
                v.name.includes('Google UK English Female') ||
                v.name.includes('Google US English') ||
                v.name.includes('Microsoft Zira') ||
                v.name.includes('Microsoft David') ||
                v.name.includes('Alex')
            ) || voices[0];

            console.log('🔊 Fallback voice:', this.fallbackVoice?.name || 'Default');
        };

        if (this.synthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            this.synthesis.onvoiceschanged = loadVoices;
        }
    }

    // Continue with rest of methods from original voice.js...
    // (setupVoiceButton, createVoiceSettingsModal, etc. - all identical)
}

// ========================================
// 🚀 INITIALIZE
// ========================================

const voiceInterface = new VoiceInterface();
window.voiceInterface = voiceInterface;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        voiceInterface.init();
    });
} else {
    voiceInterface.init();
}

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
