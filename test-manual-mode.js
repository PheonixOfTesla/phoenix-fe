const puppeteer = require('puppeteer');
const https = require('https');

// First register a user via API
function registerUser() {
  return new Promise((resolve, reject) => {
    const testEmail = `manualtest${Date.now()}@test.com`;
    const testPassword = 'Phoenix123';

    const data = JSON.stringify({
      name: 'Manual Mode Tester',
      email: testEmail,
      password: testPassword
    });

    const req = https.request({
      hostname: 'pal-backend-production.up.railway.app',
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(body);
        if (parsed.success && parsed.token) {
          resolve({ token: parsed.token, email: testEmail, password: testPassword, userId: parsed.user._id });
        } else {
          reject(new Error(parsed.message || 'Registration failed'));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('='.repeat(60));
  console.log('MANUAL MODE TEST - WITH AUTHENTICATION');
  console.log('='.repeat(60));

  // Step 1: Register user via API
  console.log('\n--- STEP 1: Register Test User ---');
  let auth;
  try {
    auth = await registerUser();
    console.log('Registered:', auth.email);
    console.log('Token:', auth.token.substring(0, 40) + '...');
  } catch (e) {
    console.error('Registration failed:', e.message);
    process.exit(1);
  }

  // Step 2: Launch browser
  console.log('\n--- STEP 2: Launch Browser ---');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const [page] = await browser.pages();

  const errors = [];
  const apiCalls = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.indexOf('DevTools') === -1) {
      console.log('[CONSOLE]', text.substring(0, 100));
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('[PAGE ERROR]', err.message);
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('railway.app')) {
      const status = response.status();
      const endpoint = url.split('/api/')[1] || url;
      apiCalls.push({ status, endpoint: endpoint.substring(0, 50) });
      console.log('[API]', status, endpoint.substring(0, 50));
    }
  });

  try {
    // Step 3: Navigate to dashboard and inject token
    console.log('\n--- STEP 3: Load Dashboard with Token ---');
    await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html', {
      waitUntil: 'domcontentloaded'
    });

    // Inject auth token before page fully loads
    await page.evaluate((token, userId) => {
      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      console.log('Token injected into localStorage');
    }, auth.token, auth.userId);

    // Reload to apply token
    console.log('Reloading page with token...');
    await page.reload({ waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: '/tmp/manual-test-1-dashboard.png' });
    console.log('Screenshot: /tmp/manual-test-1-dashboard.png');

    // Step 4: Check if authenticated
    console.log('\n--- STEP 4: Verify Authentication ---');
    const authState = await page.evaluate(() => {
      return {
        token: localStorage.getItem('phoenixToken') ? 'YES' : 'NO',
        bodyMode: document.body.getAttribute('data-mode'),
        modeToggleVisible: window.getComputedStyle(document.getElementById('mode-toggle-container') || document.body).display,
        voiceBtn: document.getElementById('voice-mode-btn')?.innerText,
        manualBtn: document.getElementById('manual-mode-btn')?.innerText
      };
    });
    console.log('Auth state:', authState);

    // Step 5: Click Manual Mode
    console.log('\n--- STEP 5: Click Manual Mode Button ---');
    const manualClicked = await page.evaluate(() => {
      const btn = document.getElementById('manual-mode-btn');
      if (btn) {
        btn.click();
        return { clicked: true, buttonText: btn.innerText };
      }
      return { clicked: false };
    });
    console.log('Manual click result:', manualClicked);

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/manual-test-2-after-click.png' });

    // Check if mode changed
    const afterManual = await page.evaluate(() => {
      return {
        bodyMode: document.body.getAttribute('data-mode'),
        voiceBtnPressed: document.getElementById('voice-mode-btn')?.getAttribute('aria-pressed'),
        manualBtnPressed: document.getElementById('manual-mode-btn')?.getAttribute('aria-pressed'),
        savedMode: localStorage.getItem('phoenix_ui_mode')
      };
    });
    console.log('After manual click:', afterManual);

    // Step 6: Click Voice Mode
    console.log('\n--- STEP 6: Click Voice Mode Button ---');
    const voiceClicked = await page.evaluate(() => {
      const btn = document.getElementById('voice-mode-btn');
      if (btn) {
        btn.click();
        return { clicked: true, buttonText: btn.innerText };
      }
      return { clicked: false };
    });
    console.log('Voice click result:', voiceClicked);

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/manual-test-3-voice-mode.png' });

    const afterVoice = await page.evaluate(() => {
      return {
        bodyMode: document.body.getAttribute('data-mode'),
        voiceBtnPressed: document.getElementById('voice-mode-btn')?.getAttribute('aria-pressed'),
        manualBtnPressed: document.getElementById('manual-mode-btn')?.getAttribute('aria-pressed'),
        savedMode: localStorage.getItem('phoenix_ui_mode')
      };
    });
    console.log('After voice click:', afterVoice);

    // Step 7: Test text input in manual mode
    console.log('\n--- STEP 7: Test Text Input in Manual Mode ---');
    await page.evaluate(() => {
      const btn = document.getElementById('manual-mode-btn');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Look for text input
    const textInputInfo = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
      const chatInput = document.querySelector('#messageInput, .chat-input, .message-input');
      return {
        inputCount: inputs.length,
        chatInput: chatInput ? { id: chatInput.id, placeholder: chatInput.placeholder, visible: window.getComputedStyle(chatInput).display } : null,
        inputs: Array.from(inputs).slice(0, 5).map(i => ({ id: i.id, placeholder: i.placeholder }))
      };
    });
    console.log('Text inputs found:', textInputInfo);

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log('Page Errors:', errors.length);
    errors.forEach(e => console.log('  ERROR:', e.substring(0, 80)));
    console.log('\nAPI Calls:', apiCalls.length);
    console.log('\nMode Toggle Working:');
    console.log('  - Manual mode activated:', afterManual.bodyMode === 'manual' ? 'YES' : 'NO');
    console.log('  - Voice mode activated:', afterVoice.bodyMode === 'voice' ? 'YES' : 'NO');
    console.log('  - Mode persisted:', afterManual.savedMode ? 'YES' : 'NO');

    console.log('\nScreenshots saved to /tmp/manual-test-*.png');
    console.log('\nBrowser open for 20 seconds...');
    await new Promise(r => setTimeout(r, 20000));

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
