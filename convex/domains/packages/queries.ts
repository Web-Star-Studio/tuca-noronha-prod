import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
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
          pricePerDay: vehicleData.estimatedPricePerDay,
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
    requiresRevision: v.number(),
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
      requiresRevision: requests.filter(r => r.status === "requires_revision").length,
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
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_review"),
      v.literal("proposal_sent"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("requires_revision"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("packageRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
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
 * Get package requests by matching Clerk user data
 */
export const getMyPackageRequestsByUserMatch = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    console.log("🔍 getMyPackageRequestsByUserMatch: Iniciando busca alternativa");
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      console.log("❌ getMyPackageRequestsByUserMatch: Usuário não encontrado no banco");
      return [];
    }

    console.log("👤 getMyPackageRequestsByUserMatch: Dados do usuário:", {
      name: user.name,
      email: user.email,
      clerkId: user.clerkId
    });

    const requests = await ctx.db.query("packageRequests").collect();
    
    // Try to match by name similarity or email
    const nameFromIdentity = identity.name?.toLowerCase() || '';
    const nameFromUser = user.name?.toLowerCase() || '';
    
    const matchedRequests = requests.filter(request => {
      const requestName = request.customerInfo.name.toLowerCase();
      const requestEmail = request.customerInfo.email.toLowerCase();
      
      // Match by exact email
      if (requestEmail === identity.email?.toLowerCase() || requestEmail === user.email?.toLowerCase()) {
        return true;
      }
      
      // Match by name similarity (same first and last name)
      const nameParts = requestName.split(' ');
      const identityParts = nameFromIdentity.split(' ');
      const userParts = nameFromUser.split(' ');
      
      if (nameParts.length >= 2 && identityParts.length >= 2) {
        const firstNameMatch = nameParts[0] === identityParts[0];
        const lastNameMatch = nameParts[nameParts.length - 1] === identityParts[identityParts.length - 1];
        if (firstNameMatch && lastNameMatch) return true;
      }
      
      if (nameParts.length >= 2 && userParts.length >= 2) {
        const firstNameMatch = nameParts[0] === userParts[0];
        const lastNameMatch = nameParts[nameParts.length - 1] === userParts[userParts.length - 1];
        if (firstNameMatch && lastNameMatch) return true;
      }
      
      return false;
    });
    
    console.log("🎯 getMyPackageRequestsByUserMatch: Requests encontradas por correspondência:", matchedRequests.length);
    
    return matchedRequests.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Get all package requests (for debugging)
 */
export const getAllPackageRequests = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    console.log("🔍 getAllPackageRequests: Buscando todas as requests");
    const requests = await ctx.db.query("packageRequests").collect();
    console.log("📊 getAllPackageRequests: Total encontrado:", requests.length);
    return requests;
  },
});

/**
 * Get package requests for current authenticated user
 */
