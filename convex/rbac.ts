/* eslint-disable */
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";

export type UserRole = "traveler" | "partner" | "employee" | "master";

// Union type for Convex function context (query or mutation)
type Ctx = QueryCtx | MutationCtx;

// Utility function to read the current user's role from Convex "users" table.
// Fallback to "traveler" if no role has been stored yet.
export async function getCurrentUserRole(ctx: Ctx): Promise<UserRole> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    // A sessão não está autenticada, considerar como "traveler" (visitante anônimo)
    return "traveler";
  }
  // Tenta buscar o usuário pelo clerkId
  const users = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .collect();

  if (users.length === 0) {
    // Usuário autenticado mas ainda não sincronizado no Convex.
    return "traveler";
  }
  return (users[0].role as UserRole) ?? "traveler";
}

// Helper to enforce that the current user has at least one of the allowed roles.
export async function requireRole(ctx: Ctx, allowedRoles: UserRole[]): Promise<UserRole> {
  const role = await getCurrentUserRole(ctx);
  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized: insufficient role permissions");
  }
  return role;
}

// Retorna o _id do documento do usuário logado ou null caso não exista
export async function getCurrentUserConvexId(ctx: Ctx): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const users = await ctx.db
    .query("users")
    .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
    .collect();
  if (users.length === 0) return null;
  return users[0]._id as Id<"users">;
}

// ---------------------------------------------------------------------------
// Wrappers usando convex-helpers: preservam tipos sem precisar lidar com
// genéricos manuais e permitem adicionar lógica antes da execução.
// ---------------------------------------------------------------------------

export const queryWithRole = (roles: UserRole[]) =>
  customQuery(
    query,
    customCtx(async (ctx) => {
      await requireRole(ctx, roles);
      // Retorna ctx sem modificações adicionais
      return {};
    }),
  );

export const mutationWithRole = (roles: UserRole[]) =>
  customMutation(
    mutation,
    customCtx(async (ctx) => {
      await requireRole(ctx, roles);
      return {};
    }),
  ); 