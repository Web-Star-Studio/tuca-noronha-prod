import { query } from "../../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "../../shared/validators";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac/utils";

// Get all vehicles with optional pagination
export const listVehicles = query({
  args: {
    ...paginationOptsValidator,
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.string())
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
    const { search, category, status } = args;
    
    // Get current user role and ID for RBAC
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    // Use a consistent query structure to avoid cursor conflicts
    // Always start with the same base query and apply filters consistently
    let vehiclesQuery = ctx.db.query("vehicles").order("desc");
    
    // Apply RBAC filtering
    if (role === "partner" && currentUserId) {
      // Partners only see their own vehicles
      vehiclesQuery = vehiclesQuery.filter((q) => q.eq(q.field("ownerId"), currentUserId));
    } else if (role === "traveler" || !currentUserId) {
      // Public access - only show available vehicles
      vehiclesQuery = vehiclesQuery.filter((q) => q.eq(q.field("status"), "available"));
    }
    // Admin/master sees all vehicles (no additional filtering)
    
    // Apply status filter if specified (and not already applied above)
    if (status && status !== "all" && !(role === "traveler" || !currentUserId)) {
      vehiclesQuery = vehiclesQuery.filter((q) => q.eq(q.field("status"), status));
    }

    // Apply category filter
    if (category && category !== "all") {
      vehiclesQuery = vehiclesQuery.filter((q) => 
        q.eq("category", category)
      );
    }
    
    // Apply pagination
    const paginationResult = await vehiclesQuery.paginate({
      cursor: args.paginationOpts?.cursor ?? null,
      numItems: args.paginationOpts?.limit ?? 10
    });
    
    // Apply search filter post-query if needed
    let vehicles = paginationResult.page;
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
    
    // Use a consistent query structure to avoid cursor conflicts
    // Always start with the same base query and apply filters consistently
    let bookingsQuery = ctx.db.query("vehicleBookings").order("desc");
    
    // Apply filters based on available parameters
    if (vehicleId) {
      bookingsQuery = bookingsQuery.filter((q) => q.eq(q.field("vehicleId"), vehicleId));
    }
    
    if (userId) {
      bookingsQuery = bookingsQuery.filter((q) => q.eq(q.field("userId"), userId));
    }
    
    if (status) {
      bookingsQuery = bookingsQuery.filter((q) => q.eq(q.field("status"), status));
    }
    
    // Apply pagination
    const paginationResult = await bookingsQuery.paginate({
      cursor: args.paginationOpts?.cursor ?? null,
      numItems: args.paginationOpts?.limit ?? 10
    });
    
    const bookings = paginationResult.page;
    
    // Fetch associated vehicles and users data
    const bookingsWithRelations = await Promise.all(
      bookings.map(async (booking) => {
        const vehicle = await ctx.db.get(booking.vehicleId);
        const user = await ctx.db.get(booking.userId);
        
        return {
          ...booking,
          vehicle,
          user,
        };
      })
    );
    
    return {
      bookings: bookingsWithRelations,
      continueCursor: paginationResult.continueCursor,
    };
  },
}); 