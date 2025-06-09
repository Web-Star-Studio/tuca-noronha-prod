import { v } from "convex/values";
import { query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { User, UserWithRole } from "./types";
import { queryWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";
import { UserRole } from "../rbac/types";

/**
 * Get the current authenticated user's information
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      id: v.id("users"),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      role: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find user by clerkId
    const users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .collect();
    
    if (users.length === 0) {
      console.log("User not found for subject:", identity.subject);
      return null;
    }
    
    const user = users[0];
    // Ensure clerkId is not undefined before returning
    if (!user.clerkId) {
      console.log("User has no clerkId:", user._id);
      return null;
    }
    
    return {
      _id: user._id,
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role || "traveler",
    };
  },
});

/**
 * Get a user by their Clerk ID
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      phone: v.optional(v.string()),
      role: v.optional(v.string()),
      partnerId: v.optional(v.id("users")),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    // Ensure clerkId exists before returning
    if (!user.clerkId) {
      return null;
    }
    
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      phone: user.phone,
      role: user.role,
      partnerId: user.partnerId,
      emailVerificationTime: user.emailVerificationTime,
      isAnonymous: user.isAnonymous,
    };
  },
});

/**
 * Get a user by their Convex ID
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      phone: v.optional(v.string()),
      role: v.optional(v.string()),
      partnerId: v.optional(v.id("users")),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user || !user.clerkId) {
      return null;
    }
    
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      phone: user.phone,
      role: user.role,
      partnerId: user.partnerId,
      emailVerificationTime: user.emailVerificationTime,
      isAnonymous: user.isAnonymous,
    };
  },
});

/**
 * Get all users (admin only)
 */
export const getAllUsers = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })),
  handler: async (ctx) => {
    // Note: In a production environment, you might want to add role-based access control here
    // For now, returning all users for admin functionality
    const users = await ctx.db.query("users").collect();
    
    // Filter out users without clerkId and map to proper format
    return users
      .filter(user => user.clerkId)
      .map(user => ({
        _id: user._id,
        _creationTime: user._creationTime,
        clerkId: user.clerkId as string, // safe because we filtered for clerkId existence
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        role: user.role,
        partnerId: user.partnerId,
        emailVerificationTime: user.emailVerificationTime,
        isAnonymous: user.isAnonymous,
      }));
  },
});

/**
 * Get users by role
 */
export const getUsersByRole = query({
  args: {
    role: v.union(
      v.literal("traveler"),
      v.literal("partner"),
      v.literal("employee"),
      v.literal("master"),
    ),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    // Using a filter since there's no 'by_role' index in the schema yet
    const users = await ctx.db
      .query("users")
      .collect();
    
    // Filter in memory for users with the specified role and valid clerkId
    return users
      .filter(user => user.role === args.role && user.clerkId)
      .map(user => ({
        _id: user._id,
        _creationTime: user._creationTime,
        clerkId: user.clerkId as string, // safe because we filtered for clerkId existence
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        role: user.role,
        partnerId: user.partnerId,
        emailVerificationTime: user.emailVerificationTime,
        isAnonymous: user.isAnonymous,
      }));
  },
});

/**
 * Get employees by organization
 */
export const getEmployeesByOrganization = query({
  args: {
    organizationId: v.id("partnerOrganizations"),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    // Use the new index to efficiently query employees by organization
    const employees = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Filter for employees only
    return employees
      .filter(user => user.role === "employee")
      .map(user => ({
        _id: user._id,
        _creationTime: user._creationTime,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        role: user.role,
        partnerId: user.partnerId,
        organizationId: user.organizationId,
        emailVerificationTime: user.emailVerificationTime,
        isAnonymous: user.isAnonymous,
      }));
  },
});

/**
 * Listar todos os usuários (apenas para masters)
 */
