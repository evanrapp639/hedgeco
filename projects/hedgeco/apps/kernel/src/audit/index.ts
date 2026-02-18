import { AuditLogEntry } from '../shared/types';
import { AgentActionRequestSchema, AgentActionResponseSchema } from '../shared/schemas';

// In-memory audit log (in production, use database)
const auditLog: AuditLogEntry[] = [];

// Log an action
export function logAction(
  agent: string,
  action: string,
  entityId: string,
  entityType: string,
  details: Record<string, any>,
  outcome: 'success' | 'failure' | 'pending' = 'pending',
  ip?: string,
  userAgent?: string
): string {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    agent: agent as any,
    action,
    entityId,
    entityType,
    details,
    outcome,
    ip,
    userAgent,
  };
  
  auditLog.push(entry);
  console.log(`[AUDIT] ${entry.timestamp} ${agent} ${action} ${entityId} - ${outcome}`);
  
  // In production, this would write to database
  // await db.auditLog.create({ data: entry });
  
  return entry.id;
}

// Update audit log entry
export function updateAuditOutcome(
  auditId: string,
  outcome: 'success' | 'failure',
  additionalDetails?: Record<string, any>
): boolean {
  const entry = auditLog.find(e => e.id === auditId);
  if (!entry) {
    console.warn(`[AUDIT] Entry ${auditId} not found`);
    return false;
  }
  
  entry.outcome = outcome;
  if (additionalDetails) {
    entry.details = { ...entry.details, ...additionalDetails };
  }
  
  console.log(`[AUDIT] Updated ${auditId} to ${outcome}`);
  return true;
}

// Query audit log
export function queryAuditLog(filters: {
  agent?: string;
  action?: string;
  entityId?: string;
  entityType?: string;
  outcome?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}): AuditLogEntry[] {
  let results = [...auditLog];
  
  if (filters.agent) {
    results = results.filter(e => e.agent === filters.agent);
  }
  
  if (filters.action) {
    results = results.filter(e => e.action === filters.action);
  }
  
  if (filters.entityId) {
    results = results.filter(e => e.entityId === filters.entityId);
  }
  
  if (filters.entityType) {
    results = results.filter(e => e.entityType === filters.entityType);
  }
  
  if (filters.outcome) {
    results = results.filter(e => e.outcome === filters.outcome);
  }
  
  if (filters.startTime) {
    const start = new Date(filters.startTime);
    results = results.filter(e => new Date(e.timestamp) >= start);
  }
  
  if (filters.endTime) {
    const end = new Date(filters.endTime);
    results = results.filter(e => new Date(e.timestamp) <= end);
  }
  
  if (filters.limit) {
    results = results.slice(0, filters.limit);
  }
  
  // Sort by timestamp descending (newest first)
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return results;
}

// Log agent action request
export function logAgentAction(request: any, response: any): string {
  const validatedRequest = AgentActionRequestSchema.parse(request);
  const validatedResponse = AgentActionResponseSchema.parse(response);
  
  return logAction(
    validatedRequest.agent,
    validatedRequest.action,
    validatedRequest.entityId,
    'agent_action',
    {
      request: validatedRequest,
      response: validatedResponse,
    },
    validatedResponse.status === 'error' ? 'failure' : 'pending'
  );
}

// Generate replay log for debugging
export function generateReplayLog(jobId: string): any {
  const entries = auditLog.filter(e => 
    e.details?.jobId === jobId || 
    e.entityId === jobId ||
    e.details?.request?.jobId === jobId
  );
  
  if (entries.length === 0) {
    return { jobId, found: false, message: 'No audit entries found for job' };
  }
  
  // Reconstruct the sequence of events
  const sequence = entries.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  return {
    jobId,
    found: true,
    totalEntries: sequence.length,
    timeline: sequence.map(entry => ({
      timestamp: entry.timestamp,
      agent: entry.agent,
      action: entry.action,
      outcome: entry.outcome,
      details: entry.details,
    })),
    summary: {
      firstAction: sequence[0]?.action,
      lastAction: sequence[sequence.length - 1]?.action,
      finalOutcome: sequence[sequence.length - 1]?.outcome,
      agentsInvolved: [...new Set(sequence.map(e => e.agent))],
      actionsPerformed: [...new Set(sequence.map(e => e.action))],
    },
  };
}

// Export audit log (for backup/analysis)
export function exportAuditLog(format: 'json' | 'csv' = 'json'): string {
  if (format === 'csv') {
    const headers = ['id', 'timestamp', 'agent', 'action', 'entityId', 'entityType', 'outcome', 'details'];
    const rows = auditLog.map(entry => [
      entry.id,
      entry.timestamp,
      entry.agent,
      entry.action,
      entry.entityId,
      entry.entityType,
      entry.outcome,
      JSON.stringify(entry.details),
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csv;
  }
  
  // Default JSON
  return JSON.stringify(auditLog, null, 2);
}

// Helper function to generate ID
function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Statistics
export function getAuditStats() {
  const total = auditLog.length;
  const byOutcome = auditLog.reduce((acc, entry) => {
    acc[entry.outcome] = (acc[entry.outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byAgent = auditLog.reduce((acc, entry) => {
    acc[entry.agent] = (acc[entry.agent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byAction = auditLog.reduce((acc, entry) => {
    acc[entry.action] = (acc[entry.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last24h = auditLog.filter(e => new Date(e.timestamp) > oneDayAgo);
  
  return {
    total,
    byOutcome,
    byAgent,
    byAction,
    last24h: {
      total: last24h.length,
      byOutcome: last24h.reduce((acc, entry) => {
        acc[entry.outcome] = (acc[entry.outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    generatedAt: new Date().toISOString(),
  };
}