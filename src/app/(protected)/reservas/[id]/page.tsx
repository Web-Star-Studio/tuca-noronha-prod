"use client"

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle,
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  Home,
  User,
  Copy,
  Share2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { cardStyles, buttonStyles, badgeStyles } from "@/lib/ui-config";
import { cn } from "@/lib/utils";

export default function BookingDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  
  // Try to get booking from different types
  const activityBooking = useQuery(api.domains.bookings.queries.getActivityBookingById, {
    bookingId: params.id as any,
  });
  
  const eventBooking = useQuery(api.domains.bookings.queries.getEventBookingById, {
    bookingId: params.id as any,
  });
  
  const restaurantReservation = useQuery(api.domains.bookings.queries.getRestaurantReservationById, {
    reservationId: params.id as any,
  });
  
  const vehicleBooking = useQuery(api.domains.bookings.queries.getVehicleBookingById, {
    bookingId: params.id as any,
  });

  // Find which booking type we have
  const booking = activityBooking || eventBooking || restaurantReservation || vehicleBooking;
  const bookingType = activityBooking ? "activity" : 
                     eventBooking ? "event" : 
                     restaurantReservation ? "restaurant" : 
                     vehicleBooking ? "vehicle" : null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado para a área de transferência");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const shareBooking = async () => {
    if (navigator.share && booking) {
      try {
        await navigator.share({
          title: "Detalhes da Reserva",
          text: `Reserva ${booking.confirmationCode}`,
          url: window.location.href,
        });
      } catch {
        copyToClipboard(window.location.href);
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Aguardando Confirmação", icon: AlertCircle, color: "text-yellow-600" },
      confirmed: { variant: "default" as const, label: "Confirmada", icon: CheckCircle, color: "text-green-600" },
      canceled: { variant: "destructive" as const, label: "Cancelada", icon: AlertCircle, color: "text-red-600" },
      completed: { variant: "outline" as const, label: "Concluída", icon: CheckCircle, color: "text-blue-600" },
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

  if (!booking || !bookingType) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reserva não encontrada</h1>
            <p className="text-gray-600">
              A reserva que você está procurando não foi encontrada.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes da Reserva</h1>
            <p className="text-gray-600">
              Informações completas da sua reserva
            </p>
          </div>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      {/* Success/Pending Message */}
      <div className={cn(cardStyles.base, "text-center")}>
        <div className={cardStyles.content.default}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {booking.status === "confirmed" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Clock className="w-8 h-8 text-yellow-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {booking.status === "confirmed" ? "Reserva Confirmada!" : "Reserva Recebida!"}
          </h2>
          <p className="text-gray-600 mb-4">
            {booking.status === "confirmed" 
              ? "Sua reserva foi confirmada e está pronta para ser utilizada"
              : "Sua reserva foi recebida e está aguardando confirmação do parceiro"
            }
          </p>
          
          {/* Confirmation Code */}
          <div className="bg-gray-50 p-4 rounded-lg inline-block">
            <div className="text-sm text-gray-600 mb-1">Código de confirmação</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-gray-900 tracking-wider">
                {booking.confirmationCode}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(booking.confirmationCode)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookingType === "activity" && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Data e Hora</div>
                    <div className="text-gray-600">{booking.date} {booking.time && `às ${booking.time}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Participantes</div>
                    <div className="text-gray-600">{booking.participants} pessoas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">R$</span>
                  </div>
                  <div>
                    <div className="font-medium">Valor Total</div>
                    <div className="text-gray-600">R$ {booking.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </>
            )}

            {bookingType === "event" && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Data e Hora do Evento</div>
                    <div className="text-gray-600">Verificar detalhes do evento</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Ingressos</div>
                    <div className="text-gray-600">{booking.quantity} ingressos</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">R$</span>
                  </div>
                  <div>
                    <div className="font-medium">Valor Total</div>
                    <div className="text-gray-600">R$ {booking.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </>
            )}

            {bookingType === "restaurant" && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Data e Hora</div>
                    <div className="text-gray-600">{booking.date} às {booking.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Número de Pessoas</div>
                    <div className="text-gray-600">{booking.partySize} pessoas</div>
                  </div>
                </div>
              </>
            )}

            {bookingType === "vehicle" && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Período</div>
                    <div className="text-gray-600">
                      {format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })} até{" "}
                      {format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">R$</span>
                  </div>
                  <div>
                    <div className="font-medium">Valor Total</div>
                    <div className="text-gray-600">R$ {booking.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </>
            )}

            {(booking.specialRequests || booking.notes) && (
              <div className="pt-4 border-t">
                <div className="font-medium mb-2">Observações</div>
                <div className="text-gray-600 text-sm">
                  {booking.specialRequests || booking.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Nome</div>
                <div className="text-gray-600">
                  {booking.customerInfo?.name || booking.name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-gray-600">
                  {booking.customerInfo?.email || booking.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium">Telefone</div>
                <div className="text-gray-600">
                  {booking.customerInfo?.phone || booking.phone}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </Link>
        
        <Link href="/meu-painel">
          <Button variant="default" className="flex-1 sm:flex-none">
            <User className="w-4 h-4 mr-2" />
            Minhas Reservas
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          onClick={shareBooking}
          className="flex-1 sm:flex-none"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>

      {/* Important Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Informações Importantes
        </h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Guarde este código de confirmação para futuras consultas</span>
          </li>
          {booking.status === "pending" && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Você receberá uma notificação quando sua reserva for confirmada</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Para alterações ou cancelamentos, entre em contato através do suporte</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Chegue com 15 minutos de antecedência no local</span>
          </li>
        </ul>
      </div>
    </div>
  );
}