export const listAllUsers = query({
  args: {
    role: v.optional(v.union(
      v.literal("traveler"),
      v.literal("partner"),
      v.literal("employee"),
      v.literal("master"),
      v.literal("all")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // Métricas agregadas
    organizationsCount: v.number(),
    assetsCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver todos os usuários");
    }

    const limit = args.limit || 100;
    let query = ctx.db.query("users");

    // Filtro por role
    if (args.role && args.role !== "all") {
      query = query.filter((q) => q.eq(q.field("role"), args.role));
    }

    const users = await query
      .order("desc")
      .take(limit);

    // Enriquecer com métricas
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        let organizationsCount = 0;
        let assetsCount = 0;

        // Contar organizações se for partner
        if (user.role === "partner") {
          const organizations = await ctx.db
            .query("partnerOrganizations")
            .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
            .collect();
          organizationsCount = organizations.length;

          // Contar assets do partner
          const [restaurants, events, activities, vehicles, accommodations] = await Promise.all([
            ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
            ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
            ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
            ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).collect(),
            ctx.db.query("accommodations").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
          ]);

          assetsCount = restaurants.length + events.length + activities.length + vehicles.length + accommodations.length;
        }

        return {
          ...user,
          organizationsCount,
          assetsCount,
        };
      })
    );

    return enrichedUsers;
  },
});

/**
 * Obter estatísticas gerais do sistema (apenas para masters)
 */
