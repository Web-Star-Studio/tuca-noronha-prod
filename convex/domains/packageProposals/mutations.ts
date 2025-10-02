import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import { createAuditLog } from "../audit/utils";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  CreatePackageProposalArgs,
  UpdatePackageProposalArgs,
  SendPackageProposalArgs,
  ApprovePackageProposalArgs,
  ConvertProposalToBookingArgs,
  UploadProposalAttachmentArgs,
} from "./types";

/**
 * Helper function to check if a traveler has access to a package request
 */
async function checkTravelerAccessToPackageRequest(
  ctx: any,
  packageRequest: any,
  currentUserId: Id<"users">
): Promise<boolean> {
  // First try userId if it exists
  if (packageRequest.userId === currentUserId) {
    return true;
  }

  // If no userId or doesn't match, try email matching
  const currentUser = await ctx.db.get(currentUserId);
  if (currentUser) {
    const packageEmail = packageRequest.customerInfo.email.toLowerCase().trim();
    const userEmail = currentUser.email?.toLowerCase().trim();
    
    if (userEmail && packageEmail === userEmail) {
      return true;
    }
  }

  return false;
}

/**
 * Create a new package proposal
 */
export const createPackageProposal = mutation({
  args: CreatePackageProposalArgs,
  returns: v.object({
    success: v.boolean(),
    proposalId: v.optional(v.id("packageProposals")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can create proposals
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Apenas administradores podem criar propostas");
    }

    // Verify package request exists
    const packageRequest = await ctx.db.get(args.packageRequestId);
    if (!packageRequest) {
      throw new Error("Solicitação de pacote não encontrada");
    }

    // Check permissions for the package request
    if (currentUserRole === "partner" || currentUserRole === "employee") {
      // TODO: Add partner/employee permission checks
    }

    const now = Date.now();
    
    // Generate unique proposal number
    const proposalNumber = `PROP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const user = await ctx.db.get(currentUserId);

    // Create the proposal
    const proposalId = await ctx.db.insert("packageProposals", {
      packageRequestId: args.packageRequestId,
      adminId: currentUserId,
      proposalNumber,
      title: args.title,
      description: args.description,
      summary: args.summary,
      components: args.components,
      subtotal: args.subtotal,
      taxes: args.taxes || 0,
      fees: args.fees || 0,
      discount: args.discount,
      totalPrice: args.totalPrice,
      currency: args.currency,
      validUntil: args.validUntil,
      paymentTerms: args.paymentTerms,
      cancellationPolicy: args.cancellationPolicy,
      inclusions: args.inclusions,
      exclusions: args.exclusions,
      attachments: args.attachments || [],
      status: "draft",
      negotiationRounds: 0,
      requiresApproval: args.requiresApproval,
      approvalStatus: args.requiresApproval ? "pending" : undefined,
      convertedToBooking: false,
      priority: args.priority,
      tags: args.tags,
      partnerId: user?.partnerId,
      organizationId: user?.organizationId,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_create",
        action: `Proposta de pacote criada: ${args.title}`,
        category: "package_management",
        severity: "medium",
      },
      resource: {
        type: "package_proposal",
        id: proposalId.toString(),
        name: args.title,
        partnerId: user?.partnerId,
      },
      metadata: {
        amount: args.totalPrice,
        quantity: args.components.length,
      },
      status: "success",
    });

    // Update package request with proposal count
    const currentProposalCount = await ctx.db
      .query("packageProposals")
      .withIndex("by_package_request", (q) => q.eq("packageRequestId", args.packageRequestId))
      .collect();

    await ctx.db.patch(args.packageRequestId, {
      proposalCount: currentProposalCount.length,
      lastProposalSent: now,
      updatedAt: now,
    });

    return {
      success: true,
      proposalId,
      message: "Proposta criada com sucesso",
    };
  },
});

/**
 * Update an existing package proposal
 */
export const updatePackageProposal = mutation({
  args: UpdatePackageProposalArgs,
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.id);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Check permissions
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    if (currentUserRole !== "master" && proposal.adminId !== currentUserId) {
      throw new Error("Você só pode editar suas próprias propostas");
    }

    // Can't edit proposals that have been sent (except status and admin response)
    // EXCEPTIONS: proposals "under_negotiation" and "rejected" can be fully edited
    const editableStatuses = ["draft", "review", "under_negotiation", "rejected"];
    if (!editableStatuses.includes(proposal.status)) {
      const allowedFields = ["status", "adminResponse", "customerFeedback"];
      const requestedFields = Object.keys(args).filter(key => key !== "id");
      const invalidFields = requestedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        throw new Error("Propostas enviadas só podem ter status e respostas atualizadas");
      }
    }

    const now = Date.now();
    const updates: any = {
      updatedAt: now,
    };

    // Build update object
    Object.keys(args).forEach(key => {
      if (key !== "id" && args[key as keyof typeof args] !== undefined) {
        updates[key] = args[key as keyof typeof args];
      }
    });

    // Track status changes
    let statusChanged = false;
    if (args.status && args.status !== proposal.status) {
      statusChanged = true;
      if (args.status === "sent" && !proposal.sentAt) {
        updates.sentAt = now;
      }
      if (args.status === "accepted" && !proposal.acceptedAt) {
        updates.acceptedAt = now;
      }
      if (args.status === "viewed" && !proposal.viewedAt) {
        updates.viewedAt = now;
      }
      if (args.customerFeedback || args.adminResponse) {
        updates.respondedAt = now;
        updates.negotiationRounds = proposal.negotiationRounds + 1;
      }
    }

    // Update the proposal
    await ctx.db.patch(args.id, updates);

    // Update package request status based on proposal status changes
    if (args.status) {
      const packageRequest = await ctx.db.get(proposal.packageRequestId);
      if (packageRequest) {
        if (args.status === "accepted") {
          await ctx.db.patch(proposal.packageRequestId, {
            status: "confirmed",
            updatedAt: now,
          });
        } else if (args.status === "rejected" && packageRequest.status === "proposal_sent") {
          await ctx.db.patch(proposal.packageRequestId, {
            status: "in_review",
            updatedAt: now,
          });
        }
      }
    }

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_update",
        action: `Proposta de pacote atualizada: ${proposal.title}`,
        category: "package_management",
        severity: statusChanged ? "medium" : "low",
      },
      resource: {
        type: "package_proposal",
        id: args.id.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        updatedFields: Object.keys(updates).filter(key => key !== "updatedAt"),
        oldStatus: proposal.status,
        newStatus: args.status || proposal.status,
        statusChanged,
      },
      status: "success",
    });

    return {
      success: true,
      message: "Proposta atualizada com sucesso",
    };
  },
});

/**
 * Send a package proposal to the customer
 */
export const sendPackageProposal = mutation({
  args: SendPackageProposalArgs,
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.id);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Check permissions
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    if (currentUserRole !== "master" && proposal.adminId !== currentUserId) {
      throw new Error("Você só pode enviar suas próprias propostas");
    }

    // Check if proposal requires approval
    if (proposal.requiresApproval && proposal.approvalStatus !== "approved") {
      throw new Error("Proposta precisa ser aprovada antes de ser enviada");
    }

    // Check if proposal is in valid state to be sent
    if (!["draft", "review"].includes(proposal.status)) {
      throw new Error("Proposta não pode ser enviada neste status");
    }

    const now = Date.now();

    // Schedule email action
    await ctx.scheduler.runAfter(0, internal.domains.packageProposals.actions.sendProposalEmail, {
      proposalId: args.id,
      customMessage: args.customMessage,
      includeAttachments: args.includeAttachments,
    });
    
    // Update proposal status
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update package request status to "proposal_sent"
    const currentRequest = await ctx.db.get(proposal.packageRequestId);
    if (currentRequest) {
      // Update last proposal sent timestamp
      await ctx.db.patch(proposal.packageRequestId, {
        status: "proposal_sent",
        lastProposalSent: now,
        updatedAt: now,
      });
    }

    // Notify customer
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    if (args.sendNotification && packageRequest?.userId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: packageRequest.userId,
        type: "package_proposal_sent",
        title: "Nova Proposta de Pacote Recebida",
        message: `Você recebeu uma nova proposta para sua solicitação: ${proposal.title}`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
        data: {
          proposalTitle: proposal.title,
          proposalNumber: proposal.proposalNumber,
        },
      });
    }

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_send",
        action: `Proposta de pacote enviada: ${proposal.title}`,
        category: "package_management",
        severity: "high",
      },
      resource: {
        type: "package_proposal",
        id: args.id.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        totalPrice: proposal.totalPrice,
        currency: proposal.currency,
        sendEmail: args.sendEmail,
        sendNotification: args.sendNotification,
        customMessage: args.customMessage,
      },
      status: "success",
    });

    return {
      success: true,
      message: "Proposta enviada com sucesso",
    };
  },
});

/**
 * Approve or reject a package proposal (for approval workflow)
 */
export const approvePackageProposal = mutation({
  args: ApprovePackageProposalArgs,
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only masters and partners can approve proposals
    if (!["master", "partner"].includes(currentUserRole)) {
      throw new Error("Apenas masters e parceiros podem aprovar propostas");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.id);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Check if approval is required
    if (!proposal.requiresApproval) {
      throw new Error("Esta proposta não requer aprovação");
    }

    // Check if already processed
    if (proposal.approvalStatus !== "pending") {
      throw new Error("Esta proposta já foi processada");
    }

    const now = Date.now();

    // Update approval status
    await ctx.db.patch(args.id, {
      approvalStatus: args.approved ? "approved" : "rejected",
      approvedBy: args.approved ? currentUserId : undefined,
      approvedAt: args.approved ? now : undefined,
      rejectionReason: !args.approved ? args.rejectionReason : undefined,
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: args.approved ? "package_proposal_approve" : "package_proposal_reject",
        action: `Proposta de pacote ${args.approved ? "aprovada" : "rejeitada"}: ${proposal.title}`,
        category: "package_management",
        severity: "high",
      },
      resource: {
        type: "package_proposal",
        id: args.id.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        approved: args.approved,
        approvalNotes: args.notes,
      },
      status: "success",
    });

    return {
      success: true,
      message: `Proposta ${args.approved ? "aprovada" : "rejeitada"} com sucesso`,
    };
  },
});

/**
 * Convert an accepted proposal to a booking
 */
export const convertProposalToBooking = mutation({
  args: ConvertProposalToBookingArgs,
  returns: v.object({
    success: v.boolean(),
    bookingId: v.optional(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.id);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Check if proposal can be converted
    if (proposal.status !== "accepted") {
      throw new Error("Apenas propostas aceitas podem ser convertidas");
    }

    if (proposal.convertedToBooking) {
      throw new Error("Esta proposta já foi convertida");
    }

    // Check permissions
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    const now = Date.now();

    // Generate booking ID (this would integrate with your booking system)
    const bookingId = `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Mark proposal as converted
    await ctx.db.patch(args.id, {
      convertedToBooking: true,
      bookingId,
      convertedAt: now,
      updatedAt: now,
    });

    // TODO: Create actual booking records for each component
    // This would integrate with your existing booking system
    
    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_convert",
        action: `Proposta de pacote convertida para reserva: ${proposal.title}`,
        category: "booking_management",
        severity: "critical",
      },
      resource: {
        type: "package_proposal",
        id: args.id.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        bookingId,
        totalPrice: proposal.totalPrice,
        currency: proposal.currency,
        paymentMethod: args.paymentMethod,
        notes: args.notes,
      },
      status: "success",
    });

    return {
      success: true,
      bookingId,
      message: "Proposta convertida em reserva com sucesso",
    };
  },
});

