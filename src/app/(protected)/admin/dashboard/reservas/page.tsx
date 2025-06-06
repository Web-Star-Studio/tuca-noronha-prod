"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ui } from "@/lib/ui-config";

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [partnerNotes, setPartnerNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionType, setActionType] = useState<"confirm" | "cancel">("confirm");

  // Mutations for booking actions
  const confirmActivityBooking = useMutation(api.domains.bookings.mutations.confirmActivityBooking);
  const confirmEventBooking = useMutation(api.domains.bookings.mutations.confirmEventBooking);
  const confirmRestaurantReservation = useMutation(api.domains.bookings.mutations.confirmRestaurantReservation);
  const cancelActivityBooking = useMutation(api.domains.bookings.mutations.cancelActivityBooking);
  const cancelEventBooking = useMutation(api.domains.bookings.mutations.cancelEventBooking);
  const cancelRestaurantReservation = useMutation(api.domains.bookings.mutations.cancelRestaurantReservation);

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

  // Handle booking confirmation
  const handleConfirmBooking = async (booking: any, type: string) => {
    try {
      if (type === "activity") {
        await confirmActivityBooking({
          bookingId: booking._id,
          partnerNotes: partnerNotes || undefined,
        });
      } else if (type === "event") {
        await confirmEventBooking({
          bookingId: booking._id,
          partnerNotes: partnerNotes || undefined,
        });
      } else if (type === "restaurant") {
        await confirmRestaurantReservation({
          reservationId: booking._id,
          partnerNotes: partnerNotes || undefined,
        });
      }
      
      toast.success("Reserva confirmada com sucesso!");
      setShowConfirmDialog(false);
      setSelectedBooking(null);
      setPartnerNotes("");
    } catch (error) {
      toast.error("Erro ao confirmar reserva");
      console.error(error);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (booking: any, type: string) => {
    try {
      if (type === "activity") {
        await cancelActivityBooking({
          bookingId: booking._id,
          reason: partnerNotes || "Cancelada pelo admin",
        });
      } else if (type === "event") {
        await cancelEventBooking({
          bookingId: booking._id,
          reason: partnerNotes || "Cancelada pelo admin",
        });
      } else if (type === "restaurant") {
        await cancelRestaurantReservation({
          reservationId: booking._id,
          reason: partnerNotes || "Cancelada pelo admin",
        });
      }
      
      toast.success("Reserva cancelada com sucesso!");
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setPartnerNotes("");
    } catch (error) {
      toast.error("Erro ao cancelar reserva");
      console.error(error);
    }
  };

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

  // Action buttons for each booking
  const renderActionButtons = (booking: any, type: string) => {
    if (booking.status === "pending") {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setSelectedBooking({ ...booking, type });
              setActionType("confirm");
              setShowConfirmDialog(true);
            }}
            className={`${ui.buttons.confirm.className} flex items-center gap-1`}
          >
            <Check className="w-3 h-3" />
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedBooking({ ...booking, type });
              setActionType("cancel");
              setShowCancelDialog(true);
            }}
            className="flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Cancelar
          </Button>
        </div>
      );
    }
    
    return (
      <Badge variant="outline" className="text-xs">
        {booking.status === "confirmed" ? "Confirmada" : 
         booking.status === "canceled" ? "Cancelada" : "Concluída"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`${ui.typography.h1.className} ${ui.colors.text.primary}`}>
          Gerenciamento de Reservas
        </h1>
        <p className={ui.colors.text.secondary}>
          Visualize e gerencie todas as reservas dos parceiros
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Total de Reservas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className={`h-8 w-8 ${ui.colors.primary}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Pendentes</p>
                <p className={`text-2xl font-bold ${ui.colors.warning}`}>{stats.pending}</p>
              </div>
              <Clock className={`h-8 w-8 ${ui.colors.warning}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Confirmadas</p>
                <p className={`text-2xl font-bold ${ui.colors.success}`}>{stats.confirmed}</p>
              </div>
              <CheckCircle className={`h-8 w-8 ${ui.colors.success}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>Receita Total</p>
                <p className={`text-2xl font-bold ${ui.colors.success}`}>
                  R$ {stats.revenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${ui.colors.success}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${ui.colors.text.muted} w-4 h-4`} />
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
                    <div className={`space-y-1 text-sm ${ui.colors.text.secondary}`}>
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">
                          #{booking.confirmationCode}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <p className="font-medium">{booking.customerInfo.name}</p>
                      <p className={`text-sm ${ui.colors.text.secondary}`}>{booking.customerInfo.email}</p>
                      <p className={`text-sm ${ui.colors.text.secondary}`}>{booking.customerInfo.phone}</p>
                    </div>
                    {renderActionButtons(booking, "activity")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {activityBookings?.page.length === 0 && (
            <div className={`text-center py-8 ${ui.colors.text.muted}`}>
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
                    <div className={`space-y-1 text-sm ${ui.colors.text.secondary}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Data do evento
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">
                          #{booking.confirmationCode}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <p className="font-medium">{booking.customerInfo.name}</p>
                      <p className={`text-sm ${ui.colors.text.secondary}`}>{booking.customerInfo.email}</p>
                      <p className={`text-sm ${ui.colors.text.secondary}`}>{booking.customerInfo.phone}</p>
                    </div>
                    {renderActionButtons(booking, "event")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {eventBookings?.page.length === 0 && (
            <div className={`text-center py-8 ${ui.colors.text.muted}`}>
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
                    <div className={`space-y-1 text-sm ${ui.colors.text.secondary}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {reservation.date} às {reservation.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {Number(reservation.partySize)} pessoas
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">
                          #{reservation.confirmationCode}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <p className="font-medium">{reservation.name}</p>
                      <p className={`text-sm ${ui.colors.text.secondary}`}>{reservation.email}</p>
                      <p className={`text-sm ${ui.colors.text.secondary}`}>{reservation.phone}</p>
                    </div>
                    {renderActionButtons(reservation, "restaurant")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {restaurantReservations?.page.length === 0 && (
            <div className={`text-center py-8 ${ui.colors.text.muted}`}>
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
                    <div className={`space-y-1 text-sm ${ui.colors.text.secondary}`}>
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
                  <div className="text-right">
                    {renderActionButtons(booking, "vehicle")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {vehicleBookings?.page.length === 0 && (
            <div className={`text-center py-8 ${ui.colors.text.muted}`}>
              Nenhuma locação de veículo encontrada
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja confirmar esta reserva? O cliente receberá uma notificação da confirmação.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className={`space-y-3 p-4 ${ui.colors.background.muted} rounded-lg`}>
              <div>
                <Label className="text-sm font-medium">Detalhes da Reserva</Label>
                <p className="text-sm">Cliente: {selectedBooking.customerInfo?.name || selectedBooking.name}</p>
                <p className="text-sm">Código: #{selectedBooking.confirmationCode}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-notes">Observações do Parceiro (opcional)</Label>
                <Textarea
                  id="partner-notes"
                  placeholder="Adicione observações ou instruções especiais para o cliente..."
                  value={partnerNotes}
                  onChange={(e) => setPartnerNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedBooking && handleConfirmBooking(selectedBooking, selectedBooking.type)}
              className={ui.buttons.confirm.className}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className={`space-y-3 p-4 ${ui.colors.background.muted} rounded-lg`}>
              <div>
                <Label className="text-sm font-medium">Detalhes da Reserva</Label>
                <p className="text-sm">Cliente: {selectedBooking.customerInfo?.name || selectedBooking.name}</p>
                <p className="text-sm">Código: #{selectedBooking.confirmationCode}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Motivo do Cancelamento</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Explique o motivo do cancelamento..."
                  value={partnerNotes}
                  onChange={(e) => setPartnerNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBooking && handleCancelBooking(selectedBooking, selectedBooking.type)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions for Testing */}
      <Card className={ui.colors.background.accent}>
        <CardHeader>
          <CardTitle>Sistema de Confirmação de Reservas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold">✅ Funcionalidades Implementadas:</h4>
            <ul className={`text-sm ${ui.colors.text.secondary} space-y-1 ml-4`}>
              <li>• Visualização de todas as reservas por categoria</li>
              <li>• Botões de confirmação e cancelamento para reservas pendentes</li>
              <li>• Modais de confirmação com possibilidade de adicionar observações</li>
              <li>• Notificações automáticas para clientes quando reservas são confirmadas</li>
              <li>• Estatísticas em tempo real no dashboard</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">🔔 Sistema de Notificações:</h4>
            <p className={`text-sm ${ui.colors.text.secondary}`}>
              Quando uma reserva é confirmada ou cancelada, o cliente recebe automaticamente uma notificação no sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}