import { z } from 'zod';

// Job ID generation
export type JobId = string;

export const generateJobId = (action: string, entityId: string, version: number): JobId => {
  const crypto = require('crypto');
  return crypto.createHash('sha256')
    .update(`${action}:${entityId}:${version}`)
    .digest('hex')
    .slice(0, 32);
};

// Base job schema
export const BaseJobSchema = z.object({
  jobId: z.string(),
  action: z.string(),
  entityId: z.string(),
  version: z.number().int().positive(),
  submittedBy: z.string(), // agent name
  submittedAt: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export type BaseJob = z.infer<typeof BaseJobSchema>;

// Approval queue job
export const ApprovalJobSchema = BaseJobSchema.extend({
  action: z.enum(['approve_membership', 'verify_fund', 'upgrade_provider']),
  metadata: z.object({
    evidence: z.array(z.string()), // screenshots, logs, data
    reasonCode: z.string(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    requiresHuman: z.boolean(),
  }),
});

export type ApprovalJob = z.infer<typeof ApprovalJobSchema>;

// Publish queue job
export const PublishJobSchema = BaseJobSchema.extend({
  action: z.enum(['publish_news', 'publish_announcement', 'publish_update']),
  metadata: z.object({
    sourceUrls: z.array(z.string()),
    claims: z.array(z.string()),
    factChecks: z.array(z.string()),
    toneChecks: z.array(z.string()),
    requiresHuman: z.boolean(),
  }),
});

export type PublishJob = z.infer<typeof PublishJobSchema>;

// Email queue job
export const EmailJobSchema = BaseJobSchema.extend({
  action: z.enum(['send_welcome', 'send_confirmation', 'send_notification', 'send_newsletter']),
  metadata: z.object({
    audienceDefinition: z.record(z.any()),
    templateKey: z.string(),
    templateVersion: z.number(),
    sendingDomain: z.string(),
    throttleMs: z.number(),
    unsubscribeLink: z.boolean(),
    complianceFlags: z.array(z.string()),
  }),
});

export type EmailJob = z.infer<typeof EmailJobSchema>;

// Agent permission levels
export enum AgentPermission {
  READ = 'read',
  WRITE = 'write',
  EXEC = 'exec',
  BROWSER = 'browser',
  CRON = 'cron',
  MESSAGE = 'message',
}

export type AgentRole = 'scooby' | 'shaggy' | 'daphne' | 'velma' | 'fred';

export const AgentPermissions: Record<AgentRole, AgentPermission[]> = {
  scooby: Object.values(AgentPermission), // All permissions
  shaggy: [AgentPermission.READ, AgentPermission.WRITE, AgentPermission.EXEC, AgentPermission.BROWSER],
  daphne: [AgentPermission.READ, AgentPermission.WRITE, AgentPermission.EXEC, AgentPermission.BROWSER],
  velma: [AgentPermission.READ, AgentPermission.WRITE, AgentPermission.EXEC, AgentPermission.BROWSER],
  fred: [AgentPermission.READ, AgentPermission.WRITE, AgentPermission.EXEC, AgentPermission.BROWSER],
};

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agent: AgentRole;
  action: string;
  entityId: string;
  entityType: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'pending';
  ip?: string;
  userAgent?: string;
}

// Policy evaluation result
export interface PolicyResult {
  allowed: boolean;
  requiresApproval: boolean;
  approvalLevel?: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestedActions?: string[];
}