const puppeteer = require('puppeteer');
const https = require('https');

// Register a user via API
function registerUser() {
  return new Promise((resolve, reject) => {
    const testEmail = `butlertest${Date.now()}@test.com`;
    const testPassword = 'Phoenix123';

    const data = JSON.stringify({
      name: 'Butler Tester',
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
          resolve({ token: parsed.token, email: testEmail, userId: parsed.user._id });
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
  console.log('BUTLER SERVICE TEST');
  console.log('='.repeat(60));

  // Step 1: Register user
  console.log('\n--- STEP 1: Register Test User ---');
  let auth;
  try {
    auth = await registerUser();
    console.log('Registered:', auth.email);
  } catch (e) {
    console.error('Registration failed:', e.message);
    process.exit(1);
  }

  // Step 2: Launch browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const [page] = await browser.pages();

  const errors = [];
  const apiCalls = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.indexOf('DevTools') === -1 && text.indexOf('favicon') === -1) {
      console.log('[CONSOLE]', text.substring(0, 120));
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('[PAGE ERROR]', err.message);
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('railway.app') && url.includes('butler')) {
      const status = response.status();
      const endpoint = url.split('/api/')[1] || url;
      apiCalls.push({ status, endpoint: endpoint.substring(0, 60) });
      console.log('[BUTLER API]', status, endpoint.substring(0, 60));
    }
  });

  try {
    // Step 3: Load dashboard with token
    console.log('\n--- STEP 2: Load Dashboard ---');
    await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html', {
      waitUntil: 'domcontentloaded'
    });

    // Inject token
    await page.evaluate((token, userId) => {
      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
    }, auth.token, auth.userId);

    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 8000)); // Wait for full initialization

    await page.screenshot({ path: '/tmp/butler-1-dashboard.png' });
    console.log('Screenshot: /tmp/butler-1-dashboard.png');

    // Step 4: Find and click Butler button
    console.log('\n--- STEP 3: Open Butler Panel ---');

    // Look for butler panel toggle
    const butlerOpened = await page.evaluate(() => {
      // Look for butler icon in quick actions or planet menu
      const butlerTriggers = [
        document.querySelector('[onclick*="butler"]'),
        document.querySelector('[onclick*="Butler"]'),
        document.querySelector('#butler-btn'),
        document.querySelector('.butler-btn'),
        Array.from(document.querySelectorAll('button')).find(b =>
          b.innerText?.toLowerCase().includes('butler') ||
          b.title?.toLowerCase().includes('butler')
        )
      ].filter(Boolean);

      console.log('Butler triggers found:', butlerTriggers.length);

      // Also check for Saturn planet (Butler is on Saturn)
      const saturnBtn = document.querySelector('[data-planet="saturn"]') ||
                        document.querySelector('[onclick*="saturn"]') ||
                        Array.from(document.querySelectorAll('[class*="planet"]')).find(el =>
                          el.textContent?.toLowerCase().includes('saturn') ||
                          el.getAttribute('data-planet') === 'saturn'
                        );

      if (saturnBtn) {
        console.log('Found Saturn button');
        saturnBtn.click();
        return { clicked: 'saturn', found: true };
      }

      // Try clicking any butler trigger
      if (butlerTriggers[0]) {
        butlerTriggers[0].click();
        return { clicked: 'butler-trigger', found: true };
      }

      // Check if butler panel exists
      const butlerPanel = document.getElementById('butler-panel');
      if (butlerPanel) {
        butlerPanel.style.display = 'block';
        return { clicked: 'direct-show', found: true, panelHTML: butlerPanel.innerHTML.substring(0, 200) };
      }

      return { clicked: null, found: false };
    });

    console.log('Butler open result:', butlerOpened);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/butler-2-panel.png' });

    // Step 5: Check Butler panel contents
    console.log('\n--- STEP 4: Check Butler Panel ---');
    const butlerPanel = await page.evaluate(() => {
      const panel = document.getElementById('butler-panel');
      if (!panel) return { found: false };

      const buttons = panel.querySelectorAll('button, .butler-quick-btn');
      return {
        found: true,
        visible: window.getComputedStyle(panel).display !== 'none',
        buttonCount: buttons.length,
        buttons: Array.from(buttons).slice(0, 10).map(b => ({
          text: b.innerText?.substring(0, 30),
          onclick: b.getAttribute('onclick')?.substring(0, 40),
          example: b.getAttribute('data-example')
        }))
      };
    });
    console.log('Butler panel:', JSON.stringify(butlerPanel, null, 2));

    // Step 6: Test Butler actions
    console.log('\n--- STEP 5: Test Butler Actions ---');

    // Make butler panel visible
    await page.evaluate(() => {
      const panel = document.getElementById('butler-panel');
      if (panel) panel.style.display = 'block';
    });

    // Test ride booking
    console.log('\nTesting: Book Ride');
    const rideResult = await page.evaluate(() => {
      if (typeof butlerAction === 'function') {
        butlerAction('ride');
        return { called: true };
      }
      // Try clicking the ride button directly
      const rideBtn = document.querySelector('[onclick*="ride"]');
      if (rideBtn) {
        rideBtn.click();
        return { clicked: true };
      }
      return { notFound: true };
    });
    console.log('Ride action:', rideResult);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/butler-3-ride.png' });

    // Test food ordering
    console.log('\nTesting: Order Food');
    await page.evaluate(() => {
      const panel = document.getElementById('butler-panel');
      if (panel) panel.style.display = 'block';
    });
    const foodResult = await page.evaluate(() => {
      if (typeof butlerAction === 'function') {
        butlerAction('food');
        return { called: true };
      }
      const foodBtn = document.querySelector('[onclick*="food"]');
      if (foodBtn) {
        foodBtn.click();
        return { clicked: true };
      }
      return { notFound: true };
    });
    console.log('Food action:', foodResult);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/butler-4-food.png' });

    // Step 7: Check ButlerService initialization
    console.log('\n--- STEP 6: Check ButlerService ---');
    const butlerService = await page.evaluate(() => {
      // Check if ButlerService exists on window
      if (window.ButlerService) {
        return {
          exists: true,
          methods: Object.keys(window.ButlerService).slice(0, 10),
          type: typeof window.ButlerService
        };
      }
      // Check if it's in Phoenix systems
      if (window.phoenix && window.phoenix.butler) {
        return {
          exists: true,
          location: 'phoenix.butler',
          type: typeof window.phoenix.butler
        };
      }
      // Check PhoenixSystems
      if (window.PhoenixSystems && window.PhoenixSystems.butler) {
        return {
          exists: true,
          location: 'PhoenixSystems.butler'
        };
      }
      return { exists: false };
    });
    console.log('ButlerService:', butlerService);

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('BUTLER TEST RESULTS');
    console.log('='.repeat(60));
    console.log('Page Errors:', errors.length);
    errors.forEach(e => console.log('  ERROR:', e.substring(0, 80)));
    console.log('\nButler API Calls:', apiCalls.length);
    apiCalls.forEach(c => console.log('  ', c.status, c.endpoint));
    console.log('\nButler Panel Found:', butlerPanel.found ? 'YES' : 'NO');
    console.log('Butler Buttons:', butlerPanel.buttonCount || 0);
    console.log('ButlerService Ready:', butlerService.exists ? 'YES' : 'NO');

    console.log('\nScreenshots saved to /tmp/butler-*.png');
    console.log('\nBrowser open for 20 seconds...');
    await new Promise(r => setTimeout(r, 20000));

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    await page.screenshot({ path: '/tmp/butler-error.png' });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
