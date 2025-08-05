import { v } from "convex/values";
import { query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireRole } from "../rbac/utils";
import { 
  ListAdminReservationsArgs, 
  AdminReservationAssetType,
  AdminReservationStatus,
  AdminReservationPaymentStatus,
  AdminReservationCreationMethod 
} from "./types";
import { Id } from "../../_generated/dataModel";

// List admin reservations with filtering and RBAC
export const listAdminReservations = query({
  args: ListAdminReservationsArgs as any,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check permissions - only admin roles can view admin reservations
    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions");
    }

    let reservations;

    // Apply role-based filtering using the most specific index
    if (user.role === "partner") {
      reservations = await ctx.db
        .query("adminReservations")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (user.role === "employee") {
      // Employee can only see reservations for their organization
      if (user.organizationId) {
        reservations = await ctx.db
          .query("adminReservations")
          .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();
      } else {
        return []; // No organization = no access
      }
    } else {
      // Master can see all reservations
      reservations = await ctx.db
        .query("adminReservations")
        .withIndex("by_is_active", (q) => q.eq("isActive", true))
        .collect();
    }

    // Apply additional filters
    if (args.travelerId) {
      reservations = reservations.filter(r => r.travelerId === args.travelerId);
    }
    if (args.adminId) {
      reservations = reservations.filter(r => r.adminId === args.adminId);
    }
    if (args.partnerId && user.role === "master") {
      reservations = reservations.filter(r => r.partnerId === args.partnerId);
    }
    if (args.organizationId && user.role === "master") {
      reservations = reservations.filter(r => r.organizationId === args.organizationId);
    }
    if (args.status) {
      reservations = reservations.filter(r => r.status === args.status);
    }
    if (args.paymentStatus) {
      reservations = reservations.filter(r => r.paymentStatus === args.paymentStatus);
    }
    if (args.createdMethod) {
      reservations = reservations.filter(r => r.createdMethod === args.createdMethod);
    }
    if (args.assetType) {
      reservations = reservations.filter(r => r.assetType === args.assetType);
    }
    if (args.startDate) {
      reservations = reservations.filter(r => 
        r.reservationData.startDate && r.reservationData.startDate >= args.startDate!
      );
    }
    if (args.endDate) {
      reservations = reservations.filter(r => 
        r.reservationData.endDate && r.reservationData.endDate <= args.endDate!
      );
    }

    // Sort by creation date (newest first)
    reservations.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedReservations = reservations.slice(offset, offset + limit);

    // Enrich with user data
    const enrichedReservations = await Promise.all(
      paginatedReservations.map(async (reservation) => {
        const [traveler, admin, partner] = await Promise.all([
          ctx.db.get(reservation.travelerId),
          ctx.db.get(reservation.adminId),
          reservation.partnerId ? ctx.db.get(reservation.partnerId) : null,
        ]);

        return {
          ...reservation,
          traveler: traveler ? {
            _id: traveler._id,
            name: (traveler as any).name,
            email: (traveler as any).email,
            phone: (traveler as any).phone,
          } : null,
          admin: admin ? {
            _id: admin._id,
            name: (admin as any).name,
            email: (admin as any).email,
            role: (admin as any).role,
          } : null,
          partner: partner ? {
            _id: partner._id,
            name: (partner as any).name,
            email: (partner as any).email,
            role: (partner as any).role,
          } : null,
        };
      })
    );

    return {
      reservations: enrichedReservations,
      total: reservations.length,
      hasMore: offset + limit < reservations.length,
    };
  },
});

// Get single admin reservation by ID
export const getAdminReservation = query({
  args: { id: v.id("adminReservations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const reservation = await ctx.db.get(args.id);
    if (!reservation || !reservation.isActive) {
      throw new Error("Reservation not found");
    }

    // Check permissions
    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions");
    }

    // Role-based access control
    if (user.role === "partner" && reservation.partnerId !== user._id) {
      throw new Error("Access denied");
    }
    if (user.role === "employee") {
      if (!user.organizationId || reservation.organizationId !== user.organizationId) {
        throw new Error("Access denied");
      }
    }

    // Enrich with related data
    const [traveler, admin, partner, organization] = await Promise.all([
      ctx.db.get(reservation.travelerId),
      ctx.db.get(reservation.adminId),
      reservation.partnerId ? ctx.db.get(reservation.partnerId) : null,
      reservation.organizationId ? ctx.db.get(reservation.organizationId) : null,
    ]);

    // Get change history
    const changeHistory = await ctx.db
      .query("reservationChangeHistory")
      .withIndex("by_reservation_timestamp", (q) => 
        q.eq("reservationId", reservation._id)
      )
      .filter((q) => q.eq(q.field("reservationType"), "admin_reservation"))
      .collect();

    return {
      ...reservation,
      traveler: traveler ? {
        _id: traveler._id,
        name: traveler.name,
        email: traveler.email,
        phone: traveler.phone,
        fullName: traveler.fullName,
      } : null,
      admin: admin ? {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      } : null,
      partner: partner ? {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        role: partner.role,
      } : null,
      organization: organization ? {
        _id: organization._id,
        name: organization.name,
        type: organization.type,
      } : null,
      changeHistory: changeHistory.map(change => ({
        ...change,
        timestamp: change.timestamp,
        changeDescription: change.changeDescription,
        changedBy: change.changedBy,
        changedByRole: change.changedByRole,
      })),
    };
  },
});

