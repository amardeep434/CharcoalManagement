#!/usr/bin/env node

/**
 * Development Migration Watcher
 * Automatically updates migration files when schema.ts changes during development
 */

const { watch } = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'shared/schema.ts');

console.log('👀 Watching schema.ts for changes...');
console.log('📁 Monitoring:', schemaPath);

let updateTimeout;

function updateMigration() {
    console.log('🔄 Schema change detected, updating migration...');
    
    const child = spawn('node', ['scripts/generate-migration.js'], {
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    child.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Migration updated successfully');
            console.log('👀 Continuing to watch for changes...');
        } else {
            console.log('❌ Failed to update migration');
        }
    });
}

// Watch for changes in schema.ts
watch(schemaPath, (eventType, filename) => {
    if (eventType === 'change') {
        // Debounce rapid changes
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateMigration, 1000);
    }
});

// Watch for changes in server files that might affect production features
const serverDir = path.join(process.cwd(), 'server');
watch(serverDir, { recursive: true }, (eventType, filename) => {
    if (filename && 
        (filename.includes('replitAuth.ts') || 
         filename.includes('index.ts') || 
         filename.includes('logger.ts')) &&
        eventType === 'change') {
        console.log(`🔄 Production feature file changed: ${filename}`);
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateMigration, 2000);
    }
});

console.log('✅ Auto-migration watcher is running');
console.log('💡 Press Ctrl+C to stop watching');
