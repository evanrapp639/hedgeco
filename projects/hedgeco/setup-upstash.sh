#!/bin/bash
# Setup script for HedgeCo.Net Upstash Redis
# Requires: curl, jq, Upstash account

set -e

echo "🚀 HedgeCo.Net Upstash Redis Setup"
echo "=================================="

# Check for required tools
command -v curl >/dev/null 2>&1 || { echo "Error: curl is required"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "Error: jq is required"; exit 1; }

# Get Upstash credentials
read -p "Enter your Upstash email: " UPSTASH_EMAIL
read -sp "Enter your Upstash password: " UPSTASH_PASSWORD
echo
read -p "Enter your Upstash account ID (find at https://console.upstash.com/account): " UPSTASH_ACCOUNT_ID

# Login and get token
echo "🔐 Logging into Upstash..."
LOGIN_RESPONSE=$(curl -s -X POST https://api.upstash.com/v2/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UPSTASH_EMAIL\",\"password\":\"$UPSTASH_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Check credentials."
  exit 1
fi

echo "✅ Logged in successfully"

# Create Redis database
echo "🛠️ Creating Redis database..."
DB_RESPONSE=$(curl -s -X POST https://api.upstash.com/v2/redis/database \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"hedgeco-kernel\",
    \"region\": \"us-east-1\",
    \"tls\": true,
    \"eviction\": false,
    \"auto_scale\": false,
    \"memory\": 256,
    \"account_id\": \"$UPSTASH_ACCOUNT_ID\"
  }")

DB_ID=$(echo "$DB_RESPONSE" | jq -r '.database_id')
if [ "$DB_ID" = "null" ] || [ -z "$DB_ID" ]; then
  echo "❌ Failed to create database"
  exit 1
fi

echo "✅ Database created: $DB_ID"

# Get database credentials
echo "📋 Fetching database credentials..."
CREDS_RESPONSE=$(curl -s -X GET "https://api.upstash.com/v2/redis/database/$DB_ID" \
  -H "Authorization: Bearer $TOKEN")

REDIS_HOST=$(echo "$CREDS_RESPONSE" | jq -r '.endpoint')
REDIS_PORT=$(echo "$CREDS_RESPONSE" | jq -r '.port')
REDIS_PASSWORD=$(echo "$CREDS_RESPONSE" | jq -r '.password')

if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PASSWORD" ]; then
  echo "❌ Failed to get credentials"
  exit 1
fi

echo ""
echo "🎉 Upstash Redis Setup Complete!"
echo "================================"
echo ""
echo "📊 Database Details:"
echo "   Name: hedgeco-kernel"
echo "   Region: us-east-1"
echo "   Memory: 256MB"
echo "   TLS: Enabled"
echo ""
echo "🔑 Connection Details:"
echo "   REDIS_HOST: $REDIS_HOST"
echo "   REDIS_PORT: $REDIS_PORT"
echo "   REDIS_PASSWORD: $REDIS_PASSWORD"
echo ""
echo "🔗 Redis URL: redis://:$REDIS_PASSWORD@$REDIS_HOST:$REDIS_PORT"
echo ""
echo "📝 Next Steps:"
echo "1. Add these to your Railway environment variables"
echo "2. Test connection with: redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD PING"
echo "3. Deploy your kernel and workers"
echo ""
echo "💡 Tip: Enable 'Daily Backup' in Upstash console for data persistence"

# Create .env.example for kernel
cat > apps/kernel/.env.example << EOF
# Upstash Redis Configuration
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=$REDIS_PASSWORD

# API Security
API_KEYS=scooby-key-$(openssl rand -hex 16),shaggy-key-$(openssl rand -hex 16),daphne-key-$(openssl rand -hex 16),velma-key-$(openssl rand -hex 16),fred-key-$(openssl rand -hex 16)

# CORS
ALLOWED_ORIGINS=https://hedgeco.net,https://staging.hedgeco.net,http://localhost:3000

# Server
PORT=3001
NODE_ENV=production
EOF

echo "📁 Created apps/kernel/.env.example with your credentials"
echo "⚠️  Remember to keep your password secure!"