/**
 * Upload attachment to a proposal
 */
export const uploadProposalAttachment = mutation({
  args: UploadProposalAttachmentArgs,
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Check permissions
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    if (currentUserRole !== "master" && proposal.adminId !== currentUserId) {
      throw new Error("Você só pode adicionar anexos às suas próprias propostas");
    }

    const now = Date.now();

    // Add attachment to proposal
    const newAttachment = {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedAt: now,
      uploadedBy: currentUserId,
      description: args.description,
    };

    const updatedAttachments = [...proposal.attachments, newAttachment];

    await ctx.db.patch(args.proposalId, {
      attachments: updatedAttachments,
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_attachment_add",
        action: `Anexo adicionado à proposta: ${args.fileName}`,
        category: "package_management",
        severity: "low",
      },
      resource: {
        type: "package_proposal",
        id: args.proposalId.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        fileName: args.fileName,
        fileType: args.fileType,
        fileSize: args.fileSize,
        description: args.description,
      },
      status: "success",
    });

    return {
      success: true,
      message: "Anexo adicionado com sucesso",
    };
  },
});

/**
 * Delete a package proposal (soft delete)
 */
export const deletePackageProposal = mutation({
  args: {
    id: v.id("packageProposals"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.id);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Check permissions
    if (!["master", "partner"].includes(currentUserRole)) {
      throw new Error("Apenas masters e parceiros podem deletar propostas");
    }

    if (currentUserRole !== "master" && proposal.adminId !== currentUserId) {
      throw new Error("Você só pode deletar suas próprias propostas");
    }

    // Can't delete converted proposals
    if (proposal.convertedToBooking) {
      throw new Error("Propostas convertidas não podem ser deletadas");
    }

    const now = Date.now();

    // Soft delete
    await ctx.db.patch(args.id, {
      isActive: false,
      deletedAt: now,
      deletedBy: currentUserId,
      status: "withdrawn",
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_delete",
        action: `Proposta de pacote deletada: ${proposal.title}`,
        category: "package_management",
        severity: "high",
      },
      resource: {
        type: "package_proposal",
        id: args.id.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        reason: args.reason,
      },
      status: "success",
    });

    return {
      success: true,
      message: "Proposta deletada com sucesso",
    };
  },
});

