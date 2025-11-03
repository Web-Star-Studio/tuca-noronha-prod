import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import {
  createVoucherValidator,
  updateVoucherValidator,
  useVoucherValidator,
  cancelVoucherValidator,
  createUsageLogValidator,
  VOUCHER_STATUS,
  VOUCHER_ACTIONS,
  USER_TYPES,
} from "./types";
import {
  generateVoucherNumber,
  generateVerificationToken,
  generateQRCodeData,
  qrCodeDataToString,
  calculateVoucherExpiration,
} from "./utils";

/**
 * Internal mutation to generate a voucher for a booking (used by payment actions)
 */
export const generateVoucherInternal = internalMutation({
  args: {
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
  },
  handler: async (ctx, args) => {
    const { bookingId, bookingType } = args;
    
    // Check if voucher already exists for this booking
    const existingVoucher = await ctx.db
      .query("vouchers")
      .withIndex("by_booking", (q) => 
        q.eq("bookingId", bookingId).eq("bookingType", bookingType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingVoucher) {
      console.log("Voucher already exists for booking:", bookingId);
      return { voucherId: existingVoucher._id };
    }

    // Get booking details to find partner, customer IDs, and asset info
    let booking: any;
    let partnerId: any;
    let customerId: any;
    let asset: any;
    let supplier: any = undefined;
    
    switch (bookingType) {
      case "activity":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.activityId) {
          asset = await ctx.db.get(booking.activityId) as any;
          partnerId = asset?.partnerId;
          customerId = booking.userId;
        }
        break;
      case "event":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.eventId) {
          asset = await ctx.db.get(booking.eventId) as any;
          partnerId = asset?.partnerId;
          customerId = booking.userId;
        }
        break;
      case "restaurant":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.restaurantId) {
          asset = await ctx.db.get(booking.restaurantId) as any;
          partnerId = asset?.partnerId;
          customerId = booking.userId;
        }
        break;
      case "vehicle":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.vehicleId) {
          asset = await ctx.db.get(booking.vehicleId) as any;
          partnerId = asset?.ownerId;
          customerId = booking.userId;
        }
        break;
      case "package":
        booking = await ctx.db.get(bookingId as any);
        if (booking) {
          customerId = booking.userId;
          // Package might not have a specific partner
        }
        break;
    }

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Get customer and partner information
    const customer = customerId ? (await ctx.db.get(customerId) as any) : null;
    const partner = partnerId ? (await ctx.db.get(partnerId) as any) : null;

    // Get supplier information if available
    const supplierId = booking.supplierId || asset?.supplierId;
    if (supplierId) {
      const supplierDoc = await ctx.db.get(supplierId);
      if (supplierDoc && (supplierDoc as any).isActive) {
        supplier = {
          name: (supplierDoc as any).name,
          address: (supplierDoc as any).address,
          emergencyPhone: (supplierDoc as any).emergencyPhone,
        };
      }
    }

    // Generate unique voucher number
    let voucherNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      voucherNumber = generateVoucherNumber();
      const exists = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .first();

      if (!exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique voucher number");
    }

    // Calculate expiration 
    const calculatedExpiration = calculateVoucherExpiration(bookingType, booking.date || booking.startDate);

    // Generate verification token and QR code
    const verificationToken = generateVerificationToken(voucherNumber, calculatedExpiration);
    const qrCodeData = generateQRCodeData(voucherNumber, verificationToken, calculatedExpiration);
    const qrCodeString = qrCodeDataToString(qrCodeData);

    // Extract guest names based on booking type
    let guestNames: string[] = [];
    switch (bookingType) {
      case "activity":
        guestNames = booking.additionalParticipants || [];
        break;
      case "event":
        guestNames = booking.participantNames || [];
        break;
      case "restaurant":
        guestNames = booking.guestNames || [];
        break;
      default:
        guestNames = [];
    }

    // Create voucher record with complete details field
    const now = Date.now();
    const voucherId = await ctx.db.insert("vouchers", {
      voucherNumber,
      code: voucherNumber,  // For compatibility
      qrCode: qrCodeString,
      bookingId,
      bookingType,
      status: VOUCHER_STATUS.ACTIVE,
      generatedAt: now,
      expiresAt: calculatedExpiration,
      emailSent: false,
      downloadCount: 0,
      verificationToken,
      scanCount: 0,
      partnerId: partnerId || undefined,
      customerId: customerId || undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      // Add details field to match manual voucher format
      details: {
        manualCreation: false,
        createdBy: partnerId,
        asset: asset ? {
          name: asset.name || asset.title,
          description: asset.description,
          highlights: asset.highlights || asset.features || [],
          includes: asset.includes || asset.services || [],
          additionalInfo: asset.additionalInfo || asset.notes || [],
          cancellationPolicy: asset.cancellationPolicy || asset.cancelationPolicy || (Array.isArray(asset.terms) ? asset.terms : undefined),
        } : undefined,
        customer: customer ? {
          name: customer.name || booking.customerInfo?.name,
          email: customer.email || booking.customerInfo?.email,
          phone: customer.phone || booking.customerInfo?.phone,
        } : {
          name: booking.customerInfo?.name,
          email: booking.customerInfo?.email,
          phone: booking.customerInfo?.phone,
        },
        booking: {
          date: booking.date || booking.checkInDate || booking.startDate,
          time: booking.time,
          participants: booking.participants || booking.guestCount || booking.quantity || booking.partySize,
          guestNames,
          specialRequests: booking.specialRequests || booking.notes || booking.comments,
        },
        supplier,
        brand: {
          handledBy: partner?.name,
          companyPhone: partner?.phone,
        },
        confirmation: {
          confirmedBy: partner?.name || "Sistema",
        },
      },
    });

    // Log voucher generation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.GENERATED,
      timestamp: now,
      createdAt: now,
      userType: USER_TYPES.ADMIN, // Using ADMIN as SYSTEM doesn't exist
      userId: customerId || ("system" as any),
      ipAddress: "internal",
      metadata: JSON.stringify({
        bookingId,
        bookingType,
        source: "internal_action"
      }),
    });

    console.log("Voucher generated successfully:", voucherId);
    return { voucherId };
  },
});

