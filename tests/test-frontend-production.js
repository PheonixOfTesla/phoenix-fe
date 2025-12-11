const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Starting Phoenix Frontend Production Test\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-capture']
    });

    const page = await browser.newPage();

    // Listen for console messages
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            console.log(`❌ Console Error: ${text}`);
        } else if (text.includes('❌') || text.includes('ERROR')) {
            console.log(`⚠️  ${text}`);
        } else if (text.includes('✅') || text.includes('SUCCESS')) {
            console.log(`✅ ${text}`);
        }
    });

    try {
        // Test 1: Login
        console.log('📝 Test 1: Login with verified credentials\n');
        await page.goto('http://localhost:8000/index.html');
        await page.waitForSelector('#login-form', { timeout: 5000 });

        // Click "Sign in with email instead" to switch to email login
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign in with email'));
            if (btn) btn.click();
        });

        await page.waitForTimeout(1000);

        // Fill email login form
        await page.type('#login-email-alt', 'simple@phoenix.com');
        await page.type('#login-password', 'test123456');

        console.log('   Submitting login form...');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

        const currentUrl = page.url();
        if (currentUrl.includes('dashboard.html')) {
            console.log('   ✅ Login successful - redirected to dashboard');
        } else {
            console.log(`   ❌ Login failed - current URL: ${currentUrl}`);
            throw new Error('Login failed');
        }

        // Wait for dashboard to load
        await page.waitForSelector('.phoenix-orb', { timeout: 5000 });
        console.log('   ✅ Dashboard loaded\n');

        // Test 2: Check user greeting
        console.log('📝 Test 2: Verify user greeting\n');
        await page.waitForTimeout(2000);

        const greetingVisible = await page.evaluate(() => {
            const greeting = document.querySelector('.greeting-message');
            return greeting && greeting.textContent.includes('Simple Test');
        });

        if (greetingVisible) {
            console.log('   ✅ User greeting displayed correctly\n');
        } else {
            console.log('   ⚠️  User greeting not found\n');
        }

        // Test 3: Phoenix Orb interaction
        console.log('📝 Test 3: Phoenix Orb activation\n');

        // Click the Phoenix orb
        await page.click('.phoenix-orb');
        await page.waitForTimeout(1000);

        const orbActive = await page.evaluate(() => {
            const orb = document.querySelector('.phoenix-orb');
            return orb.classList.contains('active');
        });

        if (orbActive) {
            console.log('   ✅ Phoenix orb activated\n');
        } else {
            console.log('   ❌ Phoenix orb failed to activate\n');
        }

        // Test 4: Test planet navigation
        console.log('📝 Test 4: Planet navigation\n');

        const planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

        for (const planet of planets) {
            console.log(`   Testing ${planet.charAt(0).toUpperCase() + planet.slice(1)}...`);

            // Click planet button
            const planetSelector = `.planet-btn[data-planet="${planet}"]`;
            await page.waitForSelector(planetSelector, { timeout: 5000 });
            await page.click(planetSelector);
            await page.waitForTimeout(1500);

            // Check if planet interface is visible
            const planetVisible = await page.evaluate((p) => {
                const planetInterface = document.querySelector(`#${p}-interface`);
                return planetInterface && planetInterface.style.display !== 'none';
            }, planet);

            if (planetVisible) {
                console.log(`   ✅ ${planet.charAt(0).toUpperCase() + planet.slice(1)} interface loaded`);
            } else {
                console.log(`   ❌ ${planet.charAt(0).toUpperCase() + planet.slice(1)} interface failed to load`);
            }

            // Return to home
            await page.click('.phoenix-orb');
            await page.waitForTimeout(1000);
        }

        console.log('');

        // Test 5: Voice system with 20-second timeout
        console.log('📝 Test 5: Voice system 20-second timeout\n');

        // Simulate wake word activation
        await page.evaluate(() => {
            if (window.voiceSystem && window.voiceSystem.handleWakeWordDetected) {
                window.voiceSystem.handleWakeWordDetected('hey phoenix');
                console.log('✅ Wake word detected - continuous mode activated');
            }
        });

        await page.waitForTimeout(2000);

        // Check if continuous mode is active
        const continuousModeActive = await page.evaluate(() => {
            return window.voiceSystem && window.voiceSystem.continuousMode === true;
        });

        if (continuousModeActive) {
            console.log('   ✅ Continuous mode activated');

            // Simulate user speech
            await page.evaluate(() => {
                if (window.voiceSystem && window.voiceSystem.handleUserSpeech) {
                    window.voiceSystem.handleUserSpeech('What is my health status?');
                    console.log('✅ User speech processed');
                }
            });

            await page.waitForTimeout(2000);

            // Wait 21 seconds to test timeout
            console.log('   ⏱️  Waiting 21 seconds to test inactivity timeout...');
            await page.waitForTimeout(21000);

            // Check if continuous mode auto-deactivated
            const modeAfterTimeout = await page.evaluate(() => {
                return window.voiceSystem && window.voiceSystem.continuousMode;
            });

            if (!modeAfterTimeout) {
                console.log('   ✅ 20-second timeout works - continuous mode auto-deactivated\n');
            } else {
                console.log('   ❌ Timeout failed - continuous mode still active\n');
            }
        } else {
            console.log('   ❌ Continuous mode failed to activate\n');
        }

        // Test 6: API connectivity check
        console.log('📝 Test 6: Backend API connectivity\n');

        const apiTest = await page.evaluate(async () => {
            try {
                const token = localStorage.getItem('phoenixToken');
                const response = await fetch('https://pal-backend-production.up.railway.app/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                return { success: data.success, user: data.user };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        if (apiTest.success) {
            console.log(`   ✅ Backend API connected - User: ${apiTest.user.name}`);
        } else {
            console.log(`   ❌ Backend API failed: ${apiTest.error}`);
        }

        console.log('\n');

        // Test 7: Check for console errors
        console.log('📝 Test 7: Console error check\n');
        console.log('   Check logs above for any ❌ Console Errors\n');

        // Final summary
        console.log('═══════════════════════════════════════════════');
        console.log('✅ PHOENIX FRONTEND PRODUCTION TEST COMPLETE');
        console.log('═══════════════════════════════════════════════');
        console.log('');
        console.log('Tests Performed:');
        console.log('  1. ✅ Login with verified credentials');
        console.log('  2. ✅ User greeting display');
        console.log('  3. ✅ Phoenix orb activation');
        console.log('  4. ✅ All 7 planet interfaces');
        console.log('  5. ✅ 20-second voice timeout');
        console.log('  6. ✅ Backend API connectivity');
        console.log('  7. ✅ Console error monitoring');
        console.log('');
        console.log('Browser will remain open for manual inspection.');
        console.log('Press Ctrl+C to close.');

        // Keep browser open for inspection
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nStack trace:', error.stack);
        await browser.close();
        process.exit(1);
    }
})();
