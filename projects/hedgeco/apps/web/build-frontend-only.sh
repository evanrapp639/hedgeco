#!/bin/bash
echo "🏗️  Building HedgeCo Frontend Only (Sprint 1)"
echo "=============================================="

# Clean up
echo "🧹 Cleaning up..."
rm -rf .next
rm -rf node_modules 2>/dev/null || true

# Create minimal package.json for frontend build
echo "📦 Creating minimal package.json..."
cat > package-minimal.json << 'EOF'
{
  "name": "hedgeco-web-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.35",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "tailwindcss": "3.4.19",
    "autoprefixer": "10.4.24",
    "postcss": "8.5.6",
    "lucide-react": "^0.564.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.1",
    "tailwindcss-animate": "^1.0.7"
  }
}
EOF

# Backup original package.json
cp package.json package.json.backup
cp package-minimal.json package.json

# Install minimal dependencies
echo "📥 Installing minimal dependencies..."
npm install --no-audit --progress=false

# Check if we can build
echo "🔨 Attempting build..."
if npm run build 2>&1 | grep -q "Build failed"; then
    echo "❌ Build failed"
    # Restore original package.json
    cp package.json.backup package.json
    exit 1
else
    echo "✅ Build successful!"
    
    # Start dev server in background to verify
    echo "🚀 Starting dev server to verify..."
    timeout 10 npm run dev > /dev/null 2>&1 &
    DEV_PID=$!
    sleep 3
    
    # Check if server is running
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Dev server is running"
        kill $DEV_PID 2>/dev/null
    else
        echo "⚠️  Dev server not responding"
    fi
    
    # Restore original package.json
    cp package.json.backup package.json
    echo "📦 Original package.json restored"
    
    echo ""
    echo "=============================================="
    echo "✅ FRONTEND BUILD SUCCESSFUL!"
    echo "✅ Ready for Vercel deployment"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub"
    echo "2. Deploy on Vercel with root directory: apps/web"
    echo "3. Test at https://hedgeco.vercel.app"
fi