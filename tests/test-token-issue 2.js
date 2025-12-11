const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Testing Token Issue\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Login first
    console.log('1️⃣  Logging in...');
    await page.goto('http://localhost:8000/index.html');
    await page.waitForSelector('#login-form');

    // Switch to email login
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign in with email'));
        if (btn) btn.click();
    });

    await page.waitForTimeout(1000);

    // Login
    await page.type('#login-email-alt', 'simple@phoenix.com');
    await page.type('#login-password', 'test123456');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Logged in, now on dashboard\n');

    await page.waitForTimeout(5000); // Wait for dashboard init

    // Check token in localStorage
    const tokenInfo = await page.evaluate(() => {
        return {
            token: localStorage.getItem('phoenixToken'),
            user: localStorage.getItem('phoenixUser'),
            hasWindow: typeof window !== 'undefined',
            hasApi: typeof window.api !== 'undefined',
            apiType: window.api ? window.api.constructor.name : 'undefined'
        };
    });

    console.log('2️⃣  Token Check:');
    console.log(`   Token exists: ${tokenInfo.token ? 'YES' : 'NO'}`);
    console.log(`   Token value: ${tokenInfo.token ? tokenInfo.token.substring(0, 30) + '...' : 'NONE'}`);
    console.log(`   User data: ${tokenInfo.user ? 'EXISTS' : 'MISSING'}`);
    console.log(`   window.api exists: ${tokenInfo.hasApi ? 'YES' : 'NO'}`);
    console.log(`   API type: ${tokenInfo.apiType}\n`);

    // Test API call manually
    console.log('3️⃣  Testing Manual API Call:');
    const manualTest = await page.evaluate(async () => {
        const token = localStorage.getItem('phoenixToken');
        const url = 'https://pal-backend-production.up.railway.app/api/auth/me';

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            return {
                status: response.status,
                ok: response.ok,
                data: await response.json(),
                headers: {
                    authorization: `Bearer ${token.substring(0, 30)}...`
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    });

    console.log(`   Status: ${manualTest.status || 'ERROR'}`);
    console.log(`   OK: ${manualTest.ok || false}`);
    console.log(`   Response:`, JSON.stringify(manualTest.data || manualTest.error, null, 2));
    console.log(`   Auth header sent: ${manualTest.headers ? manualTest.headers.authorization : 'NO'}\n`);

    // Check if window.api is using the token
    console.log('4️⃣  Checking window.api configuration:');
    const apiConfig = await page.evaluate(() => {
        if (window.api) {
            return {
                hasToken: !!window.api.token,
                tokenValue: window.api.token ? window.api.token.substring(0, 30) + '...' : 'NONE',
                baseURL: window.api.baseURL || 'NOT SET',
                type: window.api.constructor.name
            };
        }
        return { error: 'window.api not found' };
    });

    console.log('   API Config:', JSON.stringify(apiConfig, null, 2));

    console.log('\n✅ Test complete. Browser will stay open.');
    await new Promise(() => {});
})();
