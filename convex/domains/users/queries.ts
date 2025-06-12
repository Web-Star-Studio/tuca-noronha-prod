import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
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
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    // Métricas agregadas
    organizationsCount: v.number(),
    assetsCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Only master, partner, and employee roles can access this query
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Acesso negado - apenas administradores podem ver usuários");
    }

    const limit = args.limit || 100;
    let users: any[] = [];

    if (currentUserRole === "master") {
      // Masters can see all users
      let query = ctx.db.query("users");

      // Filtro por role
      if (args.role && args.role !== "all") {
        query = query.filter((q) => q.eq(q.field("role"), args.role));
      }

      users = await query
        .order("desc")
        .take(limit);
    } else if (currentUserRole === "partner" || currentUserRole === "employee") {
      // Partners and employees can only see users who have confirmed bookings for their assets
      if (!currentUserId) {
        throw new Error("ID do usuário atual não encontrado");
      }

      // Get partner's assets (for partner role) or their assigned partner's assets (for employee role)
      let partnerId = currentUserId;
      if (currentUserRole === "employee") {
        const currentUser = await ctx.db.get(currentUserId);
        if (!currentUser?.partnerId) {
          throw new Error("Employee deve estar associado a um partner");
        }
        partnerId = currentUser.partnerId;
      }

      // Get all assets belonging to the partner
      const [restaurants, events, activities, vehicles, accommodations] = await Promise.all([
        ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", partnerId)).collect(),
        ctx.db.query("accommodations").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ]);

      // Collect unique user IDs from confirmed bookings for partner's assets
      const userIds = new Set<string>();

      // Check event bookings
      for (const event of events) {
        const bookings = await ctx.db
          .query("eventBookings")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .filter((q) => q.eq(q.field("status"), "confirmed"))
          .collect();
        bookings.forEach(booking => userIds.add(booking.userId.toString()));
      }

      // Check activity bookings
      for (const activity of activities) {
        const bookings = await ctx.db
          .query("activityBookings")
          .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
          .filter((q) => q.eq(q.field("status"), "confirmed"))
          .collect();
        bookings.forEach(booking => userIds.add(booking.userId.toString()));
      }

      // Check restaurant reservations
      for (const restaurant of restaurants) {
        const reservations = await ctx.db
          .query("restaurantReservations")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
          .filter((q) => q.eq(q.field("status"), "confirmed"))
          .collect();
        reservations.forEach(reservation => userIds.add(reservation.userId.toString()));
      }

      // Check vehicle bookings
      for (const vehicle of vehicles) {
        const bookings = await ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id))
          .filter((q) => q.eq(q.field("status"), "confirmed"))
          .collect();
        bookings.forEach(booking => userIds.add(booking.userId.toString()));
      }

      // Get user documents for the collected user IDs
      const userPromises = Array.from(userIds).map(async (userId) => {
        try {
          const user = await ctx.db.get(userId as any);
          return user;
        } catch {
          return null;
        }
      });

      const allUsers = await Promise.all(userPromises);
      users = allUsers.filter(user => user !== null);

      // For partners/employees, filter to show only travelers (customers)
      users = users.filter(user => user.role === "traveler");

      // Apply role filter if specified (but for partners, should only be travelers anyway)
      if (args.role && args.role !== "all" && args.role !== "traveler") {
        users = []; // Partners/employees should only see travelers
      }

      // Apply limit
      users = users.slice(0, limit);
    }

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

    // Sort by creation time for consistent ordering
    enrichedUsers.sort((a, b) => b._creationTime - a._creationTime);

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
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Only master, partner, and employee roles can access this query
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Acesso negado - apenas administradores podem ver estatísticas");
    }

    if (currentUserRole === "master") {
      // Masters can see system-wide statistics
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

      // Calcular estatísticas completas do sistema
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
    } else {
      // Partners and employees see scoped statistics for their assets
      if (!currentUserId) {
        throw new Error("ID do usuário atual não encontrado");
      }

      // Get partner's assets (for partner role) or their assigned partner's assets (for employee role)
      let partnerId = currentUserId;
      if (currentUserRole === "employee") {
        const currentUser = await ctx.db.get(currentUserId);
        if (!currentUser?.partnerId) {
          throw new Error("Employee deve estar associado a um partner");
        }
        partnerId = currentUser.partnerId;
      }

      // Get all assets belonging to the partner
      const [restaurants, events, activities, vehicles, accommodations, organizations] = await Promise.all([
        ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", partnerId)).collect(),
        ctx.db.query("accommodations").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("partnerOrganizations").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ]);

      // Collect unique user IDs from bookings for partner's assets
      const userIds = new Set<string>();
      let allBookings: any[] = [];

      // Collect event bookings and user IDs
      for (const event of events) {
        const bookings = await ctx.db
          .query("eventBookings")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();
        allBookings.push(...bookings);
        bookings.forEach(booking => userIds.add(booking.userId.toString()));
      }

      // Collect activity bookings and user IDs
      for (const activity of activities) {
        const bookings = await ctx.db
          .query("activityBookings")
          .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
          .collect();
        allBookings.push(...bookings);
        bookings.forEach(booking => userIds.add(booking.userId.toString()));
      }

      // Collect restaurant reservations and user IDs
      for (const restaurant of restaurants) {
        const reservations = await ctx.db
          .query("restaurantReservations")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
          .collect();
        allBookings.push(...reservations);
        reservations.forEach(reservation => userIds.add(reservation.userId.toString()));
      }

      // Collect vehicle bookings and user IDs
      for (const vehicle of vehicles) {
        const bookings = await ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id))
          .collect();
        allBookings.push(...bookings);
        bookings.forEach(booking => userIds.add(booking.userId.toString()));
      }

      // Get user documents for statistics
      const userPromises = Array.from(userIds).map(async (userId) => {
        try {
          const user = await ctx.db.get(userId as Id<"users">);
          return user;
        } catch {
          return null;
        }
      });

      const scopedUsers = (await Promise.all(userPromises)).filter((user): user is NonNullable<typeof user> => user !== null);

      // For partners/employees, filter to show only travelers (customers)
      const travelerUsers = scopedUsers.filter(u => u.role === "traveler");

      // Calculate scoped statistics (only travelers for partners/employees)
      const userStats = {
        total: travelerUsers.length,
        travelers: travelerUsers.length,
        partners: 0, // Partners/employees don't see partner stats
        employees: 0, // Partners/employees don't see employee stats  
        masters: 0, // Partners/employees don't see master stats
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
        total: allBookings.length,
        pending: allBookings.filter(b => b.status === "pending").length,
        confirmed: allBookings.filter(b => b.status === "confirmed").length,
        cancelled: allBookings.filter(b => b.status === "cancelled").length,
      };

      // For support messages, we'll show basic stats (partners might not have many support messages)
      const supportStats = {
        total: 0, // Partners/employees don't typically have access to support message counts
        open: 0,
        urgent: 0,
      };

      return {
        users: userStats,
        assets: assetStats,
        organizations: organizationStats,
        bookings: bookingStats,
        support: supportStats,
      };
    }
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
    // Campos adicionais que podem existir nos assets
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    address: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    includes: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.array(v.string())),
    highlights: v.optional(v.array(v.string())),
    isFeatured: v.optional(v.boolean()),
    maxParticipants: v.optional(v.number()),
    hasMultipleTickets: v.optional(v.boolean()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    speaker: v.optional(v.string()),
    speakerBio: v.optional(v.string()),
    whatsappContact: v.optional(v.string()),
    pricePerDay: v.optional(v.number()),
    pricePerNight: v.optional(v.number()),
    status: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
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

      // Padronizar estrutura mantendo todos os campos originais
      const standardizedAssets = assets.map((asset: any) => ({
        ...asset, // Manter todos os campos originais
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

/**
 * Get detailed user information by ID (masters only)
 */
export const getUserDetailsById = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
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
      // Dados enriquecidos
      organizations: v.array(v.object({
        _id: v.id("partnerOrganizations"),
        name: v.string(),
        type: v.string(),
        isActive: v.boolean(),
        _creationTime: v.number(),
      })),
      assets: v.object({
        restaurants: v.number(),
        events: v.number(),
        activities: v.number(),
        vehicles: v.number(),
        accommodations: v.number(),
        total: v.number(),
      }),
      partnerInfo: v.optional(v.object({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
      })),
      employeesCount: v.optional(v.number()),
      lastActivity: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Verificar se o usuário atual é master
    const currentUserRole = await getCurrentUserRole(ctx);
    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver detalhes de usuários");
    }

    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }

    // Buscar organizações (se for partner)
    let organizations: any[] = [];
    if (user.role === "partner") {
      organizations = await ctx.db
        .query("partnerOrganizations")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();
    }

    // Buscar assets do usuário
    let assets = {
      restaurants: 0,
      events: 0,
      activities: 0,
      vehicles: 0,
      accommodations: 0,
      total: 0,
    };

    if (user.role === "partner") {
      const [restaurants, events, activities, vehicles, accommodations] = await Promise.all([
        ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).collect(),
        ctx.db.query("accommodations").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
      ]);

      assets = {
        restaurants: restaurants.length,
        events: events.length,
        activities: activities.length,
        vehicles: vehicles.length,
        accommodations: accommodations.length,
        total: restaurants.length + events.length + activities.length + vehicles.length + accommodations.length,
      };
    }

    // Buscar informações do partner (se for employee)
    let partnerInfo: { name?: string; email?: string } | undefined = undefined;
    if (user.role === "employee" && user.partnerId) {
      const partner = await ctx.db.get(user.partnerId);
      if (partner) {
        partnerInfo = {
          name: partner.name,
          email: partner.email,
        };
      }
    }

    // Contar employees (se for partner)
    let employeesCount: number | undefined = undefined;
    if (user.role === "partner") {
      const employees = await ctx.db
        .query("users")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();
      employeesCount = employees.filter(emp => emp.role === "employee").length;
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
      organizationId: user.organizationId,
      emailVerificationTime: user.emailVerificationTime,
      isAnonymous: user.isAnonymous,
      organizations: organizations.map(org => ({
        _id: org._id,
        name: org.name,
        type: org.type,
        isActive: org.isActive,
        _creationTime: org._creationTime,
      })),
      assets,
      partnerInfo,
      employeesCount,
      lastActivity: user.emailVerificationTime, // Placeholder for last activity
    };
  },
});

