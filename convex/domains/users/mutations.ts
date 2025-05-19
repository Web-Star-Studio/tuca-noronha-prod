import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { mutationWithRole } from "../../shared/rbac";
import type { UserCreateInput, UserUpdateInput } from "./types";

/**
 * Create a user in the Convex database from the API
 * This allows us to manually sync users from Clerk to Convex if they weren't synced by the webhook
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists with this clerkId
    const existingUsersByClerkId = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (existingUsersByClerkId.length > 0) {
      console.log("User already exists:", existingUsersByClerkId[0]._id);
      return existingUsersByClerkId[0]._id;
    }
    
    // If not found by clerkId and has email, check by email
    if (args.email) {
      const existingUsersByEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
      
      if (existingUsersByEmail.length > 0) {
        // Update existing user with clerkId
        await ctx.db.patch(existingUsersByEmail[0]._id, {
          clerkId: args.clerkId,
          email: args.email,
          name: args.name,
          image: args.image,
          phone: args.phone,
          emailVerificationTime: args.updatedAt,
        });
        
        console.log("User updated with clerkId:", existingUsersByEmail[0]._id);
        return existingUsersByEmail[0]._id;
      }
    }

    // Otherwise, create a new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      phone: args.phone,
      emailVerificationTime: args.createdAt,
      isAnonymous: false,
      role: "traveler", // Default role for new users
    });
    
    console.log("New user created:", userId);
    return userId;
  },
});

/**
 * Update a user's role (only available to Masters)
 */
export const setRole = mutationWithRole(["master"])({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("traveler"),
      v.literal("partner"),
      v.literal("employee"),
      v.literal("master"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
    return null;
  },
});

/**
 * Update user profile information
 */
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    // Ensure user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Ensure user is updating their own profile
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    if (user.clerkId !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own profile");
    }
    
    await ctx.db.patch(userId, updates);
    return userId;
  },
}); 