#!/usr/bin/env node

/**
 * Migration Validation Script
 * Ensures migration files are current and include all production features
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
