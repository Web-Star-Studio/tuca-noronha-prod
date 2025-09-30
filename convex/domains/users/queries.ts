import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { User, UserWithRole } from "./types";
import { queryWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";
import { UserRole } from "../rbac/types";

/**
 * Utility function for dynamic validation based on asset type
 */
export const validateAssetByType = (asset: any, expectedType: string): boolean => {
  if (asset.assetType !== expectedType) {
    return false;
  }

  // Dynamic validation based on asset type
  switch (expectedType) {
    case "restaurants":
      return (
        typeof asset.slug === "string" &&
        typeof asset.phone === "string" &&
        Array.isArray(asset.cuisine) &&
        typeof asset.acceptsReservations === "boolean"
      );
    case "events":
      return (
        typeof asset.title === "string" ||
        typeof asset.name === "string"
      );
    case "activities":
      return true; // Add specific validation logic as needed
    case "vehicles":
      return (
        typeof asset.ownerId === "string" &&
        (asset.status === "available" || asset.status === "maintenance" || asset.status === "rented")
      );
    default:
      return false;
  }
};

/**
 * Standardized asset transformation utility
 */
export const standardizeAsset = (asset: any, assetType: string) => {
  const baseFields = {
    _id: asset._id.toString(),
    _creationTime: asset._creationTime,
    name: asset.name || asset.title,
    assetType,
    isActive: assetType === "vehicles" ? asset.status === "available" : asset.isActive,
    partnerId: assetType === "vehicles" ? asset.ownerId : asset.partnerId,
  };

  // Return type-specific standardized object
  switch (assetType) {
    case "restaurants":
      return {
        ...baseFields,
        ...asset,
        assetType: "restaurants" as const,
      };
    case "events":
      return {
        ...baseFields,
        ...asset,
        name: asset.title || asset.name,
        assetType: "events" as const,
      };
    case "activities":
      return {
        ...baseFields,
        ...asset,
        assetType: "activities" as const,
      };
    case "vehicles":
      return {
        ...baseFields,
        ...asset,
        partnerId: asset.ownerId, // Map ownerId to partnerId for consistency
        isActive: asset.status === "available",
        assetType: "vehicles" as const,
      };
    default:
      return {
        ...baseFields,
        ...asset,
      };
  }
};

/**
 * Helper function to verify if a traveler has confirmed bookings with a partner's assets
 */
async function verifyTravelerBookingAccess(ctx: any, partnerId: Id<"users">, travelerId: Id<"users">): Promise<boolean> {
  // Get all assets belonging to the partner
      const [restaurants, events, activities, vehicles] = await Promise.all([
      ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", partnerId)).collect(),
    ]);

  // Check for confirmed bookings with any of the partner's assets
  
  // Check event bookings
  for (const event of events) {
    const booking = await ctx.db
      .query("eventBookings")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .filter((q) => q.and(
        q.eq(q.field("userId"), travelerId),
        q.eq(q.field("status"), "confirmed")
      ))
      .first();
    if (booking) return true;
  }

  // Check activity bookings
  for (const activity of activities) {
    const booking = await ctx.db
      .query("activityBookings")
      .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
      .filter((q) => q.and(
        q.eq(q.field("userId"), travelerId),
        q.eq(q.field("status"), "confirmed")
      ))
      .first();
    if (booking) return true;
  }

  // Check restaurant reservations
  for (const restaurant of restaurants) {
    const reservation = await ctx.db
      .query("restaurantReservations")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
      .filter((q) => q.and(
        q.eq(q.field("userId"), travelerId),
        q.eq(q.field("status"), "confirmed")
      ))
      .first();
    if (reservation) return true;
  }

  // Check vehicle bookings
  for (const vehicle of vehicles) {
    const booking = await ctx.db
      .query("vehicleBookings")
      .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id))
      .filter((q) => q.and(
        q.eq(q.field("userId"), travelerId),
        q.eq(q.field("status"), "confirmed")
      ))
      .first();
    if (booking) return true;
  }

  return false;
}

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
      
      // Try to find user by email if available in identity
      if (identity.email) {
        const usersByEmail = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email))
          .collect();
        
        if (usersByEmail.length > 0) {
          const user = usersByEmail[0];
          
          // If user has failed clerk_id or no clerk_id, return with corrected data
          if (!user.clerkId || user.clerkId.startsWith("failed_") || user.clerkId.startsWith("temp_")) {
            console.log(`Found user ${user._id} with failed/temp clerk_id: ${user.clerkId}`);
            
            // Return user data with the corrected clerkId
            // The UI will show the corrected data and can trigger a repair action
            return {
              _id: user._id,
              id: user._id,
              clerkId: identity.subject,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role || "traveler",
            };
          }
        }
      }
      
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
      phone: user.phoneNumber,
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
    fullName: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    dateOfBirth: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
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
        phone: user.phoneNumber,
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
    fullName: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    dateOfBirth: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
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
        phone: user.phoneNumber,
        role: user.role,
        partnerId: user.partnerId,
        emailVerificationTime: user.emailVerificationTime,
        isAnonymous: user.isAnonymous,
      }));
  },
});

