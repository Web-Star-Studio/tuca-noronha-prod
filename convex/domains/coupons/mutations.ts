import { mutation } from "../../_generated/server";
import { v } from "convex/values";

// Criar cupom
export const createCoupon = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    description: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
    discountValue: v.number(),
    maxDiscountAmount: v.optional(v.number()),
    minimumOrderValue: v.optional(v.number()),
    maximumOrderValue: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    userUsageLimit: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.number(),
    type: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("first_purchase"),
      v.literal("returning_customer")
    ),
    applicableAssets: v.array(v.object({
      assetType: v.union(
        v.literal("activities"),
        v.literal("events"),
        v.literal("restaurants"),
        v.literal("vehicles"),

        v.literal("packages")
      ),
      assetId: v.string(),
      isActive: v.boolean(),
    })),
    globalApplication: v.object({
      isGlobal: v.boolean(),
      assetTypes: v.array(v.string()),
    }),
    allowedUsers: v.array(v.id("users")),
    isActive: v.boolean(),
    isPubliclyVisible: v.boolean(),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    stackable: v.boolean(),
    autoApply: v.boolean(),
    notifyOnExpiration: v.boolean(),
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

    // Verificar permissões
    if (user.role !== "master" && user.role !== "partner" && user.role !== "employee") {
      throw new Error("Sem permissão para criar cupons");
    }

    // Validar código único
    const codeUpper = args.code.toUpperCase();
    const existingCoupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", codeUpper))
      .filter((q) => q.eq("deletedAt", undefined))
      .unique();

    if (existingCoupon) {
      throw new Error("Código do cupom já existe");
    }

    // Validações de negócio
    if (args.discountType === "percentage" && (args.discountValue <= 0 || args.discountValue > 100)) {
      throw new Error("Desconto percentual deve estar entre 0 e 100");
    }

    if (args.discountType === "fixed_amount" && args.discountValue <= 0) {
      throw new Error("Valor do desconto deve ser maior que zero");
    }

    if (args.validFrom >= args.validUntil) {
      throw new Error("Data de início deve ser anterior à data de fim");
    }

    if (args.minimumOrderValue && args.maximumOrderValue && args.minimumOrderValue > args.maximumOrderValue) {
      throw new Error("Valor mínimo não pode ser maior que o valor máximo");
    }

    // Determinar partnerId baseado no role do usuário
    let partnerId = args.partnerId;
    if (user.role === "partner") {
      partnerId = user._id;
    } else if (user.role === "employee") {
      partnerId = user.partnerId!;
      
      // Verificar se o employee tem permissão para criar cupons
      const employeePermissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", user._id))
        .collect();
      
      const hasManagePermission = employeePermissions.some(p => 
        p.permissions.includes("manage") || p.permissions.includes("edit")
      );
      
      if (!hasManagePermission) {
        throw new Error("Employee não tem permissão para criar cupons");
      }
      
      // Verificar se os assets do cupom estão dentro das permissões do employee
      if (args.applicableAssets.length > 0) {
        const allowedAssets = employeePermissions.map(p => ({ type: p.assetType, id: p.assetId }));
        const hasPermissionForAllAssets = args.applicableAssets.every(asset => 
          allowedAssets.some(allowed => 
            allowed.type === asset.assetType && allowed.id === asset.assetId
          )
        );
        
        if (!hasPermissionForAllAssets) {
          throw new Error("Employee não tem permissão para todos os assets especificados");
        }
      }
    } else if (user.role === "master") {
      // Master pode criar cupons para qualquer partner se fornecido
      partnerId = args.partnerId;
    } else {
      throw new Error("Role não autorizado para criar cupons");
    }

    const now = Date.now();
    const couponId = await ctx.db.insert("coupons", {
      code: codeUpper,
      name: args.name,
      description: args.description,
      discountType: args.discountType,
      discountValue: args.discountValue,
      maxDiscountAmount: args.maxDiscountAmount,
      minimumOrderValue: args.minimumOrderValue,
      maximumOrderValue: args.maximumOrderValue,
      usageLimit: args.usageLimit,
      usageCount: 0,
      userUsageLimit: args.userUsageLimit,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      type: args.type,
      applicableAssets: args.applicableAssets,
      globalApplication: args.globalApplication,
      allowedUsers: args.allowedUsers,
      isActive: args.isActive,
      isPubliclyVisible: args.isPubliclyVisible,
      createdBy: user._id,
      partnerId,
      organizationId: args.organizationId,
      stackable: args.stackable,
      autoApply: args.autoApply,
      notifyOnExpiration: args.notifyOnExpiration,
      createdAt: now,
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId,
      actionType: "created",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        newValues: args,
        reason: "Cupom criado via painel administrativo",
      },
      createdAt: now,
    });

    return couponId;
  },
});

