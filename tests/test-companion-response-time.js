/* ============================================
   PHOENIX COMPANION RESPONSE TIME TEST
   Tests real companion questions with timing
   ============================================ */

const testQuestions = [
    // Health/Lifestyle Advice
    "Should I drink alcohol",
    "I want food what should I get",
    "Im tired but I want to watch netflix any recommendations",

    // Optimization Queries
    "How am I doing today",
    "What should I focus on",
    "Am I on track with my goals",

    // Logging/Tracking
    "I ran 3 miles",
    "Just ate a burger",
    "Feeling stressed",

    // Data Queries
    "Show my health",
    "Whats my recovery score",
    "How much did I spend this week",

    // Complex Companion Questions
    "Should I workout or rest today",
    "When should I schedule my meetings",
    "What time should I go to bed",
    "Is my spending too high"
];

class ResponseTimeTest {
    constructor() {
        this.results = [];
        this.apiBaseUrl = window.PhoenixConfig?.API_BASE_URL || 'https://pal-backend-production.up.railway.app';
        this.token = localStorage.getItem('phoenixToken');
    }

    async runAllTests() {
        console.log('🧪 Starting Phoenix Companion Response Time Tests\n');
        console.log('='.repeat(80));
        console.log('Testing natural companion questions...\n');

        for (let i = 0; i < testQuestions.length; i++) {
            const question = testQuestions[i];
            await this.testQuestion(question, i + 1);

            // Small delay between tests to avoid rate limiting
            await this.delay(1000);
        }

        this.printResults();
    }

