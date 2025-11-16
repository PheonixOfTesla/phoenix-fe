/**
 * PHOENIX ORB - COMPREHENSIVE EMOTIONAL RANGE TEST
 * Tests Phoenix's Universal NL with full spectrum of human emotions and intents
 *
 * "Bet your life that this works" - Testing everything you asked for
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'https://pal-backend-production.up.railway.app/api';

// Test user credentials (you'll need to replace these with real ones)
const TEST_EMAIL = 'test@phoenix.com';
const TEST_PASSWORD = 'testpassword123';

let authToken = null;

/**
 * COMPREHENSIVE TEST SUITE - FULL EMOTIONAL RANGE
 * Covers: excited, frustrated, confused, happy, sad, angry, hopeful, anxious,
 * desperate, grateful, determined, overwhelmed, curious, playful, serious
 */
const EMOTIONAL_TEST_COMMANDS = [
    // EXCITED & ENTHUSIASTIC
    {
        emotion: 'EXCITED',
        commands: [
            "I WANT A FAT ASS! Let's do this!",
            "Holy shit I feel amazing today! What should I crush?",
            "YOOO Phoenix what's my progress looking like?!",
            "Dude I'm SO PUMPED for today's workout!",
            "Let's fucking go! Show me my goals!",
        ]
    },

    // FRUSTRATED & ANGRY
    {
        emotion: 'FRUSTRATED',
        commands: [
            "Why am I not losing weight? This is bullshit.",
            "I'm so fucking tired of being broke. Show me my spending.",
            "Phoenix, I keep failing at waking up early. Help me.",
            "This isn't working. What am I doing wrong?",
            "I hate my body. I need a new workout plan.",
        ]
    },

    // CONFUSED & UNCERTAIN
    {
        emotion: 'CONFUSED',
        commands: [
            "Wait what planet is this? Where am I?",
            "I don't understand... how do I track my calories?",
            "Phoenix can you explain what Mercury does again?",
            "Is this my recovery score? I'm not sure what this means.",
            "Umm... how does the quantum workout thing work?",
        ]
    },

    // HAPPY & GRATEFUL
    {
        emotion: 'HAPPY',
        commands: [
            "Phoenix you're the best! Thanks for the reminder!",
            "Dude I just hit a PR!! Show me my progress!",
            "I feel so good today. What should I do?",
            "Thank you for helping me stay on track.",
            "I'm actually making progress! Can you believe it?",
        ]
    },

    // SAD & DEPRESSED
    {
        emotion: 'SAD',
        commands: [
            "I feel like shit today. I don't want to work out.",
            "Everything is falling apart. Show me something good.",
            "I'm so tired Phoenix. Should I just rest?",
            "I don't think I can do this anymore.",
            "Can you just... tell me it'll be okay?",
        ]
    },

    // ANXIOUS & OVERWHELMED
    {
        emotion: 'ANXIOUS',
        commands: [
            "I have SO much to do today I don't know where to start.",
            "Phoenix I'm freaking out. What's on my calendar?",
            "Am I overtraining? I feel weird.",
            "I'm scared I'm going to fail. What should I do?",
            "There's too much. Just tell me one thing to focus on.",
        ]
    },

    // DESPERATE & URGENT
    {
        emotion: 'DESPERATE',
        commands: [
            "PHOENIX I NEED HELP RIGHT NOW.",
            "Emergency! Do I have any money left this month?",
            "I'm about to give up. Give me a reason to keep going.",
            "Please just tell me what to eat I'm starving.",
            "I HAVE to lose 10 pounds by next month. Is it possible?",
        ]
    },

    // DETERMINED & MOTIVATED
    {
        emotion: 'DETERMINED',
        commands: [
            "I'm going to crush my goals this week. What do I need to do?",
            "Phoenix, I want to be the best version of myself. Plan my week.",
            "I'm ready to change everything. Show me the way.",
            "No more excuses. Give me my hardest workout.",
            "I will hit my goal. Tell me how to get there.",
        ]
    },

    // CURIOUS & EXPLORATORY
    {
        emotion: 'CURIOUS',
        commands: [
            "What patterns do you see in my behavior?",
            "Phoenix, what's the coolest thing you know about me?",
            "Can you predict what I'll do tomorrow?",
            "What planet should I explore today?",
            "Tell me something I don't know about myself.",
        ]
    },

    // PLAYFUL & CASUAL
    {
        emotion: 'PLAYFUL',
        commands: [
            "Yo Phoenix wanna grab a smoothie? lol order me one",
            "Phoenix you there? Just checking in buddy",
            "Surprise me! Do something cool!",
            "If you were human what would you look like?",
            "Can you roast me based on my data? 😂",
        ]
    },

    // SERIOUS & BUSINESS
    {
        emotion: 'SERIOUS',
        commands: [
            "Phoenix, I need a comprehensive analysis of my finances.",
            "Open Jupiter and show me my Q4 spending breakdown.",
            "What is my recovery score and what does it indicate?",
            "Schedule my workout for optimal energy levels this week.",
            "Provide my legacy planning progress report.",
        ]
    },

    // SPECIFIC PLANET NAVIGATION
    {
        emotion: 'NAVIGATIONAL',
        commands: [
            "Open Mercury",
            "Take me to Venus",
            "Show me Earth",
            "Go to Mars",
            "Open Jupiter finance",
            "Pull up Saturn",
            "Show me my dashboard",
        ]
    },

    // COMPLEX MULTI-PLANET QUERIES
    {
        emotion: 'COMPLEX',
        commands: [
            "Based on my sleep and recovery, should I workout today?",
            "How much money do I have left after my gym membership?",
            "When is my best time to schedule a meeting based on my energy?",
            "Can I afford a personal trainer based on my budget?",
            "What goal should I focus on this week based on my progress?",
            "Am I getting enough calories for my fitness goals?",
        ]
    },

    // CONTEXTUAL AWARENESS TEST
    {
        emotion: 'CONTEXTUAL',
        commands: [
            "What did I just ask you?",
            "Remember when I said I wanted a fat ass? Show me that workout.",
            "Continue from where we left off.",
            "You mentioned something about my spending. Explain more.",
            "Based on what you know about me, what do you recommend?",
        ]
    },

    // ACTION REQUESTS
    {
        emotion: 'ACTIONS',
        commands: [
            "Order me a protein smoothie from Smoothie King",
            "Call my dentist and schedule a cleaning",
            "Text my trainer that I need to reschedule",
            "Remind me to take my supplements at 8am",
            "Send me a motivational quote every morning",
        ]
    },

    // EDGE CASES & NONSENSE
    {
        emotion: 'EDGE_CASES',
        commands: [
            "asdfghjkl",
            "Phoenix... hello?",
            "...",
            "Can you see the future?",
            "What's the meaning of life?",
            "Do you love me Phoenix?",
            "I like turtles",
        ]
    }
];

