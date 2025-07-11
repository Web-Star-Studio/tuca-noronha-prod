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
      taxes: args.taxes,
      fees: args.fees,
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
    if (proposal.status !== "draft" && proposal.status !== "review") {
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

    // Update package request status to "proposal_sent" if it's still pending
    const currentRequest = await ctx.db.get(proposal.packageRequestId);
    if (currentRequest && currentRequest.status === "pending") {
      await ctx.db.patch(proposal.packageRequestId, {
        status: "proposal_sent",
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
 * Mark a proposal as viewed by customer
 */
export const markProposalAsViewed = mutation({
  args: {
    id: v.id("packageProposals"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the proposal
    const proposal = await ctx.db.get(args.id);
    if (!proposal) {
      throw new Error("Proposta não encontrada");
    }

    // Only mark as viewed if status is "sent"
    if (proposal.status !== "sent") {
      return {
        success: false,
        message: "Proposta não está no status correto para ser marcada como visualizada",
      };
    }

    const now = Date.now();

    // Update proposal status
    await ctx.db.patch(args.id, {
      status: "viewed",
      viewedAt: now,
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_viewed",
        action: `Proposta de pacote visualizada pelo cliente: ${proposal.title}`,
        category: "package_management",
        severity: "low",
      },
      resource: {
        type: "package_proposal",
        id: args.id.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        proposalNumber: proposal.proposalNumber,
        viewedAt: now,
      },
      status: "success",
    });

    return {
      success: true,
      message: "Proposta marcada como visualizada",
    };
  },
});