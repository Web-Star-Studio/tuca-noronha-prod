import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

// Buscar partner por userId
export const getPartnerByUserId = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("partners"),
      _creationTime: v.number(),
      userId: v.id("users"),
      stripeAccountId: v.string(),
      onboardingStatus: v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("rejected")
      ),
      feePercentage: v.number(),
      isActive: v.boolean(),
      capabilities: v.object({
        cardPayments: v.boolean(),
        transfers: v.boolean(),
      }),
      metadata: v.object({
        businessName: v.optional(v.string()),
        businessType: v.optional(v.string()),
        country: v.string(),
      }),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
      
    return partner;
  },
});

// Buscar partner por stripeAccountId (internal)
export const getPartnerByStripeId = internalQuery({
  args: {
    stripeAccountId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("partners"),
      _creationTime: v.number(),
      userId: v.id("users"),
      stripeAccountId: v.string(),
      onboardingStatus: v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("rejected")
      ),
      feePercentage: v.number(),
      isActive: v.boolean(),
      capabilities: v.object({
        cardPayments: v.boolean(),
        transfers: v.boolean(),
      }),
      metadata: v.object({
        businessName: v.optional(v.string()),
        businessType: v.optional(v.string()),
        country: v.string(),
      }),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .withIndex("by_stripeAccountId", (q) => q.eq("stripeAccountId", args.stripeAccountId))
      .unique();
      
    return partner;
  },
});

// Buscar partner por ID
export const getPartnerById = query({
  args: {
    partnerId: v.id("partners"),
  },
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) {
      return null;
    }
    
    const user = await ctx.db.get(partner.userId);
    const userDoc = user as any;
    
    return {
      ...partner,
      user: user ? {
        name: userDoc.name || userDoc.fullName || "",
        email: userDoc.email || "",
        image: userDoc.image || null,
      } : null,
    };
  },
});

// Listar todos os partners (sem paginação para admin)
export const listPartners = query({
  args: {
    filterStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    )),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // TODO: Verificar se é admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    let query = ctx.db.query("partners");
    
    // Aplicar filtros se especificados
    const partners = await query.collect();
    
    let filteredPartners = partners;
    
    // Filtrar por status se especificado
    if (args.filterStatus) {
      filteredPartners = filteredPartners.filter(p => p.onboardingStatus === args.filterStatus);
    }
    
    // Filtrar por ativo se especificado
    if (args.onlyActive !== undefined) {
      filteredPartners = filteredPartners.filter(p => p.isActive === args.onlyActive);
    }
    
    // Enriquecer com dados do usuário
    const enrichedPartners = await Promise.all(
      filteredPartners.map(async (partner) => {
        const user = await ctx.db.get(partner.userId);
        // Type guard para garantir que é um usuário válido da tabela users
        if (!user || user._id !== partner.userId) {
          return {
            ...partner,
            user: null,
          };
        }
        
        // Cast explícito após validação
        const userDoc = user as any;
        return {
          ...partner,
          user: {
            name: userDoc.name || userDoc.fullName || "",
            email: userDoc.email || "",
            image: userDoc.image || null,
          },
        };
      })
    );
    
    // Ordenar por data de criação desc
    return enrichedPartners.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Listar todos os partners (paginado, admin only)
export const listPartnersPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filterStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    )),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // TODO: Verificar se é admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    let results;
    
    if (args.filterStatus) {
      results = await ctx.db
        .query("partners")
        .withIndex("by_status", (q) => q.eq("onboardingStatus", args.filterStatus!))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db
        .query("partners")
        .order("desc")
        .paginate(args.paginationOpts);
    }
    
    // Filtrar por status ativo se necessário
    if (args.onlyActive !== undefined) {
      results.page = results.page.filter(p => p.isActive === args.onlyActive);
    }
    
    // Enriquecer com dados do usuário
    const enrichedPage = await Promise.all(
      results.page.map(async (partner) => {
        const user = await ctx.db.get(partner.userId);
        // Type guard para garantir que é um usuário válido da tabela users
        if (!user || user._id !== partner.userId) {
          return {
            ...partner,
            user: null,
          };
        }
        
        // Cast explícito após validação
        const userDoc = user as any;
        return {
          ...partner,
          user: {
            name: userDoc.name || userDoc.fullName || "",
            email: userDoc.email || "",
            image: userDoc.image || null,
          },
        };
      })
    );
    
    return {
      ...results,
      page: enrichedPage,
    };
  },
});

