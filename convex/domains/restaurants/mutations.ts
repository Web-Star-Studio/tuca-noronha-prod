import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutationWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId } from "../../domains/rbac";
import type { RestaurantUpdateInput } from "./types";

/**
 * Create a new restaurant
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
    cuisine: v.array(v.string()),
    priceRange: v.string(),
    diningStyle: v.string(),
    hours: v.object({
      Monday: v.array(v.string()),
      Tuesday: v.array(v.string()),
      Wednesday: v.array(v.string()),
      Thursday: v.array(v.string()),
      Friday: v.array(v.string()),
      Saturday: v.array(v.string()),
      Sunday: v.array(v.string()),
    }),
    features: v.array(v.string()),
    dressCode: v.optional(v.string()),
    paymentOptions: v.array(v.string()),
    parkingDetails: v.optional(v.string()),
    mainImage: v.string(),
    galleryImages: v.array(v.string()),
    menuImages: v.optional(v.array(v.string())),
    rating: v.object({
      overall: v.number(),
      food: v.number(),
      service: v.number(),
      ambience: v.number(),
      value: v.number(),
      noiseLevel: v.string(),
      totalReviews: v.number(),
    }),
    acceptsReservations: v.boolean(),
    maximumPartySize: v.number(),
    tags: v.array(v.string()),
    executiveChef: v.optional(v.string()),
    privatePartyInfo: v.optional(v.string()),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify that the partner creating the restaurant is the logged in user (unless master)
    const role = await getCurrentUserRole(ctx);
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (role === "partner") {
      if (!currentUserId || currentUserId.toString() !== args.partnerId.toString()) {
        throw new Error("Unauthorized: partners can only create restaurants for themselves");
      }
    }
    // Convert numbers to appropriate types for the database
    const maximumPartySize = BigInt(args.maximumPartySize);
    const totalReviews = BigInt(args.rating.totalReviews);
    
    // Creating the restaurant
    const restaurantId = await ctx.db.insert("restaurants", {
      ...args,
      address: {
        ...args.address,
        coordinates: {
          latitude: args.address.coordinates.latitude,
          longitude: args.address.coordinates.longitude,
        },
      },
      rating: {
        ...args.rating,
        overall: args.rating.overall,
        food: args.rating.food,
        service: args.rating.service,
        ambience: args.rating.ambience,
        value: args.rating.value,
        totalReviews,
      },
      maximumPartySize,
    });
    
    return restaurantId;
  },
});

/**
 * Update an existing restaurant
 */
export const update = mutationWithRole(["partner", "master"])({
  args: {
    id: v.id("restaurants"),
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
    cuisine: v.optional(v.array(v.string())),
    priceRange: v.optional(v.string()),
    diningStyle: v.optional(v.string()),
    hours: v.optional(v.object({
      Monday: v.array(v.string()),
      Tuesday: v.array(v.string()),
      Wednesday: v.array(v.string()),
      Thursday: v.array(v.string()),
      Friday: v.array(v.string()),
      Saturday: v.array(v.string()),
      Sunday: v.array(v.string()),
    })),
    features: v.optional(v.array(v.string())),
    dressCode: v.optional(v.string()),
    paymentOptions: v.optional(v.array(v.string())),
    parkingDetails: v.optional(v.string()),
    mainImage: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    menuImages: v.optional(v.array(v.string())),
    rating: v.optional(v.object({
      overall: v.number(),
      food: v.number(),
      service: v.number(),
      ambience: v.number(),
      value: v.number(),
      noiseLevel: v.string(),
      totalReviews: v.number(),
    })),
    acceptsReservations: v.optional(v.boolean()),
    maximumPartySize: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    executiveChef: v.optional(v.string()),
    privatePartyInfo: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    partnerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot update restaurant not owned by user");
      }
    }
    const { id, maximumPartySize, rating, address, ...otherFields } = args;
    
    // Define a more specific type for the updates
    type Updates = {
      name?: string;
      slug?: string;
      description?: string;
      description_long?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        neighborhood: string;
        coordinates: {
          latitude: number;
          longitude: number;
        };
      };
      phone?: string;
      website?: string;
      cuisine?: string[];
      priceRange?: string;
      diningStyle?: string;
      hours?: {
        Monday: string[];
        Tuesday: string[];
        Wednesday: string[];
        Thursday: string[];
        Friday: string[];
        Saturday: string[];
        Sunday: string[];
      };
      features?: string[];
      dressCode?: string;
      paymentOptions?: string[];
      parkingDetails?: string;
      mainImage?: string;
      galleryImages?: string[];
      menuImages?: string[];
      rating?: {
        overall: number;
        food: number;
        service: number;
        ambience: number;
        value: number;
        noiseLevel: string;
        totalReviews: bigint;
      };
      acceptsReservations?: boolean;
      maximumPartySize?: bigint;
      tags?: string[];
      executiveChef?: string;
      privatePartyInfo?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      partnerId?: Id<"users">;
    };
    
    // Create an object with all updated fields
    const updates: Updates = {
      ...otherFields
    };
    
    // Handle address updates if provided
    if (address) {
      updates.address = {
        ...address
      };
    }
    
    // Convert number values to appropriate types if provided
    if (maximumPartySize !== undefined) {
      updates.maximumPartySize = BigInt(maximumPartySize);
    }
    
    if (rating !== undefined) {
      updates.rating = {
        ...rating,
        totalReviews: BigInt(rating.totalReviews)
      };
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete a restaurant
 */
export const remove = mutationWithRole(["partner", "master"])({
  args: { id: v.id("restaurants") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot delete restaurant not owned by user");
      }
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Toggle the featured status of a restaurant
 */
export const toggleFeatured = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("restaurants"), 
    isFeatured: v.boolean() 
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot update restaurant not owned by user");
      }
    }
    await ctx.db.patch(args.id, { isFeatured: args.isFeatured });
    return args.id;
  },
});

