/**
 * TEST PRODUCTION LOGIN
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🌐 TESTING PRODUCTION LOGIN\n');
    console.log('URL: https://phoenix-fe-indol.vercel.app\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Track important logs
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Token') || text.includes('Login') || text.includes('Redirect')) {
            console.log('BROWSER:', text);
        }
    });

    // Track navigation
    let navigationCount = 0;
    page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) {
            navigationCount++;
            console.log(`[Nav ${navigationCount}] ${frame.url()}`);
        }
    });

    // 1. Load production site
    console.log('Step 1: Loading production site...\n');
    await page.goto('https://phoenix-fe-indol.vercel.app', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // 2. Check if on login page
    const currentUrl = page.url();
    console.log('Current page:', currentUrl);

    if (!currentUrl.includes('index.html') && !currentUrl.endsWith('/')) {
        console.log('❌ Not on login page');
        return;
    }

    // 3. Login
    console.log('\nStep 2: Logging in with simple@phoenix.com...\n');

    // Switch to email login if needed
    const phoneVisible = await page.$('#login-phone');
    if (phoneVisible) {
        console.log('Switching from phone to email login...');
        const toggle = await page.evaluate(() => {
            const btn = document.querySelector('button[onclick*="toggleLoginMethod"]');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });
        await page.waitForTimeout(500);
    }

    await page.type('#login-email-alt', 'simple@phoenix.com');
    await page.type('#login-password', 'test123456');

    console.log('Clicking login button...\n');
    await page.click('#login-btn');

    // 4. Wait and observe
    console.log('Step 3: Waiting for response...\n');
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log('\n📍 FINAL URL:', finalUrl);
    console.log('📊 Total navigations:', navigationCount);

    if (finalUrl.includes('dashboard')) {
        console.log('\n✅✅✅ SUCCESS ✅✅✅');
        console.log('✅ Login worked');
        console.log('✅ Stayed on dashboard');
        console.log('✅ No redirect loop\n');

        // Check consciousness
        await page.waitForTimeout(3000);
        const hasConsciousness = await page.evaluate(() => typeof window.PhoenixConsciousness !== 'undefined');
        console.log('Consciousness system:', hasConsciousness ? '✅ Loaded' : '⚠️  Not loaded');

    } else if (navigationCount > 3) {
        console.log('\n❌ REDIRECT LOOP DETECTED');
        console.log('Navigated', navigationCount, 'times - should be max 2 (login → dashboard)\n');
    } else {
        console.log('\n❌ LOGIN FAILED');
        console.log('Still on:', finalUrl, '\n');
    }

    console.log('⏸️  Browser left open for inspection. Press Ctrl+C to close.\n');

})().catch(err => console.error('Error:', err));
