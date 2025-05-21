/**
 * @deprecated This file is deprecated. Use `convex/domains/users/mutations.ts` instead.
 * This file is kept only for backward compatibility.
 * @ts-nocheck - This file is deprecated and will be removed soon
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Type definition for deleteUser return
interface DeleteUserResult {
  success: boolean;
  message: string;
  userId?: Id<"users">;
}

// Deprecated: Use syncUserFromClerk from domains/users/mutations.ts
// @ts-ignore - This declaration is intentionally not typed properly as it's deprecated
export const syncUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // Papel global do usuário; ex: "traveler", "partner", "employee", "master"
    role: v.optional(v.string()),
  },
  returns: v.any(),
  // @ts-ignore - This handler is intentionally not typed properly as it's deprecated
  handler: async (ctx, args) => {
    // Forward to the new implementation in the users domain
    return await ctx.runMutation(internal.domains.users.mutations.syncUserFromClerk, {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      phone: args.phone,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      role: args.role as any,
    });
  },
});

// Deprecated: Use deleteUserFromClerk from domains/users/mutations.ts
// @ts-ignore - This declaration is intentionally not typed properly as it's deprecated
export const deleteUser = internalMutation({
  args: {
    email: v.optional(v.string()),
    clerkId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
  }),
  // @ts-ignore - This handler is intentionally not typed properly as it's deprecated
  handler: async (ctx, args) => {
    // Forward to the new implementation in the users domain
    return await ctx.runMutation(internal.domains.users.mutations.deleteUserFromClerk, {
      clerkId: args.clerkId,
      email: args.email,
    });
  },
});
