import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { 
  CreateAdminReservationArgs, 
  UpdateAdminReservationArgs,
  CreateAutoConfirmationSettingsArgs,
  AdminReservationAssetType 
} from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Generate confirmation code following the pattern: DDMM-SOBRENOME NOME-XXXX
function generateConfirmationCode(bookingDate: Date, customerName: string): string {
  // Extrair dia e mês da data
  const day = bookingDate.getDate().toString().padStart(2, '0');
  const month = (bookingDate.getMonth() + 1).toString().padStart(2, '0');
  
  // Normalizar e extrair partes do nome
  const normalizedName = customerName.trim().toUpperCase();
  const nameParts = normalizedName.split(/\s+/);
  
  // Extrair primeiro nome e sobrenome
  const firstName = nameParts[0] || 'CLIENTE';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
  
  // Gerar número aleatório de 4 dígitos
  const random = Math.floor(1000 + Math.random() * 9000);
  
  // Montar código no formato DDMM-SOBRENOME NOME-XXXX
  return `${day}${month}-${lastName} ${firstName}-${random}`;
}

// Create admin reservation
export const createAdminReservation = mutation({
  args: CreateAdminReservationArgs as any,
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

    // Check permissions - only admin roles can create admin reservations
    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions to create admin reservations");
    }

    // Get traveler
    const traveler = await ctx.db.get(args.travelerId);
    if (!traveler) {
      throw new Error("Traveler not found");
    }

    // Ensure traveler is a regular user, not admin/partner/employee
    const travelerUser = traveler as any; // Cast to access user properties
    if (travelerUser.role && travelerUser.role !== "traveler") {
      throw new Error("Admin reservations can only be created for travelers");
    }

    // Get asset to validate it exists
    const asset = await ctx.db.get(args.assetId as any);
    if (!asset) {
      throw new Error("Asset not found");
    }

    // Parse the booking date - ensure it's a valid timestamp
    const bookingDateTimestamp = typeof args.reservationDate === 'string' 
      ? new Date(args.reservationDate).getTime()
      : args.reservationDate;

    const bookingDate = new Date(bookingDateTimestamp);
    if (isNaN(bookingDate.getTime())) {
      throw new Error("Invalid reservation date");
    }

    // Determine initial status based on auto-confirm flag
    const initialStatus = args.autoConfirm ? "confirmed" : "draft";
    
    // Only generate confirmation code if auto-confirming
    const confirmationCode = args.autoConfirm 
      ? generateConfirmationCode(bookingDate, args.customerName) 
      : undefined;

    // Create the reservation
    const reservationId = await ctx.db.insert("adminReservations", {
      assetType: args.assetType,
      assetId: args.assetId,
      adminId: user._id,
      travelerId: args.travelerId,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      customerDocument: args.customerDocument,
      reservationDate: bookingDateTimestamp,
      reservationData: {
        startDate: args.reservationData?.startDate,
        endDate: args.reservationData?.endDate,
        guests: args.reservationData?.guests,
        specialRequests: args.reservationData?.specialRequests,
        assetSpecific: args.reservationData || {},
      },
      totalAmount: args.totalAmount,
      status: initialStatus,
      paymentStatus: args.paymentStatus || "pending",
      paymentMethod: args.paymentMethod || "deferred",
      createdBy: user._id,
      createdByName: user.name || user.email || identity.email || "Admin",
      createdMethod: args.createdMethod || "admin_direct",
      notes: args.notes,
      sendNotifications: args.sendNotifications ?? true,
      assetSpecific: args.reservationData || {},
      confirmationCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    // If auto-confirming, trigger confirmation process
    if (args.autoConfirm) {
      await ctx.scheduler.runAfter(
        0,
        internal.domains.adminReservations.mutations.confirmAdminReservationInternal,
        {
          reservationId,
          assetName: (asset as any).name || (asset as any).title || "Asset",
        }
      );
    }

    return {
      reservationId,
      confirmationCode,
      requiresPayment: args.paymentMethod === "card" && args.totalAmount > 0,
      paymentMethod: args.paymentMethod,
    };
  },
});