/**
 * Listar colaboradores de um partner (apenas para partners)
 */
export const listPartnerEmployees = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Employee-specific info
    organizationName: v.optional(v.string()),
    creationRequestStatus: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Only partners can access this query
    if (currentUserRole !== "partner") {
      throw new Error("Acesso negado - apenas partners podem ver colaboradores");
    }

    if (!currentUserId) {
      throw new Error("ID do usuário atual não encontrado");
    }

    const limit = args.limit || 100;

    // Get employees belonging to this partner
    const employees = await ctx.db
      .query("users")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .filter((q) => q.eq(q.field("role"), "employee"))
      .order("desc")
      .take(limit);

    // Enrich with additional information
    const enrichedEmployees = await Promise.all(
      employees.map(async (employee) => {
        let organizationName: string | undefined = undefined;
        let creationRequestStatus: string | undefined = undefined;

        // Get organization name if assigned
        if (employee.organizationId) {
          const organization = await ctx.db.get(employee.organizationId);
          organizationName = organization?.name;
        }

        // Check creation request status
        const creationRequest = await ctx.db
          .query("employeeCreationRequests")
          .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
          .first();
        
        if (creationRequest) {
          creationRequestStatus = creationRequest.status;
        }

        return {
          ...employee,
          organizationName,
          creationRequestStatus,
        };
      })
    );

    return enrichedEmployees;
  },
});

