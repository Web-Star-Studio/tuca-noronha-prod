import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../../_generated/dataModel";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../rbac/utils";
import { generateConfirmationCode } from "../bookings/utils";

// Create a new vehicle
export const createVehicle = mutation({
  args: {
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
    estimatedPricePerDay: v.number(),
    netRate: v.optional(v.number()),
    adminRating: v.optional(v.number()),
    isFree: v.optional(v.boolean()),
    supplierId: v.optional(v.id("suppliers")),
    description: v.optional(v.string()),
    features: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.string(),
  },
  returns: v.id("vehicles"),
  handler: async (ctx, args) => {
    // Get current user and role for RBAC
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      throw new Error("Não autorizado. Faça o login para continuar.");
    }
    
    // Only partners and admins can create vehicles
    if (role !== "partner" && role !== "master") {
      throw new Error("Acesso negado. Apenas partners podem criar veículos.");
    }
    
    const currentTime = Date.now();
    
    // Determine organizationId: for partners, use their first organization
    let orgId: string | null = null;
    if (role === "partner" && currentUserId) {
      const org = await ctx.db
        .query("partnerOrganizations")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .first();
      orgId = org?._id ?? null;
    }
    const vehicleId = await ctx.db.insert("vehicles", {
      ...args,
      netRate: args.netRate ?? args.estimatedPricePerDay,
      createdAt: currentTime,
      updatedAt: currentTime,
      ownerId: currentUserId, // Set owner to current user
      organizationId: orgId || undefined, // Convert null to undefined to fix type error
    });
    
    // Se existe uma organização, adiciona o veículo à tabela partnerAssets
    if (orgId) {
      await ctx.db.insert("partnerAssets", {
        organizationId: orgId as any,
        assetId: vehicleId.toString(),
        assetType: "vehicles",
        partnerId: currentUserId,
        isActive: true,
        createdAt: currentTime,
        updatedAt: currentTime,
      });
    }
    
    return vehicleId;
  },
});

// Update an existing vehicle
export const updateVehicle = mutation({
  args: {
    id: v.id("vehicles"),
    name: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    category: v.optional(v.string()),
    year: v.optional(v.number()),
    licensePlate: v.optional(v.string()),
    color: v.optional(v.string()),
    seats: v.optional(v.number()),
    fuelType: v.optional(v.string()),
    transmission: v.optional(v.string()),
    estimatedPricePerDay: v.optional(v.number()),
    netRate: v.optional(v.number()),
    adminRating: v.optional(v.number()),
    isFree: v.optional(v.boolean()),
    supplierId: v.optional(v.id("suppliers")),
    description: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("vehicles"),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    
    // Get current user and role for RBAC
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      throw new Error("Não autorizado. Faça o login para continuar.");
    }
    
    // Fetch existing vehicle to check authorization
    const existingVehicle = await ctx.db.get(id);
    
    if (!existingVehicle) {
      throw new Error("Veículo não encontrado");
    }
    
    // Check ownership - only owners and admins can update
    if (role === "partner") {
      if (!existingVehicle.ownerId || existingVehicle.ownerId.toString() !== currentUserId.toString()) {
        throw new Error("Acesso negado. Você só pode editar seus próprios veículos.");
      }
    } else if (role !== "master") {
      throw new Error("Acesso negado. Permissões insuficientes.");
    }
    
    // Update the vehicle
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});

