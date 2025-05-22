import { query } from "../../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "../../shared/validators";

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
    
    // Start with a fresh query to avoid chaining issues
    let vehiclesQuery;
    
    // Apply status filter using index if available
    if (status) {
      vehiclesQuery = ctx.db.query("vehicles")
        .withIndex("by_status", (q) => q.eq("status", status));
    } else {
      vehiclesQuery = ctx.db.query("vehicles")
        .order("desc");
    }
    
    // Apply other filters
    if (search) {
      vehiclesQuery = vehiclesQuery.filter((q) => 
        q.or(
          q.text(q.field("name"), search),
          q.text(q.field("brand"), search),
          q.text(q.field("model"), search),
          q.text(q.field("licensePlate"), search)
        )
      );
    }
    
    if (category) {
      vehiclesQuery = vehiclesQuery.filter((q) => 
        q.eq("category", category)
      );
    }
    
    // Apply pagination
    const paginationResult = await vehiclesQuery.paginate({
      cursor: args.paginationOpts?.cursor,
      numItems: args.paginationOpts?.limit ?? 10
    });
    
    return {
      vehicles: paginationResult.page,
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
    
    // Start building the query based on available filters
    let bookingsQuery;
    
    // Apply the most selective index first
    if (vehicleId && status) {
      bookingsQuery = ctx.db.query("vehicleBookings")
        .withIndex("by_vehicleId_status", (q) => 
          q.eq("vehicleId", vehicleId).eq("status", status)
        );
    } else if (vehicleId) {
      bookingsQuery = ctx.db.query("vehicleBookings")
        .withIndex("by_vehicleId", (q) => 
          q.eq("vehicleId", vehicleId)
        );
    } else if (userId) {
      bookingsQuery = ctx.db.query("vehicleBookings")
        .withIndex("by_userId", (q) => 
          q.eq("userId", userId)
        );
    } else if (status) {
      bookingsQuery = ctx.db.query("vehicleBookings")
        .withIndex("by_status", (q) => 
          q.eq("status", status)
        );
    } else {
      bookingsQuery = ctx.db.query("vehicleBookings")
        .order("desc");
    }
    
    // Apply additional filters if needed
    if (vehicleId && status && userId) {
      bookingsQuery = bookingsQuery.filter((q) => q.eq(q.field("userId"), userId));
    } else if (vehicleId && userId && !status) {
      bookingsQuery = bookingsQuery.filter((q) => q.eq(q.field("userId"), userId));
    } else if (status && userId && !vehicleId) {
      bookingsQuery = bookingsQuery.filter((q) => q.eq(q.field("userId"), userId));
    }
    
    // Apply pagination
    const paginationResult = await bookingsQuery.paginate({
      cursor: args.paginationOpts?.cursor,
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