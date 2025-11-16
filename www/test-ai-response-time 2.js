// Test Phoenix AI Response Time
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDk2ZjQ1NWI3YTRjMThjYzNjZTE2MSIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjIyMzY3MDksImV4cCI6MTc2Mjg0MTUwOX0.fm5mfmYViNCZ8AGu_PvoZNHotWA-fjJYVy69VImdiHU";

async function testConversation() {
    console.log('🧪 Testing Phoenix AI Response Time\n');
    console.log('Target: <3 seconds (ideally <2s)');
    console.log('Token Limit: 800 tokens\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    const tests = [
        {
            name: "Simple Question",
            message: "What's my health status?",
            expectedTime: 2000
        },
        {
            name: "Complex Query",
            message: "Give me a complete overview of my health, fitness, schedule, and goals for today",
            expectedTime: 3000
        },
        {
            name: "Quick Command",
            message: "Take me to Mercury",
            expectedTime: 1500
        }
    ];

    for (const test of tests) {
        console.log(`📝 TEST: ${test.name}`);
        console.log(`   Message: "${test.message}"`);
        console.log(`   Expected: <${test.expectedTime}ms\n`);

        const startTime = Date.now();

        try {
            const response = await fetch('https://pal-backend-production.up.railway.app/api/phoenixVoice/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: test.message,
                    conversationHistory: [],
                    personality: 'friendly_helpful',
                    voice: 'nova'
                })
            });

            const elapsed = Date.now() - startTime;
            const data = await response.json();

            if (data.success) {
                const result = elapsed <= test.expectedTime ? '✅' : '⚠️ ';
                console.log(`   ${result} Response Time: ${elapsed}ms`);
                console.log(`   Response: "${data.response}"`);
                console.log(`   Tokens Used: ${data.tokensUsed || 'N/A'}`);

                if (elapsed > test.expectedTime) {
                    console.log(`   ⚠️  SLOW: ${elapsed - test.expectedTime}ms over target`);
                }
            } else {
                console.log(`   ❌ API Error: ${data.error || data.message}`);
            }

        } catch (error) {
            const elapsed = Date.now() - startTime;
            console.log(`   ❌ Request Failed (${elapsed}ms): ${error.message}`);
        }

        console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Response Time Test Complete\n');
}

testConversation().catch(console.error);