// Atualizar cupom
export const updateCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    code: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed_amount"))),
    discountValue: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
    minimumOrderValue: v.optional(v.number()),
    maximumOrderValue: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    userUsageLimit: v.optional(v.number()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("first_purchase"),
      v.literal("returning_customer")
    )),
    applicableAssets: v.optional(v.array(v.object({
      assetType: v.union(
        v.literal("activities"),
        v.literal("events"),
        v.literal("restaurants"),
        v.literal("vehicles"),

        v.literal("packages")
      ),
      assetId: v.string(),
      isActive: v.boolean(),
    }))),
    globalApplication: v.optional(v.object({
      isGlobal: v.boolean(),
      assetTypes: v.array(v.string()),
    })),
    allowedUsers: v.optional(v.array(v.id("users"))),
    isActive: v.optional(v.boolean()),
    isPubliclyVisible: v.optional(v.boolean()),
    stackable: v.optional(v.boolean()),
    autoApply: v.optional(v.boolean()),
    notifyOnExpiration: v.optional(v.boolean()),
    notificationSentAt: v.optional(v.number()),
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
      throw new Error("Sem permissão para editar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para editar este cupom");
      }
    }

    // Validações
    if (args.code) {
      const codeUpper = args.code.toUpperCase();
      const existingCoupon = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", codeUpper))
        .unique();

      if (existingCoupon && existingCoupon._id !== args.couponId) {
        throw new Error("Código do cupom já existe");
      }
    }
    
    if (args.discountType === "percentage" && args.discountValue && (args.discountValue <= 0 || args.discountValue > 100)) {
      throw new Error("Desconto percentual deve estar entre 0 e 100");
    }

    if (args.discountType === "fixed_amount" && args.discountValue && args.discountValue <= 0) {
      throw new Error("Valor do desconto deve ser maior que zero");
    }

    const validFrom = args.validFrom || coupon.validFrom;
    const validUntil = args.validUntil || coupon.validUntil;

    if (validFrom >= validUntil) {
      throw new Error("Data de início deve ser anterior à data de fim");
    }

    const minimumOrderValue = args.minimumOrderValue !== undefined ? args.minimumOrderValue : coupon.minimumOrderValue;
    const maximumOrderValue = args.maximumOrderValue !== undefined ? args.maximumOrderValue : coupon.maximumOrderValue;

    if (minimumOrderValue && maximumOrderValue && minimumOrderValue > maximumOrderValue) {
      throw new Error("Valor mínimo não pode ser maior que o valor máximo");
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: Date.now(),
    };

    const fieldsToUpdate = [
      'code', 'name', 'description', 'discountType', 'discountValue', 'maxDiscountAmount',
      'minimumOrderValue', 'maximumOrderValue', 'usageLimit', 'userUsageLimit',
      'validFrom', 'validUntil', 'type', 'applicableAssets', 'globalApplication',
      'allowedUsers', 'isActive', 'isPubliclyVisible', 'stackable', 'autoApply',
      'notifyOnExpiration', 'notificationSentAt'
    ];

    fieldsToUpdate.forEach(field => {
      const key = field as keyof typeof args;
      if (args[key] !== undefined) {
        if (key === 'code') {
          updateData.code = (args.code as string).toUpperCase();
        } else {
          updateData[field] = args[key];
        }
      }
    });

    // Atualizar cupom
    await ctx.db.patch(args.couponId, updateData);

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: args.couponId,
      actionType: "updated",
      performedBy: user._id,
      performedAt: Date.now(),
      actionData: {
        oldValues: coupon,
        newValues: updateData,
        reason: "Cupom atualizado via painel administrativo",
      },
      createdAt: Date.now(),
    });

    return args.couponId;
  },
});

