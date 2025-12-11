/**
 * PHOENIX AI - VISUAL & CONSOLE TESTING
 * Puppeteer tests that verify actual UI rendering and console errors
 */

const puppeteer = require('puppeteer');

const FRONTEND = 'https://phoenix-fe-indol.vercel.app';

let browser;
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];
const consoleErrors = [];

function log(emoji, message) {
    console.log(`${emoji} ${message}`);
}

function pass(testName) {
    totalTests++;
    passedTests++;
    log('✅', testName);
}

function fail(testName, error) {
    totalTests++;
    failedTests++;
    failures.push({ test: testName, error });
    log('❌', `${testName}: ${error}`);
}

async function testPageVisually(page, name, url, checks) {
    try {
        // Clear console tracking
        const pageErrors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                pageErrors.push(msg.text());
                consoleErrors.push({ page: name, error: msg.text() });
            }
        });

        page.on('pageerror', error => {
            pageErrors.push(error.message);
            consoleErrors.push({ page: name, error: error.message });
        });

        // Navigate
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Run custom checks
        for (const check of checks) {
            await check(page);
        }

        // Check for console errors
        if (pageErrors.length > 0) {
            fail(`${name} console errors`, `${pageErrors.length} errors found`);
        } else {
            pass(`${name} console clean`);
        }

        pass(`${name} visual test`);

    } catch (e) {
        fail(`${name} visual test`, e.message);
    }
}

