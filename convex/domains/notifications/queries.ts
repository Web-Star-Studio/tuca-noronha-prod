import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../users/helpers";
import { paginationOptsValidator } from "convex/server";

/**
 * Get all notifications for the current user (simplified version)
 */
export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
    includeRead: v.optional(v.boolean()),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  returns: v.array(v.object({
    _id: v.id("notifications"),
    _creationTime: v.number(),
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    data: v.optional(v.any()),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // Build query with efficient indexing
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    // Apply read status filter if specified
    if (args.includeRead === false) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    // Apply pagination if provided
    if (args.paginationOpts) {
      const results = await query
        .order("desc")
        .paginate(args.paginationOpts);
      return results.page;
    }

    // Apply limit with default fallback
    const limit = args.limit || 20;
    const notifications = await query
      .order("desc")
      .take(limit);

    return notifications;
  },
});

/**
 * Get all notifications for the current user with pagination
 */
export const getUserNotificationsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    includeRead: v.optional(v.boolean()),
    type: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      isRead: v.boolean(),
      relatedId: v.optional(v.string()),
      relatedType: v.optional(v.string()),
      data: v.optional(v.any()),
      createdAt: v.number(),
      readAt: v.optional(v.number()),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Build efficient query with proper indexing
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    // Apply filters
    if (args.includeRead === false) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    // Apply pagination with proper ordering
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return 0;
    }

    // Use efficient count query
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
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
    readAt: v.optional(v.number()),
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
      isRead: v.boolean(),
      relatedId: v.optional(v.string()),
      relatedType: v.optional(v.string()),
      data: v.optional(v.any()),
      createdAt: v.number(),
      readAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const notification = await ctx.db.get(args.notificationId);
    
    // Access control: user can only see their own notifications
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
  returns: v.object({
    page: v.array(v.object({
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
      readAt: v.optional(v.number()),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
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

/**
 * Get recent notifications summary for dashboard
 */
export const getNotificationsSummary = query({
  args: {},
  returns: v.object({
    total: v.number(),
    unread: v.number(),
    recent: v.array(v.object({
      _id: v.id("notifications"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      isRead: v.boolean(),
      createdAt: v.number(),
    })),
    byType: v.object({
      booking_confirmed: v.number(),
      booking_canceled: v.number(),
      booking_reminder: v.number(),
      system_update: v.number(),
      other: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        total: 0,
        unread: 0,
        recent: [],
        byType: {
          booking_confirmed: 0,
          booking_canceled: 0,
          booking_reminder: 0,
          system_update: 0,
          other: 0,
        },
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return {
        total: 0,
        unread: 0,
        recent: [],
        byType: {
          booking_confirmed: 0,
          booking_canceled: 0,
          booking_reminder: 0,
          system_update: 0,
          other: 0,
        },
      };
    }

    // Get all notifications for the user
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const total = allNotifications.length;
    const unread = allNotifications.filter(n => !n.isRead).length;
    const recent = allNotifications.slice(0, 5).map(n => ({
      _id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    // Count by type
    const byType = allNotifications.reduce((acc, n) => {
      switch (n.type) {
        case "booking_confirmed":
          acc.booking_confirmed++;
          break;
        case "booking_canceled":
          acc.booking_canceled++;
          break;
        case "booking_reminder":
          acc.booking_reminder++;
          break;
        case "system_update":
          acc.system_update++;
          break;
        default:
          acc.other++;
      }
      return acc;
    }, {
      booking_confirmed: 0,
      booking_canceled: 0,
      booking_reminder: 0,
      system_update: 0,
      other: 0,
    });

    return {
      total,
      unread,
      recent,
      byType,
    };
  },
}); 