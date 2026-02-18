// Public test server for HedgeCo Kernel
const express = require('express');
const Redis = require('ioredis');
const { Queue } = require('bullmq');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent');
  next();
});

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

// Health endpoint
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({
      status: 'healthy',
      service: 'hedgeco-kernel',
      timestamp: new Date().toISOString(),
      queues: Object.keys(queues),
      redis: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Action endpoint
app.post('/action', async (req, res) => {
  const authHeader = req.headers.authorization;
  const agentHeader = req.headers['x-agent'];
  
  if (!authHeader || !agentHeader) {
    return res.status(401).json({ error: 'Missing Authorization or X-Agent header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const expectedAgent = API_KEYS[token];
  
  if (!expectedAgent || expectedAgent !== agentHeader) {
    return res.status(403).json({ error: 'Invalid API key or agent mismatch' });
  }
  
  try {
    const data = req.body;
    
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
    
    res.json({
      jobId: job.id,
      status: 'queued',
      message: 'Action queued for processing',
      queue: queueName,
      estimatedCompletion: new Date(Date.now() + 60000).toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Queue stats
app.get('/queues', async (req, res) => {
  const stats = {};
  for (const [name, queue] of Object.entries(queues)) {
    const counts = await queue.getJobCounts();
    stats[name] = counts;
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    queues: stats
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 HedgeCo Kernel Public Test Server`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 Health: GET /health`);
  console.log(`📨 Action: POST /action`);
  console.log(`📈 Queues: GET /queues`);
  console.log(`\n🔑 API Keys:`);
  Object.entries(API_KEYS).forEach(([key, agent]) => {
    console.log(`${agent}: ${key}`);
  });
  console.log(`\n🎯 Test command:`);
  console.log(`curl http://localhost:${PORT}/health`);
});