/**
 * Login and get auth token
 */
async function login() {
    console.log('\n🔐 LOGGING IN...');
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (response.data.token) {
            authToken = response.data.token;
            console.log('✅ Login successful!');
            return true;
        } else {
            console.log('❌ No token received. Using demo mode.');
            return false;
        }
    } catch (error) {
        console.log(`⚠️  Login failed: ${error.message}`);
        console.log('📝 Note: Replace TEST_EMAIL and TEST_PASSWORD in script with real credentials');
        console.log('⚡ Continuing in DEMO mode (will show request format without auth)\n');
        return false;
    }
}

/**
 * Test Phoenix Universal NL endpoint
 */
async function testPhoenixCommand(command, emotion) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const payload = {
        message: command,
        conversationHistory: [],
        context: {
            currentPlanet: 'mercury',
            url: 'http://localhost:3000/mercury.html',
            inputType: 'text'
        }
    };

    try {
        const response = await axios.post(
            `${API_BASE_URL}/phoenix/universal`,
            payload,
            { headers, timeout: 10000 }
        );

        console.log(`\n✅ [${emotion}] "${command}"`);
        console.log(`   🎯 Intent: ${response.data.intent?.planet || 'N/A'} | ${response.data.intent?.action || 'N/A'}`);
        console.log(`   💬 Response: ${response.data.response?.substring(0, 100)}...`);
        console.log(`   📊 Confidence: ${Math.round((response.data.intent?.confidence || 0) * 100)}%`);

        return { success: true, data: response.data };
    } catch (error) {
        console.log(`\n❌ [${emotion}] "${command}"`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);

        if (!authToken) {
            console.log(`   📝 Request would be: POST ${API_BASE_URL}/phoenix/universal`);
            console.log(`   📦 Payload: ${JSON.stringify(payload, null, 2).substring(0, 150)}...`);
        }

        return { success: false, error: error.message };
    }
}

/**
 * Run all emotional range tests
 */
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔥 PHOENIX ORB - COMPREHENSIVE EMOTIONAL RANGE TEST');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 Testing Universal NL with FULL spectrum of human emotions');
    console.log('🎯 Backend: ' + API_BASE_URL);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Login first
    const isAuthenticated = await login();

    if (!isAuthenticated) {
        console.log('\n⚠️  DEMO MODE: Requests will show format but may fail without auth\n');
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    const results = {
        total: 0,
        successful: 0,
        failed: 0,
        byEmotion: {}
    };

    // Test each emotional category
    for (const category of EMOTIONAL_TEST_COMMANDS) {
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`🎭 EMOTION: ${category.emotion}`);
        console.log('═'.repeat(70));

        results.byEmotion[category.emotion] = {
            total: category.commands.length,
            successful: 0,
            failed: 0
        };

        for (const command of category.commands) {
            results.total++;

            const result = await testPhoenixCommand(command, category.emotion);

            if (result.success) {
                results.successful++;
                results.byEmotion[category.emotion].successful++;
            } else {
                results.failed++;
                results.byEmotion[category.emotion].failed++;
            }

            // Rate limit: 500ms between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Print summary
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Successful: ${results.successful}/${results.total}`);
    console.log(`❌ Failed: ${results.failed}/${results.total}`);
    console.log(`📈 Success Rate: ${Math.round((results.successful / results.total) * 100)}%`);
    console.log('\n📋 By Emotion:');

    Object.entries(results.byEmotion).forEach(([emotion, stats]) => {
        const rate = Math.round((stats.successful / stats.total) * 100);
        const icon = rate === 100 ? '🟢' : rate >= 50 ? '🟡' : '🔴';
        console.log(`   ${icon} ${emotion}: ${stats.successful}/${stats.total} (${rate}%)`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');

    if (results.successful === results.total) {
        console.log('🎉 PERFECT SCORE! PHOENIX IS READY TO CHANGE LIVES!');
        console.log('💪 Betting your life on this? HELL YES.');
    } else if (results.successful > 0) {
        console.log('⚡ PHOENIX IS OPERATIONAL! Some adjustments may be needed.');
        console.log(`📝 ${results.failed} commands need attention.`);
    } else {
        console.log('⚠️  PHOENIX NEEDS AUTHENTICATION!');
        console.log('📝 Update TEST_EMAIL and TEST_PASSWORD with real credentials.');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save detailed results to file
    const reportPath = '/Users/moderndavinci/Desktop/phoenix-fe/phoenix-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`💾 Detailed report saved to: ${reportPath}\n`);
}

// Run the tests
runAllTests().catch(error => {
    console.error('💥 CRITICAL ERROR:', error);
    process.exit(1);
});
