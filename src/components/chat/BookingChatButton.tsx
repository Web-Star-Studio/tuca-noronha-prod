"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface BookingChatButtonProps {
  bookingId: string;
  userId: Id<"users">; // ID do traveler/cliente
  assetType: string;
  assetName?: string;
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
  showLabel?: boolean;
}

export default function BookingChatButton({
  bookingId,
  userId,
  assetType,
  assetName = "esta reserva",
  className,
  variant = "ghost",
  size = "sm",
  showLabel = false,
}: BookingChatButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const hookResult = useCurrentUser();
  const { user: currentUser, isLoading: isUserLoading } = hookResult;

  // Debug do hook completo
  console.log("BookingChatButton - Hook Result:", hookResult);

  // Mutation para criar sala de chat (admin/partner)
  const createChatRoomAsAdmin = useMutation(api.domains.chat.mutations.createChatRoomAsPartner);

  const handleChatClick = async () => {
    try {
      setIsLoading(true);

      // Debug completo
      console.log("Debug BookingChatButton Click:", {
        hookResult,
        currentUser,
        isUserLoading,
        userId,
        bookingId,
        assetType
      });

      if (isUserLoading) {
        toast.error("Aguarde o carregamento dos dados do usuário");
        return;
      }

      if (!currentUser || !currentUser._id) {
        console.error("Usuário não encontrado. Estado atual:", { 
          hookResult,
          currentUser, 
          isUserLoading,
          currentUserType: typeof currentUser,
          currentUserKeys: currentUser ? Object.keys(currentUser) : null
        });
        toast.error("Erro ao identificar usuário atual. Por favor, faça login novamente.");
        return;
      }

      // Criar sala de chat como partner/employee/master
      const result = await createChatRoomAsAdmin({
        contextType: "booking",
        contextId: bookingId,
        travelerId: userId,
        title: `Chat sobre reserva - ${assetName}`,
        priority: "normal",
      });

      if (!result.success) {
        throw new Error("Falha ao criar sala de chat");
      }

      // Redirecionar para a página de chat
      router.push(`/admin/dashboard/chats/${result._id}`);
    } catch (error: any) {
      console.error("Erro ao abrir chat:", error);
      toast.error("Erro ao abrir chat. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };  

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleChatClick}
      disabled={isLoading || isUserLoading}
      className={cn(
        "transition-all duration-200",
        !showLabel && size === "sm" && "px-2",
        className
      )}
      title="Abrir chat desta reserva"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <MessageCircle className="h-4 w-4" />
          {showLabel && <span className="ml-1">Chat</span>}
        </>
      )}
    </Button>
  );
} 