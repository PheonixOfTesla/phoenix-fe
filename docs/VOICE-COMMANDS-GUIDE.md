# Phoenix Voice Commands Guide

Complete voice control system for the entire Phoenix dashboard. Natural language interface for navigation, data manipulation, logging, and tracking.

## How It Works

1. **Click the center Phoenix orb** to start voice command
2. **Orb animates** to show listening state (pulsing atoms)
3. **Speak your command** naturally
4. **Orb shows thinking** state (processing buffer)
5. **Phoenix responds** and orb shows speaking state (voice pulse)
6. **Action executes** automatically

## Visual States (Siri-like)

- **IDLE**: Subtle breathing animation
- **LISTENING**: Pulsing atoms/particles, enhanced glow
- **THINKING**: Processing buffer, rotating particles
- **SPEAKING**: Voice pulse animation, wave effects

## Navigation Commands

Go anywhere in Phoenix with natural language:

### Planet Navigation
- "Open Mercury" / "Show health" / "Go to biometrics"
- "Open Venus" / "Show fitness" / "Take me to nutrition"
- "Open Earth" / "Show calendar" / "Go to schedule"
- "Open Mars" / "Show goals" / "Take me to habits"
- "Open Jupiter" / "Show finance" / "Go to budget"
- "Open Saturn" / "Show social" / "Take me to relationships"
- "Go to dashboard" / "Take me home"

### Examples
- "Hey Phoenix, open my health dashboard"
- "Show me my fitness plan"
- "Navigate to my calendar"
- "Take me to my goals"
- "Go to my finances"

## View Commands

Pull up specific data on current page:

### Today's Information
- "Show me my day" / "What's my schedule today?"
- "Tell me about today"

### Health Metrics
- "Show me my health metrics"
- "What's my HRV?"
- "Display my recovery score"

### Finance Overview
- "Show me my finances"
- "What's my spending?"
- "Display my budget"

### Goals & Progress
- "Show me my goals"
- "What's my progress?"
- "Tell me about my habits"

### Workout Plan
- "Show me my workout"
- "What's my exercise plan?"

## Data Manipulation Commands

Control what's visible on screen:

### Hide/Close
- "Hide health information"
- "Close all panels"
- "Dismiss everything"
- "Push health away"
- "Remove finance panel"

### Replace/Swap
- "Replace health with finance"
- "Swap fitness with calendar"
- "Switch health with goals"

### Examples
- "Hey Phoenix, push health stuff away and show me my finances"
- "Replace my workout plan with my budget"
- "Close all menus"

## Logging & Tracking Commands

Voice makes it easy to log and track anything:

### Workout Logging
- "Log workout: 30 minutes running"
- "Track exercise: bench press 185 pounds"
- "Add workout: leg day completed"

### Meal Logging
- "Log meal: chicken and rice"
- "Track food: protein shake"
- "I ate a salad for lunch"

### Water Tracking
- "Log water: 16 ounces"
- "Track water intake"
- "I drank 2 glasses of water"

### Sleep Logging
- "Log sleep: 7 hours last night"
- "Track sleep: woke up at 7am"

### Mood Tracking
- "Log mood: feeling energized"
- "Track mood: stressed today"
- "I'm feeling great"

### Expense Tracking
- "Log expense: 15 dollars for lunch"
- "Track spending: 50 bucks on groceries"
- "I spent 30 dollars on gas"

### Examples
- "Log workout: hit the gym for 45 minutes"
- "Track meal: oatmeal and eggs for breakfast"
- "I drank 32 ounces of water"
- "Log expense: 12 dollars for coffee"

## Mode Switching

Change interface modes by voice:

- "Switch to voice mode"
- "Change to manual mode"
- "Go to voice mode"

## Sync Commands

Refresh and update all data:

- "Sync all my data"
- "Refresh everything"
- "Update my information"

## AI Conversation Fallback

If Phoenix doesn't recognize a command, it falls back to AI conversation:

- "What should I eat today?"
- "When is my next meeting?"
- "How am I doing on my goals?"
- "Give me advice on my sleep"
- "Analyze my spending patterns"

## Natural Language Processing

Phoenix understands variations and natural speech:

