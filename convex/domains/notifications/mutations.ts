import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../users/helpers";
import {
  createNotificationValidator,
  markAsReadValidator,
  markAllAsReadValidator,
  deleteNotificationValidator,
} from "./types";

/**
 * Create a new notification (system use)
 */
export const createNotification = mutation({
  args: createNotificationValidator,
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Send bulk notification to multiple users
 */
export const sendBulkNotification = mutation({
  args: {
    userIds: v.array(v.id("users")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    data: v.optional(v.object({
      confirmationCode: v.optional(v.string()),
      bookingType: v.optional(v.string()),
      assetName: v.optional(v.string()),
      partnerName: v.optional(v.string()),
    })),
  },
  returns: v.array(v.id("notifications")),
  handler: async (ctx, args) => {
    const { userIds, ...notificationData } = args;
    
    const notificationIds = await Promise.all(
      userIds.map(async (userId) => {
        return await ctx.db.insert("notifications", {
          userId,
          ...notificationData,
          isRead: false,
          createdAt: Date.now(),
        });
      })
    );

    return notificationIds;
  },
});

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
  args: markAsReadValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Get the notification to verify ownership
    const notification = await ctx.db.get(args.notificationId);
    
    if (!notification) {
      throw new Error("Notificação não encontrada");
    }
    
    if (notification.userId !== user._id) {
      throw new Error("Você não tem permissão para alterar esta notificação");
    }
    
    if (notification.isRead) {
      return null; // Already read, no need to update
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return null;
  },
});

/**
 * Mark all notifications as read for the current user
 */
export const markAllAsRead = mutation({
  args: markAllAsReadValidator,
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Verify user can only mark their own notifications
    if (args.userId !== user._id) {
      throw new Error("Você só pode marcar suas próprias notificações como lidas");
    }
    
    // Get all unread notifications for the user
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    // Mark them all as read
    const now = Date.now();
    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
          readAt: now,
        })
      )
    );

    return unreadNotifications.length;
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: deleteNotificationValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Get the notification to verify ownership
    const notification = await ctx.db.get(args.notificationId);
    
    if (!notification) {
      throw new Error("Notificação não encontrada");
    }
    
    if (notification.userId !== user._id) {
      throw new Error("Você não tem permissão para deletar esta notificação");
    }

    await ctx.db.delete(args.notificationId);
    return null;
  },
});

/**
 * Helper function to create booking confirmation notification
 */
export const createBookingConfirmationNotification = mutation({
  args: {
    userId: v.id("users"),
    confirmationCode: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    partnerName: v.optional(v.string()),
    relatedId: v.string(),
    relatedType: v.string(),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const title = "Reserva Confirmada! 🎉";
    const message = `Sua reserva para "${args.assetName}" foi confirmada! Código: ${args.confirmationCode}`;

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "booking_confirmed",
      title,
      message,
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      isRead: false,
      data: {
        confirmationCode: args.confirmationCode,
        bookingType: args.bookingType,
        assetName: args.assetName,
        partnerName: args.partnerName,
      },
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Helper function to create booking canceled notification
 */
export const createBookingCanceledNotification = mutation({
  args: {
    userId: v.id("users"),
    confirmationCode: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    reason: v.optional(v.string()),
    relatedId: v.string(),
    relatedType: v.string(),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const title = "Reserva Cancelada";
    const message = args.reason 
      ? `Sua reserva para "${args.assetName}" foi cancelada. Motivo: ${args.reason}. Código: ${args.confirmationCode}`
      : `Sua reserva para "${args.assetName}" foi cancelada. Código: ${args.confirmationCode}`;

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "booking_canceled",
      title,
      message,
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      isRead: false,
      data: {
        confirmationCode: args.confirmationCode,
        bookingType: args.bookingType,
        assetName: args.assetName,
      },
      createdAt: Date.now(),
    });

    return notificationId;
  },
}); 