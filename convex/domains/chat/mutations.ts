import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac";
import type { Id } from "../../_generated/dataModel";

// Tipos para os diferentes assets
type AssetType = {
  name?: string;
  title?: string;
} | null;

/**
 * Cria uma nova sala de chat ou retorna uma existente
 */
export const createChatRoom = mutation({
  args: {
    contextType: v.union(v.literal("asset"), v.literal("booking")),
    contextId: v.string(),
    assetType: v.optional(v.string()),
    partnerId: v.id("users"),
    title: v.string(),
    initialMessage: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id("chatRooms"),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Para chats relacionados a assets (páginas públicas), permitir acesso a todos os usuários
    // Para outros contextos como bookings, manter a restrição apenas para travelers
    if (args.contextType === "booking" && currentUserRole !== "traveler") {
      throw new Error("Apenas viajantes podem iniciar conversas sobre reservas");
    }

    // Verificar se já existe uma sala de chat para este contexto
    const existingChatRoom = await ctx.db
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

    if (existingChatRoom) {
      return {
        _id: existingChatRoom._id,
        success: true,
      };
    }

    const now = Date.now();

    // Criar nova sala de chat
    const chatRoomId = await ctx.db.insert("chatRooms", {
      contextType: args.contextType,
      contextId: args.contextId,
      assetType: args.assetType,
      travelerId: currentUserId,
      partnerId: args.partnerId,
      status: "active",
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });

    // Buscar informações do usuário atual e do partner para as notificações
    const currentUser = await ctx.db.get(currentUserId);
    const partner = await ctx.db.get(args.partnerId);
    
    // Buscar informações do contexto para enriquecer a notificação
    let contextData: any = {};
    if (args.contextType === "asset" && args.assetType) {
      // Buscar o asset baseado no tipo usando Id conversion
      let asset: AssetType = null;
      try {
        const assetId = args.contextId as Id<any>;
        switch (args.assetType) {
          case "restaurants":
            asset = await ctx.db.get(assetId);
            break;
          case "events":
            asset = await ctx.db.get(assetId);
            break;
          case "activities":
            asset = await ctx.db.get(assetId);
            break;
          case "vehicles":
            asset = await ctx.db.get(assetId);
            break;
          case "accommodations":
            asset = await ctx.db.get(assetId);
            break;
        }
      } catch (error) {
        console.warn("Failed to fetch asset:", error);
      }
      
      if (asset) {
        contextData = {
          assetName: asset.name || asset.title || "Asset desconhecido",
          assetType: args.assetType,
        };
      }
    }

    // Criar notificação para o partner sobre a nova conversa
    await ctx.db.insert("notifications", {
      userId: args.partnerId,
      type: "chat_room_created",
      title: "Nova Conversa Iniciada",
      message: `${currentUser?.name || 'Um usuário'} iniciou uma conversa${contextData.assetName ? ` sobre ${contextData.assetName}` : ''}`,
      relatedId: chatRoomId.toString(),
      relatedType: "chat_room",
      isRead: false,
      data: {
        travelerName: currentUser?.name,
        contextType: args.contextType,
        ...contextData,
      },
      createdAt: now,
    });

    // Enviar mensagem de boas-vindas do sistema
    await ctx.db.insert("chatMessages", {
      chatRoomId,
      senderId: currentUserId,
      senderRole: currentUserRole as "traveler" | "partner" | "employee" | "master",
      content: "Conversa iniciada. Como posso ajudá-lo?",
      messageType: "system",
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    // Se houver mensagem inicial, enviá-la
    if (args.initialMessage && args.initialMessage.trim()) {
      await ctx.db.insert("chatMessages", {
        chatRoomId,
        senderId: currentUserId,
        senderRole: currentUserRole as "traveler" | "partner" | "employee" | "master",
        content: args.initialMessage.trim(),
        messageType: "text",
        isRead: false,
        createdAt: now + 1, // +1ms para manter ordem
        updatedAt: now + 1,
      });

      // Criar notificação para o partner sobre a mensagem inicial
      await ctx.db.insert("notifications", {
        userId: args.partnerId,
        type: "chat_message",
        title: "Nova Mensagem de Chat",
        message: `${currentUser?.name || 'Usuário'} enviou uma mensagem${contextData.assetName ? ` sobre ${contextData.assetName}` : ''}: "${args.initialMessage.trim().substring(0, 50)}${args.initialMessage.trim().length > 50 ? '...' : ''}"`,
        relatedId: chatRoomId.toString(),
        relatedType: "chat_room",
        isRead: false,
        data: {
          senderName: currentUser?.name,
          messagePreview: args.initialMessage.trim().substring(0, 100),
          contextType: args.contextType,
          ...contextData,
        },
        createdAt: now + 1,
      });

      // Atualizar sala de chat com última mensagem
      await ctx.db.patch(chatRoomId, {
        lastMessageAt: now + 1,
        lastMessagePreview: args.initialMessage.trim().substring(0, 100),
        updatedAt: now + 1,
      });
    }

    return {
      _id: chatRoomId,
      success: true,
    };
  },
});

/**
 * Envia uma mensagem em uma sala de chat
 */
export const sendMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    content: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("file"))),
  },
  returns: v.object({
    _id: v.id("chatMessages"),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar acesso à sala de chat
    const chatRoom = await ctx.db.get(args.chatRoomId);
    if (!chatRoom) {
      throw new Error("Sala de chat não encontrada");
    }

    if (chatRoom.travelerId.toString() !== currentUserId.toString() && 
        chatRoom.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Acesso negado a esta sala de chat");
    }

    // Verificar se a sala está ativa
    if (chatRoom.status === "closed" || chatRoom.status === "archived") {
      throw new Error("Não é possível enviar mensagens em uma conversa fechada");
    }

    const now = Date.now();
    const messageType = args.messageType || "text";

    // Buscar informações do remetente e do destinatário
    const sender = await ctx.db.get(currentUserId);
    const recipientId = chatRoom.travelerId.toString() === currentUserId.toString() 
      ? chatRoom.partnerId 
      : chatRoom.travelerId;

    // Buscar informações do contexto para enriquecer a notificação
    let contextData: any = {};
    if (chatRoom.contextType === "asset" && chatRoom.assetType) {
      // Buscar o asset baseado no tipo usando Id conversion
      let asset: AssetType = null;
      try {
        const assetId = chatRoom.contextId as Id<any>;
        switch (chatRoom.assetType) {
          case "restaurants":
            asset = await ctx.db.get(assetId);
            break;
          case "events":
            asset = await ctx.db.get(assetId);
            break;
          case "activities":
            asset = await ctx.db.get(assetId);
            break;
          case "vehicles":
            asset = await ctx.db.get(assetId);
            break;
          case "accommodations":
            asset = await ctx.db.get(assetId);
            break;
        }
      } catch (error) {
        console.warn("Failed to fetch asset:", error);
      }
      
      if (asset) {
        contextData = {
          assetName: asset.name || asset.title || "Asset desconhecido",
          assetType: chatRoom.assetType,
        };
      }
    } else if (chatRoom.contextType === "booking") {
      // Para reservas, podemos buscar informações do booking
      contextData = {
        bookingCode: chatRoom.contextId,
      };
    }

    // Inserir mensagem
    const messageId = await ctx.db.insert("chatMessages", {
      chatRoomId: args.chatRoomId,
      senderId: currentUserId,
      senderRole: currentUserRole as "traveler" | "partner" | "employee" | "master",
      content: args.content.trim(),
      messageType,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    // Criar notificação para o destinatário (apenas mensagens de texto por enquanto)
    if (messageType === "text") {
      const messagePreview = args.content.trim().substring(0, 100);
      const contextInfo = contextData.assetName 
        ? ` sobre ${contextData.assetName}`
        : contextData.bookingCode 
          ? ` sobre reserva ${contextData.bookingCode}`
          : '';

      await ctx.db.insert("notifications", {
        userId: recipientId,
        type: "chat_message",
        title: "Nova Mensagem de Chat",
        message: `${sender?.name || 'Usuário'} enviou uma mensagem${contextInfo}: "${args.content.trim().substring(0, 50)}${args.content.trim().length > 50 ? '...' : ''}"`,
        relatedId: args.chatRoomId.toString(),
        relatedType: "chat_room",
        isRead: false,
        data: {
          senderName: sender?.name,
          messagePreview,
          contextType: chatRoom.contextType,
          ...contextData,
        },
        createdAt: now,
      });
    }

    // Atualizar sala de chat com última mensagem
    await ctx.db.patch(args.chatRoomId, {
      lastMessageAt: now,
      lastMessagePreview: args.content.trim().substring(0, 100),
      updatedAt: now,
      status: "active", // Reativar se estava inativa
    });

    return {
      _id: messageId,
      success: true,
    };
  },
});

/**
 * Marca mensagens como lidas
 */
export const markMessagesAsRead = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    messageIds: v.optional(v.array(v.id("chatMessages"))), // Se não especificado, marca todas como lidas
  },
  returns: v.object({
    success: v.boolean(),
    markedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar acesso à sala de chat
    const chatRoom = await ctx.db.get(args.chatRoomId);
    if (!chatRoom) {
      throw new Error("Sala de chat não encontrada");
    }

    if (chatRoom.travelerId.toString() !== currentUserId.toString() && 
        chatRoom.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Acesso negado a esta sala de chat");
    }

    const now = Date.now();
    let messagesToMark;

    if (args.messageIds && args.messageIds.length > 0) {
      // Marcar mensagens específicas
      messagesToMark = await Promise.all(
        args.messageIds.map(async (messageId) => {
          const message = await ctx.db.get(messageId);
          if (message && 
              message.chatRoomId.toString() === args.chatRoomId.toString() &&
              message.senderId.toString() !== currentUserId.toString() &&
              !message.isRead) {
            return message;
          }
          return null;
        })
      );
      messagesToMark = messagesToMark.filter(Boolean);
    } else {
      // Marcar todas as mensagens não lidas da sala que não foram enviadas pelo usuário atual
      messagesToMark = await ctx.db
        .query("chatMessages")
        .withIndex("by_chatroom", (q) => q.eq("chatRoomId", args.chatRoomId))
        .filter((q) => 
          q.and(
            q.eq(q.field("isRead"), false),
            q.neq(q.field("senderId"), currentUserId)
          )
        )
        .collect();
    }

    // Marcar mensagens como lidas
    await Promise.all(
      messagesToMark.map(async (message) => {
        if (message) {
          await ctx.db.patch(message._id, {
            isRead: true,
            readAt: now,
            updatedAt: now,
          });
        }
      })
    );

    return {
      success: true,
      markedCount: messagesToMark.length,
    };
  },
});

