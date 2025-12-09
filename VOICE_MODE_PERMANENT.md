# VOICE MODE - PERMANENT CONFIGURATION

## DO NOT MODIFY WITHOUT UNDERSTANDING CONSEQUENCES

This file documents the critical CSS configuration that ensures Phoenix loads in clean voice-only mode.

## Critical File: `www/dashboard.html`

### Lines 480-527: Voice Mode CSS (DO NOT MODIFY)

```css
/* HIDE by default (prevents flash of dashboard content) */
#dashboard-content,
#quick-actions-orb,
#settings-orb,
#quick-actions-menu,
#settings-menu,
#jarvis-quick-menu,
.planet-nav,
.sidebar,
#planet-nav-tab,
#planet-selection-panel,
#hud-tl,
#hud-bl,
button[onclick="window.history.back()"] {
    display: none !important;
}
```

### Why This Matters:
- **Default state is VOICE mode** - All UI elements are HIDDEN by default
- Elements only show when `body[data-mode="manual"]` or `body[data-mode="desk"]` is set
- This prevents "flash of unwanted content" when app loads
- Ensures clean Siri-like interface on iOS

## Elements Hidden in Voice Mode:

| Element | Description |
|---------|-------------|
| `#dashboard-content` | Main dashboard panels |
| `#quick-actions-orb` | Lightning bolt icon |
| `#settings-orb` | DNA helix icon |
| `#planet-nav-tab` | PLANETS sidebar button |
| `#planet-selection-panel` | Planet selection menu |
| `#hud-tl` | TIME/DATE/WEATHER/LOCATION panel (top-left) |
| `#hud-bl` | SYSTEM STATUS panel (bottom-left) |
| `button[onclick="window.history.back()"]` | BACK button |

## Elements Visible in Voice Mode:

| Element | Description |
|---------|-------------|
| Phoenix orb | Center orb (animated particles) |
| Mode tabs | VOICE/MANUAL/DESK selector |
| Optimization badge | Bottom-right 0% indicator |

## Git Protection:

This configuration is committed to:
- Commit: `d882504` - "🎯 VOICE MODE - Clean Interface (PERMANENT FIX)"
- Branch: `main`
- Remote: `github.com/PheonixOfTesla/phoenix-fe`

## If UI Breaks:

1. Check `body[data-mode]` attribute in dashboard.html line 19
2. Verify CSS rules lines 480-527 are intact
3. Ensure `data-mode="voice"` is set on load (line 54)
4. Check that `npx cap copy ios` was run after changes

## Emergency Restore:

```bash
git checkout d882504 -- www/dashboard.html
git checkout d882504 -- www/phoenix-voice-commands.js
npx cap copy ios
```

---

**Last Updated:** December 8, 2024
**Commit Hash:** d882504
**Status:** PRODUCTION READY ✅
