// ============================================================================
// PHOENIX VOICE INTERFACE - FIXED VERSION
// ============================================================================
// Fixes: 
// - Removed 'process' variable (browser incompatible)
// - Added user interaction requirement for audio
// - Better error handling
// ============================================================================

class VoiceInterface {
    constructor() {
        // Backend API configuration (NO process.env in browser!)
        this.API_BASE = window.location.hostname.includes('localhost') 
            ? 'http://localhost:5000/api'
            : 'https://pal-backend-production.up.railway.app/api';
        
        // Voice settings
        this.selectedVoice = 'nova';
        this.speechSpeed = 1.0;
        this.volume = 1.0;
        
        // State
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.currentAudio = null;
        this.audioUnlocked = false; // Track if user has interacted
        
        // Queue system
        this.speechQueue = [];
        this.isProcessingQueue = false;
        
        // Debouncing
        this.lastCommand = '';
        this.lastCommandTime = 0;
        this.commandDebounceMs = 2000;
    }

    async init() {
        console.log('🎙️ Initializing Phoenix Voice Interface...');
        
        try {
            // Test backend connection
            await this.testBackend();
            
            // Setup speech recognition
            this.setupRecognition();
            
            // Setup audio unlock listener (for browser autoplay policy)
            this.setupAudioUnlock();
            
            console.log('✅ Voice interface ready');
            console.log('💡 Click anywhere to enable audio');
            return true;
        } catch (error) {
            console.error('❌ Voice init failed:', error);
            return false;
        }
    }

    setupAudioUnlock() {
        // Unlock audio on first user interaction
        const unlockAudio = () => {
            if (this.audioUnlocked) return;
            
            // Create and play silent audio to unlock
            const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/wkBYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MUZAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
            silentAudio.play().then(() => {
                this.audioUnlocked = true;
                console.log('🔓 Audio unlocked');
                
                // Say greeting now that audio is unlocked
                this.sayGreeting();
            }).catch(() => {
                console.log('⏳ Waiting for user interaction...');
            });
            
            // Remove listeners after first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        
        // Listen for user interaction
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
    }

    async testBackend() {
        try {
            const response = await fetch(`${this.API_BASE}/tts/status`);
            if (!response.ok) throw new Error('Backend not responding');
            
            const data = await response.json();
            console.log('✅ Backend TTS:', data.hasApiKey ? 'Connected' : 'No API Key');
            return data;
        } catch (error) {
            console.warn('⚠️ Backend TTS unavailable, will use browser fallback');
            return { available: false };
        }
    }

    setupRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('⚠️ Speech recognition not supported');
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            console.log('🎤 Heard:', transcript);
            this.processCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('🎤 Recognition error:', event.error);
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start(); // Auto-restart
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            console.warn('⚠️ Recognition not available');
            return;
        }

        if (this.isListening) return;

