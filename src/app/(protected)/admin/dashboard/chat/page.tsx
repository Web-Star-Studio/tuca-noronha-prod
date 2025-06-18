"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { ChatNotifications } from "@/components/dashboard/ChatNotifications";
import { ChatList } from "@/components/chat/ChatList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Bell, Users, TrendingUp, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { ui } from "@/lib/ui-config";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function ChatPage() {
  const { user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar estatísticas de chat
  const chatRooms = useQuery(api.domains.chat.queries.listChatRooms, {});
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: 50,
  });

  const chatNotifications = notifications?.filter(n => 
    n.type === "chat_message" || n.type === "chat_room_created"
  ) || [];

  const stats = {
    totalChats: chatRooms?.length || 0,
    activeChats: chatRooms?.filter(c => c.status === "active").length || 0,
    unreadNotifications: chatNotifications.filter(n => !n.isRead).length,
    todayChats: chatRooms?.filter(room => {
      const today = new Date();
      const roomDate = new Date(room.createdAt);
      return roomDate.toDateString() === today.toDateString();
    }).length || 0,
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header - Design Minimalista */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className={`${ui.typography.h1.className} ${ui.colors.text.primary}`}>
              Central de Chat
            </h1>
            <p className={`${ui.colors.text.secondary} text-sm leading-relaxed`}>
              Gerencie suas conversas e notificações de chat
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Layout Clean */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Conversas
                </p>
                <p className="text-2xl font-bold text-foreground">{stats.totalChats}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Conversas Ativas
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeChats}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Não Lidas
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.unreadNotifications}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Conversas Hoje
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.todayChats}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Simplified Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversas - Principal */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Suas Conversas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Gerencie todas as suas conversas de chat
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/30 border-0 focus:bg-white transition-colors"
                />
              </div>

              {/* Chat List */}
              <div className="bg-muted/20 rounded-lg p-1">
                <ChatList 
                  showWrapper={false}
                  searchTerm={searchTerm}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notificações - Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notificações</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Mensagens e atualizações recentes
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="bg-muted/20 rounded-lg p-1">
                <ChatNotifications 
                  maxItems={10} 
                  showTitle={false}
                  showWrapper={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
} 