/**
 * Obter estatísticas de colaboradores para partner
 */
export const getPartnerEmployeeStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    active: v.number(),
    pending: v.number(),
    byOrganization: v.array(v.object({
      organizationId: v.id("partnerOrganizations"),
      organizationName: v.string(),
      employeeCount: v.number(),
    })),
  }),
  handler: async (ctx) => {
    const currentUserRole = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Only partners can access this query
    if (currentUserRole !== "partner") {
      throw new Error("Acesso negado - apenas partners podem ver estatísticas de colaboradores");
    }

    if (!currentUserId) {
      throw new Error("ID do usuário atual não encontrado");
    }

    // Get all employees for this partner
    const employees = await ctx.db
      .query("users")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .filter((q) => q.eq(q.field("role"), "employee"))
      .collect();

    // Get pending creation requests
    const pendingRequests = await ctx.db
      .query("employeeCreationRequests")
      .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Calculate stats by organization
    const organizationMap = new Map<string, { name: string; count: number }>();
    
    for (const employee of employees) {
      if (employee.organizationId) {
        const orgId = employee.organizationId.toString();
        
        if (!organizationMap.has(orgId)) {
          const organization = await ctx.db.get(employee.organizationId);
          organizationMap.set(orgId, {
            name: organization?.name || "Organização desconhecida",
            count: 0
          });
        }
        
        const current = organizationMap.get(orgId)!;
        organizationMap.set(orgId, { ...current, count: current.count + 1 });
      }
    }

    const byOrganization = Array.from(organizationMap.entries()).map(([orgId, data]) => ({
      organizationId: orgId as Id<"partnerOrganizations">,
      organizationName: data.name,
      employeeCount: data.count,
    }));

    return {
      total: employees.length,
      active: employees.filter(emp => emp.emailVerificationTime).length,
      pending: pendingRequests.length,
      byOrganization,
    };
  },
});