/**
 * Toggle the active status of a restaurant
 */
export const toggleActive = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("restaurants"), 
    isActive: v.boolean() 
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role === "partner") {
      const currentUserId = await getCurrentUserConvexId(ctx);
      const restaurant = await ctx.db.get(args.id);
      if (!restaurant || restaurant.partnerId.toString() !== currentUserId?.toString()) {
        throw new Error("Unauthorized: cannot update restaurant not owned by user");
      }
    }
    await ctx.db.patch(args.id, { isActive: args.isActive });
    return args.id;
  },
});

/**
 * Cria uma nova mesa no restaurante
 */
export const createTable = mutationWithRole(["partner", "master", "employee"])({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.string(),
    capacity: v.number(),
    location: v.string(),
    type: v.string(),
    shape: v.string(),
    isVip: v.boolean(),
    hasView: v.boolean(),
    notes: v.optional(v.string()),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  returns: v.id("restaurantTables"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se tem acesso ao restaurante
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    // Verificar permissões
    if (currentUserRole === "partner") {
      if (restaurant.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para adicionar mesas neste restaurante");
      }
    } else if (currentUserRole === "employee") {
      // Verificar se o employee tem acesso a este restaurante através das organizações
      const hasAccess = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", currentUserId))
        .filter((q) => {
          // Buscar organizações do partner dono do restaurante
          return q.eq(q.field("partnerId"), restaurant.partnerId);
        })
        .first();
      
      if (!hasAccess) {
        throw new Error("Você não tem permissão para adicionar mesas neste restaurante");
      }
    }

    const now = Date.now();

    const tableId = await ctx.db.insert("restaurantTables", {
      restaurantId: args.restaurantId,
      name: args.name,
      capacity: args.capacity,
      location: args.location,
      type: args.type,
      shape: args.shape,
      isActive: true,
      isVip: args.isVip,
      hasView: args.hasView,
      notes: args.notes,
      position: args.position,
      createdAt: now,
      updatedAt: now,
    });

    return tableId;
  },
});

/**
 * Atualiza uma mesa existente
 */
