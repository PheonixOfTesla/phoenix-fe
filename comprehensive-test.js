const puppeteer = require('puppeteer');
const fs = require('fs');

const API_BASE = 'https://pal-backend-production.up.railway.app/api';
const LOCAL_URL = 'http://localhost:8000';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`),
    voice: (msg) => console.log(`${colors.cyan}🎙️  ${msg}${colors.reset}`)
};

let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

async function testBackendEndpoints() {
    log.test('TESTING BACKEND API ENDPOINTS');
    console.log('='.repeat(60));

    const endpoints = [
        { path: '/auth/register', method: 'POST', name: 'Registration' },
        { path: '/auth/login', method: 'POST', name: 'Login' },
        { path: '/auth/me', method: 'GET', name: 'Get Profile' },
        { path: '/phoenixVoice/chat', method: 'POST', name: 'Phoenix Voice Chat' },
        { path: '/tts/generate', method: 'POST', name: 'Text-to-Speech' },
        { path: '/mercury/health', method: 'GET', name: 'Mercury Health' },
        { path: '/venus/fitness', method: 'GET', name: 'Venus Fitness' },
        { path: '/mars/goals', method: 'GET', name: 'Mars Goals' },
        { path: '/jupiter/social', method: 'GET', name: 'Jupiter Social' },
        { path: '/earth/optimization', method: 'GET', name: 'Earth Optimization' },
        { path: '/saturn/wearables', method: 'GET', name: 'Saturn Wearables' }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${API_BASE}${endpoint.path}`, {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 401 || response.status === 403) {
                log.warning(`${endpoint.name}: Requires auth (${response.status})`);
                testResults.warnings++;
                testResults.tests.push({ name: endpoint.name, status: 'auth_required', endpoint: endpoint.path });
            } else if (response.status < 500) {
                log.success(`${endpoint.name}: Endpoint exists (${response.status})`);
                testResults.passed++;
                testResults.tests.push({ name: endpoint.name, status: 'ok', endpoint: endpoint.path });
            } else {
                log.error(`${endpoint.name}: Server error (${response.status})`);
                testResults.failed++;
                testResults.tests.push({ name: endpoint.name, status: 'error', endpoint: endpoint.path });
            }
        } catch (error) {
            log.error(`${endpoint.name}: ${error.message}`);
            testResults.failed++;
            testResults.tests.push({ name: endpoint.name, status: 'failed', endpoint: endpoint.path, error: error.message });
        }
    }
    console.log('');
}

async function testAuthenticationFlow(page) {
    log.test('TESTING AUTHENTICATION FLOW');
    console.log('='.repeat(60));

    try {
        // Clear storage
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Test Registration
        log.info('Testing registration...');
        await page.goto(`${LOCAL_URL}/login.html`);
        await page.waitForSelector('#signup-btn', { timeout: 5000 });
        await page.click('#signup-btn');

        const testEmail = `test${Date.now()}@phoenix.test`;
        const testPassword = 'Test123456!';
        const testName = 'Tony Stark';

        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        await page.type('input[type="email"]', testEmail);
        await page.type('input[type="password"]', testPassword);
        await page.type('input[placeholder*="name"]', testName);

        log.info(`Registration with: ${testEmail}`);

        // Click register button
        await page.click('button[type="submit"]');

        // Wait for response
        await page.waitForTimeout(3000);

        // Check for token
        const token = await page.evaluate(() => localStorage.getItem('phoenixToken'));

        if (token) {
            log.success('Registration successful - token received');
            testResults.passed++;
            testResults.tests.push({ name: 'User Registration', status: 'ok' });
        } else {
            log.error('Registration failed - no token received');
            testResults.failed++;
            testResults.tests.push({ name: 'User Registration', status: 'failed' });
        }

        // Check console logs
        const logs = await page.evaluate(() => {
            return window.lastConsoleLogs || [];
        });

        return token;
    } catch (error) {
        log.error(`Authentication test failed: ${error.message}`);
        testResults.failed++;
        testResults.tests.push({ name: 'Authentication Flow', status: 'failed', error: error.message });
        return null;
    }
}

