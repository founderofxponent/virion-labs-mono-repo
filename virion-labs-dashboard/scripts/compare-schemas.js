#!/usr/bin/env node

/**
 * Schema Comparison Tool
 * Compares development and production database schemas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Database connections
const DEV_PROJECT_ID = 'xhfrxwyggplhytlopixb';
const PROD_PROJECT_ID = 'mcynacktfmtzkkohctps';

async function getTablesInfo(projectId) {
  console.log(`📊 Fetching table information for project: ${projectId}`);
  
  try {
    // Use MCP tool simulation - in practice, you'd call the actual MCP tool
    const response = await fetch(`http://localhost:3000/api/internal/supabase-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        projectId,
        query: `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default,
            ordinal_position
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching data for ${projectId}:`, error.message);
    return [];
  }
}

async function getConstraintsInfo(projectId) {
  console.log(`🔗 Fetching constraints for project: ${projectId}`);
  
  try {
    const response = await fetch(`http://localhost:3000/api/internal/supabase-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        projectId,
        query: `
          SELECT 
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = 'public'
          ORDER BY tc.table_name, tc.constraint_type;
        `
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching constraints for ${projectId}:`, error.message);
    return [];
  }
}

function groupTablesByName(tableData) {
  const tables = {};
  
  tableData.forEach(row => {
    if (!tables[row.table_name]) {
      tables[row.table_name] = {
        name: row.table_name,
        columns: []
      };
    }
    
    tables[row.table_name].columns.push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default,
      position: row.ordinal_position
    });
  });
  
  return tables;
}

function compareSchemas(devTables, prodTables) {
  const differences = [];
  
  const devTableNames = Object.keys(devTables);
  const prodTableNames = Object.keys(prodTables);
  
  // Find new tables in development
  const newTables = devTableNames.filter(name => !prodTableNames.includes(name));
  if (newTables.length > 0) {
    differences.push({
      type: 'NEW_TABLES',
      items: newTables,
      description: `📄 New tables in development: ${newTables.join(', ')}`
    });
  }
  
  // Find removed tables
  const removedTables = prodTableNames.filter(name => !devTableNames.includes(name));
  if (removedTables.length > 0) {
    differences.push({
      type: 'REMOVED_TABLES',
      items: removedTables,
      description: `❌ Tables removed in development: ${removedTables.join(', ')}`
    });
  }
  
  // Compare existing tables
  const commonTables = devTableNames.filter(name => prodTableNames.includes(name));
  
  commonTables.forEach(tableName => {
    const devTable = devTables[tableName];
    const prodTable = prodTables[tableName];
    
    const devColumnNames = devTable.columns.map(c => c.name);
    const prodColumnNames = prodTable.columns.map(c => c.name);
    
    // New columns
    const newColumns = devColumnNames.filter(name => !prodColumnNames.includes(name));
    if (newColumns.length > 0) {
      differences.push({
        type: 'NEW_COLUMNS',
        table: tableName,
        items: newColumns,
        description: `➕ New columns in ${tableName}: ${newColumns.join(', ')}`
      });
    }
    
    // Removed columns
    const removedColumns = prodColumnNames.filter(name => !devColumnNames.includes(name));
    if (removedColumns.length > 0) {
      differences.push({
        type: 'REMOVED_COLUMNS',
        table: tableName,
        items: removedColumns,
        description: `➖ Removed columns in ${tableName}: ${removedColumns.join(', ')}`
      });
    }
    
    // Column type changes
    devTable.columns.forEach(devCol => {
      const prodCol = prodTable.columns.find(c => c.name === devCol.name);
      if (prodCol && devCol.type !== prodCol.type) {
        differences.push({
          type: 'COLUMN_TYPE_CHANGE',
          table: tableName,
          column: devCol.name,
          from: prodCol.type,
          to: devCol.type,
          description: `🔄 Column type change in ${tableName}.${devCol.name}: ${prodCol.type} → ${devCol.type}`
        });
      }
    });
  });
  
  return differences;
}

function generateReport(differences) {
  const timestamp = new Date().toISOString();
  
  let report = `# Schema Comparison Report
Generated: ${timestamp}

## Summary
- Development Project: ${DEV_PROJECT_ID}
- Production Project: ${PROD_PROJECT_ID}
- Differences Found: ${differences.length}

`;

  if (differences.length === 0) {
    report += `✅ **No differences found!**
The development and production schemas are identical.
`;
  } else {
    report += `## Differences\n\n`;
    
    differences.forEach((diff, index) => {
      report += `### ${index + 1}. ${diff.description}\n`;
      
      if (diff.type === 'COLUMN_TYPE_CHANGE') {
        report += `   - Table: \`${diff.table}\`
   - Column: \`${diff.column}\`
   - Change: \`${diff.from}\` → \`${diff.to}\`\n\n`;
      } else if (diff.table) {
        report += `   - Table: \`${diff.table}\`
   - Items: \`${diff.items.join(', ')}\`\n\n`;
      } else {
        report += `   - Items: \`${diff.items.join(', ')}\`\n\n`;
      }
    });
    
    report += `## Next Steps

1. **Review Changes**: Carefully review each difference listed above
2. **Create Migration**: Generate migration SQL for required changes
3. **Test Migration**: Test the migration on a development copy
4. **Apply to Production**: When ready, apply changes to production

⚠️ **Important**: Always backup production before applying migrations!
`;
  }
  
  return report;
}

async function main() {
  console.log('🔍 Starting schema comparison...\n');
  
  try {
    // Get schema information from both databases
    const [devTableData, prodTableData] = await Promise.all([
      getTablesInfo(DEV_PROJECT_ID),
      getTablesInfo(PROD_PROJECT_ID)
    ]);
    
    // Organize data by table
    const devTables = groupTablesByName(devTableData);
    const prodTables = groupTablesByName(prodTableData);
    
    console.log(`📊 Development: ${Object.keys(devTables).length} tables`);
    console.log(`📊 Production: ${Object.keys(prodTables).length} tables\n`);
    
    // Compare schemas
    const differences = compareSchemas(devTables, prodTables);
    
    // Generate and display report
    const report = generateReport(differences);
    console.log(report);
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    const filename = `schema-comparison-${new Date().toISOString().split('T')[0]}.md`;
    const filepath = path.join(__dirname, '..', 'migrations', 'reports', filename);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(filepath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, report);
    console.log(`\n📝 Report saved to: ${filepath}`);
    
    // Exit with appropriate code
    process.exit(differences.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Schema comparison failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 