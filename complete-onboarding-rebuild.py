#!/usr/bin/env python3
"""
Complete onboarding rebuild with new phase structure
- Remove old Phase 2 (OpenAI voices)
- Add new Phase 2 (iOS voice selection)
- Add new Phase 3 (12 personalities)
- Update Phase 7 (open text goals)
- Update Phase 6 (expand sync)
"""
import re

print("🔧 Starting complete onboarding rebuild...\n")

# Read current onboarding
with open('onboarding.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================================
# STEP 1: Replace old Phase 2 (OpenAI voices) with new Phase 2 (iOS voices)
# ============================================================================
print("📝 Step 1: Replacing Phase 2 with iOS voice selection...")

old_phase2 = '''        <!-- Phase 2: Voice Selection -->
        <div class="phase" id="phase2">
            <div class="phoenix-avatar">
                <div class="avatar-circle" id="avatarCircle2"></div>
            </div>
            <div class="voice-status" id="voiceStatus2">[ VOICE ACTIVE ]</div>
            <div class="phase-header">
                <h1 class="phase-title" data-i18n="phase.voice">SELECT VOICE</h1>
                <p class="phase-subtitle" data-i18n="phase.voice.subtitle">CHOOSE YOUR PREFERRED VOICE</p>
            </div>
            <div class="selection-grid" id="voiceGrid">
                <div class="selection-card" data-voice="nova">
                    <div class="icon">😊</div>
                    <div class="title">NOVA</div>
                    <div class="subtitle">Friendly Helper</div>
                    <button class="voice-preview-btn" onclick="previewVoice('nova', event)">▶ PREVIEW</button>
                </div>
                <div class="selection-card" data-voice="echo">
                    <div class="icon">🇬🇧</div>
                    <div class="title">ECHO</div>
                    <div class="subtitle">British Butler</div>
                    <button class="voice-preview-btn" onclick="previewVoice('echo', event)">▶ PREVIEW</button>
                </div>
                <div class="selection-card" data-voice="onyx">
                    <div class="icon">💼</div>
                    <div class="title">ONYX</div>
                    <div class="subtitle">Professional</div>
                    <button class="voice-preview-btn" onclick="previewVoice('onyx', event)">▶ PREVIEW</button>
                </div>
                <div class="selection-card" data-voice="shimmer">
                    <div class="icon">🌸</div>
                    <div class="title">SHIMMER</div>
                    <div class="subtitle">Gentle Guide</div>
                    <button class="voice-preview-btn" onclick="previewVoice('shimmer', event)">▶ PREVIEW</button>
                </div>
                <div class="selection-card" data-voice="alloy">
                    <div class="icon">🤖</div>
                    <div class="title">ALLOY</div>
                    <div class="subtitle">Neutral Balanced</div>
                    <button class="voice-preview-btn" onclick="previewVoice('alloy', event)">▶ PREVIEW</button>
                </div>
                <div class="selection-card" data-voice="fable">
                    <div class="icon">📖</div>
                    <div class="title">FABLE</div>
                    <div class="subtitle">Storyteller</div>
                    <button class="voice-preview-btn" onclick="previewVoice('fable', event)">▶ PREVIEW</button>
                </div>
            </div>
            <div class="button-group">
                <button class="btn btn-secondary" onclick="previousPhase()"><span data-i18n="btn.back">BACK</span></button>
                <button class="btn btn-primary" id="nextPhase2" disabled><span data-i18n="btn.continue">CONTINUE</span></button>
            </div>
        </div>'''

new_phase2 = '''        <!-- Phase 2: iOS Voice Selection -->
        <div class="phase" id="phase2">
            <div class="phoenix-avatar">
                <div class="avatar-circle" id="avatarCircle2"></div>
            </div>
            <div class="voice-status" id="voiceStatus2">[ VOICE ACTIVE ]</div>
            <div class="phase-header">
                <h1 class="phase-title" data-i18n="phase.voice">SELECT VOICE</h1>
                <p class="phase-subtitle" data-i18n="phase.voice.subtitle">CHOOSE YOUR PREFERRED VOICE</p>
            </div>
            <div id="iosVoiceLoading" style="text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p data-i18n="voice.loading">Loading available voices...</p>
            </div>
            <div class="selection-grid" id="iosVoiceGrid" style="display: none;">
                <!-- iOS voices will be populated by JavaScript based on selected language -->
            </div>
            <div class="button-group">
                <button class="btn btn-secondary" onclick="previousPhase()"><span data-i18n="btn.back">BACK</span></button>
                <button class="btn btn-primary" id="nextPhase2" disabled><span data-i18n="btn.continue">CONTINUE</span></button>
            </div>
        </div>'''

content = content.replace(old_phase2, new_phase2)
print("✅ Phase 2 replaced with iOS voice selection\n")

# ============================================================================
# STEP 2: Insert new Phase 3 (Personality Selection) after Phase 2
# ============================================================================
print("📝 Step 2: Inserting new Phase 3 (Personality Selection)...")

new_phase3_persona = '''
        <!-- Phase 3: Personality Selection (NEW) -->
        <div class="phase" id="phase3persona">
            <div class="phoenix-avatar">
                <div class="avatar-circle" id="avatarCircle3persona"></div>
            </div>
            <div class="voice-status" id="voiceStatus3persona">[ VOICE ACTIVE ]</div>
            <div class="phase-header">
                <h1 class="phase-title" data-i18n="phase.persona">SELECT PERSONALITY</h1>
                <p class="phase-subtitle" data-i18n="phase.persona.subtitle">CHOOSE YOUR AI PERSONALITY</p>
            </div>
            <div class="selection-grid" id="personaGrid">
                <div class="selection-card" data-persona="friendly_helpful" onclick="selectPersona('friendly_helpful')">
                    <div class="icon">😊</div>
                    <div class="title" data-i18n="persona.friendly">FRIENDLY HELPER</div>
                    <div class="subtitle">Warm and supportive</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('friendly_helpful', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="professional_serious" onclick="selectPersona('professional_serious')">
                    <div class="icon">💼</div>
                    <div class="title" data-i18n="persona.professional">PROFESSIONAL</div>
                    <div class="subtitle">Direct and efficient</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('professional_serious', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="british_refined" onclick="selectPersona('british_refined')">
                    <div class="icon">🎩</div>
                    <div class="title" data-i18n="persona.british">BRITISH BUTLER</div>
                    <div class="subtitle">Refined and courteous</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('british_refined', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="whimsical_storyteller" onclick="selectPersona('whimsical_storyteller')">
                    <div class="icon">📚</div>
                    <div class="title" data-i18n="persona.storyteller">STORYTELLER</div>
                    <div class="subtitle">Creative and imaginative</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('whimsical_storyteller', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="gentle_nurturing" onclick="selectPersona('gentle_nurturing')">
                    <div class="icon">🌸</div>
                    <div class="title" data-i18n="persona.nurturing">GENTLE GUIDE</div>
                    <div class="subtitle">Caring and patient</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('gentle_nurturing', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="neutral_efficient" onclick="selectPersona('neutral_efficient')">
                    <div class="icon">⚡</div>
                    <div class="title" data-i18n="persona.efficient">EFFICIENT</div>
                    <div class="subtitle">Neutral and balanced</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('neutral_efficient', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="motivational_coach" onclick="selectPersona('motivational_coach')">
                    <div class="icon">🔥</div>
                    <div class="title" data-i18n="persona.coach">COACH</div>
                    <div class="subtitle">Energetic motivator</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('motivational_coach', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="zen_master" onclick="selectPersona('zen_master')">
                    <div class="icon">🧘</div>
                    <div class="title" data-i18n="persona.zen">ZEN MASTER</div>
                    <div class="subtitle">Calm and mindful</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('zen_master', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="tech_genius" onclick="selectPersona('tech_genius')">
                    <div class="icon">🤖</div>
                    <div class="title" data-i18n="persona.tech">TECH GENIUS</div>
                    <div class="subtitle">Smart and analytical</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('tech_genius', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="comedian" onclick="selectPersona('comedian')">
                    <div class="icon">🎭</div>
                    <div class="title" data-i18n="persona.comedian">COMEDIAN</div>
                    <div class="subtitle">Witty and fun</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('comedian', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="therapist" onclick="selectPersona('therapist')">
                    <div class="icon">💭</div>
                    <div class="title" data-i18n="persona.therapist">THERAPIST</div>
                    <div class="subtitle">Understanding listener</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('therapist', event)">▶ TEST</button>
                </div>
                <div class="selection-card" data-persona="commander" onclick="selectPersona('commander')">
                    <div class="icon">⚔️</div>
                    <div class="title" data-i18n="persona.commander">COMMANDER</div>
                    <div class="subtitle">Decisive leader</div>
                    <button class="voice-preview-btn" onclick="testVoicePersona('commander', event)">▶ TEST</button>
                </div>
            </div>
            <div class="button-group">
                <button class="btn btn-secondary" onclick="previousPhase()"><span data-i18n="btn.back">BACK</span></button>
                <button class="btn btn-primary" id="nextPhase3persona" disabled><span data-i18n="btn.continue">CONTINUE</span></button>
            </div>
        </div>
'''

# Insert new Phase 3 after Phase 2
content = content.replace('</div>\n\n        <!-- Phase 3: Account Creation -->',
                         '</div>' + new_phase3_persona + '\n        <!-- Phase 3: Account Creation (now Phase 4) -->')

print("✅ Phase 3 (Personality Selection) inserted\n")

# ============================================================================
# STEP 3: Renumber remaining phases (Phase 3 becomes 4, etc.)
# ============================================================================
print("📝 Step 3: Renumbering phases...")

# Rename Phase 3 to Phase 4 (Account Creation)
content = re.sub(r'<!-- Phase 3: Account Creation \(now Phase 4\) -->',
                '<!-- Phase 4: Account Creation -->', content)
content = re.sub(r'<div class="phase" id="phase3">',
                '<div class="phase" id="phase4">', content)
content = re.sub(r'id="avatarCircle3"', 'id="avatarCircle4"', content)
content = re.sub(r'id="voiceStatus3"', 'id="voiceStatus4"', content)

print("✅ Phases renumbered\n")

# ============================================================================
# STEP 4: Add JavaScript for iOS voice loading
# ============================================================================
print("📝 Step 4: Adding iOS voice loading JavaScript...")

voice_loading_js = '''
    // ========================================
    // iOS VOICE SELECTION (Phase 2)
    // ========================================
    async function loadIOSVoices() {
        console.log('🎤 Loading iOS voices for selected language...');

        const selectedLang = localStorage.getItem('phoenixLanguage') || 'en';
        console.log('Selected language:', selectedLang);

        // Map our language codes to iOS voice language codes
        const langMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'nl': 'nl-NL',
            'pl': 'pl-PL',
            'ru': 'ru-RU',
            'ja': 'ja-JP',
            'zh': 'zh-CN'
        };

        const iosLangCode = langMap[selectedLang] || 'en-US';

        // Wait for voices to load
        let voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            await new Promise(resolve => {
                speechSynthesis.onvoiceschanged = resolve;
            });
            voices = speechSynthesis.getVoices();
        }

        // Filter voices by language
        const filteredVoices = voices.filter(voice =>
            voice.lang.startsWith(iosLangCode.split('-')[0])
        );

        console.log(`Found ${filteredVoices.length} voices for ${iosLangCode}:`,
                   filteredVoices.map(v => v.name));

        // Hide loading, show grid
        document.getElementById('iosVoiceLoading').style.display = 'none';
        document.getElementById('iosVoiceGrid').style.display = 'grid';

        // Populate voice grid
        const grid = document.getElementById('iosVoiceGrid');
        grid.innerHTML = '';

        filteredVoices.forEach((voice, index) => {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.setAttribute('data-voice-name', voice.name);
            card.setAttribute('data-voice-uri', voice.voiceURI);
            card.setAttribute('data-voice-lang', voice.lang);

            const quality = voice.localService ? '⭐' : '☁️';

            card.innerHTML = `
                <div class="icon">🎤</div>
                <div class="title">${voice.name.split(' ')[0].toUpperCase()}</div>
                <div class="subtitle">${quality} ${voice.lang}</div>
                <button class="voice-preview-btn" onclick="previewIOSVoice('${voice.name}', event)">▶ PREVIEW</button>
            `;

            card.onclick = function() {
                selectIOSVoice(voice.name, voice.voiceURI, voice.lang);
            };

            grid.appendChild(card);
        });

        console.log('✅ iOS voice grid populated');
    }

    function selectIOSVoice(name, uri, lang) {
        console.log('Selected voice:', name, uri, lang);

        // Remove selected class from all cards
        document.querySelectorAll('#iosVoiceGrid .selection-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selected to clicked card
        const card = document.querySelector(`[data-voice-name="${name}"]`);
        if (card) {
            card.classList.add('selected');
        }

        // Save to localStorage
        localStorage.setItem('phoenixVoiceName', name);
        localStorage.setItem('phoenixVoiceURI', uri);
        localStorage.setItem('phoenixVoiceLang', lang);

        // Enable continue button
        const continueBtn = document.getElementById('nextPhase2');
        if (continueBtn) {
            continueBtn.disabled = false;
        }

        console.log('✅ Voice selected:', name);
    }

    function previewIOSVoice(voiceName, event) {
        if (event) event.stopPropagation();

        const utterance = new SpeechSynthesisUtterance('Hello! This is how I sound. I am your Phoenix AI assistant.');
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === voiceName);

        if (voice) {
            utterance.voice = voice;
            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
            console.log('🎤 Playing voice preview:', voiceName);
        }
    }

    // ========================================
    // PERSONALITY SELECTION (Phase 3)
    // ========================================
    function selectPersona(persona) {
        console.log('Selected persona:', persona);

        // Remove selected class from all cards
        document.querySelectorAll('#personaGrid .selection-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selected to clicked card
        const card = document.querySelector(`[data-persona="${persona}"]`);
        if (card) {
            card.classList.add('selected');
        }

        // Save to localStorage
        localStorage.setItem('phoenixPersonality', persona);

        // Enable continue button
        const continueBtn = document.getElementById('nextPhase3persona');
        if (continueBtn) {
            continueBtn.disabled = false;
        }

        console.log('✅ Persona selected:', persona);
    }

    function testVoicePersona(persona, event) {
        if (event) event.stopPropagation();

        const voiceName = localStorage.getItem('phoenixVoiceName');
        if (!voiceName) {
            alert('Please select a voice in the previous step first!');
            return;
        }

        // Sample phrases for each persona
        const phrases = {
            friendly_helpful: "Hey there! I'm here to help you achieve your goals. Let's make today amazing!",
            professional_serious: "Good day. I'm ready to assist you with your objectives. Let's proceed efficiently.",
            british_refined: "Good afternoon. It would be my pleasure to assist you today. Shall we begin?",
            whimsical_storyteller: "Ah, welcome dear friend! Your journey to greatness begins with a single step...",
            gentle_nurturing: "Hello there. I'm here for you, every step of the way. Take your time.",
            neutral_efficient: "System ready. Awaiting your input. How may I assist you today?",
            motivational_coach: "Let's GO! You've got this! Time to crush those goals! Are you ready?!",
            zen_master: "Breathe. Center yourself. Together, we shall find harmony in your path.",
            tech_genius: "Systems online. All parameters optimized. Ready to compute your success.",
            comedian: "Hey! Did you hear the one about the AI who walked into a bar? Just kidding, let's get to work!",
            therapist: "I'm here to listen and support you. How are you feeling today? Let's talk.",
            commander: "Attention! Mission objectives are clear. We will succeed. Let's execute the plan."
        };

        const utterance = new SpeechSynthesisUtterance(phrases[persona] || 'Hello! This is a test.');
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === voiceName);

        if (voice) {
            utterance.voice = voice;
            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
            console.log('🎤 Testing voice + persona:', voiceName, persona);
        }
    }
'''

# Insert before the closing </script> tag
content = content.replace('    </script>\n</body>',
                         voice_loading_js + '\n    </script>\n</body>')

print("✅ JavaScript added for iOS voices and personality\n")

# ============================================================================
# STEP 5: Update phase transition to load iOS voices when entering Phase 2
# ============================================================================
print("📝 Step 5: Adding iOS voice loader to phase transitions...")

# Find the nextPhase function and add iOS voice loading
phase_transition_hook = '''
        // Load iOS voices when entering Phase 2
        if (currentPhase === 1) {
            setTimeout(() => {
                loadIOSVoices();
            }, 500);
        }
'''

# Insert after phases[currentPhase].classList.add('active');
content = re.sub(
    r"(phases\[currentPhase\]\.classList\.add\('active'\);)",
    r"\1\n" + phase_transition_hook,
    content,
    count=1
)

print("✅ Phase transition hook added\n")

# Write updated content
with open('onboarding.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("═══════════════════════════════════════")
print("✅ ONBOARDING REBUILD COMPLETE!")
print("═══════════════════════════════════════\n")
print("Changes made:")
print("  ✅ Replaced Phase 2 with iOS voice selection")
print("  ✅ Added new Phase 3 (12 personalities)")
print("  ✅ Renumbered subsequent phases")
print("  ✅ Added iOS voice loading JavaScript")
print("  ✅ Added personality selection JavaScript")
print("  ✅ Added voice + persona test functionality\n")
print("🧪 Next: Test in browser!")
print("   1. Load onboarding")
print("   2. Pick Japanese")
print("   3. See Japanese iOS voices")
print("   4. Pick a voice")
print("   5. Pick a personality")
print("   6. Test voice + personality combo\n")