/**
 * Get pending employee creation requests (Internal)
 */
export const getPendingEmployeeRequests = internalQuery({
  args: {},
  returns: v.array(v.object({
    _id: v.id("employeeCreationRequests"),
    employeeId: v.id("users"),
    partnerId: v.id("users"),
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")),
    status: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    const pendingRequests = await ctx.db
      .query("employeeCreationRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return pendingRequests.map(request => ({
      _id: request._id,
      employeeId: request.employeeId,
      partnerId: request.partnerId,
      email: request.email,
      password: request.password,
      name: request.name,
      phone: request.phone,
      organizationId: request.organizationId,
      status: request.status,
      createdAt: request.createdAt,
    }));
  },
});

/**
 * Check employee creation status (Partner only)
 */
export const getEmployeeCreationStatus = query({
  args: {
    employeeId: v.id("users"),
  },
  returns: v.object({
    employeeId: v.id("users"),
    status: v.string(),
    clerkId: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    isReady: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Only partners can check their employee creation status
    if (currentUserRole !== "partner") {
      throw new Error("Acesso negado - apenas partners podem verificar status de colaboradores");
    }

    if (!currentUserId) {
      throw new Error("ID do usuário atual não encontrado");
    }

    // Get the employee record
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Colaborador não encontrado");
    }

    // Verify the employee belongs to this partner
    if (employee.partnerId !== currentUserId) {
      throw new Error("Acesso negado - este colaborador não pertence a você");
    }

    // Get the creation request for status
    const request = await ctx.db
      .query("employeeCreationRequests")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .first();

    const status = request?.status || "unknown";
    const isReady = Boolean(employee.clerkId && 
                           !employee.clerkId.startsWith("temp_") && 
                           !employee.clerkId.startsWith("failed_") &&
                           status === "completed");

    return {
      employeeId: employee._id,
      status,
      clerkId: employee.clerkId,
      email: employee.email || "",
      name: employee.name || "",
      isReady,
      error: request?.errorMessage,
      createdAt: request?.createdAt || employee._creationTime,
      processedAt: request?.processedAt,
    };
  },
});

/**
 * Obter status do onboarding do usuário atual
 */
export const getOnboardingStatus = query({
  args: {},
  returns: v.object({
    isCompleted: v.boolean(),
    needsOnboarding: v.boolean(),
    userRole: v.optional(v.string()),
    userData: v.optional(v.object({
      fullName: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      email: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      return {
        isCompleted: false,
        needsOnboarding: false,
        userRole: undefined,
        userData: undefined,
      };
    }

    const user = await ctx.db.get(currentUserId);
    if (!user) {
      return {
        isCompleted: false,
        needsOnboarding: false,
        userRole: undefined,
        userData: undefined,
      };
    }

    // Apenas travelers precisam de onboarding
    const needsOnboarding = user.role === "traveler" && !user.onboardingCompleted;

    return {
      isCompleted: user.onboardingCompleted || false,
      needsOnboarding,
      userRole: user.role,
      userData: {
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        phoneNumber: user.phoneNumber,
        email: user.email,
      },
    };
  },
});

/**
 * Obter dados completos do perfil do usuário
 */
export const getUserProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      fullName: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      role: v.optional(v.string()),
      image: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
      onboardingCompletedAt: v.optional(v.number()),
      _creationTime: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      return null;
    }

    const user = await ctx.db.get(currentUserId);
    if (!user) {
      return null;
    }

    // Return only the fields specified in the validator
    return {
      _id: user._id,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      image: user.image,
      onboardingCompleted: user.onboardingCompleted,
      onboardingCompletedAt: user.onboardingCompletedAt,
      _creationTime: user._creationTime,
    };
  },
});

/**
 * Verificar se usuário precisa de redirecionamento para onboarding
 */
export const shouldRedirectToOnboarding = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      return false;
    }

    const user = await ctx.db.get(currentUserId);
    if (!user) {
      return false;
    }

    // Redirecionar apenas se:
    // 1. É um traveler
    // 2. Não completou o onboarding
    // 3. Tem pelo menos email (foi criado via Clerk)
    return user.role === "traveler" && 
           !user.onboardingCompleted && 
           !!user.email;
  },
}); 