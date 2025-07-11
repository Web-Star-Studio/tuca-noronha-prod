import { v } from "convex/values";
import { mutation, query, action, internalAction } from "../../_generated/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import { createAuditLog } from "../audit/utils";
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";

// Document attachment validators
export const ProposalAttachmentArgs = v.object({
  storageId: v.string(),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  description: v.optional(v.string()),
});

export const UploadProposalAttachmentArgs = v.object({
  proposalId: v.id("packageProposals"),
  storageId: v.string(),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  description: v.optional(v.string()),
});

export const RemoveProposalAttachmentArgs = v.object({
  proposalId: v.id("packageProposals"),
  storageId: v.string(),
});

export const GenerateProposalPDFArgs = v.object({
  proposalId: v.id("packageProposals"),
  template: v.optional(v.string()),
  includeTerms: v.optional(v.boolean()),
  includePricing: v.optional(v.boolean()),
  includeItinerary: v.optional(v.boolean()),
  logoUrl: v.optional(v.string()),
  brandingColors: v.optional(v.object({
    primary: v.string(),
    secondary: v.string(),
  })),
});

/**
 * Upload a file attachment to a proposal
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

    // Create attachment object
    const attachment = {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedAt: Date.now(),
      uploadedBy: currentUserId,
      description: args.description,
    };

    // Add attachment to proposal
    const updatedAttachments = [...(proposal.attachments || []), attachment];
    
    await ctx.db.patch(args.proposalId, {
      attachments: updatedAttachments,
      updatedAt: Date.now(),
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_attachment_add",
        action: `Anexo adicionado à proposta: ${args.fileName}`,
        category: "document_management",
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
 * Remove a file attachment from a proposal
 */
export const removeProposalAttachment = mutation({
  args: RemoveProposalAttachmentArgs,
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
      throw new Error("Você só pode remover anexos das suas próprias propostas");
    }

    // Find and remove the attachment
    const updatedAttachments = (proposal.attachments || []).filter(
      attachment => attachment.storageId !== args.storageId
    );

    await ctx.db.patch(args.proposalId, {
      attachments: updatedAttachments,
      updatedAt: Date.now(),
    });

    // Schedule file deletion
    await ctx.scheduler.runAfter(0, internal.domains.packageProposals.documents.deleteAttachmentFile, {
      storageId: args.storageId,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_attachment_remove",
        action: `Anexo removido da proposta: ${args.storageId}`,
        category: "document_management",
        severity: "medium",
      },
      resource: {
        type: "package_proposal",
        id: args.proposalId.toString(),
        name: proposal.title,
        partnerId: proposal.partnerId,
      },
      metadata: {
        storageId: args.storageId,
      },
      status: "success",
    });

    return {
      success: true,
      message: "Anexo removido com sucesso",
    };
  },
});

/**
 * Get proposal attachments
 */
export const getProposalAttachments = query({
  args: {
    proposalId: v.id("packageProposals"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      return [];
    }

    // Check permissions
    if (currentUserRole === "master") {
      return proposal.attachments || [];
    }

    if (currentUserRole === "partner" || currentUserRole === "employee") {
      if (proposal.adminId === currentUserId || proposal.partnerId === currentUserId) {
        return proposal.attachments || [];
      }
    }

    if (currentUserRole === "traveler") {
      // Check if this user made the package request
      const packageRequest = await ctx.db.get(proposal.packageRequestId);
      if (packageRequest && packageRequest.userId === currentUserId) {
        return proposal.attachments || [];
      }
    }

    throw new Error("Acesso negado aos anexos desta proposta");
  },
});

/**
 * Generate PDF document for proposal
 */