export const getMyPackageRequests = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("packageRequests"),
    _creationTime: v.number(),
    requestNumber: v.string(),
    userId: v.optional(v.id("users")),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      age: v.optional(v.number()),
      occupation: v.optional(v.string()),
    }),
    tripDetails: v.object({
      destination: v.string(),
      originCity: v.optional(v.string()),
      // For specific dates
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      // For flexible dates
      startMonth: v.optional(v.string()),
      endMonth: v.optional(v.string()),
      flexibleDates: v.optional(v.boolean()),
      duration: v.number(),
      adults: v.optional(v.number()),
      children: v.optional(v.number()),
      groupSize: v.number(),
      companions: v.string(),
      budget: v.number(),
      budgetFlexibility: v.string(),
      includesAirfare: v.optional(v.boolean()),
      travelerNames: v.optional(v.array(v.string())),
    }),
    preferences: v.object({
      activities: v.array(v.string()),
      transportation: v.array(v.string()),
      foodPreferences: v.array(v.string()),
      accessibility: v.optional(v.array(v.string())),
      accommodationType: v.optional(v.array(v.string())),
    }),
    specialRequirements: v.optional(v.string()),
    status: v.string(),
    adminNotes: v.optional(v.string()),
    proposalCount: v.optional(v.number()),
    lastProposalSent: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx) => {
    console.log("🔍 getMyPackageRequests: Iniciando query");
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.error("❌ getMyPackageRequests: Usuário não autenticado");
      throw new Error("Not authenticated");
    }

    console.log("👤 getMyPackageRequests: Identity encontrada:", {
      subject: identity.subject,
      email: identity.email,
      name: identity.name,
      emailVerified: identity.emailVerified,
      // Try to get additional emails if available
      externalAccounts: identity.externalAccounts
    });

    const userEmail = identity.email;
    if (!userEmail) {
      console.error("❌ getMyPackageRequests: Email do usuário não encontrado");
      throw new Error("User email not found");
    }

    // Get user from our database to check for alternative emails
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    const possibleEmails = [userEmail];
    if (user?.email && !possibleEmails.includes(user.email)) {
      possibleEmails.push(user.email);
    }

    console.log("📧 getMyPackageRequests: Emails possíveis para busca:", possibleEmails);

    const requests = await ctx.db.query("packageRequests").collect();
    console.log("📊 getMyPackageRequests: Total de requests no banco:", requests.length);
    
    if (requests.length > 0) {
      console.log("📋 getMyPackageRequests: Sample request:", requests[0]);
      console.log("📋 getMyPackageRequests: Todos os emails das requests:", 
        requests.map(r => r.customerInfo.email)
      );
    }
    
    // Filter by any of the possible emails
    const filteredRequests = requests.filter(request => 
      possibleEmails.includes(request.customerInfo.email)
    );
    console.log("🎯 getMyPackageRequests: Requests filtradas para o usuário:", filteredRequests.length);
    
    if (filteredRequests.length > 0) {
      console.log("✅ getMyPackageRequests: Requests encontradas:", filteredRequests);
    } else {
      console.log("❌ getMyPackageRequests: Nenhuma request encontrada para emails:", possibleEmails);
      console.log("📋 getMyPackageRequests: Emails únicos no banco:", 
        [...new Set(requests.map(r => r.customerInfo.email))]
      );
    }
    
    return filteredRequests.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Get package request messages by request ID
 */
export const getPackageRequestMessages = query({
  args: { packageRequestId: v.id("packageRequests") },
  returns: v.array(v.object({
    _id: v.id("packageRequestMessages"),
    _creationTime: v.number(),
    packageRequestId: v.id("packageRequests"),
    userId: v.id("users"),
    senderName: v.string(),
    senderEmail: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("sent"),
      v.literal("read"),
      v.literal("replied")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    readAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify package request exists
    const packageRequest = await ctx.db.get(args.packageRequestId);
    if (!packageRequest) {
      throw new Error("Package request not found");
    }

    // Check if user has access to this package request
    const userEmail = identity.email || user.email;
    
    // Check if user is admin/master (they can see messages for any request)
    const isAdmin = user.role === "master" || user.role === "employee";
    
    if (!isAdmin) {
      // For regular users, check email/name match
      const normalizeEmail = (email: string | undefined) => 
        email ? email.trim().toLowerCase() : '';
      
      const normalizedPackageEmail = normalizeEmail(packageRequest.customerInfo.email);
      
      // Build list of possible emails for this user
      const possibleEmails: string[] = [];
      if (identity.email) possibleEmails.push(normalizeEmail(identity.email));
      if (user.email && !possibleEmails.includes(normalizeEmail(user.email))) {
        possibleEmails.push(normalizeEmail(user.email));
      }
      if (userEmail && !possibleEmails.includes(normalizeEmail(userEmail))) {
        possibleEmails.push(normalizeEmail(userEmail));
      }
      
      // Check if package request email matches any of the user's possible emails
      const hasEmailAccess = possibleEmails.includes(normalizedPackageEmail);
      
      // Also check if the user name matches (could be same person with different email)
      const normalizedPackageName = packageRequest.customerInfo.name.toLowerCase().trim();
      const normalizedUserName = (user.name || identity.name || '').toLowerCase().trim();
      const hasNameMatch = normalizedPackageName === normalizedUserName && normalizedUserName !== '';
      
      if (!hasEmailAccess && !hasNameMatch) {
        throw new Error(`Access denied to this package request. This request belongs to ${packageRequest.customerInfo.email}, but you are logged in as ${userEmail}.`);
      }
    }
    
    const messages = await ctx.db
      .query("packageRequestMessages")
      .withIndex("by_package_request", (q) => q.eq("packageRequestId", args.packageRequestId))
      .order("desc")
      .collect();
    
    return messages;
  },
});
