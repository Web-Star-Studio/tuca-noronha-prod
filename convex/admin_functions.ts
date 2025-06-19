import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Update user role - Simple admin function
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user from database
    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Only masters can change user roles
    if (currentUser.role !== "master") {
      throw new Error("Apenas masters podem alterar papéis de usuários");
    }

    // Get the user to be updated
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Update the user's role
    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return { success: true };
  },
});

/**
 * Toggle user active status - Simple admin function
 */
export const toggleUserActive = mutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user from database
    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Only masters can activate/deactivate users
    if (currentUser.role !== "master") {
      throw new Error("Apenas masters podem ativar/desativar usuários");
    }

    // Get the user to be updated
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Update the user's active status
    await ctx.db.patch(args.userId, {
      isActive: args.isActive,
    });

    return { success: true };
  },
}); 