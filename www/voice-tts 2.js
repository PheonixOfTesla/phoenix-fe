/**
 * VOICE TTS (Text-to-Speech) System
 * Enables Phoenix to speak responses out loud
 *
 * Usage:
 *   const tts = new VoiceTTS();
 *   tts.speak("Welcome to Mercury, Josh");
 */

class VoiceTTS {
    constructor(options = {}) {
        this.enabled = options.enabled !== false; // Default enabled
        this.rate = options.rate || 1.0; // Speed (0.1 to 10)
        this.pitch = options.pitch || 1.0; // Pitch (0 to 2)
        this.volume = options.volume || 1.0; // Volume (0 to 1)
        this.voice = null; // Will be set to preferred voice

        // State
        this.isSpeaking = false;
        this.speechQueue = [];
        this.currentUtterance = null;

        // Callbacks
        this.onStartCallback = null;
        this.onEndCallback = null;
        this.onErrorCallback = null;

        this.init();
    }

    /**
     * Initialize Speech Synthesis
     */
    init() {
        if (!('speechSynthesis' in window)) {
            console.error('❌ Text-to-Speech not supported in this browser');
            this.enabled = false;
            return;
        }

        // Wait for voices to load
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                this.selectVoice();
            });
        } else {
            this.selectVoice();
        }

        console.log('✅ Voice TTS initialized');
    }

    /**
     * Select best voice for Phoenix
     */
    selectVoice() {
        const voices = speechSynthesis.getVoices();

        if (voices.length === 0) {
            console.warn('⚠️  No voices available');
            return;
        }

        // Prefer English voices, particularly natural-sounding ones
        const preferredVoices = [
            'Samantha',      // macOS - Natural female voice
            'Alex',          // macOS - Natural male voice
            'Google US English', // Chrome
            'Microsoft Zira', // Windows
            'Microsoft David', // Windows
        ];

        // Try to find preferred voice
        for (const preferred of preferredVoices) {
            const voice = voices.find(v => v.name.includes(preferred));
            if (voice) {
                this.voice = voice;
                console.log(`🎤 Selected voice: ${voice.name}`);
                return;
            }
        }

        // Fallback: Use first English voice
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
            this.voice = englishVoice;
            console.log(`🎤 Selected voice: ${englishVoice.name}`);
        } else {
            // Last resort: use first available voice
            this.voice = voices[0];
            console.log(`🎤 Selected voice: ${voices[0].name} (fallback)`);
        }
    }

    /**
     * Speak text out loud
     */
    speak(text, options = {}) {
        if (!this.enabled) {
            console.log('🔇 TTS disabled, skipping speech');
            return Promise.resolve();
        }

        if (!text || text.trim() === '') {
            console.warn('⚠️  Empty text, skipping speech');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);

            // Apply settings
            utterance.voice = this.voice;
            utterance.rate = options.rate || this.rate;
            utterance.pitch = options.pitch || this.pitch;
            utterance.volume = options.volume || this.volume;

            // Event handlers
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.currentUtterance = utterance;
                console.log(`🗣️  Speaking: "${text}"`);

                if (this.onStartCallback) {
                    this.onStartCallback(text);
                }
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                console.log('✅ Finished speaking');

                if (this.onEndCallback) {
                    this.onEndCallback(text);
                }

                // Process queue
                this.processQueue();
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('❌ TTS error:', event.error);
                this.isSpeaking = false;
                this.currentUtterance = null;

                if (this.onErrorCallback) {
                    this.onErrorCallback(event.error);
                }

                reject(event.error);
            };

            // Speak immediately or queue
            if (this.isSpeaking && options.queue !== false) {
                console.log('⏳ Queueing speech...');
                this.speechQueue.push(utterance);
            } else {
                speechSynthesis.speak(utterance);
            }
        });
    }

    /**
     * Process speech queue
     */
    processQueue() {
        if (this.speechQueue.length > 0 && !this.isSpeaking) {
            const nextUtterance = this.speechQueue.shift();
            speechSynthesis.speak(nextUtterance);
        }
    }

    /**
     * Stop current speech
     */
    stop() {
        if (this.isSpeaking) {
            console.log('⏹️  Stopping speech');
            speechSynthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
    }

    /**
     * Clear speech queue
     */
    clearQueue() {
        this.speechQueue = [];
        console.log('🗑️  Speech queue cleared');
    }

    /**
     * Pause speech
     */
    pause() {
        if (this.isSpeaking) {
            speechSynthesis.pause();
            console.log('⏸️  Speech paused');
        }
    }

    /**
     * Resume speech
     */
    resume() {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            console.log('▶️  Speech resumed');
        }
    }

    /**
     * Enable TTS
     */
    enable() {
        this.enabled = true;
        console.log('🔊 TTS enabled');
    }

    /**
     * Disable TTS
     */
    disable() {
        this.enabled = false;
        this.stop();
        console.log('🔇 TTS disabled');
    }

    /**
     * Toggle TTS
     */
    toggle() {
        this.enabled = !this.enabled;
        console.log(`🔊 TTS ${this.enabled ? 'enabled' : 'disabled'}`);
        return this.enabled;
    }

    /**
     * Set voice by name
     */
    setVoice(voiceName) {
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name.includes(voiceName));

        if (voice) {
            this.voice = voice;
            console.log(`🎤 Voice changed to: ${voice.name}`);
            return true;
        } else {
            console.error(`❌ Voice not found: ${voiceName}`);
            return false;
        }
    }

    /**
     * Get available voices
     */
    getVoices() {
        return speechSynthesis.getVoices();
    }

    /**
     * Set speech rate
     */
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(10, rate));
        console.log(`🏃 Speech rate set to: ${this.rate}`);
    }

    /**
     * Set speech pitch
     */
    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
        console.log(`🎵 Speech pitch set to: ${this.pitch}`);
    }

    /**
     * Set speech volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 Speech volume set to: ${this.volume}`);
    }

    /**
     * Register callbacks
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    onEnd(callback) {
        this.onEndCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Check if currently speaking
     */
    isSpeakingNow() {
        return this.isSpeaking;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            enabled: this.enabled,
            isSpeaking: this.isSpeaking,
            queueLength: this.speechQueue.length,
            voice: this.voice ? this.voice.name : null,
            rate: this.rate,
            pitch: this.pitch,
            volume: this.volume
        };
    }

    /**
     * Check if TTS is supported
     */
    static isSupported() {
        return 'speechSynthesis' in window;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceTTS;
}

// Make available globally
window.VoiceTTS = VoiceTTS;

console.log('✅ Voice TTS module loaded');
