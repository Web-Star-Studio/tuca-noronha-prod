"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar,
  MapPin,
  Users,
  Clock,
  Car,
  Utensils,
  Ticket,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { cardStyles, buttonStyles, badgeStyles } from "@/lib/ui-config";

interface BookingManagementDashboardProps {
  className?: string;
}

export function BookingManagementDashboard({ className }: BookingManagementDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Fetch bookings data
  const activityBookings = useQuery(api.domains.bookings.queries.getUserActivityBookings, {
    paginationOpts: { numItems: 50, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const eventBookings = useQuery(api.domains.bookings.queries.getUserEventBookings, {
    paginationOpts: { numItems: 50, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const restaurantReservations = useQuery(api.domains.bookings.queries.getUserRestaurantReservations, {
    paginationOpts: { numItems: 50, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const vehicleBookings = useQuery(api.domains.bookings.queries.getUserVehicleBookings, {
    paginationOpts: { numItems: 50, cursor: null },
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  // Mutations for canceling bookings
  const cancelActivityBooking = useMutation(api.domains.bookings.mutations.cancelActivityBooking);
  const cancelEventBooking = useMutation(api.domains.bookings.mutations.cancelEventBooking);
  const cancelRestaurantReservation = useMutation(api.domains.bookings.mutations.cancelRestaurantReservation);
  const cancelVehicleBooking = useMutation(api.domains.bookings.mutations.cancelVehicleBooking);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Status antigos (compatibilidade)
      pending: { variant: "warning" as const, label: "Pendente", icon: AlertCircle },
      confirmed: { variant: "success" as const, label: "Confirmado", icon: CheckCircle },
      canceled: { variant: "danger" as const, label: "Cancelado", icon: XCircle },
      completed: { variant: "info" as const, label: "Concluído", icon: CheckCircle },
      refunded: { variant: "secondary" as const, label: "Reembolsado", icon: XCircle },
      
      // Novos status
      draft: { variant: "secondary" as const, label: "Rascunho", icon: AlertCircle },
      payment_pending: { variant: "warning" as const, label: "Aguardando Pagamento", icon: AlertCircle },
      awaiting_confirmation: { variant: "warning" as const, label: "Aguardando Confirmação", icon: AlertCircle },
      in_progress: { variant: "info" as const, label: "Em Andamento", icon: CheckCircle },
      no_show: { variant: "danger" as const, label: "Não Compareceu", icon: XCircle },
      expired: { variant: "secondary" as const, label: "Expirada", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={cn(badgeStyles.base, badgeStyles.variant[config.variant])}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleCancelBooking = async (type: string, bookingId: string) => {
    try {
      switch (type) {
        case "activity":
          await cancelActivityBooking({ bookingId: bookingId as any });
          break;
        case "event":
          await cancelEventBooking({ bookingId: bookingId as any });
          break;
        case "restaurant":
          await cancelRestaurantReservation({ reservationId: bookingId as any });
          break;
        case "vehicle":
          await cancelVehicleBooking({ bookingId: bookingId as any });
          break;
      }
      
      toast.success("Reserva cancelada com sucesso");
      setSelectedBooking(null);
    } catch (error) {
      toast.error("Erro ao cancelar reserva", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    }
  };

  const filterBookings = (bookings: any[]) => {
    if (!searchTerm) return bookings;
    
    return bookings.filter((booking) => {
      const searchableText = [
        booking.activityTitle || booking.eventTitle || booking.restaurantName || booking.vehicleName,
        booking.confirmationCode,
        booking.customerInfo?.name || booking.name,
      ].join(" ").toLowerCase();
      
      return searchableText.includes(searchTerm.toLowerCase());
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Minhas Reservas</h2>
          <p className="text-gray-600">Gerencie todas as suas reservas em um só lugar</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome, código de confirmação..."
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
            <SelectItem value="awaiting_confirmation">Aguardando Confirmação</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Booking Tabs */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Atividades
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Restaurantes
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            Veículos
          </TabsTrigger>
        </TabsList>

        {/* Activity Bookings */}
        <TabsContent value="activities" className="space-y-4">
          {activityBookings?.page && filterBookings(activityBookings.page).map((booking) => (
            <div key={booking._id} className={cn(cardStyles.base, cardStyles.hover.default)}>
              <div className={cardStyles.content.default}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{booking.activityTitle}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {booking.date} {booking.time && `às ${booking.time}`}
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
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Ver detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da Reserva</DialogTitle>
                          <DialogDescription>
                            Código: {booking.confirmationCode}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">Atividade</h4>
                            <p>{booking.activityTitle}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Data e Horário</h4>
                            <p>{booking.date} {booking.time && `às ${booking.time}`}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Participantes</h4>
                            <p>{booking.participants} pessoas</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Valor Total</h4>
                            <p>R$ {booking.totalPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Contato</h4>
                            <p>{booking.customerInfo.name}</p>
                            <p>{booking.customerInfo.email}</p>
                            <p>{booking.customerInfo.phone}</p>
                          </div>
                          {booking.specialRequests && (
                            <div>
                              <h4 className="font-medium">Solicitações Especiais</h4>
                              <p>{booking.specialRequests}</p>
                            </div>
                          )}
                          {(booking.status === "pending" || booking.status === "awaiting_confirmation") && (
                            <Button
                              variant="destructive"
                              onClick={() => handleCancelBooking("activity", booking._id)}
                              className="w-full"
                            >
                              Cancelar Reserva
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {activityBookings?.page && filterBookings(activityBookings.page).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma reserva de atividade encontrada
            </div>
          )}
        </TabsContent>

        {/* Event Bookings */}
        <TabsContent value="events" className="space-y-4">
          {eventBookings?.page && filterBookings(eventBookings.page).map((booking) => (
            <div key={booking._id} className={cn(cardStyles.base, cardStyles.hover.default)}>
              <div className={cardStyles.content.default}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{booking.eventTitle}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {booking.eventDate} às {booking.eventTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {booking.eventLocation}
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
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Ver detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do Ingresso</DialogTitle>
                          <DialogDescription>
                            Código: {booking.confirmationCode}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">Evento</h4>
                            <p>{booking.eventTitle}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Data e Horário</h4>
                            <p>{booking.eventDate} às {booking.eventTime}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Local</h4>
                            <p>{booking.eventLocation}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Quantidade</h4>
                            <p>{booking.quantity} ingressos</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Valor Total</h4>
                            <p>R$ {booking.totalPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Comprador</h4>
                            <p>{booking.customerInfo.name}</p>
                            <p>{booking.customerInfo.email}</p>
                            <p>{booking.customerInfo.phone}</p>
                          </div>
                          {booking.specialRequests && (
                            <div>
                              <h4 className="font-medium">Observações</h4>
                              <p>{booking.specialRequests}</p>
                            </div>
                          )}
                          {(booking.status === "pending" || booking.status === "awaiting_confirmation") && (
                            <Button
                              variant="destructive"
                              onClick={() => handleCancelBooking("event", booking._id)}
                              className="w-full"
                            >
                              Cancelar Ingresso
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {eventBookings?.page && filterBookings(eventBookings.page).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma reserva de evento encontrada
            </div>
          )}
        </TabsContent>

        {/* Restaurant Reservations */}
        <TabsContent value="restaurants" className="space-y-4">
          {restaurantReservations?.page && filterBookings(restaurantReservations.page).map((reservation) => (
            <div key={reservation._id} className={cn(cardStyles.base, cardStyles.hover.default)}>
              <div className={cardStyles.content.default}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{reservation.restaurantName}</h3>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {reservation.date} às {reservation.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {reservation.restaurantAddress}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {reservation.partySize} pessoas
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Ver detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da Reserva</DialogTitle>
                          <DialogDescription>
                            Código: {reservation.confirmationCode}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">Restaurante</h4>
                            <p>{reservation.restaurantName}</p>
                            <p className="text-sm text-gray-600">{reservation.restaurantAddress}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Data e Horário</h4>
                            <p>{reservation.date} às {reservation.time}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Número de Pessoas</h4>
                            <p>{reservation.partySize} pessoas</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Responsável</h4>
                            <p>{reservation.name}</p>
                            <p>{reservation.email}</p>
                            <p>{reservation.phone}</p>
                          </div>
                          {reservation.specialRequests && (
                            <div>
                              <h4 className="font-medium">Solicitações Especiais</h4>
                              <p>{reservation.specialRequests}</p>
                            </div>
                          )}
                          {(reservation.status === "pending" || reservation.status === "awaiting_confirmation") && (
                            <Button
                              variant="destructive"
                              onClick={() => handleCancelBooking("restaurant", reservation._id)}
                              className="w-full"
                            >
                              Cancelar Reserva
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {restaurantReservations?.page && filterBookings(restaurantReservations.page).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma reserva de restaurante encontrada
            </div>
          )}
        </TabsContent>

        {/* Vehicle Bookings */}
        <TabsContent value="vehicles" className="space-y-4">
          {vehicleBookings?.page && filterBookings(vehicleBookings.page).map((booking) => (
            <div key={booking._id} className={cn(cardStyles.base, cardStyles.hover.default)}>
              <div className={cardStyles.content.default}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {booking.vehicleBrand} {booking.vehicleModel}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.startDate), "PPP", { locale: ptBR })} - {format(new Date(booking.endDate), "PPP", { locale: ptBR })}
                      </div>
                      {booking.pickupLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {booking.pickupLocation}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Ver detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da Locação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">Veículo</h4>
                            <p>{booking.vehicleBrand} {booking.vehicleModel}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Período</h4>
                            <p>
                              {format(new Date(booking.startDate), "PPP", { locale: ptBR })} - {format(new Date(booking.endDate), "PPP", { locale: ptBR })}
                            </p>
                          </div>
                          {booking.pickupLocation && (
                            <div>
                              <h4 className="font-medium">Local de Retirada</h4>
                              <p>{booking.pickupLocation}</p>
                            </div>
                          )}
                          {booking.returnLocation && (
                            <div>
                              <h4 className="font-medium">Local de Devolução</h4>
                              <p>{booking.returnLocation}</p>
                            </div>
                          )}
                          {booking.notes && (
                            <div>
                              <h4 className="font-medium">Observações</h4>
                              <p>{booking.notes}</p>
                            </div>
                          )}
                          {(booking.status === "pending" || booking.status === "awaiting_confirmation") && (
                            <Button
                              variant="destructive"
                              onClick={() => handleCancelBooking("vehicle", booking._id)}
                              className="w-full"
                            >
                              Cancelar Locação
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {vehicleBookings?.page && filterBookings(vehicleBookings.page).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma locação de veículo encontrada
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}