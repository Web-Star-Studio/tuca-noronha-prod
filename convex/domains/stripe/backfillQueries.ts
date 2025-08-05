import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get activities that don't have Stripe products yet
 */
export const getActivitiesWithoutStripe = internalQuery({
  args: {
    limit: v.optional(v.number()),
    partnerId: v.optional(v.id("users")),
  },
  returns: v.array(v.object({
    _id: v.id("activities"),
    title: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.number(),
    partnerId: v.id("users"),
    isActive: v.boolean(),
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    let activities;
    
    // Filter by partner if specified
    if (args.partnerId) {
      const partnerId = args.partnerId; // TypeScript type narrowing
      activities = await ctx.db
        .query("activities")
        .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
        .take(limit);
    } else {
      activities = await ctx.db
        .query("activities")
        .take(limit);
    }
    
    // Filter activities that don't have Stripe products yet
    const activitiesWithoutStripe = activities.filter(activity => 
      !activity.stripeProductId && activity.isActive
    );

    return activitiesWithoutStripe.map(activity => ({
      _id: activity._id,
      title: activity.title,
      description: activity.description,
      shortDescription: activity.shortDescription,
      imageUrl: activity.imageUrl,
      price: activity.price,
      partnerId: activity.partnerId,
      isActive: activity.isActive,
      stripeProductId: activity.stripeProductId,
      stripePriceId: activity.stripePriceId,
      stripePaymentLinkId: activity.stripePaymentLinkId,
    }));
  },
});

/**
 * Get summary of Stripe integration status for activities
 */
export const getStripeIntegrationSummary = internalQuery({
  args: {},
  returns: v.object({
    totalActivities: v.number(),
    withStripeProducts: v.number(),
    withoutStripeProducts: v.number(),
    withPaymentLinks: v.number(),
    withoutPaymentLinks: v.number(),
    activeActivities: v.number(),
    inactiveActivities: v.number(),
  }),
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    
    const summary = {
      totalActivities: activities.length,
      withStripeProducts: 0,
      withoutStripeProducts: 0,
      withPaymentLinks: 0,
      withoutPaymentLinks: 0,
      activeActivities: 0,
      inactiveActivities: 0,
    };

    for (const activity of activities) {
      // Count Stripe products
      if (activity.stripeProductId) {
        summary.withStripeProducts++;
      } else {
        summary.withoutStripeProducts++;
      }

      // Count payment links
      if (activity.stripePaymentLinkId) {
        summary.withPaymentLinks++;
      } else {
        summary.withoutPaymentLinks++;
      }

      // Count active/inactive
      if (activity.isActive) {
        summary.activeActivities++;
      } else {
        summary.inactiveActivities++;
      }
    }

    return summary;
  },
});

/**
 * Get single activity for backfill
 */
export const getSingleActivityForBackfill = internalQuery({
  args: {
    activityId: v.id("activities"),
  },
  returns: v.union(
    v.object({
      _id: v.id("activities"),
      title: v.string(),
      description: v.string(),
      shortDescription: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      price: v.number(),
      partnerId: v.id("users"),
      isActive: v.boolean(),
      stripeProductId: v.optional(v.string()),
      stripePriceId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      return null;
    }
    
    return {
      _id: activity._id,
      title: activity.title,
      description: activity.description,
      shortDescription: activity.shortDescription,
      imageUrl: activity.imageUrl,
      price: activity.price,
      partnerId: activity.partnerId,
      isActive: activity.isActive,
      stripeProductId: activity.stripeProductId,
      stripePriceId: activity.stripePriceId,
      stripePaymentLinkId: activity.stripePaymentLinkId,
    };
  },
}); 

/**
 * Get assets with Stripe info for validation
 */
export const getAssetsWithStripeInfo = internalQuery({
  args: {
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      
      v.literal("vehicle")
    ),
    limit: v.number(),
  },
  returns: v.array(v.object({
    _id: v.string(),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const tableName = 
                     args.assetType === "activity" ? "activities" :
                     args.assetType === "event" ? "events" :
                     args.assetType === "restaurant" ? "restaurants" : "vehicles";
    
    const assets = await ctx.db
      .query(tableName as any)
      .filter((q) => q.neq(q.field("stripePriceId"), undefined))
      .take(args.limit);

    return assets.map(asset => ({
      _id: asset._id,
      name: (asset as any).name,
      title: (asset as any).title,
      stripePriceId: (asset as any).stripePriceId,
      stripeProductId: (asset as any).stripeProductId,
      stripePaymentLinkId: (asset as any).stripePaymentLinkId,
    }));
  },
}); 