import { AgentRole, AgentPermission, AgentPermissions, PolicyResult } from '../shared/types';
import { SafeSendRequestSchema, SafeSendResultSchema } from '../shared/schemas';

// Permission gate
export function checkPermission(
  agent: AgentRole,
  permission: AgentPermission,
  action: string,
  entityId: string
): PolicyResult {
  const allowed = AgentPermissions[agent].includes(permission);
  
  if (!allowed) {
    return {
      allowed: false,
      requiresApproval: false,
      reasons: [`Agent ${agent} does not have ${permission} permission`],
    };
  }
  
  // Check action-specific policies
  const actionPolicy = evaluateActionPolicy(action, entityId, agent);
  
  return {
    allowed: actionPolicy.allowed,
    requiresApproval: actionPolicy.requiresApproval,
    approvalLevel: actionPolicy.approvalLevel,
    reasons: actionPolicy.reasons,
    suggestedActions: actionPolicy.suggestedActions,
  };
}

// Action-specific policy evaluation
function evaluateActionPolicy(
  action: string,
  entityId: string,
  agent: AgentRole
): PolicyResult {
  const policies = [
    // High-risk actions always require approval
    evaluateHighRiskActions(action),
    
    // Agent-specific restrictions
    evaluateAgentRestrictions(action, agent),
    
    // Entity-specific policies
    evaluateEntityPolicies(entityId, action),
    
    // Rate limiting
    evaluateRateLimit(action, agent),
  ];
  
  // Combine policy results
  const combined: PolicyResult = {
    allowed: true,
    requiresApproval: false,
    reasons: [],
    suggestedActions: [],
  };
  
  for (const policy of policies) {
    if (!policy.allowed) {
      combined.allowed = false;
      combined.reasons.push(...policy.reasons);
    }
    if (policy.requiresApproval) {
      combined.requiresApproval = true;
      combined.approvalLevel = policy.approvalLevel || 'medium';
      combined.reasons.push(...policy.reasons);
    }
    if (policy.suggestedActions) {
      combined.suggestedActions = [
        ...(combined.suggestedActions || []),
        ...policy.suggestedActions,
      ];
    }
  }
  
  return combined;
}

// High-risk actions policy
function evaluateHighRiskActions(action: string): PolicyResult {
  const highRiskActions = [
    'approve_membership',
    'verify_fund',
    'upgrade_provider',
    'publish_news',
    'publish_announcement',
    'send_newsletter',
    'delete_user',
    'update_payment',
  ];
  
  if (highRiskActions.includes(action)) {
    return {
      allowed: true,
      requiresApproval: true,
      approvalLevel: 'high',
      reasons: [`Action "${action}" is high-risk and requires approval`],
      suggestedActions: ['Submit to approval queue'],
    };
  }
  
  return { allowed: true, requiresApproval: false, reasons: [] };
}

// Agent restrictions
function evaluateAgentRestrictions(action: string, agent: AgentRole): PolicyResult {
  const restrictions: Record<AgentRole, string[]> = {
    scooby: [], // No restrictions
    shaggy: ['publish_news', 'publish_announcement', 'send_newsletter'],
    daphne: ['approve_membership', 'verify_fund', 'upgrade_provider'],
    velma: ['publish_news', 'publish_announcement'],
    fred: ['approve_membership', 'verify_fund', 'upgrade_provider', 'publish_news'],
  };
  
  if (restrictions[agent].includes(action)) {
    return {
      allowed: false,
      requiresApproval: false,
      reasons: [`Agent ${agent} is not authorized for action "${action}"`],
      suggestedActions: ['Escalate to scooby agent'],
    };
  }
  
  return { allowed: true, requiresApproval: false, reasons: [] };
}

// Entity policies (simplified)
function evaluateEntityPolicies(entityId: string, action: string): PolicyResult {
  // Check if entity is in a sensitive state
  const sensitiveStates = ['pending_verification', 'under_review', 'suspended'];
  // In real implementation, this would query the database
  
  if (sensitiveStates.some(state => entityId.includes(state))) {
    return {
      allowed: true,
      requiresApproval: true,
      approvalLevel: 'medium',
      reasons: [`Entity ${entityId} is in a sensitive state`],
      suggestedActions: ['Review entity status before proceeding'],
    };
  }
  
  return { allowed: true, requiresApproval: false, reasons: [] };
}

