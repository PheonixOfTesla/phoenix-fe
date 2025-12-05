#!/usr/bin/env node
/**
 * PHOENIX AUTOMATED CAPACITOR SYNC WATCHER
 *
 * OMEGA PROTOCOL: Eliminates manual sync operations
 *
 * PURPOSE:
 * - Watch www/ directory for file changes
 * - Auto-sync to iOS bundle on modifications
 * - Zero human intervention required
 * - Prevents deployment lag and sync errors
 *
 * USAGE:
 *   npm install --save-dev chokidar
 *   node .capacitor-sync-watch.js
 *
 * Or add to package.json scripts:
 *   "watch:ios": "node .capacitor-sync-watch.js"
 */

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

const WWW_DIR = path.join(__dirname, 'www');
const DEBOUNCE_MS = 2000; // Wait 2s after last change before syncing

let syncTimeout = null;
let isSyncing = false;

console.log('🔍 Phoenix Capacitor Sync Watcher - OMEGA MODE');
console.log(`📂 Watching: ${WWW_DIR}`);
console.log('🚀 Auto-sync: ENABLED\n');

// Watch www/ directory
const watcher = chokidar.watch(WWW_DIR, {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

watcher
  .on('change', (filePath) => handleFileChange(filePath, 'modified'))
  .on('add', (filePath) => handleFileChange(filePath, 'added'))
  .on('unlink', (filePath) => handleFileChange(filePath, 'deleted'))
  .on('error', error => console.error(`❌ Watcher error: ${error}`))
  .on('ready', () => console.log('✅ Watcher ready - monitoring for changes...\n'));

function handleFileChange(filePath, action) {
  const relativePath = path.relative(WWW_DIR, filePath);
  console.log(`📝 File ${action}: ${relativePath}`);

  // Clear existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Debounce: Wait for changes to settle before syncing
  syncTimeout = setTimeout(() => {
    syncToiOS();
  }, DEBOUNCE_MS);
}

function syncToiOS() {
  if (isSyncing) {
    console.log('⏳ Sync already in progress, skipping...');
    return;
  }

  isSyncing = true;
  console.log('\n🔄 Syncing to iOS bundle...');

  const startTime = Date.now();

  exec('npx cap sync ios --no-build', (error, stdout, stderr) => {
    isSyncing = false;
    const duration = Date.now() - startTime;

    if (error) {
      console.error(`❌ Sync failed (${duration}ms):`, error.message);
      if (stderr) console.error(stderr);
      return;
    }

    console.log(`✅ Sync complete (${duration}ms)`);

    // Parse output for summary
    if (stdout.includes('copy ios')) {
      const match = stdout.match(/copy ios in ([\d.]+)ms/);
      if (match) {
        console.log(`📦 iOS bundle updated in ${match[1]}ms`);
      }
    }

    console.log('👀 Watching for next change...\n');
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down watcher...');
  watcher.close();
  process.exit(0);
});
