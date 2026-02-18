// Payment Router - Stripe subscription management
// Sprint 5: Payments & Subscriptions

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  stripe,
  SUBSCRIPTION_PLANS,
  createCheckoutSession,
  createPortalSession,
  getCustomerInvoices,
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  updateSubscriptionPlan,
  getOrCreateCustomer,
  type PlanType,
} from '@/lib/stripe';

export const paymentRouter = router({
  /**
   * Create a Stripe checkout session to start subscription flow
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;
      const planConfig = SUBSCRIPTION_PLANS[input.plan];

      if (!planConfig.priceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid plan selected',
        });
      }

      // Get user's email and existing subscription
      const dbUser = await prisma.user.findUnique({
        where: { id: user.sub },
        include: {
          profile: true,
        },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check for existing subscription
      const existingSubscription = await prisma.subscription.findUnique({
        where: { userId: user.sub },
      });

      // Get or create Stripe customer
      let customerId = existingSubscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await getOrCreateCustomer({
          email: dbUser.email,
          name: dbUser.profile
            ? `${dbUser.profile.firstName} ${dbUser.profile.lastName}`
            : undefined,
          userId: user.sub,
        });
        customerId = customer.id;
      }

      // Create checkout session
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const session = await createCheckoutSession({
        customerId,
        priceId: planConfig.priceId,
        userId: user.sub,
        successUrl: `${baseUrl}/settings/billing?success=true`,
        cancelUrl: `${baseUrl}/settings/billing?canceled=true`,
      });

      return { sessionId: session.id, url: session.url };
    }),

  /**
   * Create a Stripe portal session for billing management
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, prisma } = ctx;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.sub },
    });

    if (!subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No subscription found. Please subscribe first.',
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${baseUrl}/settings/billing`,
    });

    return { url: session.url };
  }),

  /**
   * Get current subscription details
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { user, prisma } = ctx;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.sub },
    });

    if (!subscription) {
      // Return free tier if no subscription exists
      return {
        plan: 'FREE' as PlanType,
        status: 'ACTIVE' as const,
        features: SUBSCRIPTION_PLANS.FREE.features,
        limits: SUBSCRIPTION_PLANS.FREE.limits,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const planConfig = SUBSCRIPTION_PLANS[subscription.plan];

    return {
      plan: subscription.plan,
      status: subscription.status,
      features: planConfig.features,
      limits: planConfig.limits,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    };
  }),

  /**
   * Cancel subscription at period end
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, prisma } = ctx;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.sub },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No active subscription found',
      });
    }

    // Cancel at period end in Stripe
    await cancelSubscriptionAtPeriodEnd(subscription.stripeSubscriptionId);

    // Update local record
    await prisma.subscription.update({
      where: { userId: user.sub },
      data: { cancelAtPeriodEnd: true },
    });

    return { success: true, message: 'Subscription will be canceled at the end of the billing period' };
  }),

  /**
   * Reactivate a subscription that was set to cancel
   */
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, prisma } = ctx;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.sub },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No subscription found',
      });
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Subscription is not set to cancel',
      });
    }

    // Reactivate in Stripe
    await reactivateSubscription(subscription.stripeSubscriptionId);

    // Update local record
    await prisma.subscription.update({
      where: { userId: user.sub },
      data: { cancelAtPeriodEnd: false },
    });

    return { success: true, message: 'Subscription reactivated' };
  }),

  /**
   * Get billing history (invoices)
   */
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;
      const limit = input?.limit ?? 10;

      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.sub },
      });

      if (!subscription?.stripeCustomerId) {
        return { invoices: [] };
      }

      const invoices = await getCustomerInvoices(subscription.stripeCustomerId, limit);

      return {
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amount: invoice.amount_due,
          currency: invoice.currency,
          created: new Date(invoice.created * 1000),
          periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
          periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
          pdfUrl: invoice.invoice_pdf,
          hostedUrl: invoice.hosted_invoice_url,
        })),
      };
    }),

  /**
   * Update subscription plan (upgrade/downgrade)
   */
  updatePlan: protectedProcedure
    .input(
      z.object({
        newPlan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.sub },
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active subscription found. Please subscribe first.',
        });
      }

      const newPlanConfig = SUBSCRIPTION_PLANS[input.newPlan];

      if (!newPlanConfig.priceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid plan selected',
        });
      }

      // Update in Stripe
      const updatedStripeSubscription = await updateSubscriptionPlan(
        subscription.stripeSubscriptionId,
        newPlanConfig.priceId
      );

      // Update local record
      await prisma.subscription.update({
        where: { userId: user.sub },
        data: {
          plan: input.newPlan,
          currentPeriodEnd: new Date((updatedStripeSubscription as unknown as { current_period_end: number }).current_period_end * 1000),
        },
      });

      return { success: true, message: `Plan updated to ${newPlanConfig.name}` };
    }),

  /**
   * Get available plans with pricing
   */
  getPlans: protectedProcedure.query(async () => {
    type PlanKey = keyof typeof SUBSCRIPTION_PLANS;
    const planKeys: PlanKey[] = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    
    const plans = planKeys.map((key) => {
      const config = SUBSCRIPTION_PLANS[key];
      return {
        id: key,
        name: config.name,
        features: [...config.features],
        limits: config.limits,
        priceId: config.priceId || null,
      };
    });

    // Fetch actual prices from Stripe for non-free plans
    const plansWithPrices = await Promise.all(
      plans.map(async (plan) => {
        if (!plan.priceId) {
          return { ...plan, price: 0, interval: null };
        }

        try {
          const price = await stripe.prices.retrieve(plan.priceId);
          return {
            ...plan,
            price: price.unit_amount ? price.unit_amount / 100 : 0,
            interval: price.recurring?.interval || 'month',
          };
        } catch {
          return { ...plan, price: null, interval: null };
        }
      })
    );

    return { plans: plansWithPrices };
  }),
});
