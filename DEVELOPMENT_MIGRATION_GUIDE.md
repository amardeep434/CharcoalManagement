# Database Migration Maintenance Guide

This guide ensures the `database_setup.sql` file stays synchronized with any future database schema changes in CharcoalBiz.

## 🎯 Goal

Whenever you modify the database schema in `shared/schema.ts`, the migration file must be automatically updated to reflect those changes. This ensures anyone can migrate the app outside of Replit with the latest schema.

## 🔧 Automated Tools

### 1. Manual Migration Update
```bash
# Run this command after any schema changes
node scripts/generate-migration.js

# Or use the bash script (includes validation)
./scripts/update-migration.sh
```

### 2. Automatic Schema Watching (Development)
```bash
# Start the schema watcher in a separate terminal
node scripts/watch-schema.js
```

This will automatically regenerate `database_setup.sql` whenever `shared/schema.ts` changes.

## 📋 Development Workflow

### When Making Schema Changes

1. **Modify** `shared/schema.ts` with your changes
2. **Run** the update script:
   ```bash
   ./scripts/update-migration.sh
   ```
3. **Verify** the updated `database_setup.sql` file
4. **Test** the migration on a development database
5. **Commit** both `schema.ts` and `database_setup.sql` together

### Recommended Development Setup

Start the schema watcher in development:
```bash
# Terminal 1: Start the application
npm run dev

# Terminal 2: Watch for schema changes
node scripts/watch-schema.js
```

## 🔄 What Gets Updated

The migration generator automatically updates:

- **Table Definitions**: All CREATE TABLE statements
- **Indexes**: Performance optimization indexes
- **Constraints**: Foreign keys and unique constraints
- **Default Data**: Sample companies, hotels, suppliers, and admin user
- **Triggers**: Update timestamp triggers
- **Permissions**: Database user permissions (commented)

## 📝 Schema Change Examples

### Adding a New Table

1. Add the table definition to `shared/schema.ts`:
```typescript
export const newTable = pgTable("new_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

2. Add the corresponding insert schema:
```typescript
export const insertNewTableSchema = createInsertSchema(newTable).omit({
  id: true,
  createdAt: true,
});
```

3. Run the update script:
```bash
./scripts/update-migration.sh
```

### Modifying Existing Tables

1. Update the table definition in `shared/schema.ts`
2. Run the migration update script
3. The SQL file will include the updated table structure

### Adding Indexes

1. Add indexes to the schema using Drizzle's index syntax
2. Run the update script
3. New indexes will be included in the migration file

## 🧪 Testing Migration Changes

### Local Testing
```bash
# Create a test database
createdb charcoalbiz_test

# Run the migration
psql -d charcoalbiz_test -f database_setup.sql

# Verify tables and data
psql -d charcoalbiz_test -c "\dt"
psql -d charcoalbiz_test -c "SELECT count(*) FROM users;"
```

### Docker Testing
```bash
# Start a PostgreSQL container
docker run --name test-postgres -e POSTGRES_PASSWORD=test -p 5433:5432 -d postgres:15

# Wait for startup, then run migration
sleep 5
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE charcoalbiz_test;"
psql -h localhost -p 5433 -U postgres -d charcoalbiz_test -f database_setup.sql

# Clean up
docker stop test-postgres && docker rm test-postgres
```

## 🚨 Important Notes

### Always Update Together
- Never commit schema changes without updating the migration file
- Both `shared/schema.ts` and `database_setup.sql` should be in the same commit

### Version Control Best Practices
```bash
# Check what's changed
git diff shared/schema.ts
git diff database_setup.sql

# Commit together
git add shared/schema.ts database_setup.sql
git commit -m "Add new customer table with migration"
```

### Production Considerations
- Test all migration changes on a copy of production data
- Consider data migration scripts for complex changes
- Plan for zero-downtime deployments if needed

## 🔧 Script Maintenance

### Updating the Generator Script

If you need to modify the migration generator (`scripts/generate-migration.js`):

1. Update the table definitions in the script
2. Ensure they match `shared/schema.ts`
3. Test the generation process
4. Update this guide if necessary

### Custom Migration Requirements

For complex changes that require data migration:

1. Generate the base schema with the script
2. Add custom migration logic manually
3. Document the custom changes
4. Consider creating separate migration scripts for data transformations

## 📚 Quick Reference

| Command | Purpose |
|---------|---------|
| `node scripts/generate-migration.js` | Generate migration file |
| `./scripts/update-migration.sh` | Generate with validation |
| `node scripts/watch-schema.js` | Watch for schema changes |
| `psql -f database_setup.sql` | Run migration |

## 🆘 Troubleshooting

### Migration Script Fails
- Check Node.js is installed and accessible
- Verify `shared/schema.ts` exists and is valid
- Ensure proper file permissions on scripts

### Schema Out of Sync
- Run the update script manually
- Compare generated SQL with actual database schema
- Check for manual database changes not reflected in schema

### Git Conflicts
- Resolve schema conflicts first
- Regenerate migration file after resolving conflicts
- Never manually edit the generated SQL file

This system ensures your migration file always reflects the current database schema, making deployment outside Replit seamless and reliable.