import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutationWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId } from "../../domains/rbac";
import type { RestaurantUpdateInput } from "./types";

/**
 * Create a new restaurant
 */
export const create = mutationWithRole(["partner", "master"])({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    description_long: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      neighborhood: v.string(),
      coordinates: v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
    }),
    phone: v.string(),
    website: v.optional(v.string()),
    cuisine: v.array(v.string()),
    priceRange: v.string(),
    diningStyle: v.string(),
    hours: v.object({
      Monday: v.array(v.string()),
      Tuesday: v.array(v.string()),
      Wednesday: v.array(v.string()),
      Thursday: v.array(v.string()),
      Friday: v.array(v.string()),
      Saturday: v.array(v.string()),
      Sunday: v.array(v.string()),
    }),
    features: v.array(v.string()),
    dressCode: v.optional(v.string()),
    paymentOptions: v.array(v.string()),
    parkingDetails: v.optional(v.string()),
    mainImage: v.string(),
    galleryImages: v.array(v.string()),
    menuImages: v.optional(v.array(v.string())),
    rating: v.object({
      overall: v.number(),
      food: v.number(),
      service: v.number(),
      ambience: v.number(),
      value: v.number(),
      noiseLevel: v.string(),
      totalReviews: v.number(),
    }),
    acceptsReservations: v.boolean(),
    maximumPartySize: v.number(),
    tags: v.array(v.string()),
    executiveChef: v.optional(v.string()),
    privatePartyInfo: v.optional(v.string()),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify that the partner creating the restaurant is the logged in user (unless master)
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (role === "partner") {
      if (!currentUserId || currentUserId.toString() !== args.partnerId.toString()) {
        throw new Error("Unauthorized: partners can only create restaurants for themselves");
      }
    }
    // Convert numbers to appropriate types for the database
    const maximumPartySize = BigInt(args.maximumPartySize);
    const totalReviews = BigInt(args.rating.totalReviews);
    
    // Creating the restaurant
    const restaurantId = await ctx.db.insert("restaurants", {
      ...args,
      address: {
        ...args.address,
        coordinates: {
          latitude: args.address.coordinates.latitude,
          longitude: args.address.coordinates.longitude,
        },
      },
      rating: {
        ...args.rating,
        overall: args.rating.overall,
        food: args.rating.food,
        service: args.rating.service,
        ambience: args.rating.ambience,
        value: args.rating.value,
        totalReviews,
      },
      maximumPartySize,
    });
    
    return restaurantId;
  },
});

/**
 * Update an existing restaurant
 */
export const update = mutationWithRole(["partner", "master"])({
  args: {
    id: v.id("restaurants"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    description_long: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      neighborhood: v.string(),
      coordinates: v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
    })),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    cuisine: v.optional(v.array(v.string())),
    priceRange: v.optional(v.string()),
    diningStyle: v.optional(v.string()),
    hours: v.optional(v.object({
      Monday: v.array(v.string()),
      Tuesday: v.array(v.string()),
      Wednesday: v.array(v.string()),
      Thursday: v.array(v.string()),
      Friday: v.array(v.string()),
      Saturday: v.array(v.string()),
      Sunday: v.array(v.string()),
    })),
    features: v.optional(v.array(v.string())),
    dressCode: v.optional(v.string()),
    paymentOptions: v.optional(v.array(v.string())),
    parkingDetails: v.optional(v.string()),
    mainImage: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    menuImages: v.optional(v.array(v.string())),
    rating: v.optional(v.object({
      overall: v.number(),
      food: v.number(),
      service: v.number(),
      ambience: v.number(),
      value: v.number(),
      noiseLevel: v.string(),
      totalReviews: v.number(),
    })),
    acceptsReservations: v.optional(v.boolean()),
    maximumPartySize: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    executiveChef: v.optional(v.string()),
    privatePartyInfo: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot update restaurant not owned by user");
      }
    }
    const { id, maximumPartySize, rating, address, ...otherFields } = args;
    
    // Define a more specific type for the updates
    type Updates = {
      name?: string;
      slug?: string;
      description?: string;
      description_long?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        neighborhood: string;
        coordinates: {
          latitude: number;
          longitude: number;
        };
      };
      phone?: string;
      website?: string;
      cuisine?: string[];
      priceRange?: string;
      diningStyle?: string;
      hours?: {
        Monday: string[];
        Tuesday: string[];
        Wednesday: string[];
        Thursday: string[];
        Friday: string[];
        Saturday: string[];
        Sunday: string[];
      };
      features?: string[];
      dressCode?: string;
      paymentOptions?: string[];
      parkingDetails?: string;
      mainImage?: string;
      galleryImages?: string[];
      menuImages?: string[];
      rating?: {
        overall: number;
        food: number;
        service: number;
        ambience: number;
        value: number;
        noiseLevel: string;
        totalReviews: bigint;
      };
      acceptsReservations?: boolean;
      maximumPartySize?: bigint;
      tags?: string[];
      executiveChef?: string;
      privatePartyInfo?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      partnerId?: Id<"users">;
    };
    
    // Create an object with all updated fields
    const updates: Updates = {
      ...otherFields
    };
    
    // Handle address updates if provided
    if (address) {
      updates.address = {
        ...address
      };
    }
    
    // Convert number values to appropriate types if provided
    if (maximumPartySize !== undefined) {
      updates.maximumPartySize = BigInt(maximumPartySize);
    }
    
    if (rating !== undefined) {
      updates.rating = {
        ...rating,
        totalReviews: BigInt(rating.totalReviews)
      };
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete a restaurant
 */
export const remove = mutationWithRole(["partner", "master"])({
  args: { id: v.id("restaurants") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot delete restaurant not owned by user");
      }
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Toggle the featured status of a restaurant
 */
export const toggleFeatured = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("restaurants"), 
    isFeatured: v.boolean() 
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot update restaurant not owned by user");
      }
    }
    await ctx.db.patch(args.id, { isFeatured: args.isFeatured });
    return args.id;
  },
});

/**
 * Toggle the active status of a restaurant
 */
export const toggleActive = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("restaurants"), 
    isActive: v.boolean() 
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot update restaurant not owned by user");
      }
    }
    await ctx.db.patch(args.id, { isActive: args.isActive });
    return args.id;
  },
}); 