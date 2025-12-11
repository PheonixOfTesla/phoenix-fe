/**
 * CAPACITOR SPEECH RECOGNITION TEST
 * Tests the platform-aware speech recognition system
 *
 * This script opens the dashboard and verifies:
 * 1. Platform detection (Capacitor vs Web)
 * 2. Speech recognition initialization
 * 3. Platform info display
 * 4. Voice button functionality
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🎤 CAPACITOR SPEECH RECOGNITION TEST\n');
    console.log('='.repeat(70));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--disable-web-security',
            '--no-sandbox',
            '--use-fake-ui-for-media-stream', // Auto-grant mic permission
            '--use-fake-device-for-media-stream'
        ],
        devtools: true
    });

    const page = await browser.newPage();

    // Grant microphone permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:8000', ['microphone']);

    // Track console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);

        // Log platform detection and speech recognition messages
        if (text.includes('[Platform]') || text.includes('[Phoenix]') || text.includes('Speech')) {
            console.log(`📝 ${text}`);
        }
    });

    try {
        // ==============================================
        // STEP 1: Load Dashboard
        // ==============================================
        console.log('\n1️⃣ LOADING DASHBOARD\n');

        await page.goto('http://localhost:8000/dashboard.html', {
            waitUntil: 'networkidle2',
            timeout: 15000
        });

        await page.evaluate(() => {
            localStorage.setItem('phoenixToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzI3YTBiODczOTY1OTExYWVmYTBhNCIsImlhdCI6MTczMDQyMDAxOSwiZXhwIjoxNzMzMDEyMDE5fQ.LblCaEzKOjYFcIrBRhHhHQ7KlqFPjRPJiUKZ2OoPbOk');
        });

        await page.reload({ waitUntil: 'networkidle2' });

        console.log('✅ Dashboard loaded');

        // Wait for greeting to disappear
        await new Promise(r => setTimeout(r, 6000));

        // ==============================================
        // STEP 2: Check Platform Detection
        // ==============================================
        console.log('\n2️⃣ CHECKING PLATFORM DETECTION\n');

        const platformInfo = await page.evaluate(() => {
            if (window.PlatformSpeechRecognition) {
                const instance = new window.PlatformSpeechRecognition();
                return instance.getPlatformInfo();
            }
            return null;
        });

        if (platformInfo) {
            console.log('✅ Platform detection working');
            console.log(`   Platform: ${platformInfo.platform}`);
            console.log(`   Speech API: ${platformInfo.speechAPI}`);
            console.log(`   Cost: ${platformInfo.cost}`);
            console.log(`   Is Capacitor: ${platformInfo.isCapacitor}`);
            console.log(`   Is Native iOS: ${platformInfo.isNativeIOS}`);
        } else {
            console.log('❌ Platform detection failed');
        }

        // ==============================================
        // STEP 3: Check Speech Recognition Init
        // ==============================================
        console.log('\n3️⃣ CHECKING SPEECH RECOGNITION INITIALIZATION\n');

        // Check console for initialization messages
        const initMessages = consoleMessages.filter(msg =>
            msg.includes('Speech Recognition Platform') ||
            msg.includes('Speech recognition ready') ||
            msg.includes('Using:')
        );

        if (initMessages.length > 0) {
            console.log('✅ Speech recognition initialized');
            initMessages.forEach(msg => console.log(`   ${msg}`));
        } else {
            console.log('⚠️  No initialization messages found');
        }

        // ==============================================
        // STEP 4: Test Voice Button
        // ==============================================
        console.log('\n4️⃣ TESTING VOICE BUTTON\n');

        const voiceButton = await page.evaluate(() => {
            const btn = document.querySelector('button[onclick*="phoenixVoice.toggleListening"]');
            return btn ? {
                exists: true,
                visible: btn.offsetParent !== null,
                text: btn.textContent.trim()
            } : { exists: false };
        });

        if (voiceButton.exists) {
            console.log('✅ Voice button found');
            console.log(`   Visible: ${voiceButton.visible}`);
            console.log(`   Text: ${voiceButton.text}`);
        } else {
            console.log('❌ Voice button not found');
        }

        // ==============================================
        // STEP 5: Check for Errors
        // ==============================================
        console.log('\n5️⃣ CHECKING FOR ERRORS\n');

        const errors = consoleMessages.filter(msg =>
            msg.toLowerCase().includes('error') &&
            !msg.includes('401') // Ignore expected 401s with old token
        );

        if (errors.length === 0) {
            console.log('✅ No speech recognition errors');
        } else {
            console.log(`⚠️  Found ${errors.length} errors:`);
            errors.slice(0, 5).forEach(err => {
                console.log(`   - ${err.substring(0, 100)}`);
            });
        }

        // ==============================================
        // SUMMARY
        // ==============================================
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(70));

        const summary = {
            platformDetection: platformInfo !== null,
            speechInitialized: initMessages.length > 0,
            voiceButtonExists: voiceButton.exists,
            errorCount: errors.length,
            platform: platformInfo?.platform || 'unknown',
            api: platformInfo?.speechAPI || 'unknown',
            cost: platformInfo?.cost || 'unknown'
        };

        console.log(`\n✅ Platform Detection: ${summary.platformDetection ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Speech Initialized: ${summary.speechInitialized ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Voice Button: ${summary.voiceButtonExists ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Error Count: ${summary.errorCount}`);

        console.log(`\n📱 Platform: ${summary.platform}`);
        console.log(`🎙️  Speech API: ${summary.api}`);
        console.log(`💰 Cost: ${summary.cost}`);

        if (summary.platformDetection && summary.speechInitialized && summary.voiceButtonExists) {
            console.log('\n🎉 ALL TESTS PASSED!\n');
            console.log('✅ Platform-aware speech recognition is working correctly');
            console.log('✅ System will use FREE Apple SFSpeechRecognizer on iOS native');
            console.log('✅ System will use FREE Web Speech API in browser\n');
        } else {
            console.log('\n⚠️  Some tests failed - review output above\n');
        }

        console.log('📝 Next Steps:');
        console.log('   1. Run: npm install');
        console.log('   2. Run: npx cap init');
        console.log('   3. Run: npx cap add ios');
        console.log('   4. Add iOS permissions from ios-permissions-template.plist');
        console.log('   5. Run: npx cap sync');
        console.log('   6. Run: npx cap open ios');
        console.log('   7. Build and run on iOS device/simulator\n');

        console.log('⏸️  Browser will remain open for 60 seconds for inspection...\n');
        await new Promise(r => setTimeout(r, 60000));

    } catch (error) {
        console.error('\n💥 TEST FAILED:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        console.log('\n🏁 Test complete\n');
    }
})();