/**
 * Generate a new voucher for a booking
 */
export const generateVoucher = mutation({
  args: createVoucherValidator,
  handler: async (ctx, args) => {
    const { bookingId, bookingType, partnerId, customerId, expiresAt } = args;
    // Get current user for audit logging
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query("users")
          .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : null;

    // Check if voucher already exists for this booking
    const existingVoucher = await ctx.db
      .query("vouchers")
      .withIndex("by_booking", (q) => 
        q.eq("bookingId", bookingId).eq("bookingType", bookingType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingVoucher) {
      throw new Error("Voucher já existe para esta reserva");
    }

    // Get booking details to extract all necessary information
    let booking: any;
    let asset: any;
    let supplier: any = undefined;
    
    switch (bookingType) {
      case "activity":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.activityId) {
          asset = await ctx.db.get(booking.activityId) as any;
        }
        break;
      case "event":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.eventId) {
          asset = await ctx.db.get(booking.eventId) as any;
        }
        break;
      case "restaurant":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.restaurantId) {
          asset = await ctx.db.get(booking.restaurantId) as any;
        }
        break;
      case "vehicle":
        booking = await ctx.db.get(bookingId as any);
        if (booking && booking.vehicleId) {
          asset = await ctx.db.get(booking.vehicleId) as any;
        }
        break;
      case "package":
        booking = await ctx.db.get(bookingId as any);
        // Package might have different structure
        break;
    }

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Get customer and partner information
    const customer = customerId ? (await ctx.db.get(customerId as any) as any) : null;
    const partner = partnerId ? (await ctx.db.get(partnerId as any) as any) : null;

    // Get supplier information if available
    const supplierId = booking.supplierId || asset?.supplierId;
    if (supplierId) {
      const supplierDoc = await ctx.db.get(supplierId);
      if (supplierDoc && (supplierDoc as any).isActive) {
        supplier = {
          name: (supplierDoc as any).name,
          address: (supplierDoc as any).address,
          emergencyPhone: (supplierDoc as any).emergencyPhone,
        };
      }
    }

    // Generate unique voucher number
    let voucherNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      voucherNumber = generateVoucherNumber();
      const exists = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .first();

      if (!exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error("Erro ao gerar número único do voucher");
    }

    // Calculate expiration if not provided
    const calculatedExpiration = expiresAt || calculateVoucherExpiration(bookingType, booking.date || booking.startDate);

    // Generate verification token and QR code
    const verificationToken = generateVerificationToken(voucherNumber, calculatedExpiration);
    const qrCodeData = generateQRCodeData(voucherNumber, verificationToken, calculatedExpiration);
    const qrCodeString = qrCodeDataToString(qrCodeData);

    // Extract guest names based on booking type
    let guestNames: string[] = [];
    switch (bookingType) {
      case "activity":
        guestNames = booking.additionalParticipants || [];
        break;
      case "event":
        guestNames = booking.participantNames || [];
        break;
      case "restaurant":
        guestNames = booking.guestNames || [];
        break;
      default:
        guestNames = [];
    }

    // Create voucher record with complete details field
    const now = Date.now();
    const voucherId = await ctx.db.insert("vouchers", {
      voucherNumber,
      code: voucherNumber,  // For compatibility
      qrCode: qrCodeString,
      bookingId,
      bookingType,
      status: VOUCHER_STATUS.ACTIVE,
      generatedAt: now,
      expiresAt: calculatedExpiration,
      emailSent: false,
      downloadCount: 0,
      verificationToken,
      scanCount: 0,
      partnerId,
      customerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      // Add details field to match manual voucher format
      details: {
        manualCreation: false,
        createdBy: currentUser?._id || partnerId,
        asset: asset ? {
          name: asset.name || asset.title,
          description: asset.description,
          highlights: asset.highlights || asset.features || [],
          includes: asset.includes || asset.services || [],
          additionalInfo: asset.additionalInfo || asset.notes || [],
          cancellationPolicy: asset.cancellationPolicy || asset.cancelationPolicy || (Array.isArray(asset.terms) ? asset.terms : undefined),
        } : undefined,
        customer: customer ? {
          name: customer.name || booking.customerInfo?.name,
          email: customer.email || booking.customerInfo?.email,
          phone: customer.phone || booking.customerInfo?.phone,
        } : {
          name: booking.customerInfo?.name,
          email: booking.customerInfo?.email,
          phone: booking.customerInfo?.phone,
        },
        booking: {
          date: booking.date || booking.checkInDate || booking.startDate,
          time: booking.time,
          participants: booking.participants || booking.guestCount || booking.quantity || booking.partySize,
          guestNames,
          specialRequests: booking.specialRequests || booking.notes || booking.comments,
        },
        supplier,
        brand: {
          handledBy: partner?.name || currentUser?.name,
          companyPhone: partner?.phone,
        },
        confirmation: {
          confirmedBy: currentUser?.name || partner?.name || "Sistema",
        },
      },
    });

    // Log voucher generation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.GENERATED,
      timestamp: now,
      userId: currentUser?._id,
      userType: currentUser?.role || USER_TYPES.ADMIN,
      metadata: JSON.stringify({
        bookingId,
        bookingType,
        generatedBy: currentUser?.name || "System",
      }),
      createdAt: now,
    });

    return {
      voucherId,
      voucherNumber,
      qrCode: qrCodeString,
      expiresAt: calculatedExpiration,
    };
  },
});

