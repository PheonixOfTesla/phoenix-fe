/**
 * PRODUCTION TEST WITH FULL CONSOLE OUTPUT
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🌐 PRODUCTION LOGIN TEST - FULL CONSOLE OUTPUT\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    // Clear everything
    await page.evaluateOnNewDocument(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    // Capture ALL console messages
    page.on('console', msg => {
        const text = msg.text();
        console.log('BROWSER CONSOLE:', text);
    });

    // Monitor navigation
    page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) {
            console.log('📍 Navigated to:', frame.url());
        }
    });

    console.log('1. Loading https://phoenix-fe-indol.vercel.app\n');
    await page.goto('https://phoenix-fe-indol.vercel.app', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await page.waitForTimeout(2000);

    console.log('\n2. Entering credentials: simple@phoenix.com\n');

    // Switch to email if needed
    const phoneInput = await page.$('#login-phone');
    if (phoneInput) {
        await page.evaluate(() => {
            const btn = document.querySelector('button[onclick*="toggleLoginMethod"]');
            if (btn) btn.click();
        });
        await page.waitForTimeout(500);
    }

    await page.type('#login-email-alt', 'simple@phoenix.com', { delay: 50 });
    await page.type('#login-password', 'test123456', { delay: 50 });

    console.log('3. Clicking LOGIN button\n');
    await page.click('#login-btn');

    console.log('4. Waiting 10 seconds for all console output...\n');
    await page.waitForTimeout(10000);

    const finalUrl = page.url();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINAL RESULT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Final URL:', finalUrl);

    if (finalUrl.includes('dashboard')) {
        console.log('\n✅ SUCCESS - Stayed on dashboard!\n');
    } else {
        console.log('\n❌ FAILED - Redirected back to login\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Browser left open. Check console in DevTools. Press Ctrl+C to close.\n');

})().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
