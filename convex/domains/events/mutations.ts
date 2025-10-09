import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutationWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";
import type { 
  EventCreateInput,
  EventUpdateInput,
  EventTicketCreateInput,
  EventTicketUpdateInput,
  EventTicketUpdates
} from "./types";
import { internalMutation } from "../../_generated/server";
import { logAssetOperation } from "../audit/utils";

/**
 * Create a new event
 */
export const create = mutationWithRole(["partner", "master"])({
  args: {
    title: v.string(),
    description: v.string(),
    shortDescription: v.string(),
    date: v.string(),
    time: v.string(),
    location: v.string(),
    address: v.string(),
    price: v.number(),
    netRate: v.optional(v.number()),
    category: v.string(),
    maxParticipants: v.int64(),
    imageUrl: v.string(),
    galleryImages: v.array(v.string()),
    highlights: v.array(v.string()),
    includes: v.array(v.string()),
    additionalInfo: v.array(v.string()),
    speaker: v.optional(v.string()),
    speakerBio: v.optional(v.string()),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    isFree: v.optional(v.boolean()),
    hasMultipleTickets: v.optional(v.boolean()),
    partnerId: v.id("users"),
    symplaUrl: v.optional(v.string()),
    externalBookingUrl: v.optional(v.string()),
    whatsappContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (role === "partner") {
      if (!currentUserId || currentUserId.toString() !== args.partnerId.toString()) {
        throw new Error("Unauthorized: partners can only create events for themselves");
      }
    }
    
    console.log("🔍 [CREATE] Args recebidos no Convex:", args);
    console.log("🔗 [CREATE] externalBookingUrl:", args.externalBookingUrl);
    
    // Creating the event
    const eventId = await ctx.db.insert("events", {
      ...args,
      netRate: args.netRate ?? args.price,
      hasMultipleTickets: args.hasMultipleTickets || false, // valor padrão é false
      acceptsOnlinePayment: args.price > 0, // automaticamente true quando price > 0
      requiresUpfrontPayment: args.price > 0, // automaticamente true quando price > 0
    });
    
    console.log("✅ [CREATE] Evento criado com ID:", eventId);

    // Log the event creation for audit
    try {
      await logAssetOperation(
        ctx,
        "create",
        "events",
        eventId,
        args.title,
        {
          amount: args.price,
          quantity: Number(args.maxParticipants),
          after: {
            category: args.category,
            isActive: args.isActive,
            isFeatured: args.isFeatured,
          }
        }
      );
    } catch (error) {
      console.error("Failed to log event creation:", error);
      // Don't fail the main operation if logging fails
    }
    
    return eventId;
  },
});

/**
 * Update an existing event
 */
export const update = mutationWithRole(["partner", "master"])({
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
    netRate: v.optional(v.number()),
    category: v.optional(v.string()),
    maxParticipants: v.optional(v.int64()),
    imageUrl: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
    includes: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.array(v.string())),
    speaker: v.optional(v.string()),
    speakerBio: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    isFree: v.optional(v.boolean()),
    hasMultipleTickets: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
    symplaUrl: v.optional(v.string()),
    externalBookingUrl: v.optional(v.string()),
    whatsappContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const event = await ctx.db.get(args.id);
      if (!event || event.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }
    
    console.log("🔍 [UPDATE] Args recebidos no Convex:", args);
    console.log("🔗 [UPDATE] externalBookingUrl:", args.externalBookingUrl);
    
    const { id, ...otherFields } = args;
    
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
      netRate?: number;
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
      isFree?: boolean;
      hasMultipleTickets?: boolean;
      partnerId?: Id<"users">;
      supplierId?: Id<"suppliers">;
      symplaUrl?: string;
      externalBookingUrl?: string;
      whatsappContact?: string;
      acceptsOnlinePayment?: boolean;
      requiresUpfrontPayment?: boolean;
    };
    
    // Create an object with all updated fields
    const updates: Updates = {
      ...otherFields
    };
    
    // Automatically set acceptsOnlinePayment and requiresUpfrontPayment when price is updated
    if (args.price !== undefined) {
      updates.acceptsOnlinePayment = args.price > 0;
      updates.requiresUpfrontPayment = args.price > 0;
    }
    
    await ctx.db.patch(id, updates);

    // Log the event update for audit
    try {
      const event = await ctx.db.get(id);
      await logAssetOperation(
        ctx,
        "update",
        "events",
        id,
        event?.title || args.title,
        {
          updatedFields: Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined),
          isActive: args.isActive,
          isFeatured: args.isFeatured,
        }
      );
    } catch (error) {
      console.error("Failed to log event update:", error);
      // Don't fail the main operation if logging fails
    }

    return id;
  },
});