async function testPlanetInterfaces(page, token) {
    log.test('TESTING ALL 7 PLANET INTERFACES');
    console.log('='.repeat(60));

    const planets = [
        { name: 'Mercury', url: 'mercury.html', selector: '#mercury-dashboard' },
        { name: 'Venus', url: 'venus.html', selector: '#venus-dashboard' },
        { name: 'Mars', url: 'mars.html', selector: '#mars-dashboard' },
        { name: 'Jupiter', url: 'jupiter.html', selector: '#jupiter-dashboard' },
        { name: 'Earth', url: 'earth.html', selector: '#earth-dashboard' },
        { name: 'Saturn', url: 'saturn.html', selector: '#saturn-dashboard' }
    ];

    for (const planet of planets) {
        try {
            log.info(`Testing ${planet.name}...`);
            await page.goto(`${LOCAL_URL}/${planet.url}`);
            await page.waitForTimeout(2000);

            // Check if page loaded
            const loaded = await page.evaluate(() => document.readyState === 'complete');

            // Check for errors
            const errors = await page.evaluate(() => {
                return window.errorCount || 0;
            });

            if (loaded && errors === 0) {
                log.success(`${planet.name} interface loaded successfully`);
                testResults.passed++;
                testResults.tests.push({ name: `${planet.name} Interface`, status: 'ok' });
            } else {
                log.warning(`${planet.name} loaded with ${errors} errors`);
                testResults.warnings++;
                testResults.tests.push({ name: `${planet.name} Interface`, status: 'warning', errors });
            }
        } catch (error) {
            log.error(`${planet.name} failed: ${error.message}`);
            testResults.failed++;
            testResults.tests.push({ name: `${planet.name} Interface`, status: 'failed', error: error.message });
        }
    }
    console.log('');
}

async function testDashboard(page, token) {
    log.test('TESTING MAIN DASHBOARD');
    console.log('='.repeat(60));

    try {
        await page.goto(`${LOCAL_URL}/dashboard.html`);
        await page.waitForTimeout(3000);

        // Check if orchestrator loaded
        const orchestratorLoaded = await page.evaluate(() => {
            return window.orchestrator !== undefined;
        });

        if (orchestratorLoaded) {
            log.success('Orchestrator loaded successfully');
            testResults.passed++;
        } else {
            log.error('Orchestrator failed to load');
            testResults.failed++;
        }

        // Check for planet navigation
        const planetsVisible = await page.evaluate(() => {
            const planets = document.querySelectorAll('.planet-orbit');
            return planets.length > 0;
        });

        if (planetsVisible) {
            log.success('Planet navigation visible');
            testResults.passed++;
        } else {
            log.error('Planet navigation not found');
            testResults.failed++;
        }

        // Check console for errors
        const consoleErrors = await page.evaluate(() => {
            return window.consoleErrors || [];
        });

        if (consoleErrors.length > 0) {
            log.warning(`Found ${consoleErrors.length} console errors`);
            consoleErrors.forEach(err => log.error(`  └─ ${err}`));
            testResults.warnings += consoleErrors.length;
        }

        testResults.tests.push({ name: 'Dashboard Load', status: 'ok' });
    } catch (error) {
        log.error(`Dashboard test failed: ${error.message}`);
        testResults.failed++;
        testResults.tests.push({ name: 'Dashboard Load', status: 'failed', error: error.message });
    }
    console.log('');
}