### Flexible Phrasing
- "Open Mercury" = "Go to Mercury" = "Show health" = "Take me to biometrics"
- "Log workout" = "Track exercise" = "Add workout"
- "Hide health" = "Close health" = "Push health away" = "Remove health"

### Context Awareness
Phoenix knows what page you're on and adapts responses accordingly.

## Example Workflows

### Morning Check-in
1. Click orb
2. "Show me my day"
3. "What's my recovery score?"
4. "Log mood: feeling great"

### Quick Logging
1. Click orb
2. "Log workout: 30 minute run"
3. "Track water: 16 ounces"
4. "I ate eggs and toast"

### Finance Review
1. Click orb
2. "Push health away"
3. "Show me my finances"
4. "What's my spending this week?"

### Goal Check
1. Click orb
2. "Show me my goals"
3. "What's my progress?"
4. "Open my habit tracker"

## Technical Details

### Speech Recognition
- Uses Web Speech API
- Continuous listening mode
- Interim results for real-time feedback
- Multiple alternatives for accuracy

### Natural Language Parsing
- Pattern matching for common commands
- Context-aware routing
- AI fallback for complex queries
- Support for variations and synonyms

### Visual Feedback
- Listening: Pulsing particles, enhanced glow
- Thinking: Rotating buffer, color shift
- Speaking: Voice pulse, wave animations
- Smooth transitions between states

### Performance
- GPU-accelerated animations
- Reduced motion support for accessibility
- Battery optimization in manual mode
- Wake word detection integration

## Voice Mode Benefits

### Convenience
- Hands-free operation
- No need to navigate menus
- Natural interaction
- Quick logging and tracking

### Speed
- Faster than typing
- Instant navigation
- Rapid data entry
- Voice is faster than clicking

### Simplicity
- Clean interface (just the orb)
- No visual clutter
- Focus on what matters
- Voice-first experience

## Integration

### Works With
- All 6 planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn)
- Dashboard overview
- Optimization hub
- All tracking systems
- Butler services (voice booking coming soon)

### Backend API
- Automatic logging to appropriate endpoints
- Real-time sync
- Context-aware responses
- Full authentication support

## Future Enhancements

Coming soon:
- Wake word detection ("Hey Phoenix")
- Multi-language support
- Voice authentication
- Custom command shortcuts
- Voice-to-voice conversations
- Proactive suggestions
- Context prediction
- Smart interruption handling

## Troubleshooting

### Microphone Access
If voice commands don't work, check:
1. Browser microphone permissions
2. System microphone settings
3. No other app is using the mic

### Recognition Issues
If commands aren't recognized:
1. Speak clearly and naturally
2. Reduce background noise
3. Try rephrasing the command
4. Check browser console for errors

### No Visual Feedback
If orb doesn't animate:
1. Check browser CSS support
2. Disable "reduce motion" in accessibility settings
3. Try refreshing the page

## Best Practices

### Speaking Tips
- Speak naturally, not like a robot
- Pause slightly between command and details
- Use full sentences for complex commands
- Be specific with numbers and dates

### Command Structure
- Start with action verb (show, open, log, track)
- Include target (planet, data type, metric)
- Add details after colon or "with"

### Examples of Good Commands
- "Log workout: ran 3 miles in 25 minutes"
- "Open Jupiter and show my spending"
- "Replace health panel with finance overview"

### Examples to Avoid
- "Uh, like, maybe show... health?" (too uncertain)
- "workoutlogrun" (speak naturally, not concatenated)
- Mumbling or trailing off

## Privacy & Security

- Voice data processed locally when possible
- Transcripts sent to backend with authentication
- No voice recordings stored
- All data encrypted in transit
- Full GDPR compliance

## Accessibility

- Voice control for hands-free operation
- Reduced motion support
- Screen reader compatible
- Keyboard shortcuts as backup (V/M keys)
- Visual and audio feedback

## Summary

Phoenix voice commands transform your dashboard into a natural language interface. Just talk to it like you would a personal assistant. The system is smart enough to understand variations, context, and intent. Whether you're logging a workout, checking your schedule, or navigating to different sections, voice makes it faster, easier, and more intuitive than traditional UI interaction.

The future of interfaces isn't clicking buttons - it's having conversations.
