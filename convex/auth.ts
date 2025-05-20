/**
 * @deprecated This file is deprecated. Many functions have been moved to domains
 * Please use `convex/domains/users/queries.ts` for user-related functions.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { AuthContextWithClerk, ClerkUserIdentity, User } from "./types";
import { isAuthenticated } from "./types";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Helper function to get user from auth context
export const getUserFromContext = async (ctx: AuthContextWithClerk): Promise<User> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!isAuthenticated(identity)) {
    throw new Error("Unauthorized");
  }
  return {
    id: identity.subject,
    name: identity.name,
    email: identity.email,
    image: identity.pictureUrl
  };
};

/**
 * Get the current authenticated user
 * @deprecated Use domains.users.queries.getCurrentUser instead
 */
export const getUser = query({
  args: {},
  handler: async (ctx): Promise<User | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return {
      id: identity.subject,
      name: identity.name,
      email: identity.email,
      image: identity.pictureUrl
    };
  },
});

/**
 * Get Convex user ID by Clerk ID
 * @deprecated Use domains.users.queries.getUserByClerkId instead
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    // Find user by clerkId
    const users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (users.length > 0) {
      return users[0]._id;
    }
    
    // If no user found, return null
    return null;
  },
});

// Auth requirement helper for use in other functions
export const requireAuth = async (ctx: AuthContextWithClerk): Promise<ClerkUserIdentity> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
};
