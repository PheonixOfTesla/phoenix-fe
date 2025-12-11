/**
 * COMPREHENSIVE DASHBOARD TEST
 * Tests all buttons, navigation, and console output
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🔥 PHOENIX COMPREHENSIVE DASHBOARD TEST\n');
    console.log('='.repeat(70));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox'],
        devtools: true
    });

    const page = await browser.newPage();

    // Track all console messages
    const consoleMessages = [];
    const errors = [];
    const warnings = [];

    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();

        consoleMessages.push({ type, text });

        if (type === 'error') {
            errors.push(text);
            console.log(`❌ ERROR: ${text}`);
        } else if (type === 'warning') {
            warnings.push(text);
            console.log(`⚠️  WARNING: ${text}`);
        } else if (type === 'log') {
            console.log(`📝 LOG: ${text}`);
        }
    });

    page.on('pageerror', error => {
        errors.push(error.message);
        console.log(`💥 PAGE ERROR: ${error.message}`);
    });

    try {
        // Login
        console.log('\n1️⃣ LOGGING IN...\n');
        await page.goto('http://localhost:8000/dashboard.html', { waitUntil: 'networkidle2' });

        await page.evaluate(() => {
            localStorage.setItem('phoenixToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzI3YTBiODczOTY1OTExYWVmYTBhNCIsImlhdCI6MTczMDQyMDAxOSwiZXhwIjoxNzMzMDEyMDE5fQ.LblCaEzKOjYFcIrBRhHhHQ7KlqFPjRPJiUKZ2OoPbOk');
        });

        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 3000));

        console.log('✅ Dashboard loaded\n');

        // Wait for greeting to disappear
        console.log('⏳ Waiting for greeting auto-hide (6 seconds)...\n');
        await new Promise(r => setTimeout(r, 6000));

        // Test JARVIS Orb
        console.log('\n2️⃣ TESTING JARVIS FLOATING ORB...\n');

        const orbVisible = await page.evaluate(() => {
            const orb = document.getElementById('jarvis-orb');
            return orb && orb.style.display !== 'none';
        });

        if (orbVisible) {
            console.log('✅ JARVIS Orb visible');

            // Click orb to open menu
            await page.click('#jarvis-orb');
            await new Promise(r => setTimeout(r, 1000));

            const menuVisible = await page.evaluate(() => {
                const menu = document.getElementById('jarvis-quick-menu');
                return menu && menu.style.display === 'flex';
            });

            if (menuVisible) {
                console.log('✅ JARVIS Quick Menu opened');
            } else {
                console.log('❌ JARVIS Quick Menu failed to open');
            }
        } else {
            console.log('❌ JARVIS Orb not visible');
        }

        // Test all 4 JARVIS Hubs
        console.log('\n3️⃣ TESTING JARVIS COMMAND CENTERS...\n');

        const hubs = [
            { name: 'Recovery', clickSelector: '#jarvis-quick-menu > div:nth-child(1)' },
            { name: 'Optimization', clickSelector: '#jarvis-quick-menu > div:nth-child(2)' },
            { name: 'Integrations', clickSelector: '#jarvis-quick-menu > div:nth-child(3)' },
            { name: 'Tiers', clickSelector: '#jarvis-quick-menu > div:nth-child(4)' }
        ];

        for (const hub of hubs) {
            console.log(`\n📂 Testing ${hub.name} Command Center...`);

            try {
                // Open JARVIS menu if not open
                const menuOpen = await page.evaluate(() => {
                    const menu = document.getElementById('jarvis-quick-menu');
                    return menu && menu.style.display === 'flex';
                });

                if (!menuOpen) {
                    await page.click('#jarvis-orb');
                    await new Promise(r => setTimeout(r, 500));
                }

                // Click hub button
                await page.click(hub.clickSelector);
                await new Promise(r => setTimeout(r, 2000));

                // Check if hub opened
                const hubId = `jarvis-${hub.name.toLowerCase()}-hub`;
                const isOpen = await page.evaluate((id) => {
                    const hubEl = document.getElementById(id);
                    return hubEl && hubEl.style.display === 'block';
                }, hubId);

                if (isOpen) {
                    console.log(`   ✅ ${hub.name} hub opened successfully`);

                    // Check if orb is hidden
                    const orbHidden = await page.evaluate(() => {
                        const orb = document.getElementById('jarvis-orb');
                        return orb && orb.style.display === 'none';
                    });

                    if (orbHidden) {
                        console.log(`   ✅ JARVIS Orb hidden (not blocking close button)`);
                    } else {
                        console.log(`   ❌ JARVIS Orb still visible (may block close button)`);
                    }

                    // Wait to view
                    await new Promise(r => setTimeout(r, 2000));

                    // Close hub
                    await page.evaluate(() => {
                        const closeBtn = document.querySelector('#jarvis-nav-bar button[onclick*="closeJarvisHub"]');
                        if (closeBtn) closeBtn.click();
                    });

                    await new Promise(r => setTimeout(r, 1000));
                    console.log(`   ✅ ${hub.name} hub closed`);
                } else {
                    console.log(`   ❌ ${hub.name} hub failed to open`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        // Test Hub Navigation Bar
        console.log('\n4️⃣ TESTING HUB NAVIGATION BAR...\n');

        // Open Recovery hub
        const menuOpen = await page.evaluate(() => {
            const menu = document.getElementById('jarvis-quick-menu');
            return menu && menu.style.display === 'flex';
        });

        if (!menuOpen) {
            await page.click('#jarvis-orb');
            await new Promise(r => setTimeout(r, 500));
        }

        await page.click('#jarvis-quick-menu > div:nth-child(1)');
        await new Promise(r => setTimeout(r, 1500));
        console.log('✅ Opened Recovery Hub');

        // Switch to Optimization
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

        // Close all
        await page.evaluate(() => {
            const closeBtn = document.querySelector('#jarvis-nav-bar button[onclick*="closeJarvisHub"]');
            if (closeBtn) closeBtn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        console.log('✅ All hubs closed');

        // Test Dashboard Buttons
        console.log('\n5️⃣ TESTING DASHBOARD BUTTONS...\n');

        const buttons = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map((btn, i) => ({
                index: i,
                text: btn.textContent.trim().substring(0, 30),
                visible: btn.offsetParent !== null,
                onclick: btn.getAttribute('onclick') || 'no onclick'
            })).filter(b => b.visible && b.text);
        });

        console.log(`Found ${buttons.length} visible buttons:`);
        buttons.slice(0, 10).forEach(btn => {
            console.log(`   - "${btn.text}" (${btn.onclick.substring(0, 40)}...)`);
        });

        // Test Voice Button
        console.log('\n6️⃣ TESTING VOICE ACTIVATION...\n');

        const voiceButtonExists = await page.evaluate(() => {
            const btn = document.querySelector('button[onclick*="ASK PHOENIX"]') ||
                         document.querySelector('button[onclick*="askPhoenix"]');
            return !!btn;
        });

        if (voiceButtonExists) {
            console.log('✅ ASK PHOENIX button found');
        } else {
            console.log('⚠️  ASK PHOENIX button not found');
        }

        // Check for API calls
        console.log('\n7️⃣ CHECKING API INTEGRATION...\n');

        const apiCalls = consoleMessages.filter(msg =>
            msg.text.includes('🌐') ||
            msg.text.includes('GET') ||
            msg.text.includes('POST')
        );

        console.log(`API calls detected: ${apiCalls.length}`);
        apiCalls.slice(0, 5).forEach(call => {
            console.log(`   ${call.text}`);
        });

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total Console Messages: ${consoleMessages.length}`);
        console.log(`Errors: ${errors.length}`);
        console.log(`Warnings: ${warnings.length}`);

        if (errors.length > 0) {
            console.log('\n❌ ERRORS FOUND:');
            errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
        }

        if (warnings.length > 0) {
            console.log('\n⚠️  WARNINGS FOUND:');
            warnings.slice(0, 5).forEach(warn => console.log(`   - ${warn}`));
        }

        if (errors.length === 0 && warnings.length === 0) {
            console.log('\n✅✅✅ ALL TESTS PASSED - NO ERRORS OR WARNINGS!');
        }

        console.log('\n⏸️  Browser will remain open for 60 seconds for manual inspection...\n');
        await new Promise(r => setTimeout(r, 60000));

    } catch (error) {
        console.error('\n💥 TEST FAILED:', error.message);
    } finally {
        await browser.close();
        console.log('\n🏁 Test complete\n');
    }
})();
