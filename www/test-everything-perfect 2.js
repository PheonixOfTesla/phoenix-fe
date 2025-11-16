/**
 * COMPREHENSIVE PHOENIX TEST - EVERYTHING UNTIL PERFECT
 *
 * Tests:
 * 1. Register account
 * 2. Login
 * 3. Dashboard loads
 * 4. All 6 planets load and work
 * 5. Every feature on every planet
 * 6. Voice/AI interface
 * 7. Console errors
 * 8. Railway backend calls
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const TEST_EMAIL = `test_${Date.now()}@phoenix.test`;
const TEST_PASSWORD = 'TestPass123!';
const BACKEND_URL = 'https://pal-backend-production.up.railway.app';

// Test results
const results = {
    timestamp: new Date().toISOString(),
    passed: [],
    failed: [],
    warnings: [],
    apiCalls: [],
    consoleErrors: []
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(page, name) {
    const filename = `TEST-${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot: ${filename}`);
}

async function testStep(name, fn) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TEST: ${name}`);
    console.log('='.repeat(80));

    try {
        await fn();
        results.passed.push(name);
        console.log(`✅ PASSED: ${name}`);
        return true;
    } catch (error) {
        results.failed.push({ name, error: error.message });
        console.error(`❌ FAILED: ${name}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 STARTING COMPREHENSIVE PHOENIX TEST\n');
    console.log(`Backend: ${BACKEND_URL}`);
    console.log(`Test Email: ${TEST_EMAIL}\n`);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => {
        const text = msg.text();
        console.log(`🖥️  CONSOLE [${msg.type()}]: ${text}`);

        if (msg.type() === 'error') {
            results.consoleErrors.push(text);
        }
    });

    // Capture network requests to backend
    page.on('request', request => {
        const url = request.url();
        if (url.includes('pal-backend-production.up.railway.app')) {
            results.apiCalls.push({
                method: request.method(),
                url: url,
                timestamp: new Date().toISOString()
            });
            console.log(`📡 API CALL: ${request.method()} ${url}`);
        }
    });

    // Capture network responses
    page.on('response', async response => {
        const url = response.url();
        if (url.includes('pal-backend-production.up.railway.app')) {
            console.log(`📨 API RESPONSE: ${response.status()} ${url}`);
        }
    });

    try {
        // TEST 1: Load homepage
        await testStep('Load Homepage', async () => {
            await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
            await sleep(2000);
            await captureScreenshot(page, '1-homepage');

            const title = await page.title();
            if (!title.includes('Phoenix')) throw new Error(`Wrong title: ${title}`);
        });

        // TEST 2: Register account
        await testStep('Register New Account', async () => {
            // Look for register button/link
            const hasRegister = await page.evaluate(() => {
                return document.body.innerText.includes('Register') ||
                       document.body.innerText.includes('Sign Up') ||
                       document.body.innerText.includes('Create Account');
            });

            if (!hasRegister) {
                results.warnings.push('No visible register option - may need to create account via backend directly');
                throw new Error('Cannot find register option');
            }

            // Try to click register
            await page.click('button:has-text("Register"), a:has-text("Register"), button:has-text("Sign Up")');
            await sleep(1000);

            // Fill registration form
            await page.type('input[name="email"], input[type="email"]', TEST_EMAIL);
            await page.type('input[name="password"], input[type="password"]', TEST_PASSWORD);

            // Submit
            await page.click('button[type="submit"]');
            await sleep(3000);

            await captureScreenshot(page, '2-after-register');
        });

        // TEST 3: Login
        await testStep('Login with Account', async () => {
            // Check if already logged in from registration
            const currentUrl = page.url();
            if (currentUrl.includes('dashboard')) {
                console.log('Already logged in from registration');
                return;
            }

            // Navigate to login if needed
            if (!currentUrl.includes('index.html')) {
                await page.goto('http://localhost:8000/index.html');
            }

            await sleep(1000);

            // Fill login form
            await page.type('input[name="email"], input[type="email"]', TEST_EMAIL);
            await page.type('input[name="password"], input[type="password"]', TEST_PASSWORD);

            // Submit login
            await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
            await sleep(3000);

            await captureScreenshot(page, '3-after-login');

            // Verify we got a token
            const hasToken = await page.evaluate(() => {
                return !!localStorage.getItem('phoenixToken');
            });

            if (!hasToken) throw new Error('No auth token in localStorage after login');
        });

        // TEST 4: Dashboard loads
        await testStep('Dashboard Loads', async () => {
            const currentUrl = page.url();
            if (!currentUrl.includes('dashboard')) {
                await page.goto('http://localhost:8000/dashboard.html');
                await sleep(2000);
            }

            await captureScreenshot(page, '4-dashboard');

            // Check for planet orbs
            const planetCount = await page.evaluate(() => {
                return document.querySelectorAll('.planet-card, .planet-orb, [class*="planet"]').length;
            });

            if (planetCount < 6) {
                results.warnings.push(`Only found ${planetCount} planets on dashboard`);
            }
        });

        // TEST 5: Test MERCURY
        await testStep('Mercury Planet - Health Intelligence', async () => {
            await page.goto('http://localhost:8000/mercury.html');
            await sleep(3000);
            await captureScreenshot(page, '5-mercury');

            // Check for recovery ring
            const hasRecoveryRing = await page.evaluate(() => {
                return document.body.innerText.includes('Recovery') ||
                       document.querySelector('.recovery-ring, #recoveryScore');
            });

            if (!hasRecoveryRing) throw new Error('Mercury: No recovery ring found');

            // Try to click tabs
            const tabs = await page.$$('.tab');
            console.log(`   Found ${tabs.length} tabs on Mercury`);

            // Click through each tab
            for (let i = 0; i < Math.min(tabs.length, 5); i++) {
                await tabs[i].click();
                await sleep(500);
            }
        });

        // TEST 6: Test VENUS
        await testStep('Venus Planet - Fitness & Training', async () => {
            await page.goto('http://localhost:8000/venus.html');
            await sleep(3000);
            await captureScreenshot(page, '6-venus');

            // Check for workout features
            const hasWorkouts = await page.evaluate(() => {
                return document.body.innerText.includes('Workout') ||
                       document.body.innerText.includes('Nutrition');
            });

            if (!hasWorkouts) throw new Error('Venus: No workout/nutrition features found');

            // Try to click "Add Workout" button
            const addWorkoutBtn = await page.$('button:has-text("Log Workout"), button:has-text("Add Workout"), .action-button');
            if (addWorkoutBtn) {
                await addWorkoutBtn.click();
                await sleep(1000);
                await captureScreenshot(page, '6b-venus-modal');
            }
        });

        // TEST 7: Test MARS
        await testStep('Mars Planet - Goals & Habits', async () => {
            await page.goto('http://localhost:8000/mars.html');
            await sleep(3000);
            await captureScreenshot(page, '7-mars');

            // Check for OKR/habit features
            const hasGoals = await page.evaluate(() => {
                return document.body.innerText.includes('OKR') ||
                       document.body.innerText.includes('Habit') ||
                       document.body.innerText.includes('Goal');
            });

            if (!hasGoals) throw new Error('Mars: No OKR/habit features found');

            // Check for habit grid
            const hasHabitGrid = await page.$('.habit-grid, .habit-cell');
            if (hasHabitGrid) {
                console.log('   ✓ Found habit grid');
            }
        });

        // TEST 8: Test JUPITER
        await testStep('Jupiter Planet - Finance & Wealth', async () => {
            await page.goto('http://localhost:8000/jupiter.html');
            await sleep(3000);
            await captureScreenshot(page, '8-jupiter');

            // Check for financial features
            const hasFinance = await page.evaluate(() => {
                return document.body.innerText.includes('Net Worth') ||
                       document.body.innerText.includes('Transaction') ||
                       document.body.innerText.includes('Budget');
            });

            if (!hasFinance) throw new Error('Jupiter: No financial features found');

            // Try connect bank button
            const connectBtn = await page.$('button:has-text("Connect Bank"), .connect-button');
            if (connectBtn) {
                console.log('   ✓ Found Connect Bank button');
            }
        });

        // TEST 9: Test EARTH
        await testStep('Earth Planet - Calendar & Productivity', async () => {
            await page.goto('http://localhost:8000/earth.html');
            await sleep(3000);
            await captureScreenshot(page, '9-earth');

            // Check for calendar features
            const hasCalendar = await page.evaluate(() => {
                return document.body.innerText.includes('Calendar') ||
                       document.body.innerText.includes('Energy') ||
                       document.body.innerText.includes('Schedule');
            });

            if (!hasCalendar) throw new Error('Earth: No calendar features found');

            // Check for energy curve
            const hasEnergyCurve = await page.$('#energyCurve, .energy-curve');
            if (hasEnergyCurve) {
                console.log('   ✓ Found energy curve visualization');
            }
        });

        // TEST 10: Test SATURN
        await testStep('Saturn Planet - Legacy & Mortality', async () => {
            await page.goto('http://localhost:8000/saturn.html');
            await sleep(3000);
            await captureScreenshot(page, '10-saturn');

            // Check for mortality features
            const hasMortality = await page.evaluate(() => {
                return document.body.innerText.includes('week') ||
                       document.body.innerText.includes('Legacy') ||
                       document.body.innerText.includes('Review');
            });

            if (!hasMortality) throw new Error('Saturn: No mortality/legacy features found');
        });

        // TEST 11: Test Voice/AI Interface
        await testStep('Voice/AI Interface (3 tabs)', async () => {
            await page.goto('http://localhost:8000/dashboard.html');
            await sleep(2000);

            // Look for Phoenix orb or voice interface
            const hasPhoenixOrb = await page.$('.phoenix-orb, .voice-orb, #phoenixOrb');

            if (!hasPhoenixOrb) {
                throw new Error('Voice/AI interface not found on dashboard');
            }

            // Try to click the orb
            await hasPhoenixOrb.click();
            await sleep(1000);
            await captureScreenshot(page, '11-voice-interface');

            // Look for the 3 tabs (target, lightning, waveform icons)
            const modalTabs = await page.$$('.modal-tab, .voice-tab, [class*="tab"]');
            console.log(`   Found ${modalTabs.length} tabs in voice interface`);

            // Try clicking each tab
            for (let i = 0; i < Math.min(modalTabs.length, 3); i++) {
                await modalTabs[i].click();
                await sleep(500);
                await captureScreenshot(page, `11-voice-tab-${i + 1}`);
            }
        });

        // TEST 12: Check for console errors
        await testStep('Console Errors Check', async () => {
            if (results.consoleErrors.length > 0) {
                console.log(`⚠️  Found ${results.consoleErrors.length} console errors:`);
                results.consoleErrors.forEach(err => console.log(`   - ${err}`));

                // Don't fail test for console errors, just warn
                results.warnings.push(`${results.consoleErrors.length} console errors detected`);
            } else {
                console.log('✨ No console errors!');
            }
        });

        // TEST 13: Check API calls were made
        await testStep('Backend API Calls Check', async () => {
            if (results.apiCalls.length === 0) {
                throw new Error('No API calls made to backend - check config.js');
            }

            console.log(`✅ Made ${results.apiCalls.length} API calls to backend`);

            // Show unique endpoints called
            const uniqueEndpoints = [...new Set(results.apiCalls.map(c => {
                const url = new URL(c.url);
                return `${c.method} ${url.pathname}`;
            }))];

            console.log('\n📡 Endpoints called:');
            uniqueEndpoints.forEach(ep => console.log(`   ${ep}`));
        });

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error);
        await captureScreenshot(page, 'ERROR');
    }

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`📡 API Calls: ${results.apiCalls.length}`);
    console.log(`🐛 Console Errors: ${results.consoleErrors.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.failed.forEach(f => {
            console.log(`   - ${f.name}: ${f.error}`);
        });
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        results.warnings.forEach(w => console.log(`   - ${w}`));
    }

    // Save full report
    fs.writeFileSync('TEST-REPORT.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Full report saved to TEST-REPORT.json');

    // Keep browser open to inspect
    console.log('\n🔍 Browser staying open for inspection...');
    console.log('   Press Ctrl+C to close\n');

    await sleep(300000); // 5 minutes
    await browser.close();
}

main().catch(console.error);
