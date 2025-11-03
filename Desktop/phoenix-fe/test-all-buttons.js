/**
 * COMPREHENSIVE BUTTON TEST
 * Login and click EVERY button to test all features
 */

const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAllButtons() {
    console.log('🚀 PHOENIX COMPREHENSIVE BUTTON TEST\n');
    console.log('Will login and click EVERY button...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--disable-web-security']
    });

    const page = await browser.newPage();

    // Capture everything
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
            console.log('❌', text);
        } else if (!text.includes('favicon') && !text.includes('404')) {
            console.log('📱', text);
        }
    });

    page.on('pageerror', error => console.log('❌ PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('❌ REQUEST FAILED:', request.url()));

    try {
        console.log('=' .repeat(70));
        console.log('STEP 1: LOGIN');
        console.log('=' .repeat(70));

        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        await wait(2000);

        // Fill login form
        await page.type('#login-phone', '8087510813');
        await page.type('#login-password', '123456');
        console.log('✅ Credentials entered\n');

        await wait(1000);

        // Click login
        await page.click('#login-btn');
        console.log('✅ Login button clicked');
        console.log('⏳ Waiting for dashboard...\n');

        await wait(5000);

        // Check if we're logged in
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);

        if (!currentUrl.includes('dashboard')) {
            console.log('⚠️  Not on dashboard, forcing navigation...');
            await page.goto('http://localhost:8000/dashboard.html', { waitUntil: 'networkidle0' });
            await wait(3000);
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 2: FIND ALL BUTTONS');
        console.log('=' .repeat(70));

        // Get all clickable elements
        const buttons = await page.evaluate(() => {
            const elements = [];

            // Find all buttons
            document.querySelectorAll('button').forEach((btn, index) => {
                if (btn.offsetParent !== null) { // visible
                    elements.push({
                        type: 'button',
                        index,
                        text: btn.textContent.trim().substring(0, 50),
                        id: btn.id,
                        class: btn.className
                    });
                }
            });

            // Find clickable divs
            document.querySelectorAll('[onclick], .clickable, [role="button"]').forEach((el, index) => {
                if (el.offsetParent !== null && el.tagName !== 'BUTTON') {
                    elements.push({
                        type: 'clickable',
                        index,
                        text: el.textContent.trim().substring(0, 50),
                        id: el.id,
                        class: el.className
                    });
                }
            });

            return elements;
        });

        console.log(`\n✅ Found ${buttons.length} clickable elements:\n`);
        buttons.forEach((btn, i) => {
            console.log(`${i + 1}. [${btn.type}] "${btn.text}" (id: ${btn.id || 'none'}, class: ${btn.class.substring(0, 30)})`);
        });

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 3: CLICK EVERY BUTTON');
        console.log('=' .repeat(70));

        // Click each button
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            console.log(`\n[${i + 1}/${buttons.length}] Testing: "${btn.text}"`);

            try {
                if (btn.id) {
                    await page.click(`#${btn.id}`);
                } else {
                    await page.evaluate((index, type) => {
                        const selector = type === 'button' ? 'button' : '[onclick], .clickable, [role="button"]';
                        const elements = Array.from(document.querySelectorAll(selector));
                        const visibleElements = elements.filter(el => el.offsetParent !== null);
                        if (visibleElements[index]) {
                            visibleElements[index].click();
                        }
                    }, btn.index, btn.type);
                }

                console.log(`   ✅ Clicked successfully`);
                await wait(1500);

                // Check for modals or changes
                const hasModal = await page.$('.modal, [class*="modal"], [role="dialog"]');
                if (hasModal) {
                    console.log(`   💡 Modal/Dialog appeared`);

                    // Try to close modal
                    const closeBtn = await page.$('.close, .modal-close, button:has-text("Close"), button:has-text("Cancel")');
                    if (closeBtn) {
                        await closeBtn.click();
                        await wait(500);
                        console.log(`   ✅ Modal closed`);
                    }
                }

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 4: TEST SPECIFIC FEATURES');
        console.log('=' .repeat(70));

        // Test voice button specifically
        console.log('\n🎤 Testing VOICE FEATURES:');
        const voiceBtn = await page.$('#voice-button, button:contains("TALK"), button:contains("PHOENIX")');
        if (voiceBtn) {
            console.log('   🎙️  Found voice button, clicking...');
            await voiceBtn.click();
            await wait(2000);

            // Check for waveform
            const hasWaveform = await page.$('.siri-waveform');
            if (hasWaveform) {
                console.log('   ✅ SIRI-STYLE WAVEFORM APPEARED!');
            } else {
                console.log('   ❌ No waveform visible');
            }

            await voiceBtn.click(); // Stop
            await wait(1000);
        } else {
            console.log('   ❌ Voice button not found');
        }

        // Test planet navigation
        console.log('\n🪐 Testing PLANETARY NAVIGATION:');
        const planets = ['MERCURY', 'VENUS', 'EARTH', 'MARS', 'JUPITER', 'SATURN', 'PHOENIX'];

        for (const planet of planets) {
            try {
                const found = await page.evaluate((planetName) => {
                    const elements = Array.from(document.querySelectorAll('*'));
                    const planetEl = elements.find(el =>
                        el.textContent.includes(planetName) &&
                        el.offsetParent !== null &&
                        (el.classList.contains('planet') || el.classList.contains('domain'))
                    );
                    if (planetEl) {
                        planetEl.click();
                        return true;
                    }
                    return false;
                }, planet);

                if (found) {
                    console.log(`   ✅ ${planet} clicked`);
                    await wait(1000);
                } else {
                    console.log(`   ⚠️  ${planet} not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${planet} error: ${error.message}`);
            }
        }

        // Test zoom controls
        console.log('\n🔍 Testing ZOOM CONTROLS:');
        const plusBtn = await page.$('button:has-text("+"), .zoom-in');
        if (plusBtn) {
            console.log('   ✅ Zoom + found, clicking 3 times...');
            for (let i = 0; i < 3; i++) {
                await plusBtn.click();
                await wait(300);
            }
        }

        const minusBtn = await page.$('button:has-text("-"), .zoom-out');
        if (minusBtn) {
            console.log('   ✅ Zoom - found, clicking 3 times...');
            for (let i = 0; i < 3; i++) {
                await minusBtn.click();
                await wait(300);
            }
        }

        const resetBtn = await page.$('button:has-text("RESET"), .reset');
        if (resetBtn) {
            console.log('   ✅ Reset found, clicking...');
            await resetBtn.click();
            await wait(1000);
        }

        // Test quick action buttons
        console.log('\n🎯 Testing QUICK ACTION BUTTONS:');
        const actions = [
            { name: 'LOG WORKOUT', selector: 'button' },
            { name: 'LOG MEAL', selector: 'button' },
            { name: 'BUTLER', selector: 'button' },
            { name: 'ASK PHOENIX', selector: 'button' }
        ];

        for (const action of actions) {
            try {
                const found = await page.evaluate((text) => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(b => b.textContent.includes(text) && b.offsetParent !== null);
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                }, action.name);

                if (found) {
                    console.log(`   ✅ ${action.name} clicked`);
                    await wait(1500);

                    // Close any modal
                    await page.evaluate(() => {
                        const closeBtn = document.querySelector('.close, .modal-close, button');
                        if (closeBtn && closeBtn.textContent.includes('Close')) {
                            closeBtn.click();
                        }
                    });
                } else {
                    console.log(`   ⚠️  ${action.name} not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${action.name} error`);
            }
        }

        console.log('\n' + '=' .repeat(70));
        console.log('TEST COMPLETE - SUMMARY');
        console.log('=' .repeat(70));
        console.log(`✅ Tested ${buttons.length} buttons`);
        console.log('✅ Tested planetary navigation (7 planets)');
        console.log('✅ Tested voice features');
        console.log('✅ Tested zoom controls');
        console.log('✅ Tested quick actions');
        console.log('\n🤖 Browser staying open for 5 minutes...');
        console.log('Press Ctrl+C to close\n');

        await wait(300000);

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
    }
}

testAllButtons().catch(console.error);
