import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserConvexId } from "../rbac";

/**
 * Check if the current user has an active guide subscription
 */
export const hasActiveSubscription = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return false;
    }

    // Check for active subscription
    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", userId).eq("status", "active")
      )
      .first();

    if (!subscription) {
      return false;
    }

    // Check if subscription is still within valid period
    const now = Date.now();
    return subscription.currentPeriodEnd > now;
  },
});

/**
 * Get current user's subscription details
 */
export const getCurrentSubscription = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return null;
    }

    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return subscription;
  },
});

/**
 * Get subscription payment history
 */
export const getPaymentHistory = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return [];
    }

    const payments = await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    return payments;
  },
});

/**
 * Get subscription by Stripe subscription ID
 */
export const getByStripeSubscriptionId = query({
  args: { stripeSubscriptionId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_stripe_subscription", (q) => 
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();
  },
}); 