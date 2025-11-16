/**
 * TEST PLANET NAVIGATION BUTTON
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🌍 TESTING PLANET NAVIGATION BUTTON\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Clear everything
    await page.evaluateOnNewDocument(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    // Capture ALL console messages
    page.on('console', msg => {
        const text = msg.text();
        console.log('BROWSER:', text);
    });

    console.log('1. Loading localhost:8000\n');
    await page.goto('http://localhost:8000', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await page.waitForTimeout(2000);

    console.log('2. Logging in with simple@phoenix.com\n');

    // Switch to email if needed
    const phoneInput = await page.$('#login-phone');
    if (phoneInput) {
        await page.evaluate(() => {
            const btn = document.querySelector('button[onclick*="toggleLoginMethod"]');
            if (btn) btn.click();
        });
        await page.waitForTimeout(500);
    }

    await page.type('#login-email-alt', 'simple@phoenix.com', { delay: 50 });
    await page.type('#login-password', 'test123456', { delay: 50 });

    console.log('3. Clicking LOGIN\n');
    await page.click('#login-btn');

    console.log('4. Waiting for dashboard...\n');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (!currentUrl.includes('dashboard')) {
        console.log('❌ Not on dashboard, cannot test planet button');
        await browser.close();
        return;
    }

    console.log('\n5. Looking for planet navigation button...\n');

    const planetButton = await page.$('#planet-nav-tab');
    if (!planetButton) {
        console.log('❌ Planet navigation button not found!');
        await browser.close();
        return;
    }

    console.log('✅ Planet button found!\n');

    // Check if togglePlanetPanel function exists
    const functionExists = await page.evaluate(() => {
        return typeof window.togglePlanetPanel === 'function';
    });

    console.log('Function exists?', functionExists ? '✅ YES' : '❌ NO');

    if (!functionExists) {
        console.log('\n❌ togglePlanetPanel function not found in global scope!\n');
        await browser.close();
        return;
    }

    console.log('6. Checking panel state BEFORE click...\n');

    const beforeState = await page.evaluate(() => {
        const panel = document.getElementById('planet-selection-panel');
        if (!panel) return { error: 'PANEL NOT FOUND' };
        const computedStyle = window.getComputedStyle(panel);
        return {
            left: computedStyle.left,
            inlineStyle: panel.style.left,
            display: computedStyle.display,
            visibility: computedStyle.visibility
        };
    });

    console.log('Before click:', JSON.stringify(beforeState, null, 2));

    // Check if anything is blocking the button
    const blockingElements = await page.evaluate(() => {
        const button = document.getElementById('planet-nav-tab');
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const elementAtPoint = document.elementFromPoint(centerX, centerY);

        return {
            buttonRect: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            },
            elementAtCenter: elementAtPoint ? elementAtPoint.id || elementAtPoint.tagName : 'NONE',
            syncPromptDisplay: document.getElementById('sync-prompt')?.style.display
        };
    });

    console.log('Blocking check:', JSON.stringify(blockingElements, null, 2));

    console.log('\n7. Clicking planet navigation button...\n');

    await page.click('#planet-nav-tab');

    console.log('8. Waiting 1 second...\n');
    await page.waitForTimeout(1000);

    // Try calling the function directly
    console.log('9. Trying to call togglePlanetPanel() directly...\n');
    await page.evaluate(() => {
        window.togglePlanetPanel();
    });

    console.log('10. Waiting 2 more seconds...\n');
    await page.waitForTimeout(2000);

    // Check panel state
    const panelLeft = await page.evaluate(() => {
        const panel = document.getElementById('planet-selection-panel');
        if (!panel) return 'PANEL NOT FOUND';
        const computedStyle = window.getComputedStyle(panel);
        return computedStyle.left;
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('RESULT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Panel left position:', panelLeft);

    if (panelLeft === '0px') {
        console.log('✅ SUCCESS - Panel is OPEN!\n');
    } else if (panelLeft === '-400px') {
        console.log('❌ FAILED - Panel is still CLOSED\n');
    } else {
        console.log('⚠️  UNEXPECTED - Panel position:', panelLeft, '\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Browser left open. Press Ctrl+C to close.\n');

})().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
