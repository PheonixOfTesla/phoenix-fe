/**
 * Test Fitbit & Polar OAuth Flow with Real Auth Token
 *
 * This will test the complete OAuth flow for Fitbit and Polar
 * using your actual account credentials.
 */

const readline = require('readline');

const API_BASE_URL = 'https://pal-backend-production.up.railway.app/api';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function login() {
    console.log(`\n🔐 LOGIN TO PHOENIX`);
    console.log('='.repeat(80));

    const email = await question('Enter your email: ');
    const password = await question('Enter your password: ');

    console.log(`\n📡 Logging in...`);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Login failed: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        const token = data.token || data.accessToken || data.jwt;

        if (!token) {
            throw new Error('No token in response');
        }

        console.log(`✅ Login successful!`);
        console.log(`Token: ${token.substring(0, 30)}...`);

        return token;

    } catch (error) {
        console.error(`❌ Login failed:`, error.message);
        throw error;
    }
}

async function testDeviceConnection(token, provider) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTING ${provider.toUpperCase()} OAUTH CONNECTION`);
    console.log('='.repeat(80));

    try {
        console.log(`\n📡 Calling: POST ${API_BASE_URL}/mercury/devices/${provider}/connect`);

        const response = await fetch(`${API_BASE_URL}/mercury/devices/${provider}/connect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log(`\n📦 Response Body:`);
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log(`\n✅ SUCCESS!`);

            if (data.authUrl || data.authorization_url || data.auth_url) {
                const oauthUrl = data.authUrl || data.authorization_url || data.auth_url;
                console.log(`\n🔗 OAuth URL:`);
                console.log(oauthUrl);
                console.log(`\n✅ BACKEND IS PROPERLY CONFIGURED!`);
                console.log(`\n📋 Next Steps:`);
                console.log(`   1. Copy the OAuth URL above`);
                console.log(`   2. Open it in your browser`);
                console.log(`   3. Authorize the app`);
                console.log(`   4. You'll be redirected back with a code`);
                console.log(`   5. Backend will exchange the code for an access token`);
                console.log(`   6. Your ${provider} will be connected!`);

                return { success: true, oauthUrl, configured: true };

            } else if (data.success) {
                console.log(`\n✅ Device connected directly (no OAuth required)`);
                return { success: true, directConnect: true };

            } else {
                console.log(`\n⚠️  Unexpected response structure`);
                console.log(`Expected: { authUrl: "..." } or { success: true }`);
                console.log(`Got:`, data);
                return { success: false, error: 'Unexpected response' };
            }

        } else {
            console.log(`\n❌ FAILED`);

            if (response.status === 401) {
                console.log(`\n💡 Your auth token may have expired. Try logging in again.`);
            } else if (response.status === 404) {
                console.log(`\n💡 Endpoint doesn't exist - backend may not have implemented this route yet`);
            } else if (response.status === 500) {
                console.log(`\n💡 Server error - possible causes:`);
                console.log(`   - ${provider.toUpperCase()}_CLIENT_ID not set in Railway`);
                console.log(`   - ${provider.toUpperCase()}_CLIENT_SECRET not set in Railway`);
                console.log(`   - ${provider.toUpperCase()}_REDIRECT_URI not set in Railway`);
                console.log(`   - Backend code has a bug`);
                console.log(`\n   Check Railway logs for details`);
            }

            return { success: false, error: data, status: response.status };
        }

    } catch (error) {
        console.log(`\n❌ EXCEPTION:`, error.message);
        return { success: false, error: error.message };
    }
}

async function checkRequiredEnvVars() {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 CHECKING REQUIRED ENVIRONMENT VARIABLES`);
    console.log('='.repeat(80));
    console.log(`\nThe backend needs these environment variables set in Railway:`);
    console.log(`\nFitbit:`);
    console.log(`   ✓ FITBIT_CLIENT_ID`);
    console.log(`   ✓ FITBIT_CLIENT_SECRET`);
    console.log(`   ✓ FITBIT_REDIRECT_URI (should be: https://pal-backend-production.up.railway.app/api/mercury/devices/fitbit/callback)`);
    console.log(`\nPolar:`);
    console.log(`   ✓ POLAR_CLIENT_ID`);
    console.log(`   ✓ POLAR_CLIENT_SECRET`);
    console.log(`   ✓ POLAR_REDIRECT_URI (should be: https://pal-backend-production.up.railway.app/api/mercury/devices/polar/callback)`);
    console.log(`\n💡 If these are NOT set, the endpoints will return 500 errors`);
    console.log(`💡 If they ARE set but connections fail, the credentials might be invalid`);
}

// Main test flow
(async () => {
    try {
        console.log(`\n🚀 PHOENIX WEARABLES OAUTH TESTER`);
        console.log(`Backend: ${API_BASE_URL}`);
        console.log(`Time: ${new Date().toISOString()}`);

        // Check env vars info
        checkRequiredEnvVars();

        // Login
        const token = await login();

        // Test Fitbit
        const fitbitResult = await testDeviceConnection(token, 'fitbit');

        // Test Polar
        const polarResult = await testDeviceConnection(token, 'polar');

        // Summary
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 SUMMARY`);
        console.log('='.repeat(80));

        console.log(`\n**Fitbit**: ${fitbitResult.success ? '✅ Working' : '❌ Failed'}`);
        if (fitbitResult.configured) {
            console.log(`   - OAuth URL configured properly ✅`);
            console.log(`   - Click "Connect Fitbit" in Mercury to start OAuth flow`);
        } else if (fitbitResult.status === 500) {
            console.log(`   - Backend error (likely missing env variables) ❌`);
        }

        console.log(`\n**Polar**: ${polarResult.success ? '✅ Working' : '❌ Failed'}`);
        if (polarResult.configured) {
            console.log(`   - OAuth URL configured properly ✅`);
            console.log(`   - Click "Connect Polar" in Mercury to start OAuth flow`);
        } else if (polarResult.status === 500) {
            console.log(`   - Backend error (likely missing env variables) ❌`);
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log(`\n✅ TEST COMPLETE\n`);

        rl.close();

    } catch (error) {
        console.error(`\n❌ Test failed:`, error.message);
        rl.close();
        process.exit(1);
    }
})();