// Rate limiting
function evaluateRateLimit(action: string, agent: AgentRole): PolicyResult {
  // In real implementation, this would check Redis counters
  const rateLimits: Record<string, number> = {
    'send_email': 100, // per hour
    'create_user': 50,
    'update_content': 200,
  };
  
  const limit = rateLimits[action];
  if (limit) {
    // TODO: Implement actual rate limiting with Redis
    return {
      allowed: true,
      requiresApproval: false,
      reasons: [`Rate limit check would be performed for ${action}`],
    };
  }
  
  return { allowed: true, requiresApproval: false, reasons: [] };
}

// Safe send gate for emails
export function evaluateSafeSend(request: any): SafeSendResultSchema {
  const validated = SafeSendRequestSchema.parse(request);
  
  const checks = [
    checkAudienceSize(validated.audienceDefinition),
    checkComplianceFlags(validated.complianceFlags),
    checkThrottleLimit(validated.throttle),
    checkUnsubscribeLink(validated.unsubscribeLink),
    checkSendingDomain(validated.sendingDomain),
  ];
  
  const failures = checks.filter(check => !check.passed);
  
  if (failures.length === 0) {
    return {
      decision: 'send',
      reasons: ['All safety checks passed'],
      approvalRequired: false,
    };
  }
  
  const highRiskFailures = failures.filter(f => f.risk === 'high');
  if (highRiskFailures.length > 0) {
    return {
      decision: 'block',
      reasons: highRiskFailures.map(f => f.reason),
      approvalRequired: false,
    };
  }
  
  return {
    decision: 'queue_for_approval',
    reasons: failures.map(f => f.reason),
    approvalRequired: true,
    approvalLevel: 'medium',
    estimatedSendTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
  };
}

// Safe send checks
function checkAudienceSize(audience: any): { passed: boolean; reason: string; risk: 'low' | 'medium' | 'high' } {
  const size = audience.count || 0;
  
  if (size > 10000) {
    return {
      passed: false,
      reason: `Audience size (${size}) exceeds bulk send limit`,
      risk: 'high',
    };
  }
  
  if (size > 1000) {
    return {
      passed: false,
      reason: `Audience size (${size}) requires approval`,
      risk: 'medium',
    };
  }
  
  return { passed: true, reason: '', risk: 'low' };
}

function checkComplianceFlags(flags: string[]): { passed: boolean; reason: string; risk: 'low' | 'medium' | 'high' } {
  const highRiskFlags = ['financial_advice', 'investment_opportunity', 'guaranteed_returns'];
  const mediumRiskFlags = ['promotional', 'limited_time', 'exclusive_offer'];
  
  const hasHighRisk = flags.some(flag => highRiskFlags.includes(flag));
  const hasMediumRisk = flags.some(flag => mediumRiskFlags.includes(flag));
  
  if (hasHighRisk) {
    return {
      passed: false,
      reason: 'Contains high-risk compliance flags',
      risk: 'high',
    };
  }
  
  if (hasMediumRisk) {
    return {
      passed: false,
      reason: 'Contains medium-risk compliance flags',
      risk: 'medium',
    };
  }
  
  return { passed: true, reason: '', risk: 'low' };
}

function checkThrottleLimit(throttle: number): { passed: boolean; reason: string; risk: 'low' | 'medium' | 'high' } {
  if (throttle < 1000) { // Less than 1 second between emails
    return {
      passed: false,
      reason: 'Throttle rate too fast, may trigger spam filters',
      risk: 'medium',
    };
  }
  
  return { passed: true, reason: '', risk: 'low' };
}

function checkUnsubscribeLink(hasLink: boolean): { passed: boolean; reason: string; risk: 'low' | 'medium' | 'high' } {
  if (!hasLink) {
    return {
      passed: false,
      reason: 'Missing unsubscribe link (required by CAN-SPAM)',
      risk: 'high',
    };
  }
  
  return { passed: true, reason: '', risk: 'low' };
}

function checkSendingDomain(domain: string): { passed: boolean; reason: string; risk: 'low' | 'medium' | 'high' } {
  const allowedDomains = ['hedgeco.net', 'hedgeco.com'];
  
  if (!allowedDomains.includes(domain)) {
    return {
      passed: false,
      reason: `Sending domain "${domain}" not authorized`,
      risk: 'high',
    };
  }
  
  return { passed: true, reason: '', risk: 'low' };
}