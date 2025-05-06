import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Mutation para criar ou atualizar um usuário
export const syncUser = internalMutation({
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
    // Primeiro, verificar se usuário já existe pelo clerkId
    const existingUsersByClerkId = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (existingUsersByClerkId.length > 0) {
      return await ctx.db.patch(existingUsersByClerkId[0]._id, {
        email: args.email,
        name: args.name,
        image: args.image,
        phone: args.phone,
        emailVerificationTime: args.updatedAt,
      });
    }
    
    // Se não encontrar pelo clerkId, verificar pelo email
    if (args.email) {
      const existingUsersByEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
      
      if (existingUsersByEmail.length > 0) {
        // Atualizar o usuário existente, adicionando o clerkId
        return await ctx.db.patch(existingUsersByEmail[0]._id, {
          clerkId: args.clerkId,
          email: args.email,
          name: args.name,
          image: args.image,
          phone: args.phone,
          emailVerificationTime: args.updatedAt,
        });
      }
    }

    // Caso contrário, criamos um novo usuário
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      phone: args.phone,
      emailVerificationTime: args.createdAt,
      isAnonymous: false,
    });
  },
});

// Mutation para remover um usuário
export const deleteUser = internalMutation({
  args: {
    email: v.optional(v.string()),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    let users = [];
    
    // Buscar usuário pelo clerkId primeiro
    users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    // Se não encontrar pelo clerkId e tiver email, buscar pelo email
    if (users.length === 0 && args.email) {
      users = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
    }

    // Se encontrarmos o usuário, deletamos
    if (users.length > 0) {
      await ctx.db.delete(users[0]._id);
      return { success: true, message: "User deleted", userId: users[0]._id };
    }
    
    return { success: false, message: "User not found" };
  },
});
