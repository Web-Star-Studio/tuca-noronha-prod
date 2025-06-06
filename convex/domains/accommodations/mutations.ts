import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutationWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, hasAssetAccess } from "../../domains/rbac/utils";
import type { AccommodationUpdateInput } from "./types";

/**
 * Create a new accommodation
 */
export const create = mutationWithRole(["partner", "master"])({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    description_long: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      neighborhood: v.string(),
      coordinates: v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
    }),
    phone: v.string(),
    website: v.optional(v.string()),
    type: v.string(),
    checkInTime: v.string(),
    checkOutTime: v.string(),
    pricePerNight: v.number(),
    currency: v.string(),
    discountPercentage: v.optional(v.number()),
    taxes: v.optional(v.number()),
    cleaningFee: v.optional(v.number()),
    totalRooms: v.number(),
    maxGuests: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    beds: v.object({
      single: v.number(),
      double: v.number(),
      queen: v.number(),
      king: v.number(),
    }),
    area: v.number(),
    amenities: v.array(v.string()),
    houseRules: v.array(v.string()),
    cancellationPolicy: v.string(),
    petsAllowed: v.boolean(),
    smokingAllowed: v.boolean(),
    eventsAllowed: v.boolean(),
    minimumStay: v.number(),
    mainImage: v.string(),
    galleryImages: v.array(v.string()),
    rating: v.object({
      overall: v.number(),
      cleanliness: v.number(),
      location: v.number(),
      checkin: v.number(),
      value: v.number(),
      accuracy: v.number(),
      communication: v.number(),
      totalReviews: v.number(),
    }),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    tags: v.array(v.string()),
    partnerId: v.id("users"),
  },
  returns: v.id("accommodations"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const role = await getCurrentUserRole(ctx);
    
    // Only masters can create accommodations for other users
    if (role !== "master" && args.partnerId !== currentUserId) {
      throw new Error("Você só pode criar hospedagens para si mesmo");
    }
    
    // Check if slug is unique
    const existingAccommodation = await ctx.db
      .query("accommodations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    
    if (existingAccommodation) {
      throw new Error("Uma hospedagem com este slug já existe");
    }
    
    const accommodationId = await ctx.db.insert("accommodations", {
      ...args,
      totalRooms: BigInt(args.totalRooms),
      maxGuests: BigInt(args.maxGuests),
      bedrooms: BigInt(args.bedrooms),
      bathrooms: BigInt(args.bathrooms),
      minimumStay: BigInt(args.minimumStay),
      beds: {
        single: BigInt(args.beds.single),
        double: BigInt(args.beds.double),
        queen: BigInt(args.beds.queen),
        king: BigInt(args.beds.king),
      },
      rating: {
        ...args.rating,
        totalReviews: BigInt(args.rating.totalReviews),
      },
    });
    
    return accommodationId;
  },
});

/**
 * Update an accommodation
 */
