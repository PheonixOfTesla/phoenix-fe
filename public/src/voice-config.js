// PHOENIX VOICE CONFIGURATION - ENHANCED SENSITIVITY & BACKEND TTS
// ✅ FIXED: Uses backend API, debouncing, no more browser TTS fallback

class VoiceConfiguration {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.openAIEnabled = true;
        this.config = this.getOptimalConfig();
        this.recognitionRetries = 0;
        this.maxRetries = 3;
        
        // ✅ DEBOUNCING - Prevent command repetition
        this.lastCommand = '';
        this.lastCommandTime = 0;
        this.commandDebounceMs = 3000; // 3 seconds
        
        // Backend API URL
        this.apiBaseURL = 'https://pal-backend-production.up.railway.app/api';
    }

    getOptimalConfig() {
        return {
            // Recognition settings for MAXIMUM sensitivity
            recognition: {
                continuous: true,
                interimResults: true,
                maxAlternatives: 5,
                lang: 'en-US',
                
                // Audio sensitivity settings
                audioConstraints: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1,
                    
                    // Boost sensitivity
                    volume: 1.0,
                    sensitivity: 100,
                    
                    // Lower threshold for voice detection
                    voiceActivityDetection: {
                        enabled: true,
                        threshold: 0.1,  // Very sensitive (0.0-1.0)
                        debounceTime: 100  // Quick response
                    }
                }
            },
            
            // OpenAI TTS Configuration via Backend
            tts: {
                provider: 'backend',  // Use backend API
                openai: {
                    model: 'tts-1',
                    voice: 'nova',  // or 'alloy', 'echo', 'fable', 'onyx', 'shimmer'
                    speed: 1.0
                },
                fallback: {
                    voice: 'Google US English',
                    rate: 1.0,
                    pitch: 1.0,
                    volume: 1.0
                }
            },
            
            // Command processing
            commands: {
                caseSensitive: false,
                fuzzyMatch: true,
                confidenceThreshold: 0.3,  // Lower = more permissive
                alternativeThreshold: 0.2,
                
                // Common variations to handle
                aliases: {
                    'activate phoenix': ['wake up phoenix', 'phoenix activate', 'hey phoenix', 'start phoenix'],
                    'help': ['what can you do', 'commands', 'options', 'menu'],
                    'stop': ['shut down', 'stop listening', 'pause', 'quiet'],
                    'status': ['how are you', 'system status', 'check status', 'diagnostics']
                }
            }
        };
    }

    async initialize() {
        console.log('🎤 Initializing Enhanced Voice Configuration...');
        
        try {
            // 1. Setup recognition with enhanced sensitivity
            await this.setupRecognition();
            
            // 2. Test backend TTS connection
            await this.testBackendTTS();
            
            // 3. Apply audio enhancements
            await this.enhanceAudioInput();
            
            // 4. Load user preferences
            this.loadPreferences();
            
            // 5. Patch existing voice interface
            this.patchVoiceInterface();
            
            console.log('✅ Voice configuration enhanced');
            return true;
        } catch (error) {
            console.error('❌ Voice configuration failed:', error);
            return false;
        }
    }

    async setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            throw new Error('Speech recognition not supported');
        }
        
        this.recognition = new SpeechRecognition();
        
        // Apply maximum sensitivity settings
        this.recognition.continuous = this.config.recognition.continuous;
        this.recognition.interimResults = this.config.recognition.interimResults;
        this.recognition.maxAlternatives = this.config.recognition.maxAlternatives;
        this.recognition.lang = this.config.recognition.lang;
        
        // Enhanced event handlers
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onerror = this.handleError.bind(this);
        this.recognition.onend = this.handleEnd.bind(this);
        this.recognition.onaudiostart = () => console.log('🎤 Audio capture started');
        this.recognition.onsoundstart = () => console.log('🔊 Sound detected');
        this.recognition.onspeechstart = () => console.log('💬 Speech detected');
        
        console.log('✅ Recognition configured with enhanced sensitivity');
    }

    async testBackendTTS() {
        console.log('🔊 Testing backend TTS connection...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.apiBaseURL}/tts/voices`, {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend TTS available:', data.voices);
                this.openAIEnabled = true;
            } else {
                console.warn('⚠️ Backend TTS unavailable, will use browser fallback');
                this.openAIEnabled = false;
            }
        } catch (error) {
            console.warn('Backend TTS test failed:', error);
            this.openAIEnabled = false;
        }
    }

    async enhanceAudioInput() {
        console.log('🎚️ Enhancing audio input sensitivity...');
        
        try {
            // Get enhanced audio stream with boosted sensitivity
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: this.config.recognition.audioConstraints.echoCancellation,
                    noiseSuppression: this.config.recognition.audioConstraints.noiseSuppression,
                    autoGainControl: this.config.recognition.audioConstraints.autoGainControl,
                    sampleRate: this.config.recognition.audioConstraints.sampleRate,
                    channelCount: this.config.recognition.audioConstraints.channelCount
                }
            });
            
            // Create audio context for processing
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            
            // Add gain node to boost input
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 2.0; // Boost input by 2x
            
            // Add compressor for consistent levels
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;
            
            // Connect audio chain
            source.connect(gainNode);
            gainNode.connect(compressor);
            compressor.connect(audioContext.destination);
            
            // Monitor audio levels
            this.monitorAudioLevels(source, audioContext);
            
            console.log('✅ Audio input enhanced with 2x gain');
        } catch (error) {
            console.warn('Audio enhancement failed:', error);
        }
    }

    monitorAudioLevels(source, audioContext) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const checkLevels = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            // Log if audio is too quiet
            if (average > 0 && average < 10) {
                console.warn('⚠️ Audio input very quiet, speak louder or move closer');
            }
            
            if (this.isListening) {
                requestAnimationFrame(checkLevels);
            }
        };
        
        checkLevels();
    }

    handleResult(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];
        
        // ✅ ONLY PROCESS FINAL RESULTS - prevents duplicates
        if (!lastResult.isFinal) {
            return;
        }
        
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        const confidence = lastResult[0].confidence || 0.5;
        
        console.log(`✅ Recognized: "${transcript}" (confidence: ${confidence})`);
        
        // ✅ DEBOUNCE: Prevent duplicate commands
        const now = Date.now();
        if (transcript === this.lastCommand && (now - this.lastCommandTime) < this.commandDebounceMs) {
            console.log('🚫 Duplicate command ignored (debounced)');
            return;
        }
        
        this.lastCommand = transcript;
        this.lastCommandTime = now;
        
        // Check all alternatives for better matching
        let bestMatch = null;
        let bestConfidence = 0;
        
        for (let i = 0; i < lastResult.length; i++) {
            const altTranscript = lastResult[i].transcript.toLowerCase().trim();
            const altConfidence = lastResult[i].confidence || 0.5;
            
            console.log(`🎤 Alternative ${i}: "${altTranscript}" (confidence: ${altConfidence})`);
            
            // Check against aliases
            const matchedCommand = this.findMatchingCommand(altTranscript);
            
            if (matchedCommand && altConfidence > bestConfidence) {
                bestMatch = matchedCommand;
                bestConfidence = altConfidence;
            }
        }
        
        if (bestMatch) {
            console.log(`✅ Matched command: "${bestMatch}" (confidence: ${bestConfidence})`);
            this.executeCommand(bestMatch, transcript);
        } else {
            // Process as general input
            console.log(`💬 General input: "${transcript}"`);
            this.processGeneralInput(transcript);
        }
    }

    findMatchingCommand(transcript) {
        const normalized = transcript.toLowerCase().trim();
        
        // Check exact matches first
        for (const [command, aliases] of Object.entries(this.config.commands.aliases)) {
            if (normalized === command || aliases.includes(normalized)) {
                return command;
            }
        }
        
        // Fuzzy matching
        if (this.config.commands.fuzzyMatch) {
            for (const [command, aliases] of Object.entries(this.config.commands.aliases)) {
                // Check if transcript contains the command
                if (normalized.includes(command)) {
                    return command;
                }
                
                // Check aliases
                for (const alias of aliases) {
                    if (normalized.includes(alias)) {
                        return command;
                    }
                }
            }
        }
        
        return null;
    }

    executeCommand(command, originalTranscript) {
        // Dispatch command event
        window.dispatchEvent(new CustomEvent('voice:command:matched', {
            detail: {
                command: command,
                transcript: originalTranscript,
                timestamp: Date.now()
            }
        }));
        
        // Handle built-in commands
        switch (command) {
            case 'activate phoenix':
                this.speak("Phoenix systems activated. How can I assist you?");
                break;
            case 'help':
                this.speak("I can help you with ordering food, booking rides, scheduling meetings, and much more. Just tell me what you need.");
                break;
            case 'status':
                this.speak("All systems operational. Voice recognition enhanced. Butler service ready.");
                break;
            case 'stop':
                this.speak("Going to standby mode.");
                this.stopListening();
                break;
        }
    }

    processGeneralInput(transcript) {
        // Send to main handler
        window.dispatchEvent(new CustomEvent('voice:input', {
            detail: {
                transcript: transcript,
                timestamp: Date.now()
            }
        }));
    }

    handleError(event) {
        console.error('❌ Recognition error:', event.error);
        
        switch (event.error) {
            case 'not-allowed':
                console.error('Microphone permission denied');
                break;
            case 'no-speech':
                console.log('No speech detected, continuing...');
                if (this.isListening) {
                    setTimeout(() => this.recognition.start(), 100); // Restart
                }
                break;
            case 'audio-capture':
                console.error('No microphone found');
                break;
            case 'network':
                console.error('Network error, retrying...');
                if (this.recognitionRetries < this.maxRetries) {
                    this.recognitionRetries++;
                    setTimeout(() => this.startListening(), 1000);
                }
                break;
        }
    }

    handleEnd() {
        console.log('🔚 Recognition ended');
        
        if (this.isListening) {
            // Auto-restart for continuous listening
            console.log('🔄 Restarting recognition...');
            setTimeout(() => {
                if (this.isListening) {
                    this.recognition.start();
                }
            }, 100);
        }
    }

    async speak(text, priority = 'normal') {
        console.log(`🔊 Speaking: "${text}"`);
        
        if (this.openAIEnabled) {
            try {
                await this.speakWithBackend(text);
            } catch (error) {
                console.error('Backend TTS failed:', error);
                await this.speakWithBrowser(text, priority);
            }
        } else {
            await this.speakWithBrowser(text, priority);
        }
    }

    // ✅ NEW: Use backend API instead of calling OpenAI directly
    async speakWithBackend(text) {
        try {
            console.log('🔊 Calling backend TTS API...');
            
            const token = localStorage.getItem('phoenix_token');
            
           const response = await fetch(`${this.apiBaseURL}/tts/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    text: text,
                    voice: this.config.tts.openai.voice,
                    speed: this.config.tts.openai.speed
                })
            });
            
            if (!response.ok) {
                throw new Error(`TTS API failed: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    console.log('✅ OpenAI TTS complete');
                    resolve();
                };
                
                audio.onerror = (error) => {
                    URL.revokeObjectURL(audioUrl);
                    console.error('Audio playback error:', error);
                    reject(error);
                };
                
                audio.play();
            });
            
        } catch (error) {
            console.error('❌ Backend TTS error:', error);
            throw error;
        }
    }

    async speakWithBrowser(text, priority = 'normal') {
        console.log('🔊 Falling back to browser TTS');
        
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Apply fallback settings
            utterance.voice = this.getVoice(this.config.tts.fallback.voice);
            utterance.rate = this.config.tts.fallback.rate;
            utterance.pitch = this.config.tts.fallback.pitch;
            utterance.volume = this.config.tts.fallback.volume;
            
            utterance.onend = () => {
                console.log('✅ Browser TTS complete');
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('TTS error:', event);
                resolve();
            };
            
            if (priority === 'high') {
                this.synthesis.cancel(); // Cancel current speech
            }
            
            this.synthesis.speak(utterance);
        });
    }

    getVoice(voiceName) {
        const voices = this.synthesis.getVoices();
        return voices.find(v => v.name.includes(voiceName)) || voices[0];
    }

    startListening() {
        if (!this.isListening) {
            console.log('🎤 Starting enhanced listening...');
            this.isListening = true;
            this.recognitionRetries = 0;
            this.recognition.start();
        }
    }

    stopListening() {
        if (this.isListening) {
            console.log('🔇 Stopping listening...');
            this.isListening = false;
            this.recognition.stop();
        }
    }

    loadPreferences() {
        const saved = localStorage.getItem('phoenix_voice_preferences');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                Object.assign(this.config, prefs);
                console.log('✅ Voice preferences loaded');
            } catch (error) {
                console.warn('Failed to load preferences:', error);
            }
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('phoenix_voice_preferences', JSON.stringify(this.config));
            console.log('✅ Voice preferences saved');
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    patchVoiceInterface() {
        console.log('🔧 Patching existing voice interface...');
        
        // Override existing voice interface methods
        if (window.voiceInterface) {
            const original = window.voiceInterface;
            
            // Replace startListening
            original.startListening = this.startListening.bind(this);
            
            // Replace speak method
            original.speak = this.speak.bind(this);
            
            // Add our recognition
            original.recognition = this.recognition;
            
            console.log('✅ Voice interface patched');
        }
        
        // Also patch global speak function
        if (window.speak) {
            window.speak = this.speak.bind(this);
        }
    }

    // Settings UI
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'voice-settings-panel';
        panel.innerHTML = `
            <div class="voice-settings-header">
                <h3>Voice Settings</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="voice-settings-content">
                <div class="setting-group">
                    <label>Microphone Sensitivity</label>
                    <input type="range" min="1" max="5" value="3" id="sensitivity-slider">
                    <span id="sensitivity-value">3</span>
                </div>
                <div class="setting-group">
                    <label>OpenAI Voice</label>
                    <select id="openai-voice">
                        <option value="nova">Nova</option>
                        <option value="alloy">Alloy</option>
                        <option value="echo">Echo</option>
                        <option value="fable">Fable</option>
                        <option value="onyx">Onyx</option>
                        <option value="shimmer">Shimmer</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label>Speech Speed</label>
                    <input type="range" min="0.5" max="2" step="0.1" value="1" id="speed-slider">
                    <span id="speed-value">1.0</span>
                </div>
                <button id="test-voice-btn">Test Voice</button>
                <button id="save-settings-btn">Save Settings</button>
            </div>
        `;
        
        // Add styles
        const styles = `
            <style>
            .voice-settings-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid #00ff00;
                border-radius: 10px;
                padding: 20px;
                z-index: 10000;
                min-width: 400px;
                display: none;
            }
            .voice-settings-panel.active {
                display: block;
            }
            .voice-settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                color: #00ff00;
            }
            .setting-group {
                margin-bottom: 15px;
            }
            .setting-group label {
                display: block;
                color: #00ff00;
                margin-bottom: 5px;
            }
            .setting-group input, .setting-group select {
                width: 100%;
                background: rgba(0, 255, 0, 0.1);
                border: 1px solid #00ff00;
                color: #00ff00;
                padding: 5px;
                border-radius: 3px;
            }
            #test-voice-btn, #save-settings-btn {
                background: rgba(0, 255, 0, 0.2);
                border: 1px solid #00ff00;
                color: #00ff00;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
            }
            #test-voice-btn:hover, #save-settings-btn:hover {
                background: rgba(0, 255, 0, 0.3);
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(panel);
        
        // Add event listeners
        this.attachSettingsListeners(panel);
        
        return panel;
    }

    attachSettingsListeners(panel) {
        // Close button
        panel.querySelector('.close-btn').onclick = () => {
            panel.classList.remove('active');
        };
        
        // Sensitivity slider
        const sensitivitySlider = panel.querySelector('#sensitivity-slider');
        const sensitivityValue = panel.querySelector('#sensitivity-value');
        sensitivitySlider.oninput = () => {
            sensitivityValue.textContent = sensitivitySlider.value;
            const gain = parseInt(sensitivitySlider.value) * 0.5; // 0.5 to 2.5
            this.config.recognition.audioConstraints.volume = gain;
        };
        
        // Speed slider
        const speedSlider = panel.querySelector('#speed-slider');
        const speedValue = panel.querySelector('#speed-value');
        speedSlider.oninput = () => {
            speedValue.textContent = speedSlider.value;
            this.config.tts.openai.speed = parseFloat(speedSlider.value);
            this.config.tts.fallback.rate = parseFloat(speedSlider.value);
        };
        
        // Test voice button
        panel.querySelector('#test-voice-btn').onclick = () => {
            this.speak("Testing Phoenix voice system. Audio quality optimal.");
        };
        
        // Save settings button
        panel.querySelector('#save-settings-btn').onclick = () => {
            this.config.tts.openai.voice = panel.querySelector('#openai-voice').value;
            this.savePreferences();
            this.speak("Settings saved successfully.");
            panel.classList.remove('active');
        };
    }

    showSettings() {
        if (!this.settingsPanel) {
            this.settingsPanel = this.createSettingsPanel();
        }
        this.settingsPanel.classList.add('active');
    }
}

// AUTO-INITIALIZE
(function() {
    console.log('🚀 Loading Phoenix Voice Configuration...');
    
    // Create global instance
    window.phoenixVoiceConfig = new VoiceConfiguration();
    
    // Wait for voice interface to be ready
    const initializeVoiceConfig = async () => {
        console.log('🎤 Waiting for voice interface...');
        
        // Wait up to 10 seconds for voice interface
        let attempts = 0;
        const maxAttempts = 20;
        
        const waitForVoice = setInterval(async () => {
            attempts++;
            
            // Check if voice interface exists (from voice.js module)
            if (window.voiceInterface || window.startListening || attempts >= maxAttempts) {
                clearInterval(waitForVoice);
                
                if (attempts >= maxAttempts) {
                    console.warn('⚠️ Voice interface timeout, initializing anyway...');
                }
                
                console.log('🎤 Initializing Voice Configuration...');
                await window.phoenixVoiceConfig.initialize();
                
                // Auto-start listening after a delay
                setTimeout(() => {
                    console.log('🎤 Starting enhanced listening...');
                    window.phoenixVoiceConfig.startListening();
                }, 2000);
            }
        }, 500);
    };
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeVoiceConfig);
    } else {
        initializeVoiceConfig();
    }
    
    // Add keyboard shortcut for settings (Ctrl+Shift+V)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            window.phoenixVoiceConfig.showSettings();
        }
    });
    
    // Add voice commands
    window.addEventListener('voice:command:matched', (e) => {
        console.log('🎯 Command matched:', e.detail);
    });
})();

// Export for debugging
window.VoiceConfiguration = VoiceConfiguration;
