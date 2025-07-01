#!/usr/bin/env node

/**
 * Development to Production Migration Script
 * 
 * This script helps migrate schema changes from development to production
 * by comparing schemas and generating migration SQL.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Environment configuration
const DEV_URL = process.env.DEV_SUPABASE_URL || 'https://xhfrxwyggplhytlopixb.supabase.co';
const DEV_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY!;
const PROD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mcynacktfmtzkkohctps.supabase.co';
const PROD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const devSupabase = createClient(DEV_URL, DEV_KEY);
const prodSupabase = createClient(PROD_URL, PROD_KEY);

interface TableSchema {
  table_name: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  constraints: Array<{
    constraint_name: string;
    constraint_type: string;
    constraint_definition: string;
  }>;
}

async function getTableSchema(supabase: any, tableName?: string): Promise<TableSchema[]> {
  const tablesQuery = tableName 
    ? `WHERE table_name = '${tableName}'`
    : `WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;

  // Get table structures
  const { data: tables } = await supabase.rpc('sql', {
    query: `
      SELECT table_name
      FROM information_schema.tables 
      ${tablesQuery}
      ORDER BY table_name;
    `
  });

  const schemas: TableSchema[] = [];

  for (const table of tables || []) {
    // Get columns
    const { data: columns } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table.table_name}'
        ORDER BY ordinal_position;
      `
    });

    // Get constraints
    const { data: constraints } = await supabase.rpc('sql', {
      query: `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          CASE 
            WHEN tc.constraint_type = 'FOREIGN KEY' THEN
              'FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' || 
              ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')'
            WHEN tc.constraint_type = 'PRIMARY KEY' THEN
              'PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ')'
            WHEN tc.constraint_type = 'UNIQUE' THEN
              'UNIQUE (' || string_agg(kcu.column_name, ', ') || ')'
            WHEN tc.constraint_type = 'CHECK' THEN
              cc.check_clause
            ELSE 'UNKNOWN'
          END as constraint_definition
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        LEFT JOIN information_schema.check_constraints cc
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_schema = 'public' AND tc.table_name = '${table.table_name}'
        GROUP BY tc.constraint_name, tc.constraint_type, cc.check_clause, 
                 kcu.column_name, ccu.table_schema, ccu.table_name, ccu.column_name
        ORDER BY tc.constraint_type, tc.constraint_name;
      `
    });

    schemas.push({
      table_name: table.table_name,
      columns: columns || [],
      constraints: constraints || []
    });
  }

  return schemas;
}

async function compareSchemas() {
  console.log('🔍 Comparing development and production schemas...');
  
  try {
    const [devSchema, prodSchema] = await Promise.all([
      getTableSchema(devSupabase),
      getTableSchema(prodSupabase)
    ]);

    const differences: string[] = [];

    // Find new tables in development
    const devTables = devSchema.map(t => t.table_name);
    const prodTables = prodSchema.map(t => t.table_name);
    
    const newTables = devTables.filter(table => !prodTables.includes(table));
    const removedTables = prodTables.filter(table => !devTables.includes(table));

    if (newTables.length > 0) {
      differences.push(`📄 New tables in development: ${newTables.join(', ')}`);
    }

    if (removedTables.length > 0) {
      differences.push(`❌ Tables removed in development: ${removedTables.join(', ')}`);
    }

    // Compare existing tables
    const commonTables = devTables.filter(table => prodTables.includes(table));
    
    for (const tableName of commonTables) {
      const devTable = devSchema.find(t => t.table_name === tableName)!;
      const prodTable = prodSchema.find(t => t.table_name === tableName)!;

      // Compare columns
      const devColumns = devTable.columns.map(c => c.column_name);
      const prodColumns = prodTable.columns.map(c => c.column_name);

      const newColumns = devColumns.filter(col => !prodColumns.includes(col));
      const removedColumns = prodColumns.filter(col => !devColumns.includes(col));

      if (newColumns.length > 0) {
        differences.push(`➕ New columns in ${tableName}: ${newColumns.join(', ')}`);
      }

      if (removedColumns.length > 0) {
        differences.push(`➖ Removed columns in ${tableName}: ${removedColumns.join(', ')}`);
      }

      // Check for column type changes
      for (const devCol of devTable.columns) {
        const prodCol = prodTable.columns.find(c => c.column_name === devCol.column_name);
        if (prodCol && devCol.data_type !== prodCol.data_type) {
          differences.push(`🔄 Column type change in ${tableName}.${devCol.column_name}: ${prodCol.data_type} → ${devCol.data_type}`);
        }
      }
    }

    return differences;

  } catch (error) {
    console.error('❌ Error comparing schemas:', error);
    throw error;
  }
}

async function generateMigrationSQL(differences: string[]): Promise<string> {
  if (differences.length === 0) {
    return '-- No schema differences found\n-- Production is up to date with development\n';
  }

  let migrationSQL = `-- Migration Script: Development to Production
-- Generated: ${new Date().toISOString()}
-- 
-- Schema Differences Found:
${differences.map(diff => `-- ${diff}`).join('\n')}
--

BEGIN;

-- Add your migration SQL here based on the differences above
-- This is a template - you'll need to write the actual SQL statements

`;

  // Add template sections for common operations
  migrationSQL += `
-- Example: Add new tables
-- CREATE TABLE IF NOT EXISTS new_table (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   name text NOT NULL,
--   created_at timestamp with time zone DEFAULT now()
-- );

-- Example: Add new columns
-- ALTER TABLE existing_table ADD COLUMN IF NOT EXISTS new_column text;

-- Example: Modify column types
-- ALTER TABLE existing_table ALTER COLUMN existing_column TYPE new_type;

-- Example: Add constraints
-- ALTER TABLE existing_table ADD CONSTRAINT constraint_name CHECK (condition);

-- Example: Create indexes
-- CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

COMMIT;
`;

  return migrationSQL;
}

async function createMigrationFile(migrationSQL: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `${timestamp}-dev-to-prod-migration.sql`;
  const filepath = path.join(process.cwd(), 'migrations', 'pending', filename);

  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filepath, migrationSQL);
  console.log(`📝 Migration file created: ${filepath}`);
  
  return filepath;
}

async function main() {
  console.log('🚀 Starting development to production migration analysis...\n');

  try {
    // Compare schemas
    const differences = await compareSchemas();
    
    if (differences.length === 0) {
      console.log('✅ No schema differences found!');
      console.log('🎉 Production database is up to date with development.\n');
      return;
    }

    console.log('\n📋 Schema Differences Found:');
    differences.forEach(diff => console.log(`  ${diff}`));

    // Generate migration SQL
    const migrationSQL = await generateMigrationSQL(differences);
    
    // Create migration file
    const filepath = await createMigrationFile(migrationSQL);

    console.log('\n✅ Migration analysis complete!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Review the generated migration file');
    console.log('  2. Add the actual SQL statements for each difference');
    console.log('  3. Test the migration on a development copy');
    console.log('  4. Apply to production when ready');
    console.log('\n⚠️  Remember to backup production before applying migrations!');

  } catch (error) {
    console.error('\n❌ Migration analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { compareSchemas, generateMigrationSQL, createMigrationFile }; 