// Delete a vehicle
export const deleteVehicle = mutation({
  args: {
    id: v.id("vehicles"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Get current user and role for RBAC
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    if (!currentUserId) {
      throw new Error("Não autorizado. Faça o login para continuar.");
    }
    
    // Fetch existing vehicle to check authorization
    const existingVehicle = await ctx.db.get(args.id);
    
    if (!existingVehicle) {
      throw new Error("Veículo não encontrado");
    }
    
    // Check ownership - only owners and admins can delete
    if (role === "partner") {
      if (!existingVehicle.ownerId || existingVehicle.ownerId.toString() !== currentUserId.toString()) {
        throw new Error("Acesso negado. Você só pode deletar seus próprios veículos.");
      }
    } else if (role !== "master") {
      throw new Error("Acesso negado. Permissões insuficientes.");
    }
    
    // Check if vehicle has bookings before deletion
    const bookings = await ctx.db
      .query("vehicleBookings")
      .withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.id))
      .filter((q) => 
        q.or(
          q.eq("status", "pending"),
          q.eq("status", "confirmed")
        )
      )
      .collect();
    
    if (bookings.length > 0) {
      throw new Error("Este veículo possui reservas pendentes ou confirmadas e não pode ser removido");
    }
    
    // Remove from partnerAssets if exists
    const partnerAsset = await ctx.db
      .query("partnerAssets")
      .withIndex("by_asset", (q) => q.eq("assetId", args.id.toString()).eq("assetType", "vehicles"))
      .first();
    
    if (partnerAsset) {
      await ctx.db.delete(partnerAsset._id);
    }
    
    // Delete the vehicle
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Create a vehicle booking
export const createVehicleBooking = mutation({
  args: {
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
    customerInfo: v.optional(v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    })),
    couponCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
    finalAmount: v.optional(v.number()),
  },
  returns: v.id("vehicleBookings"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Não autorizado. Faça o login para continuar.");
    }
    
    // Fetch vehicle to check availability
    const vehicle = await ctx.db.get(args.vehicleId);
    
    if (!vehicle) {
      throw new Error("Veículo não encontrado");
    }
    
    if (vehicle.status !== "available") {
      throw new Error("Este veículo não está disponível para reserva");
    }
    
    // Check for overlapping bookings using by_vehicleId index and filtering for date overlap
    const overlappingBookings = await ctx.db
      .query("vehicleBookings")
      .withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.vehicleId))
      .filter((q) => 
        q.or(
          q.eq("status", "pending"),
          q.eq("status", "confirmed")
        )
      )
      .filter((q) => 
        q.or(
          // Booking start date falls within an existing booking
          q.and(
            q.gte(q.field("startDate"), args.startDate),
            q.lte(q.field("startDate"), args.endDate)
          ),
          // Booking end date falls within an existing booking
          q.and(
            q.gte(q.field("endDate"), args.startDate),
            q.lte(q.field("endDate"), args.endDate)
          ),
          // Booking encompasses an existing booking
          q.and(
            q.lte(q.field("startDate"), args.startDate),
            q.gte(q.field("endDate"), args.endDate)
          )
        )
      )
      .collect();
    
    if (overlappingBookings.length > 0) {
      throw new Error("Já existe uma reserva para este veículo no período selecionado");
    }
    
    // Create booking
    const currentTime = Date.now();
    
    // Generate confirmation code - convert timestamp to date string
    const startDateString = new Date(args.startDate).toISOString().split('T')[0];
    const customerName = args.customerInfo?.name || 'Guest';
    const confirmationCode = generateConfirmationCode(startDateString, customerName);
    
    // Calcular número de dias e preço estimado
    const days = Math.ceil((args.endDate - args.startDate) / (1000 * 60 * 60 * 24));
    const estimatedPrice = vehicle.estimatedPricePerDay * days;
    
    const bookingId = await ctx.db.insert("vehicleBookings", {
      ...args,
      estimatedPrice,
      requestedAt: currentTime,
      confirmationCode,
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    
    // Update vehicle status if booking is confirmed
    if (args.status === "confirmed") {
      await ctx.db.patch(args.vehicleId, {
        status: "rented",
        updatedAt: currentTime,
      });
    }
    
    return bookingId;
  },
});

// Update a vehicle booking
export const updateVehicleBooking = mutation({
  args: {
    id: v.id("vehicleBookings"),
    status: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("vehicleBookings"),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Não autorizado. Faça o login para continuar.");
    }
    
    // Fetch existing booking
    const existingBooking = await ctx.db.get(id);
    
    if (!existingBooking) {
      throw new Error("Reserva não encontrada");
    }
    
    // Update the booking
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
    
    // Update vehicle status based on booking status changes
    if (args.status) {
      const vehicle = await ctx.db.get(existingBooking.vehicleId);
      
      if (!vehicle) {
        throw new Error("Veículo associado não encontrado");
      }
      
      let newVehicleStatus = vehicle.status;
      
      // Adjust vehicle status based on booking status change
      if (args.status === "confirmed" && existingBooking.status !== "confirmed") {
        newVehicleStatus = "rented";
      } else if (args.status === "completed" && existingBooking.status !== "completed") {
        newVehicleStatus = "available";
      } else if (args.status === "canceled" && existingBooking.status === "confirmed") {
        newVehicleStatus = "available";
      }
      
      if (newVehicleStatus !== vehicle.status) {
        await ctx.db.patch(existingBooking.vehicleId, {
          status: newVehicleStatus,
          updatedAt: Date.now(),
        });
      }
    }
    
    return id;
  },
});

// Sync existing vehicles with partnerAssets table
export const syncVehiclesWithOrganizations = mutation({
  args: {},
  returns: v.object({
    synced: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const role = await getCurrentUserRole(ctx);
    
    if (role !== "master") {
      throw new Error("Apenas masters podem executar esta sincronização");
    }
    
    const vehicles = await ctx.db.query("vehicles").collect();
    let synced = 0;
    const errors: string[] = [];
    
    for (const vehicle of vehicles) {
      try {
        // Verifica se já existe na tabela partnerAssets
        const existingAsset = await ctx.db
          .query("partnerAssets")
          .withIndex("by_asset", (q) => q.eq("assetId", vehicle._id.toString()).eq("assetType", "vehicles"))
          .first();
        
        if (!existingAsset && vehicle.ownerId) {
          // Busca a organização do owner
          const organization = await ctx.db
            .query("partnerOrganizations")
            .withIndex("by_partner", (q) => q.eq("partnerId", vehicle.ownerId!))
            .filter((q) => q.eq(q.field("type"), "rental_service"))
            .first();
          
          if (organization) {
            await ctx.db.insert("partnerAssets", {
              organizationId: organization._id,
              assetId: vehicle._id.toString(),
              assetType: "vehicles",
              partnerId: vehicle.ownerId,
              isActive: vehicle.status === "available",
              createdAt: vehicle.createdAt || Date.now(),
              updatedAt: Date.now(),
            });
            synced++;
          } else {
            errors.push(`Veículo ${vehicle.name} (${vehicle._id}) não possui organização de rental_service`);
          }
        }
      } catch (error) {
        errors.push(`Erro ao sincronizar veículo ${vehicle.name}: ${error}`);
      }
    }
    
    return { synced, errors };
  },
}); 
