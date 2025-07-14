import { v } from "convex/values";
import { query } from "../../_generated/server";

/**
 * Get all accommodations
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("accommodations").collect();
  },
});

/**
 * Get a single accommodation by ID
 */
export const getById = query({
  args: { id: v.id("accommodations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get accommodation by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accommodations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Get featured accommodations
 */
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("accommodations")
      .withIndex("featured_accommodations", (q) => 
        q.eq("isFeatured", true).eq("isActive", true)
      )
      .collect();
  },
});