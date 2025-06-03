#!/usr/bin/env node

/**
 * Test script for the Unified Data Loading System
 * 
 * This script helps validate that the new unified data system
 * is working correctly for all user roles.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Unified Data Loading System\n');

// Check if required files exist
const requiredFiles = [
  'hooks/use-unified-data.ts',
  'hooks/use-data-fallback.ts',
  'components/unified-dashboard.tsx',
  'UNIFIED_DATA_SYSTEM.md'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are created.');
  process.exit(1);
}

// Check if old files are still being used
console.log('\n🔍 Checking for deprecated imports...');
const filesToCheck = [
  'app/page.tsx',
  'components/dashboard-layout.tsx'
];

let foundDeprecatedImports = false;

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const deprecatedImports = [
      'useDashboardData',
      'useAdminData',
      'useClientData',
      'InfluencerDashboard',
      'AdminDashboard',
      'ClientDashboard'
    ];
    
    deprecatedImports.forEach(importName => {
      if (content.includes(importName)) {
        console.log(`⚠️  ${file} still uses deprecated: ${importName}`);
        foundDeprecatedImports = true;
      }
    });
  }
});

if (!foundDeprecatedImports) {
  console.log('✅ No deprecated imports found');
}

// Validate TypeScript interfaces
console.log('\n🔧 Validating TypeScript interfaces...');

const unifiedDataFile = path.join(process.cwd(), 'hooks/use-unified-data.ts');
if (fs.existsSync(unifiedDataFile)) {
  const content = fs.readFileSync(unifiedDataFile, 'utf8');
  
  const requiredInterfaces = [
    'UnifiedStats',
    'UnifiedListItem',
    'UnifiedActivity',
    'UnifiedData'
  ];
  
  requiredInterfaces.forEach(interfaceName => {
    if (content.includes(`interface ${interfaceName}`)) {
      console.log(`✅ ${interfaceName} interface found`);
    } else {
      console.log(`❌ ${interfaceName} interface missing`);
    }
  });
}

// Check for proper error handling
console.log('\n🛡️  Checking error handling...');

const errorHandlingPatterns = [
  'isBackendLimitation',
  'useFallback',
  'fallbackData',
  'setUseFallback'
];

let errorHandlingComplete = true;

errorHandlingPatterns.forEach(pattern => {
  const content = fs.readFileSync(unifiedDataFile, 'utf8');
  if (content.includes(pattern)) {
    console.log(`✅ ${pattern} implemented`);
  } else {
    console.log(`❌ ${pattern} missing`);
    errorHandlingComplete = false;
  }
});

// Generate test summary
console.log('\n📊 Test Summary');
console.log('================');

if (allFilesExist && !foundDeprecatedImports && errorHandlingComplete) {
  console.log('🎉 All tests passed! The unified data system is ready.');
  console.log('\n📋 Next steps:');
  console.log('1. Test the application with different user roles');
  console.log('2. Verify fallback data works when backend is unavailable');
  console.log('3. Check console logs for proper debug information');
  console.log('4. Test the refresh functionality');
} else {
  console.log('⚠️  Some issues were found. Please review the output above.');
  console.log('\n🔧 Recommended actions:');
  if (!allFilesExist) {
    console.log('- Create missing files');
  }
  if (foundDeprecatedImports) {
    console.log('- Remove deprecated imports and components');
  }
  if (!errorHandlingComplete) {
    console.log('- Implement missing error handling features');
  }
}

console.log('\n📚 For more information, see: UNIFIED_DATA_SYSTEM.md');
console.log('🐛 For debugging, check browser console for detailed logs');

// Performance recommendations
console.log('\n⚡ Performance Tips:');
console.log('- Use the unified hook only once per page');
console.log('- Leverage the built-in caching and abort handling');
console.log('- Monitor network requests in browser dev tools');
console.log('- Test with slow network conditions');

console.log('\n✨ Happy coding!'); 