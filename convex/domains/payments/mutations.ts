import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac/utils";
import {
  CreatePaymentPreferenceArgs,
  ProcessPaymentWebhookArgs,
} from "./types";

/**
 * Create a Mercado Pago payment preference
 */
export const createPaymentPreference = mutation({
  args: CreatePaymentPreferenceArgs,
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.optional(v.string()),
    initPoint: v.optional(v.string()),
    sandboxInitPoint: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem criar preferências de pagamento");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Verify access
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    if (!packageRequest) {
      throw new Error("Solicitação de pacote não encontrada");
    }

    const currentUser = await ctx.db.get(currentUserId);
    const hasAccess = 
      packageRequest.userId === currentUserId ||
      (currentUser?.email && packageRequest.customerInfo.email.toLowerCase() === currentUser.email.toLowerCase());
    
    if (!hasAccess) {
      throw new Error("Você não tem permissão para criar pagamento desta proposta");
    }

    // Check if proposal is ready for payment
    if (!["awaiting_final_confirmation", "payment_pending"].includes(proposal.status)) {
      throw new Error("Proposta não está pronta para pagamento");
    }

    try {
      // DEPRECATED: Use createPaymentPreferenceWithUpdate action instead
      // This mutation is kept for backward compatibility but should not be used
      // The action creates the MP preference synchronously and returns the real checkout URL
      
      return {
        success: false,
        error: "Use a action 'createPaymentPreferenceWithUpdate' para criar pagamentos. Esta mutation está deprecada.",
      };
    } catch (error) {
      console.error("Error creating payment preference:", error);
      return {
        success: false,
        error: "Erro interno ao criar preferência de pagamento",
      };
    }
  },
});

/**
 * Process Mercado Pago webhook notification
 */
export const processPaymentWebhook = mutation({
  args: ProcessPaymentWebhookArgs,
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Schedule webhook processing action
      await ctx.scheduler.runAfter(0, internal.domains.payments.actions.processMPWebhook, {
        webhookData: args,
      });

      // Log webhook received
      console.log("Webhook scheduled for processing:", args.id);

      return {
        success: true,
        message: "Webhook recebido e agendado para processamento",
      };
    } catch (error) {
      console.error("Error processing webhook:", error);
      return {
        success: false,
        message: "Erro ao processar webhook",
      };
    }
  },
});

/**
 * Update payment status from webhook (internal helper)
 */
const updatePaymentStatusInternal = async (ctx: any, args: {
  proposalId: any;
  paymentId: string;
  status: string;
  statusDetail?: string;
  transactionAmount?: number;
  paymentMethodId?: string;
  paymentTypeId?: string;
  dateApproved?: string;
  dateCreated?: string;
}) => {
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    const now = Date.now();
    let newStatus = proposal.status;
    let contractedAt = proposal.contractedAt;

    // Update proposal status based on payment status
    switch (args.status) {
      case "approved":
        newStatus = "payment_completed";
        contractedAt = now;
        break;
      case "pending":
      case "in_process":
        newStatus = "payment_pending";
        break;
      case "rejected":
      case "cancelled":
        newStatus = "awaiting_final_confirmation"; // Allow retry
        break;
      default:
        newStatus = "payment_pending";
    }

    // Update proposal
    await ctx.db.patch(args.proposalId, {
      status: newStatus,
      mpPaymentId: args.paymentId,
      paymentCompletedAt: args.status === "approved" ? now : proposal.paymentCompletedAt,
      contractedAt,
      updatedAt: now,
    });

    // If payment was approved, mark as contracted
    if (args.status === "approved") {
      await ctx.db.patch(args.proposalId, {
        status: "contracted",
        contractedAt: now,
        updatedAt: now,
      });

      // Get package request for notifications
      const packageRequest = await ctx.db.get(proposal.packageRequestId);
      
      // Update package request status
      if (packageRequest) {
        await ctx.db.patch(proposal.packageRequestId, {
          status: "confirmed",
          updatedAt: now,
        });

        // Create notifications directly
        if (packageRequest.userId) {
          await ctx.db.insert("notifications", {
            userId: packageRequest.userId,
            type: "payment_approved",
            title: "Pagamento Aprovado",
            message: `Seu pagamento foi aprovado! Viagem confirmada para a proposta #${proposal.proposalNumber}`,
            relatedId: proposal._id,
            relatedType: "package_proposal",
            isRead: false,
            createdAt: now,
          });
        }

        // Notify admin
        if (proposal.adminId) {
          await ctx.db.insert("notifications", {
            userId: proposal.adminId,
            type: "payment_approved",
            title: "Pagamento Recebido",
            message: `Pagamento aprovado para a proposta #${proposal.proposalNumber}. Cliente: ${packageRequest.customerInfo.name}`,
            relatedId: proposal._id,
            relatedType: "package_proposal",
            isRead: false,
            createdAt: now,
          });
        }
      }

      // Log payment approval (could add to audit log table if needed)
      console.log(`Payment approved: ${args.paymentId} for proposal: ${proposal.title}`);
    }

    return {
      success: true,
      message: `Status do pagamento atualizado para: ${args.status}`,
    };
};

/**
 * Update payment status (exported mutation)
 */
export const updatePaymentStatus = mutation({
  args: v.object({
    proposalId: v.id("packageProposals"),
    paymentId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"), 
      v.literal("authorized"),
      v.literal("in_process"),
      v.literal("in_mediation"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("charged_back")
    ),
    statusDetail: v.optional(v.string()),
    transactionAmount: v.optional(v.number()),
    paymentMethodId: v.optional(v.string()),
    paymentTypeId: v.optional(v.string()),
    dateApproved: v.optional(v.string()),
    dateCreated: v.optional(v.string()),
  }),
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    return await updatePaymentStatusInternal(ctx, args);
  },
});