/**
 * List travelers with search and pagination
 */
export const listTravelers = query({
  args: {
    search: v.optional(v.string()),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.union(v.string(), v.null()),
      })
    ),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("users"),
        clerkId: v.optional(v.string()),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        image: v.optional(v.string()),
        onboardingCompleted: v.optional(v.boolean()),
        joinedAt: v.string(),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.optional(v.string()),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || !["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Unauthorized");
    }

    let usersQuery;
    if (args.search) {
      usersQuery = ctx.db
        .query("users")
        .withSearchIndex("by_name_email", q => q.search("name", args.search!))
        .filter(q => q.eq(q.field("role"), "traveler"));
    } else {
      usersQuery = ctx.db
        .query("users")
        .filter(q => q.eq(q.field("role"), "traveler"))
        .order("desc");
    }

    const travelers = await usersQuery
      .paginate({
        numItems: args.paginationOpts?.numItems ?? 10,
        cursor: args.paginationOpts?.cursor ?? null,
      });
    const total = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "traveler")).collect();

    return {
      page: travelers.page.map(user => ({
        _id: user._id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        onboardingCompleted: user.onboardingCompleted,
        joinedAt: new Date(user._creationTime).toLocaleDateString(),
      })),
      isDone: travelers.isDone,
      continueCursor: travelers.continueCursor,
      total: total.length,
    };
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
    fullName: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    dateOfBirth: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
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
        phone: user.phoneNumber,
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
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    dateOfBirth: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
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
          const [restaurants, events, activities, vehicles] = await Promise.all([
      ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
      ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", partnerId)).collect(),
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
          const [restaurants, events, activities, vehicles] = await Promise.all([
            ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
            ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
            ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
            ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).collect(),
      
          ]);

          assetsCount = restaurants.length + events.length + activities.length + vehicles.length;
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
  
        organizations,
        eventBookings,
        supportMessages,
      ] = await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("restaurants").collect(),
        ctx.db.query("events").collect(),
        ctx.db.query("activities").collect(),
        ctx.db.query("vehicles").collect(),
  
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

      const totalAssets = restaurants.length + events.length + activities.length + vehicles.length;
      const activeAssets = [
        ...restaurants.filter(r => r.isActive),
        ...events.filter(e => e.isActive),
        ...activities.filter(a => a.isActive),
        ...vehicles.filter(v => v.status === "available"),

      ].length;

      const assetStats = {
        total: totalAssets,
        restaurants: restaurants.length,
        events: events.length,
        activities: activities.length,
        vehicles: vehicles.length,
        
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
      const [restaurants, events, activities, vehicles, organizations] = await Promise.all([
        ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", partnerId)).collect(),
        ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", partnerId)).collect(),
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

      const totalAssets = restaurants.length + events.length + activities.length + vehicles.length;
      const activeAssets = [
        ...restaurants.filter(r => r.isActive),
        ...events.filter(e => e.isActive),
        ...activities.filter(a => a.isActive),
        ...vehicles.filter(v => v.status === "available"),

      ].length;

      const assetStats = {
        total: totalAssets,
        restaurants: restaurants.length,
        events: events.length,
        activities: activities.length,
        vehicles: vehicles.length,
        
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
// Common asset base fields
const baseAssetFields = {
  _id: v.string(),
  _creationTime: v.number(),
  name: v.string(),
  assetType: v.string(),
  isActive: v.boolean(),
  partnerId: v.id("users"),
  partnerName: v.optional(v.string()),
  partnerEmail: v.optional(v.string()),
  bookingsCount: v.optional(v.number()),
  rating: v.optional(v.number()),
  price: v.optional(v.number()),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  mainImage: v.optional(v.string()),
  galleryImages: v.optional(v.array(v.string())),
  isFeatured: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
};

// Address object validator
const addressValidator = v.object({
  street: v.string(),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  neighborhood: v.string(),
  coordinates: v.object({
    latitude: v.number(),
    longitude: v.number(),
  }),
});

// Asset-specific validators using discriminated union
const restaurantAssetValidator = v.object({
  ...baseAssetFields,
  assetType: v.literal("restaurants"),
  slug: v.string(),
  address: addressValidator,
  phone: v.string(),
  website: v.optional(v.string()),
  cuisine: v.array(v.string()),
  priceRange: v.string(),
  diningStyle: v.string(),
  restaurantType: v.optional(v.union(v.literal("internal"), v.literal("external"))),
  operatingDays: v.optional(v.object({
    Monday: v.boolean(),
    Tuesday: v.boolean(),
    Wednesday: v.boolean(),
    Thursday: v.boolean(),
    Friday: v.boolean(),
    Saturday: v.boolean(),
    Sunday: v.boolean(),
  })),
  openingTime: v.optional(v.string()),
  closingTime: v.optional(v.string()),
  features: v.array(v.string()),
  dressCode: v.optional(v.string()),
  paymentOptions: v.optional(v.array(v.string())),
  parkingDetails: v.optional(v.string()),
  mainImage: v.optional(v.string()),
  menuImages: v.optional(v.array(v.string())),
  rating: v.union(
    v.number(),
    v.object({
      overall: v.number(),
      food: v.number(),
      service: v.number(),
      ambience: v.number(),
      value: v.number(),
      noiseLevel: v.string(),
      totalReviews: v.number(),
    })
  ),
  acceptsReservations: v.boolean(),
  executiveChef: v.optional(v.string()),
  privatePartyInfo: v.optional(v.string()),
  additionalInfo: v.optional(v.array(v.string())),
  highlights: v.optional(v.array(v.string())),
  // Stripe payment fields
  acceptsOnlinePayment: v.optional(v.boolean()),
  requiresUpfrontPayment: v.optional(v.boolean()),
  stripeMetadata: v.optional(v.object({
    createdAt: v.number(),
    partnerId: v.string(),
    productType: v.string(),
    updatedAt: v.number(),
  })),
  stripePaymentLinkId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()),
  stripeProductId: v.optional(v.string()),
});

const eventAssetValidator = v.object({
  ...baseAssetFields,
  assetType: v.literal("events"),
  title: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  date: v.string(),
  time: v.string(),
  location: v.string(),
  address: v.string(),
  maxParticipants: v.optional(v.number()),
  speaker: v.optional(v.string()),
  speakerBio: v.optional(v.string()),
  includes: v.optional(v.array(v.string())),
  additionalInfo: v.optional(v.array(v.string())),
  highlights: v.optional(v.array(v.string())),
  hasMultipleTickets: v.optional(v.boolean()),
  symplaUrl: v.optional(v.string()),
  whatsappContact: v.optional(v.string()),
  symplaId: v.optional(v.string()),
  symplaHost: v.optional(v.object({
    name: v.string(),
    description: v.string(),
  })),
  sympla_private_event: v.optional(v.boolean()),
  sympla_published: v.optional(v.boolean()),
  sympla_cancelled: v.optional(v.boolean()),
  external_id: v.optional(v.string()),
  sympla_categories: v.optional(v.object({
    primary: v.optional(v.string()),
    secondary: v.optional(v.string()),
  })),
  // Stripe payment fields
  acceptsOnlinePayment: v.optional(v.boolean()),
  requiresUpfrontPayment: v.optional(v.boolean()),
  stripeMetadata: v.optional(v.object({
    createdAt: v.number(),
    partnerId: v.string(),
    productType: v.string(),
    updatedAt: v.number(),
  })),
  stripePaymentLinkId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()),
  stripeProductId: v.optional(v.string()),
  // Adicionando o campo category para evitar erro de validação
  category: v.optional(v.string()),
});

const activityAssetValidator = v.object({
  ...baseAssetFields,
  assetType: v.literal("activities"),
  title: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  description_long: v.optional(v.string()),
  category: v.optional(v.string()),
  location: v.optional(v.string()),
  address: v.optional(v.union(v.string(), addressValidator)),
  duration: v.optional(v.string()),
  difficulty: v.optional(v.string()),
  minAge: v.optional(v.number()),
  maxParticipants: v.optional(v.number()),
  minParticipants: v.optional(v.number()),
  includes: v.optional(v.array(v.string())),
  excludes: v.optional(v.array(v.string())),
  itineraries: v.optional(v.array(v.string())),
  additionalInfo: v.optional(v.array(v.string())),
  highlights: v.optional(v.array(v.string())),
  cancelationPolicy: v.optional(v.array(v.string())),
  requiresBooking: v.optional(v.boolean()),
  hasMultipleTickets: v.optional(v.boolean()),
  // Stripe payment fields
  acceptsOnlinePayment: v.optional(v.boolean()),
  requiresUpfrontPayment: v.optional(v.boolean()),
  stripeMetadata: v.optional(v.object({
    createdAt: v.number(),
    partnerId: v.string(),
    productType: v.string(),
    updatedAt: v.number(),
  })),
  stripePaymentLinkId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()),
  stripeProductId: v.optional(v.string()),
});

const vehicleAssetValidator = v.object({
  ...baseAssetFields,
  assetType: v.literal("vehicles"),
  ownerId: v.id("users"),
  make: v.optional(v.string()),
  model: v.optional(v.string()),
  brand: v.optional(v.string()),
  year: v.optional(v.number()),
  licensePlate: v.optional(v.string()),
  capacity: v.optional(v.number()),
  seats: v.optional(v.number()),
  transmission: v.optional(v.string()),
  fuelType: v.optional(v.string()),
  pricePerDay: v.optional(v.number()),
  status: v.optional(v.string()),
  color: v.optional(v.string()),
  category: v.optional(v.string()),
  features: v.optional(v.array(v.string())),
  organizationId: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  // Override base field to make partnerId optional since vehicles use ownerId
  partnerId: v.optional(v.id("users")),
  // Stripe payment fields
  acceptsOnlinePayment: v.optional(v.boolean()),
  requiresUpfrontPayment: v.optional(v.boolean()),
  stripeMetadata: v.optional(v.object({
    createdAt: v.number(),
    partnerId: v.string(),
    productType: v.string(),
    updatedAt: v.number(),
  })),
  stripePaymentLinkId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()),
  stripeProductId: v.optional(v.string()),
});

