/**
 * TEST ACTUAL LOGIN FLOW
 * Tests what the user experiences when trying to login
 */

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Track console messages
    page.on('console', msg => {
        console.log('BROWSER:', msg.text());
    });

    // Track errors
    page.on('pageerror', error => {
        console.error('PAGE ERROR:', error.message);
    });

    console.log('\n🧪 TESTING LOGIN FLOW\n');

    // Step 1: Load index page
    console.log('1. Loading http://localhost:8000...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded\n');

    // Step 2: Enter credentials
    console.log('2. Entering credentials...');

    // Check if phone or email login is visible
    const phoneInput = await page.$('#login-phone');
    const emailInput = await page.$('#login-email-alt');

    if (emailInput) {
        console.log('   Using email login');
        await page.type('#login-email-alt', 'simple@phoenix.com');
    } else if (phoneInput) {
        console.log('   Phone login is active - need to switch to email');
        // Find toggle button
        const toggleBtn = await page.$('button[onclick*="toggleLoginMethod"]');
        if (toggleBtn) {
            await toggleBtn.click();
            await page.waitForTimeout(500);
            await page.type('#login-email-alt', 'simple@phoenix.com');
        }
    }

    await page.type('#login-password', 'test123456');
    console.log('✅ Credentials entered\n');

    // Step 3: Click login
    console.log('3. Clicking login button...');
    await page.click('#login-btn');
    console.log('✅ Button clicked\n');

    // Step 4: Wait for response
    console.log('4. Waiting for response...');
    await page.waitForTimeout(3000);

    // Check if still on index or redirected to dashboard
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('dashboard')) {
        console.log('\n✅ SUCCESS - Redirected to dashboard!\n');

        // Check if consciousness system loaded
        await page.waitForTimeout(3000); // Wait for consciousness init

        const hasConsciousness = await page.evaluate(() => {
            return typeof window.PhoenixConsciousness !== 'undefined';
        });

        console.log('Consciousness system loaded:', hasConsciousness ? '✅ YES' : '❌ NO');

        // Check if orb is visible
        const hasOrb = await page.$('#phoenix-core-container');
        console.log('Orb element present:', hasOrb ? '✅ YES' : '❌ NO');

        // Check for any errors
        const errors = await page.evaluate(() => {
            return window.__phoenixErrors || [];
        });

        if (errors.length > 0) {
            console.log('\n⚠️  ERRORS DETECTED:');
            errors.forEach(err => console.log('  -', err));
        }

    } else {
        console.log('\n❌ FAILED - Still on index.html\n');

        // Check for error message
        const errorMsg = await page.$eval('#auth-error', el => el.textContent).catch(() => null);
        if (errorMsg) {
            console.log('Error message:', errorMsg);
        }

        // Check network responses
        console.log('\nCheck browser console above for API errors');
    }

    console.log('\n⏸️  Browser left open for manual inspection. Press Ctrl+C to close.\n');

    // Keep browser open for manual inspection
    // await browser.close();
})();