// Ativar/Desativar cupom
export const toggleCouponStatus = mutation({
  args: {
    couponId: v.id("coupons"),
    isActive: v.boolean(),
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
      throw new Error("Sem permissão para alterar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para alterar este cupom");
      }
    }

    await ctx.db.patch(args.couponId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: args.couponId,
      actionType: args.isActive ? "activated" : "deactivated",
      performedBy: user._id,
      performedAt: Date.now(),
      actionData: {
        oldValues: { isActive: coupon.isActive },
        newValues: { isActive: args.isActive },
        reason: `Cupom ${args.isActive ? 'ativado' : 'desativado'} via painel administrativo`,
      },
      createdAt: Date.now(),
    });

    return args.couponId;
  },
});

// Excluir cupom (soft delete)
export const deleteCoupon = mutation({
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
      throw new Error("Cupom já foi removido");
    }

    // Verificar permissões
    if (user.role === "partner" && coupon.partnerId !== user._id) {
      throw new Error("Sem permissão para excluir este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para excluir este cupom");
      }
    }

    // Verificar se há usos ativos
    const activeUsages = await ctx.db
      .query("couponUsages")
      .withIndex("by_coupon_status", (q) => q.eq("couponId", args.couponId).eq("status", "applied"))
      .collect();

    if (activeUsages.length > 0) {
      throw new Error("Não é possível excluir cupom com usos ativos");
    }

    const now = Date.now();
    await ctx.db.patch(args.couponId, {
      deletedAt: now,
      deletedBy: user._id,
      isActive: false,
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: args.couponId,
      actionType: "deleted",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        reason: "Cupom excluído via painel administrativo",
      },
      createdAt: now,
    });

    return args.couponId;
  },
});

// Aplicar cupom a uma compra
export const applyCoupon = mutation({
  args: {
    couponCode: v.string(),
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      
      v.literal("package")
    ),
    originalAmount: v.number(),
    assetType: v.optional(v.string()),
    assetId: v.optional(v.string()),
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

    // Buscar cupom
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.couponCode.toUpperCase()))
      .unique();

    if (!coupon || coupon.deletedAt) {
      throw new Error("Cupom não encontrado");
    }

    // Verificar elegibilidade
    const eligibility = await ctx.db.query("coupons") // Simular query para usar a lógica
      .filter(() => true) // Placeholder - implementar lógica de elegibilidade
      .unique();

    // Verificar se o cupom pode ser aplicado
    const now = Date.now();
    if (!coupon.isActive) {
      throw new Error("Cupom inativo");
    }

    if (coupon.validFrom > now || coupon.validUntil < now) {
      throw new Error("Cupom fora do período de validade");
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new Error("Limite de uso do cupom atingido");
    }

    // Verificar limite de uso por usuário
    if (coupon.userUsageLimit) {
      const userUsages = await ctx.db
        .query("couponUsages")
        .withIndex("by_coupon_user", (q) => q.eq("couponId", coupon._id).eq("userId", args.userId))
        .filter((q) => q.neq("status", "cancelled"))
        .collect();

      if (userUsages.length >= coupon.userUsageLimit) {
        throw new Error("Limite de uso por usuário atingido");
      }
    }

    // Verificar valor mínimo/máximo
    if (coupon.minimumOrderValue && args.originalAmount < coupon.minimumOrderValue) {
      throw new Error(`Valor mínimo do pedido: R$ ${coupon.minimumOrderValue}`);
    }

    if (coupon.maximumOrderValue && args.originalAmount > coupon.maximumOrderValue) {
      throw new Error(`Valor máximo do pedido: R$ ${coupon.maximumOrderValue}`);
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
        throw new Error("Cupom não aplicável a este item");
      }
    }

    // Calcular desconto
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (args.originalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, args.originalAmount);
    }

    const finalAmount = args.originalAmount - discountAmount;

    // Verificar se já existe uso para esta reserva
    const existingUsage = await ctx.db
      .query("couponUsages")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId).eq("bookingType", args.bookingType))
      .unique();

    if (existingUsage) {
      throw new Error("Cupom já aplicado a esta reserva");
    }

    // Criar registro de uso
    const usageId = await ctx.db.insert("couponUsages", {
      couponId: coupon._id,
      userId: args.userId,
      bookingId: args.bookingId,
      bookingType: args.bookingType,
      originalAmount: args.originalAmount,
      discountAmount,
      finalAmount,
      appliedAt: now,
      appliedBy: user._id,
      status: "applied",
      createdAt: now,
      updatedAt: now,
    });

    // Atualizar contador de uso do cupom
    await ctx.db.patch(coupon._id, {
      usageCount: coupon.usageCount + 1,
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: coupon._id,
      actionType: "applied",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        affectedBookingId: args.bookingId,
        affectedUserId: args.userId,
        metadata: {
          originalAmount: args.originalAmount,
          discountAmount,
          finalAmount,
        },
      },
      createdAt: now,
    });

    return {
      usageId,
      discountAmount,
      finalAmount,
    };
  },
});

