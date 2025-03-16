/**
 * Cloudflare Pages Deployment Helper Script
 * 
 * This script helps prepare your files for deployment to Cloudflare Pages
 * It checks for required files and provides guidance on deployment
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Try to load chalk, and if it's not installed, use a simple alternative
let log = {
  info: (msg) => console.log(`INFO: ${msg}`),
  success: (msg) => console.log(`SUCCESS: ${msg}`),
  warning: (msg) => console.log(`WARNING: ${msg}`),
  error: (msg) => console.log(`ERROR: ${msg}`)
};

try {
  // Check if chalk is available
  require.resolve('chalk');
  log = {
    info: (msg) => console.log(chalk.blue(`ℹ️ ${msg}`)),
    success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
    warning: (msg) => console.log(chalk.yellow(`⚠️ ${msg}`)),
    error: (msg) => console.log(chalk.red(`❌ ${msg}`))
  };
} catch (e) {
  console.log('Note: Install chalk for colored output: npm install chalk');
}

// Files to check for
const requiredFiles = [
  { path: '_headers', importance: 'recommended' },
  { path: '_redirects', importance: 'recommended' },
  { path: '404.html', importance: 'recommended' },
  { path: 'wrangler.toml', importance: 'optional' },
  { path: '.cloudflare/pages.toml', importance: 'optional' },
  { path: 'functions/_middleware.js', importance: 'optional' },
  { path: 'workers-site/index.js', importance: 'optional' }
];

// Check if all required files exist
function checkRequiredFiles() {
  log.info('Checking for required deployment files...');
  
  let allFound = true;
  let foundCount = 0;
  let missingRequired = 0;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(__dirname, file.path))) {
      foundCount++;
      log.success(`Found ${file.path}`);
    } else {
      if (file.importance === 'required') {
        log.error(`Missing required file: ${file.path}`);
        allFound = false;
        missingRequired++;
      } else if (file.importance === 'recommended') {
        log.warning(`Missing recommended file: ${file.path}`);
      } else {
        log.info(`Missing optional file: ${file.path}`);
      }
    }
  }
  
  return { success: missingRequired === 0, foundCount, total: requiredFiles.length };
}

// Provide deployment instructions
function showDeploymentInstructions() {
  log.info('\n=== CLOUDFLARE PAGES DEPLOYMENT INSTRUCTIONS ===\n');
  
  log.info('1. Login to your Cloudflare Dashboard at https://dash.cloudflare.com');
  log.info('2. Navigate to Pages from the sidebar');
  log.info('3. Click "Create a project" and select "Connect to Git"');
  log.info('4. Select your GitHub repository and configure the following:');
  log.info('   - Project name: utilix-games (or your preferred name)');
  log.info('   - Production branch: main');
  log.info('   - Build command: (leave empty)');
  log.info('   - Build output directory: / (root)');
  log.info('5. Click "Save and Deploy"');
  
  log.info('\nOnce deployed, you can configure custom domains in the Pages project settings.');
  log.success('Your site is now ready for Cloudflare Pages deployment!');
}

// Main function
function main() {
  console.log('\n=== CLOUDFLARE PAGES DEPLOYMENT HELPER ===\n');
  
  const { success, foundCount, total } = checkRequiredFiles();
  
  if (success) {
    log.success(`\nFound ${foundCount}/${total} deployment files`);
    log.success('Your project is ready for Cloudflare Pages deployment!');
    showDeploymentInstructions();
  } else {
    log.error(`\nOnly found ${foundCount}/${total} deployment files`);
    log.warning('Some required files are missing. Please create them before deployment.');
  }
}

// Run the main function
main(); 