export const getSystemStatistics = query({
  args: {},
  returns: v.object({
    users: v.object({
      total: v.number(),
      travelers: v.number(),
      partners: v.number(),
      employees: v.number(),
      masters: v.number(),
    }),
    assets: v.object({
      total: v.number(),
      restaurants: v.number(),
      events: v.number(),
      activities: v.number(),
      vehicles: v.number(),
      accommodations: v.number(),
      active: v.number(),
    }),
    organizations: v.object({
      total: v.number(),
      active: v.number(),
    }),
    bookings: v.object({
      total: v.number(),
      pending: v.number(),
      confirmed: v.number(),
      cancelled: v.number(),
    }),
    support: v.object({
      total: v.number(),
      open: v.number(),
      urgent: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver estatísticas do sistema");
    }

    // Buscar todos os dados necessários
    const [
      allUsers,
      restaurants,
      events,
      activities,
      vehicles,
      accommodations,
      organizations,
      eventBookings,
      supportMessages,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("restaurants").collect(),
      ctx.db.query("events").collect(),
      ctx.db.query("activities").collect(),
      ctx.db.query("vehicles").collect(),
      ctx.db.query("accommodations").collect(),
      ctx.db.query("partnerOrganizations").collect(),
      ctx.db.query("eventBookings").collect(),
      ctx.db.query("supportMessages").collect(),
    ]);

    // Calcular estatísticas
    const userStats = {
      total: allUsers.length,
      travelers: allUsers.filter(u => u.role === "traveler").length,
      partners: allUsers.filter(u => u.role === "partner").length,
      employees: allUsers.filter(u => u.role === "employee").length,
      masters: allUsers.filter(u => u.role === "master").length,
    };

    const totalAssets = restaurants.length + events.length + activities.length + vehicles.length + accommodations.length;
    const activeAssets = [
      ...restaurants.filter(r => r.isActive),
      ...events.filter(e => e.isActive),
      ...activities.filter(a => a.isActive),
      ...vehicles.filter(v => v.status === "available"),
      ...accommodations.filter(a => a.isActive),
    ].length;

    const assetStats = {
      total: totalAssets,
      restaurants: restaurants.length,
      events: events.length,
      activities: activities.length,
      vehicles: vehicles.length,
      accommodations: accommodations.length,
      active: activeAssets,
    };

    const organizationStats = {
      total: organizations.length,
      active: organizations.filter(o => o.isActive).length,
    };

    const bookingStats = {
      total: eventBookings.length,
      pending: eventBookings.filter(b => b.status === "pending").length,
      confirmed: eventBookings.filter(b => b.status === "confirmed").length,
      cancelled: eventBookings.filter(b => b.status === "cancelled").length,
    };

    const supportStats = {
      total: supportMessages.length,
      open: supportMessages.filter(s => s.status === "open").length,
      urgent: supportMessages.filter(s => s.isUrgent).length,
    };

    return {
      users: userStats,
      assets: assetStats,
      organizations: organizationStats,
      bookings: bookingStats,
      support: supportStats,
    };
  },
});

/**
 * Listar todos os assets do sistema (apenas para masters)
 */
export const listAllAssets = query({
  args: {
    assetType: v.optional(v.union(
      v.literal("restaurants"),
      v.literal("events"),
      v.literal("activities"),
      v.literal("vehicles"),
      v.literal("accommodations"),
      v.literal("all")
    )),
    isActive: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.string(),
    _creationTime: v.number(),
    name: v.string(), // title para eventos
    assetType: v.string(),
    isActive: v.boolean(),
    partnerId: v.id("users"),
    partnerName: v.optional(v.string()),
    partnerEmail: v.optional(v.string()),
    // Métricas específicas podem variar por tipo
    bookingsCount: v.optional(v.number()),
    rating: v.optional(v.number()),
    price: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver todos os assets");
    }

    const limit = args.limit || 100;
    let allAssets: any[] = [];

    // Coletar assets de acordo com o filtro
    const assetTypes = args.assetType === "all" || !args.assetType 
      ? ["restaurants", "events", "activities", "vehicles", "accommodations"]
      : [args.assetType];

    for (const assetType of assetTypes) {
      let query: any;
      
      if (assetType === "vehicles") {
        query = ctx.db.query("vehicles");
        // Vehicles use ownerId instead of partnerId
        if (args.partnerId) {
          query = query.withIndex("by_ownerId", (q: any) => q.eq("ownerId", args.partnerId));
        }
        if (args.isActive !== undefined) {
          // Vehicles use status instead of isActive
          const status = args.isActive ? "available" : "maintenance";
          query = query.filter((q: any) => q.eq(q.field("status"), status));
        }
      } else {
        query = ctx.db.query(assetType as any);

        // Filtros for non-vehicle assets
        if (args.partnerId) {
          query = query.withIndex("by_partner", (q: any) => q.eq("partnerId", args.partnerId));
        }

        if (args.isActive !== undefined) {
          query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
        }
      }

      const assets = await query.take(limit);

      // Padronizar estrutura
      const standardizedAssets = assets.map((asset: any) => ({
        ...asset,
        _id: asset._id.toString(),
        name: asset.name || asset.title,
        assetType,
        isActive: assetType === "vehicles" ? asset.status === "available" : asset.isActive,
        partnerId: assetType === "vehicles" ? asset.ownerId : asset.partnerId,
        rating: typeof asset.rating === 'number' ? asset.rating : (asset.rating?.overall || 0),
        price: asset.price || asset.pricePerDay || asset.pricePerNight || 0,
      }));

      allAssets.push(...standardizedAssets);
    }

    // Limitar resultados totais
    allAssets = allAssets.slice(0, limit);

    // Enriquecer com dados do partner
    const enrichedAssets = await Promise.all(
      allAssets.map(async (asset) => {
        const partner = asset.partnerId ? await ctx.db.get(asset.partnerId) : null;
        
        // Contar bookings (apenas para eventos por enquanto)
        let bookingsCount = 0;
        if (asset.assetType === "events") {
          const bookings = await ctx.db
            .query("eventBookings")
            .filter((q) => q.eq(q.field("eventId"), asset._id))
            .collect();
          bookingsCount = bookings.length;
        }

        return {
          ...asset,
          partnerName: (partner as any)?.name,
          partnerEmail: (partner as any)?.email,
          bookingsCount,
        };
      })
    );

    // Ordenar por data de criação (mais recentes primeiro)
    return enrichedAssets.sort((a, b) => b._creationTime - a._creationTime);
  },
}); 