import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac/utils";

/**
 * Listar todas as mensagens de suporte (apenas para masters)
 */
export const listSupportMessages = query({
  args: {
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
      v.literal("all")
    )),
    assignedToMe: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("supportMessages"),
    _creationTime: v.number(),
    userId: v.id("users"),
    userRole: v.union(v.literal("traveler"), v.literal("partner"), v.literal("employee"), v.literal("master")),
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
    isUrgent: v.boolean(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedToMasterId: v.optional(v.id("users")),
    responseMessage: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Dados enriquecidos
    user: v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(v.string()),
    }),
    assignedMaster: v.optional(v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    })),
  })),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Apenas masters podem ver mensagens de suporte
    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver mensagens de suporte");
    }

    const limit = args.limit || 50;
    let supportMessages;

    // Filtros
    if (args.status && args.status !== "all") {
      supportMessages = await ctx.db
        .query("supportMessages")
        .withIndex("by_status", (q) => q.eq("status", args.status as "open" | "in_progress" | "resolved" | "closed"))
        .order("desc")
        .take(limit);
    } else if (args.assignedToMe) {
      supportMessages = await ctx.db
        .query("supportMessages")
        .withIndex("by_assigned_master", (q) => q.eq("assignedToMasterId", currentUserId))
        .order("desc")
        .take(limit);
    } else {
      supportMessages = await ctx.db
        .query("supportMessages")
        .order("desc")
        .take(limit);
    }

    // Enriquecer com dados dos usuários
    const enrichedMessages = await Promise.all(
      supportMessages.map(async (message) => {
        // Buscar dados do usuário que criou a mensagem
        const user = await ctx.db.get(message.userId);
        
        // Buscar dados do master atribuído (se existir)
        let assignedMaster: { _id: any; name: string | undefined; email: string | undefined; } | undefined = undefined;
        if (message.assignedToMasterId) {
          const master = await ctx.db.get(message.assignedToMasterId);
          if (master) {
            assignedMaster = {
              _id: master._id,
              name: (master as any).name,
              email: (master as any).email,
            };
          }
        }

        return {
          ...message,
          user: {
            _id: user?._id || ("" as any),
            name: (user as any)?.name,
            email: (user as any)?.email,
            role: (user as any)?.role,
          },
          assignedMaster,
        };
      })
    );

    return enrichedMessages;
  },
});

/**
 * Obter uma mensagem de suporte específica (apenas para masters)
 */
export const getSupportMessage = query({
  args: {
    supportMessageId: v.id("supportMessages"),
  },
  returns: v.union(
    v.object({
      _id: v.id("supportMessages"),
      _creationTime: v.number(),
      userId: v.id("users"),
      userRole: v.union(v.literal("traveler"), v.literal("partner"), v.literal("employee"), v.literal("master")),
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
      isUrgent: v.boolean(),
      status: v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("resolved"),
        v.literal("closed")
      ),
      assignedToMasterId: v.optional(v.id("users")),
      responseMessage: v.optional(v.string()),
      respondedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      // Dados enriquecidos
      user: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        role: v.optional(v.string()),
      }),
      assignedMaster: v.optional(v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Apenas masters podem ver mensagens de suporte
    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver mensagens de suporte");
    }

    const supportMessage = await ctx.db.get(args.supportMessageId);
    if (!supportMessage) {
      return null;
    }

    // Buscar dados do usuário que criou a mensagem
    const user = await ctx.db.get(supportMessage.userId);
    
    // Buscar dados do master atribuído (se existir)
    let assignedMaster: { _id: any; name: string | undefined; email: string | undefined; } | undefined = undefined;
    if (supportMessage.assignedToMasterId) {
      const master = await ctx.db.get(supportMessage.assignedToMasterId);
      if (master) {
        assignedMaster = {
          _id: master._id,
          name: (master as any).name,
          email: (master as any).email,
        };
      }
    }

    return {
      ...supportMessage,
      user: {
        _id: user?._id || ("" as any),
        name: (user as any)?.name,
        email: (user as any)?.email,
        role: (user as any)?.role,
      },
      assignedMaster,
    };
  },
});

/**
 * Estatísticas de mensagens de suporte (apenas para masters)
 */
export const getSupportStatistics = query({
  args: {},
  returns: v.object({
    total: v.number(),
    open: v.number(),
    inProgress: v.number(),
    resolved: v.number(),
    closed: v.number(),
    urgent: v.number(),
    unassigned: v.number(),
    myAssigned: v.number(),
  }),
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Apenas masters podem ver estatísticas de suporte
    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver estatísticas de suporte");
    }

    const allMessages = await ctx.db.query("supportMessages").collect();

    const stats = {
      total: allMessages.length,
      open: allMessages.filter(m => m.status === "open").length,
      inProgress: allMessages.filter(m => m.status === "in_progress").length,
      resolved: allMessages.filter(m => m.status === "resolved").length,
      closed: allMessages.filter(m => m.status === "closed").length,
      urgent: allMessages.filter(m => m.isUrgent).length,
      unassigned: allMessages.filter(m => !m.assignedToMasterId && m.status !== "closed").length,
      myAssigned: allMessages.filter(m => m.assignedToMasterId?.toString() === currentUserId.toString()).length,
    };

    return stats;
  },
});

/**
 * Listar todos os usuários master para atribuição de mensagens
 */
export const listMasterUsers = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const currentUserRole = await getCurrentUserRole(ctx);

    if (currentUserRole !== "master") {
      throw new Error("Apenas administradores master podem ver outros masters");
    }

    const masters = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "master"))
      .collect();

    return masters.map(master => ({
      _id: master._id,
      name: master.name,
      email: master.email,
      role: master.role,
    }));
  },
}); 