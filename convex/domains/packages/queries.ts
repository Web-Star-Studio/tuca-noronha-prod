import { v } from "convex/values";
import { query } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import type { PackageWithDetails, PackageFilters, PackageBookingWithDetails } from "./types";
import { paginationOptsValidator } from "convex/server";

/**
 * Get packages with filtering (legacy name for backward compatibility)
 */
export const getPackages = query({
  args: {
    filters: v.optional(v.object({
      category: v.optional(v.string()),
      priceMin: v.optional(v.number()),
      priceMax: v.optional(v.number()),
      duration: v.optional(v.number()),
      maxGuests: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
      isFeatured: v.optional(v.boolean()),
      partnerId: v.optional(v.id("users")),
      searchTerm: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(api.domains.packages.queries.list, {
      limit: 50,
      offset: 0,
      filters: args.filters || {}
    });
  },
});

/**
 * List packages with pagination and filtering
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filters: v.optional(v.object({
      category: v.optional(v.string()),
      priceMin: v.optional(v.number()),
      priceMax: v.optional(v.number()),
      duration: v.optional(v.number()),
      maxGuests: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
      isFeatured: v.optional(v.boolean()),
      partnerId: v.optional(v.id("users")),
      searchTerm: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const { limit = 50, offset = 0, filters = {} } = args;
    
    // Apply basic filters using indexes
    let packages;
    if (filters.isActive !== undefined) {
      packages = await ctx.db
        .query("packages")
        .withIndex("active_packages", (q) => q.eq("isActive", filters.isActive!))
        .collect();
    } else if (filters.isFeatured && filters.isActive !== false) {
      packages = await ctx.db
        .query("packages")
        .withIndex("featured_packages", (q) => q.eq("isFeatured", true).eq("isActive", true))
        .collect();
    } else if (filters.partnerId) {
      packages = await ctx.db
        .query("packages")
        .withIndex("by_partner", (q) => q.eq("partnerId", filters.partnerId!))
        .collect();
    } else if (filters.category) {
      packages = await ctx.db
        .query("packages")
        .withIndex("by_category", (q) => q.eq("category", filters.category!))
        .collect();
    } else {
      packages = await ctx.db.query("packages").collect();
    }

    // Apply additional filters
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      packages = packages.filter(pkg => 
        pkg.name.toLowerCase().includes(searchLower) ||
        pkg.description.toLowerCase().includes(searchLower) ||
        pkg.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.priceMin !== undefined) {
      packages = packages.filter(pkg => pkg.basePrice >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
      packages = packages.filter(pkg => pkg.basePrice <= filters.priceMax!);
    }

    if (filters.duration !== undefined) {
      packages = packages.filter(pkg => pkg.duration === filters.duration);
    }

    if (filters.maxGuests !== undefined) {
      packages = packages.filter(pkg => pkg.maxGuests >= filters.maxGuests!);
    }

    if (filters.tags && filters.tags.length > 0) {
      packages = packages.filter(pkg => 
        filters.tags!.some(tag => pkg.tags.includes(tag))
      );
    }

    // Sort by featured status, then by creation time
    packages.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b._creationTime - a._creationTime;
    });

    // Apply pagination
    const paginatedPackages = packages.slice(offset, offset + limit);

    return {
      packages: paginatedPackages,
      total: packages.length,
      hasMore: offset + limit < packages.length,
    };
  },
});

// Get a single package by ID with all details
export const getPackageById = query({
  args: { id: v.id("packages") },
  handler: async (ctx, args): Promise<PackageWithDetails | null> => {
    const packageData = await ctx.db.get(args.id);
    if (!packageData) return null;

    // Get accommodation details (if exists)
    let accommodation: {
      id: string;
      name: string;
      type: string;
      mainImage: string;
      pricePerNight: number;
    } | null = null;
    
    if (packageData.accommodationId) {
      const accommodationData = await ctx.db.get(packageData.accommodationId);
      if (accommodationData) {
        accommodation = {
          id: accommodationData._id,
          name: accommodationData.name,
          type: accommodationData.type,
          mainImage: accommodationData.mainImage,
          pricePerNight: accommodationData.pricePerNight,
        };
      }
    }

    // Get vehicle details (if exists)
    let vehicle: {
      id: string;
      name: string;
      brand: string;
      model: string;
      category: string;
      pricePerDay: number;
      imageUrl?: string;
    } | null = null;
    
    if (packageData.vehicleId) {
      const vehicleData = await ctx.db.get(packageData.vehicleId);
      if (vehicleData) {
        vehicle = {
          id: vehicleData._id,
          name: vehicleData.name,
          brand: vehicleData.brand,
          model: vehicleData.model,
          category: vehicleData.category,
          pricePerDay: vehicleData.pricePerDay,
          imageUrl: vehicleData.imageUrl,
        };
      }
    }

    // Get included activities
    const includedActivities = await Promise.all(
      packageData.includedActivityIds.map(async (id) => {
        const activity = await ctx.db.get(id);
        return activity ? {
          id: activity._id,
          title: activity.title,
          price: activity.price,
          imageUrl: activity.imageUrl,
          category: activity.category,
        } : null;
      })
    );

    // Get included restaurants
    const includedRestaurants = await Promise.all(
      packageData.includedRestaurantIds.map(async (id) => {
        const restaurant = await ctx.db.get(id);
        return restaurant ? {
          id: restaurant._id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          priceRange: restaurant.priceRange,
          mainImage: restaurant.mainImage,
        } : null;
      })
    );

    // Get included events
    const includedEvents = await Promise.all(
      packageData.includedEventIds.map(async (id) => {
        const event = await ctx.db.get(id);
        return event ? {
          id: event._id,
          title: event.title,
          date: event.date,
          price: event.price,
          imageUrl: event.imageUrl,
          category: event.category,
        } : null;
      })
    );

    // Get creator details
    const creator = await ctx.db.get(packageData.partnerId);

    return {
      ...packageData,
      accommodation,
      vehicle,
      includedActivities: includedActivities.filter(Boolean) as any[],
      includedRestaurants: includedRestaurants.filter(Boolean) as any[],
      includedEvents: includedEvents.filter(Boolean) as any[],
      creator: creator ? {
        id: creator._id,
        name: creator.name,
        email: creator.email,
        image: creator.image,
      } : null,
    };
  },
});

// Get package by slug
export const getPackageBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const packageItem = await ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    return packageItem || null;
  },
});

// Get featured packages
export const getFeaturedPackages = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { limit = 6 } = args;
    
    const packages = await ctx.db
      .query("packages")
      .withIndex("featured_packages", (q) => q.eq("isFeatured", true).eq("isActive", true))
      .take(limit);

    return packages;
  },
});

// Get packages by partner
export const getPackagesByPartner = query({
  args: { 
    partnerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { partnerId, limit = 20 } = args;
    
    const packages = await ctx.db
      .query("packages")
      .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
      .take(limit);

    return packages;
  },
});

// Get package bookings with filters
export const getPackageBookings = query({
  args: {
    status: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { status, userId, limit = 20 } = args;
    
    let bookings;
    if (status) {
      bookings = await ctx.db
        .query("packageBookings")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    } else if (userId) {
      bookings = await ctx.db
        .query("packageBookings")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    } else {
      bookings = await ctx.db
        .query("packageBookings")
        .order("desc")
        .take(limit);
    }

    // Get package details for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const packageData = await ctx.db.get(booking.packageId);
        const user = await ctx.db.get(booking.userId);
        
        return {
          ...booking,
          package: packageData && 'name' in packageData && 'mainImage' in packageData && 'category' in packageData ? {
            id: packageData._id,
            name: packageData.name,
            mainImage: packageData.mainImage,
            category: packageData.category,
          } : null,
          user: user && 'name' in user && 'email' in user && 'image' in user ? {
            id: user._id,
            name: user.name || undefined,
            email: user.email || undefined,
            image: user.image || undefined,
          } : null,
        };
      })
    );

    return bookingsWithDetails;
  },
});

// Get package availability
export const getPackageAvailability = query({
  args: {
    packageId: v.id("packages"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { packageId, startDate, endDate } = args;
    
    const packageData = await ctx.db.get(packageId);
    if (!packageData) {
      throw new Error("Pacote não encontrado");
    }

    // Check if package is available in the date range
    const availableFrom = new Date(packageData.availableFromDate);
    const availableTo = new Date(packageData.availableToDate);
    const checkStart = new Date(startDate);
    const checkEnd = new Date(endDate);

    if (checkStart < availableFrom || checkEnd > availableTo) {
      return { available: false, reason: "Pacote não disponível neste período" };
    }

    // Check blackout dates
    const blackoutDates = packageData.blackoutDates.map(date => new Date(date));
    const requestedDates: Date[] = [];
    for (let d = new Date(checkStart); d <= checkEnd; d.setDate(d.getDate() + 1)) {
      requestedDates.push(new Date(d));
    }

    const hasBlackoutConflict = requestedDates.some(date =>
      blackoutDates.some(blackout =>
        date.toDateString() === blackout.toDateString()
      )
    );

    if (hasBlackoutConflict) {
      return { available: false, reason: "Datas não disponíveis (blackout)" };
    }

    // Check accommodation availability (if exists)
    if (packageData.accommodationId) {
      const accommodationBookings = await ctx.db
        .query("accommodationBookings")
        .withIndex("by_accommodation_dates", (q) =>
          q.eq("accommodationId", packageData.accommodationId!)
           .gte("checkInDate", startDate)
           .lte("checkInDate", endDate)
        )
        .collect();

      const hasAccommodationConflict = accommodationBookings.some(booking =>
        booking.status === "confirmed" || booking.status === "pending"
      );

      if (hasAccommodationConflict) {
        return { available: false, reason: "Hospedagem não disponível" };
      }
    }

    return { available: true };
  },
});

// Get partner packages with status
export const getPartnerPackages = query({
  args: { partnerId: v.id("users") },
  handler: async (ctx, args) => {
    const packages = await ctx.db
      .query("packages")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();

    return packages;
  },
});

// Get package categories
export const getPackageCategories = query({
  args: {},
  handler: async (ctx) => {
    const packages = await ctx.db
      .query("packages")
      .withIndex("active_packages", (q) => q.eq("isActive", true))
      .collect();

    const categories = [...new Set(packages.map(pkg => pkg.category))];
    
    return categories.map(category => ({
      name: category,
      count: packages.filter(pkg => pkg.category === category).length,
    }));
  },
});

// Get package booking by ID
export const getPackageBookingById = query({
  args: { id: v.id("packageBookings") },
  handler: async (ctx, args): Promise<PackageBookingWithDetails | null> => {
    const booking = await ctx.db.get(args.id);
    if (!booking) return null;

    const packageData = await ctx.db.get(booking.packageId);
    const user = await ctx.db.get(booking.userId);

    return {
      ...booking,
      package: packageData && 'name' in packageData && 'mainImage' in packageData && 'category' in packageData ? {
        id: packageData._id,
        name: packageData.name,
        mainImage: packageData.mainImage,
        category: packageData.category,
      } : null,
      user: user && 'name' in user && 'email' in user && 'image' in user ? {
        id: user._id,
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.image || undefined,
      } : null,
    };
  },
});

// Get package booking by confirmation code
export const getPackageBookingByConfirmationCode = query({
  args: { confirmationCode: v.string() },
  handler: async (ctx, args): Promise<PackageBookingWithDetails | null> => {
    const booking = await ctx.db
      .query("packageBookings")
      .withIndex("by_confirmation_code", (q) => q.eq("confirmationCode", args.confirmationCode))
      .first();

    if (!booking) return null;

    const packageData = await ctx.db.get(booking.packageId);
    const user = await ctx.db.get(booking.userId);

    return {
      ...booking,
      package: packageData && 'name' in packageData && 'mainImage' in packageData && 'category' in packageData ? {
        id: packageData._id,
        name: packageData.name,
        mainImage: packageData.mainImage,
        category: packageData.category,
      } : null,
      user: user && 'name' in user && 'email' in user && 'image' in user ? {
        id: user._id,
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.image || undefined,
      } : null,
    };
  },
});

// Get package statistics for dashboard
export const getPackageStats = query({
  args: { partnerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const { partnerId } = args;
    
    if (partnerId) {
      // For partner-specific stats
      const partnerPackages = await ctx.db
        .query("packages")
        .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
        .collect();
      const partnerPackageIds = new Set(partnerPackages.map(pkg => pkg._id));
      
      const allBookings = await ctx.db.query("packageBookings").collect();
      const partnerBookings = allBookings.filter(booking => partnerPackageIds.has(booking.packageId));
      
      const activePackages = partnerPackages.filter(pkg => pkg.isActive).length;
      const featuredPackages = partnerPackages.filter(pkg => pkg.isFeatured && pkg.isActive).length;
      const totalBookings = partnerBookings.length;
      const confirmedBookings = partnerBookings.filter(booking => booking.status === "confirmed").length;
      const pendingBookings = partnerBookings.filter(booking => booking.status === "pending").length;
      const totalRevenue = partnerBookings
        .filter(booking => booking.status === "confirmed")
        .reduce((sum, booking) => sum + booking.totalPrice, 0);

      return {
        totalPackages: partnerPackages.length,
        activePackages,
        featuredPackages,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalRevenue,
      };
    }

    // Global stats
    const allPackages = await ctx.db.query("packages").collect();
    const allBookings = await ctx.db.query("packageBookings").collect();
    
    return {
      totalPackages: allPackages.length,
      activePackages: allPackages.filter(pkg => pkg.isActive).length,
      featuredPackages: allPackages.filter(pkg => pkg.isFeatured && pkg.isActive).length,
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter(booking => booking.status === "confirmed").length,
      pendingBookings: allBookings.filter(booking => booking.status === "pending").length,
      totalRevenue: allBookings
        .filter(booking => booking.status === "confirmed")
        .reduce((sum, booking) => sum + booking.totalPrice, 0),
    };
  },
});

/**
 * Get package request statistics
 */
export const getPackageRequestStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    pending: v.number(),
    inReview: v.number(),
    proposalSent: v.number(),
    confirmed: v.number(),
    cancelled: v.number(),
  }),
  handler: async (ctx) => {
    const requests = await ctx.db.query("packageRequests").collect();
    
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === "pending").length,
      inReview: requests.filter(r => r.status === "in_review").length,
      proposalSent: requests.filter(r => r.status === "proposal_sent").length,
      confirmed: requests.filter(r => r.status === "confirmed").length,
      cancelled: requests.filter(r => r.status === "cancelled").length,
    };
    
    return stats;
  },
});

