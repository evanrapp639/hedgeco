// Simple test server for HedgeCo Kernel
const http = require('http');
const Redis = require('ioredis');
const { Queue } = require('bullmq');

// Redis connection
const redis = new Redis({
  host: 'clever-ladybird-59195.upstash.io',
  port: 6379,
  password: 'Aec7AAIncDI4OWIxY2ZiZTQ5NWQ0MWVjYTEzMjM1MTc0ZDA4MTA1ZXAyNTkxOTU',
  tls: {},
  maxRetriesPerRequest: null
});

// API keys
const API_KEYS = {
  'd02d1f4fd172a2303eb33f0fb8b4994daf13cd85edb1a899dc999a3dd8e83292': 'scooby',
  'd58606cf0f48743b0abc40d8d70b9c8cd4bc1ada2dedb21ad10032b90a684dc5': 'shaggy',
  '5291c7299f454f00671a5baf7812b9b42796a03e4af8d6610d414720be4059cf': 'daphne',
  'cfb08692ac8c017fc9a8d8d1b0aceb477ec2e8159b6b3534c9ac4e9a80a7c650': 'velma',
  '40d992ad1406e728f164293bd3dfb737491f3672e5c37c20ef514ca25e21c34b': 'fred'
};

// Create queues
const queues = {
  email: new Queue('email', { connection: redis }),
  approval: new Queue('approval', { connection: redis }),
  publish: new Queue('publish', { connection: redis }),
  embedding: new Queue('embedding', { connection: redis }),
  webhook: new Queue('webhook', { connection: redis }),
  notification: new Queue('notification', { connection: redis })
};

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Health endpoint
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'hedgeco-kernel-test',
      timestamp: new Date().toISOString(),
      queues: Object.keys(queues)
    }));
    return;
  }
  
  // Action endpoint
  if (url.pathname === '/action' && req.method === 'POST') {
    // Check authentication
    const authHeader = req.headers.authorization;
    const agentHeader = req.headers['x-agent'];
    
    if (!authHeader || !agentHeader) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing Authorization or X-Agent header' }));
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const expectedAgent = API_KEYS[token];
    
    if (!expectedAgent || expectedAgent !== agentHeader) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API key or agent mismatch' }));
      return;
    }
    
    // Parse body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        
        // Determine queue
        let queueName = 'notification';
        if (data.action.includes('approve') || data.action.includes('verify')) {
          queueName = 'approval';
        } else if (data.action.includes('publish')) {
          queueName = 'publish';
        } else if (data.action.includes('send_')) {
          queueName = 'email';
        }
        
        // Add job
        const job = await queues[queueName].add(data.action, {
          ...data,
          submittedBy: agentHeader,
          timestamp: new Date().toISOString()
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jobId: job.id,
          status: 'queued',
          message: 'Action queued for processing',
          queue: queueName,
          estimatedCompletion: new Date(Date.now() + 60000).toISOString()
        }));
        
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // Queue stats
  if (url.pathname === '/queues' && req.method === 'GET') {
    const stats = {};
    for (const [name, queue] of Object.entries(queues)) {
      const counts = await queue.getJobCounts();
      stats[name] = counts;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      queues: stats
    }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 HedgeCo Kernel Test Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📨 Action: POST http://localhost:${PORT}/action`);
  console.log(`📊 Queues: GET http://localhost:${PORT}/queues`);
  console.log('\n🔑 API Keys:');
  Object.entries(API_KEYS).forEach(([key, agent]) => {
    console.log(`${agent}: ${key}`);
  });
});