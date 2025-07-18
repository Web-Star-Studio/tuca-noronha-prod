"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import Stripe from "stripe";

// Validar cupom em tempo real (para uso no frontend)
export const validateCouponRealTime = action({
  args: {
    couponCode: v.string(),
    userId: v.optional(v.id("users")),
    assetType: v.optional(v.string()),
    assetId: v.optional(v.string()),
    orderValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Buscar cupom
    const coupon = await ctx.runQuery(internal.domains.coupons.queries.getCouponByCode, {
      code: args.couponCode,
    });

    if (!coupon) {
      return {
        isValid: false,
        message: "Cupom não encontrado",
        coupon: null,
      };
    }

    // Verificar elegibilidade
    const eligibility = await ctx.runQuery(internal.domains.coupons.queries.checkCouponEligibility, {
      couponId: coupon._id,
      userId: args.userId,
      assetType: args.assetType,
      assetId: args.assetId,
      orderValue: args.orderValue,
    });

    if (!eligibility.isEligible) {
      return {
        isValid: false,
        message: eligibility.reason,
        coupon: null,
      };
    }

    // Calcular desconto se valor do pedido foi fornecido
    let discountAmount = 0;
    let finalAmount = args.orderValue || 0;

    if (args.orderValue) {
      if (coupon.discountType === "percentage") {
        discountAmount = (args.orderValue * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = Math.min(coupon.discountValue, args.orderValue);
      }
      finalAmount = args.orderValue - discountAmount;
    }

    return {
      isValid: true,
      message: "Cupom válido",
      coupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalAmount,
        validUntil: coupon.validUntil,
      },
    };
  },
});

// Calcular desconto de cupom
export const calculateCouponDiscount = action({
  args: {
    couponCode: v.string(),
    orderValue: v.number(),
    assetType: v.optional(v.string()),
    assetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Buscar cupom
    const coupon = await ctx.runQuery(internal.domains.coupons.queries.getCouponByCode, {
      code: args.couponCode,
    });

    if (!coupon) {
      throw new Error("Cupom não encontrado");
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

    // Verificar valor mínimo/máximo
    if (coupon.minimumOrderValue && args.orderValue < coupon.minimumOrderValue) {
      throw new Error(`Valor mínimo do pedido: R$ ${coupon.minimumOrderValue}`);
    }

    if (coupon.maximumOrderValue && args.orderValue > coupon.maximumOrderValue) {
      throw new Error(`Valor máximo do pedido: R$ ${coupon.maximumOrderValue}`);
    }

    // Calcular desconto
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (args.orderValue * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, args.orderValue);
    }

    const finalAmount = args.orderValue - discountAmount;
    const discountPercentage = (discountAmount / args.orderValue) * 100;

    return {
      originalAmount: args.orderValue,
      discountAmount,
      finalAmount,
      discountPercentage,
      savings: discountAmount,
    };
  },
});

// Enviar notificação de expiração de cupons
export const sendExpirationNotifications = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000); // 3 dias em milissegundos

    // Buscar cupons que expiram em 3 dias e têm notificação habilitada
    const expiringCoupons = await ctx.runQuery(internal.domains.coupons.queries.listCoupons, {
      isActive: true,
    });

    const couponsToNotify = expiringCoupons.coupons.filter(coupon => 
      coupon.notifyOnExpiration &&
      !coupon.notificationSentAt &&
      coupon.validUntil <= threeDaysFromNow &&
      coupon.validUntil > now
    );

    const notifications: any[] = [];

    for (const coupon of couponsToNotify) {
      try {
        // Buscar usuários elegíveis para este cupom
        let usersToNotify: any[] = [];

        if (coupon.type === "private") {
          // Para cupons privados, notificar apenas usuários permitidos
          usersToNotify = await Promise.all(
            coupon.allowedUsers.map(async userId => {
              // Simplified user lookup for actions
              const user = await ctx.runQuery(internal.domains.coupons.queries.getUser, { userId });
              return user;
            })
          );
        } else if (coupon.type === "public" && coupon.isPubliclyVisible) {
          // Para cupons públicos, pode notificar usuários ativos (limitado)
          // Implementar lógica específica baseada nos requisitos
        }

        // Criar notificações
        for (const user of usersToNotify) {
          if (user && user.email) {
            await ctx.runMutation(internal.domains.coupons.mutations.createNotification, {
              userId: user._id,
              type: "coupon_expiring",
              title: "Cupom expirando em breve",
              message: `O cupom "${coupon.name}" (${coupon.code}) expira em breve. Use antes de ${new Date(coupon.validUntil).toLocaleDateString()}.`,
              data: {
                couponCode: coupon.code,
                couponName: coupon.name,
                expirationDate: coupon.validUntil,
              },
            });

            notifications.push({
              userId: user._id,
              couponId: coupon._id,
              type: "expiration_warning",
            });
          }
        }

        // Marcar notificação como enviada
        await ctx.runMutation(internal.domains.coupons.mutations.updateCoupon, {
          couponId: coupon._id,
          notificationSentAt: now,
        });

      } catch (error) {
        console.error(`Erro ao enviar notificação para cupom ${coupon.code}:`, error);
      }
    }

    return {
      notificationsSent: notifications.length,
      couponsProcessed: couponsToNotify.length,
    };
  },
});

