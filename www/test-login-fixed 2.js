/**
 * TEST FIXED LOGIN FLOW
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🧪 TESTING FIXED LOGIN FLOW\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Track navigation
    page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) {
            console.log('📍 Navigated to:', frame.url());
        }
    });

    // Track console
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Token valid') || text.includes('Token expired') || text.includes('Login') || text.includes('Redirecting')) {
            console.log('BROWSER:', text);
        }
    });

    // 1. Load index
    console.log('1. Loading login page...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });

    // 2. Login
    console.log('2. Logging in with simple@phoenix.com...');

    // Switch to email if on phone
    const phoneInput = await page.$('#login-phone');
    if (phoneInput) {
        const toggleBtn = await page.$('button[onclick*="toggleLoginMethod"]');
        if (toggleBtn) {
            await toggleBtn.click();
            await page.waitForTimeout(500);
        }
    }

    await page.type('#login-email-alt', 'simple@phoenix.com');
    await page.type('#login-password', 'test123456');
    await page.click('#login-btn');

    // 3. Wait for redirect
    console.log('3. Waiting for redirect...');
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log('\n📍 FINAL URL:', finalUrl);

    if (finalUrl.includes('dashboard')) {
        console.log('\n✅ SUCCESS - Stayed on dashboard!');
        console.log('✅ No redirect loop!');

        // Check if consciousness loaded
        await page.waitForTimeout(3000);

        const hasConsciousness = await page.evaluate(() => {
            return typeof window.PhoenixConsciousness !== 'undefined';
        });

        console.log('Consciousness system:', hasConsciousness ? '✅ Loaded' : '❌ Not loaded');

    } else {
        console.log('\n❌ FAILED - Redirected back to:', finalUrl);
    }

    console.log('\n⏸️  Browser left open. Press Ctrl+C to close.\n');

})().catch(err => console.error('Error:', err));
