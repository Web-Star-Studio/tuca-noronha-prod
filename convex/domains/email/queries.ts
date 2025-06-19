import { v } from "convex/values";
import { query } from "../../_generated/server";

/**
 * Buscar logs de email com paginação
 */
export const getEmailLogs = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("booking_confirmation"),
      v.literal("booking_cancelled"),
      v.literal("booking_reminder"),
      v.literal("package_request_received"),
      v.literal("package_request_status_update"),
      v.literal("partner_new_booking"),
      v.literal("welcome_new_user"),
      v.literal("new_partner_registration"),
      v.literal("employee_invitation"),
      v.literal("support_message")
    )),
    status: v.optional(v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("pending")
    )),
  },
  returns: v.object({
    logs: v.array(v.object({
      _id: v.id("emailLogs"),
      _creationTime: v.number(),
      type: v.string(),
      to: v.string(),
      subject: v.string(),
      status: v.string(),
      error: v.optional(v.string()),
      sentAt: v.optional(v.number()),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })),
    hasMore: v.boolean(),
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
      throw new Error("Sem permissão para visualizar logs de email");
    }

    const limit = args.limit || 50;
    let query = ctx.db.query("emailLogs").order("desc");

    // Aplicar filtros
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const logs = await query.take(limit + 1);
    const hasMore = logs.length > limit;

    return {
      logs: logs.slice(0, limit),
      hasMore,
    };
  },
});

/**
 * Buscar estatísticas de email
 */
export const getEmailStats = query({
  args: {
    period: v.optional(v.union(
      v.literal("today"),
      v.literal("week"), 
      v.literal("month"),
      v.literal("year")
    )),
  },
  returns: v.object({
    total: v.number(),
    sent: v.number(),
    failed: v.number(),
    pending: v.number(),
    byType: v.object({
      booking_confirmation: v.number(),
      booking_cancelled: v.number(),
      package_request_received: v.number(),
      partner_new_booking: v.number(),
      welcome_new_user: v.number(),
      support_message: v.number(),
      other: v.number(),
    }),
    successRate: v.number(),
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
      throw new Error("Sem permissão para visualizar estatísticas de email");
    }

    // Calcular período
    const now = Date.now();
    let startTime = 0;

    switch (args.period || "month") {
      case "today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startTime = today.getTime();
        break;
      case "week":
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Buscar logs do período
    const logs = await ctx.db
      .query("emailLogs")
      .withIndex("by_created_at")
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Calcular estatísticas
    const total = logs.length;
    const sent = logs.filter(log => log.status === "sent").length;
    const failed = logs.filter(log => log.status === "failed").length;
    const pending = logs.filter(log => log.status === "pending").length;

    const byType = {
      booking_confirmation: logs.filter(log => log.type === "booking_confirmation").length,
      booking_cancelled: logs.filter(log => log.type === "booking_cancelled").length,
      package_request_received: logs.filter(log => log.type === "package_request_received").length,
      partner_new_booking: logs.filter(log => log.type === "partner_new_booking").length,
      welcome_new_user: logs.filter(log => log.type === "welcome_new_user").length,
      support_message: logs.filter(log => log.type === "support_message").length,
      other: logs.filter(log => ![
        "booking_confirmation",
        "booking_cancelled", 
        "package_request_received",
        "partner_new_booking",
        "welcome_new_user",
        "support_message"
      ].includes(log.type)).length,
    };

    const successRate = total > 0 ? (sent / total) * 100 : 0;

    return {
      total,
      sent,
      failed,
      pending,
      byType,
      successRate: Math.round(successRate * 100) / 100,
    };
  },
});

/**
 * Buscar logs de email por destinatário
 */
export const getEmailLogsByRecipient = query({
  args: {
    email: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("emailLogs"),
    _creationTime: v.number(),
    type: v.string(),
    to: v.string(),
    subject: v.string(),
    status: v.string(),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })),
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
      throw new Error("Sem permissão para visualizar logs de email");
    }

    const limit = args.limit || 20;

    const logs = await ctx.db
      .query("emailLogs")
      .withIndex("by_recipient")
      .filter((q) => q.eq(q.field("to"), args.email))
      .order("desc")
      .take(limit);

    return logs;
  },
});

/**
 * Buscar emails falhados que precisam ser reenviados
 */
export const getFailedEmails = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("emailLogs"),
    _creationTime: v.number(),
    type: v.string(),
    to: v.string(),
    subject: v.string(),
    status: v.string(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    retryAt: v.optional(v.number()),
  })),
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
      throw new Error("Sem permissão para visualizar emails falhados");
    }

    const limit = args.limit || 50;

    const failedEmails = await ctx.db
      .query("emailLogs")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "failed"))
      .order("desc")
      .take(limit);

    return failedEmails;
  },
}); 