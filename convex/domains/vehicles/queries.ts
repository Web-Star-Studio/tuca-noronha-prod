import { query } from "../../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "../../shared/validators";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac/utils";

// Get all vehicles with optional pagination - STABLE VERSION
export const listVehicles = query({
  args: {
    ...paginationOptsValidator,
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    organizationId: v.optional(v.string())
  },
  returns: v.object({
    vehicles: v.array(v.object({
      _id: v.id("vehicles"),
      _creationTime: v.number(),
      name: v.string(),
      brand: v.string(),
      model: v.string(),
      category: v.string(),
      year: v.number(),
      licensePlate: v.string(),
      color: v.string(),
      seats: v.number(),
      fuelType: v.string(),
      transmission: v.string(),
      pricePerDay: v.number(),
      netRate: v.optional(v.number()),
      description: v.optional(v.string()),
      features: v.array(v.string()),
      imageUrl: v.optional(v.string()),
      status: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      ownerId: v.optional(v.id("users")),
      organizationId: v.optional(v.string()),
    })),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const { search, category, status, organizationId } = args;
    
    // Get current user role and ID for RBAC
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    const limit = args.paginationOpts?.limit ?? 20;
    let cursor = args.paginationOpts?.cursor ?? null;
    
    // Create a query signature to identify if this is the same query structure
    const querySignature = JSON.stringify({
      search: search || null,
      category: category || null,
      status: status || null,
      organizationId: organizationId || null,
      role,
      userId: currentUserId?.toString() || null
    });
    
    // If cursor exists, validate it by attempting a small query first
    if (cursor) {
      try {
        // Try to use the cursor with a minimal query to validate it
        await ctx.db
          .query("vehicles")
          .order("desc")
          .paginate({
            cursor,
            numItems: 1
          });
      } catch (error) {
        // If cursor validation fails, reset to start from beginning
        console.warn("Invalid cursor detected, resetting pagination:", error);
        cursor = null;
      }
    }
    
    let paginationResult;
    
    try {
      // Use a stable base query structure - no conditional filtering at DB level
      paginationResult = await ctx.db
        .query("vehicles")
        .order("desc")
        .paginate({
          cursor,
          numItems: limit
        });
    } catch (error) {
      // If pagination fails, start fresh without cursor
      console.warn("Pagination failed, starting fresh:", error);
      paginationResult = await ctx.db
        .query("vehicles")
        .order("desc")
        .paginate({
          cursor: null,
          numItems: limit
        });
    }
    
    // Apply all filtering post-pagination to maintain cursor stability
    let vehicles = paginationResult.page;
    
    // Apply RBAC filtering
    if (role === "partner" && currentUserId) {
      // Partners only see their own vehicles
      vehicles = vehicles.filter(vehicle => 
        vehicle.ownerId?.toString() === currentUserId.toString()
      );
    } else if (role === "traveler" || !currentUserId) {
      // Public access - only show available vehicles
      vehicles = vehicles.filter(vehicle => vehicle.status === "available");
    }
    // Admin/master sees all vehicles (no filtering by owner)
    
    // Apply organization filter for non-partner roles, but not for masters
    if (organizationId && role !== "partner" && role !== "master") {
      vehicles = vehicles.filter(vehicle => vehicle.organizationId === organizationId);
    }
    
    // Apply status filter (if not already applied by RBAC)
    if (status && status !== "all" && !(role === "traveler" || !currentUserId)) {
      vehicles = vehicles.filter(vehicle => vehicle.status === status);
    }
    
    // Apply category filter
    if (category && category !== "all") {
      vehicles = vehicles.filter(vehicle => vehicle.category === category);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      vehicles = vehicles.filter(vehicle => 
        vehicle.name.toLowerCase().includes(searchLower) ||
        vehicle.brand.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.licensePlate.toLowerCase().includes(searchLower)
      );
    }
    
    return {
      vehicles,
      continueCursor: paginationResult.continueCursor,
    };
  },
});

// Simple list without pagination for dropdowns/selects
export const listVehiclesSimple = query({
  args: {
    organizationId: v.optional(v.string()),
    status: v.optional(v.string())
  },
  returns: v.array(v.object({
    _id: v.id("vehicles"),
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(),
    year: v.number(),
    color: v.string(),
    seats: v.number(),
    fuelType: v.string(),
    transmission: v.string(),
    pricePerDay: v.number(),
    netRate: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    status: v.string(),
    licensePlate: v.string(),
  })),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    let vehicles = await ctx.db.query("vehicles").order("desc").collect();
    
    // Apply RBAC filtering
    if (role === "partner" && currentUserId) {
      vehicles = vehicles.filter(v => v.ownerId?.toString() === currentUserId.toString());
    } else if (role === "traveler" || !currentUserId) {
      vehicles = vehicles.filter(v => v.status === "available");
    }
    
    // Apply filters
    if (args.organizationId) {
      vehicles = vehicles.filter(v => v.organizationId === args.organizationId);
    }
    
    if (args.status) {
      vehicles = vehicles.filter(v => v.status === args.status);
    }
    
    return vehicles.map(v => ({
      _id: v._id,
      name: v.name,
      brand: v.brand,
      model: v.model,
      category: v.category,
      year: v.year,
      color: v.color,
      seats: v.seats,
      fuelType: v.fuelType,
      transmission: v.transmission,
      pricePerDay: v.pricePerDay,
      netRate: v.netRate,
      imageUrl: v.imageUrl,
      status: v.status,
      licensePlate: v.licensePlate,
    }));
  },
});

