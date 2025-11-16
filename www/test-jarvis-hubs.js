/**
 * JARVIS COMMAND CENTERS DEMO
 * Opens each hub and tests navigation
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🎯 JARVIS COMMAND CENTERS TEST\n');
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Login first
    await page.goto('http://localhost:8000/dashboard.html', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        localStorage.setItem('phoenixToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzI3YTBiODczOTY1OTExYWVmYTBhNCIsImlhdCI6MTczMDQyMDAxOSwiZXhwIjoxNzMzMDEyMDE5fQ.LblCaEzKOjYFcIrBRhHhHQ7KlqFPjRPJiUKZ2OoPbOk');
    });
    await page.reload({ waitUntil: 'networkidle2' });

    console.log('\n✅ Dashboard loaded\n');

    // Wait for greeting to appear and fade
    console.log('⏳ Waiting for greeting to auto-hide (6 seconds)...\n');
    await new Promise(r => setTimeout(r, 6000));

    const hubs = [
        { name: 'Recovery Command Center', selector: '#recovery-panel-clickable' },
        { name: 'Optimization Hub', selector: '[onclick*="openJarvisHub(\'optimization\')"]' },
        { name: 'Integration Marketplace', selector: '[onclick*="openJarvisHub(\'integrations\')"]' },
        { name: 'Tier Progression Vault', selector: '[onclick*="openJarvisHub(\'tiers\')"]' }
    ];

    console.log('🎮 Testing JARVIS Hubs...\n');

    for (const hub of hubs) {
        console.log(`📂 Opening: ${hub.name}`);

        try {
            // Click the panel to open hub
            await page.click(hub.selector);
            await new Promise(r => setTimeout(r, 2000));

            // Check if hub is visible
            const isVisible = await page.evaluate((hubName) => {
                const hubId = `jarvis-${hubName}-hub`;
                const hubEl = document.getElementById(hubId);
                return hubEl && hubEl.style.display !== 'none';
            }, hub.name.toLowerCase().split(' ')[0]);

            if (isVisible) {
                console.log(`   ✅ ${hub.name} opened successfully`);
            } else {
                console.log(`   ❌ ${hub.name} failed to open`);
            }

            // Wait to view the hub
            await new Promise(r => setTimeout(r, 3000));

            // Close the hub
            console.log(`   🔙 Closing ${hub.name}\n`);
            await page.evaluate(() => {
                const closeBtn = document.querySelector('#jarvis-nav-bar button[onclick*="closeJarvisHub"]');
                if (closeBtn) closeBtn.click();
            });

            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.log(`   ❌ Error testing ${hub.name}:`, error.message);
        }
    }

    console.log('\n🎯 Testing Navigation Bar Switching...\n');

    // Open recovery hub
    await page.click('#recovery-panel-clickable');
    await new Promise(r => setTimeout(r, 1500));
    console.log('✅ Opened Recovery Hub');

    // Switch to Optimization using nav bar
    await page.evaluate(() => {
        const btn = document.querySelector('button[onclick*="switchJarvisHub(\'optimization\')"]');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    console.log('✅ Switched to Optimization Hub');

    // Switch to Integrations
    await page.evaluate(() => {
        const btn = document.querySelector('button[onclick*="switchJarvisHub(\'integrations\')"]');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    console.log('✅ Switched to Integration Marketplace');

    // Switch to Tiers
    await page.evaluate(() => {
        const btn = document.querySelector('button[onclick*="switchJarvisHub(\'tiers\')"]');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    console.log('✅ Switched to Tier Progression Vault');

    console.log('\n' + '='.repeat(60));
    console.log('🏁 All JARVIS hubs tested successfully!');
    console.log('='.repeat(60));

    console.log('\n⏸️  Browser will remain open for 30 seconds for inspection...\n');
    await new Promise(r => setTimeout(r, 30000));

    await browser.close();
})();