// Criar log de auditoria para cupons
export const createAuditLog = mutation({
  args: {
    couponId: v.id("coupons"),
    actionType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("activated"),
      v.literal("deactivated"),
      v.literal("deleted"),
      v.literal("applied"),
      v.literal("refunded"),
      v.literal("expired"),
      v.literal("usage_limit_reached")
    ),
    performedBy: v.id("users"),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("couponAuditLogs", {
      couponId: args.couponId,
      actionType: args.actionType,
      performedBy: args.performedBy,
      performedAt: now,
      actionData: {
        reason: args.reason,
        metadata: args.metadata,
      },
      createdAt: now,
    });
  },
});

// Estornar uso de cupom
export const refundCouponUsage = mutation({
  args: {
    usageId: v.id("couponUsages"),
    reason: v.string(),
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

    const usage = await ctx.db.get(args.usageId);
    if (!usage) {
      throw new Error("Uso de cupom não encontrado");
    }

    if (usage.status !== "applied") {
      throw new Error("Uso de cupom não pode ser estornado");
    }

    const coupon = await ctx.db.get(usage.couponId);
    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    // Verificar permissões
    if (user.role === "partner" && coupon.partnerId !== user._id) {
      throw new Error("Sem permissão para estornar este uso");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para estornar este uso");
      }
    }

    const now = Date.now();

    // Atualizar status do uso
    await ctx.db.patch(args.usageId, {
      status: "refunded",
      updatedAt: now,
      metadata: {
        ...usage.metadata,
        systemNotes: `${args.reason} - Refunded at ${new Date(now).toISOString()} by ${user._id}`,
      },
    });

    // Decrementar contador de uso do cupom
    await ctx.db.patch(usage.couponId, {
      usageCount: Math.max(0, coupon.usageCount - 1),
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: usage.couponId,
      actionType: "refunded",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        affectedBookingId: usage.bookingId,
        affectedUserId: usage.userId,
        reason: args.reason,
        metadata: {
          originalAmount: usage.originalAmount,
          discountAmount: usage.discountAmount,
        },
      },
      createdAt: now,
    });

    return args.usageId;
  },
});

// Criar notificação
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      isRead: false,
      createdAt: now,
    });
  },
});

// Duplicar cupom
export const duplicateCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    newCode: v.string(),
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

    const originalCoupon = await ctx.db.get(args.couponId);
    if (!originalCoupon) {
      throw new Error("Cupom não encontrado");
    }

    // Verificar permissões
    if (user.role === "partner" && originalCoupon.partnerId !== user._id) {
      throw new Error("Sem permissão para duplicar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (originalCoupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para duplicar este cupom");
      }
    }

    // Verificar se o novo código já existe
    const codeUpper = args.newCode.toUpperCase();
    const existingCoupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", codeUpper))
      .unique();

    if (existingCoupon) {
      throw new Error("Código de cupom já existe");
    }

    const now = Date.now();
    
    // Criar novo cupom baseado no original
    const newCouponId = await ctx.db.insert("coupons", {
      code: codeUpper,
      name: `${originalCoupon.name} (Cópia)`,
      description: originalCoupon.description,
      discountType: originalCoupon.discountType,
      discountValue: originalCoupon.discountValue,
      maxDiscountAmount: originalCoupon.maxDiscountAmount,
      minimumOrderValue: originalCoupon.minimumOrderValue,
      maximumOrderValue: originalCoupon.maximumOrderValue,
      usageLimit: originalCoupon.usageLimit,
      usageCount: 0,
      userUsageLimit: originalCoupon.userUsageLimit,
      validFrom: originalCoupon.validFrom,
      validUntil: originalCoupon.validUntil,
      type: originalCoupon.type,
      applicableAssets: originalCoupon.applicableAssets,
      globalApplication: originalCoupon.globalApplication,
      allowedUsers: originalCoupon.allowedUsers,
      isActive: false, // Novo cupom começa desativado
      isPubliclyVisible: originalCoupon.isPubliclyVisible,
      createdBy: user._id,
      partnerId: originalCoupon.partnerId,
      organizationId: originalCoupon.organizationId,
      stackable: originalCoupon.stackable,
      autoApply: originalCoupon.autoApply,
      notifyOnExpiration: originalCoupon.notifyOnExpiration,
      createdAt: now,
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: newCouponId,
      actionType: "created",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        reason: "Cupom duplicado",
        metadata: {
          originalCouponId: args.couponId,
          newCode: codeUpper,
        },
      },
      createdAt: now,
    });

    return newCouponId;
  },
});

