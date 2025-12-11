/**
 * TEST: Consciousness Integration
 * Verifies full-stack consciousness works (backend + frontend + iOS)
 */

const axios = require('axios');

const BACKEND_URL = 'https://pal-backend-production.up.railway.app';

async function testConsciousnessIntegration() {
    console.log('============================================');
    console.log('TESTING CONSCIOUSNESS INTEGRATION');
    console.log('============================================\n');

    const tests = {
        passed: 0,
        failed: 0,
        total: 0
    };

    // Test 1: Health check includes consciousness
    try {
        const { data } = await axios.get(`${BACKEND_URL}/health`);
        tests.total++;

        if (data.consciousness === 'INITIALIZED') {
            console.log('✅ Test 1: Consciousness initialized in health check');
            tests.passed++;
        } else {
            console.log(`❌ Test 1: Consciousness not initialized (status: ${data.consciousness})`);
            tests.failed++;
        }
    } catch (error) {
        console.log('❌ Test 1: Health check failed:', error.message);
        tests.failed++;
        tests.total++;
    }

    // Test 2: Consciousness overview endpoint
    try {
        const { data } = await axios.get(`${BACKEND_URL}/api/consciousness`);
        tests.total++;

        if (data.success && data.overview) {
            console.log('✅ Test 2: Consciousness overview endpoint works');
            console.log(`   - Brain: ${Object.keys(data.overview.brain || {}).length} modules`);
            console.log(`   - Soul: ${Object.keys(data.overview.soul || {}).length} modules`);
            console.log(`   - Spirit: ${Object.keys(data.overview.spirit || {}).length} modules`);
            tests.passed++;
        } else {
            console.log('❌ Test 2: Consciousness overview endpoint failed');
            tests.failed++;
        }
    } catch (error) {
        console.log('❌ Test 2: Overview endpoint failed:', error.message);
        tests.failed++;
        tests.total++;
    }

    // Test 3: Brain layer endpoints
    try {
        const { data } = await axios.get(`${BACKEND_URL}/api/consciousness/brain/summary`);
        tests.total++;

        if (data.success && data.summary) {
            console.log('✅ Test 3: Brain layer summary works');
            tests.passed++;
        } else {
            console.log('❌ Test 3: Brain layer summary failed');
            tests.failed++;
        }
    } catch (error) {
        console.log('❌ Test 3: Brain endpoint failed:', error.message);
        tests.failed++;
        tests.total++;
    }

    // Test 4: Soul layer endpoints
    try {
        const { data } = await axios.get(`${BACKEND_URL}/api/consciousness/soul/summary`);
        tests.total++;

        if (data.success && data.summary) {
            console.log('✅ Test 4: Soul layer summary works');
            tests.passed++;
        } else {
            console.log('❌ Test 4: Soul layer summary failed');
            tests.failed++;
        }
    } catch (error) {
        console.log('❌ Test 4: Soul endpoint failed:', error.message);
        tests.failed++;
        tests.total++;
    }

    // Test 5: Spirit layer endpoints
    try {
        const { data} = await axios.get(`${BACKEND_URL}/api/consciousness/spirit/summary`);
        tests.total++;

        if (data.success && data.summary) {
            console.log('✅ Test 5: Spirit layer summary works');
            tests.passed++;
        } else {
            console.log('❌ Test 5: Spirit layer summary failed');
            tests.failed++;
        }
    } catch (error) {
        console.log('❌ Test 5: Spirit endpoint failed:', error.message);
        tests.failed++;
        tests.total++;
    }

    // Test 6: Integration layer endpoints
    try {
        const { data } = await axios.get(`${BACKEND_URL}/api/consciousness/integration/summary`);
        tests.total++;

        if (data.success && data.summary) {
            console.log('✅ Test 6: Integration layer summary works');
            tests.passed++;
        } else {
            console.log('❌ Test 6: Integration layer summary failed');
            tests.failed++;
        }
    } catch (error) {
        console.log('❌ Test 6: Integration endpoint failed:', error.message);
        tests.failed++;
        tests.total++;
    }

    // Final report
    console.log('\n============================================');
    console.log('TEST RESULTS');
    console.log('============================================');
    console.log(`Total Tests: ${tests.total}`);
    console.log(`Passed: ${tests.passed}`);
    console.log(`Failed: ${tests.failed}`);
    console.log(`Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);
    console.log('============================================\n');

    return tests;
}

// Run tests
testConsciousnessIntegration();
