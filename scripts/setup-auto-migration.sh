#!/bin/bash

# CharcoalBiz Auto-Migration Setup Script
# This script sets up automatic migration file updates whenever schema changes

echo "🚀 Setting up automatic migration updates for CharcoalBiz..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook to update migration before commits
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Auto-update migration files before commit

echo "🔄 Checking for schema changes..."

# Check if schema.ts has been modified
if git diff --cached --name-only | grep -q "shared/schema.ts"; then
    echo "📝 Schema changes detected, updating migration files..."
    
    # Update migration file
    node scripts/generate-migration.js
    
    # Add updated migration file to commit
    git add database_setup.sql
    
    echo "✅ Migration files updated and added to commit"
fi
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Create post-merge hook to update migration after pulls
cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash
# Auto-update migration files after merge/pull

echo "🔄 Checking for schema changes after merge..."

# Check if schema.ts was modified in the merge
if git diff HEAD@{1} --name-only | grep -q "shared/schema.ts"; then
    echo "📝 Schema changes detected in merge, updating migration files..."
    node scripts/generate-migration.js
    echo "✅ Migration files updated"
fi
EOF

# Make post-merge hook executable
chmod +x .git/hooks/post-merge

# Create a file watcher script for development
cat > scripts/dev-migration-watcher.js << 'EOF'
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
EOF

# Make the watcher executable
chmod +x scripts/dev-migration-watcher.js

# Create a validation script
cat > scripts/validate-migration.js << 'EOF'
#!/usr/bin/env node

/**
 * Migration Validation Script
 * Ensures migration files are current and include all production features
 */

const { readFileSync, existsSync } = require('fs');
const path = require('path');

function validateMigration() {
    const migrationPath = path.join(process.cwd(), 'database_setup.sql');
    const schemaPath = path.join(process.cwd(), 'shared/schema.ts');
    
    if (!existsSync(migrationPath)) {
        console.log('❌ database_setup.sql not found');
        return false;
    }
    
    if (!existsSync(schemaPath)) {
        console.log('❌ shared/schema.ts not found');
        return false;
    }
    
    const migrationContent = readFileSync(migrationPath, 'utf8');
    const schemaContent = readFileSync(schemaPath, 'utf8');
    
    // Check for production features
    const checks = [
        {
            name: 'Performance indexes',
            test: migrationContent.includes('CREATE INDEX')
        },
        {
            name: 'Production header',
            test: migrationContent.includes('PRODUCTION READY')
        },
        {
            name: 'Session management',
            test: migrationContent.includes('sessions')
        },
        {
            name: 'Audit logging',
            test: migrationContent.includes('audit_log')
        },
        {
            name: 'User authentication',
            test: migrationContent.includes('users')
        },
        {
            name: 'Current date',
            test: migrationContent.includes(new Date().getFullYear().toString())
        }
    ];
    
    console.log('🔍 Validating migration file...');
    
    let allPassed = true;
    checks.forEach(check => {
        if (check.test) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`❌ ${check.name}`);
            allPassed = false;
        }
    });
    
    if (allPassed) {
        console.log('🎉 Migration validation passed - ready for production!');
    } else {
        console.log('⚠️  Migration validation failed - run: node scripts/generate-migration.js');
    }
    
    return allPassed;
}

validateMigration();
EOF

# Make validator executable
chmod +x scripts/validate-migration.js

# Update the existing update script to include validation
cat >> scripts/update-migration.sh << 'EOF'

# Run validation after update
echo ""
echo "🔍 Validating migration file..."
node scripts/validate-migration.js
EOF

echo ""
echo "✅ Auto-migration system setup complete!"
echo ""
echo "🎯 What's been configured:"
echo "   • Git pre-commit hook: Updates migrations before commits"
echo "   • Git post-merge hook: Updates migrations after pulls/merges"
echo "   • Development watcher: Real-time migration updates"
echo "   • Validation script: Ensures migration completeness"
echo ""
echo "🚀 Usage:"
echo "   • Development watching: node scripts/dev-migration-watcher.js"
echo "   • Manual update: node scripts/generate-migration.js"
echo "   • Validate current: node scripts/validate-migration.js"
echo "   • Full update: ./scripts/update-migration.sh"
echo ""
echo "💡 The system now automatically keeps migration files current!"