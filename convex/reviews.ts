import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Create a review
export const createReview = mutation({
  args: {
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    detailedRatings: v.optional(v.object({
      value: v.optional(v.number()),
      service: v.optional(v.number()),
      cleanliness: v.optional(v.number()),
      location: v.optional(v.number()),
      food: v.optional(v.number()),
      organization: v.optional(v.number()),
      guide: v.optional(v.number()),
    })),
    visitDate: v.optional(v.string()),
    groupType: v.optional(v.string()),
    wouldRecommend: v.boolean(),
    photos: v.optional(v.array(v.string())),
    isVerified: v.optional(v.boolean()),
  },
  returns: v.id("reviews"),
  handler: async (ctx, args) => {
    // Check if user already reviewed this item
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("itemType"), args.itemType),
          q.eq(q.field("itemId"), args.itemId)
        )
      )
      .first();

    if (existingReview) {
      throw new Error("Você já avaliou este item");
    }

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Avaliação deve ser entre 1 e 5");
    }

    // Validate detailed ratings if provided
    if (args.detailedRatings) {
      const detailedRatings = args.detailedRatings;
      const ratingKeys = Object.keys(detailedRatings) as Array<keyof typeof detailedRatings>;
      
      for (const key of ratingKeys) {
        const rating = detailedRatings[key];
        if (rating !== undefined && (rating < 1 || rating > 5)) {
          throw new Error(`Avaliação detalhada de ${key} deve ser entre 1 e 5`);
        }
      }
    }

    // Get moderation settings to determine auto-approval
    const moderationSettings = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "review_moderation"))
      .first();

    // Determine approval status based on moderation settings
    // Reviews são sempre aprovadas automaticamente
    let shouldAutoApprove = true;

    // Create the review
    const reviewId = await ctx.db.insert("reviews", {
      userId: args.userId,
      itemType: args.itemType,
      itemId: args.itemId,
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      detailedRatings: args.detailedRatings,
      visitDate: args.visitDate,
      groupType: args.groupType,
      wouldRecommend: args.wouldRecommend,
      photos: args.photos,
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      isVerified: args.isVerified || false,
      isApproved: shouldAutoApprove,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Only update asset rating if review is auto-approved
    if (shouldAutoApprove) {
      // Schedule asset rating update
      await ctx.scheduler.runAfter(0, internal.domains.reviews.mutations.updateAssetRating, {
        itemType: args.itemType,
        itemId: args.itemId,
      });
    }

    return reviewId;
  },
});

// Get reviews for an item
export const getItemReviews = query({
  args: {
    itemType: v.string(),
    itemId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.string()), // "newest", "oldest", "rating_high", "rating_low", "helpful"
  },
  handler: async (ctx, args) => {
    const { limit = 20, offset = 0, sortBy = "newest" } = args;

    let reviews = await ctx.db
      .query("reviews")
      .withIndex("by_item_approved", (q) =>
        q.eq("itemType", args.itemType)
         .eq("itemId", args.itemId)
         .eq("isApproved", true)
      )
      .collect();

    // Sort reviews
    switch (sortBy) {
      case "oldest":
        reviews.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "rating_high":
        reviews.sort((a, b) => b.rating - a.rating);
        break;
      case "rating_low":
        reviews.sort((a, b) => a.rating - b.rating);
        break;
      case "helpful":
        reviews.sort((a, b) => b.helpfulVotes - a.helpfulVotes);
        break;
      case "newest":
      default:
        reviews.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    // Get user details for each review
    const reviewsWithDetails = await Promise.all(
      reviews.slice(offset, offset + limit).map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          user: user ? {
            id: user._id,
            name: user.name || "Usuário Anônimo",
            image: user.image,
          } : null,
        };
      })
    );

    return {
      reviews: reviewsWithDetails,
      total: reviews.length,
      hasMore: offset + limit < reviews.length,
    };
  },
});

// Get review statistics for an item
export const getItemReviewStats = query({
  args: {
    itemType: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_item_approved", (q) =>
        q.eq("itemType", args.itemType)
         .eq("itemId", args.itemId)
         .eq("isApproved", true)
      )
      .collect();

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recommendationPercentage: 0,
        detailedAverages: {},
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Debug logging
    console.log("🔢 Backend Rating Calculation Debug:", {
      itemType: args.itemType,
      itemId: args.itemId,
      totalReviews: reviews.length,
      individualRatings: reviews.map(r => r.rating),
      totalRating,
      averageRating,
      averageRatingRounded: Math.round(averageRating * 10) / 10,
      averageRatingFixed: averageRating.toFixed(1)
    });

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    // Recommendation percentage
    const recommendCount = reviews.filter(review => review.wouldRecommend).length;
    const recommendationPercentage = (recommendCount / reviews.length) * 100;

    // Detailed averages
    const detailedAverages: Record<string, number> = {};
    const detailedCounts: Record<string, number> = {};

    reviews.forEach(review => {
      if (review.detailedRatings) {
        Object.entries(review.detailedRatings).forEach(([key, value]) => {
          if (value !== undefined) {
            detailedAverages[key] = (detailedAverages[key] || 0) + value;
            detailedCounts[key] = (detailedCounts[key] || 0) + 1;
          }
        });
      }
    });

    // Calculate averages for detailed ratings
    Object.keys(detailedAverages).forEach(key => {
      detailedAverages[key] = detailedAverages[key] / detailedCounts[key];
    });

    const result = {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recommendationPercentage: Math.round(recommendationPercentage),
      detailedAverages,
    };

    console.log("📤 Backend Final Result:", result);
    
    return result;
  },
});

// Vote on review helpfulness
export const voteOnReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    userId: v.id("users"),
    voteType: v.string(), // "helpful" or "unhelpful"
  },
  handler: async (ctx, args) => {
    // Check if user already voted on this review
    const existingVote = await ctx.db
      .query("reviewVotes")
      .withIndex("by_user_review", (q) =>
        q.eq("userId", args.userId).eq("reviewId", args.reviewId)
      )
      .first();

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.voteType !== args.voteType) {
        await ctx.db.patch(existingVote._id, {
          voteType: args.voteType,
        });

        // Update review vote counts
        const review = await ctx.db.get(args.reviewId);
        if (review) {
          if (args.voteType === "helpful") {
            await ctx.db.patch(args.reviewId, {
              helpfulVotes: review.helpfulVotes + 1,
              unhelpfulVotes: Math.max(0, review.unhelpfulVotes - 1),
            });
          } else {
            await ctx.db.patch(args.reviewId, {
              unhelpfulVotes: review.unhelpfulVotes + 1,
              helpfulVotes: Math.max(0, review.helpfulVotes - 1),
            });
          }
        }
      }
      return;
    }

    // Create new vote
    await ctx.db.insert("reviewVotes", {
      reviewId: args.reviewId,
      userId: args.userId,
      voteType: args.voteType,
      createdAt: Date.now(),
    });

    // Update review vote counts
    const review = await ctx.db.get(args.reviewId);
    if (review) {
      if (args.voteType === "helpful") {
        await ctx.db.patch(args.reviewId, {
          helpfulVotes: review.helpfulVotes + 1,
        });
      } else {
        await ctx.db.patch(args.reviewId, {
          unhelpfulVotes: review.unhelpfulVotes + 1,
        });
      }
    }
  },
});

// Get user's review for an item
export const getUserReviewForItem = query({
  args: {
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), args.itemType),
          q.eq(q.field("itemId"), args.itemId)
        )
      )
      .first();
  },
}); 