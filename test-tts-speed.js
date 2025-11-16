const puppeteer = require('puppeteer');

async function testTTS() {
  console.log('🧪 Starting TTS Connection & Speed Test\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();

  // Enable audio
  await page.evaluateOnNewDocument(() => {
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || (() => Promise.resolve({
      getTracks: () => [],
      getAudioTracks: () => [],
      getVideoTracks: () => [],
    }));
  });

  const results = {
    connection: null,
    latency: [],
    quality: null,
    siriLike: false
  };

  // Listen for console logs and TTS events
  page.on('console', msg => {
    const text = msg.text();
    console.log(`📱 Console: ${text}`);

    // Track TTS events
    if (text.includes('TTS') || text.includes('speech') || text.includes('voice')) {
      console.log(`🎤 Voice Event: ${text}`);
    }
  });

  try {
    console.log('1️⃣ Navigating to dashboard...');
    await page.goto('http://localhost:8000/dashboard.html', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('✅ Dashboard loaded\n');

    // Check if TTS is available
    console.log('2️⃣ Checking TTS availability...');
    const ttsAvailable = await page.evaluate(() => {
      return 'speechSynthesis' in window;
    });

    if (ttsAvailable) {
      console.log('✅ Speech Synthesis API available\n');
      results.connection = 'available';
    } else {
      console.log('❌ Speech Synthesis API NOT available\n');
      results.connection = 'unavailable';
      return results;
    }

    // Test TTS speed with multiple phrases
    console.log('3️⃣ Testing TTS speed and latency...\n');
    const testPhrases = [
      'Hello, I am Phoenix.',
      'Your health metrics look great today.',
      'Would you like me to help you with anything?',
      'I can assist with your fitness goals.',
      'Let me check your schedule for today.'
    ];

    for (let i = 0; i < testPhrases.length; i++) {
      const phrase = testPhrases[i];
      console.log(`   Testing phrase ${i + 1}: "${phrase}"`);

      const timing = await page.evaluate((text) => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          const utterance = new SpeechSynthesisUtterance(text);

          utterance.rate = 1.2; // Siri-like speed
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onstart = () => {
            const initTime = performance.now() - startTime;
            console.log(`TTS started in ${initTime.toFixed(2)}ms`);
          };

          utterance.onend = () => {
            const totalTime = performance.now() - startTime;
            resolve({
              initTime: performance.now() - startTime,
              totalTime: totalTime,
              success: true
            });
          };

          utterance.onerror = (error) => {
            resolve({
              success: false,
              error: error.error
            });
          };

          window.speechSynthesis.speak(utterance);
        });
      }, phrase);

      if (timing.success) {
        console.log(`   ✅ Init: ${timing.initTime.toFixed(2)}ms | Total: ${timing.totalTime.toFixed(2)}ms`);
        results.latency.push({
          phrase: phrase,
          initTime: timing.initTime,
          totalTime: timing.totalTime
        });

        // Wait a bit between phrases
        await page.waitForTimeout(500);
      } else {
        console.log(`   ❌ Failed: ${timing.error}`);
      }
    }

    // Calculate average latency
    if (results.latency.length > 0) {
      const avgInit = results.latency.reduce((sum, t) => sum + t.initTime, 0) / results.latency.length;
      const avgTotal = results.latency.reduce((sum, t) => sum + t.totalTime, 0) / results.latency.length;

      console.log(`\n📊 Average Latency:`);
      console.log(`   Initialization: ${avgInit.toFixed(2)}ms`);
      console.log(`   Total Time: ${avgTotal.toFixed(2)}ms`);

      // Evaluate Siri-like performance (Siri typically responds in 50-200ms)
      if (avgInit < 100) {
        console.log(`   ⭐ EXCELLENT - Faster than Siri!`);
        results.siriLike = true;
        results.quality = 'excellent';
      } else if (avgInit < 300) {
        console.log(`   ✅ GOOD - Comparable to Siri`);
        results.siriLike = true;
        results.quality = 'good';
      } else if (avgInit < 500) {
        console.log(`   ⚠️  ACCEPTABLE - Slightly slower than Siri`);
        results.quality = 'acceptable';
      } else {
        console.log(`   ❌ SLOW - Needs optimization`);
        results.quality = 'slow';
      }
    }

    // Test voice continuity (important for Siri-like experience)
    console.log('\n4️⃣ Testing voice continuity and flow...');
    const continuityTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        let utteranceCount = 0;
        const utterances = [
          'Testing continuity.',
          'Second phrase.',
          'Third phrase.'
        ];

        const startTime = performance.now();

        const speakNext = (index) => {
          if (index >= utterances.length) {
            const totalTime = performance.now() - startTime;
            resolve({
              success: true,
              totalTime: totalTime,
              averageGap: totalTime / utterances.length
            });
            return;
          }

          const utterance = new SpeechSynthesisUtterance(utterances[index]);
          utterance.rate = 1.2;

          utterance.onend = () => {
            speakNext(index + 1);
          };

          utterance.onerror = () => {
            resolve({ success: false });
          };

          window.speechSynthesis.speak(utterance);
        };

        speakNext(0);
      });
    });

    if (continuityTest.success) {
      console.log(`   ✅ Continuity test passed`);
      console.log(`   Average time between phrases: ${(continuityTest.averageGap).toFixed(2)}ms`);

      if (continuityTest.averageGap < 1000) {
        console.log(`   ⭐ Flows smoothly like Siri!`);
      }
    }

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL TTS ASSESSMENT');
    console.log('='.repeat(60));
    console.log(`Connection: ${results.connection}`);
    console.log(`Quality: ${results.quality}`);
    console.log(`Siri-like Experience: ${results.siriLike ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Tests Completed: ${results.latency.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
  }

  // Keep browser open for 5 seconds so user can test manually
  console.log('\n⏳ Keeping browser open for 10 seconds for manual testing...');
  console.log('   Try clicking the Phoenix orb or voice button to test TTS yourself!');
  await page.waitForTimeout(10000);

  await browser.close();
  return results;
}

// Run the test
testTTS().then(results => {
  console.log('\n✅ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
