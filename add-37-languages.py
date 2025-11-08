#!/usr/bin/env python3
"""
Add all 37 languages to onboarding Phase 1
Keep current 11 with full i18n, add 26 more with voice-only support
"""

print("🌍 Adding all 37 languages to Phase 1...\n")

with open('onboarding.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the language grid section
language_grid_start = content.find('<div class="selection-grid" id="languageGrid">')
language_grid_end = content.find('</div>', language_grid_start + 100)
language_grid_close = content.find('</div>', language_grid_end + 10)

# Get existing grid content
before_grid = content[:language_grid_start]
after_grid = content[language_grid_close + 6:]

# Create new 37-language grid
new_language_grid = '''<div class="selection-grid" id="languageGrid">
                <!-- Core 11 languages with full i18n support -->
                <div class="selection-card" data-lang="en" onclick="switchLanguage('en')" data-name="English">
                    <div class="icon">🇬🇧</div>
                    <div class="title">ENGLISH</div>
                    <div class="subtitle">Global</div>
                </div>
                <div class="selection-card" data-lang="es" onclick="switchLanguage('es')" data-name="Spanish">
                    <div class="icon">🇪🇸</div>
                    <div class="title">ESPAÑOL</div>
                    <div class="subtitle">Spanish</div>
                </div>
                <div class="selection-card" data-lang="fr" onclick="switchLanguage('fr')" data-name="French">
                    <div class="icon">🇫🇷</div>
                    <div class="title">FRANÇAIS</div>
                    <div class="subtitle">French</div>
                </div>
                <div class="selection-card" data-lang="de" onclick="switchLanguage('de')" data-name="German">
                    <div class="icon">🇩🇪</div>
                    <div class="title">DEUTSCH</div>
                    <div class="subtitle">German</div>
                </div>
                <div class="selection-card" data-lang="it" onclick="switchLanguage('it')" data-name="Italian">
                    <div class="icon">🇮🇹</div>
                    <div class="title">ITALIANO</div>
                    <div class="subtitle">Italian</div>
                </div>
                <div class="selection-card" data-lang="pt" onclick="switchLanguage('pt')" data-name="Portuguese">
                    <div class="icon">🇵🇹</div>
                    <div class="title">PORTUGUÊS</div>
                    <div class="subtitle">Portuguese</div>
                </div>
                <div class="selection-card" data-lang="nl" onclick="switchLanguage('nl')" data-name="Dutch">
                    <div class="icon">🇳🇱</div>
                    <div class="title">NEDERLANDS</div>
                    <div class="subtitle">Dutch</div>
                </div>
                <div class="selection-card" data-lang="pl" onclick="switchLanguage('pl')" data-name="Polish">
                    <div class="icon">🇵🇱</div>
                    <div class="title">POLSKI</div>
                    <div class="subtitle">Polish</div>
                </div>
                <div class="selection-card" data-lang="ru" onclick="switchLanguage('ru')" data-name="Russian">
                    <div class="icon">🇷🇺</div>
                    <div class="title">РУССКИЙ</div>
                    <div class="subtitle">Russian</div>
                </div>
                <div class="selection-card" data-lang="ja" onclick="switchLanguage('ja')" data-name="Japanese">
                    <div class="icon">🇯🇵</div>
                    <div class="title">日本語</div>
                    <div class="subtitle">Japanese</div>
                </div>
                <div class="selection-card" data-lang="zh" onclick="switchLanguage('zh')" data-name="Chinese">
                    <div class="icon">🇨🇳</div>
                    <div class="title">中文</div>
                    <div class="subtitle">Chinese</div>
                </div>

                <!-- Additional 26 languages (voice support only) -->
                <div class="selection-card" data-lang="ar" onclick="switchLanguage('ar')" data-name="Arabic">
                    <div class="icon">🇸🇦</div>
                    <div class="title">العربية</div>
                    <div class="subtitle">Arabic</div>
                </div>
                <div class="selection-card" data-lang="cs" onclick="switchLanguage('cs')" data-name="Czech">
                    <div class="icon">🇨🇿</div>
                    <div class="title">ČEŠTINA</div>
                    <div class="subtitle">Czech</div>
                </div>
                <div class="selection-card" data-lang="da" onclick="switchLanguage('da')" data-name="Danish">
                    <div class="icon">🇩🇰</div>
                    <div class="title">DANSK</div>
                    <div class="subtitle">Danish</div>
                </div>
                <div class="selection-card" data-lang="el" onclick="switchLanguage('el')" data-name="Greek">
                    <div class="icon">🇬🇷</div>
                    <div class="title">ΕΛΛΗΝΙΚΆ</div>
                    <div class="subtitle">Greek</div>
                </div>
                <div class="selection-card" data-lang="fi" onclick="switchLanguage('fi')" data-name="Finnish">
                    <div class="icon">🇫🇮</div>
                    <div class="title">SUOMI</div>
                    <div class="subtitle">Finnish</div>
                </div>
                <div class="selection-card" data-lang="he" onclick="switchLanguage('he')" data-name="Hebrew">
                    <div class="icon">🇮🇱</div>
                    <div class="title">עברית</div>
                    <div class="subtitle">Hebrew</div>
                </div>
                <div class="selection-card" data-lang="hi" onclick="switchLanguage('hi')" data-name="Hindi">
                    <div class="icon">🇮🇳</div>
                    <div class="title">हिन्दी</div>
                    <div class="subtitle">Hindi</div>
                </div>
                <div class="selection-card" data-lang="hu" onclick="switchLanguage('hu')" data-name="Hungarian">
                    <div class="icon">🇭🇺</div>
                    <div class="title">MAGYAR</div>
                    <div class="subtitle">Hungarian</div>
                </div>
                <div class="selection-card" data-lang="id" onclick="switchLanguage('id')" data-name="Indonesian">
                    <div class="icon">🇮🇩</div>
                    <div class="title">BAHASA</div>
                    <div class="subtitle">Indonesian</div>
                </div>
                <div class="selection-card" data-lang="ko" onclick="switchLanguage('ko')" data-name="Korean">
                    <div class="icon">🇰🇷</div>
                    <div class="title">한국어</div>
                    <div class="subtitle">Korean</div>
                </div>
                <div class="selection-card" data-lang="ms" onclick="switchLanguage('ms')" data-name="Malay">
                    <div class="icon">🇲🇾</div>
                    <div class="title">BAHASA MELAYU</div>
                    <div class="subtitle">Malay</div>
                </div>
                <div class="selection-card" data-lang="no" onclick="switchLanguage('no')" data-name="Norwegian">
                    <div class="icon">🇳🇴</div>
                    <div class="title">NORSK</div>
                    <div class="subtitle">Norwegian</div>
                </div>
                <div class="selection-card" data-lang="ro" onclick="switchLanguage('ro')" data-name="Romanian">
                    <div class="icon">🇷🇴</div>
                    <div class="title">ROMÂNĂ</div>
                    <div class="subtitle">Romanian</div>
                </div>
                <div class="selection-card" data-lang="sk" onclick="switchLanguage('sk')" data-name="Slovak">
                    <div class="icon">🇸🇰</div>
                    <div class="title">SLOVENČINA</div>
                    <div class="subtitle">Slovak</div>
                </div>
                <div class="selection-card" data-lang="sv" onclick="switchLanguage('sv')" data-name="Swedish">
                    <div class="icon">🇸🇪</div>
                    <div class="title">SVENSKA</div>
                    <div class="subtitle">Swedish</div>
                </div>
                <div class="selection-card" data-lang="th" onclick="switchLanguage('th')" data-name="Thai">
                    <div class="icon">🇹🇭</div>
                    <div class="title">ไทย</div>
                    <div class="subtitle">Thai</div>
                </div>
                <div class="selection-card" data-lang="tr" onclick="switchLanguage('tr')" data-name="Turkish">
                    <div class="icon">🇹🇷</div>
                    <div class="title">TÜRKÇE</div>
                    <div class="subtitle">Turkish</div>
                </div>
                <div class="selection-card" data-lang="uk" onclick="switchLanguage('uk')" data-name="Ukrainian">
                    <div class="icon">🇺🇦</div>
                    <div class="title">УКРАЇНСЬКА</div>
                    <div class="subtitle">Ukrainian</div>
                </div>
                <div class="selection-card" data-lang="vi" onclick="switchLanguage('vi')" data-name="Vietnamese">
                    <div class="icon">🇻🇳</div>
                    <div class="title">TIẾNG VIỆT</div>
                    <div class="subtitle">Vietnamese</div>
                </div>
                <div class="selection-card" data-lang="ca" onclick="switchLanguage('ca')" data-name="Catalan">
                    <div class="icon">🇪🇸</div>
                    <div class="title">CATALÀ</div>
                    <div class="subtitle">Catalan</div>
                </div>
                <div class="selection-card" data-lang="hr" onclick="switchLanguage('hr')" data-name="Croatian">
                    <div class="icon">🇭🇷</div>
                    <div class="title">HRVATSKI</div>
                    <div class="subtitle">Croatian</div>
                </div>
                <div class="selection-card" data-lang="en-AU" onclick="switchLanguage('en-AU')" data-name="English (Australia)">
                    <div class="icon">🇦🇺</div>
                    <div class="title">ENGLISH (AU)</div>
                    <div class="subtitle">Australian</div>
                </div>
                <div class="selection-card" data-lang="en-IN" onclick="switchLanguage('en-IN')" data-name="English (India)">
                    <div class="icon">🇮🇳</div>
                    <div class="title">ENGLISH (IN)</div>
                    <div class="subtitle">Indian</div>
                </div>
                <div class="selection-card" data-lang="en-IE" onclick="switchLanguage('en-IE')" data-name="English (Ireland)">
                    <div class="icon">🇮🇪</div>
                    <div class="title">ENGLISH (IE)</div>
                    <div class="subtitle">Irish</div>
                </div>
                <div class="selection-card" data-lang="en-ZA" onclick="switchLanguage('en-ZA')" data-name="English (South Africa)">
                    <div class="icon">🇿🇦</div>
                    <div class="title">ENGLISH (ZA)</div>
                    <div class="subtitle">South African</div>
                </div>
                <div class="selection-card" data-lang="pt-BR" onclick="switchLanguage('pt-BR')" data-name="Portuguese (Brazil)">
                    <div class="icon">🇧🇷</div>
                    <div class="title">PORTUGUÊS (BR)</div>
                    <div class="subtitle">Brazilian</div>
                </div>
            </div>'''

# Reconstruct file
new_content = before_grid + new_language_grid + after_grid

with open('onboarding.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Added all 37 languages to Phase 1!")
print("\nLanguage breakdown:")
print("  • 11 languages with full i18n UI translation")
print("  • 26 additional languages with voice support")
print("  • Total: 37 languages\n")
