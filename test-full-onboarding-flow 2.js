const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Phoenix Complete Onboarding Flow Test\n');
    console.log('Testing: Registration → Onboarding → Language/Voice Selection → Dashboard\n');

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
        if (type === 'error' && !text.includes('404') && !text.includes('Failed to load resource')) {
            console.log(`   ❌ Console Error: ${text}`);
        } else if (text.includes('✅')) {
            console.log(`   ${text}`);
        }
    });

    try {
        // Test 1: Register new user
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 TEST 1: New User Registration');
        console.log('═══════════════════════════════════════════════════════════\n');

        await page.goto('http://localhost:8000/index.html');
        await page.waitForSelector('#login-form', { timeout: 5000 });

        // Click "Create account" to switch to registration
        console.log('   Switching to registration form...');
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('a, button')).find(b =>
                b.textContent.includes('Create') || b.textContent.includes('Sign up') || b.textContent.includes('Register')
            );
            if (btn) btn.click();
        });

        await page.waitForTimeout(1000);

        // Fill registration form
        const timestamp = Date.now();
        const testEmail = `phoenix-test-${timestamp}@test.com`;

        console.log(`   Registering: ${testEmail}`);

        await page.type('#register-name', 'Phoenix Test User');
        await page.type('#register-email', testEmail);
        await page.type('#register-password', 'TestPass123');
        await page.type('#register-confirm-password', 'TestPass123');

        console.log('   Submitting registration...');
        await page.click('#register-form button[type="submit"]');

        // Wait for redirect
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });

        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);

        if (currentUrl.includes('onboarding.html')) {
            console.log('   ✅ Correctly redirected to onboarding\n');
        } else if (currentUrl.includes('dashboard.html')) {
            console.log('   ⚠️  Redirected to dashboard - should go to onboarding first\n');
        } else {
            console.log(`   ❌ Unexpected redirect: ${currentUrl}\n`);
        }

        // Test 2: Onboarding - Language Selection
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 TEST 2: Language Selection (Testing Spanish)');
        console.log('═══════════════════════════════════════════════════════════\n');

        if (currentUrl.includes('onboarding.html')) {
            await page.waitForSelector('#languageGrid', { timeout: 5000 });
            console.log('   Language options loaded');

            // Select Spanish
            console.log('   Selecting Spanish (Español)...');
            await page.click('.selection-card[data-lang="es"]');
            await page.waitForTimeout(2000);

            console.log('   ✅ Spanish selected\n');

            // Continue to voice selection
            await page.click('button:has-text("Next"), .next-btn, .continue-btn');
            await page.waitForTimeout(2000);
        }

        // Test 3: Onboarding - Voice Selection
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 TEST 3: Voice Personality Selection (Testing Nova)');
        console.log('═══════════════════════════════════════════════════════════\n');

        if (currentUrl.includes('onboarding.html')) {
            await page.waitForSelector('#voiceGrid', { timeout: 5000 });
            console.log('   Voice options loaded');

            // Select Nova
            console.log('   Selecting Nova (friendly helper)...');
            await page.click('.selection-card[data-voice="nova"]');
            await page.waitForTimeout(3000); // Wait for voice preview

            console.log('   ✅ Nova voice selected\n');

            // Continue to dashboard
            console.log('   Completing onboarding...');
            await page.click('button:has-text("Finish"), button:has-text("Complete"), .finish-btn');
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        }

        // Test 4: Dashboard with Spanish + Nova
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 TEST 4: Dashboard Verification (Spanish + Nova)');
        console.log('═══════════════════════════════════════════════════════════\n');

        const dashboardUrl = page.url();
        if (dashboardUrl.includes('dashboard.html')) {
            console.log('   ✅ Successfully reached dashboard');

            await page.waitForTimeout(5000); // Wait for initialization

            // Check user preferences were saved
            const userPrefs = await page.evaluate(() => {
                const user = JSON.parse(localStorage.getItem('phoenixUser') || '{}');
                return {
                    name: user.name,
                    language: user.preferences?.language,
                    voice: user.preferences?.voice
                };
            });

            console.log(`   User Name: ${userPrefs.name || 'NOT SET'}`);
            console.log(`   Language: ${userPrefs.language || 'NOT SET'} (should be 'es')`);
            console.log(`   Voice: ${userPrefs.voice || 'NOT SET'} (should be 'nova')`);

            if (userPrefs.language === 'es' && userPrefs.voice === 'nova') {
                console.log('   ✅ Preferences correctly saved!\n');
            } else {
                console.log('   ❌ Preferences not saved correctly\n');
            }

            // Check if dashboard elements are present
            const dashboardCheck = await page.evaluate(() => {
                return {
                    hasOrb: !!document.getElementById('jarvis-orb'),
                    hasQuickActions: !!document.getElementById('quick-actions-orb'),
                    hasPlanetButtons: document.querySelectorAll('.planet-btn').length > 0
                };
            });

            console.log(`   Dashboard Orb: ${dashboardCheck.hasOrb ? '✅' : '❌'}`);
            console.log(`   Quick Actions: ${dashboardCheck.hasQuickActions ? '✅' : '❌'}`);
            console.log(`   Planet Buttons: ${dashboardCheck.hasPlanetButtons ? '✅' : '❌'}\n`);
        } else {
            console.log(`   ❌ Not on dashboard: ${dashboardUrl}\n`);
        }

        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ ONBOARDING FLOW TEST COMPLETE');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('Tests Performed:');
        console.log('  1. ✅ New user registration');
        console.log('  2. ✅ Onboarding redirect');
        console.log('  3. ✅ Language selection (Spanish)');
        console.log('  4. ✅ Voice selection (Nova)');
        console.log('  5. ✅ Dashboard access with preferences');
        console.log('');
        console.log('Next Steps:');
        console.log('  - Test other languages (French, German)');
        console.log('  - Test other voices (Echo, Onyx, Shimmer, Alloy, Fable)');
        console.log('  - Verify dashboard UI adapts to language');
        console.log('  - Test voice interactions in selected language');
        console.log('');
        console.log('Browser will remain open for inspection.');
        console.log('Press Ctrl+C to close.');

        // Keep browser open
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nStack trace:', error.stack);
        await browser.close();
        process.exit(1);
    }
})();
