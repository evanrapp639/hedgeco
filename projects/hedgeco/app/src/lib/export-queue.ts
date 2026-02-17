/**
 * Export Queue Service
 * Sprint 8: HedgeCo.Net
 * 
 * Handles queuing and processing of large export jobs
 */

import { prisma } from './prisma';
import { exportFundsToCSV, exportFundsToExcel, exportUsersToCSV, exportAnalyticsToExcel } from './bulk-export';
import type { FundExportFilters, UserExportFilters, AnalyticsExportFilters } from './bulk-export';

// ============================================================
// TYPES
// ============================================================

export type ExportJobType = 'funds-csv' | 'funds-excel' | 'users-csv' | 'analytics-excel';

export interface ExportJobPayload {
  type: ExportJobType;
  filters: FundExportFilters | UserExportFilters | AnalyticsExportFilters;
  userId: string;
  userEmail: string;
  callbackUrl?: string;
}

export interface ExportJob {
  id: string;
  type: ExportJobType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId: string;
  progress: number;
  result?: {
    filename: string;
    fileUrl?: string;
    rowCount: number;
    fileSize: number;
  };
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, ExportJob>();

// ============================================================
// QUEUE OPERATIONS
// ============================================================

/**
 * Queue a new export job
 */
export async function queueExportJob(payload: ExportJobPayload): Promise<ExportJob> {
  const jobId = generateJobId();
  
  const job: ExportJob = {
    id: jobId,
    type: payload.type,
    status: 'pending',
    userId: payload.userId,
    progress: 0,
    createdAt: new Date(),
  };

  // Store job
  jobStore.set(jobId, job);

  // Also store in database for persistence
  await prisma.jobQueue.create({
    data: {
      id: jobId,
      queue: 'export',
      jobType: payload.type,
      payload: JSON.parse(JSON.stringify({
        filters: payload.filters,
        userId: payload.userId,
        userEmail: payload.userEmail,
        callbackUrl: payload.callbackUrl,
      })),
      status: 'PENDING',
      priority: 0,
      scheduledAt: new Date(),
    },
  });

  // Start processing in background (non-blocking)
  processExportJob(jobId, payload).catch(error => {
    console.error(`Export job ${jobId} failed:`, error);
    updateJobStatus(jobId, 'failed', { error: error.message });
  });

  return job;
}

/**
 * Get job status
 */
export async function getExportJobStatus(jobId: string): Promise<ExportJob | null> {
  // Try memory first
  const memoryJob = jobStore.get(jobId);
  if (memoryJob) return memoryJob;

  // Fall back to database
  const dbJob = await prisma.jobQueue.findUnique({
    where: { id: jobId },
  });

  if (!dbJob) return null;

  return {
    id: dbJob.id,
    type: dbJob.jobType as ExportJobType,
    status: dbJob.status.toLowerCase() as ExportJob['status'],
    userId: (dbJob.payload as any).userId,
    progress: dbJob.status === 'COMPLETED' ? 100 : dbJob.status === 'RUNNING' ? 50 : 0,
    error: dbJob.lastError || undefined,
    createdAt: dbJob.createdAt,
    startedAt: dbJob.startedAt || undefined,
    completedAt: dbJob.completedAt || undefined,
  };
}

/**
 * Get all jobs for a user
 */
export async function getUserExportJobs(userId: string): Promise<ExportJob[]> {
  const jobs = await prisma.jobQueue.findMany({
    where: {
      queue: 'export',
      payload: {
        path: ['userId'],
        equals: userId,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return jobs.map(job => ({
    id: job.id,
    type: job.jobType as ExportJobType,
    status: job.status.toLowerCase() as ExportJob['status'],
    userId: (job.payload as any).userId,
    progress: job.status === 'COMPLETED' ? 100 : job.status === 'RUNNING' ? 50 : 0,
    error: job.lastError || undefined,
    createdAt: job.createdAt,
    startedAt: job.startedAt || undefined,
    completedAt: job.completedAt || undefined,
  }));
}

/**
 * Cancel a pending job
 */
export async function cancelExportJob(jobId: string, userId: string): Promise<boolean> {
  const job = jobStore.get(jobId);
  
  if (!job) return false;
  if (job.userId !== userId) return false;
  if (job.status !== 'pending') return false;

  updateJobStatus(jobId, 'failed', { error: 'Cancelled by user' });
  
  await prisma.jobQueue.update({
    where: { id: jobId },
    data: { status: 'CANCELLED' },
  });

  return true;
}

// ============================================================
// JOB PROCESSING
// ============================================================

/**
 * Process an export job
 */
async function processExportJob(jobId: string, payload: ExportJobPayload): Promise<void> {
  // Update status to processing
  updateJobStatus(jobId, 'processing');
  
  await prisma.jobQueue.update({
    where: { id: jobId },
    data: { 
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  let result;

  try {
    // Execute the appropriate export
    switch (payload.type) {
      case 'funds-csv':
        result = await exportFundsToCSV(payload.filters as FundExportFilters);
        break;
      
      case 'funds-excel':
        result = await exportFundsToExcel(payload.filters as FundExportFilters);
        break;
      
      case 'users-csv':
        result = await exportUsersToCSV(payload.filters as UserExportFilters);
        break;
      
      case 'analytics-excel':
        result = await exportAnalyticsToExcel(payload.filters as AnalyticsExportFilters);
        break;
      
      default:
        throw new Error(`Unknown export type: ${payload.type}`);
    }

    // Store file (in production, upload to S3)
    const fileUrl = await storeExportFile(jobId, result.filename, result.data);
    
    // Update job with result
    updateJobStatus(jobId, 'completed', {
      result: {
        filename: result.filename,
        fileUrl,
        rowCount: result.rowCount,
        fileSize: result.data.length,
      },
    });

    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notification
    await notifyExportComplete(payload.userEmail, {
      jobId,
      filename: result.filename,
      fileUrl,
      rowCount: result.rowCount,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    updateJobStatus(jobId, 'failed', { error: errorMessage });
    
    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        lastError: errorMessage,
        failedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Process pending jobs (called by cron)
 */
export async function processPendingExportJobs(): Promise<number> {
  const pendingJobs = await prisma.jobQueue.findMany({
    where: {
      queue: 'export',
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
    },
    orderBy: [
      { priority: 'desc' },
      { scheduledAt: 'asc' },
    ],
    take: 5, // Process up to 5 at a time
  });

  let processed = 0;

  for (const job of pendingJobs) {
    try {
      const payload = job.payload as unknown as ExportJobPayload;
      await processExportJob(job.id, payload);
      processed++;
    } catch (error) {
      console.error(`Failed to process export job ${job.id}:`, error);
    }
  }

  return processed;
}

// ============================================================
// HELPERS
// ============================================================

function generateJobId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function updateJobStatus(
  jobId: string,
  status: ExportJob['status'],
  updates?: Partial<ExportJob>
): void {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = status;
  job.progress = status === 'completed' ? 100 : status === 'processing' ? 50 : job.progress;
  
  if (status === 'processing') {
    job.startedAt = new Date();
  } else if (status === 'completed' || status === 'failed') {
    job.completedAt = new Date();
  }

  if (updates) {
    Object.assign(job, updates);
  }

  jobStore.set(jobId, job);
}

/**
 * Store export file (mock - in production use S3)
 */
async function storeExportFile(
  jobId: string,
  filename: string,
  data: string
): Promise<string> {
  // In production, upload to S3 and return signed URL
  // For now, return a mock URL
  const mockUrl = `/api/exports/${jobId}/${filename}`;
  
  // Store data temporarily (in production, this would be S3)
  const exportData = Buffer.from(data, 'utf-8');
  
  // Could store in Redis with expiry for temporary storage
  // await redis.setex(`export:${jobId}`, 86400, exportData.toString('base64'));
  
  console.log(`[Export] Stored ${filename} (${exportData.length} bytes) for job ${jobId}`);
  
  return mockUrl;
}

/**
 * Send notification when export is complete
 */
async function notifyExportComplete(
  email: string,
  details: {
    jobId: string;
    filename: string;
    fileUrl: string;
    rowCount: number;
  }
): Promise<void> {
  // Import dynamically to avoid circular dependency
  const { sendEmail } = await import('./email');
  
  await sendEmail({
    to: email,
    subject: `Your export is ready: ${details.filename}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a365d;">Your Export is Ready</h2>
        <p>Your data export has been completed successfully.</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Filename:</strong> ${details.filename}</p>
          <p style="margin: 10px 0 0;"><strong>Records:</strong> ${details.rowCount.toLocaleString()}</p>
        </div>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}${details.fileUrl}" 
             style="display: inline-block; background: #2c5282; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Download Export
          </a>
        </p>
        <p style="color: #718096; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours. Please download your file before then.
        </p>
      </div>
    `,
  });
}

// ============================================================
// CLEANUP
// ============================================================

/**
 * Clean up old export jobs and files
 */
export async function cleanupOldExports(olderThanDays = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.jobQueue.deleteMany({
    where: {
      queue: 'export',
      createdAt: { lt: cutoffDate },
      status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
    },
  });

  // Also clean up memory store
  for (const [jobId, job] of Array.from(jobStore)) {
    if (job.createdAt < cutoffDate) {
      jobStore.delete(jobId);
    }
  }

  console.log(`[Export Cleanup] Removed ${result.count} old export jobs`);
  return result.count;
}

export default {
  queueExportJob,
  getExportJobStatus,
  getUserExportJobs,
  cancelExportJob,
  processPendingExportJobs,
  cleanupOldExports,
};
