/**
 * Puppeteer test - Audio unlock and TTS
 */
const puppeteer = require('puppeteer');

async function testAudioFix() {
    console.log('\n🧪 Testing Audio Unlock Fix...\n');

    const browser = await puppeteer.launch({
        headless: false, // Show browser to see what happens
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--autoplay-policy=user-gesture-required' // Simulate strict autoplay policy
        ]
    });

    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Audio unlocked') || text.includes('TTS') || text.includes('error')) {
            console.log(`   ${text}`);
        }
    });

    // Capture errors
    page.on('pageerror', error => {
        console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    // Navigate to dashboard
    console.log('📄 Loading dashboard...\n');
    await page.goto('http://localhost:8080/dashboard.html', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click "TALK TO PHOENIX" button to unlock audio
    console.log('🎙️  Clicking TALK TO PHOENIX button...\n');
    await page.evaluate(() => {
        const button = document.querySelector('.voice-btn');
        if (button) button.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if audio unlocked
    const audioUnlocked = await page.evaluate(() => {
        return window.audioUnlocked || false;
    });

    console.log(`\n${audioUnlocked ? '✅' : '❌'} Audio unlocked: ${audioUnlocked}\n`);

    // Keep browser open for 5 seconds to observe
    await new Promise(resolve => setTimeout(resolve, 5000));

    await browser.close();
}

testAudioFix().catch(console.error);