/**
 * Send a question about a proposal (for travelers)
 */
export const sendProposalQuestion = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    message: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    conversationId: v.optional(v.id("packageRequestMessages")),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only travelers can send questions
    if (currentUserRole !== "traveler") {
      throw new Error("Apenas clientes podem enviar perguntas");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || !proposal.isActive) {
      throw new Error("Proposta não encontrada");
    }

    // Check permissions - verify this traveler can send questions about this proposal
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    if (!packageRequest) {
      throw new Error("Solicitação de pacote não encontrada");
    }

    const hasAccess = await checkTravelerAccessToPackageRequest(ctx, packageRequest, currentUserId);
    if (!hasAccess) {
      throw new Error("Você não tem permissão para enviar perguntas sobre esta proposta");
    }

    // Get current user details
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    const now = Date.now();

    // Create a message in the packageRequestMessages table
    const messageId = await ctx.db.insert("packageRequestMessages", {
      packageRequestId: proposal.packageRequestId,
      userId: currentUserId,
      senderName: currentUser.name || packageRequest.customerInfo.name,
      senderEmail: currentUser.email || packageRequest.customerInfo.email,
      subject: `Pergunta sobre proposta #${proposal.proposalNumber}`,
      message: args.message,
      status: "sent",
      priority: "medium",
      createdAt: now,
      updatedAt: now,
    });

    // Update proposal to indicate there's a new question
    await ctx.db.patch(args.proposalId, {
      status: "under_negotiation",
      customerFeedback: args.message,
      updatedAt: now,
      respondedAt: now,
      negotiationRounds: proposal.negotiationRounds + 1,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_viewed",
        action: "Cliente enviou pergunta sobre a proposta",
        category: "communication",
        severity: "low",
      },
      resource: {
        type: "package_proposal",
        id: args.proposalId.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        messagePreview: args.message.substring(0, 100),
      },
      status: "success",
    });

    return {
      success: true,
      message: "Pergunta enviada com sucesso! O parceiro será notificado.",
      conversationId: messageId,
    };
  },
});

