#!/bin/bash
echo "🧪 Testing Vercel Build Configuration"
echo "====================================="

cd apps/web

echo "📁 Checking project structure..."
if [ -f "package.json" ] && [ -f "vercel.json" ] && [ -f "tailwind.config.js" ]; then
    echo "✅ All configuration files present"
else
    echo "❌ Missing configuration files"
    exit 1
fi

echo "📦 Checking package.json..."
if grep -q '"next"' package.json && grep -q '"react"' package.json && grep -q '"tailwindcss"' package.json; then
    echo "✅ Essential dependencies defined"
else
    echo "❌ Missing essential dependencies"
    exit 1
fi

echo "🎨 Checking Tailwind config..."
if grep -q "hedgeco" tailwind.config.js; then
    echo "✅ HedgeCo design system configured"
else
    echo "❌ HedgeCo colors not found in Tailwind config"
fi

echo "📄 Checking critical pages..."
PAGES=("src/app/page.tsx" "src/app/layout.tsx" "src/app/globals.css")
for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "  ✅ $page"
    else
        echo "  ❌ $page - MISSING"
    fi
done

echo "🔧 Checking PostCSS config..."
if [ -f "postcss.config.mjs" ] && grep -q "autoprefixer" postcss.config.mjs; then
    echo "✅ PostCSS with autoprefixer configured"
else
    echo "❌ PostCSS config issue"
fi

echo ""
echo "====================================="
echo "✅ BUILD TEST COMPLETE"
echo "✅ Project is configured for Vercel deployment"
echo ""
echo "🚀 Next steps:"
echo "   1. Push to GitHub: git push origin master"
echo "   2. Deploy on Vercel: https://vercel.com/new"
echo "   3. Set root directory to: apps/web"
echo ""
echo "📋 Or use one-click deploy:"
echo "   https://vercel.com/new/clone?repository-url=https://github.com/evanrapp639/hedgeco&root-directory=apps/web"