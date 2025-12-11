/**
 * Puppeteer Test Script for Phoenix Dashboard
 * Captures all console errors, network errors, and issues
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static file server
function startServer(port = 8080) {
  const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code == 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('404 - File Not Found', 'utf-8');
        } else {
          res.writeHead(500);
          res.end('Server Error: ' + error.code + ' ..\n');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`✅ Local server started on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function testDashboard() {
  console.log('\n🚀 Starting Phoenix Dashboard Test...\n');

  const errors = [];
  const warnings = [];
  const networkErrors = [];
  const logs = [];

  // Start local server
  const server = await startServer(8080);

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        errors.push(text);
        console.log(`❌ ERROR: ${text}`);
      } else if (type === 'warning') {
        warnings.push(text);
        console.log(`⚠️  WARNING: ${text}`);
      } else if (type === 'log') {
        logs.push(text);
        // Don't print all logs, too verbose
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      const failure = `${request.url()} - ${request.failure().errorText}`;
      networkErrors.push(failure);
      console.log(`❌ NETWORK ERROR: ${failure}`);
    });

    // Capture response errors
    page.on('response', response => {
      const status = response.status();
      if (status >= 400) {
        const error = `${response.url()} - ${status}`;
        networkErrors.push(error);
        console.log(`❌ HTTP ${status}: ${response.url()}`);
      }
    });

    // Navigate to dashboard
    console.log('\n📄 Loading dashboard.html...\n');
    await page.goto('http://localhost:8080/dashboard.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for all JavaScript to execute
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot
    await page.screenshot({ path: 'dashboard-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to dashboard-test.png\n');

    // Close browser
    await browser.close();

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`🌐 Network Errors: ${networkErrors.length}`);
    console.log(`📝 Log Messages: ${logs.length}`);
    console.log('='.repeat(70));

    if (errors.length > 0) {
      console.log('\n❌ ALL ERRORS:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 ALL NETWORK ERRORS:');
      networkErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      errors,
      warnings,
      networkErrors,
      logCount: logs.length
    };

    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Full report saved to test-report.json\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Close server
    server.close();
    console.log('✅ Server closed\n');
  }
}

// Run test
testDashboard().catch(console.error);
