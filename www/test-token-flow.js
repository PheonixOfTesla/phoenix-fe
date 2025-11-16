/**
 * TEST: Backend Token Validation Flow
 * This script tests why tokens are being rejected after login
 */

const https = require('https');

const BASE_URL = 'pal-backend-production.up.railway.app';

// Helper function to make HTTPS requests
function makeRequest(path, method, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

(async () => {
    console.log('\n🔐 Testing Phoenix Backend Token Flow\n');
    console.log('=' .repeat(60));

    // Step 1: Login
    console.log('\n1️⃣ Testing Login...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
        email: '+18087510813',  // Frontend adds +1 country code
        password: '123456'
    });

    console.log(`   Status: ${loginResponse.status}`);

    if (loginResponse.status !== 200) {
        console.log('   ❌ Login failed:', loginResponse.data);
        process.exit(1);
    }

    console.log('   ✅ Login successful');
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Token: ${loginResponse.data.token.substring(0, 50)}...`);

    const token = loginResponse.data.token;

    // Step 2: Test /auth/me with token
    console.log('\n2️⃣ Testing /auth/me with token...');
    const meResponse = await makeRequest('/api/auth/me', 'GET', null, token);

    console.log(`   Status: ${meResponse.status}`);

    if (meResponse.status === 200) {
        console.log('   ✅ Token validation successful');
        console.log(`   User ID: ${meResponse.data.user._id}`);
    } else {
        console.log('   ❌ Token validation FAILED');
        console.log('   Response:', JSON.stringify(meResponse.data, null, 2));
    }

    // Step 3: Test another protected endpoint
    console.log('\n3️⃣ Testing /users/profile with token...');
    const profileResponse = await makeRequest('/api/users/profile', 'GET', null, token);

    console.log(`   Status: ${profileResponse.status}`);

    if (profileResponse.status === 200) {
        console.log('   ✅ Profile access successful');
    } else {
        console.log('   ❌ Profile access FAILED');
        console.log('   Response:', JSON.stringify(profileResponse.data, null, 2));
    }

    // Step 4: Decode token to see what's inside
    console.log('\n4️⃣ Decoding JWT token (unsafe, just for debugging)...');
    const parts = token.split('.');
    if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('   Token Payload:');
        console.log('   ', JSON.stringify(payload, null, 2));

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.log('   ⚠️  TOKEN EXPIRED!');
        } else {
            console.log(`   ✅ Token valid for ${Math.floor((payload.exp - now) / 3600)} hours`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Test complete\n');
})();