export const listAllAssets = query({
  args: {
    assetType: v.optional(v.union(
      v.literal("restaurants"),
      v.literal("events"),
      v.literal("activities"),
      v.literal("vehicles"),
      
      v.literal("all")
    )),
    isActive: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.union(
    restaurantAssetValidator,
    eventAssetValidator,
    activityAssetValidator,
    vehicleAssetValidator,

  )),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver todos os assets");
    }

    const limit = args.limit || 100;
    let allAssets: any[] = [];

    // Coletar assets de acordo com o filtro
    const assetTypes = args.assetType === "all" || !args.assetType 
      ? ["restaurants", "events", "activities", "vehicles"]
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
 * Listar apenas restaurantes (para melhor performance e type safety)
 */
export const listAllRestaurants = query({
  args: {
    isActive: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(restaurantAssetValidator),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver todos os assets");
    }

    const limit = args.limit || 100;
    let query = ctx.db.query("restaurants");

    if (args.partnerId) {
      query = query.withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId!)) as any;
    }

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    const restaurants = await query.take(limit);

    const enrichedRestaurants = await Promise.all(
      restaurants.map(async (restaurant) => {
        const partner = restaurant.partnerId ? await ctx.db.get(restaurant.partnerId) : null;
        
        // Transform complex rating object to match validator
        let transformedRating: any = restaurant.rating;
        if (restaurant.rating && typeof restaurant.rating === 'object' && 'totalReviews' in restaurant.rating) {
          transformedRating = {
            ...restaurant.rating,
            totalReviews: Number(restaurant.rating.totalReviews), // Convert bigint to number
          };
        }

        return {
          ...restaurant,
          _id: restaurant._id.toString(),
          assetType: "restaurants" as const,
          partnerName: partner?.name,
          partnerEmail: partner?.email,
          bookingsCount: 0, // TODO: Implement booking counting
          rating: transformedRating,
          // maximumPartySize field removed from restaurant model
        };
      })
    );

    return enrichedRestaurants.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Listar apenas eventos (para melhor performance e type safety)
 */
export const listAllEvents = query({
  args: {
    isActive: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(eventAssetValidator),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver todos os assets");
    }

    const limit = args.limit || 100;
    let query = ctx.db.query("events");

    if (args.partnerId) {
      query = query.withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId!)) as any;
    }

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    const events = await query.take(limit);

    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const partner = event.partnerId ? await ctx.db.get(event.partnerId) : null;
        
        const bookings = await ctx.db
          .query("eventBookings")
          .filter((q) => q.eq(q.field("eventId"), event._id))
          .collect();

        return {
          ...event,
          _id: event._id.toString(),
          name: event.title || "Evento sem título",
          assetType: "events" as const,
          partnerName: partner?.name,
          partnerEmail: partner?.email,
          bookingsCount: bookings.length,
          maxParticipants: event.maxParticipants ? Number(event.maxParticipants) : undefined,
        };
      })
    );

    return enrichedEvents.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Listar apenas atividades (para melhor performance e type safety)
 */
