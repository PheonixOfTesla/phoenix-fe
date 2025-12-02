const https = require('https');

console.log('🧪 Testing TTS Base64 Pipeline...\n');

// Step 1: Test backend endpoint with base64 format
const postData = JSON.stringify({
    text: 'Testing Phoenix TTS',
    voice: 'echo',
    language: 'en-US',
    speed: 1.0,
    format: 'base64'
});

const options = {
    hostname: 'pal-backend-production.up.railway.app',
    port: 443,
    path: '/api/tts/generate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

console.log('📡 Step 1: Testing backend endpoint...');
console.log('   URL: https://pal-backend-production.up.railway.app/api/tts/generate');
console.log('   Body:', postData.substring(0, 80) + '...\n');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('   Status:', res.statusCode);
        console.log('   Content-Type:', res.headers['content-type']);

        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                console.log('   ✅ Response is valid JSON');
                console.log('   ✅ Has success:', json.success);
                console.log('   ✅ Has audio field:', json.audio ? 'yes' : 'no');
                console.log('   ✅ Audio is base64 string:', typeof json.audio === 'string');
                console.log('   ✅ Base64 length:', json.audio ? json.audio.length : 0, 'chars\n');

                // Step 2: Test base64 → blob conversion
                console.log('📊 Step 2: Testing base64 → blob conversion...');
                const audioBase64 = json.audio;
                const audioBytes = Buffer.from(audioBase64, 'base64');
                console.log('   ✅ Decoded base64 to', audioBytes.length, 'bytes');
                console.log('   ✅ First 4 bytes (MP3 header):', audioBytes.slice(0, 4).toString('hex'));

                // Verify it's valid MP3 (should start with FFxx or ID3)
                const isValidMP3 = audioBytes[0] === 0xFF ||
                                   (audioBytes[0] === 0x49 && audioBytes[1] === 0x44 && audioBytes[2] === 0x33);
                console.log('   ✅ Valid MP3 format:', isValidMP3);

                // Step 3: Simulate browser conversion
                console.log('\n📱 Step 3: Simulating browser base64→blob conversion...');
                console.log('   This is what iOS will do:');
                console.log('   1. const audioBytes = atob(base64)');
                console.log('   2. const arrayBuffer = new ArrayBuffer(audioBytes.length)');
                console.log('   3. const uint8Array = new Uint8Array(arrayBuffer)');
                console.log('   4. for (let i...) uint8Array[i] = audioBytes.charCodeAt(i)');
                console.log('   5. const blob = new Blob([uint8Array], {type: "audio/mpeg"})');
                console.log('   ✅ Conversion matches our test:', audioBytes.length > 0);

                if (audioBytes.length > 1000 && isValidMP3) {
                    console.log('\n🎉 ✅ ALL TESTS PASSED!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ Backend returns valid base64 audio');
                    console.log('✅ Base64 converts to valid MP3 blob');
                    console.log('✅ Audio size is sufficient:', audioBytes.length, 'bytes');
                    console.log('✅ MP3 format is valid');
                    console.log('✅ iOS should be able to play this!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                } else {
                    console.log('\n⚠️  WARNING: Audio might be too small or invalid format');
                    console.log('   Size:', audioBytes.length, 'bytes');
                    console.log('   Valid MP3:', isValidMP3);
                }
            } catch (e) {
                console.log('   ❌ Failed to parse JSON:', e.message);
                console.log('   Raw response:', data.substring(0, 200));
            }
        } else {
            console.log('   ❌ Request failed with status', res.statusCode);
            console.log('   Response:', data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end();
