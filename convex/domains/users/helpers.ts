import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Gets the current authenticated user from the database
 * Throws an error if no user is found
 */
export async function getCurrentUserOrThrow(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Usuário não autenticado");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("Usuário não encontrado no banco de dados");
  }

  return user;
}

/**
 * Gets the current authenticated user ID
 * Returns null if no user is found
 */
export async function getCurrentUserId(ctx: Ctx): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user?._id || null;
} 