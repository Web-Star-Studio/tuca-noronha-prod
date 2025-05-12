import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all activities
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("activities").collect();
  },
});

/**
 * Get featured activities
 */
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("isFeatured"), true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Get an activity by ID
 */
export const getById = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new activity
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    shortDescription: v.string(),
    price: v.number(),
    category: v.string(),
    duration: v.string(),
    maxParticipants: v.number(),
    minParticipants: v.number(),
    difficulty: v.string(),
    rating: v.number(),
    imageUrl: v.string(),
    galleryImages: v.array(v.string()),
    highlights: v.array(v.string()),
    includes: v.array(v.string()),
    itineraries: v.array(v.string()),
    excludes: v.array(v.string()),
    additionalInfo: v.array(v.string()),
    cancelationPolicy: v.array(v.string()),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Convert numbers to correct types for the database
    const maxParticipants = BigInt(args.maxParticipants);
    const minParticipants = BigInt(args.minParticipants);
    
    // Creating the activity
    const activityId = await ctx.db.insert("activities", {
      ...args,
      maxParticipants,
      minParticipants,
    });
    
    return activityId;
  },
});

/**
 * Update an existing activity
 */
export const update = mutation({
  args: {
    id: v.id("activities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    duration: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
    minParticipants: v.optional(v.number()),
    difficulty: v.optional(v.string()),
    rating: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
    includes: v.optional(v.array(v.string())),
    itineraries: v.optional(v.array(v.string())),
    excludes: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.array(v.string())),
    cancelationPolicy: v.optional(v.array(v.string())),
    isFeatured: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, maxParticipants, minParticipants, ...otherFields } = args;
    
    // Definir um tipo mais específico para as atualizações
    type Updates = {
      title?: string;
      description?: string;
      shortDescription?: string;
      price?: number;
      category?: string;
      duration?: string;
      maxParticipants?: bigint;
      minParticipants?: bigint;
      difficulty?: string;
      rating?: number;
      imageUrl?: string;
      galleryImages?: string[];
      highlights?: string[];
      includes?: string[];
      itineraries?: string[];
      excludes?: string[];
      additionalInfo?: string[];
      cancelationPolicy?: string[];
      isFeatured?: boolean;
      isActive?: boolean;
    };
    
    // Criar um objeto com todos os campos atualizados
    const updates: Updates = {
      ...otherFields
    };
    
    // Convert participant numbers to BigInt if provided
    if (maxParticipants !== undefined) {
      updates.maxParticipants = BigInt(maxParticipants);
    }
    
    if (minParticipants !== undefined) {
      updates.minParticipants = BigInt(minParticipants);
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete an activity
 */
export const remove = mutation({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Toggle the featured status of an activity
 */
export const toggleFeatured = mutation({
  args: { 
    id: v.id("activities"),
    isFeatured: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isFeatured: args.isFeatured });
    return args.id;
  },
});

/**
 * Toggle the active status of an activity
 */
export const toggleActive = mutation({
  args: { 
    id: v.id("activities"),
    isActive: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: args.isActive });
    return args.id;
  },
}); 