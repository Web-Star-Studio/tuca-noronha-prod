"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { MessageSquare, Send, Bot,  } from "lucide-react";

import { formatDateTime, getPriorityLabel, getPriorityColor } from './helpers';

interface ChatTabProps {
  requestId: Id<"packageRequests">;
  requestDetails: any;
  requestMessages: any[] | undefined;
}

export function ChatTab({ requestId, requestDetails, requestMessages }: ChatTabProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyPriority, setReplyPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  
  const sendReply = useMutation(api.packages.sendPackageRequestReply);
  const markMessageAsRead = useMutation(api.packages.markPackageRequestMessageAsRead);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [requestMessages]);

  useEffect(() => {
    if (requestMessages) {
      const unreadMessages = requestMessages.filter(msg => 
        msg.status === "sent" && 
        !msg.senderEmail?.includes("admin") && 
        !msg.senderEmail?.includes("tournarrays")
      );
      
      unreadMessages.forEach(msg => {
        handleMarkAsRead(msg._id);
      });
    }
  }, [requestMessages]);

  const handleMarkAsRead = async (messageId: Id<"packageRequestMessages">) => {
    try {
      await markMessageAsRead({ messageId });
    } catch {
      console.error("Erro ao marcar mensagem como lida:", error);
    }
  };
  
  const handleSendChatMessage = async () => {
    if (!requestId || !replyMessage.trim()) {
      toast.error("Por favor, digite uma mensagem");
      return;
    }

    setIsResponding(true);
    try {
      await sendReply({
        packageRequestId: requestId,
        originalMessageId: undefined,
        subject: `Mensagem do chat - ${new Date().toLocaleString('pt-BR')}`,
        message: replyMessage,
        priority: replyPriority,
      });

      setReplyMessage("");
      toast.success("Mensagem enviada!");
    } catch {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsResponding(false);
    }
  };

  const getSenderInitial = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  return (
    <div className="flex flex-col h-[calc(85vh-250px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50/50 rounded-lg p-4">
        {requestMessages && requestMessages.length > 0 ? (
          requestMessages
            .sort((a, b) => a.createdAt - b.createdAt)
            .map((message) => {
              const isAdminMessage = message.senderEmail?.includes("admin") || 
                                   message.senderEmail?.includes("tucanoronha") ||
                                   (requestDetails && message.senderEmail !== requestDetails.customerInfo.email);
              
              const senderName = isAdminMessage ? "Equipe Tuca Noronha" : (message.senderName || "Cliente");

              return (
                <div 
                  key={message._id} 
                  className={`flex items-end gap-3 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {!isAdminMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getSenderInitial(senderName)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${
                    isAdminMessage 
                      ? 'bg-blue-600 text-white rounded-b-xl rounded-tl-xl' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-b-xl rounded-tr-xl'
                  } p-3 shadow-sm transition-all duration-300 hover:shadow-md`}>
                    
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.message}
                    </div>
                    
                    <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isAdminMessage ? 'border-blue-500' : 'border-gray-100'} text-xs ${
                      isAdminMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span className="font-medium">{senderName}</span>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{formatDateTime(message.createdAt)}</TooltipTrigger>
                            <TooltipContent>
                              {message.subject}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {message.priority !== 'medium' && (
                           <Badge 
                            variant="outline"
                            className={`text-xs px-1.5 py-0.5 border ${getPriorityColor(message.priority)}`}
                           >
                            {getPriorityLabel(message.priority)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                   {isAdminMessage && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-blue-600 text-white"><Bot size={18}/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
            <MessageSquare className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Nenhuma mensagem ainda</h3>
            <p className="text-sm">Inicie a conversa enviando a primeira mensagem abaixo.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="border-t border-gray-200 pt-4">
        <div className="relative">
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui..."
            rows={2}
            className="resize-none pr-28"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (replyMessage.trim()) {
                  handleSendChatMessage();
                }
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <Select value={replyPriority} onValueChange={(value: any) => setReplyPriority(value)}>
                <SelectTrigger className="w-28 h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            <Button
              onClick={handleSendChatMessage}
              disabled={isResponding || !replyMessage.trim()}
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              {isResponding ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Pressione <kbd className="px-1.5 py-0.5 border bg-gray-100 rounded">Enter</kbd> para enviar, <kbd className="px-1.5 py-0.5 border bg-gray-100 rounded">Shift+Enter</kbd> para nova linha.
        </p>
      </div>
    </div>
  );
} 