// Update admin reservation
export const updateAdminReservation = mutation({
  args: UpdateAdminReservationArgs as any,
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

    // Get existing reservation
    const existingReservationDoc = await ctx.db.get(args.id);
    if (!existingReservationDoc) {
      throw new Error("Reservation not found");
    }
    
    // Ensure it's an admin reservation document
    const existingReservation = existingReservationDoc as any;
    if (!existingReservation.isActive) {
      throw new Error("Reservation not found");
    }

    // Check permissions
    if (user.role === "partner" && existingReservation.partnerId !== user._id) {
      throw new Error("Access denied");
    }
    if (user.role === "employee") {
      if (!user.organizationId || existingReservation.organizationId !== user.organizationId) {
        throw new Error("Access denied");
      }
    }

    const now = Date.now();
    const changes: Record<string, any> = {};
    const changeDescriptions: string[] = [];

    // Track changes
    if (args.reservationData) {
      changes.reservationData = args.reservationData;
      changeDescriptions.push("dados da reserva atualizados");
    }
    if (args.paymentStatus && args.paymentStatus !== existingReservation.paymentStatus) {
      changes.paymentStatus = args.paymentStatus;
      changeDescriptions.push(`status do pagamento alterado para ${args.paymentStatus}`);
    }
    if (args.totalAmount && args.totalAmount !== existingReservation.totalAmount) {
      changes.totalAmount = args.totalAmount;
      changeDescriptions.push(`valor total alterado para R$ ${args.totalAmount}`);
    }
    if (args.paidAmount !== undefined) {
      changes.paidAmount = args.paidAmount;
      changeDescriptions.push(`valor pago alterado para R$ ${args.paidAmount}`);
    }
    if (args.paymentMethod) {
      changes.paymentMethod = args.paymentMethod;
      changeDescriptions.push(`método de pagamento alterado para ${args.paymentMethod}`);
    }
    if (args.paymentNotes) {
      changes.paymentNotes = args.paymentNotes;
      changeDescriptions.push("notas de pagamento adicionadas");
    }
    if (args.status && args.status !== existingReservation.status) {
      changes.status = args.status;
      changeDescriptions.push(`status alterado para ${args.status}`);
    }
    if (args.adminNotes) {
      changes.adminNotes = args.adminNotes;
      changeDescriptions.push("notas administrativas adicionadas");
    }
    if (args.customerNotes) {
      changes.customerNotes = args.customerNotes;
      changeDescriptions.push("notas do cliente adicionadas");
    }
    if (args.internalFlags) {
      changes.internalFlags = args.internalFlags;
      changeDescriptions.push("flags internas atualizadas");
    }

    // Update reservation
    await ctx.db.patch(args.id, {
      ...changes,
      lastModifiedBy: user._id,
      updatedAt: now,
    });

    // Create change history record
    if (changeDescriptions.length > 0) {
      await ctx.db.insert("reservationChangeHistory", {
        reservationId: args.id,
        reservationType: "admin_reservation",
        changeType: "updated",
        changeDescription: `Reserva atualizada: ${changeDescriptions.join(", ")}`,
        changedBy: user._id,
        changedByRole: user.role || "unknown",
        changeReason: args.changeReason,
        customerNotified: false,
        notificationSent: false,
        timestamp: now,
        createdAt: now,
      });

      // Notify traveler of significant changes
      const shouldNotifyTraveler = args.status || args.paymentStatus || args.totalAmount;
      if (shouldNotifyTraveler) {
        await ctx.db.insert("notifications", {
          userId: existingReservation.travelerId,
          type: "admin_reservation_updated",
          title: "Reserva Atualizada",
          message: `Sua reserva foi atualizada: ${changeDescriptions.join(", ")}`,
          relatedId: args.id,
          relatedType: "admin_reservation",
          isRead: false,
          data: {
            confirmationCode: existingReservation.confirmationCode,
            assetType: existingReservation.assetType,
            bookingType: existingReservation.assetType,
            partnerName: user.name || user.email,
          },
          createdAt: now,
        });
      }
    }

    return args.id;
  },
});