// Get a specific vehicle by ID
export const getVehicle = query({
  args: { id: v.id("vehicles") },
  returns: v.union(
    v.object({
      _id: v.id("vehicles"),
      _creationTime: v.number(),
      name: v.string(),
      brand: v.string(),
      model: v.string(),
      category: v.string(),
      year: v.number(),
      licensePlate: v.string(),
      color: v.string(),
      seats: v.number(),
      fuelType: v.string(),
      transmission: v.string(),
      pricePerDay: v.number(),
      netRate: v.optional(v.number()),
      description: v.optional(v.string()),
      features: v.array(v.string()),
      imageUrl: v.optional(v.string()),
      status: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      ownerId: v.optional(v.id("users")),
      organizationId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get statistics about vehicles
export const getVehicleStats = query({
  args: {},
  returns: v.object({
    totalVehicles: v.number(),
    availableVehicles: v.number(),
    rentedVehicles: v.number(),
    maintenanceVehicles: v.number(),
    totalRevenue: v.number(),
    bookingsCompleted: v.number(),
  }),
  handler: async (ctx) => {
    // Count vehicles by status using index
    const availableCount = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();
    
    const rentedCount = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "rented"))
      .collect();
    
    const maintenanceCount = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "maintenance"))
      .collect();
    
    // Get revenue from completed bookings
    const bookings = await ctx.db
      .query("vehicleBookings")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
    
    return {
      totalVehicles: availableCount.length + rentedCount.length + maintenanceCount.length,
      availableVehicles: availableCount.length,
      rentedVehicles: rentedCount.length,
      maintenanceVehicles: maintenanceCount.length,
      totalRevenue,
      bookingsCompleted: bookings.length,
    };
  },
});

// List vehicle bookings
export const listVehicleBookings = query({
  args: {
    ...paginationOptsValidator,
    vehicleId: v.optional(v.id("vehicles")),
    userId: v.optional(v.id("users")),
    status: v.optional(v.string())
  },
  returns: v.object({
    bookings: v.array(v.object({
      _id: v.id("vehicleBookings"),
      _creationTime: v.number(),
      vehicleId: v.id("vehicles"),
      userId: v.id("users"),
      startDate: v.number(),
      endDate: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentMethod: v.optional(v.string()),
      paymentStatus: v.optional(v.string()),
      pickupLocation: v.optional(v.string()),
      returnLocation: v.optional(v.string()),
      additionalDrivers: v.optional(v.number()),
      additionalOptions: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      vehicle: v.union(
        v.object({
          _id: v.id("vehicles"),
          _creationTime: v.number(),
          name: v.string(),
          brand: v.string(),
          model: v.string(),
          category: v.string(),
          year: v.number(),
          status: v.string(),
          imageUrl: v.optional(v.string()),
        }),
        v.null()
      ),
      user: v.union(
        v.object({
          _id: v.id("users"),
          _creationTime: v.number(),
          name: v.optional(v.string()),
          email: v.optional(v.string()),
        }),
        v.null()
      ),
    })),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const { vehicleId, userId, status } = args;
    
    // Use stable pagination structure
    let paginationResult;
    const limit = args.paginationOpts?.limit ?? 20;
    
    try {
      paginationResult = await ctx.db
        .query("vehicleBookings")
        .order("desc")
        .paginate({
          cursor: args.paginationOpts?.cursor ?? null,
          numItems: limit
        });
    } catch (error) {
      console.warn("Pagination error in listVehicleBookings, starting fresh:", error);
      paginationResult = await ctx.db
        .query("vehicleBookings")
        .order("desc")
        .paginate({
          cursor: null,
          numItems: limit
        });
    }
    
    // Apply filters post-pagination for stability
    let bookings = paginationResult.page;
    
    // Apply filters
    if (vehicleId) {
      bookings = bookings.filter(booking => booking.vehicleId.toString() === vehicleId.toString());
    }
    
    if (userId) {
      bookings = bookings.filter(booking => booking.userId.toString() === userId.toString());
    }
    
    if (status) {
      bookings = bookings.filter(booking => booking.status === status);
    }
    
    // Enrich with vehicle and user data
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const vehicle = await ctx.db.get(booking.vehicleId);
        const user = await ctx.db.get(booking.userId);
        
        return {
          ...booking,
          vehicle: vehicle ? {
            _id: vehicle._id,
            _creationTime: vehicle._creationTime,
            name: (vehicle as any).name,
            brand: (vehicle as any).brand,
            model: (vehicle as any).model,
            category: (vehicle as any).category,
            year: (vehicle as any).year,
            status: (vehicle as any).status,
            imageUrl: (vehicle as any).imageUrl,
          } : null,
          user: user ? {
            _id: user._id,
            _creationTime: user._creationTime,
            name: (user as any).name,
            email: (user as any).email,
          } : null,
        };
      })
    );
    
    return {
      bookings: enrichedBookings,
      continueCursor: paginationResult.continueCursor,
    };
  },
});

/**
 * Get all vehicles with RBAC
 */
export const getAll = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);

    // Travelers (public) or unauthenticated users get all available vehicles
    if (!currentUserId || role === "traveler") {
      return await ctx.db
        .query("vehicles")
        .filter((q) => q.eq(q.field("status"), "available"))
        .collect();
    }

    // Master sees everything
    if (role === "master") {
      return await ctx.db.query("vehicles").collect();
    }

    // Partner sees only own vehicles
    if (role === "partner") {
      return await ctx.db
        .query("vehicles")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", currentUserId))
        .collect();
    }

    // Employee sees vehicles they have explicit permission to view
    if (role === "employee") {
      const permissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) =>
          q.eq("employeeId", currentUserId).eq("assetType", "vehicles"),
        )
        .collect();

      if (permissions.length === 0) return [];

      const allowedIds = new Set(permissions.map((p) => p.assetId));
      const allVehicles = await ctx.db.query("vehicles").collect();
      return allVehicles.filter((v) => allowedIds.has(v._id.toString()));
    }

    return [];
  },
}); 
