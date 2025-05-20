import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { queryWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess, verifyEmployeeAccess } from "../../domains/rbac";
import type { Restaurant, RestaurantWithCreator } from "./types";
import { formatRestaurant } from "./utils";

/**
 * Get all restaurants
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Travelers (public) or unauthenticated users get all active restaurants
    if (!currentUserId || role === "traveler") {
      return await ctx.db.query("restaurants").collect();
    }

    // Master sees everything
    if (role === "master") {
      return await ctx.db.query("restaurants").collect();
    }

    // Partner sees only own restaurants
    if (role === "partner") {
      return await ctx.db
        .query("restaurants")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    }

    // Employee sees restaurants they have explicit permission to view
    if (role === "employee") {
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) =>
          q.eq("employeeId", currentUserId).eq("assetType", "restaurants"),
        )
        .collect();

      if (permissions.length === 0) return [];

      const allowedIds = new Set(permissions.map((p) => p.assetId));
      const allRestaurants = await ctx.db.query("restaurants").collect();
      return allRestaurants.filter((r) => allowedIds.has(r._id.toString()));
    }

    return [];
  },
});

/**
 * Get featured restaurants
 */
export const getFeatured = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("featured_restaurants", (q) => 
        q.eq("isFeatured", true).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Alias for getFeatured to maintain backward compatibility
 */
export const getFeaturedRestaurants = getFeatured;

/**
 * Get active restaurants
 */
export const getActive = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("active_restaurants", (q) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * Get a restaurant by ID
 */
export const getById = query({
  args: { id: v.id("restaurants") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get(args.id);

    const role = await getCurrentUserRole(ctx);

    // Travelers or masters can access directly
    if (role === "traveler" || role === "master") {
      return restaurant;
    }

    const hasAccess = await verifyPartnerAccess(ctx, args.id, "restaurants") ||
                      await verifyEmployeeAccess(ctx, args.id, "restaurants", "view");

    if (!hasAccess) {
      throw new Error("Não autorizado a acessar este restaurante");
    }

    return restaurant;
  },
});

/**
 * Get a restaurant by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    
    return restaurant;
  },
});

/**
 * Get restaurants by partner ID
 */
export const getByPartnerId = queryWithRole(["partner", "master"])({
  args: { 
    partnerId: v.id("users") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
      .collect();
  },
});

/**
 * Get restaurant with creator details
 */
export const getWithCreator = query({
  args: { id: v.id("restaurants") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get(args.id);
    if (!restaurant) return null;
    
    return formatRestaurant(ctx, restaurant as Restaurant);
  },
});

/**
 * Search restaurants
 */
export const search = query({
  args: { 
    query: v.string(),
    cuisines: v.optional(v.array(v.string())),
    priceRange: v.optional(v.string()),
    features: v.optional(v.array(v.string()))
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("restaurants")
      .withIndex("active_restaurants", (q) => q.eq("isActive", true))
      .collect();
    
    // Basic name/description search (case insensitive)
    if (args.query) {
      const searchLower = args.query.toLowerCase();
      results = results.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by cuisines if provided
    if (args.cuisines && args.cuisines.length > 0) {
      results = results.filter(restaurant => 
        args.cuisines!.some(cuisine => restaurant.cuisine.includes(cuisine))
      );
    }
    
    // Filter by price range if provided
    if (args.priceRange) {
      results = results.filter(restaurant => 
        restaurant.priceRange === args.priceRange
      );
    }
    
    // Filter by features if provided
    if (args.features && args.features.length > 0) {
      results = results.filter(restaurant => 
        args.features!.some(feature => restaurant.features.includes(feature))
      );
    }
    
    return results;
  },
}); 