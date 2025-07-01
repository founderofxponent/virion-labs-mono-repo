#!/usr/bin/env node

/**
 * Environment Switcher for Discord Bot
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
🔄 Discord Bot Environment Switcher

Usage: npm run switch-env [environment]

Available environments:
  dev, development    - Switch to development environment
  prod, production    - Switch to production environment
  status, current     - Show current environment
  help                - Show this help message

Examples:
  npm run env:dev
  npm run env:prod
  npm run env:status
`);
}

function getCurrentEnvironment() {
  const envPath = '.env';
  
  if (!fs.existsSync(envPath)) {
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
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
  
  console.log('\n📊 Discord Bot Environment Status:');
  
  if (current === null) {
    console.log('   ⚠️  No environment file found (.env)');
    console.log('   💡 Run switch-env init to set up environments');
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
  const targetFile = '.env';
  
  // Check if source environment file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Environment file not found: ${sourceFile}`);
    console.log('\n💡 Create the environment file first:');
    console.log(`   npm run env:init`);
    process.exit(1);
  }
  
  try {
    // Read source environment
    const envContent = fs.readFileSync(sourceFile, 'utf8');
    
    // Write to .env
    fs.writeFileSync(targetFile, envContent);
    
    const reset = '\x1b[0m';
    console.log(`\n${envConfig.color}✅ Discord Bot Switched to ${envConfig.name} Environment${reset}`);
    console.log(`   📁 Using: ${sourceFile} → ${targetFile}`);
    console.log(`   📍 Project ID: ${envConfig.projectId}`);
    console.log(`   🌐 Supabase URL: ${envConfig.supabaseUrl}`);
    
    if (targetEnv === 'production') {
      console.log(`\n⚠️  ${'\x1b[33m'}WARNING: Discord Bot is now in PRODUCTION mode${reset}`);
      console.log('   🚨 Be extra careful with database operations!');
      console.log('   📋 Bot will interact with live production data');
    }
    
    console.log('\n🔄 Restart Discord bot to apply changes');
    console.log('   npm start\n');
    
  } catch (error) {
    console.error('❌ Failed to switch environment:', error.message);
    process.exit(1);
  }
}

function createEnvironmentFiles() {
  console.log('🛠️  Creating Discord Bot environment template files...\n');
  
  const devTemplate = `# Discord Bot Development Environment Configuration
# Supabase Development Database
SUPABASE_URL=https://xhfrxwyggplhytlopixb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key_here
SUPABASE_PROJECT_ID=xhfrxwyggplhytlopixb

# Discord Bot Configuration (Development)
DISCORD_BOT_TOKEN=your_dev_bot_token_here
DISCORD_CLIENT_ID=your_dev_client_id_here

# Environment Settings
NODE_ENV=development
BOT_ENV=development

# Discord Server Configuration
DISCORD_GUILD_ID=905448362944393218
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=1385186047079616513

# Development Features
DEBUG_MODE=true
VERBOSE_LOGGING=true

# Dashboard Integration
DASHBOARD_URL=http://localhost:3000
WEBHOOK_URL=http://localhost:3000

# Database Pool Settings (Development)
DB_POOL_SIZE=5
DB_TIMEOUT=30000
`;

  const prodTemplate = `# Discord Bot Production Environment Configuration
# Supabase Production Database
SUPABASE_URL=https://mcynacktfmtzkkohctps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key_here
SUPABASE_PROJECT_ID=mcynacktfmtzkkohctps

# Discord Bot Configuration (Production)
DISCORD_BOT_TOKEN=your_prod_bot_token_here
DISCORD_CLIENT_ID=your_prod_client_id_here

# Environment Settings
NODE_ENV=production
BOT_ENV=production

# Discord Server Configuration
DISCORD_GUILD_ID=905448362944393218
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=1385186047079616513

# Production Features
DEBUG_MODE=false
VERBOSE_LOGGING=false

# Dashboard Integration
DASHBOARD_URL=https://your-production-domain.com
WEBHOOK_URL=https://your-production-domain.com

# Database Pool Settings (Production)
DB_POOL_SIZE=10
DB_TIMEOUT=60000
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
  console.log('2. Run: npm run env:dev');
  console.log('3. Start bot: npm start\n');
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
