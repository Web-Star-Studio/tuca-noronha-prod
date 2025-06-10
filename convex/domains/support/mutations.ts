import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac/utils";

/**
 * Criar uma nova mensagem de suporte
 */
export const createSupportMessage = mutation({
  args: {
    subject: v.string(),
    category: v.union(
      v.literal("duvida"),
      v.literal("problema"), 
      v.literal("sugestao"),
      v.literal("cancelamento"),
      v.literal("outro")
    ),
    message: v.string(),
    contactEmail: v.string(),
    isUrgent: v.optional(v.boolean()),
  },
  returns: v.object({
    _id: v.id("supportMessages"),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const now = Date.now();

    // Inserir mensagem de suporte
    const supportMessageId = await ctx.db.insert("supportMessages", {
      userId: currentUserId,
      userRole: currentUserRole,
      subject: args.subject,
      category: args.category,
      message: args.message.trim(),
      contactEmail: args.contactEmail.trim(),
      isUrgent: args.isUrgent || false,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    return {
      _id: supportMessageId,
      success: true,
    };
  },
});

/**
 * Atualizar status de uma mensagem de suporte (apenas masters)
 */
export const updateSupportMessageStatus = mutation({
  args: {
    supportMessageId: v.id("supportMessages"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    responseMessage: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Apenas masters podem atualizar mensagens de suporte
    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem gerenciar mensagens de suporte");
    }

    const supportMessage = await ctx.db.get(args.supportMessageId);
    if (!supportMessage) {
      throw new Error("Mensagem de suporte não encontrada");
    }

    const now = Date.now();
    const updateData: any = {
      status: args.status,
      updatedAt: now,
    };

    // Se está sendo atribuída a um master
    if (args.status === "in_progress" && !supportMessage.assignedToMasterId) {
      updateData.assignedToMasterId = currentUserId;
    }

    // Se está sendo respondida
    if (args.responseMessage) {
      updateData.responseMessage = args.responseMessage.trim();
      updateData.respondedAt = now;
    }

    await ctx.db.patch(args.supportMessageId, updateData);

    return {
      success: true,
    };
  },
});

/**
 * Atribuir mensagem de suporte a um master específico
 */
export const assignSupportMessage = mutation({
  args: {
    supportMessageId: v.id("supportMessages"),
    masterId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Apenas masters podem atribuir mensagens de suporte
    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem gerenciar mensagens de suporte");
    }

    const supportMessage = await ctx.db.get(args.supportMessageId);
    if (!supportMessage) {
      throw new Error("Mensagem de suporte não encontrada");
    }

    // Verificar se o usuário atribuído é realmente um master
    const assignedUser = await ctx.db.get(args.masterId);
    if (!assignedUser || assignedUser.role !== "master") {
      throw new Error("Usuário deve ter role master para receber atribuições");
    }

    await ctx.db.patch(args.supportMessageId, {
      assignedToMasterId: args.masterId,
      status: "in_progress",
      updatedAt: Date.now(),
    });

    return {
      success: true,
    };
  },
}); 