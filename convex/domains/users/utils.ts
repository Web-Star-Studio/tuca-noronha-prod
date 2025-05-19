import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { User, UserRole } from "./types";

type Ctx = QueryCtx | MutationCtx;

/**
 * Gets the current authenticated user's Convex ID
 */
export async function getCurrentUserId(ctx: Ctx): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  
  const users = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .collect();
  
  if (users.length === 0) return null;
  return users[0]._id as Id<"users">;
}

/**
 * Gets the current authenticated user's role
 */
export async function getCurrentUserRole(ctx: Ctx): Promise<UserRole> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    // Not authenticated, consider as "traveler" (anonymous visitor)
    return "traveler";
  }
  
  // Try to find user by clerkId
  const users = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .collect();

  if (users.length === 0) {
    // Authenticated but not yet synced to Convex
    return "traveler";
  }
  
  return (users[0].role as UserRole) ?? "traveler";
}

/**
 * Checks if a user exists by Clerk ID
 */
export async function userExistsByClerkId(ctx: Ctx, clerkId: string): Promise<boolean> {
  const users = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", clerkId))
    .collect();
  
  return users.length > 0;
}

/**
 * Formats user data for client consumption
 */
export function formatUserData(user: User) {
  return {
    id: user._id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
  };
} 