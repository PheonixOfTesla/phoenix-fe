// ============================================================================
// PHOENIX VOICE INTERFACE - Conversational AI Butler with Personalities
// ============================================================================
// Each voice has a unique personality that adapts the AI responses
// ============================================================================

class VoiceInterface {
    constructor() {
        this.API_BASE = window.location.hostname.includes('localhost') 
            ? 'http://localhost:5000/api'
            : 'https://pal-backend-production.up.railway.app/api';
        
        this.selectedVoice = 'nova';
        this.speechSpeed = 1.0;
        this.volume = 1.0;
        
        // Voice-to-Personality Mapping
        this.voicePersonalities = {
            'nova': 'friendly_helpful',      // Warm, approachable, encouraging
            'onyx': 'professional_serious',  // Deep, authoritative, formal
            'echo': 'british_refined',       // Proper, sophisticated, cultured
            'fable': 'whimsical_storyteller', // Creative, playful, imaginative
            'shimmer': 'gentle_nurturing',   // Soft, caring, empathetic
            'alloy': 'neutral_efficient'     // Direct, no-nonsense, concise
        };
        
        this.isListening = false;
        this.isSpeaking = false;
        this.isRecording = false;
        this.audioUnlocked = false;
        
        this.currentAudio = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStream = null;
        
        this.speechQueue = [];
        this.isProcessingQueue = false;
        
        this.lastCommand = '';
        this.lastCommandTime = 0;
        this.commandDebounceMs = 2000;
        
        this.recordingDuration = 3000;
        this.recordingTimer = null;
        
        // Conversation context
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
    }

    async init() {
        console.log('🎙️ Initializing Phoenix AI Butler...');
        
        try {
            await this.testBackend();
            await this.setupMicrophone();
            this.setupAudioUnlock();
            
            console.log('✅ AI Butler ready - click page to activate');
            console.log(`🎭 Personality: ${this.voicePersonalities[this.selectedVoice]}`);
            return true;
        } catch (error) {
            console.error('❌ Init failed:', error.message);
            return false;
        }
    }

    async testBackend() {
        try {
            const [tts, whisper, ai] = await Promise.all([
                fetch(`${this.API_BASE}/tts/status`).then(r => r.json()),
                fetch(`${this.API_BASE}/whisper/status`).then(r => r.json()),
                fetch(`${this.API_BASE}/phoenix/status`).then(r => r.json()).catch(() => ({status: 'unknown'}))
            ]);
            
            console.log('✅ Backend:', {
                tts: tts.status,
                whisper: whisper.status,
                ai: ai.status
            });
            
            if (!tts.hasApiKey || !whisper.hasApiKey) {
                throw new Error('Backend not configured');
            }
            
            return true;
        } catch (error) {
            console.error('⚠️ Backend unavailable:', error.message);
            throw error;
        }
    }

    async setupMicrophone() {
        try {
            this.recordingStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            console.log('✅ Microphone ready');
        } catch (error) {
            console.error('❌ Microphone denied');
            throw new Error('Microphone access required');
        }
    }

    setupAudioUnlock() {
        const unlock = () => {
            if (this.audioUnlocked) return;
            
            const silent = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/wkBYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MUZAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
            silent.play().then(() => {
                this.audioUnlocked = true;
                console.log('🔓 Audio unlocked');
                this.sayGreeting();
                setTimeout(() => this.startListening(), 2000);
            }).catch(() => {});
            
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
        
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
    }

    // LISTENING
    startListening() {
        if (this.isListening || !this.recordingStream) return;
        
        this.isListening = true;
        console.log('🎤 Listening...');
        this.updateUI('listening', true);
        this.startRecording();
    }

    stopListening() {
        if (!this.isListening) return;
        
        this.isListening = false;
        if (this.isRecording) this.stopRecording();
        console.log('🎤 Stopped');
        this.updateUI('listening', false);
    }

    startRecording() {
        if (this.isRecording) return;
        
        this.audioChunks = [];
        
        let mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/mp4';
        }
        
        this.mediaRecorder = new MediaRecorder(this.recordingStream, { mimeType });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
            if (this.audioChunks.length === 0) return;
            
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            await this.transcribeAudio(audioBlob);
            
            if (this.isListening) {
                setTimeout(() => this.startRecording(), 100);
            }
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        
        this.recordingTimer = setTimeout(() => {
            if (this.isRecording) this.stopRecording();
        }, this.recordingDuration);
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        clearTimeout(this.recordingTimer);
        if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.isRecording = false;
    }

