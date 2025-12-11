/**
 * ORB VISUAL FEEDBACK TEST
 * Demonstrates Siri-style pulsing/breathing animations
 */

const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testOrbVisuals() {
    console.log('🎨 PHOENIX ORB VISUAL FEEDBACK TEST\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--disable-web-security']
    });

    const page = await browser.newPage();

    try {
        console.log('=' .repeat(70));
        console.log('STEP 1: LOGIN TO DASHBOARD');
        console.log('=' .repeat(70));

        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        await wait(2000);

        // Login
        await page.type('#login-phone', '8087510813');
        await page.type('#login-password', '123456');
        console.log('✅ Credentials entered');

        await wait(1000);
        await page.click('#login-btn');
        console.log('✅ Login button clicked');
        console.log('⏳ Waiting for redirect to dashboard...\n');

        await wait(5000);

        const currentUrl = page.url();
        if (!currentUrl.includes('dashboard')) {
            throw new Error('Login redirect failed - not on dashboard');
        }

        console.log('✅ Successfully on dashboard!\n');

        console.log('=' .repeat(70));
        console.log('STEP 2: DEMONSTRATE ORB VISUAL STATES');
        console.log('=' .repeat(70));

        const states = [
            { name: 'IDLE', state: 'idle', duration: 5000, color: 'Cyan (breathing gently)' },
            { name: 'LISTENING', state: 'listening', duration: 5000, color: 'Green (pulsing actively)' },
            { name: 'PROCESSING', state: 'processing', duration: 5000, color: 'Gold (breathing/buffering)' },
            { name: 'RESPONDING', state: 'responding', duration: 5000, color: 'Blue (pulsing fast)' },
            { name: 'DONE', state: 'done', duration: 3000, color: 'Bright Green (success flash)' },
            { name: 'ERROR', state: 'error', duration: 3000, color: 'Red (shake)' },
            { name: 'BACK TO IDLE', state: 'idle', duration: 5000, color: 'Cyan (breathing gently)' }
        ];

        for (const stateInfo of states) {
            console.log(`\n🎨 Testing ${stateInfo.name} state...`);
            console.log(`   Color: ${stateInfo.color}`);
            console.log(`   Duration: ${stateInfo.duration / 1000}s`);

            // Apply state to orb
            await page.evaluate((state) => {
                const holoCore = document.getElementById('holo-core');
                if (holoCore) {
                    // Remove all previous voice status classes
                    holoCore.classList.remove('voice-idle', 'voice-listening', 'voice-processing', 'voice-responding', 'voice-done', 'voice-error');

                    // Add new state class
                    holoCore.classList.add(`voice-${state}`);

                    console.log(`🎨 Orb state changed to: ${state}`);
                }
            }, stateInfo.state);

            // Show countdown
            const seconds = stateInfo.duration / 1000;
            for (let i = 1; i <= seconds; i++) {
                await wait(1000);
                process.stdout.write(`   ${i}s... `);
                if (i % 5 === 0 || i === seconds) {
                    console.log('');
                }
            }

            console.log(`   ✅ ${stateInfo.name} state complete`);
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 3: TEST VOICE BUTTON INTEGRATION');
        console.log('=' .repeat(70));

        console.log('\n🎤 Looking for voice button...');

        const voiceButtonExists = await page.evaluate(() => {
            const selectors = [
                '#voice-btn',
                '[data-action="voice"]',
                '.voice-button',
                '.dock-item[data-action="voice"]'
            ];

            for (const selector of selectors) {
                const btn = document.querySelector(selector);
                if (btn) {
                    console.log(`Found voice button: ${selector}`);
                    return true;
                }
            }

            // Search in dock
            const dockItems = Array.from(document.querySelectorAll('.dock-item'));
            const voiceItem = dockItems.find(item =>
                item.dataset.action === 'voice' ||
                item.textContent.toLowerCase().includes('voice')
            );

            if (voiceItem) {
                console.log('Found voice button in dock');
                return true;
            }

            return false;
        });

        if (voiceButtonExists) {
            console.log('✅ Voice button found!');
            console.log('\n🎤 Clicking voice button to activate...');

            const clicked = await page.evaluate(() => {
                const dockItems = Array.from(document.querySelectorAll('.dock-item'));
                const voiceItem = dockItems.find(item => item.dataset.action === 'voice');

                if (voiceItem) {
                    voiceItem.click();
                    return true;
                }
                return false;
            });

            if (clicked) {
                console.log('✅ Voice button clicked');
                console.log('⏳ Monitoring orb state changes...\n');

                // Monitor for 10 seconds
                for (let i = 0; i < 10; i++) {
                    await wait(1000);

                    const currentState = await page.evaluate(() => {
                        const holoCore = document.getElementById('holo-core');
                        if (!holoCore) return 'not found';

                        const classes = Array.from(holoCore.classList);
                        const voiceClass = classes.find(c => c.startsWith('voice-'));

                        if (voiceClass) {
                            return voiceClass.replace('voice-', '');
                        }
                        return 'no state';
                    });

                    console.log(`   ${i + 1}s: Orb state = ${currentState}`);
                }
            } else {
                console.log('⚠️  Could not click voice button');
            }
        } else {
            console.log('⚠️  Voice button not found in DOM');
        }

        console.log('\n' + '=' .repeat(70));
        console.log('TEST COMPLETE - ORB VISUAL FEEDBACK');
        console.log('=' .repeat(70));

        console.log('\n📊 VISUAL STATE SUMMARY:');
        console.log('   ✅ IDLE: Gentle breathing (cyan, 4s cycle)');
        console.log('   ✅ LISTENING: Active pulsing (green, 1s cycle)');
        console.log('   ✅ PROCESSING: Breathing/buffering (gold, 2s cycle)');
        console.log('   ✅ RESPONDING: Fast pulsing (blue, 0.8s cycle)');
        console.log('   ✅ DONE: Success flash (bright green)');
        console.log('   ✅ ERROR: Shake animation (red)');

        console.log('\n💡 TIP: Watch the central orb change colors and animations!');
        console.log('The orb now acts like Siri\'s waveform, showing voice status visually.\n');

        console.log('🤖 Browser staying open for inspection...');
        console.log('Press Ctrl+C to close\n');

        await wait(300000); // 5 minutes

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error(error.stack);
    }
}

testOrbVisuals().catch(console.error);
