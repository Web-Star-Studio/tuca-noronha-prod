import { query } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";

// Listar todos os cupons (com filtros)
export const listCoupons = query({
  args: {
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    isActive: v.optional(v.boolean()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
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

    let coupons = await ctx.db.query("coupons").collect();

    // Filtro por partner (apenas parceiros podem ver seus próprios cupons)
    if (user.role === "partner") {
      coupons = coupons.filter(coupon => coupon.partnerId === user._id);
    } else if (user.role === "employee") {
      const partnerId = user.partnerId;
      coupons = coupons.filter(coupon => coupon.partnerId === partnerId);
      
      // Para employees, verificar permissões de assets se existirem
      const employeePermissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", user._id))
        .collect();
      
      if (employeePermissions.length > 0) {
        // Filtrar cupons apenas para assets que o employee tem permissão
        const allowedAssets = employeePermissions.map(p => ({ type: p.assetType, id: p.assetId }));
        coupons = coupons.filter(coupon => {
          // Se o cupom é global, permitir
          if (coupon.globalApplication.isGlobal) {
            return true;
          }
          
          // Verificar se o employee tem permissão para algum asset do cupom
          return coupon.applicableAssets.some(asset => 
            allowedAssets.some(allowed => 
              allowed.type === asset.assetType && allowed.id === asset.assetId
            )
          );
        });
      }
    } else if (args.partnerId) {
      coupons = coupons.filter(coupon => coupon.partnerId === args.partnerId);
    }

    // Filtro por organização
    if (args.organizationId) {
      coupons = coupons.filter(coupon => coupon.organizationId === args.organizationId);
    }

    // Filtro por status ativo
    if (args.isActive !== undefined) {
      coupons = coupons.filter(coupon => coupon.isActive === args.isActive);
    }

    // Filtro por tipo (não há índice específico para isso)
    if (args.type) {
      coupons = coupons.filter(coupon => coupon.type === args.type);
    }

    // Filtro por soft delete
    coupons = coupons.filter(coupon => !coupon.deletedAt);

    // Ordenar por data de criação (mais recentes primeiro)
    coupons.sort((a, b) => b.createdAt - a.createdAt);

    // Paginação
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedCoupons = coupons.slice(offset, offset + limit);

    return {
      coupons: paginatedCoupons,
      totalCount: coupons.length,
      hasMore: offset + limit < coupons.length,
    };
  },
});

// Buscar cupom por ID
export const getCouponById = query({
  args: {
    couponId: v.id("coupons"),
  },
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

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    if (coupon.deletedAt) {
      throw new Error("Cupom foi removido");
    }

    // Verificar permissões
    if (user.role === "partner" && coupon.partnerId !== user._id) {
      throw new Error("Sem permissão para acessar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para acessar este cupom");
      }
    }

    return coupon;
  },
});

// Buscar cupom por código
export const getCouponByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!coupon || coupon.deletedAt) {
      return null;
    }

    return coupon;
  },
});

// Listar cupons públicos válidos
export const getPublicCoupons = query({
  args: {
    assetType: v.optional(v.string()),
    assetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    let coupons = await ctx.db
      .query("coupons")
      .withIndex("by_public_visible", (q) => q.eq("isPubliclyVisible", true).eq("isActive", true))
      .collect();

    // Filtrar por validade
    coupons = coupons.filter(coupon => 
      !coupon.deletedAt &&
      coupon.validFrom <= now &&
      coupon.validUntil >= now &&
      coupon.type === "public"
    );

    // Filtrar por asset específico se fornecido
    if (args.assetType && args.assetId) {
      coupons = coupons.filter(coupon => {
        // Verificar se é global para este tipo de asset
        if (coupon.globalApplication.isGlobal && 
            coupon.globalApplication.assetTypes.includes(args.assetType!)) {
          return true;
        }

        // Verificar se está na lista de assets específicos
        return coupon.applicableAssets.some(asset => 
          asset.assetType === args.assetType &&
          asset.assetId === args.assetId &&
          asset.isActive
        );
      });
    }

    return coupons;
  },
});