export const update = mutationWithRole(["partner", "employee", "master"])({
  args: {
    id: v.id("accommodations"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    description_long: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      neighborhood: v.string(),
      coordinates: v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
    })),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    type: v.optional(v.string()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    pricePerNight: v.optional(v.number()),
    currency: v.optional(v.string()),
    discountPercentage: v.optional(v.number()),
    taxes: v.optional(v.number()),
    cleaningFee: v.optional(v.number()),
    totalRooms: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    beds: v.optional(v.object({
      single: v.number(),
      double: v.number(),
      queen: v.number(),
      king: v.number(),
    })),
    area: v.optional(v.number()),
    amenities: v.optional(v.array(v.string())),
    houseRules: v.optional(v.array(v.string())),
    cancellationPolicy: v.optional(v.string()),
    petsAllowed: v.optional(v.boolean()),
    smokingAllowed: v.optional(v.boolean()),
    eventsAllowed: v.optional(v.boolean()),
    minimumStay: v.optional(v.number()),
    mainImage: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    rating: v.optional(v.object({
      overall: v.number(),
      cleanliness: v.number(),
      location: v.number(),
      checkin: v.number(),
      value: v.number(),
      accuracy: v.number(),
      communication: v.number(),
      totalReviews: v.number(),
    })),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    partnerId: v.optional(v.id("users")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if accommodation exists
    const accommodation = await ctx.db.get(args.id);
    if (!accommodation) {
      throw new Error("Hospedagem não encontrada");
    }
    
    // Check RBAC permissions
    const hasAccess = await hasAssetAccess(ctx, args.id, "accommodations", "edit");
    if (!hasAccess) {
      throw new Error("Acesso negado para editar esta hospedagem");
    }
    
    // Check if slug is unique (if being updated)
    if (args.slug && args.slug !== accommodation.slug) {
      const existingAccommodation = await ctx.db
        .query("accommodations")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .unique();
      
      if (existingAccommodation) {
        throw new Error("Uma hospedagem com este slug já existe");
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Copy basic fields
    const basicFields = [
      'name', 'slug', 'description', 'description_long', 'address', 'phone', 'website',
      'type', 'checkInTime', 'checkOutTime', 'pricePerNight', 'currency', 'discountPercentage',
      'taxes', 'cleaningFee', 'area', 'amenities', 'houseRules', 'cancellationPolicy',
      'petsAllowed', 'smokingAllowed', 'eventsAllowed', 'mainImage', 'galleryImages',
      'isActive', 'isFeatured', 'tags', 'partnerId'
    ];
    
    basicFields.forEach(field => {
      if (args[field as keyof typeof args] !== undefined) {
        updateData[field] = args[field as keyof typeof args];
      }
    });
    
    // Handle BigInt fields
    if (args.totalRooms !== undefined) updateData.totalRooms = BigInt(args.totalRooms);
    if (args.maxGuests !== undefined) updateData.maxGuests = BigInt(args.maxGuests);
    if (args.bedrooms !== undefined) updateData.bedrooms = BigInt(args.bedrooms);
    if (args.bathrooms !== undefined) updateData.bathrooms = BigInt(args.bathrooms);
    if (args.minimumStay !== undefined) updateData.minimumStay = BigInt(args.minimumStay);
    
    if (args.beds) {
      updateData.beds = {
        single: BigInt(args.beds.single),
        double: BigInt(args.beds.double),
        queen: BigInt(args.beds.queen),
        king: BigInt(args.beds.king),
      };
    }
    
    if (args.rating) {
      updateData.rating = {
        ...args.rating,
        totalReviews: BigInt(args.rating.totalReviews),
      };
    }
    
    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

/**
 * Delete an accommodation
 */
export const remove = mutationWithRole(["partner", "master"])({
  args: { id: v.id("accommodations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if accommodation exists
    const accommodation = await ctx.db.get(args.id);
    if (!accommodation) {
      throw new Error("Hospedagem não encontrada");
    }
    
    // Check RBAC permissions
    const hasAccess = await hasAssetAccess(ctx, args.id, "accommodations", "delete");
    if (!hasAccess) {
      throw new Error("Acesso negado para excluir esta hospedagem");
    }
    
    // Check if there are active bookings
    const activeBookings = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_accommodation", (q) => q.eq("accommodationId", args.id))
      .filter((q) => q.neq(q.field("status"), "canceled"))
      .collect();
    
    if (activeBookings.length > 0) {
      throw new Error("Não é possível excluir uma hospedagem com reservas ativas. Cancele todas as reservas primeiro.");
    }
    
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Toggle featured status
 */
export const toggleFeatured = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("accommodations"),
    featured: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if accommodation exists
    const accommodation = await ctx.db.get(args.id);
    if (!accommodation) {
      throw new Error("Hospedagem não encontrada");
    }
    
    // Check RBAC permissions
    const hasAccess = await hasAssetAccess(ctx, args.id, "accommodations", "manage");
    if (!hasAccess) {
      throw new Error("Acesso negado para alterar o destaque desta hospedagem");
    }
    
    await ctx.db.patch(args.id, { isFeatured: args.featured });
    return null;
  },
});

/**
 * Toggle active status
 */
export const toggleActive = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("accommodations"),
    active: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if accommodation exists
    const accommodation = await ctx.db.get(args.id);
    if (!accommodation) {
      throw new Error("Hospedagem não encontrada");
    }
    
    // Check RBAC permissions
    const hasAccess = await hasAssetAccess(ctx, args.id, "accommodations", "manage");
    if (!hasAccess) {
      throw new Error("Acesso negado para alterar o status desta hospedagem");
    }
    
    await ctx.db.patch(args.id, { isActive: args.active });
    return null;
  },
}); 