const puppeteer = require('puppeteer');
const https = require('https');

function apiCall(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'pal-backend-production.up.railway.app',
      port: 443,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  // First get a real token
  console.log('=== GETTING REAL TOKEN ===\n');

  let token, userId;

  // Try login
  const loginRes = await apiCall('/auth/login', 'POST', {
    email: 'test@phoenix.com',
    password: 'test123'
  });

  if (loginRes.token) {
    token = loginRes.token;
    userId = loginRes.user?._id || loginRes.userId;
    console.log('Logged in as:', loginRes.user?.email || 'test@phoenix.com');
  } else {
    console.log('Login failed:', loginRes.message || loginRes);

    // Register new user
    const email = 'consoletest' + Date.now() + '@phoenix.com';
    const regRes = await apiCall('/auth/register', 'POST', {
      email: email,
      password: 'test123',
      name: 'Console Test'
    });

    if (regRes.token) {
      token = regRes.token;
      userId = regRes.user?._id || regRes.userId;
      console.log('Registered new user:', email);
    } else {
      console.log('Registration failed:', regRes.message || regRes);
      process.exit(1);
    }
  }

  console.log('Token:', token.substring(0, 50) + '...');
  console.log('User ID:', userId);
  console.log('\n');

  // Now use puppeteer with this real token
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const consoleLogs = [];
  const failedUrls = new Set();

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push('[' + msg.type().toUpperCase() + '] ' + text);
  });

  page.on('pageerror', err => {
    consoleLogs.push('[PAGE_ERROR] ' + err.message);
    consoleLogs.push('[STACK] ' + (err.stack || 'no stack'));
  });

  page.on('requestfailed', request => {
    const url = request.url().replace('https://pal-backend-production.up.railway.app', '');
    failedUrls.add(url);
  });

  // Set token before page load
  await page.evaluateOnNewDocument((t, u) => {
    localStorage.setItem('phoenixToken', t);
    localStorage.setItem('phoenix_user_id', u);
  }, token, userId);

  console.log('=== LOADING DASHBOARD ===\n');

  await page.goto('http://localhost:8080/dashboard.html', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for full initialization
  await new Promise(r => setTimeout(r, 12000));

  // Get orchestrator state
  const state = await page.evaluate(() => {
    if (window.phoenixOrchestrator) {
      const o = window.phoenixOrchestrator;
      return {
        initialized: o.state?.initialized,
        authenticated: o.state?.authenticated,
        systemsReady: o.state?.systemsReady,
        health: o.state?.health,
        metrics: o.performanceMetrics,
        user: o.state?.user?.name || o.state?.user?.email
      };
    }
    return { error: 'phoenixOrchestrator not found' };
  });

  console.log('=== ORCHESTRATOR STATE ===');
  console.log(JSON.stringify(state, null, 2));

  console.log('\n=== FAILED API CALLS (' + failedUrls.size + ' unique) ===');
  [...failedUrls].slice(0, 20).forEach(u => console.log(u));

  console.log('\n=== CONSOLE LOGS (last 50) ===');
  consoleLogs.slice(-50).forEach(log => console.log(log));

  await browser.close();
})();
