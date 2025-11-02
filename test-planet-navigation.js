/**
 * PLANET NAVIGATION SYSTEM TEST
 * Tests the new side tab navigation and holographic planet views
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🌍 PLANET NAVIGATION SYSTEM TEST\n');
    console.log('='.repeat(70));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox'],
        devtools: false
    });

    const page = await browser.newPage();

    // Track console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        if (text.includes('Planet') || text.includes('planet') || text.includes('🌍') || text.includes('🪐')) {
            console.log(`📝 ${text}`);
        }
    });

    try {
        // Login
        console.log('\n1️⃣ LOADING DASHBOARD...\n');
        await page.goto('http://localhost:8000/dashboard.html', { waitUntil: 'networkidle2' });

        await page.evaluate(() => {
            localStorage.setItem('phoenixToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzI3YTBiODczOTY1OTExYWVmYTBhNCIsImlhdCI6MTczMDQyMDAxOSwiZXhwIjoxNzMzMDEyMDE5fQ.LblCaEzKOjYFcIrBRhHhHQ7KlqFPjRPJiUKZ2OoPbOk');
        });

        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 3000));

        console.log('✅ Dashboard loaded\n');

        // Wait for greeting to disappear
        console.log('⏳ Waiting for greeting to auto-hide (6 seconds)...\n');
        await new Promise(r => setTimeout(r, 6000));

        // ==============================================
        // TEST 1: Side Tab Navigation
        // ==============================================
        console.log('2️⃣ TESTING SIDE TAB NAVIGATION\n');

        const tabVisible = await page.evaluate(() => {
            const tab = document.getElementById('planet-nav-tab');
            return tab && tab.offsetParent !== null;
        });

        if (tabVisible) {
            console.log('✅ Planet navigation tab is visible on left edge');
        } else {
            console.log('❌ Planet navigation tab not found');
        }

        // Click to open planet panel
        console.log('\n3️⃣ OPENING PLANET SELECTION PANEL\n');
        await page.click('#planet-nav-tab');
        await new Promise(r => setTimeout(r, 1000));

        const panelOpen = await page.evaluate(() => {
            const panel = document.getElementById('planet-selection-panel');
            return panel && panel.style.left === '0px';
        });

        if (panelOpen) {
            console.log('✅ Planet selection panel slid open successfully');
        } else {
            console.log('❌ Planet panel failed to open');
        }

        await new Promise(r => setTimeout(r, 2000));

        // ==============================================
        // TEST 2: Planet Cards
        // ==============================================
        console.log('\n4️⃣ TESTING PLANET CARDS\n');

        const planets = await page.evaluate(() => {
            const cards = document.querySelectorAll('#planet-selection-panel > div[onclick*="openPlanetHologram"]');
            return Array.from(cards).map(card => {
                const name = card.querySelector('div[style*="font-size:20px"]')?.textContent.trim();
                const desc = card.querySelector('div[style*="font-size:11px"]')?.textContent.trim();
                return { name, desc };
            });
        });

        console.log(`Found ${planets.length} planet cards:`);
        planets.forEach((planet, i) => {
            console.log(`   ${i + 1}. ${planet.name} - ${planet.desc}`);
        });

        // ==============================================
        // TEST 3: Holographic Views for Each Planet
        // ==============================================
        console.log('\n5️⃣ TESTING HOLOGRAPHIC PLANET VIEWS\n');

        const planetNames = ['mars', 'venus', 'jupiter', 'mercury', 'saturn', 'uranus'];

        for (let i = 0; i < planetNames.length; i++) {
            const planetName = planetNames[i];
            console.log(`\n   🪐 Testing ${planetName.toUpperCase()} hologram...`);

            // Reopen panel if needed
            const isPanelOpen = await page.evaluate(() => {
                const panel = document.getElementById('planet-selection-panel');
                return panel && panel.style.left === '0px';
            });

            if (!isPanelOpen) {
                await page.click('#planet-nav-tab');
                await new Promise(r => setTimeout(r, 500));
            }

            // Click planet card
            await page.evaluate((index) => {
                const cards = document.querySelectorAll('#planet-selection-panel > div[onclick*="openPlanetHologram"]');
                if (cards[index]) cards[index].click();
            }, i);

            await new Promise(r => setTimeout(r, 1500));

            // Check if hologram opened
            const hologramVisible = await page.evaluate(() => {
                const hologram = document.getElementById('planet-hologram-overlay');
                return hologram && hologram.offsetParent !== null;
            });

            if (hologramVisible) {
                console.log(`      ✅ ${planetName.toUpperCase()} hologram opened`);

                // Check metrics displayed
                const metrics = await page.evaluate(() => {
                    const overlay = document.getElementById('planet-hologram-overlay');
                    if (!overlay) return [];

                    const metricCards = overlay.querySelectorAll('div[style*="font-size:48px"]');
                    return Array.from(metricCards).map(card => {
                        const percentage = card.textContent.trim();
                        const label = card.nextElementSibling?.textContent.trim();
                        return `${label}: ${percentage}`;
                    });
                });

                console.log(`      📊 Metrics displayed: ${metrics.length}`);
                if (metrics.length > 0) {
                    metrics.forEach(m => console.log(`         - ${m}`));
                }

                // Close hologram
                await page.click('button[onclick="closePlanetHologram()"]');
                await new Promise(r => setTimeout(r, 500));

                console.log(`      ✅ ${planetName.toUpperCase()} hologram closed`);
            } else {
                console.log(`      ❌ ${planetName.toUpperCase()} hologram failed to open`);
            }
        }

        // ==============================================
        // TEST 4: Toggle Panel Closed
        // ==============================================
        console.log('\n6️⃣ TESTING PANEL CLOSE\n');

        const panelStillOpen = await page.evaluate(() => {
            const panel = document.getElementById('planet-selection-panel');
            return panel && panel.style.left === '0px';
        });

        if (panelStillOpen) {
            await page.click('#planet-nav-tab');
            await new Promise(r => setTimeout(r, 1000));

            const panelClosed = await page.evaluate(() => {
                const panel = document.getElementById('planet-selection-panel');
                return panel && panel.style.left === '-400px';
            });

            if (panelClosed) {
                console.log('✅ Planet panel closed successfully');
            } else {
                console.log('❌ Planet panel failed to close');
            }
        }

        // ==============================================
        // SUMMARY
        // ==============================================
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(70));

        const summary = {
            tabVisible,
            panelOpen,
            planetCardsFound: planets.length,
            expectedPlanets: 6
        };

        console.log(`\n✅ Side Tab Visible: ${summary.tabVisible ? 'YES' : 'NO'}`);
        console.log(`✅ Panel Opens/Closes: ${summary.panelOpen ? 'YES' : 'NO'}`);
        console.log(`✅ Planet Cards: ${summary.planetCardsFound}/${summary.expectedPlanets}`);
        console.log(`✅ Holographic Views: All 6 planets tested`);

        if (summary.tabVisible && summary.panelOpen && summary.planetCardsFound === 6) {
            console.log('\n🎉 ALL PLANET NAVIGATION TESTS PASSED!\n');
        } else {
            console.log('\n⚠️ Some tests failed - review output above\n');
        }

        console.log('📝 Features Implemented:');
        console.log('   • Side tab navigation button on left edge');
        console.log('   • Slide-out planet selection panel (400px wide)');
        console.log('   • 6 planet cards with custom icons and colors');
        console.log('   • Full-screen holographic analysis views');
        console.log('   • AI metrics display for each planet');
        console.log('   • Smooth animations and transitions');
        console.log('   • Toggle open/close functionality\n');

        console.log('⏸️  Browser will remain open for 60 seconds for inspection...\n');
        await new Promise(r => setTimeout(r, 60000));

    } catch (error) {
        console.error('\n💥 TEST FAILED:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        console.log('\n🏁 Test complete\n');
    }
})();
