import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import type { PackageCreateInput, PackageUpdateInput } from "./types";
import { generateConfirmationCode } from "../bookings/utils";

// Create a new package
export const createPackage = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    description_long: v.string(),
    duration: v.number(),
    maxGuests: v.number(),
    basePrice: v.number(),
    discountPercentage: v.optional(v.number()),
    currency: v.string(),
    accommodationId: v.optional(v.id("accommodations")),
    vehicleId: v.optional(v.id("vehicles")),
    includedActivityIds: v.array(v.id("activities")),
    includedRestaurantIds: v.array(v.id("restaurants")),
    includedEventIds: v.array(v.id("events")),
    highlights: v.array(v.string()),
    includes: v.array(v.string()),
    excludes: v.array(v.string()),
    itinerary: v.array(v.object({
      day: v.number(),
      title: v.string(),
      description: v.string(),
      activities: v.array(v.string()),
    })),
    mainImage: v.string(),
    galleryImages: v.array(v.string()),
    cancellationPolicy: v.string(),
    terms: v.array(v.string()),
    availableFromDate: v.string(),
    availableToDate: v.string(),
    blackoutDates: v.array(v.string()),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    tags: v.array(v.string()),
    category: v.string(),
    partnerId: v.id("users"),
  },
  returns: v.id("packages"),
  handler: async (ctx, args) => {
    // Check if slug is unique
    const existingPackage = await ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existingPackage) {
      throw new Error("Um pacote com este slug já existe");
    }

    // Validate accommodation exists (if provided)
    if (args.accommodationId) {
      const accommodation = await ctx.db.get(args.accommodationId);
      if (!accommodation) {
        throw new Error("Hospedagem não encontrada");
      }
    }

    // Validate vehicle exists (if provided)
    if (args.vehicleId) {
      const vehicle = await ctx.db.get(args.vehicleId);
      if (!vehicle) {
        throw new Error("Veículo não encontrado");
      }
    }

    // Validate activities exist
    for (const activityId of args.includedActivityIds) {
      const activity = await ctx.db.get(activityId);
      if (!activity) {
        throw new Error(`Atividade ${activityId} não encontrada`);
      }
    }

    // Validate restaurants exist
    for (const restaurantId of args.includedRestaurantIds) {
      const restaurant = await ctx.db.get(restaurantId);
      if (!restaurant) {
        throw new Error(`Restaurante ${restaurantId} não encontrado`);
      }
    }

    // Validate events exist
    for (const eventId of args.includedEventIds) {
      const event = await ctx.db.get(eventId);
      if (!event) {
        throw new Error(`Evento ${eventId} não encontrado`);
      }
    }

    const now = Date.now();
    
    const packageData = {
      ...args,
      // Set accommodationId as required field, but allow it to be null in the schema
      accommodationId: args.accommodationId || ("" as any),
      createdAt: now,
      updatedAt: now,
    };

    // Remove accommodationId if it's empty to make it optional
    if (!args.accommodationId) {
      delete (packageData as any).accommodationId;
    }

    return await ctx.db.insert("packages", packageData);
  },
});