// Cancel admin reservation
export const cancelAdminReservation = mutation({
  args: {
    id: v.id("adminReservations"),
    reason: v.string(),
    notifyCustomer: v.boolean(),
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

    const reservation = await ctx.db.get(args.id);
    if (!reservation || !reservation.isActive) {
      throw new Error("Reservation not found");
    }

    // Check permissions
    if (user.role === "partner" && reservation.partnerId !== user._id) {
      throw new Error("Access denied");
    }
    if (user.role === "employee") {
      if (!user.organizationId || reservation.organizationId !== user.organizationId) {
        throw new Error("Access denied");
      }
    }

    const now = Date.now();

    // Update reservation status
    await ctx.db.patch(args.id, {
      status: "cancelled",
      paymentStatus: "cancelled",
      lastModifiedBy: user._id,
      updatedAt: now,
    });

    // Create change history record
    await ctx.db.insert("reservationChangeHistory", {
      reservationId: args.id,
      reservationType: "admin_reservation",
      changeType: "cancelled",
      changeDescription: `Reserva cancelada: ${args.reason}`,
      changedBy: user._id,
      changedByRole: user.role || "unknown",
      changeReason: args.reason,
      customerNotified: args.notifyCustomer,
      notificationSent: false,
      timestamp: now,
      createdAt: now,
    });

    // Notify traveler if requested
    if (args.notifyCustomer) {
      await ctx.db.insert("notifications", {
        userId: reservation.travelerId,
        type: "admin_reservation_cancelled",
        title: "Reserva Cancelada",
        message: `Sua reserva foi cancelada. Motivo: ${args.reason}`,
        relatedId: args.id,
        relatedType: "admin_reservation",
        isRead: false,
        data: {
          confirmationCode: reservation.confirmationCode,
          assetType: reservation.assetType,
          bookingType: reservation.assetType,
          partnerName: user.name || user.email,
        },
        createdAt: now,
      });
    }

    return args.id;
  },
});

// Confirm admin reservation (manual confirmation)
export const confirmAdminReservation = mutation({
  args: {
    id: v.id("adminReservations"),
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

    // Check permissions
    const hasAccess = ["master", "partner", "employee"].includes(user.role || "");
    if (!hasAccess) {
      throw new Error("Insufficient permissions");
    }

    const reservation = await ctx.db.get(args.id);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (reservation.status !== "draft") {
      throw new Error("Only draft reservations can be confirmed");
    }

    if (!reservation.customerName) {
      throw new Error("Customer name is required to confirm a reservation");
    }
    if (!reservation.reservationDate) {
      throw new Error("Reservation date is required to confirm a reservation");
    }
    const bookingDate = new Date(reservation.reservationDate);
    const confirmationCode = generateConfirmationCode(bookingDate, reservation.customerName);

    // Update status to confirmed
    await ctx.db.patch(args.id, {
      status: "confirmed",
      confirmationCode,
      updatedAt: Date.now(),
    });

    // Get asset name
    const asset = await ctx.db.get(reservation.assetId as any);
    const assetName = (asset as any)?.name || (asset as any)?.title || "Asset";

    // Trigger confirmation process
    await ctx.scheduler.runAfter(
      0,
      internal.domains.adminReservations.mutations.confirmAdminReservationInternal,
      {
        reservationId: args.id,
        assetName,
      }
    );

    return { success: true, confirmationCode };
  },
});

// Create auto-confirmation settings
export const createAutoConfirmationSettings = mutation({
  args: CreateAutoConfirmationSettingsArgs,
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

    // Determine partner and organization
    let partnerId = user._id;
    let organizationId = user.organizationId;

    if (user.role === "employee") {
      partnerId = user.partnerId || user._id;
      organizationId = user.organizationId;
    } else if (user.role === "partner") {
      partnerId = user._id;
    }

    const now = Date.now();

    const settingsId = await ctx.db.insert("autoConfirmationSettings", {
      assetId: args.assetId,
      assetType: args.assetType,
      partnerId,
      organizationId,
      enabled: args.enabled,
      name: args.name,
      priority: args.priority,
      conditions: args.conditions,
      notifications: args.notifications,
      overrideSettings: args.overrideSettings,
      statistics: {
        totalApplied: 0,
        totalOverridden: 0,
        successRate: 0,
      },
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });

    return settingsId;
  },
});

