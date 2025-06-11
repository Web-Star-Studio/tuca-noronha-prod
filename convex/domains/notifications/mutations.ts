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
    data: v.optional(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Rate limiting: max 1000 notifications per bulk operation
    if (args.userIds.length > 1000) {
      throw new Error("Bulk notification limit exceeded. Maximum 1000 recipients per operation.");
    }

    let successCount = 0;
    const batchSize = 100; // Process in batches to avoid timeout
    
    for (let i = 0; i < args.userIds.length; i += batchSize) {
      const batch = args.userIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (userId) => {
        try {
          await ctx.db.insert("notifications", {
            userId,
            type: args.type,
            title: args.title,
            message: args.message,
            isRead: false,
            data: args.data,
            createdAt: Date.now(),
          });
          return true;
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
          return false;
        }
      });

      const results = await Promise.all(promises);
      successCount += results.filter(Boolean).length;
    }

    return successCount;
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
 * Create booking confirmation notification with optimized data structure
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
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const title = "Reserva Confirmada! 🎉";
      const message = `Sua reserva para "${args.assetName}" foi confirmada! Código: ${args.confirmationCode}${args.partnerName ? ` (${args.partnerName})` : ''}`;

      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "booking_confirmed",
        title,
        message,
        isRead: false,
        relatedId: args.relatedId,
        relatedType: args.relatedType,
        data: {
          confirmationCode: args.confirmationCode,
          bookingType: args.bookingType,
          assetName: args.assetName,
          partnerName: args.partnerName,
        },
        createdAt: Date.now(),
      });

      console.log(`✅ Booking confirmation notification created for user ${args.userId}`);
    } catch (error) {
      console.error(`❌ Failed to create booking confirmation notification:`, error);
      throw error;
    }

    return null;
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

/**
 * Helper function to create chat message notification
 */
export const createChatMessageNotification = mutation({
  args: {
    recipientId: v.id("users"),
    senderId: v.id("users"),
    senderName: v.string(),
    chatRoomId: v.id("chatRooms"),
    messagePreview: v.string(),
    contextType: v.string(),
    contextData: v.optional(v.object({
      assetName: v.optional(v.string()),
      assetType: v.optional(v.string()),
      bookingCode: v.optional(v.string()),
    })),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    // Não criar notificação para si mesmo
    if (args.recipientId.toString() === args.senderId.toString()) {
      throw new Error("Não é possível criar notificação para si mesmo");
    }

    const contextInfo = args.contextData?.assetName 
      ? ` sobre ${args.contextData.assetName}`
      : args.contextData?.bookingCode 
        ? ` sobre reserva ${args.contextData.bookingCode}`
        : '';

    const title = "Nova Mensagem de Chat";
    const message = `${args.senderName} enviou uma mensagem${contextInfo}: "${args.messagePreview}"`;

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.recipientId,
      type: "chat_message",
      title,
      message,
      relatedId: args.chatRoomId.toString(),
      relatedType: "chat_room",
      isRead: false,
      data: {
        senderName: args.senderName,
        messagePreview: args.messagePreview,
        contextType: args.contextType,
        ...args.contextData,
      },
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Helper function to create chat room created notification
 */
export const createChatRoomCreatedNotification = mutation({
  args: {
    partnerId: v.id("users"),      // Partner que receberá a notificação
    travelerId: v.id("users"),     // Traveler que iniciou o chat
    travelerName: v.string(),
    chatRoomId: v.id("chatRooms"),
    contextType: v.string(),
    contextData: v.optional(v.object({
      assetName: v.optional(v.string()),
      assetType: v.optional(v.string()),
      bookingCode: v.optional(v.string()),
    })),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const contextInfo = args.contextData?.assetName 
      ? ` sobre ${args.contextData.assetName}`
      : args.contextData?.bookingCode 
        ? ` sobre reserva ${args.contextData.bookingCode}`
        : '';

    const title = "Nova Conversa Iniciada";
    const message = `${args.travelerName} iniciou uma conversa${contextInfo}`;

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.partnerId,
      type: "chat_room_created",
      title,
      message,
      relatedId: args.chatRoomId.toString(),
      relatedType: "chat_room",
      isRead: false,
      data: {
        travelerName: args.travelerName,
        contextType: args.contextType,
        ...args.contextData,
      },
      createdAt: Date.now(),
    });

    return notificationId;
  },
}); 