const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Opening Phoenix and attempting auto-login...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: { width: 1920, height: 1080 },
        devtools: true
    });

    const page = await browser.newPage();

    // Disable cache
    const client = await page.target().createCDPSession();
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });

    // Monitor console and network
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('error') || text.includes('Error')) {
            console.log('❌ Browser Error:', text);
        } else if (text.includes('success') || text.includes('Success') || text.includes('login')) {
            console.log('✅ Browser:', text);
        }
    });

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/auth/login')) {
            console.log(`📡 Login API: ${response.status()}`);
            try {
                const data = await response.json();
                console.log('   Response:', JSON.stringify(data, null, 2));
            } catch (e) {}
        }
    });

    try {
        // Navigate to main page
        console.log('📍 Loading index.html...');
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);

        console.log('🔍 Looking for login form...\n');

        // Check if login form is visible
        const loginFormVisible = await page.evaluate(() => {
            // Look for email/phone input
            const emailInput = document.querySelector('input[type="email"], input[type="tel"], input[name="email"], input[placeholder*="mail"], input[placeholder*="phone"]');
            const passwordInput = document.querySelector('input[type="password"]');

            if (emailInput && passwordInput) {
                // Check if they're visible
                const emailRect = emailInput.getBoundingClientRect();
                const passRect = passwordInput.getBoundingClientRect();
                return emailRect.width > 0 && passRect.width > 0;
            }
            return false;
        });

        if (loginFormVisible) {
            console.log('✅ Login form found!\n');

            // Fill in credentials
            console.log('✍️  Entering credentials...');
            console.log('   Phone: 8087510813');
            console.log('   Password: 123456\n');

            // Type into email/phone field
            await page.evaluate(() => {
                const emailInput = document.querySelector('input[type="email"], input[type="tel"], input[name="email"], input[placeholder*="mail"], input[placeholder*="phone"]');
                if (emailInput) emailInput.value = '8087510813';
            });

            await page.type('input[type="password"]', '123456');

            // Find and click submit button
            console.log('🔘 Clicking login button...');
            const submitClicked = await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"], button.submit-btn, #login-btn') ||
                                  Array.from(document.querySelectorAll('button')).find(btn =>
                                    btn.textContent.toLowerCase().includes('login') ||
                                    btn.textContent.toLowerCase().includes('sign in')
                                  );
                if (submitBtn) {
                    submitBtn.click();
                    return true;
                }
                return false;
            });

            if (submitClicked) {
                console.log('✅ Submit button clicked\n');
                console.log('⏳ Waiting for API response...\n');
                await page.waitForTimeout(3000);

                // Check if logged in
                const loginSuccess = await page.evaluate(() => {
                    return !!localStorage.getItem('phoenixToken');
                });

                if (loginSuccess) {
                    console.log('🎉 LOGIN SUCCESSFUL!\n');
                    console.log('✅ Token saved to localStorage');
                    console.log('✅ You are now logged in!\n');
                } else {
                    console.log('❌ Login failed - no token found\n');
                    console.log('💡 This might mean:');
                    console.log('   - Invalid credentials');
                    console.log('   - Backend API issue');
                    console.log('   - Account doesn\'t exist\n');
                    console.log('🔧 Try registering first or check backend logs\n');
                }
            } else {
                console.log('❌ Could not find submit button\n');
            }
        } else {
            console.log('⚠️  No login form visible on the page\n');
            console.log('💡 Checking if already logged in or if page layout is different...\n');

            // Check current view
            const pageInfo = await page.evaluate(() => {
                return {
                    hasToken: !!localStorage.getItem('phoenixToken'),
                    bodyText: document.body.innerText.substring(0, 200),
                    inputCount: document.querySelectorAll('input').length,
                    buttonCount: document.querySelectorAll('button').length
                };
            });

            console.log('Page Info:', pageInfo);
        }

        console.log('\n🌐 Browser ready for manual testing!');
        console.log('💡 DevTools is open - check Console and Network tabs');
        console.log('🎮 Browser will stay open until you close it\n');

        // Keep browser alive
        await new Promise(resolve => {
            browser.on('disconnected', () => {
                console.log('👋 Browser closed');
                resolve();
            });
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
})();