/**
 * Accept a package proposal (traveler action)
 */
export const acceptProposal = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    participantsData: v.array(v.object({
      fullName: v.string(),
      birthDate: v.string(),
      cpf: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem aceitar propostas");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Get package request to verify access
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    if (!packageRequest) {
      throw new Error("Solicitação de pacote não encontrada");
    }

    // Verify the traveler has access to this package request
    const currentUser = await ctx.db.get(currentUserId);
    const hasAccess = 
      packageRequest.userId === currentUserId ||
      (currentUser?.email && packageRequest.customerInfo.email.toLowerCase() === currentUser.email.toLowerCase());
    
    if (!hasAccess) {
      throw new Error("Você não tem permissão para aceitar esta proposta");
    }

    // Check if proposal can be accepted
    if (!["sent", "viewed", "under_negotiation"].includes(proposal.status)) {
      throw new Error("Esta proposta não pode ser aceita no status atual");
    }

    const now = Date.now();

    // Update proposal status to awaiting participants data first, then to completed
    await ctx.db.patch(args.proposalId, {
      status: "participants_data_completed",
      acceptedAt: now,
      participantsDataSubmittedAt: now,
      updatedAt: now,
      participantsData: args.participantsData,
    });

    // Update package request status
    await ctx.db.patch(proposal.packageRequestId, {
      status: "confirmed",
      updatedAt: now,
    });

    // Notify admin/partner
    if (proposal.adminId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: proposal.adminId,
        type: "proposal_accepted",
        title: "Proposta Aceita!",
        message: `A proposta #${proposal.proposalNumber} foi aceita pelo cliente`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
      });
    }

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_accept",
        action: `Proposta aceita: ${proposal.title}`,
        category: "package_management",
        severity: "high",
      },
      resource: {
        type: "package_proposal",
        id: args.proposalId.toString(),
        name: proposal.title,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        participantsCount: args.participantsData.length,
      },
    });

    return {
      success: true,
      message: "Proposta aceita com sucesso! A equipe entrará em contato para finalizar os detalhes.",
    };
  },
});

