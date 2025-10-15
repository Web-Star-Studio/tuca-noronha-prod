"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentBrick } from "@/components/payments/PaymentBrick";
import { Loader2, Calendar, MapPin, Clock, AlertCircle, CheckCircle2, XCircle, Car, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function VehicleBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as Id<"vehicleBookings">;
  const booking = useQuery(api.domains.vehicles.getBookingById, { bookingId });
  const processPayment = useMutation(api.domains.vehicles.processVehiclePayment);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!booking?.paymentDeadline) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const deadline = booking.paymentDeadline!;
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeRemaining("Prazo expirado");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [booking?.paymentDeadline]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      pending_request: { label: "Aguardando Confirmação", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      awaiting_payment: { label: "Aguardando Pagamento", color: "bg-orange-100 text-orange-800", icon: DollarSign },
      paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
      rejected: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: XCircle },
      canceled: { label: "Cancelada", color: "bg-gray-100 text-gray-800", icon: XCircle },
      expired: { label: "Expirada", color: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    return configs[status] || configs.pending_request;
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      await processPayment({
        bookingId,
        mpPaymentId: paymentId,
        paymentMethod: "mercado_pago",
        paymentStatus: "approved",
      });
      toast.success("Pagamento realizado com sucesso!");
      router.refresh();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Erro ao confirmar pagamento");
    }
  };

  if (booking === undefined) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (booking === null) {
    return (
      <div className="container mx-auto py-8"><Card><CardContent className="py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Reserva não encontrada</h2>
        <Button onClick={() => router.push("/meu-painel")}>Voltar</Button>
      </CardContent></Card></div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const canPay = booking.status === "awaiting_payment" && booking.finalPrice && booking.paymentDeadline && Date.now() < booking.paymentDeadline;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/meu-painel")} className="mb-6">← Voltar</Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Reserva de Veículo</CardTitle>
              <p className="text-sm text-gray-500">Código: {booking.confirmationCode}</p>
            </div>
            <Badge className={statusConfig.color}><StatusIcon className="h-4 w-4 mr-1" />{statusConfig.label}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Detalhes do Veículo */}
      {booking.vehicle && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" />Veículo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold text-lg">{booking.vehicle.name}</p>
              <p className="text-sm text-gray-600">{booking.vehicle.brand} {booking.vehicle.model} - {booking.vehicle.year}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datas e Local */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Período</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Retirada:</span>
            <span className="font-medium">{formatDate(booking.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Devolução:</span>
            <span className="font-medium">{formatDate(booking.endDate)}</span>
          </div>
          {booking.pickupLocation && (
            <div className="flex items-start justify-between pt-3 border-t">
              <span className="text-gray-600 flex items-center gap-2"><MapPin className="h-4 w-4" />Local:</span>
              <span className="font-medium text-right">{booking.pickupLocation}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valores */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Valores</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Valor Estimado:</span>
            <span>{formatCurrency(booking.estimatedPrice)}</span>
          </div>
          {booking.finalPrice && (
            <div className="flex justify-between pt-3 border-t">
              <span className="font-semibold">Valor Final Confirmado:</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(booking.finalPrice)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta de Pagamento */}
      {canPay && (
        <>
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">Pagamento Necessário</h3>
                  <p className="text-sm text-orange-800 mb-2">
                    O administrador confirmou sua reserva com o valor de <strong>{formatCurrency(booking.finalPrice!)}</strong>
                  </p>
                  <div className="bg-white border border-orange-200 rounded p-3">
                    <p className="text-sm font-semibold text-orange-900">⏰ Tempo restante: {timeRemaining}</p>
                    <p className="text-xs text-orange-700 mt-1">Você tem 24 horas para realizar o pagamento.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Brick */}
          <Card>
            <CardHeader><CardTitle>Realizar Pagamento</CardTitle></CardHeader>
            <CardContent>
              <PaymentBrick
                bookingId={bookingId}
                assetType="vehicle"
                amount={booking.finalPrice!}
                description={`Reserva de Veículo - ${booking.vehicle?.name || 'Veículo'}`}
                payer={{
                  email: booking.customerInfo?.email || "",
                  firstName: booking.customerInfo?.name.split(" ")[0] || "",
                  lastName: booking.customerInfo?.name.split(" ").slice(1).join(" ") || "",
                }}
                onSuccess={handlePaymentSuccess}
                onError={(error) => toast.error(error)}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Notas do Admin */}
      {booking.adminNotes && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader><CardTitle className="text-blue-900">Mensagem do Administrador</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{booking.adminNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
