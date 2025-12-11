/**
 * FINAL PRODUCTION LOGIN TEST
 * Fresh browser, no cache
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🌐 PRODUCTION LOGIN TEST - FRESH BROWSER\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    // Create fresh context (no cache)
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    // Clear everything
    await page.evaluateOnNewDocument(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    let loginSucceeded = false;
    let dashboardLoaded = false;
    let redirectedBack = false;

    // Monitor navigation
    page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) {
            const url = frame.url();
            console.log('📍', url);

            if (url.includes('dashboard')) {
                dashboardLoaded = true;
            }
            if (dashboardLoaded && url.includes('index.html')) {
                redirectedBack = true;
            }
        }
    });

    // Monitor console for key messages
    page.on('console', msg => {
        const text = msg.text();

        if (text.includes('Login successful')) {
            loginSucceeded = true;
            console.log('✅ LOGIN SUCCESS');
        }

        if (text.includes('Token valid for')) {
            console.log('✅', text);
        }

        if (text.includes('Token expired')) {
            console.log('❌', text);
        }

        if (text.includes('Redirecting')) {
            console.log('🔄', text);
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

    console.log('4. Waiting 8 seconds...\n');
    await page.waitForTimeout(8000);

    const finalUrl = page.url();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINAL RESULT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Final URL:', finalUrl);
    console.log('Login succeeded:', loginSucceeded ? '✅ YES' : '❌ NO');
    console.log('Dashboard loaded:', dashboardLoaded ? '✅ YES' : '❌ NO');
    console.log('Redirected back:', redirectedBack ? '❌ YES (BAD)' : '✅ NO (GOOD)');

    if (finalUrl.includes('dashboard') && !redirectedBack) {
        console.log('\n✅✅✅ SUCCESS ✅✅✅');
        console.log('Login works! Dashboard loaded! No redirect loop!\n');
    } else {
        console.log('\n❌ FAILED');
        if (redirectedBack) {
            console.log('Dashboard loaded but redirected back to login\n');
        } else {
            console.log('Never made it to dashboard\n');
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Browser left open. Press Ctrl+C to close.\n');

})().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