/**
 * Reject a package proposal (traveler action)
 */
export const rejectProposal = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem rejeitar propostas");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Get package request to verify access
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    if (!packageRequest) {
      throw new Error("Solicitação de pacote não encontrada");
    }

    // Verify the traveler has access to this package request
    const currentUser = await ctx.db.get(currentUserId);
    const hasAccess = 
      packageRequest.userId === currentUserId ||
      (currentUser?.email && packageRequest.customerInfo.email.toLowerCase() === currentUser.email.toLowerCase());
    
    if (!hasAccess) {
      throw new Error("Você não tem permissão para rejeitar esta proposta");
    }

    // Check if proposal can be rejected
    if (!["sent", "viewed", "under_negotiation"].includes(proposal.status)) {
      throw new Error("Esta proposta não pode ser rejeitada no status atual");
    }

    const now = Date.now();

    // Update proposal status
    await ctx.db.patch(args.proposalId, {
      status: "rejected",
      rejectedAt: now,
      rejectionReason: args.reason,
      updatedAt: now,
    });

    // Update package request status back to in_review
    await ctx.db.patch(proposal.packageRequestId, {
      status: "in_review",
      updatedAt: now,
    });

    // Notify admin/partner
    if (proposal.adminId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: proposal.adminId,
        type: "proposal_rejected",
        title: "Proposta Rejeitada",
        message: `A proposta #${proposal.proposalNumber} foi rejeitada pelo cliente${args.reason ? `: ${args.reason}` : ''}`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
      });
    }

    return {
      success: true,
      message: "Proposta rejeitada. A equipe será notificada.",
    };
  },
});

/**
 * Request revision for a package proposal (traveler action)
 */