// Processar cupons expirados (desativar automaticamente)
export const processExpiredCoupons = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Buscar cupons ativos que já expiraram
    const activeCoupons = await ctx.runQuery(internal.domains.coupons.queries.listCoupons, {
      isActive: true,
    });

    const expiredCoupons = activeCoupons.coupons.filter(coupon => 
      coupon.validUntil < now
    );

    const processedCoupons: any[] = [];

    for (const coupon of expiredCoupons) {
      try {
        // Desativar cupom expirado
        await ctx.runMutation(internal.domains.coupons.mutations.toggleCouponStatus, {
          couponId: coupon._id,
          isActive: false,
        });

        // Log de auditoria
        await ctx.runMutation(internal.domains.coupons.mutations.createAuditLog, {
          couponId: coupon._id,
          actionType: "expired",
          performedBy: coupon.createdBy, // Use the creator ID for system actions
          reason: "Cupom expirado automaticamente",
        });

        processedCoupons.push(coupon._id);

      } catch (error) {
        console.error(`Erro ao processar cupom expirado ${coupon.code}:`, error);
      }
    }

    return {
      processedCount: processedCoupons.length,
      processedCoupons,
    };
  },
});

// Gerar relatório de uso de cupons
export const generateCouponUsageReport = action({
  args: {
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Buscar cupons no período
    const coupons = await ctx.runQuery(internal.domains.coupons.queries.listCoupons, {
      partnerId: args.partnerId,
      organizationId: args.organizationId,
    });

    const reportData = {
      totalCoupons: coupons.totalCount,
      activeCoupons: 0,
      expiredCoupons: 0,
      totalUsages: 0,
      totalDiscountGiven: 0,
      totalOrderValue: 0,
      topCoupons: [] as any[],
      usageByPeriod: {} as Record<string, number>,
      usageByAssetType: {} as Record<string, number>,
    };

    const now = Date.now();

    for (const coupon of coupons.coupons) {
      // Contar status dos cupons
      if (coupon.isActive && coupon.validUntil >= now) {
        reportData.activeCoupons++;
      } else if (coupon.validUntil < now) {
        reportData.expiredCoupons++;
      }

      // Buscar estatísticas do cupom
      const stats = await ctx.runQuery(internal.domains.coupons.queries.getCouponStats, {
        couponId: coupon._id,
      });

      reportData.totalUsages += stats.totalUsages;
      reportData.totalDiscountGiven += stats.totalDiscountGiven;
      reportData.totalOrderValue += stats.totalOrderValue;

      // Adicionar aos top cupons se teve uso
      if (stats.totalUsages > 0) {
        reportData.topCoupons.push({
          code: coupon.code,
          name: coupon.name,
          usages: stats.totalUsages,
          discountGiven: stats.totalDiscountGiven,
          orderValue: stats.totalOrderValue,
        });
      }

      // Buscar histórico de uso no período
      const usageHistory = await ctx.runQuery(internal.domains.coupons.queries.getCouponUsageHistory, {
        couponId: coupon._id,
        limit: 1000, // Limite alto para capturar todos
      });

      // Filtrar por período e agrupar dados
      const periodUsages = usageHistory.usages.filter(usage => 
        usage.appliedAt >= args.startDate && usage.appliedAt <= args.endDate
      );

      // Agrupar por dia
      periodUsages.forEach(usage => {
        const date = new Date(usage.appliedAt).toISOString().split('T')[0];
        reportData.usageByPeriod[date] = (reportData.usageByPeriod[date] || 0) + 1;

        // Agrupar por tipo de asset
        reportData.usageByAssetType[usage.bookingType] = 
          (reportData.usageByAssetType[usage.bookingType] || 0) + 1;
      });
    }

    // Ordenar top cupons por uso
    reportData.topCoupons.sort((a, b) => b.usages - a.usages);
    reportData.topCoupons = reportData.topCoupons.slice(0, 10); // Top 10

    // Calcular métricas adicionais
    const averageOrderValue = reportData.totalUsages > 0 
      ? reportData.totalOrderValue / reportData.totalUsages 
      : 0;

    const averageDiscount = reportData.totalUsages > 0 
      ? reportData.totalDiscountGiven / reportData.totalUsages 
      : 0;

    const discountRate = reportData.totalOrderValue > 0 
      ? (reportData.totalDiscountGiven / reportData.totalOrderValue) * 100 
      : 0;

    return {
      ...reportData,
      metrics: {
        averageOrderValue,
        averageDiscount,
        discountRate,
        conversionRate: 0, // Implementar se necessário
      },
      period: {
        startDate: args.startDate,
        endDate: args.endDate,
        daysInPeriod: Math.ceil((args.endDate - args.startDate) / (24 * 60 * 60 * 1000)),
      },
      generatedAt: Date.now(),
    };
  },
});

