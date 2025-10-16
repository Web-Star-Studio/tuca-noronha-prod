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
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      console.log("[hasGuideAccess] No identity found");
      return false;
    }

    // Check if user is master - masters have free access
    try {
      const userRole = await getCurrentUserRole(ctx);
      console.log("[hasGuideAccess] User role:", userRole, "ClerkId:", identity.subject);
      
      if (userRole === "master") {
        console.log("[hasGuideAccess] Master user detected - granting access");
        return true;
      }
    } catch (error) {
      console.error("[hasGuideAccess] Error checking role:", error);
      // If role check fails, continue to subscription check
    }

    // Check for active subscription
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      console.log("[hasGuideAccess] No userId found");
      return false;
    }

    const subscription = await ctx.db
      .query("guideSubscriptions")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", userId).eq("status", "authorized")
      )
      .first();

    if (!subscription) {
      console.log("[hasGuideAccess] No active subscription found for userId:", userId);
      return false;
    }

    // Check if subscription is still within valid period
    const now = Date.now();
    const isValid = !subscription.endDate || subscription.endDate > now;
    console.log("[hasGuideAccess] Subscription found, isValid:", isValid);
    return isValid;
  },
});

/**
 * Debug query to check current user's role and guide access
 */
export const debugGuideAccess = query({
  args: {},
  returns: v.object({
    hasIdentity: v.boolean(),
    clerkId: v.optional(v.string()),
    userRole: v.optional(v.string()),
    hasSubscription: v.boolean(),
    hasAccess: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return {
        hasIdentity: false,
        hasSubscription: false,
        hasAccess: false,
      };
    }

    const userRole = await getCurrentUserRole(ctx);
    const userId = await getCurrentUserClerkId(ctx);
    
    let hasSubscription = false;
    if (userId) {
      const subscription = await ctx.db
        .query("guideSubscriptions")
        .withIndex("by_user_and_status", (q) => 
          q.eq("userId", userId).eq("status", "authorized")
        )
        .first();
      hasSubscription = !!subscription;
    }

    const hasAccess = userRole === "master" || hasSubscription;

    return {
      hasIdentity: true,
      clerkId: identity.subject,
      userRole,
      hasSubscription,
      hasAccess,
    };
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

/**
 * List recent subscription webhooks from Mercado Pago
 * Admin only - shows webhooks from the last 24 hours
 */
export const listRecentSubscriptionWebhooks = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    // Check if user is admin
    const userRole = await getCurrentUserRole(ctx);
    if (userRole !== "master") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get webhooks from last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const webhooks = await ctx.db
      .query("mpWebhookEvents")
      .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
      .order("desc")
      .take(50);

    // Filter for subscription-related webhooks
    const subscriptionWebhooks = webhooks.filter((webhook: any) => 
      webhook.type === "subscription" || 
      webhook.type === "preapproval" ||
      webhook.type === "subscription_preapproval" ||
      webhook.type === "subscription_authorized_payment" ||
      (webhook.eventData && (
        webhook.eventData.type === "subscription" ||
        webhook.eventData.type === "preapproval"
      ))
    );

    return subscriptionWebhooks;
  },
}); 