/**
 * Update voucher information
 */
export const updateVoucher = mutation({
  args: updateVoucherValidator,
  handler: async (ctx, args) => {
    const { voucherId, ...updates } = args;

    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get voucher to check permissions
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check - only partner, employees, or masters can update vouchers
    const canUpdate = currentUser.role === "master" || 
                     voucher.partnerId === currentUser._id ||
                     (currentUser.role === "employee" && currentUser.partnerId === voucher.partnerId);

    if (!canUpdate) {
      throw new Error("Acesso negado");
    }

    // Update voucher
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      ...updates,
      updatedAt: now,
    });

    // Log update action
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: "updated" as any, // Add to VOUCHER_ACTIONS if needed
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        updatedFields: Object.keys(updates),
        updatedBy: currentUser.name,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Mark voucher as used (partner check-in)
 */
export const useVoucher = mutation({
  args: useVoucherValidator,
  handler: async (ctx, { voucherId, partnerId, usageNotes, location }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get voucher
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check - only the partner or their employees can mark voucher as used
    const canUse = voucher.partnerId === partnerId ||
                  (currentUser.role === "employee" && currentUser.partnerId === voucher.partnerId);

    if (!canUse) {
      throw new Error("Acesso negado - voucher não pertence a este parceiro");
    }

    // Check voucher status
    if (voucher.status !== VOUCHER_STATUS.ACTIVE) {
      throw new Error(
        `Voucher não pode ser utilizado - status: ${
          voucher.status === "used" ? "já utilizado" :
          voucher.status === "cancelled" ? "cancelado" :
          voucher.status === "expired" ? "expirado" : "inválido"
        }`
      );
    }

    // Check expiration
    if (voucher.expiresAt && Date.now() > voucher.expiresAt) {
      // Auto-update to expired
      await ctx.db.patch(voucherId, {
        status: VOUCHER_STATUS.EXPIRED,
        updatedAt: Date.now(),
      });
      throw new Error("Voucher expirado");
    }

    // Mark voucher as used
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      status: VOUCHER_STATUS.USED,
      usedAt: now,
      updatedAt: now,
    });

    // Log usage
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.USED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      location,
      metadata: JSON.stringify({
        usedBy: currentUser.name,
        partnerId,
        usageNotes,
        location,
      }),
      createdAt: now,
    });

    // Update booking status if needed
    try {
      switch (voucher.bookingType) {
        case "activity":
          const activityBooking = await ctx.db
            .query("activityBookings")
            .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
            .first();
          if (activityBooking && activityBooking.status !== "completed") {
            await ctx.db.patch(activityBooking._id, {
              status: "in_progress",
              updatedAt: now,
            });
          }
          break;
        case "event":
          const eventBooking = await ctx.db
            .query("eventBookings")
            .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
            .first();
          if (eventBooking && eventBooking.status !== "completed") {
            await ctx.db.patch(eventBooking._id, {
              status: "in_progress",
              updatedAt: now,
            });
          }
          break;
        // Add other booking types as needed
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      // Don't fail the voucher usage if booking update fails
    }

    return {
      success: true,
      usedAt: now,
      message: "Voucher utilizado com sucesso",
    };
  },
});

