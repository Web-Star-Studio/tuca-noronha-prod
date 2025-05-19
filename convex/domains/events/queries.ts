import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Event, EventWithCreator } from "./types";

/**
 * Get all events
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

/**
 * Get featured events
 */
export const getFeatured = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("featured_events", (q) => 
        q.eq("isFeatured", true).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Get upcoming events
 */
export const getUpcoming = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    return await ctx.db
      .query("events")
      .withIndex("by_date", (q) => q.gte("date", today))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

/**
 * Get an event by ID
 */
export const getById = query({
  args: { id: v.id("events") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get events created by a specific user
 */
export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.userId))
      .collect();
  },
});

/**
 * Get user information by ID - for displaying creator information
 */
export const getUserById = query({
  args: { 
    userId: v.id("users")
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get events with creator information
 */
export const getEventsWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const eventsWithCreators = await Promise.all(
      events.map(async (event) => {
        let creatorInfo = null;
        if (event.partnerId) {
          creatorInfo = await ctx.db.get(event.partnerId);
        }
        return {
          ...event,
          creator: creatorInfo ? {
            id: creatorInfo._id,
            name: creatorInfo.name,
            email: creatorInfo.email,
            image: creatorInfo.image
          } : null
        };
      })
    );
    return eventsWithCreators;
  },
});

/**
 * Get all tickets for an event
 */
export const getEventTickets = query({
  args: { 
    eventId: v.id("events") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventTickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Get all active tickets for an event
 */
export const getActiveEventTickets = query({
  args: { 
    eventId: v.id("events") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventTickets")
      .withIndex("by_event_and_active", (q) => 
        q.eq("eventId", args.eventId).eq("isActive", true)
      )
      .collect();
  },
}); 