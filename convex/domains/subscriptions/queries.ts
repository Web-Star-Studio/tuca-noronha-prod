import { query, internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserRole } from "../rbac";

/**
 * Get the current user's Clerk ID (for subscriptions)
 */
async function getCurrentUserClerkId(ctx: any): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

/**
 * Check if the current user has an active guide subscription
 */
export const hasActiveSubscription = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      return false;
    }

    // Check for active subscription
    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", userId).eq("status", "authorized")
      )
      .first();

    if (!subscription) {
      return false;
    }

    // Check if subscription is still within valid period
    const now = Date.now();
    return !subscription.endDate || subscription.endDate > now;
  },
});

/**
 * Check if the current user has access to the guide (master role or active subscription)
 */
export const hasGuideAccess = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    // Check if user is master - masters have free access
    try {
      const userRole = await getCurrentUserRole(ctx);
      if (userRole === "master") {
        return true;
      }
    } catch (error) {
      // If role check fails, continue to subscription check
    }

    // Check for active subscription
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      return false;
    }

    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", userId).eq("status", "authorized")
      )
      .first();

    if (!subscription) {
      return false;
    }

    // Check if subscription is still within valid period
    const now = Date.now();
    return !subscription.endDate || subscription.endDate > now;
  },
});

/**
 * Get current user's subscription details
 */
export const getCurrentSubscription = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = await getCurrentUserClerkId(ctx);
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
    const userId = await getCurrentUserClerkId(ctx);
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
 * Get subscription by Mercado Pago preapproval ID
 */
export const getByMpPreapprovalId = query({
  args: { mpPreapprovalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_mp_preapproval", (q) => 
        q.eq("mpPreapprovalId", args.mpPreapprovalId)
      )
      .first();
  },
});

/**
 * Internal query to get user's subscription by ID
 */
export const getUserSubscriptionInternal = internalQuery({
  args: { userId: v.string() }, // Clerk user ID
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", args.userId).eq("status", "authorized")
      )
      .first();
  },
}); 