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
      // First check if employee has partnerId - if so, they can see all media from that partner
      const employee = await ctx.db.get(currentUserId);
      if (employee?.partnerId) {
        // Employee can see media uploaded by their partner AND their own media
        const [partnerMedia, ownMedia] = await Promise.all([
          ctx.db
            .query("media")
            .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", employee.partnerId!))
            .collect(),
          ctx.db
            .query("media")
            .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", currentUserId))
            .collect()
        ]);
        
        // Combine and deduplicate the results
        const allMedia = [...partnerMedia, ...ownMedia];
        const uniqueMedia = allMedia.filter((media, index, arr) => 
          arr.findIndex(m => m._id === media._id) === index
        );
        
        // Sort by creation time (newest first)
        uniqueMedia.sort((a, b) => b._creationTime - a._creationTime);
        
        return uniqueMedia;
      }
      
      // Fallback to specific permissions if no partnerId (legacy employees)
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) =>
          q.eq("employeeId", currentUserId).eq("assetType", "media"),
        )
        .collect();

      if (permissions.length === 0) {
        // If no specific permissions, at least show their own media
        return await ctx.db
          .query("media")
          .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", currentUserId))
          .collect();
      }

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
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Check permissions for employees
    if (role === "employee" && currentUserId) {
      const employee = await ctx.db.get(currentUserId);
      
      // If employee has partnerId, they can see media from their partner
      if (employee?.partnerId && args.userId === employee.partnerId) {
        const media = await ctx.db
          .query("media")
          .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", args.userId))
          .collect();
        return media;
      }
      
      // Employee can only see media from their partner or themselves
      if (args.userId !== currentUserId && args.userId !== employee?.partnerId) {
        throw new Error("Não autorizado a ver mídias deste usuário");
      }
    }

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
    if (!media) return null;

    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    if (role === "traveler" || role === "master") {
      return media;
    }

    if (role === "employee" && currentUserId) {
      // Check if employee owns the media or if media belongs to their partner
      if (media.uploadedBy === currentUserId) {
        return media; // Employee can access their own media
      }
      
      const employee = await ctx.db.get(currentUserId);
      if (employee?.partnerId && media.uploadedBy === employee.partnerId) {
        return media; // Employee can access partner's media
      }
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