export const listAllActivities = query({
  args: {
    isActive: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityAssetValidator),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver todos os assets");
    }

    const limit = args.limit || 100;
    let query = ctx.db.query("activities");

    if (args.partnerId) {
      query = query.withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId!)) as any;
    }

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    const activities = await query.take(limit);

    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const partner = activity.partnerId ? await ctx.db.get(activity.partnerId) : null;
        
        return {
          ...activity,
          _id: activity._id.toString(),
          name: activity.title || "Atividade sem título",
          assetType: "activities" as const,
          partnerName: partner?.name,
          partnerEmail: partner?.email,
          bookingsCount: 0, // TODO: Implement booking counting for activities
          maxParticipants: activity.maxParticipants ? Number(activity.maxParticipants) : undefined,
          minParticipants: activity.minParticipants ? Number(activity.minParticipants) : undefined,
        };
      })
    );

    return enrichedActivities.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Listar apenas veículos (para melhor performance e type safety)
 */
export const listAllVehicles = query({
  args: {
    isActive: v.optional(v.boolean()),
    ownerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(vehicleAssetValidator),
  handler: async (ctx, args) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver todos os assets");
    }

    const limit = args.limit || 100;
    let query = ctx.db.query("vehicles");

    if (args.ownerId) {
      query = query.withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId!)) as any;
    }

    if (args.isActive !== undefined) {
      const status = args.isActive ? "available" : "maintenance";
      query = query.filter((q) => q.eq(q.field("status"), status));
    }

    const vehicles = await query.take(limit);

    const enrichedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Only fetch owner if ownerId exists
        const owner = vehicle.ownerId ? await ctx.db.get(vehicle.ownerId) : null;
        
        return {
          ...vehicle,
          _id: vehicle._id.toString(),
          assetType: "vehicles" as const,
          partnerId: vehicle.ownerId, // Keep as Id<"users"> type
          ownerId: vehicle.ownerId!, // Ensure it's not undefined for validator
          isActive: vehicle.status === "available",
          partnerName: owner?.name,
          partnerEmail: owner?.email,
          bookingsCount: 0, // TODO: Implement booking counting for vehicles
        };
      })
    );

    return enrichedVehicles.sort((a, b) => b._creationTime - a._creationTime);
  },
});



