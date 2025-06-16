"use client";

import React, { useState } from "react";
import { MessageCircle, Search, Filter, Users, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useChatRooms, formatMessageTime, getChatStatusColor, getChatStatusText } from "@/lib/services/chatService";
import { Id } from "@/../convex/_generated/dataModel";
import { motion } from "framer-motion";

const ChatsSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<Id<"chatRooms"> | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch chat rooms based on status
  const allChats = useChatRooms();
  const activeChats = useChatRooms("active");
  
  const isLoading = !allChats && !activeChats;

  // Filter chats based on search term
  const filterChats = (chats: any[]) => {
    if (!searchTerm) return chats;
    return chats?.filter(chat => 
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.otherParticipant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.lastMessagePreview?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredAllChats = filterChats(allChats || []);
  const filteredActiveChats = filterChats(activeChats || []);

  const handleChatSelect = (chatId: Id<"chatRooms">) => {
    setSelectedChatId(chatId);
  };

  const handleCloseChatWindow = () => {
    setSelectedChatId(null);
  };

  const getChatList = () => {
    switch (activeTab) {
      case "active":
        return filteredActiveChats;
      case "all":
      default:
        return filteredAllChats;
    }
  };

  const currentChatList = getChatList();

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

  const renderChatItem = (chat: any) => (
    <Card
      key={chat._id}
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
      onClick={() => handleChatSelect(chat._id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${chat.otherParticipant.name}`} 
            />
            <AvatarFallback>
              {chat.otherParticipant.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {getAssetTypeIcon(chat.assetType)}
                </span>
                <h3 className="font-semibold text-sm truncate">
                  {chat.otherParticipant.name || "Usuário"}
                </h3>
                {chat.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-2 py-0">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${getChatStatusColor(chat.status)}`}
              >
                {getChatStatusText(chat.status)}
              </Badge>
            </div>

            <p className="text-xs text-gray-600 mb-1">
              {chat.contextData?.name || chat.contextData?.title || chat.title}
            </p>

            {chat.lastMessagePreview && (
              <p className="text-sm text-gray-700 truncate mb-2">
                {chat.lastMessagePreview}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {formatMessageTime(chat.lastMessageAt || chat.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Minhas Conversas</h2>
          <p className="text-gray-600 mt-1">Converse com parceiros, fornecedores e nossa equipe de suporte</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Chat
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChats?.length || 0}</div>
            <p className="text-xs text-muted-foreground">conversas em andamento</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allChats?.length || 0}</div>
            <p className="text-xs text-muted-foreground">todas as conversas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allChats?.reduce((total, chat) => total + chat.unreadCount, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">mensagens não lidas</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Pesquisar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
      </motion.div>

      {/* Chat Tabs and List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Suas Conversas</CardTitle>
            <CardDescription>
              Gerencie suas conversas com parceiros e nossa equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Todas
                  {allChats && allChats.length > 0 && (
                    <Badge variant="secondary">{allChats.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Ativas
                  {activeChats && activeChats.length > 0 && (
                    <Badge variant="secondary">{activeChats.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : currentChatList && currentChatList.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentChatList.map(renderChatItem)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conversa encontrada</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm 
                        ? "Tente ajustar sua pesquisa ou limpar os filtros"
                        : "Suas conversas aparecerão aqui quando você começar a conversar com parceiros ou nossa equipe"
                      }
                    </p>
                    <Button className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Iniciar Conversa com Suporte
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-6 bg-white">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : currentChatList && currentChatList.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentChatList.map(renderChatItem)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conversa ativa</h3>
                    <p className="text-gray-500 mb-4">
                      Suas conversas ativas aparecerão aqui
                    </p>
                    <Button className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Iniciar Conversa com Suporte
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              Nossa equipe de suporte está sempre disponível para ajudá-lo com suas dúvidas sobre reservas, 
              pagamentos, atividades e qualquer outra questão relacionada à sua viagem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <MessageCircle className="w-4 h-4" />
                Iniciar Chat com Suporte
              </Button>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Ver Perguntas Frequentes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chat Window Dialog */}
      <Dialog open={!!selectedChatId} onOpenChange={(open) => !open && handleCloseChatWindow()}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <VisuallyHidden>
            <DialogTitle>Conversa</DialogTitle>
          </VisuallyHidden>
          {selectedChatId && (
            <ChatWindow
              chatRoomId={selectedChatId}
              onClose={handleCloseChatWindow}
              className="h-full"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatsSection; 