// Buscar transações do partner
export const getPartnerTransactions = query({
  args: {
    partnerId: v.id("partners"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    )),
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário tem acesso (é o próprio partner ou admin)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) {
      throw new Error("Partner não encontrado");
    }
    
    // TODO: Verificar se é o próprio partner ou admin
    const userId = identity.subject as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    // Por enquanto, permitir se for o próprio partner
    if (partner.userId !== userId && user.role !== "admin") {
      throw new Error("Sem permissão para acessar estas transações");
    }
    
    let query = ctx.db
      .query("partnerTransactions")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId));
    
    if (args.status) {
      // Não temos índice composto, então filtrar após a query
      const results = await query.order("desc").paginate(args.paginationOpts);
      return {
        ...results,
        page: results.page.filter(t => t.status === args.status),
      };
    }
    
    return await query.order("desc").paginate(args.paginationOpts);
  },
});

// Buscar transações por payment intent ID
export const getPartnerTransactionsByPaymentIntent = internalQuery({
  args: {
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("partnerTransactions")
      .withIndex("by_stripePaymentIntentId", (q) =>
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .collect();
  },
});

// Buscar histórico de taxas do partner
export const getPartnerFeeHistory = query({
  args: {
    partnerId: v.id("partners"),
  },
  returns: v.array(v.object({
    _id: v.id("partnerFees"),
    _creationTime: v.number(),
    partnerId: v.id("partners"),
    feePercentage: v.number(),
    effectiveDate: v.number(),
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
    previousFee: v.optional(v.number()),
    createdByUser: v.union(
      v.object({
        name: v.string(),
        email: v.string(),
      }),
      v.null()
    ),
  })),
  handler: async (ctx, args) => {
    // TODO: Verificar permissões
    const fees = await ctx.db
      .query("partnerFees")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId))
      .order("desc")
      .collect();
    
    // Enriquecer com dados do usuário que criou
    const enrichedFees = await Promise.all(
      fees.map(async (fee) => {
        const user = await ctx.db.get(fee.createdBy);
        const userDoc = user as any;
        return {
          ...fee,
          createdByUser: user ? {
            name: userDoc.name || userDoc.fullName || "",
            email: userDoc.email || "",
          } : null,
        };
      })
    );
    
    return enrichedFees;
  },
});

// Buscar todas as transações de partners (admin only)
export const listPartnerTransactions = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Verificar se é admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    const transactions = await ctx.db
      .query("partnerTransactions")
      .collect();
    
    return transactions;
  },
});

