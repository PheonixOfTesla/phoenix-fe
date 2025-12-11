/**
 * GPU & FPS Performance Profiler
 * Measures current frame rate and GPU usage
 */

const puppeteer = require('puppeteer');

(async () => {
    console.log('\n🎮 GPU & FPS Performance Analysis\n');
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
        ]
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:8000/dashboard.html', { waitUntil: 'networkidle2' });

    // Login
    await page.evaluate(() => {
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzI3YTBiODczOTY1OTExYWVmYTBhNCIsImlhdCI6MTczMDQyMDAxOSwiZXhwIjoxNzMzMDEyMDE5fQ.LblCaEzKOjYFcIrBRhHhHQ7KlqFPjRPJiUKZ2OoPbOk');
    });
    await page.reload({ waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 3000));

    const client = await page.target().createCDPSession();

    // Enable performance metrics
    await client.send('Performance.enable');

    // Measure for 5 seconds
    console.log('\n📊 Measuring performance for 5 seconds...\n');

    let frames = [];
    let lastTimestamp = null;

    // Track frames
    await client.send('Page.enable');
    await client.send('Page.startScreencast', { format: 'png', quality: 50 });

    client.on('Page.screencastFrame', (frame) => {
        const timestamp = frame.metadata.timestamp;
        if (lastTimestamp) {
            const fps = 1 / (timestamp - lastTimestamp);
            frames.push(fps);
        }
        lastTimestamp = timestamp;
        client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
    });

    await new Promise(r => setTimeout(r, 5000));

    await client.send('Page.stopScreencast');

    // Get metrics
    const metrics = await client.send('Performance.getMetrics');

    // Calculate FPS stats
    const avgFPS = frames.reduce((a, b) => a + b, 0) / frames.length;
    const minFPS = Math.min(...frames);
    const maxFPS = Math.max(...frames);

    console.log('🎯 FRAME RATE (FPS)');
    console.log('━'.repeat(60));
    console.log(`Average FPS:  ${avgFPS.toFixed(1)} fps`);
    console.log(`Min FPS:      ${minFPS.toFixed(1)} fps`);
    console.log(`Max FPS:      ${maxFPS.toFixed(1)} fps`);

    console.log('\n⚙️ CPU METRICS');
    console.log('━'.repeat(60));

    const jsHeap = metrics.metrics.find(m => m.name === 'JSHeapUsedSize');
    const jsHeapTotal = metrics.metrics.find(m => m.name === 'JSHeapTotalSize');
    const layoutCount = metrics.metrics.find(m => m.name === 'LayoutCount');
    const recalcStyleCount = metrics.metrics.find(m => m.name === 'RecalcStyleCount');

    if (jsHeap) console.log(`JS Heap Used: ${(jsHeap.value / 1024 / 1024).toFixed(2)} MB`);
    if (jsHeapTotal) console.log(`JS Heap Total: ${(jsHeapTotal.value / 1024 / 1024).toFixed(2)} MB`);
    if (layoutCount) console.log(`Layouts: ${layoutCount.value}`);
    if (recalcStyleCount) console.log(`Style Recalcs: ${recalcStyleCount.value}`);

    // GPU info
    console.log('\n🎮 GPU ANALYSIS');
    console.log('━'.repeat(60));

    const gpuInfo = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) return { available: false };

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

        return {
            available: true,
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
        };
    });

    if (gpuInfo.available) {
        console.log(`GPU Vendor:   ${gpuInfo.vendor}`);
        console.log(`GPU Renderer: ${gpuInfo.renderer}`);
        console.log(`Max Texture:  ${gpuInfo.maxTextureSize}px`);
        console.log(`Max Viewport: ${gpuInfo.maxViewportDims[0]}x${gpuInfo.maxViewportDims[1]}`);

        // Check for GPU-accelerated elements
        const gpuElements = await page.evaluate(() => {
            return {
                canvasCount: document.querySelectorAll('canvas').length,
                videoCount: document.querySelectorAll('video').length,
                transformCount: document.querySelectorAll('[style*="transform"]').length,
                filterCount: document.querySelectorAll('[style*="filter"]').length
            };
        });

        console.log(`\nGPU-Accelerated Elements:`);
        console.log(`  Canvas elements:   ${gpuElements.canvasCount}`);
        console.log(`  Video elements:    ${gpuElements.videoCount}`);
        console.log(`  CSS Transforms:    ${gpuElements.transformCount}`);
        console.log(`  CSS Filters:       ${gpuElements.filterCount}`);

        const totalGPU = gpuElements.canvasCount + gpuElements.videoCount +
                        gpuElements.transformCount + gpuElements.filterCount;

        console.log(`\n📊 GPU USAGE: ${totalGPU === 0 ? 'MINIMAL ✅' : totalGPU + ' elements'}`);
        console.log(`📊 CPU-OPTIMIZED: ${avgFPS > 30 ? 'YES ✅' : 'NEEDS WORK ❌'}`);
    } else {
        console.log('⚠️ WebGL not available');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Analysis complete\n');

    await browser.close();
})();
