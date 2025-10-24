// ============================================================================
// PHOENIX VOICE INTERFACE - Production Web Version
// ============================================================================
// Ready for testing TODAY - will port to iOS after web validation
// ============================================================================

class VoiceInterface {
    constructor() {
        this.API_BASE = window.location.hostname.includes('localhost') 
            ? 'http://localhost:5000/api'
            : 'https://pal-backend-production.up.railway.app/api';
        
        this.selectedVoice = 'nova';
        this.speechSpeed = 1.0;
        this.volume = 1.0;
        
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
        
        this.recordingDuration = 3000; // 3 seconds
        this.recordingTimer = null;
    }

    async init() {
        console.log('🎙️ Initializing voice interface...');
        
        try {
            await this.testBackend();
            await this.setupMicrophone();
            this.setupAudioUnlock();
            
            console.log('✅ Voice ready - click page to activate');
            return true;
        } catch (error) {
            console.error('❌ Init failed:', error.message);
            return false;
        }
    }

    async testBackend() {
        try {
            const [tts, whisper] = await Promise.all([
                fetch(`${this.API_BASE}/tts/status`).then(r => r.json()),
                fetch(`${this.API_BASE}/whisper/status`).then(r => r.json())
            ]);
            
            console.log('✅ Backend:', {
                tts: tts.status,
                whisper: whisper.status
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
        
        // Try webm, fall back to mp4/other formats
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
            
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
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
                this.processCommand(text);
            }

        } catch (error) {
            console.error('❌ Transcription failed:', error.message);
        }
    }

    // COMMAND PROCESSING
    processCommand(transcript) {
        const cmd = transcript.toLowerCase().trim();
        
        // Debounce duplicates
        const now = Date.now();
        if (cmd === this.lastCommand && (now - this.lastCommandTime) < this.commandDebounceMs) {
            console.log('⏭️ Duplicate ignored');
            return;
        }
        this.lastCommand = cmd;
        this.lastCommandTime = now;

        console.log(`🎯 Command: "${cmd}"`);

        // Built-in commands
        if (this.matchCommand(cmd, ['activate phoenix', 'hey phoenix', 'phoenix'])) {
            this.speak('Phoenix activated. How can I help?');
        } 
        else if (this.matchCommand(cmd, ['stop', 'quiet', 'be quiet'])) {
            this.stopSpeaking();
            this.speak('Understood.');
        } 
        else if (this.matchCommand(cmd, ['status', 'how are you'])) {
            this.speak('All systems operational.');
        }
        else if (this.matchCommand(cmd, ['stop listening', 'deactivate'])) {
            this.speak('Listening deactivated.');
            setTimeout(() => this.stopListening(), 2000);
        }
        else if (this.matchCommand(cmd, ['start listening', 'activate'])) {
            this.speak('Listening activated.');
            this.startListening();
        }
        else {
            // Forward to orchestrator
            window.dispatchEvent(new CustomEvent('voice:command', {
                detail: { command: cmd, transcript, confidence: 1.0 }
            }));
        }
    }

    matchCommand(input, keywords) {
        return keywords.some(k => input.includes(k));
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
        this.selectedVoice = voice;
        console.log('🎙️ Voice:', voice);
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
        const greetings = [
            'Phoenix online.',
            'All systems ready.',
            'Standing by.',
            'Phoenix activated.'
        ];
        this.speak(greetings[Math.floor(Math.random() * greetings.length)]);
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
console.log('📦 Voice interface loaded');