/**
 * List package requests with pagination and optional status filter
 */
export const listPackageRequests = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status && args.status.trim() !== "") {
      return await ctx.db
        .query("packageRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .paginate(args.paginationOpts);
    } else {
      return await ctx.db
        .query("packageRequests")
        .paginate(args.paginationOpts);
    }
  },
});

/**
 * Get package request details by ID
 */
export const getPackageRequestDetails = query({
  args: { requestId: v.id("packageRequests") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

/**
 * Get package request by request number
 */
export const getPackageRequestByNumber = query({
  args: { requestNumber: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("packageRequests")
      .withIndex("by_request_number", (q) => q.eq("requestNumber", args.requestNumber))
      .first();
    
    return request || null;
  },
});

/**
 * Get package requests by customer email
 */
export const getPackageRequestsByEmail = query({
  args: { email: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const requests = await ctx.db.query("packageRequests").collect();
    return requests.filter(request => request.customerInfo.email === args.email);
  },
});

/**
 * Get assigned package requests for a specific user
 */
export const getAssignedPackageRequests = query({
  args: { 
    assignedTo: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("packageRequests")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo))
      .paginate(args.paginationOpts);
  },
});

/**
 * Get all packages for dropdown/selection
 */
export const getAllPackages = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("packages")
      .withIndex("active_packages", (q) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * Get recent package requests (last 10)
 */
export const getRecentPackageRequests = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("packageRequests")
      .order("desc")
      .take(10);
  },
});

/**
 * Get package requests for current authenticated user
 */
export const getMyPackageRequests = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userEmail = identity.email;
    if (!userEmail) {
      throw new Error("User email not found");
    }

    const requests = await ctx.db.query("packageRequests").collect();
    return requests
      .filter(request => request.customerInfo.email === userEmail)
      .sort((a, b) => b._creationTime - a._creationTime); // Most recent first
  },
}); 