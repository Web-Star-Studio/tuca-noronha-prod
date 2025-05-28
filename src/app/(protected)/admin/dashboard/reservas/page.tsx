"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Car,
  Utensils,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all bookings for admin dashboard
  const activityBookings = useQuery(api.domains.bookings.queries.getActivityBookings, {
    paginationOpts: { numItems: 100, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });
  
  const eventBookings = useQuery(api.domains.bookings.queries.getEventBookings, {
    paginationOpts: { numItems: 100, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });
  
  const restaurantReservations = useQuery(api.domains.bookings.queries.getRestaurantReservations, {
    paginationOpts: { numItems: 100, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });
  
  const vehicleBookings = useQuery(api.domains.bookings.queries.getVehicleBookings, {
    paginationOpts: { numItems: 100, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  // Stats calculation
  const calculateStats = () => {
    if (!activityBookings || !eventBookings || !restaurantReservations || !vehicleBookings) {
      return { total: 0, pending: 0, confirmed: 0, revenue: 0 };
    }
    
    const allBookings = [
      ...activityBookings.page,
      ...eventBookings.page,
      ...restaurantReservations.page.map(r => ({ ...r, totalPrice: 0 })), // Restaurants don't have price
      ...vehicleBookings.page,
    ];

    return {
      total: allBookings.length,
      pending: allBookings.filter(b => b.status === "pending").length,
      confirmed: allBookings.filter(b => b.status === "confirmed").length,
      revenue: allBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
    };
  };

  const stats = calculateStats();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pendente", icon: AlertCircle },
      confirmed: { variant: "default" as const, label: "Confirmado", icon: CheckCircle },
      canceled: { variant: "destructive" as const, label: "Cancelado", icon: XCircle },
      completed: { variant: "outline" as const, label: "Concluído", icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Reservas</h1>
        <p className="text-gray-600">
          Visualize e gerencie todas as reservas dos parceiros
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Reservas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {stats.revenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome do cliente, atividade, evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings by Type */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Atividades ({activityBookings?.page.length || 0})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Eventos ({eventBookings?.page.length || 0})
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Restaurantes ({restaurantReservations?.page.length || 0})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            Veículos ({vehicleBookings?.page.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          {activityBookings?.page.map((booking) => (
            <Card key={booking._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{booking.activityTitle}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {booking.participants} participantes
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{booking.customerInfo.name}</p>
                    <p className="text-gray-600">{booking.customerInfo.email}</p>
                    <p className="text-gray-600">{booking.customerInfo.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {activityBookings?.page.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma reserva de atividade encontrada
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {eventBookings?.page.map((booking) => (
            <Card key={booking._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{booking.eventTitle}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {booking.eventDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        {booking.quantity} ingressos
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{booking.customerInfo.name}</p>
                    <p className="text-gray-600">{booking.customerInfo.email}</p>
                    <p className="text-gray-600">{booking.customerInfo.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {eventBookings?.page.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma reserva de evento encontrada
            </div>
          )}
        </TabsContent>

        {/* Restaurants Tab */}
        <TabsContent value="restaurants" className="space-y-4">
          {restaurantReservations?.page.map((reservation) => (
            <Card key={reservation._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{reservation.restaurantName}</h3>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {reservation.date} às {reservation.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {Number(reservation.partySize)} pessoas
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{reservation.name}</p>
                    <p className="text-gray-600">{reservation.email}</p>
                    <p className="text-gray-600">{reservation.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {restaurantReservations?.page.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma reserva de restaurante encontrada
            </div>
          )}
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          {vehicleBookings?.page.map((booking) => (
            <Card key={booking._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{booking.vehicleName}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.startDate), "PPP", { locale: ptBR })} - {format(new Date(booking.endDate), "PPP", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {vehicleBookings?.page.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma locação de veículo encontrada
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Instructions for Testing */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle>Instruções para Teste (Admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold">1. Dados de Parceiros:</h4>
            <p className="text-sm text-gray-600">
              Esta página mostra todas as reservas dos parceiros. Para teste, certifique-se de que existem parceiros com ativos cadastrados.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">2. Permissões:</h4>
            <p className="text-sm text-gray-600">
              Apenas usuários com role "master" ou "partner" podem ver esta página.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">3. Estatísticas:</h4>
            <p className="text-sm text-gray-600">
              Os cards no topo mostram estatísticas em tempo real das reservas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}