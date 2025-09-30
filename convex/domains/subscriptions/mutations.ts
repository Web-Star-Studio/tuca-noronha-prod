import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

/**
 * Get the current user's Clerk ID (for subscriptions)
 */
async function getCurrentUserClerkId(ctx: any): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

/**
 * Create or update a subscription
 */
export const upsertSubscription = internalMutation({
  args: {
    userId: v.string(), // Clerk user ID
    userEmail: v.string(),
    mpPreapprovalId: v.string(),
    mpPlanId: v.optional(v.string()),
    status: v.union(
      v.literal("authorized"),
      v.literal("paused"),
      v.literal("cancelled"),
      v.literal("pending")
    ),
    reason: v.string(),
    externalReference: v.optional(v.string()),
    frequency: v.number(),
    frequencyType: v.union(
      v.literal("days"),
      v.literal("weeks"),
      v.literal("months"),
      v.literal("years")
    ),
    transactionAmount: v.number(),
    currencyId: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
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
      .withIndex("by_mp_preapproval", (q) =>
        q.eq("mpPreapprovalId", args.mpPreapprovalId)
      )
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        status: args.status,
        transactionAmount: args.transactionAmount,
        endDate: args.endDate,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("guideSubscriptions", {
      userId: args.userId,
      userEmail: args.userEmail,
      mpPreapprovalId: args.mpPreapprovalId,
      mpPlanId: args.mpPlanId,
      status: args.status,
      reason: args.reason,
      externalReference: args.externalReference,
      frequency: args.frequency,
      frequencyType: args.frequencyType,
      transactionAmount: args.transactionAmount,
      currencyId: args.currencyId,
      startDate: args.startDate,
      endDate: args.endDate,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return subscriptionId;
  },
});

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = internalMutation({
  args: {
    mpPreapprovalId: v.string(),
    status: v.union(
      v.literal("authorized"),
      v.literal("paused"),
      v.literal("cancelled"),
      v.literal("pending")
    ),
    cancelledDate: v.optional(v.number()),
    pausedDate: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_mp_preapproval", (q) =>
        q.eq("mpPreapprovalId", args.mpPreapprovalId)
      )
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      status: args.status,
      cancelledDate: args.cancelledDate,
      pausedDate: args.pausedDate,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Record a payment for a subscription
 */
export const recordPayment = internalMutation({
  args: {
    userId: v.string(), // Clerk user ID
    subscriptionId: v.id("guideSubscriptions"),
    mpPaymentId: v.string(),
    mpPreapprovalId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("authorized"),
      v.literal("in_process"),
      v.literal("in_mediation"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("charged_back")
    ),
    statusDetail: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    paymentTypeId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  },
  returns: v.id("subscriptionPayments"),
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("subscriptionPayments", {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      mpPaymentId: args.mpPaymentId,
      mpPreapprovalId: args.mpPreapprovalId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      statusDetail: args.statusDetail,
      paymentMethod: args.paymentMethod,
      paymentTypeId: args.paymentTypeId,
      paidAt: args.paidAt,
      failureReason: args.failureReason,
      createdAt: Date.now(),
    });

    // Update last payment date on subscription
    const subscription = await ctx.db.get(args.subscriptionId);
    if (subscription && args.status === "approved") {
      await ctx.db.patch(args.subscriptionId, {
        lastPaymentDate: args.paidAt || Date.now(),
      });
    }

    return paymentId;
  },
});

/**
 * Update payment status
 */
export const updatePaymentStatus = internalMutation({
  args: {
    mpPaymentId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("authorized"),
      v.literal("in_process"),
      v.literal("in_mediation"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("charged_back")
    ),
    statusDetail: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_mp_payment", (q) =>
        q.eq("mpPaymentId", args.mpPaymentId)
      )
      .first();

    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      statusDetail: args.statusDetail,
      paidAt: args.paidAt,
      failureReason: args.failureReason,
    });

    return { success: true };
  },
});

/**
 * Cancel user subscription
 */
export const cancelSubscription = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", "authorized")
      )
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    await ctx.db.patch(subscription._id, {
      status: "cancelled",
      cancelledDate: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, message: "Subscription cancelled successfully" };
  },
}); 