        try {
            this.recognition.start();
            this.isListening = true;
            console.log('🎤 Listening started...');
            
            this.updateListeningUI(true);
        } catch (error) {
            console.error('Failed to start listening:', error);
        }
    }

    stopListening() {
        if (!this.recognition || !this.isListening) return;

        this.recognition.stop();
        this.isListening = false;
        console.log('🎤 Listening stopped');
        
        this.updateListeningUI(false);
    }

    updateListeningUI(listening) {
        const indicator = document.getElementById('voice-indicator');
        if (indicator) {
            indicator.style.display = listening ? 'block' : 'none';
        }
    }

    processCommand(transcript) {
        const command = transcript.toLowerCase().trim();
        
        // Debounce duplicate commands
        const now = Date.now();
        if (command === this.lastCommand && (now - this.lastCommandTime) < this.commandDebounceMs) {
            console.log('⏭️ Duplicate command ignored');
            return;
        }
        this.lastCommand = command;
        this.lastCommandTime = now;

        // Command matching
        if (command.includes('activate phoenix') || command.includes('hey phoenix')) {
            this.speak('Phoenix activated. How can I help you?');
        } else if (command.includes('stop') || command.includes('quiet')) {
            this.stopSpeaking();
            this.speak('Understood. I\'ll be quiet.');
        } else if (command.includes('status') || command.includes('how are you')) {
            this.speak('All systems operational. Standing by.');
        } else if (command.includes('start listening')) {
            this.startListening();
            this.speak('Listening mode activated');
        }
        
        // Dispatch event for other systems
        window.dispatchEvent(new CustomEvent('voice:command', {
            detail: { command, transcript }
        }));
    }

    async speak(text, priority = 'normal') {
        if (!text || text.trim() === '') return;

        console.log(`🗣️ Speaking: "${text}"`);

        // Add to queue
        this.speechQueue.push({ text, priority });
        
        // Process queue
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.speechQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }

        this.isProcessingQueue = true;
        const { text } = this.speechQueue.shift();

        try {
            await this.speakNow(text);
        } catch (error) {
            console.error('Speech error:', error);
        }

        // Process next in queue
        setTimeout(() => this.processQueue(), 100);
    }

    async speakNow(text) {
        // Stop any current speech
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        this.isSpeaking = true;

        try {
            // Try backend TTS first
            const response = await fetch(`${this.API_BASE}/tts/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: this.selectedVoice,
                    speed: this.speechSpeed
                })
            });

            if (!response.ok) {
                throw new Error(`TTS failed: ${response.status}`);
            }

            // Get audio blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Play audio
            await this.playAudio(audioUrl);

            console.log('✅ Speech completed');

        } catch (error) {
            console.warn('⚠️ Backend TTS failed, using browser fallback');
            // Fallback to browser TTS
            this.speakWithBrowser(text);
        } finally {
            this.isSpeaking = false;
        }
    }

    async playAudio(url) {
        return new Promise((resolve, reject) => {
            this.currentAudio = new Audio(url);
            this.currentAudio.volume = this.volume;

            this.currentAudio.onended = () => {
                URL.revokeObjectURL(url);
                this.currentAudio = null;
                resolve();
            };

            this.currentAudio.onerror = (error) => {
                URL.revokeObjectURL(url);
                this.currentAudio = null;
                reject(error);
            };

            this.currentAudio.play().catch(reject);
        });
    }

    speakWithBrowser(text) {
        // Fallback to browser's built-in TTS
        console.log('🔄 Using browser TTS fallback');
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.speechSpeed;
        utterance.volume = this.volume;
        
        window.speechSynthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        this.speechQueue = [];
        this.isProcessingQueue = false;
        this.isSpeaking = false;

        window.speechSynthesis.cancel();

        console.log('🛑 Speech stopped');
    }

    setVoice(voice) {
        this.selectedVoice = voice;
        console.log('🎙️ Voice changed to:', voice);
    }

    setSpeed(speed) {
        this.speechSpeed = Math.max(0.25, Math.min(4.0, speed));
        console.log('⚡ Speed set to:', this.speechSpeed);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log('🔊 Volume set to:', this.volume);
    }

    sayGreeting() {
        const greetings = [
            'Phoenix online and ready.',
            'All systems operational.',
            'Standing by for your command.',
            'Phoenix AI assistant activated.'
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        this.speak(greeting);
    }

    destroy() {
        this.stopListening();
        this.stopSpeaking();
        if (this.recognition) {
            this.recognition.abort();
        }
        console.log('🔴 Voice interface destroyed');
    }
}

// ============================================================================
// INITIALIZE AND ATTACH TO WINDOW
// ============================================================================

const voiceInterface = new VoiceInterface();

// Attach to window IMMEDIATELY
window.voiceInterface = voiceInterface;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Initializing voice interface...');
        voiceInterface.init();
    });
} else {
    console.log('🚀 Initializing voice interface...');
    voiceInterface.init();
}

// Export for modules
export default voiceInterface;

console.log('📦 Voice Interface module loaded');