// Update an existing package
export const updatePackage = mutation({
  args: {
    id: v.id("packages"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    description_long: v.optional(v.string()),
    duration: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    basePrice: v.optional(v.number()),
    discountPercentage: v.optional(v.number()),
    currency: v.optional(v.string()),
    accommodationId: v.optional(v.id("accommodations")),
    vehicleId: v.optional(v.id("vehicles")),
    includedActivityIds: v.optional(v.array(v.id("activities"))),
    includedRestaurantIds: v.optional(v.array(v.id("restaurants"))),
    includedEventIds: v.optional(v.array(v.id("events"))),
    highlights: v.optional(v.array(v.string())),
    includes: v.optional(v.array(v.string())),
    excludes: v.optional(v.array(v.string())),
    itinerary: v.optional(v.array(v.object({
      day: v.number(),
      title: v.string(),
      description: v.string(),
      activities: v.array(v.string()),
    }))),
    mainImage: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    cancellationPolicy: v.optional(v.string()),
    terms: v.optional(v.array(v.string())),
    availableFromDate: v.optional(v.string()),
    availableToDate: v.optional(v.string()),
    blackoutDates: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    
    const existingPackage = await ctx.db.get(id);
    if (!existingPackage) {
      throw new Error("Pacote não encontrado");
    }

    // Check if slug is unique (if being updated)
    if (updateData.slug && updateData.slug !== existingPackage.slug) {
      const existingSlug = await ctx.db
        .query("packages")
        .withIndex("by_slug", (q) => q.eq("slug", updateData.slug!))
        .first();

      if (existingSlug) {
        throw new Error("Um pacote com este slug já existe");
      }
    }

    // Validate references if being updated
    if (updateData.accommodationId) {
      const accommodation = await ctx.db.get(updateData.accommodationId);
      if (!accommodation) {
        throw new Error("Hospedagem não encontrada");
      }
    }

    if (updateData.vehicleId) {
      const vehicle = await ctx.db.get(updateData.vehicleId);
      if (!vehicle) {
        throw new Error("Veículo não encontrado");
      }
    }

    if (updateData.includedActivityIds) {
      for (const activityId of updateData.includedActivityIds) {
        const activity = await ctx.db.get(activityId);
        if (!activity) {
          throw new Error(`Atividade ${activityId} não encontrada`);
        }
      }
    }

    if (updateData.includedRestaurantIds) {
      for (const restaurantId of updateData.includedRestaurantIds) {
        const restaurant = await ctx.db.get(restaurantId);
        if (!restaurant) {
          throw new Error(`Restaurante ${restaurantId} não encontrado`);
        }
      }
    }

    if (updateData.includedEventIds) {
      for (const eventId of updateData.includedEventIds) {
        const event = await ctx.db.get(eventId);
        if (!event) {
          throw new Error(`Evento ${eventId} não encontrado`);
        }
      }
    }

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdateData).length > 0) {
      await ctx.db.patch(id, {
        ...cleanUpdateData,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

// Delete a package
export const deletePackage = mutation({
  args: { id: v.id("packages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const packageData = await ctx.db.get(args.id);
    if (!packageData) {
      throw new Error("Pacote não encontrado");
    }

    // Check if there are any active bookings for this package
    const activeBookings = await ctx.db
      .query("packageBookings")
      .withIndex("by_package", (q) => q.eq("packageId", args.id))
      .filter((q) => 
        q.and(
          q.neq(q.field("status"), "canceled"),
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "refunded")
        )
      )
      .first();

    if (activeBookings) {
      throw new Error("Não é possível excluir um pacote com reservas ativas");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

// Toggle package status (active/inactive)
export const togglePackageStatus = mutation({
  args: { 
    id: v.id("packages"),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const packageData = await ctx.db.get(args.id);
    if (!packageData) {
      throw new Error("Pacote não encontrado");
    }

    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Toggle package featured status
export const togglePackageFeatured = mutation({
  args: { 
    id: v.id("packages"),
    isFeatured: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const packageData = await ctx.db.get(args.id);
    if (!packageData) {
      throw new Error("Pacote não encontrado");
    }

    await ctx.db.patch(args.id, {
      isFeatured: args.isFeatured,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Create a package booking
export const createPackageBooking = mutation({
  args: {
    packageId: v.id("packages"),
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    guests: v.number(),
    totalPrice: v.number(),
    breakdown: v.object({
      accommodationPrice: v.number(),
      vehiclePrice: v.optional(v.number()),
      activitiesPrice: v.number(),
      restaurantsPrice: v.number(),
      eventsPrice: v.number(),
      discount: v.number(),
    }),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    specialRequests: v.optional(v.string()),
  },
  returns: v.object({
    bookingId: v.id("packageBookings"),
    confirmationCode: v.string(),
  }),
  handler: async (ctx, args) => {
    const packageData = await ctx.db.get(args.packageId);
    if (!packageData) {
      throw new Error("Pacote não encontrado");
    }

    if (!packageData.isActive) {
      throw new Error("Pacote não está ativo");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Generate confirmation code
    const confirmationCode = generateConfirmationCode(args.startDate, args.customerInfo.name);

    const now = Date.now();
    
    const bookingData = {
      packageId: args.packageId,
      userId: args.userId,
      startDate: args.startDate,
      endDate: args.endDate,
      guests: args.guests,
      totalPrice: args.totalPrice,
      breakdown: args.breakdown,
      status: "pending",
      relatedBookings: {
        activityBookingIds: [],
        restaurantReservationIds: [],
        eventBookingIds: [],
      },
      customerInfo: args.customerInfo,
      specialRequests: args.specialRequests,
      confirmationCode,
      createdAt: now,
      updatedAt: now,
    };

    const bookingId = await ctx.db.insert("packageBookings", bookingData);

    return {
      bookingId,
      confirmationCode,
    };
  },
});

// Update package booking status
export const updatePackageBookingStatus = mutation({
  args: {
    id: v.id("packageBookings"),
    status: v.string(),
    partnerNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.partnerNotes !== undefined) {
      updateData.partnerNotes = args.partnerNotes;
    }

    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

// Update package booking payment status
export const updatePackageBookingPayment = mutation({
  args: {
    id: v.id("packageBookings"),
    paymentStatus: v.string(),
    paymentMethod: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    const updateData: any = {
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    };

    if (args.paymentMethod !== undefined) {
      updateData.paymentMethod = args.paymentMethod;
    }

    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

/**
 * Confirm package booking (Partner/Employee/Master only)
 */
export const confirmPackageBooking = mutation({
  args: { 
    bookingId: v.id("packageBookings"),
    partnerNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Get package to verify ownership
    const packageData = await ctx.db.get(booking.packageId);
    if (!packageData) {
      throw new Error("Pacote não encontrado");
    }

    // Check if user has permission to confirm this booking
    const canConfirm = user.role === "master" || 
      (user.role === "partner" && packageData.partnerId === user._id) ||
      (user.role === "employee");

    if (!canConfirm) {
      throw new Error("Sem permissão para confirmar esta reserva");
    }

    if (booking.status === "confirmed") {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === "cancelled") {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      ...(args.partnerNotes && { partnerNotes: args.partnerNotes }),
      updatedAt: Date.now(),
    });

    // Create voucher for confirmed booking
    const voucherId = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
      bookingId: booking._id,
      bookingType: "package",
      partnerId: user._id,
      customerId: booking.userId,
      expiresAt: booking.endDate,
    });

    // Schedule notification sending action
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "package",
      assetName: packageData.name,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      partnerName: user.name,
    });

    // Get voucher details for email
    const voucher: any = await ctx.db.get(voucherId);
    if (voucher) {
      // Send voucher email with PDF attachment
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
        customerEmail: booking.customerInfo.email,
        customerName: booking.customerInfo.name,
        assetName: packageData.name,
        bookingType: "package",
        confirmationCode: booking.confirmationCode,
        voucherNumber: voucher.voucherNumber,
        bookingDate: booking.startDate,
        totalPrice: booking.totalPrice,
        partnerName: user.name,
        attachPDF: true,
        bookingDetails: {
          guests: booking.guests,
          duration: packageData.duration,
          startDate: booking.startDate,
          endDate: booking.endDate,
          includes: packageData.includes,
          highlights: packageData.highlights,
        },
      });
    }

    return null;
  },
});

// Calculate package pricing
export const calculatePackagePricing = mutation({
  args: {
    accommodationId: v.optional(v.id("accommodations")),
    vehicleId: v.optional(v.id("vehicles")),
    includedActivityIds: v.array(v.id("activities")),
    includedRestaurantIds: v.array(v.id("restaurants")),
    includedEventIds: v.array(v.id("events")),
    duration: v.number(),
    guests: v.number(),
    discountPercentage: v.optional(v.number()),
  },
  returns: v.object({
    accommodationPrice: v.number(),
    vehiclePrice: v.number(),
    activitiesPrice: v.number(),
    restaurantsPrice: v.number(),
    eventsPrice: v.number(),
    subtotal: v.number(),
    discount: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    let accommodationPrice = 0;
    let vehiclePrice = 0;
    let activitiesPrice = 0;
    let restaurantsPrice = 0;
    let eventsPrice = 0;

    // Calculate accommodation price
    if (args.accommodationId) {
      const accommodation = await ctx.db.get(args.accommodationId);
      if (accommodation) {
        accommodationPrice = accommodation.pricePerNight * args.duration;
      }
    }

    // Calculate vehicle price
    if (args.vehicleId) {
      const vehicle = await ctx.db.get(args.vehicleId);
      if (vehicle) {
        vehiclePrice = vehicle.pricePerDay * args.duration;
      }
    }

    // Calculate activities price
    for (const activityId of args.includedActivityIds) {
      const activity = await ctx.db.get(activityId);
      if (activity) {
        activitiesPrice += activity.price * args.guests;
      }
    }

    // Calculate restaurants price (estimate based on price range)
    for (const restaurantId of args.includedRestaurantIds) {
      const restaurant = await ctx.db.get(restaurantId);
      if (restaurant) {
        // Simple pricing based on price range
        const pricePerPerson = restaurant.priceRange === "$" ? 50 :
                              restaurant.priceRange === "$$" ? 100 :
                              restaurant.priceRange === "$$$" ? 200 : 300;
        restaurantsPrice += pricePerPerson * args.guests;
      }
    }

    // Calculate events price
    for (const eventId of args.includedEventIds) {
      const event = await ctx.db.get(eventId);
      if (event) {
        eventsPrice += event.price * args.guests;
      }
    }

    const subtotal = accommodationPrice + vehiclePrice + activitiesPrice + restaurantsPrice + eventsPrice;
    const discount = args.discountPercentage ? (subtotal * args.discountPercentage / 100) : 0;
    const total = subtotal - discount;

    return {
      accommodationPrice,
      vehiclePrice,
      activitiesPrice,
      restaurantsPrice,
      eventsPrice,
      subtotal,
      discount,
      total,
    };
  },
});

// Duplicate a package
export const duplicatePackage = mutation({
  args: { 
    id: v.id("packages"),
    newName: v.string(),
    newSlug: v.string(),
  },
  returns: v.id("packages"),
  handler: async (ctx, args) => {
    const originalPackage = await ctx.db.get(args.id);
    if (!originalPackage) {
      throw new Error("Pacote não encontrado");
    }

    // Check if new slug is unique
    const existingPackage = await ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", args.newSlug))
      .first();

    if (existingPackage) {
      throw new Error("Um pacote com este slug já existe");
    }

    const now = Date.now();
    
    const newPackageData = {
      ...originalPackage,
      name: args.newName,
      slug: args.newSlug,
      isActive: false, // Start as inactive
      isFeatured: false, // Start as not featured
      createdAt: now,
      updatedAt: now,
    };

    // Remove system fields
    delete (newPackageData as any)._id;
    delete (newPackageData as any)._creationTime;

    return await ctx.db.insert("packages", newPackageData);
  },
});

// Generate unique request number for package requests
// Format: DDMM-SOBRENOME NOME-PKG-XXXX
function generateRequestNumber(customerName: string, tripStartDate?: string): string {
  // Para solicitações com datas flexíveis, usar data atual
  const date = tripStartDate ? new Date(tripStartDate) : new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Normalizar e extrair partes do nome
  const normalizedName = customerName.trim().toUpperCase();
  const nameParts = normalizedName.split(/\s+/);
  
  // Extrair primeiro nome e sobrenome
  const firstName = nameParts[0] || 'CLIENTE';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
  
  // Gerar número aleatório de 4 dígitos
  const random = Math.floor(1000 + Math.random() * 9000);
  
  // Montar código no formato DDMM-SOBRENOME NOME-PKG-XXXX
  return `${day}${month}-${lastName} ${firstName}-PKG-${random}`;
}

// Customer info validator
const customerInfoValidator = v.object({
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  age: v.optional(v.number()),
  occupation: v.optional(v.string()),
});

// Trip details validator - updated to support flexible dates
const tripDetailsValidator = v.object({
  destination: v.string(),
  originCity: v.optional(v.string()), // Where the traveler is departing from
  // For specific dates
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  // For flexible dates
  startMonth: v.optional(v.string()),
  endMonth: v.optional(v.string()),
  flexibleDates: v.optional(v.boolean()),
  duration: v.number(),
  groupSize: v.number(),
  companions: v.string(),
  budget: v.number(),
  budgetFlexibility: v.string(),
});

// Preferences validator
const preferencesValidator = v.object({
  accommodationType: v.array(v.string()),
  activities: v.array(v.string()),
  transportation: v.array(v.string()),
  foodPreferences: v.array(v.string()),
  accessibility: v.optional(v.array(v.string())),
});

// Additional info validator (now optional since it's not always sent)
const additionalInfoValidator = v.optional(v.object({
  hasSpecialNeeds: v.optional(v.boolean()),
  accessibilityRequirements: v.optional(v.string()),
  emergencyContact: v.optional(v.object({
    name: v.string(),
    phone: v.string(),
    relationship: v.string(),
  })),
  additionalNotes: v.optional(v.string()),
}));

/**
 * Create a new package request
 */
export const createPackageRequest = mutation({
  args: {
    customerInfo: customerInfoValidator,
    tripDetails: tripDetailsValidator,
    preferences: preferencesValidator,
    specialRequirements: v.optional(v.string()),
    previousExperience: v.optional(v.string()),
    expectedHighlights: v.optional(v.string()),
  },
  returns: v.object({
    id: v.id("packageRequests"),
    requestNumber: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current user identity (optional for package requests)
    const identity = await ctx.auth.getUserIdentity();
    let userId: Id<"users"> | undefined;
    
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
        .first();
      userId = user?._id;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.customerInfo.email)) {
      throw new Error("Invalid email format");
    }

    // Validate dates (only for specific dates, not flexible dates)
    if (!args.tripDetails.flexibleDates) {
      if (!args.tripDetails.startDate || !args.tripDetails.endDate) {
        throw new Error("Start date and end date are required when not using flexible dates");
      }
      
      const startDate = new Date(args.tripDetails.startDate);
      const endDate = new Date(args.tripDetails.endDate);
      const today = new Date();
      
      if (startDate < today) {
        throw new Error("Start date cannot be in the past");
      }
      
      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
    } else {
      // For flexible dates, validate that months are provided
      if (!args.tripDetails.startMonth || !args.tripDetails.endMonth) {
        throw new Error("Start month and end month are required when using flexible dates");
      }
      
      // Validate that end month is not before start month
      if (args.tripDetails.endMonth < args.tripDetails.startMonth) {
        throw new Error("End month cannot be before start month");
      }
    }

    // Validate budget is positive number
    if (args.tripDetails.budget <= 0) {
      throw new Error("Budget must be a positive number");
    }

    // Validate group size is positive number
    if (args.tripDetails.groupSize <= 0) {
      throw new Error("Group size must be a positive number");
    }

    const requestNumber = generateRequestNumber(args.customerInfo.name, args.tripDetails.startDate);
    
    const packageRequestId = await ctx.db.insert("packageRequests", {
      requestNumber,
      userId, // Include userId if available
      customerInfo: args.customerInfo,
      tripDetails: args.tripDetails,
      preferences: args.preferences,
      specialRequirements: args.specialRequirements,
      status: "pending",
      assignedTo: undefined,
      adminNotes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Send confirmation email to customer
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendPackageRequestReceivedEmail, {
      customerEmail: args.customerInfo.email,
      customerName: args.customerInfo.name,
      requestNumber,
      duration: args.tripDetails.duration,
      guests: args.tripDetails.groupSize,
      budget: args.tripDetails.budget,
      destination: args.tripDetails.destination,
      requestDetails: {
        tripDetails: args.tripDetails,
        preferences: args.preferences,
        specialRequirements: args.specialRequirements,
      },
    });

    // Notify master about new package request
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.notifyMasterNewPackageRequest, {
      customerName: args.customerInfo.name,
      customerEmail: args.customerInfo.email,
      requestNumber,
      duration: args.tripDetails.duration,
      guests: args.tripDetails.groupSize,
      budget: args.tripDetails.budget,
      destination: args.tripDetails.destination,
      requestDetails: {
        customerInfo: args.customerInfo,
        tripDetails: args.tripDetails,
        preferences: args.preferences,
        specialRequirements: args.specialRequirements,
      },
    });

    return {
      id: packageRequestId,
      requestNumber,
    };
  },
});

/**
 * Update package request status
 */
export const updatePackageRequestStatus = mutation({
  args: {
    id: v.id("packageRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_review"),
      v.literal("proposal_sent"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed")
    ),
    note: v.optional(v.string()),
  },
  returns: v.id("packageRequests"),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Package request not found");
    }

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Add admin note if provided
    if (args.note) {
      const newNote = {
        note: args.note,
        timestamp: Date.now(),
        status: args.status,
      };
      updates.adminNotes = args.note;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Assign package request to a user
 */
export const assignPackageRequest = mutation({
  args: {
    requestId: v.id("packageRequests"),
    assignedTo: v.id("users"),
  },
  returns: v.id("packageRequests"),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Package request not found");
    }

    const user = await ctx.db.get(args.assignedTo);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.requestId, {
      assignedTo: args.assignedTo,
      updatedAt: Date.now(),
    });

    return args.requestId;
  },
});

/**
 * Add admin note to package request
 */
export const addAdminNote = mutation({
  args: {
    requestId: v.id("packageRequests"),
    note: v.string(),
  },
  returns: v.id("packageRequests"),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Package request not found");
    }

    const newNote = {
      note: args.note,
      timestamp: Date.now(),
      status: request.status,
    };

    await ctx.db.patch(args.requestId, {
      adminNotes: args.note,
      updatedAt: Date.now(),
    });

    return args.requestId;
  },
});

/**
 * Delete a package request
 */
export const deletePackageRequest = mutation({
  args: { id: v.id("packageRequests") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Package request not found");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Update customer information in a package request
 */
export const updateCustomerInfo = mutation({
  args: {
    requestId: v.id("packageRequests"),
    customerInfo: customerInfoValidator,
  },
  returns: v.id("packageRequests"),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Package request not found");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.customerInfo.email)) {
      throw new Error("Invalid email format");
    }

    await ctx.db.patch(args.requestId, {
      customerInfo: args.customerInfo,
      updatedAt: Date.now(),
    });

    return args.requestId;
  },
});

/**
 * Create a contact message for a package request
 */
export const createPackageRequestMessage = mutation({
  args: {
    packageRequestId: v.id("packageRequests"),
    subject: v.string(),
    message: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  returns: v.id("packageRequestMessages"),
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

    // Verify package request exists and belongs to user
    const packageRequest = await ctx.db.get(args.packageRequestId);
    if (!packageRequest) {
      throw new Error("Package request not found");
    }

    // Check if user has access to this package request
    const userEmail = identity.email || user.email;
    
    // Debug logging
    console.log("🔍 createPackageRequestMessage: Email verification", {
      userEmails: {
        identity: identity.email,
        user: user.email,
        final: userEmail
      },
      packageEmail: packageRequest.customerInfo.email,
      userId: user._id,
      packageRequestId: args.packageRequestId,
      userRole: user.role
    });
    
    // Check if user is admin/master (they can send messages for any request)
    const isAdmin = user.role === "master" || user.role === "employee";
    
    if (isAdmin) {
      console.log("✅ createPackageRequestMessage: Access granted (admin user)");
    } else {
      // For regular users, check email match
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
        console.error("❌ createPackageRequestMessage: Access denied", {
          normalizedPackageEmail,
          possibleEmails,
          normalizedPackageName,
          normalizedUserName,
          hasNameMatch,
          originalPackageEmail: packageRequest.customerInfo.email,
          originalUserEmail: userEmail
        });
        throw new Error(`Access denied to this package request. This request was made with email ${packageRequest.customerInfo.email}, but you are logged in with ${userEmail}. If this is your request, please contact support to link it to your current account.`);
      }
      
      if (hasNameMatch && !hasEmailAccess) {
        console.log("✅ createPackageRequestMessage: Access granted (name match - possible email change)");
      } else {
        console.log("✅ createPackageRequestMessage: Access granted (email match)");
      }
    }

    // Create the message
    const messageId = await ctx.db.insert("packageRequestMessages", {
      packageRequestId: args.packageRequestId,
      userId: user._id,
      senderName: user.name || identity.name || packageRequest.customerInfo.name,
      senderEmail: userEmail!,
      subject: args.subject,
      message: args.message,
      status: "sent",
      priority: args.priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Mark package request message as read
 */
export const markPackageRequestMessageAsRead = mutation({
  args: { messageId: v.id("packageRequestMessages") },
  returns: v.id("packageRequestMessages"),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.patch(args.messageId, {
      status: "read",
      readAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.messageId;
  },
});

/**
 * Mark package request message as replied
 */
export const markPackageRequestMessageAsReplied = mutation({
  args: { messageId: v.id("packageRequestMessages") },
  returns: v.id("packageRequestMessages"),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.patch(args.messageId, {
      status: "replied",
      repliedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.messageId;
  },
});

/**
 * Send admin reply to package request message
 */
export const sendPackageRequestReply = mutation({
  args: {
    packageRequestId: v.id("packageRequests"),
    originalMessageId: v.optional(v.id("packageRequestMessages")),
    subject: v.string(),
    message: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  returns: v.id("packageRequestMessages"),
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

    // Check if user is admin/master
    const isAdmin = user.role === "master" || user.role === "employee";
    if (!isAdmin) {
      throw new Error("Only admins can send replies");
    }

    // Verify package request exists
    const packageRequest = await ctx.db.get(args.packageRequestId);
    if (!packageRequest) {
      throw new Error("Package request not found");
    }

    // Create the reply message
    const messageId = await ctx.db.insert("packageRequestMessages", {
      packageRequestId: args.packageRequestId,
      userId: user._id,
      senderName: user.name || identity.name || "Admin",
      senderEmail: user.email || identity.email || "admin@tournarrays.com",
      subject: args.subject,
      message: args.message,
      status: "sent",
      priority: args.priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // If replying to a specific message, mark it as replied
    if (args.originalMessageId) {
      await ctx.db.patch(args.originalMessageId, {
        status: "replied",
        repliedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return messageId;
  },
}); 