/**
 * Get basic admin info for proposal viewing (public access)
 */
export const getAdminBasicInfo = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }

    // Only return basic info for admins (master, partner, employee)
    if (!["master", "partner", "employee"].includes(user.role || "")) {
      return null;
    }

    return {
      name: user.name,
      email: user.email,
    };
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
      fullName: v.optional(v.string()),
      image: v.optional(v.string()),
      phone: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      role: v.optional(v.string()),
      partnerId: v.optional(v.id("users")),
      organizationId: v.optional(v.id("partnerOrganizations")),
      emailVerificationTime: v.optional(v.number()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      dateOfBirth: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
      onboardingCompletedAt: v.optional(v.number()),
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
    // Verificar permissões baseadas no role
    const currentUserRole = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }

    // Masters podem ver qualquer usuário
    if (currentUserRole === "master") {
      // Continue with existing logic
    }
    // Partners podem ver apenas travelers que fizeram reservas confirmadas com seus assets
    else if (currentUserRole === "partner") {
      // Partners só podem ver detalhes de travelers
      if (user.role !== "traveler") {
        throw new Error("Partners só podem ver detalhes de clientes (travelers)");
      }
      
      // Verificar se o traveler tem reservas confirmadas com assets do partner
      const hasConfirmedBookings = await verifyTravelerBookingAccess(ctx, currentUserId, user._id);
      if (!hasConfirmedBookings) {
        throw new Error("Você só pode ver detalhes de clientes que fizeram reservas confirmadas");
      }
    }
    // Employees podem ver apenas travelers que fizeram reservas com assets do seu partner
    else if (currentUserRole === "employee") {
      const currentUser = await ctx.db.get(currentUserId);
      if (!currentUser?.partnerId) {
        throw new Error("Employee deve estar associado a um partner");
      }
      
      // Employees só podem ver detalhes de travelers
      if (user.role !== "traveler") {
        throw new Error("Employees só podem ver detalhes de clientes (travelers)");
      }
      
      // Verificar se o traveler tem reservas confirmadas com assets do partner do employee
      const hasConfirmedBookings = await verifyTravelerBookingAccess(ctx, currentUser.partnerId, user._id);
      if (!hasConfirmedBookings) {
        throw new Error("Você só pode ver detalhes de clientes que fizeram reservas confirmadas");
      }
    }
    else {
      throw new Error("Acesso negado - role não autorizado");
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
      total: 0,
    };

    if (user.role === "partner") {
      const [restaurants, events, activities, vehicles] = await Promise.all([
        ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).collect(),
  
      ]);

      assets = {
        restaurants: restaurants.length,
        events: events.length,
        activities: activities.length,
        vehicles: vehicles.length,
        
        total: restaurants.length + events.length + activities.length + vehicles.length,
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

    // For partners and employees viewing traveler details, return simplified information
    if ((currentUserRole === "partner" || currentUserRole === "employee") && user.role === "traveler") {
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
        organizations: [], // Travelers don't have organizations
        assets: {
          restaurants: 0,
          events: 0,
          activities: 0,
          vehicles: 0,

          total: 0,
        }, // Travelers don't have assets
        partnerInfo: undefined,
        employeesCount: undefined,
        lastActivity: user.emailVerificationTime,
      };
    }

    // For masters viewing any user, return full information
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
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    dateOfBirth: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
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



