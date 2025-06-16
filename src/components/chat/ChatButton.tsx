"use client";

import React, { useState } from "react";
import { MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChatWindow } from "./ChatWindow";
import {
  useFindOrCreateChatRoom,
  useCreateChatRoom,
  generateChatTitle,
} from "@/lib/services/chatService";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";

interface ChatButtonProps {
  // Informações do asset
  assetId: string;
  assetType: "restaurants" | "events" | "activities" | "vehicles" | "accommodations";
  assetName: string;
  partnerId: Id<"users">;
  
  // Props visuais
  variant?: "default" | "outline" | "ghost" | "floating";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  customLabel?: string; // Custom text for the button
  
  // Props de contexto (opcional - para reservas)
  bookingId?: string;
  bookingContext?: string;
}

// Função utilitária para garantir que temos um ID válido
const ensureValidId = (id: string | undefined | null): string => {
  if (!id || id === "undefined" || id === "null") {
    throw new Error("Asset ID é obrigatório para iniciar uma conversa");
  }
  return id;
};

export const ChatButton: React.FC<ChatButtonProps> = ({
  assetId,
  assetType,
  assetName,
  partnerId,
  variant = "default",
  size = "md",
  showLabel = true,
  className = "",
  customLabel,
  bookingId,
  bookingContext,
}) => {
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<Id<"chatRooms"> | null>(null);
  const [initialMessage, setInitialMessage] = useState("");

  // Verificar se já existe uma sala de chat
  const contextType = bookingId ? "booking" : "asset";
  let contextId: string;
  
  try {
    contextId = ensureValidId(bookingId || assetId);
  } catch (error) {
    // Se não temos um ID válido, renderizar um botão desabilitado
    return (
      <Button
        disabled
        variant={variant === "floating" ? "default" : variant}
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
        className={`${variant === "floating" 
          ? `fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 ${className}`
          : className} opacity-50 cursor-not-allowed`}
        title="Informações insuficientes para iniciar conversa"
      >
        <MessageCircle className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"}`} />
        {showLabel && <span className="ml-2">Indisponível</span>}
      </Button>
    );
  }
  
  const existingChatRoom = useFindOrCreateChatRoom(
    contextType,
    contextId,
    partnerId,
    contextType === "asset" ? assetType : undefined
  );

  const createChatRoom = useCreateChatRoom();

  const getButtonText = () => {
    if (bookingId) {
      return showLabel ? "Conversar sobre Reserva" : "";
    }
    return showLabel ? "Tirar Dúvidas" : "";
  };

  const getButtonIcon = () => {
    return <MessageCircle className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"}`} />;
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm": return "sm";
      case "lg": return "lg";
      default: return "default";
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "outline": return "outline";
      case "ghost": return "ghost";
      case "floating": return "default";
      default: return "default";
    }
  };

  const handleStartChat = async () => {
    // Se já existe uma sala de chat, abrir diretamente
    if (existingChatRoom?._id) {
      setActiveChatRoomId(existingChatRoom._id);
      setShowChatDialog(true);
      return;
    }

    // Caso contrário, mostrar diálogo para nova conversa
    setShowNewChatDialog(true);
  };

  const handleCreateChat = async () => {
    try {
      const title = generateChatTitle(contextType, assetType, assetName);
      
      const result = await createChatRoom({
        contextType,
        contextId,
        assetType: contextType === "asset" ? assetType : undefined,
        partnerId,
        title,
        initialMessage: initialMessage.trim() || undefined,
      });

      setActiveChatRoomId(result._id);
      setShowNewChatDialog(false);
      setShowChatDialog(true);
      setInitialMessage("");
      
      toast.success("Conversa iniciada!");
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
      toast.error("Erro ao iniciar conversa");
    }
  };

  const buttonClasses = variant === "floating" 
    ? `fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 ${className}`
    : className;

  return (
    <>
      <Button
        onClick={handleStartChat}
        variant={getButtonVariant()}
        size={getButtonSize()}
        className={buttonClasses}
      >
        {getButtonIcon()}
        {showLabel && <span className="ml-2">{customLabel || getButtonText()}</span>}
      </Button>

      {/* Diálogo para nova conversa */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Iniciar Conversa</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">Sobre:</span>
                <span>{assetName}</span>
              </div>
              {bookingContext && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <span className="font-medium">Contexto:</span>
                  <span>{bookingContext}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-message">
                Mensagem inicial (opcional)
              </Label>
              <Input
                id="initial-message"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder={bookingId 
                  ? "Tenho uma dúvida sobre minha reserva..." 
                  : "Gostaria de saber mais informações..."
                }
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {initialMessage.length}/500 caracteres
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowNewChatDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateChat}
                className="flex-1"
              >
                Iniciar Conversa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Janela de chat */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>Chat com Partner</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          {activeChatRoomId && (
            <ChatWindow
              chatRoomId={activeChatRoomId}
              onClose={() => setShowChatDialog(false)}
              className="h-[600px]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}; 