import { v } from "convex/values";
import { mutation, query, internalQuery } from "../../_generated/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import { createAuditLog } from "../audit/utils";
import type { Doc, Id } from "../../_generated/dataModel";

// Template validators
export const PackageProposalTemplateCategory = v.union(
  v.literal("adventure"),
  v.literal("leisure"),
  v.literal("business"),
  v.literal("family"),
  v.literal("honeymoon"),
  v.literal("luxury"),
  v.literal("budget"),
  v.literal("custom")
);

export const PackageProposalTemplatePriority = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent")
);

export const CreatePackageProposalTemplateArgs = v.object({
  name: v.string(),
  description: v.string(),
  category: PackageProposalTemplateCategory,
  titleTemplate: v.string(),
  descriptionTemplate: v.string(),
  summaryTemplate: v.optional(v.string()),
  defaultComponents: v.array(v.object({
    type: v.union(
      v.literal("accommodation"),
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("transfer"),
      v.literal("guide"),
      v.literal("insurance"),
      v.literal("other")
    ),
    name: v.string(),
    description: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    included: v.boolean(),
    optional: v.boolean(),
    notes: v.optional(v.string()),
  })),
  defaultPricing: v.object({
    taxRate: v.number(),
    feeRate: v.number(),
    currency: v.string(),
  }),
  paymentTermsTemplate: v.string(),
  cancellationPolicyTemplate: v.string(),
  defaultInclusions: v.array(v.string()),
  defaultExclusions: v.array(v.string()),
  variables: v.array(v.string()),
  validityDays: v.number(),
  requiresApproval: v.boolean(),
  priority: PackageProposalTemplatePriority,
  isActive: v.boolean(),
  isPublic: v.boolean(),
});

export const UpdatePackageProposalTemplateArgs = v.object({
  id: v.id("packageProposalTemplates"),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.optional(PackageProposalTemplateCategory),
  titleTemplate: v.optional(v.string()),
  descriptionTemplate: v.optional(v.string()),
  summaryTemplate: v.optional(v.string()),
  defaultComponents: v.optional(v.array(v.object({
    type: v.union(
      v.literal("accommodation"),
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("transfer"),
      v.literal("guide"),
      v.literal("insurance"),
      v.literal("other")
    ),
    name: v.string(),
    description: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    included: v.boolean(),
    optional: v.boolean(),
    notes: v.optional(v.string()),
  }))),
  defaultPricing: v.optional(v.object({
    taxRate: v.number(),
    feeRate: v.number(),
    currency: v.string(),
  })),
  paymentTermsTemplate: v.optional(v.string()),
  cancellationPolicyTemplate: v.optional(v.string()),
  defaultInclusions: v.optional(v.array(v.string())),
  defaultExclusions: v.optional(v.array(v.string())),
  variables: v.optional(v.array(v.string())),
  validityDays: v.optional(v.number()),
  requiresApproval: v.optional(v.boolean()),
  priority: v.optional(PackageProposalTemplatePriority),
  isActive: v.optional(v.boolean()),
  isPublic: v.optional(v.boolean()),
});

export const ListPackageProposalTemplatesArgs = v.object({
  category: v.optional(PackageProposalTemplateCategory),
  partnerId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("partnerOrganizations")),
  isActive: v.optional(v.boolean()),
  isPublic: v.optional(v.boolean()),
  searchTerm: v.optional(v.string()),
  limit: v.optional(v.number()),
  cursor: v.optional(v.string()),
});

/**
 * Create a new package proposal template
 */
export const createPackageProposalTemplate = mutation({
  args: CreatePackageProposalTemplateArgs,
  returns: v.object({
    success: v.boolean(),
    templateId: v.optional(v.id("packageProposalTemplates")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can create templates
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Apenas administradores podem criar templates");
    }

    const now = Date.now();
    const user = await ctx.db.get(currentUserId);

    // Create the template
    const templateId = await ctx.db.insert("packageProposalTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      titleTemplate: args.titleTemplate,
      descriptionTemplate: args.descriptionTemplate,
      summaryTemplate: args.summaryTemplate,
      defaultComponents: args.defaultComponents,
      defaultPricing: args.defaultPricing,
      paymentTermsTemplate: args.paymentTermsTemplate,
      cancellationPolicyTemplate: args.cancellationPolicyTemplate,
      defaultInclusions: args.defaultInclusions,
      defaultExclusions: args.defaultExclusions,
      variables: args.variables,
      validityDays: args.validityDays,
      requiresApproval: args.requiresApproval,
      priority: args.priority,
      isActive: args.isActive,
      isPublic: args.isPublic,
      partnerId: currentUserRole === "master" ? undefined : currentUserId,
      organizationId: user?.organizationId,
      createdBy: currentUserId,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_template_create",
        action: `Template de proposta criado: ${args.name}`,
        category: "template_management",
        severity: "medium",
      },
      resource: {
        type: "package_proposal_template",
        id: templateId.toString(),
        name: args.name,
        partnerId: currentUserRole === "master" ? undefined : currentUserId,
      },
      metadata: {
        category: args.category,
        isPublic: args.isPublic,
        componentCount: args.defaultComponents.length,
        validityDays: args.validityDays,
      },
      status: "success",
    });

    return {
      success: true,
      templateId,
      message: "Template criado com sucesso",
    };
  },
});

