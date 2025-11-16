#!/usr/bin/env node
/**
 * PHOENIX DEV SERVER
 * Simple HTTP server with aggressive cache-busting headers
 * Prevents browser caching during development
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;  // Backend CORS whitelist requires port 8000

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
};

const server = http.createServer((req, res) => {
    // Remove query string for file lookup
    let filePath = req.url.split('?')[0];

    // Default to index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }

    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code, 'utf-8');
            }
        } else {
            // AGGRESSIVE CACHE-BUSTING HEADERS
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('\n🔥 PHOENIX DEV SERVER');
    console.log('━'.repeat(50));
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📂 Serving files from: ${__dirname}`);
    console.log(`🚫 Cache: DISABLED (all requests fresh)`);
    console.log('━'.repeat(50));
    console.log('\n✅ Ready! Open http://localhost:8080 in your browser');
    console.log('💡 Press Ctrl+C to stop\n');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down dev server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
