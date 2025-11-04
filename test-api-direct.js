(async () => {
    // Login first
    const loginRes = await fetch('https://pal-backend-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'simple@phoenix.com', password: 'test123456' })
    });

    const loginData = await loginRes.json();
    console.log('Login:', loginData.success ? '✅' : '❌');

    if (!loginData.token) {
        console.log('No token received');
        return;
    }

    // Test phoenixVoice API
    const chatRes = await fetch('https://pal-backend-production.up.railway.app/api/phoenixVoice/chat', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: "What's my health status?",
            conversationHistory: [],
            personality: 'friendly_helpful',
            voice: 'nova'
        })
    });

    console.log('Chat API Status:', chatRes.status);
    const chatData = await chatRes.json();
    console.log('Chat Response:', JSON.stringify(chatData, null, 2));
})();
