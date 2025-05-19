import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { User, UserWithRole } from "./types";

/**
 * Get the current authenticated user's information
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find user by clerkId
    const users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .collect();
    
    if (users.length === 0) {
      console.log("User not found for subject:", identity.subject);
      return null;
    }
    
    const user = users[0];
    return {
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role || "traveler",
    };
  },
});

/**
 * Get a user by their Clerk ID
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0];
  },
});

/**
 * Get a user by their Convex ID
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get users by role
 */
export const getUsersByRole = query({
  args: {
    role: v.union(
      v.literal("traveler"),
      v.literal("partner"),
      v.literal("employee"),
      v.literal("master"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
}); 