/**
 * Get employees with failed or temporary clerk IDs (internal query for auto-fix)
 */
export const getFailedEmployees = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      clerkId: v.optional(v.string()),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      role: v.optional(v.string()),
      partnerId: v.optional(v.id("users")),
    })
  ),
  handler: async (ctx) => {
    // Get all employees
    const allUsers = await ctx.db.query("users").collect();
    
    // Filter for employees with failed or temp clerk IDs
    const failedEmployees = allUsers.filter(user => 
      user.role === "employee" && 
      user.clerkId && 
      (user.clerkId.startsWith("failed_") || user.clerkId.startsWith("temp_"))
    );

    return failedEmployees.map(user => ({
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
      partnerId: user.partnerId,
    }));
  },
}); 

/**
 * Get user by ID (internal use only)
 */
export const getUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
      phoneNumber: user.phoneNumber,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      partnerId: user.partnerId,
      organizationId: user.organizationId,
      isActive: user.isActive !== false,
      onboardingCompleted: user.onboardingCompleted,
    };
  },
});

/**
 * Get a list of users by their role.
 * This is an internal query for system use.
 */
export const listByRole = internalQuery({
  args: { role: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
    return users;
  },
});

/**
 * Get a single user by ID.
 * This can be called by any authenticated user.
 */
