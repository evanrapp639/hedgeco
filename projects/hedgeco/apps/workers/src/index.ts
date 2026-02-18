import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { createEmailWorker } from './workers/email';
import { createApprovalWorker } from './workers/approval';
import { createPublishWorker } from './workers/publish';
import { createEmbeddingWorker } from './workers/embedding';
import { createWebhookWorker } from './workers/webhook';
import { createNotificationWorker } from './workers/notification';

// Redis connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

// Start all workers
const workers: Worker[] = [];

async function startWorkers() {
  console.log('Starting HedgeCo workers...');
  
  try {
    // Start each worker with appropriate concurrency
    workers.push(
      createEmailWorker(connection, 2),      // 2 concurrent email jobs
      createApprovalWorker(connection, 1),   // 1 at a time (human-in-loop)
      createPublishWorker(connection, 1),    // 1 at a time (compliance-critical)
      createEmbeddingWorker(connection, 1),  // 1 at a time (CPU-heavy)
      createWebhookWorker(connection, 3),    // 3 concurrent webhooks
      createNotificationWorker(connection, 5) // 5 concurrent notifications
    );
    
    console.log(`Started ${workers.length} workers`);
    
    // Log worker events
    workers.forEach(worker => {
      worker.on('completed', (job) => {
        console.log(`Worker ${worker.name}: Job ${job.id} completed`);
      });
      
      worker.on('failed', (job, err) => {
        console.error(`Worker ${worker.name}: Job ${job?.id} failed:`, err.message);
      });
      
      worker.on('error', (err) => {
        console.error(`Worker ${worker.name} error:`, err.message);
      });
    });
    
  } catch (error) {
    console.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down workers...');
  
  await Promise.all(
    workers.map(worker => worker.close())
  );
  
  await connection.quit();
  console.log('Workers shut down');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start if running directly
if (require.main === module) {
  startWorkers();
}

export { startWorkers, shutdown };