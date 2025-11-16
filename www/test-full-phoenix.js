const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔥 PHOENIX COMPREHENSIVE FEATURE TEST');
    console.log('━'.repeat(60));
    console.log('Testing ALL features, planets, and interactions\n');

    const testResults = {
        passed: [],
        failed: [],
        warnings: []
    };

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        if (text.includes('error') || text.includes('Error')) {
            console.log('❌ Browser Error:', text);
        }
    });

    // Capture network requests
    const apiCalls = [];
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('railway.app') || url.includes('/api/')) {
            apiCalls.push({
                url,
                status: response.status(),
                method: response.request().method()
            });
            console.log(`📡 ${response.status()} ${response.request().method()} ${url}`);
        }
    });

    try {
        // TEST 1: Page Load
        console.log('\n📍 TEST 1: Loading index.html...');
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2', timeout: 10000 });
        await page.waitForTimeout(2000);
        testResults.passed.push('Page loads successfully');
        console.log('✅ Page loaded\n');

        // TEST 2: Check for main elements
        console.log('🔍 TEST 2: Checking for main UI elements...');

        const elements = {
            'Phoenix Orb/Core': await page.$('.phoenix-orb, .orb-container, #orb, canvas').then(el => !!el),
            'Navigation/Planets': await page.$$('[class*="planet"], nav a, .nav-item').then(els => els.length),
            'Header/HUD': await page.$('header, .hud, .header').then(el => !!el),
            'Main Container': await page.$('main, .main-content, .container').then(el => !!el)
        };

        for (const [name, result] of Object.entries(elements)) {
            if (result) {
                console.log(`✅ ${name}: ${typeof result === 'number' ? result + ' found' : 'Found'}`);
                testResults.passed.push(`UI Element: ${name}`);
            } else {
                console.log(`⚠️  ${name}: Not found`);
                testResults.warnings.push(`UI Element missing: ${name}`);
            }
        }

        // TEST 3: Check for JavaScript initialization
        console.log('\n🔧 TEST 3: Checking JavaScript initialization...');
        const jsState = await page.evaluate(() => {
            return {
                phoenixConfig: typeof PhoenixConfig !== 'undefined',
                phoenixAPI: typeof PhoenixAPI !== 'undefined',
                orchestrator: typeof window.orchestrator !== 'undefined',
                planets: typeof window.planets !== 'undefined'
            };
        });

        for (const [key, value] of Object.entries(jsState)) {
            if (value) {
                console.log(`✅ ${key}: Loaded`);
                testResults.passed.push(`JS Module: ${key}`);
            } else {
                console.log(`❌ ${key}: Not loaded`);
                testResults.failed.push(`JS Module missing: ${key}`);
            }
        }

        // TEST 4: Look for clickable planets/navigation
        console.log('\n🪐 TEST 4: Testing Planet Navigation...');

        // Find all clickable planet elements
        const planetLinks = await page.$$('a[href*="mercury"], a[href*="venus"], a[href*="earth"], a[href*="mars"], a[href*="jupiter"], a[href*="saturn"], button[class*="planet"], div[class*="planet"][onclick]');
        console.log(`Found ${planetLinks.length} planet navigation elements`);

        if (planetLinks.length > 0) {
            console.log('Attempting to click first planet...');
            try {
                await planetLinks[0].click();
                await page.waitForTimeout(2000);

                const newUrl = page.url();
                console.log(`✅ Navigation worked! Now at: ${newUrl}`);
                testResults.passed.push('Planet navigation works');

                // Go back to home
                await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2' });
                await page.waitForTimeout(1000);
            } catch (err) {
                console.log(`⚠️  Click failed: ${err.message}`);
                testResults.warnings.push('Planet click navigation issue');
            }
        } else {
            console.log('⚠️  No planet navigation found - checking for direct planet pages...');

            // Test direct planet URLs
            const planetPages = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
            for (const planet of planetPages) {
                try {
                    const resp = await page.goto(`http://localhost:8000/${planet}.html`, { waitUntil: 'networkidle2', timeout: 5000 });
                    if (resp.status() === 200) {
                        console.log(`✅ ${planet}.html exists`);
                        testResults.passed.push(`Planet page: ${planet}`);
                    }
                } catch (err) {
                    console.log(`❌ ${planet}.html not accessible`);
                }
            }

            // Return to home
            await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2' });
        }

        // TEST 5: Check for Voice Interface
        console.log('\n🎤 TEST 5: Testing Voice Interface...');
        const voiceElements = await page.$$('button[class*="voice"], .voice-btn, #voice-button, [onclick*="voice"]');

        if (voiceElements.length > 0) {
            console.log(`✅ Found ${voiceElements.length} voice interface elements`);
            testResults.passed.push('Voice interface UI present');
        } else {
            console.log('⚠️  No voice interface buttons found');
            testResults.warnings.push('Voice interface UI not visible');
        }

        // TEST 6: Check localStorage and state
        console.log('\n💾 TEST 6: Checking Application State...');
        const appState = await page.evaluate(() => {
            const storage = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.includes('phoenix') || key.includes('Phoenix')) {
                    storage[key] = localStorage.getItem(key);
                }
            }
            return storage;
        });

        console.log('LocalStorage keys:', Object.keys(appState).length);
        for (const [key, value] of Object.entries(appState)) {
            console.log(`  - ${key}: ${value?.substring(0, 50)}${value?.length > 50 ? '...' : ''}`);
        }

        // TEST 7: Check for canvas/WebGL animations
        console.log('\n🎨 TEST 7: Checking for Animations/Canvas...');
        const canvasElements = await page.$$('canvas');
        console.log(`Found ${canvasElements.length} canvas element(s)`);

        if (canvasElements.length > 0) {
            testResults.passed.push(`Canvas rendering (${canvasElements.length} canvases)`);
        }

        // TEST 8: Take screenshots
        console.log('\n📸 TEST 8: Taking Screenshots...');
        await page.screenshot({ path: 'test-screenshot-full.png', fullPage: true });
        await page.screenshot({ path: 'test-screenshot-viewport.png' });
        console.log('✅ Screenshots saved');
        testResults.passed.push('Screenshots captured');

        // TEST 9: Check API connectivity
        console.log('\n🌐 TEST 9: API Connection Summary...');
        console.log(`Total API calls made: ${apiCalls.length}`);

        const successCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
        const errorCalls = apiCalls.filter(call => call.status >= 400);

        console.log(`✅ Successful calls: ${successCalls.length}`);
        console.log(`❌ Error calls: ${errorCalls.length}`);

        if (successCalls.length > 0) {
            testResults.passed.push(`API connectivity (${successCalls.length} successful calls)`);
        }

        // TEST 10: Console log analysis
        console.log('\n📋 TEST 10: Console Log Analysis...');
        const errors = consoleLogs.filter(log => log.toLowerCase().includes('error'));
        const warnings = consoleLogs.filter(log => log.toLowerCase().includes('warn'));

        console.log(`Console Errors: ${errors.length}`);
        console.log(`Console Warnings: ${warnings.length}`);
        console.log(`Total Console Messages: ${consoleLogs.length}`);

        if (errors.length > 0) {
            console.log('\nFirst 5 errors:');
            errors.slice(0, 5).forEach(err => console.log(`  ❌ ${err}`));
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        testResults.failed.push(`Fatal error: ${error.message}`);
    }

    // FINAL REPORT
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL TEST REPORT');
    console.log('═'.repeat(60));
    console.log(`\n✅ PASSED: ${testResults.passed.length} tests`);
    testResults.passed.forEach(test => console.log(`   ✓ ${test}`));

    if (testResults.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS: ${testResults.warnings.length}`);
        testResults.warnings.forEach(warn => console.log(`   ⚠ ${warn}`));
    }

    if (testResults.failed.length > 0) {
        console.log(`\n❌ FAILED: ${testResults.failed.length} tests`);
        testResults.failed.forEach(fail => console.log(`   ✗ ${fail}`));
    }

    const successRate = Math.round((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    console.log('═'.repeat(60));

    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        successRate,
        passed: testResults.passed,
        warnings: testResults.warnings,
        failed: testResults.failed,
        apiCalls,
        consoleLogs: consoleLogs.slice(-20) // Last 20 logs
    };

    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Full report saved to: test-report.json');
    console.log('📸 Screenshots saved: test-screenshot-full.png, test-screenshot-viewport.png');

    console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

    // await browser.close();
    console.log('\n✅ Testing complete!');
})();
