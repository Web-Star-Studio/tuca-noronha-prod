import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutationWithRole } from "./rbac";
import { getCurrentUserRole, getCurrentUserConvexId } from "./rbac";

/**
 * Get all restaurants
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("restaurants").collect();
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
    return await ctx.db.get(args.id);
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
    // Verificar se o parceiro que está criando é o próprio usuário (a menos que seja master)
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
    
    // Convert numbers to appropriate types if provided
    if (maximumPartySize !== undefined) {
      updates.maximumPartySize = BigInt(maximumPartySize);
    }
    
    // Handle address update if provided
    if (address) {
      updates.address = {
        ...address,
        coordinates: {
          latitude: address.coordinates.latitude,
          longitude: address.coordinates.longitude,
        },
      };
    }
    
    // Handle rating update if provided
    if (rating) {
      updates.rating = {
        ...rating,
        overall: rating.overall,
        food: rating.food,
        service: rating.service,
        ambience: rating.ambience,
        value: rating.value,
        totalReviews: BigInt(rating.totalReviews),
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
        throw new Error("Unauthorized: cannot modify restaurant not owned by user");
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot modify restaurant not owned by user");
      }
    }
    await ctx.db.patch(args.id, { isActive: args.isActive });
    return null;
  },
});

/**
 * Get restaurants created by a specific user
 */
export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurants")
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
 * Get restaurants with creator information
 */
export const getRestaurantsWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const restaurants = await ctx.db.query("restaurants").collect();
    const restaurantsWithCreators = await Promise.all(
      restaurants.map(async (restaurant) => {
        let creatorInfo = null;
        if (restaurant.partnerId) {
          creatorInfo = await ctx.db.get(restaurant.partnerId);
        }
        return {
          ...restaurant,
          creator: creatorInfo ? {
            id: creatorInfo._id,
            name: creatorInfo.name,
            email: creatorInfo.email,
            image: creatorInfo.image
          } : null
        };
      })
    );
    return restaurantsWithCreators;
  },
});

/**
 * Create a new reservation
 */
export const createReservation = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
    date: v.string(),
    time: v.string(),
    partySize: v.number(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    specialRequests: v.optional(v.string()),
  },
  returns: v.id("restaurantReservations"),
  handler: async (ctx, args) => {
    const { partySize, ...otherArgs } = args;
    
    // Gerar código de confirmação único
    const confirmationCode = generateConfirmationCode();
    
    // Criar a reserva
    const reservationId = await ctx.db.insert("restaurantReservations", {
      ...otherArgs,
      partySize: BigInt(partySize),
      status: "pending",
      confirmationCode,
    });
    
    return reservationId;
  },
});

/**
 * Update reservation status
 */
export const updateReservationStatus = mutation({
  args: {
    id: v.id("restaurantReservations"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

/**
 * Get reservations for a restaurant
 */
export const getReservationsByRestaurant = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurantReservations")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();
  },
});

/**
 * Get reservations for a user
 */
export const getReservationsByUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("restaurantReservations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Get restaurant details for each reservation
    const reservationsWithDetails = await Promise.all(
      reservations.map(async (reservation) => {
        const restaurant = await ctx.db.get(reservation.restaurantId);
        return {
          ...reservation,
          restaurant: restaurant ? {
            id: restaurant._id,
            name: restaurant.name,
            address: restaurant.address,
            mainImage: restaurant.mainImage,
          } : null
        };
      })
    );
    
    return reservationsWithDetails;
  },
});

/**
 * Get reservations for a specific date at a restaurant
 */
export const getReservationsByDate = query({
  args: {
    restaurantId: v.id("restaurants"),
    date: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurantReservations")
      .withIndex("by_restaurant_date", (q) => 
        q.eq("restaurantId", args.restaurantId).eq("date", args.date)
      )
      .collect();
  },
});

// Função utilitária para gerar códigos de confirmação
function generateConfirmationCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem caracteres ambíguos
  let code = '';
  
  // Gerar 6 caracteres aleatórios
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  return code;
}