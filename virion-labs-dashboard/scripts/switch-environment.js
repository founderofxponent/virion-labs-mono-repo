#!/usr/bin/env node

/**
 * Environment Switcher
 * Easily switch between development and production environments
 */

const fs = require('fs');
const path = require('path');

const environments = {
  development: {
    name: 'Development',
    file: '.env.development',
    supabaseUrl: 'https://xhfrxwyggplhytlopixb.supabase.co',
    projectId: 'xhfrxwyggplhytlopixb',
    color: '\x1b[32m', // Green
  },
  production: {
    name: 'Production',
    file: '.env.production',
    supabaseUrl: 'https://mcynacktfmtzkkohctps.supabase.co',
    projectId: 'mcynacktfmtzkkohctps',
    color: '\x1b[31m', // Red
  }
};

function showUsage() {
  console.log(`
🔄 Environment Switcher

Usage: npm run switch-env [environment]

Available environments:
  dev, development    - Switch to development environment
  prod, production    - Switch to production environment
  status, current     - Show current environment
  help                - Show this help message

Examples:
  npm run switch-env dev
  npm run switch-env production
  npm run switch-env status
`);
}

function getCurrentEnvironment() {
  const envLocalPath = '.env.local';
  
  if (!fs.existsSync(envLocalPath)) {
    return null;
  }
  
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  // Check which environment is currently active based on Supabase URL
  if (envContent.includes(environments.development.supabaseUrl)) {
    return 'development';
  } else if (envContent.includes(environments.production.supabaseUrl)) {
    return 'production';
  }
  
  return 'unknown';
}

function showCurrentEnvironment() {
  const current = getCurrentEnvironment();
  const reset = '\x1b[0m';
  
  console.log('\n📊 Current Environment Status:');
  
  if (current === null) {
    console.log('   ⚠️  No environment file found (.env.local)');
    console.log('   💡 Run switch-env command to set up an environment');
  } else if (current === 'unknown') {
    console.log('   ❓ Unknown environment (custom configuration)');
  } else {
    const env = environments[current];
    console.log(`   ${env.color}✅ ${env.name} Environment${reset}`);
    console.log(`   📍 Project ID: ${env.projectId}`);
    console.log(`   🌐 Supabase URL: ${env.supabaseUrl}`);
  }
  
  console.log('');
}

function switchEnvironment(targetEnv) {
  const envConfig = environments[targetEnv];
  
  if (!envConfig) {
    console.error(`❌ Invalid environment: ${targetEnv}`);
    showUsage();
    process.exit(1);
  }
  
  const sourceFile = envConfig.file;
  const targetFile = '.env.local';
  
  // Check if source environment file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Environment file not found: ${sourceFile}`);
    console.log('\n💡 Create the environment file first:');
    console.log(`   touch ${sourceFile}`);
    console.log(`   # Add your environment variables to ${sourceFile}`);
    process.exit(1);
  }
  
  try {
    // Read source environment
    const envContent = fs.readFileSync(sourceFile, 'utf8');
    
    // Write to .env.local
    fs.writeFileSync(targetFile, envContent);
    
    const reset = '\x1b[0m';
    console.log(`\n${envConfig.color}✅ Switched to ${envConfig.name} Environment${reset}`);
    console.log(`   📁 Using: ${sourceFile} → ${targetFile}`);
    console.log(`   📍 Project ID: ${envConfig.projectId}`);
    console.log(`   🌐 Supabase URL: ${envConfig.supabaseUrl}`);
    
    if (targetEnv === 'production') {
      console.log(`\n⚠️  ${'\x1b[33m'}WARNING: You are now in PRODUCTION mode${reset}`);
      console.log('   🚨 Be extra careful with database changes!');
      console.log('   📋 Always backup before making changes');
    }
    
    console.log('\n🔄 Restart your development server to apply changes');
    console.log('   npm run dev\n');
    
  } catch (error) {
    console.error('❌ Failed to switch environment:', error.message);
    process.exit(1);
  }
}

function createEnvironmentFiles() {
  console.log('🛠️  Creating environment template files...\n');
  
  const devTemplate = `# Development Environment Configuration
# Supabase Development Database
NEXT_PUBLIC_SUPABASE_URL=https://xhfrxwyggplhytlopixb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key_here
SUPABASE_PROJECT_ID=xhfrxwyggplhytlopixb

# Environment Indicators
NODE_ENV=development
SUPABASE_ENV=development

# Discord Bot (Development)
DISCORD_BOT_TOKEN=your_dev_bot_token_here
DISCORD_CLIENT_ID=your_dev_client_id_here
DISCORD_CLIENT_SECRET=your_dev_client_secret_here

# Development-specific settings
DEBUG_MODE=true
VERBOSE_LOGGING=true

# Optional: Development overrides
# WEBHOOK_URL=http://localhost:3000
`;

  const prodTemplate = `# Production Environment Configuration
# Supabase Production Database
NEXT_PUBLIC_SUPABASE_URL=https://mcynacktfmtzkkohctps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key_here
SUPABASE_PROJECT_ID=mcynacktfmtzkkohctps

# Environment Indicators
NODE_ENV=production
SUPABASE_ENV=production

# Discord Bot (Production)
DISCORD_BOT_TOKEN=your_prod_bot_token_here
DISCORD_CLIENT_ID=your_prod_client_id_here
DISCORD_CLIENT_SECRET=your_prod_client_secret_here

# Production-specific settings
DEBUG_MODE=false
VERBOSE_LOGGING=false

# Production URLs
# WEBHOOK_URL=https://your-production-domain.com
`;

  // Create development environment file
  if (!fs.existsSync('.env.development')) {
    fs.writeFileSync('.env.development', devTemplate);
    console.log('✅ Created .env.development');
  } else {
    console.log('ℹ️  .env.development already exists');
  }
  
  // Create production environment file
  if (!fs.existsSync('.env.production')) {
    fs.writeFileSync('.env.production', prodTemplate);
    console.log('✅ Created .env.production');
  } else {
    console.log('ℹ️  .env.production already exists');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Edit .env.development and .env.production with your actual keys');
  console.log('2. Run: npm run switch-env dev');
  console.log('3. Start development: npm run dev\n');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  
  switch (command) {
    case 'dev':
    case 'development':
      switchEnvironment('development');
      break;
      
    case 'prod':
    case 'production':
      switchEnvironment('production');
      break;
      
    case 'status':
    case 'current':
      showCurrentEnvironment();
      break;
      
    case 'init':
    case 'setup':
      createEnvironmentFiles();
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