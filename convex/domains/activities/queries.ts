import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Activity, ActivityWithCreator } from "./types";

/**
 * Get all activities
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("activities").collect();
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
 * Get an activity by ID
 */
export const getById = query({
  args: { id: v.id("activities") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
        let creatorInfo = null;
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