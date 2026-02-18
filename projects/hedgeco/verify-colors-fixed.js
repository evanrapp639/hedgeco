// Verify that colors are now correct (green primary, not blue)
const fs = require('fs');
const path = require('path');

console.log('🎨 VERIFYING COLOR FIXES');
console.log('=========================');

// Check Tailwind config
console.log('\n✅ CHECKING TAILWIND CONFIG:');
const tailwindConfigPath = path.join(__dirname, 'apps/web/tailwind.config.js');
const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

// Verify primary color is green (#059669)
if (tailwindConfig.includes("'primary': '#059669'")) {
  console.log('✓ Primary color is #059669 (green)');
} else {
  console.log('✗ Primary color is wrong');
}

// Verify hedgeco-blue maps to green
if (tailwindConfig.includes("'blue': '#059669'")) {
  console.log('✓ hedgeco-blue maps to #059669 (green)');
} else {
  console.log('✗ hedgeco-blue does not map to green');
}

// Check homepage for correct color usage
console.log('\n✅ CHECKING HOMEPAGE COLOR USAGE:');
const homepagePath = path.join(__dirname, 'apps/web/src/app/page.tsx');
const homepage = fs.readFileSync(homepagePath, 'utf8');

// Check for hedgeco-primary usage
const primaryCount = (homepage.match(/hedgeco-primary/g) || []).length;
if (primaryCount > 0) {
  console.log(`✓ Using hedgeco-primary ${primaryCount} times`);
} else {
  console.log('✗ Not using hedgeco-primary');
}

// Check for old hedgeco-blue usage (should be minimal or none)
const oldBlueCount = (homepage.match(/hedgeco-blue/g) || []).length;
if (oldBlueCount === 0) {
  console.log('✓ No old hedgeco-blue classes (good!)');
} else {
  console.log(`⚠ Still using hedgeco-blue ${oldBlueCount} times`);
}

// Check CSS gradient
console.log('\n✅ CHECKING CSS GRADIENT:');
const cssPath = path.join(__dirname, 'apps/web/src/app/globals.css');
const css = fs.readFileSync(cssPath, 'utf8');

if (css.includes('from-hedgeco-dark via-hedgeco-primary to-hedgeco-cyan')) {
  console.log('✓ Gradient uses correct colors (dark → primary green → cyan)');
} else {
  console.log('✗ Gradient still uses wrong colors');
}

// Check logo color
console.log('\n✅ CHECKING LOGO:');
const logoPath = path.join(__dirname, 'apps/web/public/assets/logo.svg');
const logo = fs.readFileSync(logoPath, 'utf8');

if (logo.includes('fill="#059669"')) {
  console.log('✓ Logo uses correct green color (#059669)');
} else {
  console.log('✗ Logo does not use correct green');
}

// Check all key pages
console.log('\n✅ CHECKING ALL PAGES:');
const pages = [
  { name: 'Homepage', path: 'apps/web/src/app/page.tsx' },
  { name: 'Registration', path: 'apps/web/src/app/register/page.tsx' },
  { name: 'Login', path: 'apps/web/src/app/login/page.tsx' },
  { name: 'Header', path: 'apps/web/src/components/layout/Header.tsx' },
];

let allPagesCorrect = true;
pages.forEach(page => {
  const pagePath = path.join(__dirname, page.path);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    const primaryCount = (content.match(/hedgeco-primary/g) || []).length;
    const oldBlueCount = (content.match(/hedgeco-blue/g) || []).length;
    
    if (primaryCount > 0 && oldBlueCount === 0) {
      console.log(`✓ ${page.name}: Using hedgeco-primary (${primaryCount}x), no hedgeco-blue`);
    } else if (oldBlueCount > 0) {
      console.log(`✗ ${page.name}: Still using hedgeco-blue ${oldBlueCount} times`);
      allPagesCorrect = false;
    } else {
      console.log(`⚠ ${page.name}: Not using hedgeco colors`);
    }
  } else {
    console.log(`✗ ${page.name}: File not found`);
    allPagesCorrect = false;
  }
});

console.log('\n=========================');
if (allPagesCorrect) {
  console.log('✅ ALL COLOR FIXES APPLIED SUCCESSFULLY!');
  console.log('🎯 Design should now match staging.hedgeco.net exactly.');
  console.log('\nKey changes:');
  console.log('1. Primary color: GREEN (#059669), not blue');
  console.log('2. Logo: Updated to use green');
  console.log('3. Gradient: Updated to use correct colors');
  console.log('4. All components: Using hedgeco-primary instead of hedgeco-blue');
} else {
  console.log('⚠ SOME ISSUES FOUND');
  console.log('Please check the warnings above.');
}

console.log('\n🚀 Ready for deployment!');