// Verificar elegibilidade de cupom para usuário
export const checkCouponEligibility = query({
  args: {
    couponId: v.id("coupons"),
    userId: v.optional(v.id("users")),
    assetType: v.optional(v.string()),
    assetId: v.optional(v.string()),
    orderValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon || coupon.deletedAt) {
      return {
        isEligible: false,
        reason: "Cupom não encontrado",
      };
    }

    const now = Date.now();
    const reasons: string[] = [];

    // Verificar se está ativo
    if (!coupon.isActive) {
      reasons.push("Cupom inativo");
    }

    // Verificar validade
    if (coupon.validFrom > now) {
      reasons.push("Cupom ainda não está válido");
    }

    if (coupon.validUntil < now) {
      reasons.push("Cupom expirado");
    }

    // Verificar limite de uso total
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      reasons.push("Limite de uso atingido");
    }

    // Verificar valor mínimo/máximo do pedido
    if (args.orderValue) {
      if (coupon.minimumOrderValue && args.orderValue < coupon.minimumOrderValue) {
        reasons.push(`Valor mínimo do pedido: R$ ${coupon.minimumOrderValue}`);
      }

      if (coupon.maximumOrderValue && args.orderValue > coupon.maximumOrderValue) {
        reasons.push(`Valor máximo do pedido: R$ ${coupon.maximumOrderValue}`);
      }
    }

    // Verificar aplicabilidade ao asset
    if (args.assetType && args.assetId) {
      const isApplicable = coupon.globalApplication.isGlobal 
        ? coupon.globalApplication.assetTypes.includes(args.assetType)
        : coupon.applicableAssets.some(asset => 
            asset.assetType === args.assetType &&
            asset.assetId === args.assetId &&
            asset.isActive
          );

      if (!isApplicable) {
        reasons.push("Cupom não aplicável a este item");
      }
    }

    // Verificar limite de uso por usuário
    if (args.userId && coupon.userUsageLimit) {
      const userUsages = await ctx.db
        .query("couponUsages")
        .withIndex("by_coupon_user", (q) => q.eq("couponId", args.couponId).eq("userId", args.userId!))
        .filter((q) => q.neq("status", "cancelled"))
        .collect();

      if (userUsages.length >= coupon.userUsageLimit) {
        reasons.push("Limite de uso por usuário atingido");
      }
    }

    // Verificar tipo de cupom e usuários permitidos
    if (coupon.type === "private" && args.userId) {
      if (!coupon.allowedUsers.includes(args.userId)) {
        reasons.push("Usuário não autorizado para este cupom");
      }
    }

    // Verificar tipo de cliente (primeira compra, etc.)
    if (args.userId && (coupon.type === "first_purchase" || coupon.type === "returning_customer")) {
      const previousBookings = await ctx.db
        .query("couponUsages")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .filter((q) => q.neq("status", "cancelled"))
        .collect();

      if (coupon.type === "first_purchase" && previousBookings.length > 0) {
        reasons.push("Cupom válido apenas para primeira compra");
      }

      if (coupon.type === "returning_customer" && previousBookings.length === 0) {
        reasons.push("Cupom válido apenas para clientes recorrentes");
      }
    }

    return {
      isEligible: reasons.length === 0,
      reason: reasons.join(", "),
      reasons,
    };
  },
});

// Estatísticas de cupons
export const getCouponStats = query({
  args: {
    couponId: v.id("coupons"),
  },
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

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    // Verificar permissões
    if (user.role === "partner" && coupon.partnerId !== user._id) {
      throw new Error("Sem permissão para acessar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para acessar este cupom");
      }
    }

    // Buscar dados de uso
    const usages = await ctx.db
      .query("couponUsages")
      .withIndex("by_coupon", (q) => q.eq("couponId", args.couponId))
      .collect();

    const appliedUsages = usages.filter(usage => usage.status === "applied");
    const refundedUsages = usages.filter(usage => usage.status === "refunded");

    const totalDiscountGiven = appliedUsages.reduce((sum, usage) => sum + usage.discountAmount, 0);
    const totalOrderValue = appliedUsages.reduce((sum, usage) => sum + usage.originalAmount, 0);

    // Agrupamento por período (últimos 30 dias)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentUsages = appliedUsages.filter(usage => usage.appliedAt >= thirtyDaysAgo);

    return {
      totalUsages: appliedUsages.length,
      totalRefunds: refundedUsages.length,
      totalDiscountGiven,
      totalOrderValue,
      averageOrderValue: appliedUsages.length > 0 ? totalOrderValue / appliedUsages.length : 0,
      recentUsages: recentUsages.length,
      usageRate: coupon.usageLimit ? (appliedUsages.length / coupon.usageLimit) * 100 : 0,
    };
  },
});

