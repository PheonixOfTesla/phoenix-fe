const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:8000');
    await page.waitForSelector('#loginPhone');
    await page.type('#loginPhone', '8087510813');
    await page.type('#loginPassword', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const planets = [
        { name: 'Mercury', url: 'http://localhost:8000/mercury.html' },
        { name: 'Venus', url: 'http://localhost:8000/venus.html' },
        { name: 'Mars', url: 'http://localhost:8000/mars.html' },
        { name: 'Jupiter', url: 'http://localhost:8000/jupiter.html' },
        { name: 'Earth', url: 'http://localhost:8000/earth.html' },
        { name: 'Saturn', url: 'http://localhost:8000/saturn.html' }
    ];

    for (const planet of planets) {
        console.log(`\n📸 Checking ${planet.name}...`);
        await page.goto(planet.url);
        await page.waitForTimeout(2000);

        // Check for common placeholder text
        const bodyText = await page.evaluate(() => document.body.innerText);

        if (bodyText.includes('coming soon') || bodyText.includes('will be') || bodyText.includes('Coming Soon')) {
            console.log(`❌ ${planet.name}: Contains placeholder text`);
            console.log(`   Found: ${bodyText.substring(0, 200)}...`);
        } else {
            console.log(`✅ ${planet.name}: No placeholder text found`);
        }

        // Take screenshot
        await page.screenshot({ path: `VISUAL-${planet.name}.png`, fullPage: true });
    }

    console.log('\n✅ Visual test complete. Check VISUAL-*.png files.');
    await browser.close();
})();
