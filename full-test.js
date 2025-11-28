const puppeteer = require('puppeteer');

(async () => {
  console.log('='.repeat(60));
  console.log('PHOENIX FULL TEST - VISIBLE BROWSER + CONSOLE MONITORING');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--auto-open-devtools-for-tabs']
  });

  const [page] = await browser.pages();

  // Collect ALL console messages
  const consoleLogs = [];
  const errors = [];
  const apiCalls = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
    if (!text.includes('DevTools')) {
      console.log(`CONSOLE: ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`PAGE ERROR: ${err.message}`);
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('railway.app')) {
      const status = response.status();
      apiCalls.push({ status, url: url.substring(0, 100) });
      console.log(`API: ${status} ${url.substring(url.lastIndexOf('/'))}`);
    }
  });

  try {
    // STEP 1: ONBOARDING
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: ONBOARDING PAGE');
    console.log('='.repeat(60));

    await page.goto('https://phoenix-fe-indol.vercel.app/onboarding.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Waiting for page to fully load...');
    await new Promise(r => setTimeout(r, 4000));
    console.log('Onboarding page loaded');

    // Screenshot onboarding
    await page.screenshot({ path: '/tmp/step1-onboarding.png' });
    console.log('Screenshot: /tmp/step1-onboarding.png');

    // Click Initialize System button
    console.log('Looking for Initialize button...');
    await new Promise(r => setTimeout(r, 1000));

    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, .cta-button');
      for (const btn of btns) {
        if (btn.innerText && btn.innerText.toLowerCase().includes('initialize')) {
          btn.click();
          return btn.innerText;
        }
      }
      // Click first button if no initialize found
      if (btns[0]) {
        btns[0].click();
        return btns[0].innerText || 'first button';
      }
      return null;
    });
    console.log(`Clicked: ${clicked}`);
    await new Promise(r => setTimeout(r, 3000));

    // STEP 2: CREATE ACCOUNT
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: CREATE ACCOUNT');
    console.log('='.repeat(60));

    const testEmail = `fulltest${Date.now()}@test.com`;
    const testPassword = 'TestPass123!';
    console.log(`Test account: ${testEmail}`);

    // Check what page we're on and fill form
    await page.screenshot({ path: '/tmp/step2-form.png' });

    // Fill name if present
    const hasName = await page.evaluate(() => {
      const input = document.querySelector('input[name="name"], input[placeholder*="name" i], input[id*="name" i]');
      if (input) {
        input.value = 'Test User';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    });
    if (hasName) console.log('Filled name field');

    // Fill email
    const hasEmail = await page.evaluate((email) => {
      const input = document.querySelector('input[type="email"], input[placeholder*="email" i], input[id*="email" i]');
      if (input) {
        input.value = email;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, testEmail);
    if (hasEmail) console.log('Filled email field');

    // Fill password
    const hasPass = await page.evaluate((pass) => {
      const input = document.querySelector('input[type="password"]');
      if (input) {
        input.value = pass;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, testPassword);
    if (hasPass) console.log('Filled password field');

    await new Promise(r => setTimeout(r, 1000));

    // Click submit/register/continue button
    const submitClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = btn.innerText?.toLowerCase() || '';
        if (text.includes('register') || text.includes('create') ||
            text.includes('continue') || text.includes('next') ||
            text.includes('submit') || text.includes('begin')) {
          btn.click();
          return btn.innerText;
        }
      }
      return null;
    });
    console.log(`Clicked submit: ${submitClicked}`);

    console.log('Waiting for registration/redirect...');
    await new Promise(r => setTimeout(r, 6000));

    // Check current URL
    let currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // STEP 3: DASHBOARD
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: DASHBOARD - TESTING FEATURES');
    console.log('='.repeat(60));

    if (!currentUrl.includes('dashboard')) {
      console.log('Navigating to dashboard manually...');
      await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
    }

    console.log('Waiting for dashboard to initialize...');
    await new Promise(r => setTimeout(r, 8000));

    await page.screenshot({ path: '/tmp/step3-dashboard.png' });
    console.log('Screenshot: /tmp/step3-dashboard.png');

    // Test Voice/Manual toggle
    console.log('\n--- Testing Voice/Manual Toggle ---');
    await page.evaluate(() => {
      const voiceBtn = document.querySelector('#voice-mode-btn, button[onclick*="voice"], [data-mode="voice"]');
      if (voiceBtn) voiceBtn.click();
    });
    console.log('Clicked voice mode');
    await new Promise(r => setTimeout(r, 2000));

    await page.evaluate(() => {
      const manualBtn = document.querySelector('#manual-mode-btn, button[onclick*="manual"], [data-mode="manual"]');
      if (manualBtn) manualBtn.click();
    });
    console.log('Clicked manual mode');
    await new Promise(r => setTimeout(r, 2000));

    // Test Phoenix Orb
    console.log('\n--- Testing Phoenix Orb ---');
    await page.evaluate(() => {
      const orb = document.querySelector('.phoenix-orb, #phoenix-orb, [class*="orb"]');
      if (orb) orb.click();
    });
    console.log('Clicked orb');
    await new Promise(r => setTimeout(r, 2000));

    // Test planet elements
    console.log('\n--- Testing Planets ---');
    const planets = ['mercury', 'venus', 'mars', 'jupiter', 'earth', 'saturn'];
    for (const planet of planets) {
      const found = await page.evaluate((p) => {
        const el = document.querySelector(`[data-planet="${p}"], [onclick*="${p}"], .planet-${p}, #${p}`);
        return el ? true : false;
      }, planet);
      console.log(`Planet ${planet}: ${found ? 'FOUND' : 'not found'}`);
    }

    // Test clicking widgets
    console.log('\n--- Testing Widgets/Cards ---');
    const widgetCount = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.widget, .card, .feature-card, [class*="widget"]');
      let clicked = 0;
      widgets.forEach((w, i) => {
        if (i < 3) {
          w.click();
          clicked++;
        }
      });
      return { total: widgets.length, clicked };
    });
    console.log(`Found ${widgetCount.total} widgets, clicked ${widgetCount.clicked}`);
    await new Promise(r => setTimeout(r, 2000));

    // Final screenshot
    await page.screenshot({ path: '/tmp/step4-final.png', fullPage: true });
    console.log('Final screenshot: /tmp/step4-final.png');

    // FINAL REPORT
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60));

    console.log(`\nTotal console logs: ${consoleLogs.length}`);
    console.log(`Total errors: ${errors.length}`);
    console.log(`Total API calls: ${apiCalls.length}`);

    if (errors.length > 0) {
      console.log('\n--- ERRORS ---');
      errors.forEach(e => console.log(`  ERROR: ${e}`));
    } else {
      console.log('\n--- NO JAVASCRIPT ERRORS ---');
    }

    console.log('\n--- API CALLS TO RAILWAY ---');
    apiCalls.forEach(c => console.log(`  ${c.status} ${c.url}`));

    // Check for mock data
    console.log('\n--- MOCK DATA CHECK ---');
    const mockFound = consoleLogs.filter(log =>
      log.toLowerCase().includes('mock') ||
      log.toLowerCase().includes('fake') ||
      log.toLowerCase().includes('stub') ||
      log.toLowerCase().includes('dummy')
    );
    if (mockFound.length > 0) {
      console.log('WARNING: Found mock references:');
      mockFound.forEach(m => console.log(`  ${m}`));
    } else {
      console.log('NO MOCK DATA DETECTED IN CONSOLE');
    }

    // Keep browser open
    console.log('\n--- BROWSER OPEN FOR 60 SECONDS ---');
    console.log('You can inspect manually. DevTools should be open.');
    await new Promise(r => setTimeout(r, 60000));

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('\nBrowser closed. Test complete.');
  }
})();
