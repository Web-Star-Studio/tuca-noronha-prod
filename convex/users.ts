import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireRole } from "./rbac";

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
    // Verificar se já existe um usuário com este clerkId
    const existingUsersByClerkId = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (existingUsersByClerkId.length > 0) {
      console.log("User already exists:", existingUsersByClerkId[0]._id);
      return existingUsersByClerkId[0]._id;
    }
    
    // Se não encontrar pelo clerkId e tiver email, verificar pelo email
    if (args.email) {
      const existingUsersByEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
      
      if (existingUsersByEmail.length > 0) {
        // Atualizar o usuário existente, adicionando o clerkId
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

    // Caso contrário, criamos um novo usuário
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      phone: args.phone,
      emailVerificationTime: args.createdAt,
      isAnonymous: false,
      role: "traveler", // Papel padrão para novos usuários
    });
    
    console.log("New user created:", userId);
    return userId;
  },
});

/**
 * Get the current user's ID and details
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Buscar o usuário pelo clerkId
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
 * Atualiza o papel (role) de um usuário. Somente disponível para Masters.
 */
export const setRole = mutation({
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
    await requireRole(ctx, ["master"]);
    await ctx.db.patch(args.userId, { role: args.role });
    return null;
  },
}); 