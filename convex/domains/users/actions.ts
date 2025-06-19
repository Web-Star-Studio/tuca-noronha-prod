"use node";

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { clerkClient } from "@clerk/clerk-sdk-node";
import * as crypto from "crypto";

/**
 * Internal action to create a user in Clerk
 */
export const createClerkUser = internalAction({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Import Clerk SDK
      const { clerkClient } = await import('@clerk/clerk-sdk-node');
      
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error("CLERK_SECRET_KEY is not configured");
      }

      // Create user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [args.email],
        password: args.password,
        firstName: args.name.split(' ')[0] || args.name,
        lastName: args.name.split(' ').slice(1).join(' ') || undefined,
        skipPasswordChecks: false,
        skipPasswordRequirement: false,
      });

      console.log(`Clerk user created: ${clerkUser.id} for email: ${args.email}`);

      // Update the Convex user with the Clerk ID
      await ctx.runMutation(internal.domains.users.mutations.updateUserWithClerkId, {
        userId: args.userId,
        clerkId: clerkUser.id,
      });

      return { success: true, clerkId: clerkUser.id };
    } catch (error) {
      console.error("Error creating Clerk user:", error);
      
      // If Clerk user creation fails, we should clean up the Convex user
      await ctx.runMutation(internal.domains.users.mutations.deleteUser, {
        userId: args.userId,
      });
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create user in Clerk: ${errorMessage}`);
    }
  },
});

/**
 * Internal action to delete a user from Clerk
 */
export const deleteClerkUser = internalAction({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Import Clerk SDK
      const { clerkClient } = await import('@clerk/clerk-sdk-node');
      
      if (!process.env.CLERK_SECRET_KEY) {
        console.warn("CLERK_SECRET_KEY is not configured, skipping Clerk user deletion");
        return { success: false, reason: "No Clerk secret key" };
      }

      // Delete user from Clerk
      await clerkClient.users.deleteUser(args.clerkId);

      console.log(`Clerk user deleted: ${args.clerkId}`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting Clerk user:", error);
      
      // Don't throw error here as the Convex user has already been deleted
      // and we don't want to fail the entire operation
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Action to send invitation email to a new employee
 */
export const sendEmployeeInvitation = action({
  args: {
    email: v.string(),
    organizationName: v.string(),
    inviterName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Here you could integrate with an email service like SendGrid, Resend, etc.
      // For now, we'll just log the invitation
      console.log(`Sending invitation email to: ${args.email}`);
      console.log(`Organization: ${args.organizationName}`);
      console.log(`Invited by: ${args.inviterName}`);
      
      // TODO: Implement actual email sending
      // Example with Resend:
      // const { Resend } = await import('resend');
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // 
      // await resend.emails.send({
      //   from: 'noreply@yourdomain.com',
      //   to: args.email,
      //   subject: `Convite para ${args.organizationName}`,
      //   html: `
      //     <h1>Você foi convidado para ${args.organizationName}</h1>
      //     <p>Olá! ${args.inviterName} convidou você para fazer parte da equipe de ${args.organizationName}.</p>
      //     <p>Sua conta foi criada e você já pode fazer login no sistema.</p>
      //   `
      // });

      return { success: true };
    } catch (error) {
      console.error("Error sending invitation email:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Internal action to create a partner user in Clerk
 */
export const createClerkPartner = internalAction({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    password: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Import Clerk SDK
      const { clerkClient } = await import('@clerk/clerk-sdk-node');
      
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error("CLERK_SECRET_KEY is not configured");
      }

      // Create user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [args.email],
        password: args.password,
        firstName: args.name.split(' ')[0] || args.name,
        lastName: args.name.split(' ').slice(1).join(' ') || undefined,
        ...(args.phone ? { phoneNumber: [args.phone] } : {}),
        skipPasswordChecks: false,
        skipPasswordRequirement: false,
      });

      console.log(`Clerk partner created: ${clerkUser.id} for email: ${args.email}`);

      // Update the Convex user with the Clerk ID
      await ctx.runMutation(internal.domains.users.mutations.updateUserWithClerkId, {
        userId: args.userId,
        clerkId: clerkUser.id,
      });

      return { success: true, clerkId: clerkUser.id };
    } catch (error) {
      console.error("Error creating Clerk partner:", error);
      
      // If Clerk user creation fails, we should clean up the Convex user
      await ctx.runMutation(internal.domains.users.mutations.deleteUser, {
        userId: args.userId,
      });
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create partner in Clerk: ${errorMessage}`);
    }
  },
});

/**
 * Create employee directly in Clerk without email verification
 */
export const createEmployeeInClerk = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    employeeId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    clerkUserId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Import Clerk SDK
      const { clerkClient } = await import('@clerk/clerk-sdk-node');
      
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error("CLERK_SECRET_KEY is not configured");
      }

      // Create user in Clerk WITHOUT email verification
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [args.email],
        password: args.password,
        firstName: args.name.split(' ')[0] || args.name,
        lastName: args.name.split(' ').slice(1).join(' ') || undefined,
        skipPasswordChecks: false,
        skipPasswordRequirement: false,
        // Key settings to avoid email verification:
        // The user is created with password directly, no email verification needed
      });

      console.log(`Employee created in Clerk: ${clerkUser.id} for email: ${args.email}`);

      // Update the employee record with the real Clerk ID using the sync function
      // This ensures proper synchronization with all Clerk data
      await ctx.runMutation(internal.domains.users.mutations.syncUserFromClerk, {
        clerkId: clerkUser.id,
        email: args.email,
        name: args.name,
        image: clerkUser.imageUrl,
        phone: clerkUser.phoneNumbers?.[0]?.phoneNumber,
        createdAt: clerkUser.createdAt,
        updatedAt: clerkUser.updatedAt,
        role: "employee",
      });

      console.log(`Employee automatically synchronized with Clerk ID: ${clerkUser.id}`);
      
      return {
        success: true,
        clerkUserId: clerkUser.id,
      };
      
    } catch (error) {
      console.error(`Failed to create employee in Clerk: ${args.email}`, error);
      
      // If Clerk user creation fails, we should mark the employee as failed
      try {
        await ctx.runMutation(internal.domains.users.mutations.markEmployeeCreationFailed, {
          employeeId: args.employeeId,
          error: error instanceof Error ? error.message : String(error),
        });
      } catch (updateError) {
        console.error("Failed to mark employee creation as failed:", updateError);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Process employee creation requests and create users in Clerk
 */
export const processEmployeeCreationRequests = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get pending employee creation requests
    const pendingRequests = await ctx.runQuery(internal.domains.users.queries.getPendingEmployeeRequests);

    for (const request of pendingRequests) {
      try {
        // Mark as processing
        await ctx.runMutation(internal.domains.users.mutations.updateEmployeeCreationRequest, {
          requestId: request._id,
          status: "processing",
        });

        // Create user in Clerk directly
        const result = await ctx.runAction(internal.domains.users.actions.createEmployeeInClerk, {
          email: request.email,
          password: request.password,
          name: request.name,
          employeeId: request.employeeId,
        });

        if (result.success && result.clerkUserId) {
          // Mark request as completed
          await ctx.runMutation(internal.domains.users.mutations.updateEmployeeCreationRequest, {
            requestId: request._id,
            status: "completed",
            clerkId: result.clerkUserId,
            processedAt: Date.now(),
          });

          console.log(`Employee created successfully: ${request.email}`);
        } else {
          throw new Error(result.error || "Unknown error creating user in Clerk");
        }
        
      } catch (error) {
        // Mark request as failed
        await ctx.runMutation(internal.domains.users.mutations.updateEmployeeCreationRequest, {
          requestId: request._id,
          status: "failed",
          errorMessage: `${error}`,
          processedAt: Date.now(),
        });

        console.error(`Failed to create employee ${request.email}:`, error);
      }
    }

    return null;
  },
});

/**
 * Fix failed employee creation by finding the user in Clerk and updating the record
 */
export const fixFailedEmployeeCreation = action({
  args: {
    employeeId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the employee record first
    const employee = await ctx.runQuery(internal.domains.users.queries.getUserById, {
      userId: args.employeeId,
    });

    if (!employee) {
      throw new Error("Employee não encontrado");
    }

    // Check if employee has failed clerk_id
    if (!employee.clerkId || !employee.clerkId.startsWith("failed_")) {
      return {
        success: false,
        message: "Este employee não precisa de correção - não tem clerk_id failed",
      };
    }

    if (!employee.email) {
      return {
        success: false,
        message: "Employee não tem email para sincronização",
      };
    }

    // Try to find existing user in Clerk by email
    try {
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error("CLERK_SECRET_KEY não configurada");
      }

      const clerkUsers = await clerkClient.users.getUserList({
        emailAddress: [employee.email],
      });

      if (clerkUsers.data.length > 0) {
        // User exists in Clerk, update the employee record
        const clerkUser = clerkUsers.data[0];
        
        await ctx.runMutation(internal.domains.users.mutations.updateEmployeeClerkId, {
          employeeId: args.employeeId,
          clerkId: clerkUser.id,
        });

        return {
          success: true,
          message: `Employee sincronizado com sucesso com Clerk ID: ${clerkUser.id}`,
        };
      } else {
        return {
          success: false,
          message: "Usuário não encontrado no Clerk. Recrie o employee.",
        };
      }
    } catch (error) {
      console.error(`Error fixing failed employee creation:`, error);
      return {
        success: false,
        message: `Erro ao sincronizar com Clerk: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

/**
 * Automatically detect and fix failed employee synchronizations
 */
export const autoFixFailedEmployeeSyncs = action({
  args: {},
  returns: v.object({
    totalChecked: v.number(),
    fixedEmployees: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let totalChecked = 0;
    let fixedEmployees = 0;

    try {
      // Get all employees with failed or temp clerk IDs
      const failedEmployees = await ctx.runQuery(internal.domains.users.queries.getFailedEmployees);
      totalChecked = failedEmployees.length;

      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error("CLERK_SECRET_KEY não configurada");
      }

      for (const employee of failedEmployees) {
        try {
          if (!employee.email) {
            errors.push(`Employee ${employee._id} não tem email`);
            continue;
          }

          // Try to find the user in Clerk by email
          const clerkUsers = await clerkClient.users.getUserList({
            emailAddress: [employee.email],
          });

          if (clerkUsers.data.length > 0) {
            const clerkUser = clerkUsers.data[0];
            
            // Use the sync function to properly update the employee
            await ctx.runMutation(internal.domains.users.mutations.syncUserFromClerk, {
              clerkId: clerkUser.id,
              email: employee.email,
              name: employee.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
              image: clerkUser.imageUrl,
              phone: clerkUser.phoneNumbers?.[0]?.phoneNumber,
              createdAt: clerkUser.createdAt,
              updatedAt: clerkUser.updatedAt,
              role: "employee",
            });

            fixedEmployees++;
            console.log(`Auto-fixed employee ${employee._id} with Clerk ID: ${clerkUser.id}`);
          } else {
            errors.push(`Employee ${employee.email} não encontrado no Clerk`);
          }
        } catch (error) {
          const errorMsg = `Erro ao corrigir employee ${employee.email}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        totalChecked,
        fixedEmployees,
        errors,
      };
    } catch (error) {
      console.error("Error in autoFixFailedEmployeeSyncs:", error);
      return {
        totalChecked,
        fixedEmployees,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  },
}); 