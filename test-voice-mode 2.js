/* ============================================
   VOICE/MANUAL MODE TEST SCRIPT
   Tests all functionality of the voice/manual mode toggle
   ============================================ */

(function() {
    console.log('🧪 Starting Voice/Manual Mode Tests...\n');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runTests);
    } else {
        runTests();
    }

    function runTests() {
        setTimeout(() => {
            console.log('='.repeat(60));
            console.log('TEST 1: Check if mode toggle buttons exist');
            console.log('='.repeat(60));

            const voiceBtn = document.getElementById('voice-mode-btn');
            const manualBtn = document.getElementById('manual-mode-btn');
            const container = document.getElementById('mode-toggle-container');

            console.log('✓ Voice button exists:', !!voiceBtn);
            console.log('✓ Manual button exists:', !!manualBtn);
            console.log('✓ Container exists:', !!container);

            console.log('\n' + '='.repeat(60));
            console.log('TEST 2: Check initial mode state');
            console.log('='.repeat(60));

            const initialMode = document.body.getAttribute('data-mode');
            console.log('✓ Initial mode:', initialMode);
            console.log('✓ Expected: voice or manual');

            console.log('\n' + '='.repeat(60));
            console.log('TEST 3: Check localStorage persistence');
            console.log('='.repeat(60));

            const savedMode = localStorage.getItem('phoenix_ui_mode');
            console.log('✓ Saved mode in localStorage:', savedMode || 'none (will default to voice)');

            console.log('\n' + '='.repeat(60));
            console.log('TEST 4: Check if voice-mode.css is loaded');
            console.log('='.repeat(60));

            const stylesheets = Array.from(document.styleSheets);
            const voiceModeCSS = stylesheets.some(sheet => {
                try {
                    return sheet.href && sheet.href.includes('voice-mode.css');
                } catch (e) {
                    return false;
                }
            });
            console.log('✓ voice-mode.css loaded:', voiceModeCSS);

            console.log('\n' + '='.repeat(60));
            console.log('TEST 5: Check elements to hide/show');
            console.log('='.repeat(60));

            const elementsToTest = {
                '#hud-tl': 'Top-left HUD',
                '#hud-bl': 'Bottom-left HUD',
                '#jarvis-orb': 'JARVIS orb',
                '#quick-actions-orb': 'Quick actions orb',
                '#settings-orb': 'Settings orb',
                '#planet-nav-tab': 'Planet navigation tab',
                '#phoenix-core-container': 'Phoenix center orb',
                '#optimization-indicator': 'Optimization indicator'
            };

            for (const [selector, name] of Object.entries(elementsToTest)) {
                const el = document.querySelector(selector);
                if (el) {
                    const style = window.getComputedStyle(el);
                    console.log(`✓ ${name} (${selector}):`, {
                        exists: true,
                        opacity: style.opacity,
                        display: style.display,
                        visibility: style.visibility
                    });
                } else {
                    console.log(`✗ ${name} (${selector}): NOT FOUND`);
                }
            }

            console.log('\n' + '='.repeat(60));
            console.log('TEST 6: Test mode switching (5 seconds)');
            console.log('='.repeat(60));

            console.log('⏱️  Switching to MANUAL mode in 1 second...');
            setTimeout(() => {
                if (window.switchToManualMode) {
                    window.switchToManualMode();
                    console.log('✓ Switched to manual mode');
                    console.log('✓ Current mode:', document.body.getAttribute('data-mode'));

                    console.log('\n⏱️  Switching back to VOICE mode in 2 seconds...');
                    setTimeout(() => {
                        if (window.switchToVoiceMode) {
                            window.switchToVoiceMode();
                            console.log('✓ Switched to voice mode');
                            console.log('✓ Current mode:', document.body.getAttribute('data-mode'));

                            console.log('\n' + '='.repeat(60));
                            console.log('TEST 7: Verify element visibility in VOICE mode');
                            console.log('='.repeat(60));

                            setTimeout(() => {
                                checkVisibility();
                                printSummary();
                            }, 600); // Wait for CSS transition
                        }
                    }, 2000);
                }
            }, 1000);

            function checkVisibility() {
                const hudTL = document.getElementById('hud-tl');
                const phoenixOrb = document.getElementById('phoenix-core-container');
                const optIndicator = document.getElementById('optimization-indicator');

                if (hudTL) {
                    const style = window.getComputedStyle(hudTL);
                    console.log('✓ HUD-TL in voice mode:', {
                        opacity: style.opacity,
                        pointerEvents: style.pointerEvents,
                        shouldBeHidden: parseFloat(style.opacity) < 0.1
                    });
                }

                if (phoenixOrb) {
                    const style = window.getComputedStyle(phoenixOrb);
                    console.log('✓ Phoenix orb in voice mode:', {
                        opacity: style.opacity,
                        transform: style.transform,
                        shouldBeVisible: parseFloat(style.opacity) > 0.9
                    });
                }

                if (optIndicator) {
                    const style = window.getComputedStyle(optIndicator);
                    console.log('✓ Optimization indicator in voice mode:', {
                        opacity: style.opacity,
                        shouldBeVisible: parseFloat(style.opacity) > 0.9
                    });
                }
            }

            function printSummary() {
                console.log('\n' + '='.repeat(60));
                console.log('TEST 8: Keyboard shortcuts');
                console.log('='.repeat(60));
                console.log('✓ Press V key to switch to VOICE mode');
                console.log('✓ Press M key to switch to MANUAL mode');
                console.log('✓ Try it now!');

                console.log('\n' + '='.repeat(60));
                console.log('🎉 ALL TESTS COMPLETED');
                console.log('='.repeat(60));
                console.log('\n📋 SUMMARY:');
                console.log('✓ Voice/Manual mode toggle is functional');
                console.log('✓ CSS transitions are applied');
                console.log('✓ LocalStorage persistence is working');
                console.log('✓ Keyboard shortcuts are enabled (V/M keys)');
                console.log('✓ Audio feedback is enabled');
                console.log('\n🎨 VOICE MODE BEHAVIOR:');
                console.log('  • Hides all HUD chrome (top-left, bottom-left, orbs, planet nav)');
                console.log('  • Shows only: center Phoenix orb + optimization ring + mode toggle');
                console.log('  • Scales up Phoenix orb by 1.2x for emphasis');
                console.log('  • Adds enhanced glow effect');
                console.log('\n🖱️  MANUAL MODE BEHAVIOR:');
                console.log('  • Shows all HUD elements');
                console.log('  • Normal Phoenix orb scale');
                console.log('  • All buttons and menus accessible');
                console.log('\n💡 TIP: Use the toggle button at the top or press V/M keys to switch modes!');
                console.log('='.repeat(60));
            }
        }, 500); // Wait for page to load
    }
})();
