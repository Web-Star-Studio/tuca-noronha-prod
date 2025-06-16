import { api } from "../../../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";

// Types
export interface ChatRoom {
  _id: Id<"chatRooms">;
  _creationTime: number;
  contextType: "asset" | "booking";
  contextId: string;
  assetType?: string;
  travelerId: Id<"users">;
  partnerId: Id<"users">;
  status: "active" | "closed" | "archived";
  title: string;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  createdAt: number;
  updatedAt: number;
  otherParticipant: {
    _id: Id<"users">;
    name?: string;
    email?: string;
    role?: string;
  };
  contextData?: any;
  unreadCount: number;
}

export interface ChatMessage {
  _id: Id<"chatMessages">;
  _creationTime: number;
  chatRoomId: Id<"chatRooms">;
  senderId: Id<"users">;
  senderRole: "traveler" | "partner" | "employee" | "master";
  content: string;
  messageType: "text" | "image" | "file" | "system";
  isRead: boolean;
  readAt?: number;
  createdAt: number;
  updatedAt: number;
  sender: {
    _id: Id<"users">;
    name?: string;
    email?: string;
    role?: string;
  };
}

export interface ChatRoomDetails {
  _id: Id<"chatRooms">;
  _creationTime: number;
  contextType: "asset" | "booking";
  contextId: string;
  assetType?: string;
  travelerId: Id<"users">;
  partnerId: Id<"users">;
  status: "active" | "closed" | "archived";
  title: string;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  createdAt: number;
  updatedAt: number;
  traveler: {
    _id: Id<"users">;
    name?: string;
    email?: string;
    role?: string;
  };
  partner: {
    _id: Id<"users">;
    name?: string;
    email?: string;
    role?: string;
  };
  contextData?: any;
}

// Chat Service Hooks
export const useChatRooms = (status?: string) => {
  return useQuery(api.domains.chat.queries.listChatRooms, { status });
};

export const useChatRoom = (chatRoomId: Id<"chatRooms">) => {
  return useQuery(api.domains.chat.queries.getChatRoom, { chatRoomId });
};

export const useChatMessages = (chatRoomId: Id<"chatRooms">, limit?: number) => {
  return useQuery(api.domains.chat.queries.listChatMessages, { 
    chatRoomId, 
    limit 
  });
};

export const useFindOrCreateChatRoom = (
  contextType: "asset" | "booking",
  contextId: string,
  partnerId: Id<"users">,
  assetType?: string
) => {
  return useQuery(api.domains.chat.queries.findOrCreateChatRoom, {
    contextType,
    contextId,
    assetType,
    partnerId,
  });
};

// Chat Mutations
export const useCreateChatRoom = () => {
  return useMutation(api.domains.chat.mutations.createChatRoom);
};

export const useSendMessage = () => {
  return useMutation(api.domains.chat.mutations.sendMessage);
};

export const useMarkMessagesAsRead = () => {
  return useMutation(api.domains.chat.mutations.markMessagesAsRead);
};

export const useUpdateChatRoomStatus = () => {
  return useMutation(api.domains.chat.mutations.updateChatRoomStatus);
};

// Helper functions
export const generateChatTitle = (
  contextType: "asset" | "booking",
  assetType?: string,
  assetName?: string
) => {
  if (contextType === "booking") {
    return `Conversa sobre Reserva`;
  }

  switch (assetType) {
    case "restaurants":
      return `Conversa sobre ${assetName || "Restaurante"}`;
    case "events":
      return `Conversa sobre ${assetName || "Evento"}`;
    case "activities":
      return `Conversa sobre ${assetName || "Atividade"}`;
    case "vehicles":
      return `Conversa sobre ${assetName || "Veículo"}`;
    case "accommodations":
      return `Conversa sobre ${assetName || "Hospedagem"}`;
    default:
      return "Nova Conversa";
  }
};

export const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    // Se foi hoje, mostrar apenas a hora
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffInHours < 168) {
    // Se foi nesta semana, mostrar dia da semana + hora
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    // Se foi há mais tempo, mostrar data completa
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

export const getChatStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-green-600";
    case "closed":
      return "text-gray-500";
    case "archived":
      return "text-gray-400";
    default:
      return "text-gray-500";
  }
};

export const getChatStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Ativa";
    case "closed":
      return "Fechada";
    case "archived":
      return "Arquivada";
    default:
      return "Desconhecido";
  }
}; 