/**
 * Update an existing package proposal template
 */
export const updatePackageProposalTemplate = mutation({
  args: UpdatePackageProposalTemplateArgs,
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

    // Get the template
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template não encontrado");
    }

    // Check permissions
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    if (currentUserRole !== "master" && template.partnerId !== currentUserId) {
      throw new Error("Você só pode editar seus próprios templates");
    }

    const now = Date.now();
    const updates: any = {
      updatedAt: now,
      updatedBy: currentUserId,
    };

    // Build update object
    Object.keys(args).forEach(key => {
      if (key !== "id" && args[key as keyof typeof args] !== undefined) {
        updates[key] = args[key as keyof typeof args];
      }
    });

    // Update the template
    await ctx.db.patch(args.id, updates);

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_template_update",
        action: `Template de proposta atualizado: ${template.name}`,
        category: "template_management",
        severity: "low",
      },
      resource: {
        type: "package_proposal_template",
        id: args.id.toString(),
        name: template.name,
        partnerId: template.partnerId,
      },
      metadata: {
        updatedFields: Object.keys(updates).filter(key => key !== "updatedAt" && key !== "updatedBy"),
      },
      status: "success",
    });

    return {
      success: true,
      message: "Template atualizado com sucesso",
    };
  },
});

/**
 * List package proposal templates with filtering
 */
export const listPackageProposalTemplates = query({
  args: ListPackageProposalTemplatesArgs,
  returns: v.object({
    templates: v.array(v.any()),
    total: v.number(),
    hasMore: v.boolean(),
    cursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const limit = args.limit || 20;

    let query;

    // Base query with permissions
    if (currentUserRole === "master") {
      query = ctx.db.query("packageProposalTemplates");
    } else {
      // Non-masters can only see public templates or their own templates
      query = ctx.db
        .query("packageProposalTemplates")
        .filter(q => 
          q.or(
            q.eq(q.field("isPublic"), true),
            q.eq(q.field("partnerId"), currentUserId)
          )
        );
    }

    // Apply filters
    if (args.category) {
      query = query.filter(q => q.eq(q.field("category"), args.category));
    }
    if (args.partnerId && currentUserRole === "master") {
      query = query.filter(q => q.eq(q.field("partnerId"), args.partnerId));
    }
    if (args.organizationId && currentUserRole === "master") {
      query = query.filter(q => q.eq(q.field("organizationId"), args.organizationId));
    }
    if (args.isActive !== undefined) {
      query = query.filter(q => q.eq(q.field("isActive"), args.isActive));
    }
    if (args.isPublic !== undefined) {
      query = query.filter(q => q.eq(q.field("isPublic"), args.isPublic));
    }

    if (args.searchTerm) {
      query = query.filter(q => 
        q.or(
          q.eq(q.field("name"), args.searchTerm),
          q.eq(q.field("description"), args.searchTerm)
        )
      );
    }

    const paginatedTemplates = await query
      .order("desc")
      .paginate({ numItems: limit, cursor: args.cursor ?? null });

    // Create a separate query for total count
    let countQuery;
    if (currentUserRole === "master") {
      countQuery = ctx.db.query("packageProposalTemplates");
    } else {
      countQuery = ctx.db
        .query("packageProposalTemplates")
        .filter(q => 
          q.or(
            q.eq(q.field("isPublic"), true),
            q.eq(q.field("partnerId"), currentUserId)
          )
        );
    }

    // Apply the same filters to count query
    if (args.category) {
      countQuery = countQuery.filter(q => q.eq(q.field("category"), args.category));
    }
    if (args.partnerId && currentUserRole === "master") {
      countQuery = countQuery.filter(q => q.eq(q.field("partnerId"), args.partnerId));
    }
    if (args.organizationId && currentUserRole === "master") {
      countQuery = countQuery.filter(q => q.eq(q.field("organizationId"), args.organizationId));
    }
    if (args.isActive !== undefined) {
      countQuery = countQuery.filter(q => q.eq(q.field("isActive"), args.isActive));
    }
    if (args.isPublic !== undefined) {
      countQuery = countQuery.filter(q => q.eq(q.field("isPublic"), args.isPublic));
    }
    if (args.searchTerm) {
      countQuery = countQuery.filter(q => 
        q.or(
          q.eq(q.field("name"), args.searchTerm),
          q.eq(q.field("description"), args.searchTerm)
        )
      );
    }

    const total = (await countQuery.collect()).length;

    return {
      templates: paginatedTemplates.page,
      total,
      hasMore: paginatedTemplates.isDone,
      cursor: paginatedTemplates.continueCursor,
    };
  },
});

/**
 * Get a specific package proposal template by ID
 */
export const getPackageProposalTemplate = query({
  args: {
    id: v.id("packageProposalTemplates"),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const template = await ctx.db.get(args.id);
    if (!template) {
      return null;
    }

    // Check permissions
    if (currentUserRole === "master") {
      return template;
    }

    if (template.isPublic || template.partnerId === currentUserId) {
      return template;
    }

    throw new Error("Acesso negado a este template");
  },
});

/**
 * Delete a package proposal template (soft delete)
 */
export const deletePackageProposalTemplate = mutation({
  args: {
    id: v.id("packageProposalTemplates"),
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

    // Get the template
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template não encontrado");
    }

    // Check permissions
    if (!["master", "partner"].includes(currentUserRole)) {
      throw new Error("Apenas masters e parceiros podem deletar templates");
    }

    if (currentUserRole !== "master" && template.partnerId !== currentUserId) {
      throw new Error("Você só pode deletar seus próprios templates");
    }

    // Soft delete by deactivating
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
      updatedBy: currentUserId,
    });

    // Create audit log
    await createAuditLog(ctx, {
      event: {
        type: "package_proposal_template_delete",
        action: `Template de proposta deletado: ${template.name}`,
        category: "template_management",
        severity: "high",
      },
      resource: {
        type: "package_proposal_template",
        id: args.id.toString(),
        name: template.name,
        partnerId: template.partnerId,
      },
      metadata: {
        reason: args.reason,
        usageCount: template.usageCount,
      },
      status: "success",
    });

    return {
      success: true,
      message: "Template deletado com sucesso",
    };
  },
});

