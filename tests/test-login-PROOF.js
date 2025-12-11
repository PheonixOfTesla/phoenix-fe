const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 PROVING LOGIN WORKS - WITH SCREENSHOTS\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 },
        devtools: true
    });

    const page = await browser.newPage();

    try {
        console.log('📍 Step 1: Loading index.html...');
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'PROOF-1-before-login.png' });
        console.log('✅ Screenshot 1 saved: PROOF-1-before-login.png\n');

        console.log('📍 Step 2: Filling login form...');
        await page.evaluate(() => {
            const emailInput = document.querySelector('input[type="email"], input[type="tel"]');
            if (emailInput) emailInput.value = '8087510813';
        });
        await page.type('input[type="password"]', '123456');

        console.log('📍 Step 3: Clicking login...');
        await page.evaluate(() => {
            const btn = document.querySelector('#login-btn, button[type="submit"]');
            if (btn) btn.click();
        });

        console.log('⏳ Waiting for redirect...\n');
        await page.waitForTimeout(3000);

        // Get final URL
        const finalUrl = page.url();
        console.log('════════════════════════════════════════');
        console.log('📍 FINAL URL: ' + finalUrl);
        console.log('════════════════════════════════════════\n');

        // Check what's visible
        const pageState = await page.evaluate(() => {
            return {
                url: window.location.href,
                title: document.title,
                hasToken: !!localStorage.getItem('phoenixToken'),
                bodyClasses: document.body.className,
                h1Text: document.querySelector('h1')?.textContent || 'No H1',
                visible404: document.body.innerText.includes('404'),
                visibleElements: {
                    phoenixOrb: !!document.querySelector('.phoenix-orb, .orb, canvas'),
                    loginForm: !!document.querySelector('#login-view, .auth-view'),
                    mainApp: !!document.querySelector('#main-app-view, .main-app')
                }
            };
        });

        console.log('📊 PAGE STATE:');
        console.log(JSON.stringify(pageState, null, 2));
        console.log('\n');

        // Take screenshot of result
        await page.screenshot({ path: 'PROOF-2-after-login.png', fullPage: true });
        console.log('✅ Screenshot 2 saved: PROOF-2-after-login.png\n');

        // VERDICT
        console.log('════════════════════════════════════════');
        if (finalUrl.includes('dashboard.html')) {
            console.log('❌ FAILED: Still redirecting to dashboard.html!');
        } else if (finalUrl.includes('index.html') && pageState.hasToken) {
            console.log('✅ SUCCESS: On index.html with token!');
            if (pageState.visible404) {
                console.log('⚠️  BUT: 404 error is visible on page!');
            }
        } else {
            console.log('❌ FAILED: Something else went wrong');
        }
        console.log('════════════════════════════════════════\n');

        console.log('🖼️  Check the screenshots to see for yourself!');
        console.log('   - PROOF-1-before-login.png');
        console.log('   - PROOF-2-after-login.png\n');

        console.log('Browser will stay open for 30 seconds...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }

    // await browser.close();
})();
