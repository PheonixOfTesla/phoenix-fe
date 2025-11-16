/* ============================================
   VOICE/MANUAL MODE CONTROLLER
   Manages switching between voice-first and manual modes
   Includes localStorage persistence and keyboard shortcuts
   ============================================ */

(function() {
    'use strict';

    // Mode constants
    const VOICE_MODE = 'voice';
    const MANUAL_MODE = 'manual';
    const STORAGE_KEY = 'phoenix_ui_mode';

    // Audio feedback
    function playModeTransitionSound(isVoiceMode) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            if (isVoiceMode) {
                // Voice mode: Ascending pitch (opening up)
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            } else {
                // Manual mode: Descending pitch (grounding down)
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    // Save mode to localStorage
    function saveMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
            console.log(`✅ Mode saved: ${mode}`);
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
    }

    // Load mode from localStorage
    function loadMode() {
        try {
            const savedMode = localStorage.getItem(STORAGE_KEY);
            return savedMode || VOICE_MODE; // Default to voice mode
        } catch (e) {
            console.warn('localStorage not available:', e);
            return VOICE_MODE;
        }
    }

    // Apply mode to body
    function applyMode(mode) {
        document.body.setAttribute('data-mode', mode);

        // Update button states
        const voiceBtn = document.getElementById('voice-mode-btn');
        const manualBtn = document.getElementById('manual-mode-btn');

        if (voiceBtn && manualBtn) {
            if (mode === VOICE_MODE) {
                voiceBtn.setAttribute('aria-pressed', 'true');
                manualBtn.setAttribute('aria-pressed', 'false');
            } else {
                voiceBtn.setAttribute('aria-pressed', 'false');
                manualBtn.setAttribute('aria-pressed', 'true');
            }
        }

        console.log(`🎨 UI Mode: ${mode.toUpperCase()}`);
    }

    // Wake word management
    function manageWakeWord(mode) {
        // In voice mode, enable wake word detection
        // In manual mode, disable wake word to save battery
        if (mode === VOICE_MODE) {
            console.log('🎤 Wake word detection: ENABLED');
            // Enable wake word if available
            if (window.enableWakeWordAI && typeof window.enableWakeWordAI === 'function') {
                // Wake word will be enabled by user action if not already
            }
        } else {
            console.log('🔇 Wake word detection: DISABLED (battery optimization)');
            // Disable wake word to save battery
            if (window.disableWakeWordAI && typeof window.disableWakeWordAI === 'function') {
                window.disableWakeWordAI();
            }
        }
    }

    // Switch to Voice Mode
    window.switchToVoiceMode = function() {
        console.log('🎤 Switching to VOICE mode...');
        applyMode(VOICE_MODE);
        saveMode(VOICE_MODE);
        playModeTransitionSound(true);
        manageWakeWord(VOICE_MODE);

        // Close any open menus
        closeAllMenus();

        // Show brief notification
        showModeNotification('Voice Mode Active', 'Say "Hey Phoenix" to interact');
    };

    // Switch to Manual Mode
    window.switchToManualMode = function() {
        console.log('👆 Switching to MANUAL mode...');
        applyMode(MANUAL_MODE);
        saveMode(MANUAL_MODE);
        playModeTransitionSound(false);
        manageWakeWord(MANUAL_MODE);

        // Show brief notification
        showModeNotification('Manual Mode Active', 'Use buttons and menus to interact');
    };

    // Close all open menus
    function closeAllMenus() {
        const jarvisMenu = document.getElementById('jarvis-quick-menu');
        const quickMenu = document.getElementById('quick-actions-menu');
        const settingsMenu = document.getElementById('settings-menu');
        const planetPanel = document.getElementById('planet-selection-panel');

        if (jarvisMenu) jarvisMenu.style.display = 'none';
        if (quickMenu) quickMenu.style.display = 'none';
        if (settingsMenu) settingsMenu.style.display = 'none';
        if (planetPanel) planetPanel.style.left = '-400px';
    }

    // Show mode transition notification
    function showModeNotification(title, subtitle) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('mode-notification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'mode-notification';
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                z-index: 10002;
                background: rgba(0, 10, 20, 0.95);
                border: 2px solid rgba(0, 217, 255, 0.4);
                border-radius: 12px;
                padding: 15px 25px;
                backdrop-filter: blur(15px);
                box-shadow: 0 0 30px rgba(0, 217, 255, 0.3);
                pointer-events: none;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            `;
            document.body.appendChild(notification);
        }

        notification.innerHTML = `
            <div style="font-size: 14px; color: #00d9ff; font-weight: bold; margin-bottom: 4px; text-align: center;">
                ${title}
            </div>
            <div style="font-size: 10px; color: rgba(0, 217, 255, 0.6); text-align: center;">
                ${subtitle}
            </div>
        `;

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // Animate out after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
        }, 2000);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // V key - switch to Voice mode
        if (e.key === 'v' || e.key === 'V') {
            // Only if not typing in input field
            if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                window.switchToVoiceMode();
            }
        }

        // M key - switch to Manual mode
        if (e.key === 'm' || e.key === 'M') {
            // Only if not typing in input field
            if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                window.switchToManualMode();
            }
        }
    });

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Voice Mode Controller initialized');

        // Load saved mode or default to voice
        const savedMode = loadMode();
        applyMode(savedMode);

        // Set initial button states
        const voiceBtn = document.getElementById('voice-mode-btn');
        const manualBtn = document.getElementById('manual-mode-btn');

        if (voiceBtn) {
            voiceBtn.setAttribute('aria-label', 'Switch to voice mode');
            voiceBtn.setAttribute('role', 'button');
        }

        if (manualBtn) {
            manualBtn.setAttribute('aria-label', 'Switch to manual mode');
            manualBtn.setAttribute('role', 'button');
        }

        console.log(`📍 Initial mode: ${savedMode.toUpperCase()}`);
    });

    // Listen for page visibility changes (tab switching)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page hidden - pause wake word if in voice mode to save battery
            const currentMode = document.body.getAttribute('data-mode');
            if (currentMode === VOICE_MODE) {
                console.log('📴 Page hidden - pausing wake word');
                if (window.pauseWakeWord && typeof window.pauseWakeWord === 'function') {
                    window.pauseWakeWord();
                }
            }
        } else {
            // Page visible - resume wake word if in voice mode
            const currentMode = document.body.getAttribute('data-mode');
            if (currentMode === VOICE_MODE) {
                console.log('🔊 Page visible - resuming wake word');
                if (window.resumeWakeWord && typeof window.resumeWakeWord === 'function') {
                    window.resumeWakeWord();
                }
            }
        }
    });

    // Debug helper - expose current mode
    window.getCurrentMode = function() {
        return document.body.getAttribute('data-mode');
    };

    console.log('✅ Voice/Manual Mode Controller loaded');
})();
