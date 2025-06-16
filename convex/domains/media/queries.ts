import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Media } from "./types";
import { queryWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess, verifyEmployeeAccess } from "../../domains/rbac";

/**
 * Get all media files
 */
export const getAllMedia = query({
  args: {},
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    if (!currentUserId || role === "traveler") {
      return await ctx.db.query("media").collect();
    }

    if (role === "master") {
      return await ctx.db.query("media").collect();
    }

    if (role === "partner") {
      return await ctx.db
        .query("media")
        .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", currentUserId))
        .collect();
    }

    if (role === "employee") {
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) =>
          q.eq("employeeId", currentUserId).eq("assetType", "media"),
        )
        .collect();

      if (permissions.length === 0) return [];

      const allowedIds = new Set(permissions.map((p) => p.assetId));
      const allMedia = await ctx.db
        .query("media")
        .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", currentUserId))
        .collect();

      return allMedia.filter((m) => allowedIds.has(m._id.toString()));
    }

    return [];
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
export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("media")
      .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", args.userId))
      .collect();
    return media;
  },
});

/**
 * Get public media files
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

    const role = await getCurrentUserRole(ctx);

    if (role === "traveler" || role === "master") {
      return media;
    }

    const hasAccess = await verifyPartnerAccess(ctx, args.id, "media", "uploadedBy") ||
                      await verifyEmployeeAccess(ctx, args.id, "media", "view");

    if (!hasAccess) {
      throw new Error("Não autorizado a acessar este arquivo");
    }

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