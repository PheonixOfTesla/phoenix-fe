const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Starting Phoenix Login Test...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: { width: 1280, height: 800 },
        timeout: 60000
    });

    const page = await browser.newPage();

    // Enable console logging from the browser
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Phoenix') || text.includes('API') || text.includes('error') || text.includes('Error')) {
            console.log('🖥️  Browser Console:', text);
        }
    });

    // Listen for network requests
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('railway.app') || url.includes('api')) {
            console.log(`📡 API Request: ${response.status()} ${url}`);
            try {
                const json = await response.json();
                console.log('   Response:', JSON.stringify(json, null, 2));
            } catch (e) {
                // Not JSON
            }
        }
    });

    try {
        // Navigate directly to index.html (login was removed)
        console.log('📍 Navigating to http://localhost:8000/index.html');
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2' });

        console.log('⏳ Waiting for page to load...');
        await page.waitForTimeout(3000);

        // Check if dashboard loaded
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);

        // Check for Phoenix elements
        const hasPhoenixCore = await page.$('.phoenix-core, #phoenix-core, .reactor-core').then(el => !!el);
        console.log(`🔍 Phoenix Core found: ${hasPhoenixCore ? '✅' : '❌'}`);

        // Check for planets
        const hasPlanets = await page.$$('.planet, [class*="planet"]').then(els => els.length);
        console.log(`🪐 Planets found: ${hasPlanets}`);

        // Check localStorage for any existing data
        const storage = await page.evaluate(() => {
            return {
                token: localStorage.getItem('phoenixToken'),
                user: localStorage.getItem('phoenixUser'),
                activated: localStorage.getItem('phoenixActivated'),
                onboardingComplete: localStorage.getItem('phoenixOnboardingComplete')
            };
        });
        console.log('💾 LocalStorage:', JSON.stringify(storage, null, 2));

        // Check page title
        const title = await page.title();
        console.log(`📄 Page Title: ${title}`);

        // Wait a bit to see the result
        console.log('\n⏳ Keeping browser open for 10 seconds to inspect...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    // await browser.close();
    console.log('\n✅ Test complete! Browser left open for inspection.');
})();
