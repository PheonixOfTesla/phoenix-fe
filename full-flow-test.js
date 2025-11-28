const puppeteer = require('puppeteer');

(async () => {
  console.log('='.repeat(60));
  console.log('PHOENIX FULL FLOW TEST - REGISTER → LOGIN → DASHBOARD');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const [page] = await browser.pages();

  const testEmail = `fullflow${Date.now()}@test.com`;
  const testPassword = 'Phoenix123';
  const testName = 'Test User';

  console.log('Test credentials:', testEmail, testPassword);

  const errors = [];
  const apiCalls = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.indexOf('DevTools') === -1) {
      console.log('[CONSOLE]', text.substring(0, 120));
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
    // STEP 1: Go to dashboard (will show login)
    console.log('\n--- STEP 1: Load Dashboard (Login Screen) ---');
    await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/tmp/step1-login-screen.png' });
    console.log('Screenshot: /tmp/step1-login-screen.png');

    // STEP 2: Click "Create Account" to go to registration
    console.log('\n--- STEP 2: Click Create Account ---');
    const createAccountClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, .btn-link'));
      for (const btn of btns) {
        if (/create.*account/i.test(btn.innerText)) {
          btn.click();
          return btn.innerText;
        }
      }
      return null;
    });
    console.log('Clicked:', createAccountClicked);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/step2-create-form.png' });

    // STEP 3: Fill registration form
    console.log('\n--- STEP 3: Fill Registration Form ---');

    // Fill name
    await page.evaluate((name) => {
      const nameInput = document.querySelector('#ob-name, input[placeholder*="name" i]');
      if (nameInput) {
        nameInput.value = name;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Filled name:', name);
      }
    }, testName);

    // Fill email
    await page.evaluate((email) => {
      const emailInput = document.querySelector('#ob-email, input[type="email"]');
      if (emailInput) {
        emailInput.value = email;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Filled email:', email);
      }
    }, testEmail);

    // Fill password
    await page.evaluate((password) => {
      const passInputs = document.querySelectorAll('input[type="password"]');
      passInputs.forEach(inp => {
        inp.value = password;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      });
      console.log('Filled password fields');
    }, testPassword);

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/tmp/step3-filled-form.png' });
    console.log('Screenshot: /tmp/step3-filled-form.png');

    // STEP 4: Submit registration
    console.log('\n--- STEP 4: Submit Registration ---');
    const registerClicked = await page.evaluate(() => {
      // Look for the continue or create account button
      const btns = Array.from(document.querySelectorAll('button'));
      for (const btn of btns) {
        const text = btn.innerText?.toLowerCase() || '';
        if (text.includes('continue') || text.includes('create') || text.includes('activate')) {
          btn.click();
          return btn.innerText;
        }
      }
      return null;
    });
    console.log('Clicked:', registerClicked);

    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: '/tmp/step4-after-register.png' });

    // Check current URL and state
    const afterRegisterState = await page.evaluate(() => {
      return {
        url: window.location.href,
        token: localStorage.getItem('phoenixToken') || localStorage.getItem('token'),
        visibleViews: Array.from(document.querySelectorAll('[class*="view"], .container')).filter(el =>
          window.getComputedStyle(el).display !== 'none'
        ).map(el => el.className)
      };
    });
    console.log('After register state:', afterRegisterState);

    // STEP 5: If still on login, try logging in
    if (!afterRegisterState.token) {
      console.log('\n--- STEP 5: Manual Login ---');

      // Switch to login mode if needed
      await page.evaluate(() => {
        const loginTab = Array.from(document.querySelectorAll('button, .tab')).find(el =>
          /login/i.test(el.innerText)
        );
        if (loginTab) loginTab.click();
      });
      await new Promise(r => setTimeout(r, 1000));

      // Fill login form
      await page.evaluate((email, password) => {
        // Email/phone field
        const emailInput = document.querySelector('#login-email, #login-phone, input[type="email"], input[type="tel"]');
        if (emailInput) {
          emailInput.value = email;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Password field
        const passInput = document.querySelector('#login-password, input[type="password"]');
        if (passInput) {
          passInput.value = password;
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, testEmail, testPassword);

      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: '/tmp/step5-login-filled.png' });

      // Click login button
      await page.evaluate(() => {
        const loginBtn = Array.from(document.querySelectorAll('button')).find(b =>
          /login|activate|sign\s*in/i.test(b.innerText)
        );
        if (loginBtn) loginBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));
    }

    // STEP 6: Check dashboard
    console.log('\n--- STEP 6: Dashboard State ---');
    await page.screenshot({ path: '/tmp/step6-dashboard.png' });

    const dashboardState = await page.evaluate(() => {
      return {
        url: window.location.href,
        token: localStorage.getItem('phoenixToken') || localStorage.getItem('token') ? 'YES' : 'NO',
        visibleContent: document.body.innerText.substring(0, 500),
        modeToggle: document.querySelector('.mode-toggle, .input-mode, [class*="toggle"]')?.outerHTML?.substring(0, 200),
        chatInput: document.querySelector('input[type="text"], textarea, #messageInput, .chat-input')?.outerHTML?.substring(0, 100)
      };
    });
    console.log('Dashboard state:');
    console.log('  Token:', dashboardState.token);
    console.log('  URL:', dashboardState.url);
    console.log('  Mode toggle:', dashboardState.modeToggle);
    console.log('  Chat input:', dashboardState.chatInput);

    // STEP 7: Look for voice/manual toggle in dashboard
    console.log('\n--- STEP 7: Find Voice/Manual Mode Toggle ---');
    const modeElements = await page.evaluate(() => {
      const results = [];

      // Look for specific patterns
      const selectors = [
        '.mode-toggle',
        '.input-toggle',
        '#voice-mode-btn',
        '#manual-mode-btn',
        '#text-mode-btn',
        '.voice-btn',
        '.text-btn',
        '[onclick*="voice"]',
        '[onclick*="manual"]',
        '[onclick*="text"]'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          results.push({ selector: sel, html: el.outerHTML?.substring(0, 100) });
        }
      }

      // Also look for buttons with relevant text
      const buttons = Array.from(document.querySelectorAll('button')).filter(b =>
        /voice|manual|text|speak|type/i.test(b.innerText)
      );
      buttons.forEach(b => {
        results.push({ selector: 'button', text: b.innerText, html: b.outerHTML?.substring(0, 100) });
      });

      return results;
    });
    console.log('Mode elements found:', modeElements);

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60));
    console.log('Page Errors:', errors.length);
    errors.forEach(e => console.log('  ERROR:', e.substring(0, 80)));
    console.log('\nAPI Calls:', apiCalls.length);
    apiCalls.forEach(c => console.log('  ', c.status, c.endpoint));

    console.log('\nScreenshots saved to /tmp/step*.png');
    console.log('\nBrowser open for 30 seconds for manual inspection...');
    await new Promise(r => setTimeout(r, 30000));

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
