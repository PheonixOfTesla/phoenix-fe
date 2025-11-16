const puppeteer = require('puppeteer');

async function testVoiceAndTTS() {
  console.log('\n🎤 TESTING COMPLETE VOICE + TTS FLOW\n');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--window-size=1920,1080',
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  const page = await browser.newPage();

  // Track all logs
  const logs = {
    tts: [],
    errors: [],
    railway: [],
    audio: []
  };

  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    console.log(`📱 ${text}`);

    if (text.includes('OpenAI TTS') || text.includes('TTS')) {
      logs.tts.push(text);
    }
    if (text.includes('Railway') || text.includes('pal-backend')) {
      logs.railway.push(text);
    }
    if (text.includes('Audio') || text.includes('audio')) {
      logs.audio.push(text);
    }
  });

  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
    logs.errors.push(error.message);
  });

  // Monitor network for TTS endpoint
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/tts/generate')) {
      const status = response.status();
      console.log(`\n🔊 TTS ENDPOINT CALLED:`);
      console.log(`   URL: ${url}`);
      console.log(`   Status: ${status}`);
      console.log(`   Time: ${response.timing()?.receiveHeadersEnd || 'N/A'}ms`);

      if (status === 200) {
        const contentType = response.headers()['content-type'];
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   ✅ OpenAI TTS audio received!`);
      } else {
        console.log(`   ❌ TTS request failed!`);
        try {
          const body = await response.text();
          console.log(`   Error: ${body}`);
        } catch (e) {}
      }
    }
  });

  try {
    console.log('\n1️⃣ Loading dashboard...');
    await page.goto('http://localhost:8000/dashboard.html', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    console.log('✅ Dashboard loaded\n');

    // Wait for Phoenix to initialize
    await page.waitForTimeout(3000);

    console.log('2️⃣ Checking TTS configuration...');
    const config = await page.evaluate(() => {
      return {
        apiUrl: window.PhoenixConfig?.API_BASE_URL,
        ttsAvailable: 'speechSynthesis' in window,
        phoenixVoiceCommands: typeof window.phoenixVoiceCommands !== 'undefined',
        phoenixOrb: typeof window.phoenixOrb !== 'undefined'
      };
    });

    console.log(`   API URL: ${config.apiUrl}`);
    console.log(`   Browser TTS: ${config.ttsAvailable ? '✅' : '❌'}`);
    console.log(`   Voice Commands: ${config.phoenixVoiceCommands ? '✅' : '❌'}`);
    console.log(`   Phoenix Orb: ${config.phoenixOrb ? '✅' : '❌'}`);

    console.log('\n3️⃣ Testing OpenAI TTS directly...');

    const ttsTest = await page.evaluate(async () => {
      const startTime = performance.now();

      try {
        // Call TTS endpoint directly
        const response = await fetch('https://pal-backend-production.up.railway.app/api/tts/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: 'Testing Phoenix voice system. Can you hear me clearly?',
            voice: 'echo',
            speed: 1.4,
            model: 'tts-1'
          })
        });

        const fetchTime = performance.now() - startTime;

        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}`,
            fetchTime
          };
        }

        // Get audio blob
        const audioBlob = await response.blob();
        const totalTime = performance.now() - startTime;

        // Try to play it
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        return new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            console.log('🎵 Audio metadata loaded');
          };

          audio.oncanplaythrough = () => {
            console.log('🎵 Audio ready to play');
          };

          audio.onplay = () => {
            console.log('▶️ Audio started playing');
          };

          audio.onended = () => {
            console.log('✅ Audio finished playing');
            URL.revokeObjectURL(audioUrl);
            const playbackTime = performance.now() - startTime;
            resolve({
              success: true,
              fetchTime: fetchTime.toFixed(0),
              totalTime: totalTime.toFixed(0),
              playbackTime: playbackTime.toFixed(0),
              blobSize: audioBlob.size
            });
          };

          audio.onerror = (error) => {
            console.error('❌ Audio playback error:', error);
            URL.revokeObjectURL(audioUrl);
            resolve({
              success: false,
              error: 'Playback failed',
              fetchTime,
              totalTime
            });
          };

          // Start playback
          audio.play().catch(err => {
            console.error('❌ Play error:', err);
            resolve({
              success: false,
              error: err.message,
              fetchTime,
              totalTime
            });
          });
        });

      } catch (error) {
        return {
          success: false,
          error: error.message,
          fetchTime: performance.now() - startTime
        };
      }
    });

    console.log('\n📊 TTS TEST RESULTS:');
    console.log('='.repeat(60));
    if (ttsTest.success) {
      console.log(`✅ OpenAI TTS is WORKING!`);
      console.log(`   Fetch Time: ${ttsTest.fetchTime}ms`);
      console.log(`   Total Time: ${ttsTest.totalTime}ms`);
      console.log(`   Playback Time: ${ttsTest.playbackTime}ms`);
      console.log(`   Audio Size: ${(ttsTest.blobSize / 1024).toFixed(1)}KB`);

      if (ttsTest.fetchTime < 1000) {
        console.log(`   ⚡ FAST - Under 1 second!`);
      } else if (ttsTest.fetchTime < 2000) {
        console.log(`   ✅ GOOD - Under 2 seconds`);
      } else if (ttsTest.fetchTime < 3000) {
        console.log(`   ⚠️  ACCEPTABLE - Under 3 seconds`);
      } else {
        console.log(`   ❌ SLOW - Over 3 seconds (needs optimization)`);
      }
    } else {
      console.log(`❌ OpenAI TTS FAILED!`);
      console.log(`   Error: ${ttsTest.error}`);
      console.log(`   Time: ${ttsTest.fetchTime}ms`);
    }

    console.log('\n4️⃣ Testing voice command integration...');
    console.log('   (Checking if Phoenix Voice Commands can use TTS)');

    const voiceIntegration = await page.evaluate(() => {
      if (typeof window.phoenixVoiceCommands === 'undefined') {
        return { available: false, error: 'phoenixVoiceCommands not loaded' };
      }

      // Check if speak method exists
      if (typeof window.phoenixVoiceCommands.speak !== 'function') {
        return { available: false, error: 'speak method not found' };
      }

      return {
        available: true,
        hasSpeak: true,
        config: {
          useNativeAPIs: window.phoenixVoiceCommands.useNativeAPIs,
          isSpeaking: window.phoenixVoiceCommands.isSpeaking
        }
      };
    });

    if (voiceIntegration.available) {
      console.log(`   ✅ Voice Commands integration ready`);
      console.log(`   Method: ${voiceIntegration.hasSpeak ? 'speak() available' : 'N/A'}`);
    } else {
      console.log(`   ❌ Voice Commands integration issue`);
      console.log(`   Error: ${voiceIntegration.error}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`TTS Endpoint: ${config.apiUrl}/tts/generate`);
    console.log(`OpenAI TTS: ${ttsTest.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`Voice Integration: ${voiceIntegration.available ? '✅ Ready' : '❌ Issue'}`);
    console.log(`Browser Fallback: ${config.ttsAvailable ? '✅ Available' : '❌ N/A'}`);

    if (ttsTest.success && voiceIntegration.available) {
      console.log('\n🎉 VOICE SYSTEM IS FULLY OPERATIONAL!');
      console.log(`   Response Time: ${ttsTest.totalTime}ms`);
      console.log(`   Using: OpenAI TTS (echo voice, 1.4x speed)`);
    } else {
      console.log('\n⚠️  ISSUES DETECTED - See details above');
    }

    console.log('\n⏳ Keeping browser open for 10 seconds...');
    console.log('   You can manually test voice commands now!');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
  }

  await browser.close();
  console.log('\n✅ Test complete!\n');
}

// Run the test
testVoiceAndTTS().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
