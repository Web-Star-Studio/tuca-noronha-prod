"use node";

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

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