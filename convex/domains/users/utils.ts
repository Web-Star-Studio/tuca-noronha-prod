import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { User } from "./types";
import { 
  getCurrentUserRole as getRBACUserRole, 
  getCurrentUserConvexId 
} from "../rbac/utils";
import { UserRole } from "../rbac/types";

type Ctx = QueryCtx | MutationCtx;

/**
 * Gets the current authenticated user's Convex ID
 * @deprecated Use getCurrentUserConvexId from RBAC domain instead
 */
export async function getCurrentUserId(ctx: Ctx): Promise<Id<"users"> | null> {
  return await getCurrentUserConvexId(ctx);
}

/**
 * Gets the current authenticated user's role
 * @deprecated Use getCurrentUserRole from RBAC domain instead
 */
export async function getCurrentUserRole(ctx: Ctx): Promise<UserRole> {
  return await getRBACUserRole(ctx);
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