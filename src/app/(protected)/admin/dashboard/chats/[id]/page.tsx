"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "@/components/chat";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { DashboardPageHeader } from "../../components";
import { Id } from "../../../../../../../convex/_generated/dataModel";

export default function AdminChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatRoomId = params.id as Id<"chatRooms">;

  // Buscar dados da sala de chat
  const chatRoom = useQuery(api.domains.chat.queries.getChatRoom, { 
    chatRoomId 
  });

  const handleBack = () => {
    router.push("/admin/dashboard/chats");
  };

  if (!chatRoom) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chat não encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Esta conversa não existe ou você não tem permissão para acessá-la.
            </p>
            <Button onClick={handleBack}>
              Voltar para lista de chats
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title={chatRoom.title}
        description={`Conversa sobre ${chatRoom.contextType === "booking" ? "reserva" : chatRoom.contextType}`}
        icon={ArrowLeft}
        iconAction={handleBack}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Conversa com: {chatRoom.traveler.name || chatRoom.traveler.email}
          </span>
        </div>
      </DashboardPageHeader>

      {/* Chat Window */}
      <Card className="h-[calc(100vh-200px)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{chatRoom.title}</h3>
              <p className="text-sm text-muted-foreground">
                {chatRoom.contextType === "booking" && 
                  `Código da reserva: ${chatRoom.contextId}`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {chatRoom.priority && chatRoom.priority !== "normal" && (
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${chatRoom.priority === "urgent" ? "bg-red-100 text-red-700" : 
                    chatRoom.priority === "high" ? "bg-orange-100 text-orange-700" :
                    "bg-blue-100 text-blue-700"}
                `}>
                  {chatRoom.priority === "urgent" ? "Urgente" :
                   chatRoom.priority === "high" ? "Alta prioridade" :
                   "Baixa prioridade"}
                </span>
              )}
              <span className={`
                px-2 py-1 text-xs font-medium rounded-full
                ${chatRoom.status === "active" ? "bg-green-100 text-green-700" : 
                  chatRoom.status === "closed" ? "bg-gray-100 text-gray-700" :
                  chatRoom.status === "archived" ? "bg-gray-100 text-gray-700" :
                  chatRoom.status === "escalated" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"}
              `}>
                {chatRoom.status === "active" ? "Ativa" :
                 chatRoom.status === "closed" ? "Fechada" :
                 chatRoom.status === "archived" ? "Arquivada" :
                 chatRoom.status === "escalated" ? "Escalada" :
                 "Aguardando resposta"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-80px)]">
          <ChatWindow chatRoomId={chatRoomId} />
        </CardContent>
      </Card>
    </div>
  );
} 