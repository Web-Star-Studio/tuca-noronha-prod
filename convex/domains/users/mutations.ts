import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { mutationWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";
import type { UserCreateInput, UserUpdateInput } from "./types";
import { UserRole } from "../rbac/types";

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
    // Check if user already exists with this clerkId
    const existingUsersByClerkId = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (existingUsersByClerkId.length > 0) {
      console.log("User already exists:", existingUsersByClerkId[0]._id);
      return existingUsersByClerkId[0]._id;
    }
    
    // If not found by clerkId and has email, check by email
    if (args.email) {
      const existingUsersByEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
      
      if (existingUsersByEmail.length > 0) {
        // Update existing user with clerkId
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

    // Otherwise, create a new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      phone: args.phone,
      emailVerificationTime: args.createdAt,
      isAnonymous: false,
      role: "traveler", // Default role for new users
    });
    
    console.log("New user created:", userId);
    return userId;
  },
});

/**
 * Internal mutation for syncing users from Clerk webhooks
 */
export const syncUserFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // Optional role parameter for use in admin functionality
    role: v.optional(v.union(
      v.literal("traveler"),
      v.literal("partner"),
      v.literal("employee"),
      v.literal("master")
    )),
  },
  handler: async (ctx, args) => {
    console.log(`=== INÍCIO: syncUserFromClerk para clerkId=${args.clerkId}, email=${args.email} ===`);
    
    // Primeiro verificamos se existe algum convite pendente para esse e-mail
    let partnerId: Id<"users"> | undefined = undefined;
    let userRole = args.role || "traveler"; // Default role é traveler se não for especificado
    
    if (args.email) {
      console.log(`Verificando convites pendentes para email ${args.email}...`);
      const pendingInvites = await ctx.db
        .query("invites")
        .withIndex("by_email", (q) => q.eq("email", args.email as string))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      
      if (pendingInvites.length > 0) {
        console.log(`Encontrados ${pendingInvites.length} convites pendentes para ${args.email}`);
        
        // Encontra o usuário (employee placeholder) associado ao convite
        const invite = pendingInvites[0]; // Usamos o primeiro convite se houver vários
        const employee = await ctx.db.get(invite.employeeId);
        
        if (employee) {
          console.log(`Encontrado employee placeholder: ${employee._id}`);
          userRole = "employee"; // Garante que o papel será employee
          partnerId = employee.partnerId; // Obtém o partnerId do convite
          
          // Marca todos os convites como usados
          for (const inv of pendingInvites) {
            await ctx.db.patch(inv._id, { status: "used" });
            console.log(`Convite ${inv._id} marcado como usado`);
          }
        }
      } else {
        console.log(`Nenhum convite pendente encontrado para ${args.email}`);
      }
    }

    // First check if user exists by clerkId
    const existingUsersByClerkId = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (existingUsersByClerkId.length > 0) {
      // Update existing user
      console.log(`Atualizando usuário existente pelo clerkId: ${existingUsersByClerkId[0]._id}`);
      
      // Preserva o papel atual do usuário, a menos que tenhamos um papel de convite
      const currentRole = existingUsersByClerkId[0].role;
      const finalRole = userRole === "employee" ? userRole : (currentRole || userRole);
      
      // Preserva o partnerId existente, a menos que tenhamos um novo do convite
      const finalPartnerId = partnerId || existingUsersByClerkId[0].partnerId;
      
      return await ctx.db.patch(existingUsersByClerkId[0]._id, {
        email: args.email,
        name: args.name,
        image: args.image,
        phone: args.phone,
        emailVerificationTime: args.updatedAt,
        role: finalRole,
        ...(finalPartnerId ? { partnerId: finalPartnerId } : {}),
      });
    }
    
    // If not found by clerkId and has email, check by email
    if (args.email) {
      const existingUsersByEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
      
      if (existingUsersByEmail.length > 0) {
        // Update existing user with clerkId
        console.log(`Atualizando usuário existente pelo email: ${existingUsersByEmail[0]._id}`);
        
        // Preserva o papel atual do usuário, a menos que tenhamos um papel de convite
        const currentRole = existingUsersByEmail[0].role;
        const finalRole = userRole === "employee" ? userRole : (currentRole || userRole);
        
        // Preserva o partnerId existente, a menos que tenhamos um novo do convite
        const finalPartnerId = partnerId || existingUsersByEmail[0].partnerId;
        
        return await ctx.db.patch(existingUsersByEmail[0]._id, {
          clerkId: args.clerkId,
          email: args.email,
          name: args.name,
          image: args.image,
          phone: args.phone,
          emailVerificationTime: args.updatedAt,
          role: finalRole,
          ...(finalPartnerId ? { partnerId: finalPartnerId } : {}),
        });
      }
    }
    
    // If no existing user found, create a new one
    console.log(`Criando novo usuário com clerkId=${args.clerkId}, role=${userRole}`);
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      image: args.image,
      phone: args.phone,
      emailVerificationTime: args.createdAt || args.updatedAt,
      isAnonymous: false,
      role: userRole,
      ...(partnerId ? { partnerId } : {}),
    });
  },
});

/**
 * Internal mutation for handling user deletion from Clerk
 */
export const deleteUserFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find user by clerkId
    let users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    // If not found and email is provided, try by email
    if (users.length === 0 && args.email) {
      users = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
    }
    
    // Delete the user if found
    if (users.length > 0) {
      await ctx.db.delete(users[0]._id);
      return { success: true, message: "User deleted", userId: users[0]._id };
    }
    
    return { success: false, message: "User not found" };
  },
});

/**
 * Update a user's role (only available to Masters)
 */
export const setRole = mutationWithRole(["master"])({
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
    await ctx.db.patch(args.userId, { role: args.role });
    return null;
  },
});

/**
 * Update user profile information
 */
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    // Ensure user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Ensure user is updating their own profile
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    if (user.clerkId !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own profile");
    }
    
    await ctx.db.patch(userId, updates);
    return userId;
  },
});

/**
 * Mutation version of getUserByClerkId
 * This allows the function to be awaited in async contexts
 */
export const getUserByClerkId = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("MUTATION: getUserByClerkId called with clerkId:", args.clerkId);
    
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    console.log("MUTATION: Current auth identity:", identity ? "Authenticated as " + identity.subject : "Not authenticated");
    
    // Query for the user
    const users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    console.log("MUTATION: Found users:", users.length);
    
    if (users.length === 0) {
      console.log("MUTATION: No user found with clerkId:", args.clerkId);
      
      // Try to find user with a case-insensitive search for debugging
      const allUsers = await ctx.db.query("users").collect();
      console.log("MUTATION: Total users in database:", allUsers.length);
      
      if (allUsers.length > 0) {
        console.log("MUTATION: Sample of user IDs in database:", 
          allUsers.slice(0, 5).map(u => ({
            _id: u._id,
            clerkId: u.clerkId,
            email: u.email
          }))
        );
      }
      
      return null;
    }
    
    console.log("MUTATION: Found user:", users[0]._id, "with clerkId:", users[0].clerkId);
    return users[0]._id;
  },
}); 