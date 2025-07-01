#!/usr/bin/env node

/**
 * Unified Environment Switcher
 * Controls both Dashboard and Discord Bot environments consistently
 */

const { execSync } = require('child_process');
const path = require('path');

const projects = [
  {
    name: 'Dashboard',
    path: 'virion-labs-dashboard',
    color: '\x1b[34m' // Blue
  },
  {
    name: 'Discord Bot',
    path: 'virion-labs-discord-bot',
    color: '\x1b[35m' // Magenta
  }
];

function showUsage() {
  console.log(`
🌐 Unified Environment Manager

Usage: npm run env [command]

Commands:
  dev, development    - Switch all services to development
  prod, production    - Switch all services to production
  status             - Show status of all services
  help               - Show this help message

Examples:
  npm run env dev
  npm run env prod
  npm run env status
`);
}

function executeCommand(projectPath, command) {
  try {
    const result = execSync(`cd ${projectPath} && ${command}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function switchAllEnvironments(environment) {
  const reset = '\x1b[0m';
  const envName = environment === 'dev' ? 'development' : 'production';
  
  console.log(`\n🔄 Switching all services to ${envName} environment...\n`);
  
  for (const project of projects) {
    console.log(`${project.color}📋 ${project.name}${reset}`);
    
    const result = executeCommand(project.path, `npm run env:${environment}`);
    
    if (result.success) {
      console.log(`   ✅ Successfully switched to ${envName}`);
    } else {
      console.log(`   ❌ Failed to switch: ${result.error}`);
    }
    console.log('');
  }
  
  if (environment === 'prod') {
    console.log(`⚠️  ${'\x1b[33m'}WARNING: All services are now in PRODUCTION mode${reset}`);
    console.log('🚨 Be extra careful with database operations!');
  }
  
  console.log('\n🔄 Next steps:');
  console.log('1. Restart dashboard: cd virion-labs-dashboard && npm run dev');
  console.log('2. Restart Discord bot: cd virion-labs-discord-bot && npm start');
}

function showAllStatus() {
  const reset = '\x1b[0m';
  
  console.log('\n📊 Environment Status for All Services:\n');
  
  for (const project of projects) {
    console.log(`${project.color}📋 ${project.name}${reset}`);
    
    const result = executeCommand(project.path, 'npm run env:status');
    
    if (result.success) {
      // Extract environment info from the output
      const lines = result.output.split('\n');
      
      // Find lines with environment information
      const envLine = lines.find(line => 
        line.includes('✅') && 
        (line.includes('Development') || line.includes('Production'))
      );
      
      const projectLine = lines.find(line => line.includes('Project ID:'));
      const urlLine = lines.find(line => line.includes('Supabase URL:'));
      
      if (envLine) {
        console.log(`   ${envLine.trim()}`);
        if (projectLine) console.log(`   ${projectLine.trim()}`);
      } else {
        console.log(`   ❓ Unable to determine environment`);
      }
    } else {
      console.log(`   ❌ Unable to get status: ${result.error}`);
    }
    console.log('');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  
  switch (command) {
    case 'dev':
    case 'development':
      switchAllEnvironments('dev');
      break;
      
    case 'prod':
    case 'production':
      switchAllEnvironments('prod');
      break;
      
    case 'status':
      showAllStatus();
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