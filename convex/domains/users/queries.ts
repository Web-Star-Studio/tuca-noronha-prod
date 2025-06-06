import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { User, UserWithRole } from "./types";
import { queryWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";
import { UserRole } from "../rbac/types";

/**
 * Get the current authenticated user's information
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      id: v.id("users"),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      role: v.string(),
    }),
    v.null()
  ),
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
    // Ensure clerkId is not undefined before returning
    if (!user.clerkId) {
      console.log("User has no clerkId:", user._id);
      return null;
    }
    
    return {
      _id: user._id,
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
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      phone: v.optional(v.string()),
      role: v.optional(v.string()),
      partnerId: v.optional(v.id("users")),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    // Ensure clerkId exists before returning
    if (!user.clerkId) {
      return null;
    }
    
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      phone: user.phone,
      role: user.role,
      partnerId: user.partnerId,
      emailVerificationTime: user.emailVerificationTime,
      isAnonymous: user.isAnonymous,
    };
  },
});

/**
 * Get a user by their Convex ID
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      phone: v.optional(v.string()),
      role: v.optional(v.string()),
      partnerId: v.optional(v.id("users")),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user || !user.clerkId) {
      return null;
    }
    
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      phone: user.phone,
      role: user.role,
      partnerId: user.partnerId,
      emailVerificationTime: user.emailVerificationTime,
      isAnonymous: user.isAnonymous,
    };
  },
});

/**
 * Get all users (admin only)
 */
export const getAllUsers = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })),
  handler: async (ctx) => {
    // Note: In a production environment, you might want to add role-based access control here
    // For now, returning all users for admin functionality
    const users = await ctx.db.query("users").collect();
    
    // Filter out users without clerkId and map to proper format
    return users
      .filter(user => user.clerkId)
      .map(user => ({
        _id: user._id,
        _creationTime: user._creationTime,
        clerkId: user.clerkId as string, // safe because we filtered for clerkId existence
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        role: user.role,
        partnerId: user.partnerId,
        emailVerificationTime: user.emailVerificationTime,
        isAnonymous: user.isAnonymous,
      }));
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
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    // Using a filter since there's no 'by_role' index in the schema yet
    const users = await ctx.db
      .query("users")
      .collect();
    
    // Filter in memory for users with the specified role and valid clerkId
    return users
      .filter(user => user.role === args.role && user.clerkId)
      .map(user => ({
        _id: user._id,
        _creationTime: user._creationTime,
        clerkId: user.clerkId as string, // safe because we filtered for clerkId existence
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        role: user.role,
        partnerId: user.partnerId,
        emailVerificationTime: user.emailVerificationTime,
        isAnonymous: user.isAnonymous,
      }));
  },
}); 