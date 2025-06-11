"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { ChatNotifications } from "@/components/dashboard/ChatNotifications";
import { ChatList } from "@/components/chat/ChatList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Bell, Users, TrendingUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export default function ChatPage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("overview");

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
          <MessageCircle className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Chat</h1>
          <p className="text-sm text-gray-600">
            Gerencie suas conversas e notificações de chat
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de Conversas
                </p>
                <p className="text-2xl font-bold">{stats.totalChats}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Conversas Ativas
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeChats}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Notificações Não Lidas
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.unreadNotifications}
                </p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Conversas Hoje
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.todayChats}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChatNotifications 
              maxItems={5} 
              showTitle={true}
              className="h-fit"
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversas Recentes
                </CardTitle>
                <CardDescription>
                  Suas conversas mais recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Conversas</CardTitle>
              <CardDescription>
                Gerencie todas as suas conversas de chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificações de Chat</CardTitle>
              <CardDescription>
                Todas as suas notificações relacionadas ao chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatNotifications 
                maxItems={20} 
                showTitle={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 