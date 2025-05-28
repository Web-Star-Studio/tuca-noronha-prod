"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, Ticket } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "canceled" | "completed";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  canceled: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle },
  completed: { label: "Concluída", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
};

interface ActivityBookingCardProps {
  booking: any;
}

function ActivityBookingCard({ booking }: ActivityBookingCardProps) {
  const statusInfo = statusConfig[booking.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.activityTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Código: #{booking.confirmationCode}</p>
            {booking.activityImageUrl && (
              <img 
                src={booking.activityImageUrl} 
                alt={booking.activityTitle}
                className="w-20 h-20 object-cover rounded-md mt-2"
              />
            )}
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
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
          <div className="font-semibold text-green-600">
            R$ {booking.totalPrice.toFixed(2)}
          </div>
        </div>
        {booking.specialRequests && (
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium">Suas solicitações especiais:</span>
            <p className="text-gray-600 mt-1">{booking.specialRequests}</p>
          </div>
        )}
        {booking.partnerNotes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-blue-800">Observações do parceiro:</span>
            <p className="text-blue-700 mt-1">{booking.partnerNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EventBookingCardProps {
  booking: any;
}

function EventBookingCard({ booking }: EventBookingCardProps) {
  const statusInfo = statusConfig[booking.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.eventTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Código: #{booking.confirmationCode}</p>
            {booking.eventImageUrl && (
              <img 
                src={booking.eventImageUrl} 
                alt={booking.eventTitle}
                className="w-20 h-20 object-cover rounded-md mt-2"
              />
            )}
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.eventDate}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.eventTime}</span>
          </div>
          <div className="flex items-center">
            <Ticket className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.quantity} ingressos</span>
          </div>
          <div className="font-semibold text-green-600">
            R$ {booking.totalPrice.toFixed(2)}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>{booking.eventLocation}</span>
          </div>
        </div>
        {booking.specialRequests && (
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium">Suas solicitações especiais:</span>
            <p className="text-gray-600 mt-1">{booking.specialRequests}</p>
          </div>
        )}
        {booking.partnerNotes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-blue-800">Observações do organizador:</span>
            <p className="text-blue-700 mt-1">{booking.partnerNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RestaurantReservationCardProps {
  reservation: any;
}

function RestaurantReservationCard({ reservation }: RestaurantReservationCardProps) {
  const statusInfo = statusConfig[reservation.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{reservation.restaurantName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Código: #{reservation.confirmationCode}</p>
            {reservation.restaurantImageUrl && (
              <img 
                src={reservation.restaurantImageUrl} 
                alt={reservation.restaurantName}
                className="w-20 h-20 object-cover rounded-md mt-2"
              />
            )}
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
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
            <span>{Number(reservation.partySize)} pessoas</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>{reservation.restaurantAddress}</span>
          </div>
        </div>
        {reservation.specialRequests && (
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium">Suas solicitações especiais:</span>
            <p className="text-gray-600 mt-1">{reservation.specialRequests}</p>
          </div>
        )}
        {reservation.partnerNotes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-blue-800">Observações do restaurante:</span>
            <p className="text-blue-700 mt-1">{reservation.partnerNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface VehicleBookingCardProps {
  booking: any;
}

function VehicleBookingCard({ booking }: VehicleBookingCardProps) {
  const statusInfo = statusConfig[booking.status as BookingStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.vehicleName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{booking.vehicleBrand} {booking.vehicleModel}</p>
            {booking.vehicleImageUrl && (
              <img 
                src={booking.vehicleImageUrl} 
                alt={booking.vehicleName}
                className="w-20 h-20 object-cover rounded-md mt-2"
              />
            )}
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>De: {new Date(booking.startDate).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>Até: {new Date(booking.endDate).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="font-semibold text-green-600 col-span-2">
            R$ {booking.totalPrice.toFixed(2)}
          </div>
        </div>
        {(booking.pickupLocation || booking.returnLocation) && (
          <div className="mt-4 pt-4 border-t">
            {booking.pickupLocation && (
              <div className="flex items-center mb-2">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <span>Retirada: {booking.pickupLocation}</span>
              </div>
            )}
            {booking.returnLocation && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <span>Devolução: {booking.returnLocation}</span>
              </div>
            )}
          </div>
        )}
        {booking.notes && (
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium">Suas observações:</span>
            <p className="text-gray-600 mt-1">{booking.notes}</p>
          </div>
        )}
        {booking.partnerNotes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-blue-800">Observações da locadora:</span>
            <p className="text-blue-700 mt-1">{booking.partnerNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UserBookingsList() {
  const activityBookings = useQuery(api.domains.bookings.queries.getUserActivityBookings, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  const eventBookings = useQuery(api.domains.bookings.queries.getUserEventBookings, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  const restaurantReservations = useQuery(api.domains.bookings.queries.getUserRestaurantReservations, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  const vehicleBookings = useQuery(api.domains.bookings.queries.getUserVehicleBookings, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  if (!activityBookings || !eventBookings || !restaurantReservations || !vehicleBookings) {
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

  const totalBookings = activityBookings.page.length + eventBookings.page.length + 
                       restaurantReservations.page.length + vehicleBookings.page.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas Reservas</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe o status das suas reservas e confirmações
        </p>
      </div>

      {totalBookings === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma reserva encontrada
            </h3>
            <p className="text-gray-600">
              Você ainda não fez nenhuma reserva. Explore nossos serviços e faça sua primeira reserva!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activities">
              Atividades ({activityBookings.page.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              Eventos ({eventBookings.page.length})
            </TabsTrigger>
            <TabsTrigger value="restaurants">
              Restaurantes ({restaurantReservations.page.length})
            </TabsTrigger>
            <TabsTrigger value="vehicles">
              Veículos ({vehicleBookings.page.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="mt-6">
            {activityBookings.page.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma atividade reservada
                  </h3>
                  <p className="text-gray-600">
                    Você ainda não reservou nenhuma atividade.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activityBookings.page.map((booking) => (
                  <ActivityBookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {eventBookings.page.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum evento reservado
                  </h3>
                  <p className="text-gray-600">
                    Você ainda não reservou ingressos para nenhum evento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {eventBookings.page.map((booking) => (
                  <EventBookingCard key={booking._id} booking={booking} />
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
                    Nenhuma reserva de restaurante
                  </h3>
                  <p className="text-gray-600">
                    Você ainda não fez reservas em restaurantes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {restaurantReservations.page.map((reservation) => (
                  <RestaurantReservationCard key={reservation._id} reservation={reservation} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vehicles" className="mt-6">
            {vehicleBookings.page.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum veículo reservado
                  </h3>
                  <p className="text-gray-600">
                    Você ainda não alugou nenhum veículo.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {vehicleBookings.page.map((booking) => (
                  <VehicleBookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}