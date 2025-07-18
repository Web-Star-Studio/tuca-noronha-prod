"use client";

import React, { useState } from "react";
import { MessageCircle, Search, Filter, Users, Clock, ArrowLeft } from "lucide-react";
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
import Link from "next/link";

export default function ChatsPage() {
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
    <div className="min-h-screen bg-gray-50 -mt-24 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/meu-painel" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Painel
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Conversas</h1>
            <p className="text-gray-600">Converse com parceiros, fornecedores e nossa equipe de suporte</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        </div>

        {/* Chat Tabs and List */}
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
                    <p className="text-gray-500">
                      {searchTerm 
                        ? "Tente ajustar sua pesquisa ou limpar os filtros"
                        : "Suas conversas aparecerão aqui quando você começar a conversar com parceiros ou nossa equipe"
                      }
                    </p>
                  </div>
                )}
              </TabsContent>

                             <TabsContent value="active" className="mt-6">
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
                    <p className="text-gray-500">
                      Suas conversas ativas aparecerão aqui
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
} 