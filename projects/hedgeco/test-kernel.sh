#!/bin/bash
# Test the HedgeCo Kernel locally
# Requires: Node.js, Redis

set -e

echo "🧪 Testing HedgeCo Kernel"
echo "========================="

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
  echo "⚠️  redis-cli not found. Install Redis or use: docker run -d -p 6379:6379 redis"
  read -p "Continue without Redis? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✅ Redis is running"
  else
    echo "⚠️  Redis not responding on localhost:6379"
    echo "   Start with: redis-server"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd apps/kernel
npm install
cd ../..

# Build packages
echo "🔨 Building packages..."
cd packages/db
npm install
npm run build
cd ../shared
npm install
npm run build
cd ../..

# Start kernel in background
echo "🚀 Starting kernel..."
cd apps/kernel
npm run build
PORT=3001 REDIS_HOST=localhost REDIS_PORT=6379 REDIS_PASSWORD="" API_KEYS="test-key" ALLOWED_ORIGINS="*" node dist/index.js &
KERNEL_PID=$!
sleep 3

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -s http://localhost:3001/health | jq .

# Test action endpoint (should fail without auth)
echo "🔐 Testing auth requirement..."
curl -s -X POST http://localhost:3001/action \
  -H "Content-Type: application/json" \
  -d '{"agent":"scooby","action":"test","entityId":"test","data":{}}' | jq .

# Test with auth
echo "✅ Testing with auth..."
curl -s -X POST http://localhost:3001/action \
  -H "X-Agent: scooby" \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "scooby",
    "action": "send_welcome_email",
    "entityId": "user_123",
    "data": {
      "email": "test@hedgeco.net",
      "firstName": "Test"
    }
  }' | jq .

# Test safe send
echo "📧 Testing safe send..."
curl -s -X POST http://localhost:3001/email/safe-send \
  -H "X-Agent: velma" \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "audienceDefinition": { "count": 500 },
    "copy": {
      "templateKey": "welcome",
      "templateVersion": 1,
      "renderHash": "abc123",
      "subject": "Welcome",
      "body": "<h1>Welcome</h1>",
      "metadata": {
        "category": "transactional",
        "complianceFlags": [],
        "throttleMs": 1000
      }
    },
    "sendingDomain": "hedgeco.net",
    "throttle": 1000,
    "unsubscribeLink": true,
    "complianceFlags": []
  }' | jq .

# Cleanup
echo "🧹 Cleaning up..."
kill $KERNEL_PID 2>/dev/null || true

echo ""
echo "🎉 Kernel tests completed!"
echo ""
echo "Next steps:"
echo "1. Set up Upstash Redis: ./setup-upstash.sh"
echo "2. Deploy to Railway: see DEPLOYMENT.md"
echo "3. Configure agents with API keys"
echo ""
echo "Quick Railway deploy:"
echo "  railway init"
echo "  railway add --service kernel"
echo "  railway variables set REDIS_HOST=... REDIS_PASSWORD=..."
echo "  railway deploy"