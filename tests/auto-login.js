/**
 * Auto-Login Script for Phoenix
 * Phone: 8087510813
 * Password: 123456
 */

const puppeteer = require('puppeteer');

async function autoLogin() {
    console.log('🔐 Starting Auto-Login...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    try {
        console.log('📄 Loading login page...');
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });

        // Wait for login form
        await page.waitForSelector('#login-phone', { timeout: 5000 });
        console.log('✅ Login form loaded\n');

        // Fill phone number
        console.log('📱 Entering phone number: 8087510813');
        await page.type('#login-phone', '8087510813', { delay: 50 });

        // Fill password
        console.log('🔑 Entering password: ******');
        await page.type('#login-password', '123456', { delay: 50 });

        console.log('⏳ Waiting 1 second before clicking login...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Click login button
        console.log('🚀 Clicking ACTIVATE PHOENIX button...');
        await page.click('#login-btn');

        // Wait for navigation or error
        console.log('⏳ Waiting for authentication...\n');

        try {
            // Wait for either dashboard or error
            await Promise.race([
                page.waitForNavigation({ timeout: 5000 }),
                page.waitForSelector('.error-message', { timeout: 5000 }),
                page.waitForSelector('.dashboard', { timeout: 5000 })
            ]);

            // Check current URL
            const currentUrl = page.url();
            console.log('📍 Current URL:', currentUrl);

            if (currentUrl.includes('dashboard') || currentUrl.includes('onboarding')) {
                console.log('\n✅ LOGIN SUCCESSFUL!');
                console.log('🎉 Welcome to Phoenix AI Dashboard!\n');

                // If on onboarding, skip to dashboard
                if (currentUrl.includes('onboarding')) {
                    console.log('📋 Onboarding detected, navigating to dashboard...');
                    await page.goto('http://localhost:8000/dashboard.html', { waitUntil: 'networkidle0' });
                }

                console.log('🌟 Dashboard loaded successfully!');
                console.log('🎤 Click "ENABLE MICROPHONE" to activate voice');
                console.log('🪐 Click any planet to explore features');
                console.log('\n💡 Browser will stay open for exploration...');
                console.log('   Press Ctrl+C to close\n');

                // Keep browser open
                await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes

            } else {
                // Check for error messages
                const errorElement = await page.$('.error-message, .alert-error');
                if (errorElement) {
                    const errorText = await page.evaluate(el => el.textContent, errorElement);
                    console.log('\n❌ LOGIN FAILED');
                    console.log('Error:', errorText);
                } else {
                    console.log('\n⚠️  Login status unknown');
                    console.log('Current page:', currentUrl);
                }
            }

        } catch (navError) {
            // Check if we're logged in despite timeout
            const currentUrl = page.url();
            if (currentUrl.includes('dashboard') || currentUrl.includes('onboarding')) {
                console.log('\n✅ LOGIN SUCCESSFUL (navigation timeout ignored)');
                console.log('🎉 You are now logged in!\n');
            } else {
                console.log('\n⚠️  Login response timeout - checking status...');

                // Take screenshot for debugging
                await page.screenshot({ path: '/tmp/login-state.png' });
                console.log('📸 Screenshot saved: /tmp/login-state.png');

                // Check for visible errors
                const bodyText = await page.evaluate(() => document.body.innerText);
                if (bodyText.includes('Invalid') || bodyText.includes('error') || bodyText.includes('failed')) {
                    console.log('\n❌ LOGIN FAILED');
                    console.log('Error detected on page');
                } else {
                    console.log('\n⏳ Still loading, please wait...');
                }
            }
        }

        // Keep browser open for manual use
        console.log('\n🤖 Browser staying open for manual exploration...');
        await new Promise(resolve => setTimeout(resolve, 300000));

    } catch (error) {
        console.error('\n❌ Auto-login error:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('   1. Make sure the local server is running (http://localhost:8000)');
        console.log('   2. Check that the backend API is accessible');
        console.log('   3. Verify credentials are correct:');
        console.log('      Phone: 8087510813');
        console.log('      Password: 123456');
        console.log('   4. Try manual login in the browser\n');

        // Keep browser open for manual login
        console.log('🌐 Browser staying open for manual login...');
        await new Promise(resolve => setTimeout(resolve, 60000));
    }
}

autoLogin().catch(console.error);