    async testQuestion(question, index) {
        console.log(`\n[${index}/${testQuestions.length}] Testing: "${question}"`);
        console.log('-'.repeat(80));

        const startTime = performance.now();
        let aiResponseTime = 0;
        let totalTime = 0;
        let source = 'unknown';
        let success = false;
        let error = null;

        try {
            // Simulate silence detection (300ms)
            const silenceTime = 300;
            await this.delay(silenceTime);
            console.log(`✓ Silence detection: ${silenceTime}ms`);

            // Call AI endpoint
            const aiStart = performance.now();

            const response = await fetch(`${this.apiBaseUrl}/phoenix/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: question,
                    includeContext: true,
                    context: {
                        page: window.location.pathname,
                        timestamp: new Date().toISOString(),
                        mode: 'voice'
                    }
                })
            });

            aiResponseTime = performance.now() - aiStart;

            if (response.ok) {
                const data = await response.json();
                const aiData = data.data || data;

                source = aiData.source || 'unknown';
                success = true;

                console.log(`✓ AI Processing (${source}): ${Math.round(aiResponseTime)}ms`);
                console.log(`✓ Response: "${(aiData.message || aiData.response || '').substring(0, 100)}..."`);

                // Check for UI actions
                if (aiData.uiActions) {
                    console.log(`✓ UI Actions provided:`, Object.keys(aiData.uiActions));
                }

                // Check for follow-up
                if (aiData.followUp) {
                    console.log(`✓ Follow-up question: "${aiData.followUp}"`);
                }

            } else {
                error = `HTTP ${response.status}`;
                console.error(`✗ AI Error: ${error}`);
            }

        } catch (e) {
            error = e.message;
            console.error(`✗ Network Error: ${error}`);
        }

        totalTime = performance.now() - startTime;

        // Estimate TTS time (parallel, doesn't add to perceived latency)
        const estimatedTTS = 500;

        const result = {
            question,
            success,
            silenceTime: 300,
            aiResponseTime: Math.round(aiResponseTime),
            totalTime: Math.round(totalTime),
            perceivedTime: Math.round(totalTime + estimatedTTS), // Include TTS
            source,
            error
        };

        this.results.push(result);

        console.log(`\n⏱️  Total Response Time: ${Math.round(totalTime)}ms`);
        console.log(`👂 Perceived Time (with TTS): ~${Math.round(totalTime + estimatedTTS)}ms`);

        // Color code based on speed
        if (totalTime < 1000) {
            console.log('🟢 INSTANT (sub-second)');
        } else if (totalTime < 2000) {
            console.log('🟡 FAST (1-2s)');
        } else if (totalTime < 3000) {
            console.log('🟠 OK (2-3s)');
        } else {
            console.log('🔴 SLOW (>3s)');
        }
    }

    printResults() {
        console.log('\n\n');
        console.log('='.repeat(80));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(80));

        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        console.log(`\n✅ Successful: ${successful.length}/${this.results.length}`);
        console.log(`❌ Failed: ${failed.length}/${this.results.length}`);

        if (successful.length > 0) {
            // Calculate statistics
            const totalTimes = successful.map(r => r.totalTime);
            const aiTimes = successful.map(r => r.aiResponseTime);

            const avgTotal = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
            const avgAI = aiTimes.reduce((a, b) => a + b, 0) / aiTimes.length;
            const minTotal = Math.min(...totalTimes);
            const maxTotal = Math.max(...totalTimes);

            console.log('\n⏱️  TIMING BREAKDOWN:');
            console.log(`   Silence Detection: 300ms (constant)`);
            console.log(`   AI Processing: ${Math.round(avgAI)}ms average`);
            console.log(`   Total Response: ${Math.round(avgTotal)}ms average`);
            console.log(`   Range: ${minTotal}ms - ${maxTotal}ms`);

            // Source breakdown
            const cacheHits = successful.filter(r => r.source === 'cache').length;
            const geminiLive = successful.filter(r => r.source === 'gemini_live').length;
            const claudeDeep = successful.filter(r => r.source === 'claude_deep').length;

            console.log('\n🎯 AI SOURCE BREAKDOWN:');
            console.log(`   Cache Hits: ${cacheHits} (${Math.round(cacheHits/successful.length*100)}%)`);
            console.log(`   Gemini Live: ${geminiLive} (${Math.round(geminiLive/successful.length*100)}%)`);
            console.log(`   Claude Deep: ${claudeDeep} (${Math.round(claudeDeep/successful.length*100)}%)`);

            // Speed categorization
            const instant = successful.filter(r => r.totalTime < 1000).length;
            const fast = successful.filter(r => r.totalTime >= 1000 && r.totalTime < 2000).length;
            const ok = successful.filter(r => r.totalTime >= 2000 && r.totalTime < 3000).length;
            const slow = successful.filter(r => r.totalTime >= 3000).length;

            console.log('\n🚀 SPEED DISTRIBUTION:');
            console.log(`   🟢 Instant (<1s): ${instant} (${Math.round(instant/successful.length*100)}%)`);
            console.log(`   🟡 Fast (1-2s): ${fast} (${Math.round(fast/successful.length*100)}%)`);
            console.log(`   🟠 OK (2-3s): ${ok} (${Math.round(ok/successful.length*100)}%)`);
            console.log(`   🔴 Slow (>3s): ${slow} (${Math.round(slow/successful.length*100)}%)`);

            // Detailed results table
            console.log('\n📋 DETAILED RESULTS:');
            console.log('-'.repeat(80));
            console.log('Question'.padEnd(50) + 'Time'.padEnd(10) + 'Source'.padEnd(15) + 'Status');
            console.log('-'.repeat(80));

            this.results.forEach(r => {
                const questionShort = r.question.substring(0, 47) + (r.question.length > 47 ? '...' : '');
                const time = r.success ? `${r.totalTime}ms` : 'FAILED';
                const source = r.source || 'N/A';
                const status = r.success ? '✓' : '✗';

                console.log(
                    questionShort.padEnd(50) +
                    time.padEnd(10) +
                    source.padEnd(15) +
                    status
                );
            });
        }

        if (failed.length > 0) {
            console.log('\n❌ FAILED QUERIES:');
            failed.forEach(r => {
                console.log(`   "${r.question}" - Error: ${r.error}`);
            });
        }

        // Performance grade
        const grade = this.calculateGrade(successful);
        console.log('\n');
        console.log('='.repeat(80));
        console.log(`🎓 PERFORMANCE GRADE: ${grade.letter}`);
        console.log(`   ${grade.description}`);
        console.log('='.repeat(80));

        // Export results
        this.exportResults();
    }

    calculateGrade(successful) {
        if (successful.length === 0) {
            return { letter: 'F', description: 'No successful responses' };
        }

        const avgTime = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;
        const instantPercent = successful.filter(r => r.totalTime < 1000).length / successful.length * 100;

        if (avgTime < 1000 && instantPercent > 80) {
            return { letter: 'A+', description: 'Excellent! Sub-second responses feel instant.' };
        } else if (avgTime < 1500 && instantPercent > 60) {
            return { letter: 'A', description: 'Great! Very responsive companion experience.' };
        } else if (avgTime < 2000 && instantPercent > 40) {
            return { letter: 'B+', description: 'Good! Fast enough for natural conversation.' };
        } else if (avgTime < 2500) {
            return { letter: 'B', description: 'Acceptable. Slight delays noticeable.' };
        } else if (avgTime < 3000) {
            return { letter: 'C', description: 'Needs improvement. Response lag noticeable.' };
        } else {
            return { letter: 'D', description: 'Poor. Too slow for conversational experience.' };
        }
    }

    exportResults() {
        console.log('\n💾 Results saved to window.phoenixTestResults');
        window.phoenixTestResults = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                total: this.results.length,
                successful: this.results.filter(r => r.success).length,
                failed: this.results.filter(r => !r.success).length,
                averageTime: Math.round(
                    this.results.filter(r => r.success).reduce((sum, r) => sum + r.totalTime, 0) /
                    this.results.filter(r => r.success).length
                )
            }
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests
console.log('🚀 Phoenix Companion Response Time Test Ready');
console.log('📝 To run tests, execute: testCompanionResponseTime()');

window.testCompanionResponseTime = async function() {
    const test = new ResponseTimeTest();
    await test.runAllTests();
};

// Auto-run if called directly
if (window.location.search.includes('autotest=true')) {
    window.addEventListener('load', () => {
        setTimeout(() => testCompanionResponseTime(), 2000);
    });
}
