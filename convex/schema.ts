import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  authAccounts: defineTable({
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("userIdAndProvider", ["userId", "provider"]),
  authRateLimits: defineTable({
    attemptsLeft: v.float64(),
    identifier: v.string(),
    lastAttemptTime: v.float64(),
  }).index("identifier", ["identifier"]),
  authRefreshTokens: defineTable({
    expirationTime: v.float64(),
    firstUsedTime: v.optional(v.float64()),
    parentRefreshTokenId: v.optional(v.id("authRefreshTokens")),
    sessionId: v.id("authSessions"),
  })
    .index("sessionId", ["sessionId"])
    .index("sessionIdAndParentRefreshTokenId", [
      "sessionId",
      "parentRefreshTokenId",
    ]),
  authSessions: defineTable({
    expirationTime: v.float64(),
    userId: v.id("users"),
  }).index("userId", ["userId"]),
  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    code: v.string(),
    emailVerified: v.optional(v.string()),
    expirationTime: v.float64(),
    phoneVerified: v.optional(v.string()),
    provider: v.string(),
    verifier: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("code", ["code"]),
  authVerifiers: defineTable({
    sessionId: v.optional(v.id("authSessions")),
    signature: v.optional(v.string()),
  }).index("signature", ["signature"]),
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    role: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("clerkId", ["clerkId"]),
  activities: defineTable({
    title: v.string(),
    description: v.string(),
    shortDescription: v.string(),
    price: v.float64(),
    category: v.string(),
    duration: v.string(),
    maxParticipants: v.int64(),
    minParticipants: v.int64(),
    difficulty: v.string(),
    rating: v.float64(),
    imageUrl: v.string(),
    galleryImages: v.array(v.string()),
    highlights: v.array(v.string()),
    includes: v.array(v.string()),
    itineraries: v.array(v.string()),
    excludes: v.array(v.string()),
    additionalInfo: v.array(v.string()),
    cancelationPolicy: v.array(v.string()),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
  }),
});