/**
 * Atualiza o status de uma sala de chat
 */
export const updateChatRoomStatus = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    status: v.union(v.literal("active"), v.literal("closed"), v.literal("archived")),
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

    // Verificar acesso à sala de chat
    const chatRoom = await ctx.db.get(args.chatRoomId);
    if (!chatRoom) {
      throw new Error("Sala de chat não encontrada");
    }

    if (chatRoom.travelerId.toString() !== currentUserId.toString() && 
        chatRoom.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Acesso negado a esta sala de chat");
    }

    // Atualizar status
    await ctx.db.patch(args.chatRoomId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Se estiver fechando ou arquivando, adicionar mensagem do sistema
    if (args.status === "closed" || args.status === "archived") {
      const now = Date.now();
      await ctx.db.insert("chatMessages", {
        chatRoomId: args.chatRoomId,
        senderId: currentUserId,
        senderRole: currentUserRole as "traveler" | "partner" | "employee" | "master",
        content: args.status === "closed" ? 
          "Conversa fechada." : 
          "Conversa arquivada.",
        messageType: "system",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      });

      // Atualizar última mensagem
      await ctx.db.patch(args.chatRoomId, {
        lastMessageAt: now,
        lastMessagePreview: args.status === "closed" ? 
          "Conversa fechada." : 
          "Conversa arquivada.",
        updatedAt: now,
      });
    }

    return {
      success: true,
    };
  },
}); 