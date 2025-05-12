import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all events
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

/**
 * Get featured events
 */
export const getFeatured = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("featured_events", (q) => 
        q.eq("isFeatured", true).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Get upcoming events
 */
export const getUpcoming = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    return await ctx.db
      .query("events")
      .withIndex("by_date", (q) => q.gte("date", today))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

/**
 * Get an event by ID
 */
export const getById = query({
  args: { id: v.id("events") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new event
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    shortDescription: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    address: v.string(),
    price: v.number(),
    category: v.string(),
    maxParticipants: v.number(),
    imageUrl: v.string(),
    galleryImages: v.array(v.string()),
    highlights: v.array(v.string()),
    includes: v.array(v.string()),
    additionalInfo: v.array(v.string()),
    speaker: v.optional(v.string()),
    speakerBio: v.optional(v.string()),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    hasMultipleTickets: v.optional(v.boolean()),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Convert number to BigInt for the database
    const maxParticipants = BigInt(args.maxParticipants);
    
    // Creating the event
    const eventId = await ctx.db.insert("events", {
      ...args,
      maxParticipants,
      hasMultipleTickets: args.hasMultipleTickets || false, // valor padrão é false
    });
    
    return eventId;
  },
});

/**
 * Update an existing event
 */
export const update = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    location: v.optional(v.string()),
    address: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
    includes: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.array(v.string())),
    speaker: v.optional(v.string()),
    speakerBio: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    hasMultipleTickets: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, maxParticipants, ...otherFields } = args;
    
    // Define a more specific type for the updates
    type Updates = {
      title?: string;
      description?: string;
      shortDescription?: string;
      date?: string;
      time?: string;
      location?: string;
      address?: string;
      price?: number;
      category?: string;
      maxParticipants?: bigint;
      imageUrl?: string;
      galleryImages?: string[];
      highlights?: string[];
      includes?: string[];
      additionalInfo?: string[];
      speaker?: string;
      speakerBio?: string;
      isFeatured?: boolean;
      isActive?: boolean;
      hasMultipleTickets?: boolean;
      partnerId?: Id<"users">;
    };
    
    // Create an object with all updated fields
    const updates: Updates = {
      ...otherFields
    };
    
    // Convert participant numbers to BigInt if provided
    if (maxParticipants !== undefined) {
      updates.maxParticipants = BigInt(maxParticipants);
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete an event
 */
export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Toggle the featured status of an event
 */
export const toggleFeatured = mutation({
  args: { 
    id: v.id("events"),
    isFeatured: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isFeatured: args.isFeatured });
    return args.id;
  },
});

/**
 * Toggle the active status of an event
 */
export const toggleActive = mutation({
  args: { 
    id: v.id("events"),
    isActive: v.boolean()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: args.isActive });
    return null;
  },
});

/**
 * Get events created by a specific user
 */
export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
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
 * Get events with creator information
 */
export const getEventsWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const eventsWithCreators = await Promise.all(
      events.map(async (event) => {
        let creatorInfo = null;
        if (event.partnerId) {
          creatorInfo = await ctx.db.get(event.partnerId);
        }
        return {
          ...event,
          creator: creatorInfo ? {
            id: creatorInfo._id,
            name: creatorInfo.name,
            email: creatorInfo.email,
            image: creatorInfo.image
          } : null
        };
      })
    );
    return eventsWithCreators;
  },
});

/**
 * Get all tickets for an event
 */
export const getEventTickets = query({
  args: { 
    eventId: v.id("events") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventTickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Get all active tickets for an event
 */
export const getActiveEventTickets = query({
  args: { 
    eventId: v.id("events") 
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventTickets")
      .withIndex("by_event_and_active", (q) => 
        q.eq("eventId", args.eventId).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Create a new ticket for an event
 */
export const createEventTicket = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    availableQuantity: v.number(),
    maxPerOrder: v.number(),
    type: v.string(),
    benefits: v.array(v.string()),
    isActive: v.boolean()
  },
  returns: v.id("eventTickets"),
  handler: async (ctx, args) => {
    // Primeiro, atualizamos o evento para indicar que tem múltiplos ingressos
    await ctx.db.patch(args.eventId, { hasMultipleTickets: true });
    
    // Depois, criamos o novo ingresso
    const ticketId = await ctx.db.insert("eventTickets", {
      eventId: args.eventId,
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
export const updateEventTicket = mutation({
  args: {
    id: v.id("eventTickets"),
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
export const removeEventTicket = mutation({
  args: { 
    id: v.id("eventTickets") 
  },
  handler: async (ctx, args) => {
    // Obter o ingresso para identificar o evento
    const ticket = await ctx.db.get(args.id);
    
    // Verificar se o ticket existe
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    // Verificar se é o último ingresso deste evento
    const remainingTickets = await ctx.db
      .query("eventTickets")
      .withIndex("by_event", (q) => q.eq("eventId", ticket.eventId))
      .collect();
    
    // Se for o último (ou seja, se só restar 1 que é o que vamos excluir)
    if (remainingTickets.length <= 1) {
      // Atualizar o evento para indicar que não tem mais ingressos múltiplos
      await ctx.db.patch(ticket.eventId, { hasMultipleTickets: false });
    }
    
    // Excluir o ingresso
    await ctx.db.delete(args.id);
  },
});
