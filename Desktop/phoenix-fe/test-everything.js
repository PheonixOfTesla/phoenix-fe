/**
 * COMPREHENSIVE PHOENIX TEST
 * Tests every function including login and shows all errors
 */

const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testEverything() {
    console.log('🚀 PHOENIX COMPREHENSIVE TEST\n');
    console.log('Testing EVERY feature and showing ALL errors...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--enable-features=WebSpeechAPI',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const page = await browser.newPage();

    // Capture ALL console messages
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();

        if (type === 'error') {
            console.log('❌ BROWSER ERROR:', text);
        } else if (type === 'warning') {
            console.log('⚠️  BROWSER WARNING:', text);
        } else if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
            console.log('❌ BROWSER:', text);
        } else if (!text.includes('favicon') && !text.includes('404')) {
            console.log('📱 BROWSER:', text);
        }
    });

    // Capture page errors
    page.on('pageerror', error => {
        console.log('❌ PAGE ERROR:', error.message);
    });

    // Capture request failures
    page.on('requestfailed', request => {
        console.log('❌ REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    // Capture response errors
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log('❌ HTTP ERROR:', response.status(), response.url());
        }
    });

    try {
        console.log('=' .repeat(70));
        console.log('TEST 1: LOAD LOGIN PAGE');
        console.log('=' .repeat(70));

        await page.goto('http://localhost:8000/index.html', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });
        console.log('✅ Page loaded\n');
        await wait(2000);

        console.log('=' .repeat(70));
        console.log('TEST 2: CHECK CONFIG');
        console.log('=' .repeat(70));

        const config = await page.evaluate(() => {
            return {
                hasConfig: typeof window.PhoenixConfig !== 'undefined',
                apiUrl: window.PhoenixConfig?.API_BASE_URL,
                environment: window.PhoenixConfig?.environment,
                isLocalhost: window.PhoenixConfig?.isLocalhost
            };
        });

        console.log('Config:', JSON.stringify(config, null, 2));

        if (config.apiUrl !== 'https://pal-backend-production.up.railway.app/api') {
            console.log('❌ WRONG API URL! Should be production backend');
        } else {
            console.log('✅ API URL is correct\n');
        }

        console.log('=' .repeat(70));
        console.log('TEST 3: FILL LOGIN FORM');
        console.log('=' .repeat(70));

        // Check if phone input exists
        const phoneExists = await page.$('#login-phone');
        if (!phoneExists) {
            console.log('❌ Phone input not found!');
            const bodyHTML = await page.evaluate(() => document.body.innerHTML);
            console.log('Page content:', bodyHTML.substring(0, 500));
        } else {
            console.log('✅ Phone input found');
            await page.type('#login-phone', '8087510813', { delay: 50 });
            console.log('✅ Phone entered: 8087510813');
        }

        const passwordExists = await page.$('#login-password');
        if (!passwordExists) {
            console.log('❌ Password input not found!');
        } else {
            console.log('✅ Password input found');
            await page.type('#login-password', '123456', { delay: 50 });
            console.log('✅ Password entered: ******\n');
        }

        await wait(1000);

        console.log('=' .repeat(70));
        console.log('TEST 4: ATTEMPT LOGIN');
        console.log('=' .repeat(70));

        const loginBtn = await page.$('#login-btn');
        if (!loginBtn) {
            console.log('❌ Login button not found!');
        } else {
            console.log('✅ Login button found');
            console.log('🚀 Clicking login...');

            await loginBtn.click();
            console.log('⏳ Waiting for response...\n');

            await wait(5000); // Wait for response

            const currentUrl = page.url();
            console.log('📍 Current URL:', currentUrl);

            // Check for error messages
            const errorMsg = await page.evaluate(() => {
                const errorEl = document.querySelector('.error-message, .alert-error, [class*="error"]');
                return errorEl ? errorEl.textContent : null;
            });

            if (errorMsg) {
                console.log('❌ ERROR MESSAGE:', errorMsg);
            }

            // Check localStorage for token
            const hasToken = await page.evaluate(() => {
                return {
                    token: localStorage.getItem('token') || localStorage.getItem('phoenixToken'),
                    user: localStorage.getItem('user') || localStorage.getItem('phoenixUser')
                };
            });

            console.log('💾 LocalStorage:', JSON.stringify(hasToken, null, 2));

            if (currentUrl.includes('dashboard')) {
                console.log('✅ LOGIN SUCCESS - Redirected to dashboard!\n');
            } else if (currentUrl.includes('onboarding')) {
                console.log('✅ LOGIN SUCCESS - On onboarding page!\n');
            } else {
                console.log('❌ LOGIN FAILED - Still on login page\n');
            }
        }

        console.log('=' .repeat(70));
        console.log('TEST 5: NAVIGATE TO DASHBOARD (FORCE)');
        console.log('=' .repeat(70));

        console.log('🔄 Forcing navigation to dashboard...');
        await page.goto('http://localhost:8000/dashboard.html', {
            waitUntil: 'networkidle0',
            timeout: 10000
        });
        await wait(3000);
        console.log('✅ Dashboard loaded\n');

        console.log('=' .repeat(70));
        console.log('TEST 6: CHECK DASHBOARD ELEMENTS');
        console.log('=' .repeat(70));

        const elements = await page.evaluate(() => {
            return {
                hasVoiceButton: !!document.querySelector('#voice-button, .voice-btn'),
                hasMicButton: !!document.querySelector('#enable-mic, button:has-text("ENABLE MICROPHONE")'),
                hasHolographicNav: !!document.querySelector('.holographic-container, .planet'),
                hasRecoveryScore: !!document.querySelector('.recovery-score, [class*="recovery"]'),
                hasOptimizationTracker: !!document.querySelector('.optimization, [class*="optimization"]')
            };
        });

        console.log('Dashboard Elements:', JSON.stringify(elements, null, 2));

        if (elements.hasVoiceButton) console.log('✅ Voice button found');
        else console.log('❌ Voice button NOT found');

        if (elements.hasMicButton) console.log('✅ Microphone button found');
        else console.log('❌ Microphone button NOT found');

        if (elements.hasHolographicNav) console.log('✅ Holographic navigation found');
        else console.log('❌ Holographic navigation NOT found');

        console.log('\n' + '=' .repeat(70));
        console.log('TEST 7: TRY ENABLING MICROPHONE');
        console.log('=' .repeat(70));

        const micBtn = await page.$('button:has-text("ENABLE MICROPHONE")');
        if (micBtn) {
            console.log('🎙️  Clicking microphone button...');
            await micBtn.click();
            await wait(2000);
            console.log('✅ Microphone button clicked\n');
        } else {
            console.log('⚠️  No microphone enable button found\n');
        }

        console.log('=' .repeat(70));
        console.log('TEST 8: TRY VOICE BUTTON');
        console.log('=' .repeat(70));

        const voiceBtn = await page.$('#voice-button, .voice-btn');
        if (voiceBtn) {
            console.log('🎤 Clicking voice button...');
            await voiceBtn.click();
            await wait(2000);

            // Check for waveform
            const hasWaveform = await page.$('.siri-waveform');
            if (hasWaveform) {
                console.log('✅ SIRI-STYLE WAVEFORM APPEARED!\n');
            } else {
                console.log('❌ No waveform visible\n');
            }
        } else {
            console.log('❌ Voice button not found\n');
        }

        console.log('=' .repeat(70));
        console.log('TEST 9: CHECK API CONNECTIVITY');
        console.log('=' .repeat(70));

        const apiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('https://pal-backend-production.up.railway.app/api/health');
                const data = await response.json();
                return { success: true, data };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        console.log('API Health Check:', JSON.stringify(apiTest, null, 2));

        if (apiTest.success) {
            console.log('✅ Backend API is accessible\n');
        } else {
            console.log('❌ Backend API is NOT accessible\n');
        }

        console.log('\n' + '=' .repeat(70));
        console.log('TEST COMPLETE - SUMMARY');
        console.log('=' .repeat(70));
        console.log('Browser will stay open for 5 minutes for manual testing');
        console.log('Press Ctrl+C to close when done\n');

        await wait(300000); // 5 minutes

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error('Stack:', error.stack);
    }
}

testEverything().catch(console.error);
