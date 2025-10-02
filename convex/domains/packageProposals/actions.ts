import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Generate proposal document (PDF) from proposal data
 */
export const generateProposalDocument = action({
  args: {
    proposalId: v.id("packageProposals"),
    template: v.optional(v.string()),
    options: v.optional(v.object({
      includeTerms: v.boolean(),
      includePricing: v.boolean(),
      includeItinerary: v.boolean(),
      logoUrl: v.optional(v.string()),
      brandingColors: v.optional(v.object({
        primary: v.string(),
        secondary: v.string(),
      })),
    })),
  },
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
        options: args.options || {
          includeTerms: true,
          includePricing: true,
          includeItinerary: true,
        },
        generatedAt: Date.now(),
      };

      // TODO: Integrate with PDF generation service
      // This could be:
      // - Puppeteer for HTML to PDF conversion
      // - React PDF for React-based PDF generation
      // - External service like PDFShift, DocuPanda, etc.
      
      // For now, simulate PDF generation
      const mockStorageId = `proposal_${args.proposalId}_${Date.now()}.pdf`;
      const mockDocumentUrl = `https://your-storage.com/proposals/${mockStorageId}`;

      // Update proposal with document info
      await ctx.runMutation(internal.domains.packageProposals.mutations.internalUpdateProposal, {
        id: args.proposalId,
        proposalDocument: mockStorageId,
      });

      return {
        success: true,
        documentUrl: mockDocumentUrl,
        storageId: mockStorageId,
        message: "Documento da proposta gerado com sucesso",
      };
    } catch (error) {
      console.error("Error generating proposal document:", error);
      return {
        success: false,
        message: `Erro ao gerar documento: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Send proposal email to customer
 */
export const sendProposalEmail = internalAction({
  args: {
    proposalId: v.id("packageProposals"),
    customMessage: v.optional(v.string()),
    includeAttachments: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
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

      // Get package request and customer info
      const packageRequest = await ctx.runQuery(internal.domains.packageRequests.queries.internalGetPackageRequest, {
        id: proposal.packageRequestId,
      });

      if (!packageRequest) {
        throw new Error("Solicitação de pacote não encontrada");
      }

      const customer = await ctx.runQuery(internal.domains.users.queries.internalGetUser, {
        id: packageRequest.userId,
      });

      if (!customer || !customer.email) {
        throw new Error("Cliente não encontrado ou sem email");
      }

      // Get admin info
      const admin = await ctx.runQuery(internal.domains.users.queries.internalGetUser, {
        id: proposal.adminId,
      });

      // Prepare email data
      const emailData = {
        to: customer.email,
        customerName: customer.name,
        proposalTitle: proposal.title,
        proposalNumber: proposal.proposalNumber,
        totalPrice: proposal.totalPrice,
        currency: proposal.currency,
        validUntil: new Date(proposal.validUntil).toLocaleDateString("pt-BR"),
        adminName: admin?.name || "Equipe Tuca Noronha",
        adminEmail: admin?.email,
        customMessage: args.customMessage,
        proposalUrl: `${process.env.SITE_URL}/proposals/${args.proposalId}`,
        attachments: args.includeAttachments ? proposal.attachments : [],
      };

      // Send email using the email service
      await ctx.runAction(internal.domains.email.actions.sendPackageProposalEmail, {
        ...emailData,
        templateId: "package_proposal",
      });

      return {
        success: true,
        message: "Email da proposta enviado com sucesso",
      };
    } catch (error) {
      console.error("Error sending proposal email:", error);
      return {
        success: false,
        message: `Erro ao enviar email: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Analyze package request and suggest components
 */
export const analyzePackageRequest = action({
  args: {
    packageRequestId: v.id("packageRequests"),
  },
  returns: v.object({
    success: v.boolean(),
    suggestions: v.array(v.object({
      type: v.string(),
      assetId: v.optional(v.string()),
      name: v.string(),
      description: v.string(),
      estimatedPrice: v.number(),
      confidence: v.number(),
      reasoning: v.string(),
    })),
    estimatedTotal: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get package request
      const packageRequest = await ctx.runQuery(internal.domains.packageRequests.queries.internalGetPackageRequest, {
        id: args.packageRequestId,
      });

      if (!packageRequest) {
        throw new Error("Solicitação de pacote não encontrada");
      }

      // TODO: Implement AI-powered analysis
      // This could integrate with:
      // - OpenAI GPT for natural language understanding
      // - Custom ML models for price prediction
      // - Rule-based matching algorithms
      
      // For now, provide basic suggestions based on request data
      type Suggestion = {
        type: string;
        assetId?: string;
        name: string;
        description: string;
        estimatedPrice: number;
        confidence: number;
        reasoning: string;
      };
      const suggestions: Suggestion[] = [];
      let estimatedTotal = 0;

      // Analyze request details
      const requestText = packageRequest.details.toLowerCase();
      const adults = packageRequest.adults || 1;
      const children = packageRequest.children || 0;
      const duration = packageRequest.duration || 3;

      // Suggest accommodation
      if (requestText.includes("hospedagem") || requestText.includes("hotel") || duration > 1) {
        suggestions.push({
          type: "accommodation",
          name: "Hospedagem em Fernando de Noronha",
          description: `Hospedagem para ${adults + children} pessoas por ${duration} noites`,
          estimatedPrice: 200 * duration * (adults + children * 0.5),
          confidence: 0.8,
          reasoning: "Solicitação menciona hospedagem ou duração indica necessidade",
        });
        estimatedTotal += 200 * duration * (adults + children * 0.5);
      }

      // Suggest activities
      if (requestText.includes("mergulho") || requestText.includes("snorkel")) {
        suggestions.push({
          type: "activity",
          name: "Tour de Mergulho",
          description: "Mergulho com snorkel ou cilindro",
          estimatedPrice: 150 * (adults + children),
          confidence: 0.9,
          reasoning: "Solicitação menciona atividades aquáticas",
        });
        estimatedTotal += 150 * (adults + children);
      }

      if (requestText.includes("trilha") || requestText.includes("caminhada")) {
        suggestions.push({
          type: "activity",
          name: "Trilhas Ecológicas",
          description: "Trilhas guiadas pelas principais praias",
          estimatedPrice: 80 * (adults + children),
          confidence: 0.8,
          reasoning: "Solicitação menciona trilhas ou caminhadas",
        });
        estimatedTotal += 80 * (adults + children);
      }

      // Suggest transportation
      if (duration > 1 || requestText.includes("transfer") || requestText.includes("transporte")) {
        suggestions.push({
          type: "vehicle",
          name: "Transfer Aeroporto + Translado Local",
          description: "Transfer do aeroporto e transporte durante a estadia",
          estimatedPrice: 100 * duration,
          confidence: 0.7,
          reasoning: "Transporte necessário para estadia de múltiplos dias",
        });
        estimatedTotal += 100 * duration;
      }

      // Suggest dining
      if (requestText.includes("restaurante") || requestText.includes("jantar") || duration > 2) {
        suggestions.push({
          type: "restaurant",
          name: "Experiência Gastronômica",
          description: "Jantares em restaurantes locais",
          estimatedPrice: 120 * (adults + children * 0.7),
          confidence: 0.6,
          reasoning: "Experiência gastronômica complementa a viagem",
        });
        estimatedTotal += 120 * (adults + children * 0.7);
      }

      return {
        success: true,
        suggestions,
        estimatedTotal,
        message: `${suggestions.length} sugestões geradas com base na análise da solicitação`,
      };
    } catch (error) {
      console.error("Error analyzing package request:", error);
      return {
        success: false,
        suggestions: [],
        estimatedTotal: 0,
        message: `Erro na análise: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Export proposals data for reporting
 */
export const exportProposalsData = action({
  args: {
    partnerId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    format: v.union(v.literal("csv"), v.literal("xlsx"), v.literal("json")),
    includeDetails: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    downloadUrl: v.optional(v.string()),
    storageId: v.optional(v.string()),
    recordCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get proposals data
      const proposalsData = await ctx.runQuery(internal.domains.packageProposals.queries.listPackageProposals, {
        partnerId: args.partnerId,
        limit: 10000, // Large limit for export
      });

      // Filter by date range if provided
      let filteredProposals = proposalsData.proposals;
      if (args.startDate || args.endDate) {
        filteredProposals = proposalsData.proposals.filter(proposal => {
          const createdAt = proposal.createdAt;
          return (!args.startDate || createdAt >= args.startDate) &&
                 (!args.endDate || createdAt <= args.endDate);
        });
      }

      // Prepare export data
      const exportData = filteredProposals.map(proposal => ({
        proposalNumber: proposal.proposalNumber,
        title: proposal.title,
        status: proposal.status,
        priority: proposal.priority,
        totalPrice: proposal.totalPrice,
        currency: proposal.currency,
        createdAt: new Date(proposal.createdAt).toISOString(),
        sentAt: proposal.sentAt ? new Date(proposal.sentAt).toISOString() : null,
        acceptedAt: proposal.acceptedAt ? new Date(proposal.acceptedAt).toISOString() : null,
        convertedToBooking: proposal.convertedToBooking,
        negotiationRounds: proposal.negotiationRounds,
        ...(args.includeDetails && {
          description: proposal.description,
          components: proposal.components,
          inclusions: proposal.inclusions,
          exclusions: proposal.exclusions,
        }),
      }));

      // TODO: Generate actual file based on format
      // This would integrate with file generation libraries
      const mockStorageId = `proposals_export_${Date.now()}.${args.format}`;
      const mockDownloadUrl = `https://your-storage.com/exports/${mockStorageId}`;

      return {
        success: true,
        downloadUrl: mockDownloadUrl,
        storageId: mockStorageId,
        recordCount: exportData.length,
        message: `${exportData.length} propostas exportadas com sucesso`,
      };
    } catch (error) {
      console.error("Error exporting proposals data:", error);
      return {
        success: false,
        recordCount: 0,
        message: `Erro na exportação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Duplicate an existing proposal
 */
export const duplicateProposal = action({
  args: {
    sourceProposalId: v.id("packageProposals"),
    newPackageRequestId: v.optional(v.id("packageRequests")),
    modifications: v.optional(v.object({
      title: v.optional(v.string()),
      adjustPricing: v.optional(v.number()), // Percentage adjustment
      updateValidUntil: v.optional(v.boolean()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    newProposalId: v.optional(v.id("packageProposals")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get source proposal
      const sourceProposal = await ctx.runQuery(internal.domains.packageProposals.queries.internalGetProposal, {
        id: args.sourceProposalId,
      });

      if (!sourceProposal) {
        throw new Error("Proposta origem não encontrada");
      }

      // Prepare new proposal data
      const modifications = args.modifications || {};
      const pricingAdjustment = modifications.adjustPricing || 0;
      
      const newProposalData = {
        ...sourceProposal,
        packageRequestId: args.newPackageRequestId || sourceProposal.packageRequestId,
        title: modifications.title || `${sourceProposal.title} (Cópia)`,
        status: "draft" as const,
        sentAt: undefined,
        viewedAt: undefined,
        acceptedAt: undefined,
        respondedAt: undefined,
        convertedToBooking: false,
        bookingId: undefined,
        convertedAt: undefined,
        negotiationRounds: 0,
        customerFeedback: undefined,
        adminResponse: undefined,
        attachments: [], // Don't copy attachments
        validUntil: modifications.updateValidUntil 
          ? Date.now() + (45 * 24 * 60 * 60 * 1000) // 45 days from now
          : sourceProposal.validUntil,
      };

      // Apply pricing adjustments if specified
      if (pricingAdjustment !== 0) {
        const multiplier = 1 + (pricingAdjustment / 100);
        newProposalData.subtotal = Math.round(newProposalData.subtotal * multiplier);
        newProposalData.totalPrice = Math.round(newProposalData.totalPrice * multiplier);
        newProposalData.components = newProposalData.components.map(component => ({
          ...component,
          unitPrice: Math.round(component.unitPrice * multiplier),
          totalPrice: Math.round(component.totalPrice * multiplier),
        }));
      }

      // Create new proposal
      const result = await ctx.runMutation(internal.domains.packageProposals.mutations.createPackageProposal, {
        ...newProposalData,
        // Remove fields that shouldn't be in the create args
        id: undefined,
        _id: undefined,
        _creationTime: undefined,
        proposalNumber: undefined,
        adminId: undefined,
        partnerId: undefined,
        organizationId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        isActive: undefined,
      });

      return {
        success: result.success,
        newProposalId: result.proposalId,
        message: "Proposta duplicada com sucesso",
      };
    } catch (error) {
      console.error("Error duplicating proposal:", error);
      return {
        success: false,
        message: `Erro ao duplicar proposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});