// Criar uso de cupom
export const createCouponUsage = mutation({
  args: {
    couponId: v.id("coupons"),
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      
      v.literal("package")
    ),
    originalAmount: v.number(),
    discountAmount: v.number(),
    finalAmount: v.number(),
    appliedBy: v.id("users"),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Incrementar contador de uso do cupom
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }
    
    await ctx.db.patch(args.couponId, {
      usageCount: coupon.usageCount + 1,
      updatedAt: now,
    });
    
    // Criar registro de uso
    return await ctx.db.insert("couponUsages", {
      couponId: args.couponId,
      userId: args.userId,
      bookingId: args.bookingId,
      bookingType: args.bookingType,
      originalAmount: args.originalAmount,
      discountAmount: args.discountAmount,
      finalAmount: args.finalAmount,
      appliedAt: now,
      appliedBy: args.appliedBy,
      status: "applied",
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Atualizar informações do Stripe no cupom
export const updateCouponStripeInfo = mutation({
  args: {
    couponId: v.id("coupons"),
    stripePromotionCodeId: v.optional(v.string()),
    stripeCouponId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const updateData: any = {
      updatedAt: now,
    };
    
    if (args.stripePromotionCodeId) {
      updateData.stripePromotionCodeId = args.stripePromotionCodeId;
    }
    
    if (args.stripeCouponId) {
      updateData.stripeCouponId = args.stripeCouponId;
    }
    
    await ctx.db.patch(args.couponId, updateData);
    
    return args.couponId;
  },
});

// Atualizar uso de cupom
export const updateCouponUsage = mutation({
  args: {
    usageId: v.id("couponUsages"),
    status: v.optional(v.union(
      v.literal("applied"),
      v.literal("refunded"),
      v.literal("cancelled")
    )),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const updateData: any = {
      updatedAt: now,
    };
    
    if (args.status) {
      updateData.status = args.status;
    }
    
    if (args.metadata) {
      updateData.metadata = args.metadata;
    }
    
    await ctx.db.patch(args.usageId, updateData);
    
    return args.usageId;
  },
});

// Atribuir cupom a usuários específicos
export const assignCouponToUsers = mutation({
  args: {
    couponId: v.id("coupons"),
    userIds: v.array(v.id("users")),
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
      throw new Error("Sem permissão para modificar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para modificar este cupom");
      }
    }

    // Atualizar lista de usuários permitidos
    const existingUsers = coupon.allowedUsers || [];
    const newUsers = args.userIds.filter(userId => !existingUsers.includes(userId));
    const updatedUsers = [...existingUsers, ...newUsers];

    const now = Date.now();
    await ctx.db.patch(args.couponId, {
      allowedUsers: updatedUsers,
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: args.couponId,
      actionType: "updated",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        reason: "Usuários atribuídos ao cupom",
        metadata: {
          addedUsers: newUsers,
          totalUsers: updatedUsers.length,
        },
      },
      createdAt: now,
    });

    return args.couponId;
  },
});

