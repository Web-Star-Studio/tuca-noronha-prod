"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Users, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingDetailsProps {
  booking: any;
  bookingType: "activity" | "event" | "vehicle" | "restaurant";
  assetDetails?: any;
}

const STATUS_CONFIG = {
  pending_approval: {
    label: "Aguardando Aprovação",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertCircle,
    description: "Sua solicitação está sendo analisada pelo parceiro"
  },
  confirmed: {
    label: "Confirmada",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Reserva confirmada! Prossiga com o pagamento"
  },
  awaiting_payment: {
    label: "Aguardando Pagamento",
    color: "bg-blue-100 text-blue-800",
    icon: CreditCard,
    description: "Clique no botão abaixo para realizar o pagamento"
  },
  paid: {
    label: "Paga",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Pagamento confirmado com sucesso!"
  },
  rejected: {
    label: "Rejeitada",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description: "Sua solicitação foi rejeitada pelo parceiro"
  },
  canceled: {
    label: "Cancelada",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
    description: "Reserva cancelada"
  },
  completed: {
    label: "Concluída",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Reserva concluída"
  }
};

export function BookingDetails({ booking, bookingType, assetDetails }: BookingDetailsProps) {
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const createPaymentLink = useAction(api.domains.bookings.paymentActions.createPaymentLink);

  const status = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending_approval;
  const StatusIcon = status.icon;

  const canPay = booking.status === "confirmed" || booking.status === "awaiting_payment";
  const isFree = booking.totalPrice === 0 || booking.finalAmount === 0;

  const handlePayment = async () => {
    if (!canPay || isFree) return;

    setIsGeneratingPayment(true);
    try {
      const result = await createPaymentLink({
        bookingId: booking._id,
        bookingType,
      });

      if (result.success && result.paymentUrl) {
        toast.success("Redirecionando para pagamento...", {
          description: "Você será levado para o Checkout Seguro do Mercado Pago",
        });

        setTimeout(() => {
          window.location.href = result.paymentUrl;
        }, 1500);
      } else {
        throw new Error("Não foi possível gerar o link de pagamento");
      }
    } catch (error) {
      console.error("Erro ao gerar pagamento:", error);
      toast.error("Erro ao gerar link de pagamento", {
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
      });
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status da Reserva</CardTitle>
              <CardDescription>Código: {booking.confirmationCode}</CardDescription>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{status.description}</p>
          
          {booking.adminNotes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900">Observações do Parceiro:</p>
              <p className="text-sm text-blue-700 mt-1">{booking.adminNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Reserva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Name */}
          {assetDetails && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                {bookingType === "activity" ? "Atividade" : 
                 bookingType === "event" ? "Evento" :
                 bookingType === "vehicle" ? "Veículo" : "Restaurante"}
              </p>
              <p className="text-lg font-semibold">{assetDetails.title || assetDetails.name}</p>
            </div>
          )}

          {/* Date/Time */}
          {booking.date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Data</p>
                <p className="text-sm">{format(new Date(booking.date), "PPP", { locale: ptBR })}</p>
              </div>
            </div>
          )}

          {booking.time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Horário</p>
                <p className="text-sm">{booking.time}</p>
              </div>
            </div>
          )}

          {/* Participants/Guests */}
          {(booking.participants || booking.partySize || booking.quantity) && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {bookingType === "restaurant" ? "Pessoas" : 
                   bookingType === "event" ? "Ingressos" : "Participantes"}
                </p>
                <p className="text-sm">
                  {booking.participants || booking.partySize || booking.quantity}
                </p>
              </div>
            </div>
          )}

          {/* Customer Info */}
          {(booking.customerInfo || booking.name) && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-500 mb-2">Dados do Solicitante</p>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {booking.customerInfo?.name || booking.name}</p>
                <p><strong>Email:</strong> {booking.customerInfo?.email || booking.email}</p>
                <p><strong>Telefone:</strong> {booking.customerInfo?.phone || booking.phone}</p>
              </div>
            </div>
          )}

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-500 mb-1">Observações Especiais</p>
              <p className="text-sm text-gray-700">{booking.specialRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Card */}
      {!isFree && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Valor Total</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(booking.finalAmount || booking.totalPrice)}
              </span>
            </div>

            {canPay && !isFree && (
              <>
                <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  ℹ️ Você será redirecionado para o <strong>Checkout Seguro do Mercado Pago</strong> para realizar o pagamento.
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isGeneratingPayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isGeneratingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Gerando link de pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pagar Agora
                    </>
                  )}
                </Button>
              </>
            )}

            {booking.status === "paid" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Pagamento Confirmado!</p>
                  <p className="text-sm text-green-700">
                    Pago em {booking.paidAt && format(new Date(booking.paidAt), "PPp", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {booking.requestedAt && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                  <div className="h-full w-px bg-gray-200" />
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium">Solicitação Enviada</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.requestedAt), "PPp", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {booking.approvedAt && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                  <div className="h-full w-px bg-gray-200" />
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium">Reserva Confirmada</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.approvedAt), "PPp", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {booking.paidAt && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pagamento Realizado</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.paidAt), "PPp", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
