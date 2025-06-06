import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../users/helpers";

/**
 * Get all notifications for the current user (simplified version)
 */
export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
    includeRead: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("notifications"),
    _creationTime: v.number(),
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    isRead: v.boolean(),
    data: v.optional(v.object({
      confirmationCode: v.optional(v.string()),
      bookingType: v.optional(v.string()),
      assetName: v.optional(v.string()),
      partnerName: v.optional(v.string()),
    })),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    // Filter for unread only if includeRead is false
    if (args.includeRead === false) {
      query = ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) => 
          q.eq("userId", user._id).eq("isRead", false)
        );
    }

    const notifications = await query
      .order("desc")
      .take(args.limit || 50);

    return notifications;
  },
});

/**
 * Get all notifications for the current user with pagination
 */
export const getUserNotificationsPaginated = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    includeRead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    // Filter for unread only if includeRead is false
    if (!args.includeRead) {
      query = ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) => 
          q.eq("userId", user._id).eq("isRead", false)
        );
    }

    const result = await query
      .order("desc")
      .paginate(args.paginationOpts);

    return result;
  },
});

/**
 * Get count of unread notifications for the current user
 */
export const getUnreadNotificationCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * Get recent notifications for the current user (last 10)
 */
export const getRecentNotifications = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("notifications"),
    _creationTime: v.number(),
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    isRead: v.boolean(),
    data: v.optional(v.object({
      confirmationCode: v.optional(v.string()),
      bookingType: v.optional(v.string()),
      assetName: v.optional(v.string()),
      partnerName: v.optional(v.string()),
    })),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    return notifications;
  },
});

/**
 * Get a specific notification by ID (only if it belongs to current user)
 */
export const getNotificationById = query({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.union(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      relatedId: v.optional(v.string()),
      relatedType: v.optional(v.string()),
      isRead: v.boolean(),
      data: v.optional(v.object({
        confirmationCode: v.optional(v.string()),
        bookingType: v.optional(v.string()),
        assetName: v.optional(v.string()),
        partnerName: v.optional(v.string()),
      })),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    const notification = await ctx.db.get(args.notificationId);
    
    if (!notification || notification.userId !== user._id) {
      return null;
    }

    return notification;
  },
});

/**
 * Get notifications by type for the current user
 */
export const getNotificationsByType = query({
  args: {
    type: v.string(),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    const result = await ctx.db
      .query("notifications")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", user._id).eq("type", args.type)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return result;
  },
}); 