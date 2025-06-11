"use node";

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Send booking confirmation notification automatically
 */
export const sendBookingConfirmationNotification = internalAction({
  args: {
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    confirmationCode: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    partnerName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Create notification in database
      await ctx.runMutation(internal.domains.notifications.mutations.createBookingConfirmationNotification, {
        userId: args.userId,
        confirmationCode: args.confirmationCode,
        bookingType: args.bookingType,
        assetName: args.assetName,
        partnerName: args.partnerName,
        relatedId: args.bookingId,
        relatedType: `${args.bookingType}_booking`,
      });

      console.log(`✅ Notification sent for booking ${args.bookingId} to user ${args.userId}`);
    } catch (error) {
      console.error(`❌ Failed to send notification for booking ${args.bookingId}:`, error);
    }

    return null;
  },
});

/**
 * Send booking cancellation notification automatically
 */
export const sendBookingCancellationNotification = internalAction({
  args: {
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    confirmationCode: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Create cancellation notification
      const title = "Reserva Cancelada ❌";
      const message = `Sua reserva para "${args.assetName}" foi cancelada. Código: ${args.confirmationCode}${args.reason ? ` Motivo: ${args.reason}` : ''}`;

      await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
        userId: args.userId,
        type: "booking_canceled",
        title,
        message,
        relatedId: args.bookingId,
        relatedType: `${args.bookingType}_booking`,
        data: {
          confirmationCode: args.confirmationCode,
          bookingType: args.bookingType,
          assetName: args.assetName,
        },
      });

      console.log(`✅ Cancellation notification sent for booking ${args.bookingId} to user ${args.userId}`);
    } catch (error) {
      console.error(`❌ Failed to send cancellation notification for booking ${args.bookingId}:`, error);
    }

    return null;
  },
});

/**
 * Send booking reminder notification (can be scheduled for future)
 */
export const sendBookingReminderNotification = internalAction({
  args: {
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    confirmationCode: v.string(),
    reminderDate: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const title = "Lembrete de Reserva 🔔";
      const message = `Lembrete: Você tem uma reserva para "${args.assetName}" em ${args.reminderDate}. Código: ${args.confirmationCode}`;

      await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
        userId: args.userId,
        type: "booking_reminder",
        title,
        message,
        relatedId: args.bookingId,
        relatedType: `${args.bookingType}_booking`,
        data: {
          confirmationCode: args.confirmationCode,
          bookingType: args.bookingType,
          assetName: args.assetName,
        },
      });

      console.log(`✅ Reminder notification sent for booking ${args.bookingId} to user ${args.userId}`);
    } catch (error) {
      console.error(`❌ Failed to send reminder notification for booking ${args.bookingId}:`, error);
    }

    return null;
  },
});

/**
 * Send bulk notifications for system updates
 */
export const sendSystemUpdateNotification = internalAction({
  args: {
    title: v.string(),
    message: v.string(),
    userRole: v.optional(v.union(v.literal("traveler"), v.literal("partner"), v.literal("employee"), v.literal("master"))),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    try {
      // Get users based on role filter
      const users = await ctx.runQuery(internal.domains.users.queries.listAllUsers, {
        role: args.userRole,
        limit: 1000,
      });

      if (!users?.users || users.users.length === 0) {
        console.log("No users found for system notification");
        return 0;
      }

      // Send notifications to all users
      await ctx.runMutation(internal.domains.notifications.mutations.sendBulkNotification, {
        userIds: users.users.map(u => u._id),
        type: "system_update",
        title: args.title,
        message: args.message,
      });

      console.log(`✅ System notification sent to ${users.users.length} users`);
      return users.users.length;
    } catch (error) {
      console.error(`❌ Failed to send system notification:`, error);
      return 0;
    }
  },
}); 