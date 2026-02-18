// Stripe Webhook Handler
// Sprint 5: Payments & Subscriptions

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, verifyWebhookSignature } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * Handle Stripe webhook events
 */
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed
 * Called when a customer completes checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Retrieve the subscription to get plan details
  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = (subscriptionData as unknown as { current_period_end: number }).current_period_end;
  const cancelAtPeriodEnd = (subscriptionData as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end;
  const priceId = (subscriptionData as unknown as { items: { data: Array<{ price: { id: string } }> } }).items.data[0]?.price.id;

  // Determine plan from price ID
  const plan = getPlanFromPriceId(priceId);

  // Create or update subscription record
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan,
      status: 'ACTIVE',
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd: cancelAtPeriodEnd,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan,
      status: 'ACTIVE',
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd: cancelAtPeriodEnd,
    },
  });

  console.log(`Subscription created/updated for user ${userId}, plan: ${plan}`);
}

/**
 * Handle invoice.paid
 * Called when a subscription payment succeeds
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    // Not a subscription invoice
    return;
  }

  // Find subscription by Stripe subscription ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.log(`No subscription found for Stripe subscription ${subscriptionId}`);
    return;
  }

  // Update status to active (in case it was past_due)
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      currentPeriodEnd: invoice.lines.data[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000)
        : undefined,
    },
  });

  console.log(`Invoice paid for subscription ${subscription.id}`);
}

/**
 * Handle customer.subscription.updated
 * Called when a subscription is modified
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const subscriptionId = stripeSubscription.id;

  // Find subscription by Stripe subscription ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.log(`No subscription found for Stripe subscription ${subscriptionId}`);
    return;
  }

  // Determine new plan and status - use type assertions for Stripe API fields
  const subData = stripeSubscription as unknown as {
    items: { data: Array<{ price: { id: string } }> };
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  };
  const priceId = subData.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);
  const status = mapStripeStatus(subData.status as Stripe.Subscription.Status);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan,
      status,
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
      cancelAtPeriodEnd: subData.cancel_at_period_end,
    },
  });

  console.log(`Subscription ${subscription.id} updated: plan=${plan}, status=${status}`);
}

/**
 * Handle customer.subscription.deleted
 * Called when a subscription is canceled/expired
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscriptionId = stripeSubscription.id;

  // Find subscription by Stripe subscription ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.log(`No subscription found for Stripe subscription ${subscriptionId}`);
    return;
  }

  // Update to canceled status and reset to free plan
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: 'FREE',
      status: 'CANCELED',
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Subscription ${subscription.id} deleted, reverted to FREE plan`);
}

/**
 * Handle invoice.payment_failed
 * Called when a payment fails
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    return;
  }

  // Find subscription by Stripe subscription ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    return;
  }

  // Update status to past_due
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAST_DUE',
    },
  });

  console.log(`Payment failed for subscription ${subscription.id}`);
  
  // TODO: Send notification email to user about failed payment
}

/**
 * Map Stripe price ID to plan type
 */
function getPlanFromPriceId(priceId: string | undefined): 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' {
  if (!priceId) return 'FREE';

  if (priceId === process.env.STRIPE_PRICE_BASIC) return 'BASIC';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'PRO';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'ENTERPRISE';

  // Default to basic if unknown price
  return 'BASIC';
}

/**
 * Map Stripe subscription status to our status enum
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'CANCELED';
    case 'past_due':
    case 'incomplete':
      return 'PAST_DUE';
    case 'trialing':
      return 'TRIALING';
    default:
      return 'ACTIVE';
  }
}