// Remover usuários de um cupom
export const removeCouponUsers = mutation({
  args: {
    couponId: v.id("coupons"),
    userIds: v.array(v.id("users")),
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
      throw new Error("Sem permissão para modificar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para modificar este cupom");
      }
    }

    // Remover usuários da lista
    const existingUsers = coupon.allowedUsers || [];
    const updatedUsers = existingUsers.filter(userId => !args.userIds.includes(userId));

    const now = Date.now();
    await ctx.db.patch(args.couponId, {
      allowedUsers: updatedUsers,
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: args.couponId,
      actionType: "updated",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        reason: "Usuários removidos do cupom",
        metadata: {
          removedUsers: args.userIds,
          totalUsers: updatedUsers.length,
        },
      },
      createdAt: now,
    });

    return args.couponId;
  },
});

// Atualizar assets aplicáveis do cupom
export const updateCouponAssets = mutation({
  args: {
    couponId: v.id("coupons"),
    applicableAssets: v.array(v.object({
      assetType: v.union(
        v.literal("activities"),
        v.literal("events"),
        v.literal("restaurants"),
        v.literal("vehicles"),

        v.literal("packages")
      ),
      assetId: v.string(),
      isActive: v.boolean(),
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

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    // Verificar permissões
    if (user.role === "partner" && coupon.partnerId !== user._id) {
      throw new Error("Sem permissão para modificar este cupom");
    }

    if (user.role === "employee") {
      const partnerId = user.partnerId;
      if (coupon.partnerId !== partnerId) {
        throw new Error("Sem permissão para modificar este cupom");
      }

      // Verificar se o employee tem permissão para todos os assets
      const employeePermissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", user._id))
        .collect();

      const allowedAssets = employeePermissions.map(p => ({ type: p.assetType, id: p.assetId }));
      const hasPermissionForAllAssets = args.applicableAssets.every(asset => 
        allowedAssets.some(allowed => 
          allowed.type === asset.assetType && allowed.id === asset.assetId
        )
      );

      if (!hasPermissionForAllAssets) {
        throw new Error("Employee não tem permissão para todos os assets especificados");
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.couponId, {
      applicableAssets: args.applicableAssets,
      updatedAt: now,
    });

    // Log de auditoria
    await ctx.db.insert("couponAuditLogs", {
      couponId: args.couponId,
      actionType: "updated",
      performedBy: user._id,
      performedAt: now,
      actionData: {
        reason: "Assets aplicáveis atualizados",
        metadata: {
          newAssets: args.applicableAssets,
          totalAssets: args.applicableAssets.length,
        },
      },
      createdAt: now,
    });

    return args.couponId;
  },
});

// Operações em lote para cupons
export const bulkUpdateCoupons = mutation({
  args: {
    couponIds: v.array(v.id("coupons")),
    action: v.union(
      v.literal("activate"),
      v.literal("deactivate"),
      v.literal("delete")
    ),
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

    const now = Date.now();
    const results: Array<{
      couponId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const couponId of args.couponIds) {
      const coupon = await ctx.db.get(couponId);
      if (!coupon) {
        results.push({ couponId, success: false, error: "Cupom não encontrado" });
        continue;
      }

      // Verificar permissões
      if (user.role === "partner" && coupon.partnerId !== user._id) {
        results.push({ couponId, success: false, error: "Sem permissão" });
        continue;
      }

      if (user.role === "employee") {
        const partnerId = user.partnerId;
        if (coupon.partnerId !== partnerId) {
          results.push({ couponId, success: false, error: "Sem permissão" });
          continue;
        }
      }

      try {
        switch (args.action) {
          case "activate":
            await ctx.db.patch(couponId, { isActive: true, updatedAt: now });
            break;
          case "deactivate":
            await ctx.db.patch(couponId, { isActive: false, updatedAt: now });
            break;
          case "delete":
            await ctx.db.patch(couponId, { deletedAt: now, deletedBy: user._id, isActive: false, updatedAt: now });
            break;
        }

        // Log de auditoria
        const actionTypeMap = {
          "activate": "activated" as const,
          "deactivate": "deactivated" as const,
          "delete": "deleted" as const,
        };

        await ctx.db.insert("couponAuditLogs", {
          couponId,
          actionType: actionTypeMap[args.action],
          performedBy: user._id,
          performedAt: now,
          actionData: {
            reason: `Operação em lote: ${args.action}`,
          },
          createdAt: now,
        });

        results.push({ couponId, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        results.push({ couponId, success: false, error: errorMessage });
      }
    }

    return results;
  },
});