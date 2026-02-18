import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { queues, submitJob, initializeWorkers, cleanup } from './queues';
import { checkPermission, evaluateSafeSend } from './gates';
import { logAction, updateAuditOutcome, queryAuditLog, logAgentAction } from './audit';
import { 
  AgentActionRequestSchema, 
  AgentActionResponseSchema,
  SafeSendRequestSchema,
  SafeSendResultSchema,
} from './shared/schemas';
import { AgentRole, AgentPermission } from './shared/types';

// Initialize Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Agent', 'X-Action'],
  maxAge: 86400,
}));

// Authentication middleware (simplified - in production use JWT)
app.use('*', async (c, next) => {
  const agent = c.req.header('X-Agent') as AgentRole;
  const apiKey = c.req.header('Authorization');
  
  if (!agent || !apiKey) {
    return c.json({ error: 'Missing X-Agent or Authorization header' }, 401);
  }
  
  // Validate API key (in production, check against database)
  const validApiKeys = process.env.API_KEYS?.split(',') || [];
  if (!validApiKeys.includes(apiKey.replace('Bearer ', ''))) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  // Validate agent
  const validAgents: AgentRole[] = ['scooby', 'shaggy', 'daphne', 'velma', 'fred'];
  if (!validAgents.includes(agent)) {
    return c.json({ error: `Invalid agent: ${agent}` }, 401);
  }
  
  c.set('agent', agent);
  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    queues: Object.keys(queues),
  });
});

// Submit agent action
app.post(
  '/action',
  zValidator('json', AgentActionRequestSchema),
  async (c) => {
    const agent = c.get('agent') as AgentRole;
    const request = c.req.valid('json');
    
    // Check permissions
    const permissionResult = checkPermission(
      agent,
      AgentPermission.WRITE,
      request.action,
      request.entityId
    );
    
    // Log the action
    const auditId = logAction(
      agent,
      request.action,
      request.entityId,
      'agent_action',
      { request, permissionResult }
    );
    
    if (!permissionResult.allowed) {
      updateAuditOutcome(auditId, 'failure', { permissionResult });
      return c.json({
        jobId: null,
        status: 'blocked',
        message: 'Permission denied',
        reasons: permissionResult.reasons,
        suggestedActions: permissionResult.suggestedActions,
      }, 403);
    }
    
    // Determine which queue to use
    let queueName: keyof typeof queues = 'notification'; // default
    
    if (request.action.includes('approve') || request.action.includes('verify') || request.action.includes('upgrade')) {
      queueName = 'approval';
    } else if (request.action.includes('publish')) {
      queueName = 'publish';
    } else if (request.action.includes('send_')) {
      queueName = 'email';
    } else if (request.action.includes('embed')) {
      queueName = 'embedding';
    } else if (request.action.includes('webhook')) {
      queueName = 'webhook';
    }
    
    try {
      // Submit to queue
      const jobId = await submitJob(queueName, {
        ...request,
        submittedBy: agent,
        version: 1,
      });
      
      const response: z.infer<typeof AgentActionResponseSchema> = {
        jobId,
        status: permissionResult.requiresApproval ? 'requires_approval' : 'queued',
        message: permissionResult.requiresApproval 
          ? 'Action requires human approval' 
          : 'Action queued for processing',
        approvalRequired: permissionResult.requiresApproval,
        estimatedCompletion: permissionResult.requiresApproval
          ? new Date(Date.now() + 3600000).toISOString() // 1 hour for approval
          : new Date(Date.now() + 60000).toISOString(), // 1 minute for processing
      };
      
      // Log the response
      logAgentAction(request, response);
      updateAuditOutcome(auditId, 'success', { jobId, response });
      
      return c.json(response);
      
    } catch (error) {
      console.error('Error submitting job:', error);
      updateAuditOutcome(auditId, 'failure', { error: error.message });
      
      return c.json({
        jobId: null,
        status: 'error',
        message: 'Failed to submit job',
        error: error.message,
      }, 500);
    }
  }
);

// Safe send gate for emails
app.post(
  '/email/safe-send',
  zValidator('json', SafeSendRequestSchema),
  async (c) => {
    const agent = c.get('agent') as AgentRole;
    const request = c.req.valid('json');
    
    // Log the request
    const auditId = logAction(
      agent,
      'safe_send_evaluation',
      `email_${Date.now()}`,
      'email',
      { request }
    );
    
    // Evaluate safe send
    const result = evaluateSafeSend(request);
    
    updateAuditOutcome(auditId, 'success', { result });
    
    return c.json(result);
  }
);

// Audit log queries
app.get('/audit', async (c) => {
  const agent = c.get('agent') as AgentRole;
  
  // Only scooby can query audit log
  if (agent !== 'scooby') {
    return c.json({ error: 'Only scooby agent can query audit log' }, 403);
  }
  
  const filters = {
    agent: c.req.query('agent'),
    action: c.req.query('action'),
    entityId: c.req.query('entityId'),
    entityType: c.req.query('entityType'),
    outcome: c.req.query('outcome'),
    startTime: c.req.query('startTime'),
    endTime: c.req.query('endTime'),
    limit: c.req.query('limit') ? parseInt(c.req.query('limit')) : undefined,
  };
  
  const entries = queryAuditLog(filters);
  
  return c.json({
    count: entries.length,
    entries,
    filters,
  });
});

// Job status
app.get('/job/:jobId', async (c) => {
  const agent = c.get('agent') as AgentRole;
  const jobId = c.req.param('jobId');
  
  // Check all queues for the job
  let job = null;
  let queueName = '';
  
  for (const [name, queue] of Object.entries(queues)) {
    const found = await queue.getJob(jobId);
    if (found) {
      job = found;
      queueName = name;
      break;
    }
  }
  
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  
  // Get job state
  const state = await job.getState();
  
  return c.json({
    jobId,
    queue: queueName,
    state,
    data: job.data,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  });
});

// Queue statistics
app.get('/queues', async (c) => {
  const agent = c.get('agent') as AgentRole;
  
  if (agent !== 'scooby') {
    return c.json({ error: 'Only scooby agent can view queue stats' }, 403);
  }
  
  const stats: Record<string, any> = {};
  
  for (const [name, queue] of Object.entries(queues)) {
    const counts = await queue.getJobCounts();
    stats[name] = {
      counts,
      isPaused: await queue.isPaused(),
    };
  }
  
  return c.json({
    timestamp: new Date().toISOString(),
    queues: stats,
  });
});

// Error handling
app.onError((err, c) => {
  console.error('Kernel error:', err);
  
  const agent = c.get('agent') as AgentRole;
  logAction(
    agent || 'unknown',
    'kernel_error',
    'kernel',
    'system',
    { error: err.message, stack: err.stack },
    'failure'
  );
  
  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  }, 500);
});

// Initialize workers
const workers = initializeWorkers();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

// Export the app
export default app;

// Start server if running directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3001');
  console.log(`Kernel server starting on port ${port}`);
  
  const server = {
    port,
    fetch: app.fetch,
  };
  
  // In production, you would use something like:
  // serve(server, { port });
  
  // For now, just log
  console.log(`Kernel API available at http://localhost:${port}`);
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  POST /action');
  console.log('  POST /email/safe-send');
  console.log('  GET  /audit');
  console.log('  GET  /job/:jobId');
  console.log('  GET  /queues');
}