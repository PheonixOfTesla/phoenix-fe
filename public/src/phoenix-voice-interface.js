// ============================================================================
// PHOENIX VOICE INTERFACE - Multi-Personality AI Butler
// ============================================================================
// FIXED VERSION - Updated to use correct backend endpoints
// ============================================================================

class PhoenixVoice {
    constructor() {
        // Auto-detect backend URL
        this.API_BASE = window.location.hostname.includes('localhost') 
            ? 'http://localhost:5000/api'
            : 'https://pal-backend-production.up.railway.app/api';
        
        // Voice settings
        this.selectedVoice = 'echo'; // Default to British butler
        this.speechSpeed = 1.0;
        this.volume = 1.0;
        
        // State flags
        this.isListening = false;
        this.isSpeaking = false;
        this.isRecording = false;
        this.audioUnlocked = false;
        
        // Audio management
        this.currentAudio = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStream = null;
        this.speechQueue = [];
        this.isProcessingQueue = false;
        
        // Command deduplication
        this.lastCommand = '';
        this.lastCommandTime = 0;
        this.commandDebounceMs = 2000;
        
        // Recording settings
        this.recordingDuration = 3000; // 3 seconds
        this.recordingTimer = null;
        
        // Conversation context
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
        
        // Voice → Personality mapping
        this.voicePersonalities = {
            'nova': 'friendly_helpful',
            'onyx': 'professional_serious',
            'echo': 'british_refined',
            'fable': 'whimsical_storyteller',
            'shimmer': 'gentle_nurturing',
            'alloy': 'neutral_efficient'
        };
    }

    // Initialize voice interface
    async init() {
        console.log('🎙️ Initializing Phoenix Voice Interface...');
        
        try {
            await this.testBackendServices();
            await this.requestMicrophoneAccess();
            this.setupAudioUnlock();
            this.updateStatus('idle', '⚪ Ready - Click to talk');
            console.log('✅ Phoenix Voice ready');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.updateStatus('error', `❌ ${error.message}`);
            return false;
        }
    }

