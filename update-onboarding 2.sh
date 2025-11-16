#!/bin/bash
# Script to update onboarding.html with i18n and new phases

echo "🔧 Starting onboarding.html transformation..."

# Create working copy
cp onboarding.html onboarding-new.html

# Step 1: Add i18n script before closing </body>
echo "📝 Step 1: Adding i18n script..."
sed -i '' 's|</body>|    <script src="src/i18n.js"></script>\n</body>|' onboarding-new.html

# Step 2: Add data-i18n attributes to phase titles
echo "📝 Step 2: Adding i18n data attributes..."
sed -i '' 's|<h1 class="phase-title">PHOENIX INITIALIZE</h1>|<h1 class="phase-title" data-i18n="phase.init">PHOENIX INITIALIZE</h1>|' onboarding-new.html
sed -i '' 's|<h1 class="phase-title">SELECT LANGUAGE</h1>|<h1 class="phase-title" data-i18n="phase.language">SELECT LANGUAGE</h1>|' onboarding-new.html
sed -i '' 's|<h1 class="phase-title">SELECT VOICE PROFILE</h1>|<h1 class="phase-title" data-i18n="phase.voice">SELECT VOICE</h1>|' onboarding-new.html
sed -i '' 's|<h1 class="phase-title">CREATE ACCOUNT</h1>|<h1 class="phase-title" data-i18n="phase.auth">CREATE ACCOUNT</h1>|' onboarding-new.html
sed -i '' 's|<h1 class="phase-title">VERIFY YOUR ACCOUNT</h1>|<h1 class="phase-title" data-i18n="phase.verify">VERIFY YOUR ACCOUNT</h1>|' onboarding-new.html
sed -i '' 's|<h1 class="phase-title">SYNC DEVICES</h1>|<h1 class="phase-title" data-i18n="phase.sync">SYNC DEVICES</h1>|' onboarding-new.html
sed -i '' 's|<h1 class="phase-title">SET OBJECTIVES</h1>|<h1 class="phase-title" data-i18n="phase.goals">SET OBJECTIVES</h1>|' onboarding-new.html
sed -i '' 's|<h1 class="phase-title">INITIALIZATION COMPLETE</h1>|<h1 class="phase-title" data-i18n="phase.launch">INITIALIZATION COMPLETE</h1>|' onboarding-new.html

# Step 3: Add data-i18n to subtitles
sed -i '' 's|<p class="phase-subtitle">CHOOSE YOUR PREFERRED LANGUAGE</p>|<p class="phase-subtitle" data-i18n="phase.language.subtitle">CHOOSE YOUR PREFERRED LANGUAGE</p>|' onboarding-new.html
sed -i '' 's|<p class="phase-subtitle">CHOOSE YOUR PREFERRED VOICE PERSONALITY</p>|<p class="phase-subtitle" data-i18n="phase.voice.subtitle">CHOOSE YOUR PREFERRED VOICE</p>|' onboarding-new.html

# Step 4: Add data-i18n to buttons
sed -i '' 's|\[ CONTINUE \]|<span data-i18n="btn.continue">CONTINUE</span>|g' onboarding-new.html
sed -i '' 's|\[ BACK \]|<span data-i18n="btn.back">BACK</span>|g' onboarding-new.html
sed -i '' 's|\[ SKIP \]|<span data-i18n="btn.skip">SKIP</span>|g' onboarding-new.html

echo "✅ Script transformation complete!"
echo "📄 Output: onboarding-new.html"
echo ""
echo "Next steps:"
echo "1. Review onboarding-new.html"
echo "2. If good: mv onboarding-new.html onboarding.html"
echo "3. Manually add Phase 1 instant language switching"
echo "4. Manually add new Phase 2 (voice selection)"
echo "5. Manually add new Phase 3 (persona selection)"
