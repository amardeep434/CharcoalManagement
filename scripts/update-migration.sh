#!/bin/bash

# CharcoalBiz Migration Update Script
# This script automatically updates the database_setup.sql file whenever schema changes are made
# Run this script after any modifications to shared/schema.ts

echo "🔄 Updating database migration file..."
echo "📅 Generated on: $(date '+%Y-%m-%d %H:%M:%S')"

# Check if schema.ts exists
if [ ! -f "shared/schema.ts" ]; then
    echo "❌ Error: shared/schema.ts not found!"
    exit 1
fi

# Generate new migration file
node scripts/generate-migration.js

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo "✅ Migration file updated successfully!"
    echo "📄 Updated: database_setup.sql"
    echo ""
    echo "🔍 Summary of changes:"
    echo "  - Schema synchronized with shared/schema.ts"
    echo "  - Indexes and constraints updated"
    echo "  - Sample data refreshed"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Review the updated database_setup.sql file"
    echo "  2. Test the migration on a development database"
    echo "  3. Update deployment documentation if needed"
    echo "  4. Commit changes to version control"
else
    echo "❌ Error: Failed to generate migration file!"
    exit 1
fi

# Optional: Run database push if in development
if [ "$NODE_ENV" = "development" ]; then
    echo ""
    echo "🚀 Running database push in development mode..."
    npx drizzle-kit push
fi

echo ""
echo "✨ Migration update complete!"
# Run validation after update
echo ""
echo "🔍 Validating migration file..."
node scripts/validate-migration.js