    // Test backend connectivity
    async testBackendServices() {
        try {
            const token = this.getAuthToken();
            
            // Test voice session endpoint (which handles transcription)
            const voiceTest = await fetch(`${this.API_BASE}/phoenix/voice/history`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(r => r.json());
            
            console.log('✅ Backend voice service:', voiceTest);
            
            if (!voiceTest.success && voiceTest.error) {
                console.warn('⚠️ Voice service may not be ready:', voiceTest.error);
            }
            
        } catch (error) {
            console.warn('⚠️ Backend connectivity check failed:', error.message);
            // Don't throw - allow initialization to continue
        }
    }

    // Get authentication token
    getAuthToken() {
        return localStorage.getItem('phoenix_token') || 
               localStorage.getItem('phoenixToken') || 
               localStorage.getItem('token') || 
               localStorage.getItem('authToken') || '';
    }

    // Request microphone permissions
    async requestMicrophoneAccess() {
        try {
            this.recordingStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });
            console.log('✅ Microphone access granted');
        } catch (error) {
            throw new Error('Microphone access denied');
        }
    }

    // Setup audio unlock (browsers require user interaction)
    setupAudioUnlock() {
        const unlock = () => {
            if (this.audioUnlocked) return;
            
            const audio = new Audio();
            audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';
            audio.play().then(() => {
                this.audioUnlocked = true;
                console.log('✅ Audio unlocked');
            }).catch(() => {});
        };
        
        ['click', 'touchstart'].forEach(event => {
            document.addEventListener(event, unlock, { once: true });
        });
    }

    // Update UI status indicator
    updateStatus(state, text) {
        const statusEl = document.getElementById('voice-status');
        if (!statusEl) return;
        
        statusEl.className = `voice-status ${state}`;
        statusEl.textContent = text;
    }

    // Start listening for voice input
    async startListening() {
        if (this.isListening || this.isSpeaking) return;
        
        try {
            this.isListening = true;
            this.audioChunks = [];
            this.updateStatus('listening', '🟢 Listening...');
            
            // Detect supported MIME type
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/mp4';
            }
            
            console.log('🎵 Using audio format:', mimeType);
            
            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(this.recordingStream, { mimeType });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                await this.processRecording();
            };
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Auto-stop after duration
            this.recordingTimer = setTimeout(() => {
                this.stopListening();
            }, this.recordingDuration);
            
        } catch (error) {
            console.error('❌ Start listening error:', error);
            this.updateStatus('error', '❌ Listening failed');
            this.isListening = false;
        }
    }

    // Stop listening
    stopListening() {
        if (!this.isRecording) return;
        
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        this.isRecording = false;
    }

    // Process recorded audio
    async processRecording() {
        try {
            this.updateStatus('processing', '🔄 Processing...');
            
            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
            
            console.log('📦 Audio blob:', {
                size: audioBlob.size,
                type: audioBlob.type
            });
            
            // Transcribe audio
            const transcription = await this.transcribeAudio(audioBlob);
            
            if (!transcription || transcription.trim().length === 0) {
                throw new Error('No speech detected');
            }
            
            console.log('📝 Transcribed:', transcription);
            
            // Check for duplicate command
            if (this.isDuplicateCommand(transcription)) {
                console.log('⏭️ Skipping duplicate command');
                this.isListening = false;
                this.updateStatus('idle', '⚪ Ready');
                return;
            }
            
            // Handle voice commands
            if (this.handleVoiceCommand(transcription)) {
                this.isListening = false;
                return;
            }
            
            // Get AI response
            const response = await this.getAIResponse(transcription);
            
            // Speak response
            await this.speak(response);
            
            this.isListening = false;
            this.updateStatus('idle', '⚪ Ready');
            
        } catch (error) {
            console.error('❌ Processing error:', error);
            this.updateStatus('error', `❌ ${error.message}`);
            this.isListening = false;
        }
    }

    // Transcribe audio using backend voice session endpoint
    async transcribeAudio(audioBlob) {
        const formData = new FormData();
        
        // Detect actual blob type and set correct extension
        let extension = 'webm';
        if (audioBlob.type.includes('mp4')) {
            extension = 'mp4';
        } else if (audioBlob.type.includes('wav')) {
            extension = 'wav';
        } else if (audioBlob.type.includes('ogg')) {
            extension = 'ogg';
        }
        
        console.log(`[Transcribe] Audio type: ${audioBlob.type}, extension: ${extension}, size: ${audioBlob.size}`);
        
        formData.append('audio', audioBlob, `recording.${extension}`);
        
        const token = this.getAuthToken();
        
        const response = await fetch(`${this.API_BASE}/phoenix/voice/session`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[Transcribe] Error:', errorData);
            throw new Error(errorData.error || 'Transcription failed');
        }
        
        const data = await response.json();
        console.log('[Transcribe] ✅ Success:', data);
        
        // Extract transcription text from response
        return data.transcription || data.text || '';
    }

    // Get AI response from Phoenix Companion
    async getAIResponse(message) {
        const personality = this.voicePersonalities[this.selectedVoice];
        const token = this.getAuthToken();
        
        const response = await fetch(`${this.API_BASE}/phoenix/companion/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: message,
                conversationHistory: this.conversationHistory,
                personality: personality,
                voice: this.selectedVoice
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[AI Response] Error:', errorData);
            throw new Error(errorData.error || 'AI response failed');
        }
        
        const data = await response.json();
        
        // Extract response text
        const responseText = data.response || data.message || data.text || 'I apologize, but I did not receive a proper response.';
        
        // Update conversation history
        this.conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: responseText }
        );
        
        // Trim history
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        }
        
        return responseText;
    }

    // Convert text to speech and play
    async speak(text) {
        if (this.isSpeaking) {
            this.speechQueue.push(text);
            return;
        }
        
        try {
            this.isSpeaking = true;
            this.updateStatus('speaking', '🔵 Speaking...');
            
            // Try backend TTS first, fall back to browser TTS if not available
            const usedBrowserTTS = await this.speakWithBackend(text) === false 
                ? await this.speakWithBrowser(text) 
                : true;
            
            if (usedBrowserTTS === false) {
                this.updateStatus('idle', '⚪ Ready');
            }
            
        } catch (error) {
            console.error('❌ Speak error:', error);
            // Fall back to browser TTS on error
            await this.speakWithBrowser(text);
        }
    }

    // Speak using backend TTS service
    async speakWithBackend(text) {
        try {
            const token = this.getAuthToken();
            
            const response = await fetch(`${this.API_BASE}/tts/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: text,
                    voice: this.selectedVoice,
                    speed: this.speechSpeed
                })
            });
            
            if (!response.ok) {
                console.warn('⚠️ Backend TTS not available, falling back to browser TTS');
                return false;
            }
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play audio
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.volume = this.volume;
            
            this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.isSpeaking = false;
                this.currentAudio = null;
                this.processQueue();
            };
            
            this.currentAudio.onerror = () => {
                console.error('❌ Audio playback error');
                URL.revokeObjectURL(audioUrl);
                this.isSpeaking = false;
                this.currentAudio = null;
                this.processQueue();
            };
            
            await this.currentAudio.play();
            return true;
            
        } catch (error) {
            console.warn('⚠️ Backend TTS error:', error.message);
            return false;
        }
    }

    // Speak using browser Web Speech API (fallback)
    async speakWithBrowser(text) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.error('❌ Browser TTS not supported');
                this.isSpeaking = false;
                this.processQueue();
                resolve(false);
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = this.volume;
            utterance.rate = this.speechSpeed;
            
            // Try to select a voice that matches the personality
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Try to find British voice for 'echo'
                if (this.selectedVoice === 'echo') {
                    const britishVoice = voices.find(v => v.lang.includes('en-GB'));
                    if (britishVoice) utterance.voice = britishVoice;
                }
            }
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.processQueue();
                resolve(true);
            };
            
            utterance.onerror = () => {
                console.error('❌ Browser TTS error');
                this.isSpeaking = false;
                this.processQueue();
                resolve(false);
            };
            
            window.speechSynthesis.speak(utterance);
        });
    }

    // Process queued speech
    async processQueue() {
        if (this.isProcessingQueue || this.speechQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        const nextText = this.speechQueue.shift();
        await this.speak(nextText);
        this.isProcessingQueue = false;
    }

    // Stop speaking
    stopSpeaking() {
        // Stop audio playback
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // Stop browser TTS
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        this.speechQueue = [];
        this.isSpeaking = false;
        this.updateStatus('idle', '⚪ Ready');
    }

    // Handle built-in voice commands
    handleVoiceCommand(text) {
        const command = text.toLowerCase().trim();
        
        // Stop speaking commands
        if (command.includes('stop') || command.includes('quiet') || command.includes('shut up')) {
            this.stopSpeaking();
            this.updateStatus('idle', '⚪ Ready');
            return true;
        }
        
        // Volume control
        if (command.includes('volume up')) {
            this.volume = Math.min(1.0, this.volume + 0.2);
            this.speak(`Volume increased to ${Math.round(this.volume * 100)} percent`);
            return true;
        }
        
        if (command.includes('volume down')) {
            this.volume = Math.max(0.2, this.volume - 0.2);
            this.speak(`Volume decreased to ${Math.round(this.volume * 100)} percent`);
            return true;
        }
        
        // Speed control
        if (command.includes('speak faster')) {
            this.speechSpeed = Math.min(2.0, this.speechSpeed + 0.25);
            this.speak('Speaking faster now');
            return true;
        }
        
        if (command.includes('speak slower')) {
            this.speechSpeed = Math.max(0.75, this.speechSpeed - 0.25);
            this.speak('Speaking slower now');
            return true;
        }
        
        return false;
    }

    // Check for duplicate commands
    isDuplicateCommand(text) {
        const now = Date.now();
        const isDuplicate = text === this.lastCommand && 
                           (now - this.lastCommandTime) < this.commandDebounceMs;
        
        this.lastCommand = text;
        this.lastCommandTime = now;
        
        return isDuplicate;
    }

    // Change voice/personality
    changeVoice(voice) {
        if (this.voicePersonalities[voice]) {
            this.selectedVoice = voice;
            const personality = this.voicePersonalities[voice];
            console.log(`🎭 Voice changed to: ${voice} (${personality})`);
        }
    }

    // Toggle listening
    toggle() {
        if (this.isSpeaking) {
            this.stopSpeaking();
        } else if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    // Get current status
    getStatus() {
        return {
            listening: this.isListening,
            speaking: this.isSpeaking,
            voice: this.selectedVoice,
            personality: this.voicePersonalities[this.selectedVoice],
            conversationLength: this.conversationHistory.length / 2
        };
    }
}

// ============================================================================
// GLOBAL FUNCTIONS (for easy access from HTML)
// ============================================================================

let phoenixVoice = null;

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    phoenixVoice = new PhoenixVoice();
    const success = await phoenixVoice.init();
    
    if (!success) {
        console.error('❌ Phoenix Voice failed to initialize');
    }
    
    // Expose to window for orchestrator
    window.voiceInterface = phoenixVoice;
    window.phoenixVoice = phoenixVoice;
});

// Global functions for HTML buttons
window.toggleVoice = () => {
    if (phoenixVoice) {
        phoenixVoice.toggle();
    }
};

window.changeVoice = (voice) => {
    if (phoenixVoice) {
        phoenixVoice.changeVoice(voice);
    }
};

window.getVoiceStatus = () => {
    return phoenixVoice ? phoenixVoice.getStatus() : null;
};

window.startVoice = () => {
    if (phoenixVoice) {
        phoenixVoice.startListening();
    }
};

window.stopVoice = () => {
    if (phoenixVoice) {
        phoenixVoice.stopListening();
    }
};

console.log('🎙️ Phoenix Voice Interface loaded');
