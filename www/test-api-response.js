const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDk2ZjQ1NWI3YTRjMThjYzNjZTE2MSIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjIyMzYwNjUsImV4cCI6MTc2Mjg0MDg2NX0.wPIuSdb4hbSvDov4cXAQmq-o6p1X6xRJOcKdFpTIeI0";

fetch('https://pal-backend-production.up.railway.app/api/phoenixVoice/chat', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: "What's my health status?",
        conversationHistory: [],
        personality: 'friendly_helpful',
        voice: 'nova'
    })
})
.then(r => r.json())
.then(data => {
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\ndata.success:', data.success);
    console.log('data.response:', data.response);
    console.log('data.reply:', data.reply);
    console.log('data.text:', data.text);
})
.catch(e => console.error('Error:', e.message));
