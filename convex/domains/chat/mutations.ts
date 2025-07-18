import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac";
import { internal } from "../../_generated/api";
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
    contextType: v.union(
      v.literal("asset"), 
      v.literal("booking"), 
      v.literal("admin_reservation"),
      v.literal("package_request"),
      v.literal("package_proposal")
    ),
    contextId: v.string(),
    assetType: v.optional(v.string()),
    partnerId: v.id("users"),
    title: v.string(),
    initialMessage: v.optional(v.string()),
    reservationId: v.optional(v.string()),
    reservationType: v.optional(v.union(
      v.literal("admin_reservation"),
      v.literal("regular_booking")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ))
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
      priority: "normal",
      unreadCountTraveler: 0,
      unreadCountPartner: 0,
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
      senderId: currentUserId!,
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
        senderId: currentUserId!,
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
 * Cria uma nova sala de chat como partner/employee/master
 * Usado quando o partner/employee/master inicia uma conversa com o traveler
 */
export const createChatRoomAsPartner = mutation({
  args: {
    contextType: v.union(
      v.literal("asset"), 
      v.literal("booking"), 
      v.literal("admin_reservation"),
      v.literal("package_request"),
      v.literal("package_proposal")
    ),
    contextId: v.string(),
    assetType: v.optional(v.string()),
    travelerId: v.id("users"), // ID do traveler com quem o partner quer conversar
    title: v.string(),
    initialMessage: v.optional(v.string()),
    reservationId: v.optional(v.string()),
    reservationType: v.optional(v.union(
      v.literal("admin_reservation"),
      v.literal("regular_booking")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ))
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

    // Apenas partners, employees e masters podem usar esta mutation
    if (!["partner", "employee", "master"].includes(currentUserRole)) {
      throw new Error("Apenas partners, employees e masters podem iniciar conversas desta forma");
    }

    // Verificar se já existe uma sala de chat para este contexto
    const existingChatRoom = await ctx.db
      .query("chatRooms")
      .withIndex("by_context", (q) => 
        q.eq("contextType", args.contextType).eq("contextId", args.contextId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("travelerId"), args.travelerId),
          q.eq(q.field("partnerId"), currentUserId)
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
      travelerId: args.travelerId,
      partnerId: currentUserId, // O partner/employee/master atual
      status: "active",
      title: args.title,
      priority: args.priority || "normal",
      unreadCountTraveler: 0,
      unreadCountPartner: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Buscar informações do usuário atual e do traveler para as notificações
    const currentUser = await ctx.db.get(currentUserId);
    const traveler = await ctx.db.get(args.travelerId);
    
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
    } else if (args.contextType === "booking") {
      // Para reservas, podemos buscar informações do booking
      contextData = {
        bookingCode: args.contextId,
      };
    }

    // Criar notificação para o traveler sobre a nova conversa
    await ctx.db.insert("notifications", {
      userId: args.travelerId,
      type: "chat_room_created",
      title: "Nova Conversa Iniciada",
      message: `${currentUser?.name || 'Um membro da equipe'} iniciou uma conversa${contextData.assetName ? ` sobre ${contextData.assetName}` : contextData.bookingCode ? ` sobre sua reserva ${contextData.bookingCode}` : ''}`,
      relatedId: chatRoomId.toString(),
      relatedType: "chat_room",
      isRead: false,
      data: {
        partnerName: currentUser?.name,
        contextType: args.contextType,
        ...contextData,
      },
      createdAt: now,
    });

    // Enviar mensagem de boas-vindas do partner/employee/master
    await ctx.db.insert("chatMessages", {
      chatRoomId,
      senderId: currentUserId!,
      senderRole: currentUserRole as "traveler" | "partner" | "employee" | "master",
      content: `Olá! Sou ${currentUser?.name || 'membro da equipe'}. Como posso ajudá-lo com sua reserva?`,
      messageType: "text",
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    // Se houver mensagem inicial, enviá-la
    if (args.initialMessage && args.initialMessage.trim()) {
      await ctx.db.insert("chatMessages", {
        chatRoomId,
        senderId: currentUserId!,
        senderRole: currentUserRole as "traveler" | "partner" | "employee" | "master",
        content: args.initialMessage.trim(),
        messageType: "text",
        isRead: false,
        createdAt: now + 1, // +1ms para manter ordem
        updatedAt: now + 1,
      });

      // Criar notificação para o traveler sobre a mensagem inicial
      await ctx.db.insert("notifications", {
        userId: args.travelerId,
        type: "chat_message",
        title: "Nova Mensagem de Chat",
        message: `${currentUser?.name || 'Membro da equipe'} enviou uma mensagem${contextData.assetName ? ` sobre ${contextData.assetName}` : contextData.bookingCode ? ` sobre sua reserva` : ''}: "${args.initialMessage.trim().substring(0, 50)}${args.initialMessage.trim().length > 50 ? '...' : ''}"`,
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

    if (currentUserRole !== "master" &&
        chatRoom.travelerId.toString() !== currentUserId.toString() && 
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
      senderId: currentUserId!,
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

    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (currentUserRole !== "master" &&
        chatRoom.travelerId.toString() !== currentUserId.toString() && 
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

    if (currentUserRole !== "master" &&
        chatRoom.travelerId.toString() !== currentUserId.toString() && 
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
        senderId: currentUserId!,
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

/**
 * Execute quick actions from chat interface
 */
export const executeQuickAction = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    action: v.union(
      v.literal("confirm_reservation"),
      v.literal("modify_reservation"),
      v.literal("cancel_reservation"),
      v.literal("send_payment_reminder"),
      v.literal("escalate_issue"),
      v.literal("mark_priority"),
      v.literal("assign_staff"),
      v.literal("add_note")
    ),
    actionData: v.optional(v.object({
      newDate: v.optional(v.string()),
      newTime: v.optional(v.string()),
      newGuests: v.optional(v.number()),
      reason: v.optional(v.string()),
      priority: v.optional(v.union(
        v.literal("low"),
        v.literal("normal"),
        v.literal("high"),
        v.literal("urgent")
      )),
      assignTo: v.optional(v.id("users")),
      note: v.optional(v.string())
    }))
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    actionResult: v.optional(v.any())
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    // Verify user permissions
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Insufficient permissions to execute quick actions");
    }

    // Get chat room
    const chatRoom = await ctx.db.get(args.chatRoomId);
    if (!chatRoom) {
      throw new Error("Chat room not found");
    }

    const now = Date.now();
    let actionResult: any = null;
    let systemMessage = "";

    try {
      switch (args.action) {
        case "confirm_reservation":
          if (chatRoom.contextType === "admin_reservation" && chatRoom.reservationId) {
            // Call admin reservation confirmation
            await ctx.runMutation(internal.domains.adminReservations.mutations.updateAdminReservation, {
              id: chatRoom.reservationId as any,
              status: "confirmed"
            });
            systemMessage = "Reserva confirmada pelo administrador.";
            actionResult = { status: "confirmed" };
          }
          break;

        case "modify_reservation":
          if (chatRoom.contextType === "admin_reservation" && chatRoom.reservationId && args.actionData) {
            const updates: any = {};
            if (args.actionData.newDate) updates.date = args.actionData.newDate;
            if (args.actionData.newTime) updates.time = args.actionData.newTime;
            if (args.actionData.newGuests) updates.guests = args.actionData.newGuests;
            
            if (Object.keys(updates).length > 0) {
              await ctx.runMutation(internal.domains.adminReservations.mutations.updateAdminReservation, {
                id: chatRoom.reservationId as any,
                reservationData: updates
              });
              systemMessage = `Reserva modificada: ${Object.keys(updates).join(", ")}`;
              actionResult = updates;
            }
          }
          break;

        case "cancel_reservation":
          if (chatRoom.contextType === "admin_reservation" && chatRoom.reservationId) {
            await ctx.runMutation(internal.domains.adminReservations.mutations.updateAdminReservation, {
              id: chatRoom.reservationId as any,
              status: "cancelled",
              notes: args.actionData?.reason || "Cancelado via chat"
            });
            systemMessage = `Reserva cancelada. Motivo: ${args.actionData?.reason || "Não especificado"}`;
            actionResult = { status: "cancelled", reason: args.actionData?.reason };
          }
          break;

        case "send_payment_reminder":
          systemMessage = "Lembrete de pagamento enviado para o cliente.";
          // TODO: Implement payment reminder logic
          actionResult = { reminderSent: true };
          break;

        case "escalate_issue":
          await ctx.db.patch(args.chatRoomId, {
            status: "escalated",
            priority: "high",
            updatedAt: now
          });
          systemMessage = "Conversa escalada para prioridade alta.";
          actionResult = { status: "escalated", priority: "high" };
          break;

        case "mark_priority":
          if (args.actionData?.priority) {
            await ctx.db.patch(args.chatRoomId, {
              priority: args.actionData.priority,
              updatedAt: now
            });
            systemMessage = `Prioridade alterada para: ${args.actionData.priority}`;
            actionResult = { priority: args.actionData.priority };
          }
          break;

        case "assign_staff":
          if (args.actionData?.assignTo) {
            await ctx.db.patch(args.chatRoomId, {
              assignedTo: args.actionData.assignTo,
              assignedBy: currentUserId!,
              assignedAt: now,
              updatedAt: now
            });
            
            const assignedUser = await ctx.db.get(args.actionData.assignTo);
            systemMessage = `Conversa atribuída para: ${assignedUser?.name || "Staff"}`;
            actionResult = { assignedTo: args.actionData.assignTo, assignedUser: assignedUser?.name };
          }
          break;

        case "add_note":
          if (args.actionData?.note) {
            systemMessage = `Nota administrativa: ${args.actionData.note}`;
            actionResult = { note: args.actionData.note };
          }
          break;

        default:
          throw new Error("Invalid action type");
      }

      // Add system message to chat if action was successful
      if (systemMessage) {
        await ctx.db.insert("chatMessages", {
          chatRoomId: args.chatRoomId,
          senderId: currentUserId!,
          senderRole: currentUserRole as any,
          content: systemMessage,
          messageType: "system",
          isRead: false,
          createdAt: now,
          updatedAt: now,
        });

        // Update chat room last message
        await ctx.db.patch(args.chatRoomId, {
          lastMessageAt: now,
          lastMessagePreview: systemMessage,
          updatedAt: now,
        });
      }

      return {
        success: true,
        message: `Ação "${args.action}" executada com sucesso.`,
        actionResult
      };

    } catch (error) {
      console.error("Quick action error:", error);
      return {
        success: false,
        message: `Erro ao executar ação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        actionResult: null
      };
    }
  },
});

/**
 * Send message using template
 */
export const sendTemplateMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    templateId: v.id("chatMessageTemplates"),
    variables: v.record(v.string(), v.string()), // Template variables
    customSubject: v.optional(v.string()),
    customContent: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.id("chatMessages"))
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    // Get template and process it
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    let processedSubject = args.customSubject || template.subject;
    let processedContent = args.customContent || template.content;

    // Replace variables
    Object.entries(args.variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Send the message
    const messageId = await ctx.db.insert("chatMessages", {
      chatRoomId: args.chatRoomId,
      senderId: currentUserId!,
      senderRole: currentUserRole as any,
      content: processedContent,
      messageType: "text",
      isRead: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update chat room
    await ctx.db.patch(args.chatRoomId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: processedContent.substring(0, 100),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      messageId
    };
  },
});

/**
 * Send file message with enhanced metadata
 */
export const sendFileMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    caption: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("document"),
      v.literal("image"),
      v.literal("proposal"),
      v.literal("confirmation"),
      v.literal("itinerary"),
      v.literal("contract"),
      v.literal("other")
    ))
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.id("chatMessages"))
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    // Verify file exists
    const fileUrl = await ctx.storage.getUrl(args.fileId);
    if (!fileUrl) {
      throw new Error("File not found");
    }

    // Create file metadata
    const fileMetadata = {
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      fileUrl,
      category: args.category || "other",
      uploadedBy: currentUserId,
      uploadedAt: Date.now()
    };

    // Determine message type based on file type
    let messageType: "image" | "file" = "file";
    if (args.fileType.startsWith("image/")) {
      messageType = "image";
    }

    // Create message content with file metadata
    const messageContent = JSON.stringify({
      caption: args.caption || `Arquivo enviado: ${args.fileName}`,
      metadata: fileMetadata
    });

    // Send the message
    const messageId = await ctx.db.insert("chatMessages", {
      chatRoomId: args.chatRoomId,
      senderId: currentUserId!,
      senderRole: currentUserRole as any,
      content: messageContent,
      messageType,
      isRead: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update chat room with file preview
    const preview = args.caption || `📎 ${args.fileName}`;
    await ctx.db.patch(args.chatRoomId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: preview,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      messageId
    };
  },
});

/**
 * Share multiple files at once
 */
export const sendMultipleFiles = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    files: v.array(v.object({
      fileId: v.id("_storage"),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      category: v.optional(v.string())
    })),
    caption: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean(),
    messageIds: v.array(v.id("chatMessages"))
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    const now = Date.now();
    const messageIds: any[] = [];

    // Send each file as a separate message
    for (const file of args.files) {
      const fileUrl = await ctx.storage.getUrl(file.fileId);
      if (!fileUrl) continue;

      const fileMetadata = {
        fileId: file.fileId,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        fileUrl,
        category: file.category || "other",
        uploadedBy: currentUserId,
        uploadedAt: now
      };

      const messageType = file.fileType.startsWith("image/") ? "image" : "file";
      const messageContent = JSON.stringify({
        caption: args.caption || `Arquivo enviado: ${file.fileName}`,
        metadata: fileMetadata
      });

      const messageId = await ctx.db.insert("chatMessages", {
        chatRoomId: args.chatRoomId,
        senderId: currentUserId!,
        senderRole: currentUserRole as any,
        content: messageContent,
        messageType: messageType as any,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      });

      messageIds.push(messageId);
    }

    // Update chat room
    const preview = args.files.length === 1 
      ? `📎 ${args.files[0].fileName}`
      : `📎 ${args.files.length} arquivos compartilhados`;

    await ctx.db.patch(args.chatRoomId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
      updatedAt: now,
    });

    return {
      success: true,
      messageIds
    };
  },
});

/**
 * Create shared file collection for organized sharing
 */
export const createFileCollection = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    title: v.string(),
    description: v.optional(v.string()),
    files: v.array(v.object({
      fileId: v.id("_storage"),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      category: v.optional(v.string())
    })),
    accessLevel: v.optional(v.union(
      v.literal("all_participants"),
      v.literal("admin_only"),
      v.literal("custom")
    ))
  },
  returns: v.object({
    success: v.boolean(),
    collectionId: v.optional(v.string()),
    messageId: v.optional(v.id("chatMessages"))
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    const now = Date.now();

    // Create file collection metadata
    const collectionId = `collection_${now}_${Math.random().toString(36).substring(2, 11)}`;
    
    const fileCollection = {
      collectionId,
      title: args.title,
      description: args.description,
      files: await Promise.all(args.files.map(async (file) => {
        const fileUrl = await ctx.storage.getUrl(file.fileId);
        return {
          fileId: file.fileId,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          fileUrl,
          category: file.category || "other"
        };
      })),
      accessLevel: args.accessLevel || "all_participants",
      createdBy: currentUserId,
      createdAt: now
    };

    // Send collection as system message
    const messageContent = JSON.stringify({
      type: "file_collection",
      collection: fileCollection
    });

    const messageId = await ctx.db.insert("chatMessages", {
      chatRoomId: args.chatRoomId,
      senderId: currentUserId!,
      senderRole: currentUserRole as any,
      content: messageContent,
      messageType: "system",
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    // Update chat room
    await ctx.db.patch(args.chatRoomId, {
      lastMessageAt: now,
      lastMessagePreview: `📁 Coleção compartilhada: ${args.title}`,
      updatedAt: now,
    });

    return {
      success: true,
      collectionId,
      messageId
    };
  },
}); 