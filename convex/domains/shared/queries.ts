"use strict";

import { query } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

/**
 * Get details for a generic asset by its ID and type.
 * This is useful for fetching information for vouchers, notifications, etc.
 * where the asset could be one of many types.
 */
export const getAssetDetails = query({
  args: {
    assetId: v.string(),
    assetType: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("activities"),
      name: v.string(),
      address: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
    v.object({
      _id: v.id("events"),
      name: v.string(),
      address: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
    v.object({
      _id: v.id("restaurants"),
      name: v.string(),
      address: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
    v.object({
      _id: v.id("vehicles"),
      name: v.string(),
      address: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let details: any = null;

    switch (args.assetType) {
      case "activities":
        details = await ctx.db.get(args.assetId as Id<"activities">);
        if (details) {
          return {
            _id: details._id,
            name: details.title,
            address: details.meetingPoint || "Não especificado",
            phone: details.phone, // Assumindo que pode existir
            email: details.email, // Assumindo que pode existir
            description: details.shortDescription,
          };
        }
        break;
      case "events":
        details = await ctx.db.get(args.assetId as Id<"events">);
        if (details) {
          return {
            _id: details._id,
            name: details.title,
            address: details.location,
            phone: details.phone,
            email: details.email,
            description: details.shortDescription,
          };
        }
        break;
      case "restaurants":
        details = await ctx.db.get(args.assetId as Id<"restaurants">);
        if (details) {
          return {
            _id: details._id,
            name: details.name,
            address: `${details.address.street}, ${details.address.city}`,
            phone: details.phone,
            email: details.email,
            description: details.description,
          };
        }
        break;
      case "vehicles":
        details = await ctx.db.get(args.assetId as Id<"vehicles">);
        if (details) {
          return {
            _id: details._id,
            name: `${details.make} ${details.model}`,
            address: details.pickupLocation || "Não especificado",
            phone: details.phone,
            email: details.email,
            description: details.description,
          };
        }
        break;
    }
    return null;
  },
});

/**
 * Get all assets of a specific type
 * Used for auto-confirmation settings and other features that need to select from available assets
 */
export const getAssetsByType = query({
  args: {
    assetType: v.union(
      v.literal("activities"),
      v.literal("events"),
      v.literal("restaurants"),
      v.literal("vehicles"),
      v.literal("accommodations")
    ),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.string(),
    name: v.string(),
    isActive: v.boolean(),
    partnerId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const { assetType, isActive = true, limit = 100 } = args;
    
    let assets: any[] = [];

    switch (assetType) {
      case "activities":
        if (isActive) {
          const activities = await ctx.db
            .query("activities")
            .withIndex("active_activities", q => q.eq("isActive", true))
            .take(limit);
          
          assets = activities.map(activity => ({
            _id: activity._id,
            name: activity.title,
            isActive: activity.isActive,
            partnerId: activity.partnerId,
          }));
        } else {
          const activities = await ctx.db
            .query("activities")
            .take(limit);
          
          assets = activities.map(activity => ({
            _id: activity._id,
            name: activity.title,
            isActive: activity.isActive,
            partnerId: activity.partnerId,
          }));
        }
        break;

      case "events":
        if (isActive) {
          const events = await ctx.db
            .query("events")
            .withIndex("active_events", q => q.eq("isActive", true))
            .take(limit);
          
          assets = events.map(event => ({
            _id: event._id,
            name: event.title,
            isActive: event.isActive,
            partnerId: event.partnerId,
          }));
        } else {
          const events = await ctx.db
            .query("events")
            .take(limit);
          
          assets = events.map(event => ({
            _id: event._id,
            name: event.title,
            isActive: event.isActive,
            partnerId: event.partnerId,
          }));
        }
        break;

      case "restaurants":
        if (isActive) {
          const restaurants = await ctx.db
            .query("restaurants")
            .withIndex("active_restaurants", q => q.eq("isActive", true))
            .take(limit);
          
          assets = restaurants.map(restaurant => ({
            _id: restaurant._id,
            name: restaurant.name,
            isActive: restaurant.isActive,
            partnerId: restaurant.partnerId,
          }));
        } else {
          const restaurants = await ctx.db
            .query("restaurants")
            .take(limit);
          
          assets = restaurants.map(restaurant => ({
            _id: restaurant._id,
            name: restaurant.name,
            isActive: restaurant.isActive,
            partnerId: restaurant.partnerId,
          }));
        }
        break;

      case "vehicles":
        const vehicles = await ctx.db
          .query("vehicles")
          .take(limit);
        
        assets = vehicles
          .filter(vehicle => !isActive || vehicle.status === "available")
          .map(vehicle => ({
            _id: vehicle._id,
            name: `${vehicle.brand} ${vehicle.model}`,
            isActive: vehicle.status === "available",
            partnerId: vehicle.ownerId,
          }));
        break;

      case "accommodations":
        if (isActive) {
          const accommodations = await ctx.db
            .query("accommodations")
            .withIndex("active_accommodations", q => q.eq("isActive", true))
            .take(limit);
          
          assets = accommodations.map(accommodation => ({
            _id: accommodation._id,
            name: accommodation.name,
            isActive: accommodation.isActive,
            partnerId: accommodation.partnerId,
          }));
        } else {
          const accommodations = await ctx.db
            .query("accommodations")
            .take(limit);
          
          assets = accommodations.map(accommodation => ({
            _id: accommodation._id,
            name: accommodation.name,
            isActive: accommodation.isActive,
            partnerId: accommodation.partnerId,
          }));
        }
        break;

      default:
        break;
    }

    return assets;
  },
}); 