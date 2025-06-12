import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
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
export const updateUserProfileData = mutation({
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

/**
 * Create employee for partner (Partner only)
 * Creates user directly in Clerk and stores in Convex database
 */
export const createEmployee = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")),
  },
  returns: v.object({
    employeeId: v.id("users"),
    clerkId: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Only partners can create employees
    if (currentUserRole !== "partner") {
      throw new Error("Apenas partners podem criar colaboradores");
    }

    if (!currentUserId) {
      throw new Error("ID do usuário atual não encontrado");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Email inválido");
    }

    // Validate password strength (minimum requirements)
    if (args.password.length < 8) {
      throw new Error("Senha deve ter pelo menos 8 caracteres");
    }

    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("Já existe um usuário com este email");
    }

    // Validate organization belongs to partner if provided
    if (args.organizationId) {
      const organization = await ctx.db.get(args.organizationId);
      if (!organization || organization.partnerId !== currentUserId) {
        throw new Error("Organização não encontrada ou não pertence ao partner");
      }
    }

    try {
      // Create employee record in Convex first with temporary Clerk ID
      const tempClerkId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const employeeId = await ctx.db.insert("users", {
        clerkId: tempClerkId, // Will be updated by the action
        email: args.email,
        name: args.name,
        phone: args.phone,
        role: "employee",
        partnerId: currentUserId,
        organizationId: args.organizationId,
        isAnonymous: false,
        emailVerificationTime: Date.now(),
      });

      // Store employee creation request for immediate processing
      const requestId = await ctx.db.insert("employeeCreationRequests", {
        employeeId,
        partnerId: currentUserId,
        email: args.email,
        password: args.password,
        name: args.name,
        phone: args.phone,
        organizationId: args.organizationId,
        status: "pending",
        createdAt: Date.now(),
      });

      // Process the employee creation immediately
      await ctx.scheduler.runAfter(0, internal.domains.users.actions.createEmployeeInClerk, {
        email: args.email,
        password: args.password,
        name: args.name,
        employeeId: employeeId,
      });

      // Also schedule the cleanup of the request
      await ctx.scheduler.runAfter(5000, internal.domains.users.actions.processEmployeeCreationRequests);

      return {
        employeeId,
        clerkId: tempClerkId, // Will be updated once Clerk responds
      };
    } catch (error) {
      throw new Error(`Erro ao criar colaborador: ${error}`);
    }
  },
});

/**
 * Remove an employee
 */
export const removeEmployee = mutation({
  args: {
    employeeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify the current user has permission to remove employees
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || (currentUser.role !== "partner" && currentUser.role !== "master")) {
      throw new Error("Unauthorized: Only partners and masters can remove employees");
    }

    // Get the employee to be removed
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    if (employee.role !== "employee") {
      throw new Error("User is not an employee");
    }

    // Only allow removal if the employee belongs to the current user's organization
    // or if the current user is a master
    if (currentUser.role !== "master" && employee.partnerId !== currentUser._id) {
      throw new Error("Unauthorized: You can only remove employees from your own organization");
    }

    // If the employee has a Clerk account, schedule deletion
    if (employee.clerkId) {
      await ctx.scheduler.runAfter(0, internal.domains.users.actions.deleteClerkUser, {
        clerkId: employee.clerkId,
      });
    }

    // Remove the user from Convex database
    await ctx.db.delete(args.employeeId);

    return { success: true };
  },
});

/**
 * Internal mutation to update a user with their Clerk ID
 */
export const updateUserWithClerkId = internalMutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      clerkId: args.clerkId,
    });
    return { success: true };
  },
});

/**
 * Internal mutation to delete a user
 */
export const deleteUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
    return { success: true };
  },
});

/**
 * Create a partner user (only available to Masters)
 */
export const createPartner = mutationWithRole(["master"])({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    phone: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Um usuário com este email já existe");
    }

    // First, create the user in Convex database
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: "partner",
      isAnonymous: false,
      emailVerificationTime: Date.now(),
    });

    // Schedule the action to create the user in Clerk
    await ctx.scheduler.runAfter(0, internal.domains.users.actions.createClerkPartner, {
      userId,
      name: args.name,
      email: args.email,
      password: args.password,
      phone: args.phone,
    });

    return userId;
  },
});

/**
 * Update employee creation request status (Internal)
 */