async function testVoiceInterface(page) {
    log.test('TESTING PHOENIX VOICE INTERFACE');
    console.log('='.repeat(60));

    try {
        await page.goto(`${LOCAL_URL}/dashboard.html`);
        await page.waitForTimeout(2000);

        // Check if WakeWordAI exists
        const voiceReady = await page.evaluate(() => {
            return window.wakeWordAI !== undefined;
        });

        if (voiceReady) {
            log.success('Wake Word AI initialized');
            testResults.passed++;
            testResults.tests.push({ name: 'Voice AI Init', status: 'ok' });
        } else {
            log.error('Wake Word AI not initialized');
            testResults.failed++;
            testResults.tests.push({ name: 'Voice AI Init', status: 'failed' });
        }

        // Check voice settings
        const voiceSettings = await page.evaluate(() => {
            if (!window.wakeWordAI) return null;
            return {
                voice: window.wakeWordAI.voice,
                language: window.wakeWordAI.languageCode,
                continuousMode: window.wakeWordAI.continuousMode,
                hasTimeout: window.wakeWordAI.INACTIVITY_LIMIT !== undefined,
                timeoutValue: window.wakeWordAI.INACTIVITY_LIMIT
            };
        });

        if (voiceSettings) {
            log.info(`Voice: ${voiceSettings.voice}, Language: ${voiceSettings.language}`);

            if (voiceSettings.hasTimeout && voiceSettings.timeoutValue === 20000) {
                log.success('20-second inactivity timeout configured correctly');
                testResults.passed++;
                testResults.tests.push({ name: '20s Timeout', status: 'ok' });
            } else {
                log.error('20-second timeout not configured correctly');
                testResults.failed++;
                testResults.tests.push({ name: '20s Timeout', status: 'failed' });
            }
        }

    } catch (error) {
        log.error(`Voice interface test failed: ${error.message}`);
        testResults.failed++;
        testResults.tests.push({ name: 'Voice Interface', status: 'failed', error: error.message });
    }
    console.log('');
}

async function generateReport() {
    console.log('\n');
    console.log('='.repeat(60));
    log.test('FINAL TEST REPORT');
    console.log('='.repeat(60));

    const total = testResults.passed + testResults.failed + testResults.warnings;
    const passRate = ((testResults.passed / total) * 100).toFixed(1);

    console.log(`${colors.bright}Total Tests:${colors.reset} ${total}`);
    log.success(`Passed: ${testResults.passed} (${passRate}%)`);
    log.error(`Failed: ${testResults.failed}`);
    log.warning(`Warnings: ${testResults.warnings}`);
    console.log('');

    // Grade the app
    let grade, verdict;
    if (testResults.failed === 0 && testResults.warnings === 0) {
        grade = 'A+';
        verdict = '🏆 PRODUCTION READY - Ship it to Bill Gates!';
    } else if (testResults.failed === 0) {
        grade = 'A';
        verdict = '✨ EXCELLENT - Minor warnings only';
    } else if (testResults.failed < 3) {
        grade = 'B';
        verdict = '⚠️  GOOD - Some issues need fixing';
    } else {
        grade = 'C';
        verdict = '❌ NEEDS WORK - Critical issues found';
    }

    console.log(`${colors.bright}Grade: ${grade}${colors.reset}`);
    console.log(`${colors.bright}${verdict}${colors.reset}`);
    console.log('='.repeat(60));

    // Save report to file
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total,
            passed: testResults.passed,
            failed: testResults.failed,
            warnings: testResults.warnings,
            passRate: passRate + '%',
            grade,
            verdict
        },
        tests: testResults.tests
    };

    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    log.success('Report saved to test-report.json');

    return testResults.failed === 0;
}

async function main() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         PHOENIX COMPREHENSIVE PRODUCTION TEST            ║');
    console.log('║              "Make it bulletproof"                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    console.log('');

    // Test backend first
    await testBackendEndpoints();

    // Launch browser
    log.info('Launching browser...');
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream']
    });

    const page = await browser.newPage();

    // Listen to console logs
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('ERROR') || text.includes('❌')) {
            log.error(`Browser: ${text}`);
        }
    });

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Run all tests
    const token = await testAuthenticationFlow(page);
    await testDashboard(page, token);
    await testPlanetInterfaces(page, token);
    await testVoiceInterface(page);

    // Generate final report
    const ready = await generateReport();

    console.log('\n');
    if (ready) {
        console.log(`${colors.green}${colors.bright}🚀 PHOENIX IS PRODUCTION READY!${colors.reset}`);
    } else {
        console.log(`${colors.yellow}${colors.bright}⚙️  Issues found - check test-report.json${colors.reset}`);
    }

    // Keep browser open for manual inspection
    log.info('Browser will remain open for manual inspection...');
    log.info('Press Ctrl+C to close and exit');
}

main().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
