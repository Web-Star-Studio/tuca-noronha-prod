"use node";

import { internalAction, internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

/**
 * Backfill script to create Stripe products and payment links for existing activities
 * This script should be run once to migrate existing activities to use Stripe
 */
export const backfillActivitiesStripe = internalAction({
  args: {
    dryRun: v.optional(v.boolean()), // If true, only logs what would be done
    limit: v.optional(v.number()), // Limit number of activities to process
    partnerId: v.optional(v.id("users")), // Only process activities from specific partner
  },
  returns: v.object({
    total: v.number(),
    processed: v.number(),
    succeeded: v.number(),
    failed: v.number(),
    errors: v.array(v.object({
      activityId: v.string(),
      activityTitle: v.string(),
      error: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const limit = args.limit ?? 100;
    
    console.log(`🚀 Starting activities Stripe backfill${dryRun ? ' (DRY RUN)' : ''}...`);
    
    // Get activities that need Stripe setup
    const activities = await ctx.runQuery(internal.domains.stripe.backfillQueries.getActivitiesWithoutStripe, {
      limit,
      partnerId: args.partnerId,
    });

    console.log(`📊 Found ${activities.length} activities to process`);

    const results = {
      total: activities.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ activityId: string; activityTitle: string; error: string }>,
    };

    for (const activity of activities) {
      try {
        console.log(`🔄 Processing activity: ${activity.title} (ID: ${activity._id})`);
        
        results.processed++;

        if (dryRun) {
          console.log(`   📝 [DRY RUN] Would create Stripe product for: ${activity.title}`);
          console.log(`   📝 [DRY RUN] Price: R$ ${activity.price.toFixed(2)}`);
          results.succeeded++;
          continue;
        }

        // Create Stripe product
        const productResult = await ctx.runAction(internal.domains.stripe.actions.createStripeProduct, {
          assetId: activity._id,
          assetType: "activity",
          name: activity.title,
          description: activity.shortDescription || activity.description || `Atividade: ${activity.title}`,
          imageUrl: activity.imageUrl,
          unitAmount: Math.round(activity.price * 100), // Convert to cents
          currency: "brl",
          metadata: {
            partnerId: activity.partnerId,
            assetType: "activity",
            assetId: activity._id,
          },
        });

        if (!productResult.success) {
          throw new Error(`Failed to create Stripe product: ${productResult.error}`);
        }

        console.log(`   ✅ Created Stripe product: ${productResult.productId}`);

        // Create payment link
        const paymentLinkResult = await ctx.runAction(internal.domains.stripe.actions.createStripePaymentLink, {
          assetId: activity._id,
          assetType: "activity",
          stripePriceId: productResult.priceId, // Pass the price ID directly
          afterCompletion: {
            type: "redirect",
            redirect: {
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
            },
          },
        });

        if (!paymentLinkResult.success) {
          throw new Error(`Failed to create payment link: ${paymentLinkResult.error}`);
        }

        console.log(`   ✅ Created payment link: ${paymentLinkResult.paymentLinkId}`);

        // Update activity with Stripe information
        await ctx.runMutation(internal.domains.stripe.mutations.updateAssetStripeInfo, {
          assetId: activity._id,
          assetType: "activity",
          stripeProductId: productResult.productId,
          stripePriceId: productResult.priceId,
          stripePaymentLinkId: paymentLinkResult.paymentLinkId,
          acceptsOnlinePayment: true,
          requiresUpfrontPayment: false, // Can be customized per activity
        });

        console.log(`   ✅ Updated activity with Stripe info`);
        
        results.succeeded++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Failed to process activity ${activity.title}:`, error);
        
        results.failed++;
        results.errors.push({
          activityId: activity._id,
          activityTitle: activity.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(`🎉 Backfill completed!`);
    console.log(`   📊 Total: ${results.total}`);
    console.log(`   ✅ Succeeded: ${results.succeeded}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log(`   🚨 Errors:`);
      results.errors.forEach(error => {
        console.log(`      - ${error.activityTitle}: ${error.error}`);
      });
    }

    return results;
  },
});



/**
 * Backfill script for a specific activity (useful for testing)
 */
export const backfillSingleActivity = internalAction({
  args: {
    activityId: v.id("activities"),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    
    try {
      // Get activity
      const activity = await ctx.runQuery(internal.domains.stripe.backfillQueries.getSingleActivityForBackfill, {
        activityId: args.activityId,
      });
      if (!activity) {
        throw new Error("Activity not found");
      }

      console.log(`🔄 Processing single activity: ${activity.title}`);

      if (dryRun) {
        console.log(`📝 [DRY RUN] Would create Stripe product for: ${activity.title}`);
        return { success: true };
      }

      // Check if already has Stripe product
      if (activity.stripeProductId) {
        console.log(`⚠️  Activity already has Stripe product: ${activity.stripeProductId}`);
        return {
          success: true,
          stripeProductId: activity.stripeProductId,
          stripePriceId: activity.stripePriceId,
          stripePaymentLinkId: activity.stripePaymentLinkId,
        };
      }

      // Create Stripe product
      const productResult = await ctx.runAction(internal.domains.stripe.actions.createStripeProduct, {
        assetId: activity._id,
        assetType: "activity",
        name: activity.title,
        description: activity.shortDescription || activity.description || `Atividade: ${activity.title}`,
        imageUrl: activity.imageUrl,
        unitAmount: Math.round(activity.price * 100),
        currency: "brl",
        metadata: {
          partnerId: activity.partnerId,
          assetType: "activity",
          assetId: activity._id,
        },
      });

      if (!productResult.success) {
        throw new Error(`Failed to create Stripe product: ${productResult.error}`);
      }

      // Create payment link
      const paymentLinkResult = await ctx.runAction(internal.domains.stripe.actions.createStripePaymentLink, {
        assetId: activity._id,
        assetType: "activity",
        stripePriceId: productResult.priceId, // Pass the price ID directly
      });

      if (!paymentLinkResult.success) {
        throw new Error(`Failed to create payment link: ${paymentLinkResult.error}`);
      }

      // Update activity
      await ctx.runMutation(internal.domains.stripe.mutations.updateAssetStripeInfo, {
        assetId: activity._id,
        assetType: "activity",
        stripeProductId: productResult.productId,
        stripePriceId: productResult.priceId,
        stripePaymentLinkId: paymentLinkResult.paymentLinkId,
        acceptsOnlinePayment: true,
        requiresUpfrontPayment: false,
      });

      console.log(`✅ Successfully processed activity: ${activity.title}`);

      return {
        success: true,
        stripeProductId: productResult.productId,
        stripePriceId: productResult.priceId,
        stripePaymentLinkId: paymentLinkResult.paymentLinkId,
      };

    } catch (error) {
      console.error(`❌ Failed to process activity:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
}); 