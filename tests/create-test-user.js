// Create test user for Phoenix production testing
const API_BASE_URL = 'https://pal-backend-production.up.railway.app/api';

async function createTestUser() {
    const userData = {
        name: 'Phoenix Test User',
        email: `phoenixtest${Date.now()}@test.com`,  // Unique email each time
        password: 'test1234',
        language: 'en',
        voice: 'echo',
        role: 'client'
    };

    console.log('🔨 Creating test user...');
    console.log('Email:', userData.email);
    console.log('Password:', userData.password);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Test user created successfully!');
            console.log('Response:', JSON.stringify(data, null, 2));

            // Try logging in immediately to verify
            console.log('\n🔑 Testing login with new credentials...');
            const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password
                })
            });

            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
                console.log('✅ Login successful!');
                console.log('Token:', loginData.token ? 'Present ✓' : 'Missing ✗');
                console.log('\n📋 CREDENTIALS FOR TESTING:');
                console.log('   Email:', userData.email);
                console.log('   Password:', userData.password);
            } else {
                console.log('❌ Login failed:', loginData.message || loginResponse.statusText);
            }
        } else {
            console.log('❌ Failed to create user:', data.message || response.statusText);
            if (data.message && data.message.includes('already exists')) {
                console.log('\n⚠️  User already exists. Trying to login with existing credentials...');

                const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userData.email,
                        password: userData.password
                    })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok) {
                    console.log('✅ Login successful with existing user!');
                    console.log('Token:', loginData.token ? 'Present ✓' : 'Missing ✗');
                } else {
                    console.log('❌ Login also failed. User may have different password.');
                }
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTestUser();
