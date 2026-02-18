#!/usr/bin/env node

/**
 * Script to extract UI assets from staging.hedgeco.net
 * Run with: node extract-ui-assets.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'apps/web/public/assets');
const CSS_DIR = path.join(__dirname, 'apps/web/src/styles');

// Create directories if they don't exist
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(CSS_DIR)) fs.mkdirSync(CSS_DIR, { recursive: true });

// Assets to download
const assets = [
  { url: 'https://staging.hedgeco.net/images/logo.png', filename: 'logo.png' },
  { url: 'https://staging.hedgeco.net/favicon.ico', filename: 'favicon.ico' },
  { url: 'https://staging.hedgeco.net/images/logo.svg', filename: 'logo.svg' },
  { url: 'https://staging.hedgeco.net/css/style.css', filename: 'original-styles.css' },
];

// Color extraction from manual analysis
const colors = {
  // From hero section gradient
  'hedgeco-blue-dark': '#0f1a3d',
  'hedgeco-blue': '#1e40af',
  'hedgeco-blue-light': '#3b82f6',
  'hedgeco-cyan': '#06b6d4',
  
  // Background colors
  'hedgeco-dark': '#0f172a',
  'hedgeco-light': '#f8fafc',
  'hedgeco-white': '#ffffff',
  
  // Text colors
  'hedgeco-text-dark': '#1e293b',
  'hedgeco-text': '#475569',
  'hedgeco-text-light': '#64748b',
  
  // Accent colors
  'hedgeco-green': '#10b981',
  'hedgeco-purple': '#8b5cf6',
  'hedgeco-orange': '#f97316',
  'hedgeco-red': '#ef4444',
  
  // Border colors
  'hedgeco-border': '#e2e8f0',
  'hedgeco-border-dark': '#cbd5e1',
};

// Font stack from manual analysis
const fonts = {
  'hedgeco-sans': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  'hedgeco-mono': "'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace",
};

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(ASSETS_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${filename}`);
          resolve(filepath);
        });
      } else if (response.statusCode === 404) {
        console.log(`⚠️  Not found: ${url}`);
        resolve(null);
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      console.log(`⚠️  Could not download ${url}: ${err.message}`);
      resolve(null);
    });
  });
}

async function extractColorsAndFonts() {
  console.log('🎨 Extracting colors and fonts...');
  
  // Create Tailwind config extension
  const tailwindConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 2).replace(/"([^"]+)":/g, '$1:')},
      fontFamily: ${JSON.stringify(fonts, null, 2).replace(/"([^"]+)":/g, '$1:')},
      backgroundImage: {
        'hedgeco-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'hedgeco-grid': "url('/assets/grid.svg')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
};
`;

  // Create CSS variables file
  const cssVariables = `
/* HedgeCo.Net Design System - Exact replication of staging.hedgeco.net */

:root {
  /* Primary Colors */
  --hedgeco-blue-dark: #0f1a3d;
  --hedgeco-blue: #1e40af;
  --hedgeco-blue-light: #3b82f6;
  --hedgeco-cyan: #06b6d4;
  
  /* Background Colors */
  --hedgeco-dark: #0f172a;
  --hedgeco-light: #f8fafc;
  --hedgeco-white: #ffffff;
  
  /* Text Colors */
  --hedgeco-text-dark: #1e293b;
  --hedgeco-text: #475569;
  --hedgeco-text-light: #64748b;
  
  /* Accent Colors */
  --hedgeco-green: #10b981;
  --hedgeco-purple: #8b5cf6;
  --hedgeco-orange: #f97316;
  --hedgeco-red: #ef4444;
  
  /* Border Colors */
  --hedgeco-border: #e2e8f0;
  --hedgeco-border-dark: #cbd5e1;
  
  /* Typography */
  --hedgeco-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --hedgeco-font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Courier New', monospace;
  
  /* Spacing */
  --hedgeco-spacing-xs: 0.25rem;
  --hedgeco-spacing-sm: 0.5rem;
  --hedgeco-spacing-md: 1rem;
  --hedgeco-spacing-lg: 1.5rem;
  --hedgeco-spacing-xl: 2rem;
  --hedgeco-spacing-2xl: 3rem;
  
  /* Border Radius */
  --hedgeco-radius-sm: 0.25rem;
  --hedgeco-radius: 0.5rem;
  --hedgeco-radius-lg: 0.75rem;
  --hedgeco-radius-xl: 1rem;
  
  /* Shadows */
  --hedgeco-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --hedgeco-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --hedgeco-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --hedgeco-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Utility Classes */
.bg-hedgeco-gradient {
  background: linear-gradient(135deg, var(--hedgeco-blue-dark) 0%, var(--hedgeco-blue) 50%, var(--hedgeco-cyan) 100%);
}

.text-hedgeco-gradient {
  background: linear-gradient(135deg, var(--hedgeco-blue-light) 0%, var(--hedgeco-cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Component Styles */
.hedgeco-card {
  background: var(--hedgeco-white);
  border: 1px solid var(--hedgeco-border);
  border-radius: var(--hedgeco-radius-lg);
  box-shadow: var(--hedgeco-shadow);
  transition: all 0.2s ease;
}

.hedgeco-card:hover {
  border-color: var(--hedgeco-blue-light);
  box-shadow: var(--hedgeco-shadow-lg);
}

.hedgeco-button-primary {
  background: linear-gradient(135deg, var(--hedgeco-blue) 0%, var(--hedgeco-blue-light) 100%);
  color: white;
  border: none;
  border-radius: var(--hedgeco-radius);
  padding: var(--hedgeco-spacing-sm) var(--hedgeco-spacing-xl);
  font-weight: 600;
  transition: all 0.2s ease;
}

.hedgeco-button-primary:hover {
  background: linear-gradient(135deg, var(--hedgeco-blue-dark) 0%, var(--hedgeco-blue) 100%);
  transform: translateY(-1px);
  box-shadow: var(--hedgeco-shadow-lg);
}
`;

  // Write files
  fs.writeFileSync(path.join(__dirname, 'tailwind-hedgeco.js'), tailwindConfig);
  fs.writeFileSync(path.join(CSS_DIR, 'hedgeco-design-system.css'), cssVariables);
  
  console.log('✅ Created design system files');
  console.log('📁 tailwind-hedgeco.js');
  console.log('📁 apps/web/src/styles/hedgeco-design-system.css');
}

async function main() {
  console.log('🚀 Starting UI asset extraction from staging.hedgeco.net\n');
  
  // Download assets
  for (const asset of assets) {
    await downloadFile(asset.url, asset.filename);
  }
  
  // Extract colors and create design system
  await extractColorsAndFonts();
  
  console.log('\n🎉 Asset extraction complete!');
  console.log('\nNext steps:');
  console.log('1. Merge tailwind-hedgeco.js with your tailwind.config.ts');
  console.log('2. Import hedgeco-design-system.css in globals.css');
  console.log('3. Update components to use HedgeCo design system');
  console.log('4. Replace logo in layout.tsx');
}

main().catch(console.error);