import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac/utils";
import type { Id } from "../../_generated/dataModel";

/**
 * Lista as salas de chat do usuário atual
 */
export const listChatRooms = query({
  args: {
    status: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("chatRooms"),
    _creationTime: v.number(),
    contextType: v.union(v.literal("asset"), v.literal("booking")),
    contextId: v.string(),
    assetType: v.optional(v.string()),
    travelerId: v.id("users"),
    partnerId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("closed"), v.literal("archived")),
    title: v.string(),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Dados do outro participante
    otherParticipant: v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(v.string()),
    }),
    // Dados do contexto (asset ou booking)
    contextData: v.optional(v.any()),
    // Contador de mensagens não lidas
    unreadCount: v.number(),
  })),
  handler: async (ctx, args) => {
    // Verificação de autenticação mais robusta
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const currentUserId = user._id;
    const currentUserRole = user.role;

    // Busca as salas de chat do usuário
    let chatRooms;
    
    if (currentUserRole === "master") {
      // Masters podem ver TODAS as salas de chat
      chatRooms = await ctx.db
        .query("chatRooms")
        .collect();
    } else if (currentUserRole === "traveler") {
      chatRooms = await ctx.db
        .query("chatRooms")
        .withIndex("by_traveler", (q) => q.eq("travelerId", currentUserId))
        .collect();
    } else {
      // Partner, employee
      chatRooms = await ctx.db
        .query("chatRooms")
        .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
        .collect();
    }

    // Filtrar por status se especificado
    if (args.status) {
      chatRooms = chatRooms.filter(room => room.status === args.status);
    }

    // Enriquecer com dados dos participantes e contexto
    const enrichedRooms = await Promise.all(
      chatRooms.map(async (room) => {
        // Buscar dados do outro participante
        const otherUserId = currentUserRole === "traveler" ? room.partnerId : room.travelerId;
        const otherUser = await ctx.db.get(otherUserId);

        // Buscar dados do contexto
        let contextData: any = null;
        if (room.contextType === "asset" && room.assetType) {
          switch (room.assetType) {
            case "restaurants":
              contextData = await ctx.db.get(room.contextId as Id<"restaurants">);
              break;
            case "events":
              contextData = await ctx.db.get(room.contextId as Id<"events">);
              break;
            case "activities":
              contextData = await ctx.db.get(room.contextId as Id<"activities">);
              break;
            case "vehicles":
              contextData = await ctx.db.get(room.contextId as Id<"vehicles">);
              break;
            case "accommodations":
              contextData = await ctx.db.get(room.contextId as Id<"accommodations">);
              break;
          }
        }

        // Contar mensagens não lidas
        const unreadMessages = await ctx.db
          .query("chatMessages")
          .withIndex("by_chatroom", (q) => q.eq("chatRoomId", room._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("isRead"), false),
              q.neq(q.field("senderId"), currentUserId)
            )
          )
          .collect();

        return {
          ...room,
          otherParticipant: {
            _id: otherUser?._id || ("" as Id<"users">),
            name: (otherUser as any)?.name,
            email: (otherUser as any)?.email,
            role: (otherUser as any)?.role,
          },
          contextData,
          unreadCount: unreadMessages.length,
        };
      })
    );

    // Ordenar por última atividade
    return enrichedRooms.sort((a, b) => 
      (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
    );
  },
});

/**
 * Busca uma sala de chat específica
 */