/**
 * Delete an event
 */
export const remove = mutationWithRole(["partner", "master"])({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    const event = await ctx.db.get(args.id);
    
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      if (!event || event.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }

    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.delete(args.id);

    // Log the event deletion for audit
    try {
      await logAssetOperation(
        ctx,
        "delete",
        "events",
        args.id,
        event.title,
        {
          before: {
            category: event.category,
            isActive: event.isActive,
            isFeatured: event.isFeatured,
          }
        }
      );
    } catch (error) {
      console.error("Failed to log event deletion:", error);
      // Don't fail the main operation if logging fails
    }
  },
});

/**
 * Toggle the featured status of an event
 */
export const toggleFeatured = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("events"),
    isFeatured: v.boolean()
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    const event = await ctx.db.get(args.id);
    
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      if (!event || event.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }

    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(args.id, { isFeatured: args.isFeatured });

    // Log the featured toggle for audit
    try {
      await logAssetOperation(
        ctx,
        "feature_toggle",
        "events",
        args.id,
        event.title,
        {
          before: { isFeatured: event.isFeatured },
          after: { isFeatured: args.isFeatured },
          reason: args.isFeatured ? "featured" : "unfeatured",
        }
      );
    } catch (error) {
      console.error("Failed to log event featured toggle:", error);
      // Don't fail the main operation if logging fails
    }

    return args.id;
  },
});

/**
 * Toggle the active status of an event
 */
export const toggleActive = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("events"),
    isActive: v.boolean()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    const event = await ctx.db.get(args.id);
    
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      if (!event || event.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }

    if (!event) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(args.id, { isActive: args.isActive });

    // Log the active status toggle for audit
    try {
      await logAssetOperation(
        ctx,
        "status_change",
        "events",
        args.id,
        event.title,
        {
          before: { isActive: event.isActive },
          after: { isActive: args.isActive },
          reason: args.isActive ? "activated" : "deactivated",
        }
      );
    } catch (error) {
      console.error("Failed to log event status toggle:", error);
      // Don't fail the main operation if logging fails
    }

    return null;
  },
});

/**
 * Create a new ticket for an event
 */
export const createEventTicket = mutationWithRole(["partner", "master"])({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    availableQuantity: v.int64(),
    maxPerOrder: v.int64(),
    type: v.string(),
    benefits: v.array(v.string()),
    isActive: v.boolean()
  },
  returns: v.id("eventTickets"),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const event = await ctx.db.get(args.eventId);
      if (!event || event.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized");
      }
    }
    // Primeiro, atualizamos o evento para indicar que tem múltiplos ingressos
    await ctx.db.patch(args.eventId, { hasMultipleTickets: true });
    
    // Depois, criamos o novo ingresso
    const ticketId = await ctx.db.insert("eventTickets", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      price: args.price,
      availableQuantity: args.availableQuantity,
      maxPerOrder: args.maxPerOrder,
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
export const updateEventTicket = mutationWithRole(["partner", "master"])({
  args: {
    id: v.id("eventTickets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    availableQuantity: v.optional(v.int64()),
    maxPerOrder: v.optional(v.int64()),
    type: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { id, ...otherFields } = args;
    
    // Criar um objeto com todos os campos a serem atualizados
    const updates: EventTicketUpdates = {
      ...otherFields
    };
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete a ticket
 */
export const removeEventTicket = mutationWithRole(["partner", "master"])({
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

/**
 * Internal helper used by the Sympla sync action to either create or update
 * a single event document in the `events` table. This mutation **must not**
 * be called directly from the client.
 */
export const _upsertFromSympla = internalMutation({
  args: {
    event: v.any(), // Using v.any() keeps the validator simple and flexible.
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const data = args.event;

    // Look for an existing event that matches either Sympla URL, Sympla ID or title.
    const existing = await ctx.db
      .query("events")
      .withIndex("by_partner", (q) => q.eq("partnerId", data.partnerId))
      .filter((q) =>
        q.or(
          q.eq(q.field("symplaUrl"), data.symplaUrl),
          q.eq(q.field("symplaId"), data.symplaId),
          q.eq(q.field("title"), data.title),
        ),
      )
      .collect();

    if (existing.length > 0) {
      // Update first match.
      await ctx.db.patch(existing[0]._id, data);
    } else {
      await ctx.db.insert("events", data);
    }

    return null;
  },
}); 
