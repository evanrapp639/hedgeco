const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');

console.log('TailwindCSS:', tailwindcss ? '✓ Found' : '✗ Missing');
console.log('Autoprefixer:', autoprefixer ? '✓ Found' : '✗ Missing');
console.log('PostCSS:', postcss ? '✓ Found' : '✗ Missing');
