import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac";

// Template validators
export const MessageTemplateArgs = v.object({
  name: v.string(),
  category: v.union(
    v.literal("greeting"),
    v.literal("booking_confirmation"),
    v.literal("booking_modification"),
    v.literal("cancellation"),
    v.literal("payment_reminder"),
    v.literal("special_request"),
    v.literal("follow_up"),
    v.literal("escalation"),
    v.literal("closing")
  ),
  assetType: v.optional(v.union(
    v.literal("activities"),
    v.literal("events"), 
    v.literal("restaurants"),
    v.literal("vehicles"),
    
    v.literal("packages"),
    v.literal("general")
  )),
  subject: v.string(),
  content: v.string(),
  variables: v.array(v.string()), // Available variables like {customerName}, {assetTitle}
  isActive: v.boolean(),
  partnerId: v.optional(v.id("users")), // Partner-specific templates
  language: v.optional(v.string()) // Language code (pt, en, es)
});

export const UpdateTemplateArgs = v.object({
  id: v.id("chatMessageTemplates"),
  name: v.optional(v.string()),
  category: v.optional(v.union(
    v.literal("greeting"),
    v.literal("booking_confirmation"),
    v.literal("booking_modification"),
    v.literal("cancellation"),
    v.literal("payment_reminder"),
    v.literal("special_request"),
    v.literal("follow_up"),
    v.literal("escalation"),
    v.literal("closing")
  )),
  assetType: v.optional(v.union(
    v.literal("activities"),
    v.literal("events"), 
    v.literal("restaurants"),
    v.literal("vehicles"),
    
    v.literal("packages"),
    v.literal("general")
  )),
  subject: v.optional(v.string()),
  content: v.optional(v.string()),
  variables: v.optional(v.array(v.string())),
  isActive: v.optional(v.boolean()),
  language: v.optional(v.string())
});

export const ListTemplatesArgs = v.object({
  category: v.optional(v.union(
    v.literal("greeting"),
    v.literal("booking_confirmation"),
    v.literal("booking_modification"),
    v.literal("cancellation"),
    v.literal("payment_reminder"),
    v.literal("special_request"),
    v.literal("follow_up"),
    v.literal("escalation"),
    v.literal("closing")
  )),
  assetType: v.optional(v.union(
    v.literal("activities"),
    v.literal("events"), 
    v.literal("restaurants"),
    v.literal("vehicles"),
    
    v.literal("packages"),
    v.literal("general")
  )),
  language: v.optional(v.string()),
  partnerId: v.optional(v.id("users")),
  isActive: v.optional(v.boolean()),
  limit: v.optional(v.number())
});

// Query templates
export const listMessageTemplates = query({
  args: ListTemplatesArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getCurrentUserConvexId(ctx);
    if (!user) {
      throw new Error("User not found");
    }
    const userRole = await getCurrentUserRole(ctx);

    // Build query filters
    let templates = await ctx.db.query("chatMessageTemplates").collect();

    // Filter by partner if specified or if user is partner/employee
    if (args.partnerId) {
      templates = templates.filter(t => t.partnerId === args.partnerId);
    } else if (userRole === "partner") {
      templates = templates.filter(t => !t.partnerId || t.partnerId === user);
    } else if (userRole === "employee") {
      // Employee sees their partner's templates + system templates
      const userDoc = await ctx.db.get(user);
      if (userDoc?.partnerId) {
        templates = templates.filter(
          t => !t.partnerId || t.partnerId === userDoc.partnerId
        );
      }
    }

    // Apply filters
    if (args.category) {
      templates = templates.filter(t => t.category === args.category);
    }
    
    if (args.assetType) {
      templates = templates.filter(t => !t.assetType || t.assetType === args.assetType || t.assetType === "general");
    }
    
    if (args.language) {
      templates = templates.filter(t => !t.language || t.language === args.language);
    }
    
    if (args.isActive !== undefined) {
      templates = templates.filter(t => t.isActive === args.isActive);
    }

    // Sort by category and name
    templates.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    // Apply limit
    if (args.limit) {
      templates = templates.slice(0, args.limit);
    }

    return templates;
  }
});

