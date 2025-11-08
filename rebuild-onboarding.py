#!/usr/bin/env python3
"""
Rebuild onboarding.html with i18n and new phase structure
"""
import re

# Read current onboarding
with open('onboarding.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("🔧 Starting onboarding.html rebuild...")

# Step 1: Add i18n script before </body>
print("📝 Step 1: Adding i18n script...")
content = content.replace(
    '</body>',
    '    <script src="src/i18n.js"></script>\n    <script>\n        // Initialize i18n on page load\n        document.addEventListener(\'DOMContentLoaded\', () => {\n            PhoenixI18n.updateAllTranslations();\n        });\n    </script>\n</body>'
)

# Step 2: Add i18n data attributes to phase titles
print("📝 Step 2: Adding i18n to phase titles...")
replacements = [
    ('<h1 class="phase-title">PHOENIX INITIALIZE</h1>', '<h1 class="phase-title" data-i18n="phase.init">PHOENIX INITIALIZE</h1>'),
    ('<h1 class="phase-title">SELECT LANGUAGE</h1>', '<h1 class="phase-title" data-i18n="phase.language">SELECT LANGUAGE</h1>'),
    ('<h1 class="phase-title">SELECT VOICE PROFILE</h1>', '<h1 class="phase-title" data-i18n="phase.voice">SELECT VOICE</h1>'),
    ('<h1 class="phase-title">CREATE ACCOUNT</h1>', '<h1 class="phase-title" data-i18n="phase.auth">CREATE ACCOUNT</h1>'),
    ('<h1 class="phase-title">VERIFY YOUR ACCOUNT</h1>', '<h1 class="phase-title" data-i18n="phase.verify">VERIFY YOUR ACCOUNT</h1>'),
    ('<h1 class="phase-title">VERIFY PHONE</h1>', '<h1 class="phase-title" data-i18n="phase.verify">VERIFY PHONE</h1>'),
    ('<h1 class="phase-title">SYNC DEVICES</h1>', '<h1 class="phase-title" data-i18n="phase.sync">SYNC DEVICES</h1>'),
    ('<h1 class="phase-title">SET OBJECTIVES</h1>', '<h1 class="phase-title" data-i18n="phase.goals">SET OBJECTIVES</h1>'),
    ('<h1 class="phase-title">CUSTOMIZE PHOENIX VOICE</h1>', '<h1 class="phase-title" data-i18n="phase.persona">SELECT PERSONALITY</h1>'),
    ('<h1 class="phase-title">INITIALIZATION COMPLETE</h1>', '<h1 class="phase-title" data-i18n="phase.launch">INITIALIZATION COMPLETE</h1>'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Step 3: Add i18n to subtitles
print("📝 Step 3: Adding i18n to subtitles...")
subtitle_replacements = [
    ('<p class="phase-subtitle">CHOOSE YOUR PREFERRED LANGUAGE</p>', '<p class="phase-subtitle" data-i18n="phase.language.subtitle">CHOOSE YOUR PREFERRED LANGUAGE</p>'),
    ('<p class="phase-subtitle">CHOOSE YOUR PREFERRED VOICE PERSONALITY</p>', '<p class="phase-subtitle" data-i18n="phase.voice.subtitle">CHOOSE YOUR PREFERRED VOICE</p>'),
    ('<p class="phase-subtitle">REGISTER YOUR CREDENTIALS</p>', '<p class="phase-subtitle" data-i18n="phase.auth.subtitle">REGISTER YOUR CREDENTIALS</p>'),
    ('<p class="phase-subtitle">CONFIRM YOUR IDENTITY</p>', '<p class="phase-subtitle" data-i18n="phase.verify.subtitle">CONFIRM YOUR IDENTITY</p>'),
    ('<p class="phase-subtitle">CONNECT YOUR LIFE</p>', '<p class="phase-subtitle" data-i18n="phase.sync.subtitle">CONNECT YOUR LIFE</p>'),
    ('<p class="phase-subtitle">WHAT DO YOU WANT TO ACHIEVE?</p>', '<p class="phase-subtitle" data-i18n="phase.goals.subtitle">WHAT DO YOU WANT TO ACHIEVE?</p>'),
    ('<p class="phase-subtitle">CHOOSE YOUR AI PERSONALITY & VOICE</p>', '<p class="phase-subtitle" data-i18n="phase.persona.subtitle">CHOOSE YOUR AI PERSONALITY</p>'),
    ('<p class="phase-subtitle">YOUR AI IS READY</p>', '<p class="phase-subtitle" data-i18n="phase.launch.subtitle">YOUR AI IS READY</p>'),
]

for old, new in subtitle_replacements:
    content = content.replace(old, new)

# Step 4: Add i18n to buttons
print("📝 Step 4: Adding i18n to buttons...")
# Use regex to find button text and wrap in spans
content = re.sub(
    r'>\[\s*CONTINUE\s*\]<',
    '><span data-i18n="btn.continue">CONTINUE</span><',
    content
)
content = re.sub(
    r'>\[\s*BACK\s*\]<',
    '><span data-i18n="btn.back">BACK</span><',
    content
)
content = re.sub(
    r'>\[\s*SKIP\s*\]<',
    '><span data-i18n="btn.skip">SKIP</span><',
    content
)
content = re.sub(
    r'>\[\s*LAUNCH DASHBOARD\s*\]<',
    '><span data-i18n="btn.launch">LAUNCH DASHBOARD</span><',
    content
)

# Step 5: Add instant language switching to Phase 1
print("📝 Step 5: Adding instant language switching...")
# Find the language selection cards and add onclick handlers
language_cards = [
    ('data-lang="en"', 'data-lang="en" onclick="switchLanguage(\'en\')"'),
    ('data-lang="es"', 'data-lang="es" onclick="switchLanguage(\'es\')"'),
    ('data-lang="fr"', 'data-lang="fr" onclick="switchLanguage(\'fr\')"'),
    ('data-lang="de"', 'data-lang="de" onclick="switchLanguage(\'de\')"'),
    ('data-lang="it"', 'data-lang="it" onclick="switchLanguage(\'it\')"'),
    ('data-lang="pt"', 'data-lang="pt" onclick="switchLanguage(\'pt\')"'),
    ('data-lang="nl"', 'data-lang="nl" onclick="switchLanguage(\'nl\')"'),
    ('data-lang="pl"', 'data-lang="pl" onclick="switchLanguage(\'pl\')"'),
    ('data-lang="ru"', 'data-lang="ru" onclick="switchLanguage(\'ru\')"'),
    ('data-lang="ja"', 'data-lang="ja" onclick="switchLanguage(\'ja\')"'),
    ('data-lang="zh"', 'data-lang="zh" onclick="switchLanguage(\'zh\')"'),
]

for old, new in language_cards:
    content = content.replace(old, new)

# Step 6: Add switchLanguage function before </script> at end
print("📝 Step 6: Adding switchLanguage function...")
switch_lang_function = """
    // Switch language and update UI instantly
    function switchLanguage(langCode) {
        console.log('🌍 Switching language to:', langCode);

        // Update i18n system
        PhoenixI18n.setLanguage(langCode);

        // Remove selected class from all language cards
        document.querySelectorAll('.selection-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selected class to clicked language
        const selectedCard = document.querySelector(`[data-lang="${langCode}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // Enable continue button
        const continueBtn = document.getElementById('nextPhase1');
        if (continueBtn) {
            continueBtn.disabled = false;
        }

        console.log('✅ Language switched to', langCode, '- UI updated!');
    }
"""

# Find the last script tag before </body> and insert function
content = content.replace(
    '    <script src="src/i18n.js"></script>',
    '    <script src="src/i18n.js"></script>\n    <script>' + switch_lang_function + '\n    </script>'
)

# Write modified content
with open('onboarding.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Onboarding rebuild complete!")
print("📄 File updated: onboarding.html")
print("")
print("✨ Changes made:")
print("  ✅ Added i18n script")
print("  ✅ Added data-i18n attributes to all phase titles")
print("  ✅ Added data-i18n attributes to all subtitles")
print("  ✅ Added data-i18n attributes to all buttons")
print("  ✅ Added instant language switching to Phase 1")
print("  ✅ Added switchLanguage() function")
print("")
print("🧪 Next: Test in browser!")