// Update auto-confirmation settings
export const updateAutoConfirmationSettings = mutation({
  args: {
    id: v.id("autoConfirmationSettings"),
    enabled: v.optional(v.boolean()),
    name: v.optional(v.string()),
    priority: v.optional(v.number()),
    conditions: v.optional(v.any()),
    notifications: v.optional(v.any()),
    overrideSettings: v.optional(v.any()),
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

    const settings = await ctx.db.get(args.id);
    if (!settings || !settings.isActive) {
      throw new Error("Settings not found");
    }

    // Check permissions
    if (user.role === "partner" && settings.partnerId !== user._id) {
      throw new Error("Access denied");
    }
    if (user.role === "employee") {
      if (!user.organizationId || settings.organizationId !== user.organizationId) {
        throw new Error("Access denied");
      }
    }

    const updates: Record<string, any> = {
      lastModifiedBy: user._id,
      updatedAt: Date.now(),
    };

    if (args.enabled !== undefined) updates.enabled = args.enabled;
    if (args.name) updates.name = args.name;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.conditions) updates.conditions = args.conditions;
    if (args.notifications) updates.notifications = args.notifications;
    if (args.overrideSettings) updates.overrideSettings = args.overrideSettings;

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

// Delete auto-confirmation settings
export const deleteAutoConfirmationSettings = mutation({
  args: { id: v.id("autoConfirmationSettings") },
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

    const settings = await ctx.db.get(args.id);
    if (!settings || !settings.isActive) {
      throw new Error("Settings not found");
    }

    // Check permissions
    if (user.role === "partner" && settings.partnerId !== user._id) {
      throw new Error("Access denied");
    }
    if (user.role === "employee") {
      if (!user.organizationId || settings.organizationId !== user.organizationId) {
        throw new Error("Access denied");
      }
    }

    // Soft delete
    await ctx.db.patch(args.id, {
      isActive: false,
      deletedAt: Date.now(),
      deletedBy: user._id,
    });

    return args.id;
  },
});

/**
 * Process confirmed admin reservation - generate voucher and send emails
 * This is an internal mutation called after reservation creation
 */
export const processConfirmedReservation = internalMutation({
  args: {
    reservationId: v.id("adminReservations"),
    adminId: v.id("users"),
    assetName: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    const traveler = await ctx.db.get(reservation.travelerId);
    if (!traveler) {
      throw new Error("Traveler not found");
    }

    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      throw new Error("Admin not found");
    }

    // Determine expiration date based on reservation data
    const expiresAt = reservation.reservationData.endDate || 
                     reservation.reservationData.startDate ||
                     Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Generate voucher
    const voucherId = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
      bookingId: reservation._id,
      bookingType: reservation.assetType as any,
      partnerId: admin._id,
      customerId: reservation.travelerId,
      expiresAt,
    });

    // Get voucher details
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Failed to create voucher");
    }

    // Send confirmation notification
    await ctx.db.insert("notifications", {
      userId: reservation.travelerId,
      type: "admin_reservation_confirmed",
      title: "Reserva Confirmada",
      message: `Sua reserva para ${args.assetName} foi confirmada. Código: ${reservation.confirmationCode}`,
      relatedId: reservation._id,
      relatedType: "admin_reservation",
      isRead: false,
      data: {
        confirmationCode: reservation.confirmationCode,
        assetType: reservation.assetType,
        assetName: args.assetName,
        partnerName: admin.name || admin.email,
      },
      createdAt: Date.now(),
    });

    // Schedule email sending
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingConfirmationEmail, {
      customerEmail: traveler.email || "",
      customerName: traveler.name || "",
      assetName: args.assetName,
      bookingType: reservation.assetType as any,
      confirmationCode: reservation.confirmationCode,
      bookingDate: reservation.reservationData.startDate 
        ? new Date(reservation.reservationData.startDate).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR'),
      totalPrice: reservation.totalAmount,
      partnerName: admin.name || admin.email,
      partnerEmail: admin.email,
      bookingDetails: reservation.reservationData.assetSpecific || {},
    });

    // Send voucher email
    await ctx.scheduler.runAfter(1000, internal.domains.email.actions.sendVoucherEmail, {
      customerEmail: traveler.email || "",
      customerName: traveler.name || "",
      assetName: args.assetName,
      bookingType: reservation.assetType as any,
      confirmationCode: reservation.confirmationCode,
      voucherNumber: (voucher as any).voucherNumber,
      bookingDate: reservation.reservationData.startDate 
        ? new Date(reservation.reservationData.startDate).toLocaleDateString('pt-BR')
        : undefined,
      totalPrice: reservation.totalAmount,
      partnerName: admin.name,
      attachPDF: true,
      bookingDetails: reservation.reservationData.assetSpecific || {},
    });

    return voucherId;
  },
});

