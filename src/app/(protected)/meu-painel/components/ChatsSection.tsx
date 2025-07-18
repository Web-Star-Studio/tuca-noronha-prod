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
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border border-gray-200"
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
                <h3 className="font-semibold text-sm truncate text-gray-900">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Minhas Conversas</h2>
          <p className="text-gray-600 text-sm mt-1">Converse com parceiros, fornecedores e nossa equipe de suporte</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Chat
        </Button>
      </div>

      {/* Top Row - Stats & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Overview */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Resumo das Conversas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{activeChats?.length || 0}</div>
                  <div className="text-sm text-gray-500">Ativas</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{allChats?.length || 0}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 mx-auto mb-3 bg-red-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {allChats?.reduce((total, chat) => total + chat.unreadCount, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-500">Não Lidas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-sm border border-gray-200 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Buscar Conversas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar por nome ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List - Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Suas Conversas</CardTitle>
              <CardDescription className="text-gray-600">
                Gerencie suas conversas com parceiros e nossa equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Todas
                    {allChats && allChats.length > 0 && (
                      <Badge variant="secondary" className="bg-gray-200 text-gray-700">{allChats.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Ativas
                    {activeChats && activeChats.length > 0 && (
                      <Badge variant="secondary" className="bg-gray-200 text-gray-700">{activeChats.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : currentChatList && currentChatList.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {currentChatList.map(renderChatItem)}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conversa encontrada</h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm 
                          ? "Tente ajustar sua pesquisa ou limpar os filtros"
                          : "Suas conversas aparecerão aqui quando você começar a conversar com parceiros ou nossa equipe"
                        }
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Iniciar Conversa com Suporte
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : currentChatList && currentChatList.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {currentChatList.map(renderChatItem)}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conversa ativa</h3>
                      <p className="text-gray-500 mb-4">
                        Suas conversas ativas aparecerão aqui
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Iniciar Conversa com Suporte
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>


      </div>

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