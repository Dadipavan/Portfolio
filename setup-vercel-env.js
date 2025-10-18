#!/usr/bin/env node

/**
 * Setup script to add environment variables to Vercel
 * Run this script to automatically set all required environment variables
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.production
const envFile = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envFile, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    envVars[key] = value;
  }
});

console.log('🔧 Setting up Vercel environment variables...');
console.log('Found variables:', Object.keys(envVars));

// Set each environment variable in Vercel
Object.entries(envVars).forEach(([key, value]) => {
  const command = `vercel env add ${key} production`;
  console.log(`\n➡️  Setting ${key}...`);
  console.log(`Run: ${command}`);
  console.log(`Value: ${value}`);
  console.log('---');
});

console.log('\n✅ Copy and run the commands above in your terminal');
console.log('Or set them manually in Vercel dashboard:');
console.log('https://vercel.com/dashboard > Your Project > Settings > Environment Variables');