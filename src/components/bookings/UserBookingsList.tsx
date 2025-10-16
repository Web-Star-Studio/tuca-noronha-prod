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
import { cn } from "@/lib/utils";

type BookingStatus = "pending" | "confirmed" | "canceled" | "completed" | "draft" | "payment_pending" | "awaiting_payment" | "pending_approval" | "rejected" | "paid" | "awaiting_confirmation" | "in_progress" | "no_show" | "expired";

const statusConfig = {
  pending: { label: "Pendente", color: "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", icon: Hourglass },
  pending_approval: { label: "Aguardando Aprovação", color: "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", icon: Hourglass },
  confirmed: { label: "Confirmada", color: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle2 },
  awaiting_payment: { label: "Aguardando Pagamento", color: "border-orange-500/50 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400", icon: Hourglass },
  payment_pending: { label: "Aguardando Pagamento", color: "border-orange-500/50 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400", icon: Hourglass },
  paid: { label: "Pago", color: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "Não Aprovado", color: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  canceled: { label: "Cancelada", color: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  completed: { label: "Concluída", color: "border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: CheckCircle2 },
  draft: { label: "Rascunho", color: "border-slate-500/50 bg-slate-50 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400", icon: AlertTriangle },
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
    let details: { icon: React.ElementType; text: string | undefined }[] = [];
    const assetName = booking.assetName; // Use the assetName from the query

    // Format date if available
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Data não informada';
      try {
        return new Date(dateString).toLocaleDateString('pt-BR');
      } catch (error) {
        console.error("Error formatting date:", error);
        return dateString;
      }
    };

    switch (booking.type) {
      case 'activity':
        details = [
          { icon: Calendar, text: booking.date ? formatDate(booking.date) : 'Data não informada' },
          { icon: Clock, text: booking.time || 'Horário não informado' },
          { icon: Users, text: `${booking.participants || 'N/A'} participantes` },
        ];
        break;
      case 'event':
        details = [
          { icon: Calendar, text: booking.date ? formatDate(booking.date) : 'Data não informada' },
          { icon: Clock, text: booking.time || 'Horário não informado' },
          { icon: Ticket, text: `${booking.quantity || 'N/A'} ingressos` },
        ];
        break;
      case 'restaurant':
        details = [
          { icon: Calendar, text: booking.date ? formatDate(booking.date) : 'Data não informada' },
          { icon: Clock, text: booking.time || 'Horário não informado' },
          { icon: Users, text: `${booking.partySize || 'N/A'} pessoas` },
        ];
        break;
      case 'vehicle':
        details = [
          { icon: Calendar, text: booking.startDate ? `De: ${formatDate(booking.startDate)}` : 'Data de início não informada' },
          { icon: Calendar, text: booking.endDate ? `Até: ${formatDate(booking.endDate)}` : 'Data de fim não informada' },
          { icon: Users, text: `${booking.seats || 'N/A'} assentos` },
        ];
        break;
      case 'accommodation':
        details = [
          { icon: Calendar, text: booking.checkInDate ? `Check-in: ${formatDate(booking.checkInDate)}` : 'Check-in não informado' },
          { icon: Calendar, text: booking.checkOutDate ? `Check-out: ${formatDate(booking.checkOutDate)}` : 'Check-out não informado' },
          { icon: Users, text: `${booking.guests || 'N/A'} hóspedes` },
        ];
        break;
      case 'package':
        details = [
          { icon: Calendar, text: booking.startDate ? `Início: ${formatDate(booking.startDate)}` : 'Data de início não informada' },
          { icon: Calendar, text: booking.endDate ? `Fim: ${formatDate(booking.endDate)}` : 'Data de fim não informada' },
          { icon: Users, text: `${booking.guests || 'N/A'} pessoas` },
        ];
        break;
    }

    return { details, assetName };
  };

  const cardData = getBookingDetails();

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-blue-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-blue-700">
      <div className="p-6">
        {/* Header with type and status */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <TypeIcon className="h-4 w-4" />
            <span>{typeInfo.label}</span>
          </div>
          <Badge className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border", statusInfo.color)}>
            <StatusIcon className="h-3 w-3 mr-1.5" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Asset name and confirmation code */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{cardData.assetName}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">#{booking.confirmationCode}</p>
        </div>

        {/* Booking details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
          {cardData.details.map((detail, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <detail.icon className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span>{detail.text}</span>
            </div>
          ))}
        </div>

        {/* Price and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            R$ {booking.totalPrice?.toFixed(2) || '0.00'}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
              <Link href={`/reservas/${booking._id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Link>
            </Button>
            <VoucherDownloadButton
              bookingId={booking._id}
              bookingType={booking.type as any}
              variant="default"
              size="sm"
              showIcon={true}
              showLabel={true}
              className="w-full sm:w-auto"
            />
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

  // Debug log to see what data we're getting
  console.log('Bookings data:', bookings);
  if (bookings.length > 0) {
    console.log('First booking:', bookings[0]);
  }

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