// Analytics do partner
export const getPartnerAnalytics = query({
  args: {
    partnerId: v.id("partners"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    totalTransactions: v.number(),
    totalRevenue: v.number(),
    totalPlatformFees: v.number(),
    totalPartnerEarnings: v.number(),
    transactionsByStatus: v.object({
      pending: v.number(),
      completed: v.number(),
      failed: v.number(),
      refunded: v.number(),
    }),
    monthlyRevenue: v.array(v.object({
      month: v.string(),
      revenue: v.number(),
      fees: v.number(),
      earnings: v.number(),
      transactionCount: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // TODO: Implementar analytics completas
    const transactions = await ctx.db
      .query("partnerTransactions")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId))
      .collect();
    
    // Filtrar por período se fornecido
    const filteredTransactions = transactions.filter(t => {
      if (args.startDate && t.createdAt < args.startDate) return false;
      if (args.endDate && t.createdAt > args.endDate) return false;
      return true;
    });
    
    // Calcular métricas
    const analytics = {
      totalTransactions: filteredTransactions.length,
      totalRevenue: 0,
      totalPlatformFees: 0,
      totalPartnerEarnings: 0,
      transactionsByStatus: {
        pending: 0,
        completed: 0,
        failed: 0,
        refunded: 0,
      },
      monthlyRevenue: [] as any[],
    };
    
    filteredTransactions.forEach(t => {
      analytics.totalRevenue += t.amount;
      analytics.totalPlatformFees += t.platformFee;
      analytics.totalPartnerEarnings += t.partnerAmount;
      analytics.transactionsByStatus[t.status]++;
    });
    
    // TODO: Implementar agregação mensal
    
    return analytics;
  },
}); 

// Buscar analytics financeiras do partner
export const getPartnerFinancialAnalytics = query({
  args: {
    partnerId: v.id("partners"),
    dateRange: v.optional(v.object({
      startDate: v.number(),
      endDate: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Verificar permissões
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) {
      throw new Error("Partner não encontrado");
    }
    
    const userId = identity.subject as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    
    if (partner.userId !== userId && user.role !== "admin" && user.role !== "master") {
      throw new Error("Sem permissão para acessar estas informações");
    }
    
    // Get all transactions for the partner
    let transactionsQuery = ctx.db
      .query("partnerTransactions")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId));
    
    // Get all transactions
    const allTransactions = await transactionsQuery.collect();
    
    // Apply date filter if provided
    let transactions = allTransactions;
    if (args.dateRange) {
      transactions = allTransactions.filter(t => 
        t.createdAt >= args.dateRange!.startDate && 
        t.createdAt <= args.dateRange!.endDate
      );
    }
    
    // Calculate metrics
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(t => t.status === "completed");
    const failedTransactions = transactions.filter(t => t.status === "failed");
    const refundedTransactions = transactions.filter(t => t.status === "refunded");
    
    // Calculate revenue metrics
    const grossRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const platformFees = completedTransactions.reduce((sum, t) => sum + t.platformFee, 0);
    const netRevenue = completedTransactions.reduce((sum, t) => sum + t.partnerAmount, 0);
    
    // Calculate refund metrics
    const totalRefunded = refundedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const refundedFees = refundedTransactions.reduce((sum, t) => {
      const refundData = t.metadata as any;
      return sum + (refundData?.platformFeeRefund || 0);
    }, 0);
    
    // Calculate average transaction value
    const avgTransactionValue = completedTransactions.length > 0
      ? grossRevenue / completedTransactions.length
      : 0;
    
    // Group by booking type
    const revenueByType = transactions.reduce((acc, t) => {
      if (t.status === "completed") {
        if (!acc[t.bookingType]) {
          acc[t.bookingType] = {
            count: 0,
            grossRevenue: 0,
            netRevenue: 0,
          };
        }
        acc[t.bookingType].count += 1;
        acc[t.bookingType].grossRevenue += t.amount;
        acc[t.bookingType].netRevenue += t.partnerAmount;
      }
      return acc;
    }, {} as Record<string, { count: number; grossRevenue: number; netRevenue: number }>);
    
    // Calculate monthly trends (last 6 months)
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
    const monthlyTransactions = allTransactions.filter(t => t.createdAt >= sixMonthsAgo);
    
    const monthlyTrends = monthlyTransactions.reduce((acc, t) => {
      const date = new Date(t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          transactions: 0,
          grossRevenue: 0,
          netRevenue: 0,
          refunds: 0,
        };
      }
      
      acc[monthKey].transactions += 1;
      if (t.status === "completed") {
        acc[monthKey].grossRevenue += t.amount;
        acc[monthKey].netRevenue += t.partnerAmount;
      } else if (t.status === "refunded") {
        acc[monthKey].refunds += t.amount;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by month
    const monthlyTrendsArray = Object.values(monthlyTrends)
      .sort((a: any, b: any) => a.month.localeCompare(b.month));
    
    // Get current balance (pending settlements)
    const pendingTransactions = allTransactions.filter(t => t.status === "pending");
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.partnerAmount, 0);
    
    return {
      summary: {
        totalTransactions,
        completedTransactions: completedTransactions.length,
        failedTransactions: failedTransactions.length,
        refundedTransactions: refundedTransactions.length,
        grossRevenue,
        platformFees,
        netRevenue,
        totalRefunded,
        refundedFees,
        avgTransactionValue,
        pendingAmount,
        conversionRate: totalTransactions > 0 
          ? (completedTransactions.length / totalTransactions) * 100 
          : 0,
      },
      revenueByType,
      monthlyTrends: monthlyTrendsArray,
      feePercentage: partner.feePercentage,
    };
  },
});

// Buscar saldo disponível do partner
export const getPartnerBalance = query({
  args: {
    partnerId: v.id("partners"),
  },
  handler: async (ctx, args) => {
    // Verificar permissões
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) {
      throw new Error("Partner não encontrado");
    }
    
    // Get all completed transactions
    const completedTransactions = await ctx.db
      .query("partnerTransactions")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    
    // Calculate available balance (completed transactions)
    const availableBalance = completedTransactions.reduce((sum, t) => sum + t.partnerAmount, 0);
    
    // Get pending transactions
    const pendingTransactions = await ctx.db
      .query("partnerTransactions")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    const pendingBalance = pendingTransactions.reduce((sum, t) => sum + t.partnerAmount, 0);
    
    // Get today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    const todayTransactions = completedTransactions.filter(t => t.createdAt >= todayStart);
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.partnerAmount, 0);
    
    return {
      availableBalance,
      pendingBalance,
      totalBalance: availableBalance + pendingBalance,
      todayRevenue,
      todayTransactions: todayTransactions.length,
      currency: "BRL",
    };
  },
}); 