const puppeteer = require('puppeteer');

(async () => {
    console.log('🎯 PHASE 1: CRITICAL PATH TEST\n');
    console.log('Testing: Login → Dashboard → Phoenix Voice → Text Responses → 7 Planets\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-capture']
    });

    const page = await browser.newPage();

    // Track results
    const results = {
        login: false,
        dashboard: false,
        phoenixOrb: false,
        voiceActivation: false,
        textResponse: false,
        planets: {
            mercury: false,
            venus: false,
            mars: false,
            jupiter: false,
            saturn: false,
            uranus: false,
            neptune: false
        }
    };

    try {
        // ===================================================================
        // TEST 1: LOGIN
        // ===================================================================
        console.log('📝 TEST 1: Login to Production Site');
        console.log('   URL: https://phoenix-fe-indol.vercel.app\n');

        await page.goto('https://phoenix-fe-indol.vercel.app/index.html');
        await page.waitForSelector('#login-form', { timeout: 10000 });

        // Clear localStorage to ensure fresh token
        await page.evaluate(() => localStorage.clear());

        // Switch to email login
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b =>
                b.textContent.includes('Sign in with email')
            );
            if (btn) btn.click();
        });
        await page.waitForTimeout(1000);

        // Login with existing verified user
        await page.type('#login-email-alt', 'simple@phoenix.com');
        await page.type('#login-password', 'test123456');
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });

        const currentUrl = page.url();
        if (currentUrl.includes('dashboard.html')) {
            console.log('   ✅ Login successful - redirected to dashboard');
            results.login = true;
        } else {
            console.log(`   ❌ Login failed - URL: ${currentUrl}`);
            throw new Error('Login failed');
        }

        // ===================================================================
        // TEST 2: DASHBOARD LOADS
        // ===================================================================
        console.log('\n📝 TEST 2: Dashboard Initialization');

        await page.waitForTimeout(5000); // Wait for dashboard init

        const dashboardElements = await page.evaluate(() => {
            return {
                hasOrb: !!document.getElementById('jarvis-orb'),
                hasGreeting: !!document.getElementById('greeting'),
                greetingText: document.getElementById('greeting')?.textContent || '',
                hasPlanetButtons: document.querySelectorAll('[onclick*="openPlanetHologram"]').length
            };
        });

        if (dashboardElements.hasOrb) {
            console.log('   ✅ Phoenix Orb present');
            results.phoenixOrb = true;
        } else {
            console.log('   ❌ Phoenix Orb missing');
        }

        if (dashboardElements.hasGreeting) {
            console.log(`   ✅ User greeting: "${dashboardElements.greetingText}"`);
        } else {
            console.log('   ❌ User greeting missing');
        }

        console.log(`   ℹ️  Planet buttons found: ${dashboardElements.hasPlanetButtons}`);

        if (dashboardElements.hasOrb && dashboardElements.hasGreeting) {
            results.dashboard = true;
        }

        // ===================================================================
        // TEST 3: PHOENIX VOICE ACTIVATION
        // ===================================================================
        console.log('\n📝 TEST 3: Phoenix Voice Activation');

        // Click Phoenix orb
        await page.click('#jarvis-orb');
        await page.waitForTimeout(2000);

        const voiceState = await page.evaluate(() => {
            return {
                orbActive: document.getElementById('jarvis-orb')?.classList.contains('active'),
                hasVoiceSystem: typeof window.voiceSystem !== 'undefined',
                continuousMode: window.voiceSystem?.continuousMode || false
            };
        });

        if (voiceState.orbActive) {
            console.log('   ✅ Phoenix orb activated (visual)');
        } else {
            console.log('   ⚠️  Phoenix orb not visually active');
        }

        if (voiceState.hasVoiceSystem) {
            console.log('   ✅ Voice system initialized');
            results.voiceActivation = true;
        } else {
            console.log('   ❌ Voice system not initialized');
        }

        if (voiceState.continuousMode) {
            console.log('   ✅ Continuous mode activated');
        } else {
            console.log('   ⚠️  Continuous mode not active');
        }

        // ===================================================================
        // TEST 4: TEXT RESPONSE FROM PHOENIX
        // ===================================================================
        console.log('\n📝 TEST 4: Phoenix Text Response');
        console.log('   Simulating user speech: "What\'s my health status?"');

        // Get fresh token via API (more reliable than using localStorage token)
        console.log('   🔐 Getting fresh authentication token...');

        let token = null;
        try {
            const loginRes = await fetch('https://pal-backend-production.up.railway.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'simple@phoenix.com', password: 'test123456' })
            });
            const loginData = await loginRes.json();
            token = loginData.token;
            console.log('   ✅ Fresh token obtained');
        } catch (e) {
            console.log('   ❌ Failed to get fresh token:', e.message);
            results.textResponse = false;
        }

        if (token) {
            console.log('   📤 Making API call...');

            // Make API call from Node context (not browser) to avoid CORS/browser issues
            try {
                const https = require('https');

                const apiResponse = await new Promise((resolve, reject) => {
                    const postData = JSON.stringify({
                        message: "What's my health status?",
                        conversationHistory: [],
                        personality: 'friendly_helpful',
                        voice: 'nova'
                    });

                    const options = {
                        hostname: 'pal-backend-production.up.railway.app',
                        path: '/api/phoenixVoice/chat',
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        }
                    };

                    const req = https.request(options, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => {
                            try {
                                resolve({ status: res.statusCode, data: JSON.parse(data) });
                            } catch (e) {
                                resolve({ status: res.statusCode, data: { error: 'Parse error', raw: data } });
                            }
                        });
                    });

                    req.on('error', reject);
                    req.write(postData);
                    req.end();
                });

                if (apiResponse.status === 200 && apiResponse.data.success) {
                    console.log('   ✅ Phoenix responded successfully');
                    console.log(`   Response: "${apiResponse.data.response}"`);
                    console.log(`   Tokens: ${apiResponse.data.tokensUsed}`);
                    results.textResponse = true;
                } else {
                    console.log(`   ❌ Phoenix failed to respond`);
                    console.log(`   HTTP ${apiResponse.status}`);
                    if (apiResponse.data.error) {
                        console.log(`   Error: ${apiResponse.data.error}`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ Request failed: ${error.message}`);
            }
        }


        // ===================================================================
        // TEST 5: ALL 7 PLANET NAVIGATION
        // ===================================================================
        console.log('\n📝 TEST 5: Planet Navigation');

        const planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

        for (const planet of planets) {
            console.log(`\n   Testing ${planet.toUpperCase()}...`);

            // Navigate to planet page
            const planetUrl = `https://phoenix-fe-indol.vercel.app/${planet}.html`;

            try {
                const response = await page.goto(planetUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 10000
                });

                if (response.status() === 200) {
                    console.log(`   ✅ ${planet}.html loads (HTTP 200)`);

                    // Check for basic planet interface elements
                    const hasPlanetContent = await page.evaluate(() => {
                        const body = document.body.textContent;
                        return body.length > 100; // Basic check that page has content
                    });

                    if (hasPlanetContent) {
                        console.log(`   ✅ ${planet} page has content`);
                        results.planets[planet] = true;
                    } else {
                        console.log(`   ⚠️  ${planet} page may be empty`);
                    }
                } else {
                    console.log(`   ❌ ${planet}.html failed (HTTP ${response.status()})`);
                }
            } catch (error) {
                console.log(`   ❌ ${planet}.html error: ${error.message}`);
            }

            await page.waitForTimeout(1000);
        }

        // Return to dashboard
        await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html');
        await page.waitForTimeout(2000);

        // ===================================================================
        // RESULTS SUMMARY
        // ===================================================================
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('📊 CRITICAL PATH TEST RESULTS');
        console.log('═══════════════════════════════════════════════════════════\n');

        const totalTests = 5 + Object.keys(results.planets).length;
        let passedTests = 0;

        console.log('Core Functionality:');
        console.log(`  ${results.login ? '✅' : '❌'} Login`);
        if (results.login) passedTests++;

        console.log(`  ${results.dashboard ? '✅' : '❌'} Dashboard Load`);
        if (results.dashboard) passedTests++;

        console.log(`  ${results.phoenixOrb ? '✅' : '❌'} Phoenix Orb`);
        if (results.phoenixOrb) passedTests++;

        console.log(`  ${results.voiceActivation ? '✅' : '❌'} Voice System`);
        if (results.voiceActivation) passedTests++;

        console.log(`  ${results.textResponse ? '✅' : '❌'} Text Responses`);
        if (results.textResponse) passedTests++;

        console.log('\nPlanet Navigation:');
        for (const [planet, passed] of Object.entries(results.planets)) {
            console.log(`  ${passed ? '✅' : '❌'} ${planet.toUpperCase()}`);
            if (passed) passedTests++;
        }

        const passRate = Math.round((passedTests / totalTests) * 100);
        console.log(`\n📈 Pass Rate: ${passedTests}/${totalTests} (${passRate}%)`);

        if (passRate === 100) {
            console.log('\n🎉 ALL CRITICAL PATH TESTS PASSED!');
        } else if (passRate >= 80) {
            console.log('\n⚠️  MOST tests passed, but some features need attention');
        } else {
            console.log('\n❌ CRITICAL FAILURES - Major issues detected');
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('\nBrowser will remain open for manual inspection.');
        console.log('Press Ctrl+C to close.');

        // Keep browser open
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Critical path test failed:', error.message);
        console.error('\nStack trace:', error.stack);
        await browser.close();
        process.exit(1);
    }
})();
