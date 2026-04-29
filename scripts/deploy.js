#!/usr/bin/env node
/**
 * One-click deployment script
 * Usage: node scripts/deploy.js
 * Flow: generate content → build → push to GitHub → Vercel auto-deploys
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...options });
}

function main() {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const skipPush = args.includes('--skip-push');

  console.log('🚀 Starting deployment...\n');

  // 1. Check environment
  const envFile = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) {
    console.warn('⚠️ No .env file found, ads may not display');
    console.warn('   Copy .env.example to .env and fill in your config\n');
  }

  // 2. Install dependencies
  try {
    run('npm install', { cwd: path.join(__dirname, '..') });
  } catch {
    console.log('Dependencies up to date');
  }

  // 3. Build
  if (!skipBuild) {
    console.log('\n🔨 Building site...');
    run('npm run build', { cwd: path.join(__dirname, '..') });
  }

  // 4. Push to GitHub
  if (!skipPush) {
    console.log('\n📤 Pushing to GitHub...');

    const gitStatus = execSync('git status --porcelain', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });

    if (!gitStatus.trim()) {
      console.log('No changes to commit');
      return;
    }

    const commitMsg = args.find(a => a.startsWith('--message='))?.split('=')[1]
      || `Update content: ${new Date().toISOString().slice(0, 10)}`;

    run('git add -A', { cwd: path.join(__dirname, '..') });
    run(`git commit -m "${commitMsg}"`, { cwd: path.join(__dirname, '..') });

    try {
      run('git push origin main', { cwd: path.join(__dirname, '..') });
      console.log('\n✅ Push successful! Vercel will auto-deploy...');
    } catch {
      console.log('\nTrying HTTPS push...');
      run('git remote -v', { cwd: path.join(__dirname, '..') });
    }
  }

  console.log('\n🎉 Deployment complete!');
  console.log('   Check Vercel Dashboard for deploy status');
}

main();