/**
 * Get a specific admin reservation by ID
 * Returns full reservation details including asset information
 */
export const getAdminReservationById = query({
  args: {
    id: v.id("adminReservations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const reservation = await ctx.db.get(args.id);
    if (!reservation || !reservation.isActive) {
      return null;
    }

    // Get asset details based on type
    let assetName: string = reservation.assetType;
    let assetData: any = null;
    
    switch (reservation.assetType) {
      case "activities":
        const activity = await ctx.db.get(reservation.assetId as Id<"activities">);
        if (activity) {
          assetName = activity.title;
          assetData = activity;
        }
        break;
      case "events":
        const event = await ctx.db.get(reservation.assetId as Id<"events">);
        if (event) {
          assetName = event.title;
          assetData = event;
        }
        break;
      case "restaurants":
        const restaurant = await ctx.db.get(reservation.assetId as Id<"restaurants">);
        if (restaurant) {
          assetName = restaurant.name;
          assetData = restaurant;
        }
        break;
      case "vehicles":
        const vehicle = await ctx.db.get(reservation.assetId as Id<"vehicles">);
        if (vehicle) {
          assetName = vehicle.name;
          assetData = vehicle;
        }
        break;

    }

    // Get traveler information
    const traveler = await ctx.db.get(reservation.travelerId);
    if (!traveler) {
      return null;
    }

    // Format dates from reservationData
    const startDate = reservation.reservationData.startDate;
    const endDate = reservation.reservationData.endDate;
    
    return {
      ...reservation,
      bookingId: reservation._id,
      assetName,
      assetData,
      customerInfo: {
        name: traveler.name || "",
        email: traveler.email || "",
        phone: traveler.phone || "",
      },
      totalAmount: reservation.totalAmount,
      // Common date fields for the success page
      date: startDate ? new Date(startDate).toISOString() : undefined,
      checkIn: undefined,
      checkOut: undefined,
      participants: reservation.reservationData.assetSpecific?.participants,
      guests: reservation.reservationData.guests,
      partySize: reservation.reservationData.assetSpecific?.guests,
    };
  },
});

// Get admin reservation statistics
export const getAdminReservationStats = query({
  args: {
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    dateRange: v.optional(v.object({
      startDate: v.number(),
      endDate: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions");
    }

    let reservations;

    // Apply role-based filtering using the most specific index
    if (user.role === "partner") {
      reservations = await ctx.db
        .query("adminReservations")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (user.role === "employee") {
      if (user.organizationId) {
        reservations = await ctx.db
          .query("adminReservations")
          .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();
      } else {
        return {
          totalReservations: 0,
          byStatus: {},
          byPaymentStatus: {},
          byCreationMethod: {},
          byAssetType: {},
          totalRevenue: 0,
          averageReservationValue: 0,
        };
      }
    } else {
      // Master can see all reservations
      reservations = await ctx.db
        .query("adminReservations")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Apply additional filters for master role
    if (args.partnerId && user.role === "master") {
      reservations = reservations.filter(r => r.partnerId === args.partnerId);
    }
    if (args.organizationId && user.role === "master") {
      reservations = reservations.filter(r => r.organizationId === args.organizationId);
    }

    // Apply date range filter
    if (args.dateRange) {
      reservations = reservations.filter(r => 
        r.createdAt >= args.dateRange!.startDate && 
        r.createdAt <= args.dateRange!.endDate
      );
    }

    // Calculate statistics
    const stats = {
      totalReservations: reservations.length,
      byStatus: {} as Record<string, number>,
      byPaymentStatus: {} as Record<string, number>,
      byCreationMethod: {} as Record<string, number>,
      byAssetType: {} as Record<string, number>,
      totalRevenue: 0,
      averageReservationValue: 0,
    };

    reservations.forEach(reservation => {
      // Status breakdown
      stats.byStatus[reservation.status] = (stats.byStatus[reservation.status] || 0) + 1;
      
      // Payment status breakdown
      stats.byPaymentStatus[reservation.paymentStatus] = (stats.byPaymentStatus[reservation.paymentStatus] || 0) + 1;
      
      // Creation method breakdown
      stats.byCreationMethod[reservation.createdMethod] = (stats.byCreationMethod[reservation.createdMethod] || 0) + 1;
      
      // Asset type breakdown
      stats.byAssetType[reservation.assetType] = (stats.byAssetType[reservation.assetType] || 0) + 1;
      
      // Revenue calculation
      if (reservation.paymentStatus === "completed" || reservation.paymentStatus === "cash") {
        stats.totalRevenue += reservation.totalAmount;
      }
    });

    stats.averageReservationValue = stats.totalReservations > 0 ? 
      stats.totalRevenue / stats.totalReservations : 0;

    return stats;
  },
});

// Check availability for creating admin reservation
export const checkAdminReservationAvailability = query({
  args: {
    assetId: v.string(),
    assetType: AdminReservationAssetType,
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    guests: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions");
    }

    // Basic availability check - can be enhanced with specific asset logic
    const existingReservations = await ctx.db
      .query("adminReservations")
      .withIndex("by_asset", (q) => q.eq("assetType", args.assetType).eq("assetId", args.assetId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Check for date conflicts if dates are provided
    let hasConflict = false;
    if (args.startDate && args.endDate) {
      hasConflict = existingReservations.some(reservation => {
        const resStart = reservation.reservationData.startDate;
        const resEnd = reservation.reservationData.endDate;
        
        if (!resStart || !resEnd) return false;
        
        // Check for date overlap
        return (args.startDate! < resEnd && args.endDate! > resStart);
      });
    }

    return {
      available: !hasConflict,
      conflictingReservations: hasConflict ? existingReservations.length : 0,
      message: hasConflict ? 
        "Há conflitos com reservas existentes neste período" : 
        "Disponível para reserva",
    };
  },
});

// List auto-confirmation settings
export const listAutoConfirmationSettings = query({
  args: {
    assetType: v.optional(AdminReservationAssetType),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions");
    }

    let settings;

    // Apply role-based filtering using the most specific index
    if (user.role === "partner") {
      settings = await ctx.db
        .query("autoConfirmationSettings")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (user.role === "employee") {
      if (user.organizationId) {
        settings = await ctx.db
          .query("autoConfirmationSettings")
          .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();
      } else {
        return [];
      }
    } else {
      // Master can see all settings
      settings = await ctx.db
        .query("autoConfirmationSettings")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Apply additional filters
    if (args.partnerId && user.role === "master") {
      settings = settings.filter(s => s.partnerId === args.partnerId);
    }
    if (args.organizationId && user.role === "master") {
      settings = settings.filter(s => s.organizationId === args.organizationId);
    }
    if (args.enabled !== undefined) {
      settings = settings.filter(s => s.enabled === args.enabled);
    }

    // Apply additional filters
    if (args.assetType) {
      settings = settings.filter(s => s.assetType === args.assetType);
    }

    // Sort by priority
    settings.sort((a, b) => a.priority - b.priority);

    return settings;
  },
});

// Get auto-confirmation settings for specific asset
export const getAutoConfirmationSettings = query({
  args: {
    assetId: v.string(),
    assetType: AdminReservationAssetType,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions");
    }

    // Packages don't have auto-confirmation settings
    if (args.assetType === "packages") {
      return null;
    }

    const settings = await ctx.db
      .query("autoConfirmationSettings")
      .withIndex("by_asset_enabled", (q) => 
        q.eq("assetType", args.assetType as any).eq("assetId", args.assetId).eq("enabled", true)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return settings;
  },
});


// List assets for admin reservation creation
export const listAssetsForAdminReservation = query({
  args: {
    assetType: v.union(
      v.literal("activities"),
      v.literal("events"),
      v.literal("restaurants"),
      v.literal("vehicles")
    ),
    searchTerm: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // RBAC - ensure user is an admin
    await requireRole(ctx, ["master", "partner", "employee"]);

    const { assetType, searchTerm, paginationOpts } = args;

    switch (assetType) {
      case "activities": {
        let query = ctx.db.query("activities").withIndex("active_activities", (q) => q.eq("isActive", true));
        if (searchTerm) {
          // Filter by search term after querying
          query = query.filter((q) => 
            q.or(
              q.eq(q.field("title"), searchTerm),
              q.eq(q.field("description"), searchTerm),
              q.eq(q.field("category"), searchTerm)
            )
          );
        }
        return await query.order("desc").paginate(paginationOpts);
      }
      case "events": {
        let query = ctx.db.query("events").withIndex("active_events", (q) => q.eq("isActive", true));
        if (searchTerm) {
          query = query.filter((q) => 
            q.or(
              q.eq(q.field("title"), searchTerm),
              q.eq(q.field("description"), searchTerm),
              q.eq(q.field("category"), searchTerm)
            )
          );
        }
        return await query.order("desc").paginate(paginationOpts);
      }
      case "restaurants": {
        let query = ctx.db.query("restaurants").withIndex("active_restaurants", (q) => q.eq("isActive", true));
        if (searchTerm) {
          query = query.filter((q) => 
            q.or(
              q.eq(q.field("name"), searchTerm),
              q.eq(q.field("description"), searchTerm),
              q.eq(q.field("priceRange"), searchTerm),
              q.eq(q.field("diningStyle"), searchTerm)
            )
          );
        }
        return await query.order("desc").paginate(paginationOpts);
      }
      case "vehicles": {
        // Vehicles don't have isActive field, use status instead
        let query = ctx.db.query("vehicles").withIndex("by_status", (q) => q.eq("status", "available"));
        if (searchTerm) {
          query = query.filter((q) => 
            q.or(
              q.eq(q.field("name"), searchTerm),
              q.eq(q.field("brand"), searchTerm),
              q.eq(q.field("model"), searchTerm),
              q.eq(q.field("category"), searchTerm)
            )
          );
        }
        return await query.order("desc").paginate(paginationOpts);
      }

      default:
        // Should be unreachable due to validator
        return { page: [], isDone: true, continueCursor: null };
    }
  },
});

/**
 * Get admin reservations for the current traveler
 * Returns reservations that were created by admins and assigned to this user
 */
export const getUserAdminReservations = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    // Query admin reservations for this traveler
    let query = ctx.db
      .query("adminReservations")
      .withIndex("by_traveler", (q) => q.eq("travelerId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const result = await query.paginate(args.paginationOpts);

    // Enrich reservations with asset details
    const reservationsWithDetails = await Promise.all(
      result.page.map(async (reservation) => {
        // Get asset details
        let assetName: string = reservation.assetType;
        let assetImageUrl: string = "";
        let assetLocation: string = "";
        
        switch (reservation.assetType) {
          case "activities":
            const activity = await ctx.db.get(reservation.assetId as Id<"activities">);
            if (activity) {
              assetName = activity.title;
              assetImageUrl = activity.imageUrl || "";
              assetLocation = "Local a ser definido"; // Activities don't have location field
            }
            break;
          case "events":
            const event = await ctx.db.get(reservation.assetId as Id<"events">);
            if (event) {
              assetName = event.title;
              assetImageUrl = event.imageUrl || "";
              assetLocation = event.location || "";
            }
            break;
          case "restaurants":
            const restaurant = await ctx.db.get(reservation.assetId as Id<"restaurants">);
            if (restaurant) {
              assetName = restaurant.name;
              assetImageUrl = restaurant.mainImage || "";
              assetLocation = restaurant.address ? 
                `${restaurant.address.street}, ${restaurant.address.neighborhood}` : "";
            }
            break;

          case "vehicles":
            const vehicle = await ctx.db.get(reservation.assetId as Id<"vehicles">);
            if (vehicle) {
              assetName = `${vehicle.brand} ${vehicle.model}`;
              assetImageUrl = vehicle.imageUrl || "";
              assetLocation = reservation.assetSpecific?.pickupLocation || "Local a ser definido";
            }
            break;
        }

        return {
          _id: reservation._id,
          _creationTime: reservation._creationTime,
          assetType: reservation.assetType,
          assetName,
          assetImageUrl,
          assetLocation,
          date: reservation.reservationDate,
          guests: reservation.assetSpecific?.participants || 
                  reservation.assetSpecific?.guestCount || 
                  reservation.assetSpecific?.partySize || 
                  reservation.assetSpecific?.quantity || 1,
          totalPrice: reservation.totalAmount,
          status: reservation.status,
          paymentStatus: reservation.paymentStatus,
          confirmationCode: reservation.confirmationCode || "",
          customerInfo: {
            name: reservation.customerName,
            email: reservation.customerEmail,
            phone: reservation.customerPhone,
          },
          specialRequests: reservation.assetSpecific?.specialRequests,
          stripePaymentIntentId: reservation.stripePaymentIntentId,
          stripePaymentLinkUrl: reservation.stripePaymentLinkUrl,
          paymentDueDate: reservation.paymentDueDate,
          createdAt: reservation.createdAt,
          updatedAt: reservation.updatedAt,
          adminCreatedBy: reservation.createdBy,
        };
      })
    );

    return {
      page: reservationsWithDetails,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});