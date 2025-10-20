// src/voice.js - Complete Voice Interface with Settings Modal
import { getAvailableVoices, textToSpeech, getVoiceStatus } from './api.js';

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
        
        console.log('✅ Voice Interface Ready');
        return true;
    }

    // ========================================
    // VOICE SETTINGS MODAL
    // ========================================

    createVoiceSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'voice-settings-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 10, 20, 0.98);
                border: 2px solid rgba(0, 255, 255, 0.5);
                padding: 40px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 0 60px rgba(0, 255, 255, 0.4);
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                    padding-bottom: 20px;
                ">
                    <h2 style="
                        color: #00ffff;
                        font-size: 24px;
                        margin: 0;
                        text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
                    ">VOICE SETTINGS</h2>
                    <button id="close-voice-settings" style="
                        background: transparent;
                        border: 1px solid rgba(255, 68, 68, 0.5);
                        color: #ff4444;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 20px;
                        transition: all 0.3s;
                    ">✕</button>
                </div>

                <div style="margin-bottom: 30px;">
                    <label style="
                        display: block;
                        color: rgba(0, 255, 255, 0.7);
                        font-size: 12px;
                        margin-bottom: 10px;
                        letter-spacing: 2px;
                    ">SELECT VOICE</label>
                    <select id="voice-select" style="
                        width: 100%;
                        padding: 15px;
                        background: rgba(0, 10, 20, 0.9);
                        border: 1px solid rgba(0, 255, 255, 0.3);
                        color: #00ffff;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        <option value="">Loading voices...</option>
                    </select>
                </div>

                <div style="margin-bottom: 30px;">
                    <label style="
                        display: block;
                        color: rgba(0, 255, 255, 0.7);
                        font-size: 12px;
                        margin-bottom: 10px;
                        letter-spacing: 2px;
                    ">SPEECH SPEED: <span id="speed-value">1.0x</span></label>
                    <input type="range" id="speed-slider" min="0.5" max="2.0" step="0.1" value="1.0" style="
                        width: 100%;
                        height: 6px;
                        background: rgba(0, 255, 255, 0.2);
                        outline: none;
                        -webkit-appearance: none;
                    ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        margin-top: 5px;
                        font-size: 10px;
                        color: rgba(0, 255, 255, 0.5);
                    ">
                        <span>0.5x (Slower)</span>
                        <span>2.0x (Faster)</span>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <button id="preview-voice-btn" style="
                        width: 100%;
                        padding: 15px;
                        background: rgba(0, 255, 255, 0.1);
                        border: 1px solid rgba(0, 255, 255, 0.5);
                        color: #00ffff;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        cursor: pointer;
                        letter-spacing: 2px;
                        transition: all 0.3s;
                    ">
                        🔊 PREVIEW VOICE
                    </button>
                </div>

                <div style="
                    display: flex;
                    gap: 15px;
                ">
                    <button id="save-voice-settings" style="
                        flex: 1;
                        padding: 15px;
                        background: rgba(0, 255, 255, 0.2);
                        border: 2px solid #00ffff;
                        color: #00ffff;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        cursor: pointer;
                        letter-spacing: 2px;
                        transition: all 0.3s;
                    ">
                        SAVE SETTINGS
                    </button>
                    <button id="cancel-voice-settings" style="
                        flex: 1;
                        padding: 15px;
                        background: transparent;
                        border: 1px solid rgba(0, 255, 255, 0.3);
                        color: rgba(0, 255, 255, 0.7);
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        cursor: pointer;
                        letter-spacing: 2px;
                        transition: all 0.3s;
                    ">
                        CANCEL
                    </button>
                </div>

                <div id="voice-status-indicator" style="
                    margin-top: 20px;
                    padding: 10px;
                    background: rgba(0, 255, 255, 0.05);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    font-size: 11px;
                    color: rgba(0, 255, 255, 0.6);
                    text-align: center;
                ">
                    Status: Checking server connection...
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('close-voice-settings').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        document.getElementById('voice-select').addEventListener('change', (e) => {
            this.selectedVoice = e.target.value;
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.speechSpeed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = this.speechSpeed.toFixed(1) + 'x';
        });

        document.getElementById('preview-voice-btn').addEventListener('click', () => {
            this.previewVoice();
        });

        document.getElementById('save-voice-settings').addEventListener('click', () => {
            this.saveSettings();
            this.closeSettingsModal();
            this.showNotification('Settings Saved', 'Voice preferences updated successfully');
        });

        document.getElementById('cancel-voice-settings').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        // Add hover effects
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
        });

        // Slider styling
        const style = document.createElement('style');
        style.textContent = `
            #speed-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                background: #00ffff;
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
            }
            #speed-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #00ffff;
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
                border: none;
            }
        `;
        document.head.appendChild(style);
    }

    openSettingsModal() {
        const modal = document.getElementById('voice-settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.populateVoiceSelect();
        }
    }

    closeSettingsModal() {
        const modal = document.getElementById('voice-settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async loadServerVoices() {
        try {
            const data = await getAvailableVoices();
            if (data.voices) {
                this.availableVoices = data.voices;
                this.populateVoiceSelect();
            }
        } catch (error) {
            console.error('Failed to load server voices:', error);
            this.useServerTTS = false;
        }
    }

    populateVoiceSelect() {
        const select = document.getElementById('voice-select');
        if (!select) return;

        select.innerHTML = '';

        if (this.availableVoices.length > 0) {
            this.availableVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.id;
                option.textContent = `${voice.name} - ${voice.description}${voice.recommended ? ' ⭐' : ''}`;
                if (voice.id === this.selectedVoice) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.textContent = 'No voices available';
            select.appendChild(option);
        }
    }

    async checkServerStatus() {
        try {
            const status = await getVoiceStatus();
            const indicator = document.getElementById('voice-status-indicator');
            if (indicator) {
                if (status.available) {
                    indicator.innerHTML = `✅ Server TTS: Online | Model: ${status.service}`;
                    indicator.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                    indicator.style.color = 'rgba(0, 255, 136, 0.8)';
                    this.useServerTTS = true;
                } else {
                    indicator.innerHTML = '⚠️ Server TTS: Offline | Using browser fallback';
                    indicator.style.borderColor = 'rgba(255, 136, 0, 0.5)';
                    indicator.style.color = 'rgba(255, 136, 0, 0.8)';
                    this.useServerTTS = false;
                }
            }
        } catch (error) {
            console.error('Failed to check voice status:', error);
            this.useServerTTS = false;
        }
    }

    async previewVoice() {
        const previewText = 'Hello. I am Phoenix, your AI companion. This is a preview of the selected voice.';
        
        const btn = document.getElementById('preview-voice-btn');
        if (btn) {
            btn.textContent = '⏳ GENERATING...';
            btn.disabled = true;
        }

        try {
            await this.speak(previewText);
        } catch (error) {
            console.error('Preview failed:', error);
            this.showError('Failed to preview voice');
        } finally {
            if (btn) {
                btn.textContent = '🔊 PREVIEW VOICE';
                btn.disabled = false;
            }
        }
    }

    saveSettings() {
        const settings = {
            selectedVoice: this.selectedVoice,
            speechSpeed: this.speechSpeed,
            useServerTTS: this.useServerTTS
        };
        localStorage.setItem('phoenixVoiceSettings', JSON.stringify(settings));
        console.log('Voice settings saved:', settings);
    }

    loadSettings() {
        const saved = localStorage.getItem('phoenixVoiceSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.selectedVoice = settings.selectedVoice || 'nova';
                this.speechSpeed = settings.speechSpeed || 1.0;
                this.useServerTTS = settings.useServerTTS !== false;
                
                // Update UI if modal exists
                const speedSlider = document.getElementById('speed-slider');
                const speedValue = document.getElementById('speed-value');
                if (speedSlider) speedSlider.value = this.speechSpeed;
                if (speedValue) speedValue.textContent = this.speechSpeed.toFixed(1) + 'x';
                
                console.log('Voice settings loaded:', settings);
            } catch (error) {
                console.error('Failed to load voice settings:', error);
            }
        }
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

        // Add settings button
        const settingsBtn = document.createElement('div');
        settingsBtn.id = 'voice-settings-button';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            font-size: 20px;
            transition: all 0.3s;
        `;
        
        settingsBtn.addEventListener('click', () => {
            this.openSettingsModal();
        });

        settingsBtn.addEventListener('mouseenter', () => {
            settingsBtn.style.background = 'rgba(0, 255, 255, 0.2)';
            settingsBtn.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        });

        settingsBtn.addEventListener('mouseleave', () => {
            settingsBtn.style.background = 'rgba(0, 255, 255, 0.1)';
            settingsBtn.style.boxShadow = 'none';
        });

        document.body.appendChild(settingsBtn);
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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

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

    async speak(text, callback) {
        console.log('🔊 Speaking:', text);

        if (this.useServerTTS) {
            try {
                await this.speakWithServer(text, callback);
            } catch (error) {
                console.error('Server TTS failed, falling back to browser:', error);
                this.speakWithBrowser(text, callback);
            }
        } else {
            this.speakWithBrowser(text, callback);
        }
    }

    async speakWithServer(text, callback) {
        try {
            this.isSpeaking = true;
            this.updateUI('speaking');
            this.displayResponse(text);

            const audioBlob = await textToSpeech(text, this.selectedVoice, this.speechSpeed);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }

            this.currentAudio = new Audio(audioUrl);
            
            this.currentAudio.onended = () => {
                console.log('🔊 Finished speaking');
                this.isSpeaking = false;
                this.updateUI('idle');
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                if (callback) callback();
            };

            this.currentAudio.onerror = (error) => {
                console.error('Audio playback error:', error);
                this.isSpeaking = false;
                this.updateUI('idle');
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                if (callback) callback();
            };

            await this.currentAudio.play();
        } catch (error) {
            this.isSpeaking = false;
            this.updateUI('idle');
            throw error;
        }
    }

    speakWithBrowser(text, callback) {
        if (!this.synthesis) {
            console.error('Speech synthesis not available');
            return;
        }

        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.speechSpeed;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        if (this.fallbackVoice) {
            utterance.voice = this.fallbackVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateUI('speaking');
            this.displayResponse(text);
        };

        utterance.onend = () => {
            console.log('🔊 Finished speaking (browser)');
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

        if (lowerCmd.includes('hello') || lowerCmd.includes('hi phoenix')) {
            response = 'Hello! Phoenix AI companion online. How can I optimize your life today?';
        } else if (lowerCmd.includes('health') || lowerCmd.includes('recovery')) {
            response = 'Analyzing your health metrics. Your recovery score is at 78 percent. Heart rate variability is stable at 52 milliseconds. You are cleared for training today.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('mercury'), 2000);
            }
        } else if (lowerCmd.includes('fitness') || lowerCmd.includes('workout')) {
            response = 'You have completed 4 workouts this week. Based on your recovery, I recommend a moderate intensity session today. Focus on compound movements.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('mercury'), 2000);
            }
        } else if (lowerCmd.includes('calendar') || lowerCmd.includes('schedule')) {
            response = 'Checking your schedule. You have 3 events today. Next appointment is at 2 PM. I can optimize your time blocks if needed.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('earth'), 2000);
            }
        } else if (lowerCmd.includes('goals') || lowerCmd.includes('progress')) {
            response = 'Reviewing your goals. You are on track with 3 out of 5 active goals. Your weight loss goal is progressing at 0.8 pounds per week. Excellent consistency.';
            if (window.jarvisEngine) {
                setTimeout(() => window.jarvisEngine.openPlanetDetail('mars'), 2000);
            }
        } else if (lowerCmd.includes('sync') || lowerCmd.includes('update data')) {
            response = 'Syncing all data sources. Fitbit connected. Pulling latest biometrics. Sync complete. All systems updated.';
            if (window.phoenix) {
                window.phoenix.syncAllData();
            }
        } else if (lowerCmd.includes('voice settings') || lowerCmd.includes('change voice')) {
            response = 'Opening voice settings. You can customize my voice and speech speed.';
            setTimeout(() => this.openSettingsModal(), 1000);
        } else if (lowerCmd.includes('close') || lowerCmd.includes('go back')) {
            response = 'Closing dashboard';
            if (window.jarvisEngine) {
                window.jarvisEngine.closePlanetDetail();
            }
        } else if (lowerCmd.includes('weather')) {
            response = 'Current temperature is 72 degrees Fahrenheit. Clear skies. Optimal conditions for outdoor training.';
        } else if (lowerCmd.includes('thank')) {
            response = 'You are welcome. I am here to optimize your performance. Always.';
        } else {
            response = 'Command acknowledged. How can I assist you further? Try asking about health, fitness, calendar, or goals.';
        }

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

        const transcriptEl = document.getElementById('voice-transcript');
        if (transcriptEl) {
            transcriptEl.style.display = 'none';
        }

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

    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            padding: 20px;
            background: rgba(0, 10, 20, 0.95);
            border: 2px solid rgba(0, 255, 255, 0.5);
            max-width: 300px;
            z-index: 10000;
            animation: slideIn 0.3s;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        `;
        
        notification.innerHTML = `
            <div style="font-size: 14px; font-weight: bold; color: #00ffff; margin-bottom: 10px;">${title}</div>
            <div style="font-size: 12px; color: rgba(0, 255, 255, 0.7);">${message}</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.stopVisualizer();
    }
}

// ========================================
// INITIALIZE
// ========================================

const voiceInterface = new VoiceInterface();
window.voiceInterface = voiceInterface;

// DO NOT AUTO-INITIALIZE
// Wait for manual activation from index.html or React app
console.log('✅ Voice Interface created - waiting for manual init()');

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
