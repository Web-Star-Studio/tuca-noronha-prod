import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Media } from "./types";

/**
 * Get all media files
 */
export const getAllMedia = query({
  args: {},
  handler: async (ctx) => {
    const media = await ctx.db.query("media").collect();
    return media;
  },
});

/**
 * Get media files by category
 */
export const getMediaByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("media")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
    return media;
  },
});

/**
 * Get media files by user
 */
export const getPublicMedia = query({
  args: {},
  handler: async (ctx) => {
    const media = await ctx.db
      .query("media")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .collect();
    return media;
  },
});

/**
 * Get a single media file by ID
 */
export const getMediaById = query({
  args: {
    id: v.id("media"),
  },
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    return media;
  },
});

/**
 * Get URL for a specific media file
 */
export const getMediaUrl = query({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
}); 