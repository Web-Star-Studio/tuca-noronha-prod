import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";

/**
 * Record a guide purchase
 * Called by payment webhook after successful payment
 */
export const recordPurchase = internalMutation({
  args: {
    userId: v.string(), // Clerk user ID
    userEmail: v.string(),
    userName: v.optional(v.string()),
    mpPaymentId: v.string(),
    mpPreferenceId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    statusDetail: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    paymentTypeId: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    externalReference: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if purchase already exists
    const existing = await ctx.db
      .query("guidePurchases")
      .withIndex("by_mpPaymentId", (q) => q.eq("mpPaymentId", args.mpPaymentId))
      .first();

    if (existing) {
      console.log(`[Guide] Purchase already exists for payment ${args.mpPaymentId}, updating...`);
      
      // Update existing purchase
      await ctx.db.patch(existing._id, {
        status: args.status as any,
        statusDetail: args.statusDetail,
        approvedAt: args.approvedAt,
        paymentMethod: args.paymentMethod,
        paymentTypeId: args.paymentTypeId,
      });
      
      return existing._id;
    }

    // Create new purchase
    const purchaseId = await ctx.db.insert("guidePurchases", {
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      mpPaymentId: args.mpPaymentId,
      mpPreferenceId: args.mpPreferenceId,
      amount: args.amount,
      currency: args.currency,
      status: args.status as any,
      statusDetail: args.statusDetail,
      paymentMethod: args.paymentMethod,
      paymentTypeId: args.paymentTypeId,
      purchasedAt: Date.now(),
      approvedAt: args.approvedAt,
      externalReference: args.externalReference,
      metadata: args.metadata,
    });

    console.log(`[Guide] Purchase recorded: ${purchaseId} for user ${args.userId}`);
    
    return purchaseId;
  },
});

/**
 * Update guide purchase status
 * Called by payment webhook when payment status changes
 */
export const updatePurchaseStatus = internalMutation({
  args: {
    mpPaymentId: v.string(),
    status: v.string(),
    statusDetail: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("guidePurchases")
      .withIndex("by_mpPaymentId", (q) => q.eq("mpPaymentId", args.mpPaymentId))
      .first();

    if (!purchase) {
      throw new Error(`Guide purchase not found for payment ${args.mpPaymentId}`);
    }

    await ctx.db.patch(purchase._id, {
      status: args.status as any,
      statusDetail: args.statusDetail,
      approvedAt: args.approvedAt,
    });

    console.log(`[Guide] Purchase ${purchase._id} status updated to ${args.status}`);
  },
});