// Verificar e aplicar cupons automáticos
export const applyAutomaticCoupons = action({
  args: {
    userId: v.id("users"),
    assetType: v.string(),
    assetId: v.string(),
    orderValue: v.number(),
  },
  handler: async (ctx, args) => {
    // Buscar cupons automáticos elegíveis
    const publicCoupons = await ctx.runQuery(internal.domains.coupons.queries.getPublicCoupons, {
      assetType: args.assetType,
      assetId: args.assetId,
    });

    const automaticCoupons = publicCoupons.filter(coupon => coupon.autoApply);
    const applicableCoupons: any[] = [];

    for (const coupon of automaticCoupons) {
      // Verificar elegibilidade
      const eligibility = await ctx.runQuery(internal.domains.coupons.queries.checkCouponEligibility, {
        couponId: coupon._id,
        userId: args.userId,
        assetType: args.assetType,
        assetId: args.assetId,
        orderValue: args.orderValue,
      });

      if (eligibility.isEligible) {
        // Calcular desconto
        const discount = await ctx.runAction(internal.domains.coupons.actions.calculateCouponDiscount, {
          couponCode: coupon.code,
          orderValue: args.orderValue,
          assetType: args.assetType,
          assetId: args.assetId,
        });

        applicableCoupons.push({
          coupon,
          discount,
        });
      }
    }

    // Ordenar por maior desconto e retornar o melhor
    if (applicableCoupons.length > 0) {
      applicableCoupons.sort((a, b) => b.discount.discountAmount - a.discount.discountAmount);
      return applicableCoupons[0];
    }

    return null;
  },
});

// Validar múltiplos cupons
export const validateMultipleCoupons = action({
  args: {
    couponCodes: v.array(v.string()),
    userId: v.optional(v.id("users")),
    assetType: v.optional(v.string()),
    assetId: v.optional(v.string()),
    orderValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const validationResults: any[] = [];
    const validCoupons: any[] = [];
    const conflicts: string[] = [];
    let totalDiscount = 0;

    // Validar cada cupom individualmente
    for (const couponCode of args.couponCodes) {
      const result = await ctx.runAction(internal.domains.coupons.actions.validateCouponRealTime, {
        couponCode,
        userId: args.userId,
        assetType: args.assetType,
        assetId: args.assetId,
        orderValue: args.orderValue,
      });

      validationResults.push({
        code: couponCode,
        ...result,
      });

      if (result.isValid && result.coupon) {
        validCoupons.push(result.coupon);
        totalDiscount += result.coupon.discountAmount;
      }
    }

    // Verificar conflitos entre cupons
    const nonStackableCoupons = validCoupons.filter(coupon => !coupon.stackable);
    if (nonStackableCoupons.length > 1) {
      conflicts.push("Múltiplos cupons não combinam entre si");
    }

    if (nonStackableCoupons.length > 0 && validCoupons.length > 1) {
      conflicts.push("Alguns cupons não podem ser usados em conjunto");
    }

    // Calcular valores finais
    const finalAmount = Math.max(0, (args.orderValue || 0) - totalDiscount);
    const hasConflicts = conflicts.length > 0;

    return {
      validationResults,
      validCoupons,
      conflicts,
      hasConflicts,
      totalDiscount,
      finalAmount,
      orderValue: args.orderValue || 0,
    };
  },
});

// Aplicar cupom a uma reserva
export const applyCouponToBooking = action({
  args: {
    couponCode: v.string(),
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("accommodation"),
      v.literal("package")
    ),
    userId: v.id("users"),
    originalAmount: v.number(),
    appliedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validar cupom
    const validation = await ctx.runAction(internal.domains.coupons.actions.validateCouponRealTime, {
      couponCode: args.couponCode,
      userId: args.userId,
      orderValue: args.originalAmount,
    });

    if (!validation.isValid || !validation.coupon) {
      throw new Error(validation.message);
    }

    // Aplicar cupom
    await ctx.runMutation(internal.domains.coupons.mutations.createCouponUsage, {
      couponId: validation.coupon.id,
      userId: args.userId,
      bookingId: args.bookingId,
      bookingType: args.bookingType,
      originalAmount: args.originalAmount,
      discountAmount: validation.coupon.discountAmount,
      finalAmount: validation.coupon.finalAmount,
      appliedBy: args.appliedBy,
    });

    return {
      success: true,
      discountAmount: validation.coupon.discountAmount,
      finalAmount: validation.coupon.finalAmount,
      couponId: validation.coupon.id,
    };
  },
});

