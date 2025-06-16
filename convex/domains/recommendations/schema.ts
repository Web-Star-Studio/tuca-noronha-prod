import { defineTable } from "convex/server";
import { v } from "convex/values";

export const cachedRecommendationsTable = defineTable({
  userId: v.id("users"),
  preferencesHash: v.string(), // Hash das preferências para invalidação eficiente
  recommendations: v.array(v.object({
    id: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    reasoning: v.string(),
    matchScore: v.number(),
    category: v.string(),
    priceRange: v.string(),
    features: v.array(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    estimatedPrice: v.number(),
    aiGenerated: v.boolean(),
    partnerId: v.string(),
    partnerName: v.optional(v.string()),
    rating: v.number(),
    tags: v.array(v.string()),
    isActive: v.boolean(),
    adventureLevel: v.optional(v.number()),
    luxuryLevel: v.optional(v.number()),
    socialLevel: v.optional(v.number()),
    duration: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    interests: v.array(v.string()),
    hasRealPrice: v.boolean(),
    hasRealRating: v.boolean(),
    realPrice: v.union(v.number(), v.null()),
    realRating: v.union(v.number(), v.null()),
    aiInsights: v.optional(v.array(v.string())),
  })),
  personalizedMessage: v.string(),
  processingTime: v.number(),
  isUsingAI: v.boolean(),
  confidenceScore: v.optional(v.number()),
  category: v.optional(v.string()), // Para cache por categoria
  cacheVersion: v.string(), // Para futuras invalidações em massa
  expiresAt: v.number(), // Timestamp de expiração
})
  .index("by_user", ["userId"])
  .index("by_user_and_hash", ["userId", "preferencesHash"])
  .index("by_user_and_category", ["userId", "category"])
  .index("by_expiration", ["expiresAt"]); 