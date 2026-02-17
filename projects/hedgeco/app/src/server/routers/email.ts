// Email Router
// tRPC endpoints for email management and sending

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { sendEmail, sendWelcomeEmail, sendNotification } from '@/lib/email';

// Default email preferences
const DEFAULT_PREFERENCES = {
  marketingEmails: true,
  fundUpdates: true,
  messageNotifications: true,
  weeklyDigest: true,
  meetingReminders: true,
};

export const emailRouter = router({
  /**
   * Send a test email (admin only)
   */
  sendTestEmail: adminProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { to, subject = 'HedgeCo Test Email', message } = input;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #1a365d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; border: 1px solid #e2e8f0; padding: 30px; }
            .footer { background: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
            .info { background: #e6fffa; border: 1px solid #81e6d9; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Test Email</h1>
            </div>
            <div class="content">
              <p>This is a test email from HedgeCo.</p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
              <div class="info">
                <p><strong>Sent by:</strong> ${ctx.user?.email ?? 'Unknown'}</p>
                <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV ?? 'development'}</p>
              </div>
              <p>If you received this email, your email configuration is working correctly! 🎉</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HedgeCo</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await sendEmail({
        to,
        subject,
        html,
        text: `Test email from HedgeCo. ${message ?? ''} Sent at: ${new Date().toISOString()}`,
      });

      return result;
    }),

  /**
   * Send welcome email to a user
   */
  sendWelcome: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { profile: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const result = await sendWelcomeEmail({
        email: user.email,
        name: user.profile?.firstName || user.email.split('@')[0],
        role: user.role as 'investor' | 'provider',
      });

      return result;
    }),

  /**
   * Send notification email
   */
  sendNotificationEmail: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum([
          'new_message',
          'fund_update',
          'document_shared',
          'meeting_scheduled',
          'performance_alert',
        ]),
        data: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { profile: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check user preferences before sending
      const preferences = await prisma.emailPreference.findUnique({
        where: { userId: input.userId },
      });

      // Map notification type to preference key
      const typeToPreference: Record<string, keyof typeof DEFAULT_PREFERENCES> = {
        new_message: 'messageNotifications',
        fund_update: 'fundUpdates',
        meeting_scheduled: 'meetingReminders',
      };

      const prefKey = typeToPreference[input.type];
      if (prefKey && preferences && !preferences[prefKey]) {
        return { success: false, error: 'User has disabled this notification type' };
      }

      const result = await sendNotification(
        { email: user.email, name: user.profile?.firstName || user.email.split('@')[0] },
        input.type,
        input.data
      );

      return result;
    }),

  /**
   * Get email preferences for a user
   */
  getEmailPreferences: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId ?? ctx.user?.id;

      if (!userId) {
        throw new Error('User ID required');
      }

      // Only allow users to view their own preferences (or admins)
      if (userId !== ctx.user?.id && ctx.user?.role !== 'ADMIN' && ctx.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized');
      }

      const preferences = await prisma.emailPreference.findUnique({
        where: { userId: userId as string },
      });

      // Return defaults if no preferences exist
      if (!preferences) {
        return {
          userId: userId as string,
          ...DEFAULT_PREFERENCES,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return preferences;
    }),

  /**
   * Update email preferences
   */
  updateEmailPreferences: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        preferences: z.object({
          marketingEmails: z.boolean().optional(),
          fundUpdates: z.boolean().optional(),
          messageNotifications: z.boolean().optional(),
          weeklyDigest: z.boolean().optional(),
          meetingReminders: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = input.userId ?? ctx.user?.id;

      if (!userId) {
        throw new Error('User ID required');
      }

      // Only allow users to update their own preferences (or admins)
      if (userId !== ctx.user?.id && ctx.user?.role !== 'ADMIN' && ctx.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized');
      }

      const updated = await prisma.emailPreference.upsert({
        where: { userId: userId as string },
        create: {
          userId: userId as string,
          ...DEFAULT_PREFERENCES,
          ...input.preferences,
        },
        update: input.preferences,
      });

      return updated;
    }),

  /**
   * Unsubscribe from all marketing emails (public endpoint via token in future)
   */
  unsubscribeAll: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('User ID required');
    }

    const updated = await prisma.emailPreference.upsert({
      where: { userId: userId as string },
      create: {
        userId: userId as string,
        marketingEmails: false,
        fundUpdates: false,
        messageNotifications: true, // Keep critical notifications
        weeklyDigest: false,
        meetingReminders: true, // Keep critical notifications
      },
      update: {
        marketingEmails: false,
        fundUpdates: false,
        weeklyDigest: false,
      },
    });

    return updated;
  }),
});
