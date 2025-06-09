"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Users, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ChatButton } from "@/components/chat/ChatButton";
import { toast } from "sonner";

type BookingStatus = "pending" | "confirmed" | "canceled" | "completed";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  canceled: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle },
  completed: { label: "Concluída", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
};

interface ConfirmBookingDialogProps {
  bookingId: string;
  bookingType: "activity" | "event" | "restaurant" | "vehicle";
  currentStatus: BookingStatus;
  onSuccess: () => void;
}

function ConfirmBookingDialog({ bookingId, bookingType, currentStatus, onSuccess }: ConfirmBookingDialogProps) {
  const [notes, setNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const confirmActivityBooking = useMutation(api.domains.bookings.mutations.confirmActivityBooking);
  const confirmEventBooking = useMutation(api.domains.bookings.mutations.confirmEventBooking);
  const confirmRestaurantReservation = useMutation(api.domains.bookings.mutations.confirmRestaurantReservation);
  const confirmVehicleBooking = useMutation(api.domains.bookings.mutations.confirmVehicleBooking);

  const handleConfirm = async () => {
    try {
      const args = {
        bookingId: bookingId as Id<any>,
        notes: notes.trim() || undefined,
      };

      switch (bookingType) {
        case "activity":
          await confirmActivityBooking(args);
          break;
        case "event":
          await confirmEventBooking(args);
          break;
        case "restaurant":
          await confirmRestaurantReservation({ 
            reservationId: bookingId as Id<"restaurantReservations">,
            notes: notes.trim() || undefined,
          });
          break;
        case "vehicle":
          await confirmVehicleBooking(args);
          break;
      }

      toast.success("Reserva confirmada com sucesso!");
      setIsOpen(false);
      setNotes("");
      onSuccess();
    } catch (error) {
      console.error("Erro ao confirmar reserva:", error);
      toast.error("Erro ao confirmar reserva. Tente novamente.");
    }
  };

  if (currentStatus !== "pending") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-1" />
          Confirmar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Reserva</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre a confirmação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
              Confirmar Reserva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ActivityBookingCardProps {
  booking: any;
  onRefresh: () => void;
}

function ActivityBookingCard({ booking, onRefresh }: ActivityBookingCardProps) {
  const statusInfo = statusConfig[booking.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.activityTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">#{booking.confirmationCode}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <ChatButton
              assetId={booking.activityId}
              assetType="activities"
              assetName={booking.activityTitle}
              partnerId={booking.partnerId}
              bookingId={booking._id}
              bookingContext={`Reserva #${booking.confirmationCode}`}
              variant="outline"
              size="sm"
              showLabel={false}
            />
            <ConfirmBookingDialog
              bookingId={booking._id}
              bookingType="activity"
              currentStatus={booking.status}
              onSuccess={onRefresh}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.date}</span>
          </div>
          {booking.time && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span>{booking.time}</span>
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.participants} participantes</span>
          </div>
          <div className="font-semibold">
            R$ {booking.totalPrice.toFixed(2)}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium mb-2">Informações do Cliente</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center">
              <span className="font-medium mr-2">Nome:</span>
              <span>{booking.customerInfo.name}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <span>{booking.customerInfo.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <span>{booking.customerInfo.phone}</span>
            </div>
          </div>
          {booking.specialRequests && (
            <div className="mt-3">
              <span className="font-medium">Solicitações especiais:</span>
              <p className="text-gray-600 mt-1">{booking.specialRequests}</p>
            </div>
          )}
          {booking.partnerNotes && (
            <div className="mt-3">
              <span className="font-medium">Observações do parceiro:</span>
              <p className="text-gray-600 mt-1">{booking.partnerNotes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RestaurantReservationCardProps {
  reservation: any;
  onRefresh: () => void;
}

function RestaurantReservationCard({ reservation, onRefresh }: RestaurantReservationCardProps) {
  const statusInfo = statusConfig[reservation.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{reservation.restaurantName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">#{reservation.confirmationCode}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <ConfirmBookingDialog
              bookingId={reservation._id}
              bookingType="restaurant"
              currentStatus={reservation.status}
              onSuccess={onRefresh}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{reservation.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{reservation.time}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>{reservation.partySize} pessoas</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium mb-2">Informações do Cliente</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center">
              <span className="font-medium mr-2">Nome:</span>
              <span>{reservation.name}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <span>{reservation.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <span>{reservation.phone}</span>
            </div>
          </div>
          {reservation.specialRequests && (
            <div className="mt-3">
              <span className="font-medium">Solicitações especiais:</span>
              <p className="text-gray-600 mt-1">{reservation.specialRequests}</p>
            </div>
          )}
          {reservation.partnerNotes && (
            <div className="mt-3">
              <span className="font-medium">Observações do parceiro:</span>
              <p className="text-gray-600 mt-1">{reservation.partnerNotes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookingManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const partnerBookings = useQuery(api.domains.bookings.queries.getPartnerBookings, {
    paginationOpts: { numItems: 50, cursor: null },
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  const activityBookings = useQuery(api.domains.bookings.queries.getActivityBookings, {
    paginationOpts: { numItems: 50, cursor: null },
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  const restaurantReservations = useQuery(api.domains.bookings.queries.getRestaurantReservations, {
    paginationOpts: { numItems: 50, cursor: null },
    status: selectedStatus === "all" ? undefined : selectedStatus,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!activityBookings || !restaurantReservations) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Reservas</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as reservas recebidas para seus serviços
        </p>
      </div>

      <div className="flex space-x-4">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          onClick={() => setSelectedStatus("all")}
        >
          Todas
        </Button>
        <Button
          variant={selectedStatus === "pending" ? "default" : "outline"}
          onClick={() => setSelectedStatus("pending")}
        >
          Pendentes
        </Button>
        <Button
          variant={selectedStatus === "confirmed" ? "default" : "outline"}
          onClick={() => setSelectedStatus("confirmed")}
        >
          Confirmadas
        </Button>
        <Button
          variant={selectedStatus === "canceled" ? "default" : "outline"}
          onClick={() => setSelectedStatus("canceled")}
        >
          Canceladas
        </Button>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">
            Atividades ({activityBookings.page.length})
          </TabsTrigger>
          <TabsTrigger value="restaurants">
            Restaurantes ({restaurantReservations.page.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Eventos (0)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-6">
          {activityBookings.page.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma reserva encontrada
                </h3>
                <p className="text-gray-600">
                  Você ainda não recebeu reservas para suas atividades.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activityBookings.page.map((booking) => (
                <ActivityBookingCard
                  key={booking._id}
                  booking={booking}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="restaurants" className="mt-6">
          {restaurantReservations.page.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma reserva encontrada
                </h3>
                <p className="text-gray-600">
                  Você ainda não recebeu reservas para seus restaurantes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {restaurantReservations.page.map((reservation) => (
                <RestaurantReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Em desenvolvimento
              </h3>
              <p className="text-gray-600">
                A gestão de reservas de eventos estará disponível em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}