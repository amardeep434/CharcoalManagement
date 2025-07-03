#!/usr/bin/env node

/**
 * Schema Watcher for CharcoalBiz
 * Watches shared/schema.ts for changes and automatically regenerates database_setup.sql
 * Run in development to keep migration file synchronized
 */

import { watch } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';

const schemaPath = join(process.cwd(), 'shared', 'schema.ts');
const updateScript = join(process.cwd(), 'scripts', 'update-migration.sh');

console.log('🔍 Watching schema.ts for changes...');
console.log(`📁 Monitoring: ${schemaPath}`);
console.log('💡 Tip: Any changes to schema.ts will automatically update database_setup.sql\n');

let isUpdating = false;

// Watch for changes to schema.ts
watch(schemaPath, (eventType, filename) => {
  if (eventType === 'change' && !isUpdating) {
    isUpdating = true;
    console.log(`\n🔄 Schema change detected in ${filename}`);
    console.log('📝 Regenerating database migration file...');
    
    // Run the update script
    const updateProcess = spawn('bash', [updateScript], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    updateProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Migration file updated successfully!');
      } else {
        console.log('❌ Failed to update migration file');
      }
      console.log('\n🔍 Continuing to watch for changes...');
      isUpdating = false;
    });
    
    updateProcess.on('error', (error) => {
      console.error('❌ Error running update script:', error.message);
      isUpdating = false;
    });
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping schema watcher...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Stopping schema watcher...');
  process.exit(0);
});

console.log('✨ Schema watcher is active. Press Ctrl+C to stop.');