export const requestProposalRevision = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    revisionNotes: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem solicitar revisão de propostas");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Get package request to verify access
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    if (!packageRequest) {
      throw new Error("Solicitação de pacote não encontrada");
    }

    // Verify the traveler has access to this package request
    const currentUser = await ctx.db.get(currentUserId);
    const hasAccess = 
      packageRequest.userId === currentUserId ||
      (currentUser?.email && packageRequest.customerInfo.email.toLowerCase() === currentUser.email.toLowerCase());
    
    if (!hasAccess) {
      throw new Error("Você não tem permissão para solicitar revisão desta proposta");
    }

    // Check if proposal can be revised
    if (!["sent", "viewed", "under_negotiation"].includes(proposal.status)) {
      throw new Error("Esta proposta não pode ser revisada no status atual");
    }

    const now = Date.now();

    // Update proposal status
    await ctx.db.patch(args.proposalId, {
      status: "under_negotiation",
      lastRevisionRequest: now,
      revisionNotes: args.revisionNotes,
      updatedAt: now,
    });

    // Update package request status
    await ctx.db.patch(proposal.packageRequestId, {
      status: "requires_revision",
      updatedAt: now,
      adminNotes: `Cliente solicitou revisão: ${args.revisionNotes}`,
    });

    // Notify admin/partner
    if (proposal.adminId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: proposal.adminId,
        type: "proposal_revision_requested",
        title: "Revisão Solicitada",
        message: `Cliente solicitou revisão na proposta #${proposal.proposalNumber}: ${args.revisionNotes}`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
      });
    }

    return {
      success: true,
      message: "Solicitação de revisão enviada. A equipe entrará em contato em breve.",
    };
  },
});

/**
 * Mark proposal as viewed by traveler
 */
export const markProposalAsViewed = mutation({
  args: {
    proposalId: v.id("packageProposals"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      return { success: false };
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || proposal.status !== "sent") {
      return { success: false };
    }

    // Update status to viewed
    await ctx.db.patch(args.proposalId, {
      status: "viewed",
      viewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Accept proposal and start contracting process (without participants data)
 */
export const acceptProposalInitial = mutation({
  args: {
    proposalId: v.id("packageProposals"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem aceitar propostas");
    }

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
      throw new Error("Você não tem permissão para aceitar esta proposta");
    }

    if (!["sent", "viewed"].includes(proposal.status)) {
      throw new Error("Esta proposta não pode ser aceita no status atual");
    }

    const now = Date.now();

    // Update proposal to accepted and awaiting participant data
    await ctx.db.patch(args.proposalId, {
      status: "awaiting_participants_data",
      acceptedAt: now,
      updatedAt: now,
    });

    // Notify admin
    if (proposal.adminId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: proposal.adminId,
        type: "proposal_accepted",
        title: "Proposta Aceita",
        message: `Cliente aceitou a proposta #${proposal.proposalNumber}. Aguardando dados dos participantes.`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
      });
    }

    return {
      success: true,
      message: "Proposta aceita! Agora preencha os dados dos participantes.",
    };
  },
});

/**
 * Submit participants data
 */
export const submitParticipantsData = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    participantsData: v.array(v.object({
      fullName: v.string(),
      birthDate: v.string(),
      cpf: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem enviar dados de participantes");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    if (proposal.status !== "awaiting_participants_data") {
      throw new Error("Proposta não está aguardando dados de participantes");
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
      throw new Error("Você não tem permissão para enviar dados desta proposta");
    }

    const now = Date.now();

    // Update proposal with participant data
    await ctx.db.patch(args.proposalId, {
      status: "participants_data_completed",
      participantsData: args.participantsData,
      participantsDataSubmittedAt: now,
      updatedAt: now,
    });

    // Notify admin
    if (proposal.adminId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: proposal.adminId,
        type: "participants_data_submitted",
        title: "Dados dos Participantes Enviados",
        message: `Cliente enviou os dados dos participantes para a proposta #${proposal.proposalNumber}. Inicie a reserva dos voos.`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
      });
    }

    return {
      success: true,
      message: "Dados enviados! A equipe iniciará a reserva dos voos.",
    };
  },
});

/**
 * Admin: Start flight booking process
 */
