import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac/utils";

/**
 * Get payment status for a proposal
 */
export const getPaymentStatus = query({
  args: {
    proposalId: v.id("packageProposals"),
  },
  returns: v.object({
    success: v.boolean(),
    paymentData: v.optional(v.object({
      status: v.string(),
      mpPaymentId: v.optional(v.string()),
      mpPreferenceId: v.optional(v.string()),
      paymentInitiatedAt: v.optional(v.number()),
      paymentCompletedAt: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      return {
        success: false,
        error: "Proposta não encontrada",
      };
    }

    // Verify access
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    if (!packageRequest) {
      return {
        success: false,
        error: "Solicitação de pacote não encontrada",
      };
    }

    const currentUser = await ctx.db.get(currentUserId);
    const hasAccess = 
      // Traveler access
      (currentUserRole === "traveler" && (
        packageRequest.userId === currentUserId ||
        (currentUser?.email && packageRequest.customerInfo.email.toLowerCase() === currentUser.email.toLowerCase())
      )) ||
      // Admin access
      (["master", "partner", "employee"].includes(currentUserRole));
    
    if (!hasAccess) {
      return {
        success: false,
        error: "Você não tem permissão para visualizar este pagamento",
      };
    }

    return {
      success: true,
      paymentData: {
        status: proposal.status,
        mpPaymentId: proposal.mpPaymentId,
        mpPreferenceId: proposal.mpPreferenceId,
        paymentInitiatedAt: proposal.paymentInitiatedAt,
        paymentCompletedAt: proposal.paymentCompletedAt,
        finalAmount: proposal.finalAmount || proposal.totalPrice,
      },
    };
  },
});

/**
 * Get payment history for admin
 */
export const getPaymentHistory = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    payments: v.optional(v.array(v.object({
      proposalId: v.id("packageProposals"),
      proposalNumber: v.string(),
      proposalTitle: v.string(),
      customerName: v.string(),
      status: v.string(),
      amount: v.number(),
      mpPaymentId: v.optional(v.string()),
      paymentInitiatedAt: v.optional(v.number()),
      paymentCompletedAt: v.optional(v.number()),
      contractedAt: v.optional(v.number()),
    }))),
    totalCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || !["master", "partner", "employee"].includes(currentUserRole)) {
      return {
        success: false,
        error: "Permissões insuficientes",
      };
    }

    try {
      const limit = args.limit || 50;
      const offset = args.offset || 0;

      // Get proposals with payment data
      const proposals = await ctx.db
        .query("packageProposals")
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "payment_pending"),
            q.eq(q.field("status"), "payment_completed"),
            q.eq(q.field("status"), "contracted")
          )
        )
        .order("desc")
        .paginate({ cursor: null, numItems: limit });

      const payments: Array<{
        proposalId: any;
        proposalNumber: string;
        proposalTitle: string;
        customerName: string;
        status: string;
        amount: number;
        mpPaymentId?: string;
        paymentInitiatedAt?: number;
        paymentCompletedAt?: number;
        contractedAt?: number;
      }> = [];
      
      for (const proposal of proposals.page) {
        // Get package request for customer info
        const packageRequest = await ctx.db.get(proposal.packageRequestId);
        if (packageRequest) {
          payments.push({
            proposalId: proposal._id,
            proposalNumber: proposal.proposalNumber,
            proposalTitle: proposal.title,
            customerName: packageRequest.customerInfo.name,
            status: proposal.status,
            amount: proposal.finalAmount || proposal.totalPrice,
            mpPaymentId: proposal.mpPaymentId,
            paymentInitiatedAt: proposal.paymentInitiatedAt,
            paymentCompletedAt: proposal.paymentCompletedAt,
            contractedAt: proposal.contractedAt,
          });
        }
      }

      return {
        success: true,
        payments,
        totalCount: payments.length,
      };
    } catch (error) {
      console.error("Error getting payment history:", error);
      return {
        success: false,
        error: "Erro ao buscar histórico de pagamentos",
      };
    }
  },
});

/**
 * Get payment statistics for dashboard
 */
export const getPaymentStats = query({
  args: {
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("year"))),
  },
  returns: v.object({
    success: v.boolean(),
    stats: v.optional(v.object({
      totalRevenue: v.number(),
      completedPayments: v.number(),
      pendingPayments: v.number(),
      averageAmount: v.number(),
      conversionRate: v.number(),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || !["master", "partner", "employee"].includes(currentUserRole)) {
      return {
        success: false,
        error: "Permissões insuficientes",
      };
    }

    try {
      const period = args.period || "month";
      const now = Date.now();
      let startDate: number;

      switch (period) {
        case "week":
          startDate = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = now - (30 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = now - (365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = now - (30 * 24 * 60 * 60 * 1000);
      }

      // Get all proposals in the period
      const allProposals = await ctx.db
        .query("packageProposals")
        .filter((q) => q.gte(q.field("createdAt"), startDate))
        .collect();

      const completedPayments = allProposals.filter(p => p.status === "contracted" || p.status === "payment_completed");
      const pendingPayments = allProposals.filter(p => p.status === "payment_pending");
      const sentProposals = allProposals.filter(p => ["sent", "viewed"].includes(p.status));

      const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.finalAmount || p.totalPrice), 0);
      const averageAmount = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;
      const conversionRate = sentProposals.length > 0 ? (completedPayments.length / sentProposals.length) * 100 : 0;

      return {
        success: true,
        stats: {
          totalRevenue,
          completedPayments: completedPayments.length,
          pendingPayments: pendingPayments.length,
          averageAmount,
          conversionRate,
        },
      };
    } catch (error) {
      console.error("Error getting payment stats:", error);
      return {
        success: false,
        error: "Erro ao buscar estatísticas de pagamento",
      };
    }
  },
});
