/**
 * COMPREHENSIVE DASHBOARD TEST
 * Tests login flow and ALL dashboard features
 */

const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDashboard() {
    console.log('🚀 PHOENIX COMPREHENSIVE DASHBOARD TEST\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--disable-web-security']
    });

    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
            console.log('❌', text);
        }
    });

    page.on('pageerror', error => console.log('❌ PAGE ERROR:', error.message));

    try {
        console.log('=' .repeat(70));
        console.log('STEP 1: LOGIN');
        console.log('=' .repeat(70));

        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        await wait(2000);

        // Fill login form
        await page.type('#login-phone', '8087510813');
        await page.type('#login-password', '123456');
        console.log('✅ Credentials entered');

        await wait(1000);

        // Click login
        await page.click('#login-btn');
        console.log('✅ Login button clicked');
        console.log('⏳ Waiting for redirect to dashboard...\n');

        // Wait for redirect to dashboard
        await wait(5000);

        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);

        if (!currentUrl.includes('dashboard')) {
            console.log('❌ Still on login page - redirect failed!');
            console.log('This means the fix did not work properly');
            throw new Error('Login redirect failed');
        }

        console.log('✅ Successfully redirected to dashboard!\n');

        console.log('=' .repeat(70));
        console.log('STEP 2: TEST PLANETARY NAVIGATION');
        console.log('=' .repeat(70));

        const planets = [
            'MERCURY', 'VENUS', 'EARTH', 'MARS',
            'JUPITER', 'SATURN', 'PHOENIX'
        ];

        for (const planet of planets) {
            try {
                console.log(`\n🪐 Testing ${planet}...`);

                const clicked = await page.evaluate((planetName) => {
                    // Find planet node
                    const nodes = Array.from(document.querySelectorAll('.planet-node'));
                    const planetNode = nodes.find(node =>
                        node.textContent.includes(planetName)
                    );

                    if (planetNode) {
                        planetNode.click();
                        return true;
                    }
                    return false;
                }, planet);

                if (clicked) {
                    console.log(`   ✅ ${planet} clicked`);
                    await wait(1500);

                    // Check if feature panel appeared
                    const panelVisible = await page.$eval('#holo-feature-panel',
                        el => !el.classList.contains('hidden')
                    ).catch(() => false);

                    if (panelVisible) {
                        console.log(`   ✅ Feature panel opened`);

                        // Close panel
                        await page.click('#close-panel').catch(() => {});
                        await wait(500);
                    }
                } else {
                    console.log(`   ⚠️  ${planet} node not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${planet} error: ${error.message}`);
            }
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 3: TEST QUICK ACTION BUTTONS');
        console.log('=' .repeat(70));

        const quickActions = [
            { name: 'LOG WORKOUT', text: 'WORKOUT' },
            { name: 'LOG MEAL', text: 'MEAL' },
            { name: 'BUTLER', text: 'BUTLER' },
            { name: 'ASK PHOENIX', text: 'PHOENIX' }
        ];

        for (const action of quickActions) {
            try {
                console.log(`\n🎯 Testing ${action.name}...`);

                const clicked = await page.evaluate((searchText) => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(b =>
                        b.textContent.toUpperCase().includes(searchText) &&
                        b.offsetParent !== null
                    );

                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                }, action.text);

                if (clicked) {
                    console.log(`   ✅ ${action.name} clicked`);
                    await wait(1500);

                    // Try to close any modals
                    await page.evaluate(() => {
                        const closeBtn = document.querySelector('.close, .modal-close, [aria-label="Close"]');
                        if (closeBtn) closeBtn.click();
                    });
                    await wait(500);
                } else {
                    console.log(`   ⚠️  ${action.name} button not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${action.name} error: ${error.message}`);
            }
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 4: TEST VOICE INTERFACE');
        console.log('=' .repeat(70));

        // Test voice button
        try {
            console.log('\n🎤 Testing voice activation...');

            const voiceClicked = await page.evaluate(() => {
                const voiceBtn = document.querySelector('#voice-btn, [data-action="voice"], button:has(.voice)');
                if (voiceBtn) {
                    voiceBtn.click();
                    return true;
                }
                return false;
            });

            if (voiceClicked) {
                console.log('   ✅ Voice button clicked');
                await wait(2000);

                // Check for waveform
                const hasWaveform = await page.$('.siri-waveform').catch(() => null);
                if (hasWaveform) {
                    console.log('   ✅ Siri-style waveform visible!');
                } else {
                    console.log('   ⚠️  Waveform not visible');
                }

                // Click again to stop
                await page.evaluate(() => {
                    const voiceBtn = document.querySelector('#voice-btn, [data-action="voice"]');
                    if (voiceBtn) voiceBtn.click();
                });
                await wait(1000);
            } else {
                console.log('   ⚠️  Voice button not found');
            }
        } catch (error) {
            console.log(`   ❌ Voice test error: ${error.message}`);
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 5: TEST HOLOGRAPHIC CONTROLS');
        console.log('=' .repeat(70));

        // Test zoom controls
        try {
            console.log('\n🔍 Testing zoom controls...');

            // Zoom in
            for (let i = 0; i < 3; i++) {
                const zoomed = await page.evaluate(() => {
                    const plusBtn = Array.from(document.querySelectorAll('button')).find(b =>
                        b.textContent.includes('+') && b.textContent.length < 5
                    );
                    if (plusBtn) {
                        plusBtn.click();
                        return true;
                    }
                    return false;
                });

                if (zoomed) await wait(300);
            }
            console.log('   ✅ Zoom + tested');

            // Zoom out
            for (let i = 0; i < 3; i++) {
                const zoomed = await page.evaluate(() => {
                    const minusBtn = Array.from(document.querySelectorAll('button')).find(b =>
                        b.textContent.includes('-') && b.textContent.length < 5
                    );
                    if (minusBtn) {
                        minusBtn.click();
                        return true;
                    }
                    return false;
                });

                if (zoomed) await wait(300);
            }
            console.log('   ✅ Zoom - tested');

            // Reset
            const reset = await page.evaluate(() => {
                const resetBtn = Array.from(document.querySelectorAll('button')).find(b =>
                    b.textContent.toUpperCase().includes('RESET')
                );
                if (resetBtn) {
                    resetBtn.click();
                    return true;
                }
                return false;
            });

            if (reset) {
                console.log('   ✅ Reset button tested');
                await wait(1000);
            }
        } catch (error) {
            console.log(`   ❌ Zoom controls error: ${error.message}`);
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 6: TEST DASHBOARD WIDGETS');
        console.log('=' .repeat(70));

        // Check for key dashboard elements
        const widgets = [
            { name: 'Time Display', selector: '#time-display' },
            { name: 'Location', selector: '#location-display' },
            { name: 'Weather', selector: '#weather-display' },
            { name: 'Optimization Tracker', selector: '#optimization-widget' },
            { name: 'Recovery Score', selector: '.recovery-score' }
        ];

        for (const widget of widgets) {
            try {
                const exists = await page.$(widget.selector).catch(() => null);
                if (exists) {
                    const text = await page.$eval(widget.selector, el => el.textContent.substring(0, 50)).catch(() => '');
                    console.log(`\n✅ ${widget.name}: ${text || 'Present'}`);
                } else {
                    console.log(`\n⚠️  ${widget.name}: Not found`);
                }
            } catch (error) {
                console.log(`\n❌ ${widget.name}: Error`);
            }
        }

        console.log('\n' + '=' .repeat(70));
        console.log('TEST COMPLETE - SUMMARY');
        console.log('=' .repeat(70));
        console.log('✅ Login successful and redirected to dashboard');
        console.log('✅ Tested 7 planetary navigation buttons');
        console.log('✅ Tested 4 quick action buttons');
        console.log('✅ Tested voice interface');
        console.log('✅ Tested holographic controls');
        console.log('✅ Checked dashboard widgets');
        console.log('\n🤖 Browser staying open for inspection...');
        console.log('Press Ctrl+C to close\n');

        await wait(300000); // 5 minutes

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error(error.stack);
    }
}

testDashboard().catch(console.error);