export const startFlightBooking = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || !["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    if (proposal.status !== "participants_data_completed") {
      throw new Error("Dados dos participantes ainda não foram enviados");
    }

    const now = Date.now();

    // Update status to flight booking in progress
    await ctx.db.patch(args.proposalId, {
      status: "flight_booking_in_progress",
      flightBookingStartedAt: now,
      flightBookingNotes: args.notes,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Processo de reserva de voos iniciado.",
    };
  },
});

/**
 * Admin: Confirm flight booking completed
 */
export const confirmFlightBooked = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    flightDetails: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || !["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    if (proposal.status !== "flight_booking_in_progress") {
      throw new Error("Reserva de voos não está em andamento");
    }

    const now = Date.now();

    // Update status to flight booked
    await ctx.db.patch(args.proposalId, {
      status: "flight_booked",
      flightDetails: args.flightDetails,
      flightBookingCompletedAt: now,
      flightBookingNotes: args.notes || proposal.flightBookingNotes,
      updatedAt: now,
    });

    // Get package request for notification
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    
    // Notify customer if they have a user account
    if (packageRequest?.userId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: packageRequest.userId,
        type: "flight_booked",
        title: "Voos Reservados",
        message: `Os voos da sua viagem foram confirmados! Proposta #${proposal.proposalNumber}`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
      });
    }

    return {
      success: true,
      message: "Voos confirmados! Faça upload dos documentos.",
    };
  },
});

/**
 * Admin: Upload contract documents
 */
export const uploadContractDocuments = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    documents: v.array(v.object({
      storageId: v.string(),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      description: v.optional(v.string()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || !["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    if (proposal.status !== "flight_booked") {
      throw new Error("Voos ainda não foram confirmados");
    }

    const now = Date.now();

    // Prepare documents with metadata
    const documentsWithMetadata = args.documents.map(doc => ({
      ...doc,
      uploadedAt: now,
      uploadedBy: currentUserId,
    }));

    // Update status to documents uploaded
    await ctx.db.patch(args.proposalId, {
      status: "documents_uploaded",
      contractDocuments: documentsWithMetadata,
      documentsUploadedAt: now,
      updatedAt: now,
    });

    // Get package request for notification
    const packageRequest = await ctx.db.get(proposal.packageRequestId);
    
    // Notify customer if they have a user account
    if (packageRequest?.userId) {
      await ctx.runMutation(internal.domains.notifications.mutations.create, {
        userId: packageRequest.userId,
        type: "documents_uploaded",
        title: "Documentos Disponíveis",
        message: `Os documentos da sua viagem estão prontos! Proposta #${proposal.proposalNumber}`,
        relatedId: proposal._id,
        relatedType: "package_proposal",
      });
    }

    return {
      success: true,
      message: "Documentos enviados! Cliente pode dar confirmação final.",
    };
  },
});

/**
 * Customer: Give final confirmation and proceed to payment
 */
export const giveFinalConfirmation = mutation({
  args: {
    proposalId: v.id("packageProposals"),
    termsAccepted: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    paymentUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId || currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem dar confirmação final");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    if (proposal.status !== "documents_uploaded") {
      throw new Error("Documentos ainda não foram enviados");
    }

    if (!args.termsAccepted) {
      throw new Error("Você deve aceitar os termos e condições");
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
      throw new Error("Você não tem permissão para confirmar esta proposta");
    }

    const now = Date.now();

    // Update status to awaiting final confirmation
    await ctx.db.patch(args.proposalId, {
      status: "awaiting_final_confirmation",
      termsAcceptedAt: now,
      finalConfirmationAt: now,
      finalAmount: proposal.totalPrice, // Set final amount
      updatedAt: now,
    });

    // Here you would integrate with Mercado Pago to create payment preference
    // For now, we'll just update status to payment pending
    await ctx.db.patch(args.proposalId, {
      status: "payment_pending",
      paymentInitiatedAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Confirmação final registrada! Redirecionando para pagamento...",
      // paymentUrl would be returned from Mercado Pago integration
    };
  },
});