// Criar cupom Stripe promocional
export const createStripePromotionCode = action({
  args: {
    couponId: v.id("coupons"),
    stripeCustomerId: v.optional(v.string()),
    maxRedemptions: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Buscar cupom
    const coupon = await ctx.runQuery(internal.domains.coupons.queries.getCouponById, {
      couponId: args.couponId,
    });

    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    try {
              const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2025-06-30.basil" as any,
        });

      // Criar cupom no Stripe
      const stripeCoupon = await stripe.coupons.create({
        percent_off: coupon.discountType === "percentage" ? coupon.discountValue : undefined,
        amount_off: coupon.discountType === "fixed_amount" ? Math.round(coupon.discountValue * 100) : undefined, // Converter para centavos
        currency: coupon.discountType === "fixed_amount" ? "brl" : undefined,
        duration: "once", // Por enquanto, apenas uso único
        max_redemptions: coupon.usageLimit || undefined,
        metadata: {
          convexCouponId: args.couponId,
          partnerId: coupon.partnerId || "",
          type: coupon.type,
        },
      });

      // Criar código promocional
      const promotionCode = await stripe.promotionCodes.create({
        coupon: stripeCoupon.id,
        code: coupon.code,
        active: coupon.isActive,
        max_redemptions: args.maxRedemptions || coupon.usageLimit || undefined,
        expires_at: args.expiresAt ? Math.floor(args.expiresAt / 1000) : undefined, // Stripe espera timestamp em segundos
        restrictions: {
          minimum_amount: coupon.minimumOrderValue ? Math.round(coupon.minimumOrderValue * 100) : undefined,
          minimum_amount_currency: coupon.minimumOrderValue ? "brl" : undefined,
        },
        metadata: {
          convexCouponId: args.couponId,
        },
      });

      // Atualizar cupom com informações do Stripe
      await ctx.runMutation(internal.domains.coupons.mutations.updateCouponStripeInfo, {
        couponId: args.couponId,
        stripePromotionCodeId: promotionCode.id,
        stripeCouponId: stripeCoupon.id,
      });

      return {
        promotionCodeId: promotionCode.id,
        couponId: stripeCoupon.id,
        code: promotionCode.code,
        active: promotionCode.active,
        success: true,
      };
    } catch (error) {
      console.error("Erro ao criar cupom no Stripe:", error);
      throw new Error(`Falha ao criar cupom no Stripe: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  },
});

// Sincronizar uso de cupom com Stripe
export const syncCouponUsageWithStripe = action({
  args: {
    couponUsageId: v.id("couponUsages"),
    stripeSessionId: v.string(),
    paymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar uso do cupom
    const usage = await ctx.runQuery(internal.domains.coupons.queries.getCouponUsageById, {
      usageId: args.couponUsageId,
    });

    if (!usage) {
      throw new Error("Uso do cupom não encontrado");
    }

    // Atualizar com informações do Stripe
    await ctx.runMutation(internal.domains.coupons.mutations.updateCouponUsage, {
      usageId: args.couponUsageId,
      metadata: {
        stripeSessionId: args.stripeSessionId,
        paymentIntentId: args.paymentIntentId,
        syncedAt: Date.now(),
      },
    });

    return {
      success: true,
      usageId: args.couponUsageId,
      stripeSessionId: args.stripeSessionId,
    };
  },
});

// Gerar relatório de cupons
export const generateCouponReport = action({
  args: {
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    startDate: v.number(),
    endDate: v.number(),
    reportType: v.union(
      v.literal("summary"),
      v.literal("detailed"),
      v.literal("performance")
    ),
  },
  handler: async (ctx, args) => {
    const baseReport = await ctx.runAction(internal.domains.coupons.actions.generateCouponUsageReport, {
      partnerId: args.partnerId,
      organizationId: args.organizationId,
      startDate: args.startDate,
      endDate: args.endDate,
    });

    if (args.reportType === "summary") {
      return {
        ...baseReport,
        type: "summary",
      };
    }

    // Adicionar dados detalhados para relatórios específicos
    const detailedData = {
      ...baseReport,
      type: args.reportType,
      // Adicionar mais dados específicos baseados no tipo
    };

    return detailedData;
  },
});