/**
 * Cancel voucher
 */
export const cancelVoucher = mutation({
  args: cancelVoucherValidator,
  handler: async (ctx, { voucherId, reason, userId }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get voucher
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check - customer, partner, employees, or masters can cancel
    const canCancel = currentUser.role === "master" ||
                     voucher.partnerId === currentUser._id ||
                     voucher.customerId === currentUser._id ||
                     (currentUser.role === "employee" && currentUser.partnerId === voucher.partnerId);

    if (!canCancel) {
      throw new Error("Acesso negado");
    }

    // Check if voucher can be cancelled
    if (voucher.status === VOUCHER_STATUS.USED) {
      throw new Error("Voucher já foi utilizado e não pode ser cancelado");
    }

    if (voucher.status === VOUCHER_STATUS.CANCELLED) {
      throw new Error("Voucher já está cancelado");
    }

    // Cancel voucher
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      status: VOUCHER_STATUS.CANCELLED,
      updatedAt: now,
    });

    // Log cancellation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.CANCELLED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        cancelledBy: currentUser.name,
        reason,
        cancelledByUserId: userId,
      }),
      createdAt: now,
    });

    return {
      success: true,
      cancelledAt: now,
      message: "Voucher cancelado com sucesso",
    };
  },
});

/**
 * Record voucher scan (for analytics)
 */
