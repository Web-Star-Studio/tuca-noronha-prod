import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Event, EventWithCreator } from "./types";
import { queryWithRole } from "../../domains/rbac";
import { 
  getCurrentUserRole, 
  getCurrentUserConvexId, 
  verifyPartnerAccess,
  filterAccessibleAssets,
  verifyEmployeeAccess
} from "../../domains/rbac";

/**
 * Get all events
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // If unauthenticated or traveler, return all public events
    if (!currentUserId || role === "traveler") {
      return await ctx.db.query("events").collect();
    }

    // Masters can access every event
    if (role === "master") {
      return await ctx.db.query("events").collect();
    }

    // Partners can only access events they created
    if (role === "partner") {
      return await ctx.db
        .query("events")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    }

    // Employees can access events they have explicit permission for
    if (role === "employee") {
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) =>
          q.eq("employeeId", currentUserId).eq("assetType", "events"),
        )
        .collect();

      if (permissions.length === 0) return [];

      const allowedIds = new Set(permissions.map((p) => p.assetId));
      const allEvents = await ctx.db.query("events").collect();
      return allEvents.filter((e) => allowedIds.has(e._id.toString()));
    }

    // Default: no events
    return [];
  },
});

/**
 * Get all events for admin dashboard, filtered by permissions
 */
export const getEventsForAdmin = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    // Não autenticado ou sem ID Convex
    if (!currentUserId) return [];
    
    // Se for master, retorna todos os eventos
    if (role === "master") {
      return await ctx.db.query("events").collect();
    }
    
          // Se for partner, retorna apenas eventos do próprio partner
      if (role === "partner") {
        return await ctx.db
          .query("events")
          .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
          .collect();
      }
    
    // Se for employee, retorna eventos para os quais tem permissão
    if (role === "employee") {
      // Busca todas as permissões do employee para eventos
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) => 
          q.eq("employeeId", currentUserId).eq("assetType", "events")
        )
        .collect();
      
      // Se não tem permissões, retorna vazio
      if (permissions.length === 0) return [];
      
      // Cria um array com os IDs dos eventos permitidos
      const eventIds = permissions.map(p => p.assetId);
      
      // Busca os eventos com os IDs permitidos
      // Como não podemos usar um array de IDs diretamente na query,
      // fazemos a query completa e filtramos depois
      const allEvents = await ctx.db.query("events").collect();
      
      // Filtra apenas os eventos com permissão
      return allEvents.filter(event => 
        eventIds.includes(event._id.toString())
      );
    }
    
    // Outros papéis não têm acesso a assets no admin
    return [];
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
 * Alias for getFeatured to maintain backward compatibility
 */
export const getFeaturedEvents = getFeatured;

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
 * Get a single event by ID
 */
export const getById = query({
  args: { id: v.id("events") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    
    // Verifica se o usuário atual tem acesso ao evento (apenas no contexto admin)
    const role = await getCurrentUserRole(ctx);
    
    // Para usuários públicos (traveler) ou master, retorna sem verificar permissões
    if (role === "traveler" || role === "master") {
      return event;
    }
    
    // Para partner e employee, verificamos permissões
    const hasAccess = await verifyPartnerAccess(ctx, args.id, "events") || 
                      await verifyEmployeeAccess(ctx, args.id, "events", "view");
    
    if (!hasAccess) {
      throw new Error("Não autorizado a acessar este evento");
    }
    
    return event;
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
 * Get events with creator information, filtered by permissions
 */
export const getEventsWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    // Busca todos os eventos (será filtrado depois)
    const allEvents = await ctx.db.query("events").collect();
    
    // Filtra eventos por permissões, exceto para master que vê tudo
    let accessibleEvents = allEvents;
    if (role !== "master" && currentUserId) {
      accessibleEvents = await filterAccessibleAssets(ctx, allEvents, "events", "view");
    }
    
    // Adiciona informações do criador a cada evento
    const eventsWithCreators = await Promise.all(
      accessibleEvents.map(async (event) => {
        const user = event.partnerId ? await ctx.db.get(event.partnerId) : null;
        
        return {
          ...event,
          creator: user ? {
            id: user._id,
            name: user.name,
            email: user.email,
            image: user.image
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
 * Alias for getEventTickets to maintain compatibility with frontend
 */
export const getTicketsByEvent = getEventTickets;

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
 * Alias for getActiveEventTickets to maintain compatibility with frontend
 */
export const getActiveTicketsByEvent = getActiveEventTickets;

/**
 * Get events (somente ativos) com informações do criador para páginas públicas.
 * Não aplica nenhum filtro de RBAC – qualquer usuário (logado ou não) recebe
 * a lista completa de eventos ativos.
 */
export const getPublicEventsWithCreators = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    // Busca apenas eventos ativos
    const events = await ctx.db
      .query("events")
      .withIndex("active_events", (q) => q.eq("isActive", true))
      .collect();

    // Carrega dados do criador
    const eventsWithCreators = await Promise.all(
      events.map(async (event) => {
        const user = event.partnerId ? await ctx.db.get(event.partnerId) : null;
        return {
          ...event,
          creator: user
            ? {
                id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
        };
      }),
    );

    return eventsWithCreators;
  },
}); 