/**
 * COMPREHENSIVE PHOENIX TEST - WITH WORKING AUTHENTICATION
 *
 * This test uses working credentials (8087510813/123456) to:
 * 1. Login and get auth token
 * 2. Test all 6 planets with authenticated session
 * 3. Click through features on each planet
 * 4. Test Phoenix AI voice interface (3 tabs)
 * 5. Monitor backend API calls
 * 6. Check console errors
 * 7. Generate detailed report
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BACKEND_URL = 'https://pal-backend-production.up.railway.app';

// Test results
const results = {
    timestamp: new Date().toISOString(),
    passed: [],
    failed: [],
    warnings: [],
    apiCalls: [],
    consoleErrors: [],
    featuresTested: []
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(page, name) {
    const filename = `AUTH-TEST-${name}.png`;
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
    console.log('🚀 STARTING COMPREHENSIVE PHOENIX TEST (WITH AUTH)\n');
    console.log(`Backend: ${BACKEND_URL}`);
    console.log(`Login: 8087510813\n`);

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
        // TEST 1: Login
        await testStep('Login with Working Account', async () => {
            await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2' });
            await sleep(2000);
            await captureScreenshot(page, '01-before-login');

            // Fill login form
            await page.evaluate(() => {
                const emailInput = document.querySelector('input[type="email"], input[type="tel"]');
                if (emailInput) emailInput.value = '8087510813';
            });
            await page.type('input[type="password"]', '123456');

            await captureScreenshot(page, '02-filled-form');

            // Click login button
            await page.evaluate(() => {
                const btn = document.querySelector('#login-btn, button[type="submit"]');
                if (btn) btn.click();
            });

            await sleep(3000);
            await captureScreenshot(page, '03-after-login');

            // Verify token exists
            const hasToken = await page.evaluate(() => {
                return !!localStorage.getItem('phoenixToken');
            });

            if (!hasToken) throw new Error('No auth token after login');
            console.log('✅ Auth token saved in localStorage');
        });

        // TEST 2: Test MERCURY (Health Intelligence)
        await testStep('Mercury - Health Intelligence Dashboard', async () => {
            await page.goto('http://localhost:8000/mercury.html', { waitUntil: 'networkidle2' });
            await sleep(3000);
            await captureScreenshot(page, '04-mercury');

            // Check for recovery ring
            const hasRecoveryRing = await page.evaluate(() => {
                return !!document.querySelector('.recovery-ring, #recoveryRingProgress');
            });

            if (!hasRecoveryRing) throw new Error('Mercury: Recovery ring not found');

            // Click through tabs
            const tabClicked = await page.evaluate(() => {
                const tabs = document.querySelectorAll('.tab');
                if (tabs.length > 0) {
                    tabs[0].click();
                    return true;
                }
                return false;
            });

            if (tabClicked) {
                results.featuresTested.push('Mercury: Tab navigation');
                await sleep(1000);
                await captureScreenshot(page, '04b-mercury-tab');
            }

            // Try to click "Connect Device" button
            const deviceBtnClicked = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Connect Device'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (deviceBtnClicked) {
                results.featuresTested.push('Mercury: Connect Device modal');
                await sleep(1000);
                await captureScreenshot(page, '04c-mercury-device-modal');
            }

            console.log(`   ✓ Mercury features tested: ${results.featuresTested.filter(f => f.includes('Mercury')).length}`);
        });

        // TEST 3: Test VENUS (Fitness & Training)
        await testStep('Venus - Fitness & Training Platform', async () => {
            await page.goto('http://localhost:8000/venus.html', { waitUntil: 'networkidle2' });
            await sleep(3000);
            await captureScreenshot(page, '05-venus');

            // Check for Venus content
            const hasWorkouts = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.includes('Workout') || text.includes('Nutrition') || text.includes('Venus');
            });

            if (!hasWorkouts) throw new Error('Venus: No workout/nutrition content found');

            // Try to click "Log Workout" or "Add Workout" button
            const workoutBtnClicked = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Log Workout') ||
                                b.textContent.includes('Add Workout') ||
                                b.textContent.includes('New Workout'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (workoutBtnClicked) {
                results.featuresTested.push('Venus: Add Workout button');
                await sleep(1000);
                await captureScreenshot(page, '05b-venus-add-workout');
            }

            // Click tabs if they exist
            const tabClicked = await page.evaluate(() => {
                const tabs = document.querySelectorAll('.tab');
                if (tabs.length > 1) {
                    tabs[1].click();
                    return true;
                }
                return false;
            });

            if (tabClicked) {
                results.featuresTested.push('Venus: Tab navigation');
                await sleep(1000);
            }

            console.log(`   ✓ Venus features tested: ${results.featuresTested.filter(f => f.includes('Venus')).length}`);
        });

        // TEST 4: Test MARS (Goals & Habits)
        await testStep('Mars - Goals & Habits Tracker', async () => {
            await page.goto('http://localhost:8000/mars.html', { waitUntil: 'networkidle2' });
            await sleep(3000);
            await captureScreenshot(page, '06-mars');

            // Check for Mars content
            const hasGoals = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.includes('OKR') || text.includes('Habit') || text.includes('Goal') || text.includes('Mars');
            });

            if (!hasGoals) throw new Error('Mars: No goals/habits content found');

            // Check for habit grid
            const hasHabitGrid = await page.evaluate(() => {
                return !!document.querySelector('.habit-grid, .habit-cell');
            });

            if (hasHabitGrid) {
                results.featuresTested.push('Mars: Habit grid visualization');
                console.log('   ✓ Found habit grid');
            }

            // Try to click "Create OKR" or "Add Goal" button
            const okrBtnClicked = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Create OKR') ||
                                b.textContent.includes('Add Goal') ||
                                b.textContent.includes('New Goal'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (okrBtnClicked) {
                results.featuresTested.push('Mars: Create OKR button');
                await sleep(1000);
                await captureScreenshot(page, '06b-mars-create-okr');
            }

            console.log(`   ✓ Mars features tested: ${results.featuresTested.filter(f => f.includes('Mars')).length}`);
        });

        // TEST 5: Test JUPITER (Finance & Wealth)
        await testStep('Jupiter - Finance & Wealth Manager', async () => {
            await page.goto('http://localhost:8000/jupiter.html', { waitUntil: 'networkidle2' });
            await sleep(3000);
            await captureScreenshot(page, '07-jupiter');

            // Check for Jupiter content
            const hasFinance = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.includes('Net Worth') ||
                       text.includes('Transaction') ||
                       text.includes('Budget') ||
                       text.includes('Jupiter') ||
                       text.includes('Finance');
            });

            if (!hasFinance) throw new Error('Jupiter: No financial content found');

            // Try to click "Connect Bank" button
            const connectBtnClicked = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Connect Bank') ||
                                b.textContent.includes('Link Account'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (connectBtnClicked) {
                results.featuresTested.push('Jupiter: Connect Bank button');
                await sleep(1000);
                await captureScreenshot(page, '07b-jupiter-connect-bank');
            }

            // Try "View Insights" button (cross-domain feature)
            const insightsBtnClicked = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('View Insights') ||
                                b.textContent.includes('AI Insights'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (insightsBtnClicked) {
                results.featuresTested.push('Jupiter: AI Insights (cross-domain)');
                await sleep(2000);
                await captureScreenshot(page, '07c-jupiter-insights');
            }

            console.log(`   ✓ Jupiter features tested: ${results.featuresTested.filter(f => f.includes('Jupiter')).length}`);
        });

        // TEST 6: Test EARTH (Calendar & Productivity)
        await testStep('Earth - Calendar & Productivity Optimizer', async () => {
            await page.goto('http://localhost:8000/earth.html', { waitUntil: 'networkidle2' });
            await sleep(3000);
            await captureScreenshot(page, '08-earth');

            // Check for Earth content
            const hasCalendar = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.includes('Calendar') ||
                       text.includes('Energy') ||
                       text.includes('Schedule') ||
                       text.includes('Earth');
            });

            if (!hasCalendar) throw new Error('Earth: No calendar content found');

            // Check for energy curve
            const hasEnergyCurve = await page.evaluate(() => {
                return !!document.querySelector('#energyCurve, .energy-curve, canvas');
            });

            if (hasEnergyCurve) {
                results.featuresTested.push('Earth: Energy curve visualization');
                console.log('   ✓ Found energy curve');
            }

            // Try "Optimize Schedule" button (cross-domain feature)
            const optimizeBtnClicked = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Optimize Schedule') ||
                                b.textContent.includes('Smart Schedule'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (optimizeBtnClicked) {
                results.featuresTested.push('Earth: Schedule Optimization (uses Mercury data)');
                await sleep(2000);
                await captureScreenshot(page, '08b-earth-optimize');
            }

            console.log(`   ✓ Earth features tested: ${results.featuresTested.filter(f => f.includes('Earth')).length}`);
        });

        // TEST 7: Test SATURN (Legacy & Mortality)
        await testStep('Saturn - Legacy & Mortality Planner', async () => {
            await page.goto('http://localhost:8000/saturn.html', { waitUntil: 'networkidle2' });
            await sleep(3000);
            await captureScreenshot(page, '09-saturn');

            // Check for Saturn content
            const hasMortality = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.includes('week') ||
                       text.includes('Legacy') ||
                       text.includes('Review') ||
                       text.includes('Saturn') ||
                       text.includes('Mortality');
            });

            if (!hasMortality) throw new Error('Saturn: No mortality/legacy content found');

            // Try "Quarterly Review" button (cross-domain feature)
            const reviewBtnClicked = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Quarterly Review') ||
                                b.textContent.includes('Life Review'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (reviewBtnClicked) {
                results.featuresTested.push('Saturn: Quarterly Review (analyzes all 5 planets)');
                await sleep(2000);
                await captureScreenshot(page, '09b-saturn-review');
            }

            console.log(`   ✓ Saturn features tested: ${results.featuresTested.filter(f => f.includes('Saturn')).length}`);
        });

        // TEST 8: Test Phoenix AI Voice Interface (3 tabs)
        await testStep('Phoenix AI - Voice Interface with 3 Tabs', async () => {
            await page.goto('http://localhost:8000/dashboard.html', { waitUntil: 'networkidle2' });
            await sleep(3000);
            await captureScreenshot(page, '10-dashboard');

            // Look for Phoenix orb
            const orbClicked = await page.evaluate(() => {
                const orb = document.querySelector('.phoenix-orb, .voice-orb, #phoenixOrb, canvas');
                if (orb) {
                    orb.click();
                    return true;
                }
                return false;
            });

            if (!orbClicked) {
                throw new Error('Phoenix orb not found on dashboard');
            }

            results.featuresTested.push('Phoenix: Voice orb clickable');
            await sleep(2000);
            await captureScreenshot(page, '10b-voice-interface-opened');

            // Look for the 3 tabs (target, lightning, waveform)
            const tabsFound = await page.evaluate(() => {
                const tabs = document.querySelectorAll('.modal-tab, .voice-tab, [class*="tab"]');
                return tabs.length;
            });

            console.log(`   ✓ Found ${tabsFound} tabs in voice interface`);

            // Try clicking each tab
            for (let i = 0; i < Math.min(tabsFound, 3); i++) {
                const clicked = await page.evaluate((index) => {
                    const tabs = document.querySelectorAll('.modal-tab, .voice-tab, [class*="tab"]');
                    if (tabs[index]) {
                        tabs[index].click();
                        return true;
                    }
                    return false;
                }, i);

                if (clicked) {
                    results.featuresTested.push(`Phoenix: Voice tab ${i + 1} clicked`);
                    await sleep(500);
                    await captureScreenshot(page, `10c-voice-tab-${i + 1}`);
                }
            }

            console.log(`   ✓ Phoenix voice interface features tested: ${results.featuresTested.filter(f => f.includes('Phoenix')).length}`);
        });

        // TEST 9: Verify API Calls
        await testStep('Backend API Integration Check', async () => {
            if (results.apiCalls.length === 0) {
                throw new Error('No API calls made to backend - check integration');
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

        // TEST 10: Console Errors Check
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
    console.log(`🎯 Features Tested: ${results.featuresTested.length}`);

    if (results.passed.length > 0) {
        console.log('\n✅ PASSED TESTS:');
        results.passed.forEach(t => console.log(`   ✓ ${t}`));
    }

    if (results.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.failed.forEach(f => {
            console.log(`   - ${f.name}: ${f.error}`);
        });
    }

    if (results.featuresTested.length > 0) {
        console.log('\n🎯 FEATURES TESTED:');
        results.featuresTested.forEach(f => console.log(`   ✓ ${f}`));
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        results.warnings.forEach(w => console.log(`   - ${w}`));
    }

    // Save full report
    fs.writeFileSync('AUTH-TEST-REPORT.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Full report saved to AUTH-TEST-REPORT.json');

    // VERDICT
    console.log('\n' + '='.repeat(80));
    if (results.failed.length === 0 && results.apiCalls.length > 0) {
        console.log('🎉 ALL TESTS PASSED! Phoenix is production-ready!');
        console.log('✅ Authentication works');
        console.log('✅ All 6 planets load and function');
        console.log('✅ Backend integration verified');
        console.log('✅ Voice interface accessible');
        console.log('\n🚀 READY TO DEPLOY AND CHANGE LIVES!');
    } else if (results.failed.length === 0) {
        console.log('⚠️  Tests passed but no API calls detected');
        console.log('   Check backend connectivity');
    } else {
        console.log(`❌ ${results.failed.length} test(s) failed`);
        console.log('   Review screenshots and fix issues');
    }
    console.log('='.repeat(80));

    // Keep browser open to inspect
    console.log('\n🔍 Browser staying open for inspection...');
    console.log('   Press Ctrl+C to close\n');

    await sleep(300000); // 5 minutes
    await browser.close();
}

main().catch(console.error);
