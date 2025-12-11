# 🎤 SIRI SHORTCUTS INTEGRATION SETUP GUIDE

Complete guide to enable "Hey Siri" commands for Phoenix AI

---

## ✅ What This Adds:

Users can trigger Phoenix commands by saying:
- **"Hey Siri, Phoenix book me a ride"**
- **"Hey Siri, Phoenix order my usual"**
- **"Hey Siri, Phoenix I finished my workout"**
- **"Hey Siri, Phoenix make a dinner reservation"**
- **"Hey Siri, Phoenix what's my day look like"**

And **Phoenix will execute without opening the app!**

---

## 📋 Prerequisites:

1. ✅ Capacitor iOS platform added to project
2. ✅ Xcode 14+ installed
3. ✅ iOS 12+ deployment target
4. ✅ Apple Developer Account (for testing on device)

---

## 🚀 Step-by-Step Setup:

### **Step 1: Add iOS Platform (If Not Already)**

```bash
cd /Users/moderndavinci/Desktop/phoenix-fe

# Add iOS platform
npx cap add ios

# Sync web code to iOS
npx cap sync
```

### **Step 2: Install Siri Shortcuts Plugin**

```bash
npm install @capacitor-community/siri-shortcuts
npx cap sync
```

### **Step 3: Open Project in Xcode**

```bash
npx cap open ios
```

### **Step 4: Add Siri Capability**

In Xcode:

1. Select **App target** (Phoenix)
2. Go to **"Signing & Capabilities"** tab
3. Click **"+ Capability"**
4. Add **"Siri"**

✅ This enables Siri access for your app

### **Step 5: Add Intent Extension**

1. In Xcode: **File → New → Target**
2. Select **"Intents Extension"**
3. Name it: **"PhoenixIntents"**
4. Click **Finish**
5. Click **Activate** when prompted

✅ This creates a separate target for handling Siri intents

### **Step 6: Add Intent Definition File**

1. In PhoenixIntents folder: **File → New → File**
2. Select **"SiriKit Intent Definition File"**
3. Name it: **"PhoenixIntents.intentdefinition"**
4. Click **Create**

### **Step 7: Define Custom Intents**

In the `PhoenixIntents.intentdefinition` file:

#### **Intent 1: Book Ride**

1. Click **"+"** to add new intent
2. Set **Custom Intent** name: `BookRideIntent`
3. Add **Parameters**:
   - `destination` (String, optional)
   - `provider` (String, optional, default: "any")
4. Set **Shortcut Types**: "As a Phrase That Runs"
5. Add **Suggested Phrases**:
   - "Book me a ride"
   - "Get me an Uber"
   - "Call a Lyft"

#### **Intent 2: Order Food**

1. Add new intent: `OrderFoodIntent`
2. Parameters:
   - `restaurant` (String, optional)
   - `reorder` (Boolean, default: true)
3. Suggested Phrases:
   - "Order food"
   - "Order my usual"
   - "Get me dinner"

#### **Intent 3: Log Workout**

1. Add new intent: `LogWorkoutIntent`
2. Parameters:
   - `type` (String, optional)
   - `duration` (Integer, optional)
3. Suggested Phrases:
   - "I finished my workout"
   - "Log my workout"
   - "Done working out"

#### **Intent 4: Make Reservation**

1. Add new intent: `MakeReservationIntent`
2. Parameters:
   - `restaurant` (String, required)
   - `time` (Date, optional)
   - `partySize` (Integer, default: 2)
3. Suggested Phrases:
   - "Make a dinner reservation"
   - "Book a table"
   - "Reserve a restaurant"

#### **Intent 5: Daily Summary**

1. Add new intent: `DailySummaryIntent`
2. No parameters
3. Suggested Phrases:
   - "What's my day look like"
   - "Give me my daily summary"
   - "What's on my schedule"

#### **Intent 6: Check Recovery**

1. Add new intent: `CheckRecoveryIntent`
2. No parameters
3. Suggested Phrases:
   - "How's my recovery"
   - "Check my HRV"
   - "Am I recovered"

### **Step 8: Add Intent Handler Code**

1. Copy `PhoenixIntentHandler.swift` to PhoenixIntents folder
2. Replace the default `IntentHandler.swift` with our code
3. Make sure it's added to PhoenixIntents target

### **Step 9: Add Intent Definition to Main App**

1. Select `PhoenixIntents.intentdefinition`
2. In **Target Membership** (right sidebar):
   - ✅ Check **App target**
   - ✅ Check **PhoenixIntents target**

This allows both the app and extension to access the intents.

### **Step 10: Update Info.plist**

In the main app's `Info.plist`, add:

```xml
<key>NSSiriUsageDescription</key>
<string>Phoenix needs Siri access to execute voice commands for booking rides, ordering food, logging workouts, and managing your schedule.</string>

<key>NSUserActivityTypes</key>
<array>
    <string>BookRideIntent</string>
    <string>OrderFoodIntent</string>
    <string>LogWorkoutIntent</string>
    <string>MakeReservationIntent</string>
    <string>DailySummaryIntent</string>
    <string>CheckRecoveryIntent</string>
</array>
```

### **Step 11: Add JavaScript Integration**

In your main app code (dashboard.html or app initialization):

