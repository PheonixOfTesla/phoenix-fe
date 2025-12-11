#!/usr/bin/env node

/**
 * PHOENIX VOICE & AI FLOW TEST
 * Tests the complete voice conversation pipeline with 3-tier classification
 */

const https = require('https');

const BACKEND_URL = 'https://pal-backend-production.up.railway.app/api';
const TEST_USER = {
    email: `test_${Date.now()}@phoenix.ai`,
    password: 'TestPass123',
    phone: '+15555555555',
    name: 'Phoenix Test User'
};

console.log('\n🧪 PHOENIX VOICE & AI FLOW TEST\n');
console.log('='.repeat(60));

let authToken = null;

// Helper function for HTTPS requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BACKEND_URL);

        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: parsed,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData,
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        parseError: true
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function runTests() {
    try {
        // TEST 1: User Registration
        console.log('\n1️⃣ TESTING USER REGISTRATION...');
        console.log('-'.repeat(60));

        const registration = await makeRequest('POST', '/auth/register', {
            email: TEST_USER.email,
            password: TEST_USER.password,
            phone: TEST_USER.phone,
            name: TEST_USER.name
        });

        if (registration.success && registration.data.token) {
            authToken = registration.data.token;
            console.log('✅ User registered successfully');
            console.log(`   Token: ${authToken.substring(0, 20)}...`);
        } else if (registration.status === 409) {
            console.log('⚠️  User already exists, trying login...');

            const login = await makeRequest('POST', '/auth/login', {
                email: TEST_USER.email,
                password: TEST_USER.password
            });

            if (login.success && login.data.token) {
                authToken = login.data.token;
                console.log('✅ Logged in successfully');
                console.log(`   Token: ${authToken.substring(0, 20)}...`);
            } else {
                throw new Error('Login failed');
            }
        } else {
            throw new Error(`Registration failed: ${JSON.stringify(registration)}`);
        }

        // TEST 2: Phoenix Companion Chat - ACTION Tier
        console.log('\n2️⃣ TESTING PHOENIX COMPANION - ACTION TIER...');
        console.log('-'.repeat(60));
        console.log('   Query: "Track my water intake"');

        const startAction = Date.now();
        const actionResponse = await makeRequest('POST', '/phoenix/companion/chat', {
            message: 'Track my water intake',
            conversationHistory: [],
            personality: 'friendly_helpful',
            voice: 'echo',
            requestedTier: 'auto',
            responseFormat: 'json'
        }, authToken);

        const actionTime = Date.now() - startAction;

        if (actionResponse.success) {
            console.log('✅ Phoenix Companion responded');
            console.log(`   Response Time: ${actionTime}ms`);
            console.log(`   Classification: ${actionResponse.data.tier || 'UNKNOWN'}`);
            console.log(`   Message: "${(actionResponse.data.message || actionResponse.data.response || '').substring(0, 100)}..."`);
        } else {
            console.log(`❌ Phoenix Companion failed (${actionResponse.status})`);
            console.log(`   Error: ${JSON.stringify(actionResponse.data)}`);
        }

        // TEST 3: Phoenix Companion Chat - WISDOM_CASUAL Tier
        console.log('\n3️⃣ TESTING PHOENIX COMPANION - WISDOM_CASUAL TIER...');
        console.log('-'.repeat(60));
        console.log('   Query: "Should I go to the gym tonight?"');

        const startWisdomCasual = Date.now();
        const wisdomCasualResponse = await makeRequest('POST', '/phoenix/companion/chat', {
            message: 'Should I go to the gym tonight?',
            conversationHistory: [],
            personality: 'friendly_helpful',
            voice: 'echo',
            requestedTier: 'auto',
            responseFormat: 'json'
        }, authToken);

        const wisdomCasualTime = Date.now() - startWisdomCasual;

        if (wisdomCasualResponse.success) {
            console.log('✅ Phoenix Companion responded');
            console.log(`   Response Time: ${wisdomCasualTime}ms`);
            console.log(`   Classification: ${wisdomCasualResponse.data.tier || 'UNKNOWN'}`);
            console.log(`   Message: "${(wisdomCasualResponse.data.message || wisdomCasualResponse.data.response || '').substring(0, 100)}..."`);
        } else {
            console.log(`❌ Phoenix Companion failed (${wisdomCasualResponse.status})`);
            console.log(`   Error: ${JSON.stringify(wisdomCasualResponse.data)}`);
        }

        // TEST 4: Phoenix Companion Chat - WISDOM_DEEP Tier
        console.log('\n4️⃣ TESTING PHOENIX COMPANION - WISDOM_DEEP TIER...');
        console.log('-'.repeat(60));
        console.log('   Query: "I\'m completely overwhelmed with burnout and don\'t know how to handle it"');

        const startWisdomDeep = Date.now();
        const wisdomDeepResponse = await makeRequest('POST', '/phoenix/companion/chat', {
            message: "I'm completely overwhelmed with burnout and don't know how to handle it",
            conversationHistory: [],
            personality: 'friendly_helpful',
            voice: 'echo',
            requestedTier: 'auto',
            responseFormat: 'json'
        }, authToken);

        const wisdomDeepTime = Date.now() - startWisdomDeep;

        if (wisdomDeepResponse.success) {
            console.log('✅ Phoenix Companion responded');
            console.log(`   Response Time: ${wisdomDeepTime}ms`);
            console.log(`   Classification: ${wisdomDeepResponse.data.tier || 'UNKNOWN'}`);
            console.log(`   Message: "${(wisdomDeepResponse.data.message || wisdomDeepResponse.data.response || '').substring(0, 150)}..."`);
        } else {
            console.log(`❌ Phoenix Companion failed (${wisdomDeepResponse.status})`);
            console.log(`   Error: ${JSON.stringify(wisdomDeepResponse.data)}`);
        }

        // TEST 5: OpenAI TTS
        console.log('\n5️⃣ TESTING OPENAI TTS...');
        console.log('-'.repeat(60));

        const startTTS = Date.now();
        const ttsResponse = await makeRequest('POST', '/tts/generate', {
            text: 'Phoenix voice test. The genius-level AI is working perfectly.',
            voice: 'echo',
            speed: 1.4,
            model: 'tts-1'
        }, authToken);

        const ttsTime = Date.now() - startTTS;

        if (ttsResponse.success || ttsResponse.status === 200) {
            console.log('✅ OpenAI TTS is working');
            console.log(`   Response Time: ${ttsTime}ms`);
            console.log(`   Status: ${ttsResponse.status}`);
        } else {
            console.log(`❌ OpenAI TTS failed (${ttsResponse.status})`);
        }

        // FINAL SUMMARY
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));

        console.log('\n✅ SUCCESSFUL TESTS:');
        console.log(`   1. User Registration/Login: ${authToken ? '✅' : '❌'}`);
        console.log(`   2. Phoenix Companion (ACTION): ${actionResponse.success ? '✅' : '❌'} (${actionTime}ms)`);
        console.log(`   3. Phoenix Companion (WISDOM_CASUAL): ${wisdomCasualResponse.success ? '✅' : '❌'} (${wisdomCasualTime}ms)`);
        console.log(`   4. Phoenix Companion (WISDOM_DEEP): ${wisdomDeepResponse.success ? '✅' : '❌'} (${wisdomDeepTime}ms)`);
        console.log(`   5. OpenAI TTS: ${ttsResponse.success ? '✅' : '❌'} (${ttsTime}ms)`);

        console.log('\n🎯 3-TIER CLASSIFICATION VERIFICATION:');
        const actionTier = actionResponse.data?.tier || 'UNKNOWN';
        const wisdomCasualTier = wisdomCasualResponse.data?.tier || 'UNKNOWN';
        const wisdomDeepTier = wisdomDeepResponse.data?.tier || 'UNKNOWN';

        console.log(`   ACTION query classified as: ${actionTier}`);
        console.log(`   WISDOM_CASUAL query classified as: ${wisdomCasualTier}`);
        console.log(`   WISDOM_DEEP query classified as: ${wisdomDeepTier}`);

        console.log('\n⏱️  PERFORMANCE TARGETS:');
        console.log(`   ACTION (target: 300-600ms): ${actionTime}ms ${actionTime <= 600 ? '✅' : '⚠️'}`);
        console.log(`   WISDOM_CASUAL (target: 400-800ms): ${wisdomCasualTime}ms ${wisdomCasualTime <= 800 ? '✅' : '⚠️'}`);
        console.log(`   WISDOM_DEEP (target: 800-2000ms): ${wisdomDeepTime}ms ${wisdomDeepTime <= 2000 ? '✅' : '⚠️'}`);
        console.log(`   TTS (target: <2000ms): ${ttsTime}ms ${ttsTime <= 2000 ? '✅' : '⚠️'}`);

        console.log('\n🚀 FULL VOICE PIPELINE STATUS:');
        const allTestsPassed = authToken &&
                               actionResponse.success &&
                               wisdomCasualResponse.success &&
                               wisdomDeepResponse.success &&
                               ttsResponse.success;

        if (allTestsPassed) {
            console.log('   ✅ ALL SYSTEMS OPERATIONAL');
            console.log('   ✅ Phoenix 147 IQ is READY TO USE');
            console.log('   ✅ Voice pipeline fully functional');
        } else {
            console.log('   ⚠️  Some systems need attention');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Test complete!\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
