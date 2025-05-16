import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutationWithRole } from "./rbac";
import { getCurrentUserRole, getCurrentUserConvexId } from "./rbac";

/**
 * Get all activities
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("activities").collect();
  },
});

/**
 * Get featured activities
 */
export const getFeatured = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .withIndex("featured_activities", (q) => 
        q.eq("isFeatured", true).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Get an activity by ID
 */
export const getById = query({
  args: { id: v.id("activities") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new activity
 */
export const create = mutationWithRole(["partner", "master"])({
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
    hasMultipleTickets: v.optional(v.boolean()),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (role === "partner") {
      if (!currentUserId || currentUserId.toString() !== args.partnerId.toString()) {
        throw new Error("Unauthorized: partners can only create activities for themselves");
      }
    }
    // Convert numbers to correct types for the database
    const maxParticipants = BigInt(args.maxParticipants);
    const minParticipants = BigInt(args.minParticipants);
    
    // Creating the activity
    const activityId = await ctx.db.insert("activities", {
      ...args,
      maxParticipants,
      minParticipants,
      hasMultipleTickets: args.hasMultipleTickets || false, // default é false
    });
    
    return activityId;
  },
});

/**
 * Update an existing activity
 */
export const update = mutationWithRole(["partner", "master"])({
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
    hasMultipleTickets: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const activity = await ctx.db.get(args.id);
      if (!activity || activity.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }
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
      hasMultipleTickets?: boolean;
      partnerId?: Id<"users">;
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
export const remove = mutationWithRole(["partner", "master"])({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const activity = await ctx.db.get(args.id);
      if (!activity || activity.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }
    await ctx.db.delete(args.id);
  },
});

/**
 * Toggle the featured status of an activity
 */
export const toggleFeatured = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("activities"),
    isFeatured: v.boolean()
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const activity = await ctx.db.get(args.id);
      if (!activity || activity.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }
    await ctx.db.patch(args.id, { isFeatured: args.isFeatured });
    return args.id;
  },
});

/**
 * Toggle the active status of an activity
 */
export const toggleActive = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("activities"),
    isActive: v.boolean()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const activity = await ctx.db.get(args.id);
      if (!activity || activity.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }
    await ctx.db.patch(args.id, { isActive: args.isActive });
    return null;
  },
});

/**
 * Get activities created by a specific user
 */
export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.userId))
      .collect();
  },
});

/**
 * Get user information by ID - for displaying creator information
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get activities with creator information
 */
export const getActivitiesWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    // Get all activities
    const activities = await ctx.db.query("activities").collect();
    
    // Get creator details for each activity
    const activitiesWithCreators = await Promise.all(
      activities.map(async (activity) => {
        let creatorInfo = null;
        if (activity.partnerId) {
          creatorInfo = await ctx.db.get(activity.partnerId);
        }
        
        return {
          ...activity,
          creator: creatorInfo ? {
            id: creatorInfo._id,
            name: creatorInfo.name,
            email: creatorInfo.email,
            image: creatorInfo.image
          } : null
        };
      })
    );
    
    return activitiesWithCreators;
  },
});

/**
 * Get all tickets for an activity
 */
export const getActivityTickets = query({
  args: { 
    activityId: v.id("activities") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityTickets")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();
  },
});

/**
 * Get all active tickets for an activity
 */
export const getActiveActivityTickets = query({
  args: { 
    activityId: v.id("activities") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityTickets")
      .withIndex("by_activity_and_active", (q) => 
        q.eq("activityId", args.activityId).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Create a new ticket for an activity
 */
export const createActivityTicket = mutationWithRole(["partner", "master"])({
  args: {
    activityId: v.id("activities"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    availableQuantity: v.number(),
    maxPerOrder: v.number(),
    type: v.string(),
    benefits: v.array(v.string()),
    isActive: v.boolean()
  },
  returns: v.id("activityTickets"),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const activity = await ctx.db.get(args.activityId);
      if (!activity || activity.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }
    // Primeiro, atualizamos a atividade para indicar que tem múltiplos ingressos
    await ctx.db.patch(args.activityId, { hasMultipleTickets: true });
    
    // Depois, criamos o novo ingresso
    const ticketId = await ctx.db.insert("activityTickets", {
      activityId: args.activityId,
      name: args.name,
      description: args.description,
      price: args.price,
      availableQuantity: BigInt(args.availableQuantity),
      maxPerOrder: BigInt(args.maxPerOrder),
      type: args.type,
      benefits: args.benefits,
      isActive: args.isActive
    });
    
    return ticketId;
  },
});

/**
 * Update an existing ticket
 */
export const updateActivityTicket = mutationWithRole(["partner", "master"])({
  args: {
    id: v.id("activityTickets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    availableQuantity: v.optional(v.number()),
    maxPerOrder: v.optional(v.number()),
    type: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { id, availableQuantity, maxPerOrder, ...otherFields } = args;
    
    // Define um tipo mais específico para as atualizações
    type Updates = {
      name?: string;
      description?: string;
      price?: number;
      availableQuantity?: bigint;
      maxPerOrder?: bigint;
      type?: string;
      benefits?: string[];
      isActive?: boolean;
    };
    
    // Criar um objeto com todos os campos a serem atualizados
    const updates: Updates = {
      ...otherFields
    };
    
    // Converter números para BigInt se fornecidos
    if (availableQuantity !== undefined) {
      updates.availableQuantity = BigInt(availableQuantity);
    }
    
    if (maxPerOrder !== undefined) {
      updates.maxPerOrder = BigInt(maxPerOrder);
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete a ticket
 */
export const removeActivityTicket = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("activityTickets") 
  },
  handler: async (ctx, args) => {
    // Obter o ingresso para identificar a atividade
    const ticket = await ctx.db.get(args.id);
    
    // Verificar se o ticket existe
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    // Verificar se é o último ingresso desta atividade
    const remainingTickets = await ctx.db
      .query("activityTickets")
      .withIndex("by_activity", (q) => q.eq("activityId", ticket.activityId))
      .collect();
    
    // Se for o último (ou seja, se só restar 1 que é o que vamos excluir)
    if (remainingTickets.length <= 1) {
      // Atualizar a atividade para indicar que não tem mais ingressos múltiplos
      await ctx.db.patch(ticket.activityId, { hasMultipleTickets: false });
    }
    
    // Excluir o ingresso
    await ctx.db.delete(args.id);
  },
});