/**
 * Apply template to create proposal data
 */
export const applyProposalTemplate = query({
  args: {
    templateId: v.id("packageProposalTemplates"),
    packageRequestId: v.id("packageRequests"),
    variables: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    proposalData: v.optional(v.any()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      return {
        success: false,
        message: "Template não encontrado",
      };
    }

    // Check permissions
    if (currentUserRole !== "master" && !template.isPublic && template.partnerId !== currentUserId) {
      return {
        success: false,
        message: "Acesso negado a este template",
      };
    }

    // Get package request for context
    const packageRequest = await ctx.db.get(args.packageRequestId);
    if (!packageRequest) {
      return {
        success: false,
        message: "Solicitação de pacote não encontrada",
      };
    }

    // Build default variables from package request
    const defaultVariables = {
      destination: packageRequest.tripDetails?.destination || "",
      adults: packageRequest.tripDetails?.groupSize?.toString() || "1",
      children: "0", // Not tracked separately in current schema
      budget: packageRequest.tripDetails?.budget?.toString() || "0",
      duration: packageRequest.tripDetails?.duration?.toString() || "3",
      startDate: packageRequest.tripDetails?.startDate ? new Date(packageRequest.tripDetails.startDate).toLocaleDateString("pt-BR") : "",
      endDate: packageRequest.tripDetails?.endDate ? new Date(packageRequest.tripDetails.endDate).toLocaleDateString("pt-BR") : "",
    };

    const variables = { ...defaultVariables, ...(args.variables || {}) };

    // Process templates with variables
    const processTemplate = (template: string, vars: Record<string, string>) => {
      let processed = template;
      Object.entries(vars).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        processed = processed.replace(new RegExp(placeholder, 'g'), value);
      });
      return processed;
    };

    // Create proposal data
    const proposalData = {
      title: processTemplate(template.titleTemplate, variables),
      description: processTemplate(template.descriptionTemplate, variables),
      summary: template.summaryTemplate ? processTemplate(template.summaryTemplate, variables) : undefined,
      components: template.defaultComponents,
      paymentTerms: processTemplate(template.paymentTermsTemplate, variables),
      cancellationPolicy: processTemplate(template.cancellationPolicyTemplate, variables),
      inclusions: template.defaultInclusions,
      exclusions: template.defaultExclusions,
      validUntil: Date.now() + (template.validityDays * 24 * 60 * 60 * 1000),
      priority: template.priority,
      requiresApproval: template.requiresApproval,
      currency: template.defaultPricing.currency,
      taxRate: template.defaultPricing.taxRate,
      feeRate: template.defaultPricing.feeRate,
    };

    // Note: Usage count is incremented when the proposal is actually created, not just when template is applied
    return {
      success: true,
      proposalData,
      message: "Template aplicado com sucesso",
    };
  },
});

/**
 * Internal query to get template for proposal creation
 */
export const internalGetTemplate = internalQuery({
  args: {
    id: v.id("packageProposalTemplates"),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
}); 