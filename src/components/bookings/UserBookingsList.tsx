"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, Ticket, Eye, CheckCircle2, Hourglass, AlertTriangle, XCircle, Car, BedDouble, Utensils, Mountain } from "lucide-react";
import { VoucherDownloadButton } from "@/components/vouchers/VoucherDownloadButton";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type BookingStatus = "pending" | "confirmed" | "canceled" | "completed" | "draft" | "payment_pending" | "awaiting_confirmation" | "in_progress" | "no_show" | "expired";

const statusConfig = {
  pending: { label: "Pendente", color: "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", icon: Hourglass },
  confirmed: { label: "Confirmada", color: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle2 },
  canceled: { label: "Cancelada", color: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  completed: { label: "Concluída", color: "border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: CheckCircle2 },
  draft: { label: "Rascunho", color: "border-slate-500/50 bg-slate-50 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400", icon: AlertTriangle },
  payment_pending: { label: "Aguardando Pagamento", color: "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", icon: Hourglass },
  awaiting_confirmation: { label: "Aguardando Confirmação", color: "border-orange-500/50 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400", icon: Hourglass },
  in_progress: { label: "Em Andamento", color: "border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: CheckCircle2 },
  no_show: { label: "Não Compareceu", color: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  expired: { label: "Expirada", color: "border-slate-500/50 bg-slate-50 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400", icon: XCircle },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status as BookingStatus] || {
    label: status,
    color: "border-slate-500/50 bg-slate-50 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400",
    icon: AlertTriangle
  };
};

const typeConfig = {
    activity: { icon: Mountain, label: "Atividade" },
    event: { icon: Ticket, label: "Evento" },
    restaurant: { icon: Utensils, label: "Restaurante" },
    vehicle: { icon: Car, label: "Veículo" },
    accommodation: { icon: BedDouble, label: "Hospedagem" },
    package: { icon: Mountain, label: "Pacote" }, // Added package type
}

const getTypeConfig = (type: string) => {
    return typeConfig[type as keyof typeof typeConfig] || { icon: Mountain, label: "Reserva" };
}

function BookingCard({ booking }: { booking: any }) {
  const statusInfo = getStatusConfig(booking.status);
  const StatusIcon = statusInfo.icon;
  const typeInfo = getTypeConfig(booking.type);
  const TypeIcon = typeInfo.icon;

  const getBookingDetails = () => {
    let imageUrl: string | undefined;
    let details: { icon: React.ElementType; text: string | undefined }[] = [];
    let assetName = booking.assetName;

    switch (booking.type) {
      case 'activity':
        imageUrl = booking.asset?.imageUrl;
        assetName = booking.asset?.title;
        details = [
          { icon: Calendar, text: booking.activityBookings?.date },
          { icon: Clock, text: booking.activityBookings?.time },
          { icon: Users, text: `${booking.activityBookings?.participants || 0} ${booking.activityBookings?.participants === 1 ? 'participante' : 'participantes'}` },
        ];
        break;
      case 'event':
        imageUrl = booking.asset?.imageUrl;
        assetName = booking.asset?.title;
        details = [
          { icon: Calendar, text: booking.eventBookings?.date || booking.asset?.date },
          { icon: Clock, text: booking.eventBookings?.time || booking.asset?.time },
          { icon: Ticket, text: `${booking.eventBookings?.quantity || 0} ${booking.eventBookings?.quantity === 1 ? 'ingresso' : 'ingressos'}` },
        ];
        break;
      case 'restaurant':
        imageUrl = booking.asset?.mainImage;
        assetName = booking.asset?.name;
        details = [
          { icon: Calendar, text: booking.restaurantReservations?.date },
          { icon: Clock, text: booking.restaurantReservations?.time },
          { icon: Users, text: `${Number(booking.restaurantReservations?.partySize || 0)} ${Number(booking.restaurantReservations?.partySize || 0) === 1 ? 'pessoa' : 'pessoas'}` },
        ];
        break;
      case 'vehicle':
        imageUrl = booking.asset?.imageUrl;
        assetName = booking.asset?.name;
        details = [
          { icon: Calendar, text: `De: ${booking.vehicleBookings?.startDate ? new Date(booking.vehicleBookings.startDate).toLocaleDateString('pt-BR') : 'N/A'}` },
          { icon: Calendar, text: `Até: ${booking.vehicleBookings?.endDate ? new Date(booking.vehicleBookings.endDate).toLocaleDateString('pt-BR') : 'N/A'}` },
          { icon: Users, text: `${booking.asset?.seats || 'N/A'} assentos` },
        ];
        break;
      case 'accommodation':
        imageUrl = booking.asset?.mainImage;
        assetName = booking.asset?.name;
        details = [
          { icon: Calendar, text: `Check-in: ${booking.accommodationBookings?.checkInDate ? new Date(booking.accommodationBookings.checkInDate).toLocaleDateString('pt-BR') : 'N/A'}` },
          { icon: Calendar, text: `Check-out: ${booking.accommodationBookings?.checkOutDate ? new Date(booking.accommodationBookings.checkOutDate).toLocaleDateString('pt-BR') : 'N/A'}` },
          { icon: Users, text: `${booking.accommodationBookings?.guests || 0} ${booking.accommodationBookings?.guests === 1 ? 'hóspede' : 'hóspedes'}` },
        ];
        break;
      case 'package':
        imageUrl = booking.asset?.mainImage;
        assetName = booking.asset?.name;
        details = [
          { icon: Calendar, text: `Início: ${booking.packageBookings?.startDate ? new Date(booking.packageBookings.startDate).toLocaleDateString('pt-BR') : 'N/A'}` },
          { icon: Calendar, text: `Fim: ${booking.packageBookings?.endDate ? new Date(booking.packageBookings.endDate).toLocaleDateString('pt-BR') : 'N/A'}` },
          { icon: Users, text: `${booking.packageBookings?.guests || 0} ${booking.packageBookings?.guests === 1 ? 'pessoa' : 'pessoas'}` },
        ];
        break;
    }

    return { details, imageUrl, assetName };
  };

  const cardData = getBookingDetails();

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-blue-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-blue-700">
      <div className="grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-4 relative min-h-[150px] md:min-h-full">
          <Image
            src={cardData.imageUrl || "/images/default-reservation.jpg"}
            alt={cardData.assetName || "Imagem da reserva"}
            fill
            className="object-cover"
          />
        </div>
        <div className="md:col-span-8 flex flex-col">
          <div className="p-6 pb-4 flex-grow">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                <TypeIcon className="h-4 w-4" />
                <span>{typeInfo.label}</span>
              </div>
              <Badge className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border", statusInfo.color)}>
                <StatusIcon className="h-3 w-3 mr-1.5" />
                {statusInfo.label}
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cardData.assetName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">#{booking.confirmationCode}</p>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {cardData.details.map((detail, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <detail.icon className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <span>{detail.text}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                <span className="text-green-600 dark:text-green-400">R$ {booking.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
              <Link href={`/reservas/${booking._id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Link>
            </Button>
            {(booking.status === "confirmed" || booking.status === "completed") && booking.confirmationCode && (
              <VoucherDownloadButton
                bookingId={booking._id}
                bookingType={booking.type as any}
                variant="default"
                size="sm"
                showIcon={true}
                showLabel={true}
                className="w-full sm:w-auto"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function UserBookingsList() {
  const allBookings = useQuery(api.domains.bookings.queries.getBookingsWithRBAC, {
    paginationOpts: { numItems: 200, cursor: null },
  });

  const bookings = allBookings?.bookings || [];
  const tabs = ["activity", "event", "restaurant", "vehicle", "accommodation", "package"]; // Added package tab
  const bookingsByType = (type: string) => bookings.filter(b => b.type === type);

  if (!allBookings) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full max-w-md"></div>
          <div className="space-y-4">
            <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-dashed border-slate-300 dark:border-slate-700">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Nenhuma reserva encontrada
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Você ainda não fez nenhuma reserva. Que tal explorar nossos serviços?
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
        <div className="w-full overflow-x-auto pb-2">
            <TabsList className="mb-6">
                <TabsTrigger value="all">Todos ({bookings.length})</TabsTrigger>
                {tabs.map(tab => {
                    const typeInfo = getTypeConfig(tab);
                    const count = bookingsByType(tab).length;
                    return (
                        <TabsTrigger key={tab} value={tab} disabled={count === 0}>
                            {typeInfo.label} ({count})
                        </TabsTrigger>
                    )
                })}
            </TabsList>
        </div>

      <TabsContent value="all">
        <div className="space-y-6">
          {bookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      </TabsContent>

      {tabs.map(tab => (
        <TabsContent key={tab} value={tab}>
            <div className="space-y-6">
            {bookingsByType(tab).map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
            ))}
            </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}


