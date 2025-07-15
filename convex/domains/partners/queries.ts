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

// Listar todos os partners (paginado, admin only)
export const listPartners = query({
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
        return {
          ...fee,
          createdByUser: user ? {
            name: user.name || "",
            email: user.email || "",
          } : null,
        };
      })
    );
    
    return enrichedFees;
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