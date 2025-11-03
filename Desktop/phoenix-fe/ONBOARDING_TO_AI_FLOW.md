# 🔄 Onboarding → Wake Word AI Flow Test

## Complete User Journey

### Phase 1: Onboarding (Language & Voice Selection)

**User Actions:**
1. Visit: `https://pheonixoftesla.github.io/phoenix-fe/onboarding.html`
2. Select language (e.g., "Español" / Spanish)
3. Select voice (e.g., "Onyx - Deep professional")
4. Complete onboarding steps

**What Happens Behind the Scenes:**
```javascript
// In onboarding.js - completePhase0()
localStorage.setItem('phoenixLanguage', 'es');  // Saves 'es'
localStorage.setItem('phoenixVoice', 'onyx');   // Saves 'onyx'

// Also saves to backend
await API.updateProfile({
    preferences: {
        language: 'es',
        voice: 'onyx'
    }
});
```

**Console Output:**
```
✅ Phase 0 complete: { language: 'es', voice: 'onyx' }
✅ Preferences saved to backend
```

---

### Phase 2: Dashboard Load

**User Actions:**
1. After onboarding, redirected to dashboard
2. Dashboard loads at: `https://pheonixoftesla.github.io/phoenix-fe/dashboard.html`

**What Happens Behind the Scenes:**
```javascript
// In dashboard.html - WakeWordAI constructor
const savedVoice = localStorage.getItem('phoenixVoice');      // 'onyx'
const savedLanguage = localStorage.getItem('phoenixLanguage'); // 'es'

this.voice = savedVoice || 'nova';           // 'onyx'
this.languageCode = savedLanguage || 'en';   // 'es'

// Language mapping
this.language = this.mapLanguageCode('es');  // 'es-ES' (for Speech Recognition)
```

**Language Code Mapping:**
```javascript
mapLanguageCode('es') → 'es-ES'   // Spanish → Spain Spanish
mapLanguageCode('fr') → 'fr-FR'   // French → France French
mapLanguageCode('de') → 'de-DE'   // German → Germany German
mapLanguageCode('en') → 'en-GB'   // English → British English
```

**Console Output:**
```
✅ Loaded from onboarding: {
    voice: 'onyx',
    languageCode: 'es',
    mappedLanguage: 'es-ES'
}
🎙️ Wake Word AI Initializing...
🎤 Listening for wake word...
✅ Wake Word AI - Say "Hey Phoenix"
```

---

### Phase 3: User Says Wake Word (In Spanish)

**User Actions:**
1. Says: "Phoenix, ¿cuál es mi puntuación de recuperación?"
   (Translation: "Phoenix, what is my recovery score?")

**What Happens Behind the Scenes:**

**1. Speech Recognition Detects (in Spanish):**
```javascript
// recognition.lang = 'es-ES'
this.recognition.onresult = (event) => {
    const text = "phoenix, ¿cuál es mi puntuación de recuperación?";
    const hasWake = text.includes('phoenix');  // ✅ TRUE

    this.processWithGemini(text);
}
```

**Console Output:**
```
🔥 Wake word detected: phoenix, ¿cuál es mi puntuación de recuperación?
🧠 Gemini processing: phoenix, ¿cuál es mi puntuación de recuperación?
```

---

### Phase 4: Gemini AI Processing

**What Happens:**
```javascript
// Calls PhoenixVoice endpoint with Spanish input
POST https://pal-backend-production.up.railway.app/api/phoenixVoice/chat

Body: {
    message: "phoenix, ¿cuál es mi puntuación de recuperación?",
    conversationHistory: [],
    personality: "friendly_helpful",
    voice: "onyx"
}
```

**Backend (Gemini):**
- Detects Spanish language
- Fetches user's recovery data from Mercury system
- Generates Spanish response

**Response:**
```json
{
    "success": true,
    "response": "Tu puntuación de recuperación actual es 78%. Está en buena forma hoy."
}
```

**Console Output:**
```
✅ Gemini: Tu puntuación de recuperación actual es 78%. Está en buena forma hoy.
```

---

### Phase 5: TTS Response (In Spanish, Onyx Voice)

**What Happens:**
```javascript
// Get TTS language mapping
getTTSLanguage('es') → 'es'  // For TTS API

// Call TTS endpoint
POST https://pal-backend-production.up.railway.app/api/tts/generate

Body: {
    text: "Tu puntuación de recuperación actual es 78%. Está en buena forma hoy.",
    voice: "onyx",      // From onboarding
    language: "es"       // Mapped from 'es' → 'es'
}
```

