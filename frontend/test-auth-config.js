#!/usr/bin/env node

/**
 * Test script to verify Supabase authentication configuration
 * Run with: node test-auth-config.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Supabase Authentication Configuration\n');

// Check environment variables
const envVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'NEXT_PUBLIC_SITE_URL': process.env.NEXT_PUBLIC_SITE_URL,
  'NODE_ENV': process.env.NODE_ENV
};

console.log('📋 Environment Variables:');
Object.entries(envVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? (key.includes('KEY') ? `${value.substring(0, 10)}...` : value) : 'NOT SET';
  console.log(`  ${status} ${key}: ${displayValue}`);
});

console.log('\n🔗 Redirect URL Configuration:');

// Simulate the redirect URL logic
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/confirm`;
  } else {
    return process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`
      : 'http://localhost:3000/auth/confirm';
  }
};

const redirectUrl = getRedirectUrl();
console.log(`  📍 Detected redirect URL: ${redirectUrl}`);

// Check if it's localhost or production
if (redirectUrl.includes('localhost')) {
  console.log('  🏠 Environment: Development (localhost)');
} else if (redirectUrl.includes('vercel.app')) {
  console.log('  🚀 Environment: Production (Vercel)');
} else {
  console.log('  ❓ Environment: Unknown');
}

console.log('\n📝 Next Steps:');
console.log('1. Make sure your Supabase dashboard has these redirect URLs configured:');
console.log('   - http://localhost:3000/auth/confirm');
console.log('   - https://max-wonkage.vercel.app/auth/confirm');
console.log('');
console.log('2. For production, set NEXT_PUBLIC_SITE_URL in Vercel dashboard:');
console.log('   NEXT_PUBLIC_SITE_URL=https://max-wonkage.vercel.app');
console.log('');
console.log('3. Test the flow:');
console.log('   - Sign up with an email');
console.log('   - Check the confirmation email');
console.log('   - Verify the link points to the correct domain');

console.log('\n✅ Configuration test complete!');
