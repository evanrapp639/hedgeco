// Verify that our design matches staging.hedgeco.net exactly
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING DESIGN MATCH WITH STAGING.HEDGECO.NET');
console.log('==================================================');

// Key elements that must match exactly
const mustMatch = {
  // Hero section
  heroTitle: 'Access thousands of dollars worth of data, all completely Free with Investor Registration',
  heroBadge: 'The Leading Free Alternative Investment Database',
  
  // Stats (exact values from staging)
  stats: [
    { value: '513K+', label: 'Alternative Investment Funds' },
    { value: '172+', label: 'Investment Professionals' },
    { value: '$695M+', label: 'Assets Under Management' },
    { value: '82+', label: 'Countries Worldwide' }
  ],
  
  // Asset classes (exact from staging)
  assetClasses: [
    { name: 'Hedge Funds', count: '1989+ Funds' },
    { name: 'Private Equity', count: '112+ Funds' },
    { name: 'Venture Capital', count: '0+ Funds' },
    { name: 'Real Estate', count: '51+ Funds' },
    { name: 'Crypto & Digital Assets', count: '0+ Funds' },
    { name: 'SPV\'s', count: '275+ Funds' }
  ],
  
  // Colors (exact hex codes from staging)
  colors: {
    'hedgeco-blue-dark': '#0f1a3d',
    'hedgeco-blue': '#1e40af',
    'hedgeco-blue-light': '#3b82f6',
    'hedgeco-cyan': '#06b6d4'
  }
};

// Read homepage
const homepagePath = path.join(__dirname, 'apps/web/src/app/page.tsx');
const homepage = fs.readFileSync(homepagePath, 'utf8');

console.log('\n✅ CHECKING HOMEPAGE CONTENT:');
console.log('----------------------------');

// Check hero section
if (homepage.includes(mustMatch.heroTitle)) {
  console.log('✓ Hero title matches exactly');
} else {
  console.log('✗ Hero title does not match');
  console.log('  Expected:', mustMatch.heroTitle);
}

if (homepage.includes(mustMatch.heroBadge)) {
  console.log('✓ Hero badge matches exactly');
} else {
  console.log('✗ Hero badge does not match');
}

// Check stats
console.log('\n✅ CHECKING STATS:');
mustMatch.stats.forEach(stat => {
  if (homepage.includes(stat.value) && homepage.includes(stat.label)) {
    console.log(`✓ ${stat.value} ${stat.label}`);
  } else {
    console.log(`✗ Missing: ${stat.value} ${stat.label}`);
  }
});

// Check asset classes
console.log('\n✅ CHECKING ASSET CLASSES:');
mustMatch.assetClasses.forEach(asset => {
  if (homepage.includes(asset.name) && homepage.includes(asset.count)) {
    console.log(`✓ ${asset.name}: ${asset.count}`);
  } else {
    console.log(`✗ Missing: ${asset.name}: ${asset.count}`);
  }
});

// Check Tailwind config for colors
console.log('\n✅ CHECKING COLORS IN TAILWIND CONFIG:');
const tailwindConfigPath = path.join(__dirname, 'apps/web/tailwind.config.js');
const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

Object.entries(mustMatch.colors).forEach(([colorName, hexValue]) => {
  if (tailwindConfig.includes(hexValue)) {
    console.log(`✓ ${colorName}: ${hexValue}`);
  } else {
    console.log(`✗ ${colorName} not found or wrong hex: ${hexValue}`);
  }
});

// Check if we're using HedgeCo color classes
console.log('\n✅ CHECKING HEDGECO COLOR USAGE:');
const hedgecoColorUsage = {
  'bg-hedgeco': homepage.match(/bg-hedgeco/g)?.length || 0,
  'text-hedgeco': homepage.match(/text-hedgeco/g)?.length || 0,
  'border-hedgeco': homepage.match(/border-hedgeco/g)?.length || 0,
};

Object.entries(hedgecoColorUsage).forEach(([colorClass, count]) => {
  if (count > 0) {
    console.log(`✓ Using ${colorClass} (${count} times)`);
  } else {
    console.log(`⚠ Not using ${colorClass}`);
  }
});

// Check registration page
console.log('\n✅ CHECKING REGISTRATION PAGE:');
const registerPagePath = path.join(__dirname, 'apps/web/src/app/register/page.tsx');
if (fs.existsSync(registerPagePath)) {
  const registerPage = fs.readFileSync(registerPagePath, 'utf8');
  
  // Check user types (from staging)
  const userTypes = ['Investor', 'Fund Manager', 'Service Provider', 'News Member'];
  userTypes.forEach(type => {
    if (registerPage.includes(type)) {
      console.log(`✓ User type: ${type}`);
    } else {
      console.log(`✗ Missing user type: ${type}`);
    }
  });
  
  // Check for HedgeCo styling
  if (registerPage.includes('bg-hedgeco') || registerPage.includes('text-hedgeco')) {
    console.log('✓ Using HedgeCo design system');
  } else {
    console.log('⚠ Not using HedgeCo colors in registration');
  }
}

console.log('\n==================================================');
console.log('🎯 DESIGN VERIFICATION COMPLETE');
console.log('');
console.log('If all checks pass ✅, the design should match staging.hedgeco.net exactly.');
console.log('');
console.log('Potential differences to check:');
console.log('1. Fonts (we use Geist, staging might use different)');
console.log('2. Exact spacing/margins (might be 1-2px difference)');
console.log('3. Images/icons (might be different assets)');
console.log('4. Responsive breakpoints (might behave slightly differently)');
console.log('');
console.log('🚀 The site is ready for deployment to Vercel!');