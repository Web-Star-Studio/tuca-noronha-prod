import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

/**
 * Log de email enviado - mutation interna
 */
export const logEmail = internalMutation({
  args: {
    type: v.union(
      v.literal("booking_confirmation"),
      v.literal("booking_cancelled"),
      v.literal("booking_reminder"),
      v.literal("package_request_received"),
      v.literal("package_request_status_update"),
      v.literal("package_proposal_sent"),
      v.literal("partner_new_booking"),
      v.literal("welcome_new_user"),
      v.literal("new_partner_registration"),
      v.literal("employee_invitation"),
      v.literal("support_message")
    ),
    to: v.string(),
    subject: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  },
  returns: v.id("emailLogs"),
  handler: async (ctx, args) => {
    const emailLogId = await ctx.db.insert("emailLogs", {
      type: args.type,
      to: args.to,
      subject: args.subject,
      status: args.status,
      error: args.error,
      sentAt: args.sentAt,
      createdAt: Date.now(),
    });

    return emailLogId;
  },
});

/**
 * Atualizar status de um log de email
 */
export const updateEmailLogStatus = internalMutation({
  args: {
    emailLogId: v.id("emailLogs"),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.emailLogId, {
      status: args.status,
      error: args.error,
      sentAt: args.sentAt,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Limpar logs antigos de email (manter apenas os últimos 30 dias)
 */
export const cleanupOldEmailLogs = internalMutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Buscar logs antigos
    const oldLogs = await ctx.db
      .query("emailLogs")
      .withIndex("by_created_at")
      .filter((q) => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .collect();

    // Deletar logs antigos
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return {
      deletedCount: oldLogs.length,
    };
  },
});

/**
 * Marcar email como lido (para analytics)
 */
export const markEmailAsRead = mutation({
  args: {
    emailLogId: v.id("emailLogs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.emailLogId);
    if (!log) {
      throw new Error("Log de email não encontrado");
    }

    await ctx.db.patch(args.emailLogId, {
      readAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Reenviar email falhado
 */
export const retryFailedEmail = mutation({
  args: {
    emailLogId: v.id("emailLogs"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se usuário tem permissão (apenas admin)
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || (user.role !== "master" && user.role !== "employee")) {
      throw new Error("Sem permissão para reenviar emails");
    }

    const log = await ctx.db.get(args.emailLogId);
    if (!log) {
      throw new Error("Log de email não encontrado");
    }

    if (log.status !== "failed") {
      return {
        success: false,
        message: "Apenas emails falhados podem ser reenviados",
      };
    }

    // Atualizar status para pending para reenvio
    await ctx.db.patch(args.emailLogId, {
      status: "pending",
      error: undefined,
      retryAt: Date.now(),
      updatedAt: Date.now(),
    });

    // TODO: Aqui você pode adicionar lógica para reenviar o email
    // Por exemplo, agendar uma ação para reenviar

    return {
      success: true,
      message: "Email marcado para reenvio",
    };
  },
}); 