export const updateEmployeeCreationRequest = internalMutation({
  args: {
    requestId: v.id("employeeCreationRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    clerkId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    processedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = {
      status: args.status,
    };

    if (args.clerkId) {
      updateData.clerkId = args.clerkId;
    }

    if (args.errorMessage) {
      updateData.errorMessage = args.errorMessage;
    }

    if (args.processedAt) {
      updateData.processedAt = args.processedAt;
    }

    await ctx.db.patch(args.requestId, updateData);
    return null;
  },
});

/**
 * Update employee Clerk ID (Internal)
 */
export const updateEmployeeClerkId = internalMutation({
  args: {
    employeeId: v.id("users"),
    clerkId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.employeeId, {
      clerkId: args.clerkId,
      emailVerificationTime: Date.now(),
    });
    return null;
  },
});

/**
 * Mark employee creation as failed (Internal)
 */
export const markEmployeeCreationFailed = internalMutation({
  args: {
    employeeId: v.id("users"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Mark the employee user as failed/inactive
    await ctx.db.patch(args.employeeId, {
      clerkId: `failed_${Date.now()}`, // Mark as failed
      emailVerificationTime: undefined, // Remove verification time
    });

    // Find and update the creation request
    const request = await ctx.db
      .query("employeeCreationRequests")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .first();

    if (request) {
      await ctx.db.patch(request._id, {
        status: "failed",
        errorMessage: args.error,
        processedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Completar o onboarding do usuário traveler
 */
export const completeOnboarding = mutation({
  args: {
    fullName: v.string(),
    dateOfBirth: v.string(),
    phoneNumber: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Buscar o usuário atual
    const user = await ctx.db.get(currentUserId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se o usuário é do tipo traveler
    if (user.role !== "traveler") {
      throw new Error("Onboarding disponível apenas para travelers");
    }

    // Verificar se o onboarding já foi completado
    if (user.onboardingCompleted) {
      return {
        success: false,
        message: "Onboarding já foi completado anteriormente",
        userId: currentUserId,
      };
    }

    // Validar data de nascimento (formato YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(args.dateOfBirth)) {
      throw new Error("Data de nascimento deve estar no formato YYYY-MM-DD");
    }

    // Validar se a data não é futura
    const birthDate = new Date(args.dateOfBirth);
    const today = new Date();
    if (birthDate > today) {
      throw new Error("Data de nascimento não pode ser no futuro");
    }

    // Validar idade mínima (13 anos)
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      throw new Error("Usuário deve ter pelo menos 13 anos");
    }

    // Validar telefone (formato básico)
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(args.phoneNumber)) {
      throw new Error("Telefone deve estar no formato (XX) XXXXX-XXXX");
    }

    // Atualizar o usuário com os dados do onboarding
    await ctx.db.patch(currentUserId, {
      fullName: args.fullName.trim(),
      dateOfBirth: args.dateOfBirth,
      phoneNumber: args.phoneNumber,
      onboardingCompleted: true,
      onboardingCompletedAt: Date.now(),
    });

    return {
      success: true,
      message: "Onboarding completado com sucesso!",
      userId: currentUserId,
    };
  },
});

/**
 * Verificar status do onboarding do usuário
 */
export const getOnboardingStatus = mutation({
  args: {},
  returns: v.object({
    isCompleted: v.boolean(),
    needsOnboarding: v.boolean(),
    userRole: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      return {
        isCompleted: false,
        needsOnboarding: false,
        userRole: undefined,
      };
    }

    const user = await ctx.db.get(currentUserId);
    if (!user) {
      return {
        isCompleted: false,
        needsOnboarding: false,
        userRole: undefined,
      };
    }

    // Apenas travelers precisam de onboarding
    const needsOnboarding = user.role === "traveler" && !user.onboardingCompleted;

    return {
      isCompleted: user.onboardingCompleted || false,
      needsOnboarding,
      userRole: user.role,
    };
  },
});

/**
 * Atualizar dados do perfil do usuário (após onboarding)
 */
export const updateUserProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db.get(currentUserId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se o onboarding foi completado
    if (!user.onboardingCompleted && user.role === "traveler") {
      throw new Error("Complete o onboarding antes de atualizar o perfil");
    }

    const updates: any = {};

    if (args.fullName) {
      updates.fullName = args.fullName.trim();
    }

    if (args.phoneNumber) {
      // Validar telefone
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(args.phoneNumber)) {
        throw new Error("Telefone deve estar no formato (XX) XXXXX-XXXX");
      }
      updates.phoneNumber = args.phoneNumber;
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        message: "Nenhum campo para atualizar",
      };
    }

    await ctx.db.patch(currentUserId, updates);

    return {
      success: true,
      message: "Perfil atualizado com sucesso!",
    };
  },
}); 