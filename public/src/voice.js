// ============================================================================
// PHOENIX VOICE INTERFACE - OpenAI TTS Backend Edition
// ============================================================================
// Clean, working implementation that calls your Railway backend
// ============================================================================

class VoiceInterface {
    constructor() {
        // Backend API configuration
        this.API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api'
            : 'https://pal-backend-production.up.railway.app/api';
        
        // Voice settings
        this.selectedVoice = 'nova';  // alloy, echo, fable, onyx, nova, shimmer
        this.speechSpeed = 1.0;
        this.volume = 1.0;
        
        // State
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.currentAudio = null;
        
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
            
            // Setup visualizer if element exists
            this.setupVisualizer();
            
            console.log('✅ Voice interface ready');
            return true;
        } catch (error) {
            console.error('❌ Voice init failed:', error);
            return false;
        }
    }

    async testBackend() {
        try {
            const response = await fetch(`${this.API_BASE}/tts/status`);
            if (!response.ok) throw new Error('Backend not responding');
            
            const data = await response.json();
            console.log('✅ Backend TTS:', data.hasApiKey ? 'Connected' : 'No API Key');
            return data;
        } catch (error) {
            console.error('⚠️ Backend TTS unavailable:', error.message);
            throw error;
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

    setupVisualizer() {
        // Setup audio visualizer if canvas exists
        const canvas = document.getElementById('voice-visualizer');
        if (canvas) {
            console.log('🎨 Visualizer canvas found');
            // Visualizer setup here if needed
        }
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
            
            // Update UI
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
        
        // Update UI
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
        }
        
        // Dispatch event for other systems to handle
        window.dispatchEvent(new CustomEvent('voice:command', {
            detail: { command, transcript }
        }));
    }

    async speak(text, priority = 'normal') {
        if (!text || text.trim() === '') return;

        console.log(`🗣️ Speaking: "${text}"`);

        // Add to queue
        this.speechQueue.push({ text, priority });
        
        // Process queue if not already processing
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
            // Call backend TTS
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
            console.error('❌ TTS error:', error);
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
        // Stop current audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        // Clear queue
        this.speechQueue = [];
        this.isProcessingQueue = false;
        this.isSpeaking = false;

        // Stop browser TTS
        window.speechSynthesis.cancel();

        console.log('🛑 Speech stopped');
    }

    // Utility methods
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

    // Greeting
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

// CRITICAL: Attach to window FIRST
window.voiceInterface = voiceInterface;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Initializing voice interface...');
        voiceInterface.init().then(() => {
            console.log('✅ Voice interface ready');
            
            // Optional: Say greeting after 2 seconds
            setTimeout(() => {
                voiceInterface.sayGreeting();
            }, 2000);
        });
    });
} else {
    // DOM already loaded
    console.log('🚀 Initializing voice interface...');
    voiceInterface.init().then(() => {
        console.log('✅ Voice interface ready');
        
        // Optional: Say greeting after 2 seconds
        setTimeout(() => {
            voiceInterface.sayGreeting();
        }, 2000);
    });
}

// Export for modules
export default voiceInterface;

console.log('📦 Voice Interface module loaded');
