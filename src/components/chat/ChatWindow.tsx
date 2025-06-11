"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, Phone, Video, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  useChatRoom, 
  useChatMessages, 
  useSendMessage, 
  useMarkMessagesAsRead,
  useUpdateChatRoomStatus,
  formatMessageTime,
  getChatStatusColor,
  getChatStatusText,
  type ChatMessage 
} from "@/lib/services/chatService";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ChatWindowProps {
  chatRoomId: Id<"chatRooms">;
  onClose: () => void;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chatRoomId,
  onClose,
  className = "",
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks do Convex
  const chatRoom = useChatRoom(chatRoomId);
  const messages = useChatMessages(chatRoomId, 50);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const updateStatus = useUpdateChatRoomStatus();

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marcar mensagens como lidas quando a janela é aberta
  useEffect(() => {
    if (chatRoomId && messages && messages.length > 0) {
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== chatRoom?.traveler._id);
      if (unreadMessages.length > 0) {
        markAsRead({ chatRoomId });
      }
    }
  }, [chatRoomId, messages, markAsRead, chatRoom]);

  // Focar no input quando a janela é aberta
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const messageContent = messageInput.trim();
    setMessageInput("");
    setIsTyping(false);

    try {
      await sendMessage({
        chatRoomId,
        content: messageContent,
        messageType: "text",
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
      setMessageInput(messageContent); // Restaurar mensagem em caso de erro
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseChatRoom = async () => {
    try {
      await updateStatus({
        chatRoomId,
        status: "closed",
      });
      toast.success("Conversa fechada");
      onClose();
    } catch (error) {
      console.error("Erro ao fechar conversa:", error);
      toast.error("Erro ao fechar conversa");
    }
  };

  const handleArchiveChatRoom = async () => {
    try {
      await updateStatus({
        chatRoomId,
        status: "archived",
      });
      toast.success("Conversa arquivada");
      onClose();
    } catch (error) {
      console.error("Erro ao arquivar conversa:", error);
      toast.error("Erro ao arquivar conversa");
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === chatRoom?.traveler._id;
    const isSystemMessage = message.messageType === "system";

    if (isSystemMessage) {
      return (
        <div key={message._id} className="flex justify-center my-2">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div
        key={message._id}
        className={`flex mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
      >
        <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
          {!isOwnMessage && (
            <Avatar className="w-8 h-8 mr-2">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender.name}`} />
              <AvatarFallback>
                {message.sender.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={`px-4 py-2 rounded-lg ${
            isOwnMessage 
              ? "bg-blue-500 text-white" 
              : "bg-gray-200 text-gray-800"
          }`}>
            <p className="text-sm">{message.content}</p>
            <div className={`text-xs mt-1 ${
              isOwnMessage ? "text-blue-100" : "text-gray-500"
            }`}>
              {formatMessageTime(message.createdAt)}
              {isOwnMessage && message.isRead && (
                <span className="ml-1">✓✓</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!chatRoom || !messages) {
    return (
      <div className={`bg-white border rounded-lg shadow-lg ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-lg flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${chatRoom.partner.name}`} 
            />
            <AvatarFallback>
              {chatRoom.partner.name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">
              {chatRoom.partner.name || "Parceiro"}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={getChatStatusColor(chatRoom.status)}
              >
                {getChatStatusText(chatRoom.status)}
              </Badge>
              {chatRoom.contextData && (
                <span className="text-xs text-gray-500">
                  {chatRoom.contextData.name || chatRoom.contextData.title}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" disabled>
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <Video className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCloseChatRoom}>
                Fechar Conversa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchiveChatRoom}>
                Arquivar Conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 h-80">
        <div className="space-y-2">
          {messages.map((message, index) => renderMessage(message, index))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={chatRoom.status !== "active"}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || chatRoom.status !== "active"}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {chatRoom.status !== "active" && (
          <p className="text-xs text-gray-500 mt-2">
            Esta conversa está {getChatStatusText(chatRoom.status).toLowerCase()}
          </p>
        )}
      </div>
    </div>
  );
}; 