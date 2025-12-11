/**
 * JARVIS CONVERSATION OPTIMIZATION TEST
 * Opens dashboard and tests JARVIS conversation performance
 */

const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testJARVIS() {
    console.log('🤖 JARVIS CONVERSATION OPTIMIZATION TEST\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--disable-web-security'],
        devtools: true  // Open DevTools to see console
    });

    const page = await browser.newPage();

    // Capture all console messages from the page
    const consoleMessages = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);

        // Highlight JARVIS-related messages
        if (text.includes('JARVIS')) {
            console.log('🤖', text);
        } else if (text.includes('⚡')) {
            console.log('⚡', text);
        } else if (text.includes('✅')) {
            console.log('✅', text);
        } else if (text.includes('❌') || text.includes('error')) {
            console.log('❌', text);
        }
    });

    page.on('pageerror', error => console.log('❌ PAGE ERROR:', error.message));

    try {
        console.log('=' .repeat(70));
        console.log('STEP 1: LOGIN AND LOAD DASHBOARD');
        console.log('=' .repeat(70));

        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        await wait(2000);

        // Login
        await page.type('#login-phone', '8087510813');
        await page.type('#login-password', '123456');
        console.log('✅ Credentials entered');

        await wait(1000);
        await page.click('#login-btn');
        console.log('✅ Login button clicked');
        console.log('⏳ Waiting for dashboard...\n');

        await wait(5000);

        const currentUrl = page.url();
        if (!currentUrl.includes('dashboard')) {
            throw new Error('Login redirect failed');
        }

        console.log('✅ Dashboard loaded!\n');

        console.log('=' .repeat(70));
        console.log('STEP 2: MONITOR JARVIS INITIALIZATION');
        console.log('=' .repeat(70));

        // Wait for JARVIS to initialize
        await wait(3000);

        // Extract JARVIS load time from console
        const jarvisLoadMsg = consoleMessages.find(msg => msg.includes('JARVIS initialized in'));
        if (jarvisLoadMsg) {
            console.log('\n📊 ' + jarvisLoadMsg + '\n');
        }

        console.log('=' .repeat(70));
        console.log('STEP 3: FIND AND OPEN JARVIS CHAT');
        console.log('=' .repeat(70));

        // Look for JARVIS chat interface
        const jarvisFound = await page.evaluate(() => {
            // Try to find JARVIS chat button/interface
            const selectors = [
                '#jarvis-chat',
                '#butler-btn',
                '[data-action="butler"]',
                'button:has-text("BUTLER")',
                'button:has-text("ASK PHOENIX")',
                '.dock-item[data-action="butler"]'
            ];

            for (const selector of selectors) {
                try {
                    const elem = document.querySelector(selector);
                    if (elem) {
                        console.log('Found JARVIS interface:', selector);
                        return { found: true, selector };
                    }
                } catch (e) {}
            }

            // Search all buttons
            const buttons = Array.from(document.querySelectorAll('button'));
            const jarvisBtn = buttons.find(b =>
                b.textContent.toUpperCase().includes('BUTLER') ||
                b.textContent.toUpperCase().includes('JARVIS') ||
                b.textContent.toUpperCase().includes('ASK')
            );

            if (jarvisBtn) {
                console.log('Found JARVIS button:', jarvisBtn.textContent);
                return { found: true, text: jarvisBtn.textContent };
            }

            return { found: false };
        });

        if (jarvisFound.found) {
            console.log(`✅ JARVIS interface found: ${jarvisFound.selector || jarvisFound.text}\n`);

            // Try to open JARVIS
            const opened = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const jarvisBtn = buttons.find(b =>
                    b.textContent.toUpperCase().includes('BUTLER') ||
                    b.textContent.toUpperCase().includes('JARVIS') ||
                    b.textContent.toUpperCase().includes('ASK')
                );

                if (jarvisBtn && jarvisBtn.offsetParent !== null) {
                    jarvisBtn.click();
                    return true;
                }
                return false;
            });

            if (opened) {
                console.log('✅ JARVIS interface opened!');
                await wait(2000);

                console.log('\n' + '=' .repeat(70));
                console.log('STEP 4: TEST JARVIS CONVERSATION');
                console.log('=' .repeat(70));

                // Check for chat input
                const hasChatInput = await page.evaluate(() => {
                    const chatInput = document.querySelector('#jarvis-input, #chat-input, input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
                    if (chatInput) {
                        console.log('Found chat input');
                        return true;
                    }
                    return false;
                });

                if (hasChatInput) {
                    console.log('✅ Chat input found!');
                    console.log('\n🎙️  Simulating conversation...\n');

                    // Type a test message
                    const testMessage = "What can you help me with?";

                    const typed = await page.evaluate((msg) => {
                        const chatInput = document.querySelector('#jarvis-input, #chat-input, input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
                        if (chatInput) {
                            chatInput.value = msg;
                            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                            console.log('Typed message:', msg);
                            return true;
                        }
                        return false;
                    }, testMessage);

                    if (typed) {
                        console.log(`   User: "${testMessage}"`);
                        await wait(1000);

                        // Try to send the message
                        const sent = await page.evaluate(() => {
                            // Look for send button
                            const sendBtn = document.querySelector('#send-btn, button[type="submit"], .send-button, button:has-text("Send")');
                            if (sendBtn) {
                                sendBtn.click();
                                console.log('Message sent!');
                                return true;
                            }

                            // Try pressing Enter
                            const chatInput = document.querySelector('#jarvis-input, #chat-input, input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
                            if (chatInput) {
                                chatInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
                                return true;
                            }

                            return false;
                        });

                        if (sent) {
                            console.log('   ✅ Message sent to JARVIS');
                            console.log('   ⏳ Waiting for response...\n');

                            // Monitor for response
                            await wait(5000);

                            // Check for JARVIS response
                            const response = await page.evaluate(() => {
                                const messages = Array.from(document.querySelectorAll('.message, .chat-message, .jarvis-response'));
                                const lastMsg = messages[messages.length - 1];
                                if (lastMsg) {
                                    return lastMsg.textContent.substring(0, 100);
                                }
                                return null;
                            });

                            if (response) {
                                console.log(`   🤖 JARVIS: "${response}..."`);
                            } else {
                                console.log('   ⚠️  No response detected yet');
                            }
                        }
                    }
                } else {
                    console.log('⚠️  Chat input not found');
                    console.log('   Available inputs:', await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('input, textarea')).map(i => ({
                            type: i.type,
                            placeholder: i.placeholder,
                            id: i.id
                        }));
                    }));
                }
            }
        } else {
            console.log('⚠️  JARVIS interface not found');
            console.log('   Looking for alternative access points...\n');

            // Try to access via planetary navigation
            console.log('   Trying PHOENIX planet (contains JARVIS features)...');
            const phoenixClicked = await page.evaluate(() => {
                const nodes = Array.from(document.querySelectorAll('.planet-node'));
                const phoenixNode = nodes.find(node => node.textContent.includes('PHOENIX'));
                if (phoenixNode) {
                    phoenixNode.click();
                    return true;
                }
                return false;
            });

            if (phoenixClicked) {
                console.log('   ✅ PHOENIX planet clicked');
                await wait(2000);
            }
        }

        console.log('\n' + '=' .repeat(70));
        console.log('PERFORMANCE ANALYSIS');
        console.log('=' .repeat(70));

        // Analyze console messages for performance insights
        const perfMessages = consoleMessages.filter(msg =>
            msg.includes('ms') || msg.includes('initialized') || msg.includes('loaded')
        );

        console.log('\n📊 Performance Metrics:');
        perfMessages.forEach(msg => {
            console.log(`   ${msg}`);
        });

        console.log('\n🤖 Browser window staying open for manual testing...');
        console.log('Check DevTools console for detailed JARVIS logs');
        console.log('Press Ctrl+C to close\n');

        await wait(300000); // 5 minutes

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error(error.stack);
    }
}

testJARVIS().catch(console.error);
