/**
 * Test Wearable Connection to Backend
 *
 * This script tests the Fitbit and Polar OAuth endpoints on the Railway backend
 * to verify they're working correctly.
 */

const API_BASE_URL = 'https://pal-backend-production.up.railway.app/api';

async function testWearableConnection(provider) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTING ${provider.toUpperCase()} CONNECTION`);
    console.log('='.repeat(80));

    try {
        // First, try to get a real auth token
        const token = await getAuthToken();

        if (!token) {
            console.log('❌ No auth token available - trying without auth...');
            return testWithoutAuth(provider);
        }

        console.log('✅ Got auth token:', token.substring(0, 20) + '...');

        // Test the connect endpoint
        console.log(`\n📡 Calling: POST ${API_BASE_URL}/mercury/devices/${provider}/connect`);

        const response = await fetch(`${API_BASE_URL}/mercury/devices/${provider}/connect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
        console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log(`\n📦 Response Body:`);
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log(`\n✅ SUCCESS - ${provider} endpoint is working!`);

            if (data.authUrl || data.authorization_url) {
                console.log(`\n🔗 OAuth URL found:`);
                console.log(data.authUrl || data.authorization_url);
                console.log(`\n✅ This means the OAuth flow is properly configured!`);
            } else if (data.success) {
                console.log(`\n✅ Connection succeeded directly (no OAuth required)`);
            } else {
                console.log(`\n⚠️  Response is OK but structure is unexpected`);
            }
        } else {
            console.log(`\n❌ FAILED - ${provider} endpoint returned error`);
            console.log(`\nError details:`, data);

            if (response.status === 401) {
                console.log(`\n💡 Auth issue - token may be invalid or expired`);
            } else if (response.status === 404) {
                console.log(`\n💡 Endpoint doesn't exist - backend may not have this route`);
            } else if (response.status === 500) {
                console.log(`\n💡 Server error - check Railway logs for backend errors`);
            }
        }

    } catch (error) {
        console.log(`\n❌ EXCEPTION:`, error.message);
        console.log(`\nStack:`, error.stack);
    }
}

async function testWithoutAuth(provider) {
    console.log(`\n📡 Trying without authentication...`);

    try {
        const response = await fetch(`${API_BASE_URL}/mercury/devices/${provider}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log(`📦 Response:`, JSON.stringify(data, null, 2));

        if (response.status === 401) {
            console.log(`\n✅ Endpoint exists (requires auth)`);
        }
    } catch (error) {
        console.log(`❌ Error:`, error.message);
    }
}

async function getAuthToken() {
    // Try to get token from a test login
    try {
        console.log(`\n🔐 Attempting to get auth token...`);

        const testEmail = 'test@example.com';
        const testPassword = 'password123';

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.token || data.accessToken || data.jwt;
        } else {
            console.log(`⚠️  Test login failed (${response.status}) - will try without auth`);
            return null;
        }
    } catch (error) {
        console.log(`⚠️  Could not get auth token:`, error.message);
        return null;
    }
}

async function checkBackendHealth() {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏥 CHECKING BACKEND HEALTH`);
    console.log('='.repeat(80));

    try {
        const response = await fetch(`${API_BASE_URL}/../health`);
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Health:`, data);
    } catch (error) {
        console.log(`❌ Health check failed:`, error.message);
    }
}

async function listAllEndpoints() {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 CHECKING AVAILABLE MERCURY ENDPOINTS`);
    console.log('='.repeat(80));

    const endpoints = [
        '/mercury/devices/list',
        '/mercury/devices/fitbit/connect',
        '/mercury/devices/polar/connect',
        '/mercury/devices/oura/connect',
        '/mercury/devices/whoop/connect',
        '/mercury/devices/garmin/connect',
        '/mercury/recovery/latest',
        '/mercury/biometrics/hrv',
        '/mercury/sleep/analysis'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: endpoint.includes('connect') ? 'POST' : 'GET'
            });

            const status = response.status;
            const indicator = status === 401 ? '🔒' : status === 404 ? '❌' : status < 400 ? '✅' : '⚠️';
            const statusText = status === 401 ? 'EXISTS (Auth Required)' :
                             status === 404 ? 'NOT FOUND' :
                             status < 400 ? 'OK' : 'ERROR';

            console.log(`${indicator} ${endpoint.padEnd(40)} [${status}] ${statusText}`);
        } catch (error) {
            console.log(`❌ ${endpoint.padEnd(40)} [ERROR] ${error.message}`);
        }
    }
}

// Run all tests
(async () => {
    console.log(`\n🚀 PHOENIX WEARABLES CONNECTION TESTER`);
    console.log(`Backend: ${API_BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);

    // Check backend health
    await checkBackendHealth();

    // List all endpoints
    await listAllEndpoints();

    // Test Fitbit
    await testWearableConnection('fitbit');

    // Test Polar
    await testWearableConnection('polar');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ TEST COMPLETE`);
    console.log('='.repeat(80));
    console.log(`\n📝 Summary:`);
    console.log(`   1. If endpoints show "EXISTS (Auth Required)" - they're configured ✅`);
    console.log(`   2. If endpoints show "NOT FOUND" - backend doesn't have these routes ❌`);
    console.log(`   3. If OAuth URL is returned - Fitbit/Polar credentials are set up ✅`);
    console.log(`   4. Check Railway dashboard for environment variables:`);
    console.log(`      - FITBIT_CLIENT_ID`);
    console.log(`      - FITBIT_CLIENT_SECRET`);
    console.log(`      - POLAR_CLIENT_ID`);
    console.log(`      - POLAR_CLIENT_SECRET`);
    console.log(`\n`);
})();
