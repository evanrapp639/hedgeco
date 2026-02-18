import { z } from 'zod';

// Ticket schemas for support system
export const TicketSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string(),
  lastAgent: z.string().optional(),
  lastHuman: z.string().optional(),
  slaDueAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TicketMessageSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  direction: z.enum(['in', 'out']),
  channel: z.enum(['email', 'web', 'discord', 'telegram']),
  body: z.string(),
  attachments: z.array(z.any()).default([]),
  createdAt: z.string().datetime(),
});

// Email template schemas
export const EmailTemplateSchema = z.object({
  templateKey: z.string(),
  templateVersion: z.number().int().positive(),
  renderHash: z.string(),
  subject: z.string(),
  body: z.string(), // React component serialized
  metadata: z.object({
    category: z.enum(['transactional', 'marketing', 'notification']),
    complianceFlags: z.array(z.string()),
    throttleMs: z.number().int().nonnegative(),
  }),
});

// Safe send gate schemas
export const SafeSendRequestSchema = z.object({
  audienceDefinition: z.record(z.any()),
  copy: EmailTemplateSchema,
  sendingDomain: z.string(),
  throttle: z.number().int().positive(),
  unsubscribeLink: z.boolean(),
  complianceFlags: z.array(z.string()),
});

export const SafeSendResultSchema = z.object({
  decision: z.enum(['send', 'queue_for_approval', 'block']),
  reasons: z.array(z.string()),
  approvalRequired: z.boolean(),
  approvalLevel: z.enum(['low', 'medium', 'high']).optional(),
  estimatedSendTime: z.string().datetime().optional(),
});

// Model routing schemas
export const ModelRoutingSchema = z.object({
  function: z.enum(['classification', 'extraction', 'summarization', 'rewriting', 'customer_support', 'marketing_drafts', 'admin_decisions', 'complex_coding', 'ambiguous_compliance', 'sensitive_disputes']),
  model: z.enum(['gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4o']),
  maxTokens: z.number().int().positive(),
  temperature: z.number().min(0).max(2),
});

// RAG retrieval schemas
export const RetrievalRequestSchema = z.object({
  query: z.string(),
  sources: z.array(z.enum(['policies', 'membership_rules', 'prior_tickets', 'fund_verification_checklist', 'editorial_style_rules'])),
  maxResults: z.number().int().positive().default(5),
  minScore: z.number().min(0).max(1).default(0.7),
});

export const RetrievalResultSchema = z.object({
  source: z.string(),
  content: z.string(),
  score: z.number(),
  metadata: z.record(z.any()),
});

// Agent action request schemas
export const AgentActionRequestSchema = z.object({
  agent: z.enum(['scooby', 'shaggy', 'daphne', 'velma', 'fred']),
  action: z.string(),
  entityId: z.string(),
  data: z.record(z.any()),
  evidence: z.array(z.string()).optional(),
});

export const AgentActionResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'requires_approval', 'blocked', 'error']),
  message: z.string(),
  approvalRequired: z.boolean(),
  estimatedCompletion: z.string().datetime().optional(),
});