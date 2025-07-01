#!/usr/bin/env node

/**
 * Migration Creator
 * Creates migration files for database changes
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${hour}-${minute}`;
}

function createMigrationTemplate(name, description, changes) {
  const timestamp = generateTimestamp();
  
  return `-- Migration: ${name}
-- Generated: ${new Date().toISOString()}
-- Description: ${description}
--
-- Changes:
${changes.map(change => `-- - ${change}`).join('\n')}
--

BEGIN;

-- ==========================================
-- MIGRATION SQL
-- ==========================================

-- Add your migration SQL here
-- Example operations:

-- Create new table:
-- CREATE TABLE IF NOT EXISTS new_table (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   name text NOT NULL,
--   created_at timestamp with time zone DEFAULT now()
-- );

-- Add new column:
-- ALTER TABLE existing_table 
-- ADD COLUMN IF NOT EXISTS new_column text;

-- Modify column:
-- ALTER TABLE existing_table 
-- ALTER COLUMN existing_column TYPE new_type;

-- Add constraint:
-- ALTER TABLE existing_table 
-- ADD CONSTRAINT constraint_name CHECK (condition);

-- Create index:
-- CREATE INDEX IF NOT EXISTS idx_table_column 
-- ON table_name(column_name);

-- Insert reference data:
-- INSERT INTO lookup_table (id, name, description) VALUES
--   ('id1', 'name1', 'description1'),
--   ('id2', 'name2', 'description2')
-- ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ==========================================
-- ROLLBACK INSTRUCTIONS
-- ==========================================
-- If this migration needs to be rolled back:
--
-- 1. Create a rollback migration with opposite operations
-- 2. Test rollback on development first
-- 3. Apply rollback to production if needed
--
-- Example rollback operations:
-- - DROP TABLE for CREATE TABLE
-- - DROP COLUMN for ADD COLUMN  
-- - ALTER COLUMN back to original type
-- - DROP CONSTRAINT for ADD CONSTRAINT
-- - DROP INDEX for CREATE INDEX
-- - DELETE specific records for INSERT

-- ==========================================
-- VALIDATION QUERIES
-- ==========================================
-- Use these queries to validate the migration:
--
-- Check table exists:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'your_table';
--
-- Check column exists:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'your_table' 
-- AND column_name = 'your_column';
--
-- Check constraint exists:
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_schema = 'public' AND table_name = 'your_table'
-- AND constraint_type = 'CHECK';
--
-- Check index exists:
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename = 'your_table'
-- AND indexname = 'your_index';
`;
}

async function createMigration() {
  console.log('🛠️  Migration Creator\n');

  try {
    // Get migration details from user
    const name = await askQuestion('📝 Migration name (snake_case): ');
    if (!name) {
      console.error('❌ Migration name is required');
      process.exit(1);
    }

    const description = await askQuestion('📄 Brief description: ');
    if (!description) {
      console.error('❌ Description is required');
      process.exit(1);
    }

    console.log('\n📋 Enter the changes (one per line, empty line to finish):');
    const changes = [];
    let changeIndex = 1;

    while (true) {
      const change = await askQuestion(`   ${changeIndex}. `);
      if (!change) break;
      changes.push(change);
      changeIndex++;
    }

    if (changes.length === 0) {
      console.error('❌ At least one change is required');
      process.exit(1);
    }

    // Generate migration content
    const migrationContent = createMigrationTemplate(name, description, changes);

    // Create filename
    const timestamp = generateTimestamp();
    const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
    
    // Save to development migrations
    const devMigrationPath = path.join('migrations', 'development', filename);
    const pendingMigrationPath = path.join('migrations', 'production', 'pending', filename);

    // Ensure directories exist
    fs.mkdirSync(path.dirname(devMigrationPath), { recursive: true });
    fs.mkdirSync(path.dirname(pendingMigrationPath), { recursive: true });

    // Write migration files
    fs.writeFileSync(devMigrationPath, migrationContent);
    fs.writeFileSync(pendingMigrationPath, migrationContent);

    console.log('\n✅ Migration created successfully!');
    console.log(`📁 Development: ${devMigrationPath}`);
    console.log(`📁 Production (pending): ${pendingMigrationPath}`);

    console.log('\n📝 Next steps:');
    console.log('1. Edit the migration file and add your SQL');
    console.log('2. Test the migration on development database');
    console.log('3. When ready, apply to production');

    console.log('\n🔧 Quick commands:');
    console.log(`   # Edit migration`);
    console.log(`   code ${devMigrationPath}`);
    console.log('');
    console.log(`   # Test on development`);
    console.log(`   npm run env:dev`);
    console.log(`   # Apply your migration using Supabase MCP tools`);
    console.log('');
    console.log(`   # Apply to production (when ready)`);
    console.log(`   npm run env:prod`);
    console.log(`   # Apply migration using Supabase MCP tools`);

  } catch (error) {
    console.error('❌ Failed to create migration:', error.message);
    process.exit(1);
  }
}

async function listMigrations() {
  console.log('📋 Migration Status\n');

  const devMigrationsDir = path.join('migrations', 'development');
  const appliedMigrationsDir = path.join('migrations', 'production', 'applied');
  const pendingMigrationsDir = path.join('migrations', 'production', 'pending');

  // Development migrations
  if (fs.existsSync(devMigrationsDir)) {
    const devMigrations = fs.readdirSync(devMigrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Development Migrations (${devMigrations.length}):`);
    devMigrations.forEach(file => {
      console.log(`   ✅ ${file}`);
    });
  } else {
    console.log('📁 Development Migrations: None');
  }

  console.log('');

  // Applied production migrations
  if (fs.existsSync(appliedMigrationsDir)) {
    const appliedMigrations = fs.readdirSync(appliedMigrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`🎯 Production Applied (${appliedMigrations.length}):`);
    appliedMigrations.forEach(file => {
      console.log(`   ✅ ${file}`);
    });
  } else {
    console.log('🎯 Production Applied: None');
  }

  console.log('');

  // Pending production migrations
  if (fs.existsSync(pendingMigrationsDir)) {
    const pendingMigrations = fs.readdirSync(pendingMigrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`⏳ Production Pending (${pendingMigrations.length}):`);
    if (pendingMigrations.length === 0) {
      console.log('   None - Production is up to date!');
    } else {
      pendingMigrations.forEach(file => {
        console.log(`   ⏳ ${file}`);
      });
    }
  } else {
    console.log('⏳ Production Pending: None');
  }

  console.log('');
}

function showUsage() {
  console.log(`
🛠️  Migration Creator

Usage: npm run migration:create [command]

Commands:
  create, new     - Create a new migration
  list, status    - Show migration status
  help           - Show this help

Examples:
  npm run migration:create
  npm run migration:create list
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case 'create':
    case 'new':
    case undefined:
      await createMigration();
      break;

    case 'list':
    case 'status':
      await listMigrations();
      break;

    case 'help':
    case '-h':
    case '--help':
    default:
      showUsage();
      break;
  }
}

if (require.main === module) {
  main();
} 