export const getChatRoom = query({
  args: {
    chatRoomId: v.id("chatRooms"),
  },
  returns: v.union(
    v.object({
      _id: v.id("chatRooms"),
      _creationTime: v.number(),
      contextType: v.union(v.literal("asset"), v.literal("booking")),
      contextId: v.string(),
      assetType: v.optional(v.string()),
      travelerId: v.id("users"),
      partnerId: v.id("users"),
      status: v.union(v.literal("active"), v.literal("closed"), v.literal("archived")),
      title: v.string(),
      lastMessageAt: v.optional(v.number()),
      lastMessagePreview: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      // Dados dos participantes
      traveler: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        role: v.optional(v.string()),
      }),
      partner: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        role: v.optional(v.string()),
      }),
      // Dados do contexto
      contextData: v.optional(v.any()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Verificação de autenticação mais robusta
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const currentUserId = user._id;

    const chatRoom = await ctx.db.get(args.chatRoomId);
    if (!chatRoom) {
      return null;
    }

    // Verificar se o usuário tem acesso a esta sala
    if (user.role !== "master" && 
        chatRoom.travelerId.toString() !== currentUserId.toString() && 
        chatRoom.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Acesso negado a esta sala de chat");
    }

    // Buscar dados dos participantes
    const traveler = await ctx.db.get(chatRoom.travelerId);
    const partner = await ctx.db.get(chatRoom.partnerId);

    // Buscar dados do contexto
    let contextData: any = null;
    if (chatRoom.contextType === "asset" && chatRoom.assetType) {
      switch (chatRoom.assetType) {
        case "restaurants":
          contextData = await ctx.db.get(chatRoom.contextId as Id<"restaurants">);
          break;
        case "events":
          contextData = await ctx.db.get(chatRoom.contextId as Id<"events">);
          break;
        case "activities":
          contextData = await ctx.db.get(chatRoom.contextId as Id<"activities">);
          break;
        case "vehicles":
          contextData = await ctx.db.get(chatRoom.contextId as Id<"vehicles">);
          break;
        case "accommodations":
          contextData = await ctx.db.get(chatRoom.contextId as Id<"accommodations">);
          break;
      }
    }

    return {
      ...chatRoom,
      traveler: {
        _id: traveler?._id || ("" as Id<"users">),
        name: traveler?.name,
        email: traveler?.email,
        role: traveler?.role,
      },
      partner: {
        _id: partner?._id || ("" as Id<"users">),
        name: partner?.name,
        email: partner?.email,
        role: partner?.role,
      },
      contextData,
    };
  },
});

/**
 * Lista as mensagens de uma sala de chat
 */
export const listChatMessages = query({
  args: {
    chatRoomId: v.id("chatRooms"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("chatMessages"),
    _creationTime: v.number(),
    chatRoomId: v.id("chatRooms"),
    senderId: v.id("users"),
    senderRole: v.union(v.literal("traveler"), v.literal("partner"), v.literal("employee"), v.literal("master")),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("image"), v.literal("file"), v.literal("system")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Dados do remetente
    sender: v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(v.string()),
    }),
  })),
  handler: async (ctx, args) => {
    // Verificação de autenticação mais robusta
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const currentUserId = user._id;

    // Verificar acesso à sala de chat
    const chatRoom = await ctx.db.get(args.chatRoomId);
    if (!chatRoom) {
      throw new Error("Sala de chat não encontrada");
    }

    if (user.role !== "master" &&
        chatRoom.travelerId.toString() !== currentUserId.toString() && 
        chatRoom.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Acesso negado a esta sala de chat");
    }

    // Buscar mensagens
    const limit = args.limit || 50;
    let messagesQuery = ctx.db
      .query("chatMessages")
      .withIndex("by_chatroom_timestamp", (q) => 
        q.eq("chatRoomId", args.chatRoomId)
      )
      .order("desc")
      .take(limit);

    const messages = await messagesQuery;

    // Enriquecer com dados do remetente
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: {
            _id: sender?._id || ("" as Id<"users">),
            name: sender?.name,
            email: sender?.email,
            role: sender?.role,
          },
        };
      })
    );

    // Retornar em ordem cronológica (mais antigas primeiro)
    return enrichedMessages.reverse();
  },
});

/**
 * Busca ou cria uma sala de chat para um contexto específico
 */
export const findOrCreateChatRoom = query({
  args: {
    contextType: v.union(v.literal("asset"), v.literal("booking")),
    contextId: v.string(),
    assetType: v.optional(v.string()),
    partnerId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("chatRooms"),
      exists: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Primeiro verificar se o usuário está autenticado
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      // Em vez de quebrar, vamos retornar null para que o frontend saiba que não há autenticação
      console.log("findOrCreateChatRoom: Usuário não autenticado, retornando null");
      return null;
    }

    // Buscar o usuário no banco usando o identity
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      // Se o usuário não existe no banco, também retornar null
      console.log("findOrCreateChatRoom: Usuário não encontrado no banco, retornando null");
      return null;
    }

    const currentUserId = user._id;
    const currentUserRole = user.role;

    // Para chats relacionados a assets (páginas públicas), permitir acesso a todos os usuários
    // Para outros contextos como bookings, manter a restrição apenas para travelers
    if (args.contextType === "booking" && currentUserRole !== "traveler") {
      console.log("findOrCreateChatRoom: Acesso negado para bookings - usuário não é traveler");
      return null;
    }

    // Verificar se já existe uma sala de chat para este contexto
    const existingRoom = await ctx.db
      .query("chatRooms")
      .withIndex("by_context", (q) => 
        q.eq("contextType", args.contextType).eq("contextId", args.contextId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("travelerId"), currentUserId),
          q.eq(q.field("partnerId"), args.partnerId)
        )
      )
      .first();

    if (existingRoom) {
      return {
        _id: existingRoom._id,
        exists: true,
      };
    }

    return null;
  },
});