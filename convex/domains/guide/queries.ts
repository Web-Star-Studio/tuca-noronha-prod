import { query, internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserRole } from "../rbac";

/**
 * Get the current user's Clerk ID
 */
async function getCurrentUserClerkId(ctx: any): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

/**
 * Check if the current user has purchased the guide
 */
export const hasPurchasedGuide = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      return false;
    }

    // Check for approved purchase
    const purchase = await ctx.db
      .query("guidePurchases")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", userId).eq("status", "approved")
      )
      .first();

    return !!purchase;
  },
});

/**
 * Check if the current user has access to the guide
 * Masters have free access, others need to have purchased
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
      // If role check fails, continue to purchase check
    }

    // Check if user has purchased the guide
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      console.log("[hasGuideAccess] No userId found");
      return false;
    }

    const purchase = await ctx.db
      .query("guidePurchases")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", userId).eq("status", "approved")
      )
      .first();

    if (!purchase) {
      console.log("[hasGuideAccess] No approved purchase found for userId:", userId);
      return false;
    }

    console.log("[hasGuideAccess] Purchase found:", purchase._id);
    return true;
  },
});

/**
 * Get current user's guide purchase
 */
export const getCurrentPurchase = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("guidePurchases")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
  },
});

/**
 * Internal query to get purchase by user ID
 */
export const getPurchaseByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guidePurchases")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", args.userId).eq("status", "approved")
      )
      .first();
  },
});

/**
 * Internal query to get purchase by MP payment ID
 */
export const getPurchaseByMpPaymentId = internalQuery({
  args: { mpPaymentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guidePurchases")
      .withIndex("by_mpPaymentId", (q) => q.eq("mpPaymentId", args.mpPaymentId))
      .first();
  },
});

/**
 * Debug query to check user's purchases
 */
export const debugUserPurchases = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserClerkId(ctx);
    if (!userId) {
      return { error: "No userId found", userId: null, purchases: [] };
    }

    const allPurchases = await ctx.db
      .query("guidePurchases")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return {
      userId,
      purchasesCount: allPurchases.length,
      purchases: allPurchases.map(p => ({
        _id: p._id,
        status: p.status,
        mpPaymentId: p.mpPaymentId,
        purchasedAt: p.purchasedAt,
        approvedAt: p.approvedAt,
      }))
    };
  },
});
