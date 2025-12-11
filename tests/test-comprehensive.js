/**
 * PHOENIX AI - COMPREHENSIVE TEST SUITE
 * Tests every surface, interaction, and integration point
 */

const https = require('https');
const http = require('http');

const FRONTEND = 'https://phoenix-fe-indol.vercel.app';
const BACKEND = 'https://pal-backend-production.up.railway.app';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

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

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        }).on('error', reject);
    });
}

async function testPageLoad(name, path) {
    try {
        const res = await fetchUrl(`${FRONTEND}${path}`);
        if (res.status === 200) {
            pass(`${name} loads (${path})`);
            return res.body;
        } else {
            fail(`${name} loads`, `Status ${res.status}`);
            return null;
        }
    } catch (e) {
        fail(`${name} loads`, e.message);
        return null;
    }
}

async function testBackendEndpoint(name, path) {
    try {
        const res = await fetchUrl(`${BACKEND}${path}`);
        if (res.status === 200 || res.status === 401) { // 401 = auth required (expected)
            pass(`Backend ${name} (${path})`);
            return res.body;
        } else {
            fail(`Backend ${name}`, `Status ${res.status}`);
            return null;
        }
    } catch (e) {
        fail(`Backend ${name}`, e.message);
        return null;
    }
}

async function runTests() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('🔬 PHOENIX AI - COMPREHENSIVE TEST SUITE');
    console.log('═══════════════════════════════════════════════\n');

    // ============================================
    // 1. FRONTEND PAGE LOADS
    // ============================================
    log('🌐', '\n[1/7] Testing Frontend Page Loads...\n');

    const dashboardHtml = await testPageLoad('Dashboard', '/dashboard.html');
    await testPageLoad('Login', '/index.html');
    await testPageLoad('Mercury (Health)', '/mercury.html');
    await testPageLoad('Venus (Fitness)', '/venus.html');
    await testPageLoad('Earth (Calendar)', '/earth.html');
    await testPageLoad('Mars (Goals)', '/mars.html');
    await testPageLoad('Jupiter (Finance)', '/jupiter.html');
    await testPageLoad('Saturn (Legacy)', '/saturn.html');
    await testPageLoad('Uranus (Innovation)', '/uranus.html');
    await testPageLoad('Neptune (Mindfulness)', '/neptune.html');

    // ============================================
    // 2. CRITICAL ASSETS
    // ============================================
    log('📦', '\n[2/7] Testing Critical Assets...\n');

    await testPageLoad('Styles CSS', '/styles.css');
    await testPageLoad('Config JS', '/config.js');
    await testPageLoad('API JS', '/src/api.js');
    await testPageLoad('Jarvis JS', '/src/jarvis.js');
    await testPageLoad('Orchestrator JS', '/src/orchestrator.js');
    await testPageLoad('Voice Commands JS', '/phoenix-voice-commands.js');
    await testPageLoad('Wearables JS', '/src/wearables.js');

    // ============================================
    // 3. JAVASCRIPT INTEGRITY
    // ============================================
    log('🔍', '\n[3/7] Testing JavaScript Integrity...\n');

    if (dashboardHtml) {
        // Check for voice system bugs we fixed
        const voiceTest = await fetchUrl(`${FRONTEND}/phoenix-voice-commands.js`);
        if (voiceTest.body) {
            // Bug 1: Config fallback
            if (voiceTest.body.includes('window.PhoenixConfig && window.PhoenixConfig.API_BASE_URL')) {
                pass('Voice system has config fallback');
            } else {
                fail('Voice system config fallback', 'Missing safe null check');
            }

            // Bug 2: TTS endpoint path
            if (voiceTest.body.includes('`${baseUrl}/tts/generate`') && !voiceTest.body.includes('/api/api/')) {
                pass('Voice TTS endpoint path correct');
            } else {
                fail('Voice TTS endpoint', 'Duplicate /api/ in path');
            }

            // Bug 3: Token validation
            if (voiceTest.body.includes('Please log in to use voice features')) {
                pass('Voice token validation with user feedback');
            } else {
                fail('Voice token validation', 'Missing user feedback on auth failure');
            }
        }

        // Check dashboard loads critical systems
        if (dashboardHtml.includes('orchestrator.js')) {
            pass('Dashboard loads orchestrator');
        } else {
            fail('Dashboard orchestrator', 'orchestrator.js not loaded');
        }

        if (dashboardHtml.includes('phoenix-voice-commands.js')) {
            pass('Dashboard loads voice system');
        } else {
            fail('Dashboard voice system', 'phoenix-voice-commands.js not loaded');
        }
    }

    // ============================================
    // 4. PLANET PAGE UNIQUENESS
    // ============================================
    log('🪐', '\n[4/7] Testing Planet Page Uniqueness...\n');

    const venusHtml = await fetchUrl(`${FRONTEND}/venus.html`);
    const uranusHtml = await fetchUrl(`${FRONTEND}/uranus.html`);
    const neptuneHtml = await fetchUrl(`${FRONTEND}/neptune.html`);

    if (venusHtml.body && uranusHtml.body) {
        if (venusHtml.body !== uranusHtml.body) {
            pass('Uranus is unique (not Venus duplicate)');
        } else {
            fail('Uranus uniqueness', 'Still duplicate of Venus');
        }

        // Check Uranus has correct theme
        if (uranusHtml.body.includes('#4FC3F7') || uranusHtml.body.includes('Innovation')) {
            pass('Uranus has cyan/innovation theme');
        } else {
            fail('Uranus theme', 'Missing cyan colors or innovation content');
        }
    }

    if (venusHtml.body && neptuneHtml.body) {
        if (venusHtml.body !== neptuneHtml.body) {
            pass('Neptune is unique (not Venus duplicate)');
        } else {
            fail('Neptune uniqueness', 'Still duplicate of Venus');
        }

        // Check Neptune has correct theme
        if (neptuneHtml.body.includes('#9C27B0') || neptuneHtml.body.includes('Mindfulness')) {
            pass('Neptune has purple/mindfulness theme');
        } else {
            fail('Neptune theme', 'Missing purple colors or mindfulness content');
        }
    }

    // ============================================
    // 5. BACKEND HEALTH & ENDPOINTS
    // ============================================
    log('🔌', '\n[5/7] Testing Backend Endpoints...\n');

    await testBackendEndpoint('Health check', '/health');
    await testBackendEndpoint('Auth endpoint', '/api/auth/login');
    await testBackendEndpoint('Phoenix voice', '/api/phoenixVoice/chat');
    await testBackendEndpoint('TTS generate', '/api/tts/generate');
    await testBackendEndpoint('Consciousness orchestrator', '/api/consciousness/status');
    await testBackendEndpoint('Pattern detection', '/api/patterns/detect');
    await testBackendEndpoint('Mercury health', '/api/mercury/metrics');
    await testBackendEndpoint('Venus fitness', '/api/venus/workouts');
    await testBackendEndpoint('Mars goals', '/api/mars/goals');
    await testBackendEndpoint('Jupiter finance', '/api/jupiter/transactions');

    // ============================================
    // 6. CONSCIOUSNESS ORCHESTRATION
    // ============================================
    log('🧠', '\n[6/7] Testing Consciousness System...\n');

    // Test if orchestrator endpoints exist
    const consciousnessEndpoints = [
        '/api/consciousness/dashboard-insights',
        '/api/consciousness/proactive-suggestions',
        '/api/consciousness/emotional-state',
        '/api/orchestrator/status'
    ];

    for (const endpoint of consciousnessEndpoints) {
        await testBackendEndpoint(`Consciousness ${endpoint.split('/').pop()}`, endpoint);
    }

    // ============================================
    // 7. PERFORMANCE & CACHING
    // ============================================
    log('⚡', '\n[7/7] Testing Performance & Caching...\n');

    try {
        const perfTest = await fetchUrl(`${FRONTEND}/dashboard.html`);

        // Check cache headers
        const cacheControl = perfTest.headers['cache-control'];
        if (cacheControl && cacheControl.includes('no-cache')) {
            pass('Zero-cache headers active');
        } else {
            fail('Cache headers', 'Missing no-cache directive');
        }

        // Check response time (should be fast with CDN)
        const start = Date.now();
        await fetchUrl(`${FRONTEND}/`);
        const loadTime = Date.now() - start;

        if (loadTime < 2000) {
            pass(`Frontend load time (${loadTime}ms < 2s)`);
        } else {
            fail('Frontend load time', `${loadTime}ms > 2s threshold`);
        }
    } catch (e) {
        fail('Performance test', e.message);
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

    if (failures.length > 0) {
        console.log('\n🔴 FAILURES:\n');
        failures.forEach(({ test, error }, i) => {
            console.log(`${i + 1}. ${test}`);
            console.log(`   └─ ${error}\n`);
        });
    }

    console.log('\n═══════════════════════════════════════════════\n');

    if (failedTests === 0) {
        console.log('🎉 ALL TESTS PASSED - SYSTEM READY\n');
    } else {
        console.log(`⚠️  ${failedTests} ISSUES REQUIRE ATTENTION\n`);
    }

    process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
});
