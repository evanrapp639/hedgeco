// Extract exact colors from staging.hedgeco.net
const https = require('https');
const fs = require('fs');

console.log('🎨 Extracting colors from staging.hedgeco.net...');

const options = {
  hostname: 'staging.hedgeco.net',
  port: 443,
  path: '/',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Extract all color values
    const colorRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const colors = data.match(colorRegex) || [];
    
    // Get unique colors
    const uniqueColors = [...new Set(colors)];
    
    console.log(`\nFound ${uniqueColors.length} unique colors:`);
    console.log('--------------------------------');
    
    // Group by color type
    const hexColors = uniqueColors.filter(c => c.startsWith('#'));
    const rgbColors = uniqueColors.filter(c => c.startsWith('rgb'));
    
    console.log('\nHex Colors:');
    hexColors.forEach(color => {
      console.log(`  ${color}`);
    });
    
    console.log('\nRGB Colors:');
    rgbColors.forEach(color => {
      console.log(`  ${color}`);
    });
    
    // Look for specific elements
    console.log('\n🔍 Checking for specific elements:');
    
    // Check for logo
    if (data.includes('logo') || data.includes('Logo')) {
      console.log('✓ Logo reference found');
    } else {
      console.log('✗ No logo reference found');
    }
    
    // Check for primary button colors
    const buttonColorMatches = data.match(/background-color:[^;]+|color:[^;]+/g) || [];
    const buttonColors = buttonColorMatches.filter(c => 
      c.includes('btn') || c.includes('button') || c.includes('primary')
    );
    
    if (buttonColors.length > 0) {
      console.log('\nButton colors found:');
      buttonColors.slice(0, 5).forEach(color => {
        console.log(`  ${color}`);
      });
    }
    
    // Save colors to file
    const colorData = {
      extractedAt: new Date().toISOString(),
      url: 'https://staging.hedgeco.net',
      hexColors,
      rgbColors,
      sampleHtml: data.substring(0, 5000) // First 5000 chars for reference
    };
    
    fs.writeFileSync(
      '/home/node/.openclaw/workspace/projects/hedgeco/staging-colors.json',
      JSON.stringify(colorData, null, 2)
    );
    
    console.log('\n✅ Colors saved to staging-colors.json');
    console.log('\n🎯 Key findings:');
    console.log('1. Check if our HedgeCo colors match these extracted colors');
    console.log('2. Update Tailwind config if colors are different');
    console.log('3. Verify logo implementation');
  });
});

req.on('error', (error) => {
  console.error('Error fetching staging site:', error.message);
});

req.end();