export const recordVoucherScan = mutation({
  args: {
    voucherId: v.optional(v.id("vouchers")),
    voucherNumber: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    userType: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, { voucherId, voucherNumber, userId, userType, ipAddress, userAgent, location, metadata }) => {
    let voucher;
    
    // Get voucher either by ID or by number
    if (voucherId) {
      voucher = await ctx.db.get(voucherId);
    } else if (voucherNumber) {
      voucher = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    } else {
      throw new Error("Voucher ID ou número deve ser fornecido");
    }

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    const now = Date.now();

    // Update scan count and last scanned time
    await ctx.db.patch(voucher._id, {
      scanCount: voucher.scanCount + 1,
      lastScannedAt: now,
      updatedAt: now,
    });

    // Log scan
    await ctx.db.insert("voucherUsageLogs", {
      voucherId: voucher._id,
      action: VOUCHER_ACTIONS.SCANNED,
      timestamp: now,
      userId,
      userType: userType || (userId ? undefined : "anonymous"),
      ipAddress,
      userAgent,
      location,
      metadata: metadata || JSON.stringify({
        scanCount: voucher.scanCount + 1,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Record voucher download (for analytics)
 */
export const recordVoucherDownload = mutation({
  args: {
    voucherId: v.optional(v.id("vouchers")),
    voucherNumber: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    userType: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, { voucherId, voucherNumber, userId, userType, ipAddress, userAgent, metadata }) => {
    let voucher;
    
    // Get voucher either by ID or by number
    if (voucherId) {
      voucher = await ctx.db.get(voucherId);
    } else if (voucherNumber) {
      voucher = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    } else {
      throw new Error("Voucher ID ou número deve ser fornecido");
    }

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    const now = Date.now();

    // Update download count
    await ctx.db.patch(voucher._id, {
      downloadCount: voucher.downloadCount + 1,
      updatedAt: now,
    });

    // Log download
    await ctx.db.insert("voucherUsageLogs", {
      voucherId: voucher._id,
      action: VOUCHER_ACTIONS.DOWNLOADED,
      timestamp: now,
      userId,
      userType: userType || (userId ? undefined : "anonymous"),
      ipAddress,
      userAgent,
      metadata: metadata || JSON.stringify({
        downloadCount: voucher.downloadCount + 1,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Record voucher email sent
 */
export const recordVoucherEmailSent = mutation({
  args: {
    voucherId: v.optional(v.id("vouchers")),
    voucherNumber: v.optional(v.string()),
    emailAddress: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { voucherId, voucherNumber, emailAddress, userId }) => {
    let voucher;
    
    // Get voucher either by ID or by number
    if (voucherId) {
      voucher = await ctx.db.get(voucherId);
    } else if (voucherNumber) {
      voucher = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    } else {
      throw new Error("Voucher ID ou número deve ser fornecido");
    }

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    const now = Date.now();

    // Update email sent status
    await ctx.db.patch(voucher._id, {
      emailSent: true,
      emailSentAt: now,
      updatedAt: now,
    });

    // Log email sent
    await ctx.db.insert("voucherUsageLogs", {
      voucherId: voucher._id,
      action: VOUCHER_ACTIONS.EMAILED,
      timestamp: now,
      userId,
      userType: "system",
      metadata: JSON.stringify({
        emailAddress,
        sentAt: now,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Regenerate voucher (create new voucher for same booking)
 */
export const regenerateVoucher = mutation({
  args: {
    voucherId: v.id("vouchers"),
    reason: v.string(),
  },
  handler: async (ctx, { voucherId, reason }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get original voucher
    const originalVoucher = await ctx.db.get(voucherId);
    if (!originalVoucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check
    const canRegenerate = currentUser.role === "master" ||
                         originalVoucher.partnerId === currentUser._id ||
                         (currentUser.role === "employee" && currentUser.partnerId === originalVoucher.partnerId);

    if (!canRegenerate) {
      throw new Error("Acesso negado");
    }

    // Cancel original voucher
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      status: VOUCHER_STATUS.CANCELLED,
      updatedAt: now,
    });

    // Log cancellation of original
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.CANCELLED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        cancelledBy: currentUser.name,
        reason: `Voucher regenerated: ${reason}`,
        regenerated: true,
      }),
      createdAt: now,
    });

    // Generate new voucher by creating it directly
    const voucherNumber = generateVoucherNumber();
    const verificationToken = generateVerificationToken(voucherNumber, originalVoucher.expiresAt);
    const qrCodeData = generateQRCodeData(voucherNumber, verificationToken, originalVoucher.expiresAt);
    const qrCodeString = qrCodeDataToString(qrCodeData);

    const newVoucherId = await ctx.db.insert("vouchers", {
      voucherNumber,
      code: voucherNumber,  // For compatibility
      qrCode: qrCodeString,
      bookingId: originalVoucher.bookingId,
      bookingType: originalVoucher.bookingType,
      status: VOUCHER_STATUS.ACTIVE,
      generatedAt: now,
      expiresAt: originalVoucher.expiresAt,
      emailSent: false,
      downloadCount: 0,
      verificationToken,
      scanCount: 0,
      partnerId: originalVoucher.partnerId,
      customerId: originalVoucher.customerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Log new voucher generation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId: newVoucherId,
      action: VOUCHER_ACTIONS.GENERATED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        regenerated: true,
        originalVoucherId: voucherId,
        reason,
        generatedBy: currentUser.name,
      }),
      createdAt: now,
    });

    const newVoucher = {
      voucherId: newVoucherId,
      voucherNumber,
      qrCode: qrCodeString,
      expiresAt: originalVoucher.expiresAt,
    };

    return {
      success: true,
      originalVoucherId: voucherId,
      newVoucher,
      message: "Voucher regenerado com sucesso",
    };
  },
});

/**
 * Bulk update voucher expiration dates
 */
export const bulkUpdateVoucherExpiration = mutation({
  args: {
    partnerId: v.id("users"),
    bookingType: v.optional(v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      
    )),
    newExpirationDate: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { partnerId, bookingType, newExpirationDate, reason }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // RBAC check - only masters or the partner themselves
    if (currentUser.role !== "master" && currentUser._id !== partnerId) {
      throw new Error("Acesso negado");
    }

    // Build query for vouchers to update
    let query = ctx.db
      .query("vouchers")
      .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("status"), "active")
        )
      );

    if (bookingType) {
      query = query.filter((q) => q.eq(q.field("bookingType"), bookingType));
    }

    const vouchers = await query.collect();

    if (vouchers.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        message: "Nenhum voucher encontrado para atualizar",
      };
    }

    // Update vouchers in batches
    const now = Date.now();
    let updatedCount = 0;

    for (const voucher of vouchers) {
      try {
        await ctx.db.patch(voucher._id, {
          expiresAt: newExpirationDate,
          updatedAt: now,
        });

        // Log the update
        await ctx.db.insert("voucherUsageLogs", {
          voucherId: voucher._id,
          action: "updated" as any,
          timestamp: now,
          userId: currentUser._id,
          userType: currentUser.role,
          metadata: JSON.stringify({
            bulkUpdate: true,
            reason,
            oldExpiration: voucher.expiresAt,
            newExpiration: newExpirationDate,
            updatedBy: currentUser.name,
          }),
          createdAt: now,
        });

        updatedCount++;
      } catch (error) {
        console.error(`Error updating voucher ${voucher._id}:`, error);
        // Continue with other vouchers
      }
    }

    return {
      success: true,
      updatedCount,
      totalVouchers: vouchers.length,
      message: `${updatedCount} vouchers atualizados com sucesso`,
    };
  },
});

/**
 * Update voucher with PDF storage information (internal use)
 */
export const updateVoucherPDF = internalMutation({
  args: {
    voucherNumber: v.string(),
    pdfStorageId: v.string(),
  },
  handler: async (ctx, { voucherNumber, pdfStorageId }) => {
    // Find voucher by number
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // Update voucher with PDF storage ID
    await ctx.db.patch(voucher._id, {
      pdfStorageId,
      updatedAt: Date.now(),
    });

    return voucher._id;
  },
});

/**
 * Update voucher verification token (internal use)
 */
export const updateVoucherVerificationToken = internalMutation({
  args: {
    voucherNumber: v.string(),
    verificationToken: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { voucherNumber, verificationToken, expiresAt }) => {
    // Find voucher by number
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // Update voucher with new verification token
    const updateData: any = {
      verificationToken,
      updatedAt: Date.now(),
    };

    if (expiresAt) {
      updateData.expiresAt = expiresAt;
    }

    await ctx.db.patch(voucher._id, updateData);

    return voucher._id;
  },
});

/**
 * Log voucher action (internal use)
 */
export const logVoucherAction = internalMutation({
  args: {
    voucherNumber: v.string(),
    action: v.string(),
    userId: v.optional(v.id("users")),
    userType: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, { voucherNumber, action, userId, userType, ipAddress, userAgent, location, metadata }) => {
    // Find voucher by number
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!voucher && voucherNumber !== "unknown") {
      throw new Error("Voucher não encontrado");
    }

    const now = Date.now();

    // Log the action
    await ctx.db.insert("voucherUsageLogs", {
      voucherId: voucher?._id || ("unknown" as any),
      action: action as any,
      timestamp: now,
      userId,
      userType,
      ipAddress,
      userAgent,
      location,
      metadata,
      createdAt: now,
    });

    // Update voucher scan count if it was a scan action
    if (voucher && action === "scanned") {
      await ctx.db.patch(voucher._id, {
        scanCount: voucher.scanCount + 1,
        lastScannedAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Mark voucher as used via QR verification (internal use)
 */
export const useVoucherByQR = internalMutation({
  args: {
    voucherNumber: v.string(),
    partnerId: v.id("users"),
    usageNotes: v.optional(v.string()),
    location: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { voucherNumber, partnerId, usageNotes, location, ipAddress, userAgent }) => {
    // Find voucher by number
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // Verify partner access
    if (voucher.partnerId !== partnerId) {
      throw new Error("Acesso negado - voucher não pertence a este parceiro");
    }

    // Check voucher status
    if (voucher.status !== VOUCHER_STATUS.ACTIVE) {
      throw new Error(
        `Voucher não pode ser utilizado - status: ${
          voucher.status === "used" ? "já utilizado" :
          voucher.status === "cancelled" ? "cancelado" :
          voucher.status === "expired" ? "expirado" : "inválido"
        }`
      );
    }

    // Check expiration
    if (voucher.expiresAt && Date.now() > voucher.expiresAt) {
      // Auto-update to expired
      await ctx.db.patch(voucher._id, {
        status: VOUCHER_STATUS.EXPIRED,
        updatedAt: Date.now(),
      });
      throw new Error("Voucher expirado");
    }

    // Mark voucher as used
    const now = Date.now();
    await ctx.db.patch(voucher._id, {
      status: VOUCHER_STATUS.USED,
      usedAt: now,
      updatedAt: now,
    });

    // Log usage
    await ctx.db.insert("voucherUsageLogs", {
      voucherId: voucher._id,
      action: VOUCHER_ACTIONS.USED,
      timestamp: now,
      userId: partnerId,
      userType: "partner",
      ipAddress,
      userAgent,
      location,
      metadata: JSON.stringify({
        usedViaQR: true,
        partnerId,
        usageNotes,
        location,
      }),
      createdAt: now,
    });

    return {
      success: true,
      usedAt: now,
      message: "Voucher utilizado com sucesso via QR Code",
    };
  },
});

/**
 * Create a manual voucher (admin only) without a booking
 */
export const createManualVoucher = mutation({
  args: {
    customerId: v.id("users"),
    partnerId: v.optional(v.id("users")),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("accommodation")
    ),
    assetName: v.string(),
    assetDescription: v.optional(v.string()),
    assetHighlights: v.optional(v.array(v.string())),
    assetIncludes: v.optional(v.array(v.string())),
    assetAdditionalInfo: v.optional(v.array(v.string())),
    cancellationPolicy: v.optional(v.union(v.string(), v.array(v.string()))),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    bookingDate: v.string(),
    bookingTime: v.optional(v.string()),
    participants: v.optional(v.number()),
    guestNames: v.optional(v.array(v.string())),
    specialRequests: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    supplierAddress: v.optional(v.string()),
    supplierEmergencyPhone: v.optional(v.string()),
    handledBy: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    confirmedBy: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || (currentUser.role !== "master" && currentUser.role !== "admin")) {
      throw new Error("Apenas administradores podem criar vouchers manualmente");
    }

    // Generate unique voucher number
    let voucherNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      voucherNumber = generateVoucherNumber();
      const exists = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .first();

      if (!exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error("Erro ao gerar número único do voucher");
    }

    // Calculate expiration if not provided
    const calculatedExpiration = args.expiresAt || calculateVoucherExpiration(args.bookingType);

    // Generate verification token and QR code
    const verificationToken = generateVerificationToken(voucherNumber, calculatedExpiration);
    const qrCodeData = generateQRCodeData(voucherNumber, verificationToken, calculatedExpiration);
    const qrCodeString = qrCodeDataToString(qrCodeData);

    // Create a fake booking ID for admin reservations
    const fakeBookingId = `ADMIN-${voucherNumber}`;

    // Create voucher record
    const now = Date.now();
    const voucherId = await ctx.db.insert("vouchers", {
      voucherNumber,
      code: voucherNumber,
      qrCode: qrCodeString,
      bookingId: fakeBookingId,
      bookingType: args.bookingType,
      status: VOUCHER_STATUS.ACTIVE,
      generatedAt: now,
      expiresAt: calculatedExpiration,
      emailSent: false,
      downloadCount: 0,
      verificationToken,
      scanCount: 0,
      partnerId: args.partnerId || currentUser._id,
      customerId: args.customerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      // Store additional details in the details field
      details: {
        manualCreation: true,
        createdBy: currentUser._id,
        asset: {
          name: args.assetName,
          description: args.assetDescription,
          highlights: args.assetHighlights,
          includes: args.assetIncludes,
          additionalInfo: args.assetAdditionalInfo,
          cancellationPolicy: args.cancellationPolicy,
        },
        customer: {
          name: args.customerName,
          email: args.customerEmail,
          phone: args.customerPhone,
        },
        booking: {
          date: args.bookingDate,
          time: args.bookingTime,
          participants: args.participants,
          guestNames: args.guestNames,
          specialRequests: args.specialRequests,
        },
        supplier: args.supplierName ? {
          name: args.supplierName,
          address: args.supplierAddress,
          emergencyPhone: args.supplierEmergencyPhone,
        } : undefined,
        brand: {
          handledBy: args.handledBy,
          companyPhone: args.companyPhone,
        },
        confirmation: {
          confirmedBy: args.confirmedBy,
        },
      },
    });

    // Log voucher generation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.GENERATED,
      timestamp: now,
      createdAt: now,
      userType: USER_TYPES.ADMIN,
      userId: currentUser._id,
      metadata: JSON.stringify({
        source: "manual_admin_creation",
        assetName: args.assetName,
        customerName: args.customerName,
      }),
    });

    return { 
      voucherId,
      voucherNumber,
      message: "Voucher criado com sucesso"
    };
  },
});