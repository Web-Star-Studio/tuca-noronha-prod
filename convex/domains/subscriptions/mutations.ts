import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

/**
 * Create or update a subscription
 */
export const upsertSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("expired"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    canceledAt: v.optional(v.number()),
    metadata: v.optional(v.object({
      source: v.optional(v.string()),
      referrer: v.optional(v.string()),
    })),
  },
  returns: v.id("guideSubscriptions"),
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        canceledAt: args.canceledAt,
      });
      return existing._id;
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("guideSubscriptions", {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      canceledAt: args.canceledAt,
      metadata: args.metadata,
    });

    return subscriptionId;
  },
});

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("expired"),
      v.literal("trialing")
    ),
    canceledAt: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      status: args.status,
      canceledAt: args.canceledAt,
    });

    return { success: true };
  },
});

/**
 * Record a payment for a subscription
 */
export const recordPayment = internalMutation({
  args: {
    userId: v.id("users"),
    subscriptionId: v.id("guideSubscriptions"),
    stripeInvoiceId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    paidAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  },
  returns: v.id("subscriptionPayments"),
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("subscriptionPayments", {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      stripeInvoiceId: args.stripeInvoiceId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      paidAt: args.paidAt,
      failureReason: args.failureReason,
    });

    return paymentId;
  },
});

/**
 * Update payment status
 */
export const updatePaymentStatus = internalMutation({
  args: {
    stripeInvoiceId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    paidAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_stripe_invoice", (q) =>
        q.eq("stripeInvoiceId", args.stripeInvoiceId)
      )
      .first();

    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      paidAt: args.paidAt,
      failureReason: args.failureReason,
    });

    return { success: true };
  },
}); 