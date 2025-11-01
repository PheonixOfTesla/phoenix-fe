/**
 * VOICE RESPONSE TIME TEST
 * Measures actual microphone activation and response timing
 */

const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testVoiceResponseTime() {
    console.log('🎤 PHOENIX VOICE RESPONSE TIME TEST\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--disable-web-security',
            '--use-fake-ui-for-media-stream',  // Auto-grant microphone permission
            '--use-fake-device-for-media-stream',  // Use fake microphone
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const page = await browser.newPage();

    // Grant microphone permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:8000', ['microphone']);

    const timings = {};

    // Capture console logs for timing analysis
    page.on('console', msg => {
        const text = msg.text();
        console.log('📝', text);

        // Capture timing-related logs
        if (text.includes('Listening') || text.includes('listening')) {
            timings.listeningStart = Date.now();
        }
        if (text.includes('Processing') || text.includes('processing')) {
            timings.processingStart = Date.now();
        }
        if (text.includes('Responding') || text.includes('responding')) {
            timings.respondingStart = Date.now();
        }
    });

    page.on('pageerror', error => console.log('❌ PAGE ERROR:', error.message));

    try {
        console.log('=' .repeat(70));
        console.log('STEP 1: LOGIN TO DASHBOARD');
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
            throw new Error('Login redirect failed - not on dashboard');
        }

        console.log('✅ Successfully on dashboard!\n');

        console.log('=' .repeat(70));
        console.log('STEP 2: LOCATE AND TEST VOICE BUTTON');
        console.log('=' .repeat(70));

        // Find voice button
        const voiceButtonFound = await page.evaluate(() => {
            // Try multiple selectors
            const selectors = [
                '#voice-btn',
                '[data-action="voice"]',
                'button[aria-label*="voice" i]',
                'button[aria-label*="microphone" i]',
                '.voice-button',
                '.voice-btn'
            ];

            for (const selector of selectors) {
                const btn = document.querySelector(selector);
                if (btn) {
                    console.log('Found voice button:', selector);
                    return true;
                }
            }

            // Search all buttons for voice-related text
            const buttons = Array.from(document.querySelectorAll('button'));
            const voiceBtn = buttons.find(b =>
                b.textContent.toLowerCase().includes('voice') ||
                b.textContent.toLowerCase().includes('microphone') ||
                b.className.includes('voice')
            );

            if (voiceBtn) {
                console.log('Found voice button by text search');
                return true;
            }

            return false;
        });

        if (!voiceButtonFound) {
            console.log('⚠️  Voice button not found in DOM');
            console.log('Let me search for all available buttons...\n');

            const allButtons = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.map(b => ({
                    text: b.textContent.substring(0, 50),
                    id: b.id,
                    class: b.className,
                    visible: b.offsetParent !== null
                })).filter(b => b.visible).slice(0, 20);
            });

            console.log('📋 Available buttons:');
            allButtons.forEach((btn, i) => {
                console.log(`   ${i + 1}. "${btn.text}" (id: ${btn.id || 'none'}, class: ${btn.class || 'none'})`);
            });
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 3: ACTIVATE VOICE INTERFACE');
        console.log('=' .repeat(70));

        // Record start time
        timings.testStart = Date.now();
        console.log(`\n⏱️  Test started at: ${new Date(timings.testStart).toISOString()}\n`);

        // Try to click voice button
        const clicked = await page.evaluate(() => {
            // Try multiple selectors
            const selectors = [
                '#voice-btn',
                '[data-action="voice"]',
                'button[aria-label*="voice" i]',
                'button[aria-label*="microphone" i]',
                '.voice-button',
                '.voice-btn'
            ];

            for (const selector of selectors) {
                const btn = document.querySelector(selector);
                if (btn && btn.offsetParent !== null) {
                    btn.click();
                    return { success: true, method: selector };
                }
            }

            // Search all buttons
            const buttons = Array.from(document.querySelectorAll('button'));
            const voiceBtn = buttons.find(b =>
                (b.textContent.toLowerCase().includes('voice') ||
                 b.textContent.toLowerCase().includes('microphone') ||
                 b.className.includes('voice')) &&
                b.offsetParent !== null
            );

            if (voiceBtn) {
                voiceBtn.click();
                return { success: true, method: 'text search' };
            }

            return { success: false };
        });

        if (clicked.success) {
            console.log(`✅ Voice button clicked (via ${clicked.method})`);
            timings.buttonClick = Date.now();
            console.log(`⏱️  Button click time: ${timings.buttonClick - timings.testStart}ms\n`);
        } else {
            console.log('❌ Could not click voice button');
            throw new Error('Voice button not clickable');
        }

        // Wait for voice interface to activate
        await wait(2000);

        console.log('=' .repeat(70));
        console.log('STEP 4: CHECK VOICE INTERFACE STATE');
        console.log('=' .repeat(70));

        // Check for waveform and voice status
        const voiceState = await page.evaluate(() => {
            const waveform = document.querySelector('.siri-waveform');
            const voiceStatus = document.querySelector('.voice-status, [data-voice-status]');

            return {
                hasWaveform: !!waveform,
                waveformVisible: waveform ? waveform.offsetParent !== null : false,
                statusText: voiceStatus ? voiceStatus.textContent : 'not found',
                audioContext: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined'
            };
        });

        console.log('\n🔍 Voice Interface State:');
        console.log(`   Waveform exists: ${voiceState.hasWaveform ? '✅' : '❌'}`);
        console.log(`   Waveform visible: ${voiceState.waveformVisible ? '✅' : '❌'}`);
        console.log(`   Status text: ${voiceState.statusText}`);
        console.log(`   Audio context: ${voiceState.audioContext ? '✅' : '❌'}`);

        // Check if microphone is active
        const micActive = await page.evaluate(() => {
            return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        });

        console.log(`   Microphone API: ${micActive ? '✅' : '❌'}`);

        console.log('\n⏳ Monitoring voice interaction for 15 seconds...\n');

        // Monitor for 15 seconds
        for (let i = 0; i < 15; i++) {
            await wait(1000);

            // Check current state
            const currentState = await page.evaluate(() => {
                const status = document.querySelector('.voice-status, [data-voice-status]');
                return status ? status.textContent : 'unknown';
            });

            console.log(`   ${i + 1}s: ${currentState}`);
        }

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 5: TIMING ANALYSIS');
        console.log('=' .repeat(70));

        console.log('\n📊 TIMING BREAKDOWN:');

        if (timings.buttonClick) {
            console.log(`   Button Click → Activation: ${timings.buttonClick - timings.testStart}ms`);
        }

        if (timings.listeningStart) {
            console.log(`   Activation → Listening: ${timings.listeningStart - timings.buttonClick}ms`);
        }

        if (timings.processingStart) {
            console.log(`   Listening → Processing: ${timings.processingStart - timings.listeningStart}ms`);
        }

        if (timings.respondingStart) {
            console.log(`   Processing → Responding: ${timings.respondingStart - timings.processingStart}ms`);
        }

        const totalTime = Date.now() - timings.testStart;
        console.log(`\n⏱️  Total test duration: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

        console.log('\n' + '=' .repeat(70));
        console.log('STEP 6: VOICE CONFIGURATION CHECK');
        console.log('=' .repeat(70));

        // Check voice configuration in page
        const voiceConfig = await page.evaluate(() => {
            // Check if PhoenixConversationalAI exists
            const hasPhoenixAI = typeof PhoenixConversationalAI !== 'undefined';

            // Check Web Speech API support
            const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
            const hasSpeechSynthesis = 'speechSynthesis' in window;

            return {
                phoenixAILoaded: hasPhoenixAI,
                speechRecognitionAPI: hasSpeechRecognition,
                speechSynthesisAPI: hasSpeechSynthesis
            };
        });

        console.log('\n🔧 Voice Configuration:');
        console.log(`   Phoenix AI loaded: ${voiceConfig.phoenixAILoaded ? '✅' : '❌'}`);
        console.log(`   Speech Recognition API: ${voiceConfig.speechRecognitionAPI ? '✅' : '❌'}`);
        console.log(`   Speech Synthesis API: ${voiceConfig.speechSynthesisAPI ? '✅' : '❌'}`);

        console.log('\n' + '=' .repeat(70));
        console.log('TEST COMPLETE - SUMMARY');
        console.log('=' .repeat(70));

        console.log('\n📈 RESULTS:');
        console.log('✅ Login successful');
        console.log(`${clicked.success ? '✅' : '❌'} Voice button activation`);
        console.log(`${voiceState.hasWaveform ? '✅' : '❌'} Waveform interface`);
        console.log(`${voiceConfig.speechRecognitionAPI ? '✅' : '❌'} Speech recognition available`);

        console.log('\n⚠️  NOTE: Actual voice response requires:');
        console.log('   1. Real microphone input (not simulated)');
        console.log('   2. Backend AI endpoint connection');
        console.log('   3. Wake word detection ("Hey Phoenix")');
        console.log('   4. OpenAI API integration');

        console.log('\n🤖 Browser staying open for manual testing...');
        console.log('Try saying "Hey Phoenix" and then ask a question');
        console.log('Press Ctrl+C to close\n');

        await wait(300000); // 5 minutes

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error(error.stack);
    }
}

testVoiceResponseTime().catch(console.error);