// Histórico de uso de cupom
export const getCouponUsageHistory = query({
  args: {
    couponId: v.id("coupons"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
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

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    // Verificar permissões
    if (user.role === "partner" && coupon.partnerId !== user._id) {
      throw new Error("Sem permissão para acessar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para acessar este cupom");
      }
    }

    let usages = await ctx.db
      .query("couponUsages")
      .withIndex("by_coupon", (q) => q.eq("couponId", args.couponId))
      .collect();

    // Ordenar por data de aplicação (mais recentes primeiro)
    usages.sort((a, b) => b.appliedAt - a.appliedAt);

    // Paginação
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    const paginatedUsages = usages.slice(offset, offset + limit);

    // Buscar informações dos usuários
    const usagesWithUsers = await Promise.all(
      paginatedUsages.map(async (usage) => {
        const user = await ctx.db.get(usage.userId);
        return {
          ...usage,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return {
      usages: usagesWithUsers,
      totalCount: usages.length,
      hasMore: offset + limit < usages.length,
    };
  },
});

// Internal helper to get user by ID
export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Buscar uso de cupom por ID
export const getCouponUsageById = query({
  args: {
    usageId: v.id("couponUsages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.usageId);
  },
});

// Buscar usuários traveler para atribuir cupons
export const getTravelersForCoupon = query({
  args: {
    searchTerm: v.optional(v.string()),
    excludeIds: v.optional(v.array(v.id("users"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db
      .query("users")
      .filter((q) => q.eq("role", "traveler"))
      .collect();

    // Filtrar por termo de busca
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      users = users.filter(u => 
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
      );
    }

    // Excluir IDs específicos
    if (args.excludeIds) {
      users = users.filter(u => !args.excludeIds!.includes(u._id));
    }

    // Limitar resultados
    const limit = args.limit || 20;
    users = users.slice(0, limit);

    return users.map(u => ({
      _id: u._id,
      name: u.name || u.fullName || "Usuário",
      email: u.email,
      profileImage: u.image,
    }));
  },
});

// Alias para compatibilidade com CouponUserAssignment component
export const getAvailableUsers = query({
  args: {
    searchTerm: v.optional(v.string()),
    excludeIds: v.optional(v.array(v.id("users"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Simplesmente reutilizar a lógica de getTravelersForCoupon
    return await ctx.runQuery(api.domains.coupons.queries.getTravelersForCoupon, args);
  },
});

// Buscar assets disponíveis para um partner
export const getPartnerAssets = query({
  args: {
    partnerId: v.optional(v.id("users")),
    assetType: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
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

    // Determinar qual partner usar
    let targetPartnerId = args.partnerId;
    if (user.role === "partner") {
      targetPartnerId = user._id;
    } else if (user.role === "employee") {
      targetPartnerId = user.partnerId;
    } else if (user.role === "master") {
      // Master pode ver assets de qualquer partner ou todos se não especificar
      targetPartnerId = args.partnerId; // pode ser undefined para ver todos
    }

    // Para roles que não são master, partnerId é obrigatório
    if (!targetPartnerId && user.role !== "master") {
      throw new Error("Partner não identificado");
    }

    const assets: Array<{
      id: string;
      name: string;
      type: string;
      image?: string | null;
      price?: number;
      location?: string;
      date?: string;
      cuisine?: string[];
      pricePerDay?: number;
      pricePerNight?: number;
      category?: string;
      duration?: number;
    }> = [];
    const limit = args.limit || 50;

    // Buscar atividades
    if (!args.assetType || args.assetType === "activities") {
      const activities = targetPartnerId 
        ? await ctx.db
            .query("activities")
            .withIndex("by_partner", (q) => q.eq("partnerId", targetPartnerId))
            .collect()
        : await ctx.db.query("activities").collect();

      activities
        .filter(activity => activity.isActive)
        .forEach(activity => {
          if (!args.searchTerm || activity.title.toLowerCase().includes(args.searchTerm.toLowerCase())) {
            assets.push({
              id: activity._id,
              name: activity.title,
              type: "activities",
              image: activity.imageUrl,
              price: activity.price,
              location: activity.category,
            });
          }
        });
    }

    // Buscar eventos
    if (!args.assetType || args.assetType === "events") {
      const events = targetPartnerId
        ? await ctx.db
            .query("events")
            .withIndex("by_partner", (q) => q.eq("partnerId", targetPartnerId))
            .collect()
        : await ctx.db.query("events").collect();

      events
        .filter(event => event.isActive)
        .forEach(event => {
          if (!args.searchTerm || event.title.toLowerCase().includes(args.searchTerm.toLowerCase())) {
            assets.push({
              id: event._id,
              name: event.title,
              type: "events",
              image: event.imageUrl,
              price: event.price,
              location: event.location,
              date: event.date,
            });
          }
        });
    }

    // Buscar restaurantes
    if (!args.assetType || args.assetType === "restaurants") {
      const restaurants = targetPartnerId
        ? await ctx.db
            .query("restaurants")
            .withIndex("by_partner", (q) => q.eq("partnerId", targetPartnerId))
            .collect()
        : await ctx.db.query("restaurants").collect();

      restaurants
        .filter(restaurant => restaurant.isActive)
        .forEach(restaurant => {
          if (!args.searchTerm || restaurant.name.toLowerCase().includes(args.searchTerm.toLowerCase())) {
            assets.push({
              id: restaurant._id,
              name: restaurant.name,
              type: "restaurants",
              image: restaurant.mainImage,
              cuisine: restaurant.cuisine,
              location: restaurant.address.city,
            });
          }
        });
    }

    // Buscar veículos
    if (!args.assetType || args.assetType === "vehicles") {
      const vehicles = targetPartnerId
        ? await ctx.db
            .query("vehicles")
            .withIndex("by_ownerId", (q) => q.eq("ownerId", targetPartnerId))
            .collect()
        : await ctx.db.query("vehicles").collect();

      vehicles
        .filter(vehicle => vehicle.status === "available")
        .forEach(vehicle => {
          if (!args.searchTerm || vehicle.name.toLowerCase().includes(args.searchTerm.toLowerCase())) {
            assets.push({
              id: vehicle._id,
              name: vehicle.name,
              type: "vehicles",
              image: vehicle.imageUrl,
              pricePerDay: vehicle.pricePerDay,
              category: vehicle.category,
            });
          }
        });
    }

    // Buscar acomodações
    if (!args.assetType || args.assetType === "accommodations") {
      const accommodations = targetPartnerId
        ? await ctx.db
            .query("accommodations")
            .withIndex("by_partner", (q) => q.eq("partnerId", targetPartnerId))
            .collect()
        : await ctx.db.query("accommodations").collect();

      accommodations
        .filter(accommodation => accommodation.isActive)
        .forEach(accommodation => {
          if (!args.searchTerm || accommodation.name.toLowerCase().includes(args.searchTerm.toLowerCase())) {
            assets.push({
              id: accommodation._id,
              name: accommodation.name,
              type: "accommodations",
              image: accommodation.mainImage,
              pricePerNight: accommodation.pricePerNight,
              location: accommodation.address.city,
            });
          }
        });
    }

    // Buscar pacotes
    if (!args.assetType || args.assetType === "packages") {
      const packages = targetPartnerId
        ? await ctx.db
            .query("packages")
            .withIndex("by_partner", (q) => q.eq("partnerId", targetPartnerId))
            .collect()
        : await ctx.db.query("packages").collect();

      packages
        .filter(pkg => pkg.isActive)
        .forEach(pkg => {
          if (!args.searchTerm || pkg.name.toLowerCase().includes(args.searchTerm.toLowerCase())) {
            assets.push({
              id: pkg._id,
              name: pkg.name,
              type: "packages",
              image: pkg.mainImage,
              price: pkg.basePrice,
              duration: pkg.duration,
            });
          }
        });
    }

    return assets
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  },
});

// Buscar cupons por asset específico
export const getCouponsByAsset = query({
  args: {
    assetType: v.string(),
    assetId: v.string(),
    isActive: v.optional(v.boolean()),
  },
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

    let coupons = await ctx.db.query("coupons").collect();

    // Filtrar cupons aplicáveis ao asset
    coupons = coupons.filter(coupon => {
      if (coupon.deletedAt) return false;
      
      // Verificar se é global para este tipo de asset
      if (coupon.globalApplication.isGlobal && 
          coupon.globalApplication.assetTypes.includes(args.assetType)) {
        return true;
      }

      // Verificar se está na lista de assets específicos
      return coupon.applicableAssets.some(asset => 
        asset.assetType === args.assetType &&
        asset.assetId === args.assetId &&
        asset.isActive
      );
    });

    // Filtrar por status ativo se especificado
    if (args.isActive !== undefined) {
      coupons = coupons.filter(coupon => coupon.isActive === args.isActive);
    }

    // Aplicar filtros baseados no role do usuário
    if (user.role === "partner") {
      coupons = coupons.filter(coupon => coupon.partnerId === user._id);
    } else if (user.role === "employee") {
      const partnerId = user.partnerId;
      coupons = coupons.filter(coupon => coupon.partnerId === partnerId);
    }

    // Ordenar por data de criação
    coupons.sort((a, b) => b.createdAt - a.createdAt);

    return coupons;
  },
});

// Buscar analytics de cupons
export const getCouponAnalytics = query({
  args: {
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
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

    // Determinar filtros baseados no role
    let partnerFilter = args.partnerId;
    if (user.role === "partner") {
      partnerFilter = user._id;
    } else if (user.role === "employee") {
      partnerFilter = user.partnerId;
    }

    // Buscar cupons
    let coupons = await ctx.db.query("coupons").collect();
    
    if (partnerFilter) {
      coupons = coupons.filter(coupon => coupon.partnerId === partnerFilter);
    }

    if (args.organizationId) {
      coupons = coupons.filter(coupon => coupon.organizationId === args.organizationId);
    }

    coupons = coupons.filter(coupon => !coupon.deletedAt);

    // Buscar dados de uso
    const couponIds = coupons.map(c => c._id);
    const allUsages = await ctx.db.query("couponUsages").collect();
    
    const usages = allUsages.filter(usage => couponIds.includes(usage.couponId));

    // Aplicar filtro de data se especificado
    let filteredUsages = usages;
    if (args.dateRange) {
      filteredUsages = usages.filter(usage => 
        usage.appliedAt >= args.dateRange!.start && 
        usage.appliedAt <= args.dateRange!.end
      );
    }

    const appliedUsages = filteredUsages.filter(usage => usage.status === "applied");
    const refundedUsages = filteredUsages.filter(usage => usage.status === "refunded");

    // Calcular estatísticas
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.isActive).length;
    const totalUsages = appliedUsages.length;
    const totalRefunds = refundedUsages.length;
    const totalDiscountGiven = appliedUsages.reduce((sum, usage) => sum + usage.discountAmount, 0);
    const totalOrderValue = appliedUsages.reduce((sum, usage) => sum + usage.originalAmount, 0);
    
    // Cupons mais usados
    const couponUsageCount: Record<string, number> = {};
    appliedUsages.forEach(usage => {
      couponUsageCount[usage.couponId] = (couponUsageCount[usage.couponId] || 0) + 1;
    });
    
    const topCoupons = Object.entries(couponUsageCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([couponId, count]) => {
        const coupon = coupons.find(c => c._id === couponId);
        return {
          coupon: coupon ? { _id: coupon._id, code: coupon.code, name: coupon.name } : null,
          usageCount: count,
        };
      });

    // Tendências por período
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentUsages = appliedUsages.filter(usage => usage.appliedAt >= thirtyDaysAgo);
    
    return {
      totalCoupons,
      activeCoupons,
      totalUsages,
      totalRefunds,
      totalDiscountGiven,
      totalOrderValue,
      averageOrderValue: totalUsages > 0 ? totalOrderValue / totalUsages : 0,
      averageDiscountAmount: totalUsages > 0 ? totalDiscountGiven / totalUsages : 0,
      topCoupons,
      recentUsages: recentUsages.length,
      usageRate: totalCoupons > 0 ? (totalUsages / totalCoupons) : 0,
    };
  },
});