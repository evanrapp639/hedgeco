// Test deployment script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up HedgeCo Kernel test deployment...');

// Create .env file
const envContent = `REDIS_HOST=clever-ladybird-59195.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=Aec7AAIncDI4OWIxY2ZiZTQ5NWQ0MWVjYTEzMjM1MTc0ZDA4MTA1ZXAyNTkxOTU
API_KEYS=d02d1f4fd172a2303eb33f0fb8b4994daf13cd85edb1a899dc999a3dd8e83292,d58606cf0f48743b0abc40d8d70b9c8cd4bc1ada2dedb21ad10032b90a684dc5,5291c7299f454f00671a5baf7812b9b42796a03e4af8d6610d414720be4059cf,cfb08692ac8c017fc9a8d8d1b0aceb477ec2e8159b6b3534c9ac4e9a80a7c650,40d992ad1406e728f164293bd3dfb737491f3672e5c37c20ef514ca25e21c34b
ALLOWED_ORIGINS=*
PORT=3001
NODE_ENV=production`;

fs.writeFileSync('.env', envContent);
console.log('✅ Created .env file');

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install --no-audit --no-fund', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  npm install failed, trying with --legacy-peer-deps');
  execSync('npm install --legacy-peer-deps --no-audit --no-fund', { stdio: 'inherit' });
}

// Build TypeScript
console.log('🔨 Building TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  TypeScript build failed, using tsx instead');
}

// Start server
console.log('🌐 Starting kernel server...');
console.log('\n📋 API Keys:');
console.log('Scooby:  d02d1f4fd172a2303eb33f0fb8b4994daf13cd85edb1a899dc999a3dd8e83292');
console.log('Shaggy:  d58606cf0f48743b0abc40d8d70b9c8cd4bc1ada2dedb21ad10032b90a684dc5');
console.log('Daphne:  5291c7299f454f00671a5baf7812b9b42796a03e4af8d6610d414720be4059cf');
console.log('Velma:   cfb08692ac8c017fc9a8d8d1b0aceb477ec2e8159b6b3534c9ac4e9a80a7c650');
console.log('Fred:    40d992ad1406e728f164293bd3dfb737491f3672e5c37c20ef514ca25e21c34b');
console.log('\n🔗 Test endpoints:');
console.log('Health:    curl http://localhost:3001/health');
console.log('Action:    curl -X POST http://localhost:3001/action \\');
console.log('  -H "X-Agent: scooby" \\');
console.log('  -H "Authorization: Bearer d02d1f4fd172a2303eb33f0fb8b4994daf13cd85edb1a899dc999a3dd8e83292" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"agent":"scooby","action":"test","entityId":"test","data":{}}\'');
console.log('\n🚀 Server starting...');

// Start the server
const { spawn } = require('child_process');
const server = spawn('npx', ['tsx', 'src/index.ts'], { stdio: 'inherit' });

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
});