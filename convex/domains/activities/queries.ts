import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Activity, ActivityWithCreator } from "./types";
import { queryWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess, verifyEmployeeAccess } from "../../domains/rbac";

/**
 * Get all activities
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    if (!currentUserId || role === "traveler") {
      return await ctx.db.query("activities").collect();
    }

    if (role === "master") {
      return await ctx.db.query("activities").collect();
    }

    if (role === "partner") {
      return await ctx.db
        .query("activities")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    }

    if (role === "employee") {
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) =>
          q.eq("employeeId", currentUserId).eq("assetType", "activities"),
        )
        .collect();

      if (permissions.length === 0) return [];

      const allowedIds = new Set(permissions.map((p) => p.assetId));
      const allActivities = await ctx.db.query("activities").collect();
      return allActivities.filter((a) => allowedIds.has(a._id.toString()));
    }

    return [];
  },
});

/**
 * Get featured activities
 */
export const getFeatured = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .withIndex("featured_activities", (q) => 
        q.eq("isFeatured", true).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Alias for getFeatured to maintain backward compatibility
 */
export const getFeaturedActivities = getFeatured;

/**
 * Get an activity by ID
 */
export const getById = query({
  args: { id: v.id("activities") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);

    if (!activity) {
      return null;
    }

    // Para atividades ativas, permitir acesso público
    if (activity.isActive) {
      return activity;
    }

    // Para atividades inativas, aplicar verificações de permissão
    const role = await getCurrentUserRole(ctx);

    // Master sempre tem acesso
    if (role === "master") {
      return activity;
    }

    // Partner e employee verificam permissões para atividades inativas
    if (role === "partner" || role === "employee") {
      const hasAccess = await verifyPartnerAccess(ctx, args.id, "activities") ||
                        await verifyEmployeeAccess(ctx, args.id, "activities", "view");

      if (!hasAccess) {
        throw new Error("Não autorizado a acessar esta atividade");
      }

      return activity;
    }

    // Para travelers, não mostrar atividades inativas
    return null;
  },
});

/**
 * Get activities created by a specific user
 */
export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.userId))
      .collect();
  },
});

/**
 * Get user information by ID - for displaying creator information
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get activities with creator information
 */
export const getActivitiesWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    // Get all activities
    const activities = await ctx.db.query("activities").collect();
    
    // Get creator details for each activity
    const activitiesWithCreators = await Promise.all(
      activities.map(async (activity) => {
        let creatorInfo: any = null;
        if (activity.partnerId) {
          creatorInfo = await ctx.db.get(activity.partnerId);
        }
        
        return {
          ...activity,
          creator: creatorInfo ? {
            id: creatorInfo._id,
            name: creatorInfo.name,
            email: creatorInfo.email,
            image: creatorInfo.image
          } : null
        };
      })
    );
    
    return activitiesWithCreators;
  },
});

/**
 * Get all tickets for an activity
 */
export const getActivityTickets = query({
  args: { 
    activityId: v.id("activities") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityTickets")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();
  },
});

/**
 * Get all active tickets for an activity
 */
export const getActiveActivityTickets = query({
  args: { 
    activityId: v.id("activities") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityTickets")
      .withIndex("by_activity_and_active", (q) => 
        q.eq("activityId", args.activityId).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Get an activity by ID - PUBLIC VERSION (no auth required)
 * This query is used for public activity pages where anyone can view active activities
 */
export const getPublicActivityById = query({
  args: { id: v.id("activities") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    
    // Only return active activities for public access
    if (!activity || !activity.isActive) {
      return null;
    }
    
    return activity;
  },
});

/**
 * Get activities (only active) with creator information for public pages.
 * Does not apply any RBAC filtering – any user (authenticated or not) receives
 * the complete list of active activities.
 */
export const getPublicActivitiesWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    // Get only active activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("active_activities", (q) => q.eq("isActive", true))
      .collect();

    // Load creator data
    const activitiesWithCreators = await Promise.all(
      activities.map(async (activity) => {
        const user = activity.partnerId ? await ctx.db.get(activity.partnerId) : null;
        return {
          ...activity,
          creator: user
            ? {
                id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
        };
      }),
    );

    return activitiesWithCreators;
  },
});

/**
 * Get featured activities - PUBLIC VERSION (no auth required)
 */
export const getPublicFeaturedActivities = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .withIndex("featured_activities", (q) => 
        q.eq("isFeatured", true).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Get activities by partner ID
 */
export const getByPartnerId = query({
  args: { partnerId: v.id("users") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
      .collect();
  },
});

/**
 * Alias for getActivityTickets to maintain compatibility with frontend
 */
export const getTicketsByActivity = getActivityTickets;

/**
 * Alias for getActiveActivityTickets to maintain compatibility with frontend
 */
export const getActiveTicketsByActivity = getActiveActivityTickets; 