// Get template by ID
export const getMessageTemplate = query({
  args: { id: v.id("chatMessageTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }

    const userRole = await getCurrentUserRole(ctx);
    const user = await getCurrentUserConvexId(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    // Check access permissions
    if (template.partnerId) {
      if (userRole === "partner" && template.partnerId !== user) {
        throw new Error("Access denied");
      }
      if (userRole === "employee") {
        const userDoc = await ctx.db.get(user);
        if (userDoc?.partnerId !== template.partnerId) {
          throw new Error("Access denied");
        }
      }
    }

    return template;
  }
});

// Create template
export const createMessageTemplate = mutation({
  args: MessageTemplateArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userRole = await getCurrentUserRole(ctx);
    const user = await getCurrentUserConvexId(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    // Only admins can create templates
    if (!["master", "partner", "employee"].includes(userRole)) {
      throw new Error("Insufficient permissions");
    }

    // Set partnerId for partner/employee templates
    let partnerId = args.partnerId;
    if (userRole === "partner") {
      partnerId = user;
    } else if (userRole === "employee") {
      const userDoc = await ctx.db.get(user);
      partnerId = userDoc?.partnerId ?? undefined;
    }

    const templateId = await ctx.db.insert("chatMessageTemplates", {
      name: args.name,
      category: args.category,
      assetType: args.assetType,
      subject: args.subject,
      content: args.content,
      variables: args.variables,
      isActive: args.isActive,
      partnerId,
      language: args.language || "pt",
      createdBy: user,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return templateId;
  }
});

// Update template
export const updateMessageTemplate = mutation({
  args: UpdateTemplateArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getCurrentUserConvexId(ctx);
    if (!user) {
      throw new Error("User not found");
    }
    const userRole = await getCurrentUserRole(ctx);

    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check permissions
    if (template.partnerId) {
      if (userRole === "partner" && template.partnerId !== user) {
        throw new Error("Access denied");
      }
      if (userRole === "employee") {
        const userDoc = await ctx.db.get(user);
        if (userDoc?.partnerId !== template.partnerId) {
          throw new Error("Access denied");
        }
      }
    } else if (userRole !== "master") {
      throw new Error("Only master admins can edit system templates");
    }

    // Check access: only creator or admin/partner can update
    if (template.createdBy !== user && !["master", "partner"].includes(userRole)) {
      if (userRole === 'employee') {
        const userDoc = await ctx.db.get(user);
        if (userDoc?.partnerId !== template.partnerId) {
          throw new Error("Insufficient permissions");
        }
      } else {
        throw new Error("Insufficient permissions");
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
      updatedBy: user
    };

    // Apply updates
    if (args.name !== undefined) updates.name = args.name;
    if (args.category !== undefined) updates.category = args.category;
    if (args.assetType !== undefined) updates.assetType = args.assetType;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.content !== undefined) updates.content = args.content;
    if (args.variables !== undefined) updates.variables = args.variables;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.language !== undefined) updates.language = args.language;

    await ctx.db.patch(args.id, updates);

    return args.id;
  }
});

// Delete template
export const deleteMessageTemplate = mutation({
  args: { id: v.id("chatMessageTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const user = await getCurrentUserConvexId(ctx);
    const userRole = await getCurrentUserRole(ctx);

    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check access: only creator or admin/partner can delete
    if (template.createdBy !== user && !["master", "partner"].includes(userRole)) {
      if (userRole === 'employee') {
        const userDoc = await ctx.db.get(user!);
        if (userDoc?.partnerId !== template.partnerId) {
          throw new Error("Insufficient permissions");
        }
      } else {
        throw new Error("Insufficient permissions");
      }
    }

    await ctx.db.delete(args.id);

    return true;
  }
});

// Process template with variables
export const processTemplate = query({
  args: {
    templateId: v.id("chatMessageTemplates"),
    variables: v.record(v.string(), v.string()) // Key-value pairs for template variables
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    let processedSubject = template.subject;
    let processedContent = template.content;

    // Replace variables in both subject and content
    Object.entries(args.variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
      subject: processedSubject,
      content: processedContent,
      category: template.category,
      assetType: template.assetType
    };
  }
});