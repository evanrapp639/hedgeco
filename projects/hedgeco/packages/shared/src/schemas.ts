import { z } from 'zod';

// Re-export from kernel schemas (we'll move them here)
export * from '../../apps/kernel/src/shared/schemas';

// Additional shared schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string().optional(),
  role: z.enum(['user', 'admin', 'moderator']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const FundSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  managerId: z.string().uuid(),
  strategy: z.string(),
  aum: z.number().positive().optional(),
  status: z.enum(['active', 'closed', 'pending']),
  verified: z.boolean(),
  verifiedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['news', 'investor', 'manager', 'provider']),
  status: z.enum(['pending', 'active', 'suspended', 'cancelled']),
  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
export type Fund = z.infer<typeof FundSchema>;
export type Membership = z.infer<typeof MembershipSchema>;