export const generateProposalPDF = action({
  args: GenerateProposalPDFArgs,
  returns: v.object({
    success: v.boolean(),
    documentUrl: v.optional(v.string()),
    storageId: v.optional(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get proposal data
      const proposal = await ctx.runQuery(internal.domains.packageProposals.queries.internalGetProposal, {
        id: args.proposalId,
      });

      if (!proposal) {
        throw new Error("Proposta não encontrada");
      }

      // Get package request data for customer info
      const packageRequest = await ctx.runQuery(internal.domains.packageRequests.queries.internalGetPackageRequest, {
        id: proposal.packageRequestId,
      });

      if (!packageRequest) {
        throw new Error("Solicitação de pacote não encontrada");
      }

      // Get admin/partner info
      const admin = await ctx.runQuery(internal.domains.users.queries.internalGetUser, {
        id: proposal.adminId,
      });

      // Prepare data for PDF generation
      const pdfData = {
        proposal,
        packageRequest,
        admin,
        template: args.template || "default",
        options: {
          includeTerms: args.includeTerms ?? true,
          includePricing: args.includePricing ?? true,
          includeItinerary: args.includeItinerary ?? true,
          logoUrl: args.logoUrl,
          brandingColors: args.brandingColors,
        },
        generatedAt: Date.now(),
      };

      // Generate PDF content (HTML template)
      const pdfContent = await ctx.runAction(internal.domains.packageProposals.documents.generatePDFContent, {
        data: pdfData,
      });

      // TODO: Integrate with actual PDF generation service
      // Options:
      // 1. Puppeteer for HTML to PDF conversion
      // 2. React PDF for React-based PDF generation
      // 3. External service like PDFShift, DocuPanda, etc.
      // 4. jsPDF for client-side generation
      
      // For now, create a mock PDF and store it
      const mockPDFBlob = new Blob([pdfContent], { type: 'application/pdf' });
      const storageId = await ctx.storage.store(mockPDFBlob);

      // Update proposal with document info
      await ctx.runMutation(internal.domains.packageProposals.mutations.internalUpdateProposal, {
        id: args.proposalId,
        proposalDocument: storageId,
      });

      // Get the storage URL
      const documentUrl = await ctx.storage.getUrl(storageId);

      return {
        success: true,
        documentUrl: documentUrl || undefined,
        storageId: storageId.toString(),
        message: "Documento da proposta gerado com sucesso",
      };
    } catch (error) {
      console.error("Error generating proposal PDF:", error);
      return {
        success: false,
        message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Generate PDF content (HTML template)
 */
export const generatePDFContent = internalAction({
  args: {
    data: v.any(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { proposal, packageRequest, admin, options } = args.data;

    // Generate comprehensive HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta de Pacote - ${proposal.title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 200px;
            margin-bottom: 10px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .proposal-number {
            font-size: 14px;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .customer-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
        }
        .component-item {
            background-color: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .component-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 10px;
        }
        .component-name {
            font-weight: bold;
            font-size: 16px;
        }
        .component-price {
            font-weight: bold;
            color: #059669;
        }
        .pricing-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .pricing-table th,
        .pricing-table td {
            padding: 10px;
            text-align: right;
            border-bottom: 1px solid #e5e7eb;
        }
        .pricing-table th {
            background-color: #f8fafc;
            font-weight: bold;
        }
        .total-row {
            background-color: #f0f9ff;
            font-weight: bold;
            font-size: 18px;
        }
        .terms {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
        }
        .inclusion-list {
            list-style-type: none;
            padding: 0;
        }
        .inclusion-list li {
            padding: 5px 0;
            padding-left: 20px;
            position: relative;
        }
        .inclusion-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #059669;
            font-weight: bold;
        }
        .exclusion-list {
            list-style-type: none;
            padding: 0;
        }
        .exclusion-list li {
            padding: 5px 0;
            padding-left: 20px;
            position: relative;
        }
        .exclusion-list li:before {
            content: "✗";
            position: absolute;
            left: 0;
            color: #dc2626;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        ${options.logoUrl ? `<img src="${options.logoUrl}" alt="Logo" class="logo">` : ''}
        <div class="company-name">Tuca Noronha</div>
        <div class="proposal-number">Proposta #${proposal.proposalNumber}</div>
    </div>

    <div class="section">
        <div class="section-title">Informações do Cliente</div>
        <div class="customer-info">
            <p><strong>Nome:</strong> ${packageRequest.customerInfo?.name || 'Não informado'}</p>
            <p><strong>Email:</strong> ${packageRequest.customerInfo?.email || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${packageRequest.customerInfo?.phone || 'Não informado'}</p>
            <p><strong>Destino:</strong> ${packageRequest.destination}</p>
            <p><strong>Período:</strong> ${new Date(packageRequest.startDate).toLocaleDateString('pt-BR')} a ${new Date(packageRequest.endDate).toLocaleDateString('pt-BR')}</p>
            <p><strong>Pessoas:</strong> ${packageRequest.adults} adultos${packageRequest.children ? ` + ${packageRequest.children} crianças` : ''}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">${proposal.title}</div>
        <p>${proposal.description}</p>
        ${proposal.summary ? `<p><em>${proposal.summary}</em></p>` : ''}
    </div>

    <div class="section">
        <div class="section-title">Componentes do Pacote</div>
        ${proposal.components.map(component => `
            <div class="component-item">
                <div class="component-header">
                    <div class="component-name">${component.name}</div>
                    <div class="component-price">R$ ${component.totalPrice.toFixed(2)}</div>
                </div>
                <p>${component.description}</p>
                <p><strong>Quantidade:</strong> ${component.quantity} ${component.quantity > 1 ? 'unidades' : 'unidade'}</p>
                ${component.notes ? `<p><em>Observações: ${component.notes}</em></p>` : ''}
            </div>
        `).join('')}
    </div>

    ${options.includePricing ? `
    <div class="section">
        <div class="section-title">Investimento</div>
        <table class="pricing-table">
            <tr>
                <th>Item</th>
                <th>Valor</th>
            </tr>
            <tr>
                <td>Subtotal</td>
                <td>R$ ${proposal.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Impostos</td>
                <td>R$ ${proposal.taxes.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Taxas</td>
                <td>R$ ${proposal.fees.toFixed(2)}</td>
            </tr>
            ${proposal.discount > 0 ? `
            <tr>
                <td>Desconto</td>
                <td>-R$ ${proposal.discount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td>Valor Total</td>
                <td>R$ ${proposal.totalPrice.toFixed(2)}</td>
            </tr>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">O que está incluído</div>
        <ul class="inclusion-list">
            ${proposal.inclusions.map(inclusion => `<li>${inclusion}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <div class="section-title">O que não está incluído</div>
        <ul class="exclusion-list">
            ${proposal.exclusions.map(exclusion => `<li>${exclusion}</li>`).join('')}
        </ul>
    </div>

    ${options.includeTerms ? `
    <div class="section">
        <div class="section-title">Termos e Condições</div>
        <div class="terms">
            <p><strong>Condições de Pagamento:</strong></p>
            <p>${proposal.paymentTerms}</p>
            
            <p><strong>Política de Cancelamento:</strong></p>
            <p>${proposal.cancellationPolicy}</p>
            
            <p><strong>Validade da Proposta:</strong></p>
            <p>Esta proposta é válida até ${new Date(proposal.validUntil).toLocaleDateString('pt-BR')}.</p>
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Proposta gerada em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>Entre em contato conosco para mais informações ou esclarecimentos</p>
        ${admin?.email ? `<p>Contato: ${admin.name} - ${admin.email}</p>` : ''}
    </div>
</body>
</html>`;

    return htmlContent;
  },
});

/**
 * Delete attachment file from storage
 */
export const deleteAttachmentFile = internalAction({
  args: {
    storageId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.storage.delete(args.storageId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting attachment file:", error);
      return { success: false };
    }
  },
});

/**
 * Get download URL for attachment
 */
export const getAttachmentDownloadUrl = query({
  args: {
    proposalId: v.id("packageProposals"),
    storageId: v.string(),
  },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      return null;
    }

    // Check permissions
    let hasAccess = false;
    
    if (currentUserRole === "master") {
      hasAccess = true;
    } else if (currentUserRole === "partner" || currentUserRole === "employee") {
      hasAccess = proposal.adminId === currentUserId || proposal.partnerId === currentUserId;
    } else if (currentUserRole === "traveler") {
      const packageRequest = await ctx.db.get(proposal.packageRequestId);
      hasAccess = packageRequest?.userId === currentUserId;
    }

    if (!hasAccess) {
      throw new Error("Acesso negado ao anexo");
    }

    // Check if attachment exists in proposal
    const attachment = proposal.attachments?.find(att => att.storageId === args.storageId);
    if (!attachment) {
      return null;
    }

    // Get download URL
    return await ctx.storage.getUrl(args.storageId);
  },
}); 