/**
 * Quick verification that POST method fix is working
 * Tests that endpoints respond correctly to POST requests
 */

const API_BASE_URL = 'https://pal-backend-production.up.railway.app/api';

async function testPostRequest(provider) {
    console.log(`\n🧪 Testing ${provider.toUpperCase()} with POST method...`);

    try {
        const response = await fetch(`${API_BASE_URL}/mercury/devices/${provider}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);

        if (response.status === 401) {
            console.log(`✅ ENDPOINT EXISTS! (Requires authentication)`);
            console.log(`✅ POST method is working correctly!`);
            return true;
        } else if (response.status === 404) {
            console.log(`❌ ENDPOINT NOT FOUND (404)`);
            console.log(`❌ This means POST method might not be configured on backend`);
            return false;
        } else {
            const data = await response.json();
            console.log(`📦 Response:`, JSON.stringify(data, null, 2));
            return response.ok;
        }

    } catch (error) {
        console.log(`❌ ERROR:`, error.message);
        return false;
    }
}

(async () => {
    console.log(`\n🔥 VERIFYING POST METHOD FIX`);
    console.log(`Backend: ${API_BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}\n`);
    console.log('='.repeat(80));

    const fitbitWorks = await testPostRequest('fitbit');
    const polarWorks = await testPostRequest('polar');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n📊 RESULTS:`);
    console.log(`   Fitbit: ${fitbitWorks ? '✅ POST working' : '❌ POST failing'}`);
    console.log(`   Polar:  ${polarWorks ? '✅ POST working' : '❌ POST failing'}`);

    if (fitbitWorks && polarWorks) {
        console.log(`\n✅ POST METHOD FIX IS WORKING!`);
        console.log(`\n📋 Next step: Test actual OAuth flow in browser`);
        console.log(`   1. Open Mercury in browser (already open in incognito)`);
        console.log(`   2. Click Fitbit or Polar card`);
        console.log(`   3. Should redirect to OAuth authorization page`);
    } else {
        console.log(`\n❌ POST method still not working correctly`);
    }
    console.log();
})();