// Internal mutation to handle the confirmation process
export const confirmAdminReservationInternal = internalMutation({
  args: {
    reservationId: v.id("adminReservations"),
    assetName: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation || reservation.status !== "confirmed") return;

    // Get admin and traveler details
    const admin = await ctx.db.get(reservation.createdBy);
    const traveler = await ctx.db.get(reservation.travelerId);

    // Create voucher
    const voucherCode = `VCH-${format(new Date(), "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const voucherId = await ctx.db.insert("vouchers", {
      voucherNumber: voucherCode,
      code: voucherCode,
      qrCode: `${process.env.NEXT_PUBLIC_APP_URL}/voucher/${voucherCode}`,
      bookingId: reservation._id,
      bookingType: "admin_reservation",
      type: "admin_reservation",
      relatedBookingId: reservation._id,
      userId: reservation.travelerId,
      assetType: reservation.assetType,
      assetId: reservation.assetId,
      details: {
        reservationId: reservation._id,
        assetName: args.assetName,
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        customerPhone: reservation.customerPhone,
        confirmationCode: reservation.confirmationCode || "",
        bookingDate: reservation.reservationDate,
        totalAmount: reservation.totalAmount,
        paymentStatus: reservation.paymentStatus,
        createdByAdmin: admin?.name || admin?.email || "Admin",
      },
      status: "active",
      generatedAt: Date.now(),
      validFrom: Date.now(),
      validUntil: reservation.reservationDate ? new Date(reservation.reservationDate).getTime() + 30 * 24 * 60 * 60 * 1000 : undefined, // 30 days after booking
      emailSent: false,
      downloadCount: 0,
      verificationToken: Math.random().toString(36).substring(2, 15),
      scanCount: 0,
      partnerId: admin?._id || reservation.createdBy,
      customerId: reservation.travelerId,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update reservation with voucher
    await ctx.db.patch(reservation._id, {
      voucherId,
      updatedAt: Date.now(),
    });

    // Send confirmation notification
    await ctx.db.insert("notifications", {
      userId: reservation.travelerId,
      type: "admin_reservation_confirmed",
      title: "Reserva Confirmada",
      message: `Sua reserva para ${args.assetName} foi confirmada. Código: ${reservation.confirmationCode}`,
      relatedId: reservation._id,
      relatedType: "admin_reservation",
      isRead: false,
      data: {
        confirmationCode: reservation.confirmationCode,
        assetType: reservation.assetType,
        assetName: args.assetName,
        partnerName: admin?.name || admin?.email,
      },
      createdAt: Date.now(),
    });

    // Send voucher email
    await ctx.scheduler.runAfter(1000, internal.domains.email.actions.sendVoucherEmail, {
      customerEmail: reservation.customerEmail,
      customerName: reservation.customerName,
      voucherCode,
      assetName: args.assetName,
      bookingType: reservation.assetType,
      confirmationCode: reservation.confirmationCode || "",
      bookingDate: reservation.reservationDate ? format(new Date(reservation.reservationDate), "dd/MM/yyyy", { locale: ptBR }) : undefined,
      voucherUrl: `${process.env.NEXT_PUBLIC_APP_URL}/voucher/${voucherCode}`,
      voucherId,
    });

    // If payment is required via card, create payment intent and send payment link
    if (reservation.paymentMethod === "card" && reservation.totalAmount > 0) {
      await ctx.scheduler.runAfter(2000, internal.domains.adminReservations.actions.createPaymentIntentAndSendLink, {
        reservationId: reservation._id,
        assetName: args.assetName,
      });
    }
  },
});

// Update payment info
export const updatePaymentInfo = internalMutation({
  args: {
    reservationId: v.id("adminReservations"),
    stripePaymentIntentId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    stripePaymentLinkUrl: v.optional(v.string()),
    paymentDueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.stripePaymentIntentId !== undefined) {
      updateData.stripePaymentIntentId = args.stripePaymentIntentId;
    }
    if (args.stripePaymentLinkId !== undefined) {
      updateData.stripePaymentLinkId = args.stripePaymentLinkId;
    }
    if (args.stripePaymentLinkUrl !== undefined) {
      updateData.stripePaymentLinkUrl = args.stripePaymentLinkUrl;
    }
    if (args.paymentDueDate !== undefined) {
      updateData.paymentDueDate = args.paymentDueDate;
    }

    await ctx.db.patch(args.reservationId, updateData);
  },
});