    async transcribeAudio(audioBlob) {
        try {
            console.log(`📤 Transcribing ${(audioBlob.size / 1024).toFixed(2)} KB...`);

            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');

            const response = await fetch(`${this.API_BASE}/whisper/transcribe`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const text = data.text?.trim();

            if (text && text.length > 0) {
                console.log(`✅ Heard: "${text}"`);
                this.processInput(text);
            }

        } catch (error) {
            console.error('❌ Transcription failed:', error.message);
        }
    }

    // PROCESS USER INPUT - Send to AI
    async processInput(transcript) {
        const input = transcript.trim();
        
        // Debounce duplicates
        const now = Date.now();
        if (input === this.lastCommand && (now - this.lastCommandTime) < this.commandDebounceMs) {
            console.log('⏭️ Duplicate ignored');
            return;
        }
        this.lastCommand = input;
        this.lastCommandTime = now;

        console.log(`💬 User: "${input}"`);

        // Only handle critical system commands directly
        if (this.matchCommand(input, ['stop listening', 'deactivate', 'shut up', 'be quiet'])) {
            this.speak('Going silent.');
            setTimeout(() => this.stopListening(), 1500);
            return;
        }
        
        if (this.matchCommand(input, ['start listening', 'wake up', 'hello phoenix'])) {
            this.speak('I\'m listening.');
            this.startListening();
            return;
        }
        
        // Voice change command
        if (this.matchCommand(input, ['change voice', 'switch voice', 'different voice'])) {
            this.speak('Which voice would you like? Nova, Onyx, Echo, Fable, Shimmer, or Alloy?');
            return;
        }

        // Everything else goes to AI
        await this.chatWithAI(input);
    }

    matchCommand(input, keywords) {
        const lower = input.toLowerCase();
        return keywords.some(k => lower.includes(k));
    }

    // CONVERSATIONAL AI with Personality
    async chatWithAI(message) {
        try {
            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: message
            });

            // Keep history manageable
            if (this.conversationHistory.length > this.maxHistoryLength) {
                this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
            }

            console.log('🤖 Asking AI with personality:', this.voicePersonalities[this.selectedVoice]);
            
            const response = await fetch(`${this.API_BASE}/phoenix/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('phoenix_token') || ''}`
                },
                body: JSON.stringify({ 
                    message: message,
                    userId: localStorage.getItem('phoenix_user_id'),
                    conversationHistory: this.conversationHistory,
                    personality: this.voicePersonalities[this.selectedVoice] || 'friendly_helpful',
                    voiceName: this.selectedVoice
                })
            });

            if (!response.ok) {
                throw new Error(`AI chat failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.response) {
                console.log(`🤖 Phoenix: "${data.response}"`);
                
                // Add AI response to history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: data.response
                });
                
                this.speak(data.response);
            } else {
                this.speak("I'm not sure how to respond to that.");
            }

        } catch (error) {
            console.error('❌ AI chat error:', error);
            
            // Personality-based fallback responses
            const fallbacks = this.getPersonalityFallbacks();
            this.speak(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
        }
    }

    getPersonalityFallbacks() {
        const personality = this.voicePersonalities[this.selectedVoice];
        
        switch(personality) {
            case 'professional_serious':
                return [
                    "I'm experiencing technical difficulties. Please stand by.",
                    "System error encountered. I'll need a moment.",
                    "Connection interrupted. Allow me to reestablish."
                ];
            case 'british_refined':
                return [
                    "Terribly sorry, I seem to have lost the thread. Pardon me.",
                    "My apologies, I'm having a spot of bother with the connection.",
                    "Dreadfully sorry, technical hiccup. Do carry on."
                ];
            case 'whimsical_storyteller':
                return [
                    "Oh dear, my story got lost in the clouds! Let's try again.",
                    "The magic words aren't working right now. Give me a moment!",
                    "My imagination is taking a coffee break. Be right back!"
                ];
            case 'gentle_nurturing':
                return [
                    "I'm having a little trouble connecting right now, but don't worry.",
                    "Give me just a moment, I'll be right with you.",
                    "Let me gather my thoughts. I want to give you the best answer."
                ];
            case 'neutral_efficient':
                return [
                    "Connection error. Retry in progress.",
                    "System unavailable. Standby mode.",
                    "Processing failed. Attempting recovery."
                ];
            default: // friendly_helpful
                return [
                    "Oops, my circuits got a bit tangled. Can you say that again?",
                    "Connection's spotty. Must be the weather in the cloud!",
                    "Technical hiccup on my end. What were you saying?",
                    "I'm having trouble connecting. Give me another shot?"
                ];
        }
    }

    // SPEAKING
    async speak(text, priority = 'normal') {
        if (!text?.trim()) return;
        
        console.log(`🗣️ Speaking: "${text}"`);
        this.speechQueue.push({ text, priority });
        
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

        setTimeout(() => this.processQueue(), 100);
    }

    async speakNow(text) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        this.isSpeaking = true;
        this.updateUI('speaking', true);

        try {
            const response = await fetch(`${this.API_BASE}/tts/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    voice: this.selectedVoice,
                    speed: this.speechSpeed
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            await this.playAudio(audioUrl);

        } catch (error) {
            console.error('❌ TTS failed:', error.message);
            this.speakWithBrowser(text);
        } finally {
            this.isSpeaking = false;
            this.updateUI('speaking', false);
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
            this.currentAudio.onerror = (e) => {
                URL.revokeObjectURL(url);
                this.currentAudio = null;
                reject(e);
            };
            this.currentAudio.play().catch(reject);
        });
    }

    speakWithBrowser(text) {
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
        this.updateUI('speaking', false);
    }

    // SETTINGS
    setVoice(voice) {
        if (this.voicePersonalities[voice]) {
            this.selectedVoice = voice;
            console.log('🎙️ Voice changed to:', voice);
            console.log('🎭 Personality:', this.voicePersonalities[voice]);
            this.speak(`Voice changed to ${voice}. My personality is now ${this.voicePersonalities[voice].replace('_', ' ')}.`);
        } else {
            console.error('Invalid voice:', voice);
        }
    }

    setSpeed(speed) {
        this.speechSpeed = Math.max(0.25, Math.min(4.0, speed));
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // UI
    updateUI(type, active) {
        const indicator = document.getElementById('voice-indicator');
        if (!indicator) return;
        
        if (type === 'listening') {
            indicator.textContent = active ? '🎤 Listening...' : '';
            indicator.style.display = active ? 'block' : 'none';
        } else if (type === 'speaking') {
            indicator.textContent = active ? '🗣️ Speaking...' : '';
        }
    }

    sayGreeting() {
        const personality = this.voicePersonalities[this.selectedVoice];
        
        let greetings;
        switch(personality) {
            case 'professional_serious':
                greetings = [
                    'Phoenix systems operational. Standing by for instructions.',
                    'Ready to assist. How may I be of service?',
                    'All systems functional. Awaiting your command.'
                ];
                break;
            case 'british_refined':
                greetings = [
                    'Good day. Phoenix at your service. How may I assist you?',
                    'Greetings. I do hope you\'re well. What can I do for you today?',
                    'Phoenix reporting for duty. What shall we accomplish today?'
                ];
                break;
            case 'whimsical_storyteller':
                greetings = [
                    'Once upon a time... just kidding! Phoenix here, ready for adventure!',
                    'The story begins now! What magical task shall we tackle?',
                    'Phoenix awakens! What tale shall we write today?'
                ];
                break;
            case 'gentle_nurturing':
                greetings = [
                    'Hello there. Phoenix here, ready to help. How are you today?',
                    'Hi! I\'m here whenever you need me. What can I do for you?',
                    'Phoenix at your service. Take your time, I\'m listening.'
                ];
                break;
            case 'neutral_efficient':
                greetings = [
                    'Phoenix online. Ready.',
                    'Systems active. Awaiting input.',
                    'Operational. Proceed.'
                ];
                break;
            default: // friendly_helpful
                greetings = [
                    'Phoenix at your service! What can I help you with?',
                    'Hey there! Your AI butler is ready. What\'s up?',
                    'Phoenix here! Let\'s make today awesome. What do you need?',
                    'Ready to go! What\'s on your mind?'
                ];
        }
        
        this.speak(greetings[Math.floor(Math.random() * greetings.length)]);
    }

    // Clear conversation history
    resetConversation() {
        this.conversationHistory = [];
        console.log('🔄 Conversation reset');
        this.speak('Starting fresh. What would you like to talk about?');
    }

    destroy() {
        this.stopListening();
        this.stopSpeaking();
        if (this.recordingStream) {
            this.recordingStream.getTracks().forEach(t => t.stop());
        }
    }
}

// Initialize
const voiceInterface = new VoiceInterface();
window.voiceInterface = voiceInterface;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        voiceInterface.init();
    });
} else {
    voiceInterface.init();
}

export default voiceInterface;
console.log('📦 Phoenix AI Butler with Personalities loaded');
