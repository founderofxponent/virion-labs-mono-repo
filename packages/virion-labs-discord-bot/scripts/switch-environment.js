#!/usr/bin/env node

/**
 * Environment Switcher for Discord Bot
 * Easily switch between development and production environments
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const environments = {
  development: {
    name: 'Development',
    file: '.env.development',
    color: '\x1b[32m', // Green
  },
  production: {
    name: 'Production',
    file: '.env.production',
    color: '\x1b[31m', // Red
  }
};

function showUsage() {
  console.log(`
🔄 Discord Bot Environment Switcher

Usage: npm run switch-env [environment]

Available environments:
  dev, development    - Switch to development environment
  prod, production    - Switch to production environment
  status, current     - Show current environment
  init, setup         - Create template .env files
  help                - Show this help message

Examples:
  npm run env:dev
  npm run env:prod
  npm run env:status
`);
}

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    return dotenv.parse(fs.readFileSync(filePath));
}

function getCurrentEnvironment() {
  const envConfig = parseEnvFile('.env');
  const envType = envConfig.BOT_ENV || 'unknown';

  if (envType === 'development' || envType === 'production') {
    return envType;
  }
  
  if (!envConfig.BOT_ENV) {
      return null; // No .env file or it's empty
  }

  return 'unknown';
}

function showCurrentEnvironment() {
  const current = getCurrentEnvironment();
  const reset = '\x1b[0m';
  
  console.log('\n📊 Discord Bot Environment Status:');
  
  if (current === null) {
    console.log('   ⚠️  No environment file found (.env)');
    console.log('   💡 Run `npm run env:init` to set up environments.');
  } else if (current === 'unknown') {
    console.log('   ❓ Unknown environment (custom configuration in .env)');
  } else {
    const env = environments[current];
    const envConfig = parseEnvFile('.env');
    console.log(`   ${env.color}✅ ${env.name} Environment${reset}`);
    console.log(`   📍 Project ID: ${envConfig.SUPABASE_PROJECT_ID || 'Not set'}`);
    console.log(`   🌐 Supabase URL: ${envConfig.SUPABASE_URL || 'Not set'}`);
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
  const targetFile = '.env';
  
  // Check if source environment file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Environment file not found: ${sourceFile}`);
    console.log('\n💡 Create the environment file first:');
    console.log(`   npm run env:init`);
    console.log(`   # Then, edit ${sourceFile} with your credentials.`);
    process.exit(1);
  }
  
  try {
    // Read source environment
    const envContent = fs.readFileSync(sourceFile, 'utf8');
    
    // Write to .env
    fs.writeFileSync(targetFile, envContent);
    
    const reset = '\x1b[0m';
    console.log(`\n${envConfig.color}✅ Discord Bot Switched to ${envConfig.name} Environment${reset}`);
    console.log(`   📁 Copied ${sourceFile} → ${targetFile}`);
    
    if (targetEnv === 'production') {
      console.log(`\n⚠️  ${'\x1b[33m'}WARNING: Discord Bot is now in PRODUCTION mode${reset}`);
      console.log('   🚨 Bot will interact with live production data');
    }
    
    console.log('\n🔄 Restart Discord bot to apply changes');
    console.log('   npm start\n');

    showCurrentEnvironment();
    
  } catch (error) {
    console.error('❌ Failed to switch environment:', error.message);
    process.exit(1);
  }
}

function createEnvironmentFiles() {
  console.log('🛠️  Creating Discord Bot environment template files...\n');
  
  const devTemplate = `# 🔽 Discord Bot Development Environment Configuration
# Fill in your Supabase Development Project details below.
SUPABASE_URL=your_dev_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
SUPABASE_PROJECT_ID=your_dev_project_id

# --- Bot Configuration (Development) ---
DISCORD_BOT_TOKEN=your_dev_bot_token
DISCORD_CLIENT_ID=your_dev_client_id

# --- Environment Indicators (Do not change) ---
NODE_ENV=development
BOT_ENV=development
`;

  const prodTemplate = `# 🔼 Discord Bot Production Environment Configuration
# Fill in your Supabase Production Project details below.
SUPABASE_URL=your_prod_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
SUPABASE_PROJECT_ID=your_prod_project_id

# --- Bot Configuration (Production) ---
DISCORD_BOT_TOKEN=your_prod_bot_token
DISCORD_CLIENT_ID=your_prod_client_id

# --- Environment Indicators (Do not change) ---
NODE_ENV=production
BOT_ENV=production
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
  console.log('1. Edit .env.development and .env.production with your actual keys.');
  console.log('2. Run `npm run env:<env>` to select an environment.');
  console.log('3. Start bot: `npm start`\n');
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
