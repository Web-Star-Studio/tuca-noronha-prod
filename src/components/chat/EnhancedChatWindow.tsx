"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Send, FileText, MoreVertical, CheckCircle, Edit, X, AlertTriangle, UserPlus, StickyNote, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface EnhancedChatWindowProps {
  chatRoomId: Id<"chatRooms">;
  currentUserId: Id<"users">;
  currentUserRole: string;
}

interface Message {
  _id: Id<"chatMessages">;
  content: string;
  messageType: "text" | "image" | "file" | "system";
  senderRole: string;
  createdAt: number;
  sender?: {
    _id: Id<"users">;
    name?: string;
    image?: string;
  };
}

// ChatRoom interface removida (não utilizada)

interface Template {
  _id: Id<"chatMessageTemplates">;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
}

export function EnhancedChatWindow({ chatRoomId, currentUserId, currentUserRole }: EnhancedChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [quickActionData, setQuickActionData] = useState<any>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Queries
  const chatRoom = useQuery(api.domains.chat.queries.getChatRoom, { chatRoomId });
  const messages = useQuery(api.domains.chat.queries.listMessages, { chatRoomId, limit: 50 });
  const templates = useQuery(api.domains.chat.templates.listMessageTemplates, {
    isActive: true,
    limit: 20
  });

  // Mutations
  const sendMessage = useMutation(api.domains.chat.mutations.sendMessage);
  const sendTemplateMessage = useMutation(api.domains.chat.mutations.sendTemplateMessage);
  const executeQuickAction = useMutation(api.domains.chat.mutations.executeQuickAction);
  // markAsRead removido (não utilizado)

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        chatRoomId,
        content: newMessage,
        messageType: "text"
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await sendTemplateMessage({
        chatRoomId,
        templateId: selectedTemplate._id,
        variables: templateVariables
      });
      setSelectedTemplate(null);
      setTemplateVariables({});
      setShowTemplates(false);
      toast({
        title: "Mensagem enviada",
        description: "Template aplicado com sucesso"
      });
    } catch (error) {
      console.error("Error sending template message:", error);
      toast({
        title: "Erro ao enviar template",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = async (action: string) => {
    try {
      const result = await executeQuickAction({
        chatRoomId,
        action: action as any,
        actionData: quickActionData[action]
      });

      if (result.success) {
        toast({
          title: "Ação executada",
          description: result.message
        });
        setQuickActionData({});
        setShowQuickActions(false);
      } else {
        toast({
          title: "Erro na ação",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error executing quick action:", error);
      toast({
        title: "Erro ao executar ação",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender?._id === currentUserId;
    const isSystemMessage = message.messageType === "system";

    return (
      <div
        key={message._id}
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
      >
        <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? "flex-row-reverse" : "flex-row"} items-start gap-2`}>
          {!isOwnMessage && !isSystemMessage && (
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.sender?.image} />
              <AvatarFallback>
                {message.sender?.name?.charAt(0) || message.senderRole?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={`rounded-lg px-3 py-2 ${
            isSystemMessage 
              ? "bg-blue-100 text-blue-800 text-center w-full"
              : isOwnMessage 
                ? "bg-primary text-primary-foreground" 
                : "bg-gray-100 text-gray-900"
          }`}>
            {!isSystemMessage && !isOwnMessage && (
              <div className="text-xs text-gray-500 mb-1">
                {message.sender?.name || message.senderRole}
              </div>
            )}
            
            <div className="text-sm">{message.content}</div>
            
            <div className={`text-xs mt-1 ${
              isSystemMessage 
                ? "text-blue-600" 
                : isOwnMessage 
                  ? "text-primary-foreground/70" 
                  : "text-gray-500"
            }`}>
              {formatDistanceToNow(new Date(message.createdAt), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuickActions = () => {
    if (!chatRoom || chatRoom.contextType !== "admin_reservation") return null;

    const actions = [
      { id: "confirm_reservation", label: "Confirmar Reserva", icon: CheckCircle, color: "green" },
      { id: "modify_reservation", label: "Modificar Reserva", icon: Edit, color: "blue" },
      { id: "cancel_reservation", label: "Cancelar Reserva", icon: X, color: "red" },
      { id: "escalate_issue", label: "Escalar", icon: AlertTriangle, color: "orange" },
      { id: "assign_staff", label: "Atribuir Staff", icon: UserPlus, color: "purple" },
      { id: "add_note", label: "Adicionar Nota", icon: StickyNote, color: "gray" }
    ];

    return (
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => handleQuickAction(action.id)}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  };

  if (!chatRoom) {
    return <div className="p-4">Carregando chat...</div>;
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg">{chatRoom.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={chatRoom.priority === "urgent" ? "destructive" : "secondary"}>
                  {chatRoom.priority}
                </Badge>
                <Badge variant="outline">
                  {chatRoom.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Templates Button */}
            <Sheet open={showTemplates} onOpenChange={setShowTemplates}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-1" />
                  Templates
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Templates de Mensagem</SheetTitle>
                  <SheetDescription>
                    Selecione um template para resposta rápida
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {templates?.map((template) => (
                    <Card 
                      key={template._id} 
                      className={`cursor-pointer transition-colors ${
                        selectedTemplate?._id === template._id ? "bg-primary/10 border-primary" : ""
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.category}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {template.content.substring(0, 100)}...
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {selectedTemplate && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Variáveis do Template</h4>
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable}>
                          <label className="text-sm font-medium">{variable}</label>
                          <Input
                            value={templateVariables[variable] || ""}
                            onChange={(e) => setTemplateVariables(prev => ({
                              ...prev,
                              [variable]: e.target.value
                            }))}
                            placeholder={`Digite ${variable}`}
                          />
                        </div>
                      ))}
                      
                      <Button onClick={handleSendTemplate} className="w-full">
                        Enviar Template
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Quick Actions Button */}
            {currentUserRole !== "traveler" && (
              <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Zap className="w-4 h-4 mr-1" />
                    Ações
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Ações Rápidas</SheetTitle>
                    <SheetDescription>
                      Execute ações diretamente do chat
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6">
                    {renderQuickActions()}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-96 p-4">
          {messages?.map(renderMessage)}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}