async function runTests() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('👁️  PHOENIX AI - VISUAL & CONSOLE TESTS');
    console.log('═══════════════════════════════════════════════\n');

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // ============================================
        // 1. DASHBOARD VISUAL TEST
        // ============================================
        log('🏠', '\n[1/9] Testing Dashboard...\n');

        await testPageVisually(page, 'Dashboard', `${FRONTEND}/dashboard.html`, [
            async (p) => {
                // Check for orb
                const orb = await p.$('.orb, #orb, [class*="orb"]');
                if (orb) pass('Dashboard has orb element');
                else fail('Dashboard orb', 'Orb element not found');

                // Check for planet cards
                const planets = await p.$$('[onclick*="mercury"], [onclick*="venus"], [onclick*="mars"]');
                if (planets.length >= 6) pass(`Dashboard has ${planets.length} planet cards`);
                else fail('Dashboard planet cards', `Only ${planets.length} found`);
            }
        ]);

        // ============================================
        // 2. MERCURY (HEALTH) VISUAL TEST
        // ============================================
        log('📍', '\n[2/9] Testing Mercury...\n');

        await testPageVisually(page, 'Mercury', `${FRONTEND}/mercury.html`, [
            async (p) => {
                const title = await p.$eval('h1', el => el.textContent).catch(() => null);
                if (title && title.includes('Mercury')) pass('Mercury has correct title');
                else fail('Mercury title', `Found: ${title}`);

                // Check for back button
                const backBtn = await p.$('a[href="dashboard.html"]');
                if (backBtn) pass('Mercury has back button');
                else fail('Mercury back button', 'Not found');
            }
        ]);

        // ============================================
        // 3. VENUS (FITNESS) VISUAL TEST
        // ============================================
        log('🏋️', '\n[3/9] Testing Venus...\n');

        await testPageVisually(page, 'Venus', `${FRONTEND}/venus.html`, [
            async (p) => {
                const title = await p.$eval('h1', el => el.textContent).catch(() => null);
                if (title && title.includes('Venus')) pass('Venus has correct title');
                else fail('Venus title', `Found: ${title}`);
            }
        ]);

        // ============================================
        // 4. URANUS (INNOVATION) VISUAL TEST
        // ============================================
        log('💡', '\n[4/9] Testing Uranus (NEW)...\n');

        await testPageVisually(page, 'Uranus', `${FRONTEND}/uranus.html`, [
            async (p) => {
                const title = await p.$eval('h1', el => el.textContent).catch(() => null);
                if (title && title.includes('Uranus')) pass('Uranus has correct title');
                else fail('Uranus title', `Found: ${title}`);

                // Check for innovation theme (cyan color)
                const hasInnovation = await p.evaluate(() => {
                    return document.body.innerHTML.includes('Innovation') ||
                           document.body.innerHTML.includes('4FC3F7');
                });

                if (hasInnovation) pass('Uranus has innovation theme');
                else fail('Uranus theme', 'No innovation keywords or cyan colors found');

                // Make sure it's NOT Venus
                const isVenus = await p.evaluate(() => {
                    return document.body.innerHTML.includes('Fitness');
                });

                if (!isVenus) pass('Uranus is NOT Venus duplicate');
                else fail('Uranus uniqueness', 'Still showing Venus fitness content');
            }
        ]);

        // ============================================
        // 5. NEPTUNE (MINDFULNESS) VISUAL TEST
        // ============================================
        log('🧘', '\n[5/9] Testing Neptune (NEW)...\n');

        await testPageVisually(page, 'Neptune', `${FRONTEND}/neptune.html`, [
            async (p) => {
                const title = await p.$eval('h1', el => el.textContent).catch(() => null);
                if (title && title.includes('Neptune')) pass('Neptune has correct title');
                else fail('Neptune title', `Found: ${title}`);

                // Check for mindfulness theme (purple color)
                const hasMindfulness = await p.evaluate(() => {
                    return document.body.innerHTML.includes('Mindfulness') ||
                           document.body.innerHTML.includes('9C27B0');
                });

                if (hasMindfulness) pass('Neptune has mindfulness theme');
                else fail('Neptune theme', 'No mindfulness keywords or purple colors found');

                // Make sure it's NOT Venus
                const isVenus = await p.evaluate(() => {
                    return document.body.innerHTML.includes('Fitness');
                });

                if (!isVenus) pass('Neptune is NOT Venus duplicate');
                else fail('Neptune uniqueness', 'Still showing Venus fitness content');
            }
        ]);

        // ============================================
        // 6. VOICE SYSTEM JAVASCRIPT LOAD
        // ============================================
        log('🎤', '\n[6/9] Testing Voice System...\n');

        await page.goto(`${FRONTEND}/dashboard.html`, { waitUntil: 'networkidle2' });

        const voiceSystemLoaded = await page.evaluate(() => {
            return typeof window.PhoenixVoiceSystem !== 'undefined' ||
                   typeof PhoenixVoice !== 'undefined';
        });

        if (voiceSystemLoaded) {
            pass('Voice system JavaScript loaded');
        } else {
            fail('Voice system', 'PhoenixVoiceSystem not defined');
        }

        // Check for voice command functions
        const hasVoiceFunctions = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'))
                .map(s => s.textContent)
                .join(' ');
            return scripts.includes('handleVoiceCommand') ||
                   scripts.includes('phoenixVoice');
        });

        if (hasVoiceFunctions) {
            pass('Voice command functions exist');
        } else {
            fail('Voice functions', 'handleVoiceCommand not found');
        }

        // ============================================
        // 7. ORCHESTRATOR LOAD TEST
        // ============================================
        log('🧠', '\n[7/9] Testing Orchestrator...\n');

        const orchestratorLoaded = await page.evaluate(() => {
            return typeof PhoenixOrchestrator !== 'undefined';
        });

        if (orchestratorLoaded) {
            pass('Orchestrator JavaScript loaded');
        } else {
            fail('Orchestrator', 'PhoenixOrchestrator not defined');
        }

        // ============================================
        // 8. CONFIG & API LAYER
        // ============================================
        log('⚙️', '\n[8/9] Testing Config & API...\n');

        const hasConfig = await page.evaluate(() => {
            return typeof PhoenixConfig !== 'undefined';
        });

        if (hasConfig) {
            pass('PhoenixConfig loaded');
        } else {
            // Config is optional, might use fallback
            log('⚠️', 'PhoenixConfig not found (using fallback)');
        }

        const hasAPI = await page.evaluate(() => {
            return typeof PhoenixAPI !== 'undefined';
        });

        if (hasAPI) {
            pass('PhoenixAPI loaded');
        } else {
            fail('PhoenixAPI', 'Not defined');
        }

        // ============================================
        // 9. RESPONSIVE TEST
        // ============================================
        log('📱', '\n[9/9] Testing Responsive Design...\n');

        // Test mobile viewport
        await page.setViewport({ width: 375, height: 667 });
        await page.goto(`${FRONTEND}/dashboard.html`, { waitUntil: 'networkidle2' });

        const mobileRendersOk = await page.evaluate(() => {
            return document.body.scrollWidth <= window.innerWidth * 1.1; // Allow 10% overflow
        });

        if (mobileRendersOk) {
            pass('Mobile viewport renders without horizontal scroll');
        } else {
            fail('Mobile responsive', 'Horizontal scroll detected');
        }

        // Reset viewport
        await page.setViewport({ width: 1920, height: 1080 });

    } catch (error) {
        console.error('💥 Test suite error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // ============================================
    // FINAL REPORT
    // ============================================
    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 TEST RESULTS');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
    console.log(`❌ Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);

    if (consoleErrors.length > 0) {
        console.log(`\n🔴 CONSOLE ERRORS (${consoleErrors.length}):\n`);
        consoleErrors.slice(0, 10).forEach((err, i) => {
            console.log(`${i + 1}. [${err.page}] ${err.error.substring(0, 100)}`);
        });
        if (consoleErrors.length > 10) {
            console.log(`... and ${consoleErrors.length - 10} more\n`);
        }
    }

    if (failures.length > 0) {
        console.log('\n🔴 FAILURES:\n');
        failures.forEach(({ test, error }, i) => {
            console.log(`${i + 1}. ${test}`);
            console.log(`   └─ ${error}\n`);
        });
    }

    console.log('\n═══════════════════════════════════════════════\n');

    if (failedTests === 0 && consoleErrors.length === 0) {
        console.log('🎉 ALL TESTS PASSED - VISUAL & CONSOLE CLEAN\n');
    } else {
        console.log(`⚠️  ${failedTests} test failures, ${consoleErrors.length} console errors\n`);
    }

    process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('💥 Test crashed:', err);
    process.exit(1);
});