export const updateTable = mutationWithRole(["partner", "master", "employee"])({
  args: {
    tableId: v.id("restaurantTables"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    type: v.optional(v.string()),
    shape: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isVip: v.optional(v.boolean()),
    hasView: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se a mesa existe
    const table = await ctx.db.get(args.tableId);
    if (!table) {
      throw new Error("Mesa não encontrada");
    }

    // Verificar se tem acesso ao restaurante
    const restaurant = await ctx.db.get(table.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    // Verificar permissões
    if (currentUserRole === "partner") {
      if (restaurant.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para editar mesas neste restaurante");
      }
    } else if (currentUserRole === "employee") {
      // Verificar se o employee tem acesso a este restaurante através das organizações
      const hasAccess = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", currentUserId))
        .filter((q) => {
          // Buscar organizações do partner dono do restaurante
          return q.eq(q.field("partnerId"), restaurant.partnerId);
        })
        .first();
      
      if (!hasAccess) {
        throw new Error("Você não tem permissão para editar mesas neste restaurante");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.capacity !== undefined) updateData.capacity = args.capacity;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.shape !== undefined) updateData.shape = args.shape;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;
    if (args.isVip !== undefined) updateData.isVip = args.isVip;
    if (args.hasView !== undefined) updateData.hasView = args.hasView;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.position !== undefined) updateData.position = args.position;

    await ctx.db.patch(args.tableId, updateData);
    return true;
  },
});

/**
 * Remove uma mesa
 */
export const deleteTable = mutationWithRole(["partner", "master"])({
  args: {
    tableId: v.id("restaurantTables"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se a mesa existe
    const table = await ctx.db.get(args.tableId);
    if (!table) {
      throw new Error("Mesa não encontrada");
    }

    // Verificar se tem acesso ao restaurante
    const restaurant = await ctx.db.get(table.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    // Apenas partners donos podem deletar mesas
    if (currentUserRole === "partner") {
      if (restaurant.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para deletar mesas neste restaurante");
      }
    }

    // Verificar se há reservas associadas a esta mesa
    const reservations = await ctx.db
      .query("restaurantReservations")
      .withIndex("by_table", (q) => q.eq("tableId", args.tableId))
      .collect();

    if (reservations.length > 0) {
      throw new Error("Não é possível deletar uma mesa que possui reservas associadas");
    }

    await ctx.db.delete(args.tableId);
    return true;
  },
});

/**
 * Cria uma nova categoria no cardápio
 */
export const createMenuCategory = mutationWithRole(["partner", "master", "employee"])({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
  },
  returns: v.id("menuCategories"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se tem acesso ao restaurante
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    // Verificar permissões
    if (currentUserRole === "partner") {
      if (restaurant.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para adicionar categorias neste restaurante");
      }
    } else if (currentUserRole === "employee") {
      // Verificar se o employee tem acesso a este restaurante através das organizações
      const hasAccess = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", currentUserId))
        .filter((q) => {
          // Buscar organizações do partner dono do restaurante
          return q.eq(q.field("partnerId"), restaurant.partnerId);
        })
        .first();
      
      if (!hasAccess) {
        throw new Error("Você não tem permissão para adicionar categorias neste restaurante");
      }
    }

    const now = Date.now();

    const categoryId = await ctx.db.insert("menuCategories", {
      restaurantId: args.restaurantId,
      name: args.name,
      description: args.description,
      order: args.order,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

/**
 * Cria um novo item no cardápio
 */
export const createMenuItem = mutationWithRole(["partner", "master", "employee"])({
  args: {
    categoryId: v.id("menuCategories"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.optional(v.string()),
    ingredients: v.array(v.string()),
    allergens: v.array(v.string()),
    preparationTime: v.optional(v.number()),
    calories: v.optional(v.number()),
    isVegetarian: v.boolean(),
    isVegan: v.boolean(),
    isGlutenFree: v.boolean(),
    isSpicy: v.boolean(),
    spicyLevel: v.optional(v.number()),
    isSignature: v.boolean(),
    order: v.number(),
    tags: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("menuItems"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se a categoria existe
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    // Verificar se tem acesso ao restaurante
    const restaurant = await ctx.db.get(category.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    // Verificar permissões
    if (currentUserRole === "partner") {
      if (restaurant.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para adicionar itens neste restaurante");
      }
    } else if (currentUserRole === "employee") {
      // Verificar se o employee tem acesso a este restaurante através das organizações
      const hasAccess = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", currentUserId))
        .filter((q) => {
          // Buscar organizações do partner dono do restaurante
          return q.eq(q.field("partnerId"), restaurant.partnerId);
        })
        .first();
      
      if (!hasAccess) {
        throw new Error("Você não tem permissão para adicionar itens neste restaurante");
      }
    }

    const now = Date.now();

    const itemId = await ctx.db.insert("menuItems", {
      restaurantId: category.restaurantId,
      categoryId: args.categoryId,
      name: args.name,
      description: args.description,
      price: args.price,
      image: args.image,
      ingredients: args.ingredients,
      allergens: args.allergens,
      preparationTime: args.preparationTime,
      calories: args.calories,
      isVegetarian: args.isVegetarian,
      isVegan: args.isVegan,
      isGlutenFree: args.isGlutenFree,
      isSpicy: args.isSpicy,
      spicyLevel: args.spicyLevel,
      isSignature: args.isSignature,
      isAvailable: true,
      order: args.order,
      tags: args.tags,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return itemId;
  },
}); 