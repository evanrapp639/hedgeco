import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { 
  BaseJob, 
  ApprovalJob, 
  PublishJob, 
  EmailJob,
  generateJobId 
} from '../shared/types';
import { 
  BaseJobSchema, 
  ApprovalJobSchema, 
  PublishJobSchema, 
  EmailJobSchema 
} from '../shared/schemas';

// Redis connection with persistence
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
});

// Queue configurations
const QUEUE_CONFIGS = {
  email: {
    concurrency: 3,
    priority: ['welcome', 'confirmation', 'notification', 'newsletter'] as const,
  },
  embedding: {
    concurrency: 1,
    priority: ['user_profile', 'fund_data', 'provider_data'] as const,
  },
  webhook: {
    concurrency: 5,
    priority: ['stripe', 'plaid', 'sendgrid', 'slack'] as const,
  },
  notification: {
    concurrency: 10,
    priority: ['urgent', 'alert', 'digest'] as const,
  },
  approval: {
    concurrency: 2,
    priority: ['high_risk', 'medium_risk', 'low_risk'] as const,
  },
  publish: {
    concurrency: 1,
    priority: ['news', 'announcement', 'update'] as const,
  },
};

// Initialize queues
export const queues = {
  email: new Queue('email', { 
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 1000, // Keep last 1000 failed jobs
    }
  }),
  
  embedding: new Queue('embedding', { 
    connection,
    defaultJobOptions: {
      attempts: 2,
      timeout: 30000,
      removeOnComplete: 50,
      removeOnFail: 500,
    }
  }),
  
  webhook: new Queue('webhook', { 
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'fixed', delay: 5000 },
      removeOnComplete: 200,
      removeOnFail: 1000,
    }
  }),
  
  notification: new Queue('notification', { 
    connection,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: true,
    }
  }),
  
  approval: new Queue('approval', { 
    connection,
    defaultJobOptions: {
      attempts: 1, // Approval jobs don't retry automatically
      removeOnComplete: false, // Keep for audit
      removeOnFail: false,
    }
  }),
  
  publish: new Queue('publish', { 
    connection,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    }
  }),
};

// Queue events for monitoring
export const queueEvents = {
  email: new QueueEvents('email', { connection }),
  embedding: new QueueEvents('embedding', { connection }),
  webhook: new QueueEvents('webhook', { connection }),
  notification: new QueueEvents('notification', { connection }),
  approval: new QueueEvents('approval', { connection }),
  publish: new QueueEvents('publish', { connection }),
};

// Job submission with validation and idempotency
export async function submitJob<T extends BaseJob>(
  queueName: keyof typeof queues,
  job: Omit<T, 'jobId' | 'submittedAt'> & { submittedBy: string }
): Promise<string> {
  const queue = queues[queueName];
  
  // Validate job based on queue type
  let validatedJob: any;
  switch (queueName) {
    case 'approval':
      validatedJob = ApprovalJobSchema.parse(job);
      break;
    case 'publish':
      validatedJob = PublishJobSchema.parse(job);
      break;
    case 'email':
      validatedJob = EmailJobSchema.parse(job);
      break;
    default:
      validatedJob = BaseJobSchema.parse(job);
  }
  
  // Generate idempotent job ID
  const jobId = generateJobId(
    validatedJob.action,
    validatedJob.entityId,
    validatedJob.version
  );
  
  // Check if job already exists
  const existingJob = await queue.getJob(jobId);
  if (existingJob) {
    console.log(`Job ${jobId} already exists, skipping duplicate`);
    return jobId;
  }
  
  // Add timestamp
  const jobWithId: T = {
    ...validatedJob,
    jobId,
    submittedAt: new Date().toISOString(),
  } as T;
  
  // Add to queue with priority
  let priority = 0;
  const config = QUEUE_CONFIGS[queueName];
  if (config.priority.includes(job.action as any)) {
    priority = config.priority.indexOf(job.action as any) + 1;
  }
  
  await queue.add(job.action, jobWithId, {
    jobId,
    priority,
  });
  
  console.log(`Job ${jobId} submitted to ${queueName} queue`);
  return jobId;
}

// Initialize workers (to be implemented per queue)
export function initializeWorkers() {
  // Approval worker
  const approvalWorker = new Worker('approval', async (job) => {
    console.log(`Processing approval job: ${job.id}`);
    // TODO: Implement approval logic
    return { status: 'processed', requiresHuman: job.data.metadata?.requiresHuman };
  }, { 
    connection,
    concurrency: QUEUE_CONFIGS.approval.concurrency,
  });
  
  // Publish worker
  const publishWorker = new Worker('publish', async (job) => {
    console.log(`Processing publish job: ${job.id}`);
    // TODO: Implement publish logic
    return { status: 'processed', requiresHuman: job.data.metadata?.requiresHuman };
  }, { 
    connection,
    concurrency: QUEUE_CONFIGS.publish.concurrency,
  });
  
  // Email worker
  const emailWorker = new Worker('email', async (job) => {
    console.log(`Processing email job: ${job.id}`);
    // TODO: Implement email sending with safe send gate
    return { status: 'sent', template: job.data.metadata?.templateKey };
  }, { 
    connection,
    concurrency: QUEUE_CONFIGS.email.concurrency,
  });
  
  return { approvalWorker, publishWorker, emailWorker };
}

// Cleanup function
export async function cleanup() {
  await connection.quit();
  Object.values(queues).forEach(queue => queue.close());
  Object.values(queueEvents).forEach(events => events.close());
}