```javascript
// Import Siri Shortcuts module
import siriShortcuts from './src/siri-shortcuts.js';

// Request Siri authorization on first launch
async function initializeSiri() {
  if (siriShortcuts.isAvailable) {
    const authorized = await siriShortcuts.requestAuthorization();

    if (authorized) {
      // Register common shortcuts
      await siriShortcuts.registerCommonShortcuts();
      console.log('✅ Siri Shortcuts initialized');
    }
  }
}

// Call on app load
initializeSiri();

// Donate shortcuts after user actions (helps Siri learn)
async function onRideBooked(destination) {
  await siriShortcuts.donateAfterAction('book-ride', { destination });
}

async function onFoodOrdered(restaurant) {
  await siriShortcuts.donateAfterAction('order-food', { restaurant });
}

async function onWorkoutLogged(type, duration) {
  await siriShortcuts.donateAfterAction('log-workout', { type, duration });
}
```

### **Step 12: Add "Add to Siri" Buttons (Optional)**

In your settings page:

```html
<button onclick="siriShortcuts.presentAddToSiri('phoenix-book-ride')">
  Add "Book Ride" to Siri
</button>

<button onclick="siriShortcuts.presentAddToSiri('phoenix-order-food')">
  Add "Order Food" to Siri
</button>

<button onclick="siriShortcuts.presentAddToSiri('phoenix-log-workout')">
  Add "Log Workout" to Siri
</button>
```

### **Step 13: Build and Test**

1. Connect iPhone to Mac
2. Select your device in Xcode
3. Click **Run** (⌘R)
4. On device:
   - Open Phoenix app
   - Grant Siri permission when prompted
   - Try: **"Hey Siri, Phoenix book me a ride"**

---

## 🧪 Testing Checklist:

- [ ] Siri permission granted
- [ ] "Hey Siri, Phoenix book me a ride" → Opens Phoenix or executes
- [ ] "Hey Siri, Phoenix order food" → Works
- [ ] "Hey Siri, Phoenix I finished my workout" → Logs workout
- [ ] "Hey Siri, what's my day look like" → Gets daily summary
- [ ] Shortcuts appear in iOS Settings → Siri & Search
- [ ] Donated shortcuts learn from usage

---

## 📱 User Experience:

### **First Time:**
```
User: "Hey Siri, Phoenix book me a ride"
Siri: "I'll need to get some information from Phoenix first..."
→ Opens Phoenix app to complete action
```

### **After Donation:**
```
User: "Hey Siri, Phoenix book me a ride"
Siri: "Booking your ride to work..." (without opening app!)
→ Phoenix executes in background
→ Push notification: "Uber driver arriving in 5 min"
```

---

## 🎯 Best Practices:

1. **Donate Shortcuts After Actions**
   - Every time user books a ride manually, donate the shortcut
   - Helps Siri learn user patterns
   - Shortcuts appear in Siri Suggestions

2. **Use Short, Natural Phrases**
   - ✅ "Phoenix, book a ride"
   - ❌ "Use Phoenix to initiate ride booking"

3. **Handle Errors Gracefully**
   - If no auth token, redirect to login
   - If API fails, show helpful message
   - Always provide feedback

4. **Personalize Suggestions**
   - If user orders from same restaurant often, suggest that
   - If user books rides at same time, predict destination

---

## 🔐 Security:

**Authentication:**
- Store JWT token in iOS Keychain (see `PhoenixIntentHandler.swift`)
- Intent extension reads token from Keychain
- All API calls include Bearer token

**Privacy:**
- User data stays on device
- Only intent parameters sent to Phoenix API
- Siri doesn't store voice recordings (unless user opts in)

---

## 📊 Analytics:

Track Siri usage:

```javascript
// In backend API
exports.logSiriUsage = async (req, res) => {
  const { intent, parameters } = req.body;

  await Analytics.track({
    userId: req.user.id,
    event: 'siri_shortcut_used',
    properties: {
      intent,
      parameters,
      timestamp: new Date()
    }
  });
};
```

---

## 🐛 Troubleshooting:

**"Siri doesn't recognize my command"**
→ Make sure suggested phrases are added in intentdefinition

**"Shortcut opens app but doesn't execute"**
→ Check intent handler is receiving the intent

**"Authorization denied"**
→ Delete app, reinstall, grant permissions again

**"Intent not found"**
→ Clean build folder (⌘⇧K) and rebuild

---

## 🚀 Next Steps:

1. **Proactive Suggestions:**
   - Siri learns user patterns
   - Suggests "Book ride to gym" at 5pm daily

2. **Shortcuts App Integration:**
   - Users can create custom Siri workflows
   - "When I leave work, book a ride home"

3. **CarPlay Integration:**
   - "Book a ride" available while driving

4. **Apple Watch:**
   - Siri shortcuts work on Watch
   - "Hey Siri, Phoenix check my recovery"

---

## 🎉 Expected Results:

After setup, users can:

✅ Trigger Phoenix from anywhere (home screen, lock screen, CarPlay)
✅ Execute commands without opening app
✅ Create custom Siri workflows in Shortcuts app
✅ Get proactive suggestions from Siri
✅ Faster than opening app (2 seconds vs 10 seconds)

**This makes Phoenix the ultimate hands-free AI assistant!** 🔥

---

## 📚 Resources:

- [Apple SiriKit Documentation](https://developer.apple.com/documentation/sirikit)
- [Capacitor Siri Shortcuts Plugin](https://github.com/capacitor-community/siri-shortcuts)
- [Creating Custom Intents](https://developer.apple.com/documentation/sirikit/creating_custom_intents)

---

**Need help?** Review the files:
- `siri-shortcuts-config.json` - Shortcut definitions
- `PhoenixIntentHandler.swift` - iOS intent handlers
- `src/siri-shortcuts.js` - JavaScript bridge

**Ready to ship!** 🚀