**Console Output:**
```
🔊 TTS Request: {
    voice: 'onyx',
    language: 'es',
    text: 'Tu puntuación de recuperación actual es 78%...'
}
🔊 Speaking...
```

**User Hears:**
- Deep professional voice (Onyx)
- Speaking in Spanish
- Response about recovery score

---

## Language Mapping Reference

### Onboarding → Speech Recognition
| Onboarding Code | Recognition Lang | TTS Lang |
|----------------|------------------|----------|
| `en` | `en-GB` | `en-GB` |
| `es` | `es-ES` | `es` |
| `fr` | `fr-FR` | `fr` |
| `de` | `de-DE` | `de` |
| `it` | `it-IT` | `it` |
| `pt` | `pt-PT` | `pt` |
| `nl` | `nl-NL` | `nl` |
| `pl` | `pl-PL` | `pl` |
| `ru` | `ru-RU` | `ru` |
| `ja` | `ja-JP` | `ja` |
| `zh` | `zh-CN` | `zh` |

---

## Voice Options Reference

| Voice ID | Name | Description |
|----------|------|-------------|
| `nova` | Nova | Warm, friendly |
| `echo` | Echo | British butler |
| `onyx` | Onyx | Deep professional |
| `fable` | Fable | Storyteller |
| `shimmer` | Shimmer | Gentle guide |
| `alloy` | Alloy | Neutral efficient |

---

## Test Scenarios

### Test 1: English + Nova
```
Onboarding:
- Language: English
- Voice: Nova

Dashboard:
- Speech Recognition: en-GB
- TTS: en-GB + nova voice
- Say: "Hey Phoenix, what's my workout count?"
- Hears: Friendly female voice in English
```

### Test 2: Spanish + Onyx
```
Onboarding:
- Language: Español
- Voice: Onyx

Dashboard:
- Speech Recognition: es-ES
- TTS: es + onyx voice
- Say: "Phoenix, ¿cuántos entrenamientos tengo?"
- Hears: Deep professional voice in Spanish
```

### Test 3: French + Echo
```
Onboarding:
- Language: Français
- Voice: Echo

Dashboard:
- Speech Recognition: fr-FR
- TTS: fr + echo voice
- Say: "Phoenix, quel est mon score de sommeil?"
- Hears: British butler voice in French
```

---

## Debugging Console Commands

Check what's saved from onboarding:
```javascript
localStorage.getItem('phoenixVoice')      // Should return: 'onyx', 'nova', etc.
localStorage.getItem('phoenixLanguage')   // Should return: 'en', 'es', 'fr', etc.
```

Check Wake Word AI instance:
```javascript
window.wakeWordAI.voice          // Current voice
window.wakeWordAI.languageCode   // Original code from onboarding
window.wakeWordAI.language       // Mapped Speech Recognition language
window.wakeWordAI.getTTSLanguage() // TTS API language
```

Check if listening:
```javascript
window.wakeWordAI.isListening    // Should be true
window.wakeWordAI.isProcessing   // true when processing, false otherwise
```

Stop/Start listening:
```javascript
window.wakeWordAI.stop()   // Stop listening
window.wakeWordAI.start()  // Resume listening
```

---

## Expected Flow Summary

1. ✅ User selects Spanish + Onyx in onboarding
2. ✅ Saves `'es'` and `'onyx'` to localStorage
3. ✅ Dashboard loads and reads from localStorage
4. ✅ Maps `'es'` → `'es-ES'` for Speech Recognition
5. ✅ Maps `'es'` → `'es'` for TTS API
6. ✅ User says "Phoenix" in Spanish
7. ✅ Speech Recognition detects Spanish speech
8. ✅ Gemini processes Spanish request
9. ✅ TTS responds in Spanish with Onyx voice
10. ✅ User hears deep professional Spanish voice

---

## Files Modified

- `dashboard.html` - Added Wake Word AI with language mapping
- `onboarding.js` - Saves preferences to localStorage (lines 409-410)

## Git Commits

- `ea1e797` - Add interactive navigation and wake word AI listening
- `c83f496` - Fix language code mapping for onboarding → Wake Word AI

---

## Live Testing URL

https://pheonixoftesla.github.io/phoenix-fe/dashboard.html

After completing onboarding, the Wake Word AI will automatically:
- Load your selected voice
- Load your selected language
- Map language codes correctly
- Listen for "Phoenix" in your language
- Respond in your language with your chosen voice
