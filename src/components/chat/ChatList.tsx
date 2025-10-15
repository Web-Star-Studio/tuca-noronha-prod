"use client";

import { useState } from "react";
import { MessageCircle, Search, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatWindow } from "./ChatWindow";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  useChatRooms,
  useUpdateChatRoomStatus,
  formatMessageTime,
  getChatStatusColor,
  getChatStatusText,
  type ChatRoom,
} from "@/lib/services/chatService";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";

interface ChatListProps {
  className?: string;
  showWrapper?: boolean;
  maxItems?: number;
  searchTerm?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ 
  className = "",
  showWrapper = true,
  maxItems,
  searchTerm: externalSearchTerm 
}) => {
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<Id<"chatRooms"> | null>(null);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm ?? internalSearchTerm;

  // Buscar conversas baseado no filtro
  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const chatRooms = useChatRooms(statusFilter);
  const updateChatRoomStatus = useUpdateChatRoomStatus();

  // Filtrar conversas baseado na busca
  const filteredChatRooms = chatRooms?.filter((room) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      room.title.toLowerCase().includes(searchLower) ||
      room.otherParticipant.name?.toLowerCase().includes(searchLower) ||
      room.contextData?.name?.toLowerCase().includes(searchLower) ||
      room.contextData?.title?.toLowerCase().includes(searchLower) ||
      room.lastMessagePreview?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Apply maxItems limit if provided
  const displayedChatRooms = maxItems ? filteredChatRooms.slice(0, maxItems) : filteredChatRooms;

  const handleOpenChat = (chatRoomId: Id<"chatRooms">) => {
    setSelectedChatRoomId(chatRoomId);
    setShowChatWindow(true);
  };

  const handleUpdateChatStatus = async (
    chatRoomId: Id<"chatRooms">,
    status: "active" | "closed" | "archived"
  ) => {
    try {
      await updateChatRoomStatus({ chatRoomId, status });
      toast.success(`Conversa ${getChatStatusText(status).toLowerCase()}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da conversa");
    }
  };

  const getTabCounts = () => {
    if (!chatRooms) return { all: 0, active: 0, closed: 0, archived: 0 };
    
    return {
      all: chatRooms.length,
      active: chatRooms.filter(r => r.status === "active").length,
      closed: chatRooms.filter(r => r.status === "closed").length,
      archived: chatRooms.filter(r => r.status === "archived").length,
    };
  };

  const getAssetTypeIcon = (assetType?: string) => {
    switch (assetType) {
      case "restaurants": return "🍽️";
      case "events": return "🎉";
      case "activities": return "🏃";
      case "vehicles": return "🚗";
      case "accommodations": return "🏨";
      default: return "💬";
    }
  };

  const renderChatRoomCard = (chatRoom: ChatRoom) => (
    <div 
      key={chatRoom._id} 
      className="cursor-pointer p-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200"
      onClick={() => handleOpenChat(chatRoom._id)}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="w-12 h-12">
          <AvatarImage 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${chatRoom.otherParticipant.name}`} 
          />
          <AvatarFallback>
            {chatRoom.otherParticipant.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {getAssetTypeIcon(chatRoom.assetType)}
              </span>
              <h3 className="font-semibold text-sm truncate">
                {chatRoom.otherParticipant.name || "Usuário"}
              </h3>
              {chatRoom.unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-2 py-0">
                  {chatRoom.unreadCount}
                </Badge>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateChatStatus(chatRoom._id, "active");
                  }}
                >
                  Reativar Conversa
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateChatStatus(chatRoom._id, "closed");
                  }}
                >
                  Fechar Conversa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateChatStatus(chatRoom._id, "archived");
                  }}
                  className="text-red-600"
                >
                  Arquivar Conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-gray-600 mb-1">
            {chatRoom.contextData?.name || chatRoom.contextData?.title || chatRoom.title}
          </p>

          {chatRoom.lastMessagePreview && (
            <p className="text-sm text-gray-700 truncate mb-2">
              {chatRoom.lastMessagePreview}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`text-xs ${getChatStatusColor(chatRoom.status)}`}
            >
              {getChatStatusText(chatRoom.status)}
            </Badge>
            
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {formatMessageTime(chatRoom.lastMessageAt || chatRoom.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabCounts = getTabCounts();

  const ChatContent = () => (
    <>
      {/* Busca - Only show if not using external search */}
      {!externalSearchTerm && showWrapper && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              value={internalSearchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Filtros por status - Only show if wrapper is enabled and no maxItems */}
      {showWrapper && !maxItems && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              Todas ({tabCounts.all})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              Ativas ({tabCounts.active})
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs">
              Fechadas ({tabCounts.closed})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              Arquivadas ({tabCounts.archived})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Lista de conversas */}
      <div className={`space-y-3 ${showWrapper ? "max-h-96 overflow-y-auto" : "max-h-80 overflow-y-auto"}`}>
        {displayedChatRooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhuma conversa encontrada</p>
            <p className="text-sm">
              {searchTerm 
                ? "Tente ajustar os termos da busca" 
                : "As conversas aparecerão aqui quando iniciadas pelos viajantes"
              }
            </p>
          </div>
        ) : (
          displayedChatRooms.map(renderChatRoomCard)
        )}
      </div>
    </>
  );

  if (!showWrapper) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4">
          <ChatContent />
        </div>

        {/* Janela de chat */}
        <Dialog open={showChatWindow} onOpenChange={setShowChatWindow}>
          <DialogContent className="max-w-2xl max-h-[80vh] p-0">
            <VisuallyHidden>
              <DialogTitle>Conversa com Cliente</DialogTitle>
            </VisuallyHidden>
            {selectedChatRoomId && (
              <ChatWindow
                chatRoomId={selectedChatRoomId}
                onClose={() => setShowChatWindow(false)}
                className="h-[600px]"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Conversas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChatContent />
        </CardContent>
      </Card>

      {/* Janela de chat */}
      <Dialog open={showChatWindow} onOpenChange={setShowChatWindow}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <VisuallyHidden>
            <DialogTitle>Conversa com Cliente</DialogTitle>
          </VisuallyHidden>
          {selectedChatRoomId && (
            <ChatWindow
              chatRoomId={selectedChatRoomId}
              onClose={() => setShowChatWindow(false)}
              className="h-[600px]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 