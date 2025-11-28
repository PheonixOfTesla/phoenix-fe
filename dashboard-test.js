const puppeteer = require('puppeteer');

(async () => {
  console.log('='.repeat(60));
  console.log('DASHBOARD MANUAL MODE TEST');
  console.log('='.repeat(60));

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
    // Go directly to dashboard
    console.log('\n--- Loading Dashboard ---');
    await page.goto('https://phoenix-fe-indol.vercel.app/dashboard.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Waiting for dashboard to initialize...');
    await new Promise(r => setTimeout(r, 5000));

    // Take screenshot
    await page.screenshot({ path: '/tmp/dashboard-loaded.png' });
    console.log('Screenshot: /tmp/dashboard-loaded.png');

    // Check page structure
    console.log('\n--- Page Structure ---');
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyClass: document.body.className,
        mainElements: Array.from(document.querySelectorAll('[class*="mode"], [class*="toggle"], [class*="input"]'))
                          .slice(0, 5)
                          .map(el => ({ tag: el.tagName, class: el.className, id: el.id })),
        buttons: Array.from(document.querySelectorAll('button'))
                       .slice(0, 15)
                       .map(b => ({ text: b.innerText?.substring(0, 30), class: b.className?.substring(0, 30) }))
      };
    });
    console.log('Title:', pageInfo.title);
    console.log('Body class:', pageInfo.bodyClass);
    console.log('Mode-related elements:', JSON.stringify(pageInfo.mainElements, null, 2));
    console.log('Buttons:', JSON.stringify(pageInfo.buttons, null, 2));

    // Look for input mode toggle
    console.log('\n--- Looking for Input Mode Toggle ---');
    const modeToggle = await page.evaluate(() => {
      // Common patterns for mode toggles
      const selectors = [
        '.input-mode-toggle',
        '.mode-toggle',
        '#inputModeToggle',
        '[class*="manual"]',
        '[class*="voice"]',
        '.toggle-container'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          return { found: true, selector: sel, className: el.className, innerHTML: el.innerHTML?.substring(0, 200) };
        }
      }
      return { found: false };
    });
    console.log('Mode toggle search:', modeToggle);

    // Try clicking voice/manual toggle
    console.log('\n--- Attempting Toggle ---');
    const clickResult = await page.evaluate(() => {
      // Look for specific patterns
      const patterns = [
        () => document.querySelector('.mode-toggle button'),
        () => document.querySelector('[onclick*="manual"]'),
        () => document.querySelector('[onclick*="text"]'),
        () => Array.from(document.querySelectorAll('button')).find(b => /manual|text|type/i.test(b.innerText)),
        () => document.querySelector('.toggle-switch'),
        () => document.querySelector('input[type="checkbox"]')
      ];

      for (const pattern of patterns) {
        const el = pattern();
        if (el) {
          el.click();
          return { clicked: true, element: el.outerHTML?.substring(0, 100) };
        }
      }
      return { clicked: false };
    });
    console.log('Click result:', clickResult);

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '/tmp/after-toggle.png' });
    console.log('Screenshot: /tmp/after-toggle.png');

    // Check for text input area
    console.log('\n--- Looking for Text Input ---');
    const inputResult = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
      return Array.from(inputs).slice(0, 5).map(inp => ({
        tag: inp.tagName,
        type: inp.type,
        id: inp.id,
        placeholder: inp.placeholder,
        visible: window.getComputedStyle(inp).display !== 'none'
      }));
    });
    console.log('Inputs found:', JSON.stringify(inputResult, null, 2));

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60));
    console.log('Page Errors:', errors.length);
    errors.forEach(e => console.log('  -', e.substring(0, 80)));
    console.log('\nAPI Calls:', apiCalls.length);
    apiCalls.forEach(c => console.log('  -', c.status, c.endpoint));

    // Keep browser open
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
