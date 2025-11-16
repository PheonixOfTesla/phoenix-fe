const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Starting Phoenix Voice Test...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const page = await browser.newPage();

    // Listen to console logs
    page.on('console', msg => {
        const text = msg.text();
        console.log(`[BROWSER] ${text}`);
    });

    // Go to dashboard
    console.log('📱 Loading dashboard...');
    await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    // Inject auth token
    console.log('⏳ Injecting auth token...');
    await page.evaluate(() => {
        localStorage.setItem('phoenixToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTRmY2UxYmE1NzUxZWNlM2ZjMDllOCIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjI5ODMxMzcsImV4cCI6MTc2MzA2OTUzN30.3pv2TWocugncQBWQTen-kyt1UlZdzvMnpLUxBRD7Cyo');
    });

    // Reload page with token
    console.log('🔄 Reloading dashboard...');
    await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    console.log('✅ Logged in');

    // Wait for Phoenix Voice Commands to initialize
    await page.waitForTimeout(3000);

    console.log('\n🎯 Clicking center orb...');
    await page.click('#phoenix-core-container');

    console.log('⏳ Waiting 2 seconds for voice recognition to start...');
    await page.waitForTimeout(2000);

    // Check if voice recognition started
    const isListening = await page.evaluate(() => {
        return window.phoenixVoiceCommands && window.phoenixVoiceCommands.isListening;
    });

    console.log(`\n📊 Voice Recognition Status: ${isListening ? '✅ LISTENING' : '❌ NOT LISTENING'}`);

    if (!isListening) {
        console.log('\n❌ PROBLEM: Voice recognition did not start after clicking orb!');
        console.log('Checking if phoenixVoiceCommands exists...');

        const exists = await page.evaluate(() => {
            return {
                phoenixVoiceCommands: typeof window.phoenixVoiceCommands !== 'undefined',
                startPhoenixVoiceCommand: typeof window.startPhoenixVoiceCommand !== 'undefined',
                recognition: window.phoenixVoiceCommands ? !!window.phoenixVoiceCommands.recognition : false
            };
        });

        console.log('Debug info:', exists);
    } else {
        console.log('✅ Voice recognition is active!');

        // Simulate speech by directly calling the AI endpoint
        console.log('\n🎤 Simulating speech: "Hello Phoenix"');
        await page.evaluate(async () => {
            if (window.phoenixVoiceCommands) {
                await window.phoenixVoiceCommands.sendToAIIntelligent('Hello Phoenix');
            }
        });

        console.log('⏳ Waiting for AI response and TTS...');
        await page.waitForTimeout(10000);
    }

    console.log('\n✅ Test complete!');
    await page.waitForTimeout(5000);
    await browser.close();
})();