export const getUserByIdPublic = query({
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
      fullName: v.optional(v.string()),
      image: v.optional(v.string()),
      phone: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      role: v.optional(v.string()),
      partnerId: v.optional(v.id("users")),
      organizationId: v.optional(v.id("partnerOrganizations")),
      emailVerificationTime: v.optional(v.number()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      dateOfBirth: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
      onboardingCompletedAt: v.optional(v.number()),
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
    // Verificar permissões baseadas no role
    const currentUserRole = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }

    // Masters podem ver qualquer usuário
    if (currentUserRole === "master") {
      // Continue with existing logic
    }
    // Partners podem ver apenas travelers que fizeram reservas confirmadas com seus assets
    else if (currentUserRole === "partner") {
      // Partners só podem ver detalhes de travelers
      if (user.role !== "traveler") {
        throw new Error("Partners só podem ver detalhes de clientes (travelers)");
      }
      
      // Verificar se o traveler tem reservas confirmadas com assets do partner
      const hasConfirmedBookings = await verifyTravelerBookingAccess(ctx, currentUserId, user._id);
      if (!hasConfirmedBookings) {
        throw new Error("Você só pode ver detalhes de clientes que fizeram reservas confirmadas");
      }
    }
    // Employees podem ver apenas travelers que fizeram reservas com assets do seu partner
    else if (currentUserRole === "employee") {
      const currentUser = await ctx.db.get(currentUserId);
      if (!currentUser?.partnerId) {
        throw new Error("Employee deve estar associado a um partner");
      }
      
      // Employees só podem ver detalhes de travelers
      if (user.role !== "traveler") {
        throw new Error("Employees só podem ver detalhes de clientes (travelers)");
      }
      
      // Verificar se o traveler tem reservas confirmadas com assets do partner do employee
      const hasConfirmedBookings = await verifyTravelerBookingAccess(ctx, currentUser.partnerId, user._id);
      if (!hasConfirmedBookings) {
        throw new Error("Você só pode ver detalhes de clientes que fizeram reservas confirmadas");
      }
    }
    else {
      throw new Error("Acesso negado - role não autorizado");
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
      total: 0,
    };

    if (user.role === "partner") {
      const [restaurants, events, activities, vehicles] = await Promise.all([
        ctx.db.query("restaurants").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("events").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("activities").withIndex("by_partner", (q) => q.eq("partnerId", user._id)).collect(),
        ctx.db.query("vehicles").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).collect(),
  
      ]);

      assets = {
        restaurants: restaurants.length,
        events: events.length,
        activities: activities.length,
        vehicles: vehicles.length,
        
        total: restaurants.length + events.length + activities.length + vehicles.length,
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

    // For partners and employees viewing traveler details, return simplified information
    if ((currentUserRole === "partner" || currentUserRole === "employee") && user.role === "traveler") {
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
        organizations: [], // Travelers don't have organizations
        assets: {
          restaurants: 0,
          events: 0,
          activities: 0,
          vehicles: 0,

          total: 0,
        }, // Travelers don't have assets
        partnerInfo: undefined,
        employeesCount: undefined,
        lastActivity: user.emailVerificationTime,
      };
    }

    // For masters viewing any user, return full information
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